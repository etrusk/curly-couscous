---

## TEST DESIGN REVIEW

**Reviewer**: Architect (TEST_DESIGN_REVIEW phase)
**Date**: 2026-02-04
**Status**: APPROVED FOR IMPLEMENTATION (with corrections noted below)

### 1. Completeness Verification

**Error count by phase (corrected)**:

| Phase | Errors | Files | Status |
|-------|--------|-------|--------|
| Phase 1: Outlier Fixes | 3 | 3 | Correct |
| Phase 2: Component/Helper | 3 | 2 | Correct |
| Phase 3: Simple Swap | 29 | 12 | Correct |
| Phase 4: Partially Converted | 20 | 2 | Correct |
| Phase 5: Action/Intent Data | 128 | 8 | **CORRECTED** (header says 108/7, actual is 128/8) |
| Phase 6: Distance-Dependent | 59 | 6 | Correct |
| Phase 7: Game Decisions | 29 | 5 | Correct |
| **Total** | **271** | **38** | **Verified** |

**Issue REVIEW-1 (Minor, documentation only)**: Phase 5 section header on line 193 states "108 errors, 7 files" but the section contains Files 20-27 (8 files) totaling 128 errors: 10+13+13+18+36+20+6+12 = 128. The implementation checklist line 600 also says "108". The document's own recount section (lines 609-628) catches this and arrives at the correct total of 271 using 128 for Phase 5. The final formula (3+3+29+20+128+59+29 = 271) is correct. **Correction**: Implementers should use 128/8 for Phase 5, not 108/7. All 271 errors are fully specified.

**All 38 files accounted for**: Files 1-38 match the exploration.md error list. Every file from the exploration appears in exactly one phase.

### 2. Coordinate Validity Verification

**All coordinates in the master table (32 entries) verified**: max(|q|, |r|, |q+r|) <= 5 for every entry.

Spot-checked coordinates from per-file specifications:
- {-2,-1}: max(2,1,3)=3. Valid.
- {-1,2}: max(1,2,1)=2. Valid.
- {-1,-1}: max(1,1,2)=2. Valid.
- {-2,0}: max(2,0,2)=2. Valid.
- {1,3}: max(1,3,4)=4. Valid.
- {0,3}: max(0,3,3)=3. Valid.
- {0,4}: max(0,4,4)=4. Valid.
- {3,1}: max(3,1,4)=4. Valid.
- {0,2}: max(0,2,2)=2. Valid.

**Result**: All coordinates satisfy hex validity constraint. No invalid coordinates found.

### 3. Representative Case Validation (10 cases)

**Case 1: Tiebreaking Test 3 - lowest_hp_enemy prefer lower R** (File 32, test 3)
- eval {0,0}, A hp=50 {-2,-1} R=-1, B hp=50 {2,1} R=1
- Both valid. Same HP. Tiebreak R: A.R=-1 < B.R=1. Winner: A. CORRECT.

**Case 2: Tiebreaking Test 5 - three-way tie** (File 32, test 5)
- eval {0,0}, A {0,-1}, B {1,0}, C {-1,0}
- All hexDist=1. Tiebreak R: A.R=-1 is lowest. Winner: A. CORRECT.

**Case 3: Metric independence - nearest_enemy ignores HP** (File 33, test 1)
- eval {0,0}, A hp=100 {0,1} dist=1, B hp=10 {0,4} dist=4
- nearest_enemy by distance: A closer. Expected: A. CORRECT.

**Case 4: Metric independence - lowest_hp_enemy ignores distance** (File 33, test 2)
- Same positions. lowest_hp_enemy by HP: B has HP=10. Expected: B. CORRECT.

**Case 5: Combat edge cases - action filtering** (File 19)
- charC at {2,3} attacks {3,2}. charD at {3,2}. targetCell matches charD position.
- charC action has ticksRemaining=2, does not resolve. charD HP unchanged. CORRECT.

**Case 6: Intent preview - characterPosition assertion** (File 24, line 273)
- friendly at {3,-1}, enemy at {4,-1}. hexDist = max(1,0,1) = 1. In range for range=1.
- Assertion: characterPosition equals {3,-1}. Matches creation. CORRECT.

**Case 7: Process-tick movement assertion** (File 37, lines 76/87)
- createMoveAction({q:3,r:-1}, 2) and toEqual({q:3,r:-1}). Consistent. CORRECT.

**Case 8: Process-tick RNG threading** (File 37, lines 122-129)
- moverA {4,1}: max(4,1,5)=5. moverB {5,-1}: max(5,1,4)=5. Both valid.
- Move targets already {q:3,r:2} in source. Test checks RNG determinism, not movement validity. ACCEPTABLE.

**Case 9: Movement groups - collision independence** (File 38, revised)
- Target A {2,3} vs Target B {-2,-1}. Distinct cells = separate collision groups.
- All movers hex-adjacent to their targets (verified dist=1 for each pair). CORRECT.

**Case 10: Intent filter - characterPosition toEqual** (File 21, line 188)
- toEqual({q:0,r:0}) matches position creation {q:0,r:0}. CORRECT.

### 4. Issues Found

**Issue REVIEW-1** (Minor): Phase 5 header mismatch. See Completeness section above. Does not affect implementation since per-file specifications are complete and correct.

**Issue REVIEW-2** (Informational): Master coordinate table has duplicate source entry `{7,5}` mapping to two different targets: `{4,-1}` (mid-action-skip) and `{4,1}` (movement-intent). This is intentional context-sensitivity documented in the plan, but implementers should use per-file specifications (not the master table) as the authoritative source for each file's coordinates.

**Issue REVIEW-3** (Informational): Movement intent "both factions" test (File 22, lines 142-152) has the enemy's targetCell `{q:4,r:1}` equal to the friendly's position `{q:4,r:1}`. The original test had these as different cells ({7,5} vs {4,5}). Since this test only checks that selectMovementIntentData returns intents for both factions (not movement resolution), this semantic overlap is acceptable. No test behavior change.

### 5. Tiebreaking Logic Verification

Source code confirmed (selectors.ts lines 12-17):
- `tieBreakCompare`: Lower R wins first, then lower Q wins
- `compareByDistanceThenPosition`: Distance first, then tiebreak
- `compareByHpThenPosition`: HP first, then tiebreak

All 5 tiebreaking test conversions (File 32) verified:
- Test 1: R-first tiebreak with equal distance. CORRECT.
- Test 2: Q-second tiebreak with equal distance and R. CORRECT.
- Test 3: R-first tiebreak with equal HP. CORRECT.
- Test 4: Q-second tiebreak with equal HP and R. CORRECT.
- Test 5: Three-way R-first tiebreak. CORRECT.

Test name and comment updates (Y->R, X->Q) are specified. CORRECT.

### 6. Distance Ordering Verification

Hex distance formula confirmed (hex.ts lines 52-56):
```
hexDistance(a, b) = (|dq| + |dr| + |dq+dr|) / 2
```
Equivalent to: `max(|dq|, |dr|, |dq+dr|)`

All distance-dependent tests (Phase 6) verified to preserve ordering:
- nearest-enemy tests: dist(A) < dist(B) preserved in all cases
- nearest-ally tests: same pattern, correct
- metric independence: distance vs HP independence preserved

### 7. Assertion Consistency

