const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  shareId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId(), unique: true }, // Unique ID for the share record
  streamerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Streamer', required: true }, // Links to the Streamer schema
  sharePrice: { type: Number, required: true }, // Current share price
  totalShares: { type: Number, required: true }, // Total shares available
  marketCap: { type: Number, required: true }, // Computed as sharePrice * totalShares
  createdAt: { type: Date, default: Date.now }, // Record creation timestamp
  updatedAt: { type: Date, default: Date.now }, // Record update timestamp
});

// Automatically calculate marketCap before saving
shareSchema.pre('save', function (next) {
  this.marketCap = this.sharePrice * this.totalShares;
  next();
});

module.exports = mongoose.model('Share', shareSchema);
