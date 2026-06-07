# Creator Stock AMM — Implementation Plan

**Branch:** `feature/creator-amm-engine` (forked from `Buy/SellAPI/Dockerization`)
**Status:** DRAFT — awaiting your review before any code is written
**Date:** 2026-06-01

This is the reviewable plan you asked for. It adapts the gstack-style sprint you
pasted to *this* codebase (Node + Express + Mongoose + MongoDB, Stripe Treasury),
resolves the architectural forks, and replaces the gstack slash-commands that
aren't installed here with their real equivalents.

---

## Scope (this branch) — backend functionality + API only

**In scope:** the pricing/ledger/risk engine, the atomic execution orchestrator, and
the §7 API — built so the functionality is **callable and testable** in isolation.

**Out of scope (this branch):** any frontend work (no React Native screens, no
provider/navigation wiring); cutover of the live `/trade/buy|sell` path the app
currently uses; production money movement / beta deploy. Frontend integration and
the real-cash deploy happen on a later branch, after pending frontend changes land.

**No live Stripe Treasury calls.** The AMM is built and tested against the **internal
ledger only**. Deposits/withdrawals (the real-cash edges) are a stubbed seam, wired to
real Treasury later. Confirm-point #4 simplifies to a **platform-seeded reserve in the
ledger** — no Stripe dependency for this phase.

**Definition of done for this branch:** oracle passes exactly; 10k-trade-per-tier sim
shows no reserve breach and a penny-balanced ledger; concurrency + idempotency tests
pass; and a supertest walk of `quote → order → portfolio → sell` green — that
integration test **is** the contract the frontend will consume later.

---

## 0. Decisions locked (the "/office-hours" output)

| Fork | Decision | Why |
|---|---|---|
| Engine home | **Port to Node, in-process** | The engine shares the same Mongoose session as ledger/balance writes → atomicity is real, no network hop, no second runtime. |
| Source of truth | **Derive from the oracle + invariants** | The Python `creator_amm/` prototype is **not in this repo**. The $205 oracle + 4 invariants are a complete, testable spec. |
| Cutover | **Build alongside, flag-gated** | New modules + new endpoints. Old `executeBuy/executeSell` stays until per-market cutover. Safest for real money. |
| Ledger truth | **Internal double-entry ledger authoritative** | Mongo ledger is truth for in-app cash/positions/reserve/fees. Stripe Treasury touched only at deposit/withdraw edges. |
| Language | **Plain JS / CommonJS + JSDoc typedefs** ✅ | Every existing backend file is plain `.js` with `require`. Introducing a TS toolchain (tsc/ts-jest/build step) is real scope. JSDoc money types instead. |

All §0 forks and the §9 confirm-points are now **resolved** (see §9).

---

## 1. Ground truth (goes verbatim into CLAUDE.md before any implementation)

**Curve:** `P(s) = P0 + k·s`. Buy cost and sell payout are the curve integrals.

**Fixed-point representation (the deterministic oracle):**
- Money is **integer cents**. Supply `s` is **integer units**.
- `k` is a rational `k_num / k_den`. Price in cents: `price_cents(s) = P0_cents + (k_num·s)/k_den`.
- Oracle params: `P0_cents = 100`, `k_num = 1`, `k_den = 10` (i.e. P0=$1.00, k=0.001 $/unit).

**Buy cost integral (integer-exact):**
```
cost_cents = P0_cents·Δ + (k_num·(s1² − s0²)) / (2·k_den)
```
where `s1 = s0 + Δ`. When the division has a remainder, round half-up and **sweep
the sub-cent residual into the reserve** (never to the user, never lost).

**ORACLE (must pass exactly):** `P0=$1.00, k=0.001, s0=1000, buy Δ=100` →
start price **$2.00**, end price **$2.10**, avg **$2.05**, gross **$205.00**
(no fees/spread). *Verified to close in pure integer arithmetic — see §2.*

