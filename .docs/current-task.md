# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-09: Vitest Browser Mode setup (COMPLETE, TDD/Claude Code) - Configured two-project Vitest workspace (unit + browser) with Playwright/Chromium. 4 proof-of-concept browser tests for CharacterTooltip positioning validate real getBoundingClientRect and viewport constraints. `.browser.test.tsx` naming convention. ADR-022 recorded. All 1452 tests pass (1448 unit + 4 browser), all quality gates pass.

- 2026-02-09: CSS `light-dark()` and `color-mix()` theme consolidation (COMPLETE, TDD/Claude Code) - Merged 3-block theming to 2-block + high-contrast using `light-dark()` for ~43 variables, `color-mix()` for 9+9 derived tokens. WhiffOverlay opacity replaced with `color-mix()` fill. Light block reduced to 1 line. ADR-021 recorded. All 1448 tests pass, all quality gates pass.

- 2026-02-09: Remove manual memoization redundant with React Compiler (COMPLETE, TDD/Claude Code) - Removed 5 useMemo and 3 useCallback calls across 7 files. React Compiler (ADR-020) handles all memoization automatically. Behavior-preserving refactor, zero useMemo/useCallback/React.memo remain in src/. All 1434 tests pass, all quality gates pass.

- 2026-02-09: React 18 to 19 upgrade + React Compiler adoption (COMPLETE, TDD/Claude Code) - Upgraded react/react-dom to 19.2.4, @types/react to 19.2.13, @testing-library/react to 16.3.2. Added babel-plugin-react-compiler 1.0.0 and eslint-plugin-react-compiler. Fixed PlayControls.test.tsx fake timer patterns. Version bumped to 0.20.0. ADR-020 recorded. All 1434 tests pass, all quality gates pass.

## Next Steps

- [ ] Phase 2 browser tests: Token hover SVG geometry, BattleViewer tooltip z-index
- [ ] Evaluate removing CharacterTooltip zero-rect fallback (now that browser tests validate real positioning)
