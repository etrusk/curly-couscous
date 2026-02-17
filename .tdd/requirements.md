# TDD Spec: Mutation Score Improvement — movement-scoring.ts (Session 1/5)

Created: 2026-02-16

## Goal

Improve the mutation score of `src/engine/movement-scoring.ts` from 45% to 80%+ by adding targeted unit tests for surviving and uncovered mutants. This is the first of 5 sessions targeting engine files with low mutation scores. The file contains tiebreaker comparison logic for movement candidate selection — the multi-level cascades in `compareTowardsMode` and `compareAwayMode` are almost entirely untested, with 32 NoCoverage mutants in tiebreaker branches.

## Acceptance Criteria

- [x] `compareTowardsMode` has tests exercising all 5 tiebreaker levels: distance, absDq, absDr, r, q — each level must be tested with (a) candidate wins, (b) candidate loses, and (c) tie falls through to next level
- [x] `compareAwayMode` has tests exercising all 6 tiebreaker levels: composite (distance\*escapeRoutes), distance, absDq, absDr, r, q — same 3 cases per level
- [x] `compareTowardsMode` returns false when all fields are equal (final fallback)
- [x] `compareAwayMode` returns false when all fields are equal (final fallback)
- [x] `selectBestCandidate` tested in both "towards" and "away" modes with candidates that require tiebreaker resolution beyond the primary distance check
- [x] `computePluralCandidateScore` tested for both "towards" mode (average distance) and "away" mode (min distance) with multiple targets
- [x] `countEscapeRoutes` tested with varying obstacle configurations (0 obstacles, some obstacles, fully surrounded)
- [x] `buildObstacleSet` tested with exclude IDs (verifies exclusion works)
- [x] `calculateCandidateScore` tested with and without obstacle set (default escapeRoutes=6 when no obstacles)
- [x] `npm run mutate -- --mutate src/engine/movement-scoring.ts` reports >= 80% mutation score
- [x] All existing tests continue to pass
- [x] No changes to production source code

## Approach

Write direct unit tests for all exported functions in `movement-scoring.ts`. The key insight from the mutation report is that `compareTowardsMode` and `compareAwayMode` are tested only at the primary level (distance) — all secondary/tertiary/quaternary tiebreakers show NoCoverage. Tests should use `CandidateScore` objects directly to exercise each comparison level in isolation, then integration-style tests through `selectBestCandidate` to verify the cascade works end-to-end.

## Scope Boundaries

- **In scope**: New test file `src/engine/movement-scoring.test.ts` (or additions to existing tests if they exist)
- **Out of scope**: Changes to `movement-scoring.ts` source code, other engine files, UI components, store files. The other 4 engine files (game-actions, charge, movement, game-decisions) are separate sessions.

## Multi-Session Tracking

This is session 1 of 5. Update `.docs/current-task.md` after completion with progress:

| #   | File                | Before | Target | After  | Status   |
| --- | ------------------- | ------ | ------ | ------ | -------- |
| 1   | movement-scoring.ts | 45%    | 80%    | 89.84% | COMPLETE |
| 2   | game-actions.ts     | 63%    | 80%    | --     | Pending  |
| 3   | charge.ts           | 70%    | 80%    | --     | Pending  |
| 4   | movement.ts         | 71%    | 80%    | --     | Pending  |
| 5   | game-decisions.ts   | 77%    | 80%    | --     | Pending  |

## Assumptions

- Stryker per-file run (`npm run mutate -- --mutate src/engine/movement-scoring.ts`) works for targeted validation
- The 80% threshold is achievable purely through test additions — no source refactoring needed
- NoCoverage mutants in tiebreaker functions indicate these code paths are genuinely untested (not just Stryker instrumentation artifacts)

## Constraints

- Lesson 005 applies: construct test inputs that exercise the actual comparison cascades rather than manually building "already correct" scores
- Tests must exercise each tiebreaker level in isolation (equal on all prior levels, differ on target level)
- Follow existing test patterns in `src/engine/` (co-located test files, vitest, describe/it blocks)
- Max 400 lines per file
