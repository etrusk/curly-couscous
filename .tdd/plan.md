# Plan: Coordinate Conversion for 271 TypeScript Errors in 38 Test Files

## Overview

Convert all remaining `{x, y}` coordinate references to `{q, r}` in 38 test files (271 TypeScript errors). This is Phase 2 of the hexagonal grid conversion.

## Coordinate Mapping Strategy

### Core Principle

Tests care about **relative spatial relationships**, not absolute positions. The conversion must preserve:

1. **Distance ordering**: If A is closer to B than C before conversion, it stays that way after
2. **Adjacency**: Characters at distance 1 stay at distance 1
3. **"In range" / "out of range"** semantics: Characters within/outside skill range stay within/outside
4. **Tiebreaking order**: Position-based tiebreaking now uses lower R, then lower Q (was lower Y, then lower X)
5. **Hex validity**: All coordinates must satisfy `max(|q|, |r|, |q+r|) <= 5`

### Hex Distance Formula

`hexDistance(a, b) = max(|dq|, |dr|, |dq + dr|)` where `dq = a.q - b.q`, `dr = a.r - b.r`

### Mapping Table

For most tests, a simple x->q, y->r swap works when coordinates are small. For large values that violate the hex constraint, use the remapping below.

| Old {x, y} | New {q, r} | max(\|q\|,\|r\|,\|q+r\|) | Hex Dist from {0,0} | Notes                    |
| ---------- | ---------- | ------------------------ | ------------------- | ------------------------ | --- | ------- |
| {0, 0}     | {0, 0}     | 0                        | 0                   | Origin                   |
| {1, 0}     | {1, 0}     | 1                        | 1                   | Adjacent east            |
| {0, 1}     | {0, 1}     | 1                        | 1                   | Adjacent SE              |
| {1, 1}     | {1, 1}     | 2                        | 2                   | Valid                    |
| {2, 0}     | {2, 0}     | 2                        | 2                   | Valid                    |
| {0, 2}     | {0, 2}     | 2                        | 2                   | Valid                    |
| {2, 2}     | {2, 2}     | 4                        | 4                   | Valid                    |
| {3, 2}     | {3, 2}     | 5                        | 5                   | Boundary                 |
| {3, 3}     | {3, 2}     | 5                        | 5                   | Remapped (               | 3+3 | =6 > 5) |
| {4, 4}     | {2, 2}     | 4                        | 4                   | Remapped to interior     |
| {4, 5}     | {4, 1}     | 5                        | 5                   | Remapped                 |
| {5, 0}     | {5, 0}     | 5                        | 5                   | Boundary                 |
| {0, 5}     | {0, 5}     | 5                        | 5                   | Boundary                 |
| {5, 5}     | {2, 3}     | 5                        | 5                   | Remapped (far away)      |
| {6, 6}     | {3, 2}     | 5                        | 5                   | Remapped (far away)      |
| {6, 3}     | {3, -1}    | 3                        | 3                   | Remapped                 |
| {7, 3}     | {4, -1}    | 4                        | 4                   | Remapped                 |
| {7, 7}     | {3, 2}     | 5                        | 5                   | Remapped                 |
| {8, 5}     | {5, -2}    | 5                        | 5                   | Remapped (far)           |
| {5, 6}     | {2, 3}     | 5                        | 5                   | Remapped                 |
| {5, 7}     | {1, 4}     | 5                        | 5                   | Remapped                 |
| {5, 8}     | {0, 5}     | 5                        | 5                   | Remapped                 |
| {10, 10}   | {5, 0}     | 5                        | 5                   | Max distance from origin |
| {11, 0}    | {5, -5}    | 5                        | 5                   | Boundary                 |
| {0, 11}    | {-5, 5}    | 5                        | 5                   | Boundary                 |
| {11, 11}   | {-5, 5}    | 5                        | 5                   | Remapped                 |

### Context-Sensitive Mapping Rules

**IMPORTANT**: The table above provides defaults. Many tests require context-sensitive mapping to preserve test semantics. Each conversion must consider:

