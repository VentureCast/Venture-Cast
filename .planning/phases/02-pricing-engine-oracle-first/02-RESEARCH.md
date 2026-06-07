# Phase 2: Pricing Engine (Oracle-First) — Research

**Researched:** 2026-06-05
**Domain:** Pure integer-cent bonding-curve arithmetic — curve integrals, cash→units inversion, spread/fee routing, residual rounding
**Confidence:** HIGH — all arithmetic verified by running Node.js against the oracle. All claims derive from the authoritative spec (`documentation/CREATOR_AMM_PLAN.md`), codebase inspection, and computed examples. No speculative claims.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRICE-01 | System computes buy cost as the exact integer-cent curve integral and passes the oracle ($205.00 / avg $2.05 / end $2.10) exactly | Verified below: oracle remainder=0, gross=20500c |
| PRICE-02 | System computes sell payout symmetric to buy over the same supply range, in integer cents | Verified: sellPayoutCents is the same integral formula as buyCostCents, same bounds |
| PRICE-03 | System inverts a cash amount to the max integer units purchasable, with an exact integer recompute (never trusts float) | Verified: quadratic float estimate + ±1 integer search; $205.00 → exactly 100 units |
| PRICE-04 | System applies spread (→ reserve) and fee (→ platform_fees) per-market in basis points (default 50/100 bps) | Documented: two distinct integer-cent amounts, floor() rounding, sourced from Market.spreadBps/feeBps |
| PRICE-05 | System rounds sub-cent residuals deterministically and sweeps them into the reserve | Documented: half-up rule on the integral remainder; residual is implicit in the gross_cents integer |
| TEST-01 | Oracle test asserts $205.00 / avg $2.05 / end $2.10 exactly | Must be the first test written; assertions on exact integer cents |
</phase_requirements>

---

## Summary

Phase 2 builds three pure CommonJS modules under `services/amm/pricing/` (no Mongoose, no I/O, no side effects) and a `services/amm/config.js` with per-tier spread/fee defaults. Every function takes integers and returns integers. This makes tests synchronous, deterministic, and fast — no `MongoMemoryReplSet` is needed for Phase 2.

The bonding curve is `P(s) = P0_cents + (k_num * s) / k_den`. Buy cost (and sell payout, by symmetry) is the closed-form integral: `P0_cents * delta + floor(k_num * (s1^2 - s0^2) / (2 * k_den))` plus a half-up rounding correction on the remainder. The oracle case (`P0=100c, k=1/10, s0=1000, delta=100`) produces remainder=0 and gross=20500c ($205.00) — verified by computation. The worked non-zero-remainder example (`s0=1000, delta=4`) produces remainder=16 out of divisor=20, which rounds UP (16*2=32 >= 20), giving gross=801c where the true float was 800.80c.

The three modules are: `curve.js` (price point, buy cost, sell payout), `inversion.js` (cash→units), and `fees.js` (spread/fee application). They are completely independent of each other and of any database — unit tests call them directly without any test DB setup.

**Primary recommendation:** Write the oracle test first (TEST-01), make it fail, then implement `curve.js` to make it pass. Extend with `inversion.js` and `fees.js` in the same TDD rhythm. All three modules should be implemented and tested within a single wave.

---

## Standard Stack

All packages are already installed in `VentureCast_Backend-main/package.json`. No new dependencies required for Phase 2.

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | ^30.2.0 | Test runner | Existing project-wide test infra |
| Node.js | v24.9.0 | Runtime (Number is 64-bit IEEE 754 double) | Project runtime |

### No New Installation Required

`services/amm/pricing/` modules are vanilla CommonJS JS — `require`/`module.exports`, no external libs, no build step.

**Installation (none needed):**
```bash
# No new packages. Verify jest still runs:
cd VentureCast_Backend-main && npm test -- --testPathPattern pricing
```

---

## Architecture Patterns

### Recommended Project Structure

```
VentureCast_Backend-main/
  services/
    amm/
      pricing/
        curve.js        # priceCents, buyCostCents, sellPayoutCents
        inversion.js    # cashToUnits (cash→units with integer-search)
        fees.js         # applyBuyFees, applySellFees
      config.js         # TIER_CONFIG, DEFAULT_SPREAD_BPS, DEFAULT_FEE_BPS
      genesisService.js # (Phase 1 — already exists)
  tests/
    unit/
      pricing.test.js   # All PRICE-01..05 + TEST-01 tests
```

