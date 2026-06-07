'use strict';

const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { tradeLimiter, apiLimiter } = require('../middleware/rateLimiters');
const requireAdmin = require('../middleware/requireAdmin');
const validate = require('../middleware/validate');
const {
  marketIdParam,
  quoteSchema,
  orderSchema,
  createMarketSchema,
  patchMarketSchema,
} = require('../middleware/schemas/ammSchemas');
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

// ============================================================
// Admin routes (API-05)
//
// Every route chains authenticateToken THEN requireAdmin so that:
//   - missing/invalid token → 401 (from authenticateToken)
//   - non-admin JWT         → 403 (from requireAdmin)
//   - admin JWT             → 200/201
//
// NOTE: GET /admin/ledger/reconcile is a static path — it must be
// declared before any dynamic :id patterns in the same prefix to
// avoid route-param collision.
// ============================================================

// POST /admin/markets — create a new market (API-05)
router.post(
  '/admin/markets',
  authenticateToken,
  requireAdmin,
  apiLimiter,
  validate(createMarketSchema),
  ammController.adminCreateMarket
);

// PATCH /admin/markets/:id — update status/tier/caps (API-05)
router.patch(
  '/admin/markets/:id',
  authenticateToken,
  requireAdmin,
  apiLimiter,
  validate(marketIdParam, 'params'),
  validate(patchMarketSchema),
  ammController.adminPatchMarket
);

// GET /admin/risk-events — list risk audit records (API-05)
router.get(
  '/admin/risk-events',
  authenticateToken,
  requireAdmin,
  apiLimiter,
  ammController.adminListRiskEvents
);

// GET /admin/ledger/reconcile — ledger solvency check (API-05)
router.get(
  '/admin/ledger/reconcile',
  authenticateToken,
  requireAdmin,
  apiLimiter,
  ammController.adminReconcile
);

module.exports = router;
