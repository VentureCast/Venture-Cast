'use strict';

/**
 * ledger.test.js — LEDG-01 / LEDG-02 / LEDG-03 for the double-entry ledger module.
 *
 * Two layers, mirroring services/amm/ledger/{postings,persist}.js:
 *
 *   A) PURE postings + balance (no DB — fast, < 1s):
 *      - buildBuyPostings / buildSellPostings produce per-unit sum-to-zero posting sets.
 *      - assertBalanced rejects any tampered (non-zero-sum) set BEFORE any write (LEDG-01/03).
 *      - Property test: random fee fixtures always yield balanced postings.
 *
 *   B) PERSISTENCE + projection (MongoMemoryReplSet):
 *      - postEntries(postings, tradeId, session) persists immutable LedgerEntry docs +
 *        $inc-upserts LedgerAccount projections, inside a caller-supplied session.
 *      - After commit, summing LedgerEntry.delta by accountKey === LedgerAccount.balance
 *        for every account (LEDG-02), and market_shares_outstanding === -Σ user_pos.
 */

const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { applyBuyFees, applySellFees } = require('../../services/amm/pricing/fees');

const {
  buildBuyPostings,
  buildSellPostings,
  assertBalanced,
  LedgerError,
} = require('../../services/amm/ledger');

const { postEntries } = require('../../services/amm/ledger');

// 24-char hex ObjectId strings (locked accountKey templates use ObjectId.toString()).
const UID = new mongoose.Types.ObjectId().toString();
const MID = new mongoose.Types.ObjectId().toString();

/** Sum the deltas of postings whose unit matches `unit`. */
function sumUnit(postings, unit) {
  return postings
    .filter((p) => p.unit === unit)
    .reduce((acc, p) => acc + p.delta, 0);
}

/** Find the single posting with a given accountKey. */
function pick(postings, accountKey) {
  return postings.find((p) => p.accountKey === accountKey);
}

// ---------------------------------------------------------------------------
// A) PURE postings + balance — no DB
// ---------------------------------------------------------------------------

