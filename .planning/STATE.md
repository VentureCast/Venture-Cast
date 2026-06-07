---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 05-01-PLAN.md — AMM API foundation (API-01)
last_updated: "2026-06-07T05:40:18.757Z"
last_activity: "2026-06-07 — Plan 04-01 complete: atomic executeOrder orchestrator (EXEC-01..04)"
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 9
  completed_plans: 7
  percent: 67
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-03)

**Core value:** Every trade prices on the bonding curve and settles atomically with a penny-balanced double-entry ledger and a reserve that never goes negative — provable by the $205 oracle and a 10k-trade-per-tier simulation.
**Current focus:** Phase 4 — Atomic Execution Orchestrator

## Current Position

Phase: 4 of 6 (Atomic Execution Orchestrator) — COMPLETE
Plan: Moving to Phase 5 (API Surface)
Status: Phase 4 complete — atomic executeOrder() keystone (EXEC-01..04) done; ready for Phase 5
Last activity: 2026-06-07 — Plan 04-01 complete: atomic executeOrder orchestrator (EXEC-01..04)

Progress: [███████░░░] 67%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 12 min
- Total execution time: 0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-model-market-genesis | 2 | 23 min | 12 min |

**Recent Trend:**
- Last 5 plans: 5 min
- Trend: baseline

*Updated after each plan completion*
| Phase 02-pricing-engine-oracle-first P02-01 | 6 | 2 tasks | 5 files |
| Phase 03 P01 | 4 min | 3 tasks | 4 files |
| Phase 03-ledger-risk-engines P02 | 5 | 3 tasks | 3 files |
| Phase 04 P01 | 7 | 3 tasks | 6 files |
| Phase 05-api-surface P05-01 | 5 | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [All phases]: In-process Node engine (one Mongoose txn spans pricing + ledger + balances → real atomicity).
- [All phases]: Plain JS + CommonJS + JSDoc money typedefs (no TS toolchain) — match existing backend.
- [Phase 2]: Integer cents everywhere; `k` as rational `k_num/k_den`; spread→reserve, fee→platform_fees; genesis s0=0 @ P0.
- [Phase 1]: Internal double-entry ledger authoritative; platform_funding seeds reserve (no Stripe dependency this milestone).
- [Phase 4]: Build alongside existing trade path, flag-gated — no rip-out of `executeBuy/executeSell`.
- [01-01]: platform_funding LedgerAccount will run negative — accepted as bookkeeping artifact; documented in model comments.
- [01-01]: MarketState.updatedAt informational only — Phase 4 updateOne bypasses pre('save'); documented in schema comment.
- [01-01]: PriceCandle is schema-only (no candle-building logic) — candle logic deferred to market data service phase.
- [01-02]: Number.isInteger guard added to openMarket() — float reserveFloorCents would break sum-to-zero invariant; guard throws GenesisError(400) before any writes.
- [01-02]: GenesisError thrown before session.startTransaction() for validation errors — no abort overhead for bad params.
- [01-02]: $setOnInsert: { unit: 'cents' } on LedgerAccount upserts — unit set on first insert, not overwritten on subsequent $inc updates.
- [Phase 02-01]: ceil() for fee/spread rounding in fees.js — favors reserve/platform; floor() would favor user by sub-cent
- [Phase 02-01]: sellPayoutCents delegates to buyCostCents — exact symmetry guaranteed by shared implementation
- [Phase 02-01]: cashToUnits two-pass integer search: upward then downward guard; float is starting point only
- [Phase 03]: [03-01]: assertBalanced groups deltas by unit and is the single gate for LEDG-01/03 — build*Postings also call it internally (defense in depth)
- [Phase 03]: [03-01]: postEntries takes the Mongoose session as a parameter and owns no transaction (no startSession/commit/abort) — Phase 4 owns the lifecycle
- [Phase 03-02]: Risk check order: circuit breaker/paused first (market-level gate), then user caps, then dynamic sell cap + reserve floor
- [Phase 03-02]: RISK-05 (dynamic sell cap) catches the offending sell before RISK-04 (reserve floor); RISK-04 kept as safety net for buys + floor-raised-after-open — they never both fire on one fixture
- [Phase 03-02]: Market-level rejections (floor, sell cap, breaker, paused) emit userId:null in RiskEvent draft; user caps emit trade.userId
- [Phase 04]: [04-01]: ExecutionError lives in execution/errors.js to break a priceTrade<->orchestrator require cycle
- [Phase 04]: [04-01]: Risk-rejection RiskEvent persisted AFTER the txn aborts (durable rejection though the trade rolled back); VersionConflictError is the only retryable signal
- [Phase 04]: [04-01]: Optimistic version write via MarketState.updateOne({_id,version:V},$inc:{version:1}); matchedCount===0 retries the whole re-read+re-price loop (max 3, jittered)
- [Phase 05-api-surface]: ammRoutes mounted at '/' with apiLimiter; per-route tradeLimiter will guard POSTs in 05-02
- [Phase 05-api-surface]: validate(marketIdParam,'params') runs before optionalAuth — invalid :id 400s with zero DB hits
- [Phase 05-api-surface]: listMarkets uses single MarketState $in batch fetch; O(1) map lookup per market — N+1 eliminated
- [Phase 05-api-surface]: generateAdminToken signs same JWT payload as generateAuthToken; admin authority from User.isAdmin DB field

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- Test infra gotchas (from project memory): use `MongoMemoryReplSet` not `MongoMemoryServer`; call `await Model.init()` on all txn-involved models before tests; keep inserts in-session via `new Doc({...}).save({ session })` not `Model.create()`.

## Session Continuity

Last session: 2026-06-07T05:40:18.755Z
Stopped at: Completed 05-01-PLAN.md — AMM API foundation (API-01)
Resume file: None
