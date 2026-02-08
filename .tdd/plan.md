# Implementation Plan: Session B (Phases 4+5+6)

## Overview

Three phases bundled into one session (~25 acceptance criteria). Ordered for test-first development with minimal rework.

**Dependency graph:**

- Phase 4 (Ranged Attack): Independent, registry-only
- Phase 5 (distance/Dash): Depends on Phase 4 pattern; requires type + engine changes
- Phase 6 (most_enemies_nearby): Fully independent of Phases 4 and 5

**Recommended order:** Phase 4 -> Phase 6 -> Phase 5 (Phase 6 is simpler, isolates the more complex Phase 5 at the end)

---

## Phase 4: Ranged Attack (Registry Only)

**Goal:** Add Ranged Attack to `SKILL_REGISTRY`. Zero engine changes.

### Step 4.1: Update Registry Tests

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`

Tests to add (new `describe("Ranged Attack")` block):

1. **Registry count and ID list** -- Update existing test at line 17: `toHaveLength(4)` -> `toHaveLength(5)`, add `"ranged-attack"` to expected ID array
2. **Stats verification** -- `ranged-attack` has: `actionType: "attack"`, `tickCost: 1`, `range: 4`, `damage: 15`, `cooldown: 2`
3. **Non-innate** -- `innate: false`
4. **No behaviors** -- `behaviors: []`, `defaultBehavior: ""`
5. **Default targeting** -- `defaultTarget: "enemy"`, `defaultCriterion: "nearest"`, `targetingMode: "cell"`
6. **createSkillFromDefinition propagates stats** -- Create skill from ranged-attack def, verify `damage: 15`, `range: 4`, `tickCost: 1`, `actionType: "attack"`

### Step 4.2: Add Registry Entry

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

Add to `SKILL_REGISTRY` array (after heal, before closing bracket):

```typescript
{
  id: "ranged-attack",
  name: "Ranged Attack",
  actionType: "attack",
  tickCost: 1,
  range: 4,
  damage: 15,
  behaviors: [],
  defaultBehavior: "",
  innate: false,
  defaultTarget: "enemy",
  defaultCriterion: "nearest",
  targetingMode: "cell",
  cooldown: 2,
}
```

No other files change. Existing attack resolution (`combat.ts`), decision logic (`game-decisions.ts`), and cooldown system (`game-core.ts`) are already generic.

### Step 4.3: Verify All Tests Pass

Run `npm run test` and `npm run type-check`. Expect all existing tests + new tests to pass.

---

## Phase 6: `most_enemies_nearby` Criterion

**Goal:** Add AoE-optimal targeting criterion. Independent of Phases 4 and 5.

### Step 6.1: Update `Criterion` Type

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts` (line 129)

Change:

```typescript
export type Criterion = "nearest" | "furthest" | "lowest_hp" | "highest_hp";
```

To:

```typescript
export type Criterion =
  | "nearest"
  | "furthest"
  | "lowest_hp"
  | "highest_hp"
  | "most_enemies_nearby";
```

This will cause a compile error in `selectors.ts` (exhaustive switch) -- intentional.

### Step 6.2: Write Selector Tests

**File:** `/home/bob/Projects/auto-battler/src/engine/selectors-target-criterion.test.ts` (add new `describe` block)

Tests to add:

1. **Basic selection** -- 3 enemies at various positions; evaluator at origin; enemy B has 2 other enemies within 2 hexes, enemy A has 1, enemy C has 0. Criterion selects B.
2. **Tiebreak by position** -- Two enemies have equal nearby-enemy counts. Lower R wins, then lower Q.
3. **All equal counts** -- Three enemies each with 1 nearby. First by tiebreak (lower R, lower Q) wins.
4. **Works with filter** -- Candidate pool is pre-narrowed by filter; criterion operates on filtered pool only.
5. **Works with enemy target pool** -- Standard case, evaluator is friendly, targets are enemies, counts enemies near each enemy candidate.
6. **Works with ally target pool** -- Evaluator targets allies; counts enemies (opposing faction to evaluator) near each ally candidate.
7. **Single candidate** -- Returns the only candidate regardless of nearby count.
8. **No candidates** -- Returns null.

**Key implementation detail for tests:** "enemies" in the criterion always means the evaluator's opposing faction. Set up characters with known positions and verify the counting logic.

### Step 6.3: Implement `most_enemies_nearby` Case

**File:** `/home/bob/Projects/auto-battler/src/engine/selectors.ts`

Add import for `hexDistance` (already imported via types.ts re-export, but may need direct import from `hex.ts` if not available). Check: `hexDistance` is already imported on line 6 from `./types`.

