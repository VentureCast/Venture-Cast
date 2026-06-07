'use strict';

const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { tradeLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validate');
const { marketIdParam, quoteSchema, orderSchema } = require('../middleware/schemas/ammSchemas');
const ammController = require('../controllers/ammController');

const router = express.Router();

// ============================================================
// Public market data endpoints (no auth required)
// ============================================================

// GET /markets — list all markets with current state (no auth required)
router.get('/markets', optionalAuth, ammController.listMarkets);

// GET /markets/:id — detail for one market (validate :id before hitting DB)
router.get('/markets/:id', validate(marketIdParam, 'params'), optionalAuth, ammController.getMarket);

// ============================================================
// Authenticated trading endpoints (API-02 / API-03 / API-04)
//
// authenticateToken runs BEFORE validate so a request with no/bad
// token 401s / 403s immediately — no body validation overhead.
//
// NOTE: There is deliberately NO '/portfolio/:userId' route — IDOR
// safety is enforced by construction (userId always from JWT).
// ============================================================

// POST /quotes — stateless priced quote (API-02)
router.post('/quotes', authenticateToken, tradeLimiter, validate(quoteSchema), ammController.postQuote);

// POST /orders — atomic order execution with idempotency + slippage (API-03)
router.post('/orders', authenticateToken, tradeLimiter, validate(orderSchema), ammController.postOrder);

// GET /portfolio — JWT-user-only portfolio (API-04); no :userId param (IDOR-safe)
router.get('/portfolio', authenticateToken, ammController.getPortfolio);

module.exports = router;
