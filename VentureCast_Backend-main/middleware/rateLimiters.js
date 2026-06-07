const rateLimit = require('express-rate-limit');

// In test mode, replace every limiter with a no-op pass-through so integration
// tests never hit 429. Rate limiting is an infra concern tested independently
// from business logic; hitting the limit in unit/integration tests produces
// false failures and hides real errors.
const isTest = process.env.NODE_ENV === 'test';
/** @type {import('express').RequestHandler} */
const noopMiddleware = (_req, _res, next) => next();

// Strict limiter for authentication endpoints
const authLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for payment/Stripe operations
const paymentLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: 'Too many payment requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for trading operations
const tradeLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many trade requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter for read-heavy endpoints
const apiLimiter = isTest ? noopMiddleware : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  paymentLimiter,
  tradeLimiter,
  apiLimiter,
};
