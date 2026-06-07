'use strict';

/**
 * services/amm/execution/priceTrade.js
 *
 * Pure-ish pricing composer for the execution orchestrator. NO DB, NO session.
 * Takes a Market doc/object (curve + fee params) plus the current MarketState
 * numbers and calls the Phase 2 pricing engine (curve + inversion + fees),
 * returning a flat integer-cent object the orchestrator writes to the ledger
 * and MarketState.
 *
 * Reserve math MUST mirror the ledger postings EXACTLY (services/amm/ledger/postings.js):
 *   BUY  reserve += grossCents + spreadCents
 *   SELL reserve -= (grossCents - spreadCents)
 *
 * Pricing direction / rounding (from curve.js):
 *   BUY  grossCents = buyCostCents(s, delta)          (ceil-rounded, s = supply before buy)
 *   SELL grossCents = sellPayoutCents(s - delta, delta) (floor-rounded, s0 = POST-sell supply)
 *
 * @typedef {{ P0_cents:number, k_num:number, k_den:number, spreadBps?:number, feeBps?:number }} MarketParams
 * @typedef {{ supply:number, reserveCents:number, reserveFloorCents:number }} StateNumbers
 */

const { buyCostCents, sellPayoutCents, priceCents } = require('../pricing/curve');
const { cashToUnits } = require('../pricing/inversion');
const { applyBuyFees, applySellFees } = require('../pricing/fees');
const { ExecutionError } = require('./errors');

/** Round-half-up of a/b using exact integer arithmetic (a >= 0, b > 0). */
function roundDivHalfUp(a, b) {
  const whole = Math.floor(a / b);
  const r = a - whole * b;
  return (r * 2 >= b) ? whole + 1 : whole;
}

/**
 * Price a buy or sell against the curve, fees, and current state.
 *
 * @param {MarketParams} market   - curve + fee params (P0_cents, k_num, k_den, spreadBps, feeBps)
 * @param {StateNumbers} marketState - { supply, reserveCents, reserveFloorCents }
 * @param {'buy'|'sell'} side
 * @param {{ qty?:number, cashCents?:number }} qtyOrCash - buy may use cashCents; sell requires qty
 * @returns {{
 *   side:'buy'|'sell', deltaQty:number, grossCents:number, spreadCents:number, feeCents:number,
 *   totalCents?:number, netCents?:number, avgPriceCents:number, endPriceCents:number,
 *   newSupply:number, newReserveCents:number
 * }}
 * @throws {ExecutionError} 400 on invalid side/input or oversell
 */
function priceTrade(market, marketState, side, qtyOrCash) {
  if (side !== 'buy' && side !== 'sell') {
    throw new ExecutionError("side must be 'buy' or 'sell'", 400, { side });
  }

  const curveParams = { P0_cents: market.P0_cents, k_num: market.k_num, k_den: market.k_den };
  const feeParams = { spreadBps: market.spreadBps, feeBps: market.feeBps };
  const supply = marketState.supply;
  const reserveCents = marketState.reserveCents;

  if (side === 'buy') {
    let deltaQty;
    let grossCents;

    if (qtyOrCash && Number.isInteger(qtyOrCash.qty)) {
      deltaQty = qtyOrCash.qty;
      if (deltaQty <= 0) {
        throw new ExecutionError('buy qty must be a positive integer', 400, { qty: deltaQty });
      }
      grossCents = buyCostCents(supply, deltaQty, curveParams);
    } else if (qtyOrCash && Number.isInteger(qtyOrCash.cashCents)) {
      const { units, grossCents: g } = cashToUnits(qtyOrCash.cashCents, supply, curveParams);
      if (units <= 0) {
        throw new ExecutionError('cashCents too small to buy a single unit', 400, { cashCents: qtyOrCash.cashCents });
      }
      deltaQty = units;
      grossCents = g;
    } else {
      throw new ExecutionError('buy requires { qty } or { cashCents } (integer)', 400, { qtyOrCash });
    }

    const fees = applyBuyFees(grossCents, feeParams); // { grossCents, spreadCents, feeCents, totalCents }
    const newSupply = supply + deltaQty;
    // Mirror buildBuyPostings: market_reserve += grossCents + spreadCents.
    const newReserveCents = reserveCents + (fees.grossCents + fees.spreadCents);
    const endPriceCents = priceCents(newSupply, curveParams);
    const avgPriceCents = roundDivHalfUp(fees.grossCents, deltaQty);

    return {
      side: 'buy',
      deltaQty,
      grossCents: fees.grossCents,
      spreadCents: fees.spreadCents,
      feeCents: fees.feeCents,
      totalCents: fees.totalCents,
      avgPriceCents,
      endPriceCents,
      newSupply,
      newReserveCents,
    };
  }

  // ---- SELL ----
  if (!qtyOrCash || !Number.isInteger(qtyOrCash.qty)) {
    throw new ExecutionError('sell requires an integer { qty } (no cash-sell)', 400, { qtyOrCash });
  }
  const deltaQty = qtyOrCash.qty;
  if (deltaQty <= 0) {
    throw new ExecutionError('sell qty must be a positive integer', 400, { qty: deltaQty });
  }
  if (deltaQty > supply) {
    throw new ExecutionError('cannot sell more than current supply', 400, { qty: deltaQty, supply });
  }

  const postSellSupply = supply - deltaQty;                 // s0 for the integral
  const grossCents = sellPayoutCents(postSellSupply, deltaQty, curveParams);
  const fees = applySellFees(grossCents, feeParams);        // { grossCents, spreadCents, feeCents, netCents }
  const newSupply = postSellSupply;
  // Mirror buildSellPostings: market_reserve -= (grossCents - spreadCents).
  const newReserveCents = reserveCents - (fees.grossCents - fees.spreadCents);
  const endPriceCents = priceCents(newSupply, curveParams);
  const avgPriceCents = roundDivHalfUp(fees.grossCents, deltaQty);

  return {
    side: 'sell',
    deltaQty,
    grossCents: fees.grossCents,
    spreadCents: fees.spreadCents,
    feeCents: fees.feeCents,
    netCents: fees.netCents,
    avgPriceCents,
    endPriceCents,
    newSupply,
    newReserveCents,
  };
}

module.exports = { priceTrade };
