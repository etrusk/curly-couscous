# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-09: ARIA accessibility improvements (COMPLETE, TDD/Claude Code) - Added `role="meter"` with full ARIA attrs to HP bars in Token.tsx, `role="alert"` for terminal states in BattleStatusBadge.tsx, `.srOnly` CSS class. Extracted token-accessibility.test.tsx (8 tests). Updated WCAG 2.2 AA references in spec.md and architecture.md. Fixed 2 stale refs in .roo/rules/00-project.md. 13 new tests, all quality gates pass.

- 2026-02-09: Delete legacy SkillsPanel and InventoryPanel components (COMPLETE, TDD/Claude Code) - Removed 8 dead-code files (~2000 lines). Updated 3 stale comments to reference CharacterPanel. Cleaned architecture.md and current-task.md. All quality gates pass.

- 2026-02-09: UI/UX Visual Compliance Sweep Phase 3 -- Fix `--border-primary` + Component Token Migration (COMPLETE, TDD/Claude Code) - Fixed 18x undefined `--border-primary` -> `--border`, 9x `--surface-tertiary` -> `--surface-hover`, plus `--text-on-accent`, `--focus-ring`, hardcoded `color: white`, `border-radius`, `font-family` replacements. 40 token swaps across 8 files (CharacterPanel, RuleEvaluations, BattleViewer). Pure CSS + 1 TSX inline attribute. No tests needed. Legacy components (SkillsPanel, InventoryPanel) deferred.

- 2026-02-09: UI/UX Visual Compliance Sweep Phase 1+2 -- Token Foundation + Global Styles (COMPLETE, TDD/Claude Code) - Added 19 new terminal overlay CSS custom properties to all 3 theme blocks in `theme.css`. Updated `index.css` and `App.css`. ADR-019 recorded. 3 files modified.

## Next Steps

- [ ] Upgrade React 18 → 19
- [ ] Adopt React Compiler (requires React 19)
- [ ] CSS theming functions: `light-dark()` for unified theme switching, `color-mix()` for opacity variants (whiff, cooldown)
- [ ] Set up Vitest Browser Mode config for SVG/component test subset
