# Test Designs: slotPosition 1-based Fix

## Overview

These tests verify that slotPosition is correctly assigned as 1-based (first character = 1, mapping to letter "A") and that the letterMapping utility is used consistently throughout the codebase.

## Review Status

**Reviewed**: 2026-01-27
**Reviewer**: Architect (TEST_DESIGN_REVIEW phase)
**Status**: APPROVED with corrections applied

### Corrections Made

1. Fixed RuleEvaluations test file path from `RuleEvaluations.test.tsx` to `rule-evaluations-basic.test.tsx`
2. Removed ambiguous "(or new file)" from integration test file path
3. Added explicit test helper file update to fixtures section
4. Clarified setup for RuleEvaluations tests with slotPosition > 26

---

### Test: first-character-gets-slotPosition-1

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts`
- **Type**: unit
- **Verifies**: First character added via addCharacter gets slotPosition 1, not 0
- **Setup**: 
  - Call `initBattle([])` to start with empty battle
  - Call `addCharacter("friendly")`
- **Assertions**:
  1. `characters[0].slotPosition` equals 1
- **Justification**: This is the exact bug scenario - adding first character caused slotPosition=0 which threw error in letterMapping. Test ensures the root cause is fixed.

---

### Test: initBattle-assigns-1-based-slotPositions

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts`
- **Type**: unit
- **Verifies**: Characters passed to initBattle receive 1-based slotPositions
- **Setup**:
  - Create array of 3 characters using `createCharacter` helper (friendly at (0,0), enemy at (5,5), friendly at (10,10))
  - Call `initBattle(characters)`
- **Assertions**:
  1. First character has `slotPosition` equal to 1
  2. Second character has `slotPosition` equal to 2
  3. Third character has `slotPosition` equal to 3
- **Justification**: initBattle was assigning 0-based positions using array index. This test ensures the fix (index + 1) is applied.

---

### Test: addCharacterAtPosition-assigns-1-based-slotPosition

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts`
- **Type**: unit
- **Verifies**: Characters added via addCharacterAtPosition receive 1-based slotPositions
- **Setup**:
  - Call `initBattle([])` to start with empty battle
  - Call `addCharacterAtPosition("friendly", { x: 0, y: 0 })`
  - Call `addCharacterAtPosition("enemy", { x: 5, y: 5 })`
  - Call `addCharacterAtPosition("friendly", { x: 10, y: 10 })`
- **Assertions**:
  1. First character has `slotPosition` equal to 1
  2. Second character has `slotPosition` equal to 2
  3. Third character has `slotPosition` equal to 3
- **Justification**: addCharacterAtPosition used same 0-based logic. This test ensures consistency with addCharacter fix.

---

### Test: slotPosition-to-letter-integration-no-throw

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-integration.test.ts`
- **Type**: integration
- **Verifies**: Adding a character and calling slotPositionToLetter does not throw
- **Setup**:
  - Import `slotPositionToLetter` from `../../utils/letterMapping`
  - Call `initBattle([])` to start with empty battle
  - Call `addCharacter("friendly")`
  - Get the character from state: `useGameStore.getState().gameState.characters[0]`
  - Call `slotPositionToLetter(character.slotPosition)`
- **Assertions**:
  1. No error is thrown
  2. Result equals "A"
- **Justification**: This is the exact failure scenario from the bug report. Token.tsx calls slotPositionToLetter with the character's slotPosition. This integration test ensures the full flow works.

---

### Test: sequential-slotPositions-map-to-sequential-letters

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-integration.test.ts`
- **Type**: integration
- **Verifies**: Multiple characters receive sequential 1-based positions that map to A, B, C
- **Setup**:
  - Import `slotPositionToLetter` from `../../utils/letterMapping`
  - Call `initBattle([])` to start with empty battle
  - Call `addCharacter("friendly")` three times
  - Get all characters from state
- **Assertions**:
  1. `slotPositionToLetter(characters[0].slotPosition)` equals "A"
  2. `slotPositionToLetter(characters[1].slotPosition)` equals "B"
  3. `slotPositionToLetter(characters[2].slotPosition)` equals "C"
- **Justification**: Ensures the letter sequence is correct for typical battle setup with multiple characters.

---

### Test: RuleEvaluations-displays-correct-letter

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-basic.test.tsx`
- **Type**: component
- **Verifies**: RuleEvaluations displays the correct letter for each character using the letterMapping utility
- **Setup**:
  - Import `createCharacter` from test helpers
  - Create a character with default slotPosition (will be 1 after fixture update)
  - Initialize battle with the character via `actions.initBattle([character])`
  - Select the character via `actions.selectCharacter(character.id)`
  - Render RuleEvaluations component
