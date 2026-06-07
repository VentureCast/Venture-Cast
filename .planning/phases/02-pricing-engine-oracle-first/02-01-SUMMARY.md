---
phase: 02-pricing-engine-oracle-first
plan: "01"
subsystem: amm-pricing-engine
tags: [amm, pricing, bonding-curve, tdd, oracle, pure-functions]
dependency_graph:
  requires: []
  provides: [buyCostCents, sellPayoutCents, priceCents, cashToUnits, applyBuyFees, applySellFees, PricingError, TIER_CONFIG]
  affects: [phase-03-risk-limits, phase-04-trade-orchestrator]
tech_stack:
  added: []
  patterns: [halfUpDiv-rounding, ceil-fee-rounding, quadratic-inversion-plus-integer-search, PricingError-statusCode-pattern]
key_files:
  created:
    - VentureCast_Backend-main/services/amm/config.js
    - VentureCast_Backend-main/services/amm/pricing/curve.js
    - VentureCast_Backend-main/services/amm/pricing/inversion.js
    - VentureCast_Backend-main/services/amm/pricing/fees.js
    - VentureCast_Backend-main/tests/unit/pricing.test.js
  modified: []
decisions:
  - "ceil() for fee/spread rounding — favors reserve/platform; floor() would favor user by sub-cent per trade"
  - "sellPayoutCents delegates directly to buyCostCents — exact symmetry guaranteed by shared implementation"
  - "cashToUnits two-pass search: upward then downward guard — protects against both float undershoot and overshoot"
  - "PricingError statusCode 400 for invalid inputs, 500 for Number.isSafeInteger overflow"
  - "Overflow trigger: k_num*(s1^2-s0^2) checked with Number.isSafeInteger, not a supply cap"
metrics:
  duration_minutes: 6
  completed_date: "2026-06-05"
  tasks_completed: 2
  files_created: 5
  tests_added: 27
  tests_total_after: 115
---

# Phase 2 Plan 1: Pure Pricing Engine (Oracle-First TDD) Summary

**One-liner:** Integer-cent bonding curve engine with halfUpDiv buy cost, ceil fee/spread routing, and quadratic-plus-integer-search cash→units inversion — proven by the $205 oracle written RED-first.

## What Was Built

Four pure CommonJS modules with zero Mongoose dependencies:

- `services/amm/config.js` — DEFAULT_SPREAD_BPS=50, DEFAULT_FEE_BPS=100, TIER_CONFIG for tiers '1'/'2'/'3'
- `services/amm/pricing/curve.js` — priceCents (float, informational), buyCostCents (halfUpDiv integral, rounds UP), sellPayoutCents (delegates to buyCostCents for exact symmetry), PricingError class
- `services/amm/pricing/inversion.js` — cashToUnits: quadratic float estimate + two-pass ±1 integer search (never trusts float)
- `services/amm/pricing/fees.js` — applyBuyFees / applySellFees: ceil() rounding so user pays/loses at least exact bps

27 new oracle-first unit tests cover all PRICE-01..05 and TEST-01 requirements.

## Oracle Verification (TEST-01)

```
P0_cents=100, k_num=1, k_den=10, s0=1000, delta=100
  s1 = 1100
  quadNum = 1*(1100^2-1000^2) = 210000; divisor = 20
  quotient = 10500; remainder = 0 → halfUp = 0
  buyCostCents = 100*100 + 10500 = 20500c ($205.00) ✓
  priceCents(1000) = 200c ($2.00) ✓ / priceCents(1100) = 210c ($2.10) ✓
  avg price = 20500/100 = 205c ($2.05) ✓
```

## Rounding Vectors (Pinned)

| Case | Formula | Result |
|------|---------|--------|
| buyCostCents(1000,100,ORACLE) | oracle (remainder=0) | 20500c |
| buyCostCents(1000,4,ORACLE) | halfUp UP (16*2=32≥20) | 801c |
| buyCostCents(1000,1,ORACLE) | halfUp DOWN (1*2=2<20) | 200c |
| applyBuyFees(20500,{50bps,100bps}) | ceil(102.5)=103, ceil(205)=205 | total 20808c |
| applySellFees(20500,{50bps,100bps}) | same spread+fee | net 20192c |
| applySellFees(801,{50bps,100bps}) | ceil(4.005)=5, ceil(8.01)=9 | net 787c |
| cashToUnits(20500,1000,ORACLE) | exact round-trip | {units:100, grossCents:20500} |

