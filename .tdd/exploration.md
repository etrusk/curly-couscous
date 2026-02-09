# Exploration Findings

## Task Understanding

Identify component behaviors that would benefit from real DOM browser tests (Phase 3). We already have 10 browser tests covering CharacterTooltip positioning (4 tests) and Token SVG geometry + tooltip z-index stacking (6 tests). The goal is to find NEW candidates -- components with behaviors that depend on real DOM APIs that jsdom cannot reliably test.

## Already Covered by Browser Tests

- CharacterTooltip: `getBoundingClientRect` for positioning, viewport flip behavior, real dimensions
- Token SVG: `getBoundingClientRect` for non-zero geometry, position-dependent bounding rects
- BattleViewer: Hover-to-tooltip integration flow with real SVG anchors
- Z-index stacking: `getComputedStyle(tooltip).zIndex` vs overlay z-indices

## Candidate Components (Priority Ranked)

### Priority 1: Theme CSS Variable Resolution

**Files**: `src/styles/theme.css`, `src/styles/theme.integration.test.tsx`, `src/styles/theme-variables.test.ts`, `src/stores/accessibilityStore.ts`

**Rationale**: The existing theme tests explicitly acknowledge jsdom limitations:

- `theme-variables.test.ts` (line 4): "jsdom cannot process CSS custom properties, so we read the file directly" -- uses static file parsing instead of actual CSS resolution
- `theme.integration.test.tsx` (line 5): "jsdom doesn't process external CSS or resolve CSS variables" -- only tests data-attribute mechanism, not actual computed colors

**What to test in browser**:

- `getComputedStyle` resolves `light-dark()` CSS function correctly per theme
- Theme switching via `data-theme` attribute actually changes computed colors
- `color-mix()` derived tokens (faction-bg, status-bg) produce correct computed values
- High-contrast mode (`data-theme="high-contrast"`) produces different computed values than dark mode
- CSS variables cascade correctly from `:root` through component CSS Modules

**Value**: High. Currently zero tests validate that CSS actually produces the right colors. All theme tests are either static file analysis or attribute-mechanism verification. A browser test would catch `light-dark()` or `color-mix()` browser compatibility regressions.

### Priority 2: Token Selection Glow and Animation

**Files**: `src/components/BattleViewer/Token.tsx`, `src/components/BattleViewer/Token.module.css`

**Rationale**: Token has CSS-driven visual feedback that jsdom cannot verify:

- Selection pulse animation (`@keyframes selectionPulse` with `drop-shadow` filter)
- `:focus-visible` drop-shadow filter for keyboard navigation
- `:hover` brightness filter on `.shape`
- HP bar `transition: width 0.3s ease-out`
- Shape `transition: opacity 0.2s ease-in-out`

**What to test in browser**:

- Selected token has `filter` containing `drop-shadow` via `getComputedStyle`
- Focus-visible state applies filter on keyboard focus (Tab to token)
- Animation is running (`animation-name` is `selectionPulse` in computed style)
- HP bar width reflects actual HP proportion in rendered SVG

**Value**: Medium-high. CSS animations and filters are invisible to jsdom. The selection glow is a core UX signal. Testing that `filter: drop-shadow(...)` actually resolves validates the visual feedback pipeline.

### Priority 3: SVG Marker Rendering in IntentOverlay

**Files**: `src/components/BattleViewer/IntentOverlay.tsx`, `src/components/BattleViewer/IntentLine.tsx`

**Rationale**: IntentOverlay defines SVG `<marker>` elements (arrowhead-attack, cross-heal, circle-friendly, diamond-enemy) with `markerEnd` URL references. jsdom does not render SVG markers -- marker geometry, `orient="auto"` rotation, and `refX/refY` positioning are pure browser features. The CSS variable colors (`var(--action-attack)`, etc.) in markers also cannot be resolved by jsdom.

**What to test in browser**:

- Marker elements (`#arrowhead-attack`, `#cross-heal`, etc.) are resolvable via `document.getElementById`
- Intent lines with `markerEnd="url(#arrowhead-attack)"` produce non-zero marker bounding rects
- Different action types use correct marker references (attack -> arrowhead, heal -> cross, move -> faction shape)
- CSS variable colors resolve inside SVG marker `<defs>` (browser confirms variables cascade into SVG markers)

