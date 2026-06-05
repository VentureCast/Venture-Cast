---
phase: 2
slug: pricing-engine-oracle-first
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-05
---

# Phase 2 — Validation Strategy

> Per-phase validation contract. Phase 2 is PURE functions — no DB, sub-second tests.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x (installed) |
| **Config file** | `VentureCast_Backend-main/jest.config.js` |
| **Quick run command** | `cd VentureCast_Backend-main && npx jest tests/unit/pricing.test.js --runInBand --forceExit` |
| **Full suite command** | `cd VentureCast_Backend-main && npm test` |
| **Estimated runtime** | < 1 second (no MongoMemoryReplSet — pure synchronous functions) |

---

## Sampling Rate

- **After every task commit:** quick command (`pricing.test.js`)
- **After the wave:** full suite (`npm test`) — confirm no regression
- **Before `/gsd:verify-work`:** full suite green
- **Max feedback latency:** < 5 seconds

---

## Per-Task Verification Map

| Task ID | Requirement | Test Type | Automated Command | Status |
|---------|-------------|-----------|-------------------|--------|
| 2-01-01 | TEST-01 (oracle, FIRST) | unit | `npx jest tests/unit/pricing.test.js -t "oracle"` | ⬜ pending |
| 2-01-02 | PRICE-01 (buy cost integral) | unit | `npx jest tests/unit/pricing.test.js -t "buy cost"` | ⬜ pending |
| 2-01-03 | PRICE-02 (sell payout symmetry) | unit | `npx jest tests/unit/pricing.test.js -t "sell payout"` | ⬜ pending |
| 2-01-04 | PRICE-03 (cash→units inversion, round-trip) | unit | `npx jest tests/unit/pricing.test.js -t "inversion"` | ⬜ pending |
| 2-01-05 | PRICE-04 (spread→reserve, fee→platform_fees) | unit | `npx jest tests/unit/pricing.test.js -t "fee|spread"` | ⬜ pending |
| 2-01-06 | PRICE-05 (residual round-up → reserve) | unit | `npx jest tests/unit/pricing.test.js -t "residual|rounding"` | ⬜ pending |

---

## Property / Invariant Tests (beyond the oracle)

- **Round-trip:** for random X cents, `cashToUnits(X)` then `buyCost(units)` ≤ X, and `(units+1)` would exceed X.
- **Monotonicity:** `priceCents(s)` strictly increases in s; `buyCost` increases in Δ.
- **Sell/buy symmetry:** `sellPayout([s0,s1]) === buyCost([s0,s1])` before spread/fee.
- **Residual non-negativity:** rounding residual swept to reserve is always ≥ 0 (never favors the user).
- **Rounding direction:** every fee/spread/residual rounds in the reserve/platform's favor (never the user).
- **Overflow guard:** `Number.isSafeInteger` assertion on `s^2` terms (research: safe to supply ~4.5e13).

---

## Wave 0 Requirements

- [ ] `tests/unit/pricing.test.js` — oracle-first, then PRICE-01..05 + property tests

*No framework install; no DB. Pure synchronous unit tests.*

---

## Manual-Only Verifications

*None — all pricing behavior is automatable and deterministic.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: every task has an automated command
- [x] Wave 0 covers `pricing.test.js`
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-06-05
