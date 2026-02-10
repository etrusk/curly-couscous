# Test Designs: Skill Name Tooltips

## Test File

- **Path**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Estimated size**: ~320 lines (13 unit tests + 2 integration tests)
- **Type**: Unit tests (jsdom) via Vitest + React Testing Library

## Test Infrastructure

### Imports

```
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SkillNameWithTooltip } from "./SkillNameWithTooltip";
import { SkillRow } from "./SkillRow";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";
```

### Timer Setup

Every `describe` block that tests the 150ms delay MUST use fake timers:

```
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});
```

When using `userEvent` with fake timers, create the user instance with `advanceTimers` option:

```
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
```

### Portal Rendering in Tests

`createPortal` to `document.body` works in jsdom by default. The tooltip renders as a child of `document.body`. Queries via `screen.*` will find portal-rendered content because `screen` queries the entire document. No special setup needed.

### Advancing Past the 150ms Delay

After a hover/focus action, advance fake timers to trigger the tooltip:

```
await act(() => {
  vi.advanceTimersByTime(150);
});
```

The `act()` wrapper ensures React processes state updates from the timer callback.

### Skill IDs for Tests

All tests use real skill IDs from `SKILL_REGISTRY` so `getSkillDefinition()` returns actual data. No mocking of the registry is needed.

| Test Case       | Skill ID         | Why                                                                   |
| --------------- | ---------------- | --------------------------------------------------------------------- |
| Attack skill    | `"light-punch"`  | Has damage (10), no healing, no distance, no cooldown                 |
| Heal skill      | `"heal"`         | Has healing (25), no damage, no distance, no cooldown                 |
| Move skill      | `"move-towards"` | Has distance (1), behaviors ["towards","away"], no damage, no healing |
| Cooldown skill  | `"heavy-punch"`  | Has cooldown (3), damage (25)                                         |
| Interrupt skill | `"kick"`         | Has damage: 0 (edge case -- should display), cooldown (4)             |
| Charge skill    | `"charge"`       | Has damage (20), distance (3), cooldown (3)                           |

---

## Test Specifications

### Test 1: Tooltip appears on hover after 150ms delay

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip with `role="tooltip"` appears in the DOM after a 150ms delay following mouseenter on the skill name element.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
  - Create user instance with `advanceTimers: vi.advanceTimersByTime`.
- **Actions**:
  1. Assert `screen.queryByRole("tooltip")` returns `null` (no tooltip initially).
  2. Hover over the element containing text "Light Punch" using `user.hover(screen.getByText("Light Punch"))`.
  3. Advance timers by 100ms. Assert tooltip is still NOT present (`screen.queryByRole("tooltip")` is `null`).
  4. Advance timers by 50ms more (total 150ms). Assert tooltip IS present (`screen.getByRole("tooltip")` exists).
- **Assertions**:
  1. Before hover: `expect(screen.queryByRole("tooltip")).toBeNull()`
  2. At 100ms: `expect(screen.queryByRole("tooltip")).toBeNull()`
  3. At 150ms: `expect(screen.getByRole("tooltip")).toBeInTheDocument()`
- **Justification**: Validates the 150ms appear delay requirement. Without this test, the delay could be omitted or set to the wrong value, causing tooltip flicker when traversing skill lists.

---

### Test 2: Shows correct stats for attack skill (Light Punch)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip for Light Punch displays actionType, tickCost, range, and damage; does NOT display healing, distance, cooldown, or behaviors.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
  - Hover and advance timers by 150ms to show tooltip.
- **Actions**:
  1. Hover over "Light Punch" text.
  2. Advance timers 150ms.
  3. Query the tooltip element.