1. **Distance relationships between characters in the same test**: If test has evaluator at {5,5} and enemy at {5,7} (Chebyshev dist=2), the hex positions must also be hex distance 2 apart.

2. **Range-based semantics**: If a skill has range=1 and a character is "in range", positions must be hex distance 1 apart. If "out of range", positions must be > range hex distance.

3. **Tiebreaking expectations**: Tests asserting tiebreaking results (lower Y wins -> lower R wins, lower X wins -> lower Q wins) must place characters with the correct R/Q ordering.

4. **Same-cell semantics**: For targetCell matching (combat hit/miss), the targetCell and character position must be identical.

## File Groups by Conversion Complexity

### Group 1: Simple Swap (position properties only, no assertions on position values)

These files only use `{x, y}` in position/targetCell properties and don't assert specific coordinate values. Pure mechanical `x->q, y->r` swap with hex validity check.

| #   | File                                                             | Errors | Pattern     |
| --- | ---------------------------------------------------------------- | ------ | ----------- |
| 1   | `src/stores/gameStore-selectors-evaluations.test.ts`             | 1      | Simple swap |
| 2   | `src/engine/game-integration.test.ts`                            | 1      | Simple swap |
| 3   | `src/engine/combat-multi-attack.test.ts`                         | 1      | Simple swap |
| 4   | `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` | 1      | Simple swap |
| 5   | `src/engine/triggers-always.test.ts`                             | 2      | Simple swap |
| 6   | `src/engine/game-decisions-disabled-skills.test.ts`              | 2      | Simple swap |
| 7   | `src/components/BattleViewer/IntentLine-action-colors.test.tsx`  | 2      | Simple swap |
| 8   | `src/engine/game-decisions-no-match-idle.test.ts`                | 3      | Simple swap |
| 9   | `src/engine/game-core-clear-resolved-actions.test.ts`            | 3      | Simple swap |
| 10  | `src/engine/selectors-self.test.ts`                              | 4      | Simple swap |
| 11  | `src/engine/triggers-edge-cases.test.ts`                         | 4      | Simple swap |
| 12  | `src/engine/selectors-edge-cases.test.ts`                        | 5      | Simple swap |

**Total: 29 errors, 12 files**

**Conversion pattern**: Replace `{ x: N, y: M }` with `{ q: Q, r: R }` using the mapping table. All values N,M in these files are small (0-5) and valid for direct x->q, y->r swap.

### Group 2: Action/Intent Data (positions in Action objects and assertions on action data)

These files create Action objects with targetCell and position, and some assert on the specific coordinate values via `toEqual`. The position values are used as identifiers, so the converted values must be consistent within each test.

| #   | File                                                                   | Errors | Key Concern                                                        |
| --- | ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| 1   | `src/stores/gameStore-selectors-intent-ticks.test.ts`                  | 10     | targetCell values appear in `toEqual` assertions on action objects |
| 2   | `src/stores/gameStore-selectors-intent-filter.test.ts`                 | 13     | targetCell + characterPosition in `toEqual` assertions             |
| 3   | `src/stores/gameStore-selectors-movement-intent.test.ts`               | 13     | targetCell + characterPosition `toEqual` assertions                |
| 4   | `src/stores/gameStore-selectors-intent-preview.test.ts`                | 36     | targetCell in committed actions + `toEqual` assertions             |
| 5   | `src/components/BattleViewer/IntentOverlay-rendering.test.tsx`         | 18     | targetCell in action objects                                       |
| 6   | `src/components/RuleEvaluations/rule-evaluations-next-action.test.tsx` | 6      | Action data assertions                                             |
| 7   | `src/components/BattleStatus/BattleStatusBadge.test.tsx`               | 12     | Position in character setup                                        |

**Total: 108 errors, 7 files**

**Conversion pattern**: Replace `{ x: N, y: M }` with `{ q: Q, r: R }`. When an assertion uses `toEqual` to check an action object that includes `targetCell`, update both the action creation **and** the assertion to use the same new coordinate. Most of these tests use small coordinates (0-7) where direct swap works. For values like `{5, 5}`, `{6, 6}`, `{10, 10}`, `{11, 11}` use the mapping table.

