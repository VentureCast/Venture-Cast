const mongoose = require('mongoose');

const streamerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  profileImageUrl: String,
  followerCount: Number
});

module.exports = mongoose.model('Streamer', streamerSchema);