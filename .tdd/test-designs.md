# Test Designs: Vitest Browser Mode Proof-of-Concept

## Review Status: APPROVED with minor adjustments

**Reviewed by**: test-design-reviewer (2026-02-09)
**Verdict**: 4 tests are well-scoped for a proof-of-concept. Coverage is strong, no overlap with existing jsdom tests, and assertions target genuine jsdom gaps. Three minor adjustments applied below (marked with [REVIEW]).

### Review Summary

1. **Coverage**: All four tests target behaviors that jsdom genuinely cannot test. The smoke test provides a valuable gate for the rest of the suite.
2. **No overlap**: Tests correctly avoid duplicating content, ARIA, callback, and portal tests already covered by jsdom.
3. **Feasibility**: All tests are feasible with Vitest Browser Mode + Playwright. Minor timing concern noted for test 3.
4. **Spec alignment**: Tests verify spec requirements for tooltip positioning (right-preferred, left-fallback, vertical centering, viewport clamping).
5. **Test quality**: Three adjustments made to reduce assertion brittleness (see [REVIEW] markers).
6. **Scope**: Four tests is the right amount for a proof-of-concept -- one smoke + three behavioral.

---

## Overview

These test designs target `src/components/BattleViewer/CharacterTooltip.browser.test.tsx` -- the proof-of-concept browser test file for Vitest Browser Mode. Each test is specifically chosen to validate behavior that jsdom **cannot** test properly, demonstrating the concrete value of browser mode.

The existing jsdom tests in `CharacterTooltip.test.tsx` cover content rendering, ARIA attributes, hover callbacks, portal rendering, and mocked positioning. These browser tests intentionally avoid duplicating any of that. Instead, they focus on real browser layout capabilities: actual element dimensions from `getBoundingClientRect`, positioning calculations that use those real dimensions, and viewport constraint behavior with a real browser viewport.

Additionally, one infrastructure smoke test validates that the workspace configuration produces a genuine browser environment rather than jsdom.

---

### Test: browser-environment-is-real-browser

- **File**: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx`
- **Type**: integration
- **Verifies**: The Vitest Browser Mode workspace is correctly configured and tests run in a real browser, not jsdom
- **Setup**: No component rendering needed. This is a pure environment check.
- **Assertions**:
  1. `navigator.userAgent` does not contain the string `"jsdom"` (jsdom sets its user agent to include "jsdom")
  2. `document.createElement('div').getBoundingClientRect()` returns an object where the method exists as a native function (not a stub returning all zeros -- though an unattached div will return zeros, the key point is that in a real browser, attaching an element with explicit dimensions to the DOM and measuring it yields nonzero values)
  3. `window.innerWidth` is greater than 0 (real browser has a viewport; jsdom defaults to 0 unless mocked)
  4. `window.innerHeight` is greater than 0
- **Justification**: This smoke test gates the entire browser test suite. If the workspace config is broken (e.g., tests accidentally run in jsdom), this test fails immediately with a clear diagnostic, rather than producing confusing false passes in the positioning tests. It validates Step 2 (workspace config) and Step 3 (browser setup file) of the plan.

---

### Test: tooltip-gets-real-dimensions-from-getBoundingClientRect

- **File**: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx`
- **Type**: integration
- **Verifies**: The rendered tooltip element has real nonzero dimensions from `getBoundingClientRect`, confirming that the browser provides actual layout geometry
- **Setup**:
  - Initialize game store with one character and one target (using `createCharacter` and `createTarget` from `rule-evaluations-test-helpers.ts`)
  - Call `actions.initBattle([character, target])` to populate the store
  - Create a real `DOMRect` as the anchor rect (e.g., `new DOMRect(200, 200, 40, 40)`)
  - Render `<CharacterTooltip characterId={character.id} anchorRect={anchorRect} onMouseEnter={() => {}} onMouseLeave={() => {}} />`
  - Query the tooltip element via `screen.getByRole('tooltip')`
  - Call `getBoundingClientRect()` on the tooltip element
- **Assertions**:
  1. `rect.width` is greater than 0 (jsdom always returns 0; the CSS module sets `min-width: 280px`)
  2. `rect.height` is greater than 0 (jsdom always returns 0; tooltip content produces real height)
  3. `rect.width` is greater than or equal to 280 (the CSS `min-width: 280px` should be respected by the browser layout engine)
