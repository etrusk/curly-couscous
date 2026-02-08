# Test Designs: Session B (Phases 4+5+6)

## Overview

Test designs for Skill Expansion Phases 4, 6, and 5 (in implementation order).
Total: 35 test cases across 4 test files.

---

## Phase 4: Ranged Attack (Registry Only)

### Test: registry-includes-ranged-attack

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: The SKILL_REGISTRY exports all 5 skills including ranged-attack after Phase 4 addition
- **Setup**: Import SKILL_REGISTRY. No mocks needed.
- **Assertions**:
  1. `SKILL_REGISTRY` has length 5
  2. Mapped IDs equal `["light-punch", "heavy-punch", "move-towards", "heal", "ranged-attack"]`
- **Justification**: The existing test at line 17 hardcodes the length and ID list. It must be updated to include the new skill, preventing silent regressions where the entry is removed or misordered. This is an update to the existing `"exports all skills"` test, not a new test.

---

### Test: ranged-attack-stats

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Ranged Attack registry entry has the correct intrinsic stats per spec
- **Setup**: Find `"ranged-attack"` in SKILL_REGISTRY. Add a new `describe("Ranged Attack")` block.
- **Assertions**:
  1. `actionType` is `"attack"`
  2. `tickCost` is `1`
  3. `range` is `4`
  4. `damage` is `15`
  5. `cooldown` is `2`
- **Justification**: Ensures the ranged attack has correct combat stats. tickCost 1 makes it dodgeable, range 4 enables backline damage, damage 15 balances against Heavy Punch, cooldown 2 prevents spam. Any incorrect value would break game balance.

---

### Test: ranged-attack-non-innate

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Ranged Attack is not innate (must be manually assigned)
- **Setup**: Find `"ranged-attack"` in SKILL_REGISTRY.
- **Assertions**:
  1. `innate` is `false`
- **Justification**: If innate were accidentally set to true, all characters would start with Ranged Attack, breaking the assignment system and game balance.

---

### Test: ranged-attack-no-behaviors

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Ranged Attack has no behavior options (attack skills have no towards/away)
- **Setup**: Find `"ranged-attack"` in SKILL_REGISTRY.
- **Assertions**:
  1. `behaviors` equals `[]`
  2. `defaultBehavior` equals `""`
- **Justification**: Attack skills must not have behaviors. If behaviors were accidentally added, the UI would show a behavior dropdown and the engine would try to process movement logic for an attack.

---

### Test: ranged-attack-default-targeting

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Ranged Attack defaults to targeting the nearest enemy with cell-based targeting
- **Setup**: Find `"ranged-attack"` in SKILL_REGISTRY.
- **Assertions**:
  1. `defaultTarget` is `"enemy"`
  2. `defaultCriterion` is `"nearest"`
  3. `targetingMode` is `"cell"`
- **Justification**: Wrong defaults would cause the skill to target allies or use character-based tracking, fundamentally breaking its intended use.

---

### Test: ranged-attack-createSkillFromDefinition

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `createSkillFromDefinition` correctly propagates ranged-attack stats to a Skill instance
- **Setup**: Find `"ranged-attack"` definition, call `createSkillFromDefinition()`.
- **Assertions**:
  1. Created skill has `damage` of `15`
  2. Created skill has `range` of `4`
  3. Created skill has `tickCost` of `1`
  4. Created skill has `actionType` of `"attack"`
  5. Created skill has `target` of `"enemy"`
  6. Created skill has `criterion` of `"nearest"`
- **Justification**: Factory function must correctly propagate intrinsic stats. A propagation bug would create skills with wrong damage, range, or action type, causing combat to behave incorrectly.

---

## Phase 6: `most_enemies_nearby` Criterion

### Test: most-enemies-nearby-basic-selection

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: Criterion selects the enemy candidate with the most other enemies within 2 hexes
- **Setup**: Create evaluator (friendly, at origin). Create 3 enemies: A at (4,0), B at (1,0), C at (-4,0). Place 2 additional enemies near B at (1,1) and (2,0). Counts (self-excluded): B has 2 nearby enemies ((1,1) at distance 1, (2,0) at distance 1). A has 1 nearby ((2,0) at distance 2; (1,1) is distance 3 from (4,0), (1,0) is distance 3). C has 0 nearby (all others are distance >= 4). All characters in array.
- **Assertions**:
  1. `evaluateTargetCriterion("enemy", "most_enemies_nearby", evaluator, allCharacters)` returns enemy B
