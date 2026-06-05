'use strict';

/**
 * services/amm/pricing/fees.js
 *
 * Spread and fee routing for the Creator Stock AMM.
 * Pure function — NO Mongoose, NO DB, NO I/O.
 *
 * Two distinct integer-cent amounts with two distinct destinations:
 *   spreadCents → market_reserve   (liquidity buffer, per-market)
 *   feeCents    → platform_fees    (platform revenue)
 *
 * Rounding rule (LOCKED — solvency): ceil() so user pays/loses at least the exact bps.
 *   "Every rounding favors the reserve/platform, never the user."
 *   On a BUY:  user pays spreadCents + feeCents extra → rounds UP → user pays more
 *   On a SELL: user loses spreadCents + feeCents → rounds UP → user receives less
 *
 *   spreadCents = ceil(grossCents * spreadBps / 10000)  → reserve
 *   feeCents    = ceil(grossCents * feeBps   / 10000)   → platform_fees
 *
 * Oracle verification (gross=20500c, spreadBps=50, feeBps=100):
 *   spreadCents = ceil(20500*50/10000)  = ceil(102.5) = 103
 *   feeCents    = ceil(20500*100/10000) = ceil(205.0)  = 205
 *   BUY total   = 20500+103+205 = 20808c
 *   SELL net    = 20500-103-205 = 20192c
 *
 * These functions return integers and touch NO ledger — that is Phase 4.
 *
 * @typedef {{ P0_cents?: number, k_num?: number, k_den?: number, spreadBps?: number, feeBps?: number }} FeeParams
 */

const { DEFAULT_SPREAD_BPS, DEFAULT_FEE_BPS } = require('../config');

/**
 * Compute the integer-cent spread and fee amounts on a BUY.
 * User pays: grossCents + spreadCents + feeCents = totalCents.
 *
 * @param {number} grossCents - curve integral result (integer cents)
 * @param {FeeParams} [params={}]
 * @returns {{ grossCents: number, spreadCents: number, feeCents: number, totalCents: number }}
 */
function applyBuyFees(grossCents, params = {}) {
  const spreadBps = (params.spreadBps !== undefined && params.spreadBps !== null)
    ? params.spreadBps
    : DEFAULT_SPREAD_BPS;
  const feeBps = (params.feeBps !== undefined && params.feeBps !== null)
    ? params.feeBps
    : DEFAULT_FEE_BPS;

  // ceil(): every sub-cent residual rounds UP — favors the reserve/platform, never the user
  const spreadCents = Math.ceil(grossCents * spreadBps / 10000);
  const feeCents    = Math.ceil(grossCents * feeBps   / 10000);

  return {
    grossCents,
    spreadCents,
    feeCents,
    totalCents: grossCents + spreadCents + feeCents,
  };
}

/**
 * Compute the integer-cent spread and fee amounts on a SELL.
 * User receives: grossCents - spreadCents - feeCents = netCents.
 *
 * Spread and fee are computed on grossCents (the curve integral), NOT on netCents.
 * This avoids circular arithmetic (Pitfall 5).
 *
 * @param {number} grossCents - curve integral result (integer cents)
 * @param {FeeParams} [params={}]
 * @returns {{ grossCents: number, spreadCents: number, feeCents: number, netCents: number }}
 */
function applySellFees(grossCents, params = {}) {
  const spreadBps = (params.spreadBps !== undefined && params.spreadBps !== null)
    ? params.spreadBps
    : DEFAULT_SPREAD_BPS;
  const feeBps = (params.feeBps !== undefined && params.feeBps !== null)
    ? params.feeBps
    : DEFAULT_FEE_BPS;

  // ceil(): user loses at least the exact bps → reserve/platform favored
  const spreadCents = Math.ceil(grossCents * spreadBps / 10000);
  const feeCents    = Math.ceil(grossCents * feeBps   / 10000);

  return {
    grossCents,
    spreadCents,
    feeCents,
    netCents: grossCents - spreadCents - feeCents,
  };
}

module.exports = { applyBuyFees, applySellFees };
