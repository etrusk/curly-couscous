# TDD Session

## Task

Add plural target scopes (`enemies` / `allies`) — enable spatial reasoning against groups for movement behaviors.

## Confirmed Scope

Extend `Target` type with `"enemies"` and `"allies"`. Add `isPluralTarget()` guard and `PLURAL_TARGETS` constant. Add `computePluralMoveDestination()` in game-movement.ts. Branch decision logic for plural targets in game-decisions.ts. Guard `evaluateTargetCriterion` for plural targets. Files: types.ts, game-movement.ts, game-decisions.ts, game-actions.ts, selectors.ts, plus tests.

## Acceptance Criteria

- [ ] `Target` type includes `"enemies"` and `"allies"` alongside existing values
- [ ] `isPluralTarget()` type guard and `PLURAL_TARGETS` constant exported from `types.ts`
- [ ] `evaluateTargetCriterion` returns `null` for plural targets (guard at top)
- [ ] `computePluralMoveDestination()` correctly computes away destination: maximizes `min(distances to all targets) * escapeRoutes` with standard tiebreak hierarchy
- [ ] `computePluralMoveDestination()` correctly computes towards destination: minimizes average distance to all targets (centroid approximation) with standard tiebreak hierarchy
- [ ] Multi-step plural movement (Dash, distance > 1) iterates single steps using the plural function
- [ ] Decision logic builds correct group for plural targets: `enemies` = all living enemies, `allies` = all living allies excluding self
- [ ] Decision logic rejects plural target + non-movement actionType (rejected, not crash)
- [ ] Decision logic rejects plural target when group is empty as `no_target`
- [ ] Plural target + criterion set: criterion is silently ignored (no error)
- [ ] Plural target with single group member produces identical behavior to singular target
- [ ] Plural target with empty group: `computePluralMoveDestination` returns current position
- [ ] Filters are skipped for plural targets (no candidate pool to narrow)

## Current Phase

COMMIT

## Phase History

- 2026-02-11 INIT → EXPLORE
- 2026-02-11 EXPLORE → PLAN [6 exchanges, ~28K tokens]
- 2026-02-11 PLAN → DESIGN_TESTS [6 exchanges, ~38K tokens]
- 2026-02-11 DESIGN_TESTS → TEST_DESIGN_REVIEW [7 exchanges, ~35K tokens]
- 2026-02-11 TEST_DESIGN_REVIEW → WRITE_TESTS [5 exchanges, ~20K tokens]
- 2026-02-11 WRITE_TESTS → IMPLEMENT [12 exchanges, ~50K tokens]
- 2026-02-11 IMPLEMENT → REVIEW [10 exchanges, ~55K tokens]
- 2026-02-11 REVIEW → SYNC_DOCS [5 exchanges, ~28K tokens] (PASS, 0 critical)
- 2026-02-11 SYNC_DOCS → COMMIT [3 exchanges, ~15K tokens]

## Context Metrics

Orchestrator: ~55K/300K (18%)
Cumulative agent tokens: 269K
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent             | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                                         |
| --- | ----------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE            | 6         | ~28K   | 42    | 182s     | COMPLETE | Target type is simple union; scoring functions are single-target by design; filter/criterion bypass pattern exists for 'self' |
| 2   | tdd-planner       | PLAN               | 6         | ~38K   | 22    | 179s     | COMPLETE | Extraction to movement-scoring.ts needed for 400-line budget; towards mode uses candidate scoring not A\*                     |
| 3   | tdd-test-designer | DESIGN_TESTS       | 7         | ~35K   | 32    | 240s     | COMPLETE | 2 [VERIFY] markers for towards-mode details; AC-6 multi-step covered indirectly                                               |
| 4   | tdd-test-reviewer | TEST_DESIGN_REVIEW | 5         | ~20K   | 16    | 300s     | COMPLETE | Fixed test 4 (broken assertion), fixed test 5 (removed fragile towards parity), added tests 7+13 for AC-6 and allies coverage |
| 5   | tdd-coder         | WRITE_TESTS        | 12        | ~50K   | 53    | 400s     | COMPLETE | 6/13 tests pass incidentally against stubs; extracted plural tests to separate file for 400-line limit                        |
| 6   | tdd-coder         | IMPLEMENT          | 10        | ~55K   | 30    | ~180s    | COMPLETE | All 13 new tests pass; extracted scoring to movement-scoring.ts; all quality gates pass                                       |
| 7   | tdd-reviewer      | REVIEW             | 5         | ~28K   | 27    | 131s     | COMPLETE | PASS: 0 critical, 0 important, 3 minor; all 13 ACs verified                                                                   |
| 8   | tdd-doc-syncer    | SYNC_DOCS          | 3         | ~15K   | 20    | 134s     | COMPLETE | Updated spec.md, architecture.md, current-task.md, patterns, created ADR-024                                                  |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- Clean run

