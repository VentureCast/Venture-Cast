const mongoose = require('mongoose')
const youtubeVideoSchema = new mongoose.Schema({
    title: String,
    videoId: String,
    publishedAt: Date,
    description: String,
    viewCount: Number,
    likeCount: Number,
  });
  
  const YouTubeVideo = mongoose.model('YouTubeVideo', youtubeVideoSchema);

  module.exports = YouTubeVideo