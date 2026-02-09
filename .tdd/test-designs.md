# Test Designs: CharacterTooltip Test File Extraction

## Overview

This is a **reorganization-only** task. No test logic changes. The design documents the exact test inventory for each new file so the coder can verify no tests are lost during the split.

**Source file:** `src/components/BattleViewer/CharacterTooltip.test.tsx` (473 lines, 13 tests, 5 describe blocks)

**Target files:**

1. `CharacterTooltip-content.test.tsx` -- 4 tests in 1 describe block
2. `CharacterTooltip-behavior.test.tsx` -- 9 tests in 4 describe blocks

---

## File 1: CharacterTooltip-content.test.tsx

- **JSDoc header:** `/** Tests for CharacterTooltip component - content rendering. */`
- **Estimated lines:** ~245 (well under 400)

### Imports

```
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterTooltip } from "./CharacterTooltip";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
  createAttackAction,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
import { createMockRect, mockViewport } from "./tooltip-test-helpers";
```

**Notable exclusions vs. original:** `vi` (no mocks needed), `userEvent` (no user interactions), `calculateTooltipPosition` (no positioning tests).

### Shared Setup (beforeEach)

```
beforeEach(() => {
  const { actions } = useGameStore.getState();
  actions.initBattle([]);
  actions.selectCharacter(null);
  mockViewport(1000, 800);
});
```

This is the Content Rendering block's existing beforeEach, copied verbatim from lines 20-27 of the original.

### Describe Block: `CharacterTooltip - Content Rendering`

---

### Test: renders-next-action-section

- **File**: src/components/BattleViewer/CharacterTooltip-content.test.tsx
- **Type**: unit
- **Verifies**: Next Action section renders with action name, target letter, and resolution timing
- **Setup**: Create character with `currentAction: null` and a target; init battle with both; render with `createMockRect` anchor
- **Assertions**:
  1. "Next Action" text is in the document
  2. At least one element matches /Light Punch/i
  3. Target letter /B/i is in the document
  4. Resolution timing /next tick/i is in the document
- **Justification**: Verifies the primary tooltip content -- the next action display with all key information fields. Prevents regressions in action name, target reference, and timing display.
- **Original location**: Lines 30-66

---

### Test: renders-skill-priority-section

- **File**: src/components/BattleViewer/CharacterTooltip-content.test.tsx
- **Type**: unit
- **Verifies**: Skill Priority section renders numbered skill list with selection indicator and collapsed skills
- **Setup**: Create character with 3 skills (Light Punch enabled, Move enabled, Heavy Punch disabled) and a target; init battle; render
- **Assertions**:
  1. "Skill Priority" text is in the document
  2. Skills are numbered: /1\.\s*Light Punch/i, /2\.\s*Move/i, /3\.\s\*Heavy Punch/i
  3. At least one arrow indicator (`/→/` -- Unicode U+2192 RIGHT ARROW) exists (selected skill)
  4. /Heavy Punch/i is present in the DOM (collapsed section content)
- **Justification**: Verifies the skill priority list rendering with correct numbering, selection indicators, and presence of collapsed skills. Prevents regressions in the gambit-style priority display.
- **Original location**: Lines 69-141

---

### Test: renders-collapsible-skipped-skills

- **File**: src/components/BattleViewer/CharacterTooltip-content.test.tsx
- **Type**: unit
- **Verifies**: Skipped skills render inside a native details/summary collapsible section
- **Setup**: Create character with `currentAction: null` and a target; init battle; render
- **Assertions**:
  1. A `<details>` element exists in the document
  2. The `<summary>` element text matches /Show \d+ more skill/i
- **Justification**: Verifies the progressive disclosure pattern (spec requirement) for skipped skills. Uses native details/summary for keyboard accessibility per spec.
- **Original location**: Lines 144-169

---

### Test: renders-mid-action-display

