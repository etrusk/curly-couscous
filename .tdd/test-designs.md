# Test Designs: Phase 2 Browser Tests + Converted Positioning Tests

## Review Status: APPROVED (with minor adjustments)

**Reviewed by**: TEST_DESIGN_REVIEW phase, 2026-02-09

**Verdict**: Test designs are well-structured with correct math, good coverage of plan requirements, and proper alignment with the spec. All 11 test cases cover the three areas specified in the plan. Minor adjustments applied:

1. **Test 6**: Added `actions.nextTick()` to setup (was in plan but missing from design). Relaxed assertion #3 from "at least 2 of {5, 10, 20}" to "at least 1 of {5, 10, 20}" since overlay rendering depends on game state.
2. **Test 4**: Widened tolerance on assertion #3 from 5px to 15px. The anchor rect captured inside `handleMouseEnter` may differ slightly from external `getBoundingClientRect()` due to SVG reflow timing.
3. **Test 3**: Added explicit `slotPosition` overrides to setup for clarity.
4. **Area 3 math**: All five positioning test calculations verified against `calculateTooltipPosition` source code -- all correct.

**No missing edge cases identified** -- the 5 unit tests cover all 3 horizontal branches and both vertical clamp branches. Browser tests cover the integration flow at center, off-center, and multi-token positions.

**No redundancy with existing tests** -- Phase 1 browser tests use synthetic DOMRect anchors; these Phase 2 tests use real SVG hover flow. The existing jsdom z-index test at `battle-viewer-tooltip.test.tsx:213` is intentionally superseded by browser Test 5.

---

## Overview

Three test areas covering 11 total test cases:

- **Area 1**: Token hover SVG geometry (4 browser tests) -- new file
- **Area 2**: Tooltip z-index stacking (2 browser tests) -- same new file
- **Area 3**: Converted positioning tests (5 unit tests) -- modify existing file

---

## Shared Setup Patterns

### Browser Test Setup (Areas 1 and 2)

**File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`

**Imports**:

- `describe`, `it`, `expect`, `beforeEach` from `vitest`
- `render`, `screen`, `waitFor` from `@testing-library/react`
- `userEvent` from `@testing-library/user-event`
- `page` from `vitest/browser`
- `BattleViewer` from `./BattleViewer`
- `useGameStore` from `../../stores/gameStore`
- `createCharacter`, `createTarget` from `../RuleEvaluations/rule-evaluations-test-helpers`

**beforeEach**:

- Reset store: `actions.initBattle([])`
- Deselect: `actions.selectCharacter(null)`

**Patterns** (matching Phase 1 `CharacterTooltip.browser.test.tsx`):

- Use `await page.viewport(width, height)` for deterministic layout
- Use `userEvent.setup()` then `user.hover()` for token interactions
- Use `await screen.findByRole("tooltip")` for tooltip appearance
- Use `await waitFor()` for async positioning updates
- Use relational assertions (greater-than, less-than) not exact pixel values for SVG geometry
- Token elements queried via `screen.getByTestId("token-<id>")`

### Unit Test Setup (Area 3)

**File**: `src/components/BattleViewer/CharacterTooltip.test.tsx`

**Change pattern**: The 5 existing positioning tests in the `"CharacterTooltip - Positioning"` describe block currently render a full `<CharacterTooltip>` component and check `tooltip.style.left`/`tooltip.style.top`. After `calculateTooltipPosition` is exported from `CharacterTooltip.tsx`, these tests will be converted to call the pure function directly with explicit `tooltipWidth` and `tooltipHeight` arguments, removing the dependency on jsdom's broken `getBoundingClientRect()`.

**New imports** (added to existing file):

- `calculateTooltipPosition` from `./CharacterTooltip`

**Removed dependencies for positioning tests**: No longer need `render`, `screen`, `createCharacter`, `useGameStore`, or `createMockRect` in the positioning describe block. The `mockViewport` helper is still needed to set `window.innerWidth`/`window.innerHeight` since `calculateTooltipPosition` reads these globals.

---

## Area 1: Token Hover SVG Geometry (Browser Tests)

### Test: token-svg-element-has-non-zero-bounding-rect

- **File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`
- **Type**: browser (integration)
- **Verifies**: SVG `<g>` token elements have real, non-zero dimensions from `getBoundingClientRect()` in a real browser, unlike jsdom which always returns zeros.
- **Setup**:
  - `await page.viewport(1280, 720)` for deterministic container sizing
  - Create character at `{q: 0, r: 0}` with `createCharacter({ id: "char-1", position: { q: 0, r: 0 } })`
  - Create target at `{q: 2, r: 0}` with `createCharacter({ id: "enemy-1", faction: "enemy", position: { q: 2, r: 0 }, skills: [] })`
  - Initialize store: `actions.initBattle([character, target])`
  - Render `<BattleViewer />`
