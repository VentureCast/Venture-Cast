const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestStreamer, createTestShare } = require('../helpers/fixtures');

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

describe('GET /streamer', () => {
  it('should return paginated streamers', async () => {
    await createTestStreamer({ id: 's1', name: 'Streamer 1' });
    await createTestStreamer({ id: 's2', name: 'Streamer 2' });

    const res = await request(app).get('/streamer');

    expect(res.status).toBe(200);
    expect(res.body.streamers).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);
  });

  it('should respect limit parameter', async () => {
    for (let i = 0; i < 10; i++) {
      await createTestStreamer({ id: `s${i}`, name: `Streamer ${i}` });
    }

    const res = await request(app).get('/streamer?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.streamers).toHaveLength(5);
    expect(res.body.pagination.hasMore).toBe(true);
  });

  it('should reject limit over 100', async () => {
    const res = await request(app).get('/streamer?limit=500');
    expect(res.status).toBe(400);
  });
});

describe('GET /streamer/search', () => {
  it('should return matching streamers', async () => {
    await createTestStreamer({ id: 's1', name: 'MrBeast' });
    await createTestStreamer({ id: 's2', name: 'Markiplier' });

    const res = await request(app).get('/streamer/search?q=Mr');

    expect(res.status).toBe(200);
    expect(res.body.streamers.length).toBeGreaterThan(0);
    expect(res.body.streamers[0].name).toMatch(/^Mr/);
  });

  it('should return 400 for empty search', async () => {
    const res = await request(app).get('/streamer/search?q=');
    expect(res.status).toBe(400);
  });

  it('should handle regex special characters safely', async () => {
    await createTestStreamer({ id: 'safe', name: 'Normal Streamer' });

    const res = await request(app).get('/streamer/search?q=((a%2B)%2B)%2B$');

    // Should not hang (ReDoS) and should return a response
    expect(res.status).toBe(200);
  });
});

describe('GET /streamer/:id', () => {
  it('should return single streamer with share data', async () => {
    const streamer = await createTestStreamer();
    await createTestShare(streamer._id, { sharePrice: 15 });

    const res = await request(app).get(`/streamer/${streamer._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Streamer');
    expect(res.body.sharePrice).toBe(15);
  });

  it('should return 404 for nonexistent streamer', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/streamer/${fakeId}`);
    expect(res.status).toBe(404);
  });
});
