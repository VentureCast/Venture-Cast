# Architecture

**Analysis Date:** 2026-06-03
**Scope:** `VentureCast_Backend-main/` (Express.js API). React Native frontend (`VentureCast_Frontend-main/`) is out of scope.

---

## Pattern Overview

**Overall:** Layered MVC — Routes → Controllers → Services → Models

**Key Characteristics:**
- Each layer has a single, well-defined responsibility; layers only call downward (routes never call models directly, controllers never call models directly for business logic)
- Business logic and database mutations live exclusively in Services; Controllers are thin translators between HTTP and service calls
- All multi-document writes use Mongoose sessions (ACID transactions via replica set)
- Custom domain error classes (`TradeError`, `StripeServiceError`) carry `statusCode` + `details` and bubble up to a uniform controller catch
- Joi validation middleware strips and sanitizes input before it reaches any controller

---

## Layers

**Routes (`routes/`):**
- Purpose: Declare HTTP endpoints, apply middleware chain (rate limiter → validator → auth guard → controller)
- Location: `VentureCast_Backend-main/routes/`
- Contains: Express Router instances, middleware wiring
- Depends on: `middleware/auth.js`, `middleware/validate.js`, `middleware/schemas/*`, controller modules
- Used by: `index.js` (mounted via `app.use`)

**Controllers (`controllers/`):**
- Purpose: Extract validated inputs from `req`, call the appropriate service function, translate the result or domain error into an HTTP response
- Location: `VentureCast_Backend-main/controllers/`
- Contains: `tradeController.js`, `stripeController.js`
- Depends on: Service modules, `utils/logger.js`
- Used by: Route files
- Pattern: `instanceof TradeError` / `instanceof StripeServiceError` check in every catch block; unknown errors log and return 500

**Services (`services/`):**
- Purpose: Core business logic, all database reads/writes, external API calls (Stripe SDK)
- Location: `VentureCast_Backend-main/services/`
- Contains: `tradeService.js`, `stripeService.js`
- Depends on: Mongoose models, Stripe SDK, `utils/logger.js`
- Used by: Controllers only
- Pattern: Each public function is async, throws a typed error on failure, returns a plain JS object on success

**Models (`models/`):**
- Purpose: Mongoose schema definitions; source of truth for MongoDB document shape, indexes, pre-save hooks, and static/instance methods
- Location: `VentureCast_Backend-main/models/`
- Contains: `User.js`, `Shares.js`, `Transaction.js`, `streamer.js`, `Watchlist.js`
- Depends on: Mongoose
- Used by: Services (and two route files that have no controller layer: `routes/users.js`, `routes/Streamers.js`, `routes/watchlist.js`, `routes/auth.js`)

---

## Data Flow — End-to-End Buy Request

```
POST /trade/buy  { streamerId, shareCount, maxPrice }
```

1. **`index.js`** — request hits Express. Passes through:
   - `tradeLimiter` (30 req/min per IP) → rejects with 429 if exceeded
   - `express.json()` body parser (already applied globally)
2. **`routes/trade.js` line 9** — `router.post('/trade/buy', authenticateToken, validate(buySchema), tradeController.buyShares)`
   - `authenticateToken` (`middleware/auth.js`): verifies Bearer JWT, loads full Mongoose `User` document from DB, attaches to `req.user` and `req.userId`
   - `validate(buySchema)` (`middleware/validate.js`): runs Joi against `req.body`; strips unknown fields; rejects with 400 on failure
