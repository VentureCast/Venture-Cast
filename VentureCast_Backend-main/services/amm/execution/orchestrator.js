'use strict';

/**
 * services/amm/execution/orchestrator.js — the keystone money path (EXEC-01..04).
 *
 * executeOrder() composes the pure pricing (Phase 2), ledger (Phase 3), and risk
 * (Phase 3) engines behind ONE Mongoose transaction — mirroring the genesisService
 * pattern exactly (startSession → withTransaction → endSession in finally).
 *
 * Guarantees:
 *   EXEC-01 atomicity   — MarketState update + every LedgerEntry + LedgerAccount projection
 *                         + Trade + Order commit together; any throw aborts with zero partial writes.
 *   EXEC-02 versioning  — optimistic read MarketState.version V, write
 *                         updateOne({_id, version:V}, {$set, $inc:{version:1}}); matchedCount===0
 *                         → VersionConflictError → abort + retry the whole loop (max 3, jittered).
 *   EXEC-03 idempotency — pre-check Order by idempotencyKey (return original Trade if filled);
 *                         catch the E11000 from a concurrent same-key insert and return the original.
 *   EXEC-04 expiry/slip — expired quote rejected (409 before the loop); slippage enforced against
 *                         the RE-PRICED trade inside the txn (buy total > maxCost / sell net < minReceived).
 *
 * Risk rejections (non-retryable) are recorded durably: the riskEventDraft is stashed, the txn
 * aborts (rolling back the trade), then `new RiskEvent(draft).save()` is written OUTSIDE the
 * aborted txn (after the loop, before rethrow) so the rejection persists even though the trade did not.
 *
 * This module adds NO HTTP routes (Phase 5) and does NOT touch the legacy tradeService.js path.
 */

const mongoose = require('mongoose');

const MarketState = require('../../../models/MarketState');
const Market = require('../../../models/Market');
const Order = require('../../../models/Order');
const Trade = require('../../../models/Trade');
const RiskEvent = require('../../../models/RiskEvent');
const LedgerAccount = require('../../../models/LedgerAccount');

const { buildBuyPostings, buildSellPostings, postEntries } = require('../ledger');
const risk = require('../risk');
const { riskConfigForTier } = require('../config');
const { priceTrade } = require('./priceTrade');
const { ExecutionError } = require('./errors');
const logger = require('../../../utils/logger');

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 5;

/**
 * Internal-only retry signal. NOT exported. Thrown when the optimistic
 * MarketState.updateOne matches zero docs (another writer bumped the version).
 */
class VersionConflictError extends Error {
  constructor(details = {}) {
    super('MarketState version conflict');
    this.name = 'VersionConflictError';
    this.details = details;
  }
}

/** Jittered exponential backoff sleep (runtime code — Date/Math.random allowed). */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Start-of-day (local) Date for the daily-volume window. */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True if a Mongoose/Mongo error is a duplicate-key (E11000) error. */
function isDuplicateKeyError(err) {
  return err && (err.code === 11000 || err.code === 11001 ||
    (err.name === 'MongoServerError' && err.message && err.message.includes('E11000')));
}

/**
 * Load the original filled Trade for an Order looked up by idempotencyKey.
 * Returns the success shape, or null if the order/trade is not (yet) resolvable.
 */
async function loadOriginalResult(idempotencyKey) {
  const existing = await Order.findOne({ idempotencyKey });
  if (!existing || existing.status !== 'filled') return null;
  const trade = await Trade.findOne({ orderId: existing._id });
  if (!trade) return null;
  return { trade, order: existing, replayed: true };
}

/**
 * Scope an idempotency replay to the request IDENTITY (user/market/side). A key reused
 * with a different user/market/side must NOT silently replay the original trade — that
 * would let a reused (or guessed) key leak or replay an unrelated order. Reject instead.
 *
 * SCOPE NOTE (Phase 5 follow-up): this enforces identity, which closes the security-
 * relevant cross-user/market/side leak. Stripe-style STRICT idempotency — also rejecting a
 * same-identity key reused with a different qty/cashCents/slippage — requires persisting a
 * full request fingerprint on the Order (which currently stores side/qty/maxCost/minReceived
 * but not cashCents). That fingerprint is deferred to Phase 5, where the API request schema
 * is finalized, to avoid widening the Phase-1 Order schema here.
 */
