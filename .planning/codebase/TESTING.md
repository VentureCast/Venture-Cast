# Testing Patterns

**Analysis Date:** 2026-06-03
**Scope:** Backend only (`VentureCast_Backend-main/`). Frontend tests (`VentureCast_Frontend-main/`) are out of scope.

---

## Test Framework

**Runner:**
- Jest 30.x
- Config: `VentureCast_Backend-main/jest.config.js`
- Test environment: `node`
- Test timeout: 15 seconds per test

**HTTP Integration:**
- supertest 7.x — drives the Express app without a real listening port

**In-Memory Database:**
- mongodb-memory-server 11.x with `MongoMemoryReplSet` (not `MongoMemoryServer` — see critical gotchas)

**Run Commands:**
```bash
cd VentureCast_Backend-main

npm test                        # Run all tests (jest --runInBand --forceExit)
npm run test:coverage           # Run with coverage report
npx jest tests/unit/tradeService.test.js --runInBand --forceExit   # Single file
```

`--runInBand` is required — tests share a single in-memory MongoDB instance and cannot run in parallel workers.

`--forceExit` is required — prevents Jest from hanging after tests complete.

---

## Jest Configuration (`jest.config.js`)

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
  ],
  testTimeout: 15000,
  globalSetup: './tests/setup.js',
  globalTeardown: './tests/teardown.js',
};
```

Coverage is collected from `services/`, `controllers/`, and `middleware/`. Routes, models, and config are excluded.

---

## Test File Organization

**Location:** All tests live under `VentureCast_Backend-main/tests/`

```
tests/
├── setup.js                    # Global setup — starts MongoMemoryReplSet, sets env vars
├── teardown.js                 # Global teardown — stops MongoMemoryReplSet
├── helpers/
│   ├── db.js                   # connectTestDB / clearTestDB / disconnectTestDB
│   └── fixtures.js             # Factory functions: createTestUser, createTestStreamer, createTestShare, generateAuthToken
├── unit/
│   ├── tradeService.test.js    # Unit tests for services/tradeService.js (runs service functions directly)
│   └── validation.test.js      # Unit tests for all Joi schemas in middleware/schemas/
└── integration/
    ├── auth.test.js            # HTTP tests for /auth/signup, /auth/signin
    ├── trade.test.js           # HTTP tests for /trade/buy, /trade/sell, /portfolio, /shares
    └── streamer.test.js        # HTTP tests for /streamer endpoints
```

**Naming:** `<subject>.test.js`. Match the source file name where practical (e.g., `tradeService.test.js` tests `services/tradeService.js`).

---

## In-Memory MongoDB: Setup and Teardown

### Global Setup (`tests/setup.js`)

Runs once before all test suites. Starts a MongoDB replica set (required for transactions) and injects environment variables:

```js
const { MongoMemoryReplSet } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });
  const uri = replSet.getUri();

  global.__MONGOD__ = replSet;          // stored for teardown
  process.env.MONGODB_URI = uri;        // picked up by connectTestDB()
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.NODE_ENV = 'test';
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.SESSION_SECRET = 'test-session-secret';
};
```

### Global Teardown (`tests/teardown.js`)

```js
module.exports = async function globalTeardown() {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
```

### Per-Suite DB Helpers (`tests/helpers/db.js`)

Each test suite manages its own Mongoose connection lifecycle:

```js
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');

// connectTestDB: connects Mongoose if not already connected (idempotent)
// clearTestDB:   deleteMany({}) on every collection — use in afterEach
// disconnectTestDB: dropDatabase() + disconnect() — use in afterAll
```

---

## CRITICAL GOTCHAS

### 1. Use `MongoMemoryReplSet`, not `MongoMemoryServer`

Mongoose transactions require a replica set. `MongoMemoryServer` creates a standalone instance that does not support transactions. Always import and use `MongoMemoryReplSet`:

```js
// CORRECT
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

// WRONG — transactions will fail
const { MongoMemoryServer } = require('mongodb-memory-server');
```

### 2. Call `await Model.init()` on Every Transaction-Involved Model

Mongoose transactions fail if collections/indexes do not exist before the transaction starts. Call `.init()` on every model that participates in a transaction inside `beforeAll`, after connecting:

```js
// tests/unit/tradeService.test.js:
beforeAll(async () => {
  await connectTestDB();
  // Import AFTER DB connection so models register properly
  ({ TradeError, executeBuy, executeSell, ... } = require('../../services/tradeService'));

  const User = require('../../models/User');
  const Transaction = require('../../models/Transaction');
  const Share = require('../../models/Shares');
  const Streamer = require('../../models/streamer');
  await User.init();
  await Transaction.init();
  await Share.init();
  await Streamer.init();
});
```

Do not skip this step for any model touched inside a transaction. If you add a new model to a transactional service, add its `.init()` call here.

### 3. Use `new Model().save({session})`, Not `Model.create()` Inside Transactions

`Model.create()` does not stay within the Mongoose session correctly and will persist outside the transaction:

```js
// WRONG — persists even if the transaction aborts:
const tx = await Transaction.create({ userId, type: 'BUY', ... });

// CORRECT — stays within the session/transaction:
const tx = new Transaction({ userId, type: 'BUY', ... });
await tx.save({ session });
```

This applies to all models inside transaction try/catch blocks in `services/tradeService.js`.

### 4. `require.main === module` Guard Around `app.listen()`

`index.js` wraps `app.listen()` in a guard so importing the module for supertest does not start a server and cause port conflicts:

```js
// index.js (bottom of file):
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => { ... });
}
module.exports = app;
```

Integration tests import `app` directly:
```js
const app = require('../../index');
// supertest uses the exported Express app — no port binding
const res = await request(app).post('/trade/buy').send({ ... });
```

### 5. `connectDB()` Is Skipped in Test Mode

`index.js` guards the database connection:
```js
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}
```

Tests set `NODE_ENV=test` in global setup and manage their own connection via `connectTestDB()`. Do not remove or weaken this guard.

### 6. Do NOT Add `.lean()` to `middleware/auth.js`

`stripeService.js` calls `user.save()` on `req.user` (the object attached by `authenticateToken`). A lean query returns a plain JS object which has no `.save()` method — this would throw at runtime. Only use `.lean()` in service functions that are purely read-only and never mutate `req.user`:

```js
// auth.js — correct, no .lean():
const user = await User.findById(decoded.id).select('-password');
req.user = user;  // Mongoose document — has .save()

