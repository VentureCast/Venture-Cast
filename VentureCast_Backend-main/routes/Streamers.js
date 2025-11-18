const express = require('express');
const router = express.Router();

// GET /streamer - Fetch all streamers
router.get('/', async (req, res) => {
  try {
    // For now, return empty array - you can add Supabase integration later
    res.json({ streamers: [] });
  } catch (error) {
    console.error('Error fetching streamers:', error);
    res.status(500).json({ error: 'Failed to fetch streamers' });
  }
});

module.exports = router;
