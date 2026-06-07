---
phase: 01-data-model-market-genesis
plan: 02
subsystem: database
tags: [mongoose, mongodb-transactions, double-entry-ledger, amm, jest, tdd]

requires:
  - phase: 01-01
    provides: Nine AMM Mongoose models (Market, MarketState, LedgerAccount, LedgerEntry, Order, Trade, PriceCandle, RiskEvent, AdminAction)

provides:
  - services/amm/genesisService.js — openMarket() atomic genesis function + GenesisError class
  - tests/unit/genesis.test.js — LEDG-04 atomicity gate (10 tests, 4 describe blocks)
  - tests/helpers/ammFixtures.js — createTestMarket() factory for reuse by Phases 2-6

affects:
  - Phase 2 (bonding curve pricing): consumes openMarket() and createTestMarket() to set up markets for trade tests
  - Phase 3 (order management): createTestMarket() is the prerequisite for all order tests
  - Phase 4 (execution engine): genesisService establishes the transaction pattern all later services follow
  - Phase 5 (risk controls): genesis ledger state is the baseline for reserve floor tests
  - Phase 6 (market data): Market and MarketState seeded by genesis are the chart data source

tech-stack:
  added: []
  patterns:
    - "GenesisError class pattern: extends Error with statusCode + details — mirrors TradeError exactly"
    - "Genesis transaction pattern: mongoose.startSession() + startTransaction() + new Doc().save({session}) + findOneAndUpdate($inc upsert, {upsert:true,session}) + commitTransaction() + abortTransaction() in catch + endSession() in finally"
    - "TDD RED-GREEN cycle: write failing test first, commit RED, implement to GREEN, commit GREEN"
    - "Model.init() in beforeAll: must be called on ALL nine txn-involved models before any transaction runs"
    - "Lazy require in test beforeAll: import service and models AFTER connectTestDB() so they register against the live connection"

key-files:
  created:
    - VentureCast_Backend-main/services/amm/genesisService.js
    - VentureCast_Backend-main/tests/unit/genesis.test.js
    - VentureCast_Backend-main/tests/helpers/ammFixtures.js
  modified: []

key-decisions:
  - "Number.isInteger(reserveFloorCents) guard added per RESEARCH Pitfall 4 — float floor would break sum-to-zero invariant even though RESEARCH snippet only showed <=0 check"
  - "GenesisError thrown before session.startTransaction() for validation errors so no abort overhead for bad params"
  - "platform_funding LedgerAccount runs negative after genesis — accepted as documented bookkeeping artifact (platform's outstanding commitment)"
  - "$setOnInsert: { unit: 'cents' } on LedgerAccount upsert ensures unit is set correctly on first insert without overwriting on subsequent $inc updates"

patterns-established:
  - "Pattern: GenesisError(message, statusCode, details) — matches TradeError shape for uniform error handling across AMM services"
  - "Pattern: createTestMarket(overrides) in ammFixtures.js — lazy-requires openMarket() to avoid import-before-connection issues"
  - "Pattern: sum-to-zero invariant assertion before commitTransaction() — every future posting set must satisfy this same check"

requirements-completed: [LEDG-04]

duration: 18min
completed: 2026-06-05
---

# Phase 1 Plan 02: Genesis Service (LEDG-04) Summary

**Atomic market genesis via openMarket() — creates Market + MarketState at s0=0/P0/version=0 and seeds reserve to floor with a balanced platform_funding debit / market_reserve credit posting, proven atomic on MongoMemoryReplSet**

## Performance

- **Duration:** 18 min
- **Started:** 2026-06-05T17:47:32Z
- **Completed:** 2026-06-05T18:05:30Z
- **Tasks:** 2 (Task 1: RED test + fixture, Task 2: GREEN implementation)
- **Files modified:** 3 created, 0 modified

## Accomplishments

- `openMarket(params)` executes Market + MarketState + 2 LedgerEntries + 2 LedgerAccount upserts in a single Mongoose transaction — full abort on any error leaves zero documents across all four collections (atomicity proven)
- Genesis double-entry posting establishes the sum-to-zero invariant: `platform_funding -floor + market_reserve:<id> +floor = 0` — every future trade posting must satisfy the same invariant
- `createTestMarket(overrides)` factory in `ammFixtures.js` provides a stable one-call setup for all Phase 2-6 AMM tests
- Full backend suite passes: 87/87 tests (10 new genesis + 77 pre-existing trade/auth/stripe/streamer)

## openMarket() Signature and Return Shape

