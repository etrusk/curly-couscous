# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-09: Phase 2 browser tests + zero-rect fallback removal (COMPLETE, TDD/Claude Code) - Added 6 browser tests for Token SVG geometry and tooltip z-index stacking in BattleViewer. Extracted `calculateTooltipPosition` to `tooltip-positioning.ts`, removed zero-rect fallback from CharacterTooltip (browser tests validate real positioning). Converted 5 jsdom positioning tests to direct function calls. All 1458 tests pass (1448 unit + 10 browser), all quality gates pass.

- 2026-02-09: Vitest Browser Mode setup (COMPLETE, TDD/Claude Code) - Configured two-project Vitest workspace (unit + browser) with Playwright/Chromium. 4 proof-of-concept browser tests for CharacterTooltip positioning validate real getBoundingClientRect and viewport constraints. `.browser.test.tsx` naming convention. ADR-022 recorded. All 1452 tests pass (1448 unit + 4 browser), all quality gates pass.

- 2026-02-09: CSS `light-dark()` and `color-mix()` theme consolidation (COMPLETE, TDD/Claude Code) - Merged 3-block theming to 2-block + high-contrast using `light-dark()` for ~43 variables, `color-mix()` for 9+9 derived tokens. WhiffOverlay opacity replaced with `color-mix()` fill. Light block reduced to 1 line. ADR-021 recorded. All 1448 tests pass, all quality gates pass.

- 2026-02-09: Remove manual memoization redundant with React Compiler (COMPLETE, TDD/Claude Code) - Removed 5 useMemo and 3 useCallback calls across 7 files. React Compiler (ADR-020) handles all memoization automatically. Behavior-preserving refactor, zero useMemo/useCallback/React.memo remain in src/. All 1434 tests pass, all quality gates pass.

## Next Steps

- [ ] Extract CharacterTooltip.test.tsx (473 lines, exceeds 400-line guideline)
- [ ] Phase 3 browser tests: additional component behaviors requiring real DOM
