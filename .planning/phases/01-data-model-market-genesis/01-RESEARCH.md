# Phase 1: Data Model & Market Genesis — Research

**Researched:** 2026-06-05
**Domain:** Mongoose schema design, double-entry ledger modeling, atomic genesis seeding
**Confidence:** HIGH — all claims derive from the authoritative spec (`CREATOR_AMM_PLAN.md`),
existing codebase inspection, and project convention files. No speculative claims.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LEDG-04 | Market genesis opens at supply s0=0 / price=P0 and seeds the reserve to its floor via a `platform_funding` posting | Covered: genesis service design, double-entry posting shape, atomic Mongoose session pattern, all 9 model schemas designed |
</phase_requirements>

---

## Summary

Phase 1 creates the nine Mongoose collections that every subsequent phase writes to or reads
from, plus a `genesisMarket` service function that opens a market atomically. The domain
is Mongoose schema design (with the project's existing CommonJS/integer-cents conventions)
and the double-entry ledger posting shape that must be established correctly here because
every later trade depends on the same pattern.

Two choices that would be costly to get wrong at this stage: (1) the exact field names
and units on each collection — wrong units or field names propagate into every later
service and test; (2) the `platform_funding` → `market_reserve` genesis posting shape —
this is the first double-entry transaction in the system and establishes the invariant
that every future posting set must also satisfy (sum to zero). Both are fully resolved
by the spec and are documented with exact field names below.

The phase produces zero pricing math, zero risk logic, and zero API surface. Its only
runtime behavior is: `genesisMarket(params, session)` — create `Market` + `MarketState` +
two `LedgerEntry` rows + two `LedgerAccount` upserts in one Mongoose transaction.

**Primary recommendation:** Define all nine models in `VentureCast_Backend-main/models/`
with PascalCase filenames (matching the existing `Transaction.js`, `User.js` style), then
write `services/amm/genesisService.js` that performs the single atomic genesis transaction.
A `MongoMemoryReplSet` unit test of that service function is the success gate.

---

## Standard Stack

All packages are already present in `VentureCast_Backend-main/package.json`. No new
dependencies are required for Phase 1.

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mongoose | ^8.7.1 | Schema definition, ODM, session/transaction API | Project-wide data layer |
| mongodb-memory-server | ^11.0.1 | `MongoMemoryReplSet` for transaction tests | Existing test infra |
| jest | ^30.2.0 | Test runner | Existing test infra |

### No New Installation Required

```bash
# Nothing to install — all required packages exist in package.json
# Verify: cd VentureCast_Backend-main && npm list mongoose mongodb-memory-server jest
```

---

## Architecture Patterns

### New File Locations

```
VentureCast_Backend-main/
├── models/
│   ├── Market.js            # New — per-creator market config
│   ├── MarketState.js       # New — optimistic-lock hot state
│   ├── LedgerAccount.js     # New — balance projection per account key
│   ├── LedgerEntry.js       # New — immutable double-entry postings
│   ├── Order.js             # New — quote-to-order lifecycle
│   ├── Trade.js             # New — immutable filled trade record
│   ├── PriceCandle.js       # New — OHLC for charts
│   ├── RiskEvent.js         # New — cap/floor/breaker audit
│   └── AdminAction.js       # New — admin operation audit
│
└── services/
    └── amm/
        └── genesisService.js  # New — openMarket() atomic genesis
```

All existing files remain untouched. The AMM models are additive.

### Pattern 1: Mongoose Schema — CommonJS, Integer Cents, Section Comments

Match the style of `Transaction.js` (verbose per-field comments, explicit `index: true`
inline, compound `schema.index()` calls below the schema, `pre('save')` for timestamps,
`module.exports = mongoose.model('ModelName', schema)`).

```js
// Source: VentureCast_Backend-main/models/Transaction.js (existing pattern)
const mongoose = require('mongoose');

const MarketStateSchema = new mongoose.Schema({
  // Market reference — unique; one state doc per market
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    unique: true   // enforces single state per market
  },

  // Supply is an integer count of units outstanding
  supply: {
    type: Number,
    required: true,
    default: 0     // genesis starts at s0=0
  },

  // All money fields are integer cents — never dollars
  reserveCents: {
    type: Number,
    required: true,
    default: 0
  },
  reserveFloorCents: {
    type: Number,
    required: true
  },
  lastPriceCents: {
    type: Number,
    required: true
  },

  // Optimistic concurrency version — incremented on every write
  version: {
    type: Number,
    required: true,
    default: 0
  },

  updatedAt: { type: Date, default: Date.now }
});

MarketStateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MarketState', MarketStateSchema);
```

### Pattern 2: Unique Index — `unique: true` inline vs. `schema.index()`

The spec requires two unique indexes: `Order.idempotencyKey` and `MarketState.marketId`.
Use inline `unique: true` on the field definition (matches how `Watchlist.js` handles its
compound unique). For all other indexes, use `schema.index({ field: 1 })` after the
schema block (matches `Transaction.js` style).

```js
// Source: existing models/Watchlist.js pattern for unique compound,
//         existing models/Transaction.js pattern for standalone index

// Inline unique (Order.idempotencyKey):
idempotencyKey: {
  type: String,
  required: true,
  unique: true,
  index: true
},

// Compound index via schema.index (after schema block):
OrderSchema.index({ userId: 1, marketId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, expiresAt: 1 });
```

### Pattern 3: Atomic Genesis Service Function

The genesis function must create Market + MarketState + two LedgerEntries + two
LedgerAccount upserts inside a single Mongoose session. Follows the transaction pattern
from `services/tradeService.js` exactly: `session.startTransaction()` → `new Doc().save({session})`
for every insert → invariant check → `session.commitTransaction()`.

```js
// Source: VentureCast_Backend-main/services/tradeService.js (existing pattern)
// services/amm/genesisService.js

const mongoose = require('mongoose');
const Market = require('../../models/Market');
const MarketState = require('../../models/MarketState');
const LedgerAccount = require('../../models/LedgerAccount');
const LedgerEntry = require('../../models/LedgerEntry');
const logger = require('../../utils/logger');

class GenesisError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Open a new creator market atomically.
 * Creates Market, MarketState, and seeds the reserve via a balanced ledger posting.
 *
 * @param {Object} params
 * @param {string} params.streamerId        - ObjectId string of the creator
 * @param {number} params.P0_cents          - Starting price in integer cents (default 100)
 * @param {number} params.k_num             - Curve slope numerator (default 1)
 * @param {number} params.k_den             - Curve slope denominator (default 10)
 * @param {string} params.tier              - '1' | '2' | '3'
 * @param {number} params.spreadBps         - Spread in basis points (default 50)
 * @param {number} params.feeBps            - Fee in basis points (default 100)
 * @param {number} params.reserveFloorCents - Minimum reserve in integer cents
 * @returns {Object} { market, marketState }
 */
async function openMarket(params) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      streamerId, P0_cents = 100, k_num = 1, k_den = 10,
      tier = '1', spreadBps = 50, feeBps = 100, reserveFloorCents
    } = params;

    if (!reserveFloorCents || reserveFloorCents <= 0) {
      throw new GenesisError('reserveFloorCents must be a positive integer', 400, {});
    }

    // 1. Create the Market config doc
    const market = new Market({
      streamerId, P0_cents, k_num, k_den,
      tier, status: 'active', spreadBps, feeBps
    });
    await market.save({ session });

    // 2. Create MarketState at genesis: s0=0, price=P0, version=0
    const marketState = new MarketState({
      marketId: market._id,
      supply: 0,
      reserveCents: reserveFloorCents,  // seeded to floor
      reserveFloorCents,
      lastPriceCents: P0_cents,
      version: 0
    });
    await marketState.save({ session });

    const reserveKey = `market_reserve:${market._id}`;
    const fundingKey = 'platform_funding';

    // 3. Seed reserve: debit platform_funding, credit market_reserve
    //    Both entries together sum to zero (double-entry invariant).
    const debitEntry = new LedgerEntry({
      tradeId: null,         // genesis — no trade
      accountKey: fundingKey,
      delta: -reserveFloorCents,  // negative: cash leaves platform_funding
      unit: 'cents',
      note: `genesis debit for market ${market._id}`
    });
    await debitEntry.save({ session });

    const creditEntry = new LedgerEntry({
      tradeId: null,
      accountKey: reserveKey,
      delta: reserveFloorCents,   // positive: cash enters market_reserve
      unit: 'cents',
      note: `genesis credit for market ${market._id}`
    });
    await creditEntry.save({ session });

    // 4. Upsert LedgerAccount balance projections
    await LedgerAccount.findOneAndUpdate(
      { accountKey: fundingKey },
      { $inc: { balance: -reserveFloorCents }, unit: 'cents' },
      { upsert: true, session }
    );
    await LedgerAccount.findOneAndUpdate(
      { accountKey: reserveKey },
      { $inc: { balance: reserveFloorCents }, unit: 'cents' },
      { upsert: true, session }
    );

    // 5. Invariant: sum of the two genesis entries must equal zero
    const entrySum = debitEntry.delta + creditEntry.delta;
    if (entrySum !== 0) {
      throw new GenesisError('Genesis ledger entries do not sum to zero', 500, { entrySum });
    }

    await session.commitTransaction();
    logger.info(`Market genesis complete: marketId=${market._id}, tier=${tier}, floor=${reserveFloorCents}`);
    return { market, marketState };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { GenesisError, openMarket };
```

### Pattern 4: `findOneAndUpdate` with `upsert` and `session`

`LedgerAccount` balance projections are maintained via `$inc` upserts because the same
accountKey may accumulate many deltas. `Model.create()` is never used inside a session
(critical gotcha from TESTING.md). For `findOneAndUpdate` with a session, pass `session`
inside the options object — Mongoose 8.x accepts it there.

```js
// Source: Mongoose 8 docs — options object accepts session
await LedgerAccount.findOneAndUpdate(
  { accountKey: key },
  { $inc: { balance: delta }, $setOnInsert: { unit: 'cents' } },
  { upsert: true, new: true, session }
);
```

### Anti-Patterns to Avoid

- **Using `Model.create()` inside a session:** persists outside the transaction if the
  session aborts. Always use `new Model({...}).save({ session })`.
- **Omitting `Model.init()` in test `beforeAll`:** transactions silently fail if
  collections/indexes don't exist. Call `.init()` on every model touched inside a txn.
- **Using `MongoMemoryServer` instead of `MongoMemoryReplSet`:** standalone instances
  don't support multi-document transactions. Always use `MongoMemoryReplSet`.
- **Storing money as floats:** every monetary field is integer cents. No division, no
  floating-point math in the model layer.
- **Putting supply or price in dollars:** `supply` is integer units, `lastPriceCents` is
  integer cents, `reserveCents` is integer cents.

---

## Complete Schema Designs (All 9 Collections)

These are the exact field names, types, and units the planner should use verbatim.
All money fields are integer cents. Supply is integer units.

### 1. `Market` — per-creator config (immutable after genesis except `status`/`tier`)

```js
// models/Market.js
{
  streamerId:  { type: ObjectId, ref: 'Streamer', required: true, index: true },
  P0_cents:    { type: Number,  required: true },  // starting price, integer cents
  k_num:       { type: Number,  required: true },  // slope numerator
  k_den:       { type: Number,  required: true },  // slope denominator (k = k_num/k_den)
  tier:        { type: String,  enum: ['1','2','3'], required: true },
  status:      { type: String,  enum: ['active','paused'], default: 'active' },
  spreadBps:   { type: Number,  required: true },  // basis points, e.g. 50
  feeBps:      { type: Number,  required: true },  // basis points, e.g. 100
  createdAt:   { type: Date,    default: Date.now },
  updatedAt:   { type: Date,    default: Date.now }
}
// Indexes: { streamerId: 1 } — one market per streamer (not enforced unique; admin ensures)
// pre('save'): updatedAt = new Date()
```

### 2. `MarketState` — hot mutable state, optimistic-lock doc

```js
// models/MarketState.js
{
  marketId:          { type: ObjectId, ref: 'Market', required: true, unique: true },
  supply:            { type: Number,   required: true, default: 0 },       // integer units
  reserveCents:      { type: Number,   required: true },                    // integer cents
  reserveFloorCents: { type: Number,   required: true },                    // integer cents
  lastPriceCents:    { type: Number,   required: true },                    // integer cents
  version:           { type: Number,   required: true, default: 0 },       // incremented each write
  updatedAt:         { type: Date,     default: Date.now }
}
// Indexes: unique on marketId (inline)
// pre('save'): updatedAt = new Date()
// NOTE: execution orchestrator (Phase 4) uses updateOne({_id, version}, $inc:{version:1})
//       NOT .save() — this bypasses the pre('save') hook intentionally for atomicity
```

### 3. `LedgerAccount` — balance projection per account key

```js
// models/LedgerAccount.js
{
  accountKey: { type: String, required: true, unique: true, index: true },
  // accountKey conventions:
  //   'user_cash:<userId>'           — user's spendable cash balance (cents)
  //   'user_pos:<userId>:<marketId>' — user's position in a market (shares/units)
  //   'market_reserve:<marketId>'    — reserve pool (cents)
  //   'platform_fees'                — accumulated fees (cents)
  //   'platform_funding'             — platform seed capital (cents)
  balance:    { type: Number, required: true, default: 0 },
  unit:       { type: String, enum: ['cents','shares'], required: true },
  updatedAt:  { type: Date, default: Date.now }
}
// Indexes: unique on accountKey (inline)
// No pre('save') updatedAt — projections updated via $inc findOneAndUpdate, not .save()
```

### 4. `LedgerEntry` — immutable double-entry postings

```js
// models/LedgerEntry.js
{
  tradeId:    { type: ObjectId, ref: 'Trade', default: null, index: true },
  // null for genesis/funding entries; non-null for trade-generated entries
  accountKey: { type: String, required: true, index: true },
  delta:      { type: Number, required: true },
  // delta sign convention:
  //   positive = credit (money/shares entering the account)
  //   negative = debit  (money/shares leaving the account)
  unit:       { type: String, enum: ['cents','shares'], required: true },
  note:       { type: String, default: null },
  createdAt:  { type: Date, default: Date.now, index: true }
}
// Indexes:
//   { tradeId: 1 }        — fetch all entries for a trade to verify sum==0
//   { accountKey: 1, createdAt: -1 }  — rebuild balance by summing entries
// NO updatedAt — entries are immutable after insert
```

### 5. `Order` — quote-to-order lifecycle

```js
// models/Order.js
{
  userId:          { type: ObjectId, ref: 'User',   required: true, index: true },
  marketId:        { type: ObjectId, ref: 'Market', required: true, index: true },
  side:            { type: String,   enum: ['buy','sell'], required: true },
  qty:             { type: Number,   required: true },  // integer units
  idempotencyKey:  { type: String,   required: true, unique: true },
  status:          { type: String,   enum: ['pending','filled','rejected','expired'], default: 'pending' },
  minReceived:     { type: Number,   default: null }, // integer cents; sell slippage floor
  maxCost:         { type: Number,   default: null }, // integer cents; buy slippage ceiling
  quoteId:         { type: String,   default: null }, // opaque quote reference
  expiresAt:       { type: Date,     required: true },
  createdAt:       { type: Date,     default: Date.now },
  updatedAt:       { type: Date,     default: Date.now }
}
// Indexes:
//   unique on idempotencyKey (inline) — enforces idempotency (EXEC-03)
//   { userId: 1, marketId: 1, createdAt: -1 }
//   { status: 1, expiresAt: 1 }  — for expiry sweeps
// pre('save'): updatedAt = new Date()
```

### 6. `Trade` — immutable filled trade record

```js
// models/Trade.js
{
  orderId:        { type: ObjectId, ref: 'Order',  required: true, index: true },
  marketId:       { type: ObjectId, ref: 'Market', required: true, index: true },
  userId:         { type: ObjectId, ref: 'User',   required: true, index: true },
  side:           { type: String,   enum: ['buy','sell'], required: true },
  qty:            { type: Number,   required: true },  // integer units
  grossCents:     { type: Number,   required: true },  // integer cents pre-fee/spread
  feeCents:       { type: Number,   required: true },  // integer cents routed to platform_fees
  spreadCents:    { type: Number,   required: true },  // integer cents routed to market_reserve
  netCents:       { type: Number,   required: true },  // grossCents ± feeCents ± spreadCents
  avgPriceCents:  { type: Number,   required: true },  // integer cents
  supplyBefore:   { type: Number,   required: true },  // integer units snapshot
  supplyAfter:    { type: Number,   required: true },  // integer units snapshot
  createdAt:      { type: Date,     default: Date.now, index: true }
}
// Indexes:
//   { marketId: 1, createdAt: -1 }  — candle building, price history
//   { userId: 1, createdAt: -1 }    — portfolio history
// NO updatedAt — trades are immutable
```

### 7. `PriceCandle` — OHLC for charts

```js
// models/PriceCandle.js
{
  marketId:  { type: ObjectId, ref: 'Market', required: true, index: true },
  interval:  { type: String,   enum: ['1m','5m','1h','1d'], required: true },
  open:      { type: Number,   required: true },  // integer cents
  high:      { type: Number,   required: true },  // integer cents
  low:       { type: Number,   required: true },  // integer cents
  close:     { type: Number,   required: true },  // integer cents
  volume:    { type: Number,   default: 0 },      // integer units traded in interval
  ts:        { type: Date,     required: true, index: true }  // candle open timestamp
}
// Indexes:
//   { marketId: 1, interval: 1, ts: -1 }  — unique per market+interval+ts window
//   unique compound: { marketId: 1, interval: 1, ts: 1 }
```

### 8. `RiskEvent` — audit when a cap/floor/breaker trips

```js
// models/RiskEvent.js
{
  marketId:  { type: ObjectId, ref: 'Market', required: true, index: true },
  userId:    { type: ObjectId, ref: 'User',   default: null, index: true },
  // null for market-level events (circuit breaker, reserve floor)
  type:      { type: String,   required: true },
  // type values: 'reserve_floor_breach' | 'max_trade_exceeded' | 'max_position_exceeded'
  //              | 'daily_volume_exceeded' | 'circuit_breaker_triggered' | 'dynamic_sell_cap'
  detail:    { type: mongoose.Schema.Types.Mixed, default: {} },
  // detail carries numeric context: { attemptedCents, limitCents, reserveCents, ... }
  createdAt: { type: Date, default: Date.now, index: true }
}
// Indexes:
//   { marketId: 1, createdAt: -1 }
//   { userId: 1, createdAt: -1 }
//   { type: 1, createdAt: -1 }
// NO updatedAt — risk events are immutable audit records
```

### 9. `AdminAction` — audit of admin operations

```js
// models/AdminAction.js
{
  adminId:   { type: ObjectId, ref: 'User',   required: true, index: true },
  action:    { type: String,   required: true },
  // action values: 'create_market' | 'pause_market' | 'resume_market'
  //                | 'set_tier' | 'circuit_breaker_halt' | 'circuit_breaker_resume'
  target:    { type: String,   required: true },  // typically marketId.toString()
  before:    { type: mongoose.Schema.Types.Mixed, default: null },
  after:     { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
}
// Indexes:
//   { adminId: 1, createdAt: -1 }
//   { action: 1, createdAt: -1 }
// NO updatedAt — admin actions are immutable audit records
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Balance projection | Custom balance tracker | `$inc` + `findOneAndUpdate` on `LedgerAccount` | Atomic, composable, survives partial failures |
| Idempotency enforcement | Application-layer dedup | Mongoose unique index on `Order.idempotencyKey` | DB-enforced — immune to race conditions, works across replicas |
| Optimistic locking | Custom CAS loop | `updateOne({_id, version}, {$inc:{version:1}})` | Native MongoDB atomicity, zero extra reads |
| Transaction coordination | saga/outbox pattern | Single Mongoose session (in-process, same replica set) | All writes share one atomic commit; already the codebase pattern |
| Unique-per-market state | Application-side guard | `unique: true` on `MarketState.marketId` | DB-enforced — prevents duplicate state docs even under concurrent genesis |

**Key insight:** MongoDB replica-set transactions give us the atomicity of a relational DB
for the critical writes. Because the AMM engine is in-process (not a microservice), all
writes share one session — no distributed coordination needed.

---

## Common Pitfalls

### Pitfall 1: Using `Model.create()` Inside a Mongoose Session

**What goes wrong:** `Model.create()` ignores the session option in some Mongoose 8 call
paths, causing inserts to persist outside the transaction. If the session aborts, those
documents remain committed — violating atomicity.

**Why it happens:** `create()` is a shorthand that calls `save()` internally but doesn't
thread the session correctly in all code paths.

**How to avoid:** Always use `new Model({...}).save({ session })` for every insert inside
a transaction block.

**Warning signs:** A test that aborts a transaction but still finds the inserted documents
in a subsequent query.

### Pitfall 2: `MongoMemoryServer` Instead of `MongoMemoryReplSet`

**What goes wrong:** Multi-document transactions throw a `Transaction numbers...` error
or silently fail.

**Why it happens:** Standalone MongoDB does not support replica-set transactions.
Sessions exist but `startTransaction()` fails.

**How to avoid:** The global `tests/setup.js` already uses `MongoMemoryReplSet`. Any new
test file that needs transactions must use the same global setup (it does, by default).
Never create a second in-memory instance.

**Warning signs:** `MongoServerError: Transaction numbers are only allowed on a replica member`.

### Pitfall 3: Forgetting `Model.init()` Before Transactional Tests

**What goes wrong:** Mongoose defers collection/index creation until the first write.
When the first write is inside a transaction, the collection creation itself fails
because DDL is not allowed inside a MongoDB transaction.

**Why it happens:** Mongoose's lazy initialization model collides with MongoDB's
transaction constraint (no DDL inside transactions).

**How to avoid:** In every `beforeAll` block that runs transactional code, call
`await Model.init()` for every model that appears inside the transaction.

**Warning signs:** `MongoServerError: Cannot create namespace ... in multi-document transaction`.

### Pitfall 4: Double-Entry Sum Not Exactly Zero Due to Integer Math

**What goes wrong:** A genesis posting of `reserveFloorCents` produces entries that
don't sum to exactly zero because a rounding step was introduced.

**Why it happens:** Genesis is simple (no curve math, no rounding), but it's easy to
accidentally pass a float for `reserveFloorCents` and get a sub-cent delta.

**How to avoid:** Assert `Number.isInteger(reserveFloorCents)` at function entry.
Assert `debitEntry.delta + creditEntry.delta === 0` before `commitTransaction()`.

**Warning signs:** Any non-zero value from `summing all LedgerEntry.delta` for the genesis.

### Pitfall 5: `findOneAndUpdate` with `upsert` Not Threading Session Correctly

**What goes wrong:** The `LedgerAccount` upsert persists even when the parent
transaction aborts.

**Why it happens:** The `session` option must be passed inside the options object,
not as a separate argument. In Mongoose 8, the correct signature is:
`findOneAndUpdate(filter, update, { upsert: true, session })`.

**How to avoid:** Always destructure `session` into the options object. Verify with
a test that aborts after the upsert and confirms the account was not created.

**Warning signs:** `LedgerAccount` docs existing after a failed genesis.

### Pitfall 6: `MarketState.version` Bypassing `pre('save')` in Orchestrator

**What goes wrong:** The execution orchestrator (Phase 4) will use
`updateOne({_id, version}, {$inc:{version:1}})` — this bypasses `pre('save')`.
`updatedAt` won't refresh automatically.

**Why it happens:** `updateOne` with `$set`/`$inc` does not trigger Mongoose hooks.

**How to avoid (Phase 4 concern, note here):** Either add `$set: { updatedAt: new Date() }`
to the `updateOne` payload, or don't rely on `MarketState.updatedAt` for correctness
(it's informational only). Document this in the `MarketState` schema comment.

---

## Genesis Double-Entry Posting — Exact Shape

This is the canonical record of what genesis writes. Every later phase that adds ledger
postings must follow the same sign convention.

**Scenario:** Opening a Tier 1 market with `reserveFloorCents = 10000` ($100.00).

| Entry # | accountKey | delta | unit | note |
|---------|------------|-------|------|------|
| 1 | `platform_funding` | -10000 | cents | debit: seed leaves platform |
| 2 | `market_reserve:<marketId>` | +10000 | cents | credit: seed enters reserve |

**Sum check:** `(-10000) + (10000) = 0` ✓

**LedgerAccount projections after genesis:**

| accountKey | balance delta | unit |
|------------|---------------|------|
| `platform_funding` | -10000 | cents |
| `market_reserve:<marketId>` | +10000 | cents |

**`MarketState` after genesis:**

| field | value |
|-------|-------|
| supply | 0 |
| reserveCents | 10000 |
| reserveFloorCents | 10000 |
| lastPriceCents | P0_cents (100 for oracle params) |
| version | 0 |

---

## AccountKey Convention (Authoritative)

All `accountKey` strings follow these exact templates. Later phases MUST use the same
conventions — any drift breaks balance reconstruction by summing entries.

| Template | Unit | Description |
|----------|------|-------------|
| `user_cash:<userId>` | cents | User's spendable cash balance |
| `user_pos:<userId>:<marketId>` | shares | User's share position in a market |
| `market_reserve:<marketId>` | cents | Market's reserve pool |
| `platform_fees` | cents | Accumulated fee revenue |
| `platform_funding` | cents | Platform seed capital (debited at genesis) |

`<userId>` and `<marketId>` are `ObjectId.toString()` (24-char hex strings).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.x |
| Config file | `VentureCast_Backend-main/jest.config.js` |
| Quick run command | `cd VentureCast_Backend-main && npx jest tests/unit/genesis.test.js --runInBand --forceExit` |
| Full suite command | `cd VentureCast_Backend-main && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LEDG-04a | Nine models exist and `Model.init()` succeeds for all txn-involved models | unit | `npx jest tests/unit/genesis.test.js -t "Model.init" --runInBand --forceExit` | ❌ Wave 0 |
| LEDG-04b | `openMarket()` creates Market + MarketState at s0=0, price=P0, version=0 | unit | `npx jest tests/unit/genesis.test.js -t "genesis creates" --runInBand --forceExit` | ❌ Wave 0 |
| LEDG-04c | Genesis posts two balanced LedgerEntries summing to zero | unit | `npx jest tests/unit/genesis.test.js -t "ledger sum" --runInBand --forceExit` | ❌ Wave 0 |
| LEDG-04d | Genesis is atomic — abort rolls back Market + MarketState + entries together | unit | `npx jest tests/unit/genesis.test.js -t "atomic rollback" --runInBand --forceExit` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx jest tests/unit/genesis.test.js --runInBand --forceExit`
- **Per wave merge:** `cd VentureCast_Backend-main && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/genesis.test.js` — covers LEDG-04a through LEDG-04d
- [ ] `tests/helpers/ammFixtures.js` — factory for `createTestMarket(params)` used by AMM tests in later phases

**Note:** No new framework install needed. `tests/setup.js` and `tests/teardown.js` already
configure `MongoMemoryReplSet`. The new test file just needs to use `connectTestDB()`
from `tests/helpers/db.js` and call `Model.init()` on all nine new models in `beforeAll`.

### Key Test Structure for `genesis.test.js`

```js
// tests/unit/genesis.test.js
const { connectTestDB, clearTestDB, disconnectTestDB } = require('../helpers/db');

let openMarket, GenesisError;
let Market, MarketState, LedgerAccount, LedgerEntry, Order, Trade;
let PriceCandle, RiskEvent, AdminAction;

beforeAll(async () => {
  await connectTestDB();
  // Import after DB connection — required for models to register
  ({ openMarket, GenesisError } = require('../../services/amm/genesisService'));
  Market       = require('../../models/Market');
  MarketState  = require('../../models/MarketState');
  LedgerAccount= require('../../models/LedgerAccount');
  LedgerEntry  = require('../../models/LedgerEntry');
  Order        = require('../../models/Order');
  Trade        = require('../../models/Trade');
  PriceCandle  = require('../../models/PriceCandle');
  RiskEvent    = require('../../models/RiskEvent');
  AdminAction  = require('../../models/AdminAction');

  // CRITICAL: init ALL txn-involved models before any transaction runs
  await Promise.all([
    Market.init(), MarketState.init(), LedgerAccount.init(), LedgerEntry.init(),
    Order.init(), Trade.init(), PriceCandle.init(), RiskEvent.init(), AdminAction.init()
  ]);
});

afterEach(async () => { await clearTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `Shares.day1Price`..`day7Price` (flat fields) | `PriceCandle` collection (OHLC, multiple intervals) | Old fields stay on `Shares.js` for the existing trade path; new AMM charts use `PriceCandle` |
| `Transaction.amount` (all-purpose ledger row) | `LedgerEntry` (accountKey + delta + unit + tradeId) | Old `Transaction` model stays for the existing trade path; AMM ledger uses `LedgerEntry` |
| Naive share price bump in `tradeService.js` | Bonding curve + double-entry in AMM services | Old path stays, new AMM path behind flag (§0 decision: flag-gated coexistence) |

---

## Open Questions

1. **`platform_funding` initial balance**
   - What we know: Genesis debits `platform_funding` by `reserveFloorCents`. The account
     is upserted via `$inc`, so it starts at 0 and goes negative after the first genesis.
   - What's unclear: Should the platform pre-seed `platform_funding` to a large positive
     balance before any market opens (like a "treasury top-up" admin action), or is it
     acceptable for it to run negative as a bookkeeping artifact?
   - Recommendation: Accept a negative `platform_funding` balance for now. It represents
     the platform's outstanding commitment. Document clearly in schema comments. This is
     a bookkeeping convention, not a solvency risk for the MVP.

2. **`reserveFloorCents` per-tier defaults**
   - What we know: The spec says "seeds reserve to its floor" and mentions 3 tiers in
     `config.js`. No floor amounts are specified for each tier.
   - What's unclear: The exact integer-cent floor for Tier 1 / 2 / 3.
   - Recommendation: Define placeholder values in `services/amm/config.js` (Phase 1 scope
     is schema only; the genesis service reads `reserveFloorCents` from the caller's
     params, not from config directly). The planner can leave floor config for Phase 2
     when `config.js` is fully populated.

3. **`PriceCandle` creation timing**
   - What we know: `PriceCandle` is in scope for Phase 1 as a Mongoose model definition.
     Candle-building logic is `marketData.js` territory, planned for later.
   - What's unclear: Should genesis create an initial candle at P0 to seed the chart?
   - Recommendation: No. Genesis creates Market + MarketState + ledger only. The first
     real candle is created when the first trade executes (Phase 4/5). The `PriceCandle`
     model just needs to exist with correct indexes.

---

## Sources

### Primary (HIGH confidence)

- `documentation/CREATOR_AMM_PLAN.md` — §4 data model (9 collections + fields), §1 ground
  truth (integer cents, oracle params), §9 resolved decisions (genesis s0=0, 50/100 bps,
  platform_funding seed, no Stripe dependency in this phase)
- `.planning/REQUIREMENTS.md` — LEDG-04 definition and phase assignment
- `.planning/ROADMAP.md` — Phase 1 goal and 4 success criteria (verbatim)
- `.planning/codebase/CONVENTIONS.md` — CommonJS, integer cents, error class shape,
  transaction pattern, `Model.create()` prohibition, model naming conventions
- `.planning/codebase/TESTING.md` — MongoMemoryReplSet requirement, `Model.init()` gotcha,
  `new Doc().save({session})` pattern, `require.main` guard, `connectDB` skip in test mode
- `.planning/codebase/STRUCTURE.md` — file location conventions, where new models go
- `VentureCast_Backend-main/models/Transaction.js` — schema style to match (verbose
  per-field comments, inline `index: true`, compound `schema.index()` post-block)
- `VentureCast_Backend-main/models/Shares.js` — simpler inline style; contrast with
  Transaction.js for choosing appropriate verbosity level
- `VentureCast_Backend-main/package.json` — confirmed mongoose 8.7.1, jest 30.x,
  mongodb-memory-server 11.x, no new dependencies needed

### Secondary (MEDIUM confidence)

- None required — all design decisions are locked by the spec and codebase conventions.

### Tertiary (LOW confidence)

- None — no speculative claims in this research.

---

## Metadata

**Confidence breakdown:**

- Schema field names/types: HIGH — derived directly from §4 of the spec, validated against
  existing model conventions
- Index strategy: HIGH — unique indexes specified by name in spec; supporting indexes
  derived from query patterns documented in the spec (Phase 4/5 orchestrator queries)
- Genesis posting shape: HIGH — sign convention, two-entry structure, and sum-to-zero
  invariant all specified in §1 and §9
- Test architecture: HIGH — MongoMemoryReplSet, Model.init(), new+save patterns all
  documented in TESTING.md from prior completed phases
- AccountKey conventions: HIGH — all five key templates appear in §4; no ambiguity

**Research date:** 2026-06-05
**Valid until:** Stable spec — valid until CREATOR_AMM_PLAN.md is revised (no expiry pressure)
