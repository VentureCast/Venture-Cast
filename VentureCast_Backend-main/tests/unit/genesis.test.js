'use strict';

/**
 * genesis.test.js — LEDG-04 atomicity gate
 *
 * Covers:
 *   LEDG-04a: Model.init() succeeds for all nine transaction-involved AMM models
 *   LEDG-04b: openMarket() creates Market + MarketState at s0=0, price=P0, version=0
 *   LEDG-04c: Genesis posts two balanced LedgerEntries summing to zero
 *   LEDG-04d: Genesis is atomic — abort leaves zero docs in all four collections
 */

const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');

let openMarket, GenesisError;
let Market, MarketState, LedgerAccount, LedgerEntry, Order, Trade;
let PriceCandle, RiskEvent, AdminAction;

const FLOOR_CENTS = 10000; // $100.00 in cents
const P0_CENTS = 100;      // $1.00 in cents

beforeAll(async () => {
  await connectTestDB();

  // Import AFTER DB connection — required for models to register against the live connection
  ({ openMarket, GenesisError } = require('../../services/amm/genesisService'));

  Market       = require('../../models/Market');
  MarketState  = require('../../models/MarketState');
  LedgerAccount = require('../../models/LedgerAccount');
  LedgerEntry  = require('../../models/LedgerEntry');
  Order        = require('../../models/Order');
  Trade        = require('../../models/Trade');
  PriceCandle  = require('../../models/PriceCandle');
  RiskEvent    = require('../../models/RiskEvent');
  AdminAction  = require('../../models/AdminAction');

  // CRITICAL: init ALL nine txn-involved models before any transaction runs.
  // Without this, Mongoose lazy collection creation fires inside a transaction
  // and MongoDB rejects DDL operations mid-txn.
  await Promise.all([
    Market.init(),
    MarketState.init(),
    LedgerAccount.init(),
    LedgerEntry.init(),
    Order.init(),
    Trade.init(),
    PriceCandle.init(),
    RiskEvent.init(),
    AdminAction.init(),
  ]);
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ---------------------------------------------------------------------------
// LEDG-04a: Model.init
// ---------------------------------------------------------------------------
describe('Model.init', () => {
  it('resolves for all nine AMM models without throwing', async () => {
    // If beforeAll reached here without throwing, all nine Model.init() calls succeeded.
    // Also verify the constructors are valid Mongoose models.
    expect(typeof Market.modelName).toBe('string');
    expect(typeof MarketState.modelName).toBe('string');
    expect(typeof LedgerAccount.modelName).toBe('string');
    expect(typeof LedgerEntry.modelName).toBe('string');
    expect(typeof Order.modelName).toBe('string');
    expect(typeof Trade.modelName).toBe('string');
    expect(typeof PriceCandle.modelName).toBe('string');
    expect(typeof RiskEvent.modelName).toBe('string');
    expect(typeof AdminAction.modelName).toBe('string');

    // Confirm model names are registered
    expect(Market.modelName).toBe('Market');
    expect(MarketState.modelName).toBe('MarketState');
    expect(LedgerAccount.modelName).toBe('LedgerAccount');
    expect(LedgerEntry.modelName).toBe('LedgerEntry');
  });
});

// ---------------------------------------------------------------------------
// LEDG-04b: genesis creates
// ---------------------------------------------------------------------------
describe('genesis creates', () => {
  it('returns Market and MarketState with supply=0, price=P0, version=0', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    const { market, marketState } = await openMarket({
      streamerId,
      P0_cents: P0_CENTS,
      k_num: 1,
      k_den: 10,
      tier: '1',
      spreadBps: 50,
      feeBps: 100,
      reserveFloorCents: FLOOR_CENTS,
    });

    // Market assertions
    expect(market).toBeDefined();
    expect(market._id).toBeDefined();
    expect(market.streamerId.toString()).toBe(streamerId);
    expect(market.P0_cents).toBe(P0_CENTS);
    expect(market.tier).toBe('1');
    expect(market.status).toBe('active');

    // MarketState assertions — genesis invariants
    expect(marketState).toBeDefined();
    expect(marketState.marketId.toString()).toBe(market._id.toString());
    expect(marketState.supply).toBe(0);                    // s0 = 0
    expect(marketState.lastPriceCents).toBe(P0_CENTS);     // price = P0
    expect(marketState.version).toBe(0);                   // version = 0
    expect(marketState.reserveCents).toBe(FLOOR_CENTS);    // seeded to floor
    expect(marketState.reserveFloorCents).toBe(FLOOR_CENTS);

    // Confirm persisted to DB
    const dbMarket = await Market.findById(market._id).lean();
    expect(dbMarket).not.toBeNull();

    const dbState = await MarketState.findOne({ marketId: market._id }).lean();
    expect(dbState).not.toBeNull();
    expect(dbState.supply).toBe(0);
    expect(dbState.version).toBe(0);
    expect(dbState.lastPriceCents).toBe(P0_CENTS);
    expect(dbState.reserveCents).toBe(FLOOR_CENTS);
    expect(dbState.reserveFloorCents).toBe(FLOOR_CENTS);
  });

  it('throws GenesisError(400) when reserveFloorCents is missing', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: undefined })
    ).rejects.toThrow('reserveFloorCents must be a positive integer');

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: undefined })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws GenesisError(400) when reserveFloorCents is zero or negative', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: 0 })
    ).rejects.toThrow('reserveFloorCents must be a positive integer');

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: -500 })
    ).rejects.toThrow('reserveFloorCents must be a positive integer');
  });

  it('throws GenesisError(400) when reserveFloorCents is a non-integer', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: 99.5 })
    ).rejects.toThrow('reserveFloorCents must be a positive integer');
  });
});