- **Justification**: This is the core proof-of-concept assertion. The entire motivation for browser mode is that jsdom returns `{ width: 0, height: 0, ... }` from `getBoundingClientRect`, which forced the production code workaround at `CharacterTooltip.tsx` lines 255-256 (`rect.width > 0 ? rect.width : 300`). This test proves the browser returns real dimensions, validating that the zero-rect fallback path is a jsdom artifact, not a real-world condition. If this test passes, it unlocks Phase 2 work to potentially remove the fallback.

---

### Test: tooltip-positions-using-real-dimensions-not-fallback

- **File**: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx`
- **Type**: integration
- **Verifies**: Tooltip positioning uses the actual rendered tooltip dimensions rather than the hardcoded 300x150 fallback values that the jsdom workaround produces
- **Setup**:
  - Initialize game store with one character and one target
  - Call `actions.initBattle([character, target])`
  - Create anchor rect at a known position: `new DOMRect(200, 200, 40, 40)` (token at x=200, y=200, 40x40px)
  - Use a viewport wide enough that the tooltip should appear to the right of the anchor (default browser viewport is typically 1280x720 or larger, which is sufficient)
  - Render `<CharacterTooltip characterId={character.id} anchorRect={anchorRect} onMouseEnter={() => {}} onMouseLeave={() => {}} />`
  - Query the tooltip via `screen.getByRole('tooltip')`
  - Read `tooltip.style.left` and `tooltip.style.top` (inline styles set by the positioning logic)
  - Also call `tooltip.getBoundingClientRect()` to get real rendered dimensions
- **Assertions**:
  1. [REVIEW: Changed from exact equality to relational assertion to reduce brittleness] `parseInt(tooltip.style.left)` is approximately equal to `anchorRect.right + 12` (i.e., `252px`) within a tolerance of 2px -- the OFFSET constant is 12, and with a wide viewport, right-side positioning is preferred. Use `Math.abs(left - 252) <= 2` rather than exact equality, to tolerate subpixel rounding.
  2. The tooltip's `style.top` value reflects vertical centering using the **real** tooltip height (not the 150px fallback). Specifically: `parseInt(tooltip.style.top)` should approximately equal `anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2` (i.e., `220 - realHeight/2`). Use a tolerance of 2px to account for subpixel rounding.
  3. [REVIEW: Replaced negative assertion with positive one] The tooltip element's `getBoundingClientRect().width` is greater than 0, confirming that real dimensions were used (not the zero-rect path). The original assertion (`tooltipRect.height !== 150`) was fragile since content changes could coincidentally produce exactly 150px. The real value of this test is already captured by assertions 1 and 2; this assertion simply confirms the real-dimension code path was taken.
- **Justification**: The existing jsdom positioning tests (e.g., "positions tooltip to the right of token by default") work by mocking the anchor rect and relying on the fallback dimensions. They cannot verify that the tooltip's own measured size feeds into the positioning calculation correctly. This test closes that gap: it proves the `useLayoutEffect` path where `rect.width > 0` takes the real branch rather than the fallback branch. It validates the `calculateTooltipPosition` function with real inputs.
- **[REVIEW] Timing note**: The component renders initially with `{top: 0, left: 0}`, then `useLayoutEffect` fires `setPosition` with calculated values. This state update triggers a re-render. The coder MUST wrap assertions reading `tooltip.style.left` and `tooltip.style.top` in `waitFor()` to ensure the position state update has propagated. Without `waitFor`, assertions may read the initial `{0, 0}` values and produce false failures. This applies to test 4 as well.

---

### Test: tooltip-flips-to-left-in-narrow-viewport

- **File**: `src/components/BattleViewer/CharacterTooltip.browser.test.tsx`
- **Type**: integration
- **Verifies**: Tooltip repositions to the left side of the anchor when the real browser viewport is too narrow for right-side placement, using actual measured tooltip width for the constraint check
- **Setup**:
  - Initialize game store with one character and one target
  - Call `actions.initBattle([character, target])`
  - Use Playwright's viewport control via `page.setViewportSize({ width: 500, height: 600 })` (available through `@vitest/browser/context`) to create a narrow viewport -- narrow enough that a ~280-320px tooltip cannot fit to the right of a token positioned at x=300
  - Create anchor rect near the right side: `new DOMRect(300, 200, 40, 40)` (token right edge at 340, leaving only 160px to the right -- not enough for a 280px+ tooltip)
  - Render `<CharacterTooltip characterId={character.id} anchorRect={anchorRect} onMouseEnter={() => {}} onMouseLeave={() => {}} />`
  - Query the tooltip via `screen.getByRole('tooltip')`
  - Read `tooltip.style.left`
- **Assertions**:
  1. `parseInt(tooltip.style.left)` is less than `anchorRect.left` (300) -- tooltip is positioned to the left of the token, not the right
  2. `parseInt(tooltip.style.left)` is greater than or equal to 8 (MARGIN constant) -- tooltip does not go off the left edge
  3. The tooltip element's `getBoundingClientRect().width` is greater than 0 -- confirming the constraint check used real dimensions, not zeros
- **Justification**: The existing jsdom test "positions tooltip to the left when near viewport right edge" uses `mockViewport(800, 800)` and `createMockRect({ left: 700, right: 740 })`, but the positioning calculation in that case uses the fallback width (300px) since jsdom's `getBoundingClientRect` returns zero. This browser test validates that the flip-to-left logic works with the **real** tooltip width from CSS layout. If the real width differs significantly from the 300px fallback, this test would catch positioning bugs that jsdom tests miss. It also validates that `window.innerWidth` returns the actual browser viewport width (not a mocked value), which feeds into the `calculateTooltipPosition` constraint checks.

---

## Test Grouping

All four tests belong in a single `describe` block:

```
describe('CharacterTooltip - Browser Positioning', () => {
  // Shared beforeEach: reset game store
  // Test 1: browser-environment-is-real-browser
  // Test 2: tooltip-gets-real-dimensions-from-getBoundingClientRect
  // Test 3: tooltip-positions-using-real-dimensions-not-fallback
  // Test 4: tooltip-flips-to-left-in-narrow-viewport
})
```

## What These Tests Do NOT Cover (Intentionally)

The following are already well-covered by jsdom tests in `CharacterTooltip.test.tsx` and would add no value as browser tests:

- **Content rendering** (skill names, action display, section headers) -- DOM content is identical in jsdom and browser
- **ARIA attributes** (`role="tooltip"`, `id` pattern) -- attribute checks work identically in jsdom
- **Hover callbacks** (`onMouseEnter`/`onMouseLeave`) -- event simulation works in jsdom
- **Portal rendering** (tooltip renders outside component tree) -- `createPortal` works in jsdom
- **Collapsible details/summary** -- native element behavior works in jsdom for attribute checks

## Implementation Notes for Coder

1. **Anchor rect construction**: Use `new DOMRect(x, y, width, height)` instead of the `createMockRect` helper. The browser has a native `DOMRect` constructor. The `createMockRect` helper from `tooltip-test-helpers.ts` is designed for jsdom workarounds and should not be needed.

2. **Viewport control**: For the narrow-viewport test, the coder should check if `page` from `@vitest/browser/context` provides `setViewportSize`. If not available directly, an alternative is to render inside a constrained container and rely on `window.innerWidth` already being set by the Playwright viewport. The Vitest Browser Mode Playwright integration typically uses the default Playwright viewport (1280x720) unless configured otherwise. The workspace config can set a default viewport, or the test can use the Playwright `page` API.

3. **Timing**: The `useLayoutEffect` that measures and positions the tooltip runs synchronously after render. However, the test may need to wait for the position state update to propagate. Use `waitFor` from `@testing-library/react` if the positioning is not immediately reflected in the DOM after `render()`.

4. **CSS processing**: The workspace config `extends: './vite.config.ts'` inherits CSS module processing. The tooltip's `min-width: 280px` from `CharacterTooltip.module.css` should be applied. If CSS is not processed (a risk identified in the plan), the `getBoundingClientRect` test would still pass with nonzero dimensions (browser computes layout from content), but the `min-width` assertion (>= 280) would fail -- this serves as an additional validation that CSS is loaded correctly.

5. **Store cleanup**: Use the same pattern as existing jsdom tests -- `useGameStore.getState().actions.initBattle([])` in `beforeEach`. No `mockViewport` needed since the browser has a real viewport.
