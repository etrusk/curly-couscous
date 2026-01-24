# Test Specification: Debug UI Click-to-Place Feature

**Status**: Approved by human reviewer (2026-01-24)  
**Related Files**: `src/stores/gameStore.ts`, `src/components/CharacterControls/`, `src/components/BattleViewer/`

---

## Feature Overview

Enable click-to-place character positioning and move functionality for debug/setup scenarios.

**User Requirements**:

- Add friendly/enemy buttons should let user select which square
- New "Move" button to relocate selected character to any empty cell
- Group add/remove/move into a "Debug UI" section

---

## Design Decisions

### 1. State Management: Extend gameStore (not create uiStore)

**Rationale**: `selectedCharacterId` already lives in gameStore (precedent). Selection mode is tightly coupled with character operations. Can refactor to uiStore later when more UI state accumulates.

**New state shape**:

```typescript
type SelectionMode = "idle" | "placing-friendly" | "placing-enemy" | "moving";

interface GameStore {
  // ... existing
  selectionMode: SelectionMode; // NEW - default 'idle'
}
```

### 2. Store Actions

| Action                   | Signature                                                 | Description                           | Returns                             |
| ------------------------ | --------------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| `setSelectionMode`       | `(mode: SelectionMode) => void`                           | Sets current selection mode           | void                                |
| `addCharacterAtPosition` | `(faction: Faction, position: Position) => boolean`       | Places character at specific position | false if occupied/invalid           |
| `moveCharacter`          | `(characterId: string, newPosition: Position) => boolean` | Relocates character                   | false if occupied/invalid/not found |

### 3. Character Creation Pattern

`addCharacterAtPosition` reuses existing `addCharacter` pattern (lines 354-405):

```typescript
const newCharacter: Character = {
  id: `${faction}-${Date.now()}-${characterIdCounter++}`,
  name: `${faction === "friendly" ? "Friendly" : "Enemy"} ${slotPosition + 1}`,
  faction,
  slotPosition: state.gameState.characters.length, // next sequential
  hp: 100,
  maxHp: 100,
  position, // NEW: caller-provided instead of auto-found
  skills: structuredClone(DEFAULT_SKILLS),
  currentAction: null,
};
```

### 4. Reset Semantics

**Intended Behavior**: Debug placement becomes new "initial" state.

**Rationale**: Matches existing `addCharacter` behavior (line 395). Users expect "Reset" to restore their configured setup, not blank slate.

Both `addCharacterAtPosition` and `moveCharacter` update:

- `state.gameState.characters` (current state)
- `state.initialCharacters` (reset state)

### 5. Cell Click Infrastructure

**Cell.tsx** new props:

```typescript
interface CellProps {
  x: number;
  y: number;
  character?: TokenData;
  onClick?: (x: number, y: number) => void; // NEW
  isClickable?: boolean; // NEW - Visual: cursor:pointer, hover effect
}
```

**Grid.tsx** new props:

```typescript
interface GridProps {
  width: number;
  height: number;
  characters?: TokenData[];
  onCellClick?: (x: number, y: number) => void; // NEW
  clickableCells?: Set<string>; // NEW - "x-y" hyphen format
}
```

### 6. Clickable Cells Selector

**New selector in gameStore.ts**:

```typescript
/**
 * Compute which cells are clickable based on current selection mode.
 * Returns empty Set in idle mode.
 * Returns Set of "x-y" formatted strings for empty cells in placement/moving modes.
 */
export const selectClickableCells = (state: GameStore): Set<string> => {
  const { selectionMode } = state;
  if (selectionMode === "idle") return new Set();

  // Build set of occupied positions
  const occupied = new Set(
    state.gameState.characters.map((c) => `${c.position.x}-${c.position.y}`),
  );

  // Return all empty cells (12×12 grid)
  const clickable = new Set<string>();
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const key = `${x}-${y}`;
      if (!occupied.has(key)) {
        clickable.add(key);
      }
    }
  }
  return clickable;
};
```

**Key Format**: Standardized to `"x-y"` hyphen format (matches existing Grid.tsx pattern).

