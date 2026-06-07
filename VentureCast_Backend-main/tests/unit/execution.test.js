'use strict';

/**
 * execution.test.js — Phase 4 keystone money path (EXEC-01..04 + conservation).
 *
 * Real MongoMemoryReplSet (multi-doc transactions). Drives the atomic
 * executeOrder() orchestrator that composes pricing + risk + ledger behind ONE
 * Mongoose transaction with optimistic version locking, bounded retry,
 * idempotency, quote expiry, and slippage enforcement.
 *
 * describe blocks (titles match the VALIDATION -t patterns):
 *   1. idempotency …            — EXEC-03
 *   2. atomicity / rollback …   — EXEC-01
 *   3. version / concurrency …  — EXEC-02
 *   4. expiry / slippage …      — EXEC-04
 *   5. conservation invariants  — property
 */

const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestMarket } = require('../helpers/ammFixtures');

let executeOrder, ExecutionError, priceTrade;
let Market, MarketState, LedgerAccount, LedgerEntry, Order, Trade, RiskEvent;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a fresh ObjectId string (AMM positions live in the ledger, not on User). */
function newId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Seed a user's cash with a one-off balanced funding posting so reserve/cash
 * conservation reads cleanly: debit platform_funding, credit user_cash.
 * Written outside any execution transaction (plain $inc upserts + entries).
 */
async function fundUserCash(userId, cents) {
  const userKey = `user_cash:${userId}`;
  await new LedgerEntry({ tradeId: null, accountKey: 'platform_funding', delta: -cents, unit: 'cents', note: 'test funding debit' }).save();
  await new LedgerEntry({ tradeId: null, accountKey: userKey, delta: cents, unit: 'cents', note: 'test funding credit' }).save();
  await LedgerAccount.findOneAndUpdate(
    { accountKey: 'platform_funding' },
    { $inc: { balance: -cents }, $setOnInsert: { unit: 'cents' } },
    { upsert: true, new: true }
  );
  await LedgerAccount.findOneAndUpdate(
    { accountKey: userKey },
    { $inc: { balance: cents }, $setOnInsert: { unit: 'cents' } },
    { upsert: true, new: true }
  );
}

/** LedgerAccount balance for an accountKey (0 if the account does not exist). */
async function accountBalance(accountKey) {
  const acct = await LedgerAccount.findOne({ accountKey });
  return acct ? acct.balance : 0;
}

/** Sum LedgerEntry.delta over a unit ('cents' | 'shares'). */
async function sumLedger(unit) {
  const rows = await LedgerEntry.aggregate([
    { $match: { unit } },
    { $group: { _id: null, total: { $sum: '$delta' } } },
  ]);
  return rows.length ? rows[0].total : 0;
}

/** Build common executeOrder args for a buy. */
function buyArgs(userId, marketId, qty, extra = {}) {
  return { userId, marketId, side: 'buy', qty, idempotencyKey: newId(), ...extra };
}

/** Build common executeOrder args for a sell. */
function sellArgs(userId, marketId, qty, extra = {}) {
  return { userId, marketId, side: 'sell', qty, idempotencyKey: newId(), ...extra };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await connectTestDB();

  // Import AFTER DB connection so models register against the live connection.
  ({ executeOrder, ExecutionError, priceTrade } = require('../../services/amm/execution'));

  Market        = require('../../models/Market');
  MarketState   = require('../../models/MarketState');
  LedgerAccount = require('../../models/LedgerAccount');
  LedgerEntry   = require('../../models/LedgerEntry');
  Order         = require('../../models/Order');
  Trade         = require('../../models/Trade');
  RiskEvent     = require('../../models/RiskEvent');

  // CRITICAL: init every txn-involved model BEFORE any transaction runs.
  await Promise.all([
    Market.init(),
    MarketState.init(),
    LedgerAccount.init(),
    LedgerEntry.init(),
    Order.init(),
    Trade.init(),
    RiskEvent.init(),
  ]);
});

