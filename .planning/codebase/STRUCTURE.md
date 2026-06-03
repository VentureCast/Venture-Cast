# Codebase Structure

**Analysis Date:** 2026-06-03
**Scope:** `VentureCast_Backend-main/` only.

---

## Directory Layout

```
VentureCast_Backend-main/
├── index.js                        # Express app entry point; middleware order is critical
├── package.json
├── jest.config.js
├── Dockerfile / Dockerfile.dev
├── .dockerignore
│
├── config/
│   └── db.js                       # MongoDB connection with exponential-backoff retry
│
├── routes/                         # HTTP endpoint declarations + middleware wiring
│   ├── auth.js                     # POST /auth/signup, /auth/signin, Google OAuth
│   ├── users.js                    # GET/PATCH /users/:userId, GET /auth/me, /balance
│   ├── trade.js                    # POST /trade/buy, /trade/sell, GET /portfolio, /shares, /trade/history
│   ├── stripe.js                   # All /stripe/* payment endpoints
│   ├── webhook.js                  # POST /webhook (Stripe events, raw body)
│   ├── Streamers.js                # GET /streamer, /streamer/search, /streamer/:id
│   └── watchlist.js                # GET/POST/DELETE /watchlist
│
├── controllers/                    # HTTP ↔ service translation (thin layer)
│   ├── tradeController.js          # buyShares, sellShares, getUserPortfolio, getShareInformation, getUserTradeHistory
│   └── stripeController.js         # All Stripe operations; shared handleError() helper
│
├── services/                       # Business logic + external API calls
│   ├── tradeService.js             # executeBuy, executeSell (Mongoose transactions), getPortfolio, getShareInfo, getTradeHistory
│   └── stripeService.js            # Stripe Connect, Treasury, deposits, withdrawals, balance
│
├── models/                         # Mongoose schemas
│   ├── User.js                     # Core user: auth, Stripe IDs, KYC status, treasuryBalance (cents), portfolio[], transactions[]
│   ├── Shares.js                   # One record per streamer: sharePrice, totalShares, marketCap, 7-day price history
│   ├── Transaction.js              # Ledger: BUY/SELL/DEPOSIT/WITHDRAW/FEE/REFUND; Stripe ref fields; fee fields
│   ├── streamer.js                 # Streamer metadata: name, ticker, platform, subscriberCount, category
│   └── Watchlist.js                # userId + streamerId pair; unique compound index
│
├── middleware/
│   ├── auth.js                     # authenticateToken (JWT→User doc), optionalAuth, verifyOwnership
│   ├── validate.js                 # Joi wrapper; validate(schema, source='body')
│   ├── rateLimiters.js             # authLimiter, paymentLimiter, tradeLimiter, apiLimiter
│   ├── errorHandler.js             # Global 4-arg Express error handler; Mongoose error normalization
│   ├── requestLogger.js            # Winston HTTP request logger (fires on res.finish)
│   └── schemas/                    # Joi schema definitions (one file per domain)
│       ├── authSchemas.js          # signupSchema, signinSchema
│       ├── tradeSchemas.js         # buySchema, sellSchema, tradeHistoryQuery, userIdParam, streamerIdParam
│       ├── stripeSchemas.js        # depositSchema, withdrawSchema, addBankSchema, transferSchema, etc.
│       ├── userSchemas.js          # updateUserSchema
│       └── streamerSchemas.js      # listQuery, searchQuery, streamerIdParam
│
├── utils/
│   └── logger.js                   # Winston logger; JSON in prod, colorized console in dev
│
└── tests/
    ├── setup.js                    # MongoMemoryReplSet setup (replica set required for transactions)
    ├── teardown.js                 # Replica set teardown
    ├── helpers/
    │   ├── db.js                   # Test DB connection helpers
    │   └── fixtures.js             # Test data factories
    ├── unit/
    │   ├── tradeService.test.js    # Unit tests for executeBuy/executeSell/getPortfolio
    │   └── validation.test.js      # Joi schema tests
    └── integration/
        ├── auth.test.js            # Supertest auth endpoints
        ├── trade.test.js           # Supertest trade endpoints
        └── streamer.test.js        # Supertest streamer endpoints
```

---

## Key File Locations

**Entry Point:**
- `VentureCast_Backend-main/index.js` — start here to trace any request

**Trade Path (primary integration surface for AMM engine):**
- `VentureCast_Backend-main/routes/trade.js` — endpoint definitions and middleware chain
- `VentureCast_Backend-main/controllers/tradeController.js` — HTTP/service bridge
- `VentureCast_Backend-main/services/tradeService.js` — all trade logic; `executeBuy` and `executeSell` contain the current naive pricing and the Mongoose session transaction

**Money/State Models:**
- `VentureCast_Backend-main/models/User.js` — `treasuryBalance.available` (cents), `portfolio[]` subdocuments
- `VentureCast_Backend-main/models/Shares.js` — `sharePrice`, `totalShares`, `marketCap`, `day1Price`–`day7Price`
- `VentureCast_Backend-main/models/Transaction.js` — ledger; `platformFee`, `stripeFee` fields already present
- `VentureCast_Backend-main/models/streamer.js` — `ticker` field, `subscriberCount`

