'use strict';

/**
 * tests/helpers/prng.js
 *
 * Deterministic seeded PRNG — CommonJS, no external dependency, no Math.random.
 *
 * mulberry32(seed): returns an rng() function that yields floats in [0, 1).
 * The same seed always produces the same stream — any simulation failure is
 * reproducible by re-running with the logged seed.
 *
 * Algorithm: mulberry32 (George Marsaglia, adapted). 32-bit state, high
 * statistical quality for simulation purposes, trivially serialisable.
 *
 * Also exports two small helpers built on top of any rng:
 *   randInt(rng, min, max)  → integer in [min, max] (inclusive)
 *   pick(rng, array)        → a uniformly random element
 */

/**
 * Create a deterministic PRNG seeded by a 32-bit integer.
 *
 * @param {number} seed - 32-bit unsigned integer seed (any JS integer is accepted;
 *                        it is forced to uint32 on entry)
 * @returns {() => number} rng — each call returns a float in [0, 1)
 */
function mulberry32(seed) {
  let a = seed >>> 0; // force to unsigned 32-bit
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Return a uniformly distributed integer in [minInclusive, maxInclusive].
 *
 * @param {() => number} rng
 * @param {number} minInclusive
 * @param {number} maxInclusive
 * @returns {number}
 */
function randInt(rng, minInclusive, maxInclusive) {
  const range = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rng() * range);
}

/**
 * Pick a uniformly random element from an array.
 *
 * @param {() => number} rng
 * @param {Array} array - non-empty array
 * @returns {*}
 */
function pick(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

module.exports = { mulberry32, randInt, pick };
