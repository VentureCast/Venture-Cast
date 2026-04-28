const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser, createTestStreamer, createTestShare, generateAuthToken } = require('../helpers/fixtures');

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

describe('POST /trade/buy', () => {
  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/trade/buy')
      .send({ streamerId: 'a'.repeat(24), shareCount: 1 });

    expect(res.status).toBe(401);
  });

  it('should return 400 for negative shareCount', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user._id);

    const res = await request(app)
      .post('/trade/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ streamerId: 'a'.repeat(24), shareCount: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid streamerId format', async () => {
    const user = await createTestUser();
    const token = generateAuthToken(user._id);

    const res = await request(app)
      .post('/trade/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ streamerId: 'not-valid', shareCount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should execute a valid buy order', async () => {
    const user = await createTestUser();
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id);
    const token = generateAuthToken(user._id);

    const res = await request(app)
      .post('/trade/buy')
      .set('Authorization', `Bearer ${token}`)
      .send({ streamerId: streamer._id.toString(), shareCount: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction.type).toBe('BUY');
    expect(res.body.transaction.shareCount).toBe(5);
  });
});

describe('POST /trade/sell', () => {
  it('should execute a valid sell order', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 10 });
    const user = await createTestUser({
      portfolio: [{ streamerId: streamer._id, sharesOwned: 10, averageCost: 10 }],
    });
    const token = generateAuthToken(user._id);

    const res = await request(app)
      .post('/trade/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ streamerId: streamer._id.toString(), shareCount: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction.type).toBe('SELL');
  });
});

describe('GET /portfolio/:userId', () => {
  it('should return portfolio for authenticated user', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 20 });
    const user = await createTestUser({
      portfolio: [{ streamerId: streamer._id, sharesOwned: 10, averageCost: 10 }],
    });
    const token = generateAuthToken(user._id);

    const res = await request(app)
      .get(`/portfolio/${user._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.portfolio).toHaveLength(1);
    expect(res.body.summary).toBeDefined();
  });

  it('should return 403 for wrong user', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser({ email: 'other@test.com' });
    const token = generateAuthToken(user1._id);

    const res = await request(app)
      .get(`/portfolio/${user2._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /shares/:streamerId', () => {
  it('should return share data for existing streamer', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 25 });

    const res = await request(app)
      .get(`/shares/${streamer._id}`);

    expect(res.status).toBe(200);
    expect(res.body.sharePrice).toBe(25);
  });
});
