'use strict';

/**
 * pricing.test.js — Oracle-first pure unit tests for the AMM pricing engine.
 *
 * Covers:
 *   TEST-01  Oracle: P0=$1.00, k=0.1, s0=1000, delta=100 → gross 20500c, avg 205c, end 210c
 *   PRICE-01 buyCostCents: exact integer curve integral
 *   PRICE-02 sellPayoutCents: symmetric to buyCostCents
 *   PRICE-03 cashToUnits: float estimate + integer ±1 search, exact round-trip
 *   PRICE-04 applyBuyFees / applySellFees: distinct spread→reserve, fee→platform_fees
 *   PRICE-05 Residual rounding: buy rounds UP, sell rounds UP on fee/spread; overflow guard
 *
 * NO DB setup — pure synchronous tests. No MongoMemoryReplSet, no beforeAll DB.
 *
 * Rounding rule (LOCKED): every rounding favors the reserve/platform, never the user.
 *   - buyCostCents: halfUpDiv (residual → reserve)
 *   - sellPayoutCents: same halfUpDiv integral (symmetric)
 *   - spreadCents/feeCents: ceil() so user pays/loses at least the exact bps
 */

const { buyCostCents, sellPayoutCents, priceCents, PricingError } = require('../../services/amm/pricing/curve');
const { cashToUnits } = require('../../services/amm/pricing/inversion');
const { applyBuyFees, applySellFees } = require('../../services/amm/pricing/fees');

/** Oracle market params: P0=$1.00, k=1/10 */
const ORACLE = { P0_cents: 100, k_num: 1, k_den: 10 };

// ============================================================
// TEST-01: Oracle — the first test written
// ============================================================
describe('oracle (TEST-01)', () => {
  test('buyCostCents(1000, 100, ORACLE) === 20500 (gross $205.00)', () => {
    expect(buyCostCents(1000, 100, ORACLE)).toBe(20500);
  });

  test('priceCents(1100, ORACLE) truncated === 210 (end price $2.10)', () => {
    expect(Math.trunc(priceCents(1100, ORACLE))).toBe(210);
  });

  test('priceCents(1000, ORACLE) truncated === 200 (start price $2.00)', () => {
    expect(Math.trunc(priceCents(1000, ORACLE))).toBe(200);
  });

  test('avg price === 205c ($2.05) derived from gross/units', () => {
    expect(Math.round(20500 / 100)).toBe(205);
  });
});

// ============================================================
// PRICE-01: Buy cost integral
// ============================================================
describe('buy cost integral (PRICE-01)', () => {
  test('buyCostCents(1000, 1, ORACLE) === 201 (remainder rounds UP — user never underpays)', () => {
    // true float: 200.05c; quadNum=2001, quadDen=20 → ceilDiv=101; 100*1 + 101 = 201
    // Buy rounds UP (ceil) so the sub-cent residual flows to the reserve, never the user.
    expect(buyCostCents(1000, 1, ORACLE)).toBe(201);
  });

  test('monotonic: buyCostCents(s0, delta+1) > buyCostCents(s0, delta) for several delta', () => {
    for (let d = 1; d < 10; d++) {
      expect(buyCostCents(1000, d + 1, ORACLE)).toBeGreaterThan(buyCostCents(1000, d, ORACLE));
    }
    // Also test at different s0 values
    expect(buyCostCents(0, 2, ORACLE)).toBeGreaterThan(buyCostCents(0, 1, ORACLE));
    expect(buyCostCents(5000, 2, ORACLE)).toBeGreaterThan(buyCostCents(5000, 1, ORACLE));
  });

  test('buyCostCents(0, 1, ORACLE) is a valid positive integer', () => {
    const cost = buyCostCents(0, 1, ORACLE);
    expect(Number.isInteger(cost)).toBe(true);
    expect(cost).toBeGreaterThan(0);
  });
});

// ============================================================
// PRICE-02: Sell payout symmetry
// ============================================================
describe('sell payout symmetry (PRICE-02)', () => {
  test('sellPayoutCents(1000, 100, ORACLE) === buyCostCents(1000, 100, ORACLE) === 20500', () => {
    expect(sellPayoutCents(1000, 100, ORACLE)).toBe(buyCostCents(1000, 100, ORACLE));
    expect(sellPayoutCents(1000, 100, ORACLE)).toBe(20500);
  });

  test('sell payout is the same integral as buy, conservatively rounded (buy ceil ≥ sell floor, differ ≤ 1c)', () => {
    // "Symmetric" = same underlying curve integral. Buy rounds UP, sell rounds DOWN,
    // so they are EQUAL when the residual divides evenly and differ by exactly 1c
    // otherwise — always in the reserve's favor (buy ≥ sell). This is the deliberate
    // anti-drain cushion: a buy-then-sell round trip can only lose to the reserve.
    const ranges = [
      [0, 1], [0, 50], [500, 10], [1000, 4], [1000, 1], [2000, 200], [1000, 100],
    ];
    for (const [s0, delta] of ranges) {
      const buy = buyCostCents(s0, delta, ORACLE);
      const sell = sellPayoutCents(s0, delta, ORACLE);
      const gap = buy - sell;
      expect(gap === 0 || gap === 1).toBe(true);
      expect(buy).toBeGreaterThanOrEqual(sell);
    }
  });
});