**Critical**: When a test asserts `expect(result.action).toEqual(action)` and the `action` variable contains the targetCell, both sides are the same object reference - only the creation needs updating. But when `toEqual` asserts against a literal like `expect(result.characterPosition).toEqual({ x: 0, y: 0 })`, the assertion literal also needs updating.

### Group 3: Distance-Dependent Selector Tests (require careful distance preservation)

These files test selector logic where the expected result depends on relative distances between characters. Each coordinate conversion must preserve hex distance ordering.

| #   | File                                               | Errors | Key Concern                                         |
| --- | -------------------------------------------------- | ------ | --------------------------------------------------- |
| 1   | `src/engine/selectors-nearest-enemy.test.ts`       | 11     | Hex distances must preserve closer/farther ordering |
| 2   | `src/engine/selectors-nearest-ally.test.ts`        | 8      | Same as above                                       |
| 3   | `src/engine/selectors-lowest-hp-enemy.test.ts`     | 9      | Positions used for tiebreaking (R, then Q)          |
| 4   | `src/engine/selectors-lowest-hp-ally.test.ts`      | 9      | Same as above                                       |
| 5   | `src/engine/selectors-tie-breaking.test.ts`        | 16     | Critical: tiebreaking uses R then Q ordering        |
| 6   | `src/engine/selectors-metric-independence.test.ts` | 6      | Tests metric independence across selectors          |

**Total: 59 errors, 6 files**

**Conversion pattern**: For each test, analyze the distance/ordering intent:

- **Distance ordering tests**: Place evaluator at center ({0, 0} is simplest), then place targets at specific hex distances. Example: evaluator at {0,0}, enemy A at {0,2} (dist=2), enemy B at {3,0} (dist=3) -> nearest is A.

- **Tiebreaking tests**: Tiebreaking now uses lower R first, then lower Q. Update comments from "Y" to "R" and "X" to "Q". Ensure characters at equal hex distance have R/Q values that produce the expected tiebreak result. Example: evaluator at {0,0}, enemy A at {1,-1} (dist=1, R=-1), enemy B at {-1,1} (dist=1, R=1) -> tiebreak winner is A (lower R).

- **Diagonal distance test**: Old test verified Chebyshev treats diagonals as cost 1. In hex, there are no diagonals - all directions have cost 1. Convert to show two enemies at different distances where the closer one wins.

### Group 4: Trigger Tests with Partial Conversion (some coords already {q,r})

These files are partially converted - some positions use `{q, r}` and others still use `{x, y}`. The `{x, y}` coordinates are on positions of non-evaluator characters and on targetCell properties of actions that don't match the evaluator's cell.

| #   | File                                        | Errors | Key Concern                                                       |
| --- | ------------------------------------------- | ------ | ----------------------------------------------------------------- |
| 1   | `src/engine/triggers-cell-targeted.test.ts` | 14     | Mixed: evaluator positions are {q,r}, enemy positions still {x,y} |

**Total: 14 errors, 1 file**

**Conversion pattern**: The evaluator positions already use `{q:3, r:2}`. Only enemy/ally positions and non-matching targetCell values need conversion. Convert `{x:5, y:6}` to `{q:2, r:3}` (or similar valid hex coord), `{x:6, y:6}` to `{q:3, r:2}` only if it should match evaluator cell, otherwise to a different valid coord like `{q:3, r:1}`, etc.

### Group 5: Game Decision Tests (positions feed into decision engine)

These tests run through the full decision engine, so positions must be valid hex coordinates that trigger the expected decision outcomes (in range, out of range, etc).

| #   | File                                                        | Errors | Key Concern                                      |
| --- | ----------------------------------------------------------- | ------ | ------------------------------------------------ |
| 1   | `src/engine/game-decisions-action-type-inference.test.ts`   | 6      | Positions determine if attack/move/heal triggers |
| 2   | `src/engine/game-decisions-mid-action-skip.test.ts`         | 6      | Positions in currentAction targetCells           |
| 3   | `src/engine/game-core-apply-decisions.test.ts`              | 6      | Positions in action applications                 |
| 4   | `src/engine/game-core-process-tick-combat-movement.test.ts` | 3      | Combat resolution with movement                  |
| 5   | `src/engine/movement-groups-stress.test.ts`                 | 8      | Multi-character movement scenarios               |