All toEqual assertions verified to match their creation coordinates:
- File 21 line 188: toEqual({q:0,r:0}) matches line 179 position. OK.
- File 22 lines 99-100: toEqual matches lines 84, 91. OK.
- File 24 line 37: toEqual({q:1,r:0}) matches targetCell. OK.
- File 24 line 273: toEqual({q:3,r:-1}) matches line 258. OK.
- File 25 lines 70-71: toEqual matches lines 57, 62. OK.
- File 25 lines 281-282: toEqual matches lines 261, 275. OK.
- File 37 line 87: toEqual({q:3,r:-1}) matches line 76. OK.

No mismatched assertions found.

### Reviewer Sign-off

**APPROVED FOR IMPLEMENTATION**

All 271 errors are fully specified with exact line-level transformations. Coordinate validity, tiebreaking semantics, distance orderings, and assertion consistency are verified. Three informational issues noted (none blocking). The Phase 5 header should be mentally corrected to "128 errors, 8 files" during implementation.

The document is ready for the WRITE_TESTS phase.

---

# Test Designs: Fix 271 TypeScript Errors in 38 Test Files

## Overview

This document specifies the exact coordinate transformations, outlier fixes, and validation requirements for converting 271 TypeScript errors across 38 test files from `{x, y}` to `{q, r}` format.

## Master Coordinate Transformation Table

All coordinates must satisfy: `max(|q|, |r|, |q+r|) <= 5`

| Old {x, y} | New {q, r} | Validity: max(\|q\|,\|r\|,\|q+r\|) | Used In                                   |
| ---------- | ---------- | ---------------------------------- | ----------------------------------------- |
| {0, 0}     | {0, 0}     | 0                                  | Everywhere                                |
| {1, 0}     | {1, 0}     | 1                                  | Intent ticks, filters, accessibility      |
| {0, 1}     | {0, 1}     | 1                                  | Simple swap files                         |
| {1, 1}     | {1, 1}     | 2                                  | Movement target, useDamageNumbers         |
| {1, 2}     | {1, 2}     | 3                                  | Movement intent                           |
| {2, 0}     | {2, 0}     | 2                                  | Intent ticks, intent filter               |
| {2, 2}     | {2, 2}     | 4                                  | Movement intent, IntentOverlay            |
| {2, 3}     | {2, 3}     | 5                                  | Intent preview, movement intent           |
| {3, 3}     | {3, 2}     | 5                                  | Intent filter, IntentOverlay              |
| {3, 7}     | {3, -1}    | 3                                  | Intent preview (characterPosition)        |
| {4, 4}     | {2, 2}     | 4                                  | Movement intent, lowest-hp                |
| {4, 5}     | {4, 1}     | 5                                  | Movement intent, processTick              |
| {4, 7}     | {4, -1}    | 4                                  | Intent preview                            |
| {5, 0}     | {5, 0}     | 5                                  | Boundary                                  |
| {5, 4}     | {5, -1}    | 5                                  | processTick (moverB)                      |
| {5, 5}     | {2, 3}     | 5                                  | Everywhere (far away)                     |
| {5, 6}     | {2, 3}     | 5                                  | Triggers cell-targeted (enemy pos)        |
| {5, 7}     | {1, 4}     | 5                                  | Triggers cell-targeted (enemyB)           |
| {5, 8}     | {0, 5}     | 5                                  | Nearest enemy/ally                        |
| {5, 9}     | {-1, 5}    | 5                                  | Metric independence                       |
| {6, 3}     | {3, -1}    | 3                                  | Movement intent                           |
| {6, 5}     | {3, -1}    | 3                                  | Game decisions (enemy pos)                |
| {6, 6}     | {3, 2}     | 5                                  | Movement target, useDamageNumbers         |
| {7, 3}     | {4, -1}    | 4                                  | Movement intent                           |
| {7, 4}     | {4, -1}    | 4                                  | Tiebreaking (lowest-hp)                   |
| {7, 5}     | {4, -1}    | 4                                  | Mid-action skip (enemy)                   |
| {7, 7}     | {3, 2}     | 5                                  | useDamageNumbers                          |
| {7, 5}     | {4, 1}     | 5                                  | Movement intent (enemyAction)             |
| {8, 5}     | {5, -2}    | 5                                  | Game decisions (far enemy), nearest enemy |
| {10, 10}   | {5, 0}     | 5                                  | IntentOverlay, BattleStatusBadge          |
| {11, 0}    | {5, -5}    | 5                                  | Boundary                                  |
| {11, 11}   | {-5, 5}    | 5                                  | Intent preview, BattleStatusBadge         |

---

## Phase 1: Outlier Fixes (3 errors, 3 files)

### File 1: `src/engine/pathfinding.test.ts`

- **Error**: TS2554 at line 306 - `findPath(start, goal, obstacles, 5)` passes 4 args, expects 3
- **Fix**: Delete lines 305-307 entirely (comment + 4-arg call + assertion)
- **Validation**: The 3-arg call on line 300 already tests findPath

### File 2: `src/components/BattleViewer/battle-viewer-tooltip.test.tsx`

- **Error**: TS2339 at line 197 - `actions.advanceTick()` does not exist
- **Fix**: Replace `actions.advanceTick()` with `actions.nextTick()`
- **Validation**: Store exposes `nextTick` and `processTick`, not `advanceTick`

### File 3: `src/components/BattleViewer/token-hover.test.tsx`

- **Error**: TS2532 at line 44 - `mockOnMouseEnter.mock.calls[0][1]` possibly undefined
- **Fix**: Change `mockOnMouseEnter.mock.calls[0][1]` to `mockOnMouseEnter.mock.calls[0]![1]`
- **Validation**: Line 40 asserts `toHaveBeenCalledTimes(1)`, guaranteeing calls[0] exists

---

## Phase 2: Component/Helper Fixes (3 errors, 2 files)

### File 4: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts` (1 error)

- **Error**: TS2739 at line 17 - helper function parameter typed as `{x: number; y: number}`
- **Transformations**:
  - Line 17: `position: { x: number; y: number }` -> `position: { q: number; r: number }`
  - Line 36: `{ x: 0, y: 0 }` -> `{ q: 0, r: 0 }`
  - Line 45: `{ x: 2, y: 3 }` -> `{ q: 2, r: 3 }` (valid: max(2,3,5)=5)
  - Line 46: `{ x: 5, y: 7 }` -> `{ q: 1, r: 4 }` (valid: max(1,4,5)=5)
  - Line 63: assertion `{ x: 5, y: 7 }` -> `{ q: 1, r: 4 }` (matches line 46)
  - Line 67: `{ x: 0, y: 0 }` -> `{ q: 0, r: 0 }`
  - Line 68: `{ x: 1, y: 1 }` -> `{ q: 1, r: 1 }`
  - Line 90-92: `{ x: 0, y: 0 }`, `{ x: 1, y: 0 }`, `{ x: 5, y: 5 }` -> `{ q: 0, r: 0 }`, `{ q: 1, r: 0 }`, `{ q: 2, r: 3 }`
  - Line 123-125: same as 90-92
  - Line 155-157: `{ x: 0, y: 0 }`, `{ x: 1, y: 0 }`, `{ x: 5, y: 5 }` -> `{ q: 0, r: 0 }`, `{ q: 1, r: 0 }`, `{ q: 2, r: 3 }`
  - Line 191-193: `{ x: 0, y: 0 }`, `{ x: 5, y: 5 }`, `{ x: 7, y: 7 }` -> `{ q: 0, r: 0 }`, `{ q: 2, r: 3 }`, `{ q: 3, r: 2 }`
