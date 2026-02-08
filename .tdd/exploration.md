# Exploration Findings

## Task Understanding

Implement Skill Expansion Phases 4+5+6:

- **Phase 4**: Add Ranged Attack to skill registry (zero engine changes, registry-only)
- **Phase 5**: Add `distance` field to `SkillDefinition`/`Skill` types, implement multi-step movement, add Dash skill
- **Phase 6**: Add `most_enemies_nearby` criterion to selector system

~25 acceptance criteria across 3 phases. See `.tdd/requirements.md` for full criteria.

## Relevant Files

### Phase 4: Ranged Attack (Registry Only)

- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - Where `SKILL_REGISTRY` array and `SkillDefinition` type live. Add ranged-attack entry. Also `createSkillFromDefinition()` and `getDefaultSkills()` which create `Skill` instances from definitions.
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts` - Existing registry tests. Currently checks `SKILL_REGISTRY.length === 4` and enumerates all skill IDs. Must update count and ID list. Add new describe block for Ranged Attack stats.
- `/home/bob/Projects/auto-battler/src/engine/combat.ts` - Attack resolution. Uses `action.skill.damage ?? 0` -- already handles any attack skill generically. No changes needed.
- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` - Decision phase. Range check at line 118-119: `if (distance > skill.range)` -- already generic. No changes needed.
- `/home/bob/Projects/auto-battler/src/engine/game-core.ts` - Cooldown applied via `getSkillDefinition(action.skill.id).cooldown` at line 156-157 -- already generic. No changes needed.

### Phase 5: `distance` Field + Dash

- `/home/bob/Projects/auto-battler/src/engine/types.ts` - `Skill` interface (line 54-70). Add `distance?: number` field. `SkillDefinition` is in skill-registry.ts, not here.
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - `SkillDefinition` interface (line 26-41). Add `distance?: number` field. Set `distance: 1` on existing Move definition. Add Dash definition.
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - `createSkillFromDefinition()` (line 137-153) and `getDefaultSkills()` (line 115-131). Neither propagates `distance`. Must add `...(def.distance !== undefined ? { distance: def.distance } : {})` to both.
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - `createSkill()` helper (line 47-76). Does not include `distance` field. Must add it.
- `/home/bob/Projects/auto-battler/src/engine/triggers-test-helpers.ts` - Wraps `createSkill()` from game-test-helpers. Should get `distance` support transitively.
- `/home/bob/Projects/auto-battler/src/engine/game-movement.ts` - `computeMoveDestination()` (line 30-69). Currently returns a single Position (1 step). Must be extended to support multi-step movement: iterate single-step logic `distance` times. Key insight: this function is called in the DECISION phase (via `createSkillAction` in game-actions.ts). The resulting targetCell is what gets stored on the Action. For multi-step, we need to compute the final destination after N steps.
- `/home/bob/Projects/auto-battler/src/engine/game-actions.ts` - `createSkillAction()` (line 61-96). Calls `computeMoveDestination()` for move actions. For multi-step, it needs to pass `skill.distance ?? 1` to computeMoveDestination or call it iteratively.
- `/home/bob/Projects/auto-battler/src/engine/movement.ts` - `resolveMovement()` (line 98-252). Moves characters to their `action.targetCell`. Currently assumes targetCell is 1 hex away. For multi-step, the targetCell will already be the final destination (computed during decision phase), BUT collision resolution in movement.ts only checks blockers at the target cell, not intermediate steps. This is the key design question: should multi-step movement resolution use per-step collision, or just check the final destination? Per requirements: "per step" collision, meaning the decision phase must compute intermediate positions and movement resolution must handle multi-step with per-step blocking.
- `/home/bob/Projects/auto-battler/src/engine/game-movement-basic.test.ts` - Tests for computeMoveDestination basic cases.
- `/home/bob/Projects/auto-battler/src/engine/game-movement.test.ts` - Integration tests for computeMoveDestination with pathfinding.
- `/home/bob/Projects/auto-battler/src/engine/game-movement-collision.test.ts` - Collision handling tests for computeMoveDestination.
- `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts` - Escape route weighting tests.
- `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts` - Boundary fallback tests.
- `/home/bob/Projects/auto-battler/src/engine/movement-basic.test.ts` - resolveMovement basic tests.
- `/home/bob/Projects/auto-battler/src/engine/movement-blocker.test.ts` - Blocker-wins tests.

### Phase 6: `most_enemies_nearby` Criterion