**Total: 29 errors, 5 files**

**Conversion pattern**: Analyze each test's "in range" / "out of range" intent:

- If characters need to be within attack range (typically 1-2), place them at hex distance 1-2
- If characters need to be "far away" (out of range), place them at hex distance > range
- Movement tests: verify move targets are valid hex neighbors

### Group 6: Combat Edge Cases (partially converted, few remaining errors)

| #   | File                                   | Errors | Key Concern                                      |
| --- | -------------------------------------- | ------ | ------------------------------------------------ |
| 1   | `src/engine/combat-edge-cases.test.ts` | 6      | Most already converted; remaining are in 2 tests |

**Total: 6 errors, 1 file**

**Conversion pattern**: The file is partially converted. Remaining `{x, y}` coordinates are in the "action filtering" test (charC/charD at `{x:5,y:5}` / `{x:6,y:6}`) and "event ordering" test (attackerB/targetB at `{x:1,y:1}` / `{x:3,y:3}`). Convert to valid hex coords ensuring targetCell matches target position for hit tests.

### Group 7: Store Selector Tests (movement target data with `toEqual` position assertions)

| #   | File                                                     | Errors | Key Concern                                         |
| --- | -------------------------------------------------------- | ------ | --------------------------------------------------- |
| 1   | `src/stores/gameStore-selectors-movement-target.test.ts` | 20     | `toEqual` assertions on fromPosition and toPosition |

**Total: 20 errors, 1 file**

**Conversion pattern**: Update both creation and `toEqual` assertions. Example:

```
// Before:
position: { x: 0, y: 0 }
expect(result?.[0]?.fromPosition).toEqual({ x: 0, y: 0 });
// After:
position: { q: 0, r: 0 }
expect(result?.[0]?.fromPosition).toEqual({ q: 0, r: 0 });
```

Large coords like `{5,5}` and `{6,6}` must be remapped: `{q:2,r:3}` and `{q:3,r:2}`.

### Group 8: Component Tests (IntentLine, useDamageNumbers)

| #   | File                                                            | Errors | Key Concern                    |
| --- | --------------------------------------------------------------- | ------ | ------------------------------ |
| 1   | `src/components/BattleViewer/IntentLine-accessibility.test.tsx` | 2      | Type assertions `as Position`  |
| 2   | `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`    | 1      | Helper function type signature |

**Total: 3 errors, 2 files**

**Conversion pattern**:

- IntentLine-accessibility: Change `{ x: 0, y: 0 } as Position` -> `{ q: 0, r: 0 } as Position` and `{ x: 5, y: 5 } as Position` -> `{ q: 2, r: 3 } as Position`
- useDamageNumbers: Change helper type `position: { x: number; y: number }` -> `position: { q: number; r: number }` and update all call sites

### Group 9: Outlier Errors (non-coordinate issues)

| #   | File                                                         | Error                           | Fix                                                                                                    |
| --- | ------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | `src/engine/pathfinding.test.ts`                             | TS2554: 4 args to findPath      | Remove 4th arg from line 306; delete lines 305-307                                                     |
| 2   | `src/components/BattleViewer/battle-viewer-tooltip.test.tsx` | TS2339: `advanceTick` not found | Replace `actions.advanceTick()` with `actions.nextTick()`                                              |
| 3   | `src/components/BattleViewer/token-hover.test.tsx`           | TS2532: possibly undefined      | Add non-null assertion `!` on `mockOnMouseEnter.mock.calls[0]` -> `mockOnMouseEnter.mock.calls[0]![1]` |

**Total: 3 errors, 3 files** (Note: pathfinding.test.ts TS2554 error is 1 error, plus the useDamageNumbers TS2739 is already in Group 8)