- **Justification**: Core behavior test for the criterion. If counting logic is wrong, AoE-optimal targeting selects suboptimal targets.
- **Reviewer note**: Original setup used A at (3,0) which placed A within 2 hexes of both additional enemies AND B, giving A count=3 equal to B. Fixed by moving A to (4,0) and C to (-4,0) to create clear count differentiation.

---

### Test: most-enemies-nearby-tiebreak-by-position

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: When two candidates have equal nearby-enemy counts, tiebreak uses lower R then lower Q
- **Setup**: Create evaluator (friendly, at origin). Create 2 enemies: A at (1, -1) (R=-1), B at (-1, 1) (R=1). Both are each other's only nearby enemy (distance 2 between them). So both have count 1. Create no other enemies to keep counts equal.
- **Assertions**:
  1. `evaluateTargetCriterion("enemy", "most_enemies_nearby", evaluator, allCharacters)` returns enemy A (lower R wins: -1 < 1)
- **Justification**: Tiebreaking must be deterministic for replay consistency. Without this test, ties could produce nondeterministic results.

---

### Test: most-enemies-nearby-all-equal-counts

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: When all candidates have the same nearby-enemy count, the first by tiebreak (lower R, then lower Q) wins
- **Setup**: Create evaluator (friendly, at origin). Create 3 enemies far apart from each other (hex distance > 2 between all pairs): A at (0, -3), B at (3, 0), C at (-3, 3). Each has 0 nearby enemies.
- **Assertions**:
  1. Result is enemy A (R=-3 is lowest)
- **Justification**: Ensures graceful handling of the degenerate case where criterion provides no differentiation, falling back to deterministic tiebreak.

---

### Test: most-enemies-nearby-with-filter

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: Criterion operates on the pre-narrowed candidate pool from candidateFilter function, not the full pool
- **Setup**: Create evaluator (friendly, at origin). Create 5 enemies: A at (1,0) hp=100, B at (-4,0) hp=30, C at (1,-1) hp=30, D at (2,0) hp=100, E at (1,1) hp=100. Pass `candidateFilter: (c) => c.hp < 50` which keeps only B and C as candidates. Nearby enemy counts (using ALL enemies, self-excluded): B at (-4,0) has 0 nearby (all others distance >= 4). C at (1,-1) has 3 nearby (A at distance 1, D at distance 2, E at distance 2). C wins with highest count among filtered candidates.
- **Assertions**:
  1. `evaluateTargetCriterion("enemy", "most_enemies_nearby", evaluator, allCharacters, candidateFilter)` returns enemy C (highest count in filtered pool)
- **Justification**: Filter must narrow the candidate pool BEFORE criterion evaluation. The counting still considers ALL enemies (not just candidates) when tallying nearby enemies. If criterion ran on the unfiltered pool, A would be selected despite not matching the filter.
- **Reviewer note**: Clarified that the 5th parameter is a `candidateFilter` function `(c: Character) => boolean`, matching the actual function signature. Added concrete positions with verifiable hex math. Clarified that counting considers all enemies, not just filtered candidates.

---