3. **`controllers/tradeController.js` → `buyShares()`**: destructures `{ streamerId, shareCount, maxPrice }` from `req.body`, calls `executeBuy(req.userId, streamerId, shareCount, maxPrice)`
4. **`services/tradeService.js` → `executeBuy()`** (the core, runs inside a Mongoose session):
   a. `mongoose.startSession()` → `session.startTransaction()`
   b. `User.findById(userId).session(session)` — load user within transaction
   c. Check `user.kycVerificationStatus === 'verified'` — throw `TradeError(403)` if not
   d. `Share.findOne({ streamerId }).session(session)` — load or lazily create share record at $10.00 initial price
   e. Limit-price check: if `maxPrice` supplied and `currentPrice > maxPrice` → throw `TradeError(400)`
   f. Balance check: `user.treasuryBalance.available` (stored in cents) vs `totalCost = currentPrice * shareCount * 100` → throw `TradeError(400)` if insufficient
   g. Deduct balance, update `user.portfolio[]` subdocument (weighted average cost calculation)
   h. `user.save({ session })`
   i. `new Transaction({...}).save({ session })` — write trade record within transaction
   j. **Current pricing (naive bump):** `shareRecord.sharePrice *= (1 + (shareCount / totalShares) * 0.001)` — linear supply-demand multiplier
   k. `shareRecord.save({ session })` — persist new price
   l. `session.commitTransaction()`
   m. Returns `{ transaction: {...}, portfolio: {...} }` (amounts in dollars, not cents)
5. **`controllers/tradeController.js`** — `res.json({ success: true, ...result })`

**On any error in step 4:** `session.abortTransaction()` rolls back all writes atomically. The error re-throws. The controller catch block detects `instanceof TradeError` and returns the typed status code; otherwise logs and returns 500. Session is always closed in `finally`.

---

## Key Abstractions

**`TradeError`** (`services/tradeService.js` lines 7–13):
- Extends `Error`; constructor: `(message, statusCode, details = {})`
- `statusCode`: HTTP status to use in the response (400, 403, 404)
- `details`: optional payload merged into the JSON response body (e.g., `{ currentPrice, maxPrice }`)
- Thrown by all functions in `tradeService.js`; caught and typed in `tradeController.js`

**`StripeServiceError`** (`services/stripeService.js` lines 10–16):
- Identical shape to `TradeError` — `(message, statusCode, details = {})`
- Thrown by all functions in `stripeService.js`; caught in `stripeController.js` via the shared `handleError()` helper (line 5)
- `stripeController.js` uses a single `handleError(res, error, fallbackMessage)` helper instead of per-function catch blocks

