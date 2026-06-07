---
phase: 01-data-model-market-genesis
plan: 01
subsystem: database
tags: [mongoose, mongodb, amm, ledger, double-entry, schema]

# Dependency graph
requires: []
provides:
  - "9 AMM Mongoose model files in VentureCast_Backend-main/models/"
  - "Market.js: per-creator config (streamerId, P0_cents, k_num/k_den, tier, spreadBps, feeBps)"
  - "MarketState.js: optimistic-lock hot state with unique marketId + version field"
  - "LedgerAccount.js: balance projection with unique accountKey, five accountKey templates"
  - "LedgerEntry.js: immutable double-entry postings with delta sign convention"
  - "Order.js: quote-to-order lifecycle with unique idempotencyKey (EXEC-03 gate)"
  - "Trade.js: immutable filled trade record, all money integer cents"
  - "PriceCandle.js: OHLC schema with unique compound index on marketId+interval+ts"
  - "RiskEvent.js: immutable risk audit record with three compound indexes"
  - "AdminAction.js: immutable admin operation audit with before/after snapshots"
affects:
  - 01-data-model-market-genesis
  - 02-bonding-curve-engine
  - 03-order-execution
  - 04-risk-controls
  - 05-market-data-api
  - 06-admin-dashboard

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CommonJS require/module.exports throughout (no ES import/export)"
    - "All money fields are integer cents (Number); all supply/qty fields are integer units"
    - "unique: true inline on field for single-field unique indexes (marketId, idempotencyKey, accountKey)"
    - "schema.index({...}) post-block for compound and supporting indexes"
    - "pre('save') updatedAt hook ONLY on mutable models (Market, MarketState, Order)"
    - "Immutable audit/ledger models have NO pre('save') hook (LedgerAccount, LedgerEntry, Trade, PriceCandle, RiskEvent, AdminAction)"
    - "Schema variable naming: PascalCase + Schema suffix (MarketSchema, MarketStateSchema, etc.)"
    - "accountKey string templates (user_cash:<userId>, user_pos:<userId>:<marketId>, market_reserve:<marketId>, platform_fees, platform_funding)"
    - "Delta sign convention: positive=credit (entering), negative=debit (leaving)"

key-files:
  created:
    - VentureCast_Backend-main/models/Market.js
    - VentureCast_Backend-main/models/MarketState.js
    - VentureCast_Backend-main/models/LedgerAccount.js
    - VentureCast_Backend-main/models/LedgerEntry.js
    - VentureCast_Backend-main/models/Order.js
    - VentureCast_Backend-main/models/Trade.js
    - VentureCast_Backend-main/models/PriceCandle.js
    - VentureCast_Backend-main/models/RiskEvent.js
    - VentureCast_Backend-main/models/AdminAction.js
  modified: []

key-decisions:
  - "platform_funding LedgerAccount will run negative after genesis — accepted as bookkeeping artifact representing platform's outstanding commitment; documented in LedgerAccount.js comments"
  - "MarketState.updatedAt is informational only — Phase 4 uses updateOne({_id,version},$inc:{version:1}) which bypasses pre('save'); documented in MarketState.js comment"
  - "PriceCandle is schema-only — no candle-building logic in this plan; candle building deferred to market data service phase"
  - "LedgerAccount has no pre('save') hook — updated exclusively via $inc findOneAndUpdate to support atomic upserts"

patterns-established:
  - "Pattern 1 (accountKey templates): user_cash:<userId>, user_pos:<userId>:<marketId>, market_reserve:<marketId>, platform_fees, platform_funding — ALL later phases MUST use these exact templates; drift breaks balance reconstruction"
  - "Pattern 2 (delta sign convention): positive delta = credit (entering account), negative delta = debit (leaving account); sum of all deltas for one economic event MUST equal zero"
  - "Pattern 3 (immutable models): append-only models (LedgerEntry, Trade, RiskEvent, AdminAction) have no updatedAt and no pre('save') hook"
  - "Pattern 4 (optimistic locking): MarketState.version incremented via updateOne({_id,version},{$inc:{version:1}}) — bypasses all hooks for atomicity"
  - "Pattern 5 (unique indexes): use inline unique:true for single-field uniqueness; use schema.index({...},{unique:true}) for compound uniqueness"

