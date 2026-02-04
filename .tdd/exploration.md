# Exploration: TypeScript Errors in Test Files (Phase 2 Hex Conversion)

## Summary

271 TypeScript errors across 38 test files. All are mechanical {x,y} to {q,r} coordinate updates except 3 outliers. The Position type is now `{ q: number; r: number }` (defined in `src/engine/types.ts:16-19`). All coordinates must satisfy hex validity: `max(|q|, |r|, |q+r|) <= 5`.

## Error Classification

### By TypeScript Error Code

| Error Code | Count | Description                                                             |
| ---------- | ----- | ----------------------------------------------------------------------- |
| TS2353     | 253   | `'x' does not exist in type 'Position'` - Direct {x,y} object literals  |
| TS2322     | 10    | Type assignment incompatibility (targetCell has {x,y} instead of {q,r}) |
| TS2352     | 4     | Type assertion `as Position` on {x,y} objects                           |
| TS2739     | 1     | Missing properties q,r in useDamageNumbers helper                       |
| TS2554     | 1     | Wrong argument count for findPath (4 args, expects 3)                   |
| TS2532     | 1     | Object possibly undefined (token-hover.test.tsx:44)                     |
| TS2339     | 1     | Property 'advanceTick' does not exist on store actions                  |

### By Category

**Category A: Pure coordinate swap (267 errors, 98.5%)**
Replace `{ x: N, y: M }` with `{ q: Q, r: R }` where coordinates satisfy hex validity.

- TS2353 (253): Object literal `{ x: ..., y: ... }` where Position expected
- TS2322 (10): targetCell property has wrong type (same fix)
- TS2352 (4): `{ x: 0, y: 0 } as Position` type assertions
- TS2739 (1): Helper function parameter typed as `{ x: number; y: number }`

**Category B: Non-coordinate errors (4 errors, 1.5%)**

1. **TS2554** (1 error) - `pathfinding.test.ts:306` - `findPath(start, goal, obstacles, 5)` passes 4 args but function now takes 3 (radius is no longer a parameter; hex grid has fixed radius). **Fix:** Remove the 4th argument. The test already has a valid 3-arg call on line 300; delete the redundant 4-arg call (lines 305-307).

2. **TS2339** (1 error) - `battle-viewer-tooltip.test.tsx:197` - `actions.advanceTick()` does not exist. Store has `nextTick` and `processTick` but no `advanceTick`. **Fix:** Replace with `actions.nextTick()` (which advances to next tick).

3. **TS2532** (1 error) - `token-hover.test.tsx:44` - `mockOnMouseEnter.mock.calls[0][1]` is possibly undefined. **Fix:** Add non-null assertion or optional chaining. This is a pre-existing issue unrelated to hex conversion. Consider `mockOnMouseEnter.mock.calls[0]?.[1]` or `mockOnMouseEnter.mock.calls[0]![1]`.

## Error Count by File