Add case before the `default` exhaustive guard:

```typescript
case "most_enemies_nearby": {
  // Count enemies (evaluator's opposing faction) within 2 hexes of each candidate
  const enemies = allCharacters.filter(
    (c) => c.faction !== evaluator.faction && c.hp > 0,
  );
  const NEARBY_RADIUS = 2;
  const result = findMinimum(candidates, (a, b) => {
    const countA = enemies.filter(
      (e) => e.id !== a.id && hexDistance(e.position, a.position) <= NEARBY_RADIUS,
    ).length;
    const countB = enemies.filter(
      (e) => e.id !== b.id && hexDistance(e.position, b.position) <= NEARBY_RADIUS,
    ).length;
    if (countA !== countB) {
      return countB - countA; // Higher count wins (reverse sort)
    }
    return tieBreakCompare(a, b);
  });
  return result;
}
```

**Design note:** The `enemies` pool is computed once outside `findMinimum` for efficiency. The `e.id !== a.id` check excludes the candidate itself from its own nearby count (an enemy candidate should not count itself as "nearby enemy"). This matters when target is `enemy` -- the candidate IS an enemy, so without exclusion, every enemy would count itself.

### Step 6.4: Update UI Dropdown

**File:** `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx`

1. **Criterion dropdown** (around line 248): Add `<option value="most_enemies_nearby">Most Enemies Nearby</option>` after `highest_hp`
2. **handleCriterionChange** (line 60-64): Add `"most_enemies_nearby"` to the type cast union

**File:** `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx` (legacy)

Add `"most_enemies_nearby"` to the Criterion cast at line 128 for completeness.

### Step 6.5: Verify Component Tests

**File:** `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab-config.test.tsx`

Verify or add test that the criterion dropdown renders the `most_enemies_nearby` option.

### Step 6.6: Run Full Test Suite

`npm run test && npm run type-check && npm run lint`

---

## Phase 5: `distance` Field + Dash

**Goal:** Parameterize movement distance and add Dash skill with multi-step movement.

### Step 5.1: Add `distance` to Types

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts`

Add `distance?: number;` to the `Skill` interface (after `healing?: number;`, around line 62).

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

Add `distance?: number;` to the `SkillDefinition` interface (after `healing?: number;`, around line 33).

### Step 5.2: Add `distance` to Test Helper

**File:** `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts`

Update `createSkill()` to include `distance`:

```typescript
distance: overrides.distance,
```

Add after `healing: overrides.healing,` (line 64).

### Step 5.3: Propagate `distance` in Registry Functions

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

1. **`getDefaultSkills()`** (line 115-131): Add `...(def.distance !== undefined ? { distance: def.distance } : {})` after the healing spread.
2. **`createSkillFromDefinition()`** (line 137-153): Same spread addition.

### Step 5.4: Set `distance: 1` on Move Definition

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

Add `distance: 1` to the `move-towards` definition (makes implicit distance explicit).

### Step 5.5: Write Tests for `distance` Propagation

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`

Add to existing describe blocks:

1. **Move has distance 1** -- `SKILL_REGISTRY.find(s => s.id === "move-towards")?.distance` is `1`
2. **getDefaultSkills propagates distance** -- Default Move skill has `distance: 1`
3. **createSkillFromDefinition propagates distance** -- Create from move def, verify `distance: 1`
4. **Skills without distance have undefined** -- Light Punch, Heavy Punch, Heal have `distance: undefined`

### Step 5.6: Write Multi-Step Movement Tests

**File:** `/home/bob/Projects/auto-battler/src/engine/game-movement-multistep.test.ts` (NEW FILE)

Tests for a new `computeMultiStepDestination()` function (or modified `computeMoveDestination` with distance parameter):

1. **distance=1 returns same as current behavior** -- Single-step, identical to existing `computeMoveDestination`
2. **distance=2 towards, clear path** -- Mover at (0,0), target at (3,0). After 2 steps, mover at (2,0).
3. **distance=2 towards, second step blocked** -- Mover at (0,0), target at (3,0), blocker at (2,0). Mover reaches (1,0) only (partial movement).
4. **distance=2 towards, first step blocked** -- All neighbors of mover blocked. Mover stays at (0,0).
5. **distance=2 away, clear path** -- Mover moves 2 hexes away from target using iterative best-hex selection.
6. **distance=2 away, second step blocked** -- Partial away movement.
7. **distance=2 away, all blocked** -- Stays in place.
8. **distance=1 away, backward compatible** -- Same as current away behavior.
9. **distance=undefined defaults to 1** -- Undefined distance treated as 1 step.

