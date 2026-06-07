---
phase: 5
slug: api-surface
status: passed
score: 5/5 requirements
verified_by: gsd plan-check + codex security audit (foreground + watchdog) + 38-test supertest suite
date: 2026-06-07
---

# Phase 5 — Verification

**Status:** passed · API-01..05 covered · amm suite **38 tests** · full suite **195/195**

## Requirement coverage

- **API-01** `GET /markets` + `/markets/:id` — list + curated detail DTO. ✓
- **API-02** `POST /quotes` — stateless priced quote (avg/gross/fee/spread/total|net/priceImpactBps/expiresAt). ✓
- **API-03** `POST /orders` — `executeOrder` via JWT identity; idempotency-over-HTTP (same key → one trade); slippage 409. ✓
- **API-04** `GET /portfolio` — JWT-scoped, no `:userId` param; IDOR test proves A can't read B. ✓
- **API-05** admin — create/pause/tier/caps/risk-events/reconcile, all behind `authenticateToken`+`requireAdmin`. ✓

## Security audit (codex) — all critical CLEAN

| Area | Result |
|------|--------|
| Auth on /quotes, /orders, /portfolio | CLEAN (401 without JWT) |
| IDOR (/portfolio) | CLEAN — userId from `req.userId` only, no param, `user_pos:<uid>:*` prefix range (no regex/ReDoS) |
| Order identity | CLEAN — `req.userId` only; `validate()` strips a body `userId` |
| Admin guard | CLEAN — every `/admin/*` is `authenticateToken`→`requireAdmin` (`req.user.isAdmin`) |
| Rate-limiter test bypass | CLEAN — `NODE_ENV==='test'` only, no production path |
| NoSQL injection | CLEAN — unknown fields stripped, fixed `$gte/$lt` prefix range |

LOW findings closed: input upper bounds (qty/cents/bps → clean 400 not 500); curated
`GET /markets/:id` DTO (no `reserveFloorCents`/`version` leak). One LOW deferred:
non-uniform auth status codes — an app-wide `authenticateToken` concern, not AMM-specific.

## Tests

amm.test.js 38 tests: market list/detail (+ no-leak assertion), quote shape, order
execute + idempotency replay + slippage, portfolio + IDOR isolation, admin 401/403/200
sweep, create/pause round-trip, reconcile balanced (Σ cents == 0, projection == Σ entries).
Full backend suite 195/195, no regressions; legacy tradeService.js untouched.

## Notes

The codex CLI worked reliably this phase (foreground + inline 6-min watchdog) and
confirmed the security posture; its LOW findings were fixed. No gaps.