afterEach(async () => {
  await clearTestDB();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ===========================================================================
// 1. idempotency — EXEC-03
// ===========================================================================

describe('idempotency (EXEC-03)', () => {
  it('replaying the same idempotencyKey returns the SAME Trade and does not re-execute', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    const key = newId();
    const args = { userId, marketId: market._id.toString(), side: 'buy', qty: 50, idempotencyKey: key };

    const first = await executeOrder(args);
    const ms1 = await MarketState.findById(marketState._id);

    const second = await executeOrder(args);
    const ms2 = await MarketState.findById(marketState._id);

    expect(String(first.trade._id)).toBe(String(second.trade._id));
    expect(await Trade.countDocuments({})).toBe(1);
    // No state change on replay.
    expect(ms2.supply).toBe(ms1.supply);
    expect(ms2.reserveCents).toBe(ms1.reserveCents);
    expect(ms2.version).toBe(ms1.version);
  });

  it('idempotency RACE: concurrent same-key executeOrder yields exactly one Trade', async () => {
    const { market } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    const key = newId();
    const args = { userId, marketId: market._id.toString(), side: 'buy', qty: 40, idempotencyKey: key };

    const results = await Promise.all([executeOrder({ ...args }), executeOrder({ ...args })]);

    expect(await Trade.countDocuments({})).toBe(1);
    expect(String(results[0].trade._id)).toBe(String(results[1].trade._id));
    expect(await Order.countDocuments({})).toBe(1);
  });
});

// ===========================================================================
// 2. atomicity / rollback — EXEC-01
// ===========================================================================

describe('atomicity / rollback (EXEC-01)', () => {
  it('a buy commits MarketState + 5 LedgerEntries + Trade + Order together', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    const before = await MarketState.findById(marketState._id);

    const { trade } = await executeOrder(buyArgs(userId, market._id.toString(), 100));

    const after = await MarketState.findById(marketState._id);
    expect(after.supply).toBe(before.supply + 100);
    expect(after.version).toBe(before.version + 1);
    expect(after.reserveCents).toBeGreaterThan(before.reserveCents);

    expect(await Trade.countDocuments({})).toBe(1);
    expect(await Order.countDocuments({ status: 'filled' })).toBe(1);
    // 5 ledger entries for the trade (3 cents + 2 shares).
    expect(await LedgerEntry.countDocuments({ tradeId: trade._id })).toBe(5);
  });

  it('injected mid-trade failure (late write throws) → ZERO partial writes', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    const before = await MarketState.findById(marketState._id);

    // Spy a LATE write — the optimistic version updateOne — to throw once.
    const spy = jest
      .spyOn(MarketState, 'updateOne')
      .mockImplementationOnce(() => { throw new Error('injected late-write failure'); });

    await expect(
      executeOrder(buyArgs(userId, market._id.toString(), 100))
    ).rejects.toThrow('injected late-write failure');

    spy.mockRestore();

    const after = await MarketState.findById(marketState._id);
    expect(after.supply).toBe(before.supply);
    expect(after.reserveCents).toBe(before.reserveCents);
    expect(after.version).toBe(before.version);

    expect(await Trade.countDocuments({})).toBe(0);
    expect(await Order.countDocuments({})).toBe(0);
    // No trade-scoped ledger entries (only the funding entries remain).
    expect(await LedgerEntry.countDocuments({ tradeId: { $ne: null } })).toBe(0);
  });
});

// ===========================================================================
// 3. version / concurrency — EXEC-02
// ===========================================================================

describe('version / concurrency (EXEC-02)', () => {
  it('N concurrent buys on one market all succeed with no lost update (version += N)', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 100000000);

    const N = 5;
    const qty = 20;
    const before = await MarketState.findById(marketState._id);

    const args = Array.from({ length: N }, () => buyArgs(userId, market._id.toString(), qty));
    await Promise.all(args.map((a) => executeOrder(a)));

    const after = await MarketState.findById(marketState._id);
    // Final supply == serial-equivalent sum of deltas.
    expect(after.supply).toBe(before.supply + N * qty);
    // Version incremented exactly once per successful write.
    expect(after.version).toBe(before.version + N);
    expect(await Trade.countDocuments({})).toBe(N);

    // Reserve == serial-equivalent: equal to the sum of every commit's reserve delta,
    // i.e. final reserve == MarketState projection.
    expect(after.reserveCents).toBe(await accountBalance(`market_reserve:${market._id}`));
  });

  it('stale version (out-of-band bump) still resolves: executeOrder retries and lands consistently', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    // Bump the version out-of-band to simulate a concurrent writer.
    await MarketState.updateOne({ _id: marketState._id }, { $inc: { version: 1 } });
    const before = await MarketState.findById(marketState._id);

    const { trade } = await executeOrder(buyArgs(userId, market._id.toString(), 30));

    const after = await MarketState.findById(marketState._id);
    expect(after.version).toBe(before.version + 1);
    expect(after.supply).toBe(before.supply + 30);
    expect(trade.qty).toBe(30);
  });
});

// ===========================================================================
// 4. expiry / slippage (maxCost / minReceived) — EXEC-04
// ===========================================================================