### Step 5.7: Implement Multi-Step Movement

**File:** `/home/bob/Projects/auto-battler/src/engine/game-movement.ts`

Add new exported function `computeMultiStepDestination()`:

```typescript
export function computeMultiStepDestination(
  mover: Character,
  target: Character,
  mode: "towards" | "away",
  allCharacters: Character[],
  distance: number = 1,
): Position {
  let currentPosition = mover.position;

  for (let step = 0; step < distance; step++) {
    // Create a virtual mover at the current simulated position
    const virtualMover = { ...mover, position: currentPosition };
    const nextPosition = computeMoveDestination(
      virtualMover,
      target,
      mode,
      allCharacters,
    );

    // If stuck (returned same position), stop
    if (positionsEqual(nextPosition, currentPosition)) {
      break;
    }

    currentPosition = nextPosition;
  }

  return currentPosition;
}
```

**Design decision:** This wraps `computeMoveDestination()` iteratively rather than modifying it. Each step uses the current simulated position. The obstacle set includes all characters at their original positions (snapshot-based, consistent with how decision phase works). The virtual mover does NOT update the `allCharacters` array between steps -- its own original position remains as an obstacle at step 1 but is filtered out by `buildObstacleSet` which excludes the mover.

**Important subtlety:** The `buildObstacleSet` inside `computeMoveDestination` excludes the mover by ID. Since we pass a virtual mover with the same ID, the mover's original position is correctly excluded. But the virtual mover's intermediate position is NOT in the obstacle set either (since no character occupies it). This means step 2 picks from neighbors of the step-1 position, avoiding obstacles but not avoiding the mover's original cell (which is fine -- the mover has logically left it).

### Step 5.8: Wire Multi-Step into Decision Phase

**File:** `/home/bob/Projects/auto-battler/src/engine/game-actions.ts`

Update `createSkillAction()` move branch (line 77-85):

```typescript
} else {
  // Move: compute destination (supports multi-step via distance)
  const distance = skill.distance ?? 1;
  if (distance > 1) {
    targetCell = computeMultiStepDestination(
      character, target, skill.behavior as "towards" | "away",
      allCharacters, distance,
    );
  } else {
    targetCell = computeMoveDestination(
      character, target, skill.behavior as "towards" | "away",
      allCharacters,
    );
  }
  targetCharacter = null;
}
```

Add import for `computeMultiStepDestination` from `./game-movement`.

### Step 5.9: Write Dash Registry Tests

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`

Add `describe("Dash")` block:

1. **Registry count update** -- Update count from 5 (after Phase 4) to 6
2. **Stats** -- `id: "dash"`, `actionType: "move"`, `tickCost: 0`, `range: 1`, `distance: 2`, `cooldown: 3`
3. **Behaviors** -- `behaviors: ["towards", "away"]`, `defaultBehavior: "away"`
4. **Non-innate** -- `innate: false`
5. **Default targeting** -- `defaultTarget: "enemy"`, `defaultCriterion: "nearest"`
6. **createSkillFromDefinition propagates distance** -- Verify `distance: 2` on created skill

### Step 5.10: Add Dash Registry Entry

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

Add to `SKILL_REGISTRY` array:

```typescript
{
  id: "dash",
  name: "Dash",
  actionType: "move",
  tickCost: 0,
  range: 1,
  distance: 2,
  behaviors: ["towards", "away"],
  defaultBehavior: "away",
  innate: false,
  defaultTarget: "enemy",
  defaultCriterion: "nearest",
  targetingMode: "cell",
  cooldown: 3,
}
```

### Step 5.11: Write Integration Tests

**File:** `/home/bob/Projects/auto-battler/src/engine/game-actions.test.ts` (existing or new)

Integration tests for `createSkillAction` with distance:

1. **Move skill (distance 1) produces single-step destination** -- Backward compatible
2. **Dash skill (distance 2) produces two-step destination** -- Uses `computeMultiStepDestination`
3. **Dash with blocked second step produces partial destination** -- One step moved
4. **Dash tickCost 0 resolves same tick** -- `resolvesAtTick === tick`

### Step 5.12: Run Full Test Suite

`npm run test && npm run type-check && npm run lint`

---

## Summary of Files Modified

### Phase 4 (2 files)

| File                                | Change                                |
| ----------------------------------- | ------------------------------------- |
| `src/engine/skill-registry.ts`      | Add ranged-attack entry               |
| `src/engine/skill-registry.test.ts` | Update count, add Ranged Attack tests |

### Phase 6 (4-5 files)

| File                                            | Change                                     |
| ----------------------------------------------- | ------------------------------------------ |
| `src/engine/types.ts`                           | Add `"most_enemies_nearby"` to `Criterion` |
| `src/engine/selectors.ts`                       | Add case in `evaluateTargetCriterion`      |
| `src/engine/selectors-target-criterion.test.ts` | Add `most_enemies_nearby` tests            |
| `src/components/CharacterPanel/SkillRow.tsx`    | Add dropdown option + update cast          |
| `src/components/SkillsPanel/SkillsPanel.tsx`    | Update criterion cast (legacy)             |

### Phase 5 (7-8 files)

| File                                         | Change                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/engine/types.ts`                        | Add `distance?: number` to `Skill`                                                          |
| `src/engine/skill-registry.ts`               | Add `distance` to `SkillDefinition`, Move def, Dash entry, propagation in factory functions |
| `src/engine/game-test-helpers.ts`            | Add `distance` to `createSkill()`                                                           |
| `src/engine/game-movement.ts`                | Add `computeMultiStepDestination()`                                                         |
| `src/engine/game-actions.ts`                 | Wire multi-step into `createSkillAction()`                                                  |
| `src/engine/skill-registry.test.ts`          | Update count, add Dash tests, distance propagation tests                                    |
| `src/engine/game-movement-multistep.test.ts` | NEW: Multi-step movement tests                                                              |
| `src/engine/game-actions.test.ts`            | Integration tests for distance in actions                                                   |