**INVARIANTS (assert after every trade, inside the transaction; abort on violation):**
1. `reserve_balance >= reserve_floor`, and never negative.
2. Ledger double-entry balances to the penny (sum of all postings in a trade = 0).
3. supply / reserve / user balances update **atomically or not at all**.
4. Every order carries an **idempotency key**; no double execution.

**Money routing:** the **spread stays in the reserve pool**; the **fee goes to the
`platform_fees` account**. These are two distinct amounts with two distinct destinations.

---

## 2. Pricing math (derived, verified)

Average price = `(P(s0) + P(s1)) / 2`. Cost = `Δ · avg_price`.

**Cash → units inversion** (for "buy $X worth"): solve the quadratic
`(k_num/(2·k_den))·Δ² + P(s0)·Δ − X = 0` for Δ, floor to integer units, then
**recompute exact integer cost** and integer-search ±1 to guarantee `cost ≤ X`.
(The `sqrt` is only an estimate; the integer recompute is authoritative.)

**Verified** (`node -e` check, run during planning):
- start $2.00, end $2.10, avg $2.05, gross **$205.00**, residual = 0
- inversion: $205.00 → exactly 100 units (round-trips the oracle)

**Sell payout** is the same integral over `[s0, s1]` (path-symmetric before
spread/fee). Spread makes buys cost `+spread_bps` and sells pay `−spread_bps`; the
differential accrues to reserve. Fee is a separate `fee_bps` routed to `platform_fees`.
Spread/fee in **basis points, config per tier** (values are a taste decision, §9).

---

## 3. Module boundaries (the subagent fan-out)

Three **pure, DB-free** engine modules (independently testable — these are the
parallel subagents your plan calls for), plus an orchestrator that gives them a DB.

```
services/amm/
  pricing/        ← SUBAGENT 1 — curve, integrals, cash→units inversion, fee/spread, rounding
  ledger/         ← SUBAGENT 2 — double-entry posting, balance projection, invariant asserts
  risk/           ← SUBAGENT 3 — caps, reserve floor, dynamic sell cap, circuit breaker
  execution.js    ← INTEGRATOR — atomic orchestration (Mongoose txn + version + idempotency)
  marketData.js   ← quotes, candles, market listing
  config.js       ← tier params, spread/fee bps, scaling constants
```

`pricing/` and `risk/` are **pure functions over integers** — no Mongoose, no I/O —
so the oracle and the 10k-trade sim run in-memory, fast, deterministic.

---

## 4. Data model (playbook §6 collections)

New Mongoose models under `models/`. All money = integer cents; all balances are
**ledger-derived projections** verifiable by summing `ledger_entries`.

| Collection | Purpose | Key fields |
|---|---|---|
| `Market` | per-creator config (one per tradable streamer) | `streamerId`, `P0_cents`, `k_num`, `k_den`, `tier`, `status` (active/paused), `spreadBps`, `feeBps` |
| `MarketState` | hot mutable state — the optimistic-lock doc | `marketId`, `supply`, `reserveCents`, `reserveFloorCents`, `lastPriceCents`, **`version`** |
| `LedgerAccount` | balance projection per account | `accountKey` (`user_cash:<uid>`, `user_pos:<uid>:<mid>`, `market_reserve:<mid>`, `platform_fees`), `balance`, `unit` (cents/shares) |
| `LedgerEntry` | immutable double-entry postings | `tradeId`, `accountKey`, `delta`, `unit`, `createdAt` (each trade emits a balanced set summing to 0) |
| `Order` | quote→order lifecycle | `userId`, `marketId`, `side`, `qty`, `idempotencyKey` (**unique**), `status`, `minReceived`/`maxCost`, `quoteId`, `expiresAt` |
| `Trade` | executed fill (immutable) | `orderId`, `marketId`, `userId`, `side`, `qty`, `grossCents`, `feeCents`, `spreadCents`, `avgPriceCents`, `supplyAfter` |
| `PriceCandle` | OHLC for charts (replaces `Shares.day1..7`) | `marketId`, `interval`, `open`, `high`, `low`, `close`, `ts` |
| `RiskEvent` | audit when a cap/floor/breaker trips | `marketId`, `userId`, `type`, `detail`, `createdAt` |
| `AdminAction` | audit of admin ops | `adminId`, `action`, `target`, `before`, `after`, `createdAt` |

