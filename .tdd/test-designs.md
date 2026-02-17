# Test Designs: movement-scoring.ts Mutation Score Improvement

**Review Status: APPROVED (2026-02-17)**
**Reviewer: tdd-test-reviewer**
**Changes: Added 1 test (nearest-target-not-first-index) to Block 7; total 58 tests**

## Test File

- **Path**: `/home/bob/Projects/auto-battler/src/engine/movement-scoring.test.ts`
- **New file**: Yes (no existing test file for this module)
- **Estimated size**: ~355-400 lines (58 tests with `score()` helper)

## Helper Function

All `compareTowardsMode` and `compareAwayMode` tests use this `score()` helper to construct `CandidateScore` objects. Default values produce ties at every level (Lesson 005 compliance). Each test overrides only the field(s) needed for the target tiebreaker level.

```typescript
function score(overrides: Partial<CandidateScore> = {}): CandidateScore {
  return {
    distance: 3,
    absDq: 1,
    absDr: 1,
    q: 0,
    r: 0,
    escapeRoutes: 6,
    ...overrides,
  };
}
```

Note: `distance: 3` and `escapeRoutes: 6` are chosen so that the default composite value in away mode (`3 * 6 = 18`) is a non-trivial product that differs from the sum (`3 + 6 = 9`). This ensures arithmetic mutation (`*` to `+`) is caught by default. The values `absDq: 1` and `absDr: 1` are non-zero to avoid masking mutations that replace a field with a literal `0`.

## Imports

```typescript
import { describe, it, expect } from "vitest";
import {
  CandidateScore,
  compareTowardsMode,
  compareAwayMode,
  selectBestCandidate,
  computePluralCandidateScore,
  countEscapeRoutes,
  buildObstacleSet,
  calculateCandidateScore,
} from "./movement-scoring";
import { createCharacter } from "./game-test-helpers";
```

---

## Block 1: `describe("compareTowardsMode")` -- 16 tests

All levels minimize. The cascade is: distance -> absDq -> absDr -> r -> q -> return false.