### Total: ~12 files modified, 1 new test file

---

## Architectural Risks and Mitigations

### Risk 1: Multi-step obstacle snapshot

**Risk:** `computeMultiStepDestination` uses the original `allCharacters` positions for obstacle checks at every step. A mover's intermediate positions are not added as obstacles for its own subsequent steps.
**Mitigation:** This is correct -- the mover's own position is excluded by ID in `buildObstacleSet`. The mover logically moves through intermediate cells. Other characters remain at their decision-phase positions (snapshot model, consistent with existing architecture).

### Risk 2: Resolution-phase collision with multi-step

**Risk:** `resolveMovement()` only checks collisions at the final `targetCell`. Two dashers could cross paths without collision.
**Mitigation:** This is acceptable. The decision phase handles intermediate blocking (obstacles prevent movement). Resolution-phase mover-vs-mover collision only happens at the destination cell, consistent with existing single-step behavior. The spec says "blocker-wins collision rule per step" which refers to obstacle blocking during the decision-phase computation, not mover-vs-mover crossing.

### Risk 3: `most_enemies_nearby` counting self

**Risk:** When targeting enemies, each enemy candidate could count itself as a nearby enemy, inflating all counts equally.
**Mitigation:** Exclude the candidate from its own nearby count with `e.id !== candidate.id`. This ensures the criterion meaningfully differentiates between candidates.

---

## New Decisions

### Decision: Wrap `computeMoveDestination` for multi-step (not modify it)

**Context:** Multi-step movement needs to iterate single-step logic. Options: (a) add `distance` parameter to `computeMoveDestination`, (b) create wrapper function.
**Decision:** Create `computeMultiStepDestination()` as a separate function that calls `computeMoveDestination()` in a loop.
**Consequences:** Existing callers of `computeMoveDestination()` are unaffected. The new function is explicitly used only when `distance > 1`. Slightly more code but zero risk to existing movement behavior.

### Decision: Hardcode 2-hex radius for `most_enemies_nearby`

**Context:** Requirements specify "enemies within 2 hexes" with no mention of configurability.
**Decision:** Hardcode `NEARBY_RADIUS = 2` as a constant within the case block.
**Consequences:** If configurability is needed later, extract to a criterion parameter. For now, keep it simple.

**Recommend adding both decisions to `.docs/decisions/index.md` after implementation.**

---

## Spec Alignment Checklist

- [x] Plan aligns with `.docs/spec.md` requirements (skill registry pattern, targeting system, collision resolution)
- [x] Approach consistent with `.docs/architecture.md` (pure engine logic, centralized registry, data-driven targeting)
- [x] Patterns follow `.docs/patterns/index.md` (no new UI patterns needed beyond dropdown options)
- [x] No conflicts with `.docs/decisions/index.md` (ADR-005 centralized registry, ADR-010 movement before combat, ADR-011 universal behavior)
- [x] Exhaustive switch pattern in selectors.ts respected (new criterion case added before default guard)
- [x] Test helper pattern followed (createSkill updated with new field)
