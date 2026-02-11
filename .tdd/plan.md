# Implementation Plan: Plural Target Scopes (`enemies` / `allies`)

## Overview

Add `"enemies"` and `"allies"` to the `Target` type. These plural targets reference entire groups (all living enemies or allies) rather than selecting a single character via criterion. They are meaningful only for movement behaviors and enable spatial reasoning against groups -- e.g., "move away from all enemies" maximizes minimum distance from every enemy.

## Implementation Order

Execute in this order. Each step builds on the previous one.

### Step 1: Type Definitions (`src/engine/types.ts`)

**Line 125** -- Extend the `Target` union:

```typescript
export type Target = "enemy" | "ally" | "self" | "enemies" | "allies";
```

Add constants and type guard below the `Target` type:

```typescript
export const PLURAL_TARGETS = ["enemies", "allies"] as const;

export function isPluralTarget(target: Target): target is "enemies" | "allies" {
  return target === "enemies" || target === "allies";
}
```

**Rationale**: Adding to the union triggers TypeScript exhaustive switch errors in `selectors.ts` (line 166 `default: never`), providing a compile-time safety net for all call sites.

**Impact**: Compile errors will appear in `selectors.ts` `evaluateTargetCriterion` and `hasCandidates` until those are updated (Steps 2-3).

---

### Step 2: Selector Guard (`src/engine/selectors.ts`)

**`evaluateTargetCriterion()` (line 71)** -- Add early return for plural targets immediately after the `self` guard:

```typescript
// Plural targets don't use criterion-based selection
if (isPluralTarget(target)) {
  return null;
}
```

**`hasCandidates()` (line 176)** -- Add case for plural targets. Per requirements, `hasCandidates` is only called to distinguish `filter_failed` from `no_target`, and plural targets skip filters entirely. However, for type safety with the exhaustive pattern, add a branch:

```typescript
if (isPluralTarget(target)) return true;
```

This prevents the exhaustive `if/else` chain from falling through and keeps the function consistent. The branch is effectively unreachable in current usage since plural targets skip the filter path that calls `hasCandidates`.

**Import**: Add `isPluralTarget` to the import from `./types`.

**File impact**: +5 lines (selectors.ts is 193 lines, becomes ~198).

---

### Step 3: Plural Movement Computation (`src/engine/game-movement.ts`)

Add a new exported function `computePluralMoveDestination`. This is the core new logic.

**Function signature**:

```typescript
export function computePluralMoveDestination(
  mover: Character,
  targets: Character[],
  mode: "towards" | "away",
  allCharacters: Character[],
): Position;
```

**Behavior by mode**:

**Away mode** (`mode === "away"`):

- Generate valid candidates via existing `generateValidCandidates(mover, allCharacters, "away")`
- For each candidate, compute a **plural score** where `distance` = `Math.min(...hexDistance(candidate, each target.position))` (minimum distance to any target in group)
- Escape routes computed from existing `countEscapeRoutes`
- Composite score: `minDistance * escapeRoutes` (same formula as singular away mode)
- Tiebreak hierarchy: same as `compareAwayMode` -- maximize composite, then maximize distance, then maximize |dq|, then maximize |dr|, then minimize r, then minimize q
- Reuse `compareAwayMode()` directly by constructing `CandidateScore` objects where `distance` is set to `minDistance`
- The `absDq` and `absDr` fields need aggregation too -- use the target that produced `minDistance` (the "nearest threat") as the reference for dq/dr tiebreaking

**Towards mode** (`mode === "towards"`):

- Generate valid candidates via `generateValidCandidates(mover, allCharacters, "towards")`
- For each candidate, compute `distance` = average of `hexDistance(candidate, each target.position)` (centroid approximation without actual coordinate averaging, avoids off-grid positions)
- Composite: just the average distance (no escape routes in towards mode)
- Tiebreak: reuse `compareTowardsMode()` by constructing `CandidateScore` with `distance` = average distance, and `absDq`/`absDr` computed against the nearest target in the group
- **Obstacle exclusion**: Build obstacle set excluding mover and ALL targets (per Lesson 002)
- Note: towards mode does NOT use A* pathfinding for plural targets. A* requires a single goal position. Instead, use the candidate-scoring approach (same as away mode but with minimize semantics). This is a design decision justified by the centroid approximation -- there is no single "correct" path to all targets simultaneously.

