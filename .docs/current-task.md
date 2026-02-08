# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

Skill Expansion Session C -- Phases 7+8: Kick (Interrupt) + Charge (NOT STARTED, TDD/Claude Code)

## Recent Completions

- 2026-02-08: Skill Expansion Session B -- Phases 4+5+6 (COMPLETE, TDD/Claude Code) - Added Ranged Attack (attack, range 4, damage 15, cooldown 2) and Dash (move, distance 2, tickCost 0, cooldown 3) to skill registry. Added `distance` field to Skill/SkillDefinition with `computeMultiStepDestination()` wrapper for multi-step movement. Added `most_enemies_nearby` criterion (2-hex radius, self-exclusion, position tiebreak). 16 source files modified, 4 new test files. 35 new tests, 1468/1468 passing.

- 2026-02-08: Skill Expansion Phase 3 -- New Trigger Conditions (COMPLETE, TDD/Claude Code) - Added trigger-context integration tests for `channeling`, `idle`, `targeting_ally` conditions with scope/qualifier variations. TriggerDropdown updated to expose all 8 conditions. TriggerDropdown.test.tsx split to resolve 400-line tech debt. 3 new engine test files (24 tests), 6 NOT modifier tests, 8 TriggerDropdown tests. 1434/1434 passing.

- 2026-02-08: Skill Expansion Phase 2 -- Unified Filter System (COMPLETE, TDD/Claude Code) - `SelectorFilter` replaced with `SkillFilter` using shared `evaluateConditionForCandidate()`. `Skill.selectorFilter` renamed to `Skill.filter`. Filter changed to pre-criterion pool narrowing. New conditions: `channeling`, `idle`, `targeting_me`, `targeting_ally` with qualifier support. 9 source files, 79 tests. 1396/1396 passing. ADR-016 added.

## Priority Next Tasks (from TDD session)

- [x] TriggerDropdown.test.tsx exceeds 400-line limit (454 lines, pre-existing) -- RESOLVED: split NOT toggle tests to TriggerDropdown-not-toggle.test.tsx (Phase 3, 2026-02-08)
- [ ] `src/engine/selector-filter-integration.test.ts` exceeds 400-line limit (610 lines, pre-existing) (found during: Phase 3 New Trigger Conditions, date: 2026-02-08)

## Next Steps

Skill Expansion remaining phases (see `.tdd/requirements.md` for acceptance criteria):

- [x] **Session B -- Phases 4+5+6**: Ranged Attack + distance/Dash + most_enemies_nearby (~25 criteria) -- COMPLETE
- [ ] **Session C -- Phases 7+8**: Kick (Interrupt) + Charge (~35 criteria)
