'use strict';

/**
 * services/amm/quoteService.js
 *
 * STATELESS quote computation — read-only, persists NOTHING.
 *
 * A quote is advisory only. The POST /orders endpoint re-prices the trade
 * fresh inside its Mongoose transaction; the quote is never authoritative.
 * The only durable effect of a quote is the expiresAt timestamp it returns,
 * which the caller may pass as quoteExpiresAt to POST /orders.
 *
 * Why stateless? Storing quotes adds write load without correctness benefit:
 * the order always re-prices anyway (to prevent stale-price attacks and to
 * serialize against concurrent trades via optimistic locking in the engine).
 */

const crypto = require('crypto');

const Market = require('../../models/Market');
const MarketState = require('../../models/MarketState');
const { priceCents } = require('./pricing/curve');
const { priceTrade } = require('./execution/priceTrade');

/** Quote TTL in milliseconds (30 seconds). */
const TTL_MS = 30_000;

/**
 * QuoteError — mirrors ExecutionError / GenesisError: { message, statusCode, details }.
 */
class QuoteError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - 400 bad input, 404 not found
   * @param {Object} [details={}]
   */
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'QuoteError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Compute a stateless quote for a buy or sell.
 *
 * Does NOT persist anything. Uses .lean() for read performance.
 *
 * @param {Object} params
 * @param {string} params.marketId   - 24-hex ObjectId string
 * @param {'buy'|'sell'} params.side
 * @param {number} [params.qty]       - integer share qty (sell; or buy by qty)
 * @param {number} [params.cashCents] - integer cents budget for a cash-denominated buy
 * @returns {Promise<{
 *   quoteId: string,
 *   marketId: string,
 *   side: 'buy'|'sell',
 *   qty: number,
 *   avgPriceCents: number,
 *   grossCents: number,
 *   feeCents: number,
 *   spreadCents: number,
 *   totalCents?: number,
 *   netCents?: number,
 *   priceImpactBps: number,
 *   expiresAt: string,
 * }>}
 * @throws {QuoteError}   404 market/state not found; 400 bad input
 * @throws {ExecutionError} propagated from priceTrade (already has statusCode)
 */
async function getQuote({ marketId, side, qty, cashCents }) {
  // Load market config (read-only, no session required)
  const m = await Market.findById(marketId).lean();
  if (!m) {
    throw new QuoteError('Market not found', 404, { marketId });
  }

  const st = await MarketState.findOne({ marketId: m._id }).lean();
  if (!st) {
    throw new QuoteError('Market state not found', 404, { marketId });
  }

  // Instantaneous start price (informational, used for priceImpactBps)
  const curveParams = { P0_cents: m.P0_cents, k_num: m.k_num, k_den: m.k_den };
  const startPrice = priceCents(st.supply, curveParams);

  // Price the trade — throws ExecutionError (statusCode already set) on bad params
  const qtyOrCash = side === 'sell'
    ? { qty }
    : (qty != null ? { qty } : { cashCents });
  const priced = priceTrade(m, st, side, qtyOrCash);

  const endPrice = priced.endPriceCents;
  const priceImpactBps = startPrice > 0
    ? Math.round(Math.abs(endPrice - startPrice) / startPrice * 10_000)
    : 0;

  const expiresAt = new Date(Date.now() + TTL_MS);

  return {
    quoteId: crypto.randomUUID(),
    marketId: m._id.toString(),
    side,
    qty: priced.deltaQty,
    avgPriceCents: priced.avgPriceCents,
    grossCents: priced.grossCents,
    feeCents: priced.feeCents,
    spreadCents: priced.spreadCents,
    // totalCents present for buy, netCents present for sell (mirror priceTrade output shape)
    ...(side === 'buy' ? { totalCents: priced.totalCents } : { netCents: priced.netCents }),
    priceImpactBps,
    expiresAt: expiresAt.toISOString(),
  };
}

module.exports = { getQuote, QuoteError };