**Mongoose Session Transaction Pattern:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // all reads/writes pass .session(session) or { session }
  await session.commitTransaction();
  return result;
} catch (error) {
  await session.abortTransaction();
  throw error;          // re-throw so controller can type-check
} finally {
  session.endSession(); // always released
}
```
Used in: `executeBuy()` and `executeSell()` in `services/tradeService.js`. Requires MongoDB replica set (or `MongoMemoryReplSet` in tests).

**Current Pricing Algorithm (replacement target for AMM):**
- Buy: `shareRecord.sharePrice *= (1 + (shareCount / totalShares) * 0.001)` — `tradeService.js` lines 115–117
- Sell: `shareRecord.sharePrice = Math.max(0.01, shareRecord.sharePrice * (1 - (shareCount / totalShares) * 0.001))` — `tradeService.js` lines 221–223
- This is a linear, per-trade percentage bump with no bonding curve or liquidity pool. The AMM engine will replace these two blocks and the associated `shareRecord.save()` call.

**Balance Currency:** `user.treasuryBalance.available` is stored in **cents** (integer). All service computations multiply by 100 before comparing/deducting and divide by 100 in response payloads. The AMM must respect this convention.

---

## Entry Points

**`index.js`:**
- Location: `VentureCast_Backend-main/index.js`
- Triggers: `node index.js` or `npm run dev` (nodemon)
- Responsibilities: Wire all middleware and routes in the correct order, start HTTP server, register process signal handlers for graceful shutdown

**`GET /`** (health check, `index.js` lines 81–93):
- Returns `{ status, service, version, timestamp, uptime, database }`
- HTTP 200 when `mongoose.connection.readyState === 1`, 503 otherwise

**`POST /webhook`** (`routes/webhook.js`):
- Registered BEFORE the JSON body parser with `express.raw({ type: 'application/json' })` — required for Stripe signature verification
- Handles: `account.updated` (KYC/onboarding sync), `payment_intent.succeeded/failed/canceled`, `payment_method.attached/detached`, `treasury.received_credit.created`, `treasury.outbound_transfer.posted/failed/returned`

---

## Middleware Stack Order

Order in `index.js` is critical. Changing it breaks Stripe signature verification or CORS:

| # | Middleware | Scope | Notes |
|---|-----------|-------|-------|
| 1 | `express.raw({ type: 'application/json' })` + `webhookRoutes` | `/webhook` only | MUST be before JSON parser |
| 2 | `helmet({ contentSecurityPolicy: false })` | global | security headers |
| 3 | `cors({ origin: allowlist, credentials: true })` | global | allows no-origin (mobile) |
| 4 | `requestLogger` | global | logs method, URL, status, duration on `res.finish` |
| 5 | `express.json({ limit: '10kb' })` | global | |
| 6 | `express.urlencoded({ extended: true, limit: '10kb' })` | global | |
| 7 | `connectDB()` | startup (skipped in test) | called once, not middleware |
| 8 | `express-session` | global | 24-hour cookie, secure in prod |
| 9 | `passport.initialize()` + `passport.session()` | global | Google OAuth |
| 10 | Route mounting with rate limiters | per prefix | see table below |
| 11 | 404 catch-all | global | must come before errorHandler |
| 12 | `errorHandler` | global | 4-arg signature; handles Mongoose errors |

**Route → Rate Limiter mapping:**

| Mount prefix | Rate limiter | File |
|-------------|-------------|------|
| `/auth` | `authLimiter` (10 req / 15 min) | `routes/auth.js` |
| `/` (users) | `apiLimiter` (100 req / 1 min) | `routes/users.js` |
| `/` (trade) | `tradeLimiter` (30 req / 1 min) | `routes/trade.js` |
| `/streamer` | `apiLimiter` | `routes/Streamers.js` |
| `/stripe` | `paymentLimiter` (50 req / 1 hr) | `routes/stripe.js` |
| `/watchlist` | `apiLimiter` | `routes/watchlist.js` |

---

## Error Handling

**Strategy:** Domain errors use typed classes with status codes; all other errors flow to the global `errorHandler`.

**Patterns:**
- Controllers catch `instanceof TradeError` / `instanceof StripeServiceError` and call `res.status(error.statusCode).json({ error: error.message, ...error.details })`
- Unknown errors are logged via Winston and return a generic 500 (stack trace included in development mode only)
- `errorHandler` (`middleware/errorHandler.js`) normalizes Mongoose `ValidationError` → 400 and `CastError` → 400
- Routes without a dedicated controller (users, streamers, watchlist, auth) handle errors inline with `logger.error` + `res.status(500)`

---

## Cross-Cutting Concerns

**Logging:** Winston (`utils/logger.js`) — JSON format in production, colorized console in development. `requestLogger` middleware attaches to `res.finish` event to log duration. All service errors logged before re-throw.

**Validation:** Joi schemas in `middleware/schemas/` applied via `middleware/validate.js`. `validate(schema, source)` supports `'body'` (default), `'params'`, and `'query'`. Strips unknown fields (`stripUnknown: true`), reports all failures at once (`abortEarly: false`).

**Authentication:** JWT (1-hour expiry) issued at `/auth/signin`. `authenticateToken` loads a full Mongoose document (not `.lean()`) so `stripeService.js` can call `user.save()` on `req.user`. Google OAuth via Passport.

**Atomicity:** Multi-document mutations in `executeBuy` and `executeSell` use Mongoose sessions. Single-document mutations elsewhere use standard `document.save()` or `findOneAndUpdate`.

**Database Connection:** `config/db.js` — exponential backoff retry (max 5 attempts, up to 16s delay), exits process on exhaustion.
