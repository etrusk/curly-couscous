# Plan: Mutation Score Improvement -- movement-scoring.ts

## Goal

Create `/home/bob/Projects/auto-battler/src/engine/movement-scoring.test.ts` with targeted unit tests to raise mutation score of `src/engine/movement-scoring.ts` from 45% to 80%+. Test-only task; no production code changes.

## File Structure Decision

**Single file with helper function.** Estimated ~48 test cases at ~6-8 lines each (with helper) = ~320-380 lines. Stays within the 400-line budget. A `score()` helper that builds a `CandidateScore` from overrides will eliminate repetitive object construction (~2 lines per call instead of ~8).

If the file exceeds 380 lines during implementation, split `compareAwayMode` tests into `src/engine/movement-scoring-away.test.ts` (the codebase uses this split pattern, e.g., `game-movement-escape-routes.test.ts`).

## Helper Function

```typescript
function score(overrides: Partial<CandidateScore> = {}): CandidateScore {
  return {
    distance: 0,
    absDq: 0,
    absDr: 0,
    r: 0,
    q: 0,
    escapeRoutes: 6,
    ...overrides,
  };
}
```

All fields default to 0/6 (neutral values that produce ties at every level). Each test overrides only the fields relevant to the tiebreaker level under test. Per Lesson 005: all prior levels are genuinely equal because they use the same default value, and only the target level differs. This avoids accidentally passing through an earlier comparison.

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

5 tiebreaker levels (all minimize). Each level needs 3 tests: (a) candidate wins, (b) candidate loses, (c) tie falls through. Plus 1 all-equal fallback.

### Level 1 -- distance (primary, minimize)

| Test      | Candidate                          | Best                               | Expected | Mutants killed                                         |
| --------- | ---------------------------------- | ---------------------------------- | -------- | ------------------------------------------------------ |
| (a) wins  | `score({ distance: 2 })`           | `score({ distance: 3 })`           | true     | `< to >`, `true to false`                              |
| (b) loses | `score({ distance: 4 })`           | `score({ distance: 3 })`           | false    | `> to <`, `false to true`                              |
| (c) tie   | `score({ distance: 3, absDq: 1 })` | `score({ distance: 3, absDq: 2 })` | true     | `< to <=` (would short-circuit), verifies fall-through |

### Level 2 -- absDq (secondary, minimize)

Prior fields: distance tied at default (0).

| Test      | Candidate                       | Best                            | Expected |
| --------- | ------------------------------- | ------------------------------- | -------- |
| (a) wins  | `score({ absDq: 1 })`           | `score({ absDq: 2 })`           | true     |
| (b) loses | `score({ absDq: 3 })`           | `score({ absDq: 2 })`           | false    |
| (c) tie   | `score({ absDq: 2, absDr: 1 })` | `score({ absDq: 2, absDr: 2 })` | true     |

### Level 3 -- absDr (tertiary, minimize)

Prior fields: distance, absDq tied at default (0).

| Test      | Candidate                   | Best                        | Expected |
| --------- | --------------------------- | --------------------------- | -------- |
| (a) wins  | `score({ absDr: 1 })`       | `score({ absDr: 2 })`       | true     |
| (b) loses | `score({ absDr: 3 })`       | `score({ absDr: 2 })`       | false    |
| (c) tie   | `score({ absDr: 2, r: 1 })` | `score({ absDr: 2, r: 2 })` | true     |

### Level 4 -- r (quaternary, minimize)

Prior fields: distance, absDq, absDr tied at default (0).

| Test      | Candidate               | Best                    | Expected |
| --------- | ----------------------- | ----------------------- | -------- |
| (a) wins  | `score({ r: 1 })`       | `score({ r: 2 })`       | true     |
| (b) loses | `score({ r: 3 })`       | `score({ r: 2 })`       | false    |
| (c) tie   | `score({ r: 2, q: 1 })` | `score({ r: 2, q: 2 })` | true     |

### Level 5 -- q (quinary, minimize, asymmetric: no explicit > guard)

Prior fields: distance, absDq, absDr, r tied at default (0).

| Test      | Candidate         | Best              | Expected |
| --------- | ----------------- | ----------------- | -------- |
| (a) wins  | `score({ q: 1 })` | `score({ q: 2 })` | true     |
| (b) loses | `score({ q: 3 })` | `score({ q: 2 })` | false    |

No (c) tie test -- when q is equal, the function hits `return false` which is the all-equal fallback.

