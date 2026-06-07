'use strict';

const Joi = require('joi');

// Reusable 24-hex ObjectId pattern (mirrors tradeSchemas.js)
const objectId = Joi.string().hex().length(24);

// ============================================================
// Param schemas
// ============================================================

/**
 * Validates :id URL param as a 24-hex MongoDB ObjectId.
 * Used on GET /markets/:id (and reused by later AMM plans).
 */
const marketIdParam = Joi.object({
  id: objectId.required(),
});

// ============================================================
// Body schemas — POST /quotes (API-02)
// ============================================================

/**
 * quoteSchema — validates the POST /quotes request body.
 * Exactly one of qty or cashCents must be present (.or()).
 * Stateless: no userId accepted (sourced from JWT in controller).
 */
const quoteSchema = Joi.object({
  marketId: objectId.required(),
  side: Joi.string().valid('buy', 'sell').required(),
  qty: Joi.number().integer().min(1).optional(),
  cashCents: Joi.number().integer().min(1).optional(),
}).or('qty', 'cashCents');

// ============================================================
// Body schemas — POST /orders (API-03)
// ============================================================

/**
 * orderSchema — validates the POST /orders request body.
 * IMPORTANT: userId is intentionally absent — it MUST come from req.userId (JWT only).
 * idempotencyKey is required (Joi rejects missing → 400 before the controller runs).
 */
const orderSchema = Joi.object({
  marketId: objectId.required(),
  side: Joi.string().valid('buy', 'sell').required(),
  qty: Joi.number().integer().min(1).optional(),
  cashCents: Joi.number().integer().min(1).optional(),
  idempotencyKey: Joi.string().min(1).max(200).required(),
  maxCostCents: Joi.number().integer().min(0).optional(),
  minReceivedCents: Joi.number().integer().min(0).optional(),
  quoteExpiresAt: Joi.date().iso().optional(),
}).or('qty', 'cashCents');

// ============================================================
// Exports
// Export as an object so later plans (05-03+) can extend
// by adding more properties without changing the import shape.
// ============================================================

module.exports = {
  marketIdParam,
  quoteSchema,
  orderSchema,
};
