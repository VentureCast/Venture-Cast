---
phase: 3
slug: ledger-risk-engines
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-06
---

# Phase 3 — Validation Strategy

> Two independent engines (ledger, risk). Pure logic tested without DB; only the
> ledger persistence helper + projection reconstruction need MongoMemoryReplSet.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x |
| **Ledger quick run** | `cd VentureCast_Backend-main && npx jest tests/unit/ledger.test.js --runInBand --forceExit` |
| **Risk quick run** | `cd VentureCast_Backend-main && npx jest tests/unit/risk.test.js --runInBand --forceExit` |
| **Full suite** | `cd VentureCast_Backend-main && npm test` |
| **Runtime** | risk + ledger-pure < 1s; ledger persistence ~10–15s (replset) |

---

## Per-Task Verification Map

| Task | Requirement | Test Type | Command |
|------|-------------|-----------|---------|
| ledger build+balance | LEDG-01, LEDG-03 | unit (pure) | `npx jest tests/unit/ledger.test.js -t "balanced\|sum to zero\|reject"` |
| ledger persistence + projection | LEDG-02 | unit (replset) | `npx jest tests/unit/ledger.test.js -t "projection\|reconstruct"` |
| risk caps | RISK-01, RISK-02, RISK-03 | unit (pure) | `npx jest tests/unit/risk.test.js -t "max trade\|max position\|daily"` |
| reserve floor + sell cap | RISK-04, RISK-05 | unit (pure) | `npx jest tests/unit/risk.test.js -t "floor\|sell cap"` |
| circuit breaker / paused | RISK-06 | unit (pure) | `npx jest tests/unit/risk.test.js -t "breaker\|paused"` |

---

## Property / Invariant Tests

- **Per-unit balance:** for random buy/sell postings, cents entries sum to 0 AND shares entries sum to 0; any tampered posting set is rejected by `assertBalanced` before any write.
- **Projection = sum of entries:** after persisting N random events, every `LedgerAccount.balance` equals the sum of its `LedgerEntry.delta` (LEDG-02).
- **Reserve floor invariant:** no risk-approved trade can drive `reserveCents` below `reserveFloorCents` or negative.
- **Dynamic sell cap:** a sell whose payout would exceed `reserveCents - reserveFloorCents` is rejected.
- **Typed errors + events:** every rejection yields a `RiskError` (statusCode/details) and a `RiskEvent` draft.

---

## Wave 0 Requirements

- [ ] `tests/unit/ledger.test.js` (pure balance + replset projection)
- [ ] `tests/unit/risk.test.js` (pure decisions)
- [ ] reuse `tests/helpers/ammFixtures.js` (from Phase 1)

---

## Manual-Only Verifications

*None — all Phase 3 behavior is automatable.*

---

## Validation Sign-Off

- [x] Every task has an automated verify command
- [x] Sampling continuity holds
- [x] Wave 0 = ledger.test.js + risk.test.js
- [x] No watch-mode flags
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-06-06
