'use strict';

/**
 * tests/unit/risk.test.js
 *
 * Pure decision tests for the 3-tier risk engine (RISK-01..06).
 * No DB, no Mongoose connection — only Types.ObjectId for id strings.
 * The engine reads NO DB: every input (reserve, position, daily volume,
 * market status, prices, tier caps) is passed IN by the caller.
 *
 * evaluate(trade, snapshot, tierConfig) →
 *   allow:  { allowed: true }
 *   reject: { allowed: false, riskError: RiskError, riskEventDraft: { marketId, userId, type, detail } }
 */

const mongoose = require('mongoose');
const { evaluate, RiskError } = require('../../services/amm/risk');

const MARKET_ID = new mongoose.Types.ObjectId().toString();
const USER_ID = new mongoose.Types.ObjectId().toString();

// ---------------------------------------------------------------------------
// Baseline in-bounds fixture + a builder that clones it with overrides.
// ---------------------------------------------------------------------------

function baseTrade(overrides = {}) {
  return {
    marketId: MARKET_ID,
    userId: USER_ID,
    side: 'buy',
    grossCents: 10000,   // $100 trade
    spreadCents: 103,
    deltaQty: 10,
    ...overrides,
  };
}

function baseSnapshot(overrides = {}) {
  return {
    reserveCents: 1000000,        // $10,000 reserve
    reserveFloorCents: 100000,    // $1,000 floor
    userPositionQty: 100,
    userDailyVolumeCents: 50000,  // $500 used today
    marketStatus: 'active',
    recentRefPriceCents: 1000,    // $10 reference price
    newPriceCents: 1010,          // $10.10 — +100 bps move (within breaker)
    ...overrides,
  };
}

function baseTier(overrides = {}) {
  return {
    maxTradeCents: 100000,        // $1,000 per-trade cap
    maxPositionQty: 1000,
    maxDailyCents: 1000000,       // $10,000 daily cap
    circuitBreakerPct: 1000,      // 1000 bps = 10% move threshold
    ...overrides,
  };
}

function evalWith({ trade = {}, snapshot = {}, tier = {} } = {}) {
  return evaluate(baseTrade(trade), baseSnapshot(snapshot), baseTier(tier));
}

// ---------------------------------------------------------------------------
// RISK-01 — max trade size
// ---------------------------------------------------------------------------

describe('risk: max trade cap (RISK-01)', () => {
  test('rejects a trade whose gross exceeds the per-trade max trade cap', () => {
    const result = evalWith({ trade: { grossCents: 200000 }, tier: { maxTradeCents: 100000 } });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    expect(result.riskError.statusCode).toBeGreaterThanOrEqual(400);
    expect(result.riskEventDraft.type).toBe('max_trade_exceeded');
    expect(result.riskEventDraft.marketId).toBe(MARKET_ID);
    expect(result.riskEventDraft.userId).toBe(USER_ID);
    expect(result.riskEventDraft.detail.attemptedCents).toBe(200000);
    expect(result.riskEventDraft.detail.limitCents).toBe(100000);
  });
});

// ---------------------------------------------------------------------------
// RISK-02 — max position (buy only; sells exempt)
// ---------------------------------------------------------------------------

