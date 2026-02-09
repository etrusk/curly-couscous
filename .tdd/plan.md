# Phase 3 Browser Tests -- Implementation Plan

## Candidate Selection

From the 7 candidates ranked in `exploration.md`, this phase selects **Priority 1 (Theme CSS Variable Resolution)** and **Priority 2 (Token Selection Glow and Animation)**.

**Rationale for this batch:**

- Priority 1 is the highest-value candidate by a wide margin: zero tests currently validate that CSS actually produces correct computed colors. The existing jsdom tests explicitly acknowledge they cannot test this (`theme-variables.test.ts` line 4, `theme.integration.test.tsx` line 5).
- Priority 2 is a natural companion: it tests CSS-driven visual feedback (filters, animations) on a component that already has browser test infrastructure from Phase 2. Both candidates test `getComputedStyle` resolution of CSS properties that jsdom cannot process.
- Priorities 3-7 are deferred to Phase 4. SVG markers (Priority 3) are a reasonable next candidate but would make this batch too large.

**Scope:** 2 new test files, ~10-12 tests total.

## Test File 1: Theme CSS Variable Resolution

**File:** `/home/bob/Projects/auto-battler/src/styles/theme.browser.test.tsx`

**Purpose:** Validate that `light-dark()` and `color-mix()` CSS functions resolve to correct computed color values across all three themes (dark, light, high-contrast).

### Tests

1. **dark theme resolves surface-ground to dark value** -- Set `data-theme="dark"` (or no attribute), render an element, verify `getComputedStyle(el).getPropertyValue('--surface-ground')` resolves to `#242424` (or RGB equivalent). This is the core test: `light-dark(#fafafa, #242424)` with `color-scheme: dark` should pick the dark value.

2. **light theme resolves surface-ground to light value** -- Set `data-theme="light"`, verify `--surface-ground` resolves to `#fafafa`. Validates that `color-scheme: light` triggers the `light-dark()` light branch.

3. **high-contrast theme resolves surface-ground to pure black** -- Set `data-theme="high-contrast"`, verify `--surface-ground` resolves to `#000000`. Validates the full override block.

4. **light-dark() resolves differently for dark vs light themes** -- Compare a representative set of computed variables (`--content-primary`, `--grid-bg`, `--cell-bg`) between dark and light themes. Values must differ, proving `light-dark()` actually switches.

5. **color-mix() produces a resolved color for faction-friendly-bg** -- In dark theme, `--faction-friendly-bg` is `color-mix(in srgb, var(--faction-friendly) 15%, transparent)`. Verify `getComputedStyle` returns a resolved color value (not the raw `color-mix()` string). The result should contain an alpha channel (semi-transparent).

6. **high-contrast faction colors differ from dark theme** -- Compare `--faction-friendly` and `--action-attack` between dark (`#0072b2`, `#d55e00`) and high-contrast (`#0099ff`, `#ff6633`). Validates the override block produces distinct values.

7. **CSS variables cascade into rendered element backgrounds** -- Render a `<div>` with `background-color: var(--surface-ground)`, verify `getComputedStyle(div).backgroundColor` is a resolved RGB value (not empty or the literal string `var(--surface-ground)`). This tests cascade from `:root` into an actual element.

### Setup Requirements

- Import `theme.css` at the top of the test file so Vite processes it in the browser environment. Existing browser tests already get theme CSS via component imports, but this file tests the CSS directly so needs an explicit import.
- Helper function `setTheme(theme: string | null)` to set/remove `data-theme` attribute on `document.documentElement`.
- Helper function `getCSSVar(name: string)` wrapping `getComputedStyle(document.documentElement).getPropertyValue(name).trim()`.
- `beforeEach`: remove `data-theme` and `data-high-contrast` attributes (restore to default dark).
- Color comparison: use `startsWith('rgb')` or regex to verify resolved colors. Avoid exact hex matching since browsers return `rgb(r, g, b)` or `rgba(r, g, b, a)` format from `getComputedStyle`. Define expected RGB equivalents for key hex values.

### Expected count: 7 tests