#### #2 tdd-planner (PLAN)

- game-movement.ts at 362/400 lines requires extraction to movement-scoring.ts to stay under budget

#### #3 tdd-test-designer (DESIGN_TESTS)

- Towards-mode plural uses candidate scoring (not A\*), may diverge from singular for single-target parity test — flagged with [VERIFY]
- generateValidCandidates towards-mode excludes stay-in-place by default — test 4 uses <= rather than ==

#### #4 tdd-test-reviewer (TEST_DESIGN_REVIEW)

- Fixed test 4: original adjacent-ally setup made assertion impossible (all candidates worsen avg distance when stay excluded); redesigned with symmetric allies at distance 2
- Fixed test 5: removed towards-mode parity assertion (A\* vs candidate scoring are different algorithms)
- Added test 7: dedicated multi-step plural movement test for AC-6
- Added test 13: allies target integration test for buildTargetGroup allies branch
- Resolved both [VERIFY] markers with clear rationale

#### #5 tdd-coder (WRITE_TESTS)

- Extracted plural movement tests to separate file (game-movement-plural.test.ts) due to 400-line limit on game-movement.test.ts
- 6 of 13 new tests pass incidentally against stubs (fallthrough behavior in evaluateTargetCriterion and stub returning mover position)

#### #6 tdd-coder (IMPLEMENT)

- Extracted scoring functions (CandidateScore, calculateCandidateScore, compareAwayMode, compareTowardsMode, selectBestCandidate, countEscapeRoutes, buildObstacleSet) to movement-scoring.ts (274 lines)
- Added computePluralCandidateScore to movement-scoring.ts for aggregate distance scoring
- Implemented computePluralMoveDestination and computeMultiStepPluralDestination in game-movement.ts (268 lines, down from 389 with stubs)
- Added isPluralTarget guards in selectors.ts evaluateTargetCriterion and hasCandidates
- Added buildTargetGroup helper and plural branches in game-decisions.ts tryExecuteSkill and evaluateSingleSkill
- Added createPluralMoveAction in game-actions.ts
- Fixed unused import (hexDistance in game-movement.ts) caught by type-check
- All quality gates pass: 1495 tests green, TypeScript clean, ESLint clean

#### #7 tdd-reviewer (REVIEW)

- Clean run

#### #8 tdd-doc-syncer (SYNC_DOCS)

- Clean run

## Files Touched

- `.tdd/test-designs.md` (created — 11 test designs, reviewed and expanded to 13 tests across 3 files)
- `.tdd/session.md` (updated)
- `src/engine/types.ts` (modified — added "enemies"/"allies" to Target, isPluralTarget, PLURAL_TARGETS)
- `src/engine/game-movement.ts` (modified — refactored: extracted scoring to movement-scoring.ts, implemented computePluralMoveDestination, computeMultiStepPluralDestination)
- `src/engine/movement-scoring.ts` (created — extracted scoring functions from game-movement.ts, added computePluralCandidateScore)
- `src/engine/game-decisions.ts` (modified — added plural target branches in tryExecuteSkill and evaluateSingleSkill, added buildTargetGroup helper)
- `src/engine/game-actions.ts` (modified — added createPluralMoveAction function)
- `src/engine/selectors.ts` (modified — added isPluralTarget guards in evaluateTargetCriterion and hasCandidates)
- `src/engine/game-movement-plural.test.ts` (created — 7 tests for plural movement)
- `src/engine/selectors-target-criterion.test.ts` (modified — added 2 tests for plural target null guard)
- `src/engine/game-decisions-move-destination-basic.test.ts` (modified — added 4 integration tests for plural target pipeline)

## Browser Verification

Status: N/A

## Human Approval

Status: N/A (non-UI task)

## Blockers

(none)

## Review Cycles

Count: 1

### Review #1 (tdd-reviewer)

- Verdict: PASS
- Critical: 0
- Important: 0
- Minor: 3 (non-blocking)
- All 13 ACs verified
- All quality gates pass (1495 tests, TypeScript clean, ESLint clean)
- See `.tdd/review-findings.md` for details
