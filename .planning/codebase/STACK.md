# Technology Stack

**Analysis Date:** 2026-06-03

> **Scope note:** This document covers the backend (`VentureCast_Backend-main/`) and root-level
> orchestration (Docker, Nginx, Makefile). The React Native + TypeScript frontend
> (`VentureCast_Frontend-main/`) is out of scope for current AMM work.

---

## Languages

**Primary:**
- JavaScript (ES2020+, CommonJS modules) — all backend source code
  - No TypeScript; no `"type": "module"` — everything is `require()`/`module.exports`

**Secondary:**
- Python 3 — data-fetch scripts at repo root (`datatrend.py`, `twitch_data_fetcher.py`, `requirements.txt`)

---

## Runtime

**Environment:**
- Node.js — Docker images pin `node:18-alpine` (both `Dockerfile` and `Dockerfile.dev`)
- Local dev toolchain reports Node v24.9.0 but the container target is **Node 18 LTS**

**Package Manager:**
- npm (backend) — `package-lock.json` lockfileVersion 3
- No Yarn / pnpm for backend; `node_modules/` is standard

---

## Frameworks

**Core:**
- Express 4.21.1 — HTTP server, routing, middleware chain
  - Entry point: `VentureCast_Backend-main/index.js`
  - Exported as `module.exports = app` for supertest; `app.listen()` guarded by `require.main === module`

**Auth / Session:**
- Passport 0.7.0 — OAuth strategy runner
  - `passport-google-oauth20` 2.0.0 — Google OAuth 2.0 (configured in `routes/auth.js`)
  - `passport-apple` 2.0.2 — Apple Sign-In (dependency present; strategy setup not observed in routes)
- `express-session` 1.18.1 — server-side sessions (cookie backed; Redis not wired as session store despite Redis being present)
- `jsonwebtoken` 9.0.2 — JWT issuance and verification (`middleware/auth.js`)
- `bcryptjs` 2.4.3 — password hashing (10 rounds, `routes/auth.js`)

**Database / ODM:**
- Mongoose 8.7.1 — MongoDB ODM
  - Connection config: `VentureCast_Backend-main/config/db.js`
  - Max pool size: 10; server selection timeout: 5s; socket timeout: 45s
  - Exponential-backoff retry on connect failure (max 5 retries, cap 16s delay)
  - Transactions used in `tradeService.js` via `mongoose.startSession()` (requires replica set)

**Payments:**
- stripe 18.2.1 — official Node SDK
  - Initialized in `services/stripeService.js` with `apiVersion: '2023-10-16'`

**Real-time:**
- socket.io 4.8.0 — WebSocket support declared in `package.json`; not yet wired in `index.js` (no `io` instance created)

**HTTP / External calls:**
- axios 1.7.7 — outbound HTTP client (used in data-fetching scripts; not observed in live backend routes)

**Validation:**
- joi 18.0.2 — schema validation; schemas in `middleware/schemas/`
  - Applied via `middleware/validate.js` wrapper

**Security:**
- helmet 8.1.0 — security headers (`contentSecurityPolicy: false`)
- cors 2.8.5 — origin whitelist: `localhost:3000`, `localhost:8081`, `process.env.FRONTEND_URL`
- `express-rate-limit` 8.2.1 — four tiered limiters (`middleware/rateLimiters.js`):
  - `authLimiter`: 10 req / 15 min
  - `paymentLimiter`: 50 req / 1 hr
  - `tradeLimiter`: 30 req / 1 min
  - `apiLimiter`: 100 req / 1 min

**Logging:**
- winston 3.19.0 — structured JSON logger; console transport with colorized dev format
  - `LOG_LEVEL` env var; defaults to `debug` in dev, `info` in production
  - Config: `VentureCast_Backend-main/utils/logger.js`

**External data / OAuth:**
- googleapis 144.0.0 — Google APIs client (YouTube / creator data)

**Testing (devDependencies):**
- jest 30.2.0 — test runner (`--runInBand --forceExit`)
- supertest 7.2.2 — HTTP integration testing
- `mongodb-memory-server` 11.0.1 — in-memory MongoDB (must use `MongoMemoryReplSet` for transaction support)
- `@faker-js/faker` 10.3.0 — test fixture generation
- nodemon 3.0.1 — dev hot-reload

---

## Key Dependencies

**Critical (production):**

