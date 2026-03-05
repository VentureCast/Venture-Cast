const request = require('supertest');
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser } = require('../helpers/fixtures');

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

describe('POST /auth/signup', () => {
  it('should create a new user with valid data', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPass1!',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User created successfully');
  });

  it('should return 409 for duplicate email', async () => {
    await createTestUser({ email: 'dup@example.com' });

    const res = await request(app)
      .post('/auth/signup')
      .send({
        name: 'Another User',
        email: 'dup@example.com',
        password: 'StrongPass1!',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });

  it('should return 400 for weak password', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        name: 'Test User',
        email: 'not-an-email',
        password: 'StrongPass1!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('POST /auth/signin', () => {
  it('should sign in with valid credentials', async () => {
    // Create user first
    await request(app)
      .post('/auth/signup')
      .send({
        name: 'Test User',
        email: 'signin@example.com',
        password: 'StrongPass1!',
      });

    const res = await request(app)
      .post('/auth/signin')
      .send({
        email: 'signin@example.com',
        password: 'StrongPass1!',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.userId).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    await request(app)
      .post('/auth/signup')
      .send({
        name: 'Test User',
        email: 'wrong@example.com',
        password: 'StrongPass1!',
      });

    const res = await request(app)
      .post('/auth/signin')
      .send({
        email: 'wrong@example.com',
        password: 'WrongPass1!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('should return 401 for nonexistent user (same message)', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({
        email: 'nobody@example.com',
        password: 'SomePass1!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});
