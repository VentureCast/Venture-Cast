---
phase: 4
slug: atomic-execution-orchestrator
status: passed
score: 4/4 requirements
verified_by: codex CLI (foreground + inline 6-min watchdog) + 14-test replset suite
date: 2026-06-07
---

# Phase 4 — Verification

**Status:** passed · EXEC-01..04 covered · execution suite **14/14** · full suite **157/157**

## Requirement coverage (codex-confirmed)

- **EXEC-01 atomicity** — all writes (Trade, ledger entries + projections, MarketState, Order) inside ONE `session.withTransaction`; the only out-of-txn write is the durable RiskEvent on a rejection. Injected-failure test → zero partial writes. Codex: CLEAN.
- **EXEC-02 optimistic version + retry** — read `version V`, `updateOne({_id,version:V},{$inc:{version:1}})`, `matchedCount===0` → retryable `VersionConflictError`, bounded 3 attempts + jitter; only version conflicts retry. 5 concurrent buys → `version += 5`, no lost update. Codex: CLEAN.
- **EXEC-03 idempotency** — unique `Order.idempotencyKey` + pre-check + E11000 race catch; serial replay and concurrent same-key race each → exactly one Trade.
- **EXEC-04 expiry + slippage** — expiry rejected pre-loop AND re-checked per attempt; slippage enforced against the RE-PRICED trade inside the txn.

## Codex adversarial audit (this phase) — found a CRITICAL the tests missed

The orchestrator passed its 11 original tests, but codex found **1 critical + 3 lesser bugs**
(the tests all sold from a bought-up position, so the missing inventory check was invisible):

| Sev | Finding | Status |
|-----|---------|--------|
| Critical | Oversell / naked short — sell checked `qty<=supply`, not `qty<=position`; a 0-share account could drain the reserve | FIXED (in-txn inventory guard) + 2 regression tests |
| High | Stale Market loaded before the retry loop (mid-flight pause/param change ignored) | FIXED (re-read in-session each attempt) |
| Medium | Quote expiry checked once, not per retry | FIXED (re-check per attempt) |
| Medium | Idempotency replay key-only | FIXED for identity (user/market/side); strict param fingerprint deferred to Phase 5 |

Re-audit confirmed #1–#3 fully resolved with no new issues; #4 security-relevant part resolved.

## Conservation (property test)

After executed buy/sell sequences: `Σ ledger cents == 0`, `Σ shares == 0`,
`market_reserve` projection == `MarketState.reserveCents`, `Σ user_pos == supply`,
`reserveCents >= reserveFloorCents`. A floor-breaching sell is risk-rejected with a
durable RiskEvent and zero writes.

## Follow-up (Phase 5)

Strict Stripe-style idempotency: persist a full request fingerprint (incl. cashCents/
slippage) on the Order so a same-identity key reused with different params is rejected
rather than replaying the original. Tracked as IDEMP-FP in v2 requirements.

## Notes

Codex hung twice earlier in the session on the degraded API (10h once; watchdog-killed once).
The watchdog (foreground + inline 6-min kill) made it usable again for this phase — and it
caught the most important bug of the build (the oversell). No gaps.
