const express = require('express');
const { authenticateToken, verifyOwnership } = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');
const validate = require('../middleware/validate');
const { buySchema, sellSchema, tradeHistoryQuery, userIdParam, streamerIdParam } = require('../middleware/schemas/tradeSchemas');

const router = express.Router();

router.post('/trade/buy', authenticateToken, validate(buySchema), tradeController.buyShares);
router.post('/trade/sell', authenticateToken, validate(sellSchema), tradeController.sellShares);
router.get('/portfolio/:userId', validate(userIdParam, 'params'), authenticateToken, verifyOwnership, tradeController.getUserPortfolio);
router.get('/shares/:streamerId', validate(streamerIdParam, 'params'), tradeController.getShareInformation);
router.get('/trade/history/:userId', validate(userIdParam, 'params'), authenticateToken, verifyOwnership, validate(tradeHistoryQuery, 'query'), tradeController.getUserTradeHistory);

module.exports = router;
