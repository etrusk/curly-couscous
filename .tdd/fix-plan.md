# Fix Plan: Remaining TypeScript Errors and Issues

## Summary

18 TypeScript errors remain in 9 files, plus 1 invalid hex coordinate and 8+ stale comments. This plan specifies exact fixes organized by file for efficient implementation.

---

## Issue 1: TypeScript Errors (18 errors in 9 files)

### File 1: `src/engine/selectors-edge-cases.test.ts` (5 errors)

This file was completely missed during WRITE_TESTS phase.

| Line | Current Code                                 | Fix                                          |
| ---- | -------------------------------------------- | -------------------------------------------- |
| 20   | `position: { x: 5, y: 5 },`                  | `position: { q: 0, r: 0 },`                  |
| 33   | `position: { x: 5, y: 5 },`                  | `position: { q: 0, r: 0 },`                  |
| 46   | `position: { x: 5, y: 5 },`                  | `position: { q: 0, r: 0 },`                  |
| 51   | `position: { x: 5, y: 5 }, // Same position` | `position: { q: 0, r: 0 }, // Same position` |
| 56   | `position: { x: 5, y: 5 }, // Same position` | `position: { q: 0, r: 0 }, // Same position` |

**Validity**: {0,0}: max(0,0,0)=0. Valid.
**Semantics**: All tests are edge cases (empty array, self-only, same position). Position values are irrelevant. Using {0,0} is simplest.

### File 2: `src/engine/game-decisions-no-match-idle.test.ts` (3 errors + 1 invalid coordinate)

| Line | Current Code                                                       | Fix                                                                |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 18   | `position: { q: 5, r: -40 },`                                      | `position: { q: 5, r: 0 },`                                        |
| 46   | `position: { x: 6, y: 5 },`                                        | `position: { q: 5, r: 0 },`                                        |
| 68   | `position: { x: 6, y: 5 },`                                        | `position: { q: 5, r: 0 },`                                        |
| 118  | `position: { x: 5, y: 7 },`                                        | `position: { q: 1, r: 4 },`                                        |
| 128  | `expect(decisions[0]!.action.targetCell).toEqual({ x: 5, y: 7 });` | `expect(decisions[0]!.action.targetCell).toEqual({ q: 1, r: 4 });` |

**Notes**:

- Line 18: Fixes Critical Issue 2 (invalid coordinate). `{q:5, r:-40}` has max(5,40,35)=40, violating hex validity. Changed to `{q:5, r:0}` (max(5,0,5)=5, valid). Enemy just needs to be far from character at `{q:3, r:2}` so no skill matches. hexDist({3,2},{5,0}) = max(2,2,0)=2 > range 1. Correct.
- Lines 46, 68: Enemy positions. `{q:5, r:0}` keeps enemy far from char at `{q:3, r:2}`. hexDist=2 > range for any triggers.
- Lines 118, 128: The test "should set idle targetCell to character position" - position and expected assertion must match. Using `{q:1, r:4}` (max(1,4,5)=5, valid).

### File 3: `src/engine/game-core-clear-resolved-actions.test.ts` (3 errors)

| Line | Current Code                                                | Fix                                                          |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 14   | `currentAction: createAttackAction({ x: 6, y: 5 }, 10, 3),` | `currentAction: createAttackAction({ q: 3, r: -1 }, 10, 3),` |
| 23   | `const action = createAttackAction({ x: 6, y: 5 }, 10, 5);` | `const action = createAttackAction({ q: 3, r: -1 }, 10, 5);` |
| 51   | `currentAction: createAttackAction({ x: 6, y: 5 }, 10, 1),` | `currentAction: createAttackAction({ q: 3, r: -1 }, 10, 1),` |

**Validity**: {q:3, r:-1}: max(3,1,2)=3. Valid.
**Semantics**: Tests check action clearing based on tick, not coordinate values.

### File 4: `src/engine/game-decisions-disabled-skills.test.ts` (2 errors)

