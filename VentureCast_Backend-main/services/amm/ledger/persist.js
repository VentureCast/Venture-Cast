'use strict';

/**
 * services/amm/ledger/persist.js
 *
 * PERSISTENCE layer for the double-entry ledger. Takes a Mongoose session passed IN
 * and writes inside it — it does NOT start, commit, abort, or end the transaction.
 * Phase 4 (the execution orchestrator) owns the transaction lifecycle; this module is
 * just the ledger write step inside that transaction.
 *
 * Mirrors the write pattern from services/amm/genesisService.js exactly:
 *   - LedgerEntry via `new LedgerEntry({...}).save({ session })` (NEVER Model.create(),
 *     which escapes the session per MEMORY.md).
 *   - LedgerAccount via `findOneAndUpdate($inc, $setOnInsert unit)` with the session in
 *     the options object (Mongoose 8) so the upsert joins the transaction.
 *
 * Invariant gate (LEDG-03): assertBalanced runs FIRST, before any write — an unbalanced
 * set throws before a single document is touched.
 */

const LedgerEntry = require('../../../models/LedgerEntry');
const LedgerAccount = require('../../../models/LedgerAccount');
const { assertBalanced, LedgerError } = require('./postings');

/**
 * Persist a balanced set of postings inside a caller-supplied session.
 *
 * For each posting:
 *   1. Insert one immutable LedgerEntry (append-only audit row).
 *   2. $inc-upsert its LedgerAccount balance projection.
 *
 * After commit, summing LedgerEntry.delta by accountKey equals LedgerAccount.balance
 * for every account (LEDG-02).
 *
 * @param {Array<{accountKey:string, delta:number, unit:string}>} postings - balanced posting set
 * @param {import('mongoose').Types.ObjectId|null} tradeId - trade that generated these postings (null for genesis)
 * @param {import('mongoose').ClientSession} session - ACTIVE session, owned by the caller
 * @returns {Promise<Array>} the inserted LedgerEntry documents (for logging/orchestration)
 * @throws {LedgerError} 500 if postings are unbalanced (before any write); 500 if no session
 */
async function postEntries(postings, tradeId, session) {
  // 1. Reject unbalanced sets BEFORE any write (LEDG-03 defense in depth).
  assertBalanced(postings);

  // 2. A session is mandatory — this module never opens its own.
  if (!session) {
    throw new LedgerError('postEntries requires an active session', 500, { tradeId });
  }

  const entries = [];

  // 3. Insert one immutable LedgerEntry per posting (in-session via new Doc().save).
  for (const posting of postings) {
    const entry = new LedgerEntry({
      tradeId: tradeId || null,
      accountKey: posting.accountKey,
      delta: posting.delta,
      unit: posting.unit,
      note: null,
    });
    await entry.save({ session });
    entries.push(entry);
  }

  // 4. $inc-upsert each LedgerAccount projection (session inside options → joins txn).
  for (const posting of postings) {
    await LedgerAccount.findOneAndUpdate(
      { accountKey: posting.accountKey },
      { $inc: { balance: posting.delta }, $setOnInsert: { unit: posting.unit } },
      { upsert: true, new: true, session }
    );
  }

  return entries;
}

module.exports = { postEntries };
