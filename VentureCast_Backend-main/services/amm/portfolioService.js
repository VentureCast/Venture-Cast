'use strict';

/**
 * services/amm/portfolioService.js
 *
 * Read-only portfolio aggregation for the JWT-authenticated user.
 * Aggregates user_pos:<uid>:<marketId> ledger accounts into a positions list
 * and reads user_cash:<uid> for the cash balance.
 *
 * ALL reads use .lean() — no Mongoose documents are returned (IDOR-safe:
 * userId is always req.userId from the JWT, never a URL param).
 */

const LedgerAccount = require('../../models/LedgerAccount');
const Market = require('../../models/Market');
const MarketState = require('../../models/MarketState');
const { priceCents } = require('./pricing/curve');

/**
 * Aggregate a user's portfolio from the ledger.
 *
 * @param {string} userId - ObjectId string sourced from req.userId (JWT). Never from request body.
 * @returns {Promise<{
 *   cashCents: number,
 *   positions: Array<{
 *     marketId: string,
 *     streamerId: string,
 *     positionQty: number,
 *     priceCents: number,
 *     valueCents: number,
 *   }>,
 *   totalValueCents: number,
 * }>}
 */
async function getPortfolio(userId) {
  // 1. Find all position ledger accounts for this user (user_pos:<uid>:*).
  //    userId is a 24-hex string enforced by authenticateToken (JWT claim), so the
  //    prefix is always a fixed literal — no regex needed. Use a $gt/$lt range query
  //    on the accountKey index instead of a regex to avoid any ReDoS surface.
  //    Prefix: "user_pos:<uid>:"  →  keys in range [prefix, prefix + '￿')
  const prefix = `user_pos:${userId}:`;
  const posAccts = await LedgerAccount.find({
    accountKey: { $gte: prefix, $lt: prefix + '￿' },
  }).lean();

  // 2. Filter out zero-balance positions (nothing to show)
  const nonZeroPos = posAccts.filter(a => a.balance > 0);

  // 3. Collect distinct marketIds from the account keys
  const marketIds = nonZeroPos.map(a => a.accountKey.split(':')[2]);

  let positions = [];

  if (marketIds.length > 0) {
    // 4. Batch-fetch Markets and MarketStates to avoid N+1
    const [markets, marketStates] = await Promise.all([
      Market.find({ _id: { $in: marketIds } }).lean(),
      MarketState.find({ marketId: { $in: marketIds } }).lean(),
    ]);

    const marketMap = {};
    for (const m of markets) {
      marketMap[m._id.toString()] = m;
    }
    const stateMap = {};
    for (const st of marketStates) {
      stateMap[st.marketId.toString()] = st;
    }

    // 5. Build position rows
    positions = nonZeroPos.map(acct => {
      const marketId = acct.accountKey.split(':')[2];
      const m = marketMap[marketId];
      const st = stateMap[marketId];

      const positionQty = acct.balance;
      let currentPriceCents = 0;
      let valueCents = 0;

      if (m && st) {
        const curveParams = { P0_cents: m.P0_cents, k_num: m.k_num, k_den: m.k_den };
        currentPriceCents = priceCents(st.supply, curveParams);
        valueCents = positionQty * currentPriceCents;
      }

      return {
        marketId,
        streamerId: m ? m.streamerId.toString() : null,
        positionQty,
        priceCents: currentPriceCents,
        valueCents,
      };
    });
  }

  // 6. Read cash balance
  const cashAcct = await LedgerAccount.findOne({
    accountKey: `user_cash:${userId}`,
  }).lean();
  const cashCents = cashAcct ? cashAcct.balance : 0;

  // 7. Total value = cash + sum of position values
  const positionValueCents = positions.reduce((acc, p) => acc + p.valueCents, 0);
  const totalValueCents = cashCents + positionValueCents;

  return { cashCents, positions, totalValueCents };
}

module.exports = { getPortfolio };