| #   | File                                                                   | Errors | Category |
| --- | ---------------------------------------------------------------------- | ------ | -------- |
| 1   | `src/stores/gameStore-selectors-intent-preview.test.ts`                | 36     | A        |
| 2   | `src/stores/gameStore-selectors-movement-target.test.ts`               | 20     | A        |
| 3   | `src/components/BattleViewer/IntentOverlay-rendering.test.tsx`         | 18     | A        |
| 4   | `src/engine/selectors-tie-breaking.test.ts`                            | 16     | A        |
| 5   | `src/engine/triggers-cell-targeted.test.ts`                            | 14     | A        |
| 6   | `src/stores/gameStore-selectors-movement-intent.test.ts`               | 13     | A        |
| 7   | `src/stores/gameStore-selectors-intent-filter.test.ts`                 | 13     | A        |
| 8   | `src/components/BattleStatus/BattleStatusBadge.test.tsx`               | 12     | A        |
| 9   | `src/engine/selectors-nearest-enemy.test.ts`                           | 11     | A        |
| 10  | `src/stores/gameStore-selectors-intent-ticks.test.ts`                  | 10     | A        |
| 11  | `src/engine/selectors-lowest-hp-enemy.test.ts`                         | 9      | A        |
| 12  | `src/engine/selectors-lowest-hp-ally.test.ts`                          | 9      | A        |
| 13  | `src/engine/selectors-nearest-ally.test.ts`                            | 8      | A        |
| 14  | `src/engine/movement-groups-stress.test.ts`                            | 8      | A        |
| 15  | `src/engine/selectors-metric-independence.test.ts`                     | 6      | A        |
| 16  | `src/engine/game-decisions-mid-action-skip.test.ts`                    | 6      | A        |
| 17  | `src/engine/game-decisions-action-type-inference.test.ts`              | 6      | A        |
| 18  | `src/engine/game-core-apply-decisions.test.ts`                         | 6      | A        |
| 19  | `src/engine/combat-edge-cases.test.ts`                                 | 6      | A        |
| 20  | `src/components/RuleEvaluations/rule-evaluations-next-action.test.tsx` | 6      | A        |
| 21  | `src/engine/selectors-edge-cases.test.ts`                              | 5      | A        |
| 22  | `src/engine/triggers-edge-cases.test.ts`                               | 4      | A        |
| 23  | `src/engine/selectors-self.test.ts`                                    | 4      | A        |
| 24  | `src/engine/game-decisions-no-match-idle.test.ts`                      | 3      | A        |
| 25  | `src/engine/game-core-process-tick-combat-movement.test.ts`            | 3      | A        |
| 26  | `src/engine/game-core-clear-resolved-actions.test.ts`                  | 3      | A        |
| 27  | `src/engine/triggers-always.test.ts`                                   | 2      | A        |
| 28  | `src/engine/game-decisions-disabled-skills.test.ts`                    | 2      | A        |
| 29  | `src/components/BattleViewer/IntentLine-action-colors.test.tsx`        | 2      | A        |
| 30  | `src/components/BattleViewer/IntentLine-accessibility.test.tsx`        | 2      | A        |
| 31  | `src/stores/gameStore-selectors-evaluations.test.ts`                   | 1      | A        |
| 32  | `src/engine/game-integration.test.ts`                                  | 1      | A        |
| 33  | `src/engine/combat-multi-attack.test.ts`                               | 1      | A        |
| 34  | `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx`       | 1      | A        |
| 35  | `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`           | 1      | A+B      |
| 36  | `src/engine/pathfinding.test.ts`                                       | 1      | B        |
| 37  | `src/components/BattleViewer/battle-viewer-tooltip.test.tsx`           | 1      | B        |
| 38  | `src/components/BattleViewer/token-hover.test.tsx`                     | 1      | B        |

## Sample Errors with Solutions

### Sample 1: TS2353 - Object literal property swap (most common)

**File:** `src/engine/combat-edge-cases.test.ts:35`

```typescript
// BEFORE:
position: { x: 5, y: 5 },
// AFTER:
position: { q: 5, r: 0 },  // or other valid hex coord
```

**Note:** Cannot blindly map x->q, y->r. Must ensure `max(|q|, |r|, |q+r|) <= 5`. Example: `{x: 5, y: 5}` cannot become `{q: 5, r: 5}` because `|q+r| = 10 > 5`. Use coordinates like `{q: 2, r: 3}` or `{q: 5, r: 0}`.

### Sample 2: TS2352 - Type assertion on wrong shape

**File:** `src/components/BattleViewer/IntentLine-accessibility.test.tsx:13-14`

```typescript
// BEFORE:
from: { x: 0, y: 0 } as Position,
to: { x: 5, y: 5 } as Position,
// AFTER:
from: { q: 0, r: 0 } as Position,
to: { q: 2, r: 3 } as Position,
```

### Sample 3: TS2322 - Nested targetCell property

**File:** `src/components/BattleViewer/IntentOverlay-rendering.test.tsx:43-44`

```typescript
// BEFORE:
position: { x: 0, y: 0 },
currentAction: { ...action, targetCell: { x: 5, y: 5 } }
// AFTER:
position: { q: 0, r: 0 },
currentAction: { ...action, targetCell: { q: 2, r: 3 } }
```

### Sample 4: TS2739 - Helper function parameter type

**File:** `src/components/BattleViewer/hooks/useDamageNumbers.test.ts:17`

```typescript
// BEFORE:
const createCharacter = (id, faction, position: { x: number; y: number }): Character => ({
// AFTER:
const createCharacter = (id, faction, position: { q: number; r: number }): Character => ({
```

Also update all call sites: `createCharacter("char1", "friendly", { q: 0, r: 0 })`.

### Sample 5: TS2554 - Wrong argument count

**File:** `src/engine/pathfinding.test.ts:306`

```typescript
// BEFORE:
const pathWithRadius = findPath(start, goal, obstacles, 5);
// AFTER:
// Remove entirely - findPath now takes exactly 3 args (no radius param)
// The hex grid has fixed radius, so this overload no longer exists
```