- **Actions**:
  1. Query the token element: `screen.getByTestId("token-char-1")`
  2. Call `getBoundingClientRect()` on the token element
- **Assertions**:
  1. `rect.width > 0` -- token has real horizontal extent
  2. `rect.height > 0` -- token has real vertical extent
  3. `rect.width` and `rect.height` are within a plausible range (between 5 and 200 pixels) -- not just nonzero but reasonable for an SVG token scaled from 40x46 SVG units through viewBox
  4. `rect.width` and `rect.height` are roughly similar (ratio between 0.5 and 2.0) -- token shape is roughly square, accounting for HP bar adding some height
- **Justification**: This is the foundational assertion for all hover-based tests. If SVG `<g>` elements do not produce real bounding rects in the browser test environment, the entire hover-to-tooltip flow is untestable. This test catches regressions in browser mode configuration or SVG rendering.

---

### Test: hovering-token-shows-tooltip-positioned-near-token

- **File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`
- **Type**: browser (integration)
- **Verifies**: The full hover-to-tooltip flow works with real SVG geometry -- hovering a token triggers `handleMouseEnter`, passes a real `DOMRect` as `anchorRect`, and the tooltip positions itself relative to the token's actual screen location.
- **Setup**:
  - `await page.viewport(1280, 720)` for wide viewport (tooltip fits right of token)
  - Create character at `{q: 0, r: 0}` with id `"char-1"`
  - Create target at `{q: 2, r: 0}` (enemy, so character has valid skills to show)
  - Initialize store, render `<BattleViewer />`
  - `const user = userEvent.setup()`
- **Actions**:
  1. Get token element: `screen.getByTestId("token-char-1")`
  2. Get the token's bounding rect before hover (for position reference): `const tokenRect = token.getBoundingClientRect()`
  3. `await user.hover(token)` -- triggers `Token.handleMouseEnter` which calls `e.currentTarget.getBoundingClientRect()`
  4. Wait for tooltip: `const tooltip = await screen.findByRole("tooltip")`
  5. Wait for positioning: `await waitFor(() => { expect(parseInt(tooltip.style.left)).toBeGreaterThan(0); })`
  6. Read tooltip position: `parseInt(tooltip.style.left)` and `parseInt(tooltip.style.top)`
- **Assertions**:
  1. Tooltip appears in the document (findByRole succeeds)
  2. `tooltipLeft > tokenRect.right` -- tooltip is positioned to the right of the token (OFFSET = 12px gap)
  3. `tooltipLeft < tokenRect.right + 50` -- tooltip is reasonably close to the token, not at an absurd position
  4. `tooltipTop` is within 200px of `tokenRect.top + tokenRect.height / 2` -- tooltip is vertically near the token center (allowing for tooltip height offset)
- **Justification**: Phase 1 browser tests validated tooltip positioning with a synthetic `new DOMRect()` anchor. This test validates the full flow where the anchor rect comes from an actual SVG element's `getBoundingClientRect()`. This catches bugs in the `Token.handleMouseEnter` -> `BattleViewer.handleTokenHover` -> `CharacterTooltip.anchorRect` pipeline that synthetic DOMRects skip.
- **Fallback note**: If `userEvent.hover()` does not trigger `onMouseEnter` on SVG `<g>` elements in browser mode, fall back to `fireEvent.mouseEnter(token)` which directly dispatches the DOM event. The plan identifies this as a known risk.

---

### Test: token-bounding-rects-differ-by-hex-position

- **File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`
- **Type**: browser (integration)
- **Verifies**: Tokens placed at different hex coordinates have different screen positions, confirming that the hex-to-pixel coordinate mapping (`hexToPixel`) produces real, distinct screen positions through SVG viewBox scaling.
- **Setup**:
  - `await page.viewport(1280, 720)`
  - Create character A at `{q: -2, r: 0}` with `createCharacter({ id: "char-left", faction: "friendly", position: { q: -2, r: 0 }, slotPosition: 1 })`
  - Create character B at `{q: 2, r: 0}` with `createCharacter({ id: "char-right", faction: "enemy", position: { q: 2, r: 0 }, slotPosition: 2, skills: [] })`
  - Initialize store, render `<BattleViewer />`