**Value**: Medium. SVG markers are a known jsdom blind spot. Tests would validate that the visual encoding spec (action-type markers) actually renders.

### Priority 4: Overlay Stacking and Pointer Events

**Files**: `src/components/BattleViewer/BattleViewer.tsx`, all overlay CSS modules (`IntentOverlay.module.css`, `WhiffOverlay.module.css`, `DamageOverlay.module.css`, `TargetingLineOverlay.module.css`)

**Rationale**: Overlays use `position: absolute`, `pointer-events: none`, and specific z-index values (5, 10, 20) to stack correctly over the grid. The existing browser tests verify tooltip z-index > overlay z-indices, but don't verify:

- `pointer-events: none` on overlays actually allows click-through to grid cells
- Overlay SVGs align correctly with the Grid SVG (shared viewBox coordinate system)
- Render order matches spec: Grid -> WhiffOverlay -> IntentOverlay -> TargetingLineOverlay -> DamageOverlay

**What to test in browser**:

- Click on a hex cell passes through overlay SVGs (pointer-events: none verified functionally)
- Overlay z-index ordering matches spec (WhiffOverlay < IntentOverlay < TargetingLineOverlay < DamageOverlay)
- Overlay SVGs share identical viewBox with Grid SVG

**Value**: Medium. Pointer-events pass-through is a critical UX behavior that jsdom cannot test functionally. ViewBox alignment is testable via attribute comparison but geometric alignment requires real rendering.

### Priority 5: Details/Summary Progressive Disclosure

**Files**: `src/components/BattleViewer/CharacterTooltip.tsx`, `src/components/RuleEvaluations/RuleEvaluations.tsx`

**Rationale**: Both components use native `<details>/<summary>` elements for collapsible sections. jsdom supports the DOM structure but has incomplete behavior for:

- Click on `<summary>` toggling `open` attribute (works in jsdom but animation behavior differs)
- `::-webkit-details-marker` hiding (CSS Module hides the default triangle, only testable in browser)
- Content height changes when expanding/collapsing (layout-dependent)

**What to test in browser**:

- `<summary>` click toggles visibility of collapsed skills content
- Default disclosure marker is hidden via CSS (no browser-default triangle visible)
- Expanded content has non-zero height; collapsed content is hidden

**Value**: Low-medium. jsdom tests already verify the DOM structure and toggle behavior. Browser tests would primarily validate CSS marker hiding and layout changes.

### Priority 6: Accessibility Store -- matchMedia System Preference Detection

**Files**: `src/stores/accessibilityStore.ts`, `src/stores/accessibilityStore.test.ts`

**Rationale**: The accessibility store uses `window.matchMedia("(prefers-color-scheme: dark)")` to detect system preference. The test file heavily mocks matchMedia (8+ mock instances). The global test setup (`src/test/setup.ts`) also mocks matchMedia. A browser test could validate that the real `matchMedia` API responds correctly.

**What to test in browser**:

- `window.matchMedia("(prefers-color-scheme: dark)")` returns a valid MediaQueryList
- Store initializes without errors in real browser environment
- Theme application via `data-theme` attribute produces real CSS changes

**Value**: Low. matchMedia mocking is standard practice and unlikely to hide bugs. The store logic is straightforward. However, a single integration test validating the full initialization -> DOM effect pipeline in a real browser would increase confidence.

### Priority 7: WhiffOverlay color-mix() Fill

**Files**: `src/components/BattleViewer/WhiffOverlay.tsx`

**Rationale**: WhiffOverlay uses `color-mix(in srgb, ${fillColor} 20%, transparent)` directly in the `fill` attribute of SVG polygons. This is a modern CSS function that jsdom does not process. A browser test could verify the computed fill color is semi-transparent.

**What to test in browser**:

- WhiffOverlay polygon `fill` attribute using `color-mix()` produces a resolvable color in `getComputedStyle`
- The fill is visually semi-transparent (color has alpha channel)

**Value**: Low. This is a single CSS function validation, but it directly tests `color-mix()` in SVG context which is relatively novel.

