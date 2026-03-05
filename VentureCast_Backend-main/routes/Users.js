const express = require('express');
const User = require('../models/User');
const { authenticateToken, verifyOwnership } = require('../middleware/auth');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../middleware/schemas/userSchemas');

const router = express.Router();

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * GET /users/:userId
 * Get user by ID (protected - must be authenticated and own the resource)
 */
router.get('/users/:userId', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /users/:userId
 * Update user profile
 */
router.patch('/users/:userId', authenticateToken, verifyOwnership, validate(updateUserSchema), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'dateOfBirth', 'address'];
    const updates = {};

    // Filter only allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * GET /users/:userId/balance
 * Get user's treasury balance
 */
router.get('/users/:userId/balance', authenticateToken, verifyOwnership, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('treasuryBalance');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      balance: user.treasuryBalance || {
        available: 0,
        pending: 0,
        currency: 'usd'
      }
    });
  } catch (error) {
    logger.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

module.exports = router;