**Indexes / test gotchas (from project memory):** `Order.idempotencyKey` unique;
`MarketState.marketId` unique; call `await Model.init()` on every txn-involved model
before tests; use `MongoMemoryReplSet` (not `MongoMemoryServer`); keep inserts inside
the session via `new Doc({...}).save({ session })`, not `Model.create()`.

**Relationship to existing schema:** `User.treasuryBalance.available` and
`User.portfolio` stay as-is for the old path. The AMM reads/writes through
`LedgerAccount`. Deposits/withdrawals (Stripe Treasury) post into `user_cash:<uid>`
at the edge. A reconciliation job asserts `Σ user_cash == Treasury available`.

---

## 5. Concurrency, atomicity & idempotency

**Optimistic version on `MarketState`:**
1. Read `{supply, reserveCents, version}`.
2. Run pricing + risk checks (pure).
3. `updateOne({ _id, version }, { $set:{supply,reserve,lastPrice}, $inc:{version:1} })`
   **inside the Mongoose transaction**.
4. If `matchedCount === 0` → another trade won the race → **abort txn, retry the
   whole quote+execute** (bounded, e.g. 3 attempts with jitter).

**Atomic commit:** `MarketState` update + all `LedgerEntry` inserts + `LedgerAccount`
projection updates + `Trade` insert commit in **one transaction or none**. Invariants
(§1) are asserted *before* `commitTransaction()`; any violation → `abort`.

**Idempotency:** unique index on `Order.idempotencyKey`. On replay, return the
original `Trade` result — never re-execute.

> **Stop-gate (your Step 2/3):** if any design here can't guarantee atomicity across
> `MarketState` + ledger + balances, we rework before implementing. The in-process
> Node decision exists precisely so this is one Mongoose transaction.

---

## 6. Risk engine (3 tiers)

Per-tier config (`config.js`): `maxTradeCents`, `maxPositionQty`, `maxDailyCents`,
`reserveFloorCents`, `dynamicSellCap` (sell size capped by reserve headroom / recent
volume), `circuitBreakerPct` (halt market if price moves > X% in a window).

- Tier 1 = new/small creators (tight caps), Tier 2 = mid, Tier 3 = established.
- Every trip writes a `RiskEvent` and rejects the order with a typed error
  (`RiskError { statusCode, details }`, mirroring `TradeError`/`StripeServiceError`).
- Reserve-floor check is an **invariant**, not just a cap — asserted inside the txn.

---

## 7. §7 API surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/markets` | optional | list tradable markets + price/supply/status |
| GET | `/markets/:id` | optional | detail + recent candles |
| POST | `/quotes` | required | `{marketId, side, qty\|cashCents}` → `{quoteId, avgPriceCents, grossCents, feeCents, spreadCents, totalCents, priceImpact, expiresAt}` |
| POST | `/orders` | required | `{quoteId\|{marketId,side,qty}, idempotencyKey, minReceived\|maxCost}` → executes atomically; re-prices, enforces slippage, rejects expired quote |
| GET | `/portfolio` | required | positions for **JWT user** (no `:userId` param → kills IDOR) |
| POST | `/admin/markets` | admin | create/list a creator market |
| PATCH | `/admin/markets/:id` | admin | pause/resume, set tier/caps |
| POST | `/admin/markets/:id/circuit-breaker` | admin | manual halt/resume |
| GET | `/admin/risk-events` | admin | audit feed |
| GET | `/admin/ledger/reconcile` | admin | ledger vs Treasury reconciliation |

Wired with existing `validate(joiSchema)`, rate limiters (`tradeLimiter` on orders,
`apiLimiter` on reads), `authenticateToken`. New `requireAdmin` middleware.