- `/home/bob/Projects/auto-battler/src/engine/types.ts` - `Criterion` type (line 129): `"nearest" | "furthest" | "lowest_hp" | "highest_hp"`. Add `"most_enemies_nearby"`.
- `/home/bob/Projects/auto-battler/src/engine/selectors.ts` - `evaluateTargetCriterion()` (line 71-145). Has exhaustive switch on `Criterion` with `_exhaustive: never` guard (line 141). Must add case for `most_enemies_nearby`. Will need `hexDistance` for counting nearby enemies within 2 hexes.
- `/home/bob/Projects/auto-battler/src/engine/hex.ts` - `hexDistance()` (line 52-56). Already exported and available. Used for counting enemies within radius.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` - Criterion dropdown (lines 241-252). Hardcoded `<option>` values for the 4 criteria. Also `handleCriterionChange` (line 58-65) casts to union of 4 values. Both must be updated to include `most_enemies_nearby`.
- `/home/bob/Projects/auto-battler/src/engine/selectors-target-criterion.test.ts` - Main selector tests.
- `/home/bob/Projects/auto-battler/src/engine/selectors-tie-breaking.test.ts` - Tiebreaking tests.
- `/home/bob/Projects/auto-battler/src/engine/selectors-edge-cases.test.ts` - Edge case tests.
- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` - Store with `updateSkill` action (line 222). Accepts partial Skill updates. Should work with new criterion value without changes.
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx` - Legacy panel also casts Criterion (line 128). May need update for completeness though marked legacy.

### Shared / Cross-cutting

- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - `createSkill()` helper needs `distance` field support for Phase 5.
- `/home/bob/Projects/auto-battler/src/engine/game-actions.ts` - `getActionType()` returns `"attack" | "move" | "heal"`. No changes needed for these phases.
- `/home/bob/Projects/auto-battler/src/engine/game-core.ts` - `processTick()` resolution order: Healing -> Movement -> Combat. No changes for these phases.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab-config.test.tsx` - Component test that renders SkillRow, may need criterion dropdown updates.

## Existing Patterns

### Skill Registry Pattern (ADR-005)

Add skill to `SKILL_REGISTRY` array in `skill-registry.ts`. Each entry is a `SkillDefinition` with id, name, actionType, tickCost, range, damage/healing, behaviors, defaultBehavior, innate, defaultTarget, defaultCriterion, targetingMode, cooldown. Functions `createSkillFromDefinition()` and `getDefaultSkills()` create runtime `Skill` instances.

### Exhaustive Switch Pattern

`selectors.ts` uses `const _exhaustive: never = criterion` in default case to enforce exhaustive handling. Adding a new Criterion value will cause a compile error until handled -- this is intentional and desirable.

### Test Helper Pattern

`createSkill()` in `game-test-helpers.ts` uses `Partial<Skill> & { id: string }` pattern with sensible defaults. All optional fields use `??` fallback. New fields should follow this pattern with `undefined` default.

### Movement Architecture

Movement is split across two phases:

1. **Decision phase** (`game-actions.ts` -> `game-movement.ts`): `computeMoveDestination()` calculates WHERE to move. Returns a single Position stored as `action.targetCell`.
2. **Resolution phase** (`movement.ts`): `resolveMovement()` moves characters to their `targetCell`, handling collisions between movers.

For multi-step Dash: the decision phase computes the final destination by iterating `computeMoveDestination()` N times. Each step updates the mover's simulated position and rechecks obstacles. The resolution phase receives the final targetCell and handles collisions normally.

**Important design note**: The current resolution phase checks blockers at the TARGET cell only (snapshot-based). For multi-step movement, intermediate steps need collision checking during the decision phase simulation, but the resolution phase only needs the final destination. This means multi-step blocking is handled in `computeMoveDestination()`, not `resolveMovement()`.

### Criterion Evaluation Pattern

All criteria follow the same structure in `evaluateTargetCriterion()`:

1. Build candidate pool (filtered by target type: enemy/ally)
2. Apply optional candidateFilter (pre-criterion pool narrowing)
3. Use `findMinimum()` with a comparator function
4. Comparator implements primary sort + `tieBreakCompare()` (lower R, then lower Q)

### Cooldown Pattern

Cooldown is set on the skill definition in registry (`cooldown: number`). Applied in `applyDecisions()` via `getSkillDefinition(action.skill.id).cooldown`. Decremented in `decrementCooldowns()` for idle characters.

## Dependencies

- Phase 4 (Ranged Attack) has NO dependencies -- pure registry addition
- Phase 5 (distance/Dash) depends on Phase 4 being complete (registry pattern established)
- Phase 5 depends on understanding the Decision->Resolution movement pipeline
- Phase 6 (most_enemies_nearby) has NO dependency on Phase 4 or 5 -- independent criterion addition
- All phases depend on existing test infrastructure (`game-test-helpers.ts`, vitest)

