'use strict';

const Market = require('../models/Market');
const MarketState = require('../models/MarketState');
const LedgerAccount = require('../models/LedgerAccount');
const LedgerEntry = require('../models/LedgerEntry');
const RiskEvent = require('../models/RiskEvent');
const AdminAction = require('../models/AdminAction');
const { priceCents } = require('../services/amm/pricing/curve');
const { getQuote } = require('../services/amm/quoteService');
const portfolioService = require('../services/amm/portfolioService');
const { executeOrder } = require('../services/amm/execution/orchestrator');
const { openMarket } = require('../services/amm/genesisService');
const logger = require('../utils/logger');

/**
 * GET /markets
 * Lists all markets with current supply, computed price, and reserve.
 * Accessible without authentication (optionalAuth).
 *
 * Response: Array of {
 *   marketId, streamerId, tier, status,
 *   supply, priceCents, reserveCents
 * }
 */
async function listMarkets(req, res) {
  try {
    const markets = await Market.find().lean();

    if (markets.length === 0) {
      return res.json([]);
    }

    // Avoid N+1: fetch all states in one query, build a map by marketId
    const marketIds = markets.map(m => m._id);
    const states = await MarketState.find({ marketId: { $in: marketIds } }).lean();
    const stateMap = {};
    for (const st of states) {
      stateMap[st.marketId.toString()] = st;
    }

    const items = markets.map(m => {
      const st = stateMap[m._id.toString()] || {};
      return {
        marketId: m._id,
        streamerId: m.streamerId,
        tier: m.tier,
        status: m.status,
        supply: st.supply != null ? st.supply : 0,
        priceCents: priceCents(st.supply != null ? st.supply : 0, {
          P0_cents: m.P0_cents,
          k_num: m.k_num,
          k_den: m.k_den,
        }),
        reserveCents: st.reserveCents != null ? st.reserveCents : 0,
      };
    });

    return res.json(items);
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, ...err.details });
    }
    logger.error('listMarkets error:', err);
    return res.status(500).json({ error: 'Failed to list markets' });
  }
}

/**
 * GET /markets/:id
 * Returns one market's PUBLIC config + current price/supply/reserve.
 * Returns 404 if market not found; 400 if :id is invalid (handled by Joi validate).
 *
 * Curated DTO (codex audit #7): the public curve/fee params are exposed (clients need
 * them to understand pricing), but internal-only fields — reserveFloorCents (risk floor)
 * and the optimistic-lock version — are NOT leaked to unauthenticated callers.
 */
async function getMarket(req, res) {
  try {
    const m = await Market.findById(req.params.id).lean();
    if (!m) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const st = await MarketState.findOne({ marketId: m._id }).lean();
    const supply = st && st.supply != null ? st.supply : 0;

    return res.json({
      marketId: m._id,
      streamerId: m.streamerId,
      tier: m.tier,
      status: m.status,
      supply,
      priceCents: priceCents(supply, { P0_cents: m.P0_cents, k_num: m.k_num, k_den: m.k_den }),
      reserveCents: st && st.reserveCents != null ? st.reserveCents : 0,
      // Public curve + fee params (needed to compute/understand quotes):
      P0_cents: m.P0_cents,
      k_num: m.k_num,
      k_den: m.k_den,
      spreadBps: m.spreadBps,
      feeBps: m.feeBps,
    });
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, ...err.details });
    }
    logger.error('getMarket error:', err);
    return res.status(500).json({ error: 'Failed to fetch market' });
  }
}

/**
 * POST /quotes
 * Stateless priced quote via quoteService.getQuote().
 * Returns the full quote shape; persists nothing.
 *
 * Auth: authenticateToken (JWT required).
 */
async function postQuote(req, res) {
  try {
    const quote = await getQuote(req.body);
    return res.json(quote);
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, ...err.details });
    }
    logger.error('postQuote error:', err);
    return res.status(500).json({ error: 'Failed to compute quote' });
  }
}

/**
 * POST /orders
 * Atomic order execution via executeOrder() (Phase 4 orchestrator).
 * userId is sourced ONLY from req.userId (the JWT claim) — never from req.body.
 * Returns { trade, balances: { cashCents, positionQty }, replayed }.
 *
 * Auth: authenticateToken (JWT required).
 */
async function postOrder(req, res) {
  try {
    // SECURITY: userId from JWT only — never trust req.body.userId
    const params = { ...req.body, userId: req.userId };

    const result = await executeOrder(params);

    const { marketId } = req.body;
    const uid = req.userId;

    // Read post-trade balances from ledger accounts (read-only, .lean())
    const [cashAcct, posAcct] = await Promise.all([
      LedgerAccount.findOne({ accountKey: `user_cash:${uid}` }).lean(),
      LedgerAccount.findOne({ accountKey: `user_pos:${uid}:${marketId}` }).lean(),
    ]);

    const cashCents = cashAcct ? cashAcct.balance : 0;
    const positionQty = posAcct ? posAcct.balance : 0;

    return res.json({
      trade: result.trade,
      balances: { cashCents, positionQty },
      replayed: !!result.replayed,
    });
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, ...err.details });
    }
    logger.error('postOrder error:', err);
    return res.status(500).json({ error: 'Failed to execute order' });
  }
}

