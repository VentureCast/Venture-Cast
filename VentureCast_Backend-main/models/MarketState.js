const mongoose = require('mongoose');

// Hot mutable state doc — one per market, optimistic-lock pattern.
//
// NOTE (Phase 4): The execution orchestrator will update this doc via:
//   updateOne({ _id, version }, { $set: { ... }, $inc: { version: 1 } })
// This bypasses the pre('save') hook intentionally for atomicity (no round-trip read).
// updatedAt is therefore informational only — do NOT rely on it for correctness
// in the execution path. The pre('save') hook only fires during the genesis save.

const MarketStateSchema = new mongoose.Schema({
  // Market reference — unique; one state doc per market (DB-enforced)
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    unique: true   // enforces single state per market; prevents duplicate genesis
  },

  // Outstanding share supply — integer units (not dollars, not cents)
  // Genesis starts at s0 = 0
  supply: {
    type: Number,
    required: true,
    default: 0
  },

  // Current reserve pool — integer cents (not dollars)
  reserveCents: {
    type: Number,
    required: true,
    default: 0
  },

  // Minimum reserve floor — integer cents; reserve must not fall below this
  reserveFloorCents: {
    type: Number,
    required: true
  },

  // Last executed trade price — integer cents; used as reference price for quotes
  lastPriceCents: {
    type: Number,
    required: true
  },

  // Optimistic concurrency version — incremented atomically on every state write.
  // Phase 4 uses: updateOne({ _id, version }, { $inc: { version: 1 } })
  version: {
    type: Number,
    required: true,
    default: 0
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook: refresh updatedAt on .save() calls (genesis only; Phase 4 bypasses this)
MarketStateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MarketState', MarketStateSchema);
