'use strict';

/**
 * services/amm/config.js
 *
 * Per-tier spread/fee defaults for the Creator Stock AMM.
 * Pure configuration — no Mongoose, no DB, no I/O.
 *
 * Spread (→ market_reserve) and fee (→ platform_fees) are expressed in basis points (bps).
 * 1 bps = 0.01%. e.g. 50 bps = 0.50%.
 *
 * These values are loaded by fees.js as defaults when market params omit spreadBps/feeBps.
 * Phase 3 will populate reserveFloorCents per tier from the spec.
 */

/** @type {number} Default spread in bps routed to market_reserve */
const DEFAULT_SPREAD_BPS = 50;   // 0.50%

/** @type {number} Default fee in bps routed to platform_fees */
const DEFAULT_FEE_BPS = 100;     // 1.00%

/**
 * Per-tier configuration placeholders.
 * Tiers: '1' (emerging), '2' (established), '3' (top creator).
 * reserveFloorCents: minimum reserve balance; null = not yet set (Phase 3).
 *
 * @type {{ [tier: string]: { spreadBps: number, feeBps: number, reserveFloorCents: number|null } }}
 */
const TIER_CONFIG = {
  '1': { spreadBps: DEFAULT_SPREAD_BPS, feeBps: DEFAULT_FEE_BPS, reserveFloorCents: null },
  '2': { spreadBps: DEFAULT_SPREAD_BPS, feeBps: DEFAULT_FEE_BPS, reserveFloorCents: null },
  '3': { spreadBps: DEFAULT_SPREAD_BPS, feeBps: DEFAULT_FEE_BPS, reserveFloorCents: null },
};

module.exports = { DEFAULT_SPREAD_BPS, DEFAULT_FEE_BPS, TIER_CONFIG };
