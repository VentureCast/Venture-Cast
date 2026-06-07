'use strict';

/**
 * services/amm/ledger/postings.js
 *
 * PURE double-entry posting builder for the Creator Stock AMM.
 * NO Mongoose, NO DB, NO I/O — mirrors the style of services/amm/pricing/fees.js.
 *
 * Turns the pricing engine's fee output (applyBuyFees / applySellFees) into a set of
 * double-entry postings: `{ accountKey, delta, unit }` with integer deltas.
 *
 * Sign convention (matches models/LedgerEntry.js):
 *   positive delta = credit  (money/shares entering the account)
 *   negative delta = debit   (money/shares leaving the account)
 *
 * Per-unit invariant (LEDG-01/03): every unit-group (cents, shares) MUST sum to exactly zero.
 *
 * accountKey templates (LOCKED — drift breaks reconstruction):
 *   user_cash:<userId>                       unit cents
 *   user_pos:<userId>:<marketId>             unit shares
 *   market_reserve:<marketId>                unit cents
 *   market_shares_outstanding:<marketId>     unit shares (counterparty; balance = -supply)
 *   platform_fees                            unit cents
 *
 * BUY table (user mints deltaQty shares, pays totalCents):
 *   cents:  user_cash:<uid>                  -totalCents
 *           market_reserve:<mid>             +(grossCents + spreadCents)
 *           platform_fees                    +feeCents
 *   shares: user_pos:<uid>:<mid>             +deltaQty
 *           market_shares_outstanding:<mid>  -deltaQty
 *
 * SELL table (user burns deltaQty shares, receives netCents):
 *   cents:  user_cash:<uid>                  +netCents
 *           market_reserve:<mid>             -(grossCents - spreadCents)
 *           platform_fees                    +feeCents
 *   shares: user_pos:<uid>:<mid>             -deltaQty
 *           market_shares_outstanding:<mid>  +deltaQty
 */

// ---------------------------------------------------------------------------
// Error class — mirrors TradeError / GenesisError (statusCode + details)
// ---------------------------------------------------------------------------

class LedgerError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - 400 for invalid input, 500 for a violated invariant
   * @param {Object} [details={}]
   */
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'LedgerError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Internal guards
// ---------------------------------------------------------------------------

/** Throw a 400 LedgerError if `value` is not a finite integer. */
function requireInteger(value, name) {
  if (!Number.isInteger(value)) {
    throw new LedgerError(`${name} must be an integer`, 400, { [name]: value });
  }
}

/**
 * Validate posting inputs shared by buy/sell builders.
 * deltaQty must be a positive integer; the fee fields must be integers.
 *
 * @param {{ userId: string, marketId: string, deltaQty: number, fees: Object }} params
 * @param {string[]} feeFields - required integer fields on `fees`
 */
function requirePostingInput({ userId, marketId, deltaQty, fees }, feeFields) {
  if (!userId || !marketId) {
    throw new LedgerError('userId and marketId are required', 400, { userId, marketId });
  }
  if (!Number.isInteger(deltaQty) || deltaQty <= 0) {
    throw new LedgerError('deltaQty must be a positive integer', 400, { deltaQty });
  }
  if (!fees || typeof fees !== 'object') {
    throw new LedgerError('fees object is required', 400, { fees });
  }
  for (const field of feeFields) {
    requireInteger(fees[field], `fees.${field}`);
  }
}

// ---------------------------------------------------------------------------
// assertBalanced — per-unit sum-to-zero proof (LEDG-03)
// ---------------------------------------------------------------------------

/**
 * Prove that a set of postings is balanced: every unit-group sums to exactly zero.
 * Also enforces that every delta is an integer. THROWS before any caller writes.
 *
 * @param {Array<{accountKey:string, delta:number, unit:string}>} postings
 * @returns {Array} the same postings (for convenient chaining) when balanced
 * @throws {LedgerError} 400 on non-integer delta; 500 when a unit-group is non-zero
 */
