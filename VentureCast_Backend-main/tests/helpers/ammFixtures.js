'use strict';

/**
 * ammFixtures.js — Reusable AMM test factories
 *
 * Provides factory functions for AMM-related test data. These are used by
 * genesis.test.js and reused by all later AMM phase tests (Phases 2–6).
 *
 * IMPORTANT: Call connectTestDB() and await Model.init() on all nine AMM models
 * in beforeAll before invoking any factory here. The factories assume a live
 * Mongoose connection.
 */

const mongoose = require('mongoose');

/**
 * Create a test market via openMarket() with sensible defaults.
 * Returns { market, marketState } from genesisService.openMarket().
 *
 * @param {Object} overrides - Any openMarket() param to override
 * @param {string} [overrides.streamerId]         - ObjectId string (auto-generated if omitted)
 * @param {number} [overrides.P0_cents=100]       - Starting price in integer cents
 * @param {number} [overrides.k_num=1]            - Curve slope numerator
 * @param {number} [overrides.k_den=10]           - Curve slope denominator
 * @param {string} [overrides.tier='1']           - Market tier ('1' | '2' | '3')
 * @param {number} [overrides.spreadBps=50]       - Spread in basis points
 * @param {number} [overrides.feeBps=100]         - Fee in basis points
 * @param {number} [overrides.reserveFloorCents=10000] - Reserve floor in integer cents
 * @returns {Promise<{ market: Object, marketState: Object }>}
 */
async function createTestMarket(overrides = {}) {
  // Lazy-require to avoid importing before connectTestDB() is called
  const { openMarket } = require('../../services/amm/genesisService');

  const defaults = {
    streamerId: new mongoose.Types.ObjectId().toString(),
    P0_cents: 100,          // $1.00
    k_num: 1,
    k_den: 10,
    tier: '1',
    spreadBps: 50,          // 0.50%
    feeBps: 100,            // 1.00%
    reserveFloorCents: 10000, // $100.00
  };

  return openMarket({ ...defaults, ...overrides });
}

module.exports = {
  createTestMarket,
};
