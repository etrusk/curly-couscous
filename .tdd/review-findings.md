# Review Findings: Mutation Score Improvement -- movement-scoring.ts

**Reviewer**: tdd-reviewer | **Date**: 2026-02-17 | **Verdict**: APPROVED

## Summary

58 tests in `src/engine/movement-scoring.test.ts` (345 lines). Mutation score improved from 45% to 89.84% (target 80%). No production code changed. All 12 acceptance criteria satisfied. All quality gates pass.

## Acceptance Criteria Verification

All 12 AC items verified as satisfied:

- [x] AC1: compareTowardsMode -- 5 levels x 3 cases (wins/loses/tie) = 15 tests + 1 fallback
- [x] AC2: compareAwayMode -- 6 levels x 3 cases = 18 tests + 1 arithmetic + 1 fallback
- [x] AC3-4: Both comparators return false on all-equal input
- [x] AC5: selectBestCandidate tested in both modes with tiebreaker resolution
- [x] AC6: computePluralCandidateScore average (towards) and min (away)
- [x] AC7: countEscapeRoutes with 0, 2, 6 obstacles + edge position
- [x] AC8: buildObstacleSet with single and multiple exclude IDs
- [x] AC9: calculateCandidateScore with and without obstacle set
- [x] AC10: Mutation score 89.84% >= 80%
- [x] AC11: All 1590 tests pass
- [x] AC12: No production source changes (git diff clean)

## Lesson 005 Compliance

The `score()` helper defaults (`distance:3, absDq:1, absDr:1, q:0, r:0, escapeRoutes:6`) ensure all prior tiebreaker levels are genuinely tied at each test. Each test overrides only the target level's field(s). Verified that no test accidentally resolves at a prior level due to default inequality. The non-zero defaults (distance:3 instead of 0) also strengthen arithmetic mutation detection in away-mode composite calculations.

## Duplication Check

The existing `game-movement-escape-routes.test.ts` tests `compareAwayMode` and `calculateCandidateScore` at the integration level via `computeMoveDestination`. The new tests exercise these functions directly at the unit level with isolated tiebreaker cascades. Overlap is minimal and intentional -- different test goals (integration vs unit/mutation coverage).

## Issues Found

### CRITICAL: None

### IMPORTANT: None

### MINOR

1. **towards-L5-tie-is-fallback naming** (line 75): Name suggests a "tie" test but actually tests same q-values returning false (which IS the fallback). The name is slightly misleading vs the adjacent "all-equal-fallback" test which does the same thing with default values. Both tests are valid and kill different mutants (one with q:5 vs q:5, one with all defaults), so no functional issue.

## Quality Gates

- Tests: 58/58 PASS
- TypeScript: Clean (pre-existing TS6133 in unrelated file)
- ESLint: Clean on movement-scoring.test.ts
- File size: 345 lines < 400 limit
- Mutation score: 89.84% (167 killed, 19 survived, 0 NoCoverage)

## Pattern Compliance

- Co-located test file following `*.test.ts` convention
- Vitest `describe/it/expect` structure
- `createCharacter` helper from `game-test-helpers`
- `score()` factory helper pattern consistent with codebase style