- **Actions**:
  1. Get both token elements: `screen.getByTestId("token-char-left")` and `screen.getByTestId("token-char-right")`
  2. Call `getBoundingClientRect()` on each
- **Assertions**:
  1. `rectLeft.left < rectRight.left` -- the token at q:-2 is to the left of the token at q:2 (hex q-axis maps to horizontal position)
  2. `Math.abs(rectLeft.top - rectRight.top) < 5` -- both tokens are on the same row (r=0 for both), so vertical positions should be nearly identical
  3. `rectRight.left - rectLeft.left > 20` -- there is meaningful horizontal separation (not just a 1px rounding difference)
- **Justification**: Verifies that SVG viewBox-to-screen coordinate mapping preserves hex spatial relationships. A bug in viewBox computation, hex-to-pixel math, or SVG scaling could cause tokens to stack on top of each other or invert positions. This is only testable with real browser layout -- jsdom's zero-rect returns would make both positions identical (0, 0).

---

### Test: full-hover-to-tooltip-flow-with-off-center-token

- **File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`
- **Type**: browser (integration)
- **Verifies**: The complete hover-to-tooltip pipeline works when the token is at a non-origin hex position, confirming that the anchor rect passed through the chain reflects the token's real screen location (not a default 0,0).
- **Setup**:
  - `await page.viewport(1280, 720)`
  - Create character at `{q: 3, r: -1}` with id `"char-offset"`, faction `"friendly"`, slotPosition 1
  - Create target at `{q: -2, r: 2}` with id `"enemy-far"`, faction `"enemy"`, slotPosition 2, skills `[]`
  - Initialize store, render `<BattleViewer />`
  - `const user = userEvent.setup()`
- **Actions**:
  1. Get the token: `screen.getByTestId("token-char-offset")`
  2. Read the token's screen position: `const tokenRect = token.getBoundingClientRect()`
  3. `await user.hover(token)`
  4. Wait for tooltip: `const tooltip = await screen.findByRole("tooltip")`
  5. Wait for positioning to settle: `await waitFor(() => { expect(parseInt(tooltip.style.left)).toBeGreaterThan(0); })`
  6. Read tooltip position
- **Assertions**:
  1. `tokenRect.left > 0` and `tokenRect.top > 0` -- off-center token is not at the default origin
  2. Tooltip `style.left` is not `"0px"` -- positioning used a real anchor, not a zero DOMRect
  3. `parseInt(tooltip.style.left)` is approximately `tokenRect.right + 12` (within a tolerance of 15px) -- confirms the anchor rect came from the token's actual getBoundingClientRect, not a cached or default value. Tolerance is wider than Area 3 unit tests because the external `getBoundingClientRect()` call and the one inside `handleMouseEnter` may see slightly different rects due to SVG reflow timing.
  4. Tooltip content contains the character letter (confirming correct character association)
- **Justification**: Tests 2 and 3 use tokens near the grid center. This test places the token at an off-center position to verify the full chain handles non-trivial coordinates. The `{q: 3, r: -1}` position produces distinct hex-to-pixel coordinates, catching bugs where the anchor rect is accidentally zeroed, cached from a previous hover, or hardcoded.

---

## Area 2: Tooltip Z-Index Stacking (Browser Tests)

### Test: tooltip-z-index-is-1000-via-real-css-resolution

- **File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`
- **Type**: browser (integration)
- **Verifies**: The tooltip's computed z-index resolves to exactly 1000 when CSS Modules are processed by a real browser engine, validating that the `.tooltip` class from `CharacterTooltip.module.css` is correctly applied.
- **Setup**:
  - Create character with id `"char-1"` at `{q: 0, r: 0}`
  - Create target at `{q: 1, r: 0}`
  - Initialize store, render `<BattleViewer />`
  - `const user = userEvent.setup()`