- **Assertions**:
  1. Tooltip contains text matching "attack" (the actionType).
  2. Tooltip contains text matching "0" for tick cost (Light Punch tickCost is 0). Use a label-value pattern to disambiguate: look for text matching `/cost/i` within the tooltip, then verify the associated value is "0 ticks" or just "0". More specifically: `expect(screen.getByRole("tooltip")).toHaveTextContent(/attack/i)`.
  3. Tooltip contains text matching `/range/i` with value "1".
  4. Tooltip contains text matching `/damage/i` with value "10".
  5. Tooltip does NOT contain text matching `/healing/i`.
  6. Tooltip does NOT contain text matching `/distance/i`.
  7. Tooltip does NOT contain text matching `/cooldown/i`.
  8. Tooltip does NOT contain text matching `/behaviors/i`.
- **Justification**: Verifies the conditional stat display logic for the most common skill type (attack). Ensures optional stats are omitted when undefined.

---

### Test 3: Shows correct stats for heal skill (Heal)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip for Heal displays actionType, tickCost, range, and healing; does NOT display damage, distance, cooldown, or behaviors.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="heal">Heal</SkillNameWithTooltip>`.
  - Hover and advance timers by 150ms.
- **Assertions**:
  1. `expect(tooltip).toHaveTextContent(/heal/i)` (actionType).
  2. Tooltip contains text matching `/cost/i` with associated value for tickCost 2 (e.g., "2 ticks" or "2").
  3. Tooltip contains `/range/i` with value "5".
  4. Tooltip contains `/healing/i` with value "25".
  5. Tooltip does NOT contain `/damage/i`.
  6. Tooltip does NOT contain `/distance/i`.
  7. Tooltip does NOT contain `/cooldown/i`.
  8. Tooltip does NOT contain `/behaviors/i`.
- **Justification**: Validates conditional display for a non-attack, non-move skill. Ensures healing stat appears and damage stat does not.

---

### Test 4: Shows correct stats for move skill (Move)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip for Move displays actionType, tickCost, range, distance, cooldown, and behaviors; does NOT display damage or healing.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="move-towards">Move</SkillNameWithTooltip>`.
  - Hover and advance timers by 150ms.
- **Assertions**:
  1. Tooltip contains `/move/i` (actionType).
  2. Tooltip contains cost value "1" (tickCost 1).
  3. Tooltip contains range value "1".
  4. Tooltip contains `/distance/i` with value "1".
  5. Tooltip contains `/cooldown/i` with value "1" (Move has cooldown: 1 in registry).
  6. Tooltip contains `/behaviors/i` with text including "towards" and "away".
  7. Tooltip does NOT contain `/damage/i`.
  8. Tooltip does NOT contain `/healing/i`.
- **Justification**: Validates display for the movement skill type, which has the most optional fields (distance, behaviors, cooldown). Also confirms behaviors are rendered as a joined list.

---

### Test 5: Shows cooldown for Heavy Punch

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip for Heavy Punch displays the cooldown value when the skill definition includes a cooldown field.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="heavy-punch">Heavy Punch</SkillNameWithTooltip>`.
  - Hover and advance timers by 150ms.
- **Assertions**:
  1. Tooltip contains `/cooldown/i` with value "3" (Heavy Punch cooldown is 3).
  2. Tooltip contains `/damage/i` with value "25".
  3. Tooltip contains `/attack/i` (actionType).
  4. Tooltip contains cost value "2" (tickCost).
  5. Tooltip contains range value "2".
- **Justification**: Specifically validates the cooldown conditional display. Heavy Punch is the simplest skill that has a cooldown.

---

### Test 6: Shows damage: 0 for Kick (defined but zero)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: When a skill has `damage: 0` (defined but zero), the tooltip displays "Damage" with value "0" rather than omitting it. This is the `damage: 0` edge case resolved in the plan.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="kick">Kick</SkillNameWithTooltip>`.
  - Hover and advance timers by 150ms.
- **Assertions**:
  1. Tooltip contains `/damage/i` (the label is present because `damage` is defined, even though it is 0).
  2. Tooltip text content includes "0" in the context of the damage row.
  3. Tooltip contains `/interrupt/i` (actionType).
  4. Tooltip contains `/cooldown/i` with value "4".
  5. Tooltip does NOT contain `/healing/i`.
  6. Tooltip does NOT contain `/distance/i`.
  7. Tooltip does NOT contain `/behaviors/i`.
