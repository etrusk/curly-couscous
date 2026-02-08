# Test Designs: Accessibility Improvements

## Summary

13 new tests across 2 test files covering ARIA `role="meter"` on HP bars and `role="alert"` on terminal battle states. Documentation-only changes (items 3 and 4 in plan) require no tests.

**Review additions (TEST_DESIGN_REVIEW phase):**

- Added `hp-bar-aria-label` test: verifies `aria-label="HP"` on the meter element (plan item 1 coverage gap)
- Added `hp-bar-aria-valuenow-clamps-negative-hp` test: verifies clamping for negative HP from overkill (edge case beyond hp=0 boundary)

---

## 1. HP Bar Accessibility (Token.tsx) -- 8 tests

**Test file:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-visual.test.tsx`

All tests in this section belong in a new `describe("HP Bar Accessibility")` block, placed after the existing `describe("HP Display")` block. Tests follow the existing pattern of rendering `<Token>` directly with explicit props and querying via `screen.getByTestId`.

### Test: hp-bar-has-role-meter

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: The HP bar group element exposes `role="meter"` to assistive technology
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={100} maxHp={100} slotPosition={1} cx={0} cy={0} />`
- **Assertions**:
  1. Within `token-char-1`, query for an element with `role="meter"` (via `querySelector('[role="meter"]')`) -- it exists and is in the document
  2. The meter element contains the HP bar fill rect (`health-bar-char-1` testid is a descendant)
- **Justification**: Without `role="meter"`, screen readers cannot interpret the HP bar as a gauge widget. This test ensures the ARIA role is present and structurally wraps the HP bar elements.

### Test: hp-bar-aria-valuemin-is-zero

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: The HP meter declares a minimum value of 0
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={50} maxHp={100} slotPosition={1} cx={0} cy={0} />`
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-valuemin` equal to `"0"`
- **Justification**: ARIA meters require `aria-valuemin` for screen readers to communicate the value range. HP cannot go below 0 in the UI representation.

### Test: hp-bar-aria-valuemax-matches-maxHp

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: The HP meter's maximum value reflects the character's maxHp prop
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={80} maxHp={150} slotPosition={1} cx={0} cy={0} />` (use maxHp=150, a non-default value, to confirm it is not hardcoded)
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-valuemax` equal to `"150"`
- **Justification**: Prevents hardcoding of max HP. Different characters may have different maxHp values (future-proofing), and the meter must reflect the actual maximum.

### Test: hp-bar-aria-valuenow-matches-hp

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: The HP meter's current value reflects the character's current hp prop
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={63} maxHp={100} slotPosition={1} cx={0} cy={0} />` (use hp=63, an arbitrary non-round value, to confirm it is dynamic)
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-valuenow` equal to `"63"`
- **Justification**: The meter must report the live HP value so screen readers can announce the current health status accurately.

### Test: hp-bar-aria-valuenow-clamps-to-zero

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: When hp is 0 (or negative from overkill damage), `aria-valuenow` is clamped to 0 rather than reporting a negative value
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={0} maxHp={100} slotPosition={1} cx={0} cy={0} />`
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-valuenow` equal to `"0"`
- **Justification**: Negative HP values are nonsensical for ARIA meters and could confuse assistive technology. The plan specifies `Math.max(0, hp)` clamping. This test verifies that edge case.

### Test: hp-bar-aria-label

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: The HP meter `<g>` element has `aria-label="HP"` to identify the meter to screen readers
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={100} maxHp={100} slotPosition={1} cx={0} cy={0} />`
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-label` equal to `"HP"`
- **Justification**: The plan specifies `aria-label="HP"` on the meter wrapper (plan item 1, line 21). Without an accessible name, screen readers would announce the meter as an unlabeled gauge, providing no context about what is being measured. This is distinct from `aria-valuetext` which provides the current value description.

### Test: hp-bar-aria-valuenow-clamps-negative-hp

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: When hp is negative (overkill damage), `aria-valuenow` is clamped to 0
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={-10} maxHp={100} slotPosition={1} cx={0} cy={0} />`
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-valuenow` equal to `"0"`
- **Justification**: The plan specifies `Math.max(0, hp)` clamping, which should handle negative values from overkill damage. The existing hp=0 clamping test only verifies the boundary. This test verifies that actually-negative values are also clamped, catching implementations that check `hp === 0` instead of `hp <= 0`.

### Test: hp-bar-aria-valuetext-format

- **File**: `src/components/BattleViewer/token-visual.test.tsx`
- **Type**: unit
- **Verifies**: The HP meter provides a human-readable text description in the expected format
- **Setup**: Render `<Token id="char-1" faction="friendly" hp={75} maxHp={100} slotPosition={1} cx={0} cy={0} />`
- **Assertions**:
  1. The `role="meter"` element has attribute `aria-valuetext` equal to `"75 of 100 HP"`