- **Actions**:
  1. Hover token: `await user.hover(screen.getByTestId("token-char-1"))`
  2. Wait for tooltip: `const tooltip = await screen.findByRole("tooltip")`
  3. Read computed style: `window.getComputedStyle(tooltip).zIndex`
- **Assertions**:
  1. `getComputedStyle(tooltip).zIndex === "1000"` -- exact value, not just "greater than"
  2. `getComputedStyle(tooltip).position === "fixed"` -- confirms the tooltip is in the root stacking context (portaled to document.body), not within the `.gridContainer` stacking context
- **Justification**: The existing jsdom test at `battle-viewer-tooltip.test.tsx:213-231` checks `getComputedStyle(tooltip).zIndex >= 1000`, but jsdom's CSS Module resolution is incomplete and may return values from inline styles or partial processing rather than the actual CSS rule. A real browser test validates that the CSS Module class `.tooltip` with `z-index: 1000` is properly loaded, hashed, applied, and resolved. This is the definitive test for CSS Module z-index behavior.

---

### Test: tooltip-z-index-exceeds-all-overlay-z-indices

- **File**: `src/components/BattleViewer/BattleViewer.browser.test.tsx`
- **Type**: browser (integration)
- **Verifies**: The tooltip's z-index (1000) is strictly greater than all overlay z-indices (WhiffOverlay: 5, IntentOverlay: 10, DamageOverlay: 20), ensuring the tooltip always renders visually on top of battle visualizations.
- **Setup**:
  - Create character with id `"char-1"` at `{q: 0, r: 0}`
  - Create target at `{q: 1, r: 0}`
  - Initialize store: `actions.initBattle([character, target])`
  - Advance a tick to generate intent/overlay data: `actions.nextTick()`
  - Render `<BattleViewer />`
  - `const user = userEvent.setup()`
- **Actions**:
  1. Hover token: `await user.hover(screen.getByTestId("token-char-1"))`
  2. Wait for tooltip: `const tooltip = await screen.findByRole("tooltip")`
  3. Get tooltip z-index: `parseInt(window.getComputedStyle(tooltip).zIndex)`
  4. Query overlay elements within `.gridContainer`:
     - The `.gridContainer` div is the parent of all overlays. Use `document.querySelector` with structural selectors or query by the SVG elements that are direct children of `.gridContainer` (after the main Grid SVG).
     - Overlays are SVG elements rendered after the Grid SVG, with `position: absolute`. Query all absolutely-positioned children of the grid container div: loop through `gridContainer.children` and check `getComputedStyle(child).position === "absolute"`.
  5. For each overlay element, read `getComputedStyle(overlay).zIndex`