**Edge cases**:

- `targets.length === 0`: return `mover.position` (stay put)
- `targets.length === 1`: behavior should be identical to singular `computeMoveDestination`. Verified by test #5 in the test plan.

**Implementation detail -- scoring**:

For each candidate position, build a `CandidateScore`:

```typescript
// Away: use min distance to any target
// Towards: use average distance to all targets
const distances = targets.map((t) => hexDistance(candidate, t.position));
const aggregateDistance =
  mode === "away"
    ? Math.min(...distances)
    : distances.reduce((a, b) => a + b, 0) / distances.length;

// Find nearest target for dq/dr tiebreaking
const nearestTarget = targets.reduce((nearest, t) =>
  hexDistance(candidate, t.position) < hexDistance(candidate, nearest.position)
    ? t
    : nearest,
);
const score: CandidateScore = calculateCandidateScore(
  candidate,
  nearestTarget.position,
  obstacles,
);
// Override distance with aggregate
score.distance = aggregateDistance;
```

Wait -- `CandidateScore.distance` is a `number` that `calculateCandidateScore` computes via `hexDistance`. We cannot just override it because the object is freshly constructed. Better approach: construct the score manually to avoid a double-compute:

```typescript
function computePluralCandidateScore(
  candidate: Position,
  targets: Character[],
  mode: "towards" | "away",
  obstacles?: Set<string>,
): CandidateScore {
  const distances = targets.map((t) => hexDistance(candidate, t.position));
  const aggregateDistance =
    mode === "away"
      ? Math.min(...distances)
      : distances.reduce((a, b) => a + b, 0) / distances.length;

  // Use nearest target for positional tiebreaking (dq, dr)
  let nearestIdx = 0;
  let nearestDist = distances[0]!;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i]! < nearestDist) {
      nearestDist = distances[i]!;
      nearestIdx = i;
    }
  }
  const nearestTarget = targets[nearestIdx]!;

  const resultDq = nearestTarget.position.q - candidate.q;
  const resultDr = nearestTarget.position.r - candidate.r;
  const escapeRoutes = obstacles ? countEscapeRoutes(candidate, obstacles) : 6;

  return {
    distance: aggregateDistance,
    absDq: Math.abs(resultDq),
    absDr: Math.abs(resultDr),
    r: candidate.r,
    q: candidate.q,
    escapeRoutes,
  };
}
```

This helper is private (not exported). The public `computePluralMoveDestination` uses it + the existing `compareAwayMode`/`compareTowardsMode` comparators in a selection loop identical to `selectBestCandidate`.

**Multi-step support**: Add `computeMultiStepPluralDestination` following the exact same pattern as existing `computeMultiStepDestination` (ADR-017):

```typescript
export function computeMultiStepPluralDestination(
  mover: Character,
  targets: Character[],
  mode: "towards" | "away",
  allCharacters: Character[],
  distance: number = 1,
): Position;
```

Iterates single steps using `computePluralMoveDestination`, creating a virtual mover at each intermediate position. Stops early if stuck.

**File impact estimate**: `computePluralCandidateScore` (~20 lines) + `computePluralMoveDestination` (~25 lines) + `computeMultiStepPluralDestination` (~15 lines) = ~60 lines. File goes from 362 to ~422. **This exceeds the 400-line budget.** See Risk Mitigation below.

---

### Step 4: Decision Logic (`src/engine/game-decisions.ts`)

**`tryExecuteSkill()` (line 66)** -- Add plural target branch after the trigger check (line 94) and before the filter/criterion path:

```typescript
// Plural targets: build group and validate
if (isPluralTarget(skill.target)) {
  const actionType = getActionType(skill);
  if (actionType !== "move") {
    return null; // Plural targets only valid for movement
  }
  const group = buildTargetGroup(skill.target, character, allCharacters);
  if (group.length === 0) {
    return null; // No targets
  }
  return createPluralMoveAction(skill, character, group, tick, allCharacters);
}
```

