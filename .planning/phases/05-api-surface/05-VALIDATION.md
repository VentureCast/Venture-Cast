---
phase: 5
slug: api-surface
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-07
---

# Phase 5 — Validation Strategy

> Express routes/controllers wiring the AMM engine to HTTP. Security-sensitive
> (auth on every trade endpoint, IDOR-safe portfolio, admin guard). Integration-tested
> with supertest against the app + MongoMemoryReplSet + real JWTs.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x + supertest + MongoMemoryReplSet |
| **Quick run** | `cd VentureCast_Backend-main && npx jest tests/integration/amm.test.js --runInBand --forceExit` |
| **Full suite** | `cd VentureCast_Backend-main && npm test` |
| **Runtime** | ~20–40s (app boot + replset + transactions) |

---

## Per-Requirement Verification Map

| Req | Endpoint | Test (`-t`) |
|-----|----------|-------------|
| API-01 | `GET /markets` lists price/supply/status | `-t "GET /markets"` |
| API-02 | `POST /quotes` returns avg/gross/fee/spread/total/priceImpact/expiresAt | `-t "quote"` |
| API-03 | `POST /orders` executes + returns trade+balances; replay returns original | `-t "orders\|order execute\|replay"` |
| API-04 | `GET /portfolio` returns JWT user's positions; **IDOR**: other token can't read | `-t "portfolio\|IDOR"` |
| API-05 | Admin create/pause/caps/risk-events/reconcile behind `requireAdmin` | `-t "admin"` |

---

## Property / Security Tests (the gate)

- **Auth required:** `POST /quotes`, `POST /orders`, `GET /portfolio` return 401 with no/invalid JWT.
- **IDOR (API-04):** user A's token on `GET /portfolio` returns A's positions only; there is no `:userId` param to manipulate; A cannot read B's portfolio by any means.
- **Admin guard (API-05):** every `/admin/*` route returns 403 for a non-admin JWT, 200 for an admin.
- **Idempotency over HTTP:** the same `idempotencyKey` on two `POST /orders` returns the same trade (one execution).
- **Order → engine parity:** a successful `POST /orders` produces the same atomic result as a direct `executeOrder` (ledger balances, reserve, supply).
- **Validation:** malformed bodies (negative qty, missing side, bad market id) → 400 via Joi.
- **Reconcile (API-05):** `GET /admin/ledger/reconcile` reports `Σ cents == 0` and per-account projection == sum of entries.

---

## Wave 0 Requirements

- [ ] `tests/integration/amm.test.js` (supertest + replset + JWT helpers; reuse genesis fixture)
- [ ] a test JWT helper (sign a token for a given userId / admin flag)

---

## Manual-Only Verifications

*None — all endpoints are integration-testable via supertest.*

---

## Validation Sign-Off

- [x] Every requirement + auth/IDOR/admin has an automated test
- [x] Wave 0 = amm.test.js + JWT helper
- [x] No watch-mode flags
- [x] `nyquist_compliant: true`

**Approval:** approved 2026-06-07
