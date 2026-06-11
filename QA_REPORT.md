# QA Report — Isotope Searcher Phase 1 (team-verify, delta re-check)

**Verdict: PASS**
**Verified by: independent verifier (team-verify pass)**
**Date: 2026-06-10**

---

## Delta Re-Check Evidence (fresh commands, current tree)

| Check | Command | Result |
|-------|---------|--------|
| Build | `npm run build` | Exit 0 — dist/ emitted (527 kB JS, 13.95 kB CSS, 0 errors) |
| Types | `npx tsc --noEmit` | Exit 0 — 0 errors |
| Tests | `npx vitest run` | 232 passed, 0 failed (4 test files) |

### Blocker 1 — Build failure (RESOLVED, independently confirmed)

Confirmed on current tree:

- `grep "^import React," src/App.tsx src/components/*.tsx` — only `CompoundInput.tsx` retains `import React, { useState, useCallback }` which is valid (named hooks are used; `React` name in a mixed import is not flagged by `noUnusedLocals` when destructured siblings are consumed). All other components that previously had bare `import React from 'react'` with no usage: import line is gone or converted. Build passes without error.
- `grep "HCL_MATRIX" src/engine/engine.test.ts` — no output (constant removed).
- `ResultsTable.tsx:26-32` — `makeSortingChangeHandler` adapter wraps the prop and handles the `Updater<SortingState>` pattern required by `OnChangeFn<SortingState>`. Type error resolved.

### Blocker 2 — Missing "all-isotopes-interfered → difficult" regression (RESOLVED, independently confirmed)

`src/engine/engine.test.ts:314` — describe block "recommend — difficult status when all isotopes are isobarically interfered" exists with 5 assertions on Indium (In):

1. `In recommendation exists` — PASS
2. `In status is difficult (isobaric at every isotope mass)` — PASS
3. `In has isobaric interference in the recommended mass interference list` — PASS
4. `In alternativeMasses reflects the no-clean-option semantics` — PASS
5. `In recommended mass is 115 (highest abundance among difficult options, tie-break: abundance desc)` — PASS

Test rationale is sound: Cd (¹¹³Cd) and Sn (¹¹⁵Sn) in compound `CdSnCl2` produce isobaric hits at both In isotope masses (113 and 115), leaving no clean escape — correctly exercises the `difficult` branch in `recommend.ts:160`.

---

## Full Checklist Status

| Check | Result |
|-------|--------|
| Tests (npx vitest run) | PASS — 232/232, 0 failures |
| Types (npx tsc --noEmit) | PASS — 0 errors |
| Build (npm run build / tsc -b) | PASS — exit 0, dist/ generated |
| dist/ asset paths (relative ./assets/) | PASS |
| DO-NOT audit (no server/auth/fetch deps) | PASS |
| Engine files import no React/DOM | PASS |
| Integer mass judgment (massNumber not exactMass) | PASS |
| NIST header comment + date in isotopes.ts | PASS |
| Abundance sum tests (all elements, ±0.1%) | PASS |
| NIST spot-check tests (16+ individual values) | PASS |
| Shared sorting.ts comparator (single source) | PASS |
| Export order test exists and passes | PASS |
| Korean error messages | PASS |
| Element symbols (not full names) in table | PASS |
| Unit-resolution disclaimer present | PASS |
| Matrix toggle precedence logic | PASS |
| "matrix toggles != compound-element presence" comment | PASS |
| localStorage schema-versioned key | PASS |
| No built-in compound list | PASS |
| Mandatory regression: HfCl4 → ArCl/As mode-required, alternativeMasses=[] | PASS |
| Mandatory regression: ArO+ → Fe-56 | PASS |
| Mandatory regression: Ar2+ dimer → Se-80 | PASS |
| Mandatory regression: 137Ba2+ produces no integer collision | PASS |
| Mandatory regression: all-isotopes-interfered → difficult (In/CdSnCl2) | PASS — engine.test.ts:314 |
| Mandatory regression: severity boundary p==1.0% → high | PASS |
| Performance test full pipeline <1000ms | PASS |
| PRD success criteria 5 items | PASS — all 5 covered |

---

## PRD 성공 기준 5항목 (01_PRD.md:79-83)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | HfCl4 → ⁴⁰Ar³⁵Cl⁺/⁷⁵As 검출 + KED/DRC 모드 추천 | PASS | engine.test.ts Cases 1+10: ArCl interference high-severity, As status=mode-required |
| 2 | 즐겨찾기 클릭 → 3초 이내 결과 출력 | PASS | Performance test: SiH(N(CH3)2)3 full pipeline <1000ms (measured 90ms) |
| 3 | 테이블 정렬 상태 그대로 Excel 내보내기 | PASS | lib.test.ts: sort-order identity + shared lib/sorting.ts single comparator |
| 4 | 추천 질량이 문헌 간섭표 10건 이상 일치 | PASS | engine.test.ts: 16 named literature cases (Cases 1-16), all attributed to Thomas (2013)/Jarvis (1992) |
| 5 | 브라우저 접속, 설치 불필요 | PASS | dist/ generated with base: './' — relative asset paths confirmed in dist/index.html |

---

## Remaining Non-Blocking Gaps (unchanged from prior report)

- **WCAG AA contrast** — not mechanically testable. `data-table` uses high-contrast classes on dark background; visually likely compliant. No automated enforcement. Risk: low.
- **Script location deviation** — regeneration script at `.omc/data-staging/` instead of plan's `scripts/`. Committed `nist-isotopes-raw.json` snapshot and correct regenerate command in `isotopes.ts` header preserve full auditable intent. Risk: low / acceptable.
- **Manual browser verification** — UI rendering, real Excel file open, 3-second perception test require human sign-off before production release.

---

## Final Recommendation

**APPROVED** — both blockers independently verified as resolved on the current tree.
All 232 automated tests pass. Build exits 0. Types clean. All 6 mandatory regression cases
pass. All 5 PRD success criteria covered.

Manual browser verification (WCAG contrast spot-check, Excel open, 3s perception) is
recommended before the first production release but does not block Phase 1 completion.