**`evaluateSingleSkill()` (line 196)** -- Mirror the same branch for UI evaluation results. Insert after trigger check:

```typescript
if (isPluralTarget(skill.target)) {
  const actionType = getActionType(skill);
  if (actionType !== "move") {
    return { skill, status: "rejected", rejectionReason: "no_target" };
  }
  const group = buildTargetGroup(skill.target, character, allCharacters);
  if (group.length === 0) {
    return { skill, status: "rejected", rejectionReason: "no_target" };
  }
  return { skill, status: "selected", target: null };
}
```

Note: `SkillEvaluationResult` currently has `target?: Character`. For plural targets, target is not a single character. Setting `target: null` or omitting it is acceptable since the UI just shows "-> [target name]" and plural targets have no single target to display. The `target` field is optional in the type, so omitting it works.

**New helper** (private, in `game-decisions.ts`):

```typescript
function buildTargetGroup(
  target: "enemies" | "allies",
  evaluator: Character,
  allCharacters: Character[],
): Character[] {
  if (target === "enemies") {
    return allCharacters.filter(
      (c) => c.faction !== evaluator.faction && c.hp > 0,
    );
  }
  // allies (excluding self)
  return allCharacters.filter(
    (c) => c.faction === evaluator.faction && c.id !== evaluator.id && c.hp > 0,
  );
}
```

**Filter bypass**: The existing filter guard `skill.filter && skill.target !== "self"` on lines 97-101 and 227-231 is bypassed because the plural target branch returns before reaching the filter logic. The early return ensures filters are never evaluated for plural targets.

**Import additions**: `isPluralTarget` from `./types`, `createPluralMoveAction` from `./game-actions`.

**File impact**: +25 lines (game-decisions.ts is 333 lines, becomes ~358).

---

### Step 5: Action Creation (`src/engine/game-actions.ts`)

Add a new exported function for plural move action creation:

```typescript
export function createPluralMoveAction(
  skill: Skill,
  character: Character,
  targets: Character[],
  tick: number,
  allCharacters: Character[],
): Action {
  const distance = skill.distance ?? 1;
  let targetCell: Position;
  if (distance > 1) {
    targetCell = computeMultiStepPluralDestination(
      character,
      targets,
      skill.behavior as "towards" | "away",
      allCharacters,
      distance,
    );
  } else {
    targetCell = computePluralMoveDestination(
      character,
      targets,
      skill.behavior as "towards" | "away",
      allCharacters,
    );
  }

  return {
    type: "move",
    skill,
    targetCell,
    targetCharacter: null,
    startedAtTick: tick,
    resolvesAtTick: tick + skill.tickCost,
  };
}
```

**Import additions**: `computePluralMoveDestination`, `computeMultiStepPluralDestination` from `./game-movement`.

**File impact**: +25 lines (game-actions.ts is 117 lines, becomes ~142).

---

### Step 6: Store Selector (`src/stores/gameStore-selectors.ts`)

**`selectMovementTargetData` (line 303)** -- This selector calls `evaluateTargetCriterion` which will now return `null` for plural targets. The existing `if (!target || target.id === character.id) return null;` guard on line 341 already handles this -- plural target move skills will produce no targeting line.

This is acceptable behavior for the engine-only scope of this task. UI targeting line support for plural targets is out of scope (deferred to the UI task).

**No code changes needed** in this file for this task.

---

## File Change Summary

| File                                | Current Lines | Change | New Lines | Notes                                                    |
| ----------------------------------- | ------------- | ------ | --------- | -------------------------------------------------------- |
| `src/engine/types.ts`               | ~136          | +6     | ~142      | Target union + isPluralTarget + PLURAL_TARGETS           |
| `src/engine/selectors.ts`           | 193           | +5     | ~198      | Guards in evaluateTargetCriterion + hasCandidates        |
| `src/engine/game-movement.ts`       | 362           | +60    | ~422      | **OVER BUDGET** -- see mitigation                        |
| `src/engine/game-decisions.ts`      | 333           | +25    | ~358      | Plural branches in tryExecuteSkill + evaluateSingleSkill |
| `src/engine/game-actions.ts`        | 117           | +25    | ~142      | createPluralMoveAction                                   |
| `src/stores/gameStore-selectors.ts` | ~358          | 0      | ~358      | No changes (existing guard handles it)                   |

