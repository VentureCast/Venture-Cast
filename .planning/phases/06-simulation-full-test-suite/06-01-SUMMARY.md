---
phase: 06-simulation-full-test-suite
plan: 01
subsystem: testing
tags: [simulation, invariants, prng, amm, bonding-curve, ledger, double-entry]

# Dependency graph
requires:
  - phase: 05-api-surface
    provides: "complete AMM engine (curve/fees/inversion/ledger/risk/execution) with real pure functions"
  - phase: 04-atomic-execution
    provides: "executeOrder orchestrator + optimistic version locking"
  - phase: 03-ledger-risk-engines
    provides: "buildBuyPostings/buildSellPostings/assertBalanced + risk.evaluate"
provides:
  - "Deterministic seeded PRNG (mulberry32) for reproducible simulation failures"
  - "TEST-02: invariant property tests — 5 solvency invariants after every applied op + tampered-posting rejection"
  - "TEST-03: 10,000-trades-per-tier sim for tiers 1/2/3 — real engine, penny-balanced ledger, min reserve >= floor"
  - "TEST-04: concurrency no-lost-update consolidation assertion in execution.test.js"
affects: [all future phases — capstone proof the AMM engine never drains reserve or unbalances ledger]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seeded PRNG (mulberry32): simulation failures always reproducible from logged seed"
    - "In-memory world projection mirrors ledger postings exactly (apply posting deltas to account Map)"
    - "Five-invariant assertInvariants() called after every applied trade — not just at end-of-run"
    - "TEST-04 by reference: one consolidating assertion added to existing concurrency it — no duplication"

key-files:
  created:
    - VentureCast_Backend-main/tests/helpers/prng.js
    - VentureCast_Backend-main/tests/unit/simulation.test.js
  modified:
    - VentureCast_Backend-main/tests/unit/execution.test.js

key-decisions:
  - "applyTrade mirrors priceTrade.js composition exactly: grossCents via buyCostCents/sellPayoutCents, then applyBuyFees/applySellFees, then buildBuyPostings/buildSellPostings — no reimplementation"
  - "Genesis seeds market_reserve + debits platform_funding so Σ cents == 0 from iteration 0; users funded the same way"
  - "assertInvariants checks 5 conditions: Σ cents==0, Σ shares==0, reserve>=floor, reserve>=0, market_reserve account==reserveCents"
  - "TEST-04 added as one consolidating assertion block inside the existing N-concurrent-buys it (not a new describe)"
  - "Sim results: all 3 tiers pass with min reserve exactly == floor (10000 cents) — the risk engine's RISK-05 dynamic sell cap is the guard"

patterns-established:
  - "unitOf(key): classify account key as 'cents' or 'shares' by prefix — prevents per-unit sum mixing"
  - "fundUser(world, userId, cents): balanced cash injection (debit platform_funding) keeps Σ cents == 0 from genesis"

requirements-completed: [TEST-02, TEST-03, TEST-04]

# Metrics
duration: 4min
completed: 2026-06-07
---

# Phase 6 Plan 1: Simulation Full Test Suite Summary

**Seeded mulberry32 PRNG + 10k-per-tier in-memory simulation driving the real AMM pure functions with 5 solvency invariants asserted after every applied trade — all three tiers pass with min reserve == floor, penny-balanced ledger, and the full 205-test suite green.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-07T06:18:32Z
- **Completed:** 2026-06-07T06:22:46Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- Deterministic seeded PRNG helper (mulberry32) with randInt/pick — no external dep, no Math.random
- TEST-02: 500-op seeded randomised run (seed=12345, tier=1) asserts all 5 invariants after every applied trade; tampered posting set throws LedgerError(500) via assertBalanced
- TEST-03: 10,000 trades per tier for tiers 1/2/3 — real engine functions called throughout, no reimplementation; min reserve == reserveFloorCents (10,000 cents) in all three tiers, penny-balanced ledger (Σ cents==0, Σ shares==0) verified at end; fill/reject/minReserve reported per tier
- TEST-04: one consolidating assertion block added to the existing "N concurrent buys" test (Σ shares==0, user_pos==supply, Trade count===N) — no test duplication
- Full suite: 205 tests across 13 test suites, all passing

## Simulation Results

| Tier | Seed | Fills | Rejects | Min Reserve | Final Reserve | Supply |
|------|------|-------|---------|-------------|---------------|--------|
| 1    | 1001 | 1454  | 8546    | 10000       | 323080        | 1497   |
| 2    | 1002 | 7505  | 2495    | 10000       | 477614        | 1284   |
| 3    | 1003 | 9896  | 104     | 10000       | 464220        | 870    |

The min reserve of 10,000 cents (== floor) in all three tiers is correct — RISK-05 (dynamic sell cap) prevents sells that would drain below the floor, so the engine approaches but never crosses it. No invariant violation was found.

## Task Commits

1. **Task 1: Seeded PRNG helper (mulberry32)** - `fa764d1` (chore)
2. **Task 2: Invariant property tests + tampered-posting rejection (TEST-02)** - `50cadb4` (test)
3. **Task 3: 10k-per-tier simulation + TEST-04 concurrency reference** - `f43a026` (test)

## Files Created/Modified
- `VentureCast_Backend-main/tests/helpers/prng.js` - mulberry32 seeded PRNG (62 lines, no deps)
- `VentureCast_Backend-main/tests/unit/simulation.test.js` - TEST-02 invariant property tests + TEST-03 10k-per-tier simulation (492 lines)
- `VentureCast_Backend-main/tests/unit/execution.test.js` - TEST-04 consolidating assertion added to existing concurrency it

## Decisions Made
- applyTrade mirrors priceTrade.js composition exactly — grossCents from buyCostCents/sellPayoutCents, fees from applyBuyFees/applySellFees, postings from buildBuyPostings/buildSellPostings, no reimplementation of math
- Genesis seeds market_reserve + debits platform_funding so Σ cents == 0 from iteration 0; user cash injections follow the same pattern via fundUser()
- TEST-04 added as a single consolidating assertion block inside the existing "N concurrent buys" it — one comment tag, zero test duplication

## Deviations from Plan

None - plan executed exactly as written. No engine source modifications were made.

## Issues Encountered

None. The simulation confirmed the engine holds all invariants. Min reserve equalling the floor (never below) in all three tiers is the intended correct behavior — RISK-05 (dynamic sell cap) is the guard that prevents floor breaches.

## Self-Check: PASSED
- FOUND: VentureCast_Backend-main/tests/helpers/prng.js
- FOUND: VentureCast_Backend-main/tests/unit/simulation.test.js
- FOUND commit: fa764d1
- FOUND commit: 50cadb4
- FOUND commit: f43a026
- Scope OK: only test files modified (no engine/API source changes)
- Full suite: 205 tests, 13 suites, all PASS

## Next Phase Readiness
- Phase 6 plan 01 complete — TEST-02, TEST-03, TEST-04 requirements satisfied
- The 10k-per-tier simulation is the capstone proof that the AMM engine never drains the reserve or unbalances the ledger across 30,000 randomized trades
- No blockers for future phases

---
*Phase: 06-simulation-full-test-suite*
*Completed: 2026-06-07*
