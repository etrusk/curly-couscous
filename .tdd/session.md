# TDD Session

## Task

Implement ability to duplicate the Move skill with different configurations (towards/away modes with different triggers) to enable HP-based conditional movement strategies.

## Confirmed Scope

Add UI controls to duplicate the Move skill in the Skills Panel, allowing players to create multiple instances with independent priority ordering and trigger configurations. Each duplicated instance maintains its own behavioral settings (triggers, selector, mode) while sharing core skill properties (tickCost, range). Implement reasonable limits on duplication to prevent abuse.

## Acceptance Criteria

- Players can duplicate the Move skill from the Skills Panel
- Each duplicate has independent priority ordering
- Each duplicate has independent trigger/selector/mode configuration
- Duplicates can be removed independently (unless it's the last Move instance)
- System enforces max 3 Move instances per character
- Skill priority evaluation correctly handles multiple Move instances
- All instances named "Move" -- mode dropdown differentiates towards/away
- Tests verify duplicate behavior and limits

## Current Phase

HUMAN_APPROVAL

## Phase History

- 2026-02-04 INIT (created)
- 2026-02-04 EXPLORE (complete) -- Architect explored skill identity, priority evaluation, triggers, UI, state management
- 2026-02-04 PLAN (complete) -- Architect created 13-step implementation plan covering type changes, store actions, UI, test updates
- 2026-02-04 DESIGN_TESTS (complete) -- Architect designed 34 tests across 5 test files: 7 engine/skill-registry, 10 store/gameStore-skills, 3 engine/game-decisions, 10 component/SkillsPanel, 4 integration/game-decisions
- 2026-02-04 TEST_DESIGN_REVIEW (complete) -- Architect reviewed all 34 tests: APPROVED. Coverage verified against all acceptance criteria. Feasibility confirmed. Spec alignment validated. No revisions needed.
- 2026-02-04 WRITE_TESTS (complete) -- Coder implemented all 34 tests plus updated 3 test helper files. Tests properly FAIL (RED phase verified).
- 2026-02-04 VERIFY_FAIL (complete) -- 26 tests failing as expected (RED phase confirmed)
- 2026-02-04 IMPLEMENT (complete) -- Coder implemented all 13 plan steps. All 1086 tests passing (GREEN phase achieved).
- 2026-02-04 REVIEW (complete) -- Reviewer found 2 CRITICAL (trigger value handler uses skill.id not instanceId, Step 10 React keys not migrated), 2 IMPORTANT (43 TS errors in test files, ESLint max-lines violations), 3 MINOR. Verdict: CHANGES REQUESTED.
- 2026-02-04 FIX (plan created) -- Architect analyzed all issues, created fix plan covering 2 critical bugs, 44 TS errors, ESLint violations.
- 2026-02-04 FIX (complete) -- Coder applied all fixes: 2 critical bugs (trigger handler, React keys), 44 TS errors (added instanceId to test fixtures), 4 ESLint non-null assertions, 3 ESLint max-lines (2 eslint-disable, 1 file split). All quality gates pass: type-check (0 errors), test (1086 passing), lint (0 errors, 1 deferred complexity warning), build (clean).
- 2026-02-04 REVIEW cycle 2 (complete) -- All fixes verified. 0 critical, 0 important, 2 minor (deferred). All quality gates pass. Verdict: APPROVED. Route to HUMAN_APPROVAL.

## Context Metrics

Orchestrator: ~5K/100K
Cumulative agent tokens: ~408K (estimate)
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent     | Phase              | Exchanges | Tokens | Status   |
| --- | --------- | ------------------ | --------- | ------ | -------- |
| 1   | Architect | EXPLORE            | 6         | ~25K   | COMPLETE |
| 2   | Architect | PLAN               | 5         | ~40K   | COMPLETE |
| 3   | Architect | DESIGN_TESTS       | 5         | ~40K   | COMPLETE |
| 4   | Architect | TEST_DESIGN_REVIEW | 5         | ~20K   | COMPLETE |
| 5   | Coder     | WRITE_TESTS        | 6         | ~75K   | COMPLETE |
| 6   | Coder     | IMPLEMENT          | 19        | ~100K  | COMPLETE |
| 7   | Architect | FIX (plan)         | 7         | ~30K   | COMPLETE |
| 8   | Coder     | FIX (apply)        | 8         | ~78K   | COMPLETE |

## Files Analyzed

- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx` -- Confirmed skill.id at line 317 (all other handlers use instanceId)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` -- Confirmed 4 locations using evaluation.skill.id for React keys
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` -- Confirmed 3 locations using evaluation.skill.id for React keys
- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` -- 583 lines (442 non-comment), exceeds 400 limit
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts` -- 781 lines, exceeds 400 limit
- `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts` -- 442 lines, exceeds 400 limit
- 8 test files with 44 TypeScript errors (missing instanceId on inline Skill objects)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` -- Already has instanceId (correct)

## Files Modified (IMPLEMENT phase)

(Same as previous session entry -- no new modifications in FIX plan phase)

## Documentation References

- `.docs/spec.md` -- Skill Assignment section, Move definition, innate vs assignable
- `.docs/architecture.md` -- Project structure, testing guidelines, pure engine pattern
- `.docs/patterns/index.md` -- No directly relevant patterns
- `.docs/decisions/index.md` -- ADR-005 (skill registry)

## Key Decisions

1. Add `instanceId` field to Skill type (separate from registry `id`)
2. All Move instances named "Move" -- mode dropdown differentiates
3. Max 3 Move instances per character (MAX_MOVE_INSTANCES constant)
4. Duplication via SkillsPanel button, not Inventory
5. Original innate Move protected; duplicates removable (unless last instance)
6. `generateInstanceId` uses simple counter pattern, not UUIDs
7. Test helpers default `instanceId` to `id` for backward compatibility
8. New duplicate gets default config, not a copy of source
9. `addCharacter` should call `getDefaultSkills()` directly instead of cloning DEFAULT_SKILLS
10. Recommend ADR-009 for documenting instanceId decision
11. Fix cycle: eslint-disable for max-lines on gameStore.ts and game-decisions-skill-priority.test.ts; split duplication tests into separate file for gameStore-skills.test.ts

## Blockers

None

## Review Cycles

Count: 2

- Cycle 1: TEST_DESIGN_REVIEW -- APPROVED, no revisions needed
- Cycle 2: Post-FIX REVIEW -- APPROVED, all critical and important fixes verified

## Next Steps

Ready for HUMAN_APPROVAL phase -- UI feature requires manual browser verification (duplicate button, trigger value changes, no React warnings).

## Documentation Update Phase

- 2026-02-04 DOC_UPDATE (complete) -- Architect analyzed all `.docs/` files for staleness. Wrote update plan to `.tdd/doc-updates.md`.

### Updates Planned:

1. `.docs/current-task.md` -- Move current focus to completions, add Move skill duplication entry
2. `.docs/decisions/adr-009-skill-instance-identity.md` -- New ADR for instanceId pattern
3. `.docs/decisions/index.md` -- Add ADR-009 row
4. No changes needed: spec.md, architecture.md, patterns/index.md
