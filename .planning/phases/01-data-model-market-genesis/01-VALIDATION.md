---
phase: 1
slug: data-model-market-genesis
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x (already installed) |
| **Config file** | `VentureCast_Backend-main/jest.config.js` |
| **Quick run command** | `cd VentureCast_Backend-main && npx jest tests/unit/genesis.test.js --runInBand --forceExit` |
| **Full suite command** | `cd VentureCast_Backend-main && npm test` |
| **Estimated runtime** | ~10–20 seconds (in-memory replset spin-up dominates) |

---

## Sampling Rate

- **After every task commit:** Run the quick command (`genesis.test.js`)
- **After every plan wave:** Run the full suite (`npm test`) — confirms no regression to the existing trade/auth/stripe tests
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | LEDG-04a | unit | `npx jest tests/unit/genesis.test.js -t "Model.init"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | LEDG-04b | unit | `npx jest tests/unit/genesis.test.js -t "genesis creates"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | LEDG-04c | unit | `npx jest tests/unit/genesis.test.js -t "ledger sum"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | LEDG-04d | unit | `npx jest tests/unit/genesis.test.js -t "atomic rollback"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

LEDG-04 decomposes into 4 observable behaviors (04a–04d) so each success criterion has its own automated assertion.

---

## Wave 0 Requirements

- [ ] `tests/unit/genesis.test.js` — covers LEDG-04a through LEDG-04d (the atomicity gate)
- [ ] `tests/helpers/ammFixtures.js` — `createTestMarket(params)` factory reused by later AMM phases

*Existing `tests/setup.js` / `tests/teardown.js` already configure `MongoMemoryReplSet`; no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none) | — | — | All Phase 1 behaviors are automatable against the in-memory replset |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (`genesis.test.js`, `ammFixtures.js`)
- [x] No watch-mode flags (uses `--runInBand --forceExit`)
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-05
