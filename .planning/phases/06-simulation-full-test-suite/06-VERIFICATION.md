---
phase: 6
slug: simulation-full-test-suite
status: passed
score: 4/4 requirements
verified_by: 30k-trade simulation (real engine) + 205-test full suite
date: 2026-06-07
---

# Phase 6 — Verification

**Status:** passed · TEST-02..05 covered · full suite **205/205** (13 suites)

## The capstone result — 10k-trades-per-tier simulation (TEST-03)

The simulation drives the **real** engine functions (verified by import: `curve.buyCostCents`/
`sellPayoutCents`, `inversion.cashToUnits`, `fees.applyBuy/SellFees`, `ledger.buildBuy/SellPostings`
+ `assertBalanced`, `risk.evaluate`, `config.riskConfigForTier`) — not a reimplementation —
against an in-memory world, seeded for reproducibility.

| Tier | Seed | Fills | Rejects | Min reserve |
|------|------|-------|---------|-------------|
| 1 | 1001 | 1,454 | 8,546 | 10,000c (== floor) |
| 2 | 1002 | 7,505 | 2,495 | 10,000c (== floor) |
| 3 | 1003 | 9,896 | 104 | 10,000c (== floor) |

**30,000 trades — reserve NEVER fell below its floor and was never negative; the ledger
stayed penny-balanced (Σ cents == 0, Σ shares == 0) after every applied trade.** RISK-05
(dynamic sell cap) is the guard that holds the floor — empirically confirmed at scale.
Sim runtime < 0.4s (pure functions, no per-trade DB transaction).

## Requirement coverage

- **TEST-02** invariant property tests + tampered-posting rejection (`assertBalanced` throws). ✓
- **TEST-03** 10k × 3-tier simulation, no negative reserve, penny-balanced. ✓
- **TEST-04** concurrency — existing `execution.test.js` (N concurrent buys → version+N, no lost update), consolidated with a TEST-04 assertion. ✓
- **TEST-05** idempotency replay + quote expiry + slippage rejection — `execution.test.js` + `amm.test.js` + the new end-to-end `flow.test.js` (quote→order→portfolio→sell + HTTP replay + 409s). ✓

## End-to-end flow (the frontend contract)

`flow.test.js`: POST /quotes → POST /orders (buy) → GET /portfolio (position present) →
POST /orders (sell) → GET /portfolio (reduced) — green with the real HTTP stack + JWT;
same-key replay returns the identical trade (one Trade); buy maxCost / sell minReceived /
expired quote each → 409. This is the contract the frontend will consume.

## Known infra note (not a code bug)

`tests/integration/trade.test.js` (the LEGACY trade path) intermittently times out when the
full suite runs under heavy parallel load (MongoMemoryReplSet startup > 15s); it passes 8/8 in
isolation (~110ms). Follow-up: raise that suite's jest timeout or pre-warm the replset. Does not
affect the AMM.

## Notes

Scope held to test files only — no engine/API source was modified in Phase 6. The simulation
validating the real engine at 30k trades with zero invariant breaches is the milestone's
proof-of-correctness. No gaps.

## Codex follow-up audit (2026-06-07, post-build)

Codex audited the simulation TEST for validity (could it trivially pass?). Unable to run Jest
in its read-only sandbox, it **independently re-implemented the 30k-trade loop using the real
production modules + the actual prng.js** and ran it: identical fill/reject counts (1454/8546,
7505/2495, 9896/104), a meaningful buy+sell mix (not all-rejects), and — critically — it
confirmed the test tracks `reserveCents` INDEPENDENTLY from the `market_reserve` ledger account
and cross-checks they agree (a non-vacuous check: an engine sign error would fail it). Invariants
held throughout. Verdict: the simulation genuinely validates the engine. No changes needed.
