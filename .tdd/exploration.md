# Exploration Findings

## Task Understanding

Phase 2 browser tests need to cover two new areas:

1. **Token hover SVG geometry** -- Verify that hovering an SVG `<g>` token element produces a real, non-zero `DOMRect` from `getBoundingClientRect()`, which is then passed to `CharacterTooltip` as `anchorRect`. In jsdom, SVG `<g>` elements always return zero-dimension rects.

2. **BattleViewer tooltip z-index** -- Verify the tooltip (z-index: 1000) actually renders visually above all overlays (z-index: 5/10/20) using `getComputedStyle()` in a real browser. The existing jsdom test at `battle-viewer-tooltip.test.tsx:213` already tests this, but jsdom `getComputedStyle` does not resolve CSS Module values reliably.

3. **CharacterTooltip zero-rect fallback evaluation** -- Determine if the fallback (`width > 0 ? width : 300` and `height > 0 ? height : 150`) at lines 255-256 of `CharacterTooltip.tsx` can be removed now that browser tests validate real positioning.

## Relevant Files

### Core Components

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` -- SVG token component. Renders as `<g transform="translate(cx-20, cy-20)">` containing circle/diamond shape, letter text, and HP bar. The `handleMouseEnter` (line 85-88) calls `e.currentTarget.getBoundingClientRect()` on the `<g>` element and passes it to `onMouseEnter` callback.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx` -- Renders SVG grid with two-pass rendering. Pass 1: hex cells. Pass 2: all tokens in a wrapping `<g>`. Tokens receive `onTokenHover`/`onTokenLeave` callbacks.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx` -- Container orchestrating Grid + overlays + CharacterTooltip. `handleTokenHover` (line 70) stores `{characterId, anchorRect}` as `hoverState`. Passes `hoverState.anchorRect` to `CharacterTooltip`.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` -- Portal-rendered tooltip using `anchorRect` for positioning. Contains the zero-rect fallback at lines 254-256.

### CSS / Z-Index Stack

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.module.css` -- `z-index: 1000`, `position: fixed`, `min-width: 280px`, `max-width: 320px`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.module.css` -- `z-index: 5`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.module.css` -- `z-index: 10`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLineOverlay.module.css` -- No z-index (just `position: absolute`)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.module.css` -- `z-index: 20`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.module.css` -- `.gridContainer` has `position: relative` (establishes stacking context for overlays)

### Existing Tests

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.browser.test.tsx` -- Phase 1 browser tests (4 tests): real browser validation, real dimensions, positioning with real dims, left-side flip in narrow viewport
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.test.tsx` -- jsdom unit tests for tooltip content, ARIA, callbacks, portal, positioning logic with mocked rects
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.test.tsx` -- Integration tests including z-index test (line 213) that uses `getComputedStyle` -- this test already passes in jsdom but may not reflect real CSS resolution
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.test.tsx` -- Unit tests for Grid, BattleViewer, token z-ordering (SVG document order), deselection

### Test Infrastructure

