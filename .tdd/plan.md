# Implementation Plan: Phase 2 Browser Tests + Zero-Rect Fallback Removal

## Overview

Three work areas:

1. Token hover SVG geometry browser tests
2. BattleViewer tooltip z-index browser tests
3. Zero-rect fallback evaluation and removal

## Decision: Extract `calculateTooltipPosition` and Remove Zero-Rect Fallback

**Decision**: Remove the zero-rect fallback (lines 254-256 of `CharacterTooltip.tsx`) and extract `calculateTooltipPosition` as an exported function for direct unit testing.

**Context**: The fallback (`width > 0 ? rect.width : 300` and `height > 0 ? rect.height : 150`) exists solely because jsdom's `getBoundingClientRect()` returns zeros. It never triggers in production. Phase 1 browser tests already prove real dimensions work. The fallback masks potential bugs by silently substituting assumed values.

**Consequences**:

- jsdom positioning tests in `CharacterTooltip.test.tsx` (lines 273-395) that rely on the fallback will need updating: instead of testing through the rendered component (where jsdom returns zero rects), they test `calculateTooltipPosition` directly with explicit dimension arguments
- Browser tests remain the authority for real positioning behavior
- Simpler production code path with no test-only branches

**Recommend adding to `.docs/decisions/index.md`**: Not a new ADR -- this is a follow-up to ADR-022 which explicitly called out this evaluation.

---

## Area 1: Token Hover SVG Geometry Browser Tests

### New File

`/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.browser.test.tsx`

### Approach

Render full `BattleViewer` with characters placed at known hex positions, hover a token using `userEvent.hover()`, and verify:

1. The token `<g>` element has non-zero `getBoundingClientRect()` dimensions
2. The tooltip appears with correct positioning relative to the token
3. The anchor rect passed to `CharacterTooltip` reflects real SVG geometry

### Test Design (4 tests)

**Test 1: "token SVG element has non-zero bounding rect in real browser"**

- Setup: `initBattle` with a character at `{q: 0, r: 0}` and a target at `{q: 2, r: 0}`
- Render `<BattleViewer />`
- Get token `<g>` via `screen.getByTestId("token-<id>")`
- Assert `getBoundingClientRect()` returns width > 0 and height > 0
- Assert width and height are roughly proportional (token is ~40x46 in SVG coords, but scaled by viewBox)

**Test 2: "hovering token shows tooltip positioned relative to real SVG geometry"**

- Setup: `page.viewport(1280, 720)` for deterministic layout
- `initBattle` with character at `{q: 0, r: 0}` and target at `{q: 2, r: 0}`
- Render `<BattleViewer />`
- `userEvent.hover()` on token
- `await screen.findByRole("tooltip")`
- Wait for positioning via `waitFor`
- Assert tooltip left > token rect.right (placed to the right)
- Assert tooltip is vertically near the token center

**Test 3: "token bounding rect position changes with hex coordinates"**

- Setup: Two characters at different hex positions (`{q: -2, r: 0}` and `{q: 2, r: 0}`)
- Render `<BattleViewer />`
- Get both token elements, compare their `getBoundingClientRect().left` values
- Assert the token at `q: -2` has a smaller `left` than the token at `q: 2` (confirms hex-to-pixel mapping produces real screen positions)

**Test 4: "tooltip anchor rect comes from real SVG getBoundingClientRect"**

- Setup: `page.viewport(1280, 720)`
- Place character at off-center position `{q: 3, r: -1}` and target at `{q: -2, r: 2}`
- Hover the token
- Assert tooltip appears and its position is offset from the token's actual screen position (not default 0,0)
- This confirms the full flow: Token.handleMouseEnter -> getBoundingClientRect -> BattleViewer.handleTokenHover -> CharacterTooltip.anchorRect -> positioning

### Key Implementation Details