### All-equal fallback

| Test     | Candidate | Best      | Expected |
| -------- | --------- | --------- | -------- |
| fallback | `score()` | `score()` | false    |

**Total: 16 tests** (5 levels x 3 cases - 1 missing tie at level 5 + 1 all-equal)

---

## Block 2: `describe("compareAwayMode")` -- 19 tests

6 tiebreaker levels. Levels 1-4 maximize, levels 5-6 minimize.

### Level 1 -- composite = distance \* escapeRoutes (primary, maximize)

| Test      | Candidate                                 | Best                                      | Expected | Notes                                  |
| --------- | ----------------------------------------- | ----------------------------------------- | -------- | -------------------------------------- |
| (a) wins  | `score({ distance: 5, escapeRoutes: 4 })` | `score({ distance: 4, escapeRoutes: 4 })` | true     | 20 > 16                                |
| (b) loses | `score({ distance: 3, escapeRoutes: 4 })` | `score({ distance: 4, escapeRoutes: 4 })` | false    | 12 < 16                                |
| (c) tie   | `score({ distance: 4, escapeRoutes: 5 })` | `score({ distance: 5, escapeRoutes: 4 })` | false    | Both 20; falls to distance where 4 < 5 |

Note: The (c) case demonstrates composite tie AND distance tiebreak. The candidate has composite 20 but lower distance (4 < 5), so loses at level 2.

### Level 2 -- distance (secondary, maximize)

Equal composite achieved via inverse distance/escapeRoutes ratios.

| Test      | Candidate                                           | Best                                                | Expected | Notes                                                    |
| --------- | --------------------------------------------------- | --------------------------------------------------- | -------- | -------------------------------------------------------- |
| (a) wins  | `score({ distance: 5, escapeRoutes: 4 })`           | `score({ distance: 4, escapeRoutes: 5 })`           | true     | Both 20, 5 > 4                                           |
| (b) loses | `score({ distance: 4, escapeRoutes: 5 })`           | `score({ distance: 5, escapeRoutes: 4 })`           | false    | Both 20, 4 < 5                                           |
| (c) tie   | `score({ distance: 3, escapeRoutes: 6, absDq: 4 })` | `score({ distance: 3, escapeRoutes: 6, absDq: 3 })` | true     | Same composite 18, same distance 3, falls to absDq 4 > 3 |

### Level 3 -- absDq (tertiary, maximize)

Prior: composite and distance equal. Use same distance and escapeRoutes.

| Test      | Candidate                       | Best                            | Expected |
| --------- | ------------------------------- | ------------------------------- | -------- |
| (a) wins  | `score({ absDq: 4 })`           | `score({ absDq: 3 })`           | true     |
| (b) loses | `score({ absDq: 2 })`           | `score({ absDq: 3 })`           | false    |
| (c) tie   | `score({ absDq: 3, absDr: 4 })` | `score({ absDq: 3, absDr: 3 })` | true     |

### Level 4 -- absDr (quaternary, maximize)

Prior: composite, distance, absDq equal.

| Test      | Candidate                   | Best                        | Expected |
| --------- | --------------------------- | --------------------------- | -------- |
| (a) wins  | `score({ absDr: 4 })`       | `score({ absDr: 3 })`       | true     |
| (b) loses | `score({ absDr: 2 })`       | `score({ absDr: 3 })`       | false    |
| (c) tie   | `score({ absDr: 3, r: 1 })` | `score({ absDr: 3, r: 2 })` | true     |

### Level 5 -- r (quinary, minimize)

Prior: composite, distance, absDq, absDr equal.

| Test      | Candidate               | Best                    | Expected |
| --------- | ----------------------- | ----------------------- | -------- |
| (a) wins  | `score({ r: 1 })`       | `score({ r: 2 })`       | true     |
| (b) loses | `score({ r: 3 })`       | `score({ r: 2 })`       | false    |
| (c) tie   | `score({ r: 2, q: 1 })` | `score({ r: 2, q: 2 })` | true     |

### Level 6 -- q (senary, minimize, asymmetric: no explicit > guard)

Prior: composite, distance, absDq, absDr, r equal.

| Test      | Candidate         | Best              | Expected |
| --------- | ----------------- | ----------------- | -------- |
| (a) wins  | `score({ q: 1 })` | `score({ q: 2 })` | true     |
| (b) loses | `score({ q: 3 })` | `score({ q: 2 })` | false    |

