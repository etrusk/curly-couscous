# Exploration Findings

## Task Understanding

Set up Vitest Browser Mode configuration to run a subset of SVG/component tests in a real browser environment, alongside the existing jsdom test suite. The goal is to enable tests that require real DOM/SVG rendering APIs (e.g., `getBoundingClientRect`, CSS custom properties, SVG layout) to run in an actual browser, while keeping the majority of tests on the faster jsdom environment.

## Current Test Setup

### Configuration

- **Config location**: `/home/bob/Projects/auto-battler/vite.config.ts` (test config embedded in Vite config, lines 19-25)
- **Environment**: `jsdom` (via `jsdom` package v23.2.0)
- **Globals**: `true` (Vitest globals enabled)
- **Setup file**: `/home/bob/Projects/auto-battler/src/test/setup.ts`
- **CSS**: `true` (CSS processing enabled)
- **Excludes**: `["node_modules", ".archive"]`
- **No separate `vitest.config.ts`** -- test config lives inside `vite.config.ts`
- **No `vitest.workspace.*`** file exists

### Setup file (`src/test/setup.ts`)

- Mocks `window.matchMedia` globally (jsdom doesn't implement it)
- Runs `cleanup()` after each test via `@testing-library/react`
- Imports `@testing-library/jest-dom` for DOM matchers

### TypeScript config (`tsconfig.json`)

- Types include: `"vite/client"`, `"vitest/globals"`, `"@testing-library/jest-dom"`
- Browser mode will need its own tsconfig or type additions for `@vitest/browser`

### Test stats

- **150 test files**, **1448 tests**, all passing
- **83 engine tests** (`.ts`, pure logic, no DOM needed)
- **40 component tests** (`.tsx`, React/SVG rendering)
- **20 store tests** (`.ts`, Zustand stores, some use React render)
- Duration: ~14s total

### Key dependencies (from `package.json`)

- `vitest`: `^4.0.18` (installed: 4.0.18)
- `jsdom`: `^23.2.0`
- `@testing-library/react`: `^16.3.2`
- `@testing-library/user-event`: `^14.6.1`
- `@testing-library/jest-dom`: `^6.9.1`
- No `@vitest/browser`, `playwright`, or `webdriverio` packages installed
- The `package-lock.json` shows `@vitest/browser-playwright` and `@vitest/browser-preview` as optional peer deps of vitest 4.0.18

## Tests That Would Benefit From Browser Mode

### Category 1: Tests using `getBoundingClientRect` (jsdom returns zero-rect)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-hover.test.tsx` -- Calls `getBoundingClientRect()` via Token's `onMouseEnter` handler (line 86 of Token.tsx). Currently only checks that the rect "has properties" (top, left, width, height) but cannot verify actual values since jsdom returns all zeros.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.test.tsx` -- Uses `getComputedStyle()` (line 227). Tooltip positioning relies on `getBoundingClientRect()` in CharacterTooltip.tsx (line 253). The component has a fallback for zero-rect (`width > 0 ? rect.width : 300`), which is a jsdom workaround.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.test.tsx` -- Uses `createMockRect()` helper and `mockViewport()` to simulate browser positioning. With browser mode, these could use real viewport measurements.

### Category 2: Tests that use Node.js `fs`/`path` (incompatible with browser mode)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.test.tsx` -- Uses `readFileSync` and `__dirname` to verify source code doesn't contain a constant. This test CANNOT run in browser mode.
- `/home/bob/Projects/auto-battler/src/styles/theme-variables.test.ts` -- Uses `readFileSync` and `__dirname` for static CSS file analysis. This test CANNOT run in browser mode.

### Category 3: SVG rendering tests (work fine in jsdom, but could benefit from browser mode for visual correctness)

These 15 component test files render SVG elements and check attributes. They currently work in jsdom because they only check DOM attributes (not computed geometry):

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-visual.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-interaction.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-lettering.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-accessibility.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine-accessibility.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine-action-colors.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-rendering.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-markers.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-subscription.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-offset-basic.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-offset-directional.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.test.tsx`

### Category 4: Tests with mocks that might change with browser mode

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.test.tsx` -- Uses `vi.fn()` for click handlers
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-hover.test.tsx` -- Uses `vi.fn()` for mouse event handlers
- `/home/bob/Projects/auto-battler/src/components/PlayControls/PlayControls.test.tsx` -- Uses fake timers
- `/home/bob/Projects/auto-battler/src/hooks/useInterval.test.ts` -- Uses fake timers

## Existing Patterns

- **Co-located tests**: Test files live next to source files (e.g., `Token.tsx` / `token-visual.test.tsx`)
- **Test helpers**: Shared helpers in `tooltip-test-helpers.ts` and `rule-evaluations-test-helpers.ts`
- **CSS Modules enabled**: Tests run with `css: true` in Vitest config
- **jsdom workarounds**: Multiple patterns of working around jsdom limitations:
  - `createMockRect()` helper creates fake DOMRect objects
  - `mockViewport()` helper manually sets `window.innerWidth/innerHeight`
  - `window.matchMedia` is globally mocked in setup.ts
  - CharacterTooltip.tsx has explicit fallback for zero-dimension rects (line 255-256)
- **Node.js API usage in tests**: Two test files use `fs.readFileSync` and `__dirname` for source file analysis (not possible in browser mode)
- **SVG attribute assertions**: Tests check SVG attributes (fill, stroke, viewBox, etc.) rather than computed layout -- this pattern works fine in both jsdom and browser mode

## Dependencies

- **New packages needed**: `@vitest/browser` (browser mode provider for Vitest 4.x), `playwright` (browser driver)
- **Vitest 4.x compatibility**: Vitest 4.0.18 has built-in browser mode support. The `@vitest/browser` package is the recommended way. In Vitest 4.x, browser mode uses `@vitest/browser` with playwright or webdriverio as the browser provider.
- **React Testing Library**: `@testing-library/react` works in browser mode (it renders to a real DOM). No change needed.
- **`@testing-library/jest-dom`**: Matchers like `toBeInTheDocument()`, `toHaveAttribute()` should work in browser mode since they operate on real DOM nodes.

## Configuration Approach

### Vitest Workspace (recommended)

Create a `vitest.workspace.ts` at project root that defines two projects:

1. **`unit`** project: Runs all tests in jsdom (current setup, unchanged). Includes engine, stores, and most component tests.
2. **`browser`** project: Runs a subset of component tests in real browser via Playwright. Initially targets tooltip positioning tests and any new tests that need real SVG geometry.

### File selection for browser mode

The workspace config can use `include` patterns to select which tests run in which project. Options:

- Convention-based: `*.browser.test.tsx` suffix for browser-mode tests
- Directory-based: `src/**/*.test.tsx` with explicit exclude patterns
- The convention-based approach (`.browser.test.tsx`) is cleanest and most explicit

### Setup file considerations

- The jsdom setup file (`src/test/setup.ts`) mocks `window.matchMedia`. In browser mode, `matchMedia` is natively available, so the mock should NOT be applied.
- Browser mode may need its own setup file (or the existing one could conditionally detect the environment).
- `cleanup()` from `@testing-library/react` is still needed in browser mode.

## Constraints Discovered

1. **Two test files use Node.js `fs`/`path`**: `WhiffOverlay.test.tsx` and `theme-variables.test.ts` use `readFileSync` and `__dirname`. These MUST stay in jsdom/Node mode and cannot run in browser mode.

2. **`window.matchMedia` mock**: The global setup mocks `matchMedia`. Browser mode has native `matchMedia`, so browser-mode tests need a different setup file or the mock needs to be conditional.

3. **CharacterTooltip has jsdom workaround**: Line 255 of `CharacterTooltip.tsx` has `rect.width > 0 ? rect.width : 300` to handle jsdom's zero-rect. This is production code working around a test limitation. Browser mode would let this code be tested without the workaround.

4. **No existing workspace config**: The project has no `vitest.workspace.ts`, so this is a new configuration pattern. The `test` block currently lives inside `vite.config.ts`.

5. **Test count (1448 tests)**: Moving tests between environments could cause test count mismatches if not configured carefully. Both projects should be runnable via `npm run test`.

6. **CI impact**: Browser mode tests require a browser binary (Playwright downloads Chromium). This affects CI/CD pipeline (needs browser install step).

7. **React Compiler (babel-plugin-react-compiler)**: The Vite plugin config includes React Compiler. Browser mode tests using Vite for transformation should inherit this.

## Open Questions

1. **Which tests to migrate first?** The tooltip tests (CharacterTooltip.test.tsx, battle-viewer-tooltip.test.tsx) have the most to gain since they mock positioning. Should they be duplicated as `.browser.test.tsx` files, or should the jsdom versions be replaced?

2. **Naming convention**: Should browser-mode tests use `.browser.test.tsx` suffix or a separate directory (e.g., `__browser__/`)?

3. **npm scripts**: Should `npm run test` run both jsdom and browser tests? Or should there be a separate `npm run test:browser` script? The workspace approach lets `vitest run` execute both projects automatically.

4. **How to handle the existing `test` config in `vite.config.ts`**: When switching to workspace mode, the `test` block in `vite.config.ts` may conflict with workspace config. The typical approach is to move test config entirely to `vitest.workspace.ts` and remove it from `vite.config.ts`.

5. **Playwright vs Webdriver**: Playwright is the standard choice for Vitest browser mode. Any reason to consider alternatives?

6. **Scope of initial browser tests**: Should the initial setup just be infrastructure (config + one proof-of-concept test), or should it migrate existing tests?

## Relevant Files

### Configuration

- `/home/bob/Projects/auto-battler/vite.config.ts` -- Current Vitest config (embedded in Vite config, lines 19-25)
- `/home/bob/Projects/auto-battler/package.json` -- Dependencies and scripts
- `/home/bob/Projects/auto-battler/tsconfig.json` -- TypeScript config (includes vitest/globals types)
- `/home/bob/Projects/auto-battler/src/test/setup.ts` -- Global test setup (matchMedia mock, cleanup)

### Tests most likely to benefit from browser mode

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.test.tsx` -- Tooltip positioning with mock DOMRect
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.test.tsx` -- E2E tooltip with getComputedStyle
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-hover.test.tsx` -- Token hover with getBoundingClientRect
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/tooltip-test-helpers.ts` -- Mock utilities for positioning

### Tests that MUST stay in jsdom/Node mode

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.test.tsx` -- Uses Node.js fs/path
- `/home/bob/Projects/auto-battler/src/styles/theme-variables.test.ts` -- Uses Node.js fs/path

### Source files with jsdom workarounds

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx` -- Zero-rect fallback (line 255)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` -- getBoundingClientRect on SVG group (line 86)

### Architecture docs

- `/home/bob/Projects/auto-battler/.docs/decisions/adr-008-svg-hex-grid.md` -- SVG rendering decision, notes getBoundingClientRect on SVG `<g>` elements
- `/home/bob/Projects/auto-battler/.docs/architecture.md` -- Testing guidelines (lines 127-131)
- `/home/bob/Projects/auto-battler/.docs/patterns/index.md` -- Portal tooltip positioning pattern
