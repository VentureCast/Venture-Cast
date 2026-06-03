# Coding Conventions

**Analysis Date:** 2026-06-03
**Scope:** Backend only (`VentureCast_Backend-main/`). Frontend (`VentureCast_Frontend-main/`) uses React Native + TypeScript with different conventions and is out of scope.

---

## Module System

**CommonJS only — no ES module syntax.**

Every file uses `require` / `module.exports`. Never use `import` or `export default`.

```js
// CORRECT
const mongoose = require('mongoose');
const logger = require('../utils/logger');
module.exports = { executeBuy, executeSell };

// WRONG — do not use
import mongoose from 'mongoose';
export function executeBuy() {}
```

All files follow this without exception: `index.js`, all routes, controllers, services, models, middleware, config, and utils.

---

## Naming Patterns

**Files:**
- Route files: camelCase, e.g. `routes/trade.js`, `routes/auth.js`, `routes/watchlist.js`
- Exception: `routes/Streamers.js` is PascalCase (legacy, do not replicate)
- Model files: PascalCase for main models (`User.js`, `Shares.js`, `Transaction.js`, `Watchlist.js`), lowercase for streamer (`models/streamer.js`)
- New model files: use PascalCase (`MyModel.js`)
- Controller files: camelCase + `Controller` suffix (`tradeController.js`, `stripeController.js`)
- Service files: camelCase + `Service` suffix (`tradeService.js`, `stripeService.js`)
- Middleware files: camelCase (`auth.js`, `validate.js`, `errorHandler.js`, `rateLimiters.js`, `requestLogger.js`)
- Schema files: camelCase + `Schemas` suffix (`tradeSchemas.js`, `authSchemas.js`, `stripeSchemas.js`, `userSchemas.js`, `streamerSchemas.js`)

**Functions:**
- camelCase throughout: `executeBuy`, `getPortfolio`, `authenticateToken`, `verifyOwnership`
- Controller functions are named after their action: `buyShares`, `sellShares`, `getUserPortfolio`
- Service functions describe the operation: `executeBuy`, `createConnectAccount`, `getBalance`

**Variables:**
- camelCase: `shareCount`, `streamerId`, `paymentIntentId`, `totalCost`
- Constants (rate limiters, schema instances): camelCase (`authLimiter`, `tradeLimiter`, `buySchema`)

**Classes:**
- PascalCase: `TradeError`, `StripeServiceError`

**Mongoose Models:**
- Schema variable: `PascalCase + Schema` suffix (`UserSchema`, `TransactionSchema`, `shareSchema`)
- Export: `mongoose.model('ModelName', schema)`

---

## Money Storage: Integer Cents

**All monetary amounts are stored and computed as integer cents (not dollars).**

- `treasuryBalance.available` — stored in cents: `1000000` = $10,000
- `Transaction.amount` — stored in cents, documented in schema: `// Amount in cents (for precision)`
- Minimum deposit: `100` cents = $1.00

**Converting cents → dollars for API responses:**
```js
// In tradeService.js executeBuy:
const totalCost = Math.round(currentPrice * shareCount * 100);  // dollars -> cents
// ...
totalCost: totalCost / 100,   // cents -> dollars in response
newBalance: user.treasuryBalance.available / 100,

// In Transaction static methods:
description: `Deposit of $${(amount / 100).toFixed(2)}`
```

**Rule:** Store cents, divide by 100 only at the API response boundary. Always use `Math.round()` when multiplying to cents to avoid floating-point errors.

---

## Custom Error Classes

Two error classes exist — one per service. Both follow the same shape.

**`TradeError`** — defined in `services/tradeService.js`:
```js
class TradeError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
```

**`StripeServiceError`** — defined in `services/stripeService.js`:
```js
class StripeServiceError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
```

**How to throw:**
```js
throw new TradeError('Insufficient funds', 400, {
  required: totalCost,
  available: availableBalance,
});

throw new StripeServiceError('User already has a Stripe account', 400, {
  stripeAccountId: user.stripeAccountId,
});
```

