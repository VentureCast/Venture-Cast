# Roadmap: Creator Stock AMM (VentureCast Backend)

## Overview

This milestone builds a productionized bonding-curve AMM inside the existing VentureCast
Express/Mongoose backend — backend functionality + API only, no frontend, no live Stripe
Treasury. The journey runs goal-backward from the core value: every trade prices on a linear
bonding curve and settles atomically against a penny-balanced double-entry ledger with a
reserve that never goes negative. We lay the data model and market genesis first, then build
the oracle-exact pricing engine (TDD), then the ledger and risk engines in parallel (they are
pure, DB-free, independent). The atomic execution orchestrator integrates all three engines
behind one Mongoose transaction with optimistic locking and idempotency. The §7 API exposes
quote → order → portfolio → admin. Finally a dedicated simulation and full test suite proves
the whole thing: $205 oracle, 10k-trade-per-tier sim, concurrency, and idempotency-replay.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Model & Market Genesis** - New Mongoose collections, indexes, and market genesis seeding the reserve to its floor
- [x] **Phase 2: Pricing Engine (Oracle-First)** - Pure integer-cent bonding-curve engine that passes the $205 oracle exactly (completed 2026-06-06)
- [ ] **Phase 3: Ledger & Risk Engines** - Two independent pure modules built in parallel: double-entry ledger and 3-tier risk engine
- [ ] **Phase 4: Atomic Execution Orchestrator** - One-transaction integration of pricing+ledger+risk with optimistic locking, idempotency, slippage
- [ ] **Phase 5: API Surface (§7)** - `/markets`, `/quotes`, `/orders`, `/portfolio`, `/admin/*` wired with auth, validation, rate limits
- [ ] **Phase 6: Simulation & Full Test Suite** - Invariant property tests, 10k-trade-per-tier sim, concurrency, and idempotency-replay/quote-expiry/slippage suite

## Phase Details

### Phase 1: Data Model & Market Genesis
**Goal**: All AMM collections exist with correct indexes, and a new market can be opened at genesis with its reserve seeded to the floor.
**Depends on**: Nothing (first phase)
**Requirements**: LEDG-04
**Success Criteria** (what must be TRUE):
  1. The nine Mongoose models (`Market`, `MarketState`, `LedgerAccount`, `LedgerEntry`, `Order`, `Trade`, `PriceCandle`, `RiskEvent`, `AdminAction`) exist with `Order.idempotencyKey` and `MarketState.marketId` unique indexes, and `Model.init()` succeeds for every txn-involved model.
  2. Opening a new market creates a `Market` + `MarketState` at supply `s0=0` and price `P0`, with `version=0`.
  3. Genesis seeds the reserve to `reserveFloorCents` via a balanced `platform_funding` → `market_reserve` ledger posting that sums to zero.
  4. A `MongoMemoryReplSet` test confirms genesis is atomic (market + state + seeding postings commit together or not at all).
**Plans**: 2 plans
  - [x] 01-01-PLAN.md — Define the nine AMM Mongoose models (Market, MarketState, LedgerAccount, LedgerEntry, Order, Trade, PriceCandle, RiskEvent, AdminAction) with unique indexes
  - [x] 01-02-PLAN.md — Wave 0 genesis atomicity test + ammFixtures, and genesisService.openMarket() seeding the reserve to floor via balanced double-entry posting

### Phase 2: Pricing Engine (Oracle-First)
**Goal**: A pure, DB-free pricing module computes exact integer-cent buy cost, sell payout, cash→units inversion, and spread/fee routing — proven by the oracle written first (TDD).
**Depends on**: Phase 1
**Requirements**: PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, TEST-01
**Success Criteria** (what must be TRUE):
  1. The oracle test passes exactly: `P0=$1.00, k=0.001, s0=1000, buy Δ=100` → gross **$205.00**, avg **$2.05**, end price **$2.10** (assertions on exact integer cents), and it was the first test written.
  2. Sell payout over `[s0, s1]` is symmetric to buy cost (before spread/fee), computed in integer cents.
  3. Cash→units inversion floors to whole integer units and recomputes the exact integer cost (never trusts the float estimate), guaranteeing `cost ≤ X` via ±1 integer search; $205.00 round-trips to exactly 100 units.
  4. Spread (default 50 bps) is routed to reserve and fee (default 100 bps) is routed to `platform_fees` as two distinct amounts, configurable per tier.
  5. Sub-cent residuals are rounded half-up deterministically and swept into the reserve (never to the user, never lost).
**Plans**: 1 plan
  - [ ] 02-01-PLAN.md — Oracle-first TDD pricing engine: config.js + pure curve.js (buy/sell integral), inversion.js (cash→units), fees.js (spread/fee routing), pricing.test.js

