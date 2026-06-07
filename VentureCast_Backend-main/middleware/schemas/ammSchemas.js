'use strict';

const Joi = require('joi');

// Reusable 24-hex ObjectId pattern (mirrors tradeSchemas.js)
const objectId = Joi.string().hex().length(24);

// Sane upper bounds so absurd input is rejected with a clean 400 rather than reaching
// the pricing engine's overflow guard and surfacing as a 500 (codex audit, finding #6).
// Both ceilings are far above any real trade and far below the curve's safe-integer cliff.
const MAX_QTY = 1_000_000_000;            // 1e9 shares
const MAX_CENTS = 1_000_000_000_000;      // 1e12 cents ($10B)
const MAX_BPS = 10_000;                   // 100% — matches fees.js

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
  qty: Joi.number().integer().min(1).max(MAX_QTY).optional(),
  cashCents: Joi.number().integer().min(1).max(MAX_CENTS).optional(),
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
  qty: Joi.number().integer().min(1).max(MAX_QTY).optional(),
  cashCents: Joi.number().integer().min(1).max(MAX_CENTS).optional(),
  idempotencyKey: Joi.string().min(1).max(200).required(),
  maxCostCents: Joi.number().integer().min(0).max(MAX_CENTS).optional(),
  minReceivedCents: Joi.number().integer().min(0).max(MAX_CENTS).optional(),
  quoteExpiresAt: Joi.date().iso().optional(),
}).or('qty', 'cashCents');

// ============================================================
// Body schemas — POST /admin/markets (API-05)
// ============================================================

/**
 * createMarketSchema — validates POST /admin/markets request body.
 * streamerId and reserveFloorCents are required.
 * Other params fall back to genesisService defaults when omitted.
 */
const createMarketSchema = Joi.object({
  streamerId: objectId.required(),
  P0_cents: Joi.number().integer().min(1).max(MAX_CENTS).optional(),
  k_num: Joi.number().integer().min(0).max(MAX_CENTS).optional(),
  k_den: Joi.number().integer().min(1).max(MAX_CENTS).optional(),
  tier: Joi.string().valid('1', '2', '3').optional(),
  spreadBps: Joi.number().integer().min(0).max(MAX_BPS).optional(),
  feeBps: Joi.number().integer().min(0).max(MAX_BPS).optional(),
  reserveFloorCents: Joi.number().integer().min(1).max(MAX_CENTS).required(),
});

// ============================================================
// Body schemas — PATCH /admin/markets/:id (API-05)
// ============================================================

/**
 * patchMarketSchema — validates PATCH /admin/markets/:id request body.
 * At least one field must be present (.min(1)).
 * status, tier, spreadBps, feeBps are the patchable fields.
 */
const patchMarketSchema = Joi.object({
  status: Joi.string().valid('active', 'paused').optional(),
  tier: Joi.string().valid('1', '2', '3').optional(),
  spreadBps: Joi.number().integer().min(0).max(MAX_BPS).optional(),
  feeBps: Joi.number().integer().min(0).max(MAX_BPS).optional(),
}).min(1);

// ============================================================
// Exports
// Export as an object so later plans (05-03+) can extend
// by adding more properties without changing the import shape.
// ============================================================

module.exports = {
  marketIdParam,
  quoteSchema,
  orderSchema,
  createMarketSchema,
  patchMarketSchema,
};
