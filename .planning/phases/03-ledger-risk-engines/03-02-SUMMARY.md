---
phase: 03-ledger-risk-engines
plan: 02
subsystem: api
tags: [risk-engine, amm, pure-functions, tdd, integer-cents, circuit-breaker]

# Dependency graph
requires:
  - phase: 02-pricing-engine-oracle-first
    provides: pure integer-cent AMM building blocks (curve/fees) + RiskError/TradeError error-class shape to mirror
  - phase: 01-data-model-market-genesis
    provides: RiskEvent model shape ({ marketId, userId, type, detail }) the engine drafts against
provides:
  - "Pure evaluate(trade, snapshot, tierConfig) risk decision engine for RISK-01..06"
  - "RiskError class (statusCode + details) mirroring TradeError/PricingError"
  - "RiskEvent drafts ({ marketId, userId, type, detail }) for Phase 4 to persist"
  - "Six distinct typed rejections: max_trade_exceeded, max_position_exceeded, daily_volume_exceeded, dynamic_sell_cap, reserve_floor_breach, circuit_breaker_triggered"
affects: [04-trade-orchestration, phase-4-orchestrator, market-pause-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure decision function: all inputs (reserve, position, daily volume, market status, prices, tier caps) passed IN by caller — engine reads no DB"
    - "Engine returns a RiskEvent draft; caller (Phase 4) persists it — separation of decision from I/O"
    - "Integer-friendly bps math for circuit breaker (Math.round of abs-diff*10000/ref) — avoids float drift"

key-files:
  created:
    - VentureCast_Backend-main/services/amm/risk/checks.js
    - VentureCast_Backend-main/services/amm/risk/index.js
    - VentureCast_Backend-main/tests/unit/risk.test.js
  modified: []

key-decisions:
  - "Check order: circuit breaker / paused FIRST (market-level gate), then user caps, then dynamic sell cap + reserve floor"
  - "RISK-05 (dynamic sell cap) catches the offending sell before RISK-04 (reserve floor); RISK-04 kept as safety net covering buys + floor-raised-after-open edge case — they do not both fire on the same fixture"
  - "Market-level rejections (floor, sell cap, breaker, paused) emit userId:null in the RiskEvent draft; user-level caps emit trade.userId"
  - "statusCode 422 for cap violations, 409 for invariant/market-level breaches, 400 for malformed input"
  - "circuitBreakerPct interpreted in basis points (bps); detail.tripBreaker:true signals Phase 4 to pause the market"

patterns-established:
  - "Pure risk engine: zero Mongoose/DB imports, fully unit-testable with synthetic fixtures"
  - "Builder-based test fixtures (baseTrade/baseSnapshot/baseTier + evalWith overrides) for concise rule-by-rule cases"

requirements-completed: [RISK-01, RISK-02, RISK-03, RISK-04, RISK-05, RISK-06]

# Metrics
duration: 5min
completed: 2026-06-06
---

# Phase 3 Plan 2: Pure 3-Tier Risk Engine Summary

**Pure `evaluate(trade, snapshot, tierConfig)` risk engine enforcing RISK-01..06 (per-trade/position/daily caps, reserve-floor invariant, dynamic sell cap, paused-market + bps price-move circuit breaker) with distinct typed RiskErrors and RiskEvent drafts — zero DB, fully unit-tested.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-06T17:45:53Z
- **Completed:** 2026-06-06T17:49:34Z
- **Tasks:** 3 (TDD: RED + two GREEN)
- **Files modified:** 3 (all created)

## Accomplishments
- Pure risk decision engine — no Mongoose, no DB, no I/O; every input passed in by the caller
- All six risk rules implemented, each returning a distinct typed RiskError + a RiskEvent draft with a distinct `type`
- Circuit breaker uses integer-friendly bps math (`Math.round(abs(new-ref)*10000/ref)`) with a div-by-zero guard, and signals a breaker trip via `detail.tripBreaker`
- Market-level rejections (floor, sell cap, breaker, paused) correctly emit `userId: null`; user-level caps emit the trade's userId
- 11 risk decision tests green; full backend suite green (143/143) — no regressions

## Task Commits

Each task was committed atomically (TDD):

1. **Task 0: Write failing risk tests (RED)** - `0d170a9` (test)
2. **Task 1: Implement caps — max trade / position / daily (RISK-01,02,03)** - `ca096cb` (feat)
3. **Task 2: Reserve floor + dynamic sell cap + circuit breaker (RISK-04,05,06) + index.js** - `6750487` (feat)

## Files Created/Modified
- `VentureCast_Backend-main/services/amm/risk/checks.js` - Pure `evaluate()` + `RiskError`; six checks in order (breaker/paused → caps → sell cap → floor)
- `VentureCast_Backend-main/services/amm/risk/index.js` - Barrel re-exporting `{ evaluate, RiskError }`
- `VentureCast_Backend-main/tests/unit/risk.test.js` - 11 pure decision tests; block names carry exact filter strings (max trade, max position, daily, floor, sell cap, breaker, paused)

## Decisions Made
- **Check order:** circuit breaker / paused market runs first as a market-level gate, then user-level caps, then dynamic sell cap + reserve floor invariant.
- **RISK-04 vs RISK-05:** the dynamic sell cap (RISK-05) intercepts the offending sell first; the reserve-floor invariant (RISK-04) is retained as the catch-all that also covers buys and a floor raised after a position opened. They are the same invariant from two angles and do not both fire on a single fixture — each requirement keeps its own typed event for auditability.
- **userId nullability:** market-level events (floor, sell cap, breaker, paused) → `userId: null`; user caps → `trade.userId`, matching the RiskEvent model contract.
- **statusCodes:** 422 cap violations, 409 invariant/market-level breaches, 400 malformed input.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created index.js during Task 1 instead of Task 2**
- **Found during:** Task 1 (cap-rule GREEN verification)
- **Issue:** The test file imports from `../../services/amm/risk`, which resolves via the package `index.js`. The plan scheduled `index.js` for Task 2, but the Task 1 verify filter (`-t "max trade|max position|daily"`) cannot load the test module without it.
- **Fix:** Authored the barrel `index.js` (re-exporting `{ evaluate, RiskError }`) during Task 1 so the cap tests could run; Task 2 reused it unchanged.
- **Files modified:** `VentureCast_Backend-main/services/amm/risk/index.js`
- **Verification:** Task 1 filter ran (4 passed, 7 skipped); full suite green afterward.
- **Committed in:** `ca096cb` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Trivial reordering of a file's creation within the same plan — no behavior change, no scope creep. Final artifact set matches the plan exactly.

## Issues Encountered
None.

## User Setup Required
None - the risk engine is pure code with no external service configuration.

## Next Phase Readiness
- Risk engine ready for the Phase 4 trade orchestrator: call `evaluate()` with values queried from DB, persist any returned `riskEventDraft`, and on a `circuit_breaker_triggered` rejection with `detail.tripBreaker === true`, pause the market.
- `tierConfig.circuitBreakerPct`, `reserveFloorCents`, and per-tier caps still need real per-tier values wired in (TIER_CONFIG currently has `reserveFloorCents: null` placeholders) — that wiring belongs to the orchestrator/config step.

## Self-Check: PASSED

- All 3 created files verified on disk.
- All 3 task commits verified in git history (0d170a9, ca096cb, 6750487).
- Purity verified: no `require('mongoose')` in `services/amm/risk/*.js`.
- Full backend suite green: 143/143.

---
*Phase: 03-ledger-risk-engines*
*Completed: 2026-06-06*