No (c) tie test -- q equal falls through to `return false`, same as all-equal.

### All-equal fallback

| Test     | Candidate | Best      | Expected |
| -------- | --------- | --------- | -------- |
| fallback | `score()` | `score()` | false    |

**Total: 19 tests** (6 levels x 3 - 1 missing tie at level 6 + 1 all-equal)

---

## Block 3: `describe("buildObstacleSet")` -- 4 tests

Characters use `createCharacter()` from `./game-test-helpers`.

1. **Basic obstacle building**: 2 characters -> set contains 2 entries in `"q,r"` format
2. **Exclude single ID**: 3 characters, exclude 1 -> set has 2 entries, excluded character's position absent
3. **Exclude multiple IDs**: 3 characters, exclude 2 -> set has 1 entry
4. **Empty characters array**: `[]` -> empty set

---

## Block 4: `describe("countEscapeRoutes")` -- 4 tests

1. **Interior no obstacles**: `{q:0, r:0}` with empty set -> 6
2. **Some obstacles**: `{q:0, r:0}` with 3 neighbor positions (`"1,0"`, `"-1,0"`, `"0,1"`) blocked -> 3
3. **Fully surrounded**: `{q:0, r:0}` with all 6 neighbors in set -> 0
4. **Edge position**: `{q:5, r:0}` with empty set -> 3 (only 3 valid neighbors within HEX_RADIUS=5)

---

## Block 5: `describe("calculateCandidateScore")` -- 4 tests

1. **Basic score computation**: candidate `{q:1, r:1}`, target `{q:3, r:3}` -> verify distance (hexDistance), absDq=2, absDr=2, r=1, q=1, escapeRoutes=6 (no obstacles)
2. **With obstacles**: candidate `{q:0, r:0}`, target `{q:2, r:2}` with obstacles at `"1,0"` and `"0,1"` -> escapeRoutes=4
3. **Verify absolute values for dq/dr**: candidate `{q:3, r:0}`, target `{q:1, r:2}` -> absDq=|1-3|=2, absDr=|2-0|=2
4. **Coordinates are candidate's**: candidate `{q:2, r:3}`, target `{q:0, r:0}` -> r=3, q=2

---

## Block 6: `describe("selectBestCandidate")` -- 5 tests

Uses `createCharacter()` for target. Candidates are `Position[]`.

