# Exploration Findings

## Task Understanding

Add `"enemies"` and `"allies"` as new values to the `Target` type alongside existing `"enemy"`, `"ally"`, `"self"`. These plural targets reference the whole group rather than selecting a single character via criterion. They are meaningful only for movement behaviors (Move, Dash) and enable spatial reasoning against groups, e.g., "move away from all enemies" maximizes minimum distance from every enemy.

Key semantics:

- Plural targets skip criterion selection (no single character is picked)
- Only meaningful for movement-type skills (actionType "move")
- For "away" mode with `"enemies"`: scoring should consider distance to ALL enemies (e.g., maximize minimum distance)
- For "towards" mode with `"enemies"`: move towards the centroid or nearest member (TBD during planning)
- Criterion dropdown should be disabled when plural target is selected (similar to "self")
- Filter should also be skipped for plural targets (no individual candidate to filter)

## Relevant Files

### Type Definitions

- `/home/bob/Projects/auto-battler/src/engine/types.ts` (line 125) - `Target` type union: `"enemy" | "ally" | "self"`. Must add `"enemies" | "allies"`.
- `/home/bob/Projects/auto-battler/src/engine/types.ts` (line 54-71) - `Skill` interface with `target: Target` field.

### Movement Computation (Core Extension Point)

- `/home/bob/Projects/auto-battler/src/engine/game-movement.ts` - `computeMoveDestination(mover, target, mode, allCharacters)` takes a single `Character` as target. For plural targets, this function (or a new sibling) needs to accept multiple targets or the whole group. Key functions:
  - `computeMoveDestination()` (line 30) - single-step movement, takes one target Character
  - `computeMultiStepDestination()` (line 83) - iterative wrapper, also takes one target Character
  - `selectBestCandidate()` (line 322) - scores candidates against `target.position` (single position)
  - `calculateCandidateScore()` (line 191) - computes score relative to single target position
  - `compareAwayMode()` (line 262) - composite scoring: `distance * escapeRoutes` against single target
  - `compareTowardsMode()` (line 215) - minimizes distance to single target

### Decision Logic

- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` - `tryExecuteSkill()` (line 66) and `evaluateSingleSkill()` (line 196):
  - Both call `evaluateTargetCriterion()` which returns a single `Character | null`
  - For plural targets, criterion selection is skipped, but a "virtual target" or target group must be passed to `createSkillAction()`
  - Range check (lines 118-133) only applies to attack/heal/interrupt/charge, not move - so plural targets avoid range checks
  - Filter evaluation (lines 97-101) uses `skill.target !== "self"` guard - needs extension for plural targets
  - `hasCandidates()` call (line 245) also uses singular target values

### Action Creation

- `/home/bob/Projects/auto-battler/src/engine/game-actions.ts` - `createSkillAction()` (line 66):
  - Move branch (line 88-106) calls `computeMoveDestination()` / `computeMultiStepDestination()` with a single target Character
  - For plural targets, needs to compute destination differently (against group)
  - `targetCharacter` is set to `null` for moves (line 106), which is fine for plural targets

### Selector Logic

- `/home/bob/Projects/auto-battler/src/engine/selectors.ts` - `evaluateTargetCriterion()` (line 71):
  - Currently handles `"self"`, `"enemy"`, `"ally"` with exhaustive if-else
  - Returns `Character | null` - plural targets cannot return a single character
  - Need new function or branch that returns `Character[]` for plural targets
- `/home/bob/Projects/auto-battler/src/engine/selectors.ts` - `hasCandidates()` (line 176):
  - Similarly handles `"self"`, `"enemy"`, `"ally"` - needs `"enemies"`, `"allies"` branches

### Store / UI

- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` (line 303) - `selectMovementTargetData`:
  - Calls `evaluateTargetCriterion()` to find movement target for targeting lines
  - For plural targets, targeting line rendering may need to change (point to centroid? skip line?)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` (line 47-53) - `handleTargetChange`:
  - Casts value as `"enemy" | "ally" | "self"` - needs update for plural values
  - Resets criterion to "nearest" when target is "self" - similar logic for plural targets
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` (lines 211-221) - Target `<select>` dropdown:
  - Has three `<option>` elements - needs two more for "Enemies" and "Allies"
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` (line 228) - Criterion `<select>`:
  - `disabled={skill.target === "self"}` - needs extension for plural targets
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - `SkillDefinition.defaultTarget: Target` (line 44):
  - Type already uses `Target`, so adding to union will make plural values available in registry

### Trigger System (No Change Expected)

- `/home/bob/Projects/auto-battler/src/engine/triggers.ts` - `TriggerScope` is separate from `Target` (uses `"enemy" | "ally" | "self"`), no changes needed here.

### Selector Filters (Guard Change)

- `/home/bob/Projects/auto-battler/src/engine/selector-filters.ts` - `evaluateFilterForCandidate()`:
  - Per-candidate filter; for plural targets, filter is bypassed (no pool to narrow)
  - Guard in `game-decisions.ts` currently checks `skill.target !== "self"` - needs extension

### Existing Tests Impacted

- `/home/bob/Projects/auto-battler/src/engine/game-movement.test.ts` - Movement test patterns
- `/home/bob/Projects/auto-battler/src/engine/selectors-target-criterion.test.ts` - Target+criterion combination tests
- `/home/bob/Projects/auto-battler/src/engine/game-actions.test.ts` - Action creation tests
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` - Target dropdown tests (line 627+)
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-movement-target.test.ts` - Movement target data selector tests
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts` - updateSkill tests for target changes

