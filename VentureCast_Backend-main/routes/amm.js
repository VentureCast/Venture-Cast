'use strict';

const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { marketIdParam } = require('../middleware/schemas/ammSchemas');
const ammController = require('../controllers/ammController');

const router = express.Router();

// GET /markets — list all markets with current state (no auth required)
router.get('/markets', optionalAuth, ammController.listMarkets);

// GET /markets/:id — detail for one market (validate :id before hitting DB)
router.get('/markets/:id', validate(marketIdParam, 'params'), optionalAuth, ammController.getMarket);

module.exports = router;
