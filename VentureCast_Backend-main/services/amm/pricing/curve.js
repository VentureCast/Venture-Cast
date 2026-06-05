'use strict';

/**
 * services/amm/pricing/curve.js
 *
 * Pure integer-cent bonding curve arithmetic. NO Mongoose, NO DB, NO I/O.
 * All functions accept plain JS objects for market params — never Mongoose documents.
 *
 * Curve: P(s) = P0_cents + (k_num * s) / k_den
 * The cost to move supply from s0 to s1=s0+delta is the closed-form integral:
 *   integral = P0_cents*delta + k_num*(s1^2 - s0^2) / (2*k_den)
 * Using the exact factored identity s1^2 - s0^2 = delta*(2*s0 + delta), which keeps
 * intermediate products small (overflow-safe to far larger supply than s^2 directly).
 *
 * Rounding rule (LOCKED — solvency): every residual favors the reserve, never the user.
 *   BUY  cost   rounds UP   (ceilDiv)  — user pays at least the exact integral
 *   SELL payout rounds DOWN (floorDiv) — user receives at most the exact integral
 * Consequence (by design): a buy-then-immediate-sell of the same delta at the same
 * supply range loses <=1c to the reserve — a deliberate anti-drain cushion. The
 * underlying real-valued integral is identical for both (that is the symmetry); only
 * the sub-cent rounding direction differs, always in the reserve's favor.
 *
 * Oracle (P0=100c, k=1/10, s0=1000, delta=100): s1^2-s0^2 = 100*(2000+100)=210000,
 *   integral residual = 210000/20 = 10500 (remainder 0) → gross = 100*100 + 10500 = 20500c.
 *
 * @typedef {{ P0_cents: number, k_num: number, k_den: number }} CurveParams
 */

// ============================================================
// Error class — mirrors TradeError shape: { statusCode, details }
// ============================================================

class PricingError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - 400 invalid input, 500 arithmetic overflow
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
// Internal helpers (exact integer arithmetic only)
// ============================================================

/**
 * Validate curve params. k_den must be a positive integer; k_num a non-negative
 * integer (a bonding curve never slopes down); P0_cents a non-negative integer.
 * @param {CurveParams} params
 */
function validateParams(params) {
  if (!params || typeof params !== 'object') {
    throw new PricingError('params is required', 400, { params });
  }
  const { P0_cents, k_num, k_den } = params;
  if (!Number.isInteger(P0_cents) || P0_cents < 0) {
    throw new PricingError('P0_cents must be a non-negative integer', 400, { P0_cents });
  }
  if (!Number.isInteger(k_num) || k_num < 0) {
    throw new PricingError('k_num must be a non-negative integer', 400, { k_num });
  }
  if (!Number.isInteger(k_den) || k_den < 1) {
    throw new PricingError('k_den must be a positive integer', 400, { k_den });
  }
}

/** Exact ceil(a/b) for non-negative integer a and positive integer b. */
function ceilDiv(a, b) {
  const r = a % b;
  return r === 0 ? a / b : (a - r) / b + 1;
}

/** Exact floor(a/b) for non-negative integer a and positive integer b. */
function floorDiv(a, b) {
  return (a - (a % b)) / b;
}

/**
 * Compute the exact integer numerator/denominator of the curve integral residual
 * over [s0, s0+delta], with overflow guards on every intermediate product.
 * @returns {{ quadNum: number, quadDen: number }}
 */
function integralResidual(s0, delta, params) {
  const { k_num, k_den } = params;
  const twoS0PlusDelta = 2 * s0 + delta;            // exact; small
  const diffSquares = delta * twoS0PlusDelta;        // = s1^2 - s0^2, exact, much smaller than s^2
  const quadNum = k_num * diffSquares;
  if (
    !Number.isSafeInteger(twoS0PlusDelta) ||
    !Number.isSafeInteger(diffSquares) ||
    !Number.isSafeInteger(quadNum)
  ) {
    throw new PricingError(
      'Overflow: curve integral term exceeds Number.MAX_SAFE_INTEGER — supply/delta too large',
      500,
      { s0, delta, k_num, quadNum }
    );
  }
  return { quadNum, quadDen: 2 * k_den };
}