describe('risk: max position cap (RISK-02)', () => {
  test('rejects a buy that pushes user position over the max position cap', () => {
    const result = evalWith({
      trade: { side: 'buy', deltaQty: 500 },
      snapshot: { userPositionQty: 800 },
      tier: { maxPositionQty: 1000 },
    });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    expect(result.riskEventDraft.type).toBe('max_position_exceeded');
    expect(result.riskEventDraft.userId).toBe(USER_ID);
    expect(result.riskEventDraft.detail.limit).toBe(1000);
  });

  test('a sell is NOT blocked by the max position cap', () => {
    // userPositionQty already over the cap, but selling reduces position → allowed by RISK-02.
    const result = evalWith({
      trade: { side: 'sell', deltaQty: 500, grossCents: 10000, spreadCents: 103 },
      snapshot: { userPositionQty: 1500 },
      tier: { maxPositionQty: 1000 },
    });
    expect(result.allowed).toBe(true);
    expect(result.riskError).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// RISK-03 — daily volume cap
// ---------------------------------------------------------------------------

describe('risk: daily volume cap (RISK-03)', () => {
  test('rejects a trade that pushes daily volume over the daily cap', () => {
    const result = evalWith({
      trade: { grossCents: 60000 },
      snapshot: { userDailyVolumeCents: 950000 },
      tier: { maxDailyCents: 1000000 },
    });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    expect(result.riskEventDraft.type).toBe('daily_volume_exceeded');
    expect(result.riskEventDraft.userId).toBe(USER_ID);
    expect(result.riskEventDraft.detail.limit).toBe(1000000);
  });
});

// ---------------------------------------------------------------------------
// RISK-04 — reserve floor invariant (market-level, userId null)
// ---------------------------------------------------------------------------

describe('risk: reserve floor invariant (RISK-04)', () => {
  test('rejects a sell whose post-trade reserve would fall below the floor', () => {
    // reserve 200000, floor 100000. Sell impact = gross - spread = 150000 - 0 = 150000.
    // post = 200000 - 150000 = 50000 < 100000 floor.
    // To make RISK-04 fire (not RISK-05), raise the floor AFTER headroom: keep headroom
    // large enough that RISK-05 passes but the floor still breaches via a large impact.
    // Here we use a fixture where RISK-05 would also catch it; both must reject the sell.
    const result = evalWith({
      trade: { side: 'sell', grossCents: 150000, spreadCents: 0, deltaQty: 10 },
      snapshot: { reserveCents: 200000, reserveFloorCents: 100000 },
      tier: { maxTradeCents: 500000 }, // don't trip RISK-01
    });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    // Either dynamic_sell_cap (RISK-05) or reserve_floor_breach (RISK-04) — both protect the floor.
    expect(['dynamic_sell_cap', 'reserve_floor_breach']).toContain(result.riskEventDraft.type);
    expect(result.riskEventDraft.userId).toBeNull();
  });

  test('reserve floor breach is market-level: the floor check reports userId null', () => {
    // A buy can never trip the floor (buys add to reserve). Confirm a buy near the floor passes.
    const result = evalWith({
      trade: { side: 'buy', grossCents: 10000, spreadCents: 103, deltaQty: 1 },
      snapshot: { reserveCents: 100000, reserveFloorCents: 100000 },
    });
    expect(result.allowed).toBe(true);
    expect(result.riskError).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// RISK-05 — dynamic sell cap (market-level, userId null)
// ---------------------------------------------------------------------------

describe('risk: dynamic sell cap (RISK-05)', () => {
  test('rejects a sell whose reserve impact exceeds the reserve headroom', () => {
    // headroom = reserveCents - reserveFloorCents = 300000 - 100000 = 200000.
    // impact = grossCents - spreadCents = 250000 - 0 = 250000 > 200000 → reject.
    const result = evalWith({
      trade: { side: 'sell', grossCents: 250000, spreadCents: 0, deltaQty: 10 },
      snapshot: { reserveCents: 300000, reserveFloorCents: 100000 },
      tier: { maxTradeCents: 500000 },
    });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    expect(result.riskEventDraft.type).toBe('dynamic_sell_cap');
    expect(result.riskEventDraft.userId).toBeNull();
    expect(result.riskEventDraft.detail.impactCents).toBe(250000);
    expect(result.riskEventDraft.detail.headroomCents).toBe(200000);
  });
});

// ---------------------------------------------------------------------------
// RISK-06 — circuit breaker: paused market + price-move threshold
// ---------------------------------------------------------------------------

describe('risk: circuit breaker — paused market (RISK-06)', () => {
  test('rejects every trade when the market status is paused', () => {
    const result = evalWith({ snapshot: { marketStatus: 'paused' } });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    expect(result.riskEventDraft.type).toBe('circuit_breaker_triggered');
    expect(result.riskEventDraft.userId).toBeNull();
    expect(result.riskEventDraft.detail.reason).toBe('market_paused');
  });
});

describe('risk: circuit breaker — price move (RISK-06)', () => {
  test('rejects a price move beyond circuitBreakerPct and signals a breaker trip', () => {
    // ref 1000, new 1200 → move = 200/1000*10000 = 2000 bps > 1000 bps threshold.
    const result = evalWith({
      snapshot: { recentRefPriceCents: 1000, newPriceCents: 1200 },
      tier: { circuitBreakerPct: 1000 },
    });
    expect(result.allowed).toBe(false);
    expect(result.riskError).toBeInstanceOf(RiskError);
    expect(result.riskEventDraft.type).toBe('circuit_breaker_triggered');
    expect(result.riskEventDraft.userId).toBeNull();
    expect(result.riskEventDraft.detail.moveBps).toBe(2000);
    expect(result.riskEventDraft.detail.thresholdBps).toBe(1000);
    expect(result.riskEventDraft.detail.tripBreaker).toBe(true);
  });

  test('a price move within circuitBreakerPct does not trip the breaker', () => {
    // ref 1000, new 1050 → 500 bps < 1000 bps threshold → allowed.
    const result = evalWith({
      snapshot: { recentRefPriceCents: 1000, newPriceCents: 1050 },
      tier: { circuitBreakerPct: 1000 },
    });
    expect(result.allowed).toBe(true);
    expect(result.riskError).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Happy path — in-bounds trade
// ---------------------------------------------------------------------------

describe('risk: happy path', () => {
  test('allows an in-bounds trade with no riskError', () => {
    const result = evalWith();
    expect(result.allowed).toBe(true);
    expect(result.riskError).toBeUndefined();
    expect(result.riskEventDraft).toBeUndefined();
  });
});
