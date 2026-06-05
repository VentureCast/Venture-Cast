'use strict';

/**
 * services/amm/pricing/curve.js
 *
 * Pure integer-cent bonding curve arithmetic. NO Mongoose, NO DB, NO I/O.
 * All functions accept plain JS objects for market params — never Mongoose documents.
 *
 * Curve: P(s) = P0_cents + (k_num * s) / k_den
 * Buy cost (and sell payout by symmetry) is the closed-form integral:
 *   cost = P0_cents * delta + halfUpDiv(k_num * (s1^2 - s0^2), 2 * k_den)
 *
 * Rounding rule (LOCKED — solvency): every residual favors the reserve, never the user.
 *   halfUpDiv(a, b) rounds UP when the remainder * 2 >= the divisor.
 *
 * Oracle verification (P0=100c, k=1/10, s0=1000, delta=100):
 *   s1=1100, num=210000, divisor=20, quotient=10500, remainder=0
 *   → gross = 100*100 + 10500 = 20500c ($205.00)
 *
 * @typedef {{ P0_cents: number, k_num: number, k_den: number }} CurveParams
 */

// ============================================================
// Error class
// ============================================================

/**
 * PricingError — mirrors TradeError shape exactly: { statusCode, details }.
 *
 * statusCode 400: invalid inputs (negative supply, zero delta, etc.)
 * statusCode 500: arithmetic overflow (s^2 term exceeds Number.MAX_SAFE_INTEGER)
 */
class PricingError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {Object} [details={}]
   */
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'PricingError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Integer division with half-up rounding on the remainder.
 * halfUpDiv(a, b) = floor(a/b) + 1  if  remainder * 2 >= b
 *                 = floor(a/b)       otherwise
 *
 * "Half-up" means the breakpoint rounds UP (toward reserve), not toward nearest-even.
 *
 * Examples:
 *   halfUpDiv(210000, 20) = 10500  (oracle: remainder=0)
 *   halfUpDiv(8016, 20)   = 401    (delta=4: remainder=16, 32>=20 → up)
 *   halfUpDiv(2001, 20)   = 100    (delta=1: remainder=1,  2<20  → down)
 *
 * @param {number} a - dividend (non-negative integer)
 * @param {number} b - divisor (positive integer)
 * @returns {number} integer quotient, half-up rounded
 */
function halfUpDiv(a, b) {
  const q = Math.floor(a / b);
  const r = a % b;
  return (r * 2 >= b) ? q + 1 : q;
}

// ============================================================
// Public exports
// ============================================================

/**
 * Instantaneous price at supply level s.
 *
 * Returns a float — informational only. Do NOT call this inside the cost integral;
 * the cost integral uses integer arithmetic directly (see buyCostCents).
 * Display: use Math.trunc(priceCents(s, params)) for integer cents.
 *
 * @param {number} s - current supply (integer units >= 0)
 * @param {CurveParams} params
 * @returns {number} price in cents (float, informational; may be non-integer)
 */
function priceCents(s, params) {
  const { P0_cents, k_num, k_den } = params;
  return P0_cents + (k_num * s) / k_den;
}

/**
 * Exact integer-cent cost to buy `delta` units starting at supply `s0`.
 *
 * Uses the closed-form integral: P0*delta + halfUpDiv(k_num*(s1^2-s0^2), 2*k_den)
 * Residual rounds UP (halfUp) so sub-cent amounts flow to the reserve, never the user.
 *
 * @param {number} s0    - supply before the buy (non-negative integer)
 * @param {number} delta - units to buy (positive integer)
 * @param {CurveParams} params
 * @returns {number} gross cost in integer cents (halfUp rounded)
 * @throws {PricingError} 400 if inputs are invalid
 * @throws {PricingError} 500 if k_num*(s1^2-s0^2) exceeds Number.MAX_SAFE_INTEGER
 */
function buyCostCents(s0, delta, params) {
  const { P0_cents, k_num, k_den } = params;

  if (!Number.isInteger(s0) || s0 < 0) {
    throw new PricingError('s0 must be a non-negative integer', 400, { s0 });
  }
  if (!Number.isInteger(delta) || delta <= 0) {
    throw new PricingError('delta must be a positive integer', 400, { delta });
  }

  const s1 = s0 + delta;
  const quadNum = k_num * (s1 * s1 - s0 * s0);  // k_num * (s1^2 - s0^2)

  if (!Number.isSafeInteger(quadNum)) {
    throw new PricingError(
      'Overflow: k_num*(s1^2-s0^2) exceeds Number.MAX_SAFE_INTEGER — supply too large',
      500,
      { quadNum, s0, s1, k_num }
    );
  }

  const quadDen = 2 * k_den;
  return P0_cents * delta + halfUpDiv(quadNum, quadDen);
}

/**
 * Exact integer-cent payout for selling `delta` units.
 *
 * IMPORTANT: s0 here is the supply AFTER the sell (i.e., s_before - delta).
 * This is symmetric to buyCostCents: the integral over [s0, s0+delta] is identical.
 * The caller (Phase 4 orchestrator) is responsible for tracking supply direction:
 *   s_after = s_before - delta, then call sellPayoutCents(s_after, delta, params).
 *
 * Symmetry: sellPayoutCents(s_after, delta, params) === buyCostCents(s_after, delta, params)
 *
 * @param {number} s0    - supply AFTER the sell (non-negative integer)
 * @param {number} delta - units to sell (positive integer)
 * @param {CurveParams} params
 * @returns {number} gross payout in integer cents
 * @throws {PricingError} 400 if inputs are invalid
 * @throws {PricingError} 500 if overflow detected
 */
function sellPayoutCents(s0, delta, params) {
  // Delegate to buyCostCents — the integral is identical.
  // s0 is already the post-sell supply; the integral [s0, s0+delta] covers the same range.
  return buyCostCents(s0, delta, params);
}

module.exports = { priceCents, buyCostCents, sellPayoutCents, PricingError };
