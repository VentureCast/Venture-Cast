---
phase: 03-ledger-risk-engines
plan: 01
subsystem: amm-ledger
tags: [ledger, double-entry, mongoose, tdd, atomicity]
requires:
  - services/amm/pricing/fees.js (applyBuyFees / applySellFees — fee fixtures consumed)
  - models/LedgerEntry.js (immutable append-only postings)
  - models/LedgerAccount.js ($inc-upsert balance projection)
provides:
  - services/amm/ledger/postings.js (pure build + assertBalanced + LedgerError)
  - services/amm/ledger/persist.js (postEntries — session-in, no txn ownership)
  - services/amm/ledger/index.js (public ledger API barrel)
affects:
  - Phase 4 execution orchestrator (will call postEntries inside its own transaction)
tech-stack:
  added: []
  patterns:
    - Pure/persistence split (no-DB posting builder + session-passed-in writer)
    - LedgerError mirrors TradeError/GenesisError (statusCode + details)
    - new Doc().save({session}) + findOneAndUpdate $inc upsert (genesisService pattern)
key-files:
  created:
    - VentureCast_Backend-main/services/amm/ledger/postings.js
    - VentureCast_Backend-main/services/amm/ledger/persist.js
    - VentureCast_Backend-main/services/amm/ledger/index.js
    - VentureCast_Backend-main/tests/unit/ledger.test.js
  modified: []
decisions:
  - "assertBalanced groups deltas by unit (cents/shares) and throws on any non-zero group — single gate enforces LEDG-01 and LEDG-03"
  - "build*Postings call assertBalanced internally (defense in depth) so an unbalanced set can never leave the pure layer"
  - "postEntries takes the session as a parameter and never starts/commits/aborts — Phase 4 owns the transaction lifecycle"
  - "LedgerError thrown for a missing session at 500 (invariant: caller must supply an active txn)"
metrics:
  duration: 4 min
  completed: 2026-06-06
---

# Phase 3 Plan 1: Double-Entry Ledger Engine Summary

Built the pure + persistence double-entry ledger module for the AMM: `buildBuyPostings`/`buildSellPostings` turn the pricing engine's fee output into per-unit sum-to-zero postings, `assertBalanced` proves the invariant before any write, and `postEntries` persists immutable `LedgerEntry` rows plus `$inc`-upserted `LedgerAccount` projections inside a caller-supplied Mongoose session (no transaction ownership).

## What Was Built

- **postings.js (pure, no DB):** `buildBuyPostings` (5 postings: user_cash debit, market_reserve credit, platform_fees credit, user_pos mint, market_shares_outstanding burn-counterparty) and `buildSellPostings` (the mirror: user_cash credit, market_reserve debit, platform_fees credit, user_pos burn, outstanding re-credit). `assertBalanced` groups deltas by `unit` and throws `LedgerError(500)` if any unit-group sum ≠ 0, plus `LedgerError(400)` on non-integer deltas/inputs.
- **persist.js (DB, session passed in):** `postEntries(postings, tradeId, session)` runs `assertBalanced` first, requires an active session, inserts each posting as a `new LedgerEntry().save({ session })`, then `$inc`-upserts each `LedgerAccount` projection with `$setOnInsert: { unit }`. Never opens/commits/aborts a transaction.
- **index.js:** barrel re-exporting `buildBuyPostings`, `buildSellPostings`, `assertBalanced`, `LedgerError`, `postEntries`.
- **ledger.test.js:** 17 tests — pure oracle fixtures (buy 20808/20603/205; sell 20192/-20397/205), assertBalanced rejection (tampered cents, tampered shares, non-integer), a 50-iteration property test, and replset projection-reconstruction tests (Σ LedgerEntry.delta per accountKey === LedgerAccount.balance; market_shares_outstanding === -Σ user_pos; unbalanced set leaks no writes; missing session throws).

## Requirements Satisfied

- **LEDG-01:** Buy and sell each produce balanced postings — cents group sums to 0 AND shares group sums to 0.
- **LEDG-02:** Account balance projections are recoverable by summing `LedgerEntry.delta`; verified equal to `LedgerAccount.balance` for every account on the replset.
- **LEDG-03:** `assertBalanced` rejects any non-zero-sum set before any write (also called first inside `postEntries`).

## Verification

- `npx jest tests/unit/ledger.test.js --runInBand --forceExit` → 17/17 passing.
- Full suite `npm test` → 9 suites, 143 tests passing, no regressions.
- `postings.js` is pure (no `require('mongoose')`, no model imports).
- `persist.js` contains no `startSession`/`startTransaction`/`commitTransaction`/`abortTransaction`/`endSession`.
- LedgerEntry persisted via `new LedgerEntry().save({ session })`; LedgerAccount via `findOneAndUpdate` `$inc` upsert with session in options.

## Deviations from Plan

None — plan executed exactly as written (TDD RED → GREEN across postings, then persist + index).

## Commits

- `027299e` test(03-01): add failing ledger balance + projection tests
- `3d355c4` feat(03-01): pure double-entry posting builder + assertBalanced
- `108459f` feat(03-01): persist ledger entries + projections in caller session (LEDG-02)

## Self-Check: PASSED

All created files exist and all task commits are present in history.
