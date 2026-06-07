'use strict';

/**
 * flow.test.js — End-to-end HTTP walk (TEST-05)
 *
 * Proves the contract the frontend will consume:
 *   POST /quotes  → POST /orders (buy)  → GET /portfolio (position present)
 *   → POST /orders (sell) → GET /portfolio (reduced)
 *   + idempotency replay (same key → one trade, replayed:true)
 *   + quote-expiry rejection (409)
 *   + slippage rejection (409 on buy + sell)
 *
 * Scope: tests only — NO engine/API source edits.
 * Harness mirrors amm.test.js exactly.
 */

const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser, generateAuthToken } = require('../helpers/fixtures');
const { createTestMarket } = require('../helpers/ammFixtures');
const LedgerAccount = require('../../models/LedgerAccount');
const Trade = require('../../models/Trade');
const Market = require('../../models/Market');
const MarketState = require('../../models/MarketState');
const Order = require('../../models/Order');

const app = require('../../index');

// ============================================================
// DB lifecycle — mirrors amm.test.js
// ============================================================

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ============================================================
// End-to-end AMM flow (TEST-05)
// ============================================================

describe('end-to-end AMM flow (TEST-05)', () => {
  // Ensure all AMM models have indexes initialized before any txn (project gotcha)
  beforeEach(async () => {
    await Promise.all([
      Market.init(),
      MarketState.init(),
      Trade.init(),
      Order.init(),
      LedgerAccount.init(),
    ]);
  });

  it('walks quote -> buy -> portfolio -> sell -> portfolio', async () => {
    // ---- Setup ----
    const user = await createTestUser();
    const token = generateAuthToken(user._id);
    const { market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 });
    const mid = market._id.toString();

    // ---- Step 1: GET a buy quote (cashCents to stay under circuit breaker) ----
    const quoteRes = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: mid, side: 'buy', cashCents: 500 });

    expect(quoteRes.status).toBe(200);
    expect(quoteRes.body).toHaveProperty('quoteId');
    expect(quoteRes.body).toHaveProperty('avgPriceCents');
    expect(quoteRes.body).toHaveProperty('totalCents');     // buy shape
    expect(quoteRes.body).not.toHaveProperty('netCents');   // sell shape should be absent
    expect(quoteRes.body).toHaveProperty('expiresAt');
    // expiresAt must be in the future
    expect(new Date(quoteRes.body.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // ---- Step 2: Execute buy order ----
    const buyRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: mid,
        side: 'buy',
        cashCents: 500,
        idempotencyKey: `flow-buy-${Date.now()}`,
      });

    expect(buyRes.status).toBe(200);
    expect(buyRes.body).toHaveProperty('trade');
    expect(buyRes.body.trade).toHaveProperty('_id');
    expect(buyRes.body.trade.side).toBe('buy');
    expect(buyRes.body).toHaveProperty('balances');
    expect(buyRes.body.balances).toHaveProperty('cashCents');
    expect(buyRes.body.balances).toHaveProperty('positionQty');
    expect(buyRes.body.balances.positionQty).toBeGreaterThan(0);
    expect(buyRes.body.replayed).toBe(false);

    const boughtQty = buyRes.body.balances.positionQty;

    // ---- Step 3: GET /portfolio — position must be present ----
    const port1 = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${token}`);

    expect(port1.status).toBe(200);
    expect(port1.body).toHaveProperty('cashCents');
    expect(port1.body).toHaveProperty('positions');
    expect(port1.body).toHaveProperty('totalValueCents');
    expect(Array.isArray(port1.body.positions)).toBe(true);

    const pos1 = port1.body.positions.find(p => p.marketId === mid);
    expect(pos1).toBeDefined();
    expect(pos1.positionQty).toBe(boughtQty);
    expect(pos1.priceCents).toBeGreaterThan(0);
    expect(pos1.valueCents).toBeGreaterThan(0);

    // ---- Step 4: GET a sell quote (half of bought qty, at least 1) ----
    const sellQty = Math.max(1, Math.floor(boughtQty / 2));

    const sellQuoteRes = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: mid, side: 'sell', qty: sellQty });

    expect(sellQuoteRes.status).toBe(200);
    expect(sellQuoteRes.body).toHaveProperty('netCents');   // sell shape
    expect(sellQuoteRes.body).not.toHaveProperty('totalCents'); // buy shape should be absent

    // ---- Step 5: Execute sell order ----
    const sellRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: mid,
        side: 'sell',
        qty: sellQty,
        idempotencyKey: `flow-sell-${Date.now()}`,
      });

    expect(sellRes.status).toBe(200);
    expect(sellRes.body).toHaveProperty('trade');
    expect(sellRes.body.trade.side).toBe('sell');
    expect(sellRes.body.replayed).toBe(false);

    // ---- Step 6: GET /portfolio — position must be reduced ----
    const port2 = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${token}`);

    expect(port2.status).toBe(200);
    const pos2 = port2.body.positions.find(p => p.marketId === mid);

    const expectedRemainingQty = boughtQty - sellQty;

    if (expectedRemainingQty === 0) {
      // Position fully sold: may be absent or zero
      if (pos2) {
        expect(pos2.positionQty).toBe(0);
      }
      // else position removed entirely — also acceptable
    } else {
      expect(pos2).toBeDefined();
      expect(pos2.positionQty).toBe(expectedRemainingQty);
      expect(pos2.positionQty).toBeLessThan(boughtQty);
    }
  });

  it('same-idempotencyKey replay returns the identical trade (TEST-05)', async () => {
    // ---- Setup ----
    const user = await createTestUser();
    const token = generateAuthToken(user._id);
    const { market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 });
    const mid = market._id.toString();

    const ik = `flow-replay-${Date.now()}`;
    const body = {
      marketId: mid,
      side: 'buy',
      cashCents: 500,
      idempotencyKey: ik,
    };

    // ---- First execution ----
    const res1 = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res1.status).toBe(200);
    expect(res1.body.replayed).toBe(false);
    const tradeId1 = res1.body.trade._id;

    // ---- Replay with SAME idempotencyKey ----
    const res2 = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res2.status).toBe(200);
    // Must return the IDENTICAL trade
    expect(res2.body.trade._id).toBe(tradeId1);
    // Must be flagged as replayed
    expect(res2.body.replayed).toBe(true);

    // Only ONE Trade document must exist for this market
    const count = await Trade.countDocuments({ marketId: market._id });
    expect(count).toBe(1);
  });
});