## Key Decisions

1. **ceil() for fee/spread (CRITICAL OVERRIDE from plan):** The plan specified floor(); overridden to ceil() because "every rounding favors the reserve/platform, never the user." floor(102.5)=102 favors the user by 0.5c; ceil(102.5)=103 is platform-favoring. Applied consistently to both buy and sell.

2. **sellPayoutCents delegates to buyCostCents:** Guarantees exact byte-for-byte symmetry — impossible to drift if the formula is written once. s0 is the post-sell supply; the integral [s0, s0+delta] covers the same price range as a buy from that supply level.

3. **Two-pass integer search in cashToUnits:** Upward pass handles float undershot (floor=99 when true answer=100); downward guard handles extremely rare float overshoot. Both cases verified by property test (cost-bound and inverse assertions).

4. **Number.isSafeInteger on quadNum, not a supply cap:** More precise than checking supply > 30M. Detects overflow exactly when it occurs, based on actual k_num value. Trigger: s0=45_036_000_000_000, k_num=100, delta=1 → quadNum=9_015_995_347_763_200 > MAX_SAFE_INTEGER.

5. **PricingError mirrors TradeError shape:** message, statusCode (400/500), details object. statusCode 400 for bad inputs (non-integer s0, delta ≤ 0); 500 for arithmetic overflow.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Overflow test vector corrected**
- **Found during:** Task 1 — overflow guard test ran but did not throw
- **Issue:** Test used `s0=9_000_000_000, k_num=100` — this produces quadNum≈1.8e12 which IS safe
- **Fix:** Changed to `s0=45_036_000_000_000, k_num=100, delta=1` → quadNum≈9.016e15 > MAX_SAFE_INTEGER; verified via node before fixing test
- **Files modified:** `tests/unit/pricing.test.js`
- **Commit:** b09a2ab

**2. [Rule 1 - Bug] Fee/spread rounding CRITICAL OVERRIDE applied**
- **Found during:** Task 1 planning — prompt included explicit CRITICAL_OVERRIDE_rounding directive
- **Issue:** Plan and RESEARCH.md specified `floor()` for fee/spread; execution override mandates `ceil()` to consistently favor reserve/platform
- **Fix:** Implemented `Math.ceil()` in fees.js for both spreadCents and feeCents; test vectors updated to 103/205 (not 102/205) and totalCents 20808 (not 20807), netCents 20192 (not 20193)
- **Files modified:** `services/amm/pricing/fees.js`, `tests/unit/pricing.test.js`
- **Commit:** c2ad4fd

**3. [Rule 2 - Missing functionality] Sell-side non-zero-remainder rounding test added**
- **Found during:** Task 2 — CRITICAL_OVERRIDE noted the plan only had the buy-side 801c case
- **Issue:** No sell-side fee/spread ceil rounding test with non-zero remainder
- **Fix:** Added `applySellFees(801, {50bps, 100bps})` test asserting spread=5 (ceil 4.005), fee=9 (ceil 8.01)
- **Files modified:** `tests/unit/pricing.test.js`
- **Commit:** c2ad4fd

## Test Results

```
Test Suites: 7 passed, 7 total
Tests:       115 passed, 115 total
  - 27 new pricing tests (all PRICE-01..05, TEST-01)
  - 88 pre-existing tests (no regressions)
Time: 5.76s
```

## Purity Verification

```bash
grep -rn "mongoose" services/amm/pricing/ services/amm/config.js
# Returns: nothing (CLEAN)
```

## Commits

| Hash | Message |
|------|---------|
| a4122b0 | test(02-01): add failing oracle + curve tests (RED) |
| b09a2ab | feat(02-01): implement config + curve pricing (oracle passes) |
| c2ad4fd | feat(02-01): implement cash→units inversion + spread/fee routing |

## Self-Check: PASSED

- [x] config.js FOUND
- [x] pricing/curve.js FOUND
- [x] pricing/inversion.js FOUND
- [x] pricing/fees.js FOUND
- [x] tests/unit/pricing.test.js FOUND
- [x] Commits a4122b0, b09a2ab, c2ad4fd FOUND in git log
- [x] Oracle assertion (20500) present in test file
- [x] Zero Mongoose imports in pricing/ and config.js
- [x] 115/115 tests pass (npm test)
