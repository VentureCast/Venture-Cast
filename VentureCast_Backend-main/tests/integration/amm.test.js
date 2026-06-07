'use strict';

const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser, generateAuthToken, generateAdminToken } = require('../helpers/fixtures');
const { createTestMarket } = require('../helpers/ammFixtures');
const { priceCents } = require('../../services/amm/pricing/curve');

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
