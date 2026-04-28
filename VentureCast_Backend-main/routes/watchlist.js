const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');
const Streamer = require('../models/streamer');
const Share = require('../models/Shares');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// All watchlist routes require authentication
router.use(authenticateToken);

/**
 * GET /watchlist
 * Get the authenticated user's watchlist with streamer details and prices
 */
router.get('/', async (req, res) => {
  try {
    const watchlistItems = await Watchlist.find({ userId: req.userId })
      .sort({ addedAt: -1 })
      .lean();

    if (watchlistItems.length === 0) {
      return res.json({ watchlist: [] });
    }

    const streamerIds = watchlistItems.map(w => w.streamerId);

    // Fetch streamers and shares in parallel
    const [streamers, shares] = await Promise.all([
      Streamer.find({ _id: { $in: streamerIds } }).lean(),
      Share.find({ streamerId: { $in: streamerIds } }).lean(),
    ]);

    const streamerMap = Object.fromEntries(streamers.map(s => [s._id.toString(), s]));
    const shareMap = Object.fromEntries(shares.map(s => [s.streamerId.toString(), s]));

    const watchlist = watchlistItems.map(item => {
      const streamer = streamerMap[item.streamerId.toString()];
      const share = shareMap[item.streamerId.toString()];
      return {
        _id: item._id,
        streamerId: item.streamerId,
        addedAt: item.addedAt,
        name: streamer?.name || 'Unknown',
        ticker: streamer?.ticker || streamer?.name?.substring(0, 4).toUpperCase() || 'N/A',
        platform: streamer?.platform || '',
        profileImageUrl: streamer?.profileImageUrl || null,
        category: streamer?.category || null,
        sharePrice: share?.sharePrice || 0,
        day1Price: share?.day1Price || null,
        marketCap: share?.marketCap || 0,
      };
    });

    res.json({ watchlist });
  } catch (error) {
    logger.error('Watchlist fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

/**
 * POST /watchlist
 * Add a streamer to the user's watchlist
 * Body: { streamerId }
 */
router.post('/', async (req, res) => {
  try {
    const { streamerId } = req.body;

    if (!streamerId) {
      return res.status(400).json({ error: 'streamerId is required' });
    }

    // Verify streamer exists
    const streamer = await Streamer.findById(streamerId);
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }

    const entry = await Watchlist.create({
      userId: req.userId,
      streamerId,
    });

    res.status(201).json({
      success: true,
      watchlistItem: {
        _id: entry._id,
        streamerId: entry.streamerId,
        addedAt: entry.addedAt,
      },
    });
  } catch (error) {
    // Duplicate key error = already in watchlist
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Streamer already in watchlist' });
    }
    logger.error('Watchlist add error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

/**
 * DELETE /watchlist/:streamerId
 * Remove a streamer from the user's watchlist
 */
router.delete('/:streamerId', async (req, res) => {
  try {
    const result = await Watchlist.findOneAndDelete({
      userId: req.userId,
      streamerId: req.params.streamerId,
    });

    if (!result) {
      return res.status(404).json({ error: 'Streamer not in watchlist' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Watchlist remove error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

/**
 * GET /watchlist/check/:streamerId
 * Check if a streamer is in the user's watchlist
 */
router.get('/check/:streamerId', async (req, res) => {
  try {
    const exists = await Watchlist.exists({
      userId: req.userId,
      streamerId: req.params.streamerId,
    });

    res.json({ inWatchlist: !!exists });
  } catch (error) {
    logger.error('Watchlist check error:', error);
    res.status(500).json({ error: 'Failed to check watchlist' });
  }
});

module.exports = router;
