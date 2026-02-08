# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-08: Skill Expansion Phase 2 -- Unified Filter System (COMPLETE, TDD/Claude Code) - Replaced `SelectorFilter`/`SelectorFilterType` with `SkillFilter` using shared condition evaluator. `Skill.selectorFilter` renamed to `Skill.filter`. Filter evaluation changed from post-criterion single-target validation to pre-criterion pool narrowing with `filter_failed` rejection. Shared `evaluateConditionForCandidate()` extracted in triggers.ts, used by both triggers and filters. New filter conditions: `channeling`, `idle`, `targeting_me`, `targeting_ally`. Qualifier support for channeling. 15 source files modified, 79 tests across 5 files. 1396/1396 tests passing. ADR-016 added.

- 2026-02-07: Skill Expansion Phase 1 -- Unified Trigger System (COMPLETE, TDD/Claude Code) - Refactored trigger type system: old `{ type, value?, negated? }` replaced with unified `{ scope, condition, conditionValue?, qualifier?, negated? }`. `Skill.triggers[]` replaced with `Skill.trigger`. New types: TriggerScope, ConditionType, ConditionQualifier. 10 source files modified, 50+ test files migrated. 1361/1361 tests passing.

- 2026-02-07: Battle UI Visual Polish (COMPLETE, TDD/Claude Code) - Four visual improvements: cooldown badges, whiff overlays, targeting line outlines, token z-ordering. 3 new files, 11 modified. 1357/1357 tests passing.

## Priority Next Tasks (from TDD session)

- [ ] TriggerDropdown.test.tsx exceeds 400-line limit (454 lines, pre-existing) (found during: Phase 2 Unified Filter System, date: 2026-02-08)

## Next Steps

Skill Expansion Phases 3-8 (see `.tdd/requirements.md` for acceptance criteria):

- [ ] **Session A remainder -- Phase 3**: New Trigger Conditions
- [ ] **Session B -- Phases 4+5+6**: Ranged Attack + distance/Dash + most_enemies_nearby (~25 criteria)
- [ ] **Session C -- Phases 7+8**: Kick (Interrupt) + Charge (~35 criteria)
