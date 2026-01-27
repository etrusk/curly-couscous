# Exploration: slotPosition Validation Error

## Summary

Clicking "Add Friendly" button causes error: `slotPosition must be positive, got 0`

## Root Cause

**The bug is a mismatch between 0-based and 1-based indexing conventions.**

The `letterMapping.ts` utility expects `slotPosition` to be **1-based** (first character = 1), but the `gameStore.ts` assigns `slotPosition` as **0-based** (first character = 0).

### Evidence

**letterMapping.ts:14-16** - Expects 1-based:
```typescript
export function slotPositionToLetter(slotPosition: number): string {
  if (slotPosition <= 0) {
    throw new Error(`slotPosition must be positive, got ${slotPosition}`);
  }
```

**gameStore.ts:257** - Assigns 0-based in `addCharacter`:
```typescript
// Determine slotPosition (next sequential number)
const slotPosition = state.gameState.characters.length;
```

When there are 0 characters, `state.gameState.characters.length` is 0, so the first character gets `slotPosition = 0`, which violates the letterMapping validation.

**gameStore.ts:343** - Same issue in `addCharacterAtPosition`:
```typescript
const slotPosition = state.gameState.characters.length;
```

**gameStore.ts:102** - Same issue in `initBattle`:
```typescript
slotPosition: index, // Assign slot position based on order
```
When called with an array, the first character gets `index = 0`.

## Flow Analysis

1. User clicks "Add Friendly" button
2. `CharacterControls.handleAddFriendly()` sets `selectionMode` to `"placing-friendly"`
3. User clicks on a grid cell
4. `BattleViewer` calls `actions.addCharacterAtPosition("friendly", position)`
5. `addCharacterAtPosition` sets `slotPosition = state.gameState.characters.length` = **0**
6. Character is added to state
7. `Cell.tsx:40` passes `slotPosition={character.slotPosition}` to Token
8. `Token.tsx:79` calls `slotPositionToLetter(slotPosition)` with slotPosition=0
9. **Error thrown**: `slotPosition must be positive, got 0`

## Documentation Review

**spec.md:151-152** states:
```
- Letters are assigned based on `slotPosition` (order added to battle)
- First character: A, second: B, third: C, etc.
```

This implies first character = A = position 1, which is **1-based**.

**spec.md:32-33** states:
```
- **Slot position:** Order added to battle (used for collision tiebreaking)
```

This is ambiguous about 0-based vs 1-based.

## Scope of Impact

The following locations use 0-based slotPosition (need fixing):

1. **gameStore.ts:102** - `initBattle` action
2. **gameStore.ts:257** - `addCharacter` action
3. **gameStore.ts:343** - `addCharacterAtPosition` action

The following locations also use 0-based slotPosition but work differently:

4. **RuleEvaluations.tsx:312-313** - Uses `slotPosition % 26` which works with 0-based (A=0), creating an inconsistency with Token.tsx

## Secondary Issue: RuleEvaluations Inconsistency

The `RuleEvaluations.tsx` component uses a different letter calculation method:
```typescript
const letter = String.fromCharCode(
  LETTER_A_CHAR_CODE + (character.slotPosition % LETTER_COUNT),
);
```

This assumes 0-based slotPosition (A=0, B=1, etc.) but:
- Does not support letters beyond Z (AA, AB, etc.)
- Is inconsistent with the `letterMapping.ts` utility

## Test Files Using 0-based slotPosition

Many test files use `slotPosition: 0` for the first character:
- `PlayControls.test.tsx`: Lines 81, 123, 158, etc.
- `gameStore-reset.test.ts`: Lines 20, 66, 91, etc.
- `gameStore-characters.test.ts`: Lines 137-139 (test explicitly checks for 0-based)
- `gameStore-debug-ui.test.ts`: Lines 156-158 (test explicitly checks for 0-based)
- Many engine test files

## Recommended Fix

**Option A: Change letterMapping to accept 0-based (Breaking Change)**
- Modify `slotPositionToLetter` to accept 0-based input
- Update validation: `if (slotPosition < 0)` instead of `if (slotPosition <= 0)`
- Update internal logic: `let n = slotPosition + 1;` at start
- Pros: Matches existing game logic convention, fewer changes
- Cons: Changes the utility function semantics

**Option B: Change gameStore to use 1-based (Recommended)**
- Modify all three action handlers to use `state.gameState.characters.length + 1`
- Update RuleEvaluations.tsx to use `letterMapping.ts` utility
- Update test files that check slotPosition values
- Pros: Consistent with spec language ("First character: A"), natural mapping (position 1 = A)
- Cons: More test file changes

**Recommendation: Option B**

The spec clearly states "First character: A" which implies 1-based indexing. The letterMapping utility was designed correctly per spec. The bug is in the store implementation.

## Files to Modify

1. `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` (lines 102, 257, 343)
2. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` (lines 311-314)
3. Test files (update slotPosition values from 0-based to 1-based)

## Test File Impact

Tests that explicitly verify 0-based slotPosition behavior will need updating:
- `src/stores/gameStore-characters.test.ts:129-139`
- `src/stores/gameStore-debug-ui.test.ts:144-158`

All other test files that use `slotPosition: 0` for first character may need updating depending on whether their tests rely on the specific value.
