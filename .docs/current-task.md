# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-09: Phase 3 browser tests for CSS variable resolution and Token visual feedback (COMPLETE, TDD/Claude Code) - Added 12 browser tests across 2 files: theme.browser.test.tsx (7 tests for light-dark(), color-mix(), cascade, theme switching) and Token.browser.test.tsx (5 tests for selection glow, animation, :focus-visible, HP bar width). Discovered probe element technique for CSS custom property resolution. All 1470 tests pass (1448 unit + 22 browser), all quality gates pass.

- 2026-02-09: Extract CharacterTooltip.test.tsx (COMPLETE, TDD/Claude Code) - Split 473-line test file (14 tests) into CharacterTooltip-content.test.tsx (5 tests, content rendering) and CharacterTooltip-behavior.test.tsx (9 tests, portal/positioning/accessibility/hover). Pure reorganization, no test logic changes. All tests pass, all quality gates pass.

- 2026-02-09: Phase 2 browser tests + zero-rect fallback removal (COMPLETE, TDD/Claude Code) - Added 6 browser tests for Token SVG geometry and tooltip z-index stacking in BattleViewer. Extracted `calculateTooltipPosition` to `tooltip-positioning.ts`, removed zero-rect fallback from CharacterTooltip (browser tests validate real positioning). Converted 5 jsdom positioning tests to direct function calls. All 1458 tests pass (1448 unit + 10 browser), all quality gates pass.

- 2026-02-09: Vitest Browser Mode setup (COMPLETE, TDD/Claude Code) - Configured two-project Vitest workspace (unit + browser) with Playwright/Chromium. 4 proof-of-concept browser tests for CharacterTooltip positioning validate real getBoundingClientRect and viewport constraints. `.browser.test.tsx` naming convention. ADR-022 recorded. All 1452 tests pass (1448 unit + 4 browser), all quality gates pass.

## Next Steps

- [ ] Phase 4 browser tests: SVG markers, remaining DOM-dependent component behaviors