- Use `userEvent.setup()` for hover simulation (same as `battle-viewer-tooltip.test.tsx` pattern)
- Use `page.viewport()` for deterministic sizing (same as Phase 1 pattern)
- Use `waitFor` for async positioning (useLayoutEffect propagation)
- Import from `vitest`, `@testing-library/react`, `vitest/browser`
- Import `createCharacter`, `createTarget` from test helpers
- Store setup via `useGameStore.getState().actions`

### Risks and Mitigations

**Risk**: SVG viewBox scaling makes exact pixel assertions fragile.
**Mitigation**: Use relational assertions (left_A < left_B, width > 0) rather than exact pixel values. Only assert approximate relationships.

**Risk**: `userEvent.hover()` on SVG `<g>` elements may not trigger `onMouseEnter` in browser mode.
**Mitigation**: If `userEvent.hover` fails on SVG `<g>`, fall back to `fireEvent.mouseEnter` which directly dispatches the DOM event. The hover simulation just needs to trigger the mouseenter handler.

---

## Area 2: BattleViewer Tooltip Z-Index Browser Tests

### File

Add to the same file: `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.browser.test.tsx`

### Approach

Render `BattleViewer`, trigger tooltip via hover, then use `getComputedStyle()` to verify the real CSS z-index values resolved by the browser's CSS engine (not jsdom's incomplete CSS resolution).

### Test Design (2 tests)

**Test 5: "tooltip z-index is 1000 via real CSS resolution"**

- Setup: `initBattle` with character and target
- Render `<BattleViewer />`
- Hover token, wait for tooltip
- `getComputedStyle(tooltip).zIndex` should be `"1000"`
- This validates that the CSS Module class `.tooltip` with `z-index: 1000` is correctly applied by the browser (unlike jsdom which may not resolve CSS Module values)

**Test 6: "tooltip z-index exceeds all overlay z-indices"**

- Setup: `initBattle` with character and target, advance a tick so overlays render
- Render `<BattleViewer />`
- Hover token, wait for tooltip
- Query overlay elements: `.gridContainer` children with `position: absolute`
- For each overlay, assert `parseInt(getComputedStyle(overlay).zIndex) < parseInt(getComputedStyle(tooltip).zIndex)`
- Specifically verify: WhiffOverlay(5), IntentOverlay(10), DamageOverlay(20) are all below Tooltip(1000)

### Key Implementation Details

- Tooltip is portaled to `document.body` with `position: fixed` -- separate stacking context from `.gridContainer`
- Overlays are `position: absolute` within `.gridContainer` (which has `position: relative`)
- The stacking context separation means the tooltip always paints above the grid container's content; z-index comparison across contexts confirms this

### Risks and Mitigations

**Risk**: Overlay elements might not be present if no game events exist.
**Mitigation**: Test 6 advances a tick (`actions.nextTick()`) to generate intents. If specific overlays still don't render content, query by class name on the container `<svg>` elements rather than by visible content. The CSS is applied to the overlay container regardless of whether it has children.

**Risk**: `getComputedStyle` on overlay `<svg>` elements might return `"auto"` for z-index if the CSS Module class isn't applied.
**Mitigation**: Use `querySelector` with the rendered class name pattern (CSS modules generate `[name]__[local]___[hash]`). Alternatively, query by the structural position within `.gridContainer`.

---

## Area 3: Zero-Rect Fallback Removal

### Files Modified

1. `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` (lines 254-256)
2. `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.test.tsx` (positioning tests, lines 273-395)

### Step 1: Export `calculateTooltipPosition`

In `CharacterTooltip.tsx`:

- Add `export` to the existing `calculateTooltipPosition` function (line 39)
- This makes it importable for direct unit testing

### Step 2: Remove the Zero-Rect Fallback

In `CharacterTooltip.tsx`, replace lines 253-257:

