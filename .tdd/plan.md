# Implementation Plan: Fix slotPosition 0-based to 1-based Bug

## Summary

Fix the bug where `slotPositionToLetter` throws "slotPosition must be positive, got 0" when adding a character. The root cause is a mismatch between the letterMapping utility (expects 1-based) and gameStore (assigns 0-based).

## Spec Alignment

- **spec.md:151-152**: "First character: A, second: B, third: C"
- This clearly indicates 1-based indexing (position 1 = A)
- The `letterMapping.ts` utility is correctly implemented per spec
- The bug is in `gameStore.ts` which uses 0-based indexing

## Changes Required

### 1. gameStore.ts - Fix slotPosition Assignment

**File**: `/home/bob/Projects/auto-battler/src/stores/gameStore.ts`

#### Change 1: initBattle action (line 102)

**Before**:
```typescript
slotPosition: index, // Assign slot position based on order
```

**After**:
```typescript
slotPosition: index + 1, // Assign 1-based slot position (first = 1)
```

#### Change 2: addCharacter action (line 257)

**Before**:
```typescript
const slotPosition = state.gameState.characters.length;
```

**After**:
```typescript
const slotPosition = state.gameState.characters.length + 1;
```

#### Change 3: addCharacterAtPosition action (line 343)

**Before**:
```typescript
const slotPosition = state.gameState.characters.length;
```

**After**:
```typescript
const slotPosition = state.gameState.characters.length + 1;
```

### 2. RuleEvaluations.tsx - Use letterMapping Utility

**File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`

#### Change: Replace inline letter calculation with utility function (lines 19-21 and 311-314)

**Before** (lines 19-21):
```typescript
// Constants for letter mapping
const LETTER_A_CHAR_CODE = 65; // ASCII code for 'A'
const LETTER_COUNT = 26; // Number of letters in alphabet
```

**After** (line ~1, add import):
```typescript
import { slotPositionToLetter } from "../../utils/letterMapping";
```

**Before** (lines 311-314):
```typescript
// Determine character letter (A, B, C, ...) based on slotPosition
const letter = String.fromCharCode(
  LETTER_A_CHAR_CODE + (character.slotPosition % LETTER_COUNT),
);
```

**After**:
```typescript
// Determine character letter (A, B, C, ...) based on slotPosition
const letter = slotPositionToLetter(character.slotPosition);
```

**Remove**: Delete the `LETTER_A_CHAR_CODE` and `LETTER_COUNT` constants (lines 19-21) as they are no longer needed.

### 3. Test File Updates

The following test files contain assertions expecting 0-based slotPosition that must be updated to 1-based:

#### gameStore-characters.test.ts (lines 137-139)

**Before**:
```typescript
expect(characters[0]?.slotPosition).toBe(0);
expect(characters[1]?.slotPosition).toBe(1);
expect(characters[2]?.slotPosition).toBe(2);
```

**After**:
```typescript
expect(characters[0]?.slotPosition).toBe(1);
expect(characters[1]?.slotPosition).toBe(2);
expect(characters[2]?.slotPosition).toBe(3);
```

#### gameStore-debug-ui.test.ts (lines 156-158)

**Before**:
```typescript
expect(characters[0]?.slotPosition).toBe(0);
expect(characters[1]?.slotPosition).toBe(1);
expect(characters[2]?.slotPosition).toBe(2);
```

**After**:
```typescript
expect(characters[0]?.slotPosition).toBe(1);
expect(characters[1]?.slotPosition).toBe(2);
expect(characters[2]?.slotPosition).toBe(3);
```

#### Test data fixtures using `slotPosition: 0`

Many test files use `slotPosition: 0` for the first character. These should be updated to `slotPosition: 1`. The following files contain such fixtures:

- `src/stores/gameStore-integration.test.ts`
- `src/stores/gameStore-reset.test.ts`
- `src/components/RuleEvaluations/rule-evaluations-test-helpers.ts`
- `src/components/PlayControls/PlayControls.test.tsx`
- `src/components/BattleViewer/DamageOverlay.test.tsx`
- `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- `src/components/BattleStatus/BattleStatusBadge.test.tsx`
- `src/engine/*.test.ts` (multiple engine test files)

**Strategy**: Update first character's slotPosition from 0 to 1, second from 1 to 2, etc.

## Implementation Order

1. **Write failing tests first** (TDD):
   - Add test for adding first character gets slotPosition 1
   - Add test for initBattle assigns 1-based positions
   - Add integration test that adding character does not throw letterMapping error

2. **Fix gameStore.ts**:
   - Update all three locations (initBattle, addCharacter, addCharacterAtPosition)
   - Run tests to verify fix

3. **Fix RuleEvaluations.tsx**:
   - Import `slotPositionToLetter` utility
   - Replace inline calculation with utility call
   - Remove unused constants

4. **Update existing test assertions**:
   - Update gameStore-characters.test.ts
   - Update gameStore-debug-ui.test.ts
   - Update test fixture files

5. **Run full test suite** to catch any missed 0-based assumptions

## Edge Cases to Consider

1. **Empty array passed to initBattle**: No characters, no slotPositions assigned - OK
2. **Single character**: Should get slotPosition = 1, letter = "A"
3. **Multiple characters added sequentially**: 1, 2, 3, 4, ... (letters A, B, C, D, ...)
4. **Characters removed then new ones added**: slotPosition should be `currentCount + 1`, not tracking gaps

## Risks and Mitigations

1. **Risk**: Test files with hardcoded `slotPosition: 0` may be missed
   - **Mitigation**: Grep for `slotPosition: 0` and review each occurrence

2. **Risk**: Some code may rely on 0-based arithmetic (e.g., array indexing)
   - **Mitigation**: slotPosition is for display (letter mapping), not array access. Review any usage of `slotPosition` for indexing.

3. **Risk**: RuleEvaluations.tsx change may break if character has slotPosition 0 from old data
   - **Mitigation**: This is a bug fix; old data with slotPosition 0 was already broken in Token.tsx

## Architecture Alignment

- **Consistent with spec.md**: "First character: A" implies 1-based
- **Consistent with letterMapping.ts design**: Utility expects 1-based input
- **Consistent with architecture.md**: Pure game engine logic, testable without React

## New Decision to Document

**Decision**: slotPosition is 1-based (first character = 1)

**Context**: Bug discovered where 0-based slotPosition caused letterMapping error

**Consequences**: 
- All test fixtures need updating
- Natural mapping: position 1 = letter A
- Consistent with spec language

Recommend adding to `.docs/decisions/index.md` after implementation.