// tradeService.js getPortfolio — read-only, .lean() is fine:
const user = await User.findById(userId).populate(...).lean();
```

---

## Test Structure Pattern

All test files follow the same lifecycle pattern:

```js
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');
const { createTestUser, createTestStreamer, createTestShare, generateAuthToken } = require('../helpers/fixtures');

beforeAll(async () => {
  await connectTestDB();
  // For unit tests with transactions: import services here + call Model.init()
});

afterEach(async () => {
  await clearTestDB();   // wipe data between tests for isolation
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('feature', () => {
  it('should do X', async () => { ... });
});
```

---

## Fixtures and Factories (`tests/helpers/fixtures.js`)

Factory functions create realistic test data with sensible defaults and accept override objects:

```js
// Create a KYC-verified, treasury-active user with $10,000 balance (in cents):
const user = await createTestUser();

// Override specific fields:
const poorUser = await createTestUser({
  treasuryBalance: { available: 100, pending: 0, currency: 'usd' },
});
const unverifiedUser = await createTestUser({ kycVerificationStatus: 'unverified' });

// Create a streamer:
const streamer = await createTestStreamer();
const namedStreamer = await createTestStreamer({ id: 's1', name: 'MrBeast' });

// Create a share record for a streamer:
const share = await createTestShare(streamer._id, { sharePrice: 50 });

// Generate a signed JWT for a user (uses JWT_SECRET from env):
const token = generateAuthToken(user._id);
```

Default treasury balance in `createTestUser`: `available: 1000000` (= $10,000 in cents).

Note that `createTestStreamer` uses `Streamer.create()` (outside any session) — that is correct since fixtures are called before transactions start.

---

## Integration Test Pattern (supertest)

```js
const request = require('supertest');
const app = require('../../index');

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
});
```

**Auth header format:** `Bearer <token>` (not `x-auth-token`).

**Common status assertions:**
- `201` — resource created (signup, Stripe account creation)
- `200` — success
- `400` — validation failed (body: `{ error: 'Validation failed', details: [...] }`)
- `401` — missing or invalid token
- `403` — wrong token or ownership mismatch
- `404` — resource not found
- `409` — duplicate (e.g., duplicate email on signup)

---

## Unit Test Pattern (service functions directly)

```js
// Import service functions after connectTestDB() in beforeAll:
({ TradeError, executeBuy, executeSell } = require('../../services/tradeService'));

it('should throw on insufficient funds', async () => {
  const user = await createTestUser({
    treasuryBalance: { available: 100, pending: 0, currency: 'usd' },
  });
  const streamer = await createTestStreamer();
  await createTestShare(streamer._id, { sharePrice: 100, totalShares: 1000000 });

  await expect(
    executeBuy(user._id, streamer._id.toString(), 100)
  ).rejects.toThrow('Insufficient funds');
});
```

**Error testing:** Use `.rejects.toThrow('message substring')` for async throws.

---

## Validation Schema Unit Tests (`tests/unit/validation.test.js`)

Validation schemas are tested by calling `.validate()` directly — no DB connection needed:

```js
it('should accept valid buy input', () => {
  const { error } = buySchema.validate({
    streamerId: 'a'.repeat(24),
    shareCount: 10,
    maxPrice: 50.5,
  });
  expect(error).toBeUndefined();
});

it('should strip unknown fields', () => {
  const { value } = buySchema.validate({
    streamerId: 'a'.repeat(24),
    shareCount: 10,
    malicious: 'payload',
  }, { stripUnknown: true });
  expect(value.malicious).toBeUndefined();
});
```

Validation unit tests do NOT use `beforeAll` / DB helpers — they are synchronous schema checks.

---

## Coverage

**Requirements:** None enforced (no coverage threshold in `jest.config.js`).

**Collected from:** `services/**/*.js`, `controllers/**/*.js`, `middleware/**/*.js`

**View coverage:**
```bash
npm run test:coverage
# Opens coverage/lcov-report/index.html
```

---

## Mocking

**No Jest mocks are used in the current test suite.** Tests rely on the real Mongoose models against the in-memory replica set. Stripe API calls are not made — the `STRIPE_SECRET_KEY` is set to `'sk_test_fake'` and Stripe is only invoked in `stripeService.js`, which has no test coverage in the current suite.

If adding tests for Stripe-related code, mock the `stripe` SDK:
```js
jest.mock('stripe', () => () => ({
  accounts: { create: jest.fn().mockResolvedValue({ id: 'acct_test' }) },
  // ...
}));
```

---

*Testing analysis: 2026-06-03*