- **Justification**: This is a critical edge case. The plan explicitly resolved that `damage: 0` should be shown because it is defined (present on the object). A naive implementation using `if (damage)` instead of `if (damage !== undefined)` would incorrectly omit it. This test catches that bug.

---

### Test 7: Tooltip disappears on mouse leave

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip is removed from the DOM immediately when the mouse leaves the skill name element (no leave delay).
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
  - Hover and advance timers by 150ms to show the tooltip.
- **Actions**:
  1. Confirm tooltip is visible: `screen.getByRole("tooltip")`.
  2. Unhover the element using `user.unhover(screen.getByText("Light Punch"))`.
- **Assertions**:
  1. After unhover: `expect(screen.queryByRole("tooltip")).toBeNull()`.
- **Justification**: Validates the "no leave delay" requirement. The tooltip is non-interactive, so it must disappear immediately. If a leave delay were mistakenly added, this test would fail.

---

### Test 8: Tooltip appears on keyboard focus

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip appears after the 150ms delay when the skill name element receives keyboard focus (via Tab key or programmatic `.focus()`).
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
- **Actions**:
  1. Tab into the skill name element using `user.tab()` (the `<span tabindex="0">` should receive focus).
  2. Advance timers by 150ms.
- **Assertions**:
  1. `expect(screen.getByRole("tooltip")).toBeInTheDocument()`.
- **Justification**: WCAG 2.2 SC 1.4.13 requires that content shown on hover is also available on focus. This test ensures keyboard users get the same tooltip experience.

---

### Test 9: Tooltip disappears on blur

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Tooltip is removed from the DOM when the skill name element loses keyboard focus.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
  - Tab to focus and advance timers 150ms to show tooltip.
- **Actions**:
  1. Confirm tooltip is visible.
  2. Tab away from the element using `user.tab()` (focus moves to next element or body).
- **Assertions**:
  1. `expect(screen.queryByRole("tooltip")).toBeNull()`.
- **Justification**: Completes the keyboard accessibility story. Without blur handling, the tooltip would persist after navigating away, violating WCAG 1.4.13 dismissal requirements.

---

### Test 10: Accessibility wiring (aria-describedby links to tooltip id)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: The anchor `<span>` has an `aria-describedby` attribute whose value matches the `id` attribute on the tooltip element.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
  - Hover and advance timers 150ms to show tooltip.
- **Actions**:
  1. Get the anchor element: `screen.getByText("Light Punch")`.
  2. Get the tooltip element: `screen.getByRole("tooltip")`.
  3. Read `aria-describedby` from anchor and `id` from tooltip.
- **Assertions**:
  1. `const anchor = screen.getByText("Light Punch");`
  2. `const tooltip = screen.getByRole("tooltip");`
  3. `expect(anchor).toHaveAttribute("aria-describedby", tooltip.id)`.
  4. `expect(tooltip.id).toBeTruthy()` (id is not empty).
- **Justification**: Accessibility is a project requirement. The `aria-describedby` linkage is how screen readers associate the tooltip content with the trigger element. Without this test, the wiring could be broken or the ids could mismatch.

---

### Test 11: Works in SkillRow context (integration)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: integration
- **Verifies**: When `SkillNameWithTooltip` is integrated into `SkillRow`, hovering the skill name within a SkillRow shows the tooltip with correct stats.
- **Setup**:
  - Fake timers enabled.
  - Create a skill using `createSkill({ id: "light-punch", name: "Light Punch" })`.
  - Create a character using `createCharacter({ id: "char1", skills: [skill] })`.
  - Render `<SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />`.
- **Actions**:
  1. Find the "Light Punch" text: `screen.getByText("Light Punch")`.
  2. Hover over it.
  3. Advance timers by 150ms.
- **Assertions**:
  1. `expect(screen.getByRole("tooltip")).toBeInTheDocument()`.
  2. Tooltip contains `/damage/i` with value "10" (Light Punch stats).
  3. Tooltip contains `/attack/i` (actionType).