### Test: towards-L1-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower distance wins at primary level
- **Setup**: candidate = `score({ distance: 2 })`, best = `score({ distance: 4 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on line 89-91. Without this test, mutating `<` to `>` in the distance comparison would go undetected.

### Test: towards-L1-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher distance loses at primary level
- **Setup**: candidate = `score({ distance: 5 })`, best = `score({ distance: 4 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Kills `> to <` and `false to true` mutants on lines 92-94. Ensures the "candidate is worse" branch correctly returns false.

### Test: towards-L1-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal distance falls through to absDq level, where candidate wins
- **Setup**: candidate = `score({ distance: 3, absDq: 0 })`, best = `score({ distance: 3, absDq: 2 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to <=` mutant on distance (if `<=`, the function would short-circuit return true when distances are equal instead of falling through). Also validates fall-through to level 2.

### Test: towards-L2-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower absDq wins at secondary level (distance tied)
- **Setup**: candidate = `score({ absDq: 0 })`, best = `score({ absDq: 2 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on absDq comparison (lines 97-99). Distance is equal at default (3), so control reaches level 2.

### Test: towards-L2-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher absDq loses at secondary level (distance tied)
- **Setup**: candidate = `score({ absDq: 3 })`, best = `score({ absDq: 2 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Kills `> to <` and `false to true` mutants on absDq comparison (lines 100-102). Confirms worse candidate is rejected at this level.

### Test: towards-L2-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal absDq falls through to absDr level, where candidate wins
- **Setup**: candidate = `score({ absDq: 1, absDr: 0 })`, best = `score({ absDq: 1, absDr: 2 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to <=` / `> to >=` mutants at level 2 (would short-circuit instead of falling through). Validates cascade to level 3.

### Test: towards-L3-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower absDr wins at tertiary level (distance, absDq tied)
- **Setup**: candidate = `score({ absDr: 0 })`, best = `score({ absDr: 2 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on absDr comparison (lines 105-107).

### Test: towards-L3-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher absDr loses at tertiary level (distance, absDq tied)
- **Setup**: candidate = `score({ absDr: 3 })`, best = `score({ absDr: 2 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Kills `> to <` and `false to true` mutants on absDr comparison (lines 108-110).

### Test: towards-L3-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal absDr falls through to r level, where candidate wins
- **Setup**: candidate = `score({ absDr: 1, r: -1 })`, best = `score({ absDr: 1, r: 1 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to <=` / `> to >=` mutants at level 3. Validates cascade to level 4.

### Test: towards-L4-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower r wins at quaternary level (distance, absDq, absDr tied)
- **Setup**: candidate = `score({ r: -1 })`, best = `score({ r: 1 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on r comparison (lines 113-115).

### Test: towards-L4-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher r loses at quaternary level (distance, absDq, absDr tied)
- **Setup**: candidate = `score({ r: 2 })`, best = `score({ r: 1 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Kills `> to <` and `false to true` mutants on r comparison (lines 116-118).

### Test: towards-L4-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal r falls through to q level, where candidate wins
- **Setup**: candidate = `score({ r: 0, q: -1 })`, best = `score({ r: 0, q: 1 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to <=` / `> to >=` mutants at level 4. Validates cascade to level 5.

### Test: towards-L5-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower q wins at quinary level (distance, absDq, absDr, r tied)
- **Setup**: candidate = `score({ q: -1 })`, best = `score({ q: 1 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on q comparison (lines 121-123). This is the last comparison before `return false`.

### Test: towards-L5-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher q falls through to return false (no explicit > guard)
- **Setup**: candidate = `score({ q: 2 })`, best = `score({ q: 1 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Kills "remove conditional" mutant on q < check. The code has no `if (q > q) return false` -- it falls directly to `return false`. This test ensures the `<` guard is not removed (which would make all q comparisons return false).

### Test: towards-L5-tie-is-fallback

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal q falls through to return false (same as all-equal)
- **Setup**: candidate = `score({ q: 5 })`, best = `score({ q: 5 })`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Validates that the level 5 `<` check does not trigger when values are equal. Kills `< to <=` mutant on q comparison (which would incorrectly return true when equal).

### Test: towards-all-equal-fallback

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Identical scores return false (no candidate is strictly better)
- **Setup**: candidate = `score()`, best = `score()`
- **Assertions**:
  1. `compareTowardsMode(candidate, best)` returns `false`
- **Justification**: Kills `false to true` mutant on the final `return false` (line 125). Also validates that `< to <=` mutations at any level are caught (equal values at earlier levels would incorrectly return true).

---

## Block 2: `describe("compareAwayMode")` -- 19 tests

Levels 1-4 maximize (use `>`), levels 5-6 minimize (use `<`). Level 1 uses composite = `distance * escapeRoutes`.

### Test: away-L1-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher composite wins at primary level
- **Setup**: candidate = `score({ distance: 5, escapeRoutes: 4 })`, best = `score({ distance: 4, escapeRoutes: 4 })`; composites: 20 vs 16
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to <` and `true to false` mutants on composite comparison (lines 140-142). Values ensure `*` differs from `+` (20 vs 9+8).

### Test: away-L1-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower composite loses at primary level
- **Setup**: candidate = `score({ distance: 3, escapeRoutes: 4 })`, best = `score({ distance: 4, escapeRoutes: 4 })`; composites: 12 vs 16
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `< to >` and `false to true` mutants on composite comparison (lines 143-145).

### Test: away-L1-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal composites fall through to distance level, where candidate loses
- **Setup**: candidate = `score({ distance: 4, escapeRoutes: 5 })`, best = `score({ distance: 5, escapeRoutes: 4 })`; both composite 20, distance 4 < 5
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `> to >=` mutant at composite (would short-circuit on equal). Also validates fall-through. Candidate loses because away mode maximizes distance and 4 < 5.

### Test: away-L1-arithmetic

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Composite uses multiplication, not addition/subtraction
- **Setup**: candidate = `score({ distance: 2, escapeRoutes: 5 })`, best = `score({ distance: 3, escapeRoutes: 3 })`; mult: 10 vs 9 (candidate wins), add: 7 vs 6 (candidate wins too -- need different values)
- **Revised Setup**: candidate = `score({ distance: 2, escapeRoutes: 6 })`, best = `score({ distance: 3, escapeRoutes: 3 })`; mult: 12 vs 9 (candidate wins), add: 8 vs 6 (candidate also wins). Still same. Need values where `*` gives different ordering than `+`.
- **Final Setup**: candidate = `score({ distance: 2, escapeRoutes: 3 })`, best = `score({ distance: 5, escapeRoutes: 1 })`; mult: 6 vs 5 (candidate wins), add: 5 vs 6 (candidate loses)
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `* to +` arithmetic mutant (lines 136-138). With addition, candidate composite would be 5 vs 6, incorrectly making candidate lose. With multiplication, candidate composite is 6 vs 5, correctly making candidate win.

### Test: away-L2-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher distance wins at secondary level (composite tied)
- **Setup**: candidate = `score({ distance: 5, escapeRoutes: 4 })`, best = `score({ distance: 4, escapeRoutes: 5 })`; both composite 20
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to <` and `true to false` mutants on distance comparison (lines 149-151). Composites are equal (20=20), so control reaches distance level.

### Test: away-L2-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower distance loses at secondary level (composite tied)
- **Setup**: candidate = `score({ distance: 4, escapeRoutes: 5 })`, best = `score({ distance: 5, escapeRoutes: 4 })`; both composite 20
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `< to >` and `false to true` mutants on distance comparison (lines 152-154).

### Test: away-L2-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal distance (with equal composite) falls through to absDq level
- **Setup**: candidate = `score({ distance: 3, escapeRoutes: 6, absDq: 4 })`, best = `score({ distance: 3, escapeRoutes: 6, absDq: 2 })`; both composite 18, same distance 3, absDq 4 > 2
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to >=` / `< to <=` mutants at level 2 (would short-circuit on equal distance). Validates cascade to level 3. Candidate wins via higher absDq (away maximizes).

### Test: away-L3-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher absDq wins at tertiary level (composite, distance tied)
- **Setup**: candidate = `score({ absDq: 3 })`, best = `score({ absDq: 0 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to <` and `true to false` mutants on absDq comparison (lines 157-159). Composite and distance use defaults (both 18, both dist 3).

### Test: away-L3-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower absDq loses at tertiary level (composite, distance tied)
- **Setup**: candidate = `score({ absDq: 0 })`, best = `score({ absDq: 2 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `< to >` and `false to true` mutants on absDq comparison (lines 160-162).

### Test: away-L3-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal absDq falls through to absDr level, where candidate wins
- **Setup**: candidate = `score({ absDq: 1, absDr: 3 })`, best = `score({ absDq: 1, absDr: 0 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to >=` / `< to <=` mutants at level 3. Validates cascade to level 4. Candidate wins via higher absDr (away maximizes).

### Test: away-L4-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher absDr wins at quaternary level (composite, distance, absDq tied)
- **Setup**: candidate = `score({ absDr: 3 })`, best = `score({ absDr: 0 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to <` and `true to false` mutants on absDr comparison (lines 165-167).

### Test: away-L4-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower absDr loses at quaternary level
- **Setup**: candidate = `score({ absDr: 0 })`, best = `score({ absDr: 2 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `< to >` and `false to true` mutants on absDr comparison (lines 168-170).

### Test: away-L4-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal absDr falls through to r level, where candidate wins
- **Setup**: candidate = `score({ absDr: 1, r: -1 })`, best = `score({ absDr: 1, r: 1 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `> to >=` / `< to <=` mutants at level 4. Validates cascade to level 5. Candidate wins via lower r (away level 5 minimizes).

### Test: away-L5-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower r wins at quinary level (composite, distance, absDq, absDr tied)
- **Setup**: candidate = `score({ r: -1 })`, best = `score({ r: 1 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on r comparison (lines 173-175). Note: level 5 in away mode minimizes r (uses `<`), same direction as towards mode.

### Test: away-L5-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher r loses at quinary level
- **Setup**: candidate = `score({ r: 2 })`, best = `score({ r: 1 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `> to <` and `false to true` mutants on r comparison (lines 176-178).

### Test: away-L5-tie

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Equal r falls through to q level, where candidate wins
- **Setup**: candidate = `score({ r: 0, q: -1 })`, best = `score({ r: 0, q: 1 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `< to <=` / `> to >=` mutants at level 5. Validates cascade to level 6. Candidate wins via lower q (away level 6 minimizes).

### Test: away-L6-wins

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with lower q wins at senary level (all prior levels tied)
- **Setup**: candidate = `score({ q: -1 })`, best = `score({ q: 1 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `true`
- **Justification**: Kills `< to >` and `true to false` mutants on q comparison (lines 181-183). Last comparison before `return false`.

### Test: away-L6-loses

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Candidate with higher q falls through to return false (no explicit > guard)
- **Setup**: candidate = `score({ q: 2 })`, best = `score({ q: 1 })`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills "remove conditional" mutant on q < check. Code has no `if (q > q) return false` -- falls directly to `return false`.

### Test: away-all-equal-fallback

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Identical scores return false (no candidate is strictly better)
- **Setup**: candidate = `score()`, best = `score()`
- **Assertions**:
  1. `compareAwayMode(candidate, best)` returns `false`
- **Justification**: Kills `false to true` mutant on the final `return false` (line 185). Also validates all `< to <=` and `> to >=` mutations are caught (equal values at any level would incorrectly return true with boundary mutations).

---

## Block 3: `describe("buildObstacleSet")` -- 4 tests

### Test: builds-obstacle-set-from-characters

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Character positions are added to obstacle set in `"q,r"` format
- **Setup**: Two characters via `createCharacter`: `{ id: "a", position: { q: 1, r: 2 } }` and `{ id: "b", position: { q: 3, r: -1 } }`
- **Assertions**:
  1. Result set has size 2
  2. Result contains `"1,2"`
  3. Result contains `"3,-1"`
- **Justification**: Validates basic obstacle building. Kills mutants that remove the `obstacles.add()` call or alter the iteration.

### Test: excludes-single-id

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Character with excluded ID is omitted from the obstacle set
- **Setup**: Three characters `a`, `b`, `c` at distinct positions. Call `buildObstacleSet(chars, "b")`
- **Assertions**:
  1. Result set has size 2
  2. Result does NOT contain `b`'s position key
  3. Result contains `a`'s and `c`'s position keys
- **Justification**: Kills mutant that removes the `excludeSet.has(c.id)` check or negates it. Core feature for excluding mover/target from obstacles.

### Test: excludes-multiple-ids

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Multiple IDs can be excluded simultaneously via rest parameter
- **Setup**: Three characters `a`, `b`, `c`. Call `buildObstacleSet(chars, "a", "c")`
- **Assertions**:
  1. Result set has size 1
  2. Result contains only `b`'s position key
- **Justification**: Validates the rest parameter (`...excludeIds`) correctly creates a Set from multiple args. Kills mutant that takes only first arg.

### Test: empty-characters-array

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Empty character array produces empty obstacle set
- **Setup**: Call `buildObstacleSet([])`
- **Assertions**:
  1. Result set has size 0
- **Justification**: Boundary case. Ensures no crash on empty input and validates loop handles zero iterations.

---

## Block 4: `describe("countEscapeRoutes")` -- 4 tests

### Test: interior-no-obstacles

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Interior hex with no obstacles returns 6 (all neighbors unblocked)
- **Setup**: position = `{ q: 0, r: 0 }`, obstacles = `new Set<string>()`
- **Assertions**:
  1. `countEscapeRoutes(position, obstacles)` returns `6`
- **Justification**: Baseline test. Kills mutant that initializes `count` to non-zero or removes the increment.

### Test: some-obstacles

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Blocked neighbors reduce escape route count
- **Setup**: position = `{ q: 0, r: 0 }`, obstacles = `new Set(["1,0", "-1,0", "0,1"])`; 3 of 6 neighbors blocked
- **Assertions**:
  1. `countEscapeRoutes(position, obstacles)` returns `3`
- **Justification**: Validates obstacle filtering logic. Kills mutant that negates the `!obstacles.has()` check (would return 3 instead of 3... need to be careful). Actually: negating would count blocked ones (3) instead of unblocked (3). Same result here. Use 2 obstacles instead: obstacles = `new Set(["1,0", "-1,0"])`; expect 4.
- **Revised Setup**: position = `{ q: 0, r: 0 }`, obstacles = `new Set(["1,0", "-1,0"])` (2 blocked out of 6)
- **Revised Assertions**:
  1. `countEscapeRoutes(position, obstacles)` returns `4`
- **Revised Justification**: With negation mutant (`!` removed from `!obstacles.has()`), result would be 2 instead of 4. Clearly distinguishable.

### Test: fully-surrounded

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: All neighbors blocked returns 0
- **Setup**: position = `{ q: 0, r: 0 }`, obstacles = `new Set(["1,0", "-1,0", "0,1", "0,-1", "1,-1", "-1,1"])`
- **Assertions**:
  1. `countEscapeRoutes(position, obstacles)` returns `0`
- **Justification**: Boundary case (minimum routes). Kills mutant that changes initial `count` from 0 to 1 or otherwise alters the counting logic.

### Test: edge-position

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Edge/vertex hex returns fewer routes due to map boundary (3 valid neighbors for vertex)
- **Setup**: position = `{ q: 5, r: 0 }`, obstacles = `new Set<string>()`
- **Assertions**:
  1. `countEscapeRoutes(position, obstacles)` returns `3`
- **Justification**: Validates that `getHexNeighbors` boundary filtering interacts correctly with escape route counting. Vertex `(5,0)` has only 3 valid neighbors: `(4,0)`, `(5,-1)`, `(4,1)`.

---

## Block 5: `describe("calculateCandidateScore")` -- 4 tests

### Test: basic-score-computation

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: All CandidateScore fields are correctly computed
- **Setup**: candidate = `{ q: 1, r: 1 }`, target = `{ q: 3, r: 3 }`, no obstacles
- **Assertions**:
  1. `result.distance` equals `4` (hexDistance)
  2. `result.absDq` equals `2` (`|3-1|`)
  3. `result.absDr` equals `2` (`|3-1|`)
  4. `result.q` equals `1` (candidate's q)
  5. `result.r` equals `1` (candidate's r)
  6. `result.escapeRoutes` equals `6` (default when no obstacles)
- **Justification**: Comprehensive field validation. Kills mutants that swap `dq`/`dr` computation, omit `Math.abs`, or return wrong coordinate. The target's coordinates (3,3) differ from candidate's (1,1) to ensure dq and dr mutations are detectable.

### Test: with-obstacles

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Obstacle set is passed through to countEscapeRoutes
- **Setup**: candidate = `{ q: 0, r: 0 }`, target = `{ q: 2, r: 2 }`, obstacles = `new Set(["1,0", "0,1"])`
- **Assertions**:
  1. `result.escapeRoutes` equals `4` (6 neighbors - 2 blocked)
- **Justification**: Validates the `obstacles ? countEscapeRoutes(...) : 6` conditional uses the obstacle set. Kills mutant that always returns 6.

### Test: absolute-values-for-dq-dr

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: dq and dr are absolute values even when target coordinates are less than candidate
- **Setup**: candidate = `{ q: 3, r: 2 }`, target = `{ q: 1, r: 0 }`; dq = 1-3 = -2, dr = 0-2 = -2
- **Assertions**:
  1. `result.absDq` equals `2` (not -2)
  2. `result.absDr` equals `2` (not -2)
- **Justification**: Kills mutant that removes `Math.abs()` from dq/dr computation. Negative values would cause incorrect comparisons in tiebreaker functions.

### Test: coordinates-are-candidates

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: `q` and `r` in the score are the candidate's coordinates (not the target's)
- **Setup**: candidate = `{ q: 2, r: 3 }`, target = `{ q: 0, r: 0 }`
- **Assertions**:
  1. `result.q` equals `2`
  2. `result.r` equals `3`
- **Justification**: Kills mutant that swaps `candidate.q` for `target.q` or `candidate.r` for `target.r` in the return object (lines 76-77).

---

## Block 6: `describe("selectBestCandidate")` -- 5 tests

### Test: towards-picks-closest

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Towards mode selects the candidate with minimum distance
- **Setup**: candidates = `[{ q: 1, r: 0 }, { q: 3, r: 0 }]`, target = `createCharacter({ id: "t", position: { q: 4, r: 0 } })`; distances: 3 vs 1
- **Assertions**:
  1. `selectBestCandidate(candidates, target, "towards")` returns `{ q: 3, r: 0 }`
- **Justification**: Basic towards-mode test. Kills mutant that inverts the `isBetter` condition or selects wrong mode.

### Test: towards-tiebreaker-beyond-distance

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: When distances are equal, absDq tiebreaker resolves the selection
- **Setup**: candidates = `[{ q: 1, r: 0 }, { q: 2, r: -1 }]`, target = `createCharacter({ id: "t", position: { q: 3, r: 0 } })`; both distance 2. Candidate A absDq=2, Candidate B absDq=1. Towards minimizes absDq, so B wins.
- **Assertions**:
  1. `selectBestCandidate(candidates, target, "towards")` returns `{ q: 2, r: -1 }`
- **Justification**: Integration test for tiebreaker cascade through selectBestCandidate. Kills mutant that only checks primary distance. Validates that compareTowardsMode is correctly invoked.

### Test: away-picks-farthest

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Away mode selects the candidate that maximizes composite score
- **Setup**: candidates = `[{ q: 1, r: 0 }, { q: -1, r: 0 }]`, target = `createCharacter({ id: "t", position: { q: 3, r: 0 } })`; distances: 2 vs 4. No obstacles, both have 6 routes. Composites: 12 vs 24.
- **Assertions**:
  1. `selectBestCandidate(candidates, target, "away")` returns `{ q: -1, r: 0 }`
- **Justification**: Basic away-mode test. Kills mutant that inverts mode selection or comparison direction. Verifies away mode is routed to compareAwayMode.

### Test: away-with-obstacles

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Away mode builds obstacle set from allCharacters/moverId and uses escape routes in scoring
- **Setup**:
  - mover = `createCharacter({ id: "mover", position: { q: 0, r: 1 } })`
  - target = `createCharacter({ id: "t", position: { q: 0, r: 0 } })`
  - blocker1 = `createCharacter({ id: "b1", position: { q: 2, r: 0 } })`
  - blocker2 = `createCharacter({ id: "b2", position: { q: 1, r: 1 } })`
  - candidates = `[{ q: -1, r: 0 }, { q: 1, r: 0 }]`
  - allCharacters = `[mover, target, blocker1, blocker2]`
  - Obstacles (excl mover): positions of target `(0,0)`, blocker1 `(2,0)`, blocker2 `(1,1)`
  - Candidate `(-1,0)`: dist 1, neighbors include `(0,0)`=obstacle -> 5 routes, composite=5
  - Candidate `(1,0)`: dist 1, neighbors `(2,0)`=obstacle, `(0,0)`=obstacle, `(1,1)`=obstacle -> 3 routes, composite=3
- **Assertions**:
  1. `selectBestCandidate(candidates, target, "away", allCharacters, "mover")` returns `{ q: -1, r: 0 }`
- **Justification**: Validates obstacle-building path in selectBestCandidate (lines 199-202). Kills mutant that removes the `mode === "away"` condition or skips obstacle building. Without obstacles both candidates would have equal composite (6 each), but with obstacles (-1,0) wins due to more escape routes.

### Test: single-candidate

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Single candidate is returned regardless of mode
- **Setup**: candidates = `[{ q: 2, r: 1 }]`, target = `createCharacter({ id: "t", position: { q: 0, r: 0 } })`
- **Assertions**:
  1. `selectBestCandidate(candidates, target, "towards")` returns `{ q: 2, r: 1 }`
  2. `selectBestCandidate(candidates, target, "away")` returns `{ q: 2, r: 1 }`
- **Justification**: Boundary case. Validates loop does not execute when `candidates.length === 1`. Kills mutant that changes loop start index from 1 to 0 (would compare candidate against itself).

---

## Block 7: `describe("computePluralCandidateScore")` -- 5 tests

### Test: towards-average-distance

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Towards mode uses average distance across all targets
- **Setup**: candidate = `{ q: 0, r: 0 }`, targets = `[createCharacter({ id: "t1", position: { q: 2, r: 0 } }), createCharacter({ id: "t2", position: { q: 4, r: 0 } })]`; distances 2 and 4
- **Assertions**:
  1. `result.distance` equals `3` (average of 2 and 4)
- **Justification**: Validates towards-mode aggregation formula. Kills mutant that uses `Math.min` instead of average, or mutates the division.

### Test: away-min-distance

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Away mode uses minimum distance to nearest target
- **Setup**: candidate = `{ q: 0, r: 0 }`, targets = same as above (distances 2 and 4)
- **Assertions**:
  1. `result.distance` equals `2` (min of 2 and 4)
- **Justification**: Validates away-mode aggregation formula. Kills mutant that uses average instead of `Math.min`, or mutates the ternary condition.

### Test: nearest-target-for-dq-dr

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: absDq and absDr are computed from the nearest target, not any other target
- **Setup**: candidate = `{ q: 0, r: 0 }`, targets = `[createCharacter({ id: "t1", position: { q: 1, r: 0 } }), createCharacter({ id: "t2", position: { q: 3, r: 0 } })]`; nearest is t1 (dist 1)
- **Assertions**:
  1. `result.absDq` equals `1` (`|1-0|` from nearest target t1)
  2. `result.absDr` equals `0` (`|0-0|` from nearest target t1)
- **Justification**: Validates nearest-target selection for positional tiebreaking (lines 252-260). Kills mutant that uses wrong index or skips the nearest-target loop.

### Test: nearest-target-not-first-index

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: When nearest target is NOT at index 0, the nearestIdx loop body executes and updates nearestIdx
- **Setup**: candidate = `{ q: 0, r: 0 }`, targets = `[createCharacter({ id: "t1", position: { q: 3, r: 0 } }), createCharacter({ id: "t2", position: { q: 1, r: 0 } })]`; distances: t1=3, t2=1. Nearest is t2 at index 1.
- **Assertions**:
  1. `result.absDq` equals `1` (`|1-0|` from nearest target t2, not `3` from t1)
  2. `result.absDr` equals `0` (`|0-0|` from nearest target t2)
- **Justification**: **Added by reviewer.** The `nearest-target-for-dq-dr` test has nearest at index 0, which is the initial value of `nearestIdx`. A mutant removing `nearestIdx = i;` (line 257) would survive because the loop body never updates the index. This test puts the nearest target at index 1, forcing the loop body to execute. With the mutation removed, the function would use t1 (index 0) for dq/dr, producing absDq=3 instead of 1.

### Test: with-obstacles

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Obstacle set is used for escape route counting
- **Setup**: candidate = `{ q: 0, r: 0 }`, targets = `[createCharacter({ id: "t1", position: { q: 2, r: 0 } })]`, obstacles = `new Set(["1,0", "0,1"])`
- **Assertions**:
  1. `result.escapeRoutes` equals `4` (6 neighbors - 2 blocked)
- **Justification**: Validates the `obstacles ? countEscapeRoutes(...) : 6` path in computePluralCandidateScore. Kills mutant that ignores obstacles.

### Test: without-obstacles-default

- **File**: `src/engine/movement-scoring.test.ts`
- **Type**: unit
- **Verifies**: Missing obstacle parameter defaults escapeRoutes to 6
- **Setup**: candidate = `{ q: 0, r: 0 }`, targets = `[createCharacter({ id: "t1", position: { q: 2, r: 0 } })]`, no obstacles parameter
- **Assertions**:
  1. `result.escapeRoutes` equals `6`
- **Justification**: Validates default path. Kills mutant that changes default from 6 to another value or always calls countEscapeRoutes.

---

## Acceptance Criteria Cross-Reference

| Acceptance Criterion                                                           | Covering Tests                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `compareTowardsMode` all 5 tiebreaker levels with (a) wins, (b) loses, (c) tie | towards-L1 through towards-L5 (15 tests)                                             |
| `compareTowardsMode` returns false when all equal                              | towards-all-equal-fallback                                                           |
| `compareAwayMode` all 6 tiebreaker levels with (a) wins, (b) loses, (c) tie    | away-L1 through away-L6 (18 tests) + away-L1-arithmetic                              |
| `compareAwayMode` returns false when all equal                                 | away-all-equal-fallback                                                              |
| `selectBestCandidate` towards and away modes with tiebreaker                   | towards-tiebreaker-beyond-distance, away-picks-farthest                              |
| `computePluralCandidateScore` towards avg and away min distance                | towards-average-distance, away-min-distance, nearest-target-not-first-index          |
| `countEscapeRoutes` with 0, some, full obstacles                               | interior-no-obstacles, some-obstacles, fully-surrounded, edge-position               |
| `buildObstacleSet` with exclude IDs                                            | excludes-single-id, excludes-multiple-ids                                            |
| `calculateCandidateScore` with and without obstacles                           | basic-score-computation, with-obstacles, absolute-values, coordinates-are-candidates |
| Mutation score >= 80%                                                          | All 58 tests collectively target surviving/uncovered mutants                         |
| Existing tests pass                                                            | No changes to existing test files                                                    |
| No production code changes                                                     | New test file only                                                                   |

## Test Count Summary

| Block     | Function                    | Tests  |
| --------- | --------------------------- | ------ |
| 1         | compareTowardsMode          | 16     |
| 2         | compareAwayMode             | 19     |
| 3         | buildObstacleSet            | 4      |
| 4         | countEscapeRoutes           | 4      |
| 5         | calculateCandidateScore     | 4      |
| 6         | selectBestCandidate         | 5      |
| 7         | computePluralCandidateScore | 6      |
| **Total** |                             | **58** |

## Mutation Kill Coverage

| Mutant Type                          | Tests That Kill It                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `< to >` (comparison flip)           | Every (a) wins test                                                             |
| `> to <` (comparison flip)           | Every (b) loses test                                                            |
| `< to <=` (boundary change)          | (c) tie tests + all-equal fallback                                              |
| `> to >=` (boundary change)          | (c) tie tests + all-equal fallback                                              |
| `true to false` (return flip)        | Every (a) wins test                                                             |
| `false to true` (return flip)        | Every (b) loses test + all-equal fallback                                       |
| Remove conditional                   | (a) wins or (b) loses tests (control flow change)                               |
| `* to +`/`-`/`/` (arithmetic)        | away-L1-arithmetic (explicit), away-L1-wins/loses (implicit via product values) |
| `!` removal (negation)               | some-obstacles (count changes from 4 to 2)                                      |
| `0 to 1` (literal change)            | fully-surrounded (would return 1 instead of 0)                                  |
| Remove assignment (`nearestIdx = i`) | nearest-target-not-first-index (nearest at index 1)                             |

## Lesson 005 Compliance Verification

Each tiebreaker level test uses the `score()` helper where all fields default to equal ("tied") values. Only the target field is overridden. This ensures:

1. **Level 1 tests**: Only `distance` differs. All other fields are equal at defaults.
2. **Level 2 tests**: Only `absDq` differs. `distance` is tied at default 3.
3. **Level 3 tests**: Only `absDr` differs. `distance` and `absDq` are tied at defaults.
4. **Level 4 tests**: Only `r` differs. `distance`, `absDq`, `absDr` are tied at defaults.
5. **Level 5 tests**: Only `q` differs. All prior fields tied at defaults.
6. **Tie tests**: Target field is explicitly set equal, and the next level's field is overridden to produce a win. Prior levels are tied at defaults.
7. **Away composite tests**: `distance` and `escapeRoutes` are both overridden, but prior levels don't exist (composite is level 1). Level 2+ tests match composites by using inverse ratios (e.g., 5*4 = 4*5 = 20).

Control flow genuinely reaches the target level because all prior comparisons encounter equal values and fall through.
