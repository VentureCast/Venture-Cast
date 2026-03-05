const { TradeError, executeBuy, executeSell, getPortfolio, getShareInfo, getTradeHistory } = require('../services/tradeService');
const logger = require('../utils/logger');

async function buyShares(req, res) {
  try {
    const { streamerId, shareCount, maxPrice } = req.body;
    const result = await executeBuy(req.userId, streamerId, shareCount, maxPrice);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof TradeError) {
      return res.status(error.statusCode).json({ error: error.message, ...error.details });
    }
    logger.error('Buy trade error:', error);
    res.status(500).json({ error: 'Failed to execute buy order' });
  }
}

async function sellShares(req, res) {
  try {
    const { streamerId, shareCount, minPrice } = req.body;
    const result = await executeSell(req.userId, streamerId, shareCount, minPrice);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof TradeError) {
      return res.status(error.statusCode).json({ error: error.message, ...error.details });
    }
    logger.error('Sell trade error:', error);
    res.status(500).json({ error: 'Failed to execute sell order' });
  }
}

async function getUserPortfolio(req, res) {
  try {
    const result = await getPortfolio(req.params.userId);
    res.json(result);
  } catch (error) {
    if (error instanceof TradeError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logger.error('Portfolio fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
}

async function getShareInformation(req, res) {
  try {
    const result = await getShareInfo(req.params.streamerId);
    res.json(result);
  } catch (error) {
    if (error instanceof TradeError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logger.error('Share fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch share information' });
  }
}

async function getUserTradeHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const result = await getTradeHistory(req.params.userId, limit, offset);
    res.json(result);
  } catch (error) {
    if (error instanceof TradeError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logger.error('Trade history error:', error);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
}

module.exports = {
  buyShares,
  sellShares,
  getUserPortfolio,
  getShareInformation,
  getUserTradeHistory,
};