### Phase 3: Ledger & Risk Engines
**Goal**: Two independent pure modules — a double-entry ledger and a 3-tier risk engine — built in parallel and unit-tested in isolation, ready for the orchestrator to compose.
**Depends on**: Phase 1 (data model), Phase 2 (pricing types for amounts)
**Requirements**: LEDG-01, LEDG-02, LEDG-03, RISK-01, RISK-02, RISK-03, RISK-04, RISK-05, RISK-06
**Success Criteria** (what must be TRUE):
  1. The ledger posts a balanced set of double-entry entries for a trade that sums to exactly zero across `user_cash`, `user_position`, `market_reserve`, `platform_fees`, `platform_funding` (integer cents/units).
  2. Account balance projections are recoverable by summing `LedgerEntry` deltas, and any candidate posting set that does not sum to zero is rejected before commit.
  3. The risk engine rejects over-cap orders for per-tier max trade size, per-user/per-market max position, and per-user daily volume cap — each with a typed `RiskError` and a `RiskEvent` record.
  4. The reserve-floor check is enforced as an invariant (reserve ≥ floor, never negative) and the dynamic sell cap limits sells by reserve headroom.
  5. The circuit breaker halts a market on a price move beyond threshold and rejects trades while the market is paused.
**Plans**: 2 plans
  - [ ] 03-01-PLAN.md — Pure double-entry ledger (buildBuy/SellPostings + assertBalanced) and session-scoped postEntries persistence with projection reconstruction (LEDG-01/02/03)
  - [ ] 03-02-PLAN.md — Pure 3-tier risk engine evaluate(): max trade/position/daily caps, reserve-floor invariant, dynamic sell cap, circuit breaker (RISK-01..06)

### Phase 4: Atomic Execution Orchestrator
**Goal**: A single orchestrator commits supply + reserve + balances + ledger + trade in one Mongoose transaction or none, with optimistic locking, idempotency, quote expiry, and slippage.
**Depends on**: Phase 2 (pricing), Phase 3 (ledger + risk)
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04
**Success Criteria** (what must be TRUE):
  1. A trade commits `MarketState` update + all `LedgerEntry` inserts + `LedgerAccount` projections + `Trade` insert in one transaction; any invariant violation aborts the whole transaction with no partial writes.
  2. The orchestrator reads `MarketState.version`, writes with `updateOne({_id, version}, {$inc:{version:1}})` inside the txn, and on `matchedCount===0` aborts and retries the whole quote+execute (bounded, e.g. 3 attempts with jitter).
  3. Replaying an order with the same idempotency key returns the original `Trade` and never re-executes (enforced by the unique index).
  4. An expired quote is rejected, and slippage bounds (`minReceived` for sells, `maxCost` for buys) are enforced at execution time against the re-priced trade.
**Plans**: TBD

### Phase 5: API Surface (§7)
**Goal**: The §7 endpoints expose the AMM — list markets, get expiring quotes, execute orders atomically, view IDOR-safe portfolio, and admin market/risk/reconcile operations.
**Depends on**: Phase 4 (execution orchestrator)
**Requirements**: API-01, API-02, API-03, API-04, API-05
**Success Criteria** (what must be TRUE):
  1. `GET /markets` lists tradable markets with current price/supply/status.
  2. `POST /quotes` returns a priced, expiring quote with avg price, gross, fee, spread, total, and price impact.
  3. `POST /orders` executes atomically with idempotency key + slippage and returns the trade plus updated balances; replay returns the original trade.
  4. `GET /portfolio` returns the JWT user's positions with no `userId` param (IDOR-safe) — a different user's token cannot read another's portfolio.
  5. Admin endpoints (admin-guarded via `requireAdmin`) create/pause markets, set tier/caps, view risk events, and reconcile the ledger.
**Plans**: TBD

### Phase 6: Simulation & Full Test Suite
**Goal**: A dedicated harness proves the whole system: invariants hold after every operation, the 10k-trade-per-tier sim never breaches the reserve, concurrency loses no updates, and replay/expiry/slippage all pass.
**Depends on**: Phase 5 (full API surface and execution path)
**Requirements**: TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Invariant property tests assert after every operation: ledger sums to zero, reserve ≥ floor, and reserve ≥ 0.
  2. A 10,000-trades-per-tier simulation (randomized buys/sells within caps) finishes with no negative reserve and a penny-balanced ledger for all three tiers.
  3. A concurrency test fires simultaneous orders on one market and asserts exactly one wins per version bump with no lost update and consistent balances.
  4. Idempotency-replay (same key → one trade, identical response), quote-expiry rejection, and slippage-rejection tests all pass.
  5. A supertest walk of `quote → order → portfolio → sell` is green end-to-end (the contract the frontend will consume later).
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Model & Market Genesis | 2/2 | Complete    | 2026-06-05 |
| 2. Pricing Engine (Oracle-First) | 0/1 | Complete    | 2026-06-06 |
| 3. Ledger & Risk Engines | 0/2 | Planned | - |
| 4. Atomic Execution Orchestrator | 0/TBD | Not started | - |
| 5. API Surface (§7) | 0/TBD | Not started | - |
| 6. Simulation & Full Test Suite | 0/TBD | Not started | - |