- **Justification**: `aria-valuetext` provides the screen reader with a natural-language description instead of just a raw number. Without it, a screen reader would only announce "75" with no units or context. The format "{hp} of {maxHp} HP" matches the plan specification.

---

## 2. Terminal State Alert Accessibility (BattleStatusBadge.tsx) -- 5 tests

**Test file:** `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.test.tsx`

All tests in this section belong in the existing `describe("Accessibility")` block. Tests follow the existing pattern of setting up game state via `useGameStore.getState().actions` before rendering `<BattleStatusBadge />`. The existing test infrastructure (Character fixture objects, `initBattle`, `processTick`) is reused.

### Test: terminal-victory-renders-role-alert-with-text

- **File**: `src/components/BattleStatus/BattleStatusBadge.test.tsx`
- **Type**: unit
- **Verifies**: When battle ends in victory, a `role="alert"` element announces "Victory!" to screen readers
- **Setup**: Create characters where friendly has hp=100 and enemy has hp=0 (dead). Call `initBattle(characters)` then `processTick()` to trigger the victory status transition. Render `<BattleStatusBadge />`.
- **Assertions**:
  1. A `role="alert"` element exists in the document (via `screen.getByRole("alert")`)
  2. The alert element's text content includes "Victory!"
- **Justification**: Victory is a critical game outcome that must be announced assertively to screen reader users. Without `role="alert"`, the status change would only be announced politely (via `aria-live="polite"`), which may be delayed or skipped if the user is interacting with other content.

### Test: terminal-defeat-renders-role-alert-with-text

- **File**: `src/components/BattleStatus/BattleStatusBadge.test.tsx`
- **Type**: unit
- **Verifies**: When battle ends in defeat, a `role="alert"` element announces "Defeat" to screen readers
- **Setup**: Create characters where friendly has hp=0 (dead) and enemy has hp=100. Call `initBattle(characters)` then `processTick()` to trigger the defeat status transition. Render `<BattleStatusBadge />`.
- **Assertions**:
  1. A `role="alert"` element exists in the document (via `screen.getByRole("alert")`)
  2. The alert element's text content includes "Defeat"
- **Justification**: Defeat is a terminal state requiring assertive announcement. Tests each terminal variant independently to ensure the correct status text is mapped.

### Test: terminal-draw-renders-role-alert-with-text

- **File**: `src/components/BattleStatus/BattleStatusBadge.test.tsx`
- **Type**: unit
- **Verifies**: When battle ends in draw, a `role="alert"` element announces "Draw" to screen readers
- **Setup**: Call `initBattle([])` with an empty character array (triggers draw status). Render `<BattleStatusBadge />`.
- **Assertions**:
  1. A `role="alert"` element exists in the document (via `screen.getByRole("alert")`)
  2. The alert element's text content includes "Draw"
- **Justification**: Draw is a terminal state requiring assertive announcement. The draw setup is simpler (empty characters) but must be tested to confirm all three terminal paths are covered.

### Test: active-state-alert-element-has-no-text

- **File**: `src/components/BattleStatus/BattleStatusBadge.test.tsx`
- **Type**: unit
- **Verifies**: During active battle, the `role="alert"` element exists but contains no text (empty), preventing false announcements
- **Setup**: Create two characters (one friendly hp=100, one enemy hp=100). Call `initBattle(characters)`. Render `<BattleStatusBadge />`.
- **Assertions**:
  1. A `role="alert"` element exists in the document (present in DOM so AT registers it for future transitions)
  2. The alert element's text content is empty (empty string or whitespace only)
- **Justification**: The alert div must be in the DOM before content appears for screen readers to track it (per plan risk #2). But during non-terminal states, it must be empty to avoid false "Battle Active" announcements via the assertive channel. This test guards against accidentally populating the alert during normal gameplay.

### Test: aria-live-polite-region-still-present

- **File**: `src/components/BattleStatus/BattleStatusBadge.test.tsx`
- **Type**: unit
- **Verifies**: The existing `aria-live="polite"` region is preserved after adding the new `role="alert"` element (regression guard)
- **Setup**: Create a victory state (friendly alive, enemy dead, processTick). Render `<BattleStatusBadge />`. Use victory state specifically because this is when `role="alert"` is populated -- ensuring both ARIA mechanisms coexist.
- **Assertions**:
  1. An element with `aria-live="polite"` exists in the document (via `container.querySelector('[aria-live="polite"]')`)
  2. The `aria-live="polite"` element contains the status text "Victory!"
- **Justification**: The plan explicitly states "the existing `aria-live='polite'` region on `statusContainer` remains unchanged." This regression test ensures the new `role="alert"` addition does not remove or break the existing polite live region. Testing during a terminal state confirms both mechanisms coexist.

---

## Non-Tested Items

Items 3 (stale reference fix in `.roo/rules/00-project.md`) and 4 (WCAG 2.2 AA reference in `spec.md`/`architecture.md`) are documentation-only changes with no behavioral impact. No tests are needed per the plan.
