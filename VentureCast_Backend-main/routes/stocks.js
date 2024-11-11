const express = require('express');
const passport = require('passport');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();


router.post('/buy', passport.authenticate('jwt', { session: false }), async (req, res) => {
 
});

// Sell Stock Route
router.post('/sell', passport.authenticate('jwt', { session: false }), async (req, res) => {
  
});

// Fetch Stock Data
router.get('/quote/:symbol', async (req, res) => {
 
});

module.exports = router;
