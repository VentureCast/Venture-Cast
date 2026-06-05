const mongoose = require('mongoose');

// OHLC candle schema for chart data — schema definition only.
// Candle-building logic lives in the market data service (later phase).
//
// All price fields (open, high, low, close) are integer cents.
// volume is integer units traded within the candle interval.
// ts is the candle open timestamp (start of the interval window).
//
// The unique compound index on (marketId, interval, ts) ensures exactly one
// candle doc per market per interval per time window — upsert-safe.

const PriceCandleSchema = new mongoose.Schema({
  // Market this candle belongs to
  marketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Market',
    required: true,
    index: true
  },

  // Candle width — determines the time window this candle covers
  interval: {
    type: String,
    enum: ['1m', '5m', '1h', '1d'],
    required: true
  },

  // Opening price — integer cents (first trade price in the interval)
  open: {
    type: Number,
    required: true
  },

  // Highest price — integer cents
  high: {
    type: Number,
    required: true
  },

  // Lowest price — integer cents
  low: {
    type: Number,
    required: true
  },

  // Closing price — integer cents (last trade price in the interval)
  close: {
    type: Number,
    required: true
  },

  // Total shares traded in this interval — integer units
  volume: {
    type: Number,
    default: 0
  },

  // Candle open timestamp — start of the interval window; indexed for range queries
  ts: {
    type: Date,
    required: true,
    index: true
  }

  // NO updatedAt — candle docs are updated via $set upserts, not .save()
  // NO pre('save') hook
});

// Unique compound index: one candle per market+interval+timestamp window
// Also serves as the primary lookup key for chart queries
PriceCandleSchema.index({ marketId: 1, interval: 1, ts: 1 }, { unique: true });

module.exports = mongoose.model('PriceCandle', PriceCandleSchema);