### Pattern 1: Integer Curve Integral

**What:** The closed-form buy cost and sell payout, computed entirely in integer arithmetic.

**Inputs:** `s0` (integer supply before trade), `delta` (integer units bought/sold), and market params `{ P0_cents, k_num, k_den }` (all integers from the `Market` Mongoose document).

**Formula:**
```
cost_cents = P0_cents * delta + halfUpDiv(k_num * (s1^2 - s0^2), 2 * k_den)
```
where `s1 = s0 + delta` and `halfUpDiv(a, b) = floor(a/b) + (a%b * 2 >= b ? 1 : 0)`.

**Example (oracle — remainder=0):**
```javascript
// Source: CREATOR_AMM_PLAN.md §2 + verified by node computation
// P0_cents=100, k_num=1, k_den=10, s0=1000, delta=100
const s1 = 1100;
const num = 1 * (1100*1100 - 1000*1000);  // = 210000
const divisor = 2 * 10;                    // = 20
const quotient = Math.floor(210000 / 20);  // = 10500
const remainder = 210000 % 20;             // = 0  (no rounding)
const grossCents = 100*100 + 10500;        // = 20500  ($205.00)
// start price: 100 + 1*1000/10 = 200c ($2.00)
// end price:   100 + 1*1100/10 = 210c ($2.10)
// avg price:   (200+210)/2     = 205c ($2.05)
```

**Example (rounding UP — remainder triggers halfUp=1):**
```javascript
// P0_cents=100, k_num=1, k_den=10, s0=1000, delta=4
// s1=1004, num=1*(1004^2-1000^2)=8016, divisor=20
// quotient=floor(8016/20)=400, remainder=8016%20=16
// halfUp: 16*2=32 >= 20 → true → add 1
const grossCents = 100*4 + 400 + 1;  // = 801 cents ($8.01)
// true float: 800.80c — user paid 0.20c more, swept to reserve implicitly
```

**Example (rounding DOWN — no halfUp):**
```javascript
// P0_cents=100, k_num=1, k_den=10, s0=1000, delta=1
// s1=1001, num=2001, divisor=20
// quotient=100, remainder=1, halfUp: 1*2=2 < 20 → false
const grossCents = 100*1 + 100;  // = 200 cents ($2.00)
// true float: 200.05c — reserve receives 0.05c less than exact curve value (acceptable, bounded < 0.5c)
```

**Sell payout:** The integral is symmetric. `sellPayoutCents(s_after, delta, market)` uses the same formula as `buyCostCents(s_after, delta, market)` where `s_after` is the supply AFTER the sell (i.e., `s_before - delta`). The caller (Phase 4 orchestrator) is responsible for tracking supply direction.

```javascript
// Source: CREATOR_AMM_PLAN.md §2
// sellPayoutCents is the same integral over [s_after, s_after+delta]
// equivalently: the same as buyCostCents(s_after, delta, market)
```

### Pattern 2: Cash→Units Inversion

**What:** Given X cents to spend (before fees), find the maximum integer units purchasable.

**Algorithm (integer-exact, never trusts float):**
```javascript
// Source: CREATOR_AMM_PLAN.md §2
function cashToUnits(X_cents, s0, market) {
  const { P0_cents, k_num, k_den } = market;
  const p_s0 = P0_cents + (k_num * s0 / k_den);  // P(s0), may be non-integer if k*s/d non-integer

  // Quadratic: (k_num/(2*k_den))*delta^2 + P(s0)*delta - X = 0
  // a = k_num, b = 2*k_den*p_s0, c = -2*k_den*X  (multiply through by 2*k_den for integer coefficients)
  // Solve for float estimate only:
  const a_f = k_num / (2 * k_den);
  const b_f = p_s0;
  const discriminant = b_f * b_f + 4 * a_f * X_cents;
  const floatDelta = (-b_f + Math.sqrt(discriminant)) / (2 * a_f);
  let delta = Math.floor(floatDelta);

  // Integer-search: find largest delta with buyCostCents(s0, delta, market) <= X_cents
  // Start at floor, try +1 (float rounding may have undershot)
  while (buyCostCents(s0, delta + 1, market) <= X_cents) delta++;
  // Guard against float overshoot (very rare but possible):
  while (delta > 0 && buyCostCents(s0, delta, market) > X_cents) delta--;

  return { units: delta, grossCents: buyCostCents(s0, delta, market) };
}
// Verified: X=20500c (=$205.00), s0=1000 → units=100, grossCents=20500 (exact round-trip)
```