### 7. Component Structure: Enhance CharacterControls

Keep existing `CharacterControls` component, add:

- Visual "Debug" section label/grouping
- "Move" button (disabled when `!selectedCharacterId`)
- Button states reflect active selection mode (visual indicator)
- Clicking active mode button again returns to idle (toggle/cancel)

### 8. User Flow State Machine

```
                    ┌─────────┐
                    │  IDLE   │◄──────────────────┐
                    └────┬────┘                   │
                         │                        │
    ┌────────────────────┼────────────────────┐   │
    │ Click button       │ Click button       │   │ Click same button
    ▼                    ▼                    ▼   │ again (cancel)
┌─────────┐      ┌─────────────┐      ┌─────────┐ │
│PLACING  │      │PLACING      │      │ MOVING  │ │
│FRIENDLY │      │ENEMY        │      │         │ │
└────┬────┘      └──────┬──────┘      └────┬────┘ │
     │                  │                  │      │
     │ Click empty      │ Click empty      │Click │
     │ cell             │ cell             │empty │
     │                  │                  │cell  │
     ▼                  ▼                  ▼      │
  addCharacter      addCharacter       moveChar   │
  AtPosition()      AtPosition()       acter()    │
                                                  │
     └──────────────────┴──────────────┴──────────┘
                 Auto-return to IDLE
```

**Character Selection Flow** (for Move):

1. Click token → `selectCharacter(id)` called (existing Token behavior)
2. `selectedCharacterId` populated in store (existing)
3. Click "Move" button → `selectionMode` becomes `'moving'`
4. Click empty cell → `moveCharacter(selectedCharacterId, position)`
5. Auto-return to `'idle'`

---

## Test Cases (44 total)

### Test File: `src/stores/gameStore.test.ts` (17 tests)

#### Selection Mode (2 tests)

| #   | Test Name                                            | Description                | Justification                         |
| --- | ---------------------------------------------------- | -------------------------- | ------------------------------------- |
| 1   | `selectionMode should default to 'idle'`             | Initial state check        | Ensures predictable starting state    |
| 2   | `setSelectionMode should update selectionMode state` | Action sets mode correctly | Core functionality for mode switching |

#### addCharacterAtPosition (7 tests)

| #   | Test Name                                                                  | Description                             | Justification                            |
| --- | -------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------- |
| 3   | `addCharacterAtPosition should place character at specified position`      | Happy path for position-based placement | Primary use case                         |
| 4   | `addCharacterAtPosition should return false if position is occupied`       | Rejects placement on occupied cell      | Prevents character overlap               |
| 5   | `addCharacterAtPosition should return false if position is out of bounds`  | Validates x/y within 0-11               | Grid boundary enforcement                |
| 6   | `addCharacterAtPosition should update initialCharacters for reset support` | Syncs with reset state                  | Matches existing `addCharacter` behavior |
| 7   | `addCharacterAtPosition should assign correct slotPosition`                | Sequential slot numbering               | Collision tiebreaking consistency        |
| 8   | `addCharacterAtPosition should create character with default skills`       | DEFAULT_SKILLS cloned                   | Matches existing pattern                 |
| 9   | `addCharacterAtPosition should create character with 100 HP`               | hp: 100, maxHp: 100                     | Standard default                         |

#### moveCharacter (4 tests)

| #   | Test Name                                                          | Description                   | Justification                             |
| --- | ------------------------------------------------------------------ | ----------------------------- | ----------------------------------------- |
| 10  | `moveCharacter should relocate character to new position`          | Happy path for move           | Primary move use case                     |
| 11  | `moveCharacter should return false if target position is occupied` | Rejects move to occupied cell | Prevents character overlap                |
| 12  | `moveCharacter should return false if character not found`         | Handles invalid characterId   | Error handling                            |
| 13  | `moveCharacter should return false if position is out of bounds`   | Validates target position     | Grid boundary enforcement                 |
| 14  | `moveCharacter should update both gameState and initialCharacters` | Syncs with reset state        | Moved position becomes new reset position |
| 15  | `moveCharacter should preserve all other character properties`     | Only position changes         | Non-destructive update                    |

