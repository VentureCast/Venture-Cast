---
phase: 2
slug: pricing-engine-oracle-first
status: passed
score: 6/6 must-haves
verified_by: orchestrator (gsd-verifier agent hit a transient API error mid-run; verification performed directly with codex cross-check evidence)
date: 2026-06-05
---

# Phase 2 — Verification

**Status:** passed · **Score:** 6/6 must-haves · 5/5 success criteria

## Success criteria → evidence

1. **Oracle exact, written first** — `buyCostCents(1000,100,{P0_cents:100,k_num:1,k_den:10}) === 20500`; avg 205c; `priceCents(1100) === 210`. Oracle test is the first in `tests/unit/pricing.test.js` (TDD RED commit `a4122b0` preceded the implementation commit `b09a2ab`). ✓
2. **Sell = same integral as buy, conservatively rounded** — buy rounds UP (`ceilDiv`), sell rounds DOWN (`floorDiv`); equal on zero-remainder, differ ≤1c in the reserve's favor otherwise (anti-drain cushion). `curve.js` has separate `buyCostCents`/`sellPayoutCents` paths. ✓
3. **Cash→units inversion** — `cashToUnits(20500,1000,ORACLE) === {units:100, grossCents:20500}`; ±1 integer search recomputes exact cost via `buyCostCents`, never trusts the float seed; boundary verified (budget 94906266 → 0 units, 94906267 → 1 unit). ✓
4. **Spread→reserve, fee→platform_fees, distinct, per-tier** — `applyBuyFees`/`applySellFees` return distinct `spreadCents`/`feeCents`; defaults 50/100 bps in `config.js` `TIER_CONFIG` for tiers 1/2/3. ✓
5. **Residuals favor reserve** — buy `ceilDiv`, sell `floorDiv`; fees exact integer `ceilDiv`. ✓

## Requirement coverage

PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, TEST-01 — all present in `02-01-PLAN.md` frontmatter and implemented.

## Quality evidence

- **Purity:** `grep` for mongoose/models in `services/amm/pricing/` + `config.js` → empty (PURE). No DB coupling.
- **Tests:** pricing suite 27/27; full backend suite 115/115 (confirmed clean after an earlier transient resource-contention flake on `trade.test.js`, which passes 8/8 in isolation).
- **Independent audit (codex):** two adversarial passes. First found 6 money bugs (buy/sell both half-up → reserve leak; s² overflow cliff at ~9.49e7; float fee rounding; unvalidated params; float `priceCents`; negative tiny-sell net) — all fixed (commit `34e5316`). Second pass confirmed all 7 resolved via 2000 randomized BigInt cross-checks and found 2 minor edge cases (flat-curve inversion, `priceCents` overflow guard) — fixed (commit `c460ac6`).

## Notes

The standard `gsd-verifier` agent was spawned but terminated on a transient API/socket error after completing its read passes without emitting a report. Given the comprehensive direct evidence above (and codex's independent cross-check), verification was completed by the orchestrator. No gaps.