/** Validate s0 (non-negative int) and delta (positive int). */
function validateSupplyDelta(s0, delta) {
  if (!Number.isInteger(s0) || s0 < 0) {
    throw new PricingError('s0 must be a non-negative integer', 400, { s0 });
  }
  if (!Number.isInteger(delta) || delta <= 0) {
    throw new PricingError('delta must be a positive integer', 400, { delta });
  }
}

/** Guard that the final integer-cent result is a safe integer. */
function assertSafeResult(value, ctx) {
  if (!Number.isSafeInteger(value)) {
    throw new PricingError('Overflow: cost/payout exceeds Number.MAX_SAFE_INTEGER', 500, ctx);
  }
  return value;
}

// ============================================================
// Public exports
// ============================================================

/**
 * Instantaneous reference price at supply s, in INTEGER cents (rounded to nearest).
 *
 * This is a display/reference value (e.g. a market's "current price" or the
 * informational lastPriceCents). It is NOT used inside the cost integral — the
 * integral uses exact integer arithmetic in buyCostCents/sellPayoutCents.
 *
 * @param {number} s - current supply (non-negative integer)
 * @param {CurveParams} params
 * @returns {number} price in integer cents (nearest)
 */
function priceCents(s, params) {
  validateParams(params);
  if (!Number.isInteger(s) || s < 0) {
    throw new PricingError('s must be a non-negative integer', 400, { s });
  }
  const { P0_cents, k_num, k_den } = params;
  const slopeNum = k_num * s;
  if (!Number.isSafeInteger(slopeNum)) {
    throw new PricingError('Overflow: k_num*s exceeds Number.MAX_SAFE_INTEGER', 500, { s, k_num });
  }
  // P0_cents + round(k_num*s / k_den), exact integer result. Round half-up.
  const whole = floorDiv(slopeNum, k_den);
  const r = slopeNum % k_den;
  const rounded = (r * 2 >= k_den) ? whole + 1 : whole;
  return assertSafeResult(P0_cents + rounded, { s, P0_cents });
}

/**
 * Exact integer-cent cost to buy `delta` units starting at supply `s0`.
 * Residual rounds UP (ceil) so sub-cent amounts flow to the reserve, never the user.
 *
 * @param {number} s0    - supply before the buy (non-negative integer)
 * @param {number} delta - units to buy (positive integer)
 * @param {CurveParams} params
 * @returns {number} gross cost in integer cents (ceil-rounded)
 * @throws {PricingError} 400 invalid input · 500 overflow
 */
function buyCostCents(s0, delta, params) {
  validateParams(params);
  validateSupplyDelta(s0, delta);
  const { P0_cents } = params;
  const { quadNum, quadDen } = integralResidual(s0, delta, params);
  return assertSafeResult(P0_cents * delta + ceilDiv(quadNum, quadDen), { s0, delta });
}

/**
 * Exact integer-cent payout for selling `delta` units.
 * Residual rounds DOWN (floor) so sub-cent amounts stay in the reserve, never the user.
 *
 * NOTE: s0 here is the supply AFTER the sell (s_before - delta); the integral over
 * [s0, s0+delta] covers the same curve range a buy of the same delta would.
 *
 * @param {number} s0    - supply AFTER the sell (non-negative integer)
 * @param {number} delta - units to sell (positive integer)
 * @param {CurveParams} params
 * @returns {number} gross payout in integer cents (floor-rounded)
 * @throws {PricingError} 400 invalid input · 500 overflow
 */
function sellPayoutCents(s0, delta, params) {
  validateParams(params);
  validateSupplyDelta(s0, delta);
  const { P0_cents } = params;
  const { quadNum, quadDen } = integralResidual(s0, delta, params);
  return assertSafeResult(P0_cents * delta + floorDiv(quadNum, quadDen), { s0, delta });
}

module.exports = { priceCents, buyCostCents, sellPayoutCents, PricingError, validateParams, ceilDiv, floorDiv };
