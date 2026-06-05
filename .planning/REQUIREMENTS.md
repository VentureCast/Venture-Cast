# Requirements: Creator Stock AMM

**Defined:** 2026-06-03
**Core Value:** Every trade prices on the bonding curve and settles atomically with a penny-balanced double-entry ledger and a reserve that never goes negative.

Source of truth: `documentation/CREATOR_AMM_PLAN.md`. Scope: backend functionality + API only.

## v1 Requirements

### Pricing

- [ ] **PRICE-01**: System computes buy cost as the exact integer-cent curve integral and passes the oracle ($205.00 / avg $2.05 / end $2.10) exactly
- [ ] **PRICE-02**: System computes sell payout symmetric to buy over the same supply range, in integer cents
- [ ] **PRICE-03**: System inverts a cash amount to the max integer units purchasable, with an exact integer recompute (never trusts the float estimate)
- [ ] **PRICE-04**: System applies spread (→ reserve) and fee (→ platform_fees) per-market in basis points (default 50/100 bps)
- [ ] **PRICE-05**: System rounds sub-cent residuals deterministically and sweeps them into the reserve

### Ledger

- [ ] **LEDG-01**: Every trade posts a balanced set of double-entry entries summing to zero (integer cents/units)
- [ ] **LEDG-02**: System maintains account balance projections (`user_cash`, `user_position`, `market_reserve`, `platform_fees`, `platform_funding`) verifiable by summing entries
- [ ] **LEDG-03**: System aborts any trade that would leave the ledger unbalanced
- [ ] **LEDG-04**: Market genesis opens at supply s0=0 / price=P0 and seeds the reserve to its floor via a `platform_funding` posting

### Risk

- [ ] **RISK-01**: System enforces per-tier max trade size and rejects over-cap orders with a typed error + `RiskEvent`
- [ ] **RISK-02**: System enforces per-user, per-market max position
- [ ] **RISK-03**: System enforces per-user daily volume cap
- [ ] **RISK-04**: System enforces the reserve floor as an invariant (reserve ≥ floor, never negative) inside the transaction
- [ ] **RISK-05**: System enforces a dynamic sell cap based on reserve headroom
- [ ] **RISK-06**: System halts a market via circuit breaker on a price move beyond threshold and rejects trades while paused

### Execution

- [ ] **EXEC-01**: System commits supply + reserve + balances + ledger + trade in one Mongoose transaction or none
- [ ] **EXEC-02**: System uses an optimistic `version` on `MarketState` and retries on write-conflict (bounded)
- [ ] **EXEC-03**: System enforces idempotency keys — replay returns the original trade and never re-executes
- [ ] **EXEC-04**: System enforces quote expiry and slippage (`minReceived`/`maxCost`) at execution time

### API

- [ ] **API-01**: `GET /markets` lists tradable markets with current price/supply/status
- [ ] **API-02**: `POST /quotes` returns a priced, expiring quote (avg price, gross, fee, spread, total, price impact)
- [ ] **API-03**: `POST /orders` executes atomically with idempotency + slippage and returns the trade + updated balances
- [ ] **API-04**: `GET /portfolio` returns the authenticated (JWT) user's positions, IDOR-safe (no `userId` param)
- [ ] **API-05**: Admin endpoints create/pause markets, set tier/caps, view risk events, and reconcile the ledger (admin-guarded)

### Testing

- [ ] **TEST-01**: Oracle test asserts $205.00 / avg $2.05 / end $2.10 exactly
- [ ] **TEST-02**: Invariant property tests assert ledger-balances + reserve ≥ floor + reserve ≥ 0 after every operation
- [ ] **TEST-03**: 10,000-trades-per-tier simulation asserts no negative reserve and a penny-balanced ledger
- [ ] **TEST-04**: Concurrency test asserts no lost update under simultaneous orders on one market
- [ ] **TEST-05**: Idempotency-replay, quote-expiry, and slippage-rejection tests pass

## v2 Requirements

- **TREAS-01**: Wire deposits/withdrawals to live Stripe Treasury and reconcile `Σ user_cash` against Treasury balance
- **CUT-01**: Cut the frontend `/trade/buy|sell` path over to the AMM per market behind a flag
- **FE-01**: Frontend integration (quotes/orders/portfolio screens)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Frontend / React Native screens | Backend-only milestone; frontend changes land on a later branch |
| Live Stripe Treasury calls in the AMM path | Stubbed seam this milestone; deterministic testing without external services |
| Rip-out of existing trade engine | Flag-gated coexistence; cutover is a later milestone |
| Production / beta money deploy | Deferred (plan Step 9) |
| TypeScript | Backend is plain JS/CommonJS; JSDoc money typedefs instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LEDG-04 | Phase 1 | In progress (models done; genesis service + test in 01-02) |
| PRICE-01 | Phase 2 | Pending |
| PRICE-02 | Phase 2 | Pending |
| PRICE-03 | Phase 2 | Pending |
| PRICE-04 | Phase 2 | Pending |
| PRICE-05 | Phase 2 | Pending |
| TEST-01 | Phase 2 | Pending |
| LEDG-01 | Phase 3 | Pending |
| LEDG-02 | Phase 3 | Pending |
| LEDG-03 | Phase 3 | Pending |
| RISK-01 | Phase 3 | Pending |
| RISK-02 | Phase 3 | Pending |
| RISK-03 | Phase 3 | Pending |
| RISK-04 | Phase 3 | Pending |
| RISK-05 | Phase 3 | Pending |
| RISK-06 | Phase 3 | Pending |
| EXEC-01 | Phase 4 | Pending |
| EXEC-02 | Phase 4 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| API-01 | Phase 5 | Pending |
| API-02 | Phase 5 | Pending |
| API-03 | Phase 5 | Pending |
| API-04 | Phase 5 | Pending |
| API-05 | Phase 5 | Pending |
| TEST-02 | Phase 6 | Pending |
| TEST-03 | Phase 6 | Pending |
| TEST-04 | Phase 6 | Pending |
| TEST-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26 (100%) ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-03*
*Last updated: 2026-06-05 after plan 01-01 completion (9 AMM models created)*
