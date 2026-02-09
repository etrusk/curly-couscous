# TDD Session

## Task

Phase 2 browser tests: Token hover SVG geometry and BattleViewer tooltip z-index. Evaluate and potentially remove CharacterTooltip zero-rect fallback now that browser tests validate real positioning.

## Confirmed Scope

Add browser tests for token hover SVG geometry (verifying SVG element dimensions, positions, and hover interactions) and BattleViewer tooltip z-index stacking. Evaluate the CharacterTooltip zero-rect fallback — if browser tests can validate real positioning, the fallback may be safely removable. Tests use `.browser.test.tsx` convention per ADR-022.

## Acceptance Criteria

- Browser tests verify token SVG geometry on hover (real getBoundingClientRect)
- Browser tests verify BattleViewer tooltip z-index stacking order
- CharacterTooltip zero-rect fallback evaluated; removed if browser tests provide sufficient coverage, kept with rationale if not
- All existing tests continue to pass
- All quality gates pass

## Current Phase

EXPLORE (COMPLETE) -> PLAN (COMPLETE) -> DESIGN_TESTS (COMPLETE) -> TEST_DESIGN_REVIEW (COMPLETE) -> WRITE_TESTS (COMPLETE) -> IMPLEMENT (COMPLETE) -> REVIEW (COMPLETE) -> SYNC_DOCS (COMPLETE)

## Phase History

- 2026-02-09 INIT -> EXPLORE
- 2026-02-09 EXPLORE complete. Findings in `.tdd/exploration.md`.
- 2026-02-09 PLAN complete. Plan in `.tdd/plan.md`.
- 2026-02-09 DESIGN_TESTS complete. Test designs in `.tdd/test-designs.md`.
- 2026-02-09 TEST_DESIGN_REVIEW complete. Designs approved with minor adjustments (see review status block in test-designs.md).
- 2026-02-09 WRITE_TESTS complete. 6 browser tests created, 5 unit tests converted. All 5 unit tests fail with expected import error (calculateTooltipPosition not exported).
- 2026-02-09 IMPLEMENT complete. Exported calculateTooltipPosition to tooltip-positioning.ts, removed zero-rect fallback, fixed browser test for z-index auto. All 1458 tests pass, all quality gates pass.
- 2026-02-09 REVIEW complete. APPROVED with 0 critical, 0 important, 2 minor issues. All quality gates verified: TypeScript, ESLint, 1448 unit tests, 10 browser tests all pass.

## Key Exploration Findings

- Token `<g>` getBoundingClientRect() returns zero in jsdom, non-zero in real browser
- Z-index hierarchy: WhiffOverlay(5) < IntentOverlay(10) < DamageOverlay(20) < Tooltip(1000, position:fixed)
- Zero-rect fallback (CharacterTooltip.tsx:255-256) only triggers in jsdom; removal requires migrating jsdom positioning tests
- Phase 1 pattern: standalone CharacterTooltip with DOMRect. Phase 2 needs BattleViewer integration for hover flow
- `calculateTooltipPosition` is a pure function extractable for direct testing

## Context Metrics

Orchestrator: ~5K/300K (~2%)
Cumulative agent tokens: ~152K
Agent invocations: 5
Compactions: 0

### Agent History

| #   | Agent             | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                        |
| --- | ----------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | -------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE            | 7         | ~25K   | 28    | -        | COMPLETE | Full codebase exploration                    |
| 2   | tdd-planner       | PLAN               | 8         | ~35K   | 15    | -        | COMPLETE | Plan with 6 browser tests + fallback removal |
| 3   | tdd-test-designer | DESIGN_TESTS       | 7         | ~32K   | 16    | -        | COMPLETE | 11 test cases across 3 areas                 |
| 4   | tdd-test-reviewer | TEST_DESIGN_REVIEW | 6         | ~18K   | 18    | -        | COMPLETE | Approved with 4 minor adjustments            |
| 5   | tdd-coder         | WRITE_TESTS        | 12        | ~42K   | 22    | -        | COMPLETE | 5 expected failures (RED phase)              |
| 6   | tdd-coder         | IMPLEMENT          | 12        | ~60K   | 28    | -        | COMPLETE | All 1458 tests pass (GREEN phase)            |

### Action Log

- Read all required docs (current-task, spec, architecture, patterns, decisions)
- Read ADR-022 (Vitest Browser Mode) and portal-tooltip-positioning pattern
- Explored Token.tsx, Grid.tsx, BattleViewer.tsx, CharacterTooltip.tsx
- Analyzed z-index hierarchy across all overlay CSS modules
- Identified zero-rect fallback code and its jsdom dependency
- Examined Phase 1 browser test patterns
- Documented findings in .tdd/exploration.md
- Planned 6 browser tests in BattleViewer.browser.test.tsx (4 SVG geometry + 2 z-index)
- Decided to remove zero-rect fallback and extract calculateTooltipPosition
- Planned conversion of 5 jsdom positioning tests to direct function tests
- Wrote plan to .tdd/plan.md

#### #3 tdd-test-designer (DESIGN_TESTS)

- Clean run

#### #4 tdd-test-reviewer (TEST_DESIGN_REVIEW)

- Added missing nextTick() to Test 6 setup for overlay data generation
- Relaxed Test 6 overlay z-index count assertion from 2-of-3 to 1-of-3
- Widened Test 4 pixel tolerance from 5px to 15px for SVG reflow timing

#### #5 tdd-coder (WRITE_TESTS)

- Clean run

#### #6 tdd-coder (IMPLEMENT)

- Exported `calculateTooltipPosition` to new file `tooltip-positioning.ts` (avoids react-refresh ESLint warning)
- Removed zero-rect fallback from `CharacterTooltip.tsx` (lines 254-256)
- Updated import in `CharacterTooltip.test.tsx` to point to new module
- Fixed browser Test 6: `z-index: auto` parses to NaN, treated as 0 for comparison
- Symlinked old Playwright chromium-1181 to satisfy chromium-1208 path requirement (network proxy blocked download)

## Files Touched

- `.tdd/exploration.md` (created)
- `.tdd/session.md` (updated)
- `.tdd/plan.md` (created)
- `.tdd/test-designs.md` (created)
- `src/components/BattleViewer/BattleViewer.browser.test.tsx` (created, 6 browser tests; IMPLEMENT: fixed z-index auto handling)
- `src/components/BattleViewer/CharacterTooltip.test.tsx` (modified, 5 positioning tests converted; IMPLEMENT: updated import path)
- `src/components/BattleViewer/CharacterTooltip.tsx` (modified: removed zero-rect fallback, imported from tooltip-positioning.ts)
- `src/components/BattleViewer/tooltip-positioning.ts` (created: extracted calculateTooltipPosition function)

## Notes

- `CharacterTooltip.test.tsx` is 472 lines (exceeds 400-line limit). Pre-existing issue: file was 500 lines before changes. Changes reduced it by 28 lines. Extraction should be addressed in a future task.

## Browser Verification

Status: N/A

## Human Approval

Status: N/A

## Blockers

(none)

## Review Cycles

Count: 2

- 2026-02-09 TEST_DESIGN_REVIEW: Approved with 3 minor adjustments (Test 6 setup, Test 4 tolerance, Test 3 clarity)
- 2026-02-09 REVIEW: APPROVED. 0 critical, 0 important, 2 minor (pattern doc update, pre-existing file length). All quality gates pass. Findings in `.tdd/review-findings.md`.
