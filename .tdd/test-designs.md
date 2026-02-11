# Test Designs: Plural Target Scopes (`enemies` / `allies`)

## Summary

13 tests across 3 test files covering the `"enemies"` and `"allies"` plural target feature. Tests verify movement computation against groups, selector guards for plural targets, multi-step plural movement, and integration through the decision pipeline.

**Review status**: APPROVED with corrections (reviewed 2026-02-11)

---

## Unit Tests: `src/engine/game-movement.test.ts`

These tests target the new `computePluralMoveDestination` function. They should be placed in a new `describe("computePluralMoveDestination")` block at the end of the existing test file.

### Test 1: away mode maximizes min-distance from enemy group

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: Away mode with multiple enemies picks the hex that maximizes `min(distance to each enemy) * escapeRoutes`, avoiding clustering toward any single threat.
- **Setup**:
  - Mover (friendly) at `{q: 0, r: 0}`
  - Enemy A at `{q: 2, r: -1}` (distance 2 from mover)
  - Enemy B at `{q: -1, r: 2}` (distance 2 from mover)
  - `allCharacters`: [mover, enemyA, enemyB]
  - Call `computePluralMoveDestination(mover, [enemyA, enemyB], "away", allCharacters)`
- **Assertions**:
  1. Result is a valid hex neighbor of mover (hexDistance from `{q:0, r:0}` is 0 or 1)
  2. The min-distance from result to either enemy is greater than or equal to the min-distance from `{q:0, r:0}` to either enemy (i.e., mover moved away from the closer threat, or stayed put if already optimal)
  3. Result is deterministic: calling the function a second time with the same inputs produces the same output
- **Justification**: Core acceptance criterion AC-4. Validates that away-mode scoring aggregates across all targets using min-distance rather than picking a single reference point. This is the primary new behavior differentiating plural from singular targeting. Asymmetric enemy placement ensures the min-distance metric meaningfully differs from a centroid approach.

---

### Test 2: away mode surrounded on three sides picks best escape

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: When enemies occupy three of six neighbor directions, the mover escapes toward the open side with the best composite score (min-distance \* escape-routes).
- **Setup**:
  - Mover (friendly) at `{q: 0, r: 0}`
  - Enemy A at `{q: 1, r: 0}` (neighbor, distance 1)
  - Enemy B at `{q: 0, r: 1}` (neighbor, distance 1)
  - Enemy C at `{q: -1, r: 1}` (neighbor, distance 1)
  - `allCharacters`: [mover, enemyA, enemyB, enemyC]
  - Call `computePluralMoveDestination(mover, [enemyA, enemyB, enemyC], "away", allCharacters)`
- **Assertions**:
  1. Result is NOT `{q: 1, r: 0}`, `{q: 0, r: 1}`, or `{q: -1, r: 1}` (occupied by enemies)
  2. Result is one of the remaining valid candidates: `{q: -1, r: 0}`, `{q: 0, r: -1}`, `{q: 1, r: -1}`, or `{q: 0, r: 0}` (stay)
  3. Min-distance from result to any enemy is >= 1 (cannot get closer than adjacent since 3 enemies are at distance 1)
  4. Result is NOT `{q: 0, r: 0}` (staying put has min-distance 1 with only 3 escape routes = composite 3; moving to an open neighbor has min-distance 1 with 5 escape routes = composite 5, which is strictly better)
- **Justification**: AC-4 edge case. Tests the escape-route weighting under constrained conditions. When surrounded, the mover should flee toward open space rather than staying trapped. Validates that the composite score correctly penalizes the current position's reduced mobility.

---

### Test 3: towards mode moves toward ally group centroid

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: Towards mode with multiple allies uses average distance (centroid approximation) to select the best step, pulling the mover toward the group rather than a single ally.
- **Setup**:
  - Mover (friendly) at `{q: 0, r: -4}`
  - Ally A (friendly) at `{q: 0, r: 0}`
  - Ally B (friendly) at `{q: 1, r: 0}`
  - `allCharacters`: [mover, allyA, allyB]
  - Call `computePluralMoveDestination(mover, [allyA, allyB], "towards", allCharacters)`