**Stripe / Payment Path:**
- `VentureCast_Backend-main/services/stripeService.js` — all Stripe SDK calls; `StripeServiceError` defined here
- `VentureCast_Backend-main/controllers/stripeController.js` — shared `handleError()` helper pattern
- `VentureCast_Backend-main/routes/stripe.js` — all `/stripe/*` endpoints
- `VentureCast_Backend-main/routes/webhook.js` — async event handlers for Stripe webhooks

**Middleware:**
- `VentureCast_Backend-main/middleware/auth.js` — do NOT add `.lean()` here; `stripeService.js` calls `user.save()` on `req.user`
- `VentureCast_Backend-main/middleware/validate.js` — single-function Joi wrapper
- `VentureCast_Backend-main/middleware/rateLimiters.js` — four named limiters
- `VentureCast_Backend-main/middleware/errorHandler.js` — global handler; spreads `err.details` into response body

**Validation Schemas:**
- `VentureCast_Backend-main/middleware/schemas/tradeSchemas.js` — `buySchema` / `sellSchema` (add new fields here for AMM params)

**Configuration:**
- `VentureCast_Backend-main/config/db.js` — MongoDB connection with retry logic

**Logging:**
- `VentureCast_Backend-main/utils/logger.js` — import as `const logger = require('../utils/logger')`

**Tests:**
- `VentureCast_Backend-main/tests/unit/tradeService.test.js` — most relevant for AMM changes
- `VentureCast_Backend-main/tests/setup.js` — uses `MongoMemoryReplSet` (not `MongoMemoryServer`) — required for transaction support

---

## Naming Conventions

**Files:**
- Route files: camelCase matching the domain (`trade.js`, `users.js`), except `Streamers.js` (PascalCase — legacy inconsistency)
- Model files: PascalCase matching the Mongoose model name (`User.js`, `Shares.js`, `Transaction.js`)
- Middleware files: camelCase (`auth.js`, `errorHandler.js`, `rateLimiters.js`)
- Schema files: camelCase + `Schemas` suffix (`tradeSchemas.js`)
- Controller/service files: camelCase + layer suffix (`tradeController.js`, `tradeService.js`)

**Exports:**
- Routes: `module.exports = router`
- Controllers: named function exports object — `module.exports = { buyShares, sellShares, ... }`
- Services: named function exports + error class — `module.exports = { TradeError, executeBuy, ... }`
- Models: `module.exports = mongoose.model('ModelName', schema)`
- Middleware: named exports for multi-export files (`auth.js`, `rateLimiters.js`); single default for single-export files (`validate.js`, `errorHandler.js`)

**Variables/Functions:**
- camelCase throughout
- Async service functions are named as verbs: `executeBuy`, `createDeposit`, `getPortfolio`
- Controller functions named as actions: `buyShares`, `getUserPortfolio`

---

## Where to Add New Code

**New AMM pricing service:**
- Implementation: `VentureCast_Backend-main/services/ammService.js` (new file)
- Import into: `VentureCast_Backend-main/services/tradeService.js` — call it from within the Mongoose session in `executeBuy` / `executeSell` replacing the naive bump at lines 115–118 and 221–223
- Unit tests: `VentureCast_Backend-main/tests/unit/ammService.test.js`

**New pricing/ledger fields on Shares model:**
- File: `VentureCast_Backend-main/models/Shares.js`
- Add new schema fields; update the `pre('save')` hook if `marketCap` derivation changes

**New trade endpoint (e.g., quote, limit order):**
- Schema: `VentureCast_Backend-main/middleware/schemas/tradeSchemas.js`
- Route: `VentureCast_Backend-main/routes/trade.js`
- Controller function: `VentureCast_Backend-main/controllers/tradeController.js`
- Service function: `VentureCast_Backend-main/services/tradeService.js`
- Integration test: `VentureCast_Backend-main/tests/integration/trade.test.js`

**New middleware:**
- Implementation: `VentureCast_Backend-main/middleware/<name>.js`
- Register: `VentureCast_Backend-main/index.js` (respect the ordering constraints — webhook must stay first)

**New Joi schema file:**
- Location: `VentureCast_Backend-main/middleware/schemas/<domain>Schemas.js`

**New utility:**
- Location: `VentureCast_Backend-main/utils/<name>.js`

---

## Special Directories

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**`tests/`:**
- Purpose: Jest test suite — unit + integration; helpers for in-memory DB and fixtures
- Generated: No
- Committed: Yes

**`.planning/`** (project root, not inside backend):
- Purpose: GSD planning documents consumed by `/gsd:plan-phase` and `/gsd:execute-phase`
- Generated: Yes (by map-codebase / plan-phase)
- Committed: Varies — check `.gitignore`
