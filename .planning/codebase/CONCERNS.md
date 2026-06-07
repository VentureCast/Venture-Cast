# Codebase Concerns

**Analysis Date:** 2026-06-03
**Scope:** VentureCast Backend (`VentureCast_Backend-main/`) only — AMM build focus.

---

## Money-Path Concerns (Blocking for Real-Money AMM)

### [HIGH] Pricing is a Naive Multiplicative Bump — NOT a Bonding Curve

- **Issue:** `executeBuy` and `executeSell` apply a linear multiplier to `sharePrice` based on `percentageTraded`. This is not a bonding curve (constant-product, sigmoid, or polynomial). A bonding curve gives deterministic, manipulation-resistant pricing where price is a continuous function of supply. The current formula allows unbounded price drift with no reserve constraint.
- **Files:** `VentureCast_Backend-main/services/tradeService.js:115-117` (buy), `:221-223` (sell)
- **Code:**
  ```js
  const percentageTraded = (shareCount / shareRecord.totalShares) * 100;
  const priceIncrease = 1 + percentageTraded * 0.001;
  shareRecord.sharePrice = shareRecord.sharePrice * priceIncrease;
  ```
- **Impact:** Price is not anchored to any invariant. A whale buying 10,000 shares gets the same relative bump as 10 shares at different scales; there is no slippage ceiling or reserve pool. For a real-money AMM this must be replaced with a curve formula (e.g., `p = k / (S0 - x)^2` or Bancor-style) with an on-chain-equivalent reserve tracked in a `Reserve` model.
- **Fix approach:** Introduce a `BondingCurve` model or a `reserve` field on `Shares.js`. Replace the multiplicative bump with a deterministic integral of the curve, committed atomically in the same Mongoose session.

---

### [HIGH] Single-Entry Accounting — No Double-Entry Ledger, No Reserve Account

- **Issue:** On a buy, `user.treasuryBalance.available -= totalCost` (tradeService.js:78) with no corresponding credit to a platform reserve or liquidity pool. On a sell, proceeds are added directly back to the user (`:195`). There is no counterparty. The `platformFee` field exists on `Transaction` (Transaction.js:92) but is always written as `0` by `executeBuy`/`executeSell` — it is never populated or routed anywhere.
- **Files:** `VentureCast_Backend-main/services/tradeService.js:77-78`, `:192-195`; `VentureCast_Backend-main/models/Transaction.js:92-95`
- **Impact:** Money disappears from a user's balance with no ledger entry on the other side. There is no way to reconcile platform float, no fee revenue capture, and no liquidity reserve that the bonding curve can draw on. A full audit trail is legally required for a real-money product.
- **Fix approach:** Add a `LedgerEntry` model with `debit_account`, `credit_account`, `amount_cents`, `transaction_id`. Introduce a synthetic `PLATFORM_RESERVE` account identifier. Every trade must produce two ledger rows (double-entry). Fee calculation must happen at trade time and route to the reserve account.

---

### [HIGH] Float Arithmetic on Money — Mixed Integer-Cents and Floating-Point Dollars

- **Issue:** `sharePrice` and `averageCost` are stored as raw `Number` (IEEE-754 float) in MongoDB — not integer cents. `totalCost = Math.round(currentPrice * shareCount * 100)` (tradeService.js:67) converts to cents for the balance deduction, but then `currentPrice` (a float) is stored directly in `Transaction.sharePrice` (:107) and used in `averageCost` calculations (:86-90) without rounding. The `averageCost` accumulation (`(totalOldValue + totalNewValue) / newTotalShares`) is pure float division.
- **Files:** `VentureCast_Backend-main/models/Shares.js:6` (`sharePrice: Number`), `models/User.js:109` (`averageCost: Number`), `services/tradeService.js:86-90`, `:107`
- **Impact:** Floating-point rounding errors compound across many trades. Over time, user balances and average cost bases will drift from the canonical cent-integer value. This creates reconciliation gaps, incorrect gain/loss display, and potential exploits (buying a fractional cent of value repeatedly).
- **Fix approach:** Store `sharePrice`, `averageCost`, and all monetary amounts as integer cents (`Number` constrained to integer, or rename to `sharePriceCents`). Remove all non-`Math.round` float paths in tradeService. The bonding curve formula must also operate in integer-cent space.

