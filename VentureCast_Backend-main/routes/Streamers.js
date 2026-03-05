const express = require('express');
const router = express.Router();
const Streamer = require('../models/streamer');
const Share = require('../models/Shares');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { listQuery, searchQuery, streamerIdParam } = require('../middleware/schemas/streamerSchemas');

// GET /streamer - Fetch streamers with optional pagination
router.get('/', validate(listQuery, 'query'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;

    const filter = category ? { category } : {};

    const [streamers, total] = await Promise.all([
      Streamer.find(filter).skip(offset).limit(limit).lean(),
      Streamer.countDocuments(filter),
    ]);

    const streamerIds = streamers.map(s => s._id);
    const shares = await Share.find({ streamerId: { $in: streamerIds } }).lean();
    const shareMap = Object.fromEntries(shares.map(s => [s.streamerId.toString(), s]));

    const result = streamers.map(s => ({
      ...s,
      sharePrice: shareMap[s._id.toString()]?.sharePrice || 0,
      totalShares: shareMap[s._id.toString()]?.totalShares || 0,
      marketCap: shareMap[s._id.toString()]?.marketCap || 0,
    }));

    res.json({
      streamers: result,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    logger.error('Failed to fetch streamers', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch streamers' });
  }
});

// GET /streamer/search?q=query - Search streamers by name
router.get('/search', validate(searchQuery, 'query'), async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ streamers: [] });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const streamers = await Streamer.find({
      name: { $regex: `^${escaped}`, $options: 'i' }
    }).limit(20).lean();

    const streamerIds = streamers.map(s => s._id);
    const shares = await Share.find({ streamerId: { $in: streamerIds } }).lean();
    const shareMap = Object.fromEntries(shares.map(s => [s.streamerId.toString(), s]));

    const result = streamers.map(s => ({
      _id: s._id,
      id: s.id,
      name: s.name,
      platform: s.platform,
      ticker: s.ticker || s.name.substring(0, 4).toUpperCase(),
      profileImageUrl: s.profileImageUrl,
      sharePrice: shareMap[s._id.toString()]?.sharePrice || 0,
    }));

    res.json({ streamers: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search streamers' });
  }
});

// GET /streamer/categories - Get categories
router.get('/categories', async (req, res) => {
  try {
    // Get unique categories from streamers
    const categories = await Streamer.distinct('category');
    const result = categories
      .filter(c => c) // filter out null/undefined
      .map((name, idx) => ({
        id: String(idx + 1),
        name,
      }));

    res.json({ categories: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /streamer/:id - Fetch single streamer with share info
router.get('/:id', validate(streamerIdParam, 'params'), async (req, res) => {
  try {
    const streamer = await Streamer.findById(req.params.id).lean();
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }

    const share = await Share.findOne({ streamerId: streamer._id }).lean();

    res.json({
      ...streamer,
      ticker: streamer.ticker || streamer.name.substring(0, 4).toUpperCase(),
      sharePrice: share?.sharePrice || 0,
      totalShares: share?.totalShares || 0,
      marketCap: share?.marketCap || 0,
      priceHistory: share ? {
        day1: share.day1Price,
        day2: share.day2Price,
        day3: share.day3Price,
        day4: share.day4Price,
        day5: share.day5Price,
        day6: share.day6Price,
        day7: share.day7Price,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch streamer' });
  }
});

module.exports = router;