**Why not trust the float:** IEEE 754 double arithmetic can produce `floatDelta = 99.9999...` which floors to 99, missing the correct 100. The integer recompute is authoritative. The ±1 search is bounded (at most 2 iterations) because the float estimate is accurate to within 1 unit.

### Pattern 3: Spread and Fee Application

**What:** Two distinct integer-cent amounts with two distinct destinations.

**Formulas (floor rounding — specified explicitly in CREATOR_AMM_PLAN.md §9):**
```javascript
// Source: CREATOR_AMM_PLAN.md §9 confirm-point #3 + prompt math spec
// spread_cents = floor(grossCents * spreadBps / 10000)  → market_reserve
// fee_cents    = floor(grossCents * feeBps   / 10000)  → platform_fees

// BUY: user pays gross + spread + fee
function applyBuyFees(grossCents, market) {
  const spreadCents = Math.floor(grossCents * market.spreadBps / 10000);
  const feeCents    = Math.floor(grossCents * market.feeBps   / 10000);
  return { spreadCents, feeCents, totalCents: grossCents + spreadCents + feeCents };
}

// SELL: user receives gross - spread - fee
function applySellFees(grossCents, market) {
  const spreadCents = Math.floor(grossCents * market.spreadBps / 10000);
  const feeCents    = Math.floor(grossCents * market.feeBps   / 10000);
  return { spreadCents, feeCents, netCents: grossCents - spreadCents - feeCents };
}
```

**Verified (oracle round-trip):**
```
gross=20500c, spreadBps=50, feeBps=100
  spread=floor(20500*50/10000)=floor(102.5)=102c  → reserve
  fee=floor(20500*100/10000)=205c                 → platform_fees
  BUY total user pays: 20500+102+205 = 20807c ($208.07)
  SELL user receives:  20500-102-205 = 20193c ($201.93)
  Net user loss on round-trip: 614c
  Reserve gain: 102+102=204c, Platform gain: 205+205=410c
  Conservation: 614c = 204c + 410c ✓
```

**Floor rounding note:** `floor()` on spread/fee results in the user paying at most 0.9999c less than exact bps per trade. This is a sub-cent per-trade drift, bounded and acceptable. The spec explicitly states floor. A human decision point is noted in Open Questions below.

### Pattern 4: Module Signature Contracts

```javascript
// curve.js — Source: CREATOR_AMM_PLAN.md §1-§2
/**
 * @param {number} s - supply (integer units)
 * @param {{ P0_cents: number, k_num: number, k_den: number }} market
 * @returns {number} price in integer cents (truncated, not rounded — price is informational)
 */
function priceCents(s, market) { ... }

/**
 * @param {number} s0 - supply before buy (integer units >= 0)
 * @param {number} delta - units to buy (integer > 0)
 * @param {{ P0_cents: number, k_num: number, k_den: number }} market
 * @returns {number} gross cost in integer cents (half-up rounded)
 */
function buyCostCents(s0, delta, market) { ... }

/**
 * Symmetric to buyCostCents. s0 is the supply AFTER the sell.
 * @param {number} s0 - supply after sell (integer units >= 0)
 * @param {number} delta - units to sell (integer > 0)
 * @param {{ P0_cents: number, k_num: number, k_den: number }} market
 * @returns {number} gross payout in integer cents (half-up rounded)
 */
function sellPayoutCents(s0, delta, market) { ... }
```

### Anti-Patterns to Avoid

