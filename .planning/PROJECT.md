# Creator Stock AMM (VentureCast Backend)

## What This Is

A productionized automated market maker (AMM) for trading creator/streamer "stock"
inside the existing VentureCast Express/Mongoose backend. Trades price on a linear
bonding curve `P(s) = P0 + k·s`, settle atomically against a double-entry ledger
(integer cents), and are bounded by a tiered risk engine. This milestone is
**backend functionality + API only** — no frontend, no live Stripe Treasury calls.

Authoritative spec: `documentation/CREATOR_AMM_PLAN.md`. Codebase map: `.planning/codebase/`.

## Core Value

Every trade prices on the bonding curve and settles **atomically** with a
**penny-balanced double-entry ledger** and a **reserve that never goes negative** —
provable by the $205 oracle and a 10k-trade-per-tier simulation.

## Requirements

### Validated

<!-- Inferred from existing code via .planning/codebase/ -->

- ✓ JWT auth + Google/Apple OAuth — existing (`middleware/auth.js`, `routes/auth.js`)
- ✓ Stripe Treasury/Connect deposits & withdrawals — existing (`services/stripeService.js`)
- ✓ Buy/sell trade path (naive multiplicative price bump, single-entry) — existing (`services/tradeService.js`)
- ✓ Portfolio + transaction history — existing (`models/User.js`, `models/Transaction.js`)
- ✓ Streamer/creator data — existing (`models/streamer.js`, `routes/Streamers.js`)
- ✓ Security/validation/rate-limit/logging + Jest test infra — existing (`middleware/`, `tests/`)

### Active

<!-- The AMM build — this milestone -->

- [ ] Linear bonding-curve pricing engine (integer-cent fixed point, oracle-exact, cash→units inversion, spread/fee routing)
- [ ] Double-entry ledger (`market_reserve`, `platform_fees`, `user_cash`, `user_position`, `platform_funding`)
- [ ] 3-tier risk engine (max trade/position/daily, reserve floor, dynamic sell cap, circuit breaker)
- [ ] Atomic execution orchestrator (Mongoose session + optimistic `version` + idempotency keys + bounded retry)
- [ ] §7 API (`/markets`, `/quotes`, `/orders`, `/portfolio`, `/admin/...`)
- [ ] Test suite: $205 oracle, invariant property tests, 10k-trade-per-tier sim, concurrency, idempotency-replay

### Out of Scope

- Frontend integration (React Native screens/providers) — deferred to a later branch, after pending frontend changes land
- Live Stripe Treasury calls in the AMM path — stubbed seam; real reconciliation wired later
- Cutover of the existing `/trade/buy|sell` path — flag-gated coexistence, no rip-out this milestone
- Production / beta money deploy — deferred (plan Step 9)
- TypeScript — backend is plain JS/CommonJS; JSDoc money typedefs instead

## Context

- Backend: Node + Express + Mongoose + MongoDB, npm, CommonJS modules. See `.planning/codebase/STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`.
- The current trade engine is single-entry with float pricing and no idempotency/version control — the AMM replaces this behind new endpoints. See `.planning/codebase/CONCERNS.md`.
- Tests use `mongodb-memory-server` with `MongoMemoryReplSet` (required for transactions); models need `Model.init()` before txn tests; inserts must stay in-session. See `.planning/codebase/TESTING.md`.

## Constraints

- **Tech stack**: Plain JS / CommonJS (`require`), Mongoose — no TS toolchain. Match existing patterns.
- **Money**: Integer cents everywhere; no floats in the money path. `k` as rational `k_num/k_den`.
- **Atomicity**: supply + reserve + balances + ledger commit in one Mongoose transaction or none.
- **Determinism**: AMM testable in-memory with no external services (Stripe edges stubbed).
- **Security**: Securities-adjacent, real-money-adjacent — auth on all trade endpoints, IDOR-safe portfolio, idempotency against replay.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| In-process Node engine (not Python sidecar) | One Mongoose txn spans pricing + ledger + balances → real atomicity | — Pending |
| Oracle-derived (no Python prototype) | $205 oracle + 4 invariants are a complete testable spec | — Pending |
| Build alongside existing trade path, flag-gated | Safest for real money; allows per-market cutover later | — Pending |
| Internal ledger authoritative; Treasury at edges only | Instant internal settlement; avoids per-trade Stripe round-trips | — Pending |
| Plain JS + JSDoc (not TS) | Matches 100% of existing backend; no build step | — Pending |
| Integer units only; 50bps spread + 100bps fee; genesis s0=0 @ price P0 | Clean invariants; spread→reserve, fee→platform_fees; price discovered by trading | — Pending |

---
*Last updated: 2026-06-03 after initialization (synthesized from committed plan, not re-questioned)*