- **Assertions**:
  1. At least one overlay element is found (test validity check -- if no overlays are found, the test is not exercising anything meaningful)
  2. For every overlay element: `parseInt(getComputedStyle(overlay).zIndex) < tooltipZIndex`
  3. Specifically validate known z-index values are present among the overlays: the set of overlay z-indices should include at least 1 value from {5, 10, 20} (some overlays may conditionally return null if no game events exist for them; the `nextTick()` in setup ensures at least intents are generated)
  4. `tooltipZIndex === 1000` (cross-check with Test 5)
- **Justification**: While Test 5 validates the tooltip's absolute z-index value, this test validates the relative ordering. A future code change could add a new overlay with z-index 1500, which would break tooltip visibility. By asserting that the tooltip z-index exceeds ALL overlay z-indices found in the rendered DOM, this test catches such regressions. The comparison across stacking contexts (fixed vs absolute-within-relative) is particularly important and can only be validated in a real browser.
- **Note on stacking contexts**: The tooltip uses `position: fixed` portaled to `document.body`, while overlays use `position: absolute` within `.gridContainer` (which has `position: relative`). In CSS, a `position: fixed` element with `z-index: 1000` in the root stacking context will paint above elements in a child stacking context with lower z-indices. This test confirms that the CSS design achieves the intended visual layering.

---

## Area 3: Converted Positioning Tests (Unit Tests)

These 5 tests replace the existing component-render positioning tests in `CharacterTooltip.test.tsx`. They call `calculateTooltipPosition()` directly as a pure function, with explicit `tooltipWidth` and `tooltipHeight` parameters, removing the dependency on jsdom's zero-returning `getBoundingClientRect()`.

The `describe` block header changes from rendering components to calling the pure function. The `beforeEach` only needs `mockViewport` setup (no store init needed since no components are rendered).

### Test: positions-right-of-anchor-by-default

- **File**: `src/components/BattleViewer/CharacterTooltip.test.tsx`
- **Type**: unit
- **Verifies**: `calculateTooltipPosition` places the tooltip to the right of the anchor rect with a 12px offset when there is sufficient viewport space.
- **Setup**:
  - `mockViewport(1000, 800)` -- wide viewport
  - `const anchorRect = new DOMRect(200, 200, 40, 40)` -- anchor at (200,200), 40x40
  - `const tooltipWidth = 300`
  - `const tooltipHeight = 200`
- **Actions**:
  1. Call `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)`
- **Assertions**:
  1. `result.left === anchorRect.right + 12` -- i.e., `result.left === 252`. Right-side placement with OFFSET = 12.
  2. `result.top === anchorRect.top + anchorRect.height / 2 - tooltipHeight / 2` -- i.e., `result.top === 220 - 100 === 120`. Vertically centered on the anchor.
- **Justification**: This is the primary "happy path" test for the positioning algorithm. It validates right-side preference and vertical centering with explicit dimensions. Previously this test rendered a component and implicitly used the zero-rect fallback (width=300, height=150); now it passes dimensions explicitly, producing deterministic and verifiable results.

---

### Test: positions-left-when-near-right-viewport-edge

- **File**: `src/components/BattleViewer/CharacterTooltip.test.tsx`
- **Type**: unit
- **Verifies**: `calculateTooltipPosition` flips the tooltip to the left side of the anchor when the right side would overflow the viewport.
- **Setup**:
  - `mockViewport(800, 800)` -- narrower viewport
  - `const anchorRect = new DOMRect(700, 200, 40, 40)` -- anchor near the right edge (right = 740)
  - `const tooltipWidth = 300`
  - `const tooltipHeight = 200`
- **Actions**:
  1. Call `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)`
- **Assertions**:
  1. `result.left === anchorRect.left - 12 - tooltipWidth` -- i.e., `result.left === 700 - 12 - 300 === 388`. Left-side placement.
  2. `result.left < anchorRect.left` -- tooltip is to the left of the anchor.
  3. `result.left > 8` -- tooltip does not violate the MARGIN (8px) on the left edge.
