const mongoose = require('mongoose');

// Immutable audit record — written whenever a risk rule trips; never updated.
//
// type values (non-exhaustive — new types may be added as risk rules are implemented):
//   'reserve_floor_breach'      — trade would push reserve below floor
//   'max_trade_exceeded'        — single trade size exceeds per-trade cap
//   'max_position_exceeded'     — user position would exceed per-user cap
//   'daily_volume_exceeded'     — market daily volume cap reached
//   'circuit_breaker_triggered' — price moved beyond circuit-breaker threshold
//   'dynamic_sell_cap'          — sell size capped by dynamic sell limit
//
// userId is null for market-level events (circuit breaker, reserve floor);
// non-null for user-level events (position cap, trade size cap).

const RiskEventSchema = new mongoose.Schema({
  // Market where the risk event occurred
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    index: true
  },

  // User involved — null for market-level events
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // Risk rule identifier — see type values above
  type: {
    type: String,
    required: true
  },

  // Numeric context for the risk event — schema is flexible per event type
  // e.g. { attemptedCents: 500000, limitCents: 100000, reserveCents: 9500 }
  detail: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Insert timestamp — indexed for all three audit query patterns below
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

  // NO updatedAt — risk events are immutable audit records
  // NO pre('save') hook
});

// Audit query indexes
RiskEventSchema.index({ marketId: 1, createdAt: -1 });  // market risk history
RiskEventSchema.index({ userId: 1, createdAt: -1 });     // user risk history
RiskEventSchema.index({ type: 1, createdAt: -1 });       // aggregate by risk type

module.exports = mongoose.model('RiskEvent', RiskEventSchema);
