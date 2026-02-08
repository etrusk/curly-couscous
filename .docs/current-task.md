# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-08: Skill Expansion Phase 3 -- New Trigger Conditions (COMPLETE, TDD/Claude Code) - Added trigger-context integration tests for `channeling`, `idle`, `targeting_ally` conditions with scope/qualifier variations. TriggerDropdown updated to expose all 8 conditions. TriggerDropdown.test.tsx split to resolve 400-line tech debt. 3 new engine test files (24 tests), 6 NOT modifier tests, 8 TriggerDropdown tests. 1434/1434 passing.

- 2026-02-08: Skill Expansion Phase 2 -- Unified Filter System (COMPLETE, TDD/Claude Code) - `SelectorFilter` replaced with `SkillFilter` using shared `evaluateConditionForCandidate()`. `Skill.selectorFilter` renamed to `Skill.filter`. Filter changed to pre-criterion pool narrowing. New conditions: `channeling`, `idle`, `targeting_me`, `targeting_ally` with qualifier support. 9 source files, 79 tests. 1396/1396 passing. ADR-016 added.

- 2026-02-07: Skill Expansion Phase 1 -- Unified Trigger System (COMPLETE, TDD/Claude Code) - Refactored trigger type system: old `{ type, value?, negated? }` replaced with unified `{ scope, condition, conditionValue?, qualifier?, negated? }`. `Skill.triggers[]` replaced with `Skill.trigger`. New types: TriggerScope, ConditionType, ConditionQualifier. 10 source files modified, 50+ test files migrated. 1361/1361 tests passing.

## Priority Next Tasks (from TDD session)

- [x] TriggerDropdown.test.tsx exceeds 400-line limit (454 lines, pre-existing) -- RESOLVED: split NOT toggle tests to TriggerDropdown-not-toggle.test.tsx (Phase 3, 2026-02-08)
- [ ] `src/engine/selector-filter-integration.test.ts` exceeds 400-line limit (610 lines, pre-existing) (found during: Phase 3 New Trigger Conditions, date: 2026-02-08)

## Next Steps

Skill Expansion Phases 4-8 (see `.tdd/requirements.md` for acceptance criteria):

- [ ] **Session B -- Phases 4+5+6**: Ranged Attack + distance/Dash + most_enemies_nearby (~25 criteria)
- [ ] **Session C -- Phases 7+8**: Kick (Interrupt) + Charge (~35 criteria)
