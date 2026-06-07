'use strict';

/**
 * services/amm/execution/index.js
 *
 * Public barrel for the execution module — the keystone atomic money path.
 *
 *   executeOrder(params) -> { trade, order, marketState }   (atomic buy/sell, EXEC-01..04)
 *   ExecutionError                                            (mirrors TradeError)
 *   priceTrade(market, marketState, side, qtyOrCash)         (pure pricing composer)
 */

const { executeOrder, ExecutionError } = require('./orchestrator');
const { priceTrade } = require('./priceTrade');

module.exports = { executeOrder, ExecutionError, priceTrade };