function assertReplayMatches(order, { userId, marketId, side }) {
  if (String(order.userId) !== String(userId) ||
      String(order.marketId) !== String(marketId) ||
      order.side !== side) {
    throw new ExecutionError('idempotencyKey reused with different parameters', 409, {
      idempotencyKey: order.idempotencyKey,
    });
  }
}

/**
 * Execute a buy or sell order atomically.
 *
 * @param {Object} params
 * @param {string} params.userId           - ObjectId string of the user
 * @param {string} params.marketId         - ObjectId string of the market
 * @param {'buy'|'sell'} params.side
 * @param {number} [params.qty]            - integer share qty (required for sell; buy may use cashCents)
 * @param {number} [params.cashCents]      - integer cents budget for a cash-denominated buy
 * @param {string} params.idempotencyKey   - client idempotency key (unique per logical order)
 * @param {number} [params.maxCostCents]   - buy slippage ceiling (reject if total > this)
 * @param {number} [params.minReceivedCents] - sell slippage floor (reject if net < this)
 * @param {Date|string} [params.quoteExpiresAt] - quote hard expiry
 * @returns {Promise<{ trade: Object, order: Object, marketState?: Object, replayed?: boolean }>}
 * @throws {ExecutionError} 400 invalid input · 409 expiry/slippage/version-exhausted
 * @throws {RiskError} on a risk rejection (the RiskEvent is persisted before the throw)
 */
