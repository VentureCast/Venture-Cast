'use strict';

/**
 * services/amm/ledger/index.js
 *
 * Public barrel for the double-entry ledger module.
 *
 *   PURE (no DB):  buildBuyPostings, buildSellPostings, assertBalanced, LedgerError
 *   PERSISTENCE:   postEntries(postings, tradeId, session) — writes inside a caller's session
 *
 * Phase 4 owns the transaction; this module never starts/commits/aborts one.
 */

const { buildBuyPostings, buildSellPostings, assertBalanced, LedgerError } = require('./postings');
const { postEntries } = require('./persist');

module.exports = {
  buildBuyPostings,
  buildSellPostings,
  assertBalanced,
  LedgerError,
  postEntries,
};