## Detailed Conversion Examples for Distance-Sensitive Tests

### Selector Nearest-Enemy Test: "closest enemy by Chebyshev distance"

```typescript
// BEFORE: evaluator {5,5}, enemyA {5,7} dist=2, enemyB {8,5} dist=3
// Chebyshev distances: max(|0|,|2|)=2 and max(|3|,|0|)=3

// AFTER: evaluator {0,0}, enemyA {0,2} hexDist=2, enemyB {3,0} hexDist=3
// hexDistance(0,0->0,2) = max(0,2,2)=2
// hexDistance(0,0->3,0) = max(3,0,3)=3
// Result: enemyA still closer -> test passes
```

### Selector Tiebreaking: "prefer lower Y when distances equal"

```typescript
// BEFORE: evaluator {5,5}, enemyA {6,4} Y=4, enemyB {4,6} Y=6
// Both Chebyshev dist=1, tiebreak: lower Y wins -> enemyA

// AFTER: evaluator {0,0}, enemyA {1,-1} R=-1, enemyB {-1,1} R=1
// Both hexDist=1: max(1,1,0)=1 and max(1,1,0)=1
// Tiebreak: lower R wins -> enemyA (R=-1 < R=1)
```

### Selector Tiebreaking: "prefer lower X when Y and distances equal"

```typescript
// BEFORE: evaluator {5,5}, enemyA {4,5} X=4, enemyB {6,5} X=6
// Both Chebyshev dist=1, same Y, tiebreak: lower X wins -> enemyA

// AFTER: evaluator {0,0}, enemyA {-1,0} Q=-1, enemyB {1,0} Q=1
// Both hexDist=1: max(1,0,1)=1 and max(1,0,1)=1
// Same R (both R=0), tiebreak: lower Q wins -> enemyA (Q=-1 < Q=1)
```

### Selector Tiebreaking: "three-way tie"

```typescript
// BEFORE: eval {5,5}, A {5,4} Y=4, B {6,5} Y=5, C {4,5} Y=5
// All Chebyshev dist=1, tiebreak: lowest Y wins -> A

// AFTER: eval {0,0}, A {0,-1} R=-1, B {1,0} R=0, C {-1,0} R=0
// All hexDist=1, tiebreak: lowest R -> A (R=-1)
```

### Lowest HP Tiebreaking: "prefer lower Y when HP equal"

```typescript
// BEFORE: eval {5,5}, A hp=50 {3,2} Y=2, B hp=50 {7,4} Y=4
// Same HP, tiebreak: lower Y -> A

// AFTER: eval {0,0}, A hp=50 {-2,-1} R=-1, B hp=50 {2,1} R=1
// Valid: max(2,1,1)=2, max(2,1,3)=3
// Same HP, tiebreak: lower R -> A (R=-1)
// Note: check validity: A={-2,-1}: max(2,1,3)=3 OK. B={2,1}: max(2,1,3)=3 OK
```

### Lowest HP Tiebreaking: "prefer lower X when HP and Y equal"

```typescript
// BEFORE: eval {0,0}, A hp=50 {2,3} X=2, B hp=50 {5,3} X=5
// Same HP, same Y, tiebreak: lower X -> A

// AFTER: eval {0,0}, A hp=50 {2,3} Q=2, B hp=50 {5,0} Q=5
// Wait - check {2,3}: max(2,3,5)=5 OK. {5,0}: max(5,0,5)=5 OK
// Same HP, same R (... actually R=3 vs R=0, not same)
// Need same R: A hp=50 {-1,2} Q=-1 R=2, B hp=50 {2,2} Q=2 R=2
// Check: {-1,2}: max(1,2,1)=2 OK. {2,2}: max(2,2,4)=4 OK
// Same HP, same R=2, tiebreak: lower Q -> A (Q=-1 < Q=2)
```

## Outlier Error Fixes

### Fix 1: pathfinding.test.ts (TS2554)

