'use strict';

/**
 * genesisService.js — Atomic market genesis for the creator AMM.
 *
 * Opens a new creator market in a single Mongoose transaction:
 *   1. Creates the Market config document.
 *   2. Creates MarketState at s0=0, price=P0, version=0, reserve=floor.
 *   3. Posts two balanced LedgerEntries (platform_funding debit, market_reserve credit).
 *   4. Upserts two LedgerAccount balance projections via $inc.
 *   5. Asserts debit.delta + credit.delta === 0 before committing.
 *
 * If anything fails, the transaction is aborted and no documents persist.
 *
 * Follows the transaction pattern from services/tradeService.js exactly:
 * startSession -> startTransaction -> new Doc().save({session}) -> commit/abort -> endSession.
 */

const mongoose = require('mongoose');
const Market = require('../../models/Market');
const MarketState = require('../../models/MarketState');
const LedgerAccount = require('../../models/LedgerAccount');
const LedgerEntry = require('../../models/LedgerEntry');
const logger = require('../../utils/logger');

// ---------------------------------------------------------------------------
// Error class — mirrors TradeError (statusCode + details)
// ---------------------------------------------------------------------------

class GenesisError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - HTTP status code (400 for validation, 500 for invariant)
   * @param {Object} [details={}]
   */
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'GenesisError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// openMarket()
// ---------------------------------------------------------------------------

/**
 * Open a new creator market atomically.
 * Creates Market, MarketState, and seeds the reserve via a balanced ledger posting.
 *
 * @param {Object} params
 * @param {string} params.streamerId         - ObjectId string of the creator
 * @param {number} [params.P0_cents=100]     - Starting price in integer cents
 * @param {number} [params.k_num=1]          - Bonding curve slope numerator
 * @param {number} [params.k_den=10]         - Bonding curve slope denominator (k = k_num/k_den)
 * @param {string} [params.tier='1']         - Market tier: '1' | '2' | '3'
 * @param {number} [params.spreadBps=50]     - Spread in basis points (e.g. 50 = 0.50%)
 * @param {number} [params.feeBps=100]       - Protocol fee in basis points (e.g. 100 = 1.00%)
 * @param {number} params.reserveFloorCents  - Minimum reserve in integer cents (required, >0, integer)
 * @returns {Promise<{ market: Object, marketState: Object }>}
 * @throws {GenesisError} 400 if reserveFloorCents is invalid
 * @throws {GenesisError} 500 if the double-entry invariant is violated (should never happen)
 */
async function openMarket(params) {
  const {
    streamerId,
    P0_cents = 100,
    k_num = 1,
    k_den = 10,
    tier = '1',
    spreadBps = 50,
    feeBps = 100,
    reserveFloorCents,
  } = params;

  // --- Guard: reserveFloorCents must be a positive integer ---
  // (RESEARCH Pitfall 4: float reserveFloorCents would break the sum-to-zero invariant)
  if (!reserveFloorCents || reserveFloorCents <= 0 || !Number.isInteger(reserveFloorCents)) {
    throw new GenesisError(
      'reserveFloorCents must be a positive integer',
      400,
      { received: reserveFloorCents }
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create the Market config document
    const market = new Market({
      streamerId,
      P0_cents,
      k_num,
      k_den,
      tier,
      status: 'active',
      spreadBps,
      feeBps,
    });
    await market.save({ session });

    // 2. Create MarketState at genesis: s0=0, price=P0, version=0, reserve=floor
    const marketState = new MarketState({
      marketId: market._id,
      supply: 0,
      reserveCents: reserveFloorCents,  // seeded to floor at genesis
      reserveFloorCents,
      lastPriceCents: P0_cents,
      version: 0,
    });
    await marketState.save({ session });

    // 3. Seed reserve: debit platform_funding, credit market_reserve:<marketId>
    //    Both entries together must sum to zero (double-entry invariant).
    const fundingKey = 'platform_funding';
    const reserveKey = `market_reserve:${market._id}`;

    const debitEntry = new LedgerEntry({
      tradeId: null,                       // genesis — not associated with a trade
      accountKey: fundingKey,
      delta: -reserveFloorCents,           // negative: cash leaves platform_funding
      unit: 'cents',
      note: `genesis debit for market ${market._id}`,
    });
    await debitEntry.save({ session });

    const creditEntry = new LedgerEntry({
      tradeId: null,
      accountKey: reserveKey,
      delta: reserveFloorCents,            // positive: cash enters market_reserve
      unit: 'cents',
      note: `genesis credit for market ${market._id}`,
    });
    await creditEntry.save({ session });

    // 4. Upsert LedgerAccount balance projections via $inc
    //    CRITICAL: session must be threaded inside the options object (Mongoose 8 requirement)
    //    so these upserts are included in the transaction and roll back on abort.
    await LedgerAccount.findOneAndUpdate(
      { accountKey: fundingKey },
      {
        $inc: { balance: -reserveFloorCents },
        $setOnInsert: { unit: 'cents' },
      },
      { upsert: true, new: true, session }
    );

    await LedgerAccount.findOneAndUpdate(
      { accountKey: reserveKey },
      {
        $inc: { balance: reserveFloorCents },
        $setOnInsert: { unit: 'cents' },
      },
      { upsert: true, new: true, session }
    );

    // 5. Invariant check: the two genesis entries MUST sum to exactly zero.
    //    This will always pass for a correct integer reserveFloorCents, but
    //    asserting here prevents silent drift if the posting logic is changed.
    const entrySum = debitEntry.delta + creditEntry.delta;
    if (entrySum !== 0) {
      throw new GenesisError(
        'Genesis ledger entries do not sum to zero',
        500,
        { entrySum, debitDelta: debitEntry.delta, creditDelta: creditEntry.delta }
      );
    }

    await session.commitTransaction();

    logger.info(
      `Market genesis complete: marketId=${market._id}, streamerId=${streamerId}, ` +
      `tier=${tier}, floor=${reserveFloorCents} cents`
    );

    return { market, marketState };

  } catch (error) {
    await session.abortTransaction();
    // Re-throw so callers get the original GenesisError or wrapped error
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { GenesisError, openMarket };
