const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true }, // User's display name
  email: { type: String, required: true, unique: true }, // User's email address
  password: { type: String, required: true }, // Hashed password
  createdAt: { type: Date, default: Date.now }, // Account creation timestamp
  portfolio: [
    {
      streamerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Streamer', required: true }, // Links to the Streamer schema
      sharesOwned: { type: Number, required: true }, // Number of shares owned
      averageCost: { type: Number, required: true }, // Average cost per share
    },
  ], // User's portfolio
  transactions: [
    {
      transactionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Unique transaction ID
      streamerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Streamer', required: true }, // Links to the Streamer schema
      transactionType: { type: String, enum: ['BUY', 'SELL'], required: true }, // Transaction type
      sharePrice: { type: Number, required: true }, // Price per share during the transaction
      shareCount: { type: Number, required: true }, // Number of shares transacted
      transactionDate: { type: Date, default: Date.now }, // Timestamp of the transaction
    },
  ], // User's transaction history
});

module.exports = mongoose.model('User', UserSchema);