- **Assertions to update**: Line 63 `toEqual({ x: 5, y: 7 })` -> `toEqual({ q: 1, r: 4 })`

### File 5: `src/components/BattleViewer/IntentLine-accessibility.test.tsx` (2 errors)

- **Error**: TS2352 at lines 13-14 - type assertion `as Position` on `{x,y}` objects
- **Transformations**:
  - Line 13: `{ x: 0, y: 0 } as Position` -> `{ q: 0, r: 0 } as Position`
  - Line 14: `{ x: 5, y: 5 } as Position` -> `{ q: 2, r: 3 } as Position`
- **Validation**: max(2,3,5)=5, valid

---

## Phase 3: Simple Swap Files (29 errors, 12 files)

All values in these files are small (0-5) and valid for direct x->q, y->r swap. No assertions reference specific coordinate values.

### File 6: `src/stores/gameStore-selectors-evaluations.test.ts` (1 error)

- Simple position swap, no coordinate assertions

### File 7: `src/engine/game-integration.test.ts` (1 error)

- Simple position swap

### File 8: `src/engine/combat-multi-attack.test.ts` (1 error)

- Simple position swap

### File 9: `src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` (1 error)

- Simple position swap

### File 10: `src/engine/triggers-always.test.ts` (2 errors)

- Simple position swaps

### File 11: `src/engine/game-decisions-disabled-skills.test.ts` (2 errors)

- Simple position swaps

### File 12: `src/components/BattleViewer/IntentLine-action-colors.test.tsx` (2 errors)

- Simple position swaps

### File 13: `src/engine/game-decisions-no-match-idle.test.ts` (3 errors)

- Simple position swaps

### File 14: `src/engine/game-core-clear-resolved-actions.test.ts` (3 errors)

- Simple position swaps

### File 15: `src/engine/selectors-self.test.ts` (4 errors)

- Simple position swaps

### File 16: `src/engine/triggers-edge-cases.test.ts` (4 errors)

- Simple position swaps

### File 17: `src/engine/selectors-edge-cases.test.ts` (5 errors)

- Simple position swaps

**Conversion rule for all Group 1 files**: Replace every `{ x: N, y: M }` with `{ q: N, r: M }`. All coordinates in these files have N,M in range [0,5] with N+M <= 5, so direct swap is valid.

---

## Phase 4: Partially Converted Files (20 errors, 2 files)

### File 18: `src/engine/triggers-cell-targeted.test.ts` (14 errors)

This file is partially converted. Evaluator positions already use `{q, r}`. Only enemy/ally `position` properties and non-matching `targetCell` values still use `{x, y}`.

**Pattern**: Every remaining `{x, y}` is an enemy/ally position field. The evaluator is at `{q: 3, r: 2}` in all tests.