| Package | Version | Role |
|---------|---------|------|
| `express` | ^4.21.1 | HTTP framework, all routing |
| `mongoose` | ^8.7.1 | MongoDB ODM, ACID transactions |
| `stripe` | ^18.2.1 | Payments — Connect, Treasury, webhooks |
| `jsonwebtoken` | ^9.0.2 | API authentication |
| `passport` | ^0.7.0 | OAuth strategy management |
| `joi` | ^18.0.2 | Request validation |
| `helmet` | ^8.1.0 | HTTP security headers |
| `express-rate-limit` | ^8.2.1 | Rate limiting |
| `winston` | ^3.19.0 | Structured logging |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `googleapis` | ^144.0.0 | YouTube/creator data |
| `socket.io` | ^4.8.0 | Real-time (declared, not active) |

---

## Configuration

**Environment:**
- Loaded via `dotenv` in `index.js` and individual route files that call `require('dotenv').config()`
- Source file: `VentureCast_Backend-main/.env` (present; contents are secret — not listed here)
- Docker compose mounts `.env` via `env_file` directive and overrides `MONGODB_URI` at container level

**Key environment variable names** (values not shown):
```
PORT                  # Default: 3001
NODE_ENV              # development | production | test
JWT_SECRET
SESSION_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MONGODB_URI           # Default: mongodb://localhost:27017/venture-cast-backend
FRONTEND_URL          # Added to CORS allowlist
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
APPLE_CLIENT_ID
APPLE_TEAM_ID
APPLE_KEY_ID
LOG_LEVEL             # Optional; debug in dev, info in prod
```

**Build / config files:**
- `VentureCast_Backend-main/package.json` — scripts, dependencies
- `VentureCast_Backend-main/jest.config.js` — test runner config
- `VentureCast_Backend-main/.dockerignore` — Docker build exclusions

---

## Docker Setup

**Images:**
- `VentureCast_Backend-main/Dockerfile` — production; `node:18-alpine`; non-root `nodejs` user; `npm ci --only=production`; healthcheck hits `GET /`
- `VentureCast_Backend-main/Dockerfile.dev` — dev; `node:18-alpine`; `npm install` (all deps); `nodemon --legacy-watch index.js`

**Compose files:**
- `docker-compose.yml` — dev stack (default):
  - `mongodb` service: `mongo:7.0`, port 27017, named volume `mongodb_data`
  - `backend` service: builds `Dockerfile.dev`, depends on `mongodb` (health), hot-reloads with nodemon
  - `frontend` service: React Native Metro on port 8081 (out of scope for AMM work)
  - `redis` service: `redis:7-alpine`, port 6379, named volume `redis_data`
  - `nginx` service: `nginx:alpine`, ports 80/443, gated behind `profiles: [production]`
- `docker-compose.prod.yml` — production overrides:
  - Backend uses production `Dockerfile` (no volume mount, `node index.js`)
  - MongoDB adds root credentials via `${MONGO_PROD_USERNAME}` / `${MONGO_PROD_PASSWORD}`
  - Redis adds `--requirepass ${REDIS_PASSWORD}`
  - Nginx profile removed (always on in prod)

**Nginx** (`nginx.conf`):
- Reverse proxy: `/api` → backend:3001, `/auth` → backend:3001, `/streamer` → backend:3001, `/stripe` → backend:3001
- WebSocket upgrade: `/socket.io` → backend:3001
- Gzip enabled; security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

**Network:** single bridge network `venturecast-network`

**Makefile targets** (`Makefile` in repo root):
- `make up` / `make down` / `make restart`
- `make dev-backend` — starts only `backend mongodb redis`
- `make logs-backend`, `make shell-backend`, `make shell-mongo`
- `make db-backup` / `make db-restore`
- `make test-docker` — runs `./scripts/test-docker.sh`
- `make health` — curl + mongosh ping checks

---

## Platform Requirements

**Development:**
- Docker + Docker Compose (recommended hybrid: backend in Docker, frontend local)
- Node.js 18+ for local backend dev
- MongoDB reachable at `localhost:27017` (or via Docker) — **must be a replica set** for Mongoose transactions to work

**Production:**
- Docker Compose with prod override (`docker-compose.prod.yml`)
- MongoDB credentials via `MONGO_PROD_USERNAME` / `MONGO_PROD_PASSWORD` env vars
- Nginx as TLS terminator (cert volumes not configured in current nginx.conf)
- All Stripe webhook traffic must reach `POST /webhook` with raw body intact

---

*Stack analysis: 2026-06-03*