#### selectClickableCells selector (4 tests)

| #   | Test Name                                                                     | Description                     | Justification             |
| --- | ----------------------------------------------------------------------------- | ------------------------------- | ------------------------- |
| 16  | `selectClickableCells should return empty Set in idle mode`                   | No cells clickable by default   | Guards default behavior   |
| 17  | `selectClickableCells should return all empty cells in placing-friendly mode` | Returns 143 cells if 1 occupied | Placement mode behavior   |
| 18  | `selectClickableCells should return all empty cells in moving mode`           | Same as placing mode            | Move mode behavior        |
| 19  | `selectClickableCells should exclude occupied positions`                      | Occupied cells not in Set       | Prevents overlap attempts |

---

### Test File: `src/components/BattleViewer/Cell.test.tsx` (4 tests - NEW FILE)

| #   | Test Name                                                   | Description             | Justification               |
| --- | ----------------------------------------------------------- | ----------------------- | --------------------------- |
| 1   | `should render without onClick when not provided`           | Baseline non-clickable  | Backward compatibility      |
| 2   | `should call onClick with coordinates when clicked`         | onClick handler invoked | Core click functionality    |
| 3   | `should have clickable class when isClickable is true`      | CSS class applied       | Visual feedback             |
| 4   | `should not have clickable class when isClickable is false` | CSS class not applied   | Default non-clickable state |

---

### Test File: `src/components/BattleViewer/Grid.test.tsx` (3 tests - NEW FILE or additions)

| #   | Test Name                                                          | Description               | Justification                |
| --- | ------------------------------------------------------------------ | ------------------------- | ---------------------------- |
| 1   | `should propagate onCellClick to Cell components`                  | Grid passes handler down  | Click event flow             |
| 2   | `should pass isClickable=true only to cells in clickableCells set` | Selective clickability    | Only valid targets clickable |
| 3   | `should pass isClickable=false to cells not in clickableCells set` | Non-targets not clickable | Clear visual distinction     |

---

### Test File: `src/components/CharacterControls/CharacterControls.test.tsx` (8 tests - additions)

| #   | Test Name                                                            | Description                   | Justification          |
| --- | -------------------------------------------------------------------- | ----------------------------- | ---------------------- |
| 1   | `should render Move button`                                          | Button exists                 | New UI element         |
| 2   | `Move button should be disabled when no character selected`          | Requires selection            | Prevents invalid state |
| 3   | `Move button should be enabled when character is selected`           | Selection enables move        | Expected behavior      |
| 4   | `clicking Add Friendly should set selectionMode to placing-friendly` | Mode transition               | Flow step 1            |
| 5   | `clicking Add Enemy should set selectionMode to placing-enemy`       | Mode transition               | Flow step 1            |
| 6   | `clicking Move should set selectionMode to moving`                   | Mode transition               | Flow step 1            |
| 7   | `clicking active mode button again should return to idle`            | Toggle/cancel behavior        | Cancellation flow      |
| 8   | `should show visual indicator for active selection mode`             | Button appears pressed/active | User feedback          |

---

### Test File: `src/components/BattleViewer/BattleViewer.test.tsx` (12 tests - additions)

| #   | Test Name                                                                    | Description                          | Justification    |
| --- | ---------------------------------------------------------------------------- | ------------------------------------ | ---------------- |
| 1   | `should make empty cells clickable in placing-friendly mode`                 | Clickable cells based on mode        | Mode-aware grid  |
| 2   | `should make empty cells clickable in placing-enemy mode`                    | Clickable cells based on mode        | Mode-aware grid  |
| 3   | `should make empty cells clickable in moving mode`                           | Clickable cells based on mode        | Mode-aware grid  |
| 4   | `should not make cells clickable in idle mode`                               | No clickable cells by default        | Default behavior |
| 5   | `clicking empty cell in placing-friendly mode should add friendly character` | End-to-end placement                 | Integration      |
| 6   | `clicking empty cell in placing-enemy mode should add enemy character`       | End-to-end placement                 | Integration      |
| 7   | `clicking empty cell in moving mode should move selected character`          | End-to-end move                      | Integration      |
| 8   | `should return to idle mode after successful placement`                      | Auto-clear mode                      | Flow completion  |
| 9   | `should return to idle mode after successful move`                           | Auto-clear mode                      | Flow completion  |
| 10a | `occupied cells should not be clickable in placing-friendly mode`            | Occupied excluded from clickable set | Prevents overlap |
| 10b | `occupied cells should not be clickable in placing-enemy mode`               | Occupied excluded from clickable set | Prevents overlap |
| 10c | `occupied cells should not be clickable in moving mode`                      | Occupied excluded from clickable set | Prevents overlap |