### Test Files (new tests only)

| File                                | Tests Added                                       |
| ----------------------------------- | ------------------------------------------------- |
| `src/engine/game-movement.test.ts`  | 6 tests (plural movement)                         |
| `src/engine/selectors.test.ts`      | 2 tests (evaluateTargetCriterion null for plural) |
| `src/engine/game-decisions.test.ts` | 3 tests (integration)                             |

---

## Risk Mitigation: 400-Line Budget for `game-movement.ts`

**Problem**: `game-movement.ts` is 362 lines. Adding ~60 lines of plural movement logic brings it to ~422, exceeding the 400-line constraint.

**Mitigation strategy**: Extract `selectBestCandidate`, `calculateCandidateScore`, `compareAwayMode`, `compareTowardsMode`, and the new `computePluralCandidateScore` into a new `src/engine/movement-scoring.ts` file.

This extraction is justified because:

1. These functions form a cohesive scoring module used by both singular and plural movement
2. They have no dependencies on other `game-movement.ts` internals except `countEscapeRoutes` and `buildObstacleSet` (which are also extractable)
3. The extraction creates a clean API boundary: `game-movement.ts` owns movement strategy (towards/away/plural routing), `movement-scoring.ts` owns candidate evaluation

**Extracted file** (`src/engine/movement-scoring.ts`, ~120 lines):

- `CandidateScore` interface
- `calculateCandidateScore()` (exported)
- `computePluralCandidateScore()` (exported)
- `compareTowardsMode()` (exported)
- `compareAwayMode()` (exported)
- `selectBestCandidate()` (exported)
- `selectBestPluralCandidate()` (exported, new -- identical loop to selectBestCandidate but uses computePluralCandidateScore)
- `countEscapeRoutes()` (exported, moved from game-movement.ts)
- `buildObstacleSet()` (exported, moved from game-movement.ts)

**Resulting file sizes**:

- `game-movement.ts`: ~362 - 180 (extracted) + 40 (new plural functions) = ~222 lines
- `movement-scoring.ts`: ~180 + 30 (new plural scoring) = ~210 lines

Both well under 400. The extraction is a refactor that does not change behavior -- existing tests pass without modification because the public API of `game-movement.ts` re-exports or delegates to the new file.

**Alternative** (if extraction is considered too large for this task): Keep everything in `game-movement.ts` by making `computePluralMoveDestination` more compact. The function can inline the scoring loop (~15 lines instead of a separate helper), bringing the total addition to ~45 lines (362 + 45 = 407). This is only 7 lines over; a minor code tightening pass (removing blank lines, combining declarations) could bring it under. However, extraction is the cleaner long-term approach.

**Recommendation**: Perform the extraction. It keeps both files well under budget and creates better separation of concerns. The extraction should happen as the first sub-step of Step 3, before adding plural logic, so that the refactor can be verified against existing tests before new code is added.

---

## How Existing Infrastructure Is Reused

| Existing Function           | Reuse for Plural Targets                                          |
| --------------------------- | ----------------------------------------------------------------- |
| `generateValidCandidates()` | Generates candidate hex positions identically for plural/singular |
| `countEscapeRoutes()`       | Used in plural away-mode scoring (same escape route logic)        |
| `compareAwayMode()`         | Used as-is for comparing plural candidate scores                  |
| `compareTowardsMode()`      | Used as-is for comparing plural candidate scores                  |
| `buildObstacleSet()`        | Used with all target IDs excluded (extended exclude list)         |
| `hexDistance()`             | Computes per-target distances for aggregation                     |
| `positionsEqual()`          | Stuck detection in multi-step loop                                |

The key insight is that `compareAwayMode` and `compareTowardsMode` operate on `CandidateScore` objects. By constructing `CandidateScore` with aggregated distance values (min for away, average for towards), the existing comparators work unchanged. The tiebreak hierarchy is preserved exactly.

