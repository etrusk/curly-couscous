# TDD Session

## Task

Enhance Skill Priority sub-panel UI in Rule Evaluations component to improve transparency of AI decision-making.

**Scope**: Modify the `SkillPriorityList` component in `src/components/RuleEvaluations/RuleEvaluations.tsx` to:

1. Always show any higher priority skills that are not satisfied (with their rejection reasons)
2. Show an expandable section with remaining lower-priority skills
3. Maintain existing functionality for selected skill highlighting and collapsible sections

## Current Phase

WRITE_TESTS

## Phase History

- 2026-01-27 INIT: Started task "Enhance Skill Priority sub-panel UI"
- 2026-01-27 EXPLORE: Completed exploration phase - findings in .tdd/exploration.md
- 2026-01-27 PLAN: Completed plan phase - implementation plan in .tdd/plan.md, test designs in .tdd/test-designs.md
- 2026-01-27 WRITE_TESTS: Starting test implementation (RED phase)

## Key Decisions

1. **Grouping Logic Change**: Group skills by status (rejected+selected vs skipped) rather than by position relative to selected index
2. **Maintain Original Indices**: Keep 1-based numbering to preserve user's mental model of skill priority order
3. **Defer File Extraction**: Do not extract SkillPriorityList now; evaluate post-implementation if >400 lines
4. **Convert renderSkillListItems to SkillListItem Component**: Improve readability and enable per-item rendering with indices

## Documentation Used

- `.docs/spec.md`: Progressive disclosure design principle, transparency goal
- `.docs/architecture.md`: CSS Modules, functional components pattern
- `.docs/patterns/index.md`: Collapsible Section Pattern with `<details>/<summary>`
- `.docs/decisions/index.md`: No conflicts with ADR-001

## Files Analyzed

- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` (444 lines)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.module.css` (276 lines)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx` (155 lines)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` (195 lines)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-next-action.test.tsx` (262 lines)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` (125 lines)
- `/home/bob/Projects/auto-battler/src/engine/types.ts` - SkillEvaluationResult, CharacterEvaluationResult types
- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` - evaluateSkillsForCharacter function

## Blockers

[None]

## Review Cycles

Count: 0

## Documentation Recommendations

[None at this time - no new ADRs needed]

## Context Health

Last checked: 2026-01-27
Estimated utilization: moderate

## Next Phase

IMPLEMENT (RED) - Coder should implement tests first following designs in .tdd/test-designs.md

## Summary of Plan

### Core Change

Replace position-based skill grouping with status-based grouping:

- **Primary section**: Skills with `status === 'rejected'` + the selected skill
- **Expandable section**: Skills with `status === 'skipped'`

### Implementation Steps

1. Create `SkillListItem` component (extract from `renderSkillListItems`)
2. Modify `SkillPriorityList` to filter by status instead of slicing by index
3. Track original indices alongside evaluations using `{ evaluation, originalIndex }` tuples
4. Remove `start` attribute from collapsed `<ol>` (no longer needed)
5. Run existing tests to verify no regressions
6. Add new tests per test designs

### Files to Modify

1. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`
2. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`

### Edge Cases Covered

- No selected skill (idle) - all rejected, no expandable
- First skill selected - only selected visible, rest in expandable
- Last skill selected - all visible, no expandable
- Single skill - no expandable
- Mixed rejection reasons - all displayed correctly