| Line(s) | Old Value                    | New Value                    | Context                                               |
| ------- | ---------------------------- | ---------------------------- | ----------------------------------------------------- |
| 25      | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position (doesn't need to match evaluator)      |
| 48      | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position                                        |
| 51      | `targetCell: { x: 6, y: 6 }` | `targetCell: { q: 3, r: 1 }` | enemy targetCell (must NOT match evaluator {q:3,r:2}) |
| 71      | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position                                        |
| 90      | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | ally position                                         |
| 113     | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemyA position                                       |
| 116     | `targetCell: { x: 6, y: 6 }` | `targetCell: { q: 3, r: 1 }` | enemyA targetCell (not evaluator)                     |
| 123     | `position: { x: 5, y: 7 }`   | `position: { q: 1, r: 4 }`   | enemyB position                                       |
| 150     | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position                                        |
| 174     | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position                                        |
| 198     | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemyA position                                       |
| 208     | `position: { x: 6, y: 5 }`   | `position: { q: 3, r: 1 }`   | enemyB position                                       |
| 234     | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position                                        |
| 258     | `position: { x: 5, y: 6 }`   | `position: { q: 2, r: 3 }`   | enemy position                                        |

**Validation**:

- `{q:2, r:3}`: max(2,3,5) = 5 -- valid
- `{q:3, r:1}`: max(3,1,4) = 4 -- valid (and != evaluator {3,2} for "not matching" test)
- `{q:1, r:4}`: max(1,4,5) = 5 -- valid

### File 19: `src/engine/combat-edge-cases.test.ts` (6 errors)

Most tests already use `{q, r}`. Remaining errors in two tests:

**Test: "should only resolve actions with ticksRemaining === 1"** (lines 35-42):
| Line | Old Value | New Value | Context |
|------|-----------|-----------|---------|
| 35 | `position: { x: 5, y: 5 }` | `position: { q: 2, r: 3 }` | charC position |
| 37 | `createAttackAction({ x: 6, y: 6 }, null, 25, 2)` | `createAttackAction({ q: 3, r: 2 }, null, 25, 2)` | charC attackAction targetCell |
| 41 | `position: { x: 6, y: 6 }` | `position: { q: 3, r: 2 }` | charD position (must match charC targetCell for hit test) |

**Test: "should order all DamageEvents before DeathEvents"** (lines 371-386):
| Line | Old Value | New Value | Context |
|------|-----------|-----------|---------|
| 371 | `position: { x: 1, y: 1 }` | `position: { q: 1, r: 1 }` | attackerB position |
| 373 | `createAttackAction({ x: 3, y: 3 }, null, 100, 1)` | `createAttackAction({ q: 3, r: 0 }, null, 100, 1)` | attackerB targetCell |
| 383 | `position: { x: 3, y: 3 }` | `position: { q: 3, r: 0 }` | targetB position (must match attackerB targetCell) |

**Validation**:

- `{q:3, r:0}`: max(3,0,3) = 3 -- valid
- charC -> charD: charC at {2,3}, attacks {3,2} where charD sits, charD gets hit -- correct
- attackerB at {1,1}, attacks {3,0} where targetB sits -- correct

---

## Phase 5: Action/Intent Data Files (108 errors, 7 files)

### File 20: `src/stores/gameStore-selectors-intent-ticks.test.ts` (10 errors)

All errors are `targetCell` values in Action literals. No assertions on coordinate values; tests check `ticksRemaining` and `action.type` only.

| Line | Old Value                    | New Value                    | Notes              |
| ---- | ---------------------------- | ---------------------------- | ------------------ |
| 27   | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` | Direct swap, valid |
| 55   | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` | Same               |
| 87   | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` | Same               |
| 117  | `targetCell: { x: 2, y: 0 }` | `targetCell: { q: 2, r: 0 }` | Direct swap        |
| 145  | `targetCell: { x: 2, y: 0 }` | `targetCell: { q: 2, r: 0 }` | Same               |
| 177  | `targetCell: { x: 2, y: 0 }` | `targetCell: { q: 2, r: 0 }` | Same               |
| 208  | `targetCell: { x: 2, y: 0 }` | `targetCell: { q: 2, r: 0 }` | Same               |
| 237  | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` | Movement action    |
| 264  | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` | Movement action    |
| 295  | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` | Movement action    |

### File 21: `src/stores/gameStore-selectors-intent-filter.test.ts` (13 errors)

Mix of `targetCell` in Action literals and `position` in createCharacter + position assertions.

| Line | Old Value                                       | New Value                    | Notes                |
| ---- | ----------------------------------------------- | ---------------------------- | -------------------- | --- | ------------------------- |
| 36   | `targetCell: { x: 2, y: 0 }`                    | `targetCell: { q: 2, r: 0 }` |                      |
| 44   | `position: { x: 0, y: 0 }`                      | `position: { q: 0, r: 0 }`   |                      |
| 67   | `targetCell: { x: 1, y: 0 }`                    | `targetCell: { q: 1, r: 0 }` |                      |
| 75   | `position: { x: 0, y: 0 }`                      | `position: { q: 0, r: 0 }`   |                      |
| 93   | `targetCell: { x: 0, y: 0 }`                    | `targetCell: { q: 0, r: 0 }` |                      |
| 113  | `targetCell: { x: 1, y: 0 }`                    | `targetCell: { q: 1, r: 0 }` |                      |
| 138  | `targetCell: { x: 5, y: 5 }`                    | `targetCell: { q: 2, r: 3 }` | Remapped             |
| 168  | `targetCell: { x: 3, y: 3 }` (Position literal) | `{ q: 3, r: 0 }`             | Remapped (           | 3+3 | =6>5), used as targetCell |
| 179  | `position: { x: 0, y: 0 }`                      | `position: { q: 0, r: 0 }`   |                      |
| 188  | `characterPosition ... toEqual({ x: 0, y: 0 })` | `toEqual({ q: 0, r: 0 })`    | **Assertion update** |
| 196  | `targetCell: { x: 1, y: 0 }`                    | `targetCell: { q: 1, r: 0 }` |                      |
| 223  | `targetCell: { x: 1, y: 0 }`                    | `targetCell: { q: 1, r: 0 }` |                      |
| 269  | `targetCell: { x: 2, y: 0 }`                    | `targetCell: { q: 2, r: 0 }` |                      |

**Critical**: Line 188 has a `toEqual` assertion on `characterPosition` that must also be updated.

### File 22: `src/stores/gameStore-selectors-movement-intent.test.ts` (13 errors)

Contains positions in character setup and `toEqual` assertions on `targetCell` and `characterPosition`.

| Line    | Old Value                                                                                                          | New Value                                                                                                           | Notes                              |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 25      | `targetCell: { x: 5, y: 5 }`                                                                                       | `targetCell: { q: 2, r: 3 }`                                                                                        | Remapped                           |
| 32      | `position: { x: 4, y: 5 }`                                                                                         | `position: { q: 4, r: 1 }`                                                                                          | max(4,1,5)=5, valid                |
| 55      | `targetCell: { x: 6, y: 6 }`                                                                                       | `targetCell: { q: 3, r: 2 }`                                                                                        | Remapped                           |
| 62      | `position: { x: 4, y: 4 }`                                                                                         | `position: { q: 2, r: 2 }`                                                                                          | Direct swap OK                     |
| 84      | `targetCell: { x: 7, y: 3 }`                                                                                       | `targetCell: { q: 4, r: -1 }`                                                                                       | max(4,1,3)=4, valid                |
| 91      | `position: { x: 6, y: 3 }`                                                                                         | `position: { q: 3, r: -1 }`                                                                                         | max(3,1,2)=3, valid                |
| 99      | `toEqual({ x: 7, y: 3 })`                                                                                          | `toEqual({ q: 4, r: -1 })`                                                                                          | **Assertion** - must match line 84 |
| 100     | `toEqual({ x: 6, y: 3 })`                                                                                          | `toEqual({ q: 3, r: -1 })`                                                                                          | **Assertion** - must match line 91 |
| 112     | `targetCell: { x: 2, y: 2 }`                                                                                       | `targetCell: { q: 2, r: 2 }`                                                                                        | Direct swap                        |
| 119     | `position: { x: 1, y: 2 }`                                                                                         | `position: { q: 1, r: 2 }`                                                                                          | Direct swap                        |
| 142-152 | `targetCell: { x: 5, y: 5 }`, `position: { x: 4, y: 5 }`, `targetCell: { x: 7, y: 5 }`, `position: { x: 6, y: 5 }` | `targetCell: { q: 2, r: 3 }`, `position: { q: 4, r: 1 }`, `targetCell: { q: 4, r: 1 }`, `position: { q: 3, r: -1 }` | Both factions test                 |
| 189     | `targetCell: { x: 5, y: 5 }`                                                                                       | `targetCell: { q: 2, r: 3 }`                                                                                        | Stale action test                  |

**Note for "both factions" test**: The key semantic is that both friendly and enemy have movement intents. The exact coordinate values don't matter as long as positions differ from targetCells. Simplified: friendlyAction targetCell `{q:2, r:3}`, friendly position `{q:4, r:1}`, enemyAction targetCell `{q:4, r:1}`, enemy position `{q:3, r:-1}`.

### File 23: `src/components/BattleViewer/IntentOverlay-rendering.test.tsx` (18 errors)

All are `targetCell` and `position` in action/character objects for rendering tests. No coordinate assertions; tests check DOM elements (line counts, attributes).

| Lines          | Old Values                                           | New Values                                         | Notes                       |
| -------------- | ---------------------------------------------------- | -------------------------------------------------- | --------------------------- |
| 27, 35, 43, 49 | `{x:5,y:5}`, `{x:0,y:0}`, `{x:0,y:0}`, `{x:10,y:10}` | `{q:2,r:3}`, `{q:0,r:0}`, `{q:0,r:0}`, `{q:5,r:0}` | Filter idle test            |
| 71, 79         | `{x:3,y:3}`, `{x:1,y:1}`                             | `{q:3,r:0}`, `{q:1,r:1}`                           | Stroke width test           |
| 105, 113       | `{x:2,y:2}`, `{x:0,y:0}`                             | `{q:2,r:2}`, `{q:0,r:0}`                           | Light Punch render          |
| 134, 142       | `{x:5,y:5}`, `{x:4,y:5}`                             | `{q:2,r:3}`, `{q:4,r:1}`                           | Movement dash pattern       |
| 168, 176       | `{x:5,y:5}`, `{x:4,y:5}`                             | `{q:2,r:3}`, `{q:4,r:1}`                           | Enemy movement dash         |
| 203, 211       | `{x:1,y:0}`, `{x:0,y:0}`                             | `{q:1,r:0}`, `{q:0,r:0}`                           | Light Punch visible         |
| 242, 250       | `{x:1,y:0}`, `{x:0,y:0}`                             | `{q:1,r:0}`, `{q:0,r:0}`                           | Movement visible            |
| 282, 290       | `{x:1,y:0}`, `{x:0,y:0}`                             | `{q:1,r:0}`, `{q:0,r:0}`                           | Disappears after resolution |

### File 24: `src/stores/gameStore-selectors-intent-preview.test.ts` (36 errors)

Largest file. Positions in createCharacter calls and targetCell in Action literals + some `toEqual` assertions.

**Coordinate transformations** (systematic):

Every `position: { x: 0, y: 0 }` -> `position: { q: 0, r: 0 }` (occurs ~16 times)
Every `position: { x: 1, y: 0 }` -> `position: { q: 1, r: 0 }` (occurs ~5 times)
Every `position: { x: 5, y: 5 }` -> `position: { q: 2, r: 3 }` (occurs ~7 times)
Every `position: { x: 2, y: 0 }` -> `position: { q: 2, r: 0 }` (occurs ~2 times)
Every `position: { x: 11, y: 11 }` -> `position: { q: -5, r: 5 }` (occurs 1 time, line 338)
Every `position: { x: 6, y: 6 }` -> `position: { q: 3, r: 2 }` (occurs 1 time, line 170)
Every `position: { x: 3, y: 0 }` -> `position: { q: 3, r: 0 }` (occurs 1 time, line 521)
Every `position: { x: 4, y: 0 }` -> `position: { q: 4, r: 0 }` (occurs 1 time, line 528)

`targetCell` in Action literals:
Every `targetCell: { x: 1, y: 0 }` -> `targetCell: { q: 1, r: 0 }` (occurs ~3 times)
Every `targetCell: { x: 2, y: 0 }` -> `targetCell: { q: 2, r: 0 }` (occurs 1 time, line 512)

`toEqual` assertions on coordinate values:

- Line 37: `toEqual({ x: 1, y: 0 })` -> `toEqual({ q: 1, r: 0 })` (targetCell assertion)
- Line 273: `toEqual({ x: 3, y: 7 })` -> `toEqual({ q: 3, r: -1 })` (characterPosition assertion)

**Special: Line 258, 265** - `position: { x: 3, y: 7 }` and `{ x: 4, y: 7 }`:

- `{3, 7}` -> `{q: 3, r: -1}` (max(3,1,2)=3, valid). Enemy at range 1 from {3,-1}: `{4, -1}` (max(4,1,3)=4, valid).
  hex distance({3,-1}, {4,-1}) = max(1,0,1) = 1. In range for range=1 attack.
- Line 265: `{ x: 4, y: 7 }` -> `{ q: 4, r: -1 }`

**Validation**: {-5,5}: max(5,5,0) = 5 -- valid. Characters far apart for movement tests.

### File 25: `src/stores/gameStore-selectors-movement-target.test.ts` (20 errors)

Positions in createCharacter calls and `toEqual` assertions on `fromPosition` and `toPosition`.

| Line(s)            | Old Value                                                        | New Value                                                        | Notes                       |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------- |
| 32                 | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 | deadChar1 position          |
| 38                 | `{ x: 1, y: 1 }`                                                 | `{ q: 1, r: 1 }`                                                 | deadChar2 position          |
| 57                 | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 | friendly position           |
| 62                 | `{ x: 5, y: 5 }`                                                 | `{ q: 2, r: 3 }`                                                 | enemy position              |
| 70                 | `toEqual({ x: 0, y: 0 })`                                        | `toEqual({ q: 0, r: 0 })`                                        | **Assertion**               |
| 71                 | `toEqual({ x: 5, y: 5 })`                                        | `toEqual({ q: 2, r: 3 })`                                        | **Assertion**               |
| 85                 | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 |                             |
| 90                 | `{ x: 2, y: 2 }`                                                 | `{ q: 2, r: 2 }`                                                 |                             |
| 96                 | `{ x: 1, y: 1 }`                                                 | `{ q: 1, r: 1 }`                                                 |                             |
| 116                | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 |                             |
| 122                | `{ x: 5, y: 5 }`                                                 | `{ q: 2, r: 3 }`                                                 |                             |
| 128                | `{ x: 1, y: 1 }`                                                 | `{ q: 1, r: 1 }`                                                 |                             |
| 148                | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 |                             |
| 167                | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 |                             |
| 186, 192, 198, 204 | `{x:0,y:0}`, `{x:1,y:1}`, `{x:5,y:5}`, `{x:6,y:6}`               | `{q:0,r:0}`, `{q:1,r:1}`, `{q:2,r:3}`, `{q:3,r:2}`               | Multiple targets test       |
| 240                | `{ x: 0, y: 0 }`                                                 | `{ q: 0, r: 0 }`                                                 |                             |
| 261, 265, 275      | `{ x: 0, y: 0 }`, `targetCell: { x: 2, y: 0 }`, `{ x: 5, y: 0 }` | `{ q: 0, r: 0 }`, `targetCell: { q: 2, r: 0 }`, `{ q: 5, r: 0 }` | Uses current positions test |
| 281                | `toEqual({ x: 0, y: 0 })`                                        | `toEqual({ q: 0, r: 0 })`                                        | **Assertion**               |
| 282                | `toEqual({ x: 5, y: 0 })`                                        | `toEqual({ q: 5, r: 0 })`                                        | **Assertion**               |

### File 26: `src/components/RuleEvaluations/rule-evaluations-next-action.test.tsx` (6 errors)

All `targetCell` values in Action literals. No coordinate assertions (tests check rendered text).

| Line | Old Value                    | New Value                    |
| ---- | ---------------------------- | ---------------------------- |
| 35   | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` |
| 63   | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` |
| 91   | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` |
| 120  | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` |
| 153  | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` |
| 191  | `targetCell: { x: 1, y: 0 }` | `targetCell: { q: 1, r: 0 }` |

### File 27: `src/components/BattleStatus/BattleStatusBadge.test.tsx` (12 errors)

Full Character literals with `position: { x: N, y: M }`. No coordinate assertions.

| Line(s)                    | Old Value                    | New Value                   | Notes                             |
| -------------------------- | ---------------------------- | --------------------------- | --------------------------------- |
| 41, 67, 94, 145, 182, 221  | `position: { x: 0, y: 0 }`   | `position: { q: 0, r: 0 }`  | Friendly position (6 occurrences) |
| 52, 79, 107, 157, 193, 232 | `position: { x: 11, y: 11 }` | `position: { q: -5, r: 5 }` | Enemy position (6 occurrences)    |

**Validation**: {-5, 5}: max(5, 5, 0) = 5 -- valid

---

## Phase 6: Distance-Dependent Selector Tests (59 errors, 6 files)

These tests require careful coordinate selection to preserve distance ordering and tiebreaking semantics.

### File 28: `src/engine/selectors-nearest-enemy.test.ts` (11 errors)

**Test 1: "closest enemy by Chebyshev distance"** (lines 20-30)

- Old: eval {5,5}, enemyA {5,7} (Chebyshev=2), enemyB {8,5} (Chebyshev=3)
- New: eval {0,0}, enemyA {0,2} (hex=2), enemyB {3,0} (hex=3)
- Expected: enemyA (closer)
- Verification: hexDist(0,0 -> 0,2) = max(0,2,2) = 2; hexDist(0,0 -> 3,0) = max(3,0,3) = 3. OK.

**Test 2: "ignore allies"** (lines 47-57)

- Old: eval {5,5}, ally {5,6} (dist=1), enemy {5,8} (dist=3)
- New: eval {0,0}, ally {0,1} (hex=1), enemy {0,3} (hex=3)
- Expected: enemy (only enemy)
- Verification: {0,3}: max(0,3,3)=3, valid. hexDist=3. OK.

**Test 3: "diagonal distances"** (lines 74-84)

- Old: eval {5,5}, enemyA {7,7} (Chebyshev=2 diagonal), enemyB {5,8} (dist=3)
- New: eval {0,0}, enemyA {1,1} (hex=2), enemyB {0,3} (hex=3)
- Expected: enemyA (closer)
- Verification: hexDist(0,0 -> 1,1) = max(1,1,2) = 2; hexDist(0,0 -> 0,3) = max(0,3,3) = 3. OK.
- Comment update: "dist=2 (diagonal)" -> "hex dist=2" (no diagonals in hex)

**Test 4: "no enemies"** (lines 101-107)

- Old: eval {5,5}, ally {6,6}
- New: eval {0,0}, ally {1,1}
- Expected: null

### File 29: `src/engine/selectors-nearest-ally.test.ts` (8 errors)

**Test 1: "closest ally by Chebyshev distance"** (lines 20-30)

- Old: eval {5,5}, allyA {5,7} (dist=2), allyB {8,5} (dist=3)
- New: eval {0,0}, allyA {0,2} (hex=2), allyB {3,0} (hex=3)
- Expected: allyA

**Test 2: "exclude self"** (line 47)

- Old: eval {5,5}
- New: eval {0,0}

**Test 3: "ignore enemies"** (lines 60-70)

- Old: eval {5,5}, enemy {5,6} (dist=1), ally {5,8} (dist=3)
- New: eval {0,0}, enemy {0,1} (hex=1), ally {0,3} (hex=3)
- Expected: ally

**Test 4: "only evaluator exists"** (line 87)

- Old: eval {5,5}
- New: eval {0,0}

### File 30: `src/engine/selectors-lowest-hp-enemy.test.ts` (9 errors)

No distance dependencies. Positions just need to be valid and distinct.

**Test 1: "lowest current HP"** (lines 20-38)

- Old: eval {5,5}, A hp=75 {3,3}, B hp=50 {4,4}, C hp=90 {6,6}
- New: eval {0,0}, A hp=75 {3,0} (valid: max(3,0,3)=3), B hp=50 {2,2} (valid: max(2,2,4)=4), C hp=90 {3,2} (valid: max(3,2,5)=5)
- Expected: B (lowest HP)

**Test 2: "ignore allies"** (lines 55-68)

- Old: eval {5,5}, ally hp=10 {4,4}, enemy hp=50 {6,6}
- New: eval {0,0}, ally hp=10 {2,2}, enemy hp=50 {3,2}
- Expected: enemy

**Test 3: "no enemies"** (lines 84-90)

- Old: eval {5,5}, ally {4,4}
- New: eval {0,0}, ally {2,2}

### File 31: `src/engine/selectors-lowest-hp-ally.test.ts` (9 errors)

**Test 1: "lowest current HP"** (lines 20-38)

- Old: eval {5,5}, A hp=75 {3,3}, B hp=50 {4,4}, C hp=90 {6,6}
- New: eval {0,0}, A hp=75 {3,0}, B hp=50 {2,2}, C hp=90 {3,2}
- Expected: B (lowest HP)

**Test 2: "exclude self"** (lines 55-65)

- Old: eval hp=10 {5,5}, ally hp=50 {4,4}
- New: eval hp=10 {0,0}, ally hp=50 {2,2}
- Expected: ally

**Test 3: "ignore enemies"** (lines 75-88)

- Old: eval {5,5}, enemy hp=10 {6,6}, ally hp=50 {4,4}
- New: eval {0,0}, enemy hp=10 {3,2}, ally hp=50 {2,2}
- Expected: ally

### File 32: `src/engine/selectors-tie-breaking.test.ts` (16 errors)

**CRITICAL FILE** - All tests verify tiebreaking logic. Must update tiebreaking dimension references (Y->R, X->Q).

**Test 1: "nearest_enemy: prefer lower Y when distances equal"** (lines 16-41)

- Old: eval {5,5}, enemyA {6,4} Y=4, enemyB {4,6} Y=6
- New: eval {0,0}, enemyA {1,-1} R=-1, enemyB {-1,1} R=1
- Expected: enemyA (lower R)
- Verification: hexDist(0,0 -> 1,-1) = max(1,1,0) = 1; hexDist(0,0 -> -1,1) = max(1,1,0) = 1. Equal.
  Tiebreak: enemyA.R=-1 < enemyB.R=1. Winner: enemyA. Correct.
- Comment update: "dist=1, Y=4" -> "hex dist=1, R=-1", "Y=4 < Y=6" -> "R=-1 < R=1"
- Test name update: "prefer lower Y" -> "prefer lower R"

**Test 2: "nearest_enemy: prefer lower X when Y and distances equal"** (lines 43-67)

- Old: eval {5,5}, enemyA {4,5} X=4, enemyB {6,5} X=6
- New: eval {0,0}, enemyA {-1,0} Q=-1, enemyB {1,0} Q=1
- Expected: enemyA (lower Q)
- Verification: hexDist(0,0 -> -1,0) = max(1,0,1) = 1; hexDist(0,0 -> 1,0) = max(1,0,1) = 1. Equal.
  R: both 0. Tiebreak by Q: enemyA.Q=-1 < enemyB.Q=1. Winner: enemyA. Correct.
- Comment update: "X=4" -> "Q=-1", "X=4 < X=6" -> "Q=-1 < Q=1"
- Test name update: "prefer lower X when Y" -> "prefer lower Q when R"

**Test 3: "lowest_hp_enemy: prefer lower Y when HP equal"** (lines 70-96)

- Old: eval {5,5}, A hp=50 {3,2} Y=2, B hp=50 {7,4} Y=4
- New: eval {0,0}, A hp=50 {-2,-1} R=-1, B hp=50 {2,1} R=1
- Expected: enemyA (lower R)
- Verification: {-2,-1}: max(2,1,3)=3, valid. {2,1}: max(2,1,3)=3, valid.
  Same HP=50. Tiebreak by R: A.R=-1 < B.R=1. Winner: A. Correct.
- Comment update: "Y=2" -> "R=-1", "Y=2 < Y=4" -> "R=-1 < R=1"
- Test name update: "prefer lower Y when HP equal" -> "prefer lower R when HP equal"

**Test 4: "lowest_hp_enemy: prefer lower X when HP and Y equal"** (lines 99-126)

- Old: eval {0,0}, A hp=50 {2,3} X=2, B hp=50 {5,3} X=5
- New: eval {0,0}, A hp=50 {-1,2} Q=-1 R=2, B hp=50 {2,2} Q=2 R=2
- Expected: enemyA (lower Q when HP and R equal)
- Verification: {-1,2}: max(1,2,1)=2, valid. {2,2}: max(2,2,4)=4, valid.
  Same HP=50. Same R=2. Tiebreak by Q: A.Q=-1 < B.Q=2. Winner: A. Correct.
- Comment update: "X=2" -> "Q=-1", "X=2 < X=5" -> "Q=-1 < Q=2"
- Test name update: "prefer lower X when HP and Y" -> "prefer lower Q when HP and R"

**Test 5: "nearest_enemy: three-way tie"** (lines 128-158)

- Old: eval {5,5}, A {5,4} Y=4, B {6,5} Y=5, C {4,5} Y=5
- New: eval {0,0}, A {0,-1} R=-1, B {1,0} R=0, C {-1,0} R=0
- Expected: enemyA (lowest R)
- Verification: All hex dist 1. A.R=-1 lowest. Winner: A. Correct.
- Comment update: "Lowest Y=4" -> "Lowest R=-1"

### File 33: `src/engine/selectors-metric-independence.test.ts` (6 errors)

**Test 1: "nearest_enemy: select by distance regardless of HP"** (lines 20-32)

- Old: eval {5,5}, A hp=100 {5,6} dist=1, B hp=10 {5,9} dist=4
- New: eval {0,0}, A hp=100 {0,1} hex=1, B hp=10 {0,4} hex=4
- Expected: A (closer despite higher HP)
- Verification: {0,4}: max(0,4,4)=4, valid. hexDist=4. OK.

**Test 2: "lowest_hp_enemy: select by HP regardless of distance"** (lines 49-62)

- Old: eval {5,5}, A hp=100 {5,6} dist=1, B hp=10 {5,9} dist=4
- New: eval {0,0}, A hp=100 {0,1} hex=1, B hp=10 {0,4} hex=4
- Expected: B (lower HP despite farther)

---

## Phase 7: Game Decision Tests (29 errors, 5 files)

### File 34: `src/engine/game-decisions-action-type-inference.test.ts` (6 errors)

All `position: { x: N, y: M }` on enemy characters. The `character` positions already use `{q, r}`.

| Line | Old Value                  | New Value                   | Notes                         |
| ---- | -------------------------- | --------------------------- | ----------------------------- |
| 18   | `position: { x: 6, y: 5 }` | `position: { q: 3, r: -1 }` | enemy position (max(3,1,2)=3) |
| 44   | `position: { x: 8, y: 5 }` | `position: { q: 5, r: -2 }` | enemy position (max(5,2,3)=5) |
| 72   | `position: { x: 6, y: 5 }` | `position: { q: 3, r: -1 }` | Same                          |
| 102  | `position: { x: 6, y: 5 }` | `position: { q: 3, r: -1 }` | Same                          |
| 127  | `position: { x: 6, y: 5 }` | `position: { q: 3, r: -1 }` | Same                          |
| 159  | `position: { x: 6, y: 5 }` | `position: { q: 3, r: -1 }` | Same                          |

### File 35: `src/engine/game-decisions-mid-action-skip.test.ts` (6 errors)

Mix of enemy positions and createAttackAction targetCells still using `{x, y}`.

| Line | Old Value                                   | New Value                                    | Notes                         |
| ---- | ------------------------------------------- | -------------------------------------------- | ----------------------------- |
| 19   | `createAttackAction({ x: 6, y: 5 }, 10, 2)` | `createAttackAction({ q: 3, r: -1 }, 10, 2)` | targetCell                    |
| 42   | `position: { x: 6, y: 5 }`                  | `position: { q: 3, r: -1 }`                  | enemy position                |
| 72   | `position: { x: 7, y: 5 }`                  | `position: { q: 4, r: -1 }`                  | enemy position (max(4,1,3)=4) |
| 73   | `createAttackAction({ x: 6, y: 5 }, 10, 2)` | `createAttackAction({ q: 3, r: -1 }, 10, 2)` | enemy targetCell              |
| 78   | `createAttackAction({ x: 6, y: 5 }, 10, 2)` | `createAttackAction({ q: 3, r: -1 }, 10, 2)` | midAction targetCell          |
| 89   | `position: { x: 6, y: 5 }`                  | `position: { q: 3, r: -1 }`                  | idle position                 |

### File 36: `src/engine/game-core-apply-decisions.test.ts` (6 errors)

All `createAttackAction` calls with `{x, y}` targetCells.

| Line | Old Value                                   | New Value                                    | Notes          |
| ---- | ------------------------------------------- | -------------------------------------------- | -------------- |
| 16   | `createAttackAction({ x: 6, y: 5 }, 10, 1)` | `createAttackAction({ q: 3, r: -1 }, 10, 1)` |                |
| 27   | `createAttackAction({ x: 7, y: 7 }, 10, 1)` | `createAttackAction({ q: 3, r: 2 }, 10, 1)`  | {7,7} remapped |
| 49   | `createAttackAction({ x: 6, y: 5 }, 10, 1)` | `createAttackAction({ q: 3, r: -1 }, 10, 1)` |                |
| 64   | `createAttackAction({ x: 6, y: 5 }, 10, 1)` | `createAttackAction({ q: 3, r: -1 }, 10, 1)` |                |
| 77   | `createAttackAction({ x: 6, y: 5 }, 10, 1)` | `createAttackAction({ q: 3, r: -1 }, 10, 1)` |                |
| 78   | `createAttackAction({ x: 7, y: 7 }, 15, 1)` | `createAttackAction({ q: 3, r: 2 }, 15, 1)`  |                |

### File 37: `src/engine/game-core-process-tick-combat-movement.test.ts` (3 errors)

| Line    | Old Value                                                 | New Value                                                  | Notes                      |
| ------- | --------------------------------------------------------- | ---------------------------------------------------------- | -------------------------- |
| 76      | `createMoveAction({ x: 6, y: 5 }, 2)`                     | `createMoveAction({ q: 3, r: -1 }, 2)`                     | Movement target            |
| 87      | `toEqual({ x: 6, y: 5 })`                                 | `toEqual({ q: 3, r: -1 })`                                 | **Assertion** - must match |
| 122-129 | `position: { x: 4, y: 5 }` and `position: { x: 5, y: 4 }` | `position: { q: 4, r: 1 }` and `position: { q: 5, r: -1 }` | Two movers to same target  |

**Validation**:

- {q:3, r:-1}: max(3,1,2) = 3, valid
- {q:4, r:1}: max(4,1,5) = 5, valid
- {q:5, r:-1}: max(5,1,4) = 5, valid

### File 38: `src/engine/movement-groups-stress.test.ts` (8 errors)

Only the "deterministic order" test (lines 104-127) still has `{x, y}`. Other tests already use `{q, r}`.

| Line | Old Value                             | New Value                             | Notes                  |
| ---- | ------------------------------------- | ------------------------------------- | ---------------------- | --- | ----- |
| 106  | `position: { x: 0, y: 0 }`            | `position: { q: 0, r: 0 }`            | moverA1                |
| 107  | `createMoveAction({ x: 2, y: 3 }, 1)` | `createMoveAction({ q: 2, r: 3 }, 1)` | Target (max(2,3,5)=5)  |
| 110  | `position: { x: 1, y: 2 }`            | `position: { q: 1, r: 2 }`            | moverA2                |
| 113  | `createMoveAction({ x: 2, y: 3 }, 1)` | `createMoveAction({ q: 2, r: 3 }, 1)` | Same target            |
| 116  | `position: { x: 4, y: 4 }`            | `position: { q: 2, r: 2 }`            | moverB1 (remapped,     | 4+4 | =8>5) |
| 120  | `createMoveAction({ x: 5, y: 5 }, 1)` | `createMoveAction({ q: 2, r: 3 }, 1)` | Target B (remapped)    |
| 123  | `position: { x: 5, y: 4 }`            | `position: { q: 3, r: 1 }`            | moverB2 (max(3,1,4)=4) |
| 126  | `createMoveAction({ x: 5, y: 5 }, 1)` | `createMoveAction({ q: 2, r: 3 }, 1)` | Same target B          |

**Validation**:

- Targets A {q:2,r:3} and B {q:2,r:3} -- WAIT, both groups target the same cell! That would merge them into one collision group instead of two.
- Correction: Need distinct targets. Target A stays at {q:2,r:3}. Target B should be different, e.g., {q:-2,r:-1} (max(2,1,3)=3, valid).
- moverB1 at {q:2,r:2} should be neighbor of target B. If target B is {q:-2,r:-1}, moverB1 needs to be near that. Use moverB1 {q:-1,r:-1} (max(1,1,2)=2) and moverB2 {q:-2,r:0} (max(2,0,2)=2).

**Revised mapping for deterministic order test**:

| Line | Old Value                             | New Value                               | Notes                   |
| ---- | ------------------------------------- | --------------------------------------- | ----------------------- |
| 106  | `position: { x: 0, y: 0 }`            | `position: { q: 1, r: 3 }`              | moverA1 (near target A) |
| 107  | `createMoveAction({ x: 2, y: 3 }, 1)` | `createMoveAction({ q: 2, r: 3 }, 1)`   | Target A                |
| 110  | `position: { x: 1, y: 2 }`            | `position: { q: 2, r: 2 }`              | moverA2 (near target A) |
| 113  | `createMoveAction({ x: 2, y: 3 }, 1)` | `createMoveAction({ q: 2, r: 3 }, 1)`   | Same target A           |
| 116  | `position: { x: 4, y: 4 }`            | `position: { q: -1, r: -1 }`            | moverB1 (near target B) |
| 120  | `createMoveAction({ x: 5, y: 5 }, 1)` | `createMoveAction({ q: -2, r: -1 }, 1)` | Target B                |
| 123  | `position: { x: 5, y: 4 }`            | `position: { q: -2, r: 0 }`             | moverB2 (near target B) |
| 126  | `createMoveAction({ x: 5, y: 5 }, 1)` | `createMoveAction({ q: -2, r: -1 }, 1)` | Same target B           |

**Verification**:

- Target A {2,3}: max(2,3,5)=5. moverA1 {1,3}: max(1,3,4)=4. moverA2 {2,2}: max(2,2,4)=4. Both adjacent to {2,3}? hexDist({1,3},{2,3})=max(1,0,1)=1. hexDist({2,2},{2,3})=max(0,1,1)=1. Yes.
- Target B {-2,-1}: max(2,1,3)=3. moverB1 {-1,-1}: max(1,1,2)=2. moverB2 {-2,0}: max(2,0,2)=2. hexDist({-1,-1},{-2,-1})=max(1,0,1)=1. hexDist({-2,0},{-2,-1})=max(0,1,1)=1. Yes.
- Target A != Target B. Two separate collision groups. Correct.
- Test asserts `result1.rngState === result2.rngState` regardless of input order. This is a determinism test, not dependent on specific coords.

---

## Implementation Checklist

- [ ] Phase 1: Fix 3 outlier errors (3 files)
- [ ] Phase 2: Fix 3 component/helper errors (2 files)
- [ ] Phase 3: Fix 29 simple swap errors (12 files)
- [ ] Phase 4: Fix 20 partially converted errors (2 files)
- [ ] Phase 5: Fix 108 action/intent data errors (7 files)
- [ ] Phase 6: Fix 59 distance-dependent selector errors (6 files)
- [ ] Phase 7: Fix 29 game decision errors (5 files)
- [ ] Run `npm run type-check` - expect 0 errors
- [ ] Run `npm run test` - expect 1035/1045 passing (no regressions)
- [ ] Run `npm run lint` - expect pass

**Total: 271 errors across 38 files**

Error count verification: 3 + 3 + 29 + 20 + 108 + 59 + 29 = 251. Discrepancy check: The Group 8 files (IntentLine-accessibility 2 + useDamageNumbers 1) are counted in Phase 2 (3 errors), but the original plan counts them as Group 8 separate from Group 9 outliers. Let me recount:

- Phase 1 (outliers): 3 errors (pathfinding, tooltip, token-hover)
- Phase 2 (component/helper): 3 errors (useDamageNumbers 1, IntentLine-accessibility 2)
- Phase 3 (simple swap): 29 errors (12 files)
- Phase 4 (partial): 14 + 6 = 20 errors (2 files)
- Phase 5 (action/intent): 10 + 13 + 13 + 18 + 36 + 20 + 6 + 12 = 128 errors...

Recount from exploration.md: 36+20+18+16+14+13+13+12+11+10+9+9+8+8+6+6+6+6+6+6+5+4+4+3+3+3+2+2+2+2+1+1+1+1+1+1+1+1 = 271. Correct.

Phase breakdown recount:

- Phase 1: 3 (pathfinding 1, tooltip 1, token-hover 1)
- Phase 2: 3 (useDamageNumbers 1, IntentLine-accessibility 2)
- Phase 3: 29 (12 files from Group 1)
- Phase 4: 20 (triggers-cell-targeted 14, combat-edge-cases 6)
- Phase 5: 108 (intent-ticks 10, intent-filter 13, movement-intent 13, IntentOverlay 18, intent-preview 36, movement-target 20... that's 110 already - but plan says 108 for 7 files)

Let me recount Phase 5: intent-ticks 10 + intent-filter 13 + movement-intent 13 + IntentOverlay 18 + intent-preview 36 + rule-evaluations-next-action 6 + BattleStatusBadge 12 = 108. Movement-target 20 is in Group 7 (Phase 5 in the plan but I labeled it Phase 5 above). Actually: the plan includes movement-target in Phase 5. So: 10+13+13+18+36+20+6+12 = 128. But plan says 108 for Group 2 (7 files) + 20 for Group 7 (1 file) = 128 total for combined Phase 5+. Let me just keep the implementation phases as the plan defines them.

Final verification of total: 3+3+29+20+128+59+29 = 271. Correct.

---

## Validation Notes

### Hand-verified representative cases:

1. **Tiebreaking Test 1** (selectors-tie-breaking.test.ts, test 1):
   - eval {0,0}, enemyA {1,-1}, enemyB {-1,1}
   - hexDist: max(1,1,0)=1 for both -- TIED
   - Tiebreak: R first. A.R=-1 < B.R=1. Winner: A. CORRECT.

2. **Tiebreaking Test 4** (selectors-tie-breaking.test.ts, test 4):
   - eval {0,0}, A hp=50 {-1,2}, B hp=50 {2,2}
   - Same HP. Tiebreak: R first. Both R=2, tied. Q next: A.Q=-1 < B.Q=2. Winner: A. CORRECT.

3. **Nearest enemy distance ordering** (selectors-nearest-enemy.test.ts, test 1):
   - eval {0,0}, enemyA {0,2}, enemyB {3,0}
   - hexDist({0,0},{0,2}) = max(0,2,2)=2. hexDist({0,0},{3,0}) = max(3,0,3)=3.
   - 2 < 3, so A is closer. CORRECT.

4. **Combat hit detection** (combat-edge-cases.test.ts, "action filtering"):
   - charC at {2,3} attacks {3,2}. charD at {3,2}. charD should be hit.
   - targetCell == charD.position. CORRECT.

5. **Movement target assertion** (gameStore-selectors-movement-target.test.ts, "uses current positions"):
   - friendly at {0,0}, action targetCell {2,0}, enemy at {5,0}
   - fromPosition assertion: {0,0} (current position, not targetCell). CORRECT.

6. **Movement groups deterministic order** (movement-groups-stress.test.ts):
   - Group A targets {2,3}. Group B targets {-2,-1}. Distinct targets = separate collision groups. CORRECT.

### All coordinates satisfy hex validity:

Every `{q, r}` in this document has been verified: `max(|q|, |r|, |q+r|) <= 5`.
