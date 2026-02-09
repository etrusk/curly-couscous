# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-09: React 18 to 19 upgrade + React Compiler adoption (COMPLETE, TDD/Claude Code) - Upgraded react/react-dom to 19.2.4, @types/react to 19.2.13, @testing-library/react to 16.3.2. Added babel-plugin-react-compiler 1.0.0 and eslint-plugin-react-compiler. Fixed PlayControls.test.tsx fake timer patterns. Version bumped to 0.20.0. ADR-020 recorded. All 1434 tests pass, all quality gates pass.

- 2026-02-09: ARIA accessibility improvements (COMPLETE, TDD/Claude Code) - Added `role="meter"` with full ARIA attrs to HP bars in Token.tsx, `role="alert"` for terminal states in BattleStatusBadge.tsx, `.srOnly` CSS class. Extracted token-accessibility.test.tsx (8 tests). Updated WCAG 2.2 AA references in spec.md and architecture.md. 13 new tests, all quality gates pass.

- 2026-02-09: Delete legacy SkillsPanel and InventoryPanel components (COMPLETE, TDD/Claude Code) - Removed 8 dead-code files (~2000 lines). Updated 3 stale comments to reference CharacterPanel. All quality gates pass.

- 2026-02-09: UI/UX Visual Compliance Sweep Phase 3 -- Fix `--border-primary` + Component Token Migration (COMPLETE, TDD/Claude Code) - 40 token swaps across 8 files. Pure CSS + 1 TSX inline attribute. No tests needed.

## Next Steps

- [ ] Remove manual memoization (useMemo/useCallback) now redundant with React Compiler
- [ ] CSS theming functions: `light-dark()` for unified theme switching, `color-mix()` for opacity variants (whiff, cooldown)
- [ ] Set up Vitest Browser Mode config for SVG/component test subset
