const mongoose = require('mongoose')

const youtubeStreamerSchema = new mongoose.Schema({
    platform: String,
    streamer: String,
    subscriberCount: Number,
    category: String,
  });

const YouTubeStreamer = mongoose.model('YouTubeStreamer', youtubeStreamerSchema);

module.exports = YouTubeStreamer