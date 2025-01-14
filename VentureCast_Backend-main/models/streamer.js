const mongoose = require('mongoose');

const streamerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Unique ID for the streamer (platform-specific ID)
  name: { type: String, required: true }, // Streamer’s display name
  description: { type: String }, // Streamer’s channel or profile description
  profileImageUrl: { type: String }, // URL to the streamer's profile image
  followerCount: { type: Number }, // Total followers for the streamer
  platform: { type: String, required: true }, // Platform name (e.g., YouTube, Twitch)
  category: { type: String }, // Primary genre or category (e.g., gaming)
  totalViews: { type: Number }, // Total view count across streams
  createdAt: { type: Date, default: Date.now }, // Timestamp for when the streamer was added to the app
  updatedAt: { type: Date, default: Date.now }, // Timestamp for the last update of the streamer's data
});

module.exports = mongoose.model('Streamer', streamerSchema);