---

### [HIGH] No Idempotency Keys on Trade Endpoints — Double-Execution Risk

- **Issue:** `POST /trade/buy` and `POST /trade/sell` have no idempotency mechanism. A network timeout or client retry causes the full transaction (balance deduction + share price update + Transaction record) to execute again. There is no unique request identifier stored or checked.
- **Files:** `VentureCast_Backend-main/routes/trade.js:9-10`, `controllers/tradeController.js:4-16`, `services/tradeService.js:25-143`
- **Impact:** A user who retaps "Buy" after a slow response will be double-charged. The Mongoose transaction does not prevent this because each invocation is an independent session with no uniqueness guard.
- **Fix approach:** Accept a client-generated `idempotencyKey` (UUID) in the request body. Add a unique index on `Transaction.idempotencyKey`. At the start of `executeBuy`/`executeSell`, check for an existing completed transaction with that key; return the cached result instead of re-executing.

---

### [HIGH] No Optimistic Concurrency Control on the Share Document

- **Issue:** Two concurrent buy orders for the same `streamerId` will both read the same `sharePrice`, both compute their cost using that price, and then both `shareRecord.save()` — the second save overwrites the first. Mongoose transactions provide atomicity against partial writes within a single session but do NOT serialize concurrent sessions; the session for request B starts before request A commits, so B reads stale price data.
- **Files:** `VentureCast_Backend-main/services/tradeService.js:45-58` (read Share), `:114-118` (write Share price)
- **Impact:** Under concurrent load, share price updates are lost (last-write-wins). This allows users to execute trades at the pre-trade price even when a prior trade already moved it, creating arbitrage exposure and incorrect price history.
- **Fix approach:** Use MongoDB `findOneAndUpdate` with a `$inc` on a version counter, or use `{ new: true, ... where: { __v: knownVersion } }` and abort if the document was modified (optimistic locking). Alternatively, serialize share-price writes through a per-streamer queue (e.g., Redis-backed job queue) so only one trade per streamer executes at a time.

---

### [HIGH] User Document is a Write-Hotspot — Portfolio and Balance Embedded

- **Issue:** `user.portfolio` is an embedded array on the `User` document (User.js:101-111). `user.treasuryBalance` is also embedded (User.js:92-96). Every buy/sell calls `user.save({ session })` (tradeService.js:100, :206), which rewrites the entire document — including all portfolio entries, all payment methods, all external accounts, and KYC fields — just to update one balance field or one portfolio entry.
- **Files:** `VentureCast_Backend-main/models/User.js:92-111`, `services/tradeService.js:78`, `:100`, `:195`, `:206`
- **Impact:** Under concurrent trading: (a) write contention on the User document increases with portfolio size; (b) a user with 50 holdings writes 50 portfolio entries on every single trade; (c) there is no atomic increment — the whole subdoc is replaced, so concurrent balance updates can race (balance read–modify–write without a MongoDB `$inc`).
- **Fix approach:** Extract `portfolio` into a separate `Position` collection (one doc per user+streamer) and `treasuryBalance` into atomic `$inc` operations (`User.updateOne({ _id }, { $inc: { 'treasuryBalance.available': -totalCost } })`). This eliminates the document hotspot and enables true atomic balance mutation without reading the full user record.

---

### [HIGH] `stripeService.createTransfer` Mutates Balance Without a Mongoose Transaction

- **Issue:** `createTransfer` (stripeService.js:488-524) deducts `user.treasuryBalance.available -= amount` and calls `user.save()` outside any Mongoose transaction session. The `Transaction.create()` call at line 506 also has no session. If either call fails after the other succeeds, the balance and the ledger row are inconsistent.
- **Files:** `VentureCast_Backend-main/services/stripeService.js:506-521`
- **Impact:** Money can be debited without a corresponding transaction record (or vice versa), causing silent balance corruption. This is especially dangerous because `createTransfer` is the likely future call site for routing AMM proceeds.
- **Fix approach:** Wrap in a `mongoose.startSession()` / `session.withTransaction()` block matching the pattern already used in `tradeService.js`.

