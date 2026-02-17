# TDD Session

## Task

Mutation Score Improvement — movement-scoring.ts (Session 1/5)

## Confirmed Scope

Improve mutation score of `src/engine/movement-scoring.ts` from 45% to 80%+ by adding targeted unit tests. Write tests exercising all tiebreaker levels in `compareTowardsMode` and `compareAwayMode`, plus tests for `selectBestCandidate`, `computePluralCandidateScore`, `countEscapeRoutes`, `buildObstacleSet`, and `calculateCandidateScore`. No changes to production source code.

## Acceptance Criteria

- [ ] `compareTowardsMode` has tests exercising all 5 tiebreaker levels: distance, absDq, absDr, r, q — each level must be tested with (a) candidate wins, (b) candidate loses, and (c) tie falls through to next level
- [ ] `compareAwayMode` has tests exercising all 6 tiebreaker levels: composite (distance\*escapeRoutes), distance, absDq, absDr, r, q — same 3 cases per level
- [ ] `compareTowardsMode` returns false when all fields are equal (final fallback)
- [ ] `compareAwayMode` returns false when all fields are equal (final fallback)
- [ ] `selectBestCandidate` tested in both "towards" and "away" modes with candidates that require tiebreaker resolution beyond the primary distance check
- [ ] `computePluralCandidateScore` tested for both "towards" mode (average distance) and "away" mode (min distance) with multiple targets
- [ ] `countEscapeRoutes` tested with varying obstacle configurations (0 obstacles, some obstacles, fully surrounded)
- [ ] `buildObstacleSet` tested with exclude IDs (verifies exclusion works)
- [ ] `calculateCandidateScore` tested with and without obstacle set (default escapeRoutes=6 when no obstacles)
- [ ] `npm run mutate -- --mutate src/engine/movement-scoring.ts` reports >= 80% mutation score
- [ ] All existing tests continue to pass
- [ ] No changes to production source code

## Current Phase

COMMIT

## Phase History

- 2026-02-17T00:00 INIT → EXPLORE
- 2026-02-17 EXPLORE → PLAN [7 exchanges, ~28K tokens]
- 2026-02-17 PLAN → DESIGN_TESTS [5 exchanges, ~35K tokens]
- 2026-02-17 DESIGN_TESTS → TEST_DESIGN_REVIEW [6 exchanges, ~38K tokens]
- 2026-02-17 TEST_DESIGN_REVIEW → WRITE_TESTS [4 exchanges, ~18K tokens]
- 2026-02-17 WRITE_TESTS → IMPLEMENT [6 exchanges, ~35K tokens]
- 2026-02-17 IMPLEMENT → REVIEW [7 exchanges, ~45K tokens]
- 2026-02-17 REVIEW → SYNC_DOCS [5 exchanges, ~25K tokens] (APPROVED, 0 critical)
- 2026-02-17 SYNC_DOCS → COMMIT [4 exchanges, ~12K tokens]

## Context Metrics

Orchestrator: ~45K/300K (15%)
Cumulative agent tokens: 236K
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent             | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                   |
| --- | ----------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ------------------------------------------------------------------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE            | 7         | ~28K   | 34    | ~204s    | COMPLETE | 32 NoCoverage mutants in tiebreaker cascades; no existing test file; Lesson 005 applicable              |
| 2   | tdd-planner       | PLAN               | 5         | ~35K   | 12    | ~120s    | COMPLETE | 57 tests planned across 7 describe blocks; score() helper for line budget; split strategy if >380 lines |
| 3   | tdd-test-designer | DESIGN_TESTS       | 6         | ~38K   | 14    | ~3514s   | COMPLETE | Added away-L1-arithmetic test; corrected countEscapeRoutes obstacle count; full AC cross-reference      |
| 4   | tdd-test-reviewer | TEST_DESIGN_REVIEW | 4         | ~18K   | 14    | --       | COMPLETE | Added nearest-target-not-first-index test; verified all 58 test values against source; approved         |
| 5   | tdd-coder         | WRITE_TESTS        | 6         | ~35K   | 16    | ~182s    | COMPLETE | 58/58 tests passing; 345 lines; pre-existing TS error in devtools test                                  |
| 6   | tdd-coder         | IMPLEMENT          | 7         | ~45K   | 14    | ~235s    | COMPLETE | Mutation score 89.84% (167 killed, 19 survived); all 1590 tests pass; all gates pass                    |
| 7   | tdd-reviewer      | REVIEW             | 5         | ~25K   | 16    | ~454s    | COMPLETE | APPROVED; 0 critical, 0 important, 1 minor; all 12 AC satisfied                                         |
| 8   | tdd-doc-syncer    | SYNC_DOCS          | 4         | ~12K   | 16    | ~119s    | COMPLETE | Updated current-task.md, requirements.md, workflow-timestamps.json                                      |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- No existing movement-scoring.test.ts file — new file required
- 32 NoCoverage mutants concentrated in compareTowardsMode (all 5 levels) and compareAwayMode (levels 3-6)
- Existing pattern for direct CandidateScore construction found in game-movement-escape-routes.test.ts
- Lesson 005 directly applicable — tiebreaker tests must force control through all prior levels
- q comparison level has asymmetric structure (no explicit > check before return false)