- **Using floating-point for the cost integral:** `P0*delta + k*s0*delta + k*delta^2/2` as a float loses integer precision at scale. Always use the `Math.floor(num/divisor)` + `halfUp` form.
- **Trusting the quadratic float for units:** Always follow with integer recompute and ±1 search.
- **Applying fees to `totalCents` (for BUY) or `netCents` (for SELL) rather than `grossCents`:** Fees and spread must be computed on `grossCents` (the curve integral result), not on the post-fee total, to avoid circular arithmetic.
- **Using `Model.create()` inside a session (Phase 4 concern, not Phase 2):** Phase 2 is pure functions; no Mongoose is involved. Document this here as a reminder for Phase 4 integration.
- **Importing Mongoose in pricing modules:** These modules must remain DB-free. Any Mongoose import is a bug.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Half-up integer division | A custom rounding class or utility package | `Math.floor(a/b) + (a%b*2 >= b ? 1 : 0)` — one inline expression | This is a single 40-character expression with no dependencies |
| Quadratic solver | A root-finding library | Float estimate via `Math.sqrt(discriminant)` as starting point only, then integer search | Float estimate + ±1 search is sufficient and has zero dependencies |
| Big integer multiplication | BigInt throughout | Use BigInt only at s > ~30M (explained below); regular Number is safe for realistic supply | BigInt is 2-5x slower and complicates the interface |

**Key insight:** The pricing engine is 3 short pure functions. The complexity is in the rounding rules, not the algorithm. Every library or abstraction layer adds indirection without benefit.

---

## Common Pitfalls

### Pitfall 1: Integer Overflow in `k_num * (s1^2 - s0^2)`

**What goes wrong:** `Number` (64-bit IEEE 754 double) can represent integers exactly only up to `2^53 - 1 = 9,007,199,254,740,991`. For the oracle params (`k_num=1`), the product `k_num * (s1^2 - s0^2)` equals `(2*s0 + delta) * delta`. This exceeds `2^53` when `s0` exceeds approximately 45 trillion units — far beyond any plausible creator market.

**Verified safe range:** At `s0 = 30,000,000` (30M shares), `delta = 100`, the product is `6,000,010,000` — well within `Number.MAX_SAFE_INTEGER`. Number arithmetic is safe for any supply that a real market would reach.

**Why it happens:** Developers reaching for BigInt preemptively, adding unnecessary complexity.

**How to avoid:** Use plain `Number`. Add an assertion guard: if `supply > 30_000_000`, throw a `PricingError` and require BigInt review. This cap is far above any realistic market and protects against accidental wrong-scale inputs.

**Warning signs:** If `k_num` is ever > 1, the threshold drops proportionally (`k_num * s^2` overflows sooner). Document this in `config.js`.

### Pitfall 2: `p_s0 = P0_cents + k_num * s0 / k_den` May Not Be an Integer

**What goes wrong:** `priceCents(s0)` divides `k_num * s0` by `k_den`. With `k_num=1, k_den=10, s0=1001`, this is `1001/10 = 100.1` — not an integer. This is fine for the `priceCents` display function (truncate or round is a UI choice), but the quadratic inversion uses `p_s0` as a float coefficient for the estimate — that is correct and intentional. Do NOT try to make `priceCents` return an integer by rounding, as that changes the inversion coefficients.

**How to avoid:** `priceCents` returns a float (informational only). The cost integral `buyCostCents` never calls `priceCents` internally — it recomputes from first principles using the integer formula directly.

### Pitfall 3: Applying the ±1 Search in the Wrong Direction

**What goes wrong:** Starting at `Math.floor(floatDelta)` and searching upward only (`while cost(delta+1) <= X`). The float estimate could overshoot (yield `floatDelta = 100.0001` → `floor = 100` → correct) or undershoot (yield `floatDelta = 99.9999` → `floor = 99` → one upward step to 100). But extremely edge cases where the discriminant calculation itself has float error can cause `floor` to be 1 too high. Guard with a downward pass too.

**How to avoid:** Two-pass search:
1. Upward: `while buyCostCents(s0, delta+1, market) <= X_cents: delta++`
2. Downward guard: `while delta > 0 && buyCostCents(s0, delta, market) > X_cents: delta--`

In practice the downward guard never executes for the oracle params, but it is a correctness guarantee.

### Pitfall 4: Importing Market Model in pricing/ Modules