async function executeOrder(params) {
  const {
    userId,
    marketId,
    side,
    qty,
    cashCents,
    idempotencyKey,
    maxCostCents,
    minReceivedCents,
    quoteExpiresAt,
  } = params || {};

  if (!userId || !marketId) {
    throw new ExecutionError('userId and marketId are required', 400, { userId, marketId });
  }
  if (side !== 'buy' && side !== 'sell') {
    throw new ExecutionError("side must be 'buy' or 'sell'", 400, { side });
  }
  if (!idempotencyKey) {
    throw new ExecutionError('idempotencyKey is required', 400, {});
  }

  // 1. IDEMPOTENCY pre-check (EXEC-03) — return the original Trade, never re-execute.
  //    Replay is scoped to request identity (user/market/side) so a reused/guessed key
  //    cannot replay an unrelated order.
  const replay = await loadOriginalResult(idempotencyKey);
  if (replay) {
    assertReplayMatches(replay.order, { userId, marketId, side });
    return replay;
  }

  // 2. QUOTE EXPIRY (EXEC-04) — fast pre-loop check (also re-checked fresh per attempt below,
  //    so retry backoff cannot let a just-expired quote slip through).
  if (quoteExpiresAt && new Date() > new Date(quoteExpiresAt)) {
    throw new ExecutionError('quote expired', 409, { quoteExpiresAt });
  }

  // 3. Existence check only — the authoritative Market read happens FRESH inside the txn
  //    each attempt (so a pause / tier / curve-param change racing the order is honored).
  const market = await Market.findById(marketId);
  if (!market) {
    throw new ExecutionError('market not found', 404, { marketId });
  }

  const uid = String(userId);
  const mid = String(marketId);

  // 4. BOUNDED RETRY LOOP (EXEC-02).
  let riskEventDraft = null; // stashed on a risk rejection; persisted after the aborted txn.

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const session = await mongoose.startSession();
    let savedTrade;
    let savedOrder;
    let savedMarketState;
    riskEventDraft = null;

    try {
      await session.withTransaction(async () => {
        // a. Re-read MarketState FRESH in-session and capture the optimistic version V.
        const ms = await MarketState.findOne({ marketId: market._id }).session(session);
        if (!ms) {
          throw new ExecutionError('market state not found', 404, { marketId: mid });
        }
        const V = ms.version;

        // a2. Re-read Market FRESH in-session so a pause / tier / curve-param change racing
        //     the order is honored, and re-check expiry per attempt so retry backoff cannot
        //     let a just-expired quote fill.
        const liveMarket = await Market.findById(market._id).session(session);
        if (!liveMarket) {
          throw new ExecutionError('market not found', 404, { marketId: mid });
        }
        const liveTierConfig = riskConfigForTier(liveMarket.tier);
        if (quoteExpiresAt && new Date() > new Date(quoteExpiresAt)) {
          throw new ExecutionError('quote expired', 409, { quoteExpiresAt });
        }

        // b. Re-price against the fresh state + fresh market params.
        const priced = priceTrade(liveMarket, ms, side, side === 'sell' ? { qty } : (qty != null ? { qty } : { cashCents }));

        // c. SLIPPAGE (EXEC-04) — against the RE-PRICED trade. NON-retryable (rethrown).
        if (side === 'buy' && maxCostCents != null && priced.totalCents > maxCostCents) {
          throw new ExecutionError('slippage: buy cost exceeds maxCost', 409, {
            totalCents: priced.totalCents, maxCostCents,
          });
        }
        if (side === 'sell' && minReceivedCents != null && priced.netCents < minReceivedCents) {
          throw new ExecutionError('slippage: sell proceeds below minReceived', 409, {
            netCents: priced.netCents, minReceivedCents,
          });
        }

        // d. RISK — build a snapshot from in-session reads, then evaluate (pure).
        const posAcct = await LedgerAccount.findOne({ accountKey: `user_pos:${uid}:${mid}` }).session(session);
        const userPositionQty = posAcct ? posAcct.balance : 0;

        // d0. INVENTORY GUARD (critical): a user can never sell more shares than they own.
        //     Without this a 0-share account could sell up to the market supply, get paid,
        //     drive user_pos negative, and drain the reserve (naked short). NON-retryable.
        if (side === 'sell' && priced.deltaQty > userPositionQty) {
          throw new ExecutionError('insufficient shares to sell', 409, {
            requested: priced.deltaQty, owned: userPositionQty,
          });
        }

        const todaysTrades = await Trade.find({
          userId,
          createdAt: { $gte: startOfToday() },
        }).session(session);
        const userDailyVolumeCents = todaysTrades.reduce((acc, t) => acc + t.grossCents, 0);

        const snapshot = {
          reserveCents: ms.reserveCents,
          reserveFloorCents: ms.reserveFloorCents,
          userPositionQty,
          userDailyVolumeCents,
          marketStatus: liveMarket.status,
          recentRefPriceCents: ms.lastPriceCents,
          newPriceCents: priced.endPriceCents,
        };

        const verdict = risk.evaluate(
          {
            side,
            grossCents: priced.grossCents,
            spreadCents: priced.spreadCents,
            deltaQty: priced.deltaQty,
            marketId: mid,
            userId: uid,
          },
          snapshot,
          liveTierConfig
        );
        if (!verdict.allowed) {
          // Stash the draft so it can be persisted OUTSIDE the aborted txn (durable rejection).
          riskEventDraft = verdict.riskEventDraft;
          throw verdict.riskError; // NON-retryable
        }

        // e. Create the Order first — Trade.orderId requires it. The unique idempotencyKey
        //    serializes concurrent same-key inserts; a duplicate throws E11000 (caught below).
        const order = new Order({
          userId,
          marketId: market._id,
          side,
          qty: priced.deltaQty,
          idempotencyKey,
          status: 'filled',
          minReceived: minReceivedCents != null ? minReceivedCents : null,
          maxCost: maxCostCents != null ? maxCostCents : null,
          expiresAt: quoteExpiresAt ? new Date(quoteExpiresAt) : new Date(Date.now() + 60000),
        });
        await order.save({ session });
        savedOrder = order;

        // f. Create the immutable Trade.
        const trade = new Trade({
          orderId: order._id,
          marketId: market._id,
          userId,
          side,
          qty: priced.deltaQty,
          grossCents: priced.grossCents,
          feeCents: priced.feeCents,
          spreadCents: priced.spreadCents,
          netCents: side === 'buy' ? priced.totalCents : priced.netCents,
          avgPriceCents: priced.avgPriceCents,
          supplyBefore: ms.supply,
          supplyAfter: priced.newSupply,
        });
        await trade.save({ session });
        savedTrade = trade;

        // g. LEDGER — build + post the balanced double-entry set in-session.
        const postings = side === 'buy'
          ? buildBuyPostings({
            userId: uid,
            marketId: mid,
            deltaQty: priced.deltaQty,
            fees: {
              grossCents: priced.grossCents,
              spreadCents: priced.spreadCents,
              feeCents: priced.feeCents,
              totalCents: priced.totalCents,
            },
          })
          : buildSellPostings({
            userId: uid,
            marketId: mid,
            deltaQty: priced.deltaQty,
            fees: {
              grossCents: priced.grossCents,
              spreadCents: priced.spreadCents,
              feeCents: priced.feeCents,
              netCents: priced.netCents,
            },
          });
        await postEntries(postings, trade._id, session);

        // h. OPTIMISTIC VERSION WRITE (EXEC-02) — bypasses pre('save') intentionally.
        const res = await MarketState.updateOne(
          { _id: ms._id, version: V },
          {
            $set: {
              supply: priced.newSupply,
              reserveCents: priced.newReserveCents,
              lastPriceCents: priced.endPriceCents,
            },
            $inc: { version: 1 },
          },
          { session }
        );
        if (res.matchedCount === 0) {
          // Another writer bumped the version → abort + retry the whole loop.
          throw new VersionConflictError({ expectedVersion: V, marketId: mid });
        }

        savedMarketState = {
          supply: priced.newSupply,
          reserveCents: priced.newReserveCents,
          lastPriceCents: priced.endPriceCents,
          version: V + 1,
        };

        // i. PriceCandle upsert: DEFERRED to Phase 6 market-data (not needed for EXEC-01..04).
      });

      // Success → commit landed; return.
      logger.info(
        `executeOrder filled: market=${mid} user=${uid} side=${side} qty=${savedTrade.qty} ` +
        `gross=${savedTrade.grossCents}c attempt=${attempt}`
      );
      return { trade: savedTrade, order: savedOrder, marketState: savedMarketState };
    } catch (err) {
      // EXEC-03 race: a concurrent same-key insert won → return the original Trade
      // (scoped to request identity, same as the pre-check).
      if (isDuplicateKeyError(err)) {
        const original = await loadOriginalResult(idempotencyKey);
        if (original) { assertReplayMatches(original.order, { userId, marketId, side }); return original; }
        // Order exists but the Trade is not yet visible (extreme race) — retry the lookup briefly.
        await sleep(BACKOFF_BASE_MS);
        const retryOriginal = await loadOriginalResult(idempotencyKey);
        if (retryOriginal) { assertReplayMatches(retryOriginal.order, { userId, marketId, side }); return retryOriginal; }
        throw new ExecutionError('duplicate idempotencyKey but original trade not found', 409, { idempotencyKey });
      }

      // EXEC-02 retryable version conflict → backoff + continue the loop.
      if (err instanceof VersionConflictError) {
        if (attempt < MAX_ATTEMPTS) {
          const backoff = BACKOFF_BASE_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * BACKOFF_BASE_MS);
          await sleep(backoff);
          continue;
        }
        throw new ExecutionError('version conflict — max retries exhausted', 409, { attempts: MAX_ATTEMPTS, marketId: mid });
      }

      // Risk rejection: persist the RiskEvent durably OUTSIDE the aborted txn, then rethrow.
      // The trade rolled back, but the rejection MUST be recorded — so we save it on the
      // default connection (no session) after the abort. Non-retryable.
      if (riskEventDraft) {
        await new RiskEvent(riskEventDraft).save();
        throw err;
      }

      // Everything else (slippage, expiry, pricing, validation) is non-retryable → rethrow.
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Unreachable: the loop either returns, retries, or throws on every path.
  throw new ExecutionError('executeOrder fell through retry loop', 500, { marketId: mid });
}

module.exports = { executeOrder, ExecutionError };
