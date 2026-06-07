'use strict';

/**
 * services/amm/risk/index.js
 *
 * Barrel re-exporting the public risk API. The risk engine is 100% pure
 * (no Mongoose, no DB) — callers (Phase 4 orchestrator) pass in every value
 * the decision needs and persist any returned riskEventDraft themselves.
 */

const { evaluate, RiskError } = require('./checks');

module.exports = { evaluate, RiskError };