**What goes wrong:** `curve.js` does `require('../../models/Market')` to fetch curve params. This couples the pure pricing engine to Mongoose, breaks fast synchronous testing, and pulls in DB connection logic.

**How to avoid:** All pricing functions accept a plain JS object `{ P0_cents, k_num, k_den, spreadBps, feeBps }`. The caller (Phase 4 orchestrator) reads the Mongoose document and passes the plain fields. The pricing module never imports Mongoose.

### Pitfall 5: Spread/Fee Applied Twice or on Wrong Base

**What goes wrong:** Computing `spreadCents = floor(totalCents * spreadBps / 10000)` where `totalCents = grossCents + spreadCents` — circular. Or applying spread after fee has already been added to the base.

**How to avoid:** Always compute `spreadCents` and `feeCents` on `grossCents` only, before adding/subtracting them. The order of computation: (1) `grossCents = buyCostCents(...)`, (2) `spreadCents = floor(gross * spreadBps / 10000)`, (3) `feeCents = floor(gross * feeBps / 10000)`. These are independent, parallel computations on the same base.

---

## Code Examples

Verified patterns from oracle computation:

### The `halfUpDiv` Helper

```javascript
// Source: CREATOR_AMM_PLAN.md §1 integer rounding spec + verified by node
/**
 * Integer division with half-up rounding on the remainder.
 * halfUpDiv(a, b) = floor(a/b) + 1 if remainder*2 >= b, else floor(a/b)
 * @param {number} a - dividend (non-negative integer)
 * @param {number} b - divisor (positive integer)
 * @returns {number} integer quotient, half-up rounded
 */
function halfUpDiv(a, b) {
  const q = Math.floor(a / b);
  const r = a % b;
  return r * 2 >= b ? q + 1 : q;
}
// halfUpDiv(210000, 20) = 10500  (oracle: remainder=0)
// halfUpDiv(8016, 20)   = 401    (delta=4: remainder=16, 32>=20, round up)
// halfUpDiv(2001, 20)   = 100    (delta=1: remainder=1,  2<20,  round down)
```

### `buyCostCents` Implementation Pattern

```javascript
// Source: CREATOR_AMM_PLAN.md §1
function buyCostCents(s0, delta, market) {
  const { P0_cents, k_num, k_den } = market;
  const s1 = s0 + delta;
  const quadNum = k_num * (s1 * s1 - s0 * s0);  // k_num*(s1^2-s0^2)
  const quadDen = 2 * k_den;
  return P0_cents * delta + halfUpDiv(quadNum, quadDen);
}
// buyCostCents(1000, 100, {P0_cents:100, k_num:1, k_den:10}) === 20500  ✓ oracle
// buyCostCents(1000, 4,   {P0_cents:100, k_num:1, k_den:10}) === 801    ✓ rounding-up case
// buyCostCents(1000, 1,   {P0_cents:100, k_num:1, k_den:10}) === 200    ✓ rounding-down case
```

### `cashToUnits` Implementation Pattern

```javascript
// Source: CREATOR_AMM_PLAN.md §2
function cashToUnits(X_cents, s0, market) {
  const { P0_cents, k_num, k_den } = market;
  // Float estimate from quadratic formula
  const a_f = k_num / (2 * k_den);
  const b_f = P0_cents + (k_num * s0 / k_den);  // P(s0) as float
  const discriminant = b_f * b_f + 4 * a_f * X_cents;
  let delta = Math.floor((-b_f + Math.sqrt(discriminant)) / (2 * a_f));

  // Integer-exact search (float is only starting point)
  while (buyCostCents(s0, delta + 1, market) <= X_cents) delta++;
  while (delta > 0 && buyCostCents(s0, delta, market) > X_cents) delta--;

  const grossCents = delta > 0 ? buyCostCents(s0, delta, market) : 0;
  return { units: delta, grossCents };
}
// cashToUnits(20500, 1000, {P0_cents:100, k_num:1, k_den:10})
//   → { units: 100, grossCents: 20500 }  ✓ oracle round-trip
```

### `config.js` Structure