---

## 8. Test plan

- **Oracle test** — `$205.00 / avg $2.05 / end $2.10`, exact, integer. First test written.
- **Invariant property tests** — after every op: ledger sums to 0, reserve ≥ floor, reserve ≥ 0.
- **10,000-trades-per-tier simulation** (§14 harness) — randomized buys/sells within
  caps; assert **no negative reserve**, ledger balances to the penny, supply/reserve
  consistent with the curve. Runs against the pure engine (fast).
- **Concurrency test** — two simultaneous orders on one market → exactly one wins per
  version bump, no lost update, balances consistent.
- **Idempotency replay test** — same key twice → one `Trade`, identical response.
- **Quote lifecycle** — expired quote rejected; slippage (`minReceived`/`maxCost`) enforced.
- **Edge cases** — cent rounding/residual-to-reserve, reserve-floor breach rejected,
  dynamic sell cap, paused market rejected.

Infra: Jest + supertest + `mongodb-memory-server` (`MongoMemoryReplSet`), `--runInBand --forceExit`.

> **Stop-gate (your Step 3):** if the sim produces a negative reserve or an unbalanced
> ledger, that's a correctness bug — halt and fix, don't tune.

---

## 9. Confirm-points — RESOLVED

1. **Language:** ✅ **Plain JS + JSDoc money typedefs** (CommonJS, no build step; matches existing backend).
2. **Share units:** ✅ **Integer units only.** "Buy $X" floors to whole units; the sub-unit remainder stays as the user's cash. No fractional shares.
3. **Economics:** ✅ **50 bps spread + 100 bps fee** as starting per-tier defaults. Spread (0.5%) accrues to `market_reserve`; fee (1.0%) routes to `platform_fees`. Both live in `config.js`, tunable per tier.
4. **Market genesis:** ✅ A new market opens at **supply `s0 = 0`** → starting price = `P0` ($1.00 with oracle params), and the **platform seeds the reserve to its floor** so the first trades are solvent. Price is discovered by trading up the curve. (No Stripe dependency — the seed is an internal ledger posting from a `platform_funding` account.)
5. **Branch base:** ✅ Stay on `feature/creator-amm-engine` (off `Buy/SellAPI/Dockerization`).

---

## 10. Execution sequence (gstack steps → this environment)

| gstack step | Here | What happens |
|---|---|---|
| `/office-hours` | ✅ this conversation | forks resolved (§0) |
| `/autoplan` | this doc + `superpowers:writing-plans` | turn this into a task-level implementation plan |
| implement (subagents) | `superpowers:subagent-driven-development` + TDD | fan out pricing/ledger/risk; integrate behind `execution.js` |
| `/review` | `/code-review` (high effort) + `superpowers:requesting-code-review` | atomicity, concurrency, money-correctness |
| `/codex` | independent second-opinion review agent | re-audit money path; verify $205 by hand |
| `/cso` | `/security-review` + security-auditor agent | OWASP/STRIDE: auth, IDOR, replay, reserve-drain, wash-trading |
| `/qa` | `/verify` + live API walkthrough | full buy→portfolio→sell flow, concurrency, expiry |
| `/ship` | `commit-commands:commit-push-pr` | PR with architecture summary + review attestations |
| `/land-and-deploy` | manual | merge on green CI; deploy behind Phase-8 beta caps |

**Build order:** Phase 0 seed CLAUDE.md → 1 data model → 2 pricing (TDD oracle first)
→ 3 ledger → 4 risk → 5 execution orchestrator → 6 API → 7 sim + full suite →
8 reviews/QA → 9 PR + capped beta.

---

## 11. What I will NOT do without further sign-off

- Touch real Stripe Treasury money movement (deposits/withdrawals stay on the existing path).
- Remove or reroute the existing `executeBuy/executeSell` (flag-gated coexistence until you say cut over).
- Edit `CLAUDE.md` (the §1 ground-truth block is staged here for your review first).
- Deploy / merge to `main`.
