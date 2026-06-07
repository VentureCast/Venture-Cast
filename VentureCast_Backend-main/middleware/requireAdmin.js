'use strict';

/**
 * requireAdmin — admin guard middleware.
 *
 * Must be chained AFTER authenticateToken (which sets req.user).
 * Returns 401 if req.user is absent (unauthenticated call reached this middleware).
 * Returns 403 if the authenticated user does not have isAdmin=true.
 * Calls next() for admin users.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = requireAdmin;