// ---------------------------------------------------------------------------
// LEDG-04c: ledger sum
// ---------------------------------------------------------------------------
describe('ledger sum', () => {
  it('creates exactly two LedgerEntries summing to zero with correct account keys', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    const { market } = await openMarket({
      streamerId,
      P0_cents: P0_CENTS,
      k_num: 1,
      k_den: 10,
      tier: '1',
      spreadBps: 50,
      feeBps: 100,
      reserveFloorCents: FLOOR_CENTS,
    });

    // Exactly two entries
    const entries = await LedgerEntry.find({}).lean();
    expect(entries).toHaveLength(2);

    // Sum to zero (double-entry invariant)
    const total = entries.reduce((sum, e) => sum + e.delta, 0);
    expect(total).toBe(0);

    // Debit entry: platform_funding
    const debit = entries.find(e => e.accountKey === 'platform_funding');
    expect(debit).toBeDefined();
    expect(debit.delta).toBe(-FLOOR_CENTS);
    expect(debit.unit).toBe('cents');

    // Credit entry: market_reserve:<marketId>
    const reserveKey = `market_reserve:${market._id}`;
    const credit = entries.find(e => e.accountKey === reserveKey);
    expect(credit).toBeDefined();
    expect(credit.delta).toBe(FLOOR_CENTS);
    expect(credit.unit).toBe('cents');

    // Both entries have no tradeId (genesis entries)
    expect(debit.tradeId).toBeNull();
    expect(credit.tradeId).toBeNull();
  });

  it('creates LedgerAccount projections matching the entry deltas', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    const { market } = await openMarket({
      streamerId,
      P0_cents: P0_CENTS,
      k_num: 1,
      k_den: 10,
      tier: '1',
      spreadBps: 50,
      feeBps: 100,
      reserveFloorCents: FLOOR_CENTS,
    });

    // platform_funding account: balance = -10000 (debited)
    const fundingAccount = await LedgerAccount.findOne({ accountKey: 'platform_funding' }).lean();
    expect(fundingAccount).not.toBeNull();
    expect(fundingAccount.balance).toBe(-FLOOR_CENTS);
    expect(fundingAccount.unit).toBe('cents');

    // market_reserve:<id> account: balance = +10000 (credited)
    const reserveKey = `market_reserve:${market._id}`;
    const reserveAccount = await LedgerAccount.findOne({ accountKey: reserveKey }).lean();
    expect(reserveAccount).not.toBeNull();
    expect(reserveAccount.balance).toBe(FLOOR_CENTS);
    expect(reserveAccount.unit).toBe('cents');
  });
});

// ---------------------------------------------------------------------------
// LEDG-04d: atomic rollback
// ---------------------------------------------------------------------------
describe('atomic rollback', () => {
  it('leaves zero docs across all collections when genesis is called with invalid params', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    // Trigger validation error before any writes — reserveFloorCents omitted
    await expect(
      openMarket({ streamerId, P0_cents: 100 })
    ).rejects.toMatchObject({ statusCode: 400 });

    // All collections must be empty — no partial writes
    expect(await Market.countDocuments()).toBe(0);
    expect(await MarketState.countDocuments()).toBe(0);
    expect(await LedgerEntry.countDocuments()).toBe(0);
    expect(await LedgerAccount.countDocuments()).toBe(0);
  });

  it('rolls back Market + MarketState already written when a later in-transaction write throws', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    // Force the FIRST ledger posting to throw AFTER Market + MarketState have already
    // been saved inside the transaction. This exercises a TRUE mid-transaction abort:
    // documents written earlier in the session must be rolled back (not just a
    // pre-session param-guard rejection, which writes nothing).
    const saveSpy = jest
      .spyOn(LedgerEntry.prototype, 'save')
      .mockRejectedValueOnce(new Error('injected mid-transaction failure'));

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: FLOOR_CENTS })
    ).rejects.toThrow('injected mid-transaction failure');

    saveSpy.mockRestore();

    // Market.save() and MarketState.save() executed before the injected failure, yet the
    // aborted transaction must leave ZERO documents across every collection.
    expect(await Market.countDocuments()).toBe(0);
    expect(await MarketState.countDocuments()).toBe(0);
    expect(await LedgerEntry.countDocuments()).toBe(0);
    expect(await LedgerAccount.countDocuments()).toBe(0);
  });

  it('rejects a non-integer reserveFloorCents at the param guard (no writes)', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    await expect(
      openMarket({ streamerId, P0_cents: 100, reserveFloorCents: 9999.99 })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(await Market.countDocuments()).toBe(0);
    expect(await MarketState.countDocuments()).toBe(0);
  });

  it('fully commits on success and leaves all four collections with docs', async () => {
    const mongoose = require('mongoose');
    const streamerId = new mongoose.Types.ObjectId().toString();

    await openMarket({
      streamerId,
      P0_cents: P0_CENTS,
      k_num: 1,
      k_den: 10,
      tier: '1',
      spreadBps: 50,
      feeBps: 100,
      reserveFloorCents: FLOOR_CENTS,
    });

    expect(await Market.countDocuments()).toBe(1);
    expect(await MarketState.countDocuments()).toBe(1);
    expect(await LedgerEntry.countDocuments()).toBe(2);
    expect(await LedgerAccount.countDocuments()).toBe(2);
  });
});