function assertBalanced(postings) {
  if (!Array.isArray(postings) || postings.length === 0) {
    throw new LedgerError('postings must be a non-empty array', 400, { postings });
  }

  const sums = new Map(); // unit -> running integer sum
  for (const p of postings) {
    requireInteger(p.delta, `delta for ${p.accountKey}`);
    if (p.unit !== 'cents' && p.unit !== 'shares') {
      throw new LedgerError('posting unit must be cents or shares', 400, { unit: p.unit });
    }
    sums.set(p.unit, (sums.get(p.unit) || 0) + p.delta);
  }

  for (const [unit, sum] of sums) {
    if (sum !== 0) {
      throw new LedgerError('Ledger postings do not sum to zero', 500, { unit, sum });
    }
  }

  return postings;
}

// ---------------------------------------------------------------------------
// buildBuyPostings / buildSellPostings
// ---------------------------------------------------------------------------

/**
 * Build the 5 BUY postings from the applyBuyFees output. Mints `deltaQty` shares.
 *
 * @param {Object} params
 * @param {string} params.userId    - ObjectId.toString()
 * @param {string} params.marketId  - ObjectId.toString()
 * @param {number} params.deltaQty  - shares minted (positive integer)
 * @param {Object} params.fees      - applyBuyFees output { grossCents, spreadCents, feeCents, totalCents }
 * @returns {Array<{accountKey:string, delta:number, unit:string}>}
 */
function buildBuyPostings({ userId, marketId, deltaQty, fees }) {
  requirePostingInput(
    { userId, marketId, deltaQty, fees },
    ['grossCents', 'spreadCents', 'feeCents', 'totalCents']
  );

  const postings = [
    // cents
    { accountKey: `user_cash:${userId}`, delta: -fees.totalCents, unit: 'cents' },
    { accountKey: `market_reserve:${marketId}`, delta: fees.grossCents + fees.spreadCents, unit: 'cents' },
    { accountKey: 'platform_fees', delta: fees.feeCents, unit: 'cents' },
    // shares (MINT)
    { accountKey: `user_pos:${userId}:${marketId}`, delta: deltaQty, unit: 'shares' },
    { accountKey: `market_shares_outstanding:${marketId}`, delta: -deltaQty, unit: 'shares' },
  ];

  // Defense in depth — never return an unbalanced set.
  assertBalanced(postings);
  return postings;
}

/**
 * Build the 5 SELL postings from the applySellFees output. Burns `deltaQty` shares.
 *
 * @param {Object} params
 * @param {string} params.userId    - ObjectId.toString()
 * @param {string} params.marketId  - ObjectId.toString()
 * @param {number} params.deltaQty  - shares burned (positive integer)
 * @param {Object} params.fees      - applySellFees output { grossCents, spreadCents, feeCents, netCents }
 * @returns {Array<{accountKey:string, delta:number, unit:string}>}
 */
function buildSellPostings({ userId, marketId, deltaQty, fees }) {
  requirePostingInput(
    { userId, marketId, deltaQty, fees },
    ['grossCents', 'spreadCents', 'feeCents', 'netCents']
  );

  const postings = [
    // cents
    { accountKey: `user_cash:${userId}`, delta: fees.netCents, unit: 'cents' },
    { accountKey: `market_reserve:${marketId}`, delta: -(fees.grossCents - fees.spreadCents), unit: 'cents' },
    { accountKey: 'platform_fees', delta: fees.feeCents, unit: 'cents' },
    // shares (BURN)
    { accountKey: `user_pos:${userId}:${marketId}`, delta: -deltaQty, unit: 'shares' },
    { accountKey: `market_shares_outstanding:${marketId}`, delta: deltaQty, unit: 'shares' },
  ];

  assertBalanced(postings);
  return postings;
}

module.exports = { buildBuyPostings, buildSellPostings, assertBalanced, LedgerError };
