const mongoose = require('mongoose');
const User = require('../models/User');
const Share = require('../models/Shares');
const Transaction = require('../models/Transaction');
const Streamer = require('../models/streamer');

class TradeError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Execute a buy order for shares of a streamer.
 * Runs inside a Mongoose transaction for atomicity.
 *
 * @param {string} userId
 * @param {string} streamerId
 * @param {number} shareCount
 * @param {number|null} maxPrice - Optional limit price
 * @returns {Object} { transaction, portfolio, user }
 */
async function executeBuy(userId, streamerId, shareCount, maxPrice) {
  if (!streamerId || !shareCount || shareCount <= 0) {
    throw new TradeError('Invalid streamerId or shareCount', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new TradeError('User not found', 404);
    }

    if (user.kycVerificationStatus !== 'verified') {
      throw new TradeError('KYC verification required', 403, {
        message: 'Please complete identity verification to trade shares',
      });
    }

    let shareRecord = await Share.findOne({ streamerId }).session(session);

    if (!shareRecord) {
      const streamer = await Streamer.findById(streamerId).session(session);
      if (!streamer) {
        throw new TradeError('Streamer not found', 404);
      }

      shareRecord = new Share({
        streamerId,
        sharePrice: 10.0,
        totalShares: 1000000,
      });
      await shareRecord.save({ session });
    }

    const currentPrice = shareRecord.sharePrice;

    if (maxPrice && currentPrice > maxPrice) {
      throw new TradeError('Price limit exceeded', 400, { currentPrice, maxPrice });
    }

    const totalCost = Math.round(currentPrice * shareCount * 100);
    const availableBalance = user.treasuryBalance?.available || 0;

    if (availableBalance < totalCost) {
      throw new TradeError('Insufficient funds', 400, {
        required: totalCost,
        available: availableBalance,
      });
    }

    // Deduct balance
    user.treasuryBalance.available -= totalCost;

    // Update or add to portfolio
    const existingHolding = user.portfolio.find(
      (p) => p.streamerId.toString() === streamerId
    );

    if (existingHolding) {
      const totalOldValue = existingHolding.averageCost * existingHolding.sharesOwned;
      const totalNewValue = currentPrice * shareCount;
      const newTotalShares = existingHolding.sharesOwned + shareCount;

      existingHolding.averageCost = (totalOldValue + totalNewValue) / newTotalShares;
      existingHolding.sharesOwned = newTotalShares;
    } else {
      user.portfolio.push({
        streamerId,
        sharesOwned: shareCount,
        averageCost: currentPrice,
      });
    }

    await user.save({ session });

    const transaction = new Transaction({
      userId,
      type: 'BUY',
      streamerId,
      shareCount,
      sharePrice: currentPrice,
      amount: totalCost,
      status: 'completed',
      description: `BUY ${shareCount} shares at $${currentPrice.toFixed(2)}`,
    });
    await transaction.save({ session });

    // Update share price based on demand
    const percentageTraded = (shareCount / shareRecord.totalShares) * 100;
    const priceIncrease = 1 + percentageTraded * 0.001;
    shareRecord.sharePrice = shareRecord.sharePrice * priceIncrease;
    await shareRecord.save({ session });

    await session.commitTransaction();

    return {
      transaction: {
        id: transaction._id,
        type: 'BUY',
        shareCount,
        pricePerShare: currentPrice,
        totalCost: totalCost / 100,
        newBalance: user.treasuryBalance.available / 100,
        createdAt: transaction.createdAt,
      },
      portfolio: {
        streamerId,
        sharesOwned: existingHolding ? existingHolding.sharesOwned : shareCount,
        averageCost: existingHolding ? existingHolding.averageCost : currentPrice,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Execute a sell order for shares of a streamer.
 * Runs inside a Mongoose transaction for atomicity.
 *
 * @param {string} userId
 * @param {string} streamerId
 * @param {number} shareCount
 * @param {number|null} minPrice - Optional minimum price
 * @returns {Object} { transaction, portfolio }
 */
async function executeSell(userId, streamerId, shareCount, minPrice) {
  if (!streamerId || !shareCount || shareCount <= 0) {
    throw new TradeError('Invalid streamerId or shareCount', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new TradeError('User not found', 404);
    }

    const holding = user.portfolio.find(
      (p) => p.streamerId.toString() === streamerId
    );

    if (!holding || holding.sharesOwned < shareCount) {
      throw new TradeError('Insufficient shares', 400, {
        owned: holding ? holding.sharesOwned : 0,
        requested: shareCount,
      });
    }

    const shareRecord = await Share.findOne({ streamerId }).session(session);
    if (!shareRecord) {
      throw new TradeError('Share record not found', 404);
    }

    const currentPrice = shareRecord.sharePrice;

    if (minPrice && currentPrice < minPrice) {
      throw new TradeError('Price below minimum', 400, { currentPrice, minPrice });
    }

    const totalProceeds = Math.round(currentPrice * shareCount * 100);

    // Add to balance
    user.treasuryBalance.available += totalProceeds;

    // Update portfolio
    holding.sharesOwned -= shareCount;

    if (holding.sharesOwned === 0) {
      user.portfolio = user.portfolio.filter(
        (p) => p.streamerId.toString() !== streamerId
      );
    }

    await user.save({ session });

    const transaction = new Transaction({
      userId,
      type: 'SELL',
      streamerId,
      shareCount,
      sharePrice: currentPrice,
      amount: totalProceeds,
      status: 'completed',
      description: `SELL ${shareCount} shares at $${currentPrice.toFixed(2)}`,
    });
    await transaction.save({ session });

    // Update share price based on supply
    const percentageTraded = (shareCount / shareRecord.totalShares) * 100;
    const priceDecrease = 1 - percentageTraded * 0.001;
    shareRecord.sharePrice = Math.max(0.01, shareRecord.sharePrice * priceDecrease);
    await shareRecord.save({ session });

    await session.commitTransaction();

    return {
      transaction: {
        id: transaction._id,
        type: 'SELL',
        shareCount,
        pricePerShare: currentPrice,
        totalProceeds: totalProceeds / 100,
        newBalance: user.treasuryBalance.available / 100,
        createdAt: transaction.createdAt,
      },
      portfolio: {
        streamerId,
        sharesOwned: holding.sharesOwned,
        averageCost: holding.averageCost,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get a user's portfolio enriched with current prices and gain/loss.
 *
 * @param {string} userId
 * @returns {Object} { portfolio, summary }
 */
async function getPortfolio(userId) {
  const user = await User.findById(userId)
    .populate('portfolio.streamerId', 'name platform subscriberCount')
    .select('portfolio treasuryBalance')
    .lean();

  if (!user) {
    throw new TradeError('User not found', 404);
  }

  // Batch query — fixes N+1 (was 1 query per holding)
  const streamerIds = user.portfolio.map(h => h.streamerId._id);
  const shares = await Share.find({ streamerId: { $in: streamerIds } }).lean();
  const shareMap = Object.fromEntries(shares.map(s => [s.streamerId.toString(), s]));

  const enrichedPortfolio = user.portfolio.map((holding) => {
    const shareRecord = shareMap[holding.streamerId._id.toString()];
    const currentPrice = shareRecord ? shareRecord.sharePrice : 0;
    const currentValue = currentPrice * holding.sharesOwned;
    const totalCost = holding.averageCost * holding.sharesOwned;
    const gainLoss = currentValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    return {
      streamer: holding.streamerId,
      sharesOwned: holding.sharesOwned,
      averageCost: holding.averageCost,
      currentPrice,
      currentValue,
      totalCost,
      gainLoss,
      gainLossPercent: gainLossPercent.toFixed(2),
    };
  });

  const totalValue = enrichedPortfolio.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = enrichedPortfolio.reduce((sum, h) => sum + h.totalCost, 0);
  const totalGainLoss = totalValue - totalCost;

  return {
    portfolio: enrichedPortfolio,
    summary: {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent: totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : 0,
      cashBalance: (user.treasuryBalance?.available || 0) / 100,
      totalAccountValue: totalValue + (user.treasuryBalance?.available || 0) / 100,
    },
  };
}

/**
 * Get share information for a specific streamer.
 *
 * @param {string} streamerId
 * @returns {Object} Share data with price history
 */
async function getShareInfo(streamerId) {
  const shareRecord = await Share.findOne({ streamerId }).lean();

  if (!shareRecord) {
    const streamer = await Streamer.findById(streamerId);
    if (!streamer) {
      throw new TradeError('Streamer not found', 404);
    }

    return {
      streamerId,
      sharePrice: 10.0,
      totalShares: 1000000,
      marketCap: 10000000,
      exists: false,
    };
  }

  return {
    streamerId: shareRecord.streamerId,
    sharePrice: shareRecord.sharePrice,
    totalShares: shareRecord.totalShares,
    marketCap: shareRecord.marketCap,
    priceHistory: {
      day1: shareRecord.day1Price,
      day2: shareRecord.day2Price,
      day3: shareRecord.day3Price,
      day4: shareRecord.day4Price,
      day5: shareRecord.day5Price,
      day6: shareRecord.day6Price,
      day7: shareRecord.day7Price,
    },
    exists: true,
    updatedAt: shareRecord.updatedAt,
  };
}

/**
 * Get paginated trade history for a user.
 *
 * @param {string} userId
 * @param {number} limit
 * @param {number} offset
 * @returns {Object} { transactions, pagination }
 */
async function getTradeHistory(userId, limit = 50, offset = 0) {
  const [transactions, total] = await Promise.all([
    Transaction.find({
      userId,
      type: { $in: ['BUY', 'SELL'] },
    })
      .populate('streamerId', 'name platform')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset),
    Transaction.countDocuments({
      userId,
      type: { $in: ['BUY', 'SELL'] },
    }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      id: t._id,
      type: t.type,
      streamer: t.streamerId,
      shareCount: t.shareCount,
      sharePrice: t.sharePrice,
      amount: t.amount / 100,
      status: t.status,
      createdAt: t.createdAt,
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

module.exports = {
  TradeError,
  executeBuy,
  executeSell,
  getPortfolio,
  getShareInfo,
  getTradeHistory,
};