- **Assertions**:
  1. Result is a valid hex neighbor of mover (hexDistance from `{q: 0, r: -4}` is exactly 1)
  2. Average distance from result to [allyA, allyB] is strictly less than average distance from `{q: 0, r: -4}` to [allyA, allyB] (mover moved closer to the group)
  3. Result has `r > -4` (mover moved toward positive-r direction where the allies are located)
- **Justification**: AC-5. Validates that towards-mode uses average distance across the group rather than single-target A\* pathfinding. The distant starting position ensures a clear directional signal toward the ally cluster. If the implementation incorrectly used min or max instead of average, the wrong neighbor could be chosen when allies are spread apart.

---

### Test 4: towards mode picks best available hex when already among allies

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: When the mover is already at the centroid of the ally group, the function picks the best available neighbor even though no move can improve average distance (since towards mode excludes stay-in-place).
- **Setup**:
  - Mover (friendly) at `{q: 0, r: 0}`
  - Ally A (friendly) at `{q: 2, r: 0}` (distance 2)
  - Ally B (friendly) at `{q: -2, r: 0}` (distance 2)
  - `allCharacters`: [mover, allyA, allyB]
  - Call `computePluralMoveDestination(mover, [allyA, allyB], "towards", allCharacters)`
- **Assertions**:
  1. Result is a valid hex neighbor of mover (hexDistance from `{q: 0, r: 0}` is exactly 1)
  2. Result is NOT `{q: 0, r: 0}` (towards mode does not include stay-in-place)
  3. Average distance from result to [allyA, allyB] equals 2.0 (symmetrically placed allies at distance 2 mean any neighbor maintains the same average distance -- moving toward one ally by 1 moves away from the other by 1)
- **Justification**: AC-5 edge case. When already optimally positioned between symmetric allies, `generateValidCandidates("towards")` excludes stay-in-place (confirmed by existing test "towards mode does not include stay option"). All candidate hexes will have the same average distance (2.0), so the tiebreak hierarchy determines the result deterministically. This test validates the function handles the "no improvement possible" case without crashing and produces a deterministic result via tiebreaking.
- **Design note**: Original design used 3 adjacent allies which made all candidates WORSE than staying put. Redesigned with symmetric allies at distance 2 so candidates maintain equal average distance, validating tiebreak resolution rather than testing a case where the function is forced to make a suboptimal move.

---

### Test 5: single-member group matches singular target behavior

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: A plural target group with exactly one member produces the same destination as the singular `computeMoveDestination` for that same target, ensuring backward compatibility at the boundary.
- **Setup**:
  - Mover (friendly) at `{q: 0, r: 0}`
  - Single target (enemy) at `{q: 3, r: -1}` (distance 3)
  - `allCharacters`: [mover, target]
  - Call both:
    - `pluralResult = computePluralMoveDestination(mover, [target], "away", allCharacters)`
    - `singularResult = computeMoveDestination(mover, target, "away", allCharacters)`
- **Assertions**:
  1. `pluralResult` equals `singularResult` for "away" mode (same `{q, r}`)
- **Justification**: AC-11 (single group member produces identical behavior to singular target). This is a critical consistency check. For away mode, both singular and plural use candidate scoring with the same composite formula, so `min(distances)` with one target degenerates to `distance(target)` and the results must be identical.
- **Design note (towards mode excluded)**: The plan states plural towards-mode uses candidate scoring while singular towards-mode uses A* pathfinding. These are fundamentally different algorithms. In an unobstructed grid both produce the same first step, but they solve different problems (A* finds optimal path; candidate scoring picks best immediate neighbor). Asserting exact equality would be testing an implementation coincidence, not a requirement. Away-mode parity is the meaningful check because both use the same scoring approach. AC-11 is satisfied as long as the behavior is identical in the common case -- away mode with one target provides that guarantee.

---

### Test 6: empty group returns current position

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: When the target group is empty, the mover stays at their current position (no crash, no movement).
- **Setup**:
  - Mover (friendly) at `{q: 2, r: -1}`
  - `allCharacters`: [mover]
  - Call `computePluralMoveDestination(mover, [], "away", allCharacters)`
  - Call `computePluralMoveDestination(mover, [], "towards", allCharacters)`