```javascript
// services/amm/config.js
'use strict';

// Defaults from CREATOR_AMM_PLAN.md §9 confirm-point #3
const DEFAULT_SPREAD_BPS = 50;   // 0.50% → market_reserve
const DEFAULT_FEE_BPS    = 100;  // 1.00% → platform_fees

// Per-tier risk config placeholders (populated Phase 3)
const TIER_CONFIG = {
  '1': { spreadBps: DEFAULT_SPREAD_BPS, feeBps: DEFAULT_FEE_BPS, maxTradeCents: null, reserveFloorCents: null },
  '2': { spreadBps: DEFAULT_SPREAD_BPS, feeBps: DEFAULT_FEE_BPS, maxTradeCents: null, reserveFloorCents: null },
  '3': { spreadBps: DEFAULT_SPREAD_BPS, feeBps: DEFAULT_FEE_BPS, maxTradeCents: null, reserveFloorCents: null },
};

module.exports = { DEFAULT_SPREAD_BPS, DEFAULT_FEE_BPS, TIER_CONFIG };
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Float arithmetic for curve integrals | Integer cents with halfUpDiv rounding | Phase 2 design (2026-06) | Deterministic, no floating-point drift across 10k trades |
| `Model.create()` inside Mongoose session | `new Model().save({ session })` (Phase 4) | Learned from Phase 1 codebase | Prevents out-of-transaction inserts |
| `MongoMemoryServer` for tests | `MongoMemoryReplSet` (Phase 1+) | Established project pattern | Transactions require replica set |
| Separate float residual tracking | Implicit in halfUp rounding | This design | No separate "residual" ledger entry needed |

**Deprecated/outdated:**
- Fractional share units: resolved to integer-only in §9. No fractional shares anywhere.
- TypeScript/ts-jest: resolved to CommonJS plain JS + JSDoc. No build step.

---

## Open Questions

1. **Spread/fee rounding direction: floor vs ceil**
   - What we know: The spec (`CREATOR_AMM_PLAN.md` §9 and prompt math spec) explicitly states `floor(amount * bps / 10000)`. The prompt also says "favor the reserve/platform, never the user." These are subtly contradictory: `floor` on BUY spread means the user pays fractionally less markup than exact bps (user slightly favored); `floor` on SELL spread means the user loses fractionally less than exact bps (also user slightly favored).
   - What's unclear: Was the intent `floor` (as literally written), or `ceil` (which would consistently favor the reserve by up to 0.9999c per charge)?
   - Impact: At scale (1M trades/year), `floor` vs `ceil` difference is at most $10,000/year in reserve income — not material, but worth clarifying to match the spec author's intent.
   - **Recommendation:** Implement `floor` as written (it's unambiguous and explicit). Document the direction clearly in code comments. Confirm with the spec author if the "favor reserve" intent was meant to override the `floor` instruction.

2. **BigInt threshold for large `k_num` values**
   - What we know: For `k_num=1` (oracle defaults), `Number` is safe up to approximately 45 trillion supply — far beyond any realistic market. For `k_num=10`, the threshold drops to ~4.5 trillion; still safe in practice.
   - What's unclear: Are there any planned tier configs where `k_num` is substantially larger than 1, or where supply could plausibly exceed 100M units?
   - **Recommendation:** Add a `Number.isSafeInteger` assertion on `k_num * (s1*s1 - s0*s0)` inside `buyCostCents`. If it triggers, throw a `PricingError` and escalate — do not silently compute wrong answers. This is more useful than preemptive BigInt.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from `.planning/config.json` (file not present) — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 |
| Config file | `VentureCast_Backend-main/jest.config.js` (existing, no changes needed) |
| Quick run command | `cd VentureCast_Backend-main && npx jest tests/unit/pricing.test.js --runInBand --forceExit` |
| Full suite command | `cd VentureCast_Backend-main && npm test` |

**Critical difference from Phase 1:** Phase 2 tests are PURE FUNCTION tests. No `connectTestDB()`, no `beforeAll` DB setup, no `MongoMemoryReplSet`. Tests call `buyCostCents(...)` synchronously. This is the fastest possible test category.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Oracle: `P0=$1.00, k=0.001, s0=1000, delta=100` → gross=20500c, avg=205c, end=210c exactly | unit (pure) | `npx jest tests/unit/pricing.test.js --runInBand --forceExit` | ❌ Wave 0 |
| PRICE-01 | `buyCostCents` passes oracle exactly | unit (pure) | same | ❌ Wave 0 |
| PRICE-02 | `sellPayoutCents` equals `buyCostCents` over same range | unit (pure) | same | ❌ Wave 0 |
| PRICE-03 | `cashToUnits(20500, 1000, ...)` → `{units:100, grossCents:20500}` exactly | unit (pure) | same | ❌ Wave 0 |
| PRICE-04 | `applyBuyFees(20500, {spreadBps:50, feeBps:100})` → `{spreadCents:102, feeCents:205, totalCents:20807}` | unit (pure) | same | ❌ Wave 0 |
| PRICE-05 | `buyCostCents(1000, 4, ...)` = 801c (halfUp=1, residual implicit); `buyCostCents(1000, 1, ...)` = 200c (halfUp=0) | unit (pure) | same | ❌ Wave 0 |

**Additional recommended property tests (beyond phase requirements):**
- Monotonicity: `buyCostCents(s0, delta+1, m) > buyCostCents(s0, delta, m)` for all delta > 0
- Round-trip conservation: buy then sell same range → reserve gain = spreadCents*2, platform gain = feeCents*2, total = user net loss
- `priceCents` monotonicity: `priceCents(s+1, m) >= priceCents(s, m)` for all s >= 0
- `cashToUnits` inverse: `cashToUnits(buyCostCents(s0, delta, m), s0, m).units === delta`

### Sampling Rate

- **Per task commit:** `npx jest tests/unit/pricing.test.js --runInBand --forceExit` (< 1 second, pure functions)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before moving to Phase 3

### Wave 0 Gaps

- [ ] `tests/unit/pricing.test.js` — covers TEST-01, PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05 (plus property tests)
- [ ] `services/amm/pricing/curve.js` — `priceCents`, `buyCostCents`, `sellPayoutCents`
- [ ] `services/amm/pricing/inversion.js` — `cashToUnits`
- [ ] `services/amm/pricing/fees.js` — `applyBuyFees`, `applySellFees`
- [ ] `services/amm/config.js` — `DEFAULT_SPREAD_BPS`, `DEFAULT_FEE_BPS`, `TIER_CONFIG`

No framework install needed — all gaps are source files, not infra.

---

## Sources

### Primary (HIGH confidence)

- `documentation/CREATOR_AMM_PLAN.md` — §1 ground truth, §2 pricing math, §9 confirm-points (all verbatim spec for this phase)
- `.planning/REQUIREMENTS.md` — PRICE-01..05, TEST-01 requirements with exact success criteria
- `.planning/ROADMAP.md` — Phase 2 goal and 5 success criteria
- `.planning/codebase/CONVENTIONS.md` — CommonJS, integer cents, error class shape, JSDoc patterns
- `.planning/codebase/TESTING.md` — Jest patterns, `--runInBand --forceExit`, pure function test structure
- `VentureCast_Backend-main/models/Market.js` — `P0_cents`, `k_num`, `k_den`, `spreadBps`, `feeBps` field types (all integer-validated)
- `VentureCast_Backend-main/services/amm/genesisService.js` — Phase 1 canonical service pattern (CommonJS, error class, `session.withTransaction`)
- `VentureCast_Backend-main/models/ammValidators.js` — `integerValidator` pattern for Mongoose schemas
- Node.js v24.9.0 computation — all arithmetic examples verified by running `node -e` directly

### Secondary (MEDIUM confidence)

- IEEE 754 double-precision spec — `Number.MAX_SAFE_INTEGER = 2^53 - 1 = 9,007,199,254,740,991`; `sqrt(MAX_SAFE_INTEGER) ≈ 94,906,265` (overflow threshold for `s^2`)

### Tertiary (LOW confidence)

- None — all claims in this document are either spec-derived or computation-verified.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all tooling verified in place
- Architecture: HIGH — module boundaries directly from CREATOR_AMM_PLAN.md §3; function signatures verified by computation
- Pitfalls: HIGH — overflow threshold computed numerically; rounding pitfalls verified with worked examples
- Integer arithmetic: HIGH — all examples run against Node.js v24.9.0

**Research date:** 2026-06-05
**Valid until:** 2026-12-05 (stable math, not time-sensitive; would only change if spec is revised)