---

## Test Strategy Alignment

Tests map directly to the test plan in `requirements.md`:

### Unit: `src/engine/game-movement.test.ts` (Tests 1-6)

1. **Away + enemies**: Place mover between two enemies. Verify chosen hex maximizes `min(distance to each enemy) * escapeRoutes`. Setup: mover at (0,0), enemies at (-2,0) and (2,0). Expected: mover moves to hex that maximizes minimum distance from both.

2. **Away + enemies surrounded**: Mover with enemies on three sides. Verify best escape direction is chosen (highest composite score among limited options). Setup: mover at (0,0), enemies at (1,0), (0,1), (-1,1). Expected: moves to best available hex away from cluster.

3. **Towards + allies**: Isolated mover with ally group. Verify mover moves to hex that minimizes average distance to all allies. Setup: mover at (0,-4), allies at (0,0) and (1,0). Expected: mover steps toward the group.

4. **Towards + allies already among group**: Mover surrounded by allies. Verify mover stays put or moves minimally (average distance already minimal). Setup: mover at (0,0), allies at (1,0), (-1,0), (0,1). Expected: stays at (0,0) or moves to equivalent position.

5. **Single member group**: Plural target with one member produces same result as singular target with that member. Setup: identical scenarios, compare `computePluralMoveDestination([singleTarget])` vs `computeMoveDestination(singleTarget)`.

6. **Empty group**: `computePluralMoveDestination(mover, [], mode, all)` returns `mover.position`.

### Unit: `src/engine/selectors.test.ts` (Tests 7-8)

7. `evaluateTargetCriterion("enemies", "nearest", evaluator, all)` returns `null`.
8. `evaluateTargetCriterion("allies", "nearest", evaluator, all)` returns `null`.

These are simple guard tests -- they verify the early return, not the scoring logic.

### Integration: `src/engine/game-decisions.test.ts` (Tests 9-11)

9. Full decision pipeline: character with Move skill `target: "enemies"`, `behavior: "away"`. Verify `computeDecisions` produces valid Action with type "move" and computed targetCell.

10. Non-movement skill (attack) with `target: "enemies"` is rejected. Verify `evaluateSingleSkill` returns `rejectionReason: "no_target"`.

11. All enemies dead + `target: "enemies"`. Verify rejection with `rejectionReason: "no_target"`.

---

## Spec Alignment Checklist

- [x] Plan aligns with `.docs/spec.md` -- Target system extended (spec section "Targeting System"), movement modes preserved (spec section "Movement System")
- [x] Approach consistent with `.docs/architecture.md` -- Pure engine logic, no React dependencies, data-driven targeting pattern maintained
- [x] Patterns follow `.docs/patterns/index.md` -- No new UI patterns needed (engine-only task)
- [x] No conflicts with `.docs/decisions/index.md` -- Follows ADR-017 (wrapper function pattern for multi-step), ADR-005 (skill registry uses Target type)
- [x] Lesson 002 applied -- All plural targets excluded from obstacle set in pathfinding
- [x] Lesson 001 applied -- Plural targets explicitly scoped to movement behaviors only

## New Decision

**Decision**: Create `movement-scoring.ts` to extract scoring logic from `game-movement.ts`.

**Context**: `game-movement.ts` is at 362/400 lines. Adding plural movement logic would exceed the budget. Scoring functions (`calculateCandidateScore`, `compareAwayMode`, `compareTowardsMode`, `selectBestCandidate`, `countEscapeRoutes`, `buildObstacleSet`) form a cohesive unit that both singular and plural movement share.

**Consequences**: Two files instead of one for movement logic. Clear separation of concerns (strategy vs scoring). Both files well under 400 lines. No behavior change for existing code. Recommend adding to `.docs/decisions/index.md` as ADR-024 after implementation.

## Out of Scope (noted for future tasks)

- UI changes: target dropdown options, criterion disabled state, targeting line rendering for plural targets
- `selectMovementTargetData` adaptation for plural targets (targeting lines)
- Spec/architecture doc updates
- Trigger/filter changes (triggers evaluate independently of skill target field)
