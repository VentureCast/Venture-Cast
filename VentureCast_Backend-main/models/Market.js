const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  // Creator/streamer reference — one market per streamer (admin-enforced, not DB-unique)
  streamerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streamer',
    required: true,
    index: true
  },

  // Starting price in integer cents — e.g. 100 = $1.00
  P0_cents: {
    type: Number,
    required: true
  },

  // Bonding curve slope as a rational: k = k_num / k_den
  // Stored as integers to avoid float precision issues
  k_num: {
    type: Number,
    required: true
  },
  k_den: {
    type: Number,
    required: true
  },

  // Market tier — determines reserve floor and risk limits
  tier: {
    type: String,
    enum: ['1', '2', '3'],
    required: true
  },

  // Market lifecycle status
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active'
  },

  // Spread in basis points — e.g. 50 = 0.50% — credited to market_reserve
  spreadBps: {
    type: Number,
    required: true
  },

  // Protocol fee in basis points — e.g. 100 = 1.00% — credited to platform_fees
  feeBps: {
    type: Number,
    required: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Supporting indexes
MarketSchema.index({ streamerId: 1 });

// Pre-save hook: keep updatedAt current on every .save() call
MarketSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Market', MarketSchema);
