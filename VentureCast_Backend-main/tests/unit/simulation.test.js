'use strict';

/**
 * tests/unit/simulation.test.js
 *
 * TEST-02: Invariant property tests (seeded randomised run + tampered-posting rejection).
 * TEST-03: 10,000-trades-per-tier simulation driving the REAL AMM engine.
 *
 * PURE in-memory — NO Mongoose, NO MongoMemoryReplSet, NO DB of any kind.
 * All invariants are asserted after every applied trade:
 *   Σ cents accounts == 0
 *   Σ shares accounts == 0
 *   reserveCents >= reserveFloorCents
 *   reserveCents >= 0
 *   accounts.market_reserve:<mid> === reserveCents
 *
 * The real engine modules are required and called directly — this is NOT a
 * reimplementation of the math.
 */

// ---------------------------------------------------------------------------
// Real engine imports (the simulation drives these, never reimplements them)
// ---------------------------------------------------------------------------

const { buyCostCents, sellPayoutCents, priceCents } = require('../../services/amm/pricing/curve');
const { cashToUnits } = require('../../services/amm/pricing/inversion');
const { applyBuyFees, applySellFees } = require('../../services/amm/pricing/fees');
const { buildBuyPostings, buildSellPostings, assertBalanced, LedgerError } = require('../../services/amm/ledger/postings');
const { evaluate } = require('../../services/amm/risk/index');
const { riskConfigForTier } = require('../../services/amm/config');
const { mulberry32, randInt, pick } = require('../helpers/prng');

// ---------------------------------------------------------------------------
// Account-key unit classifier
// ---------------------------------------------------------------------------

/**
 * Return the unit ('cents' | 'shares') for an account key, based on the fixed
 * key-template conventions locked in ledger/postings.js.
 *
 * cents keys:  user_cash:*, market_reserve:*, platform_fees, platform_funding
 * shares keys: user_pos:*,  market_shares_outstanding:*
 *
 * @param {string} key
 * @returns {'cents'|'shares'}
 */
function unitOf(key) {
  if (key.startsWith('user_pos:') || key.startsWith('market_shares_outstanding:')) {
    return 'shares';
  }
  return 'cents'; // user_cash:*, market_reserve:*, platform_fees, platform_funding
}

// ---------------------------------------------------------------------------
// makeWorld — create a fresh in-memory world
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} World
 * @property {string} marketId
 * @property {string} tier
 * @property {{ P0_cents:number, k_num:number, k_den:number }} curveParams
 * @property {{ spreadBps:number, feeBps:number }} feeParams
 * @property {number} supply
 * @property {number} reserveCents
 * @property {number} reserveFloorCents
 * @property {Map<string,number>} accounts   - ledger projection: accountKey → integer balance
 * @property {Map<string,number>} positions  - userId → qty owned (convenience mirror of user_pos)
 * @property {Map<string,number>} dailyVolume - userId → cumulative gross cents this session
 */

/**
 * Create a fresh simulation world.
 *
 * Genesis: credit market_reserve and debit platform_funding by reserveFloorCents
 * so Σ cents == 0 from the start.
 * Users start with zero cash; the simulation funds them via fundUser().
 *
 * @param {Object} opts
 * @param {string} opts.tier
 * @param {number} [opts.P0_cents=100]
 * @param {number} [opts.k_num=1]
 * @param {number} [opts.k_den=10]
 * @param {number} [opts.spreadBps=50]
 * @param {number} [opts.feeBps=100]
 * @param {number} [opts.reserveFloorCents=10000]
 * @param {string} [opts.marketId='market-1']
 * @returns {World}
 */
function makeWorld({
  tier,
  P0_cents = 100,
  k_num = 1,
  k_den = 10,
  spreadBps = 50,
  feeBps = 100,
  reserveFloorCents = 10000,
  marketId = 'market-1',
} = {}) {
  const accounts = new Map();
  // Genesis: market_reserve seeded from platform_funding (double-entry).
  accounts.set(`market_reserve:${marketId}`, reserveFloorCents);
  accounts.set('platform_funding', -reserveFloorCents);
  return {
    marketId,
    tier,
    curveParams: { P0_cents, k_num, k_den },
    feeParams: { spreadBps, feeBps },
    supply: 0,
    reserveCents: reserveFloorCents,
    reserveFloorCents,
    accounts,
    positions: new Map(),
    dailyVolume: new Map(),
  };
}

// ---------------------------------------------------------------------------
// fundUser — inject cash into the world (balanced: debit platform_funding)
// ---------------------------------------------------------------------------

