# TDD Session

## Task

Skill Expansion Session B -- Phases 4+5+6: Ranged Attack + distance/Dash + most_enemies_nearby

## Confirmed Scope

Add Ranged Attack skill to registry (Phase 4, zero engine changes). Add `distance` field to skill types and implement multi-step movement for Dash skill (Phase 5, engine changes). Add `most_enemies_nearby` criterion to selector system (Phase 6, engine changes). ~25 acceptance criteria across 3 phases.

## Acceptance Criteria

### Phase 4: Ranged Attack (Registry Only)

- Ranged Attack appears in skill registry with correct stats (range 4, damage 15, tickCost 1, cooldown 2)
- Can be assigned to characters via existing assignment system
- Fires and resolves using existing attack resolution
- Dodgeable (tickCost 1, creates 1-tick intent line)
- Cooldown 2 applied after use
- Hits targets at range 4

### Phase 5: `distance` Field + Dash

- Move still moves 1 hex (explicit distance: 1, backward compatible)
- Dash moves 2 hexes when path is clear
- Dash moves 1 hex if second step is blocked (partial movement)
- Dash moves 0 hexes if first step is blocked (blocked entirely)
- Dash respects blocker-wins collision rule per step
- Dash instant (tickCost 0) resolves same tick as decision
- Cooldown 3 applied after use
- Multi-step towards uses A\* pathfinding per step
- Multi-step away uses iterative best-hex selection per step

### Phase 6: `most_enemies_nearby` Criterion

- Selects the target with the most enemies within 2 hexes of them
- Ties broken by position (lower R then lower Q)
- Works with filter (filtered candidates only)
- Returns first valid target if all have equal counts
- Works for both enemy and ally target pools

## Current Phase

EXPLORE (COMPLETE) -> PLAN (COMPLETE) -> DESIGN_TESTS (COMPLETE) -> TEST_DESIGN_REVIEW (COMPLETE) -> WRITE_TESTS (COMPLETE) -> IMPLEMENT (COMPLETE) -> REVIEW (COMPLETE) -> SYNC_DOCS (COMPLETE)

## Phase History

- 2026-02-08 INIT -> EXPLORE
- 2026-02-08 EXPLORE COMPLETE (agent: explore, 7 exchanges, ~25K tokens)
- 2026-02-08 PLAN COMPLETE (agent: plan, 5 exchanges, ~35K tokens)
- 2026-02-08 DESIGN_TESTS COMPLETE (agent: test-designer, 5 exchanges, ~40K tokens)
- 2026-02-08 TEST_DESIGN_REVIEW COMPLETE (agent: test-reviewer, 5 exchanges, ~18K tokens)
- 2026-02-08 WRITE_TESTS COMPLETE (agent: coder, 14 exchanges, ~50K tokens)
- 2026-02-08 IMPLEMENT COMPLETE (agent: coder, 11 exchanges, ~80K tokens)
- 2026-02-08 REVIEW COMPLETE (agent: reviewer, 5 exchanges, ~25K tokens)
- 2026-02-08 SYNC_DOCS COMPLETE (agent: doc-syncer, 3 exchanges, ~20K tokens)

## Context Metrics

Orchestrator: ~10K/300K (3%)
Cumulative agent tokens: ~291K
Agent invocations: 8

### Agent History

| #   | Agent         | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                                        |
| --- | ------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | explore       | EXPLORE            | 7         | ~25K   | 32    | -        | COMPLETE | Mapped all 3 phases: registry, types, movement, selectors, UI                                                                |
| 2   | plan          | PLAN               | 5         | ~35K   | 12    | -        | COMPLETE | Ordered steps for all 3 phases, identified 12 files + 1 new, 2 new decisions                                                 |
| 3   | test-designer | DESIGN_TESTS       | 5         | ~40K   | 18    | -        | COMPLETE | 34 test cases across 4 files (2 existing, 2 new). Phases 4, 6, 5 in order.                                                   |
| 4   | test-reviewer | TEST_DESIGN_REVIEW | 5         | ~18K   | 14    | -        | COMPLETE | Fixed 3 hex math issues, added 1 missing test, total now 35 tests.                                                           |
| 5   | coder         | WRITE_TESTS        | 14        | ~50K   | 30    | -        | COMPLETE | 35 tests written across 5 files (1 modified, 4 new). 30 failing, 5 passing (expected).                                       |
| 6   | coder         | IMPLEMENT          | 11        | ~80K   | 35    | -        | COMPLETE | All 35 new tests + 1433 existing tests pass. Fixed 1 test setup bug (hex math), updated 2 pre-existing tests for new skills. |

### Action Log

