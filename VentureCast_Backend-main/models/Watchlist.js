const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  streamerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streamer',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate entries - a user can only watchlist a streamer once
watchlistSchema.index({ userId: 1, streamerId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
