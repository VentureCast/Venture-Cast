---
phase: 4
slug: atomic-execution-orchestrator
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-07
---

# Phase 4 — Validation Strategy

> The keystone: pricing + risk + ledger composed behind ONE transaction with an
> optimistic version check, idempotency, quote expiry, and slippage. Requires a real
> MongoMemoryReplSet (transactions + concurrency).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x + MongoMemoryReplSet |
| **Quick run** | `cd VentureCast_Backend-main && npx jest tests/unit/execution.test.js --runInBand --forceExit` |
| **Full suite** | `cd VentureCast_Backend-main && npm test` |
| **Runtime** | ~15–30s (replset + multi-doc transactions) |

---

## Per-Requirement Verification Map

| Req | Behavior | Command (`-t`) |
|-----|----------|----------------|
| EXEC-01 | atomicity: a forced mid-trade failure leaves MarketState unchanged + zero Trade/LedgerEntry | `-t "atomic\|rollback"` |
| EXEC-02 | optimistic version: stale-version write aborts + retries; concurrent executes → no lost update | `-t "version\|concurren"` |
| EXEC-03 | idempotency replay: same key twice → one Trade, second returns the original | `-t "idempoten"` |
| EXEC-04 | expired quote rejected; buy maxCost / sell minReceived slippage enforced on the re-priced trade | `-t "expir\|slippage\|maxCost\|minReceived"` |

---

## Property / Invariant Tests

- **End-to-end conservation:** after a sequence of executed buys/sells, `Σ ledger cents == 0`,
  `market_reserve` balance == `MarketState.reserveCents`, `Σ user_pos == MarketState.supply`,
  and `reserveCents >= reserveFloorCents` at every step.
- **Atomicity under injected failure:** spy a late write (e.g. `Trade.save` or the MarketState
  `updateOne`) to throw; assert NO MarketState change, NO Trade, NO LedgerEntry persisted.
- **Concurrency (real):** fire N concurrent `executeOrder` calls on one market; assert final
  `supply`/`reserve` equal the serial-equivalent result and `version` incremented exactly N times.
- **Idempotency race:** two concurrent calls with the SAME idempotency key → exactly one Trade;
  both return the same tradeId.
- **Reserve floor:** an execute that would breach the floor is rejected (risk engine) and writes nothing.

---

## Wave 0 Requirements

- [ ] `tests/unit/execution.test.js` (replset; reuses `ammFixtures.createTestMarket` + genesis)

---

## Manual-Only Verifications

*None — concurrency is simulated deterministically with Promise.all against the in-memory replset.*

---

## Validation Sign-Off

- [x] Every requirement has an automated verify command
- [x] Atomicity + concurrency + idempotency + slippage each have a dedicated test
- [x] Wave 0 = execution.test.js
- [x] No watch-mode flags
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-06-07
