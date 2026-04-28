const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Streamer = require('../../models/streamer');
const Share = require('../../models/Shares');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

async function createTestUser(overrides = {}) {
  const hashedPassword = await bcrypt.hash('TestPass1!', 10);
  const defaults = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: hashedPassword,
    kycVerificationStatus: 'verified',
    onboardingStatus: 'completed',
    treasuryStatus: 'active',
    treasuryBalance: {
      available: 1000000, // $10,000 in cents
      pending: 0,
      currency: 'usd',
    },
    stripeAccountId: `acct_test_${Date.now()}`,
    stripeCustomerId: `cus_test_${Date.now()}`,
    financialAccountId: `fa_test_${Date.now()}`,
  };

  return User.create({ ...defaults, ...overrides });
}

async function createTestStreamer(overrides = {}) {
  const defaults = {
    id: `streamer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: 'Test Streamer',
    platform: 'YouTube',
    category: 'Gaming',
    followerCount: 1000000,
    totalViews: 50000000,
  };

  return Streamer.create({ ...defaults, ...overrides });
}

async function createTestShare(streamerId, overrides = {}) {
  const defaults = {
    streamerId,
    sharePrice: 10.0,
    totalShares: 1000000,
    marketCap: 10000000,
  };

  return Share.create({ ...defaults, ...overrides });
}

function generateAuthToken(userId) {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, { expiresIn: '1h' });
}

module.exports = {
  createTestUser,
  createTestStreamer,
  createTestShare,
  generateAuthToken,
};
