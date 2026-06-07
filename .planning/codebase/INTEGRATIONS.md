# External Integrations

**Analysis Date:** 2026-06-03

> **Scope note:** Backend integrations only (`VentureCast_Backend-main/`).
> The React Native frontend additionally uses Supabase and Firebase directly,
> but those are not wired to the backend API.

---

## APIs & External Services

### Stripe (Primary payments infrastructure)

Stripe is the most deeply integrated external service. Three product areas are used:

**Stripe Connect (Custom accounts):**
- Purpose: Each user gets a Custom Connect account for KYC, regulated trading, and payouts
- Operations: `stripe.accounts.create`, `stripe.accounts.retrieve`, `stripe.accountLinks.create`, `stripe.accounts.createExternalAccount`, `stripe.accounts.listExternalAccounts`
- Account type: `custom`, country `US`, capabilities: `card_payments`, `transfers`, `treasury`
- MCC: `6211` (securities), business URL: `https://venturecast.app`
- Implementation: `VentureCast_Backend-main/services/stripeService.js`
- Auth env var: `STRIPE_SECRET_KEY`
- API version pinned to: `2023-10-16` (hardcoded in `stripeService.js` constructor)

**Stripe Treasury (Financial accounts):**
- Purpose: Each user's in-app cash wallet; balance lives in a Treasury Financial Account
- Operations: `stripe.treasury.financialAccounts.create`, `.retrieve`, `stripe.treasury.outboundTransfers.create`
- Features requested: `card_issuing`, `deposit_insurance`, `financial_addresses.aba`, `inbound_transfers.ach`, `intra_stripe_flows`, `outbound_payments.ach/us_domestic_wire`, `outbound_transfers.ach/us_domestic_wire`
- Balance stored in cents on `User.treasuryBalance.available` (cached; updated from live FA on deposit confirm and balance fetch)
- Implementation: `VentureCast_Backend-main/services/stripeService.js`
- Auth env var: `STRIPE_SECRET_KEY`

**Stripe Customers & Payment Methods:**
- Purpose: Card-based deposits into the Treasury account
- Operations: `stripe.customers.create`, `stripe.setupIntents.create`, `stripe.paymentIntents.create`, `stripe.paymentMethods.list`, `stripe.paymentMethods.detach`
- Payment method type: `card` only
- Implementation: `VentureCast_Backend-main/services/stripeService.js`
- Auth env var: `STRIPE_SECRET_KEY`

**Stripe Webhooks:**
- Purpose: Async status updates for payments, KYC verification, Treasury events
- Endpoint: `POST /webhook` — receives raw body (registered before JSON middleware in `index.js`)
- Signature verification: `stripe.webhooks.constructEvent(req.body, sig, endpointSecret)`
- Events handled in `VentureCast_Backend-main/routes/webhook.js`:
  - `account.updated` — updates KYC status, onboarding status on `User`
  - `account.application.deauthorized` — disables account
  - `payment_intent.succeeded` / `.payment_failed` / `.canceled` — updates `Transaction` status
  - `payment_method.attached` / `.detached` — syncs `User.paymentMethods` array
  - `treasury.financial_account.features_status_updated` — logged only
  - `treasury.received_credit.created` — increments `User.treasuryBalance.available`
  - `treasury.received_debit.created` — logged only
  - `treasury.outbound_transfer.posted` / `.failed` / `.returned` — updates `Transaction` + adjusts cached balance
  - `payout.created` / `.paid` / `.failed` — logged only
  - `capability.updated` — logged only
- Auth env var: `STRIPE_WEBHOOK_SECRET`

---

### Google OAuth 2.0

- Purpose: Social sign-in for users
- Strategy: `passport-google-oauth20` v2.0.0 (Passport.js)
- Flow: redirect to `/auth/google` → callback at `GOOGLE_CALLBACK_URL` → JWT issued and redirected to `http://localhost:3000/home?token=<jwt>`
- Scopes requested: `profile`, `email`
- Implementation: `VentureCast_Backend-main/routes/auth.js`
- Auth env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`

### Google APIs / YouTube (Creator data)

- Purpose: Fetching creator/streamer subscriber counts, view counts, channel metadata
- SDK: `googleapis` v144.0.0
- Implementation: used in root-level Python scripts (`twitch_data_fetcher.py`, `datatrend.py`) for data ingestion; no live backend route calls `googleapis` at runtime in the Express server
- The `Streamer` model (`VentureCast_Backend-main/models/streamer.js`) stores `subscriberCount`, `followerCount`, `totalViews`, `platform` which are populated by offline scripts
- Auth: Google service credentials (not a backend runtime concern currently)

### Apple Sign-In

- Purpose: Social sign-in via Apple ID
- Strategy: `passport-apple` v2.0.2
- Status: dependency is installed but no Apple strategy configuration is observed in backend routes (`routes/auth.js` only configures Google); Apple support appears incomplete
- Auth env vars (referenced in CLAUDE.md): `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`

---

## Data Storage

### MongoDB

- Type: Document database (MongoDB 7.0 via Docker)
- Purpose: Primary data store for all application entities
- Connection: `VentureCast_Backend-main/config/db.js`
- Connection string env var: `MONGODB_URI`
  - Default: `mongodb://localhost:27017/venture-cast-backend`
  - Docker override: `mongodb://mongodb:27017/venture-cast-backend`