/**
 * Credit a user's cash account and debit platform_funding so Σ cents stays 0.
 * Call this BEFORE the simulation loop; it is not a trade.
 *
 * @param {World} world
 * @param {string} userId
 * @param {number} cents
 */
function fundUser(world, userId, cents) {
  const cashKey = `user_cash:${userId}`;
  world.accounts.set(cashKey, (world.accounts.get(cashKey) || 0) + cents);
  world.accounts.set('platform_funding', (world.accounts.get('platform_funding') || 0) - cents);
}

// ---------------------------------------------------------------------------
// applyTrade — execute one trade against the world, mirroring priceTrade exactly
// ---------------------------------------------------------------------------

/**
 * Attempt one trade. Returns { applied:true, trade, fees } if risk allows and
 * the user has enough inventory (for sells). Returns { applied:false } if
 * the trade is rejected (risk or insufficient inventory).
 *
 * Mirrors priceTrade.js composition exactly:
 *   BUY:  grossCents = buyCostCents(supply, deltaQty) | cashToUnits(cashCents)
 *         fees = applyBuyFees(grossCents, feeParams)
 *         reserveCents += grossCents + spreadCents  (matches buildBuyPostings)
 *   SELL: grossCents = sellPayoutCents(supply - deltaQty, deltaQty)
 *         fees = applySellFees(grossCents, feeParams)
 *         reserveCents -= (grossCents - spreadCents)  (matches buildSellPostings)
 *
 * @param {World} world
 * @param {{ userId:string, side:'buy'|'sell', deltaQty?:number, cashCents?:number }} tradeSpec
 * @returns {{ applied:boolean, trade?:Object, fees?:Object }}
 */
function applyTrade(world, { userId, side, deltaQty, cashCents }) {
  const { marketId, curveParams, feeParams, tier } = world;
  const supply = world.supply;

  let actualDeltaQty;
  let grossCents;
  let fees;

  if (side === 'buy') {
    // Resolve deltaQty and grossCents (cash-denominated or qty-denominated).
    if (cashCents != null) {
      const inv = cashToUnits(cashCents, supply, curveParams);
      if (inv.units <= 0) return { applied: false }; // cashCents too small for even 1 unit
      actualDeltaQty = inv.units;
      grossCents = inv.grossCents;
    } else {
      actualDeltaQty = deltaQty;
      grossCents = buyCostCents(supply, actualDeltaQty, curveParams);
    }
    fees = applyBuyFees(grossCents, feeParams);
  } else {
    // SELL — inventory guard first (mirrors orchestrator's oversell check).
    const owned = world.positions.get(userId) || 0;
    if (owned <= 0 || deltaQty > owned) return { applied: false };
    actualDeltaQty = deltaQty;
    // s0 for sellPayoutCents is supply AFTER sell (post-sell supply).
    grossCents = sellPayoutCents(supply - actualDeltaQty, actualDeltaQty, curveParams);
    try {
      fees = applySellFees(grossCents, feeParams);
    } catch (_) {
      // gross too small (fees would exceed payout) — treat as a rejection.
      return { applied: false };
    }
  }

  // Build the trade object for risk evaluation.
  const tradeForRisk = {
    side,
    grossCents,
    spreadCents: fees.spreadCents,
    deltaQty: actualDeltaQty,
    marketId,
    userId,
  };

  // Build snapshot for risk.
  const snapshot = {
    reserveCents: world.reserveCents,
    reserveFloorCents: world.reserveFloorCents,
    userPositionQty: world.positions.get(userId) || 0,
    userDailyVolumeCents: world.dailyVolume.get(userId) || 0,
    marketStatus: 'active',
    recentRefPriceCents: priceCents(supply, curveParams),
    newPriceCents: priceCents(
      side === 'buy' ? supply + actualDeltaQty : supply - actualDeltaQty,
      curveParams
    ),
  };

  // Risk gate.
  const riskResult = evaluate(tradeForRisk, snapshot, riskConfigForTier(tier));
  if (!riskResult.allowed) return { applied: false };

  // Build and assert-balance the postings (this also calls assertBalanced internally).
  let postings;
  if (side === 'buy') {
    postings = buildBuyPostings({
      userId,
      marketId,
      deltaQty: actualDeltaQty,
      fees: { grossCents: fees.grossCents, spreadCents: fees.spreadCents, feeCents: fees.feeCents, totalCents: fees.totalCents },
    });
  } else {
    postings = buildSellPostings({
      userId,
      marketId,
      deltaQty: actualDeltaQty,
      fees: { grossCents: fees.grossCents, spreadCents: fees.spreadCents, feeCents: fees.feeCents, netCents: fees.netCents },
    });
  }

  // Apply each posting delta to the in-memory accounts ledger.
  for (const p of postings) {
    world.accounts.set(p.accountKey, (world.accounts.get(p.accountKey) || 0) + p.delta);
  }

  // Update world state to mirror what the real engine writes to MarketState.
  if (side === 'buy') {
    world.supply += actualDeltaQty;
    world.reserveCents += fees.grossCents + fees.spreadCents;
    world.positions.set(userId, (world.positions.get(userId) || 0) + actualDeltaQty);
  } else {
    world.supply -= actualDeltaQty;
    world.reserveCents -= (fees.grossCents - fees.spreadCents);
    world.positions.set(userId, (world.positions.get(userId) || 0) - actualDeltaQty);
  }
  world.dailyVolume.set(userId, (world.dailyVolume.get(userId) || 0) + grossCents);

  return { applied: true, trade: tradeForRisk, fees };
}

