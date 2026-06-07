'use strict';

const Market = require('../models/Market');
const MarketState = require('../models/MarketState');
const LedgerAccount = require('../models/LedgerAccount');
const { priceCents } = require('../services/amm/pricing/curve');
const { getQuote } = require('../services/amm/quoteService');
const portfolioService = require('../services/amm/portfolioService');
const { executeOrder } = require('../services/amm/execution/orchestrator');
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
 * Returns one market's config and its current MarketState.
 * Returns 404 if market not found; 400 if :id is invalid (handled by Joi validate).
 *
 * Response: { market, marketState }
 */
async function getMarket(req, res) {
  try {
    const m = await Market.findById(req.params.id).lean();
    if (!m) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const st = await MarketState.findOne({ marketId: m._id }).lean();

    return res.json({ market: m, marketState: st });
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

module.exports = {
  listMarkets,
  getMarket,
  postQuote,
  postOrder,
  getPortfolio,
};
