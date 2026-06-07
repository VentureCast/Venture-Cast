'use strict';

/**
 * services/amm/execution/errors.js
 *
 * Shared error type for the execution module. Lives in its own file so both
 * priceTrade.js and orchestrator.js can require it without a circular dependency
 * (priceTrade is required by orchestrator, so ExecutionError cannot live in
 * orchestrator without a cycle).
 *
 * ExecutionError mirrors TradeError / GenesisError / PricingError exactly:
 * { message, statusCode, details }.
 */

class ExecutionError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - HTTP-ish status (400 invalid input, 409 conflict/slippage/expiry)
   * @param {Object} [details={}]
   */
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'ExecutionError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = { ExecutionError };
