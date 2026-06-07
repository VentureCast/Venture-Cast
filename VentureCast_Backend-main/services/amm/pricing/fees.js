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
 * Rounding rule (LOCKED — solvency): ceil() so the user pays/loses at least the exact bps.
 *   On a BUY:  user pays  grossCents + spreadCents + feeCents  (rounds UP → user pays more)
 *   On a SELL: user gets  grossCents - spreadCents - feeCents  (rounds UP → user gets less)
 *
 * ceil is computed with EXACT integer arithmetic (ceilDiv), never Math.ceil on a float
 * product — float products lose precision past 2^53 and could round the wrong way.
 *
 * Oracle (gross=20500c, spreadBps=50, feeBps=100):
 *   spreadCents = ceilDiv(20500*50, 10000)  = ceilDiv(1025000,10000) = 103
 *   feeCents    = ceilDiv(20500*100,10000)  = 205
 *   BUY total   = 20500+103+205 = 20808c ;  SELL net = 20500-103-205 = 20192c
 *
 * These functions return integers and touch NO ledger — that is Phase 4.
 *
 * @typedef {{ spreadBps?: number, feeBps?: number }} FeeParams
 */

const { ceilDiv, PricingError } = require('./curve');
const { DEFAULT_SPREAD_BPS, DEFAULT_FEE_BPS } = require('../config');

const MAX_BPS = 10000; // 100%

/** Resolve + validate spreadBps/feeBps from params (falling back to defaults). */
function resolveBps(params) {
  const spreadBps = (params.spreadBps !== undefined && params.spreadBps !== null)
    ? params.spreadBps : DEFAULT_SPREAD_BPS;
  const feeBps = (params.feeBps !== undefined && params.feeBps !== null)
    ? params.feeBps : DEFAULT_FEE_BPS;
  for (const [name, bps] of [['spreadBps', spreadBps], ['feeBps', feeBps]]) {
    if (!Number.isInteger(bps) || bps < 0 || bps > MAX_BPS) {
      throw new PricingError(`${name} must be an integer in [0, ${MAX_BPS}]`, 400, { [name]: bps });
    }
  }
  return { spreadBps, feeBps };
}

/** Compute exact integer spread+fee from grossCents, with overflow guards. */
function computeSpreadFee(grossCents, spreadBps, feeBps) {
  if (!Number.isInteger(grossCents) || grossCents < 0) {
    throw new PricingError('grossCents must be a non-negative integer', 400, { grossCents });
  }
  const spreadProd = grossCents * spreadBps;
  const feeProd = grossCents * feeBps;
  if (!Number.isSafeInteger(spreadProd) || !Number.isSafeInteger(feeProd)) {
    throw new PricingError('Overflow: grossCents*bps exceeds Number.MAX_SAFE_INTEGER', 500, { grossCents });
  }
  return {
    spreadCents: ceilDiv(spreadProd, MAX_BPS),
    feeCents: ceilDiv(feeProd, MAX_BPS),
  };
}

/**
 * Spread + fee on a BUY. User pays grossCents + spreadCents + feeCents = totalCents.
 * @param {number} grossCents - curve integral result (integer cents)
 * @param {FeeParams} [params={}]
 * @returns {{ grossCents:number, spreadCents:number, feeCents:number, totalCents:number }}
 */
function applyBuyFees(grossCents, params = {}) {
  const { spreadBps, feeBps } = resolveBps(params);
  const { spreadCents, feeCents } = computeSpreadFee(grossCents, spreadBps, feeBps);
  return { grossCents, spreadCents, feeCents, totalCents: grossCents + spreadCents + feeCents };
}

/**
 * Spread + fee on a SELL. User receives grossCents - spreadCents - feeCents = netCents.
 * Throws if fees exceed the payout (a degenerate, too-small sell) — the risk engine
 * (Phase 3) enforces a minimum trade size; this guard ensures net is never negative.
 *
 * @param {number} grossCents - curve integral result (integer cents)
 * @param {FeeParams} [params={}]
 * @returns {{ grossCents:number, spreadCents:number, feeCents:number, netCents:number }}
 */
function applySellFees(grossCents, params = {}) {
  const { spreadBps, feeBps } = resolveBps(params);
  const { spreadCents, feeCents } = computeSpreadFee(grossCents, spreadBps, feeBps);
  const netCents = grossCents - spreadCents - feeCents;
  if (netCents < 0) {
    throw new PricingError(
      'Sell fees exceed payout (trade too small) — net would be negative',
      400,
      { grossCents, spreadCents, feeCents, netCents }
    );
  }
  return { grossCents, spreadCents, feeCents, netCents };
}

module.exports = { applyBuyFees, applySellFees };