- **Justification**: Verifies the integration site works correctly. SkillRow wraps the name in `<h3>`, and the tooltip component sits inside that `<h3>`. This test catches DOM structure issues that unit tests of the isolated component would miss (e.g., event propagation problems from the `<h3>` wrapper).

---

### Test 12: Works in Inventory context (integration)

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: integration
- **Verifies**: When `SkillNameWithTooltip` is integrated into PriorityTab's inventory section, hovering a skill name in the inventory shows the tooltip with correct stats.
- **Setup**:
  - Fake timers enabled.
  - Reset game store: `useGameStore.getState().actions.reset()`.
  - Create a character with only Move skill: `const moveSkill = createSkill({ id: "move-towards", name: "Move", behavior: "towards" })`.
  - Create character and init battle: `const char1 = createCharacter({ id: "char1", skills: [moveSkill] })`.
  - `useGameStore.getState().actions.initBattle([char1])`.
  - `useGameStore.getState().actions.selectCharacter("char1")`.
  - Render `<PriorityTab />`.
- **Actions**:
  1. Locate the inventory's "Light Punch" text. Since "Light Punch" may appear in the inventory section, find the text in the inventory context. Use `screen.getByText("Light Punch")` -- there should be exactly one since Light Punch is not assigned to the character and appears only in the inventory.
  2. Hover over it.
  3. Advance timers by 150ms.
- **Assertions**:
  1. `expect(screen.getByRole("tooltip")).toBeInTheDocument()`.
  2. Tooltip contains `/attack/i` (actionType for Light Punch).
  3. Tooltip contains `/damage/i` (Light Punch has damage: 10).
- **Justification**: Verifies the second integration site works correctly. PriorityTab's inventory uses a different wrapper element (`<span>`) than SkillRow (`<h3>`). This test catches issues specific to the inventory rendering context.

---

## Supplementary Test: Graceful degradation for unknown skill ID