#### #2 tdd-planner (PLAN)

- 57 tests planned across 7 describe blocks (compareTowardsMode 16, compareAwayMode 19, buildObstacleSet 4, countEscapeRoutes 4, calculateCandidateScore 4, selectBestCandidate 5, computePluralCandidateScore 5)
- score() helper function to keep file within 400-line budget
- Mutation kill strategy maps each (a)/(b)/(c) test to specific Stryker mutant types
- Composite arithmetic mutation coverage via values where * differs from + (e.g., 5*4=20 vs 5+4=9)
- File split contingency: compareAwayMode to separate file if >380 lines

#### #3 tdd-test-designer (DESIGN_TESTS)

- 57 test cases fully specified with exact setup values, expected results, and mutation targets
- Verified all hex distance/neighbor calculations with manual computation
- Added away-L1-arithmetic test (not in plan) to specifically kill `* to +` mutant with values where multiplication and addition give different orderings (2*3=6 > 5*1=5 but 2+3=5 < 5+1=6)
- Corrected countEscapeRoutes some-obstacles test to use 2 obstacles (not 3) to distinguish from negation mutant
- Complete acceptance criteria cross-reference table validates all 12 criteria have covering tests
- Lesson 005 compliance verified: score() helper defaults tie all prior levels, each test overrides only target field(s)

#### #4 tdd-test-reviewer (TEST_DESIGN_REVIEW)

- Verified all 57 test setups against source code (comparison directions, hex distance calculations, neighbor validity, composite arithmetic)
- Found 1 gap: `nearest-target-for-dq-dr` has nearest target at index 0 (initial value of nearestIdx), so mutant removing `nearestIdx = i` assignment survives. Added `nearest-target-not-first-index` test with nearest at index 1.
- Confirmed score() helper defaults (distance:3, absDq:1, absDr:1, escapeRoutes:6) are superior to plan defaults (distance:0) for arithmetic mutation detection
- Confirmed Lesson 005 compliance across all tiebreaker tests
- Confirmed all selectBestCandidate obstacle-building paths are covered
- Confirmed edge-position test: (5,0) has exactly 3 valid neighbors within HEX_RADIUS=5
- Total tests: 58 (was 57)

#### #5 tdd-coder (WRITE_TESTS)

- All 58 tests pass against existing production code (mutation score improvement, not new feature TDD)
- File size 345 lines, well under 400-line limit
- Pre-existing TypeScript error in gameStore-devtools.test.ts (unused variable, unrelated)

#### #6 tdd-coder (IMPLEMENT - Quality Gates + Mutation Testing)

- All 1590 tests pass across 160 test files (including 58 new movement-scoring tests)
- Lint: Clean on movement-scoring.test.ts (stryker sandbox lint errors are artifacts, not source issues)
- Type-check: Only pre-existing error in gameStore-devtools.test.ts (TS6133 unused variable)
- Mutation score: **89.84%** (167 killed + 1 timeout, 19 survived, 0 NoCoverage) -- exceeds 80% target
- 19 surviving mutants: BlockStatement/ConditionalExpression on "loses" guards (equivalent mutants -- removing the early return still produces correct final result via cascade), LogicalOperator on mode check (line 200), and boundary/arithmetic in computePluralCandidateScore (lines 254-262)

## Files Touched

- `src/engine/movement-scoring.test.ts` (CREATED, 345 lines, 58 tests)

## Browser Verification

Status: N/A

## Human Approval

Status: N/A (non-UI task)

## Blockers

- None

## Review Cycles

Count: 1

### Review 1 — APPROVED

- Verdict: APPROVED (0 critical, 0 important, 1 minor)
- All 12 AC items satisfied
- Lesson 005 compliance verified
- No production code changes confirmed
- Duplication check: minimal overlap with game-movement-escape-routes.test.ts (integration vs unit level)
- Minor: towards-L5-tie-is-fallback naming slightly ambiguous but functionally correct
