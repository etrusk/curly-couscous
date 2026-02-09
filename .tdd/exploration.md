# Exploration Findings

## Task Understanding

Phase 4 of the browser test migration: identify SVG marker elements and remaining DOM-dependent component behaviors that would benefit from real browser testing (Vitest Browser Mode + Playwright). The project currently has 22 browser tests across 4 files from Phases 1-3. This phase targets SVG `<marker>` rendering (jsdom does not render SVG markers at all) and any other DOM-dependent behaviors not yet covered.

## Relevant Files

### SVG Marker Definitions and Usage

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx` - Defines 4 SVG `<marker>` elements in `<defs>` (lines 113-219): `arrowhead-attack`, `cross-heal`, `circle-friendly`, `diamond-enemy`. Each marker uses a two-layer rendering pattern (white contrast outline behind colored main shape) with CSS variables for colors (`--action-attack`, `--action-heal`, `--action-move`, `--contrast-line`).
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx` - Applies `marker-end` attribute on lines via `getMarkerEnd()` function (line 74). Maps action types to marker IDs: attack/interrupt/charge -> `arrowhead-attack`, heal -> `cross-heal`, move -> `circle-friendly` or `diamond-enemy` by faction.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.module.css` - Positions overlay with `position: absolute`, `z-index: 10`, `pointer-events: none`.

### SVG Pattern Definitions (Token)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - Defines per-character `<pattern>` elements for enemy diagonal stripes (lines 138-156). Pattern ID uses character ID for uniqueness: `stripe-enemy-${id}`. Referenced via `fill="url(#stripe-enemy-${id})"` on enemy diamond `<path>`.

### Components with DOM-Dependent Behaviors

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - `getBoundingClientRect()` on mouse enter (line 86) for tooltip anchor positioning. Also has `:hover .shape` CSS with `brightness(1.1)` filter effect.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` - `useLayoutEffect` with `getBoundingClientRect()` (line 212) for tooltip size measurement. Fade-in animation via CSS `@keyframes fadeIn` (150ms).
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/tooltip-positioning.ts` - Uses `window.innerWidth` and `window.innerHeight` for viewport-aware positioning.
- `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.ts` - `window.matchMedia("(prefers-color-scheme: light)")` for system theme detection (line 46). Listener for system preference changes (line 127).
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx` - `useRef` for hover timeout (line 45) and grid container ref for background click detection (line 96). Hover-to-tooltip flow with 100ms leave delay (line 81).
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.tsx` - Uses `color-mix()` inline in SVG `fill` attribute (line 39): `color-mix(in srgb, ${fillColor} 20%, transparent)`. This is a CSS function applied directly on an SVG attribute, which jsdom cannot resolve.

### Existing Browser Tests (Already Covered)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.browser.test.tsx` - Phase 1: 4 tests for real getBoundingClientRect, tooltip dimensions, positioning, viewport flip.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.browser.test.tsx` - Phase 2: 6 tests for token SVG geometry (non-zero bounding rects, position-dependent layout, hover-to-tooltip flow) and tooltip z-index stacking.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.browser.test.tsx` - Phase 3: 5 tests for selection glow drop-shadow, animation properties, focus-visible filter, HP bar width.
- `/home/bob/Projects/auto-battler/src/styles/theme.browser.test.tsx` - Phase 3: 7 tests for light-dark() resolution, color-mix(), theme switching, CSS cascade.