- **Assertions**:
  1. Character header or section displays letter "A" (search for text content or aria-label containing "A")
- **Justification**: RuleEvaluations had its own inline letter calculation that assumed 0-based. This test ensures it now uses the shared letterMapping utility and displays consistent letters.

---

### Test: RuleEvaluations-handles-positions-beyond-26

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-basic.test.tsx`
- **Type**: component
- **Verifies**: RuleEvaluations correctly displays multi-letter sequences (AA, AB, etc.) for positions > 26
- **Setup**:
  - Import `createCharacter` from test helpers
  - Create a character with explicit `slotPosition: 27` override
  - Initialize battle with this character (note: initBattle will reassign slotPosition, so use setState directly)
  - Alternative approach: Use `useGameStore.setState()` to directly set character with slotPosition 27
  - Select the character and render RuleEvaluations
- **Assertions**:
  1. Character section displays letter "AA"
- **Justification**: The old inline calculation used `% 26` which would incorrectly wrap position 27 to "A". The letterMapping utility correctly produces "AA". This test ensures RuleEvaluations benefits from the utility.

**Implementation Note**: Since `initBattle` reassigns slotPosition based on array index, this test must either:
- Use `useGameStore.setState()` to bypass initBattle and directly set the character with slotPosition 27
- Or mock the store state appropriately

---

## Existing Test Updates

The following existing tests need their assertions updated from 0-based to 1-based:

### gameStore-characters.test.ts: "should assign sequential slotPosition based on add order"

**Location**: `/home/bob/Projects/auto-battler/src/stores/gameStore-characters.test.ts` lines 137-139

**Current assertions**:
```typescript
expect(characters[0]?.slotPosition).toBe(0);
expect(characters[1]?.slotPosition).toBe(1);
expect(characters[2]?.slotPosition).toBe(2);
```

**Updated assertions**:
```typescript
expect(characters[0]?.slotPosition).toBe(1);
expect(characters[1]?.slotPosition).toBe(2);
expect(characters[2]?.slotPosition).toBe(3);
```

---

### gameStore-debug-ui.test.ts: "addCharacterAtPosition should assign correct slotPosition"

**Location**: `/home/bob/Projects/auto-battler/src/stores/gameStore-debug-ui.test.ts` lines 156-158

**Current assertions**:
```typescript
expect(characters[0]?.slotPosition).toBe(0);
expect(characters[1]?.slotPosition).toBe(1);
expect(characters[2]?.slotPosition).toBe(2);
```

**Updated assertions**:
```typescript
expect(characters[0]?.slotPosition).toBe(1);
expect(characters[1]?.slotPosition).toBe(2);
expect(characters[2]?.slotPosition).toBe(3);
```

---

## Test Fixture Updates

All test files using `slotPosition: 0` for first character should be updated to `slotPosition: 1`. 

### Priority Files to Update

1. **Test Helper Files** (update defaults first):
   - `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts`
     - Line 47: Change `slotPosition: 0` to `slotPosition: 1`
   - `/home/bob/Projects/auto-battler/src/stores/gameStore-test-helpers.ts`
     - If exists, update `createCharacter` default

2. **Store Tests**:
   - `src/stores/gameStore-integration.test.ts`
   - `src/stores/gameStore-reset.test.ts`

3. **Component Tests**:
   - `src/components/PlayControls/PlayControls.test.tsx`
   - `src/components/BattleViewer/DamageOverlay.test.tsx`
   - `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
   - `src/components/BattleStatus/BattleStatusBadge.test.tsx`

4. **Engine Tests**:
   - All files in `src/engine/*.test.ts`

### Update Pattern

- First character: `slotPosition: 1`
- Second character: `slotPosition: 2`
- And so on...

### Grep Command for Verification

```bash
grep -rn "slotPosition: 0" src/
```

Run this after implementation to verify all instances are updated.