/**
 * GET /portfolio
 * IDOR-safe portfolio aggregation.
 * userId sourced ONLY from req.userId (JWT). NO :userId param route.
 *
 * Auth: authenticateToken (JWT required).
 */
async function getPortfolio(req, res) {
  try {
    const result = await portfolioService.getPortfolio(req.userId);
    return res.json(result);
  } catch (err) {
    logger.error('getPortfolio error:', err);
    return res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
}

// ============================================================
// Admin handlers (API-05)
// Every handler assumes authenticateToken + requireAdmin ran first.
// ============================================================

/**
 * POST /admin/markets
 * Opens a new creator market via genesisService.openMarket().
 * Writes an AdminAction audit record with action='create_market'.
 *
 * Auth: authenticateToken + requireAdmin
 */
async function adminCreateMarket(req, res) {
  try {
    const { market, marketState } = await openMarket(req.body);

    await AdminAction.create({
      adminId: req.userId,
      action: 'create_market',
      target: market._id.toString(),
      before: null,
      after: { tier: market.tier },
    });

    return res.status(201).json({ market, marketState });
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, ...err.details });
    }
    logger.error('adminCreateMarket error:', err);
    return res.status(500).json({ error: 'Failed to create market' });
  }
}

/**
 * PATCH /admin/markets/:id
 * Updates status, tier, spreadBps, and/or feeBps of an existing market.
 * Writes an AdminAction audit record capturing before/after state.
 *
 * Auth: authenticateToken + requireAdmin
 */
async function adminPatchMarket(req, res) {
  try {
    const m = await Market.findById(req.params.id);
    if (!m) {
      return res.status(404).json({ error: 'market not found' });
    }

    const before = {
      status: m.status,
      tier: m.tier,
      spreadBps: m.spreadBps,
      feeBps: m.feeBps,
    };

    // Apply only the provided fields
    if (req.body.status !== undefined) m.status = req.body.status;
    if (req.body.tier !== undefined) m.tier = req.body.tier;
    if (req.body.spreadBps !== undefined) m.spreadBps = req.body.spreadBps;
    if (req.body.feeBps !== undefined) m.feeBps = req.body.feeBps;

    await m.save();

    // Determine action label from the patch intent
    let action;
    if (req.body.status === 'paused') {
      action = 'pause_market';
    } else if (req.body.status === 'active') {
      action = 'resume_market';
    } else {
      action = 'set_tier';
    }

    await AdminAction.create({
      adminId: req.userId,
      action,
      target: m._id.toString(),
      before,
      after: { status: m.status, tier: m.tier },
    });

    return res.json({ market: m });
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message, ...err.details });
    }
    logger.error('adminPatchMarket error:', err);
    return res.status(500).json({ error: 'Failed to patch market' });
  }
}

/**
 * GET /admin/risk-events
 * Lists RiskEvent records, newest first.
 * Accepts optional ?limit= query param (default 50, max 200).
 *
 * Auth: authenticateToken + requireAdmin
 */
async function adminListRiskEvents(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const events = await RiskEvent.find().sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ events });
  } catch (err) {
    logger.error('adminListRiskEvents error:', err);
    return res.status(500).json({ error: 'Failed to list risk events' });
  }
}

/**
 * GET /admin/ledger/reconcile
 * Verifies double-entry integrity:
 *   1. For every LedgerAccount, asserts balance == Σ LedgerEntry.delta for that accountKey.
 *   2. Asserts global Σ delta (across all entries) == 0.
 *
 * Returns { balanced, totalCents, mismatches } where:
 *   balanced = totalCents===0 && mismatches.length===0
 *   totalCents = Σ all LedgerEntry.delta (must be 0 for a healthy ledger)
 *   mismatches = [{accountKey, projection, entriesSum}] for any account where they differ
 *
 * Auth: authenticateToken + requireAdmin
 */
async function adminReconcile(req, res) {
  try {
    // Sum all LedgerEntry.delta values, grouped by accountKey
    const entries = await LedgerEntry.find().lean();
    const expected = {};
    let totalCents = 0;
    for (const e of entries) {
      expected[e.accountKey] = (expected[e.accountKey] || 0) + e.delta;
      totalCents += e.delta;
    }

    // Compare each LedgerAccount projection against the summed entries
    const accounts = await LedgerAccount.find().lean();
    const mismatches = [];
    for (const acct of accounts) {
      const entriesSum = expected[acct.accountKey] || 0;
      const ok = acct.balance === entriesSum;
      if (!ok) {
        mismatches.push({
          accountKey: acct.accountKey,
          projection: acct.balance,
          entriesSum,
        });
      }
    }

    const balanced = totalCents === 0 && mismatches.length === 0;

    return res.json({ balanced, totalCents, mismatches });
  } catch (err) {
    logger.error('adminReconcile error:', err);
    return res.status(500).json({ error: 'Failed to reconcile ledger' });
  }
}

module.exports = {
  listMarkets,
  getMarket,
  postQuote,
  postOrder,
  getPortfolio,
  adminCreateMarket,
  adminPatchMarket,
  adminListRiskEvents,
  adminReconcile,
};