// ============================================================
// Expiry + slippage rejection (TEST-05)
// ============================================================

describe('expiry + slippage rejection (TEST-05)', () => {
  // Ensure all AMM models have indexes initialized before any txn (project gotcha)
  beforeEach(async () => {
    await Promise.all([
      Market.init(),
      MarketState.init(),
      Trade.init(),
      Order.init(),
      LedgerAccount.init(),
    ]);
  });

  it('rejects a buy whose quote has expired (409)', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user._id);
    const { market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 });
    const mid = market._id.toString();

    // quoteExpiresAt in the past triggers a 409 at the orchestrator level
    // The Joi orderSchema accepts quoteExpiresAt as an ISO date
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: mid,
        side: 'buy',
        cashCents: 500,
        idempotencyKey: `flow-expired-${Date.now()}`,
        quoteExpiresAt: new Date(Date.now() - 60000).toISOString(), // 60 s in the past
      });

    expect(res.status).toBe(409);

    // No Trade should have been created
    const count = await Trade.countDocuments({ marketId: market._id });
    expect(count).toBe(0);
  });

  it('rejects a buy with maxCostCents below the real cost (409 slippage)', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user._id);
    const { market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 });
    const mid = market._id.toString();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: mid,
        side: 'buy',
        cashCents: 500,
        idempotencyKey: `flow-slip-buy-${Date.now()}`,
        maxCostCents: 1, // way too low — real cost will be ~500 cents
      });

    expect(res.status).toBe(409);
  });

  it('rejects a sell with minReceivedCents above the real payout (409 slippage)', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user._id);
    const { market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 });
    const mid = market._id.toString();

    // Give the user a position via a real buy first
    const buyRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: mid,
        side: 'buy',
        cashCents: 500,
        idempotencyKey: `flow-slip-seed-${Date.now()}`,
      });

    expect(buyRes.status).toBe(200);
    const positionQty = buyRes.body.balances.positionQty;
    expect(positionQty).toBeGreaterThan(0);

    // Now attempt a sell with an unreachably high minReceivedCents
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: mid,
        side: 'sell',
        qty: 1,
        idempotencyKey: `flow-slip-sell-${Date.now()}`,
        minReceivedCents: 999_999_999, // unreachably high
      });

    expect(res.status).toBe(409);
  });
});
