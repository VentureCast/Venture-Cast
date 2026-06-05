'use strict';

/**
 * services/amm/pricing/inversion.js
 *
 * Cash → units inversion for the Creator Stock AMM bonding curve.
 * Pure function — NO Mongoose, NO DB, NO I/O.
 *
 * Given X cents to spend (before fees), finds the maximum integer units purchasable
 * from supply s0 under the curve P(s) = P0_cents + (k_num * s) / k_den.
 *
 * Algorithm:
 *   1. Float estimate via the quadratic formula (starting point only — never trusted for final answer).
 *   2. Two-pass integer search (authoritative):
 *      a. Upward: increment until buyCostCents(s0, delta+1) > X
 *      b. Downward guard: decrement if buyCostCents(s0, delta) > X (handles float overshoot)
 *
 * Verified oracle: cashToUnits(20500, 1000, { P0_cents:100, k_num:1, k_den:10 })
 *   → { units: 100, grossCents: 20500 }  (exact round-trip)
 *
 * @typedef {{ P0_cents: number, k_num: number, k_den: number }} CurveParams
 */

const { buyCostCents } = require('./curve');

/**
 * Find the maximum integer units purchasable with X_cents (gross, before fees).
 *
 * Returns 0 units if X_cents is less than the cost of a single unit.
 * The returned grossCents is the exact integer-cent cost of `units` units
 * (computed by buyCostCents — never the float estimate).
 *
 * @param {number} X_cents - cash budget in integer cents (>= 0)
 * @param {number} s0      - supply before the buy (non-negative integer)
 * @param {CurveParams} params
 * @returns {{ units: number, grossCents: number }}
 */
function cashToUnits(X_cents, s0, params) {
  const { P0_cents, k_num, k_den } = params;

  // Float estimate from the quadratic formula (starting point only):
  //   buyCostCents ≈ (k_num/(2*k_den)) * delta^2 + P(s0) * delta
  //   Solving for delta: a_f * delta^2 + b_f * delta - X = 0
  const a_f = k_num / (2 * k_den);
  const b_f = P0_cents + (k_num * s0 / k_den);  // P(s0) as float
  const discriminant = b_f * b_f + 4 * a_f * X_cents;
  let delta = Math.max(0, Math.floor((-b_f + Math.sqrt(discriminant)) / (2 * a_f)));

  // Two-pass integer search — the float is only a seed, not the answer.
  // Pass 1 (upward): advance if the next unit is still affordable
  while (buyCostCents(s0, delta + 1, params) <= X_cents) {
    delta++;
  }
  // Pass 2 (downward guard): handle rare float overshoot
  while (delta > 0 && buyCostCents(s0, delta, params) > X_cents) {
    delta--;
  }

  // If even 1 unit is unaffordable, return 0
  if (delta === 0 && buyCostCents(s0, 1, params) > X_cents) {
    return { units: 0, grossCents: 0 };
  }

  const grossCents = delta > 0 ? buyCostCents(s0, delta, params) : 0;
  return { units: delta, grossCents };
}

module.exports = { cashToUnits };
