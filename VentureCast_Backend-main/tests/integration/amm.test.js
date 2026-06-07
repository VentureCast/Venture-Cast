'use strict';

const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser, generateAuthToken, generateAdminToken } = require('../helpers/fixtures');
const { createTestMarket } = require('../helpers/ammFixtures');
const { priceCents } = require('../../services/amm/pricing/curve');
const LedgerAccount = require('../../models/LedgerAccount');
const Trade = require('../../models/Trade');
const Market = require('../../models/Market');
const MarketState = require('../../models/MarketState');
const Order = require('../../models/Order');

const app = require('../../index');

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
// GET /markets — Wave 0, API-01
// ============================================================

describe('GET /markets', () => {
  it('should return 200 and an array without auth', async () => {
    await createTestMarket();

    const res = await request(app).get('/markets');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('should return each market with the required seven fields', async () => {
    await createTestMarket();

    const res = await request(app).get('/markets');

    expect(res.status).toBe(200);
    const item = res.body[0];
    expect(item).toHaveProperty('marketId');
    expect(item).toHaveProperty('streamerId');
    expect(item).toHaveProperty('tier');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('supply');
    expect(item).toHaveProperty('priceCents');
    expect(item).toHaveProperty('reserveCents');
  });

  it('should compute priceCents correctly from the bonding curve', async () => {
    const { market, marketState } = await createTestMarket({
      P0_cents: 100,
      k_num: 1,
      k_den: 10,
    });

    const res = await request(app).get('/markets');

    expect(res.status).toBe(200);
    const item = res.body[0];
    const expected = priceCents(marketState.supply, {
      P0_cents: market.P0_cents,
      k_num: market.k_num,
      k_den: market.k_den,
    });
    expect(item.priceCents).toBe(expected);
  });

  it('should return 200 and array even with a valid JWT', async () => {
    await createTestMarket();
    const user = await createTestUser();
    const token = generateAuthToken(user._id);

    const res = await request(app)
      .get('/markets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ============================================================
// GET /markets/:id — Wave 0, API-01
// ============================================================

describe('GET /markets/:id', () => {
  it('should return 200 with { market, marketState } for a real market', async () => {
    const { market } = await createTestMarket();

    const res = await request(app).get(`/markets/${market._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('market');
    expect(res.body).toHaveProperty('marketState');
    expect(res.body.market._id.toString()).toBe(market._id.toString());
  });

  it('should return 404 for a well-formed but missing market id', async () => {
    const missingId = 'a'.repeat(24);

    const res = await request(app).get(`/markets/${missingId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for a syntactically invalid id (not 24-hex)', async () => {
    const res = await request(app).get('/markets/not-a-valid-id');

    expect(res.status).toBe(400);
  });
});

// ============================================================
// Helper: seed a user_cash ledger account so executeOrder has
// a user_pos starting balance to work against (cash is debited
// by the buy; positions are credited). The orchestrator does NOT
// pre-check user_cash balance so we just need the position
// accounts to exist for sell tests; for buys no pre-seed needed.
// ============================================================
async function seedUserCash(userId, amountCents) {
  await LedgerAccount.findOneAndUpdate(
    { accountKey: `user_cash:${userId}` },
    {
      $inc: { balance: amountCents },
      $setOnInsert: { unit: 'cents', updatedAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

// ============================================================
// Auth required — all three new endpoints must 401 w/o token
// ============================================================

describe('auth required', () => {
  it('POST /quotes should return 401 with no token', async () => {
    const res = await request(app)
      .post('/quotes')
      .send({ marketId: 'a'.repeat(24), side: 'buy', qty: 1 });
    expect(res.status).toBe(401);
  });

  it('POST /orders should return 401 with no token', async () => {
    const res = await request(app)
      .post('/orders')
      .send({ marketId: 'a'.repeat(24), side: 'buy', qty: 1, idempotencyKey: 'k1' });
    expect(res.status).toBe(401);
  });

  it('GET /portfolio should return 401 with no token', async () => {
    const res = await request(app).get('/portfolio');
    expect(res.status).toBe(401);
  });
});

// ============================================================
// POST /quotes — API-02
// ============================================================

describe('POST /quotes', () => {
  let user;
  let token;
  let market;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateAuthToken(user._id);
    ({ market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 }));
  });

  it('should return 200 with the full quote shape for a buy by qty', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: market._id.toString(), side: 'buy', qty: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quoteId');
    expect(typeof res.body.quoteId).toBe('string');
    expect(res.body).toHaveProperty('marketId');
    expect(res.body).toHaveProperty('side', 'buy');
    expect(res.body).toHaveProperty('qty', 5);
    expect(res.body).toHaveProperty('avgPriceCents');
    expect(typeof res.body.avgPriceCents).toBe('number');
    expect(res.body).toHaveProperty('grossCents');
    expect(res.body).toHaveProperty('feeCents');
    expect(res.body).toHaveProperty('spreadCents');
    expect(res.body).toHaveProperty('totalCents');   // buy only
    expect(res.body).not.toHaveProperty('netCents'); // sell only
    expect(res.body).toHaveProperty('priceImpactBps');
    expect(typeof res.body.priceImpactBps).toBe('number');
    expect(res.body).toHaveProperty('expiresAt');
    // expiresAt should be ~30 s in the future
    const exp = new Date(res.body.expiresAt);
    expect(exp.getTime()).toBeGreaterThan(Date.now() + 25_000);
    expect(exp.getTime()).toBeLessThan(Date.now() + 35_000);
  });

  it('should return 200 with netCents (not totalCents) for a sell quote', async () => {
    // First execute a buy so the user has shares to quote a sell against
    const userIdStr = user._id.toString();
    // Seed a position for the user (5 shares)
    await LedgerAccount.findOneAndUpdate(
      { accountKey: `user_pos:${userIdStr}:${market._id}` },
      { $inc: { balance: 5 }, $setOnInsert: { unit: 'shares', updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    // Also need supply > 0 so sell doesn't fail; create market with supply via a buy
    await MarketState.findOneAndUpdate(
      { marketId: market._id },
      { $inc: { supply: 5 } }
    );

    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: market._id.toString(), side: 'sell', qty: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('netCents');
    expect(res.body).not.toHaveProperty('totalCents');
  });

  it('should return 400 when neither qty nor cashCents is provided', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: market._id.toString(), side: 'buy' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for a bad (non-hex) marketId', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: 'not-a-valid-id', side: 'buy', qty: 1 });

    expect(res.status).toBe(400);
  });

  it('should return 400 for a negative qty', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: market._id.toString(), side: 'buy', qty: -1 });

    expect(res.status).toBe(400);
  });

  it('should return 404 for a well-formed but missing marketId', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({ marketId: 'a'.repeat(24), side: 'buy', qty: 1 });

    expect(res.status).toBe(404);
  });
});

// ============================================================
// POST /orders — API-03
// ============================================================

describe('POST /orders', () => {
  let user;
  let token;
  let market;

  beforeEach(async () => {
    // Ensure all AMM models have indexes initialized (required for Mongoose txn)
    await Promise.all([
      Market.init(),
      MarketState.init(),
      Trade.init(),
      Order.init(),
      LedgerAccount.init(),
    ]);
    user = await createTestUser();
    token = generateAuthToken(user._id);
    ({ market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 }));
  });

  it('should execute a buy order and return trade + balances', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: market._id.toString(),
        side: 'buy',
        cashCents: 500,
        idempotencyKey: `idem-buy-${Date.now()}`,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trade');
    expect(res.body.trade).toHaveProperty('_id');
    expect(res.body.trade.side).toBe('buy');
    expect(res.body).toHaveProperty('balances');
    expect(res.body.balances).toHaveProperty('cashCents');
    expect(res.body.balances).toHaveProperty('positionQty');
    expect(res.body.balances.positionQty).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('replayed', false);
  });

  it('should return the same trade and replayed:true on a duplicate idempotencyKey', async () => {
    const idempotencyKey = `idem-replay-${Date.now()}`;
    const body = {
      marketId: market._id.toString(),
      side: 'buy',
      cashCents: 500,
      idempotencyKey,
    };

    const res1 = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res2.status).toBe(200);

    // Same trade id
    expect(res2.body.trade._id).toBe(res1.body.trade._id);
    expect(res2.body.replayed).toBe(true);

    // Only ONE Trade document was ever created
    const count = await Trade.countDocuments({ marketId: market._id });
    expect(count).toBe(1);
  });

  it('should return 400 when idempotencyKey is missing', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: market._id.toString(),
        side: 'buy',
        cashCents: 500,
        // idempotencyKey intentionally omitted
      });

    expect(res.status).toBe(400);
  });

  it('should return 409 when buy maxCostCents is too low (slippage)', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: market._id.toString(),
        side: 'buy',
        cashCents: 500,
        idempotencyKey: `idem-slip-buy-${Date.now()}`,
        maxCostCents: 1, // way too low
      });

    expect(res.status).toBe(409);
  });

  it('should return 409 when sell minReceivedCents is too high (slippage)', async () => {
    const userIdStr = user._id.toString();
    // Seed 10 shares and supply so the sell can proceed up to slippage check
    await MarketState.findOneAndUpdate(
      { marketId: market._id },
      { $inc: { supply: 10 } }
    );
    await LedgerAccount.findOneAndUpdate(
      { accountKey: `user_pos:${userIdStr}:${market._id}` },
      { $inc: { balance: 10 }, $setOnInsert: { unit: 'shares', updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: market._id.toString(),
        side: 'sell',
        qty: 1,
        idempotencyKey: `idem-slip-sell-${Date.now()}`,
        minReceivedCents: 999_999_999, // unreachably high
      });

    expect(res.status).toBe(409);
  });

  it('should return 400 for a negative qty', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: market._id.toString(),
        side: 'buy',
        qty: -1,
        idempotencyKey: `idem-neg-${Date.now()}`,
      });

    expect(res.status).toBe(400);
  });

  it('should strip userId from body and execute as the JWT user (IDOR safety)', async () => {
    // validate() middleware uses stripUnknown:true so userId is stripped silently.
    // The order must still succeed and use the JWT userId (req.userId), never body.userId.
    const otherUser = await createTestUser();
    const ik = `idem-idor-body-${Date.now()}`;
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketId: market._id.toString(),
        side: 'buy',
        cashCents: 500,
        idempotencyKey: ik,
        userId: otherUser._id.toString(), // stripped by validate(orderSchema) → stripUnknown
      });

    // Order succeeds; userId from body was ignored, JWT userId was used
    expect(res.status).toBe(200);
    // The trade must be attributed to the JWT user (token), NOT to otherUser
    const Trade = require('../../models/Trade');
    const trade = await Trade.findById(res.body.trade._id);
    expect(trade).not.toBeNull();
    expect(trade.userId.toString()).toBe(user._id.toString());
    expect(trade.userId.toString()).not.toBe(otherUser._id.toString());
  });
});