| Line | Current Code                | Fix                          |
| ---- | --------------------------- | ---------------------------- |
| 18   | `position: { x: 6, y: 5 },` | `position: { q: 3, r: -1 },` |
| 47   | `position: { x: 6, y: 5 },` | `position: { q: 3, r: -1 },` |

**Validity**: {q:3, r:-1}: max(3,1,2)=3. Valid.
**Semantics**: Tests check that disabled skills produce idle. Enemy needs to exist but position irrelevant to disabled-skills logic.

### File 5: `src/engine/selectors-self.test.ts` (1 error)

| Line | Current Code                | Fix                         |
| ---- | --------------------------- | --------------------------- |
| 19   | `position: { x: 5, y: 5 },` | `position: { q: 0, r: 0 },` |

**Validity**: {0,0}: max(0,0,0)=0. Valid.
**Semantics**: Self selector always returns the evaluator regardless of position.

### File 6: `src/engine/combat-multi-attack.test.ts` (1 error)

| Line | Current Code                                      | Fix                                               |
| ---- | ------------------------------------------------- | ------------------------------------------------- |
| 314  | `position: { x: 7, y: 7 }, // Not at target cell` | `position: { q: 3, r: 2 }, // Not at target cell` |

**Validity**: {q:3, r:2}: max(3,2,5)=5. Valid.
**Semantics**: charD is "not at target cell" -- charC's attack targets `{q:4, r:2}` (line 310). charD at `{q:3, r:2}` != `{q:4, r:2}`, so charD should NOT be hit. Must verify charD's position differs from charC's targetCell. {3,2} != {4,2}. Correct.

### File 7: `src/engine/game-integration.test.ts` (1 error)

| Line | Current Code                                                | Fix                                                          |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 98   | `const action = createAttackAction({ x: 6, y: 5 }, 25, 2);` | `const action = createAttackAction({ q: 3, r: -1 }, 25, 2);` |

**Validity**: {q:3, r:-1}: max(3,1,2)=3. Valid.
**Semantics**: Test checks mid-action continuation. targetCell value is not tested directly.

### File 8: `src/components/BattleViewer/IntentOverlay-rendering.test.tsx` (1 error)

| Line | Current Code                  | Fix                           |
| ---- | ----------------------------- | ----------------------------- |
| 35   | `targetCell: { x: 0, y: 0 },` | `targetCell: { q: 0, r: 0 },` |

**Validity**: {0,0}: max(0,0,0)=0. Valid.
**Semantics**: The idleAction is used on char2. The test checks that idle actions are filtered out from rendering. The targetCell value is irrelevant.

### File 9: `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` (1 error)

| Line | Current Code                  | Fix                           |
| ---- | ----------------------------- | ----------------------------- |
| 251  | `targetCell: { x: 1, y: 0 },` | `targetCell: { q: 1, r: 0 },` |

**Validity**: {q:1, r:0}: max(1,0,1)=1. Valid.
**Semantics**: Test checks rule evaluation rendering with mid-action state. targetCell value only needs to be valid type.

---

## Issue 2: Invalid Hex Coordinate (Critical Issue 2)

Covered above in File 2, line 18. `{q: 5, r: -40}` changed to `{q: 5, r: 0}`.

---

## Issue 3: Stale Y/X Comments in `src/engine/selectors-tie-breaking.test.ts`

No TypeScript errors in this file, but 8 stale comments need updating.

| Line | Current Comment  | Fix                        |
| ---- | ---------------- | -------------------------- |
| 52   | `// dist=1, X=4` | `// hex dist=1, Q=-1`      |
| 57   | `// dist=1, X=6` | `// hex dist=1, Q=1`       |
| 80   | `// Y=2`         | `// R=-1`                  |
| 86   | `// R=1`         | `// R=1` (already correct) |
| 96   | `// Y=2 < R=1`   | `// R=-1 < R=1`            |
| 109  | `// X=2`         | `// Q=-1`                  |
| 115  | `// X=5`         | `// Q=2`                   |
| 142  | `// dist=1, Y=5` | `// hex dist=1, R=0`       |
| 147  | `// dist=1, Y=5` | `// hex dist=1, R=0`       |
| 158  | `// Lowest R=1`  | `// Lowest R=-1`           |

