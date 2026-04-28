const jwt = require('jsonwebtoken');
const User = require('../models/User');

require('dotenv').config();

/**
 * Authentication middleware - verifies JWT token
 * Attaches user object to req.user if valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or x-auth-token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work with or without auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

/**
 * Verify user owns the resource
 * Use after authenticateToken to ensure req.params.userId matches req.userId
 */
const verifyOwnership = (req, res, next) => {
  const paramUserId = req.params.userId;

  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (paramUserId && paramUserId !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  verifyOwnership,
};