### Existing Unit Tests for Markers (jsdom - attribute-only)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.test.tsx` - Tests `marker-end` attribute values (e.g., `url(#arrowhead-attack)`).
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine-action-colors.test.tsx` - Tests marker-end attribute per action type.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine-accessibility.test.tsx` - Tests outline line has no marker-end.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-rendering.test.tsx` - Tests marker-end attribute on rendered intent lines.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-subscription.test.tsx` - Tests marker attribute values via subscription.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLine.test.tsx` - Tests that targeting lines have NO marker-end/marker-start.

### CSS Files with Animations/Transitions (Potentially Testable)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.module.css` - `@keyframes fadeIn` (150ms ease-out), tooltip opacity animation.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.module.css` - `@keyframes selectionPulse` (2s ease-in-out infinite) [COVERED in Phase 3], `.shape` transition (opacity 0.2s), `.hpBarFill` transition (width 0.3s), `:hover .shape` brightness filter.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.module.css` - `.hexagon` transition (fill 0.15s), `:hover` fill change, high-contrast stroke-width override.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLine.module.css` - Opacity transition (0.2s ease).

### Test Infrastructure

- `/home/bob/Projects/auto-battler/src/test/setup.browser.ts` - Minimal browser setup (cleanup only, no matchMedia mock needed).
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` - `createCharacter()` and `createTarget()` helpers used by all browser tests.

## Existing Patterns

- **CSS Variable Probe Element** (`/home/bob/Projects/auto-battler/.docs/patterns/css-variable-probe-element.md`) - Technique for resolving CSS custom properties in browser tests by creating a temporary probe element with `background-color: var(--prop)` and reading `getComputedStyle(probe).backgroundColor`. Already used in theme.browser.test.tsx.
- **Browser Test Convention** (ADR-022) - `.browser.test.tsx` suffix, co-located with components. Two-project Vitest workspace (unit + browser).
- **Two-Layer SVG Rendering** - All markers and intent lines use a contrast outline layer behind the main colored layer. This is the same pattern used by Token (contrast stroke behind faction fill) and TargetingLine (contrast outline behind targeting line).

## Dependencies

- **Vitest Browser Mode + Playwright/Chromium** - Already configured in `vite.config.ts`.
- **`createCharacter` / `createTarget` helpers** - For setting up game state in browser tests.
- **Theme CSS import** - Browser tests that test CSS variable resolution need `import "../../styles/theme.css"`.
- **IntentOverlay requires game state with pending actions** - To render intent lines with markers, tests need characters with wind-up skills in progress (e.g., after `nextTick()` with characters that have valid attack/heal/move targets).

## Constraints Discovered

1. **jsdom limitation with SVG markers**: jsdom parses `<marker>` elements and `marker-end` attributes as DOM attributes but does not render them visually. Existing unit tests only verify attribute strings (e.g., `toHaveAttribute("marker-end", "url(#arrowhead-attack)")`). Real SVG marker rendering (geometry, fill color resolution, orientation) requires a browser.

2. **jsdom limitation with SVG `<pattern>` fill**: The enemy token diagonal stripe pattern (`<pattern>` with `patternTransform="rotate(45)"`) is defined as SVG but never tested for visual rendering. jsdom cannot validate pattern rendering.

3. **jsdom limitation with inline `color-mix()`**: WhiffOverlay uses `color-mix(in srgb, ${fillColor} 20%, transparent)` directly in SVG fill attributes. jsdom does not resolve this CSS function.

4. **CSS variable resolution in SVG markers**: Markers use CSS variables (`--action-attack`, `--action-heal`, `--action-move`, `--contrast-line`). jsdom cannot verify that these resolve to actual colors within SVG `<marker>` elements.

5. **`markerUnits="userSpaceOnUse"`**: All 4 markers use `userSpaceOnUse` (fixed pixel dimensions independent of stroke-width). Browser tests can validate that marker dimensions are consistent regardless of the line's stroke width.

6. **Marker `overflow="visible"`**: All markers have `overflow="visible"`, allowing marker content to extend beyond the marker box. This is a rendering detail only verifiable in a browser.

7. **CharacterTooltip fadeIn animation**: The tooltip has a 150ms fade-in animation (`opacity: 0` to `opacity: 1`). This could be tested in browser mode but the timing might make assertions flaky without waiting.

## Recommended Test Candidates (Ranked by Value)

### Tier 1 - High Value (SVG markers - primary Phase 4 target)