**File**: `src/engine/pathfinding.test.ts`
**Line**: 305-307
**Error**: `findPath(start, goal, obstacles, 5)` - 4 args, expects 3
**Fix**: Delete lines 305-307 entirely (the comment "Can also accept radius parameter" and the 4-arg call and its assertion). The 3-arg call on line 300 already tests this functionality.

### Fix 2: battle-viewer-tooltip.test.tsx (TS2339)

**File**: `src/components/BattleViewer/battle-viewer-tooltip.test.tsx`
**Line**: 197
**Error**: `actions.advanceTick()` - no such method on store
**Fix**: Replace `actions.advanceTick()` with `actions.nextTick()`. The store exposes `nextTick` and `processTick` but not `advanceTick`.

### Fix 3: token-hover.test.tsx (TS2532)

**File**: `src/components/BattleViewer/token-hover.test.tsx`
**Line**: 44
**Error**: `mockOnMouseEnter.mock.calls[0][1]` possibly undefined
**Fix**: Add non-null assertion: `mockOnMouseEnter.mock.calls[0]![1]`. The test already asserts `toHaveBeenCalledTimes(1)` on line 40, so `calls[0]` is guaranteed to exist.

## Implementation Sequence

Ordered by: (1) dependency (helpers first), (2) lowest-risk first, (3) highest error count for batch efficiency.

### Phase 1: Outlier Fixes (3 errors, 3 files) - 5 minutes

1. `src/engine/pathfinding.test.ts` - Delete 4-arg findPath call
2. `src/components/BattleViewer/battle-viewer-tooltip.test.tsx` - advanceTick -> nextTick
3. `src/components/BattleViewer/token-hover.test.tsx` - Add non-null assertion

### Phase 2: Component/Helper Fixes (3 errors, 2 files) - 5 minutes

4. `src/components/BattleViewer/hooks/useDamageNumbers.test.ts` - Fix helper type signature
5. `src/components/BattleViewer/IntentLine-accessibility.test.tsx` - Fix type assertions

### Phase 3: Simple Swap Files (29 errors, 12 files) - 20 minutes

Files 6-17 from Group 1. Mechanical x->q, y->r. Run type-check after batch.

6. `src/stores/gameStore-selectors-evaluations.test.ts`
7. `src/engine/game-integration.test.ts`
8. `src/engine/combat-multi-attack.test.ts`
9. `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx`
10. `src/engine/triggers-always.test.ts`
11. `src/engine/game-decisions-disabled-skills.test.ts`
12. `src/components/BattleViewer/IntentLine-action-colors.test.tsx`
13. `src/engine/game-decisions-no-match-idle.test.ts`
14. `src/engine/game-core-clear-resolved-actions.test.ts`
15. `src/engine/selectors-self.test.ts`
16. `src/engine/triggers-edge-cases.test.ts`
17. `src/engine/selectors-edge-cases.test.ts`

### Phase 4: Partially Converted Files (20 errors, 2 files) - 15 minutes

18. `src/engine/triggers-cell-targeted.test.ts` - Partial conversion (Group 4)
19. `src/engine/combat-edge-cases.test.ts` - Partial conversion (Group 6)

### Phase 5: Action/Intent Data Files (108 errors, 7 files) - 30 minutes

Highest error count files. Require updating both creation and assertion coordinates.

20. `src/stores/gameStore-selectors-intent-ticks.test.ts` (10 errors)
21. `src/stores/gameStore-selectors-intent-filter.test.ts` (13 errors)
22. `src/stores/gameStore-selectors-movement-intent.test.ts` (13 errors)
23. `src/components/BattleViewer/IntentOverlay-rendering.test.tsx` (18 errors)
24. `src/stores/gameStore-selectors-intent-preview.test.ts` (36 errors)
25. `src/stores/gameStore-selectors-movement-target.test.ts` (20 errors)
26. `src/components/RuleEvaluations/rule-evaluations-next-action.test.tsx` (6 errors)
27. `src/components/BattleStatus/BattleStatusBadge.test.tsx` (12 errors)

### Phase 6: Distance-Dependent Selector Tests (59 errors, 6 files) - 30 minutes