- `/home/bob/Projects/auto-battler/vite.config.ts` -- Two-project workspace: `unit` (jsdom, `*.test.{ts,tsx}`, excludes `*.browser.test.*`) and `browser` (Playwright/Chromium, `*.browser.test.{ts,tsx}`)
- `/home/bob/Projects/auto-battler/src/test/setup.browser.ts` -- Minimal browser setup (cleanup only, no matchMedia mock)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` -- Shared helpers: `createCharacter()`, `createTarget()`, `createAttackAction()`, etc. Used by Phase 1 browser tests.

### Documentation

- `/home/bob/Projects/auto-battler/.docs/decisions/adr-022-vitest-browser-mode.md` -- Browser mode rationale, file convention, follow-up note about zero-rect fallback
- `/home/bob/Projects/auto-battler/.docs/patterns/portal-tooltip-positioning.md` -- Smart positioning algorithm pattern

## Existing Patterns

### Phase 1 Browser Test Pattern (from CharacterTooltip.browser.test.tsx)

- **Imports**: `vitest` for describe/it/expect, `@testing-library/react` for render/screen/waitFor, `vitest/browser` for `page` (viewport control)
- **Store setup**: `beforeEach` resets via `actions.initBattle([])` and `actions.selectCharacter(null)`
- **Character setup**: Uses `createCharacter()` and `createTarget()` from test helpers, then `actions.initBattle([character, target])` to populate store
- **Viewport control**: `await page.viewport(1280, 720)` to set explicit viewport size
- **Anchor simulation**: Uses `new DOMRect(x, y, w, h)` to provide anchor position (does NOT actually hover a token)
- **Async positioning**: Uses `await waitFor(() => { ... })` for `useLayoutEffect` position updates
- **Assertions on style**: `parseInt(tooltip.style.left)`, `tooltip.getBoundingClientRect()` for real dimensions
- **No tooltip content duplication**: Browser tests intentionally avoid duplicating content/ARIA tests from jsdom suite

### SVG Token Geometry

- Token `<g>` is positioned at `translate(cx-20, cy-20)` where cx/cy come from `hexToPixel(position, hexSize)`
- `hexToPixel({q,r}, hexSize)` returns `{ x: hexSize * (sqrt(3)*q + sqrt(3)/2*r), y: hexSize * (3/2)*r }`
- TOKEN_SIZE = 40px (internal coordinates 0..40), TOKEN_RADIUS = 20px
- The `<g>` contains: shape (circle r=18 or diamond path), text label, HP bar (width 40, height 4, at y=42)
- For `getBoundingClientRect()` on the `<g>`, the browser computes the bounding box of ALL child elements in screen coordinates, accounting for SVG viewBox scaling

### Z-Index Hierarchy

The tooltip uses `position: fixed` (portaled to `document.body`), so it is NOT in the `.gridContainer` stacking context. The overlays are `position: absolute` within `.gridContainer`. This means:

- Overlays stack relative to each other: WhiffOverlay(5) < IntentOverlay(10) < DamageOverlay(20)
- Tooltip at z-index 1000 with `position: fixed` on `document.body` should always be above the `.gridContainer` content

## Dependencies

- `vitest/browser` `page` API for viewport control
- `@testing-library/react` render/screen/waitFor (same API as unit tests)
- Playwright + Chromium runtime
- Test helpers from `rule-evaluations-test-helpers.ts`
- `useGameStore` for store initialization

## Constraints Discovered

### SVG getBoundingClientRect Behavior

- In a real browser, `getBoundingClientRect()` on an SVG `<g>` element returns the tight bounding box of all child elements, transformed to screen coordinates
- The bounding box accounts for SVG `viewBox` scaling (the SVG might render at a different pixel size than the viewBox dimensions)
- For a token at `{q:0, r:0}`, hexToPixel returns `{x:0, y:0}`, so the `<g>` transform would be `translate(-20, -20)`. The actual screen position depends on the SVG's viewBox-to-pixel mapping
- Phase 2 token hover tests will need to render a full `<Grid>` or `<BattleViewer>` (not just a standalone `<Token>`) to get meaningful geometry, since the SVG viewBox scaling matters

### Tooltip Z-Index in jsdom vs Real Browser

- The existing jsdom test (`battle-viewer-tooltip.test.tsx:213-231`) calls `getComputedStyle(tooltip).zIndex` and checks `>= 1000`
- In jsdom, `getComputedStyle` for CSS Module classes may or may not resolve correctly. The test passes, but it may be checking inline styles or partial CSS resolution
- A browser test would validate that the CSS Module class `.tooltip` with `z-index: 1000` is actually applied and resolved by the browser's CSS engine
- The tooltip is portaled to `document.body` with `position: fixed`, which puts it in the root stacking context -- separate from the `.gridContainer` stacking context where overlays live

### Zero-Rect Fallback Analysis

**Location**: `CharacterTooltip.tsx` lines 254-256:

```typescript
const width = rect.width > 0 ? rect.width : 300;
const height = rect.height > 0 ? rect.height : 150;
```

**Why it exists**: In jsdom, `getBoundingClientRect()` always returns `DOMRect(0, 0, 0, 0)` for all elements. Without this fallback, `calculateTooltipPosition()` would receive `width=0, height=0`, causing incorrect positioning (tooltip would always fit to the right, vertical centering would be off).

**Who uses the fallback path**:

- All 4 jsdom positioning tests in `CharacterTooltip.test.tsx` (lines 289-378) rely on the fallback implicitly -- they all run in jsdom where `getBoundingClientRect` returns zeros
- The browser tests in Phase 1 explicitly verify that the NON-fallback path works (test 3: "tooltip positions using real dimensions, not fallback")

**Risk of removal**:

- **Safe for production**: In a real browser, `getBoundingClientRect()` on a rendered tooltip will always return non-zero dimensions. The fallback is never triggered in production.
- **Breaks jsdom tests**: Removing the fallback would make jsdom positioning tests fail, since tooltip width=0 and height=0 would produce different positioning math. The jsdom tests use `mockViewport` and `createMockRect` for anchor position, but the tooltip's own dimensions come from the real (zero) `getBoundingClientRect`.
- **Options**: (a) Remove fallback and delete/rewrite jsdom positioning tests to only test the `calculateTooltipPosition` function directly, or (b) Keep fallback but add a comment noting it's jsdom-only, or (c) Extract `calculateTooltipPosition` into a utility and test it directly with explicit width/height arguments, removing the fallback from the component.

### Token Hover Flow (for Phase 2 browser test design)

1. User hovers SVG `<g>` token element
2. `Token.handleMouseEnter` calls `e.currentTarget.getBoundingClientRect()` on the `<g>`
3. Result passed to `BattleViewer.handleTokenHover(id, rect)` via `onTokenHover`
4. BattleViewer sets `hoverState = { characterId, anchorRect }`
5. `CharacterTooltip` renders with `anchorRect` prop
6. `useLayoutEffect` in CharacterTooltip calls `tooltipRef.current.getBoundingClientRect()` for its own dimensions
7. `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)` computes final position

A Phase 2 browser test for token hover geometry would need to:

- Render `BattleViewer` with characters in the store
- Actually hover a token (using Testing Library `userEvent.hover` or `page` API)
- Verify the tooltip appears and is positioned relative to the token's actual screen position
- Verify the anchor rect from the token `<g>` has non-zero dimensions

## Open Questions

1. **Should Phase 2 token hover test render BattleViewer or just Grid+Token?** Rendering BattleViewer gives full integration (hover handler wiring, tooltip rendering). Just Grid would test SVG geometry without tooltip coupling. BattleViewer seems more valuable since it tests the full hover-to-tooltip flow.

2. **What specific SVG geometry assertions matter?** Should we assert specific pixel values for the token's bounding rect, or just that width/height > 0? Given SVG viewBox scaling, exact pixel values depend on container size. Non-zero assertion plus approximate proportionality (width ~= height for a circular token) seems sufficient.

3. **For z-index browser test, should we test all overlays or just tooltip > max overlay?** The overlay stacking is CSS-only (no JS logic). Testing that tooltip z-index >= 1000 in a real browser validates CSS Module resolution. Testing the full hierarchy (5 < 10 < 20 < 1000) would be more thorough but may be over-testing CSS.

4. **How to handle the zero-rect fallback removal?** Options:
   - (a) Remove fallback, migrate jsdom positioning tests to unit-test `calculateTooltipPosition()` directly with explicit dimensions
   - (b) Keep fallback, add comment explaining jsdom-only purpose
   - (c) Extract pure function, test independently, remove fallback from component
     Option (a) or (c) seem cleanest. The planning phase should decide.

5. **Should we use `userEvent.hover()` or Playwright-level mouse events for token hover in browser tests?** Phase 1 browser tests use `new DOMRect()` to provide anchor position directly to `CharacterTooltip`, bypassing actual hover. Phase 2 should test the actual hover-to-tooltip flow through `BattleViewer`, which means using `userEvent.hover()` on the token `<g>` element.

6. **Viewport size sensitivity**: Token screen position depends on viewport size (SVG scales with container). Tests should set explicit viewport dimensions via `page.viewport()` for deterministic geometry assertions.
