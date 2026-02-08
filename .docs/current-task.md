# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

No active task. Ready for next task. (TDD/Claude Code)

## Recent Completions

- 2026-02-09: UI/UX Visual Compliance Sweep Phase 3 -- Fix `--border-primary` + Component Token Migration (COMPLETE, TDD/Claude Code) - Fixed 18x undefined `--border-primary` -> `--border`, 9x `--surface-tertiary` -> `--surface-hover`, plus `--text-on-accent`, `--focus-ring`, hardcoded `color: white`, `border-radius`, `font-family` replacements. 40 token swaps across 8 files (CharacterPanel, RuleEvaluations, BattleViewer). Pure CSS + 1 TSX inline attribute. No tests needed. Legacy components (SkillsPanel, InventoryPanel) deferred.

- 2026-02-09: UI/UX Visual Compliance Sweep Phase 1+2 -- Token Foundation + Global Styles (COMPLETE, TDD/Claude Code) - Added 19 new terminal overlay CSS custom properties to all 3 theme blocks in `theme.css`. Updated `index.css` and `App.css`. ADR-019 recorded. 3 files modified.

- 2026-02-08: Cleanup Session -- test split, DeathEvent dedup, Dash defaultTrigger (COMPLETE, TDD/Claude Code) - Split `selector-filter-integration.test.ts` into 3 files. Fixed DeathEvent duplication on charge kills. Retrofitted Dash with `defaultTrigger`. 6 new test files, 2 source files modified. 29 new tests.

## Next Steps

- [ ] Migrate remaining undefined tokens in legacy components (SkillsPanel, InventoryPanel) or delete legacy components
- [ ] Fix pre-existing TypeScript errors (TS18048 in charge-events.test, TS2532 in interrupt.test)
- [ ] ARIA semantics: `role="meter"` on HP bars, `aria-live="polite"` for battle status (debounced), `role="alert"` for victory/defeat/death events
- [ ] Update spec/architecture to reference WCAG 2.2 AA as accessibility target
- [ ] Upgrade React 18 → 19
- [ ] Adopt React Compiler (requires React 19)
- [ ] CSS theming functions: `light-dark()` for unified theme switching, `color-mix()` for opacity variants (whiff, cooldown)
- [ ] Set up Vitest Browser Mode config for SVG/component test subset