- ODM: Mongoose 8.7.1 with connection pool (maxPoolSize: 10)
- Database name: `venture-cast-backend`
- **Replica set required** for Mongoose ACID transactions (`tradeService.js` uses `mongoose.startSession()`)
- Collections / models:
  - `users` — `VentureCast_Backend-main/models/User.js` (Stripe IDs, KYC status, portfolio, payment methods, bank accounts)
  - `shares` — `VentureCast_Backend-main/models/Shares.js` (per-streamer share price, 7-day price history; `marketCap` auto-calculated via pre-save hook)
  - `transactions` — `VentureCast_Backend-main/models/Transaction.js` (all financial events; Stripe reference IDs)
  - `streamers` — `VentureCast_Backend-main/models/streamer.js` (creator metadata; `category` and `name` indexed)
  - `watchlists` — `VentureCast_Backend-main/models/Watchlist.js`
- Docker volume: `mongodb_data` (dev), `mongodb_data_prod` (prod)
- Health check: `echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet`

### Redis

- Type: In-memory key-value store (`redis:7-alpine`)
- Purpose: Declared for session management; **not yet wired as the Express session store** — `express-session` currently uses in-memory storage (MemoryStore default), Redis is running but unused by backend code
- Connection port: `6379`
- Docker volume: `redis_data` (dev), `redis_data_prod` (prod with password via `${REDIS_PASSWORD}`)
- Health check: `redis-cli ping`

---

## Authentication & Identity

**Custom JWT auth (primary):**
- Tokens signed with `JWT_SECRET`, expiry `1h`
- Issued on `POST /auth/signin` and OAuth callbacks
- Verified by `middleware/auth.js` (`authenticateToken`, `optionalAuth`, `verifyOwnership`)
- Token passed as `Authorization: Bearer <token>` header

**Google OAuth (social):**
- Via Passport.js — see Google OAuth section above
- On success: JWT is generated and user redirected to frontend with token in query string

**KYC / Identity verification:**
- Handled entirely by Stripe Connect onboarding flow
- Backend tracks status in `User.kycVerificationStatus` (`unverified` | `pending` | `verified` | `failed`)
- `tradeService.js` enforces `kycVerificationStatus === 'verified'` before any buy/sell execution
- Status transitions driven by `account.updated` webhook events from Stripe

**Supabase / Firebase (frontend only):**
- Supabase: configured in `VentureCast_Frontend-main/supabaseClient.ts`
- Firebase: configured in `VentureCast_Frontend-main/firebase.js`
- Neither is used by or called from the backend Express server

---

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, or similar SDK wired)

**Logs:**
- Winston structured JSON to stdout/stderr (`VentureCast_Backend-main/utils/logger.js`)
- Console transport only; no file transport, no log aggregation service configured
- Request logging via `VentureCast_Backend-main/middleware/requestLogger.js`
- Log level controlled by `LOG_LEVEL` env var; defaults to `debug` (dev) / `info` (prod)
- Docker logs accessible via `make logs-backend` → `docker-compose logs -f backend`

---

## CI/CD & Deployment

**Hosting:**
- Docker Compose on any Linux host (no cloud-specific config detected)
- Nginx reverse proxy for production (`nginx.conf`; TLS termination not configured in current config)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no CircleCI, no Jenkins config)

**Deploy process:**
- `make build-prod` → `make up-prod` (wraps `docker-compose -f docker-compose.yml -f docker-compose.prod.yml`)

---

## Webhooks & Callbacks

**Incoming (Stripe → backend):**
- `POST /webhook` — all Stripe events; raw body required; signature verified with `STRIPE_WEBHOOK_SECRET`
- Registered BEFORE the JSON body parser in `index.js` (critical for signature verification)

**Outgoing (backend → external):**
- Stripe API calls initiated by service layer (`stripeService.js`) on user actions
- Google OAuth callback redirects to `GOOGLE_CALLBACK_URL`
- No other outgoing webhooks configured

---

## Environment Configuration Summary

All secrets live in `VentureCast_Backend-main/.env` (not committed). Required vars:

```
# Server
PORT
NODE_ENV
FRONTEND_URL

# Auth
JWT_SECRET
SESSION_SECRET

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# MongoDB
MONGODB_URI

# Google OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL

# Apple Sign-In (incomplete integration)
APPLE_CLIENT_ID
APPLE_TEAM_ID
APPLE_KEY_ID

# Production only (docker-compose.prod.yml)
MONGO_PROD_USERNAME
MONGO_PROD_PASSWORD
REDIS_PASSWORD
```

---

*Integration audit: 2026-06-03*
