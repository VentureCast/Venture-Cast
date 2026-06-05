# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-03)

**Core value:** Every trade prices on the bonding curve and settles atomically with a penny-balanced double-entry ledger and a reserve that never goes negative — provable by the $205 oracle and a 10k-trade-per-tier simulation.
**Current focus:** Phase 1 — Data Model & Market Genesis

## Current Position

Phase: 1 of 6 (Data Model & Market Genesis)
Plan: 1 of TBD in current phase
Status: In progress — Plan 01 complete, Plan 02 (genesis service + tests) next
Last activity: 2026-06-05 — Plan 01-01 complete: 9 AMM Mongoose models created

Progress: [█░░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 5 min
- Total execution time: 0.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-model-market-genesis | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 5 min
- Trend: baseline

*Updated after each plan completion*

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- Test infra gotchas (from project memory): use `MongoMemoryReplSet` not `MongoMemoryServer`; call `await Model.init()` on all txn-involved models before tests; keep inserts in-session via `new Doc({...}).save({ session })` not `Model.create()`.

## Session Continuity

Last session: 2026-06-05
Stopped at: Completed 01-01-PLAN.md — 9 AMM Mongoose models created; ready for Plan 02 (genesis service + tests).
Resume file: None