### Test Helpers

- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - `createCharacter()`, `createSkill()`, `createGameState()`
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` (line 72) - `createSkill()` defaults `target` to `"enemy"`

## Existing Patterns

- **Pure engine tests** - Engine tests import from `game-test-helpers.ts`, use `createCharacter()` and `createSkill()` helpers. Tests are organized by specific concern in separate files.
- **Exhaustive type handling** - `selectors.ts` uses exhaustive `switch` with `never` check (line 166). Adding new Target values will cause compile errors in unhandled branches, which is a safety net.
- **Tiebreaking hierarchy** - Movement scoring uses a multi-level comparison cascade. Plural targets will need a new scoring approach (aggregate over multiple targets).
- **Snapshot-based obstacles** - Multi-step movement uses original character positions as obstacles (line 93 of game-movement.ts). Plural target logic should follow the same snapshot pattern.
- **Guard pattern for self-targeting** - `skill.target === "self"` guards appear in `evaluateTargetCriterion()`, `tryExecuteSkill()`, `evaluateSingleSkill()`, and `SkillRow.tsx`. All need extension for plural targets.

## Dependencies

- **TypeScript strict mode** - Adding to the `Target` union will cause compile errors everywhere `Target` is pattern-matched exhaustively, providing a safety net for finding all call sites.
- **`computeMoveDestination()` signature** - Currently takes `Character` as target parameter. For plural targets, either: (a) create a new function that takes `Character[]`, or (b) create a virtual "centroid character" to pass to existing function.
- **`evaluateTargetCriterion()` return type** - Returns `Character | null`. Plural targets need a different flow since there is no single selected character.
- **Action's `targetCharacter` field** - Already `null` for moves, so no structural change needed.
- **`selectMovementTargetData` selector** - Uses `evaluateTargetCriterion()` to find movement targets for targeting lines. Needs adaptation for plural targets (possibly skip targeting line or draw lines to all targets).

## Applicable Lessons

- **Lesson 002** - "Exclude target from obstacles in pathfinding." For plural targets with "towards" mode, pathfinding approach needs thought. A\* targets a single position; plural targets may need different approach (e.g., move towards nearest enemy in the group).
- **Lesson 001** - "Scope behavioral specs by mode/context." The plural targets spec should clearly scope that they only apply to movement behaviors. Non-movement skills using plural targets should be rejected or handled gracefully.

## Constraints Discovered

1. **`computeMoveDestination()` is single-target by design** - The core movement function (`computeMoveDestination`) and its scoring functions (`calculateCandidateScore`, `compareAwayMode`, `compareTowardsMode`) all operate against a single target position. For plural targets, new scoring logic is needed that aggregates across all targets.

2. **`evaluateTargetCriterion()` returns `Character | null`** - Plural targets cannot use this function since there is no single character to return. The decision pipeline needs to branch before target selection for plural targets.

3. **`createSkillAction()` takes a single target Character** - For move actions, the target Character is used to compute the move destination. For plural targets, the function needs a different input (Character array or pre-computed destination).

4. **Filter and criterion bypass** - Both filter and criterion should be bypassed for plural targets (like "self" but for a different reason). The `skill.target !== "self"` guards in `game-decisions.ts` need to become `!isPluralTarget(skill.target) && skill.target !== "self"` or equivalent.

5. **UI guards for criterion disabled state** - SkillRow disables criterion select when `target === "self"`. Same disabling needed for plural targets. The target select cast on line 48 must include the new values.

6. **Exhaustive switches** - The `default: never` pattern in `selectors.ts` will catch unhandled plural target values at compile time, ensuring no branch is missed.

7. **Movement-only constraint** - Plural targets only make sense for movement. If a non-movement skill has a plural target, the decision pipeline should handle this gracefully (reject as no_target, or error).

## Open Questions

1. **Towards mode with plural targets** - What does "move towards all enemies" mean? Options: (a) move towards the nearest enemy in the group (degenerates to singular "enemy nearest"), (b) move towards the centroid of all enemies, (c) move towards the enemy that is farthest away (minimize max distance). This needs spec clarification.

2. **Away mode aggregation** - For "move away from all enemies", is the scoring function `min(distance_to_each_enemy) * escape_routes` (maximize minimum distance), or `sum(distances)` (maximize total distance), or something else?

3. **Targeting line visualization** - `selectMovementTargetData` currently draws a line from character to their movement target. For plural targets, what should the targeting line show? Options: no line, line to centroid, lines to all targets, or a different visual.

4. **Should `"enemies"` and `"allies"` be available for non-movement skills?** - The task description says "only meaningful for movement behaviors," but should the UI prevent selecting plural targets for attack/heal/interrupt/charge skills? Or should it be allowed but rejected at evaluation time?

5. **Interaction with filters** - Should filters be completely bypassed for plural targets (like self), or should there be a way to filter the group (e.g., "move away from enemies that are channeling")? Current task description says "skip criterion selection" but does not mention filters.

6. **New rejection reason?** - If a non-movement skill has a plural target, should there be a new rejection reason like `"invalid_target_scope"`, or should it be treated as `"no_target"`?

7. **`computeMoveDestination` extension approach** - Should we: (a) create a new `computeMoveDestinationForGroup()` function, (b) modify existing function to accept `Character | Character[]`, or (c) create a higher-level wrapper that handles the plural logic and delegates to existing single-target function?