## Constraints Discovered

### Phase 4 Constraints

1. `skill-registry.test.ts` line 18 hardcodes `SKILL_REGISTRY.length === 4` and line 20-25 lists all skill IDs. Both must be updated.
2. The registry test validates all entries have required fields -- new entry must pass existing validation.
3. Ranged Attack has `cooldown: 2` -- the cooldown system is already in place and generic.

### Phase 5 Constraints

1. **`distance` is NOT currently on `Skill` or `SkillDefinition`**. Move skill has implicit distance of 1 via `computeMoveDestination()` which always returns exactly 1 step.
2. **`computeMoveDestination()` returns a single Position**. For multi-step, it needs to either: (a) accept a distance parameter and iterate internally, or (b) be called iteratively by the caller. Requirements say "iterative application of computeMoveDestination()" -- suggesting option (b), wrapping it in a loop.
3. **Resolution phase (`resolveMovement`) assumes targetCell is the final destination**. It groups movers by target cell and checks blockers at that cell. For Dash, if the decision phase computes a 2-step destination, the resolution phase just moves to that cell (if no blocker exists at resolution time). The per-step blocking happens during the decision-phase computation.
4. **Dash is instant (tickCost: 0)**: Like Light Punch, it resolves the same tick as decision. The decision-resolution flow handles tickCost 0 generically (`resolvesAtTick = tick + 0 = tick`).
5. **`createSkill()` test helper must be updated** to support `distance` field, otherwise tests will fail on TypeScript type checking.
6. Move skill in registry currently has NO `distance` field. Adding `distance: 1` makes the implicit explicit without changing behavior.

### Phase 6 Constraints

1. **Exhaustive switch** in `selectors.ts` (line 141) will cause compile error when `Criterion` is extended. Must add new case.
2. **SkillRow.tsx criterion dropdown** (lines 241-252) has hardcoded `<option>` elements. Must add new option.
3. **SkillRow.tsx `handleCriterionChange`** (line 60-64) casts to a union of 4 values. Must add `"most_enemies_nearby"` to the cast.
4. **`most_enemies_nearby` counts enemies within 2 hexes of each CANDIDATE** (not of the evaluator). This means for each candidate in the pool, we count how many characters from the opposing faction are within 2 hexes of that candidate's position.
5. **Tiebreaking**: Uses existing position tiebreak (lower R, lower Q). Consistent with all other criteria.
6. **"enemies"** in the criterion name refers to the evaluator's enemies (opposing faction), regardless of whether the target pool is enemy or ally. When used with `target: ally`, it still counts enemies (opposing faction to the evaluator) near each ally candidate.

## Open Questions

1. **Phase 5 - Multi-step movement resolution**: Should `resolveMovement()` be modified to handle multi-step (per-step collision at resolution time), or should all per-step collision be handled in the decision phase and `resolveMovement()` just receives the final destination? The requirements say "iterate single-step logic `distance` times" and "blocker-wins collision rule per step" -- this suggests the decision phase does multi-step simulation. But what about other movers who collide at intermediate steps? Current architecture: collisions between movers are resolved in `resolveMovement()`, not in the decision phase. Recommendation: handle intermediate blocking in decision phase (which already handles obstacle avoidance), but final-destination mover-vs-mover collision stays in resolveMovement.

2. **Phase 5 - Away mode multi-step**: For "away" mode with distance 2, do we call the existing single-step away logic twice? Each step picks the best neighbor using the composite scoring. The mover's position updates after each step for the next evaluation. This seems straightforward but should be verified with tests.

3. **Phase 6 - "enemies" definition**: The criterion name is `most_enemies_nearby`. For an evaluator on the friendly faction targeting `enemy`, candidates are enemies -- we count how many OTHER enemies are near each enemy candidate. For `target: ally`, candidates are allies -- we count how many enemies are near each ally. The "enemies" always means the evaluator's opposing faction. Confirm this interpretation.

4. **Phase 6 - Hardcoded 2-hex radius**: The requirements say "enemies within 2 hexes". This is hardcoded in the criterion logic, not configurable. Should it be a constant? The requirements don't mention configurability.

5. **Phase 4 - Registry test update strategy**: The existing test at line 18 checks exact count (`toHaveLength(4)`). Adding Ranged Attack changes this to 5. Adding Dash (Phase 5) changes it to 6. Should tests be updated incrementally (Phase 4 sets to 5, Phase 5 sets to 6) or should we anticipate both? Recommend incremental -- each phase updates the count.
