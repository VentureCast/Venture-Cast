'use strict';

/**
 * services/amm/risk/checks.js
 *
 * Pure 3-tier risk engine for the Creator Stock AMM (RISK-01..06).
 * NO Mongoose, NO DB, NO I/O. Every input (reserve, position, daily volume,
 * market status, reference/new price, tier caps) is passed IN by the caller —
 * the Phase 4 orchestrator queries those values, risk stays a pure decision
 * function so it is trivially unit-testable.
 *
 * evaluate(trade, snapshot, tierConfig) →
 *   allow:  { allowed: true }
 *   reject: { allowed: false, riskError: RiskError,
 *             riskEventDraft: { marketId, userId, type, detail } }
 *
 * Check order (FIRST rejection wins):
 *   1. Circuit breaker / paused market  (market-level gate, userId null)
 *   2. Per-trade / per-position / daily caps (user-level)
 *   3. Dynamic sell cap + reserve floor invariant (market-level, userId null)
 *
 * type values (mirror models/RiskEvent.js):
 *   'max_trade_exceeded' | 'max_position_exceeded' | 'daily_volume_exceeded'
 *   'reserve_floor_breach' | 'dynamic_sell_cap' | 'circuit_breaker_triggered'
 *
 * @typedef {{ side:'buy'|'sell', grossCents:number, spreadCents:number,
 *             deltaQty:number, marketId:string, userId:string }} Trade
 * @typedef {{ reserveCents:number, reserveFloorCents:number, userPositionQty:number,
 *             userDailyVolumeCents:number, marketStatus:'active'|'paused',
 *             recentRefPriceCents:number, newPriceCents:number }} Snapshot
 * @typedef {{ maxTradeCents:number, maxPositionQty:number, maxDailyCents:number,
 *             circuitBreakerPct:number }} TierConfig
 */

// ============================================================
// Error class — mirrors TradeError/PricingError: { statusCode, details }
// ============================================================

class RiskError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - 400 malformed input, 422/409 invariant/cap violation
   * @param {Object} [details={}]
   */
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'RiskError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================
// Internal helpers
// ============================================================

/**
 * Build a rejection result: a typed RiskError plus a RiskEvent draft.
 * userId is null for market-level events (floor, sell cap, breaker, paused).
 * @returns {{ allowed:false, riskError:RiskError, riskEventDraft:Object }}
 */
function reject(type, statusCode, message, detail, { marketId, userId }) {
  return {
    allowed: false,
    riskError: new RiskError(message, statusCode, detail),
    riskEventDraft: { marketId, userId, type, detail },
  };
}

/** Throw a 400 RiskError when an expected integer field is malformed. */
function assertInt(value, name) {
  if (!Number.isInteger(value)) {
    throw new RiskError(`${name} must be an integer`, 400, { [name]: value });
  }
}

// ============================================================
// Public: evaluate
// ============================================================

/**
 * Evaluate a trade against per-tier caps and per-market invariants.
 * Returns the FIRST rejection (or { allowed: true } if all checks pass).
 *
 * @param {Trade} trade
 * @param {Snapshot} snapshot
 * @param {TierConfig} tierConfig
 * @returns {{ allowed:boolean, riskError?:RiskError, riskEventDraft?:Object }}
 * @throws {RiskError} 400 on malformed input
 */