```typescript
// BEFORE (lines 253-257):
const rect = tooltipRef.current.getBoundingClientRect();
// Use actual dimensions if available, otherwise assume defaults (for test environment)
const width = rect.width > 0 ? rect.width : 300;
const height = rect.height > 0 ? rect.height : 150;
const newPosition = calculateTooltipPosition(anchorRect, width, height);

// AFTER:
const rect = tooltipRef.current.getBoundingClientRect();
const newPosition = calculateTooltipPosition(
  anchorRect,
  rect.width,
  rect.height,
);
```

### Step 3: Update jsdom Positioning Tests

The 5 positioning tests in `CharacterTooltip.test.tsx` (lines 273-395) currently test via rendered component. With the fallback removed, they would get `width=0, height=0` in jsdom, producing incorrect positioning.

**Strategy**: Convert these tests to directly call `calculateTooltipPosition()` with explicit arguments:

1. **"positions-right-of-token-by-default"** -- Call `calculateTooltipPosition(anchorRect, 300, 200)` and assert `left === anchorRect.right + 12`
2. **"positions-left-when-near-right-edge"** -- Call with viewport 800, anchor at left:700, and assert `left < anchorRect.left`
3. **"fallback-position-when-both-sides-constrained"** -- Call with viewport 400 and assert `left >= 8`
4. **"clamps-to-viewport-bottom"** -- Call with anchor at top:700 and assert `top < viewportHeight`
5. **"clamps-to-viewport-top"** -- Call with anchor at top:20 and assert `top >= 8`

These tests become pure function tests -- faster, simpler, no rendering needed. They test the positioning algorithm without depending on jsdom's broken `getBoundingClientRect`.

The remaining jsdom tests (content rendering, ARIA, portal, callbacks) are unaffected since they don't depend on tooltip dimensions.

### Step 4: Add Browser Test for Non-Fallback Path

Already covered by Phase 1 Test 3 ("tooltip positions using real dimensions, not fallback") in `CharacterTooltip.browser.test.tsx`. After fallback removal, this test simply confirms the production code path works with real dimensions. No changes needed.

### Risks and Mitigations

**Risk**: Some jsdom test might indirectly depend on the fallback positioning (e.g., checking `style.left` values).
**Mitigation**: After removal, run `npm run test:unit` to catch any failures. Convert any broken tests to use `calculateTooltipPosition` directly.

**Risk**: The `useLayoutEffect` in jsdom might set `position = {0, 0}` after removal (since `width=0, height=0` produces different results from `calculateTooltipPosition`).
**Mitigation**: The content/ARIA/portal tests don't assert on position values, so they remain unaffected. Only the 5 positioning tests need conversion.

---

## Execution Order

1. **Create browser test file** (`BattleViewer.browser.test.tsx`) with Tests 1-6
2. **Export `calculateTooltipPosition`** from `CharacterTooltip.tsx`
3. **Remove zero-rect fallback** from `CharacterTooltip.tsx`
4. **Convert jsdom positioning tests** to direct `calculateTooltipPosition` calls
5. **Run all tests** (`npm run test`) to verify green
6. **Run quality gates** (lint, type-check, build)

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- Character Tooltip section specifies positioning behavior (right-preferred, left-fallback, viewport clamping). Tests validate these behaviors.
- [x] Approach consistent with `.docs/architecture.md` -- Testing Guidelines section specifies browser tests for `getBoundingClientRect` and `getComputedStyle` (ADR-022). Uses `.browser.test.tsx` convention.
- [x] Patterns follow `.docs/patterns/index.md` -- Browser Test Convention (ADR-022), Portal Tooltip Positioning pattern followed.
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-022 explicitly calls out zero-rect fallback evaluation as follow-up work.

## Files Summary

| File                                                        | Action                                    |
| ----------------------------------------------------------- | ----------------------------------------- |
| `src/components/BattleViewer/BattleViewer.browser.test.tsx` | CREATE (6 tests)                          |
| `src/components/BattleViewer/CharacterTooltip.tsx`          | MODIFY (export function, remove fallback) |
| `src/components/BattleViewer/CharacterTooltip.test.tsx`     | MODIFY (convert 5 positioning tests)      |
