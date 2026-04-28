const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  shareId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId(), unique: true }, // Unique ID for the share record
  streamerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Streamer', required: true }, // Links to the Streamer schema
  sharePrice: { type: Number, required: true }, // Current share price
  totalShares: { type: Number, required: true }, // Total shares available
  marketCap: { type: Number, required: true }, // Computed as sharePrice * totalShares
  // Price history - rolling 7-day prices for chart display
  day1Price: { type: Number, default: null }, // 1 day ago price
  day2Price: { type: Number, default: null }, // 2 days ago price
  day3Price: { type: Number, default: null }, // 3 days ago price
  day4Price: { type: Number, default: null }, // 4 days ago price
  day5Price: { type: Number, default: null }, // 5 days ago price
  day6Price: { type: Number, default: null }, // 6 days ago price
  day7Price: { type: Number, default: null }, // 7 days ago price
  createdAt: { type: Date, default: Date.now }, // Record creation timestamp
  updatedAt: { type: Date, default: Date.now }, // Record update timestamp
});

// Index on streamerId — queried 12+ times across the codebase
shareSchema.index({ streamerId: 1 });

// Automatically calculate marketCap before saving
shareSchema.pre('save', function (next) {
  this.marketCap = this.sharePrice * this.totalShares;
  next();
});

module.exports = mongoose.model('Share', shareSchema);
