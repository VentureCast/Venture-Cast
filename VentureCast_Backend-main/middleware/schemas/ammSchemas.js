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
// Exports
// Export as an object so later plans (05-02, 05-03) can extend
// by adding more properties without changing the import shape.
// ============================================================

module.exports = {
  marketIdParam,
};