- **Assertions**:
  1. Away-mode result equals `{q: 2, r: -1}` (mover's position)
  2. Towards-mode result equals `{q: 2, r: -1}` (mover's position)
- **Justification**: AC-12 (empty group returns current position). Guards against `Math.min(...[])` returning `Infinity` or `reduce` on empty array throwing. This edge case occurs when all enemies/allies are dead, and the decision logic should have caught it before calling this function, but the function must still be safe.

---

### Test 7: multi-step plural movement iterates correctly

- **File**: `src/engine/game-movement.test.ts`
- **Type**: unit
- **Verifies**: `computeMultiStepPluralDestination` with `distance: 2` moves 2 steps away from an enemy group, producing a position that is further than a single step.
- **Setup**:
  - Mover (friendly) at `{q: 0, r: 0}`
  - Enemy A at `{q: 2, r: 0}` (distance 2)
  - Enemy B at `{q: 0, r: 2}` (distance 2)
  - `allCharacters`: [mover, enemyA, enemyB]
  - `singleStep = computePluralMoveDestination(mover, [enemyA, enemyB], "away", allCharacters)`
  - `doubleStep = computeMultiStepPluralDestination(mover, [enemyA, enemyB], "away", allCharacters, 2)`
- **Assertions**:
  1. `hexDistance(mover.position, doubleStep)` equals 2 (moved exactly 2 steps in unobstructed space)
  2. `hexDistance(mover.position, doubleStep)` is greater than `hexDistance(mover.position, singleStep)` (double step goes further than single step)
  3. Min-distance from `doubleStep` to any enemy is greater than min-distance from `singleStep` to any enemy (each step moved further away)
- **Justification**: AC-6 (multi-step plural movement iterates single steps). This directly tests `computeMultiStepPluralDestination` which was previously only covered indirectly. The iterative step pattern (create virtual mover at each intermediate position) is the same as `computeMultiStepDestination` per ADR-017, but this test verifies the plural variant is wired correctly and produces progressive movement. Enemy placement is symmetric around positive-q/positive-r so the mover has a clear escape direction toward negative-q, negative-r.

---

## Unit Tests: `src/engine/selectors-target-criterion.test.ts`

These tests should be added to a new sibling describe block named `describe("evaluateTargetCriterion - plural targets")`.

### Test 8: evaluateTargetCriterion returns null for enemies target

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: The `evaluateTargetCriterion` function returns `null` immediately for `"enemies"` target, since plural targets do not use criterion-based single-character selection.
- **Setup**:
  - Evaluator (friendly) at `{q: 0, r: 0}`
  - Enemy at `{q: 1, r: 0}`, hp: 100
  - `allCharacters`: [evaluator, enemy]
  - Call `evaluateTargetCriterion("enemies", "nearest", evaluator, allCharacters)`
- **Assertions**:
  1. Result is `null`
- **Justification**: AC-3 (evaluateTargetCriterion returns null for plural targets). This guard prevents the selector from attempting to pick a single character from a group that should be handled collectively. Without this guard, the function would fall through to the exhaustive pattern match and cause a compile/runtime error. Test uses `"nearest"` criterion to verify the criterion is irrelevant (AC-10: criterion is silently ignored).

---

### Test 9: evaluateTargetCriterion returns null for allies target

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: The `evaluateTargetCriterion` function returns `null` immediately for `"allies"` target.
- **Setup**:
  - Evaluator (friendly) at `{q: 0, r: 0}`
  - Ally (friendly) at `{q: 1, r: 0}`, hp: 80
  - `allCharacters`: [evaluator, ally]
  - Call `evaluateTargetCriterion("allies", "lowest_hp", evaluator, allCharacters)`
- **Assertions**:
  1. Result is `null`
- **Justification**: AC-3 (evaluateTargetCriterion returns null for plural targets). Tests the `"allies"` branch separately from `"enemies"` because the guard must handle both plural values. Uses `"lowest_hp"` criterion (different from test 8) to further demonstrate criterion irrelevance. Even though a valid ally exists with non-full HP, the function should not attempt selection.

---

## Integration Tests: `src/engine/game-decisions-move-destination-basic.test.ts`

These tests should be placed in a new `describe("computeDecisions - plural target movement")` block in the existing test file, following the patterns used in the existing `describe("computeDecisions - move destination")` block.

### Test 10: move skill with enemies target and away behavior produces valid action

- **File**: `src/engine/game-decisions-move-destination-basic.test.ts`
- **Type**: integration
- **Verifies**: The full decision pipeline correctly handles a move skill with `target: "enemies"` and `behavior: "away"`, producing a valid move Action with a computed targetCell that moves the character away from all enemies.
- **Setup**:
  - Enemy A at `{q: 2, r: 0}`, faction: "enemy"
  - Enemy B at `{q: -1, r: 2}`, faction: "enemy"
  - Character (friendly) at `{q: 0, r: 0}` with skills:
    ```
    createSkill({
      id: "flee-all",
      behavior: "away",
      target: "enemies",
      trigger: { scope: "enemy", condition: "always" },
    })
    ```
  - Create game state with tick: 1 and all three characters
  - Call `computeDecisions(state)`
- **Assertions**:
  1. `decisions[0]` exists (character produced a decision)
  2. `decisions[0].action.type` equals `"move"`
  3. `decisions[0].action.targetCell` is a valid hex position (not undefined/null)
  4. `hexDistance(character.position, decisions[0].action.targetCell)` is <= 1 (single-step move)
  5. `decisions[0].action.targetCharacter` is `null` (moves have no single target character)
- **Justification**: AC-4, AC-7 (full pipeline). Validates that the decision logic correctly identifies the plural target, builds the enemy group, routes to `computePluralMoveDestination`, and produces a well-formed Action. This is the primary integration test -- it catches wiring bugs between `tryExecuteSkill`, `buildTargetGroup`, and `createPluralMoveAction`.

---

### Test 11: non-movement skill with enemies target is rejected

- **File**: `src/engine/game-decisions-move-destination-basic.test.ts`
- **Type**: integration
- **Verifies**: A non-movement skill (attack) with `target: "enemies"` is rejected in `evaluateSingleSkill`, and the character falls through to the next skill or idles.
- **Setup**:
  - Enemy at `{q: 1, r: 0}`, faction: "enemy"
  - Character (friendly) at `{q: 0, r: 0}` with skills:
    ```
    createSkill({
      id: "attack-all",
      damage: 10,
      range: 5,
      target: "enemies",
      actionType: "attack",
      trigger: { scope: "enemy", condition: "always" },
    })
    ```
  - Create game state with tick: 1 and both characters
  - Call `computeDecisions(state)` and also call `evaluateSkillsForCharacter(character, state.characters)`
- **Assertions**:
  1. `computeDecisions` result: `decisions[0].action.type` equals `"idle"` (attack-with-plural-target is rejected, character has no other skills, so idles)
  2. `evaluateSkillsForCharacter` result: `result.skillEvaluations[0].status` equals `"rejected"`
  3. `evaluateSkillsForCharacter` result: `result.skillEvaluations[0].rejectionReason` equals `"no_target"` (plural targets are only valid for movement; non-movement skills are rejected as no_target per the plan)
- **Justification**: AC-8 (non-movement skill with plural target is rejected, not crash). This test is critical because without the guard, a plural target on an attack skill would attempt `evaluateTargetCriterion` which returns null, leading to a no_target rejection through the existing path. But the plan adds an explicit early branch for plural targets that checks `actionType !== "move"`. This test verifies that explicit branch works and produces the correct rejection reason.

---

### Test 12: plural target with empty group produces no_target rejection

- **File**: `src/engine/game-decisions-move-destination-basic.test.ts`
- **Type**: integration
- **Verifies**: When all enemies are dead (hp <= 0), a move skill with `target: "enemies"` is rejected with `no_target` and the character idles.
- **Setup**:
  - Dead enemy at `{q: 2, r: 0}`, faction: "enemy", hp: 0
  - Character (friendly) at `{q: 0, r: 0}` with skills:
    ```
    createSkill({
      id: "flee-all",
      behavior: "away",
      target: "enemies",
      trigger: { scope: "enemy", condition: "always" },
    })
    ```
  - Create game state with tick: 1 and both characters
  - Call `computeDecisions(state)` and `evaluateSkillsForCharacter(character, state.characters)`
- **Assertions**:
  1. `computeDecisions` result: `decisions[0].action.type` equals `"idle"`
  2. `evaluateSkillsForCharacter` result: `result.skillEvaluations[0].status` equals `"rejected"`
  3. `evaluateSkillsForCharacter` result: `result.skillEvaluations[0].rejectionReason` equals `"no_target"`
- **Justification**: AC-9 (empty group produces no_target). Tests the `buildTargetGroup` function's `hp > 0` filter and the subsequent `group.length === 0` guard. Without this test, dead characters could be included in the group, causing movement toward corpses, or the empty array could reach `computePluralMoveDestination` and stay in place silently without proper rejection reporting.

---

### Test 13: move skill with allies target and towards behavior produces valid action

- **File**: `src/engine/game-decisions-move-destination-basic.test.ts`
- **Type**: integration
- **Verifies**: The full decision pipeline correctly handles a move skill with `target: "allies"` and `behavior: "towards"`, building the ally group (excluding self) and producing a valid move Action.
- **Setup**:
  - Ally A (friendly) at `{q: 3, r: 0}`
  - Ally B (friendly) at `{q: 2, r: 1}`
  - Character (friendly) at `{q: 0, r: 0}` with skills:
    ```
    createSkill({
      id: "regroup",
      behavior: "towards",
      target: "allies",
      trigger: { scope: "enemy", condition: "always" },
    })
    ```
  - Enemy at `{q: -3, r: 0}`, faction: "enemy" (needed so the trigger scope "enemy" has a valid pool -- `always` passes regardless, but the trigger evaluator needs at least one enemy in scope to evaluate against)
  - Create game state with tick: 1 and all four characters
  - Call `computeDecisions(state)`
- **Assertions**:
  1. `decisions` for the character exist and `action.type` equals `"move"`
  2. `decisions` for the character: `action.targetCell` has `q > 0` (moved toward allies in positive-q direction)
  3. `action.targetCharacter` is `null`
- **Justification**: AC-7 (decision logic builds correct group). Tests the `"allies"` branch of `buildTargetGroup` -- specifically that it filters to same-faction living characters and excludes self. This is the only integration test exercising the `"allies"` target value. Without this test, a bug in the faction check or self-exclusion logic for allies would go undetected. The trigger scope concern is noted: `scope: "enemy"` with `condition: "always"` requires at least one living enemy to pass the trigger (the trigger evaluates existentially against the scope pool). The enemy at `{q: -3, r: 0}` ensures the trigger fires.
- **Design note**: The trigger scope issue (does `scope: "enemy"` + `condition: "always"` require enemies to exist?) should be verified by the coder against the existing trigger evaluator. If `always` passes unconditionally regardless of scope pool, the enemy character can be omitted. If it requires at least one character in the scope, the enemy is necessary.

---

## Acceptance Criteria Coverage Matrix

| AC    | Description                                     | Test(s)                                                                                                                                                                           |
| ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Target type includes enemies/allies             | Covered implicitly by all tests (TypeScript compilation)                                                                                                                          |
| AC-2  | isPluralTarget + PLURAL_TARGETS exported        | Covered implicitly by tests that use the branch (TypeScript compilation)                                                                                                          |
| AC-3  | evaluateTargetCriterion returns null for plural | Tests 8, 9                                                                                                                                                                        |
| AC-4  | computePluralMoveDestination away mode          | Tests 1, 2                                                                                                                                                                        |
| AC-5  | computePluralMoveDestination towards mode       | Tests 3, 4                                                                                                                                                                        |
| AC-6  | Multi-step plural movement                      | Test 7                                                                                                                                                                            |
| AC-7  | Decision logic builds correct group             | Tests 10, 13                                                                                                                                                                      |
| AC-8  | Non-movement + plural target rejected           | Test 11                                                                                                                                                                           |
| AC-9  | Empty group produces no_target                  | Test 12                                                                                                                                                                           |
| AC-10 | Criterion silently ignored                      | Tests 8, 9 (criterion param provided but result is null)                                                                                                                          |
| AC-11 | Single member matches singular behavior         | Test 5 (away mode)                                                                                                                                                                |
| AC-12 | Empty group returns current position            | Test 6                                                                                                                                                                            |
| AC-13 | Filters skipped for plural targets              | Covered structurally (early return before filter path) -- no separate test needed since tests 10-12 exercise the decision path and would fail if filters were incorrectly applied |

## Notes for Coder

1. **Import requirements**: Tests in `game-movement.test.ts` will need to import the new `computePluralMoveDestination` and `computeMultiStepPluralDestination` functions. Tests in `game-decisions-move-destination-basic.test.ts` will need to import `evaluateSkillsForCharacter` in addition to the existing `computeDecisions`.

2. **Test helper usage**: All tests use the existing `createCharacter` and `createSkill` helpers from `game-test-helpers.ts`. The `target` field on `createSkill` accepts `Target` type, which will include `"enemies"` and `"allies"` after the type change.

3. **Selector tests import path**: Tests 8-9 use `selectors-test-helpers.ts` for `createCharacter` (consistent with the existing `selectors-target-criterion.test.ts` pattern) and import `evaluateTargetCriterion` from `./selectors`.

4. **Test 4 towards-mode stay-in-place (RESOLVED)**: `generateValidCandidates("towards")` does NOT include stay-in-place (confirmed by existing test "towards mode does not include stay option" in `game-movement.test.ts`). The plan specifies that plural towards-mode also uses `generateValidCandidates(mover, allCharacters, "towards")`. Therefore the mover will always move to an adjacent hex in towards mode. Test 4 has been redesigned with symmetric allies at distance 2 so that all candidate hexes maintain equal average distance, testing tiebreak resolution rather than forcing a suboptimal move.

5. **Test 5 towards-mode parity (RESOLVED)**: Plural towards-mode uses candidate scoring; singular towards-mode uses A\* pathfinding. These are different algorithms that can produce different results (especially with obstacles). The test now asserts parity only for away mode, where both singular and plural use the same candidate-scoring approach. This still validates AC-11 (single-member behavioral equivalence) for the algorithm that can guarantee equivalence.

6. **Trigger scope for allies test (test 13)**: The coder should verify whether `scope: "enemy"` + `condition: "always"` requires at least one living enemy in the scope pool. If so, the enemy character in test 13 is required. If `always` passes unconditionally, the enemy can be omitted.

## Review Findings

1. **FIXED -- Test 4 assertion was incorrect**: The original design placed allies at `{q: 1, r: 0}`, `{q: -1, r: 0}`, `{q: 0, r: 1}` (all adjacent to the mover). Since `generateValidCandidates("towards")` excludes stay-in-place, and these 3 allies occupy 3 of the 6 neighbor hexes (blocking them as occupied), only 3 candidate hexes remain -- all of which WORSEN the average distance from 1.0. The assertion "average distance <= current average distance" would always fail. Redesigned with symmetric allies at distance 2, where all candidates maintain equal average distance.

2. **FIXED -- Test 5 towards-mode assertion was fragile**: Removed the towards-mode parity assertion. Plural towards-mode (candidate scoring) and singular towards-mode (A\* pathfinding) are fundamentally different algorithms. Asserting exact equality tests an implementation coincidence rather than a requirement. Away-mode parity is the meaningful and guaranteed check.

3. **ADDED -- Test 7 (multi-step plural movement)**: AC-6 was previously only covered indirectly. Added a dedicated test for `computeMultiStepPluralDestination` with `distance: 2` to verify the iterative step logic is correctly wired for plural targets.

4. **ADDED -- Test 13 (allies target integration)**: The original 3 integration tests only exercised the `"enemies"` target value. Added a test for `"allies"` + `"towards"` to verify that `buildTargetGroup` correctly identifies same-faction characters while excluding self. This is the only test exercising the allies branch of group building through the full decision pipeline.

5. **Minor correction -- Test 2 assertion 4 justification**: Updated the composite score explanation to be more precise (stay-at-origin has 3 escape routes because 3 of 6 neighbors are occupied; open neighbors have 5 escape routes, making composite 5 vs 3).

6. **Resolved both [VERIFY] markers**: Both have been resolved with clear rationale based on reading the existing `generateValidCandidates` implementation and the plan's algorithm descriptions.
