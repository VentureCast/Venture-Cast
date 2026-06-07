---
phase: 05-api-surface
plan: "01"
subsystem: amm-api-foundation
tags: [api, amm, markets, admin, tdd, express, mongoose]
dependency_graph:
  requires: [04-01]
  provides: [amm-router-mounted, User.isAdmin, requireAdmin, generateAdminToken, GET-/markets, GET-/markets/:id]
  affects: [05-02, 05-03]
tech_stack:
  added: []
  patterns: [optionalAuth-on-reads, validate-params-before-db, N+1-free-batch-fetch, tdd-red-green]
key_files:
  created:
    - VentureCast_Backend-main/middleware/requireAdmin.js
    - VentureCast_Backend-main/middleware/schemas/ammSchemas.js
    - VentureCast_Backend-main/controllers/ammController.js
    - VentureCast_Backend-main/routes/amm.js
    - VentureCast_Backend-main/tests/integration/amm.test.js
  modified:
    - VentureCast_Backend-main/models/User.js
    - VentureCast_Backend-main/tests/helpers/fixtures.js
    - VentureCast_Backend-main/index.js
decisions:
  - "ammRoutes mounted at '/' with apiLimiter; per-route tradeLimiter will guard POSTs in 05-02"
  - "validate(marketIdParam,'params') runs before optionalAuth on GET /markets/:id — invalid id 400s with zero DB hits"
  - "listMarkets uses a single MarketState batch query (one $in per request) to avoid N+1"
  - "generateAdminToken signs same JWT shape as generateAuthToken; admin authority comes from User.isAdmin, not token claims"
metrics:
  duration: "5 min"
  completed_date: "2026-06-07"
  tasks_completed: 3
  files_changed: 8
---

# Phase 5 Plan 01: AMM API Foundation Summary

AMM read-only API foundation: GET /markets + GET /markets/:id with optionalAuth, requireAdmin guard, User.isAdmin field, admin JWT helper, and Wave-0 TDD integration scaffold — all 7 tests green, 164 total pass.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 0 | User.isAdmin + generateAdminToken + amm.test.js scaffold | 84a4ea5 | models/User.js, tests/helpers/fixtures.js, tests/integration/amm.test.js |
| 1 | requireAdmin middleware + ammSchemas (marketIdParam) | 0e499f4 | middleware/requireAdmin.js, middleware/schemas/ammSchemas.js |
| 2 | GET /markets + /markets/:id + index.js mount (TDD) | 9dec7fa | controllers/ammController.js, routes/amm.js, index.js |

## What Was Built

**User.isAdmin** (`models/User.js`): `isAdmin: { type: Boolean, default: false }` added to UserSchema in the ADMIN FLAG section, between KYC block and portfolio block.

**generateAdminToken** (`tests/helpers/fixtures.js`): signs identical JWT shape to `generateAuthToken`; admin authority flows from the User document's `isAdmin` field at request time, not from a special token claim.

**amm.test.js** (`tests/integration/amm.test.js`): Wave-0 supertest scaffold mirroring trade.test.js — MongoMemoryReplSet via connectTestDB/clearTestDB/disconnectTestDB, 7 tests covering: no-auth 200 array, 7 fields present, priceCents correctness, authed 200, detail 200, missing 404, invalid-id 400.

**requireAdmin** (`middleware/requireAdmin.js`): single function, 401 if `!req.user`, 403 if `!req.user.isAdmin`, `next()` for admins. Always chained after `authenticateToken`. Mirrors `verifyOwnership` style from auth.js.

**ammSchemas** (`middleware/schemas/ammSchemas.js`): `marketIdParam = Joi.object({ id: objectId.required() })` — same `objectId` pattern as tradeSchemas.js. Export object shape allows 05-02/05-03 to add fields without import changes.

**ammController** (`controllers/ammController.js`): `listMarkets` fetches all markets + batch-fetches all MarketState docs ($in), builds a map, maps to `{ marketId, streamerId, tier, status, supply, priceCents, reserveCents }` with `priceCents(supply, {P0_cents,k_num,k_den})`. `getMarket` does `findById` lean + single MarketState lookup; 404 if market absent.

**routes/amm.js**: `GET /markets` → optionalAuth → listMarkets; `GET /markets/:id` → validate(marketIdParam,'params') → optionalAuth → getMarket. Validate before auth so invalid :id 400s without a DB hit.

**index.js mount**: `app.use('/', apiLimiter, ammRoutes)` added after watchlistRoutes, before 404 handler. POSTs in 05-02 will add per-route tradeLimiter inside the router.

## Decisions Made

1. **AMM router mounted at `/` with `apiLimiter`** — matches existing pattern for read-heavy routes; quote/order POSTs (05-02) will add `tradeLimiter` per-route inside the router so the mount point doesn't need changing.
2. **Joi validate on params before optionalAuth** — ensures a malformed `:id` returns 400 immediately, without touching the DB or running optionalAuth's User.findById.
3. **N+1-free batch fetch in listMarkets** — single `MarketState.find({ marketId: { $in: ids } })` per request, O(1) map lookup per market. Scales to any number of markets.
4. **generateAdminToken signs same payload as generateAuthToken** — admin identity is a DB field, not a JWT claim, so the token format is identical; tests create admin users via `createTestUser({ isAdmin: true })`.

## Test Results

```
Tests: 7 passed (amm.test.js — GET /markets + GET /markets/:id)
Full suite: 164 passed, 0 failed, 11 test suites
Regressions: none
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created files confirmed on disk. All task commits confirmed in git log.