## Test File 2: Token Selection Glow and Animation

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.browser.test.tsx`

**Purpose:** Validate CSS-driven visual feedback on Token that jsdom cannot verify: selection glow filter, animation, focus-visible filter, and HP bar width.

### Tests

1. **selected token has drop-shadow filter** -- Render BattleViewer, select a character via store action, verify `getComputedStyle(tokenElement).filter` contains `drop-shadow`. jsdom returns empty string for filter; real browser resolves the CSS Module class.

2. **unselected token has no drop-shadow filter** -- Verify an unselected token's computed `filter` is `none` or does not contain `drop-shadow`.

3. **selected token has active animation** -- Verify `getComputedStyle(selectedToken).animationName` contains `selectionPulse` (CSS Modules may mangle the name, so check for a non-`none` value). Verify `animationDuration` is `2s`.

4. **focus-visible token has drop-shadow filter** -- Tab to a token using keyboard, verify `getComputedStyle(focusedToken).filter` contains `drop-shadow`. This tests the `:focus-visible` CSS rule.

5. **HP bar fill width reflects HP proportion** -- Render a token with hp=50, maxHp=100. The HP bar fill rect should have `width` attribute of `20` (50% of TOKEN_SIZE=40). Verify via `getAttribute('width')` on the health bar element. (This is testable in jsdom via attributes but we validate the SVG `rect` element actually renders with correct width in a real browser.)

### Setup Requirements

- Reuse existing patterns from `BattleViewer.browser.test.tsx`: `beforeEach` with `initBattle([])` and `selectCharacter(null)`, `page.viewport(1280, 720)`.
- Import `BattleViewer` component (provides full rendering context including CSS Module loading).
- Use `createCharacter` helper from `rule-evaluations-test-helpers.ts`.
- For focus-visible test: use `userEvent.tab()` or `page.keyboard.press('Tab')` to trigger keyboard focus.
- For selection test: use `actions.selectCharacter(id)` to programmatically select (avoids click event complications with SVG hit areas).

### Expected count: 5 tests

## jsdom Test Conversion Analysis

**No existing jsdom tests need to be converted.** The existing tests serve different purposes:

- `theme-variables.test.ts` (static file analysis): Tests CSS source structure (variable declarations exist, `light-dark()` argument order, `color-mix()` references correct base variables). These are structural/architectural tests. Keep as-is.
- `theme.integration.test.tsx` (attribute mechanism): Tests DOM attribute setting/clearing. Trivially simple, keep as-is.
- Token jsdom tests: Test click behavior, ARIA attributes, content rendering. None test computed styles. Keep as-is.

The browser tests complement these by validating what the CSS actually produces at runtime.

## Risks and Dependencies

1. **Color format matching**: `getComputedStyle` returns colors in `rgb()` or `rgba()` format, not hex. Test assertions need RGB equivalents of expected hex values. Risk: rounding differences. Mitigation: use approximate matching or `parseFloat` on RGB components.

2. **CSS Module name mangling**: `animationName` in computed style may be the mangled class name, not the raw `selectionPulse`. Mitigation: assert the value is not `none` rather than matching the exact name. Alternatively, check that `animationDuration` is `2s` and `animationIterationCount` is `infinite`.

3. **Theme CSS loading in browser tests**: The theme test file imports `theme.css` directly. Vite should process this, but if the import path is wrong the variables won't resolve. Mitigation: verify in the first test that a known variable resolves to a non-empty value before testing specific values.

4. **`color-mix()` alpha resolution**: The resolved value of `color-mix(in srgb, #0072b2 15%, transparent)` should produce an `rgba()` value with alpha ~0.15. The exact computed representation may vary. Mitigation: assert the result contains `rgba` (has alpha component) and parse the alpha to verify it's approximately 0.15.

5. **Focus-visible activation**: `:focus-visible` requires the browser to detect keyboard navigation vs mouse. `userEvent.tab()` should trigger it, but the exact behavior depends on browser heuristics. Mitigation: if `tab()` does not trigger `:focus-visible`, use `element.focus()` after a keyboard event, or check `document.activeElement` and verify focus state.

## Summary

| Item                           | File                                                 | Test Count |
| ------------------------------ | ---------------------------------------------------- | ---------- |
| Theme CSS Variable Resolution  | `src/styles/theme.browser.test.tsx`                  | 7          |
| Token Selection Glow/Animation | `src/components/BattleViewer/Token.browser.test.tsx` | 5          |
| **Total**                      |                                                      | **12**     |

Phase total: 12 new browser tests, bringing the project total from 10 to 22 browser tests.

## New Decisions

None. This plan follows existing patterns established in ADR-022 (browser test convention, two-project workspace, `.browser.test.tsx` naming).