- **File**: src/components/BattleViewer/CharacterTooltip-content.test.tsx
- **Type**: unit
- **Verifies**: Tooltip shows "Continuing Action" (not "Next Action") when character has an in-progress action with remaining ticks
- **Setup**: Create character with `createAttackAction` current action (Light Punch, ticks 0-3); create target; init battle; set game tick to 1 (mid-action); render
- **Assertions**:
  1. "Continuing Action" text is in the document
  2. "Next Action" text is NOT in the document
  3. /Light Punch/i is displayed
  4. /2 ticks/i remaining timing is displayed
- **Justification**: Verifies the distinction between idle-choosing and mid-action states. Ensures the tooltip accurately reports continuing actions with correct remaining tick count.
- **Original location**: Lines 172-209

---

### Test: renders-idle-state

- **File**: src/components/BattleViewer/CharacterTooltip-content.test.tsx
- **Type**: unit
- **Verifies**: Tooltip shows idle state when character has no valid action (no enemies to target)
- **Setup**: Create character with `currentAction: null`; init battle with only the character (no enemies); render
- **Assertions**:
  1. Idle emoji display is present (`/💤 Idle/` regex match)
  2. /No valid action/i message is shown
- **Justification**: Verifies the edge case where no skill conditions are met. Prevents regression of the idle state indicator.
- **Original location**: Lines 212-234

---

## File 2: CharacterTooltip-behavior.test.tsx

- **JSDoc header:** `/** Tests for CharacterTooltip component - portal, positioning, accessibility, and hover behavior. */`
- **Estimated lines:** ~255 (well under 400)

### Imports

```
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterTooltip } from "./CharacterTooltip";
import { calculateTooltipPosition } from "./tooltip-positioning";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
import { createMockRect, mockViewport } from "./tooltip-test-helpers";
```