1. **Towards mode -- picks closest**: candidates `[{q:1,r:0}, {q:3,r:0}]`, target at `{q:4,r:0}` -> picks `{q:3,r:0}`
2. **Towards mode -- tiebreaker beyond distance**: candidates `[{q:1,r:1}, {q:2,r:0}]`, target at `{q:3,r:0}` -> same distance to target but different absDq; picks candidate with lower absDq
3. **Away mode -- picks farthest**: candidates `[{q:1,r:0}, {q:-1,r:0}]`, target at `{q:3,r:0}` -> picks `{q:-1,r:0}`
4. **Away mode with obstacles**: supply `allCharacters` + `moverId` -> tests that escape route scoring activates for away mode (obstacle reduces one candidate's routes making the other win)
5. **Single candidate**: returns that candidate regardless of mode

---

## Block 7: `describe("computePluralCandidateScore")` -- 5 tests

Uses `createCharacter()` for targets.

1. **Towards mode -- average distance**: candidate `{q:0, r:0}`, two targets at `{q:2,r:0}` (dist 2) and `{q:4,r:0}` (dist 4) -> distance = 3.0
2. **Away mode -- min distance**: same setup -> distance = 2
3. **Nearest target for dq/dr**: candidate `{q:0,r:0}`, targets at `{q:1,r:0}` (dist 1) and `{q:3,r:0}` (dist 3) -> absDq=|1|=1 (from nearest target), absDr=0
4. **With obstacles**: supply obstacle set -> escapeRoutes reflects blocked neighbors
5. **Without obstacles**: no obstacle param -> escapeRoutes = 6

---

## Estimated Test Count

| Block     | Function                    | Tests  |
| --------- | --------------------------- | ------ |
| 1         | compareTowardsMode          | 16     |
| 2         | compareAwayMode             | 19     |
| 3         | buildObstacleSet            | 4      |
| 4         | countEscapeRoutes           | 4      |
| 5         | calculateCandidateScore     | 4      |
| 6         | selectBestCandidate         | 5      |
| 7         | computePluralCandidateScore | 5      |
| **Total** |                             | **57** |

Revised upward from explorer's 45-50 estimate to 57 due to more thorough tiebreaker coverage. With the `score()` helper, most tiebreaker tests are 3-4 lines. Estimated file length: ~350-400 lines.

---

## Mutation Kill Strategy

The 32 NoCoverage mutants are concentrated in compareTowardsMode (lines 89-125) and compareAwayMode (lines 140-185). Stryker generates these mutant types for comparison cascades:

| Mutant Type                    | Example                                                     | Killed By                                                                       |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `<` to `<=`                    | `candidateScore.distance < bestScore.distance` becomes `<=` | All-equal fallback test (would incorrectly return true when equal)              |
| `<` to `>`                     | Same                                                        | (a) win test (would return false when candidate is better)                      |
| `>` to `>=`                    | `candidateScore.distance > bestScore.distance` becomes `>=` | All-equal fallback test                                                         |
| `>` to `<`                     | Same                                                        | (b) lose test (would return true when candidate is worse)                       |
| `true` to `false`              | `return true` becomes `return false`                        | (a) win test                                                                    |
| `false` to `true`              | `return false` becomes `return true`                        | (b) lose test or all-equal test                                                 |
| Remove conditional             | `if (...) return true` removed                              | (a) win test or (b) lose test (control flow changes)                            |
| Arithmetic: `*` to `+`/`-`/`/` | `distance * escapeRoutes`                                   | Composite tests with values where `*` differs from `+` (e.g., 5\*4=20 vs 5+4=9) |

Each (a)/(b)/(c) test targets specific mutant types. The combination of all three cases per level plus the all-equal fallback should kill all NoCoverage mutants in the comparison cascades.

---

## Implementation Order

1. Write `score()` helper + imports at top of file
2. Write `compareTowardsMode` tests (Block 1) -- highest mutation coverage impact
3. Write `compareAwayMode` tests (Block 2) -- second highest impact
4. Write `buildObstacleSet` tests (Block 3)
5. Write `countEscapeRoutes` tests (Block 4)
6. Write `calculateCandidateScore` tests (Block 5)
7. Write `selectBestCandidate` tests (Block 6)
8. Write `computePluralCandidateScore` tests (Block 7)

## Verification Steps

1. `npm run test -- --run src/engine/movement-scoring.test.ts` -- all new tests pass
2. `npm run test -- --run` -- full suite passes (no regressions)
3. `npm run mutate -- --mutate src/engine/movement-scoring.ts` -- verify >= 80% mutation score
4. If < 80%, examine surviving mutants in `reports/mutation/mutation.html` and add targeted tests

## Risks and Mitigations

1. **400-line budget**: Mitigated by `score()` helper. If exceeded, split compareAwayMode block into `movement-scoring-away.test.ts`.
2. **Composite arithmetic mutations**: Values chosen so `*` and `+`/`-` produce different orderings (e.g., 5\*4=20 vs 5+4=9).
3. **Hex coordinate validity**: selectBestCandidate/calculateCandidateScore tests use positions within `max(|q|, |r|, |q+r|) <= 5`. Direct CandidateScore tests for comparators are unconstrained.
4. **Overlap with existing tests**: Some coverage overlap with `game-movement-escape-routes.test.ts` is acceptable; the mutation score is measured per-file and the new tests target different branches (deep tiebreaker cascades).

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` (movement tiebreaker hierarchy in "Movement System" section)
- [x] Approach consistent with `.docs/architecture.md` (pure engine tests, no React)
- [x] Patterns follow `.docs/patterns/index.md` (scoring module extraction ADR-024)
- [x] No conflicts with `.docs/decisions/index.md`
- [x] UI tasks: N/A (test-only task)
- [x] Lesson 005 applied: `score()` helper defaults all fields to tied values; each test overrides only the target level

## Files

### To Create (1)

1. `/home/bob/Projects/auto-battler/src/engine/movement-scoring.test.ts` (~350-400 lines)

### To Read (by implementer, 5)

1. `/home/bob/Projects/auto-battler/src/engine/movement-scoring.ts` -- source under test (274 lines)
2. `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts` -- CandidateScore construction pattern
3. `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` -- createCharacter helper
4. `/home/bob/Projects/auto-battler/src/engine/hex.ts` -- hexDistance, getHexNeighbors for test value design
5. `/home/bob/Projects/auto-battler/src/engine/pathfinding.ts` -- positionKey format ("q,r")

### No Modifications

No production source code changes. No existing test file modifications.