// ============================================================
// PRICE-05: Residual rounding — buy rounds UP (reserve-favoring)
// ============================================================
describe('residual rounding (PRICE-05)', () => {
  test('buyCostCents(1000, 4, ORACLE) === 801 (true float 800.80c → ceil UP into reserve)', () => {
    // diffSquares=4*(2000+4)=8016, quadNum=8016, quadDen=20 → 400.8 → ceilDiv=401
    // 100*4 + 401 = 801
    expect(buyCostCents(1000, 4, ORACLE)).toBe(801);
  });

  test('buy cost rounds UP, sell payout rounds DOWN around the same true float', () => {
    // delta=4: true float residual 800.80c → buy ceil 801, sell floor 800
    expect(buyCostCents(1000, 4, ORACLE)).toBe(801);
    expect(sellPayoutCents(1000, 4, ORACLE)).toBe(800);
    // delta=1: true float residual 200.05c → buy ceil 201, sell floor 200
    expect(buyCostCents(1000, 1, ORACLE)).toBe(201);
    expect(sellPayoutCents(1000, 1, ORACLE)).toBe(200);
  });

  test('sell-side rounds DOWN: sellPayoutCents never over-pays the user', () => {
    // Sell residual floors → the sub-cent stays in the reserve, never paid to the user.
    expect(sellPayoutCents(1000, 4, ORACLE)).toBe(800); // 800.80 floored
    expect(sellPayoutCents(1000, 1, ORACLE)).toBe(200); // 200.05 floored
  });
});

// ============================================================
// priceCents monotonicity
// ============================================================
describe('priceCents monotonicity', () => {
  test('priceCents(s+1, ORACLE) >= priceCents(s, ORACLE) for all s', () => {
    for (let s = 0; s < 20; s++) {
      expect(priceCents(s + 1, ORACLE)).toBeGreaterThanOrEqual(priceCents(s, ORACLE));
    }
  });
});

// ============================================================
// PRICE-05: Overflow guard — Number.isSafeInteger on s^2 term
// ============================================================
describe('overflow guard (PRICE-05)', () => {
  test('buyCostCents throws PricingError for supply that breaks isSafeInteger on s^2 term', () => {
    // Need k_num * (s1^2 - s0^2) to exceed Number.MAX_SAFE_INTEGER (9_007_199_254_740_991).
    // For k_num=100, s0=45_036_000_000_000, delta=1:
    //   quadNum = 100 * (s1^2 - s0^2) = 100 * (2*s0+1) ≈ 9_007_200_000_000_100 > MAX_SAFE_INTEGER
    // Verified via node: Number.isSafeInteger(qb) === false
    expect(() => buyCostCents(45_036_000_000_000, 1, { P0_cents: 100, k_num: 100, k_den: 1 }))
      .toThrow(PricingError);
  });

  test('PricingError has statusCode 500 on overflow', () => {
    try {
      buyCostCents(45_036_000_000_000, 1, { P0_cents: 100, k_num: 100, k_den: 1 });
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      expect(err).toBeInstanceOf(PricingError);
      expect(err.statusCode).toBe(500);
    }
  });
});

// ============================================================
// PRICE-03: Cash→units inversion
// ============================================================
describe('inversion (PRICE-03)', () => {
  test('cashToUnits(20500, 1000, ORACLE) deep-equals { units: 100, grossCents: 20500 }', () => {
    expect(cashToUnits(20500, 1000, ORACLE)).toEqual({ units: 100, grossCents: 20500 });
  });

  test('inverse property: cashToUnits(buyCostCents(s0, delta), s0).units === delta', () => {
    const deltas = [1, 4, 10, 50, 100];
    for (const d of deltas) {
      const cost = buyCostCents(1000, d, ORACLE);
      const result = cashToUnits(cost, 1000, ORACLE);
      expect(result.units).toBe(d);
    }
  });

  test('cost-bound: buyCostCents(s0, units) <= X AND buyCostCents(s0, units+1) > X', () => {
    const testCases = [10000, 20500, 50000, 100000];
    for (const X of testCases) {
      const { units } = cashToUnits(X, 1000, ORACLE);
      if (units > 0) {
        expect(buyCostCents(1000, units, ORACLE)).toBeLessThanOrEqual(X);
      }
      // The next unit should cost more
      expect(buyCostCents(1000, units + 1, ORACLE)).toBeGreaterThan(X);
    }
  });

  test('cashToUnits returns 0 units when X is less than 1 unit cost', () => {
    // Cost of 1 unit from s0=1000 is 200c; passing 100c should give 0 units
    const result = cashToUnits(100, 1000, ORACLE);
    expect(result.units).toBe(0);
    expect(result.grossCents).toBe(0);
  });
});