---

### [HIGH] Webhook Balance Updates Are Not Transactional and Use Additive Float Arithmetic

- **Issue:** `handleReceivedCredit` (webhook.js:356-372) does `user.treasuryBalance.available += receivedCredit.amount` and `user.save()` with no session and no idempotency check. Stripe may deliver the same webhook more than once; a duplicate delivery credits the user twice. `handleOutboundTransferPosted` (webhook.js:385-409) does the same additive pattern for debits.
- **Files:** `VentureCast_Backend-main/routes/webhook.js:364-365`, `:401`
- **Impact:** Duplicate webhook delivery = double credit. There is no `stripeReceivedCreditId` uniqueness check before updating balance, even though the field exists on the Transaction schema (Transaction.js:53).
- **Fix approach:** Before updating balance, use `Transaction.findOne({ stripeReceivedCreditId: receivedCredit.id })` to detect replays. Use `User.updateOne({ _id }, { $inc: { 'treasuryBalance.available': amount } })` for atomic increment instead of read-modify-write.

---

## Schema Design Concerns (Blocking for AMM Build)

### [HIGH] Price History is 7 Denormalized Scalar Fields — No Time-Series Support

- **Issue:** `Shares.js` stores price history as `day1Price` through `day7Price` flat fields (Shares.js:10-16). There is no timestamp, no sub-day granularity, and no way to add more history without a schema migration. The AMM requires continuous price feed for the bonding curve state and for chart rendering.
- **Files:** `VentureCast_Backend-main/models/Shares.js:10-16`; `services/tradeService.js:339-349` (reads all 7 fields)
- **Impact:** Cannot support intraday charting, OHLCV data, or a curve-state history audit log. The fields are also never written in `executeBuy`/`executeSell` — they remain `null` forever because there is no cron job or hook that rotates them.
- **Fix approach:** Introduce a `PriceSnapshot` collection (`{ streamerId, price, supply, timestamp, tradeId }`). Write one snapshot per trade inside the existing Mongoose session. Drop `day1Price`–`day7Price` from `Shares.js`.

### [MEDIUM] `marketCap` is Computed in a `pre('save')` Hook Using Float Multiplication

- **Issue:** `shareSchema.pre('save')` computes `this.marketCap = this.sharePrice * this.totalShares` (Shares.js:25-28). Since `sharePrice` is a float, `marketCap` inherits all float error. `totalShares` is never updated by trades — it is initialized to `1,000,000` and then left static while the price moves. This means `marketCap` is `price × 1,000,000` always, regardless of how many shares are actually in circulation.
- **Files:** `VentureCast_Backend-main/models/Shares.js:7`, `:24-28`
- **Fix approach:** For a bonding curve, `totalShares` should represent circulating supply and be updated on each trade. `marketCap` should be derived from the integral of the curve, not a simple multiply.

### [MEDIUM] No `ticker` Field on Share Record — Shares Keyed Only by `streamerId` ObjectId

- **Issue:** `Shares.js` has no `ticker`. `Streamer.js` has a `ticker` field (streamer.js:6) but it is `sparse: true` and optional. All trade routes use raw `streamerId` ObjectId. There is no enforced relationship between a ticker symbol and a share record.
- **Files:** `VentureCast_Backend-main/models/Shares.js`, `models/streamer.js:6`
- **Impact:** AMM order routing will need a ticker-to-streamer-to-share resolution chain with no guaranteed uniqueness guarantee at the share level.

---

## General Tech Debt

### [HIGH] Leftover `prisma/` Directory at Repository Root — Dead PostgreSQL Schema

- **Issue:** `prisma/schema.prisma` exists at the repo root (`/prisma/schema.prisma`) with a PostgreSQL datasource and an empty schema (no models). The active backend uses Mongoose/MongoDB exclusively. There is also a root `package.json` with only `cc` and `npmx` as dependencies, and backup lockfiles `package-lock.json.backup` and `package.json.backup`.
- **Files:** `/prisma/schema.prisma`, `/package.json`, `/package.json.backup`, `/package-lock.json.backup`
- **Impact:** Confuses tooling (Prisma CLI will attempt migration against a nonexistent `DATABASE_URL`). Backup files should not be committed. A new engineer may incorrectly assume Prisma is in use.
- **Fix approach:** Delete `prisma/`, root `package.json`, and both `.backup` files. Add them to `.gitignore` if re-created locally.

