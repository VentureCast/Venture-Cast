---
phase: 05-api-surface
plan: "03"
subsystem: admin-surface
tags: [admin, api, ledger, reconcile, risk-events, requireAdmin, joi]
dependency_graph:
  requires: ["05-01", "05-02"]
  provides: ["API-05"]
  affects: ["routes/amm.js", "controllers/ammController.js", "middleware/schemas/ammSchemas.js"]
tech_stack:
  added: []
  patterns: ["requireAdmin guard chaining", "AdminAction audit trail", "ledger reconcile via Σ LedgerEntry.delta"]
key_files:
  created: []
  modified:
    - VentureCast_Backend-main/middleware/schemas/ammSchemas.js
    - VentureCast_Backend-main/controllers/ammController.js
    - VentureCast_Backend-main/routes/amm.js
    - VentureCast_Backend-main/tests/integration/amm.test.js
decisions:
  - "authenticateToken runs before requireAdmin on every /admin/* route so missing token → 401 and non-admin → 403 (never short-circuit the DB lookup)"
  - "adminReconcile does a full Σ LedgerEntry.delta scan in-memory for simplicity; no aggregation pipeline needed at this data volume"
  - "action label in adminPatchMarket is 'pause_market'/'resume_market' when status field present, 'set_tier' otherwise — covers all patchable mutations"
  - "generateAdminToken and generateAuthToken sign identical JWT shapes; admin authority derives from User.isAdmin in DB (from authenticateToken DB lookup), not from JWT payload"
metrics:
  duration: "4 min"
  completed_date: "2026-06-07"
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 03: Admin Surface (API-05) Summary

Admin surface behind `requireAdmin`: four guarded routes create/pause markets, view risk events, and reconcile the ledger double-entry integrity. Routes extend `routes/amm.js` and `controllers/ammController.js`; schemas extend `ammSchemas.js`. 195/195 tests green.

## What Was Built

**Admin Joi schemas** (`ammSchemas.js`):
- `createMarketSchema` — streamerId + reserveFloorCents (required); optional P0_cents, k_num, k_den, tier, spreadBps, feeBps
- `patchMarketSchema` — at least one of status/'active'|'paused', tier, spreadBps, feeBps; `.min(1)` enforced

**Admin controller handlers** (`ammController.js`):
- `adminCreateMarket` — delegates to `genesisService.openMarket(req.body)`; writes `AdminAction` with `create_market`; returns 201 `{ market, marketState }`
- `adminPatchMarket` — finds market by id (404 on miss); applies status/tier/spreadBps/feeBps from body; records before/after in `AdminAction` (`pause_market`/`resume_market`/`set_tier`); returns 200 `{ market }`
- `adminListRiskEvents` — `RiskEvent.find().sort({createdAt:-1}).limit(min(limit||50,200)).lean()`; returns `{ events }`
- `adminReconcile` — sums all `LedgerEntry.delta` per `accountKey`; checks global total == 0; diffs against `LedgerAccount.balance`; returns `{ balanced, totalCents, mismatches }`

**Admin routes** (`routes/amm.js`):
- `POST   /admin/markets`          — `authenticateToken` → `requireAdmin` → `apiLimiter` → `validate(createMarketSchema)` → handler
- `PATCH  /admin/markets/:id`      — `authenticateToken` → `requireAdmin` → `apiLimiter` → `validate(marketIdParam,'params')` → `validate(patchMarketSchema)` → handler
- `GET    /admin/risk-events`      — `authenticateToken` → `requireAdmin` → `apiLimiter` → handler
- `GET    /admin/ledger/reconcile` — `authenticateToken` → `requireAdmin` → `apiLimiter` → handler

**Admin integration tests** (`amm.test.js`):
10 new tests in `admin` describe block — 401/403 guard sweep, create market 201 + GET round-trip, 400 on missing reserveFloorCents, pause/resume market, 404 on missing market, 400 on empty PATCH body, risk-events empty-DB case, reconcile balanced after genesis, reconcile detects mismatch.

## Verification

```
npx jest tests/integration/amm.test.js -t "admin" --runInBand --forceExit
# 10/10 admin tests pass

npm test
# 195/195 tests pass (11 suites)
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `VentureCast_Backend-main/middleware/schemas/ammSchemas.js` — FOUND (createMarketSchema, patchMarketSchema exported)
- `VentureCast_Backend-main/controllers/ammController.js` — FOUND (adminCreateMarket, adminPatchMarket, adminListRiskEvents, adminReconcile exported)
- `VentureCast_Backend-main/routes/amm.js` — FOUND (4 requireAdmin usages confirmed)
- `VentureCast_Backend-main/tests/integration/amm.test.js` — FOUND (admin describe block with 10 tests)
- Commit 181ea6a (Task 1) — FOUND
- Commit fbd21a5 (Task 2) — FOUND
- Full suite 195/195 — PASSED