---

## Issue 4 (Minor): Chebyshev Test Names in `src/engine/selectors-nearest-enemy.test.ts`

| Line | Current Name                                               | Fix                                                      |
| ---- | ---------------------------------------------------------- | -------------------------------------------------------- |
| 16   | `"should return closest enemy by Chebyshev distance"`      | `"should return closest enemy by hex distance"`          |
| 70   | `"should handle diagonal distances correctly (Chebyshev)"` | `"should handle non-adjacent distances correctly (hex)"` |

---

## Issue 5 (Minor): Duplicate Position in `src/engine/selectors-self.test.ts`

| Line | Current Code                | Fix                         |
| ---- | --------------------------- | --------------------------- |
| 37   | `position: { q: 3, r: 0 },` | `position: { q: 3, r: 1 },` |

**Rationale**: enemy1 and evaluator both at `{q:3, r:0}` -- giving enemy1 a distinct position is cleaner. `{q:3, r:1}`: max(3,1,4)=4, valid. Test semantics unchanged (self selector ignores positions).

---

## Implementation Sequence

Execute fixes in this order for efficiency:

1. **File 1**: `src/engine/selectors-edge-cases.test.ts` (5 errors) -- completely missed file, all simple swaps
2. **File 2**: `src/engine/game-decisions-no-match-idle.test.ts` (3 errors + 1 invalid coord + 1 assertion)
3. **File 3**: `src/engine/game-core-clear-resolved-actions.test.ts` (3 errors)
4. **File 4**: `src/engine/game-decisions-disabled-skills.test.ts` (2 errors)
5. **File 5**: `src/engine/selectors-self.test.ts` (1 error + 1 minor fix)
6. **File 6**: `src/engine/combat-multi-attack.test.ts` (1 error)
7. **File 7**: `src/engine/game-integration.test.ts` (1 error)
8. **File 8**: `src/components/BattleViewer/IntentOverlay-rendering.test.tsx` (1 error)
9. **File 9**: `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` (1 error)
10. **Comments**: `src/engine/selectors-tie-breaking.test.ts` (10 comment updates)
11. **Minor**: `src/engine/selectors-nearest-enemy.test.ts` (2 test name updates)

Total: 11 files touched, 18 TypeScript errors fixed, 1 invalid coordinate fixed, ~12 comment/name updates.

---

## Verification Steps

After all fixes:

1. `npx tsc --noEmit` -- expect 0 errors
2. `npm run test` -- expect 1035/1045 tests passing (no regressions)
3. `npm run lint` -- expect pass
4. Spot-check: Verify line 18 of game-decisions-no-match-idle.test.ts is `{q: 5, r: 0}` not `{q: 5, r: -40}`
5. Spot-check: Verify selectors-edge-cases.test.ts has no `x:` or `y:` remaining
6. Spot-check: Verify selectors-tie-breaking.test.ts has no "X=" or "Y=" in comments (only "Q=" and "R=")

---

## Coordinate Validity Summary

All new coordinates used in this fix plan:

| Coordinate | max(\|q\|, \|r\|, \|q+r\|) | Valid |
| ---------- | -------------------------- | ----- |
| {0, 0}     | 0                          | Yes   |
| {1, 0}     | 1                          | Yes   |
| {1, 4}     | 5                          | Yes   |
| {3, -1}    | 3                          | Yes   |
| {3, 1}     | 4                          | Yes   |
| {3, 2}     | 5                          | Yes   |
| {5, 0}     | 5                          | Yes   |

All satisfy max(|q|, |r|, |q+r|) <= 5.
