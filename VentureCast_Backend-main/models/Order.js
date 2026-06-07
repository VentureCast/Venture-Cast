const mongoose = require('mongoose');

// Quote-to-order lifecycle — one doc per submitted order.
// idempotencyKey enforces EXEC-03: duplicate order submissions are rejected at the DB layer.

const OrderSchema = new mongoose.Schema({
  // User who submitted the order
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Market the order is for
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    index: true
  },

  // Trade direction
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },

  // Quantity of shares to buy or sell — integer units (not cents)
  qty: {
    type: Number,
    required: true
  },

  // Client-supplied idempotency key — unique DB index prevents duplicate execution (EXEC-03)
  idempotencyKey: {
    type: String,
    required: true,
    unique: true   // DB-enforced: duplicate key → order already submitted
  },

  // Order lifecycle status
  status: {
    type: String,
    enum: ['pending', 'filled', 'rejected', 'expired'],
    default: 'pending'
  },

  // Slippage floor for sell orders — integer cents; fill rejected if proceeds < this
  minReceived: {
    type: Number,
    default: null
  },

  // Slippage ceiling for buy orders — integer cents; fill rejected if cost > this
  maxCost: {
    type: Number,
    default: null
  },

  // Opaque quote reference returned from the quote endpoint; tied to this order
  quoteId: {
    type: String,
    default: null
  },

  // Hard expiry — order must be filled or rejected before this timestamp
  expiresAt: {
    type: Date,
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

// Compound indexes for portfolio history and expiry sweep queries
OrderSchema.index({ userId: 1, marketId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, expiresAt: 1 });  // expiry sweep: find pending + expired orders

// Pre-save hook: keep updatedAt current on status transitions
OrderSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
