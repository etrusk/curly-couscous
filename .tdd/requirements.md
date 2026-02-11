# TDD Spec: Add Plural Target Scopes (`enemies` / `allies`)

Created: 2026-02-11

## Goal

Add `"enemies"` and `"allies"` as target values alongside existing `"enemy"`, `"ally"`, `"self"`. Plural targets reference the whole group (skip criterion selection) and are only meaningful for movement behaviors. This enables spatial reasoning against groups — e.g., "move away from all enemies" maximizes minimum distance from every enemy rather than fleeing a single reference point.

## Acceptance Criteria

- [ ] `Target` type includes `"enemies"` and `"allies"` alongside existing values
- [ ] `isPluralTarget()` type guard and `PLURAL_TARGETS` constant exported from `types.ts`
- [ ] `evaluateTargetCriterion` returns `null` for plural targets (guard at top)
- [ ] `computePluralMoveDestination()` correctly computes away destination: maximizes `min(distances to all targets) * escapeRoutes` with standard tiebreak hierarchy
- [ ] `computePluralMoveDestination()` correctly computes towards destination: minimizes average distance to all targets (centroid approximation) with standard tiebreak hierarchy
- [ ] Multi-step plural movement (Dash, distance > 1) iterates single steps using the plural function
- [ ] Decision logic builds correct group for plural targets: `enemies` = all living enemies, `allies` = all living allies excluding self
- [ ] Decision logic rejects plural target + non-movement actionType (rejected, not crash)
- [ ] Decision logic rejects plural target when group is empty as `no_target`
- [ ] Plural target + criterion set: criterion is silently ignored (no error)
- [ ] Plural target with single group member produces identical behavior to singular target
- [ ] Plural target with empty group: `computePluralMoveDestination` returns current position
- [ ] Filters are skipped for plural targets (no candidate pool to narrow)

## Approach

Branch on `isPluralTarget(skill.target)` in `tryExecuteSkill` and `evaluateSingleSkill` to bypass `evaluateTargetCriterion`. Build the target group from `allCharacters`, pass to new `computePluralMoveDestination()` in `game-movement.ts`. Movement computation uses existing scoring/tiebreak infrastructure (`calculateCandidateScore`, `compareAwayMode`, `compareTowardsMode`) with adapted distance metrics. `createSkillAction` gets a new overload/branch for plural targets that accepts the group.

## Scope Boundaries

- In scope:
  - `src/engine/types.ts` — extend `Target`, add `isPluralTarget`, `PLURAL_TARGETS`
  - `src/engine/game-movement.ts` — add `computePluralMoveDestination()`
  - `src/engine/game-decisions.ts` — branch for plural targets in `tryExecuteSkill` and `evaluateSingleSkill`
  - `src/engine/game-actions.ts` — new code path in `createSkillAction` for plural move targets
  - `src/engine/selectors.ts` — early guard in `evaluateTargetCriterion` for plural targets
  - Unit tests in `src/engine/game-movement.test.ts`
  - Unit tests in `src/engine/selectors.test.ts`
  - Integration tests in `src/engine/game-decisions.test.ts`

- Out of scope:
  - UI changes (target dropdown for `"enemies"`/`"allies"`) — separate task
  - AoE support for plural targets on non-movement skills — future work
  - Spec/architecture doc updates — deferred to doc-sync phase
  - Trigger/filter changes — triggers already evaluate independently of skill target field

## Assumptions

- `away` + plural targets uses `Math.min(...distances to all targets)` as the distance metric in the composite score (`minDistance * escapeRoutes`), consistent with existing away logic structure
- `towards` + plural targets uses average distance to all targets (centroid approximation), not pathfinding to centroid
- All targets in the plural group should be excluded from the obstacle set during towards pathfinding (per lesson-002: exclude targets from obstacles)
- Plural target + Charge actionType is rejected (Charge is `"charge"` not `"move"`)
- `hasCandidates` in selectors.ts needs no changes — it's only called when distinguishing `filter_failed` from `no_target`, and plural targets skip filters entirely

## Constraints

- Max 400 lines per file — `game-movement.ts` is currently 363 lines; new function must stay within budget or extract helpers
- Existing tiebreak hierarchy must be preserved exactly for all movement modes
- TypeScript strict mode compliance required
- All new code requires tests (TDD workflow)
- Lesson 002: Exclude all plural targets from obstacle set in pathfinding

## Test Plan

### Unit: `src/engine/game-movement.test.ts`

1. `away` + `enemies`: mover between two enemies moves to hex maximizing min-distance from both
2. `away` + `enemies`: mover surrounded on three sides picks best escape direction
3. `towards` + `allies`: isolated mover moves toward centroid of ally group
4. `towards` + `allies`: mover already among allies stays put (or moves minimally)
5. Edge case: plural group has one member — identical behavior to singular target
6. Edge case: plural group is empty — returns current position

### Unit: `src/engine/selectors.test.ts`

7. `evaluateTargetCriterion` returns `null` for `"enemies"` target
8. `evaluateTargetCriterion` returns `null` for `"allies"` target

### Integration: `src/engine/game-decisions.test.ts`

9. Move skill with `target: "enemies"` + `behavior: "away"` produces valid Action with computed targetCell
10. Non-movement skill with `target: "enemies"` is rejected (not selected)
11. Plural target with empty group (all enemies dead) produces `no_target` rejection