**Notable exclusions vs. original:** `createAttackAction` (not needed -- only used in Content Rendering's mid-action test).

**Notable inclusions vs. content file:** `vi` (for mock functions in Hover test), `userEvent` (for hover simulation), `calculateTooltipPosition` (for Positioning tests).

### Describe Block: `CharacterTooltip - Portal Rendering`

**beforeEach:**

```
beforeEach(() => {
  const { actions } = useGameStore.getState();
  actions.initBattle([]);
  mockViewport(1000, 800);
});
```

---

### Test: portal-renders-outside-component-tree

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip renders via React Portal outside its parent container element
- **Setup**: Create character; init battle; render CharacterTooltip inside a `<div data-testid="container">`
- **Assertions**:
  1. Element with role="tooltip" exists in the document
  2. The container div does NOT contain the tooltip element (`containerDiv.contains(tooltip)` is false)
  3. `document.body` DOES contain the tooltip element
- **Justification**: Verifies React Portal behavior -- tooltip must render outside the component tree for correct z-index stacking and overflow handling. Prevents regression if portal implementation is changed.
- **Original location**: Lines 245-271

---

### Describe Block: `CharacterTooltip - Positioning`

**beforeEach:**

```
beforeEach(() => {
  mockViewport(1000, 800);
});
```

Note: No store reset needed -- Positioning tests call `calculateTooltipPosition` directly (pure function, no React rendering).

---

### Test: positions-right-of-anchor-by-default

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip positions to the right of the anchor with correct offset and vertical centering
- **Setup**: `mockViewport(1000, 800)`; anchor at (200, 200, 40, 40); tooltip 300x200
- **Assertions**:
  1. `result.left` is 252 (anchor right 240 + offset 12)
  2. `result.top` is 120 (vertically centered: 200 + 20 - 100)
- **Justification**: Verifies the default (happy path) positioning logic for the pure function. Ensures the OFFSET constant (12px) is correctly applied.
- **Original location**: Lines 280-297

---

### Test: positions-left-when-near-right-viewport-edge

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip falls back to left-side placement when right side would exceed viewport
- **Setup**: `mockViewport(800, 800)`; anchor at (700, 200, 40, 40); tooltip 300x200
- **Assertions**:
  1. `result.left` is 388 (anchor left 700 - offset 12 - width 300)
  2. `result.left` is less than `anchorRect.left`
  3. `result.left` is greater than 8 (respects MARGIN)
- **Justification**: Verifies the left-side fallback logic. Prevents tooltips from rendering off-screen to the right.
- **Original location**: Lines 300-318

---

### Test: fallback-position-when-both-sides-constrained

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip uses fallback position (clamped to MARGIN) when neither left nor right placement fits
- **Setup**: `mockViewport(400, 800)`; anchor at (150, 200, 40, 40); tooltip 300x200
- **Assertions**:
  1. `result.left` is >= 8 (MARGIN minimum)
  2. `result.left` equals `Math.max(8, anchorRect.left)` which is 150
- **Justification**: Verifies the edge case where the viewport is too narrow for either side. Ensures the tooltip remains visible and does not go off-screen.
- **Original location**: Lines 321-337

---

### Test: clamps-to-viewport-bottom

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip vertical position is clamped when it would exceed the viewport bottom
- **Setup**: `mockViewport(1000, 800)`; anchor at (200, 700, 40, 40); tooltip 300x200
- **Assertions**:
  1. `result.top + tooltipHeight + 8` is <= 800 (fits within viewport with margin)
  2. `result.top` is 592 (800 - 200 - 8)
- **Justification**: Verifies bottom-edge clamping. Prevents tooltips from rendering below the visible viewport area.
- **Original location**: Lines 340-356

---

### Test: clamps-to-viewport-top

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip vertical position is clamped when it would go above the viewport top
- **Setup**: `mockViewport(1000, 800)`; anchor at (200, 20, 40, 40); tooltip 300x200
- **Assertions**:
  1. `result.top` is >= 8 (MARGIN minimum)
  2. `result.top` is 8 (unclamped would be -60, clamped to MARGIN)
- **Justification**: Verifies top-edge clamping. Prevents tooltips from rendering above the visible viewport area.
- **Original location**: Lines 359-375

---

### Describe Block: `CharacterTooltip - Accessibility`

**beforeEach:**

```
beforeEach(() => {
  const { actions } = useGameStore.getState();
  actions.initBattle([]);
  mockViewport(1000, 800);
});
```

---

### Test: has-role-tooltip

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip element has correct ARIA role and unique ID pattern
- **Setup**: Create character; init battle; render with `createMockRect` anchor
- **Assertions**:
  1. Element found by `getByRole("tooltip")` has attribute `role="tooltip"`
  2. Element has attribute `id` matching `tooltip-${character.id}`
- **Justification**: Verifies ARIA compliance for tooltip accessibility. The unique ID enables `aria-describedby` linkage from the anchor element. Prevents accessibility regressions.
- **Original location**: Lines 386-406

---

### Test: uses-details-summary-for-collapsed-skills

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Collapsed skills use native HTML details/summary elements for keyboard accessibility
- **Setup**: Create character with `currentAction: null` and a target; init battle; render
- **Assertions**:
  1. A `<details>` element is in the document
  2. A `<summary>` element is in the document
- **Justification**: Verifies the progressive disclosure pattern uses semantic HTML (not custom disclosure widgets). Native details/summary provides built-in keyboard navigation and screen reader announcements per spec requirements.
- **Original location**: Lines 409-433

---

### Describe Block: `CharacterTooltip - Hover Callbacks`

**beforeEach:**

```
beforeEach(() => {
  const { actions } = useGameStore.getState();
  actions.initBattle([]);
  mockViewport(1000, 800);
});
```

---

### Test: calls-onMouseEnter-and-onMouseLeave-callbacks

- **File**: src/components/BattleViewer/CharacterTooltip-behavior.test.tsx
- **Type**: unit
- **Verifies**: Tooltip element correctly invokes onMouseEnter and onMouseLeave callback props on hover/unhover
- **Setup**: Create character; init battle; render with `vi.fn()` mocks for `onMouseEnter` and `onMouseLeave`; use `userEvent.setup()`
- **Assertions**:
  1. After `user.hover(tooltip)`, `mockOnMouseEnter` has been called exactly once
  2. After `user.unhover(tooltip)`, `mockOnMouseLeave` has been called exactly once
- **Justification**: Verifies the tooltip hover delay mechanism works -- the CharacterTooltip must forward mouse events to enable the parent's 100ms leave delay logic. Prevents regression in the tooltip hover interaction chain.
- **Original location**: Lines 444-472

---

## Verification Checklist

| #   | Test Name (it description)                                          | Source File Block | Target File | Line Range |
| --- | ------------------------------------------------------------------- | ----------------- | ----------- | ---------- |
| 1   | renders Next Action section with action name and target             | Content Rendering | content     | 30-66      |
| 2   | renders Skill Priority section with numbered skill list             | Content Rendering | content     | 69-141     |
| 3   | renders skipped skills in collapsible section using details/summary | Content Rendering | content     | 144-169    |
| 4   | renders Continuing Action when character is mid-action              | Content Rendering | content     | 172-209    |
| 5   | renders idle state when character has no valid action               | Content Rendering | content     | 212-234    |
| 6   | renders via React Portal outside the component container            | Portal Rendering  | behavior    | 245-271    |
| 7   | positions right of anchor by default                                | Positioning       | behavior    | 280-297    |
| 8   | positions left when near right viewport edge                        | Positioning       | behavior    | 300-318    |
| 9   | uses fallback position when both sides are constrained              | Positioning       | behavior    | 321-337    |
| 10  | clamps to viewport bottom                                           | Positioning       | behavior    | 340-356    |
| 11  | clamps to viewport top                                              | Positioning       | behavior    | 359-375    |
| 12  | has role='tooltip' for accessibility                                | Accessibility     | behavior    | 386-406    |
| 13  | uses native details/summary for keyboard accessibility              | Accessibility     | behavior    | 409-433    |
| 14  | calls onMouseEnter and onMouseLeave callbacks                       | Hover Callbacks   | behavior    | 444-472    |

**Total: 14 tests** (5 content + 9 behavior)

Wait -- the plan says 13 tests (4 content + 9 behavior), but the actual file has 5 tests in the Content Rendering block (the idle state test at lines 212-234 was noted in the plan as part of Content Rendering). Let me reconcile:

The plan table lists 4 tests for content: renders-next-action-section, renders-skill-priority-section, renders-collapsible-skipped-skills, renders-mid-action-display. But the plan also says "The idle state test (lines 212-234) is part of Content Rendering and stays in this file." The exploration correctly counts 4 tests in Content Rendering block but the actual file has 5 `it()` calls in that block (lines 30, 69, 144, 172, 212).

**Corrected count: 14 tests total (5 content + 9 behavior).** The plan's "4 tests" appears to be an undercount -- the idle state test was acknowledged in the plan note but not counted. The actual `it()` count from the source file is authoritative.

## Constraints for Coder

1. **No test logic changes.** Each test body is copied verbatim from the original.
2. **No new helper files.** All shared helpers (`tooltip-test-helpers.ts`, `rule-evaluations-test-helpers.ts`) already exist.
3. **Describe block names preserved exactly.** Do not rename any describe or it strings.
4. **Imports trimmed per file.** Each file imports only what it uses (no unused imports).
5. **Original file deleted.** `CharacterTooltip.test.tsx` must be removed after split.
6. **Browser test file untouched.** `CharacterTooltip.browser.test.tsx` is not part of this task.
7. **Verification:** Run `npm run test` -- total test count must remain the same as before the split. All 14 CharacterTooltip tests pass.