### [HIGH] `socket.io` Installed but Entirely Unused

- **Issue:** `socket.io` is listed as a production dependency (package.json:32) but is not imported or initialized anywhere in `index.js` or any route. There is no `Server` instantiation, no event emitters, and no real-time price feed.
- **Files:** `VentureCast_Backend-main/package.json:32`
- **Impact:** Dead dependency adds ~3 MB to the Docker image, increases attack surface, and signals an unimplemented real-time pricing feature that the AMM will require.
- **Fix approach:** Either implement the real-time price feed using `socket.io` (needed for AMM price streaming), or remove the dependency until that phase.

### [MEDIUM] Express Session Uses In-Memory Store with `saveUninitialized: true`

- **Issue:** `index.js:66-74` configures `express-session` with no explicit store (defaults to `MemoryStore`). `saveUninitialized: true` means every unauthenticated request creates a session. MemoryStore leaks memory unboundedly in production and is not shared across multiple backend instances (Docker replicas).
- **Files:** `VentureCast_Backend-main/index.js:66-74`
- **Impact:** Cannot scale horizontally. Memory leak in production. Sessions are also redundant since JWT (`authenticateToken`) is the actual auth mechanism for all trade endpoints — session is only used for Passport/OAuth flows.
- **Fix approach:** Switch to `connect-redis` with the existing Redis service (already in `docker-compose.yml`). Set `saveUninitialized: false`.

### [MEDIUM] Google OAuth Callback Redirects Token in URL Query String

- **Issue:** `auth.js:111-113` issues `res.redirect('http://localhost:3000/home?token=' + token)`. JWT is exposed in the URL, which is logged by browsers, proxies, and request loggers.
- **Files:** `VentureCast_Backend-main/routes/auth.js:111-113`
- **Impact:** Token leakage via Referer header, browser history, and server access logs. Hardcoded `localhost:3000` will not work in production.
- **Fix approach:** Return token via a short-lived one-time code redeemed by the frontend, or use a POST redirect with `httpOnly` cookie.

### [MEDIUM] JWT Expiry is 1 Hour with No Refresh Token Mechanism

- **Issue:** `jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' })` (auth.js:56, :111). There is no refresh token endpoint, no token revocation list, and no sliding expiry.
- **Files:** `VentureCast_Backend-main/routes/auth.js:56`, `:111`
- **Impact:** After 1 hour, the user is silently logged out mid-session. There is no way to invalidate a token if a user's KYC status is revoked between issuance and expiry.
- **Fix approach:** Implement a refresh token rotation pattern. For KYC revocation, maintain a token blocklist in Redis (keyed by `jti`).

### [LOW] `tradeLimiter` Allows 30 Requests per Minute per IP — Not per User

- **Issue:** `tradeLimiter` (rateLimiters.js:22-28) uses the default `express-rate-limit` key (remote IP). A single user behind a shared IP (corporate NAT) may be blocked while an attacker with rotating IPs can make unlimited requests.
- **Files:** `VentureCast_Backend-main/middleware/rateLimiters.js:22-28`, `index.js:99`
- **Fix approach:** Key the limiter by `req.userId` (available after `authenticateToken`) for trade routes. Keep IP-based limiting as a secondary defense.

### [LOW] `body-parser` Listed as Explicit Dependency — Redundant with Express 4.x

- **Issue:** `body-parser@^1.20.3` is in `dependencies` (package.json:17) but Express 4.16+ bundles it. It is not imported anywhere in the codebase — `express.json()` and `express.urlencoded()` are used directly.
- **Files:** `VentureCast_Backend-main/package.json:17`
- **Fix approach:** Remove from `dependencies`.

---

## Test Coverage Gaps

### [HIGH] No Concurrency / Race Condition Tests