**How controllers catch and respond:**
```js
// tradeController.js pattern:
if (error instanceof TradeError) {
  return res.status(error.statusCode).json({ error: error.message, ...error.details });
}
logger.error('Buy trade error:', error);
res.status(500).json({ error: 'Failed to execute buy order' });

// stripeController.js centralizes this into a helper:
function handleError(res, error, fallbackMessage) {
  if (error instanceof StripeServiceError) {
    return res.status(error.statusCode).json({ error: error.message, ...error.details });
  }
  logger.error(`${fallbackMessage}:`, error);
  res.status(500).json({ error: error.message });
}
```

**Rule:** Always `instanceof`-check the domain error class before falling through to generic 500. Never expose stack traces in production (the global `errorHandler` in `middleware/errorHandler.js` enforces this).

---

## Async/Await with Mongoose Sessions

All service functions that mutate data use `async/await` with a Mongoose session for ACID atomicity.

**Standard transaction pattern** (`services/tradeService.js`):
```js
async function executeBuy(userId, streamerId, shareCount, maxPrice) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    // ... business logic ...

    // CORRECT: new + save({session}) keeps the insert within the transaction
    const transaction = new Transaction({ userId, type: 'BUY', ... });
    await transaction.save({ session });

    await shareRecord.save({ session });
    await user.save({ session });
    await session.commitTransaction();

    return { transaction: { ... }, portfolio: { ... } };
  } catch (error) {
    await session.abortTransaction();
    throw error;  // re-throw so controller can handle it
  } finally {
    session.endSession();
  }
}
```

**Critical rule — never use `Model.create()` inside a session:**
```js
// WRONG — create() does not accept a session option correctly:
await Transaction.create({ userId, type: 'BUY', ... });

// CORRECT — use new + save({session}):
const tx = new Transaction({ userId, type: 'BUY', ... });
await tx.save({ session });
```

**Read-only service functions** (no session needed) use `.lean()` for performance:
```js
// getPortfolio and getShareInfo in tradeService.js:
const user = await User.findById(userId).populate(...).select(...).lean();
const shareRecord = await Share.findOne({ streamerId }).lean();
```

**CRITICAL — do NOT add `.lean()` to `middleware/auth.js`:**
`stripeService.js` calls `user.save()` on `req.user`. If `authenticateToken` returns a lean (plain JS object) user, `user.save()` will throw. Only use `.lean()` in service functions that are purely read-only and never mutate `req.user`.

---

## Validation: Joi Schemas in Middleware

All input validation uses Joi schemas defined in `middleware/schemas/`. The `validate` middleware wrapper applies them.

**Schema location:**
- `middleware/schemas/authSchemas.js` — `signupSchema`, `signinSchema`
- `middleware/schemas/tradeSchemas.js` — `buySchema`, `sellSchema`, `tradeHistoryQuery`, `userIdParam`, `streamerIdParam`
- `middleware/schemas/stripeSchemas.js` — `depositSchema`, `withdrawSchema`, `addBankSchema`, `confirmDepositSchema`, `transferSchema`, `transactionsQuery`
- `middleware/schemas/userSchemas.js` — `updateUserSchema`
- `middleware/schemas/streamerSchemas.js` — `listQuery`, `searchQuery`, `streamerIdParam`

**Applying validation (`middleware/validate.js`):**
```js
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
    }
    req[source] = value;  // replaces raw input with validated+coerced value
    next();
  };
}
```

**How routes apply it:**
```js
// routes/trade.js:
router.post('/trade/buy', authenticateToken, validate(buySchema), tradeController.buyShares);
router.get('/portfolio/:userId', validate(userIdParam, 'params'), authenticateToken, verifyOwnership, tradeController.getUserPortfolio);
router.get('/trade/history/:userId', validate(userIdParam, 'params'), authenticateToken, verifyOwnership, validate(tradeHistoryQuery, 'query'), tradeController.getUserTradeHistory);
```

**Schema patterns to follow:**
```js
// ObjectId validation reusable helper (tradeSchemas.js):
const objectId = Joi.string().hex().length(24);

// Stripe ID prefix patterns (stripeSchemas.js):
Joi.string().pattern(/^pm_/)   // payment method
Joi.string().pattern(/^pi_/)   // payment intent

// Amounts always integer cents with min/max:
Joi.number().integer().min(100).max(10000000)

// Pagination with defaults:
Joi.number().integer().min(1).max(100).default(50)

// Always use stripUnknown: true (enforced by validate middleware)
// Always validate at abortEarly: false (enforced by validate middleware)
```