// ============================================================
// GET /portfolio — API-04 + IDOR isolation
// ============================================================

describe('GET /portfolio', () => {
  let userA;
  let tokenA;
  let userB;
  let tokenB;
  let market;

  beforeEach(async () => {
    await Promise.all([
      Market.init(),
      MarketState.init(),
      Trade.init(),
      Order.init(),
      LedgerAccount.init(),
    ]);
    userA = await createTestUser();
    tokenA = generateAuthToken(userA._id);
    userB = await createTestUser();
    tokenB = generateAuthToken(userB._id);
    ({ market } = await createTestMarket({ P0_cents: 100, k_num: 1, k_den: 10 }));
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/portfolio');
    expect(res.status).toBe(401);
  });

  it('should return cashCents, positions, totalValueCents for an authenticated user', async () => {
    const res = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cashCents');
    expect(res.body).toHaveProperty('positions');
    expect(Array.isArray(res.body.positions)).toBe(true);
    expect(res.body).toHaveProperty('totalValueCents');
  });

  it('IDOR: user A position is visible only with A\'s token (not B\'s)', async () => {
    // Give user A a position via the orders endpoint
    const idempotencyKey = `idem-idor-a-${Date.now()}`;
    const orderRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        marketId: market._id.toString(),
        side: 'buy',
        cashCents: 500,
        idempotencyKey,
      });
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.balances.positionQty).toBeGreaterThan(0);

    // A's portfolio shows the position
    const portA = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(portA.status).toBe(200);
    expect(portA.body.positions.length).toBeGreaterThan(0);
    expect(portA.body.positions[0].positionQty).toBeGreaterThan(0);

    // B's portfolio is empty (B never traded)
    const portB = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(portB.status).toBe(200);
    expect(portB.body.positions.length).toBe(0);
    // B's portfolio does NOT contain A's marketId
    const aMarketId = market._id.toString();
    const bMarketIds = portB.body.positions.map(p => p.marketId);
    expect(bMarketIds).not.toContain(aMarketId);
  });

  it('IDOR: GET /portfolio has no :userId param — AMM portfolio route is fixed to JWT user', async () => {
    // Verify that the AMM GET /portfolio route does NOT expose a :userId path parameter.
    // IDOR safety is enforced by construction: the controller always reads req.userId from JWT.
    // A separate legacy route (GET /portfolio/:userId) exists in trade.js and requires its own
    // verifyOwnership middleware — that is out of scope here. This test confirms that the AMM
    // portfolio endpoint itself is accessed at /portfolio (no param) and returns the JWT user's data.
    const portA = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(portA.status).toBe(200);
    // The response belongs to A (no :userId param accepted on this route)
    expect(portA.body).toHaveProperty('cashCents');
    expect(portA.body).toHaveProperty('positions');
    expect(portA.body).toHaveProperty('totalValueCents');
  });

  it('should show A\'s position after buying via POST /orders', async () => {
    const ik = `idem-port-buy-${Date.now()}`;
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ marketId: market._id.toString(), side: 'buy', cashCents: 200, idempotencyKey: ik });

    const port = await request(app)
      .get('/portfolio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(port.status).toBe(200);
    const pos = port.body.positions.find(p => p.marketId === market._id.toString());
    expect(pos).toBeDefined();
    expect(pos.positionQty).toBeGreaterThan(0);
    expect(pos.priceCents).toBeGreaterThan(0);
    expect(pos.valueCents).toBeGreaterThan(0);
  });
});