requirements-completed: [LEDG-04]

# Metrics
duration: 5min
completed: 2026-06-05
---

# Phase 1 Plan 01: AMM Mongoose Models Summary

**Nine AMM Mongoose models with integer-cent money fields, accountKey/delta conventions, and unique indexes for the bonding-curve trading system**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-05T17:37:27Z
- **Completed:** 2026-06-05T17:42:14Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created all 9 AMM model files in `VentureCast_Backend-main/models/` — additive only, no existing files touched
- Established the ledger accountKey convention and delta sign convention in model comments (all later phases depend on these)
- Set unique indexes on `MarketState.marketId`, `Order.idempotencyKey`, and `LedgerAccount.accountKey`; unique compound index on `PriceCandle(marketId+interval+ts)`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the four core ledger + market models** - `4276262` (feat)
2. **Task 2: Create the five lifecycle + audit models** - `4e42694` (feat)

**Plan metadata:** (docs commit — added below)

## Files Created/Modified
- `VentureCast_Backend-main/models/Market.js` — per-creator market config; P0_cents/k_num/k_den/tier/spreadBps/feeBps; pre('save') updatedAt
- `VentureCast_Backend-main/models/MarketState.js` — optimistic-lock hot state; unique marketId; version for CAS; Phase 4 bypass documented
- `VentureCast_Backend-main/models/LedgerAccount.js` — balance projection; unique accountKey; all five accountKey templates + platform_funding-may-go-negative note
- `VentureCast_Backend-main/models/LedgerEntry.js` — immutable double-entry postings; delta sign convention; compound indexes for balance reconstruction and trade audit
- `VentureCast_Backend-main/models/Order.js` — quote-to-order lifecycle; unique idempotencyKey (EXEC-03 gate); minReceived/maxCost slippage guards; expiry sweep index
- `VentureCast_Backend-main/models/Trade.js` — immutable filled trade; grossCents/feeCents/spreadCents/netCents/avgPriceCents all integer cents; supplyBefore/supplyAfter integer units
- `VentureCast_Backend-main/models/PriceCandle.js` — OHLC schema only; unique compound index (marketId+interval+ts); no candle-building logic
- `VentureCast_Backend-main/models/RiskEvent.js` — immutable risk audit; type values documented; detail as Mixed for flexible numeric context; three compound indexes
- `VentureCast_Backend-main/models/AdminAction.js` — immutable admin audit; before/after Mixed snapshots; two compound indexes

## Decisions Made
- `platform_funding` will run negative after every genesis — accepted as bookkeeping artifact; documented in LedgerAccount.js
- `MarketState.updatedAt` is informational only — Phase 4 execution path bypasses `pre('save')` via `updateOne`; documented in schema comment
- `PriceCandle` is schema-only in this plan — no candle-building logic added (deferred to market data service phase)
- `LedgerAccount` has no `pre('save')` hook — balance is maintained exclusively via `$inc findOneAndUpdate` to support atomic upserts

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

All 9 model files exist and load without error (verified: `node -e "...m.forEach(x=>require('./models/'+x));"`).

Ready for Plan 01-02: genesis service (`services/amm/genesisService.js`) and the `genesis.test.js` test suite that calls `Model.init()` on all 9 models and verifies the atomic genesis transaction (LEDG-04b through LEDG-04d).

Plan 02 relies on:
- `LedgerEntry` delta sign convention (positive=credit, negative=debit)
- `LedgerAccount` accountKey templates (especially `market_reserve:<marketId>` and `platform_funding`)
- `MarketState` unique marketId index (prevents duplicate genesis)
- `Order` idempotencyKey unique index (EXEC-03 prerequisite)

---
*Phase: 01-data-model-market-genesis*
*Completed: 2026-06-05*

## Self-Check: PASSED