### Test: most-enemies-nearby-enemy-target-pool

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: When targeting enemies, counts enemies (evaluator's opposing faction) near each enemy candidate, excluding the candidate itself from its own count
- **Setup**: Create friendly evaluator. Create 3 enemies clustered together: A at (1,0), B at (2,0), C at (1,1). Enemy A has B (distance 1) and C (distance 1) nearby = 2. Enemy B has A (distance 1) and C (distance 1) nearby = 2. Enemy C has A (distance 1) and B (distance 1) nearby = 2. All have equal counts, so tiebreak applies.
- **Assertions**:
  1. All 3 candidates have count 2 (self-exclusion works correctly)
  2. Result is enemy A (tiebreak: A has R=0, B has R=0, C has R=1. Between A and B: both R=0, A has Q=1 vs B has Q=2. A wins with lowest Q.)
- **Justification**: Critical self-exclusion test. Without `e.id !== candidate.id`, each enemy would count itself as nearby, inflating all counts by 1. This test verifies the self-exclusion works correctly.

---

### Test: most-enemies-nearby-ally-target-pool

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: When targeting allies, counts enemies (opposing faction to evaluator) near each ally candidate
- **Setup**: Create friendly evaluator at (0,0). Create 2 friendly allies: A at (2,0), B at (-2,0). Create 2 enemies: E1 at (3,0) (within 2 hexes of ally A), E2 at (2,1) (within 2 hexes of ally A). Ally A has 2 enemies nearby. Ally B has 0 enemies nearby.
- **Assertions**:
  1. `evaluateTargetCriterion("ally", "most_enemies_nearby", evaluator, allCharacters)` returns ally A
- **Justification**: Verifies that "enemies" in the criterion means the evaluator's opposing faction, not the candidate's opposing faction. For ally targeting, this enables finding the ally in the most danger.

---

### Test: most-enemies-nearby-single-candidate

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: Returns the only candidate when there is exactly one, regardless of nearby count
- **Setup**: Create evaluator (friendly). Create 1 enemy at (3,0) with no other enemies nearby.
- **Assertions**:
  1. `evaluateTargetCriterion("enemy", "most_enemies_nearby", evaluator, allCharacters)` returns that single enemy
- **Justification**: Edge case guard. Ensures the criterion does not return null when exactly one valid candidate exists, even with a nearby count of 0.

---

### Test: most-enemies-nearby-no-candidates

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: Returns null when no valid candidates exist
- **Setup**: Create evaluator (friendly). No enemies in allCharacters.
- **Assertions**:
  1. `evaluateTargetCriterion("enemy", "most_enemies_nearby", evaluator, [evaluator])` returns `null`
- **Justification**: Standard null guard. Ensures criterion gracefully handles empty candidate pools without throwing.

---

## Phase 5: `distance` Field + Dash

### Subgroup: `distance` Field Propagation

### Test: move-has-distance-1

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Move definition in the registry has explicit `distance: 1`
- **Setup**: Find `"move-towards"` in SKILL_REGISTRY.
- **Assertions**:
  1. `distance` is `1`
- **Justification**: Making the implicit distance explicit is a prerequisite for parameterized movement. If distance is missing from Move, the multi-step logic would not know Move should only go 1 step.

---

### Test: getDefaultSkills-propagates-distance

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `getDefaultSkills()` propagates the distance field from registry definition to created Skill
- **Setup**: Call `getDefaultSkills()`, find Move in the result.
- **Assertions**:
  1. Move skill has `distance` of `1`
- **Justification**: If distance is not propagated by the factory function, runtime skills would have `undefined` distance, and the multi-step wrapper would default to 1 (correct by accident for Move, but broken for Dash). This test catches the propagation gap.

---

### Test: createSkillFromDefinition-propagates-distance

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `createSkillFromDefinition()` propagates distance from definition to Skill
- **Setup**: Find `"move-towards"` definition, call `createSkillFromDefinition()`.
- **Assertions**:
  1. Created skill has `distance` of `1`
- **Justification**: Same as above but for the assignment-path factory function. Both factory functions must propagate distance.

---

### Test: skills-without-distance-have-undefined

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Skills that do not define distance (Light Punch, Heavy Punch, Heal) have `undefined` distance on their definitions
- **Setup**: Find light-punch, heavy-punch, heal in SKILL_REGISTRY.
- **Assertions**:
  1. Light Punch `distance` is `undefined`
  2. Heavy Punch `distance` is `undefined`
  3. Heal `distance` is `undefined`
- **Justification**: Guard test ensuring non-movement skills do not accidentally gain a distance field, which could cause the engine to apply multi-step logic to attacks or heals.

---

### Subgroup: Multi-Step Movement (`computeMultiStepDestination`)

### Test: distance-1-same-as-single-step

- **File**: `src/engine/game-movement-multistep.test.ts` (NEW FILE)
- **Type**: unit
- **Verifies**: `computeMultiStepDestination` with distance=1 returns the same result as `computeMoveDestination`
- **Setup**: Create mover at (0,0), target at (3,0). No obstacles. Call both `computeMoveDestination` and `computeMultiStepDestination` with distance=1.
- **Assertions**:
  1. Both return `{q: 1, r: 0}`
  2. Results are deeply equal
- **Justification**: Backward compatibility test. Multi-step with distance 1 must produce identical results to single-step, ensuring no regression in existing movement behavior.

---

### Test: distance-2-towards-clear-path

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: With clear path and distance=2, mover advances 2 hexes toward target
- **Setup**: Create mover at (0,0), target at (3,0). No obstacles between them.
- **Assertions**:
  1. `computeMultiStepDestination(mover, target, "towards", allChars, 2)` returns `{q: 2, r: 0}`
- **Justification**: Core multi-step behavior. If the iterative loop does not advance the simulated position, the mover would only move 1 hex.

---

### Test: distance-2-towards-second-step-blocked

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: When the second step is blocked, mover only advances 1 hex (partial movement)
- **Setup**: Create mover at (0,0), target at (3,0). Place blocker at (2,0). Step 1 reaches (1,0). Step 2 tries to go to (2,0) but blocker is there; pathfinding routes around but the nearest unblocked cell is still 1 step away. The key is that the direct path is blocked.
- **Assertions**:
  1. Result is NOT `{q: 0, r: 0}` (moved at least 1 step)
  2. Result is NOT `{q: 2, r: 0}` (blocker prevents direct second step)
  3. `hexDistance(result, mover.position)` is between 1 and 2 (partial movement)
- **Justification**: Tests per-step blocking during decision phase. If the wrapper does not check obstacles per step, the mover would teleport through blockers.

---

### Test: distance-2-towards-first-step-blocked

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: When the first step is completely blocked (all neighbors occupied), mover stays at origin
- **Setup**: Create mover at (0,0), target at (3,0). Place blockers on ALL 6 hex neighbors of (0,0): (1,0), (-1,0), (0,1), (0,-1), (1,-1), (-1,1). No valid first step.
- **Assertions**:
  1. `computeMultiStepDestination(mover, target, "towards", allChars, 2)` returns `{q: 0, r: 0}` (stays in place)
- **Justification**: Edge case where movement is entirely prevented. The wrapper must detect that step 1 returned the same position and stop iterating.

---

### Test: distance-2-away-clear-path

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: Away mode with distance=2 moves 2 hexes away from target
- **Setup**: Create mover at (0,0), target at (2,0). No obstacles.
- **Assertions**:
  1. Result position has `hexDistance(result, target.position)` greater than `hexDistance(mover.position, target.position)` (moved further away)
  2. `hexDistance(result, mover.position)` equals 2 (moved exactly 2 steps)
- **Justification**: Multi-step away mode must iterate the composite-scoring single-step logic twice. If only one step is taken, the character would not escape far enough.

---

### Test: distance-2-away-second-step-blocked

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: Away mode with distance=2, when second step is blocked, results in partial movement (1 step away)
- **Setup**: Create mover at (0,0), target at (2,0). Surround the best first-step-away position's neighbors with blockers so the second step from that position has limited or no options further away. Simpler setup: place enough blockers to constrain second step.
- **Assertions**:
  1. Result is NOT `{q: 0, r: 0}` (at least first step succeeded)
  2. `hexDistance(result, mover.position)` is at least 1
- **Justification**: Partial movement for away mode must work the same as towards mode -- stop advancing when stuck.

---

### Test: distance-2-away-first-step-blocked

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: Away mode with distance=2, when all neighbors are blocked, mover stays at origin
- **Setup**: Create mover at (0,0), target at (2,0). Place blockers on ALL 6 hex neighbors of (0,0): (1,0), (-1,0), (0,1), (0,-1), (1,-1), (-1,1). No valid first step in any direction.
- **Assertions**:
  1. `computeMultiStepDestination(mover, target, "away", allChars, 2)` returns `{q: 0, r: 0}` (stays in place)
- **Justification**: Edge case from plan Step 5.6 item 7. Although the towards fully-blocked test covers the same `generateValidCandidates` code path, away mode includes the current position as a candidate. This test verifies that staying in place is correctly returned when all movement options are blocked.
- **Reviewer note**: Added to match plan Step 5.6 which lists this as a separate test case. Away mode handles candidates differently (includes current position), so this is not fully redundant with the towards case.

---

### Test: distance-undefined-defaults-to-1

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: When distance parameter is omitted (undefined), function defaults to 1 step
- **Setup**: Create mover at (0,0), target at (3,0). Call `computeMultiStepDestination` without the distance parameter.
- **Assertions**:
  1. Result equals `{q: 1, r: 0}` (single step, same as distance=1)
- **Justification**: The function signature uses `distance: number = 1` as default. This test ensures the default is correct and existing callers that omit the parameter get backward-compatible behavior.

---

### Test: distance-1-away-backward-compat

- **File**: `src/engine/game-movement-multistep.test.ts`
- **Type**: unit
- **Verifies**: Away mode with distance=1 produces identical result to single-step `computeMoveDestination`
- **Setup**: Create mover at (0,0), target at (2,0). Call both `computeMoveDestination(mover, target, "away", allChars)` and `computeMultiStepDestination(mover, target, "away", allChars, 1)`.
- **Assertions**:
  1. Both return the same position
- **Justification**: Backward compatibility guard for away mode. Multi-step wrapper with distance=1 must not alter single-step away behavior.

---

### Subgroup: Dash Registry Entry

### Test: registry-includes-dash

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: The SKILL_REGISTRY exports all 6 skills including dash after Phase 5 addition
- **Setup**: Import SKILL_REGISTRY. No mocks needed.
- **Assertions**:
  1. `SKILL_REGISTRY` has length 6
  2. Mapped IDs include `"dash"`
- **Justification**: Update to the existing count/ID test to include Dash. Note: this test combines with the Phase 4 update -- the final state after both phases is length 6 with both ranged-attack and dash.

---

### Test: dash-stats

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Dash registry entry has the correct stats per spec
- **Setup**: Find `"dash"` in SKILL_REGISTRY. Add a new `describe("Dash")` block.
- **Assertions**:
  1. `id` is `"dash"`
  2. `actionType` is `"move"`
  3. `tickCost` is `0`
  4. `range` is `1`
  5. `distance` is `2`
  6. `cooldown` is `3`
- **Justification**: tickCost 0 makes Dash instant (resolves same tick). distance 2 enables 2-step movement. cooldown 3 prevents overuse. Any incorrect stat breaks Dash's intended game role.

---

### Test: dash-behaviors

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Dash has both towards and away behaviors with away as default
- **Setup**: Find `"dash"` in SKILL_REGISTRY.
- **Assertions**:
  1. `behaviors` equals `["towards", "away"]`
  2. `defaultBehavior` is `"away"`
  3. `innate` is `false`
- **Justification**: Dash default is "away" (escape skill), unlike Move which defaults to "towards". If behaviors are missing, the UI would not show direction options. If defaultBehavior were wrong, newly assigned Dash would charge toward enemies instead of fleeing.

---

### Test: dash-default-targeting

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Dash defaults to targeting nearest enemy
- **Setup**: Find `"dash"` in SKILL_REGISTRY.
- **Assertions**:
  1. `defaultTarget` is `"enemy"`
  2. `defaultCriterion` is `"nearest"`
- **Justification**: Dash targets the nearest enemy to determine movement direction (towards or away from them). Wrong defaults would cause Dash to flee from allies or target the wrong reference point.

---

### Test: dash-createSkillFromDefinition-propagates-distance

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `createSkillFromDefinition` propagates distance=2 from Dash definition to created Skill
- **Setup**: Find `"dash"` definition, call `createSkillFromDefinition()`.
- **Assertions**:
  1. Created skill has `distance` of `2`
  2. Created skill has `tickCost` of `0`
  3. Created skill has `actionType` of `"move"`
- **Justification**: If distance is not propagated, the created Dash skill would have `undefined` distance, defaulting to 1-step movement and making Dash functionally identical to Move.

---

### Subgroup: Integration (createSkillAction with distance)

### Test: move-skill-single-step-destination

- **File**: `src/engine/game-actions.test.ts` (NEW FILE)
- **Type**: integration
- **Verifies**: `createSkillAction` with a Move skill (distance 1) produces a single-step destination, backward compatible with existing behavior
- **Setup**: Create a mover character at (0,0) with a Move skill (distance: 1, behavior: "towards"). Create target at (3,0). Call `createSkillAction(moveSkill, mover, target, tick, allCharacters)`.
- **Assertions**:
  1. `action.targetCell` equals `{q: 1, r: 0}`
  2. `action.type` is `"move"`
- **Justification**: Backward compatibility test ensuring that adding distance support does not alter existing Move behavior. If the branching logic for `distance > 1` has an off-by-one, regular Move could break.

---

### Test: dash-skill-two-step-destination

- **File**: `src/engine/game-actions.test.ts`
- **Type**: integration
- **Verifies**: `createSkillAction` with a Dash skill (distance 2) produces a two-step destination via `computeMultiStepDestination`
- **Setup**: Create a mover at (0,0) with a Dash skill (distance: 2, behavior: "towards"). Create target at (4,0). No obstacles. Call `createSkillAction`.
- **Assertions**:
  1. `action.targetCell` equals `{q: 2, r: 0}` (2 steps toward target)
  2. `action.type` is `"move"`
- **Justification**: End-to-end integration test ensuring the wiring in `createSkillAction` correctly delegates to multi-step computation when distance > 1.

---

### Test: dash-skill-blocked-second-step

- **File**: `src/engine/game-actions.test.ts`
- **Type**: integration
- **Verifies**: `createSkillAction` with Dash produces partial movement when second step is blocked
- **Setup**: Create mover at (0,0) with Dash skill (distance: 2, behavior: "towards"). Create target at (4,0). Place blocker at (2,0). Call `createSkillAction`.
- **Assertions**:
  1. `action.targetCell` is NOT `{q: 0, r: 0}` (at least 1 step moved)
  2. `action.targetCell` is NOT `{q: 2, r: 0}` (blocked)
- **Justification**: Integration-level verification that partial movement propagates through the action creation pipeline. Catches wiring bugs where the multi-step function is called but its result is ignored.

---

### Test: dash-tickCost-0-resolves-same-tick

- **File**: `src/engine/game-actions.test.ts`
- **Type**: integration
- **Verifies**: Dash with tickCost 0 creates an action that resolves at the same tick it started
- **Setup**: Create mover with Dash skill (tickCost: 0, distance: 2). Create target. Call `createSkillAction` at tick 5.
- **Assertions**:
  1. `action.startedAtTick` equals `5`
  2. `action.resolvesAtTick` equals `5` (tick + tickCost 0)
- **Justification**: Instant resolution is critical for Dash's gameplay role as an escape skill. If resolvesAtTick were tick+1, the character would have a 1-tick vulnerability window, defeating the purpose of instant movement.

---

## Summary

| Phase     | File                                               | Test Count           |
| --------- | -------------------------------------------------- | -------------------- |
| Phase 4   | `src/engine/skill-registry.test.ts`                | 6 (1 update + 5 new) |
| Phase 6   | `src/engine/selectors-target-criterion.test.ts`    | 8                    |
| Phase 5   | `src/engine/skill-registry.test.ts`                | 8 (1 update + 7 new) |
| Phase 5   | `src/engine/game-movement-multistep.test.ts` (NEW) | 9                    |
| Phase 5   | `src/engine/game-actions.test.ts` (NEW)            | 4                    |
| **Total** |                                                    | **35**               |

## Implementation Order for Tests

1. **Phase 4 tests first** (skill-registry.test.ts): Update registry count to 5, add Ranged Attack describe block
2. **Phase 6 tests second** (selectors-target-criterion.test.ts): Add `most_enemies_nearby` describe block
3. **Phase 5 tests last** (skill-registry.test.ts + 2 new files): Update registry count to 6, add distance propagation tests, add Dash describe block, create game-movement-multistep.test.ts, create game-actions.test.ts

## Notes on Conventions

- All tests use `describe/it/expect` from vitest (no `test()`)
- Character creation uses `createCharacter` from `./game-test-helpers` (movement tests) or `./selectors-test-helpers` (selector tests)
- Skill creation uses `createSkill` from `./game-test-helpers`
- Registry tests follow the pattern: find skill by ID, assert individual fields
- Selector tests follow the pattern: create evaluator + candidates, call `evaluateTargetCriterion`, assert return value
- Movement tests follow the pattern: create mover + target + optional blockers, call computation function, assert Position result
- Hex positions use `{q, r}` axial coordinates
- Tiebreak assertions reference lower R then lower Q ordering