- **Issue:** There are zero tests that fire two `executeBuy` or `executeSell` calls for the same `streamerId` concurrently and assert on the resulting share price, user balance, and transaction count. The risk of the last-write-wins price update (see concurrency concern above) is entirely unverified.
- **Files:** `VentureCast_Backend-main/tests/unit/tradeService.test.js`, `tests/integration/trade.test.js`
- **Risk:** Price manipulation via concurrent trades will go undetected until production.
- **Priority:** High

### [HIGH] No Tests for Idempotency / Duplicate Submission

- **Issue:** No test submits the same buy request twice and asserts that only one transaction and one balance deduction result.
- **Files:** `VentureCast_Backend-main/tests/unit/tradeService.test.js`
- **Risk:** Double-charges will reach users before being caught.
- **Priority:** High

### [HIGH] No Tests for Float Rounding Edge Cases

- **Issue:** No test asserts that `averageCost` accumulation across multiple buys at different prices produces an exact cent-level result. No test checks that `sharePrice` after N trades is deterministic and matches a known-good value.
- **Files:** `VentureCast_Backend-main/tests/unit/tradeService.test.js`
- **Risk:** Rounding drift goes undetected until a reconciliation audit.
- **Priority:** High

### [MEDIUM] Stripe Service Has Zero Unit or Integration Tests

- **Issue:** `stripeService.js` (574 lines) has no test file. None of the deposit, withdrawal, balance-update, or webhook handler paths are tested. The `createTransfer` non-transactional bug (see above) is completely uncovered.
- **Files:** `VentureCast_Backend-main/services/stripeService.js`; no corresponding test file exists.
- **Risk:** Stripe integration regressions are invisible.
- **Priority:** Medium

### [MEDIUM] Webhook Handler Functions Have No Tests

- **Issue:** All handler functions in `routes/webhook.js` (e.g., `handleReceivedCredit`, `handleOutboundTransferPosted`) are untested. The duplicate-delivery idempotency gap is unverified.
- **Files:** `VentureCast_Backend-main/routes/webhook.js`
- **Risk:** Silent balance corruption from replayed webhooks.
- **Priority:** Medium

### [LOW] `db.js` Test Helper Uses Plain `mongoose.connect` — Not ReplSet URI Resolution

- **Issue:** `tests/helpers/db.js:5` calls `mongoose.connect(process.env.MONGODB_URI)` directly. The URI is set by `tests/setup.js` to the `MongoMemoryReplSet` URI, which works. However, if `MONGODB_URI` is pre-set in the environment before the global setup runs (e.g., in CI), the test DB helper will connect to the real database and `clearTestDB()` will delete production data.
- **Files:** `VentureCast_Backend-main/tests/helpers/db.js:3-8`, `tests/setup.js:10`
- **Fix approach:** Assert `NODE_ENV === 'test'` in `connectTestDB()` before connecting.

---

## Missing Infrastructure for AMM Build

### [HIGH] No `Reserve` / `LiquidityPool` Model

- **Issue:** There is no model representing the bonding curve's reserve pool — the funds that back the share price. Without this, a bonding curve cannot be implemented correctly (the curve integral determines how much reserve is released on a sell).
- **Fix approach:** Add a `LiquidityPool` collection (`{ streamerId, reserveBalance, supply, curveParams, version }`). All trade money flows through this pool.

### [HIGH] No `LedgerEntry` / `JournalEntry` Model

- **Issue:** No double-entry ledger exists. The `Transaction` model is a single-sided record. There is no way to produce a trial balance or detect leakage.
- **Fix approach:** Add `LedgerEntry` with `{ journalId, account, direction (DR/CR), amountCents, currency, createdAt }`. Two rows per trade minimum.

### [MEDIUM] No Platform Fee Routing

- **Issue:** `Transaction.platformFee` field exists but is always `0`. There is no platform revenue account, no fee calculation function, and no route for fees to flow.
- **Files:** `VentureCast_Backend-main/models/Transaction.js:92-95`, `services/tradeService.js` (never sets `platformFee`)
- **Fix approach:** Add a `feeRate` to the bonding curve config. At trade time, compute fee = `totalCost * feeRate`, route to a `PLATFORM_REVENUE` ledger account, and reduce the reserve credit by the fee amount.

---

*Concerns audit: 2026-06-03*
