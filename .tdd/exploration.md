# Exploration Findings

## Task Understanding

Improve the mutation score of `src/engine/movement-scoring.ts` from 45% to 80%+ by adding targeted unit tests. The file contains tiebreaker comparison logic for movement candidate selection. No production source code changes are allowed -- this is a test-only task. This is session 1 of 5 targeting engine files with low mutation scores.

## Relevant Files

### Primary Target

- `/home/bob/Projects/auto-battler/src/engine/movement-scoring.ts` (274 lines) -- the file under test, contains all 7 exported functions plus 1 exported interface

### Type Definitions

- `/home/bob/Projects/auto-battler/src/engine/types.ts` -- `Character` and `Position` types used by scoring functions
- `/home/bob/Projects/auto-battler/src/engine/hex.ts` -- `hexDistance`, `getHexNeighbors`, `HEX_DIRECTIONS` (6 directions), `HEX_RADIUS` (5) used internally by scoring functions
- `/home/bob/Projects/auto-battler/src/engine/pathfinding.ts` -- `positionKey` function (format: `"q,r"`) used by `buildObstacleSet` and `countEscapeRoutes`

### Re-export Path

- `/home/bob/Projects/auto-battler/src/engine/game-movement.ts` -- re-exports `countEscapeRoutes`, `calculateCandidateScore`, `compareTowardsMode`, `compareAwayMode`, `selectBestCandidate` from `movement-scoring.ts`

### Existing Tests (indirect coverage only)

- `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts` -- tests `compareAwayMode` (1 direct test: composite tiebreaker on distance), `calculateCandidateScore` (4 direct tests). Imports via `./game-movement` re-exports.
- `/home/bob/Projects/auto-battler/src/engine/game-movement.test.ts` -- tests `countEscapeRoutes` (3 direct tests: interior=6, edge<6, vertex=3).
- `/home/bob/Projects/auto-battler/src/engine/game-movement-plural.test.ts` -- exercises `computePluralCandidateScore` indirectly via `computePluralMoveDestination`.

### No Existing Direct Test File

- There is NO `src/engine/movement-scoring.test.ts`. A new test file must be created.

### Test Helpers

- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` -- `createCharacter()` helper for building minimal `Character` objects

### Mutation Testing Config

- `/home/bob/Projects/auto-battler/stryker.config.json` -- uses `@stryker-mutator/vitest-runner`, `incremental: false`, output to `reports/mutation/mutation.html`, `concurrency: 4`

## File Structure: movement-scoring.ts Exports

```typescript
// Type
export interface CandidateScore {
  distance: number; // hex distance to target
  absDq: number; // |target.q - candidate.q|
  absDr: number; // |target.r - candidate.r|
  r: number; // candidate.r coordinate
  q: number; // candidate.q coordinate
  escapeRoutes: number; // unblocked adjacent hexes (0-6)
}

