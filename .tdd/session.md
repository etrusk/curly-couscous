# TDD Session

## Task

Fix bug: "slotPosition must be positive, got 0" error when clicking "Add Friendly" button.

**Error Details**:
```
Uncaught Error: slotPosition must be positive, got 0
    at slotPositionToLetter (letterMapping.ts:16:11)
    at Token.tsx:79:11
```

## Current Phase

COMMIT

## Phase History

- 2026-01-27 17:30 INIT: Started task "Fix slotPosition validation error when adding friendly character"
- 2026-01-27 17:45 EXPLORE: Completed exploration of bug root cause
  - Identified 0-based vs 1-based indexing mismatch
  - Documented in `.tdd/exploration.md`
  - Recommended fix: Change gameStore to use 1-based slotPosition
- 2026-01-27 18:00 PLAN: Created implementation plan and test designs
  - Documented plan in `.tdd/plan.md`
  - Designed 7 new tests in `.tdd/test-designs.md`
  - Identified 2 existing tests needing assertion updates
  - Identified ~21 test fixture files needing slotPosition updates
- 2026-01-27 18:15 TEST_DESIGN_REVIEW: Reviewed and approved test designs
  - Verified coverage of bug scenario and fix
  - Verified edge cases (first character, multiple characters, position > 26)
  - Corrected file paths for RuleEvaluations tests
  - Added explicit test helper file updates
  - Clarified setup for slotPosition > 26 test
  - All tests align with spec.md requirements
- 2026-01-27 18:30 WRITE_TESTS: Implemented all test specifications (RED phase)
  - Created `/home/bob/Projects/auto-battler/src/stores/gameStore-slotPosition.test.ts` with 3 new tests
  - Added 2 integration tests to `/home/bob/Projects/auto-battler/src/stores/gameStore-integration.test.ts`
  - Added 2 component tests to `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-basic.test.tsx`
  - Updated assertions in `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts` (lines 137-139)
  - Updated assertions in `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts` (lines 156-158)
  - Fixed test helper `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` (line 47)
  - Test run result: 9 failed, 678 passed (687 total)
  - Failing tests (expected, RED phase):
    * 3 new slotPosition tests (expecting 1-based, getting 0-based)
    * 2 integration tests (slotPositionToLetter throws on position 0)
    * 2 RuleEvaluations tests (letter display not matching expected)
    * 2 updated assertion tests (expecting 1-based, code still 0-based)
- 2026-01-27 18:45 IMPLEMENT: Fixed slotPosition implementation to use 1-based indexing (GREEN phase)
  - **gameStore.ts fixes** (3 locations):
    * Line 102: Changed `slotPosition: index` to `slotPosition: index + 1` in initBattle
    * Line 257: Changed `const slotPosition = state.gameState.characters.length` to `length + 1` in addCharacter
    * Line 343: Changed `const slotPosition = state.gameState.characters.length` to `length + 1` in addCharacterAtPosition
    * Also updated character name calculation to use `slotPosition` directly instead of `slotPosition + 1`
  - **RuleEvaluations.tsx refactor**:
    * Added import for `slotPositionToLetter` utility
    * Replaced inline letter calculation with utility function call
    * Removed unused LETTER_A_CHAR_CODE and LETTER_COUNT constants
  - **Test fixture updates** (142 occurrences across all test files):
    * Updated all `slotPosition: 0` to `slotPosition: 1`
    * Updated all `slotPosition: 1` to `slotPosition: 2`
    * Updated all `slotPosition: 2` to `slotPosition: 3`
    * And so on for higher values
    * Used systematic sed replacements with temporary markers to avoid double-replacing
  - **Moved integration tests**:
    * Moved 2 integration tests from gameStore-integration.test.ts to gameStore-slotPosition.test.ts
    * Reason: gameStore-integration.test.ts exceeded 400 line limit (521 lines)
    * After move: gameStore-integration.test.ts now under limit, slotPosition tests consolidated
  - **Test results**: All 687 tests passing (GREEN)
  - **Quality gates**: All passed
    * `npm run test`: 687 passed
    * `npm run type-check`: No errors
    * `npm run lint`: No errors
- 2026-01-27 19:00 REVIEW: Completed code review
  - **Verdict**: APPROVED
  - **Critical issues**: 0
  - **Important issues**: 0
  - **Minor issues**: 2 (cosmetic only)
  - **Spec compliance**: Pass (lines 151-152)
  - **Pattern compliance**: Pass (removed duplication, uses shared utility)
  - Findings documented in `.tdd/review-findings.md`

## Key Decisions

1. **slotPosition should be 1-based**: Per spec.md ("First character: A"), slotPosition should start at 1, not 0. The letterMapping utility is correct; the gameStore implementation is wrong.

2. **Use letterMapping utility everywhere**: RuleEvaluations.tsx should use the same `slotPositionToLetter` function as Token.tsx for consistency.

3. **Fix in gameStore, not letterMapping**: The spec clearly indicates 1-based ("First character: A"), so the fix belongs in gameStore, not in changing letterMapping to accept 0-based input.

## Documentation Used

- `.docs/spec.md` - Lines 151-152 define "First character: A" (implies 1-based)
- `.docs/architecture.md` - Reviewed project structure
- `.docs/patterns/index.md` - Reviewed existing patterns
- `.docs/decisions/index.md` - No conflicts with existing decisions

## Files Analyzed

- `/home/bob/Projects/auto-battler/src/utils/letterMapping.ts` - Validation logic expecting 1-based
- `/home/bob/Projects/auto-battler/src/utils/letterMapping.test.ts` - Tests confirm 1-based expectation
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - Uses slotPositionToLetter
- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` - Bug location (lines 102, 257, 343)
- `/home/bob/Projects/auto-battler/src/components/CharacterControls/CharacterControls.tsx` - Button handler
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` - Secondary inconsistency (lines 19-21, 311-314)
- `/home/bob/Projects/auto-battler/src/engine/types.ts` - Character type definition
- `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts` - Test needing update (lines 137-139)
- `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts` - Test needing update (lines 156-158)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` - Test helper needing update (line 47)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-basic.test.tsx` - Correct location for RuleEvaluations tests

## Files to Modify (Implementation)

1. `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` - Lines 102, 257, 343
2. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` - Lines 1, 19-21, 311-314
3. `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts` - Lines 137-139
4. `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts` - Lines 156-158
5. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` - Line 47
6. ~21 test fixture files with `slotPosition: 0`

## Blockers

[None]

## Review Cycles

Count: 1

## Test Design Review Summary

- **Coverage**: Complete - all bug scenarios and edge cases covered
- **Quality**: Good - clear descriptions, specific assertions, sound justifications
- **Corrections Made**:
  1. Fixed RuleEvaluations test file path
  2. Removed ambiguous file path notation
  3. Added explicit test helper file updates
  4. Clarified setup for position > 26 test

## Documentation Recommendations

- Add to `.docs/decisions/index.md`: "slotPosition is 1-based to match natural letter mapping (position 1 = A)"