```js
// services/amm/genesisService.js
async function openMarket(params) // params:
  //   streamerId: string (ObjectId hex)  — required
  //   P0_cents: number                   — integer cents, default 100
  //   k_num: number                      — slope numerator, default 1
  //   k_den: number                      — slope denominator, default 10
  //   tier: '1'|'2'|'3'                 — default '1'
  //   spreadBps: number                  — basis points, default 50
  //   feeBps: number                     — basis points, default 100
  //   reserveFloorCents: number          — REQUIRED, must be positive integer

// Returns:
//   { market: MongooseDoc, marketState: MongooseDoc }
//
// Throws:
//   GenesisError(400) if reserveFloorCents is missing, <= 0, or non-integer
//   GenesisError(500) if debitEntry.delta + creditEntry.delta !== 0 (invariant violated)
```

## GenesisError Class

```js
class GenesisError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'GenesisError';
    this.statusCode = statusCode; // 400 = validation, 500 = invariant
    this.details = details;
  }
}
module.exports = { GenesisError, openMarket };
```

Mirrors `TradeError` exactly — uniform error shape across all AMM services.

## Genesis Double-Entry Posting

**Scenario:** Opening any market with `reserveFloorCents = F` (e.g. 10000 = $100.00)

| Entry | accountKey | delta | unit | tradeId |
|-------|-----------|-------|------|---------|
| Debit | `platform_funding` | `-F` | cents | null |
| Credit | `market_reserve:<marketId>` | `+F` | cents | null |

**Sum check:** `-F + F = 0` (double-entry invariant satisfied)

**LedgerAccount projections after genesis:**

| accountKey | balance | unit |
|-----------|---------|------|
| `platform_funding` | `-F` | cents |
| `market_reserve:<marketId>` | `+F` | cents |

**Note on platform_funding:** The `platform_funding` account intentionally runs negative — it represents the platform's outstanding commitment to all open market reserves. This is an accepted bookkeeping artifact (not a solvency risk). Documented in schema comments. A future admin action (`treasury_top_up`) would credit `platform_funding` to bring it positive.

## createTestMarket Fixture Signature

```js
// tests/helpers/ammFixtures.js
async function createTestMarket(overrides = {})
// Defaults: streamerId=new ObjectId(), P0_cents=100, k_num=1, k_den=10,
//           tier='1', spreadBps=50, feeBps=100, reserveFloorCents=10000
// Returns: { market, marketState } — same shape as openMarket()
// Usage in tests: call AFTER connectTestDB() + Model.init() in beforeAll
```

## Task Commits

Each task committed atomically:

1. **Task 1: Write genesis.test.js (RED) + ammFixtures.js** — `819161b` (test)
2. **Task 2: Implement genesisService.openMarket() to GREEN** — `b752100` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `VentureCast_Backend-main/services/amm/genesisService.js` — openMarket() + GenesisError; 189 lines
- `VentureCast_Backend-main/tests/unit/genesis.test.js` — LEDG-04a..d atomicity gate; 10 tests across 4 describe blocks
- `VentureCast_Backend-main/tests/helpers/ammFixtures.js` — createTestMarket() factory for AMM phase tests

## Decisions Made

- **Number.isInteger guard added** — RESEARCH Pitfall 4 warned that a float `reserveFloorCents` would produce a non-zero entry sum. The RESEARCH code snippet only showed `<= 0`, but the plan's `<action>` explicitly required `Number.isInteger`. Guard throws GenesisError(400) before any writes.
- **Validation before session start** — GenesisError is thrown before `session.startTransaction()` for invalid params. No abort overhead for bad input. Clean separation of validation from transaction logic.
- **$setOnInsert for unit field** — LedgerAccount upserts use `$setOnInsert: { unit: 'cents' }` so the unit is set on first insert but not overwritten on subsequent `$inc` updates (important for future multi-genesis runs against the same `platform_funding` account).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `createTestMarket()` is stable and ready for Phase 2 bonding-curve tests
- `openMarket()` is the prerequisite for all AMM execution tests (Phases 2-6)
- The sum-to-zero invariant is established as the canonical pattern; every future trade posting set must satisfy the same check
- Full suite green (87/87) — no blockers for Phase 2

---
*Phase: 01-data-model-market-genesis*
*Completed: 2026-06-05*

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `services/amm/genesisService.js` | FOUND |
| `tests/unit/genesis.test.js` | FOUND |
| `tests/helpers/ammFixtures.js` | FOUND |
| `.planning/phases/01-data-model-market-genesis/01-02-SUMMARY.md` | FOUND |
| Commit `819161b` (RED test) | FOUND |
| Commit `b752100` (GREEN impl) | FOUND |
