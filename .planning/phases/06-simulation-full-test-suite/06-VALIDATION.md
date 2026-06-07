---
phase: 6
slug: simulation-full-test-suite
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-07
---

# Phase 6 — Validation Strategy

> The capstone: a 10k-trades-per-tier simulation + invariant property tests that prove
> the whole engine at scale, plus an end-to-end HTTP flow. The simulation drives the REAL
> pure engine functions (curve/fees/ledger/risk) in-memory for speed (no per-trade replset
> transaction); the end-to-end walk uses the real HTTP stack.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x (sim: pure/in-memory; flow: supertest + MongoMemoryReplSet) |
| **Sim run** | `cd VentureCast_Backend-main && npx jest tests/unit/simulation.test.js --runInBand --forceExit` |
| **Flow run** | `cd VentureCast_Backend-main && npx jest tests/integration/flow.test.js --runInBand --forceExit` |
| **Full suite** | `cd VentureCast_Backend-main && npm test` |
| **Runtime** | sim < 5s (30k pure iterations); flow ~15–25s (replset) |

---

## Per-Requirement Verification Map

| Req | Behavior | Test |
|-----|----------|------|
| TEST-02 | invariants after EVERY op: ledger cents Σ==0 AND shares Σ==0, reserve ≥ floor, reserve ≥ 0 | `simulation.test.js -t "invariant"` |
| TEST-03 | 10,000 trades × 3 tiers → no negative reserve, penny-balanced ledger | `simulation.test.js -t "10000\|simulation"` |
| TEST-04 | concurrency: simultaneous orders → one win per version, no lost update | reuse `execution.test.js -t "concurren"` + a reference assertion |
| TEST-05 | idempotency replay + quote expiry + slippage rejection | reuse `execution.test.js` + `amm.test.js`; flow walk asserts replay |

---

## The 10k simulation (TEST-03) — design constraints

- Drives the REAL pure functions: `curve.buyCostCents`/`sellPayoutCents`, `fees.applyBuy/SellFees`,
  `ledger.buildBuy/SellPostings` + `assertBalanced`, `risk.evaluate`. NOT a reimplementation.
- Maintains world state in memory: `supply`, `reserveCents`, per-account ledger balances
  (`market_reserve`, `platform_fees`, `platform_funding`, per-user `user_cash`/`user_pos`),
  per-user position + daily volume.
- Seeded PRNG (deterministic) so any failure is reproducible — record the seed.
- Each iteration: random user, random side, random size within tier caps; SELLS only when the
  user owns shares (mirror the orchestrator inventory guard). Run risk.evaluate; apply only if
  allowed; otherwise count the rejection.
- After EVERY applied trade assert: Σ cents ledger == 0, Σ shares ledger == 0,
  `reserveCents >= reserveFloorCents`, `reserveCents >= 0`, `market_reserve` balance == reserveCents.
- Per tier (1/2/3): 10,000 trades. End-of-run: ledger balanced, min reserve observed ≥ floor.

---

## End-to-end flow (TEST-05 contract)

`flow.test.js` (supertest + replset): POST /quotes → POST /orders (buy) → GET /portfolio
(position present) → POST /orders (sell) → GET /portfolio (reduced) — all with a real JWT,
asserting the response contract the frontend will consume. Plus a replay assertion
(same idempotencyKey → identical trade).

---

## Wave 0 Requirements

- [ ] `tests/unit/simulation.test.js` (pure 10k sim + invariant property tests)
- [ ] `tests/integration/flow.test.js` (end-to-end HTTP walk)
- [ ] a small seeded PRNG helper (no external dep)

---

## Manual-Only Verifications

*None — the simulation and flow are fully automated and deterministic (seeded).*

---

## Validation Sign-Off

- [x] Each requirement has an automated test
- [x] Sim drives real engine functions; deterministic seed
- [x] Wave 0 = simulation.test.js + flow.test.js
- [x] No watch-mode flags
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-06-07