describe('expiry / slippage (maxCost / minReceived) (EXEC-04)', () => {
  it('a quote whose expiry is in the past is rejected 409 with no writes', async () => {
    const { market } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    const past = new Date(Date.now() - 60000);
    await expect(
      executeOrder(buyArgs(userId, market._id.toString(), 10, { quoteExpiresAt: past }))
    ).rejects.toMatchObject({ name: 'ExecutionError', statusCode: 409 });

    expect(await Trade.countDocuments({})).toBe(0);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('buy with maxCostCents below the re-priced totalCents is rejected 409 (slippage), no writes', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    const before = await MarketState.findById(marketState._id);

    // Re-price a buy of 100 to know the real total, then set maxCost just below it.
    const priced = priceTrade(market, before, 'buy', { qty: 100 });
    await expect(
      executeOrder(buyArgs(userId, market._id.toString(), 100, { maxCostCents: priced.totalCents - 1 }))
    ).rejects.toMatchObject({ name: 'ExecutionError', statusCode: 409 });

    const after = await MarketState.findById(marketState._id);
    expect(after.version).toBe(before.version);
    expect(await Trade.countDocuments({})).toBe(0);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('sell with minReceivedCents above the re-priced netCents is rejected 409 (slippage), no writes', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 10000000);

    // Seed a position by buying first.
    await executeOrder(buyArgs(userId, market._id.toString(), 100));
    const before = await MarketState.findById(marketState._id);

    const priced = priceTrade(market, before, 'sell', { qty: 50 });
    await expect(
      executeOrder(sellArgs(userId, market._id.toString(), 50, { minReceivedCents: priced.netCents + 1 }))
    ).rejects.toMatchObject({ name: 'ExecutionError', statusCode: 409 });

    const after = await MarketState.findById(marketState._id);
    expect(after.version).toBe(before.version);
    // Only the seeding buy's Trade exists.
    expect(await Trade.countDocuments({})).toBe(1);
  });
});

// ===========================================================================
// 5. conservation invariants — property
// ===========================================================================

describe('conservation invariants', () => {
  it('after a sequence of buys/sells the ledger sums to zero and projections match state', async () => {
    const { market, marketState } = await createTestMarket();
    const userId = newId();
    await fundUserCash(userId, 100000000);

    const mid = market._id.toString();

    await executeOrder(buyArgs(userId, mid, 100));
    await executeOrder(buyArgs(userId, mid, 50));
    await executeOrder(sellArgs(userId, mid, 30));
    await executeOrder(buyArgs(userId, mid, 20));
    await executeOrder(sellArgs(userId, mid, 40));

    const ms = await MarketState.findById(marketState._id);

    // Σ all LedgerEntry deltas == 0 for each unit (double-entry).
    expect(await sumLedger('cents')).toBe(0);
    expect(await sumLedger('shares')).toBe(0);

    // market_reserve projection == MarketState.reserveCents.
    expect(await accountBalance(`market_reserve:${mid}`)).toBe(ms.reserveCents);

    // Σ user_pos == supply (single user here → user_pos == supply).
    expect(await accountBalance(`user_pos:${userId}:${mid}`)).toBe(ms.supply);

    // Reserve never below floor.
    expect(ms.reserveCents).toBeGreaterThanOrEqual(ms.reserveFloorCents);
  });

  it('a reserve-floor-breaching sell is rejected by risk, writes NOTHING, and records a RiskEvent', async () => {
    // Build a position with small buys (each well within the circuit breaker), then RAISE the
    // reserve floor out-of-band so even a modest sell would drain the reserve below the floor —
    // RISK-05 (dynamic sell cap) / RISK-04 (reserve floor) must reject it.
    const { market, marketState } = await createTestMarket({ reserveFloorCents: 10000 });
    const userId = newId();
    await fundUserCash(userId, 100000000);
    const mid = market._id.toString();

    // Build the position incrementally so no single buy trips the price-move breaker.
    for (let i = 0; i < 6; i++) {
      await executeOrder(buyArgs(userId, mid, 10));
    }

    // Raise the floor to just below current reserve so almost no sell headroom remains.
    let cur = await MarketState.findById(marketState._id);
    const newFloor = cur.reserveCents - 50; // leave only 50c of headroom above the floor
    await MarketState.updateOne({ _id: cur._id }, { $set: { reserveFloorCents: newFloor } });

    const before = await MarketState.findById(marketState._id);
    const tradesBefore = await Trade.countDocuments({});
    const entriesBefore = await LedgerEntry.countDocuments({});

    // A sell of 10 shares drains far more than 50c from the reserve → exceeds headroom.
    await expect(
      executeOrder(sellArgs(userId, mid, 10))
    ).rejects.toMatchObject({ name: 'RiskError' });

    const after = await MarketState.findById(marketState._id);
    expect(after.version).toBe(before.version);
    expect(after.supply).toBe(before.supply);
    expect(after.reserveCents).toBe(before.reserveCents);
    // No new Trade or LedgerEntry from the rejected sell.
    expect(await Trade.countDocuments({})).toBe(tradesBefore);
    expect(await LedgerEntry.countDocuments({})).toBe(entriesBefore);
    // The rejection is durably recorded.
    expect(await RiskEvent.countDocuments({})).toBeGreaterThanOrEqual(1);
  });
});
