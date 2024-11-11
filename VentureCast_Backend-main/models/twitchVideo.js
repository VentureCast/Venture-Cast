const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  streamerId: { type: String, required: true,unique: true },
  title: String,
  description: String,
  publishedAt: Date,
  viewCount: Number,
  url: String,
  streamerId: String,
  streamerName: String
});

module.exports = mongoose.model('TwitchVideo', videoSchema);