### Sample 6: TS2339 - Missing store action

**File:** `src/components/BattleViewer/battle-viewer-tooltip.test.tsx:197`

```typescript
// BEFORE:
actions.advanceTick();
// AFTER:
actions.nextTick();
```

## Coordinate Mapping Strategy

When converting `{x, y}` to `{q, r}`, the values must satisfy `max(|q|, |r|, |q+r|) <= 5`.

**Safe coordinate mappings for common test positions:**

| Old {x, y} | New {q, r} | Validity check: max(\|q\|, \|r\|, \|q+r\|) |
| ---------- | ---------- | ------------------------------------------ |
| {0, 0}     | {0, 0}     | max(0, 0, 0) = 0                           |
| {1, 0}     | {1, 0}     | max(1, 0, 1) = 1                           |
| {0, 1}     | {0, 1}     | max(0, 1, 1) = 1                           |
| {1, 1}     | {1, 1}     | max(1, 1, 2) = 2                           |
| {2, 2}     | {2, 2}     | max(2, 2, 4) = 4                           |
| {3, 3}     | {3, 2}     | max(3, 2, 5) = 5                           |
| {5, 5}     | {2, 3}     | max(2, 3, 5) = 5                           |
| {5, 0}     | {5, 0}     | max(5, 0, 5) = 5                           |
| {0, 5}     | {0, 5}     | max(0, 5, 5) = 5                           |
| {6, 6}     | {3, 2}     | max(3, 2, 5) = 5                           |
| {10, 10}   | {5, 0}     | max(5, 0, 5) = 5                           |
| {11, 0}    | {5, -5}    | max(5, 5, 0) = 5                           |
| {0, 11}    | {-5, 5}    | max(5, 5, 0) = 5                           |
| {11, 11}   | {-5, 5}    | max(5, 5, 0) = 5                           |

**Key principle:** Tests only care about relative distances between characters, not absolute positions. So the exact coordinate values do not matter as long as:

1. They are valid hex coordinates
2. The relative distances between characters match the test's intent (e.g., "in range" vs "out of range")
3. No two characters occupy the same hex (unless testing collision)

## Risk Assessment

**Low risk overall.** This is purely mechanical refactoring:

- 98.5% of errors (267/271) are simple coordinate swaps
- Test helpers (`createCharacter`, `createAttackAction`, etc.) already use `{q, r}` format
- No logic changes needed
- The 4 outlier errors have clear, isolated fixes

**Risks to watch:**

1. **Hex validity constraint:** Cannot simply map x->q, y->r for large values. Values like `{x: 11, y: 11}` (old grid corners) need careful remapping.
2. **Distance semantics:** Some tests rely on specific distances between characters. Hex distance differs from Chebyshev. Must ensure test positions preserve intended distances.
3. **Test ordering within files:** Some tests build on state from previous tests. Changing coordinates in one test might affect later tests in the same describe block. However, most tests use `beforeEach` resets.
4. **`advanceTick` rename** in tooltip test: Need to verify `nextTick` is the correct replacement (it is - the store exposes `nextTick` and `processTick` but not `advanceTick`).

## Effort Estimate

- **Category A (267 errors):** ~1-2 hours of mechanical work. Can be batched by file. Largest files: intent-preview (36 errors), movement-target (20), IntentOverlay-rendering (18).
- **Category B (4 errors):** ~10 minutes. Each is a one-line fix.
- **Validation:** ~15 minutes to run type-check + test suite after changes.
- **Total estimate:** ~2-3 hours

## Files Already Explored

- `src/engine/types.ts` - Position type definition (lines 16-19)
- `src/engine/pathfinding.ts` - findPath signature (3 args, no radius)
- `src/engine/game-test-helpers.ts` - createCharacter uses {q,r} already
- `src/engine/combat-test-helpers.ts` - createAttackAction uses Position type
- `src/stores/gameStore.ts` - Has `nextTick`/`processTick`, no `advanceTick`
- `src/engine/combat-edge-cases.test.ts` - Sample of partially converted file
- `src/components/BattleViewer/IntentLine-accessibility.test.tsx` - TS2352 example
- `src/components/BattleViewer/hooks/useDamageNumbers.test.ts` - TS2739 example
- `src/components/BattleViewer/token-hover.test.tsx` - TS2532 example
- `src/components/BattleViewer/battle-viewer-tooltip.test.tsx` - TS2339 example
- `src/engine/pathfinding.test.ts` - TS2554 example