// ---------------------------------------------------------------------------
// assertInvariants — the five solvency proofs
// ---------------------------------------------------------------------------

/**
 * Assert all five invariants of the world. Throws immediately with a
 * descriptive message on the first violation — lets Jest surface it.
 *
 * @param {World} world
 */
function assertInvariants(world) {
  const { marketId, accounts, reserveCents, reserveFloorCents } = world;

  // 1 & 2: Σ cents == 0, Σ shares == 0.
  let centSum = 0, shareSum = 0;
  for (const [key, bal] of accounts) {
    const unit = unitOf(key);
    if (unit === 'cents') centSum += bal;
    else shareSum += bal;
  }
  if (centSum !== 0) {
    throw new Error(`Invariant violated: Σ cents accounts = ${centSum} (expected 0); supply=${world.supply} reserve=${reserveCents}`);
  }
  if (shareSum !== 0) {
    throw new Error(`Invariant violated: Σ shares accounts = ${shareSum} (expected 0); supply=${world.supply}`);
  }

  // 3: reserveCents >= reserveFloorCents.
  if (reserveCents < reserveFloorCents) {
    throw new Error(`Invariant violated: reserveCents(${reserveCents}) < reserveFloorCents(${reserveFloorCents})`);
  }

  // 4: reserveCents >= 0.
  if (reserveCents < 0) {
    throw new Error(`Invariant violated: reserveCents(${reserveCents}) < 0`);
  }

  // 5: market_reserve account balance === reserveCents.
  const reserveKey = `market_reserve:${marketId}`;
  const reserveAcct = accounts.get(reserveKey) || 0;
  if (reserveAcct !== reserveCents) {
    throw new Error(
      `Invariant violated: accounts.${reserveKey}(${reserveAcct}) !== reserveCents(${reserveCents})`
    );
  }
}

// ===========================================================================
// TEST-02: Invariant property tests
// ===========================================================================