describe('ledger postings (pure)', () => {
  describe('buildBuyPostings', () => {
    // Oracle: applyBuyFees(20500, {spreadBps:50, feeBps:100})
    //   → { grossCents:20500, spreadCents:103, feeCents:205, totalCents:20808 }
    const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
    const postings = buildBuyPostings({ userId: UID, marketId: MID, deltaQty: 100, fees });

    it('matches the buy fee oracle fixture', () => {
      expect(fees).toEqual({
        grossCents: 20500,
        spreadCents: 103,
        feeCents: 205,
        totalCents: 20808,
      });
    });

    it('posts cents entries that sum to zero (balanced)', () => {
      expect(pick(postings, `user_cash:${UID}`).delta).toBe(-20808);
      expect(pick(postings, `market_reserve:${MID}`).delta).toBe(20603); // 20500 + 103
      expect(pick(postings, 'platform_fees').delta).toBe(205);
      expect(sumUnit(postings, 'cents')).toBe(0);
    });

    it('posts shares entries that sum to zero (mint, balanced)', () => {
      expect(pick(postings, `user_pos:${UID}:${MID}`).delta).toBe(100);
      expect(pick(postings, `market_shares_outstanding:${MID}`).delta).toBe(-100);
      expect(sumUnit(postings, 'shares')).toBe(0);
    });

    it('tags every posting with a valid unit', () => {
      for (const p of postings) {
        expect(['cents', 'shares']).toContain(p.unit);
      }
      expect(pick(postings, `user_cash:${UID}`).unit).toBe('cents');
      expect(pick(postings, `market_reserve:${MID}`).unit).toBe('cents');
      expect(pick(postings, 'platform_fees').unit).toBe('cents');
      expect(pick(postings, `user_pos:${UID}:${MID}`).unit).toBe('shares');
      expect(pick(postings, `market_shares_outstanding:${MID}`).unit).toBe('shares');
    });
  });

  describe('buildSellPostings', () => {
    // Oracle: applySellFees(20500, {spreadBps:50, feeBps:100})
    //   → { grossCents:20500, spreadCents:103, feeCents:205, netCents:20192 }
    const fees = applySellFees(20500, { spreadBps: 50, feeBps: 100 });
    const postings = buildSellPostings({ userId: UID, marketId: MID, deltaQty: 100, fees });

    it('matches the sell fee oracle fixture', () => {
      expect(fees).toEqual({
        grossCents: 20500,
        spreadCents: 103,
        feeCents: 205,
        netCents: 20192,
      });
    });

    it('posts cents entries that sum to zero (balanced)', () => {
      expect(pick(postings, `user_cash:${UID}`).delta).toBe(20192);
      expect(pick(postings, `market_reserve:${MID}`).delta).toBe(-20397); // -(20500 - 103)
      expect(pick(postings, 'platform_fees').delta).toBe(205);
      expect(sumUnit(postings, 'cents')).toBe(0);
    });

    it('posts shares entries that sum to zero (burn, balanced)', () => {
      expect(pick(postings, `user_pos:${UID}:${MID}`).delta).toBe(-100);
      expect(pick(postings, `market_shares_outstanding:${MID}`).delta).toBe(100);
      expect(sumUnit(postings, 'shares')).toBe(0);
    });
  });

  describe('assertBalanced rejection (LEDG-03)', () => {
    it('returns without throwing for a valid set', () => {
      const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
      const postings = buildBuyPostings({ userId: UID, marketId: MID, deltaQty: 100, fees });
      expect(() => assertBalanced(postings)).not.toThrow();
    });

    it('rejects a set whose cents group does not sum to zero', () => {
      const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
      const postings = buildBuyPostings({ userId: UID, marketId: MID, deltaQty: 100, fees });
      // Tamper ONE cents delta by +1 → cents group no longer sums to zero.
      const tampered = postings.map((p) => ({ ...p }));
      pick(tampered, 'platform_fees').delta += 1;
      expect(() => assertBalanced(tampered)).toThrow(LedgerError);
    });

    it('rejects a set whose shares group does not sum to zero', () => {
      const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
      const postings = buildBuyPostings({ userId: UID, marketId: MID, deltaQty: 100, fees });
      const tampered = postings.map((p) => ({ ...p }));
      pick(tampered, `user_pos:${UID}:${MID}`).delta += 1;
      expect(() => assertBalanced(tampered)).toThrow(LedgerError);
    });

    it('rejects postings with a non-integer delta', () => {
      const bad = [
        { accountKey: 'platform_fees', delta: 1.5, unit: 'cents' },
        { accountKey: 'user_cash:x', delta: -1.5, unit: 'cents' },
      ];
      expect(() => assertBalanced(bad)).toThrow(LedgerError);
    });
  });

  describe('property: random fee fixtures are always balanced', () => {
    it('keeps cents and shares groups summing to zero for ~50 random trades', () => {
      for (let i = 0; i < 50; i += 1) {
        const deltaQty = 1 + Math.floor(Math.random() * 5000);
        const grossCents = 100 + Math.floor(Math.random() * 5_000_000);

        const buyFees = applyBuyFees(grossCents, { spreadBps: 50, feeBps: 100 });
        const buyPostings = buildBuyPostings({ userId: UID, marketId: MID, deltaQty, fees: buyFees });
        expect(sumUnit(buyPostings, 'cents')).toBe(0);
        expect(sumUnit(buyPostings, 'shares')).toBe(0);
        expect(() => assertBalanced(buyPostings)).not.toThrow();

        const sellFees = applySellFees(grossCents, { spreadBps: 50, feeBps: 100 });
        const sellPostings = buildSellPostings({ userId: UID, marketId: MID, deltaQty, fees: sellFees });
        expect(sumUnit(sellPostings, 'cents')).toBe(0);
        expect(sumUnit(sellPostings, 'shares')).toBe(0);
        expect(() => assertBalanced(sellPostings)).not.toThrow();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// B) PERSISTENCE + projection — MongoMemoryReplSet
// ---------------------------------------------------------------------------

describe('postEntries persistence + projection (LEDG-02)', () => {
  let LedgerEntry;
  let LedgerAccount;

  beforeAll(async () => {
    await connectTestDB();

    LedgerEntry = require('../../models/LedgerEntry');
    LedgerAccount = require('../../models/LedgerAccount');

    // CRITICAL: init both txn-involved models before any transaction runs.
    await Promise.all([LedgerEntry.init(), LedgerAccount.init()]);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  /** Run postEntries inside a real session/transaction owned by the TEST (not persist.js). */
  async function postInTransaction(postings, tradeId) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await postEntries(postings, tradeId, session);
      });
    } finally {
      session.endSession();
    }
  }

  it('reconstructs LedgerAccount.balance by summing LedgerEntry.delta per accountKey', async () => {
    // Three random buys against the same user/market.
    const userId = new mongoose.Types.ObjectId().toString();
    const marketId = new mongoose.Types.ObjectId().toString();

    for (let i = 0; i < 3; i += 1) {
      const deltaQty = 1 + Math.floor(Math.random() * 200);
      const grossCents = 1000 + Math.floor(Math.random() * 500000);
      const fees = applyBuyFees(grossCents, { spreadBps: 50, feeBps: 100 });
      const postings = buildBuyPostings({ userId, marketId, deltaQty, fees });
      const tradeId = new mongoose.Types.ObjectId();
      await postInTransaction(postings, tradeId);
    }

    // For every account, the projection must equal the sum of its entries.
    const accounts = await LedgerAccount.find({}).lean();
    expect(accounts.length).toBeGreaterThan(0);

    for (const acct of accounts) {
      const entries = await LedgerEntry.find({ accountKey: acct.accountKey }).lean();
      const sum = entries.reduce((acc, e) => acc + e.delta, 0);
      expect(acct.balance).toBe(sum);
    }
  });

  it('makes market_shares_outstanding the negative of summed user_pos (mint/burn counterparty)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const marketId = new mongoose.Types.ObjectId().toString();

    // Two buys (mint) then one sell (burn).
    const ops = [
      { kind: 'buy', deltaQty: 50, grossCents: 50000 },
      { kind: 'buy', deltaQty: 30, grossCents: 31000 },
      { kind: 'sell', deltaQty: 20, grossCents: 21000 },
    ];

    for (const op of ops) {
      const fees = op.kind === 'buy'
        ? applyBuyFees(op.grossCents, { spreadBps: 50, feeBps: 100 })
        : applySellFees(op.grossCents, { spreadBps: 50, feeBps: 100 });
      const postings = op.kind === 'buy'
        ? buildBuyPostings({ userId, marketId, deltaQty: op.deltaQty, fees })
        : buildSellPostings({ userId, marketId, deltaQty: op.deltaQty, fees });
      await postInTransaction(postings, new mongoose.Types.ObjectId());
    }

    const userPos = await LedgerAccount.findOne({ accountKey: `user_pos:${userId}:${marketId}` }).lean();
    const outstanding = await LedgerAccount.findOne({ accountKey: `market_shares_outstanding:${marketId}` }).lean();

    expect(userPos.balance).toBe(60); // 50 + 30 - 20
    expect(outstanding.balance).toBe(-userPos.balance);
  });

  it('persists entries via a session and reflects them in projections', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const marketId = new mongoose.Types.ObjectId().toString();
    const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
    const postings = buildBuyPostings({ userId, marketId, deltaQty: 100, fees });
    const tradeId = new mongoose.Types.ObjectId();

    await postInTransaction(postings, tradeId);

    const entries = await LedgerEntry.find({ tradeId }).lean();
    expect(entries.length).toBe(postings.length);

    const platform = await LedgerAccount.findOne({ accountKey: 'platform_fees' }).lean();
    expect(platform.balance).toBe(205);
    expect(platform.unit).toBe('cents');
  });

  it('throws (before any write) when given an unbalanced set', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const marketId = new mongoose.Types.ObjectId().toString();
    const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
    const postings = buildBuyPostings({ userId, marketId, deltaQty: 100, fees });
    const tampered = postings.map((p) => ({ ...p }));
    tampered.find((p) => p.accountKey === 'platform_fees').delta += 1;

    await expect(postInTransaction(tampered, new mongoose.Types.ObjectId())).rejects.toThrow(LedgerError);

    // No write should have leaked.
    const entries = await LedgerEntry.find({}).lean();
    expect(entries.length).toBe(0);
  });

  it('throws when called without a session', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const marketId = new mongoose.Types.ObjectId().toString();
    const fees = applyBuyFees(20500, { spreadBps: 50, feeBps: 100 });
    const postings = buildBuyPostings({ userId, marketId, deltaQty: 100, fees });

    await expect(postEntries(postings, new mongoose.Types.ObjectId(), null)).rejects.toThrow(LedgerError);
  });
});