1. **SVG marker `<defs>` existence and structure in rendered DOM** - Verify that the 4 marker definitions (`arrowhead-attack`, `cross-heal`, `circle-friendly`, `diamond-enemy`) exist in the rendered SVG with correct child elements (polygon, path, circle). While jsdom preserves DOM structure, browser rendering validates the markers are properly attached and queryable in a real SVG context.

2. **SVG marker CSS variable color resolution** - Use probe elements or `getComputedStyle` to verify that `--action-attack` (vermillion), `--action-heal` (green), `--action-move` (blue), and `--contrast-line` (white) resolve to correct color values within the marker context. This is the key gap: jsdom unit tests verify attribute strings but not color resolution.

3. **IntentLine with rendered markers has non-zero marker bounding geometry** - Render an IntentOverlay with active intents and verify that intent lines with `marker-end` produce SVG content with non-zero visual extent. This validates the full marker rendering pipeline.

4. **Marker type correctness per action type** - Render intent lines for attack, heal, and move actions and verify the correct marker shape is rendered (arrowhead polygon for attack, cross path for heal, circle/diamond for move).

### Tier 2 - Medium Value (SVG patterns and other DOM behaviors)

5. **Enemy token diagonal stripe pattern rendering** - Verify that enemy tokens' `<pattern>` element with `patternTransform="rotate(45)"` produces a valid fill. The `url(#stripe-enemy-${id})` fill reference could be validated to resolve in a real browser context.

6. **WhiffOverlay inline `color-mix()` resolution** - Verify that the whiff indicator's `color-mix(in srgb, var(--action-attack) 20%, transparent)` fill produces a semi-transparent color (not raw CSS function text).

7. **CharacterTooltip fade-in animation** - Verify the tooltip's `@keyframes fadeIn` animation properties (`animationDuration: "150ms"`, `animationName` not "none") similar to how Token animation was tested in Phase 3.

8. **Token hover brightness filter** - Verify that hovering a token applies `filter: brightness(1.1)` on the `.shape` child element. This requires real CSS `:hover` pseudo-class matching.

### Tier 3 - Lower Value (nice-to-have)

9. **Cell hover fill change** - Verify that hovering a clickable cell changes the hex polygon fill via `var(--cell-hover-bg)`. Requires real `:hover` matching.

10. **AccessibilityStore real `matchMedia` response** - Verify that the accessibility store correctly reads system `prefers-color-scheme` in a real browser (no mock needed). Lower value because the mocked unit tests already cover the logic paths.

11. **High-contrast mode stroke-width overrides** - Verify that `[data-theme="high-contrast"] .shape { stroke-width: 2 }` and `[data-theme="high-contrast"] .hexagon { stroke-width: 2 }` are applied by the real CSS engine.

## Open Questions

1. **Marker bounding box accessibility**: Can `getBoundingClientRect()` be called on `<marker>` elements directly, or do we need to query the `<line>` elements that reference them and check their visual extent? (SVG markers are not part of the DOM tree in the same way as regular elements -- they are in `<defs>` and rendered via reference.)

2. **Hover pseudo-class in Vitest Browser Mode**: Can `userEvent.hover()` trigger CSS `:hover` pseudo-class matching in Playwright-backed Vitest Browser Mode? Existing Phase 2 tests use hover for tooltip triggering but do not verify `:hover` CSS effects on the hovered element itself.

3. **WhiffOverlay test setup complexity**: Testing WhiffOverlay requires generating whiff events, which means setting up a battle scenario where an attack or heal targets a cell, the target moves away, and the action resolves against an empty cell. This may require multiple `nextTick()` calls with specific character configurations.

4. **Marker orientation (`orient="auto"`)**: Should we test that markers auto-orient to the line direction? This requires rendering lines at different angles and checking marker rotation, which may be complex.

5. **Recommended test count for Phase 4**: Phases 1-3 had 4, 6, and 12 tests respectively. How many tests should Phase 4 target? Suggest 6-10 tests covering Tier 1 (markers) and selected Tier 2 items.