## Existing Patterns

- **Browser Test Convention**: `.browser.test.tsx` suffix, co-located with component (ADR-022)
- **Two-project workspace**: `unit` (jsdom, `*.test.{ts,tsx}`) and `browser` (Playwright, `*.browser.test.{ts,tsx}`)
- **Test helpers**: `rule-evaluations-test-helpers.ts` provides `createCharacter()`, `createTarget()` for game state setup
- **Viewport control**: `await page.viewport(1280, 720)` used in existing browser tests
- **Store reset**: `useGameStore.getState().actions.initBattle([])` in `beforeEach`

## Dependencies

- Vitest Browser Mode + Playwright already configured (Phase 1/2)
- `src/test/setup.browser.ts` exists for browser-specific setup
- CSS Modules and `theme.css` must be loaded by Vite for browser tests to work (already handled by existing infrastructure)
- Game store and engine are used directly (no mocking philosophy continues)

## Constraints Discovered

1. **Theme variable tests cannot use jsdom at all**: The `theme-variables.test.ts` file reads CSS as raw text because jsdom cannot process `light-dark()` or `color-mix()`. Browser tests are the only way to validate actual computed values.
2. **SVG marker rendering is a jsdom blind spot**: `<marker>` elements and their references via `url(#id)` are not rendered in jsdom. Geometry testing requires a real browser.
3. **CSS animations/transitions are invisible to jsdom**: `getComputedStyle` in jsdom does not resolve `@keyframes`, `animation`, `transition`, or `filter` properties meaningfully.
4. **Existing z-index browser tests already validate overlay stacking partially**: The Phase 2 browser tests check tooltip z-index > all overlays. Extending this to overlay-to-overlay ordering would be incremental.
5. **Browser tests are slower** (~seconds vs milliseconds): Keep the Phase 3 scope focused on behaviors that genuinely cannot be tested in jsdom.

## Relevant Files

### Components (source)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - Selection glow, focus-visible, hover brightness
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.module.css` - Animations, filters, transitions
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx` - SVG marker definitions
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx` - markerEnd references, CSS variable colors
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.tsx` - color-mix() in SVG fill
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx` - Overlay stacking, pointer-events pass-through
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` - details/summary progressive disclosure
- `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.ts` - matchMedia, theme application
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx` - SVG viewBox, two-pass rendering

### CSS (styling)

- `/home/bob/Projects/auto-battler/src/styles/theme.css` - Theme variables, light-dark(), color-mix()
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.module.css` - z-index: 10, pointer-events: none
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.module.css` - hover transitions, high-contrast overrides
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.module.css` - fadeIn animation, z-index: 1000

### Tests (existing)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.browser.test.tsx` - Phase 1 browser tests
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.browser.test.tsx` - Phase 2 browser tests
- `/home/bob/Projects/auto-battler/src/styles/theme-variables.test.ts` - Static CSS file analysis (workaround for jsdom)
- `/home/bob/Projects/auto-battler/src/styles/theme.integration.test.tsx` - Attribute mechanism only
- `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.test.ts` - Heavy matchMedia mocking
- `/home/bob/Projects/auto-battler/src/test/setup.ts` - Global matchMedia mock

### Infrastructure

- `/home/bob/Projects/auto-battler/.docs/decisions/adr-022-vitest-browser-mode.md` - Browser test ADR

## Open Questions

1. **Scope**: Should Phase 3 focus on a single high-value candidate (theme CSS variables) or attempt multiple candidates? The theme CSS variable resolution is by far the highest-value candidate since zero tests currently validate actual computed colors.
2. **Test count target**: Phase 1 had 4 tests, Phase 2 had 6. Should Phase 3 aim for a similar 4-8 test count?
3. **Theme test granularity**: Should browser tests validate every CSS variable across all three themes, or just a representative sample (e.g., 2-3 key variables per theme)?
4. **SVG marker tests**: Are marker bounding rects reliable across browser versions, or should we test marker presence/referenceability only?
5. **Animation testing**: Should we test that `animation-name` resolves to `selectionPulse`, or should we go further and test `animation-play-state`?