### Test 13: Renders children without tooltip for unknown skill ID

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: When `getSkillDefinition` returns `undefined` for an unknown skill ID, the component renders children normally and no tooltip appears on hover.
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="nonexistent-skill">Unknown Skill</SkillNameWithTooltip>`.
- **Actions**:
  1. Assert "Unknown Skill" text is rendered.
  2. Hover over "Unknown Skill" text.
  3. Advance timers by 150ms.
- **Assertions**:
  1. `expect(screen.getByText("Unknown Skill")).toBeInTheDocument()` (children rendered).
  2. `expect(screen.queryByRole("tooltip")).toBeNull()` (no tooltip appears because no skill definition exists).
- **Justification**: The plan specifies graceful degradation for unknown skill IDs. Without this test, the component could throw an error or render a broken tooltip when given an invalid ID.

---

## Supplementary Test: Timer cleanup on rapid hover/unhover

### Test 14: Rapid hover then unhover cancels pending tooltip

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: If the user hovers and then unhovers before the 150ms delay elapses, the tooltip never appears (timer is cleared).
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
- **Actions**:
  1. Hover over "Light Punch".
  2. Advance timers by 100ms (less than 150ms).
  3. Unhover.
  4. Advance timers by 100ms more (total 200ms, well past the original 150ms threshold).
- **Assertions**:
  1. `expect(screen.queryByRole("tooltip")).toBeNull()` (tooltip never appeared because the timer was cleared on mouseleave).
- **Justification**: Prevents tooltip flicker. If the timer is not properly cleared on mouseleave, the tooltip would appear even after the user moved away, causing a disorienting flash.

---

## Supplementary Test: Escape key dismissal (WCAG 2.2 SC 1.4.13)

### Test 15: Escape key dismisses visible tooltip

- **File**: `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`
- **Type**: unit
- **Verifies**: Pressing Escape while the tooltip is visible dismisses it immediately. WCAG 2.2 SC 1.4.13 requires that content triggered by hover/focus is "dismissible" -- Escape is the standard keyboard dismissal mechanism. The requirements constraints section explicitly lists "dismissible via Escape or mouse leave/blur".
- **Setup**:
  - Fake timers enabled.
  - Render `<SkillNameWithTooltip skillId="light-punch">Light Punch</SkillNameWithTooltip>`.
  - Tab to focus the skill name element.
  - Advance timers by 150ms to show the tooltip.
- **Actions**:
  1. Confirm tooltip is visible: `screen.getByRole("tooltip")`.
  2. Press Escape using `user.keyboard("{Escape}")`.
- **Assertions**:
  1. `expect(screen.queryByRole("tooltip")).toBeNull()` (tooltip dismissed by Escape).
  2. `expect(screen.getByText("Light Punch")).toHaveFocus()` (focus remains on the anchor -- Escape dismisses tooltip but does not move focus).
- **Justification**: WCAG 2.2 SC 1.4.13 requires that additional content triggered by hover or focus is dismissible without moving pointer or focus. Escape key is the standard mechanism. Without this test, a user who triggers a tooltip via keyboard focus would have no way to dismiss it without tabbing away, which moves focus.

---

## Test Organization Summary

```
describe("SkillNameWithTooltip", () => {
  // Timer setup: beforeEach(vi.useFakeTimers), afterEach(vi.useRealTimers)

  describe("Tooltip visibility", () => {
    it("appears after 150ms hover delay")           // Test 1
    it("disappears on mouse leave")                  // Test 7
    it("appears on keyboard focus")                  // Test 8
    it("disappears on blur")                         // Test 9
    it("rapid hover/unhover cancels pending tooltip") // Test 14
  })

  describe("Stat display", () => {
    it("shows correct stats for attack skill")       // Test 2 (Light Punch)
    it("shows correct stats for heal skill")         // Test 3 (Heal)
    it("shows correct stats for move skill")         // Test 4 (Move)
    it("shows cooldown for Heavy Punch")             // Test 5
    it("shows damage: 0 for Kick")                   // Test 6
  })

  describe("Accessibility", () => {
    it("aria-describedby links anchor to tooltip")   // Test 10
    it("Escape key dismisses visible tooltip")        // Test 15
  })

  describe("Graceful degradation", () => {
    it("renders children without tooltip for unknown skill ID") // Test 13
  })

  describe("Integration", () => {
    it("works in SkillRow context")                  // Test 11
    it("works in Inventory context")                 // Test 12
  })
})
```

## Implementation Notes for Coder

1. **Timer pattern**: Always wrap `vi.advanceTimersByTime()` calls in `act()` when the timer callback triggers React state updates. Use `await act(async () => { vi.advanceTimersByTime(150); })`.

2. **userEvent with fake timers**: Pass `{ advanceTimers: vi.advanceTimersByTime }` to `userEvent.setup()` so that `user.hover()`, `user.tab()`, etc. properly interact with fake timers.

3. **Portal assertions**: `screen.getByRole("tooltip")` finds portal-rendered tooltips because `screen` queries the entire document, not just the render container. No special `within()` queries needed.

4. **Tooltip text matching**: Use `toHaveTextContent` on the tooltip element for content assertions. For example: `expect(screen.getByRole("tooltip")).toHaveTextContent(/damage/i)`. For negation: `expect(screen.getByRole("tooltip").textContent).not.toMatch(/healing/i)`.

5. **Integration tests (Tests 11-12)**: These test the real SkillRow and PriorityTab components. They import and render the actual components, not mocked versions. The tooltip should appear within those components after hover + delay.

6. **Store cleanup for integration tests**: Tests 11-12 that render PriorityTab must call `useGameStore.getState().actions.reset()` in `beforeEach` to ensure clean game state.

7. **No positioning assertions**: Positioning tests (viewport flip, clamping) are intentionally excluded. They depend on `getBoundingClientRect()` which returns zeros in jsdom. Positioning behavior is deferred to browser tests if needed.