---

## Logging: Winston

All logging goes through `utils/logger.js`. Never use `console.log` / `console.error`.

```js
const logger = require('../utils/logger');

logger.info('MongoDB connected successfully');
logger.warn('MongoDB disconnected');
logger.error('Buy trade error:', error);
logger.debug('...');  // only shown in non-production
```

**Log levels:**
- Production: `info` and above (set via `LOG_LEVEL` env or defaults)
- Development/test: `debug` and above

**Format:** JSON in all transports; colorized console output in dev. Timestamp: `YYYY-MM-DD HH:mm:ss`.

**HTTP request logging** is handled automatically by `middleware/requestLogger.js` (uses `logger.info` for 2xx/3xx, `logger.warn` for 4xx+). Do not manually log request/response in routes.

**Error logging in controllers:**
```js
// Always pass the error object as second argument:
logger.error('Buy trade error:', error);
logger.error('Create account error:', error);
```

---

## Controller Pattern

Controllers are thin: extract from `req`, call one service function, handle errors, send response.

```js
// controllers/tradeController.js:
async function buyShares(req, res) {
  try {
    const { streamerId, shareCount, maxPrice } = req.body;
    const result = await executeBuy(req.userId, streamerId, shareCount, maxPrice);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof TradeError) {
      return res.status(error.statusCode).json({ error: error.message, ...error.details });
    }
    logger.error('Buy trade error:', error);
    res.status(500).json({ error: 'Failed to execute buy order' });
  }
}
```

`req.userId` (string) is set by `authenticateToken` middleware. `req.user` is the full Mongoose document.

---

## Route Pattern

Routes apply middleware in order: validation → auth → ownership → controller.

```js
// routes/trade.js:
router.post('/trade/buy', authenticateToken, validate(buySchema), tradeController.buyShares);
router.get('/portfolio/:userId', validate(userIdParam, 'params'), authenticateToken, verifyOwnership, tradeController.getUserPortfolio);
```

Rate limiters are applied at the router mount in `index.js`, not inside individual route files:
```js
app.use('/auth', authLimiter, authRoutes);
app.use('/', tradeLimiter, tradeRoutes);
app.use('/stripe', paymentLimiter, stripeRoutes);
```

---

## Model Conventions

- Use section-comment blocks (`// ============= SECTION =============`) to group related fields in large schemas (see `models/User.js`)
- Define indexes inline on the field (`index: true`) or via `schema.index({ field: 1 })` for compound indexes
- Use `pre('save')` hooks for computed fields and `updatedAt` timestamps
- Static methods on the schema for factory operations:
  ```js
  TransactionSchema.statics.createDeposit = async function(userId, amount, paymentIntentId) { ... };
  ```
- Virtual properties for derived state:
  ```js
  UserSchema.virtual('canTrade').get(function() { ... });
  ```

---

## Middleware Stack Order (index.js — do not reorder)

1. `/webhook` with `express.raw()` — MUST be before JSON parser
2. `helmet()` — security headers
3. `cors()` — restricted origins
4. `requestLogger` — HTTP logging
5. `express.json({ limit: '10kb' })` / `express.urlencoded({ limit: '10kb' })`
6. `connectDB()` skipped when `NODE_ENV === 'test'`
7. `express-session` / `passport.initialize()` / `passport.session()`
8. API routes with rate limiters
9. 404 handler
10. `errorHandler` (global — four-argument signature)

---

## JSDoc Comments

Service functions use JSDoc to document parameters and return values:
```js
/**
 * Execute a buy order for shares of a streamer.
 * Runs inside a Mongoose transaction for atomicity.
 *
 * @param {string} userId
 * @param {string} streamerId
 * @param {number} shareCount
 * @param {number|null} maxPrice - Optional limit price
 * @returns {Object} { transaction, portfolio, user }
 */
async function executeBuy(userId, streamerId, shareCount, maxPrice) { ... }
```

Use JSDoc on public service functions and middleware. Controllers and route handlers can use brief inline comments.

---

*Convention analysis: 2026-06-03*
