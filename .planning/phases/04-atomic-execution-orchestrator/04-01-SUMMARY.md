---
phase: 04-atomic-execution-orchestrator
plan: 01
subsystem: api
tags: [amm, mongoose-transactions, optimistic-locking, idempotency, double-entry-ledger, risk-engine, integer-cents]

# Dependency graph
requires:
  - phase: 01-data-model-market-genesis
    provides: MarketState/Market/Order/Trade/RiskEvent models + genesisService withTransaction pattern
  - phase: 02-pricing-engine-oracle-first
    provides: curve (buyCostCents/sellPayoutCents/priceCents), inversion (cashToUnits), fees (applyBuy/SellFees)
  - phase: 03-ledger-risk-engines
    provides: buildBuy/SellPostings + postEntries (in-session ledger writes); pure risk.evaluate
provides:
  - executeOrder() — the atomic money path composing pricing+risk+ledger behind ONE Mongoose transaction
  - priceTrade() — pure pricing composer returning a flat integer-cent trade quote
  - ExecutionError (mirrors TradeError) + per-tier risk caps + riskConfigForTier() in config.js
  - optimistic version locking + bounded jittered retry, idempotency (key + E11000 race), quote expiry, slippage enforcement
affects: [05-http-api-controllers, 06-market-data-candles, simulation-conservation-harness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single session.withTransaction owns the whole money path; pure engines (pricing/risk/ledger) are composed inside it"
    - "Optimistic concurrency via MarketState.updateOne({_id,version:V},$inc:{version:1}) + matchedCount===0 retry signal"
    - "Idempotency = unique Order.idempotencyKey index + pre-check + E11000 duplicate-key catch returning the original Trade"
    - "Durable risk rejections: stash riskEventDraft, abort txn, persist RiskEvent OUTSIDE the aborted txn before rethrow"

key-files:
  created:
    - VentureCast_Backend-main/services/amm/execution/orchestrator.js
    - VentureCast_Backend-main/services/amm/execution/priceTrade.js
    - VentureCast_Backend-main/services/amm/execution/errors.js
    - VentureCast_Backend-main/services/amm/execution/index.js
    - VentureCast_Backend-main/tests/unit/execution.test.js
  modified:
    - VentureCast_Backend-main/services/amm/config.js

key-decisions:
  - "ExecutionError lives in its own errors.js (not orchestrator.js) to avoid a priceTrade<->orchestrator require cycle"
  - "RiskEvent for a rejected trade is persisted on the default connection AFTER the txn aborts, so the rejection is durable even though the trade rolled back"
  - "VersionConflictError is an internal, non-exported retry signal; risk/slippage/expiry errors are non-retryable and rethrown immediately"
  - "PriceCandle upsert deferred to Phase 6 market-data — not needed for EXEC-01..04"

patterns-established:
  - "Pattern: re-read MarketState fresh in-session each attempt, re-price, then optimistic-write — retry re-reads and re-prices the whole loop"
  - "Pattern: Order created before Trade (Trade.orderId required); the unique idempotencyKey serializes concurrent same-key inserts"

requirements-completed: [EXEC-01, EXEC-02, EXEC-03, EXEC-04]

# Metrics
duration: 7min
completed: 2026-06-07
---

# Phase 4 Plan 01: Atomic Execution Orchestrator Summary

**Atomic executeOrder() composing the bonding-curve pricing, double-entry ledger, and 3-tier risk engines behind ONE Mongoose transaction with optimistic version locking, bounded jittered retry, idempotency replay, quote expiry, and slippage enforcement.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-07T04:52:54Z
- **Completed:** 2026-06-07T04:59:41Z
- **Tasks:** 3 (Task 0 config+RED, Task 1 priceTrade, Task 2 orchestrator)
- **Files modified:** 6

## Accomplishments
- `executeOrder()` settles every buy/sell atomically: MarketState update + 5 LedgerEntries + LedgerAccount projections + Trade + Order commit together or not at all (EXEC-01) — proven by an injected late-write failure leaving zero partial writes.
- Optimistic version locking with `MarketState.updateOne({_id, version:V}, {$inc:{version:1}})`; `matchedCount===0` raises a retryable conflict that re-reads and re-prices the whole loop (max 3 attempts, jittered backoff) — N concurrent buys all land with `version += N` and no lost update (EXEC-02).
- Idempotency replay via the unique `Order.idempotencyKey` index: a key pre-check returns the original Trade, and a concurrent same-key insert's E11000 is caught to return the original — serial and race both produce exactly one Trade (EXEC-03).
- Quote expiry rejected 409 before the txn loop; slippage (buy `total > maxCost` / sell `net < minReceived`) enforced against the freshly RE-PRICED trade inside the txn (EXEC-04).
- Conservation holds end-to-end: Σ ledger cents == 0, Σ shares == 0, `market_reserve` projection == `MarketState.reserveCents`, Σ `user_pos` == supply, reserve ≥ floor; a floor-breaching sell is risk-rejected with a durably-recorded RiskEvent and zero writes.

## Task Commits

1. **Task 0: failing execution.test.js + TIER_CONFIG risk caps** - `943c06e` (test)
2. **Task 1: priceTrade pricing composer + ExecutionError** - `2e1ab1c` (feat)
3. **Task 2: atomic executeOrder orchestrator (EXEC-01..04)** - `264631e` (feat)

_Task 1 is TDD-driven by the execution suite written in Task 0 (RED), then GREEN at Task 2._

## Files Created/Modified
- `services/amm/execution/orchestrator.js` - `executeOrder()` + `ExecutionError`: one `withTransaction` composing pricing+risk+ledger with optimistic version + bounded retry + idempotency + expiry + slippage.
- `services/amm/execution/priceTrade.js` - pure pricing composer; reserve math mirrors the ledger postings (buy `+= gross+spread`, sell `-= gross-spread`); sell integral uses post-sell supply.
- `services/amm/execution/errors.js` - shared `ExecutionError` (cycle-free home).
- `services/amm/execution/index.js` - public barrel { executeOrder, ExecutionError, priceTrade }.
- `services/amm/config.js` - per-tier risk caps (maxTradeCents/maxPositionQty/maxDailyCents/circuitBreakerPct) + `riskConfigForTier()`.
- `tests/unit/execution.test.js` - MongoMemoryReplSet suite: idempotency, atomicity, version/concurrency, expiry/slippage, conservation.

## Decisions Made
- `ExecutionError` placed in `errors.js` rather than `orchestrator.js` to break the `priceTrade <-> orchestrator` require cycle (priceTrade is required by orchestrator).
- Risk rejections persist their `RiskEvent` on the default connection AFTER the txn aborts (the trade rolls back; the rejection must remain durable).
- `VersionConflictError` is internal/non-exported and the ONLY retryable signal; risk/slippage/expiry/pricing errors are rethrown immediately (non-retryable).
- PriceCandle upsert deferred to Phase 6 (market-data) — not part of EXEC-01..04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reserve-floor conservation test seeding tripped the circuit breaker**
- **Found during:** Task 2 (driving the conservation suite to GREEN)
- **Issue:** The test seeded the position with a single 800-share buy, whose >10% price move tripped the tier-1 circuit breaker (a RiskError) during setup rather than exercising the reserve-floor/dynamic-sell-cap path on the sell.
- **Fix:** Rewrote the test to build the position with six small (10-share) buys (each within the breaker), then RAISE `reserveFloorCents` out-of-band to just below current reserve so a modest sell breaches the floor — exercising RISK-04/05 deterministically. This is a test-fixture correction, not an orchestrator change.
- **Files modified:** `tests/unit/execution.test.js`
- **Verification:** Suite goes 11/11 green; the rejected sell writes nothing and a RiskEvent is recorded.
- **Committed in:** `264631e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — test fixture)
**Impact on plan:** Fixture-only correction to make the conservation/floor assertion deterministic. No production-code scope change; the orchestrator behaved correctly throughout.

## Issues Encountered
None beyond the deviation above. The orchestrator passed all behavioral assertions on first GREEN run; only the floor-breach test fixture needed adjustment.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `executeOrder()` is the stable, atomic entry point Phase 5 (HTTP API/controllers) wires to `/trade` routes — no further orchestration logic needed there.
- Conservation invariants are proven in-suite, ready for the larger 10k-trade-per-tier simulation harness.
- Legacy `tradeService.js` path untouched (flag-gated coexistence preserved); full backend suite green (154 tests).

## Self-Check: PASSED

All 7 created/modified files exist on disk; all 3 task commits (943c06e, 2e1ab1c, 264631e) present in git history. Execution suite 11/11 green; full backend suite 154/154 green.

---
*Phase: 04-atomic-execution-orchestrator*
*Completed: 2026-06-07*