Most complex group. Each test requires distance/tiebreaking analysis.

28. `src/engine/selectors-nearest-enemy.test.ts` (11 errors)
29. `src/engine/selectors-nearest-ally.test.ts` (8 errors)
30. `src/engine/selectors-lowest-hp-enemy.test.ts` (9 errors)
31. `src/engine/selectors-lowest-hp-ally.test.ts` (9 errors)
32. `src/engine/selectors-tie-breaking.test.ts` (16 errors)
33. `src/engine/selectors-metric-independence.test.ts` (6 errors)

### Phase 7: Game Decision Tests (29 errors, 5 files) - 20 minutes

34. `src/engine/game-decisions-action-type-inference.test.ts` (6 errors)
35. `src/engine/game-decisions-mid-action-skip.test.ts` (6 errors)
36. `src/engine/game-core-apply-decisions.test.ts` (6 errors)
37. `src/engine/game-core-process-tick-combat-movement.test.ts` (3 errors)
38. `src/engine/movement-groups-stress.test.ts` (8 errors)

### Phase 8: Validation

- Run `npm run type-check` - expect 0 errors
- Run `npm run test` - expect 1035/1045 still passing (no regressions)
- Run `npm run lint` - expect pass

## Risk Mitigation

### Risk 1: Distance Semantic Breakage (Medium)

**What**: Converting coordinates changes distances. A test expecting "closer" may get "farther" after conversion.
**Mitigation**: For Group 3 (selector tests), compute hex distances explicitly before finalizing coordinates. Use the detailed conversion examples above.

### Risk 2: Tiebreaking Assertion Failures (Medium)

**What**: Tiebreaking now uses R then Q (was Y then X). If R/Q ordering doesn't match intended tiebreak winner, test fails.
**Mitigation**: For each tiebreaking test, verify the R-then-Q ordering matches the expected winner. Update test comments from "Y" to "R" and "X" to "Q".

### Risk 3: Action Object `toEqual` Mismatches (Low)

**What**: Tests that assert `toEqual` on full action objects will fail if targetCell isn't updated in both the action creation and the assertion.
**Mitigation**: When a test asserts `toEqual(action)` where `action` is a variable, both sides reference the same object - only the creation needs updating. But literal assertions like `toEqual({ x: 0, y: 0 })` need updating too.

### Risk 4: Integration Test Cascades (Low)

**What**: Game decision tests run through multiple engine layers. Invalid hex coordinates could cause pathfinding failures or unexpected decisions.
**Mitigation**: Use simple, well-separated coordinates (e.g., {0,0} and {1,0} for adjacent, {0,0} and {5,0} for far apart). Avoid boundary coordinates where neighbor calculations might behave unexpectedly.

### Risk 5: Pre-existing Test Failures (N/A)

**What**: 10 tests already fail (CharacterTooltip/battle-viewer-tooltip act() warnings). These are pre-existing and unrelated to this work.
**Mitigation**: Track these separately. Do not attempt to fix in this task. Verify the count stays at 10 after conversion.

## Success Criteria

1. **0 TypeScript errors** in all test files (`npm run type-check` passes)
2. **1035/1045 tests passing** (no regressions from current baseline)
3. **All coordinates valid**: Every `{q, r}` satisfies `max(|q|, |r|, |q+r|) <= 5`
4. **ESLint passes**: `npm run lint` succeeds
5. **Test semantics preserved**: No behavioral changes to what tests verify
6. **Comments updated**: Tiebreaking comments reference R/Q instead of Y/X

## New Decision

**Decision**: Map x->q and y->r as the default conversion, with explicit remapping for coordinates that violate hex validity.

**Context**: The hex coordinate system uses axial coordinates {q, r} replacing the square grid {x, y}. While the axes have different geometric meaning, the most natural mapping preserves the naming intuition (first coordinate -> first coordinate).

**Consequences**: Some test comments about "diagonal" distances become meaningless in hex (all hex directions are equivalent). These comments should be updated. Tiebreaking dimension naming changes: "lower Y" -> "lower R", "lower X" -> "lower Q".