function evaluate(trade, snapshot, tierConfig) {
  if (!trade || typeof trade !== 'object') {
    throw new RiskError('trade is required', 400, { trade });
  }
  if (!snapshot || typeof snapshot !== 'object') {
    throw new RiskError('snapshot is required', 400, { snapshot });
  }
  if (!tierConfig || typeof tierConfig !== 'object') {
    throw new RiskError('tierConfig is required', 400, { tierConfig });
  }

  const { side, marketId, userId } = trade;
  if (side !== 'buy' && side !== 'sell') {
    throw new RiskError("trade.side must be 'buy' or 'sell'", 400, { side });
  }

  assertInt(trade.grossCents, 'trade.grossCents');
  assertInt(trade.spreadCents, 'trade.spreadCents');
  assertInt(trade.deltaQty, 'trade.deltaQty');
  assertInt(snapshot.reserveCents, 'snapshot.reserveCents');
  assertInt(snapshot.reserveFloorCents, 'snapshot.reserveFloorCents');
  assertInt(snapshot.userPositionQty, 'snapshot.userPositionQty');
  assertInt(snapshot.userDailyVolumeCents, 'snapshot.userDailyVolumeCents');
  assertInt(tierConfig.maxTradeCents, 'tierConfig.maxTradeCents');
  assertInt(tierConfig.maxPositionQty, 'tierConfig.maxPositionQty');
  assertInt(tierConfig.maxDailyCents, 'tierConfig.maxDailyCents');
  assertInt(tierConfig.circuitBreakerPct, 'tierConfig.circuitBreakerPct');

  // Defense in depth: a real trade always has positive notional/quantity and a
  // non-negative spread. The pricing + orchestrator layers already guarantee this,
  // but this pure function must not trust its caller (a negative gross could otherwise
  // sneak past the reserve-floor math by "adding" to the reserve on a sell).
  if (trade.grossCents <= 0) {
    throw new RiskError('trade.grossCents must be a positive integer', 400, { grossCents: trade.grossCents });
  }
  if (trade.deltaQty <= 0) {
    throw new RiskError('trade.deltaQty must be a positive integer', 400, { deltaQty: trade.deltaQty });
  }
  if (trade.spreadCents < 0) {
    throw new RiskError('trade.spreadCents must be a non-negative integer', 400, { spreadCents: trade.spreadCents });
  }

  // ---- RISK-06: circuit breaker — paused market (market-level gate, FIRST) ----
  if (snapshot.marketStatus === 'paused') {
    return reject(
      'circuit_breaker_triggered', 409,
      'Market is paused — trading halted',
      { reason: 'market_paused' },
      { marketId, userId: null }
    );
  }

  // ---- RISK-06: circuit breaker — price-move threshold (market-level) ----
  // Guard recentRefPriceCents > 0 to avoid div-by-zero.
  if (Number.isInteger(snapshot.recentRefPriceCents) && snapshot.recentRefPriceCents > 0 &&
      Number.isInteger(snapshot.newPriceCents)) {
    const refP = snapshot.recentRefPriceCents;
    // EXACT integer decision (codex audit): the move-in-bps is |Δ|*10000/refP, but rounding
    // it before the compare lets a move of e.g. 1000.45 bps slip past a 1000-bps threshold.
    // Compare the cross-multiplied integers instead — reject iff |Δ|*10000 > threshold*refP —
    // so any move STRICTLY above the threshold trips, with no rounding leniency.
    const moveNum = Math.abs(snapshot.newPriceCents - refP) * 10000;
    const thresholdNum = tierConfig.circuitBreakerPct * refP;
    const moveBps = Math.round(moveNum / refP); // informational only (event detail)
    const overThreshold = (Number.isSafeInteger(moveNum) && Number.isSafeInteger(thresholdNum))
      ? moveNum > thresholdNum
      : moveBps > tierConfig.circuitBreakerPct; // fail-open to the rounded compare only on overflow (unreachable via API bounds)
    if (overThreshold) {
      return reject(
        'circuit_breaker_triggered', 409,
        'Price move exceeds circuit-breaker threshold',
        { moveBps, thresholdBps: tierConfig.circuitBreakerPct, tripBreaker: true },
        { marketId, userId: null }
      );
    }
  }

  // ---- RISK-01: per-trade max size (user-level) ----
  if (trade.grossCents > tierConfig.maxTradeCents) {
    return reject(
      'max_trade_exceeded', 422,
      'Trade size exceeds per-trade maximum',
      { attemptedCents: trade.grossCents, limitCents: tierConfig.maxTradeCents },
      { marketId, userId }
    );
  }

  // ---- RISK-02: max position — BUYS only; sells reduce position so are exempt ----
  if (side === 'buy') {
    const projectedQty = snapshot.userPositionQty + trade.deltaQty;
    if (projectedQty > tierConfig.maxPositionQty) {
      return reject(
        'max_position_exceeded', 422,
        'Buy would exceed per-user maximum position',
        { current: snapshot.userPositionQty, attempted: projectedQty, limit: tierConfig.maxPositionQty },
        { marketId, userId }
      );
    }
  }

  // ---- RISK-03: daily volume cap (user-level) ----
  const projectedDaily = snapshot.userDailyVolumeCents + trade.grossCents;
  if (projectedDaily > tierConfig.maxDailyCents) {
    return reject(
      'daily_volume_exceeded', 422,
      'Trade would exceed daily volume cap',
      { used: snapshot.userDailyVolumeCents, attempted: projectedDaily, limit: tierConfig.maxDailyCents },
      { marketId, userId }
    );
  }

  // ---- RISK-05: dynamic sell cap (sells only, market-level) ----
  // A sell drains the reserve by its impact (gross minus the spread that stays in reserve).
  // Reject if that impact would consume more than the available headroom above the floor.
  if (side === 'sell') {
    const impactCents = trade.grossCents - trade.spreadCents;
    const headroomCents = snapshot.reserveCents - snapshot.reserveFloorCents;
    if (impactCents > headroomCents) {
      return reject(
        'dynamic_sell_cap', 409,
        'Sell reserve impact exceeds available headroom above the floor',
        { impactCents, headroomCents },
        { marketId, userId: null }
      );
    }
  }

  // ---- RISK-04: reserve floor invariant (post-trade, market-level) ----
  // Safety net for the same invariant RISK-05 enforces, viewed from the post-trade balance.
  // RISK-05 catches the offending SELL first, so on a sell fixture RISK-04 does NOT also
  // fire here — by the time we reach this line the sell impact already fit within headroom.
  // RISK-04 remains as the catch-all that ALSO covers buys and the edge case of a floor
  // raised after a position opened (where reserveCents - reserveFloorCents may be negative).
  const postReserve = side === 'buy'
    ? snapshot.reserveCents + (trade.grossCents + trade.spreadCents)   // buy adds to reserve
    : snapshot.reserveCents - (trade.grossCents - trade.spreadCents);  // sell drains impact
  if (postReserve < snapshot.reserveFloorCents || postReserve < 0) {
    return reject(
      'reserve_floor_breach', 409,
      'Post-trade reserve would fall below the floor (or below zero)',
      { postReserveCents: postReserve, floorCents: snapshot.reserveFloorCents },
      { marketId, userId: null }
    );
  }

  return { allowed: true };
}

module.exports = { evaluate, RiskError };
