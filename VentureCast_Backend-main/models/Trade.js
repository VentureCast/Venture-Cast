const mongoose = require('mongoose');

// Immutable filled trade record — written once when an order is executed; never updated.
//
// All money fields are integer cents. Supply fields are integer units.
//
// Fee/spread routing:
//   feeCents    → credited to platform_fees LedgerAccount
//   spreadCents → credited to market_reserve LedgerAccount
//   netCents    = grossCents - feeCents - spreadCents (for a buy)
//              or grossCents + feeCents + spreadCents (for a sell, deducted from proceeds)

const TradeSchema = new mongoose.Schema({
  // Order that was filled to produce this trade
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },

  // Market where the trade executed
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    index: true
  },

  // User who owns this trade
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Trade direction
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },

  // Number of shares traded — integer units
  qty: {
    type: Number,
    required: true
  },

  // Gross cost/proceeds before fee and spread deduction — integer cents
  grossCents: {
    type: Number,
    required: true
  },

  // Protocol fee — integer cents; credited to platform_fees
  feeCents: {
    type: Number,
    required: true
  },

  // Market spread — integer cents; credited to market_reserve
  spreadCents: {
    type: Number,
    required: true
  },

  // Net amount the user pays (buy) or receives (sell) — integer cents
  // buy:  netCents = grossCents + feeCents + spreadCents
  // sell: netCents = grossCents - feeCents - spreadCents
  netCents: {
    type: Number,
    required: true
  },

  // Effective average price per share — integer cents
  avgPriceCents: {
    type: Number,
    required: true
  },

  // Supply snapshot before this trade executed — integer units
  supplyBefore: {
    type: Number,
    required: true
  },

  // Supply snapshot after this trade executed — integer units
  supplyAfter: {
    type: Number,
    required: true
  },

  // Insert timestamp — indexed for price history and candle queries
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

  // NO updatedAt — trades are immutable
  // NO pre('save') hook
});

// Candle building and price history query: all trades in a market, newest-first
TradeSchema.index({ marketId: 1, createdAt: -1 });

// Portfolio history query: all trades by a user, newest-first
TradeSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Trade', TradeSchema);