- EXPLORE: Read 15+ source files, identified all touch points for Phase 4 (registry only), Phase 5 (types + movement pipeline + test helpers), Phase 6 (types + selectors + UI). Key findings: exhaustive switch guards, hardcoded criterion options in SkillRow, movement architecture split (decision vs resolution). Wrote exploration.md.
- PLAN: Designed 12-step implementation plan across 3 phases. Order: Phase 4 -> Phase 6 -> Phase 5. Key decisions: wrap computeMoveDestination for multi-step (not modify), hardcode 2-hex radius for most_enemies_nearby. ~12 files modified, 1 new test file. Wrote plan.md.
- DESIGN_TESTS: Designed 34 test cases: 6 for Phase 4 (Ranged Attack registry), 8 for Phase 6 (most_enemies_nearby criterion), 20 for Phase 5 (distance propagation + multi-step movement + Dash registry + integration). Tests in 4 files: skill-registry.test.ts (14), selectors-target-criterion.test.ts (8), game-movement-multistep.test.ts (8, NEW), game-actions.test.ts (4, NEW). Wrote test-designs.md.
- WRITE_TESTS: Implemented 35 test cases. Split skill-registry.test.ts (was 526 lines) into skill-registry.test.ts (400 lines, updated exports count) + skill-registry-new-skills.test.ts (141 lines, Phase 4+5 registry tests). Split selectors tests: selectors-most-enemies-nearby.test.ts (316 lines, Phase 6 criterion tests). Created game-movement-multistep.test.ts (356 lines, 9 multi-step tests) and game-actions.test.ts (130 lines, 4 integration tests). Red phase confirmed: 30 tests failing, 5 passing coincidentally.
- IMPLEMENT: Implemented all 3 phases. Phase 4: added ranged-attack to SKILL_REGISTRY. Phase 6: added most_enemies_nearby to Criterion type, implemented case in evaluateTargetCriterion with self-exclusion and 2-hex radius, updated UI dropdowns in SkillRow.tsx and SkillsPanel.tsx. Phase 5: added distance field to Skill and SkillDefinition types, set distance:1 on Move, added Dash entry, propagated distance in factory functions, updated createSkill test helper, implemented computeMultiStepDestination in game-movement.ts, wired into createSkillAction. Fixed 1 test setup bug (most_enemies_nearby basic test had incorrect enemy positions that made enemyD win instead of enemyB). Updated 2 pre-existing tests (InventoryPanel stats counts, PriorityTab empty-inventory) to account for new skills.

## Files Touched

- `.tdd/exploration.md` (created)
- `.tdd/plan.md` (created)
- `.tdd/session.md` (updated)
- `.tdd/test-designs.md` (created)
- `src/engine/skill-registry.test.ts` (modified -- updated exports count to 6, added ranged-attack and dash to ID list)
- `src/engine/skill-registry-new-skills.test.ts` (created -- Phase 4+5 Ranged Attack, distance, Dash registry tests)
- `src/engine/selectors-most-enemies-nearby.test.ts` (created, then fixed setup bug -- Phase 6 most_enemies_nearby criterion tests)
- `src/engine/game-movement-multistep.test.ts` (created -- Phase 5 multi-step movement tests)
- `src/engine/game-actions.test.ts` (created -- Phase 5 integration tests)
- `src/engine/skill-registry.ts` (modified -- added ranged-attack + dash entries, distance field on SkillDefinition and Move def, distance propagation in factory functions)
- `src/engine/types.ts` (modified -- added distance to Skill, most_enemies_nearby to Criterion)
- `src/engine/selectors.ts` (modified -- added most_enemies_nearby case in evaluateTargetCriterion)
- `src/engine/game-movement.ts` (modified -- added computeMultiStepDestination function)
- `src/engine/game-actions.ts` (modified -- wired multi-step into createSkillAction)
- `src/engine/game-test-helpers.ts` (modified -- added distance to createSkill helper)
- `src/components/CharacterPanel/SkillRow.tsx` (modified -- added most_enemies_nearby to criterion dropdown and cast)
- `src/components/SkillsPanel/SkillsPanel.tsx` (modified -- added most_enemies_nearby to TargetStrategy type and dropdown)
- `src/components/InventoryPanel/InventoryPanel.test.tsx` (modified -- updated counts for new skills)
- `src/components/CharacterPanel/PriorityTab-inventory.test.tsx` (modified -- added new skills to empty-inventory test)

## Browser Verification

Status: N/A (no UI-only changes requiring browser verification)

## Human Approval

Status: N/A

## Blockers

(none)

## Review Cycles

Count: 1
Verdict: PASS (0 CRITICAL, 0 IMPORTANT, 2 MINOR)

## Unrelated Issues

- `src/engine/selector-filter-integration.test.ts` exceeds 400-line limit (610 lines) -- pre-existing, not touched by this session.
