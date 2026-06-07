---
phase: 06-simulation-full-test-suite
plan: "02"
subsystem: amm-integration-tests
tags: [testing, integration, amm, flow, idempotency, slippage, expiry, TEST-05]
dependency_graph:
  requires: [05-api-surface]
  provides: [TEST-05]
  affects: [flow.test.js]
tech_stack:
  added: []
  patterns:
    - supertest end-to-end HTTP walk (require('../../index') app)
    - MongoMemoryReplSet via helpers/db.js
    - Model.init() before Mongoose transactions (project gotcha)
    - idempotency replay assertion at HTTP layer
    - quote-expiry + slippage 409 assertions
key_files:
  created:
    - VentureCast_Backend-main/tests/integration/flow.test.js
  modified: []
decisions:
  - "quoteExpiresAt accepted by Joi orderSchema and processed by orchestrator — asserted directly at HTTP layer (409) without needing stub or engine edit"
  - "Small cashCents:500 buy to stay under tier-1 circuit breaker; bought qty (4 shares) is divisible by 2 so sell qty is always >= 1"
  - "Sell quote uses qty not cashCents — mirrors real frontend use of sell-by-qty after knowing positionQty"
  - "Position fully-sold edge case handled: test accepts either absent position or positionQty=0"
metrics:
  duration: "2 min"
  completed_date: "2026-06-07"
  tasks_completed: 2
  files_changed: 1
---

# Phase 6 Plan 02: End-to-End Flow Walk + Replay + Rejection Summary

**One-liner:** Supertest HTTP walk quote->buy->portfolio->sell->portfolio with idempotency replay (same key->one trade, replayed:true) and 409 rejection for quote-expiry, buy slippage (maxCostCents too low), and sell slippage (minReceivedCents too high).

## What Was Built

Created `tests/integration/flow.test.js` — a single new test file (no source edits) that exercises the live HTTP stack end-to-end using the same harness as amm.test.js.

### describe: end-to-end AMM flow (TEST-05)

**walks quote -> buy -> portfolio -> sell -> portfolio**

1. `POST /quotes { side:'buy', cashCents:500 }` — asserts `quoteId`, `avgPriceCents`, `totalCents` (buy shape), `expiresAt` in the future
2. `POST /orders buy` — asserts `trade._id`, `trade.side==='buy'`, `balances.positionQty > 0`, `replayed:false`
3. `GET /portfolio` — finds `positions[mid].positionQty === boughtQty`, `priceCents > 0`, `valueCents > 0`
4. `POST /quotes { side:'sell', qty:halfBought }` — asserts `netCents` present, `totalCents` absent (sell shape)
5. `POST /orders sell` — asserts `trade.side==='sell'`, `replayed:false`
6. `GET /portfolio` — asserts `positionQty === boughtQty - sellQty` (reduced)

**same-idempotencyKey replay returns the identical trade (TEST-05)**

- First `POST /orders` returns `replayed:false`
- Second `POST /orders` with same `idempotencyKey` returns `trade._id === original`, `replayed:true`
- `Trade.countDocuments({ marketId }) === 1` — never re-executed

### describe: expiry + slippage rejection (TEST-05)

- **Expiry 409**: `quoteExpiresAt` 60 s in the past → 409; `Trade.countDocuments === 0`
- **Buy slippage 409**: `maxCostCents: 1` on a cashCents:500 buy → 409
- **Sell slippage 409**: real buy first to seed position, then sell with `minReceivedCents: 999_999_999` → 409

## Test Results

```
Tests:       5 passed, 5 total
Full suite:  200/200 tests, 12 test suites — green, zero regressions
```

## Deviations from Plan

None — plan executed exactly as written.

The `quoteExpiresAt` field was confirmed present in the Joi `orderSchema` (`.date().iso().optional()`) and consumed directly by the orchestrator (`execution/orchestrator.js:162`), so the HTTP-layer expiry assertion was made directly without needing a fallback reference to execution.test.js.

## Self-Check: PASSED

- [x] `VentureCast_Backend-main/tests/integration/flow.test.js` created (314 lines, > 100 min_lines)
- [x] Commit `367f823` exists: `test(06-02): add end-to-end flow walk + replay + slippage/expiry rejection (TEST-05)`
- [x] Full suite 200/200 green
- [x] Zero source files modified (only test file added)
