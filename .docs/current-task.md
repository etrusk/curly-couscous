# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-07: Remove per-skill maxInstances limit (COMPLETE, TDD/Claude Code) - Removed `maxInstances` from `SkillDefinition` interface and all SKILL_REGISTRY entries. Duplication now capped only by MAX_SKILL_SLOTS=10. Updated duplicateSkill store action, LoadoutTab/SkillRow/SkillsPanel canDuplicate logic. 11 test changes (2 delete, 4 rewrite, 3 rename, 2 add). 1336/1336 tests passing. spec.md updated.

- 2026-02-06: Remove duplicate button + auto-focus toggle (COMPLETE, TDD/Claude Code) - "Remove" button for duplicate skill instances (visible when instanceCount > 1). "Auto-focus battle" checkbox with localStorage persistence. 17 new tests. 1336/1336 tests passing. Smoke checks 29-31 added.

- 2026-02-06: Three-task cleanup session (COMPLETE, TDD/Claude Code) - Fixed selectMovementTargetData, migrated evaluateSelector to evaluateTargetCriterion, split PriorityTab.test.tsx. +6 new tests. 1319/1319 tests passing.

- 2026-02-06: Selector filters for conditional targeting (COMPLETE, TDD/Claude Code) - Optional `selectorFilter` with `hp_below`/`hp_above` filter types. 32 new tests. 1313/1313 tests passing. Smoke tests 26-28 added. ADR-015 created.

## Priority Next Tasks (from TDD session)

- [ ] LoadoutTab.test.tsx L297 "Slot Capacity" test creates only 3 skills but asserts assign buttons disabled as if slots are full (MAX_SKILL_SLOTS=10) — pre-existing incorrect test (found during: remove maxInstances, date: 2026-02-06)

## Next Steps