describe('invariant property tests (TEST-02)', () => {
  const SEED = 12345;

  it(`holds all invariants after every op over a seeded randomised run (seed=${SEED})`, () => {
    console.log(`[TEST-02] seed=${SEED}`);
    const rng = mulberry32(SEED);

    const world = makeWorld({ tier: '1', P0_cents: 100, k_num: 1, k_den: 10, spreadBps: 50, feeBps: 100, reserveFloorCents: 10000 });

    // Fund a small pool of users with ample cash.
    const users = ['u1', 'u2', 'u3', 'u4', 'u5'];
    for (const u of users) {
      fundUser(world, u, 50_000_000); // $500,000 each — well within daily cap
    }

    // Bias toward buys early (70% buy) to build up inventory for sells.
    let applied = 0;
    let rejected = 0;
    const OPS = 500;

    for (let i = 0; i < OPS; i++) {
      const userId = pick(rng, users);
      // Weighted side: 0-0.69 → buy, 0.70-1 → sell.
      const side = rng() < 0.70 ? 'buy' : 'sell';

      let result;
      if (side === 'buy') {
        // Small qty — keep well within maxTradeCents(100000) and maxPositionQty(1000).
        const qty = randInt(rng, 1, 15);
        result = applyTrade(world, { userId, side: 'buy', deltaQty: qty });
      } else {
        const owned = world.positions.get(userId) || 0;
        if (owned === 0) {
          rejected++;
          continue;
        }
        const qty = randInt(rng, 1, owned);
        result = applyTrade(world, { userId, side: 'sell', deltaQty: qty });
      }

      if (result.applied) {
        applied++;
        // Assert after EVERY applied trade — this is the property proof.
        assertInvariants(world);
      } else {
        rejected++;
      }
    }

    // Final assertion on the end state.
    assertInvariants(world);
    console.log(`[TEST-02] applied=${applied} rejected=${rejected} finalReserve=${world.reserveCents} supply=${world.supply}`);
    expect(applied).toBeGreaterThan(0);
  });

  it('assertBalanced rejects a tampered (unbalanced) posting set', () => {
    // Build a valid buy-posting set, then corrupt one cents delta by +1.
    // assertBalanced must throw a LedgerError(500, 'Ledger postings do not sum to zero').
    const postings = buildBuyPostings({
      userId: 'user-test',
      marketId: 'market-test',
      deltaQty: 10,
      fees: {
        grossCents: 1000,
        spreadCents: 5,
        feeCents: 10,
        totalCents: 1015,
      },
    });

    // Tamper one cents delta to create an imbalance.
    const tampered = postings.map((p) =>
      p.accountKey === 'platform_fees' ? { ...p, delta: p.delta + 1 } : p
    );

    expect(() => assertBalanced(tampered)).toThrow();

    let caught;
    try {
      assertBalanced(tampered);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeDefined();
    expect(caught).toBeInstanceOf(LedgerError);
    expect(caught.statusCode).toBe(500);
    expect(caught.message).toBe('Ledger postings do not sum to zero');
  });
});

// ===========================================================================
// TEST-03: 10,000-trades-per-tier simulation
// ===========================================================================

describe('10000-trades-per-tier simulation (TEST-03)', () => {
  for (const tier of ['1', '2', '3']) {
    const SEED = 1000 + Number(tier);

    it(`tier ${tier}: 10000 trades stay solvent and balanced (seed=${SEED})`, () => {
      console.log(`[TEST-03] tier=${tier} seed=${SEED} starting`);

      const rng = mulberry32(SEED);

      // Tier-agnostic curve params (small curve so price stays predictable).
      // reserveFloorCents is modest to allow sells without immediately hitting the floor.
      const world = makeWorld({
        tier,
        P0_cents: 100,
        k_num: 1,
        k_den: 10,
        spreadBps: 50,
        feeBps: 100,
        reserveFloorCents: 10000,
      });

      // Fund a pool of 10 users generously — enough for 10k trades within daily caps.
      const NUM_USERS = 10;
      const users = Array.from({ length: NUM_USERS }, (_, i) => `tier${tier}-u${i}`);
      // Fund each user with enough cash to cover many buy trades.
      for (const u of users) {
        fundUser(world, u, 100_000_000); // $1,000,000 per user
      }

      let fillCount = 0;
      let rejectCount = 0;
      let minReserve = world.reserveCents;
      const ITERATIONS = 10000;

      for (let i = 0; i < ITERATIONS; i++) {
        const userId = pick(rng, users);
        const side = rng() < 0.65 ? 'buy' : 'sell';

        let result;
        if (side === 'buy') {
          // Keep qty small so a single trade never trips the price-move circuit breaker.
          // For all tiers, maxPositionQty and maxTradeCents are generous — small qty is safe.
          const qty = randInt(rng, 1, 50);
          result = applyTrade(world, { userId, side: 'buy', deltaQty: qty });
        } else {
          const owned = world.positions.get(userId) || 0;
          if (owned === 0) {
            rejectCount++;
            continue;
          }
          // Sell a random fraction of owned shares.
          const qty = randInt(rng, 1, Math.max(1, owned));
          result = applyTrade(world, { userId, side: 'sell', deltaQty: qty });
        }

        if (result.applied) {
          fillCount++;
          minReserve = Math.min(minReserve, world.reserveCents);
          // Assert invariants after EVERY applied trade — the per-op solvency proof.
          assertInvariants(world);
        } else {
          rejectCount++;
        }
      }

      // End-of-run: final invariant sweep.
      assertInvariants(world);

      // Penny-balanced ledger: sum all accounts by unit.
      let centSum = 0, shareSum = 0;
      for (const [key, bal] of world.accounts) {
        if (unitOf(key) === 'cents') centSum += bal;
        else shareSum += bal;
      }

      console.log(
        `[TEST-03] tier=${tier} seed=${SEED} fills=${fillCount} rejects=${rejectCount} ` +
        `minReserve=${minReserve} finalReserve=${world.reserveCents} supply=${world.supply}`
      );

      // Core assertions.
      expect(centSum).toBe(0);
      expect(shareSum).toBe(0);
      expect(world.reserveCents).toBeGreaterThanOrEqual(0);
      expect(minReserve).toBeGreaterThanOrEqual(world.reserveFloorCents);
      expect(fillCount).toBeGreaterThan(0);

    }, 30000); // generous timeout for 10k pure iterations
  }
});