// Functions (7 exports)
export function buildObstacleSet(
  characters: Character[],
  ...excludeIds: string[]
): Set<string>;
export function countEscapeRoutes(
  position: Position,
  obstacles: Set<string>,
): number;
export function calculateCandidateScore(
  candidate: Position,
  target: Position,
  obstacles?: Set<string>,
): CandidateScore;
export function compareTowardsMode(
  candidateScore: CandidateScore,
  bestScore: CandidateScore,
): boolean;
export function compareAwayMode(
  candidateScore: CandidateScore,
  bestScore: CandidateScore,
): boolean;
export function selectBestCandidate(
  candidates: Position[],
  target: Character,
  mode: "towards" | "away",
  allCharacters?: Character[],
  moverId?: string,
): Position;
export function computePluralCandidateScore(
  candidate: Position,
  targets: Character[],
  mode: "towards" | "away",
  obstacles?: Set<string>,
): CandidateScore;
```

## Tiebreaker Cascade Details

### compareTowardsMode (5 levels, all minimize)

| Level          | Field    | Direction | Comparison                                                                              |
| -------------- | -------- | --------- | --------------------------------------------------------------------------------------- |
| 1 (primary)    | distance | minimize  | `candidate < best -> true`                                                              |
| 2 (secondary)  | absDq    | minimize  | `candidate < best -> true`                                                              |
| 3 (tertiary)   | absDr    | minimize  | `candidate < best -> true`                                                              |
| 4 (quaternary) | r        | minimize  | `candidate < best -> true`                                                              |
| 5 (quinary)    | q        | minimize  | `candidate < best -> true` (only checks `<`, no explicit `>` check before return false) |
| fallback       | --       | --        | `return false`                                                                          |

Note on level 5: The q comparison only has `if (candidateScore.q < bestScore.q) return true;` followed directly by `return false;`. There is no explicit `candidateScore.q > bestScore.q` check. This means when q is greater, it falls through to return false (same as when equal).

### compareAwayMode (6 levels, mixed directions)

| Level          | Field                                 | Direction | Comparison                                                  |
| -------------- | ------------------------------------- | --------- | ----------------------------------------------------------- |
| 1 (primary)    | composite (`distance * escapeRoutes`) | maximize  | `candidate > best -> true`                                  |
| 2 (secondary)  | distance                              | maximize  | `candidate > best -> true`                                  |
| 3 (tertiary)   | absDq                                 | maximize  | `candidate > best -> true`                                  |
| 4 (quaternary) | absDr                                 | maximize  | `candidate > best -> true`                                  |
| 5 (quinary)    | r                                     | minimize  | `candidate < best -> true`                                  |
| 6 (senary)     | q                                     | minimize  | `candidate < best -> true` (same pattern as towards mode q) |
| fallback       | --                                    | --        | `return false`                                              |

### Key Observation for Test Design

Each tiebreaker level needs 3 test cases:

- **(a) candidate wins**: candidate beats best at this level (all prior levels tied)
- **(b) candidate loses**: candidate is worse at this level (all prior levels tied)
- **(c) tie falls through**: equal at this level (verified by next level resolving differently)

For `compareTowardsMode`: 5 levels x 3 cases + 1 all-equal = 16 tests
For `compareAwayMode`: 6 levels x 3 cases + 1 all-equal = 19 tests
Other functions: ~10-15 tests
Total estimate: ~45-50 test cases

## Existing Test Coverage Summary

### What IS Tested (indirectly via game-movement tests)

- `countEscapeRoutes`: interior (6), edge (<6), vertex (3) -- 3 tests
- `calculateCandidateScore`: vertex escapeRoutes=3, no-obstacles default=6, edge with obstacles, center with obstacles -- 4 tests
- `compareAwayMode`: composite tiebreaker with distance tiebreak when composites are equal -- 1 test
- Integration through `computeMoveDestination` in towards/away modes -- many tests but do not isolate scoring functions

### What is NOT Tested (32 NoCoverage mutants per requirements)

- `compareTowardsMode`: ALL 5 tiebreaker levels (zero direct tests)
- `compareAwayMode`: levels 3-6 (absDq, absDr, r, q) -- only composite and distance level tested
- `selectBestCandidate`: no direct tests at all
- `computePluralCandidateScore`: no direct tests (only indirect through `computePluralMoveDestination`)
- `buildObstacleSet`: no direct tests
- All "equal fallback" cases (return false when all fields match)
- `selectBestCandidate` obstacle-building path (away mode with `allCharacters` + `moverId`)

## Existing Patterns

- **Test file naming**: co-located `*.test.ts` files in same directory as source
- **Import style**: `import { describe, it, expect } from "vitest"`
- **Helper usage**: `createCharacter()` from `./game-test-helpers` for character creation
- **Direct CandidateScore construction**: the existing `compareAwayMode` test in `game-movement-escape-routes.test.ts` (lines 188-209) constructs `CandidateScore` objects as plain objects -- this is the established pattern for tiebreaker tests
- **No mocking**: engine tests use real functions, no mocks
- **positionKey format**: `"q,r"` (e.g., `"2,3"`) -- used when constructing obstacle sets manually in tests
- **Describe block structure**: top-level `describe` per function or feature, nested `it` blocks for individual cases

## Dependencies

- `hexDistance` from `./hex` -- used internally by `calculateCandidateScore` and `computePluralCandidateScore`
- `getHexNeighbors` from `./hex` -- used internally by `countEscapeRoutes` (filters by `HEX_RADIUS=5`)
- `positionKey` from `./pathfinding` -- used internally by `buildObstacleSet` and `countEscapeRoutes` (format `"q,r"`)
- `Character`, `Position` from `./types` -- type dependencies for `selectBestCandidate` and `computePluralCandidateScore`

## Applicable Lessons

- **Lesson 005** (Tests masking bugs by manually aligning state) -- Directly relevant. The requirements explicitly reference this: "construct test inputs that exercise the actual comparison cascades rather than manually building 'already correct' scores." For tiebreaker tests, this means constructing CandidateScore objects where all prior levels are genuinely equal and only the target level differs. Do NOT construct scores that coincidentally produce the right result because an earlier comparison already returned. Each test must force control flow through all prior levels to reach the target comparison.

## Constraints Discovered

1. **Max 400 lines per file** -- With ~45-50 test cases, efficient structure is needed. May need to use helper functions for building CandidateScore objects with specific field overrides to reduce boilerplate.
2. **Import directly from `./movement-scoring`** -- The new test file should import from the source module directly (not from `./game-movement` re-exports) since it is co-located.
3. **Hex coordinate validity** -- Positions used in `selectBestCandidate`, `calculateCandidateScore`, `countEscapeRoutes`, and `buildObstacleSet` tests must satisfy `max(|q|, |r|, |q+r|) <= 5`. Direct `CandidateScore` construction for `compareTowardsMode`/`compareAwayMode` tests is unconstrained.
4. **No source code changes** -- The task explicitly forbids modifying `movement-scoring.ts`.
5. **Obstacle set key format** -- Must use `"q,r"` format (matching `positionKey`) when constructing test obstacle sets as `Set<string>`.
6. **Level 5 in towards / level 6 in away (q comparison)** -- The q check only tests `<` before returning false. A mutation removing the `<` check would make the function always return false for that level. The test for "candidate wins on q" must ensure the candidate has a strictly smaller q than best, with all prior fields equal.

## Open Questions

1. **Should Stryker be run before writing tests to get exact surviving mutant locations?** The requirements doc says 45% score and identifies 32 NoCoverage mutants in tiebreaker branches. Running `npm run mutate -- --mutate src/engine/movement-scoring.ts` would confirm exact mutant IDs but takes several minutes. The planning phase may benefit from exact data, or the general analysis above may be sufficient.

2. **Test file line budget management** -- With ~45-50 individual test cases, the file could reach 400+ lines with individual `it()` blocks. Options: (a) use a base CandidateScore helper function to reduce boilerplate (~5-8 lines per test vs. 10-15), (b) split into multiple test files (e.g., `movement-scoring-towards.test.ts`, `movement-scoring-away.test.ts`), or (c) accept approaching the limit. The existing codebase uses split test files extensively (e.g., `game-movement-basic.test.ts`, `game-movement-escape-routes.test.ts`).

3. **Overlap with existing tests** -- The new test file will partially duplicate coverage already provided by `game-movement-escape-routes.test.ts` and `game-movement.test.ts`. This is acceptable since the goal is mutation score improvement for `movement-scoring.ts` specifically, and the new tests exercise different code paths (tiebreaker cascades).