- **Justification**: Validates the left-side fallback logic. The right-side check: `740 + 12 + 300 + 8 = 1060 > 800` fails. The left-side check: `700 - 12 - 300 = 388 > 8` passes. Previously, this test used the zero-rect fallback's assumed 300px width, which coincidentally matched. Now it uses an explicit 300px, making the test intention transparent.

---

### Test: fallback-position-when-both-sides-constrained

- **File**: `src/components/BattleViewer/CharacterTooltip.test.tsx`
- **Type**: unit
- **Verifies**: `calculateTooltipPosition` uses the fallback alignment (left edge of anchor, clamped to margin) when neither right nor left placement fits.
- **Setup**:
  - `mockViewport(400, 800)` -- very narrow viewport
  - `const anchorRect = new DOMRect(150, 200, 40, 40)` -- anchor in the middle of a narrow viewport
  - `const tooltipWidth = 300`
  - `const tooltipHeight = 200`
- **Actions**:
  1. Call `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)`
- **Assertions**:
  1. `result.left >= 8` -- respects the MARGIN minimum
  2. `result.left === Math.max(8, anchorRect.left)` -- i.e., `result.left === Math.max(8, 150) === 150`. Uses the fallback: `Math.max(MARGIN, anchorRect.left)`.
  3. Right-side check confirmation: `190 + 12 + 300 + 8 = 510 > 400` fails.
  4. Left-side check confirmation: `150 - 12 - 300 = -162 < 8` fails. Both sides are constrained.
- **Justification**: Tests the third branch of the horizontal positioning logic -- the fallback that triggers when the tooltip cannot fit on either side. This is a real scenario for narrow viewports or very wide tooltips. The explicit width/height make the branch conditions transparent.

---

### Test: clamps-to-viewport-bottom

- **File**: `src/components/BattleViewer/CharacterTooltip.test.tsx`
- **Type**: unit
- **Verifies**: `calculateTooltipPosition` clamps the tooltip top position so it does not overflow the bottom viewport edge.
- **Setup**:
  - `mockViewport(1000, 800)` -- standard viewport
  - `const anchorRect = new DOMRect(200, 700, 40, 40)` -- anchor near the bottom (top=700, bottom=740)
  - `const tooltipWidth = 300`
  - `const tooltipHeight = 200`
- **Actions**:
  1. Call `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)`
- **Assertions**:
  1. `result.top + tooltipHeight + 8 <= 800` -- tooltip bottom edge (top + height) plus margin fits within viewport height.
  2. `result.top === 800 - 200 - 8` -- i.e., `result.top === 592`. The clamping formula: `viewportHeight - tooltipHeight - MARGIN`.
  3. Unclamped value would be: `700 + 20 - 100 = 620`, and `620 + 200 + 8 = 828 > 800`, so clamping activates.
- **Justification**: Validates the bottom-clamping logic. Without clamping, the tooltip would extend below the viewport, making content inaccessible. The previous test used the fallback's assumed 150px height; now the explicit 200px height makes the clamping trigger condition and expected result deterministic.

---

### Test: clamps-to-viewport-top

- **File**: `src/components/BattleViewer/CharacterTooltip.test.tsx`
- **Type**: unit
- **Verifies**: `calculateTooltipPosition` clamps the tooltip top position to the MARGIN minimum when the anchor is near the top of the viewport.
- **Setup**:
  - `mockViewport(1000, 800)` -- standard viewport
  - `const anchorRect = new DOMRect(200, 20, 40, 40)` -- anchor near the top (top=20, bottom=60)
  - `const tooltipWidth = 300`
  - `const tooltipHeight = 200`
- **Actions**:
  1. Call `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)`
- **Assertions**:
  1. `result.top >= 8` -- tooltip does not go above MARGIN
  2. `result.top === 8` -- exact value. Unclamped: `20 + 20 - 100 = -60`, which is below MARGIN (8), so clamping sets `top = 8`.
- **Justification**: Validates the top-clamping logic. When the anchor is near the viewport top and the tooltip height exceeds the available space above-center, the tooltip top is clamped to MARGIN. This prevents the tooltip from being partially hidden above the viewport. The explicit 200px height guarantees the unclamped value is negative, triggering the clamp.

