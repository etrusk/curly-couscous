# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-06: Remove duplicate button + auto-focus toggle (COMPLETE, TDD/Claude Code) - (1) "Remove" button for duplicate skill instances in SkillRow and LoadoutTab (visible when instanceCount > 1). (2) "Auto-focus battle" checkbox in header (default: off) controlling grid layout shift and Priority tab auto-switch during battle. accessibilityStore autoFocus with localStorage persistence. 17 new tests. 1336/1336 tests passing. Smoke checks 29-31 added.

- 2026-02-06: Three-task cleanup session (COMPLETE, TDD/Claude Code) - (1) Fixed selectMovementTargetData to use trigger-aware Move selection mirroring decision engine. (2) Migrated 26 evaluateSelector call sites across 8 test files to evaluateTargetCriterion; deleted evaluateSelector function and Selector type (~107 lines removed). (3) Split PriorityTab.test.tsx (667 lines) into PriorityTab-config.test.tsx (311 lines, 12 tests) and PriorityTab-battle.test.tsx (370 lines, 10 tests). +6 new tests. 1319/1319 tests passing.

- 2026-02-06: Selector filters for conditional targeting (COMPLETE, TDD/Claude Code) - Optional `selectorFilter` on skill instances with `hp_below`/`hp_above` filter types. Filter evaluates post-selector, pre-range-check. UI: "+ Filter" button in Priority tab, filter type dropdown + value input + remove button. 32 new tests (13 unit, 13 integration, 6 UI). 1313/1313 tests passing. Smoke tests 26-28 added. ADR-015 created.

- 2026-02-06: 5 UI gap fixes (COMPLETE, TDD/Claude Code) - Universal behavior dropdown (registry-driven), universal skill duplication (maxInstances 1->2 for light-punch/heavy-punch/heal), NOT trigger toggle UI, real battle evaluation in PriorityTab, compact battle view. 15 new tests + 4 existing updates. 1281/1281 tests passing. Smoke checks 24-25 added. spec.md maxInstances updated.

## Next Steps

- Extract gameStore-selectors.ts (482 lines, exceeds 400-line limit -- pre-existing)