---

## Coverage Analysis

- **Happy path**: Store tests #3, #10; BattleViewer integration tests #5-7
- **Edge cases**: Store tests #4, #5, #11-14; BattleViewer test #10a-c
- **Error handling**: Store tests #4, #5, #11-14 (all return false cases)
- **State transitions**: CharacterControls tests #4-7; BattleViewer tests #8-9

---

## Not Testing (and why)

- **ESC key cancellation**: Can be added later as enhancement; button toggle provides cancellation
- **Keyboard navigation for cells**: Deferred to Phase 5 (Accessibility Polish) per spec.md; current focus is mouse interaction. Will need `tabIndex`, `onKeyDown` handler, and focus management.
- **Visual styling details**: CSS is implementation detail; test class presence, not pixel values
- **BattleViewer SVG overlay interactions**: Outside scope of this feature
- **Error feedback for failed placement**: Debug UI for power users; failed clicks are silent (cell simply doesn't respond). Console warning acceptable for implementation.

---

## Implementation Notes

### Position Validation

```typescript
function isValidPosition(position: Position): boolean {
  return (
    position.x >= 0 && position.x < 12 && position.y >= 0 && position.y < 12
  );
}

function isPositionOccupied(
  characters: Character[],
  position: Position,
): boolean {
  return characters.some(
    (c) => c.position.x === position.x && c.position.y === position.y,
  );
}
```

### CSS Classes for Cell Clickability

```css
/* Cell.module.css additions */
.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: var(--cell-hover);
  outline: 2px solid var(--focus-ring);
}
```

### Active Button Visual Indicator

```css
/* CharacterControls.module.css additions */
.activeButton {
  background-color: var(--button-active);
  font-weight: 600;
  border: 2px solid var(--focus-ring);
}
```

---

## Affected Files

### New Files

- `src/components/BattleViewer/Cell.test.tsx` (new)
- `src/components/BattleViewer/Grid.test.tsx` (new)

### Modified Files

- `src/stores/gameStore.ts` (add selectionMode state, 3 actions, 1 selector)
- `src/stores/gameStore.test.ts` (add 17 tests)
- `src/components/BattleViewer/Cell.tsx` (add onClick, isClickable props)
- `src/components/BattleViewer/Cell.module.css` (add clickable styles)
- `src/components/BattleViewer/Grid.tsx` (add onCellClick, clickableCells props)
- `src/components/BattleViewer/BattleViewer.tsx` (wire up click handling)
- `src/components/BattleViewer/BattleViewer.test.tsx` (add 12 tests)
- `src/components/CharacterControls/CharacterControls.tsx` (add Move button, wire mode transitions)
- `src/components/CharacterControls/CharacterControls.module.css` (add activeButton styles)
- `src/components/CharacterControls/CharacterControls.test.tsx` (add 8 tests)

---

## Success Criteria

- ✅ All 44 tests pass
- ✅ Users can click "Add Friendly" → click empty cell → character placed
- ✅ Users can click "Add Enemy" → click empty cell → character placed
- ✅ Users can select character → click "Move" → click empty cell → character moved
- ✅ Clicking occupied cell does nothing (silent failure)
- ✅ Clicking same button again cancels placement mode
- ✅ Reset button restores debug-placed characters to their configured positions
- ✅ Visual feedback shows which cells are clickable
- ✅ Visual feedback shows which mode button is active
