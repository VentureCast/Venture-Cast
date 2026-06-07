'use strict';

/**
 * services/amm/config.js
 *
 * Per-tier spread/fee defaults + risk caps for the Creator Stock AMM.
 * Pure configuration — no Mongoose, no DB, no I/O.
 *
 * Spread (→ market_reserve) and fee (→ platform_fees) are expressed in basis points (bps).
 * 1 bps = 0.01%. e.g. 50 bps = 0.50%.
 *
 * Risk caps (consumed by services/amm/risk/evaluate via riskConfigForTier):
 *   maxTradeCents      — per-trade gross notional cap (integer cents)
 *   maxPositionQty     — per-user max share position (integer units, buys only)
 *   maxDailyCents      — per-user daily gross volume cap (integer cents)
 *   circuitBreakerPct  — price-move circuit breaker threshold (integer bps)
 *
 * These values are loaded by fees.js as defaults when market params omit spreadBps/feeBps,
 * and by the Phase 4 orchestrator (riskConfigForTier) when evaluating risk.
 */

/** @type {number} Default spread in bps routed to market_reserve */
const DEFAULT_SPREAD_BPS = 50;   // 0.50%

/** @type {number} Default fee in bps routed to platform_fees */
const DEFAULT_FEE_BPS = 100;     // 1.00%

/**
 * Per-tier configuration.
 * Tiers: '1' (emerging), '2' (established), '3' (top creator).
 * reserveFloorCents: minimum reserve balance; null = not yet set.
 *
 * Risk caps ascend by tier (a bigger creator market tolerates larger trades/positions).
 * circuitBreakerPct is in bps (1000 = 10%); it loosens slightly for larger, deeper markets.
 *
 * @type {{ [tier: string]: {
 *   spreadBps: number, feeBps: number, reserveFloorCents: number|null,
 *   maxTradeCents: number, maxPositionQty: number, maxDailyCents: number, circuitBreakerPct: number
 * } }}
 */
const TIER_CONFIG = {
  '1': {
    spreadBps: DEFAULT_SPREAD_BPS,
    feeBps: DEFAULT_FEE_BPS,
    reserveFloorCents: null,
    maxTradeCents: 100000,     // $1,000 per trade
    maxPositionQty: 1000,      // 1,000 shares max position
    maxDailyCents: 1000000,    // $10,000 per day
    circuitBreakerPct: 1000,   // 10% price move trips the breaker
  },
  '2': {
    spreadBps: DEFAULT_SPREAD_BPS,
    feeBps: DEFAULT_FEE_BPS,
    reserveFloorCents: null,
    maxTradeCents: 500000,     // $5,000 per trade
    maxPositionQty: 5000,      // 5,000 shares max position
    maxDailyCents: 5000000,    // $50,000 per day
    circuitBreakerPct: 1500,   // 15% price move trips the breaker
  },
  '3': {
    spreadBps: DEFAULT_SPREAD_BPS,
    feeBps: DEFAULT_FEE_BPS,
    reserveFloorCents: null,
    maxTradeCents: 2000000,    // $20,000 per trade
    maxPositionQty: 20000,     // 20,000 shares max position
    maxDailyCents: 20000000,   // $200,000 per day
    circuitBreakerPct: 2000,   // 20% price move trips the breaker
  },
};

/** The four risk-cap fields the risk engine's tierConfig requires. */
const RISK_CAP_FIELDS = ['maxTradeCents', 'maxPositionQty', 'maxDailyCents', 'circuitBreakerPct'];

/**
 * Return the four-field risk tierConfig for a tier string.
 * Shape: { maxTradeCents, maxPositionQty, maxDailyCents, circuitBreakerPct } — all integers.
 *
 * @param {string} tier - '1' | '2' | '3'
 * @returns {{ maxTradeCents:number, maxPositionQty:number, maxDailyCents:number, circuitBreakerPct:number }}
 * @throws {Error} if the tier is unknown
 */
function riskConfigForTier(tier) {
  const cfg = TIER_CONFIG[tier];
  if (!cfg) {
    throw new Error(`Unknown market tier: ${JSON.stringify(tier)} (expected '1' | '2' | '3')`);
  }
  return {
    maxTradeCents: cfg.maxTradeCents,
    maxPositionQty: cfg.maxPositionQty,
    maxDailyCents: cfg.maxDailyCents,
    circuitBreakerPct: cfg.circuitBreakerPct,
  };
}

module.exports = {
  DEFAULT_SPREAD_BPS,
  DEFAULT_FEE_BPS,
  TIER_CONFIG,
  RISK_CAP_FIELDS,
  riskConfigForTier,
};