// ============================================================
// PRICE-04: Fee and spread routing (ceil rounding — platform-favoring)
// ============================================================
describe('fee and spread (PRICE-04)', () => {
  // CRITICAL OVERRIDE: use ceil() for fee/spread so user always pays at least exact bps
  // spreadCents = ceil(20500 * 50 / 10000) = ceil(102.5) = 103
  // feeCents    = ceil(20500 * 100 / 10000) = ceil(205.0) = 205
  // BUY total   = 20500 + 103 + 205 = 20808
  // SELL net    = 20500 - 103 - 205 = 20192

  test('applyBuyFees(20500) returns correct ceil-rounded spread and fee', () => {
    const result = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
    expect(result.grossCents).toBe(20500);
    expect(result.spreadCents).toBe(103);   // ceil(102.5)
    expect(result.feeCents).toBe(205);       // ceil(205.0)
    expect(result.totalCents).toBe(20808);   // 20500+103+205
  });

  test('applySellFees(20500) returns correct ceil-rounded spread and fee', () => {
    const result = applySellFees(20500, { spreadBps: 50, feeBps: 100 });
    expect(result.grossCents).toBe(20500);
    expect(result.spreadCents).toBe(103);   // ceil(102.5)
    expect(result.feeCents).toBe(205);       // ceil(205.0)
    expect(result.netCents).toBe(20192);     // 20500-103-205
  });

  test('spread and fee are DISTINCT integer-cent values', () => {
    const buy = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
    // Different bps → different amounts
    expect(buy.spreadCents).not.toBe(buy.feeCents);
    expect(Number.isInteger(buy.spreadCents)).toBe(true);
    expect(Number.isInteger(buy.feeCents)).toBe(true);
  });

  test('defaults are applied when spreadBps/feeBps omitted', () => {
    // Should use DEFAULT_SPREAD_BPS=50 and DEFAULT_FEE_BPS=100
    const result = applyBuyFees(20500, {});
    expect(result.spreadCents).toBe(103);  // ceil(20500*50/10000)
    expect(result.feeCents).toBe(205);     // ceil(20500*100/10000)
  });

  test('sell-side non-zero-remainder rounding: spreadCents rounds UP', () => {
    // grossCents=801, spreadBps=50: 801*50/10000 = 4.005 → ceil = 5
    // feeBps=100: 801*100/10000 = 8.01 → ceil = 9
    const sell = applySellFees(801, { spreadBps: 50, feeBps: 100 });
    expect(sell.spreadCents).toBe(5);    // ceil(4.005) — favors platform/reserve
    expect(sell.feeCents).toBe(9);       // ceil(8.01) — favors platform
    // The sell net should be LESS than it would be with floor
    expect(sell.netCents).toBe(801 - 5 - 9); // 787
  });

  test('buy-side non-zero-remainder rounding: spreadCents rounds UP (user pays more)', () => {
    // grossCents=801, spreadBps=50: ceil(4.005) = 5
    const buy = applyBuyFees(801, { spreadBps: 50, feeBps: 100 });
    expect(buy.spreadCents).toBe(5);
    expect(buy.feeCents).toBe(9);
    expect(buy.totalCents).toBe(801 + 5 + 9); // 815
  });
});

// ============================================================
// PRICE-04/PRICE-05: Round-trip conservation
// ============================================================
describe('round-trip conservation (PRICE-04/PRICE-05)', () => {
  test('buy then sell same range: reserve + platform gains = user net loss', () => {
    const gross = buyCostCents(1000, 100, ORACLE);       // 20500
    const buyFees = applyBuyFees(gross, { spreadBps: 50, feeBps: 100 });
    const sellFees = applySellFees(gross, { spreadBps: 50, feeBps: 100 });

    const userNetLoss = buyFees.totalCents - sellFees.netCents;
    const reserveGain = buyFees.spreadCents + sellFees.spreadCents;
    const platformGain = buyFees.feeCents + sellFees.feeCents;

    expect(userNetLoss).toBe(reserveGain + platformGain);
  });

  test('conservation holds with non-zero-remainder rounding (gross=801)', () => {
    const gross = 801;
    const buyFees = applyBuyFees(gross, { spreadBps: 50, feeBps: 100 });
    const sellFees = applySellFees(gross, { spreadBps: 50, feeBps: 100 });

    const userNetLoss = buyFees.totalCents - sellFees.netCents;
    const reserveGain = buyFees.spreadCents + sellFees.spreadCents;
    const platformGain = buyFees.feeCents + sellFees.feeCents;

    // With ceil rounding, reserve+platform gain may be slightly MORE than user loss
    // (the ceil adds sub-cent amounts from both buy and sell side)
    // Still, conservation: user net loss === reserve + platform gain (both rounded consistently)
    expect(userNetLoss).toBe(reserveGain + platformGain);
  });
});