---

## Summary Table

| #   | Test Name                                          | File                          | Type    | Area         |
| --- | -------------------------------------------------- | ----------------------------- | ------- | ------------ |
| 1   | token-svg-element-has-non-zero-bounding-rect       | BattleViewer.browser.test.tsx | browser | SVG Geometry |
| 2   | hovering-token-shows-tooltip-positioned-near-token | BattleViewer.browser.test.tsx | browser | SVG Geometry |
| 3   | token-bounding-rects-differ-by-hex-position        | BattleViewer.browser.test.tsx | browser | SVG Geometry |
| 4   | full-hover-to-tooltip-flow-with-off-center-token   | BattleViewer.browser.test.tsx | browser | SVG Geometry |
| 5   | tooltip-z-index-is-1000-via-real-css-resolution    | BattleViewer.browser.test.tsx | browser | Z-Index      |
| 6   | tooltip-z-index-exceeds-all-overlay-z-indices      | BattleViewer.browser.test.tsx | browser | Z-Index      |
| 7   | positions-right-of-anchor-by-default               | CharacterTooltip.test.tsx     | unit    | Positioning  |
| 8   | positions-left-when-near-right-viewport-edge       | CharacterTooltip.test.tsx     | unit    | Positioning  |
| 9   | fallback-position-when-both-sides-constrained      | CharacterTooltip.test.tsx     | unit    | Positioning  |
| 10  | clamps-to-viewport-bottom                          | CharacterTooltip.test.tsx     | unit    | Positioning  |
| 11  | clamps-to-viewport-top                             | CharacterTooltip.test.tsx     | unit    | Positioning  |

## Implementation Notes

### BattleViewer.browser.test.tsx Structure

```
describe("BattleViewer - Token SVG Geometry (Browser)", () => {
  // Tests 1-4
});

describe("BattleViewer - Tooltip Z-Index Stacking (Browser)", () => {
  // Tests 5-6
});
```

### CharacterTooltip.test.tsx Changes

The existing `describe("CharacterTooltip - Positioning")` block (lines 273-403) is modified:

- Remove component rendering from each test
- Remove `createCharacter`, `useGameStore` usage from these 5 tests
- Import `calculateTooltipPosition` from `./CharacterTooltip`
- Use `new DOMRect(x, y, w, h)` directly (or keep using `createMockRect`)
- Call `calculateTooltipPosition(anchorRect, width, height)` and assert on the returned `{ top, left }` object
- The `beforeEach` for this describe block still calls `mockViewport` since the function reads `window.innerWidth`/`window.innerHeight`
- Other describe blocks (Content Rendering, Portal, Accessibility, Hover Callbacks) are unchanged

### Prerequisite Code Changes (for Coder)

Before these tests can pass, the coder must:

1. Add `export` to `calculateTooltipPosition` in `CharacterTooltip.tsx` (line 39)
2. Remove the zero-rect fallback (lines 254-256) -- replace with direct `rect.width`/`rect.height` usage
3. These are implementation changes specified in the plan, not test design concerns

### Risk Mitigations

- **SVG hover events**: If `userEvent.hover()` does not trigger `onMouseEnter` on SVG `<g>` elements, tests 2 and 4 should fall back to `fireEvent.mouseEnter()` which directly dispatches the DOM event
- **Exact pixel values**: All browser test assertions use relational comparisons (greater-than, less-than, within-tolerance) rather than exact pixel values, since SVG viewBox scaling makes exact values viewport-dependent
- **Overlay presence**: Test 6 asserts at least one overlay is found before comparing z-indices, preventing a false pass if the query selector matches nothing
- **Stacking context nuance**: Tests 5 and 6 note the tooltip is `position: fixed` on `document.body` while overlays are `position: absolute` within `.gridContainer`. The z-index comparison is valid because both stacking contexts participate in the same root stacking context painting order
