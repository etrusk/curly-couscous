# Phase 3 Browser Test Designs

## Overview

Two new test files with 12 total browser-mode tests validating CSS behaviors that jsdom cannot process: `light-dark()` function resolution, `color-mix()` computed values, CSS Module filter/animation properties, and SVG attribute rendering in a real browser.

These tests complement existing jsdom tests:

- `theme-variables.test.ts` -- static CSS source analysis (structural/architectural)
- `theme.integration.test.tsx` -- DOM attribute mechanism (data-theme set/remove)
- Token jsdom tests -- click behavior, ARIA attributes, content rendering

The browser tests validate what the CSS **actually produces** at runtime.

---

## Shared Conventions (Both Files)

### Imports Pattern

All browser test files follow the established pattern from `BattleViewer.browser.test.tsx`:

```
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { page } from "vitest/browser";
```

### Color Format

`getComputedStyle` returns colors in `rgb(r, g, b)` or `rgba(r, g, b, a)` format, never hex. All expected values below use this format.

### CSS Module Name Mangling

Vite CSS Modules mangle class names (e.g., `.selected` becomes `_selected_abc12`). Use `[class*='className']` selectors or check for substring matches on `animationName`. Never match exact mangled names.

---

## Test File 1: Theme CSS Variable Resolution

**File:** `src/styles/theme.browser.test.tsx`

**Purpose:** Validate that `light-dark()` and `color-mix()` CSS functions resolve to correct computed color values across all three themes (dark, light, high-contrast).

### Shared Setup

#### Imports

```
import "../../styles/theme.css";  // Explicit import so Vite processes it
```

The explicit `theme.css` import is required because this test file does not render a component that would bring in the CSS via its module imports. Vite in browser mode processes the import and injects the styles into the document.

#### Helper: `setTheme(theme: string | null)`

Sets or removes `data-theme` attribute on `document.documentElement`.

- `setTheme("dark")` -- sets `data-theme="dark"`
- `setTheme("light")` -- sets `data-theme="light"`
- `setTheme("high-contrast")` -- sets `data-theme="high-contrast"`
- `setTheme(null)` -- removes `data-theme` (reverts to default dark)

#### Helper: `getCSSVar(name: string): string`

Wraps `getComputedStyle(document.documentElement).getPropertyValue(name).trim()`.
Returns the resolved computed value of a CSS custom property on `:root`.

#### `beforeEach` Cleanup

Remove `data-theme` and `data-high-contrast` attributes from `document.documentElement` to restore default dark theme state.

### Expected RGB Values Reference

Hex-to-RGB conversions for assertions:

| Hex       | RGB                  |
| --------- | -------------------- |
| `#242424` | `rgb(36, 36, 36)`    |
| `#fafafa` | `rgb(250, 250, 250)` |
| `#000000` | `rgb(0, 0, 0)`       |
| `#1e1e1e` | `rgb(30, 30, 30)`    |
| `#ffffff` | `rgb(255, 255, 255)` |
| `#2a2a2a` | `rgb(42, 42, 42)`    |
| `#0072b2` | `rgb(0, 114, 178)`   |
| `#0099ff` | `rgb(0, 153, 255)`   |
| `#d55e00` | `rgb(213, 94, 0)`    |
| `#ff6633` | `rgb(255, 102, 51)`  |
| `#333`    | `rgb(51, 51, 51)`    |
| `#f5f5f5` | `rgb(245, 245, 245)` |
| `#00a8ff` | `rgb(0, 168, 255)`   |

Note: `rgba(255, 255, 255, 0.87)` may be returned as-is or normalized. Browser may return `rgba(255, 255, 255, 0.87)` or `color(srgb ...)` depending on engine. Assertions should use `startsWith("rgb")` for format validation, then parse components for value checks.

---

### Test: dark-theme-resolves-surface-ground-to-dark-value

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: The `light-dark(#fafafa, #242424)` function with `color-scheme: dark` resolves to the dark branch value `#242424`
- **Setup**:
  1. `beforeEach` restores default (no `data-theme` attribute, which means dark theme)
  2. No additional setup needed -- default state is dark theme
- **Action**: Call `getCSSVar('--surface-ground')` to read the computed value from `:root`
- **Assertions**:
  1. The returned value is not empty (CSS loaded successfully -- serves as a smoke test for the entire file)
  2. The returned value starts with `rgb` (browser resolved the `light-dark()` function to an actual color)
  3. The returned value equals `rgb(36, 36, 36)` (the RGB equivalent of `#242424`, the dark branch of `light-dark(#fafafa, #242424)`)
- **Justification**: This is the foundational test for the entire theme system. jsdom cannot process `light-dark()` at all -- it returns the raw string. A real browser with `color-scheme: dark` must pick the second argument of `light-dark()`. If this test fails, all theme color resolution is broken. The non-empty check in assertion 1 also serves as an early diagnostic for CSS loading failures.

---

### Test: light-theme-resolves-surface-ground-to-light-value

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: Setting `data-theme="light"` (which sets `color-scheme: light`) causes `light-dark()` to resolve to its first (light) argument
- **Setup**:
  1. `beforeEach` restores default dark theme
  2. Call `setTheme("light")` to set `data-theme="light"` on `document.documentElement`
- **Action**: Call `getCSSVar('--surface-ground')` to read the computed value
- **Assertions**:
  1. The returned value starts with `rgb` (resolved, not raw function string)
  2. The returned value equals `rgb(250, 250, 250)` (the RGB equivalent of `#fafafa`, the light branch of `light-dark(#fafafa, #242424)`)
- **Justification**: The light theme block in `theme.css` contains only `color-scheme: light` with no variable overrides. The entire light theme depends on `light-dark()` flipping to its first argument. If `color-scheme: light` does not trigger the light branch, the light theme produces dark colors. This cannot be detected without a real CSS engine.

---

### Test: high-contrast-theme-resolves-surface-ground-to-pure-black

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: The high-contrast theme override block explicitly sets `--surface-ground: #000000`, overriding the `light-dark()` declaration from `:root`
- **Setup**:
  1. `beforeEach` restores default dark theme
  2. Call `setTheme("high-contrast")` to set `data-theme="high-contrast"`
- **Action**: Call `getCSSVar('--surface-ground')` to read the computed value
- **Assertions**:
  1. The returned value starts with `rgb`
  2. The returned value equals `rgb(0, 0, 0)` (pure black, from the explicit override `--surface-ground: #000000` in the `[data-theme="high-contrast"]` block)
- **Justification**: High-contrast theme uses explicit variable overrides (not `light-dark()`) on a selector `[data-theme="high-contrast"]` that must have higher specificity than `:root`. If CSS specificity is wrong, the `light-dark()` dark value (`#242424`) would win instead of pure black. This is a specificity/cascade test that only a real browser can validate.

---

### Test: light-dark-resolves-differently-for-dark-vs-light-themes

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: A representative set of `light-dark()` variables produce distinct computed values between dark and light themes, proving the function actually switches based on `color-scheme`
- **Setup**:
  1. `beforeEach` restores default dark theme
  2. Read computed values for `--content-primary`, `--grid-bg`, and `--cell-bg` in default (dark) state
  3. Call `setTheme("light")`
  4. Read the same variables again
- **Action**: Compare the two sets of computed values
- **Assertions**:
  1. `--content-primary` dark value differs from light value (dark: `rgba(255, 255, 255, 0.87)`, light: `rgb(51, 51, 51)`)
  2. `--grid-bg` dark value differs from light value (dark: `rgb(30, 30, 30)`, light: `rgb(245, 245, 245)`)
  3. `--cell-bg` dark value differs from light value (dark: `rgb(42, 42, 42)`, light: `rgb(255, 255, 255)`)
  4. All six values (3 dark + 3 light) start with `rgb` (all resolved successfully)
- **Justification**: Tests 1-2 verify individual variables but do not prove the switching mechanism works broadly. This test confirms multiple independent `light-dark()` declarations all flip simultaneously when `color-scheme` changes. A regression where `color-scheme: light` is removed from the light theme block would cause all these values to match, which this test catches. The breadth across surface/content/grid categories ensures coverage of the full variable taxonomy.

---

### Test: color-mix-produces-resolved-color-for-faction-friendly-bg

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: The `color-mix(in srgb, var(--faction-friendly) 15%, transparent)` function resolves to an actual RGBA color with a semi-transparent alpha channel in dark theme
- **Setup**:
  1. `beforeEach` restores default dark theme (dark theme uses the `color-mix()` branch of the `light-dark()` wrapper for `--faction-friendly-bg`)
- **Action**: Call `getCSSVar('--faction-friendly-bg')` to read the computed value
- **Assertions**:
  1. The returned value is not empty and does not contain the literal string `color-mix` (the browser resolved the function)
  2. The returned value contains `rgba` or has an alpha component (the mix with `transparent` produces a semi-transparent result)
  3. Parse the alpha component: it should be approximately 0.15 (within tolerance of 0.05), since `color-mix(in srgb, #0072b2 15%, transparent)` produces 15% opacity of the base color
  4. Parse the RGB components: red should be approximately 0, green approximately 114, blue approximately 178 -- allow tolerance of +/- 5 for rounding. Note: `color-mix` in sRGB with `transparent` adjusts the alpha channel to reflect the mix percentage; the RGB channels of the non-transparent color are preserved (not scaled). Chromium serializes this as `rgba(0, 114, 178, 0.15)`.
- **Justification**: `color-mix()` is a relatively new CSS function. jsdom does not support it. The test validates that: (a) the browser resolves the nested `var()` reference inside `color-mix()`, (b) the mix with `transparent` correctly produces an alpha channel, and (c) the percentage is applied correctly. A broken `color-mix()` implementation would return either the raw string or an incorrect color. Risk mitigation: assertion 4 uses approximate matching (tolerance +/- 5) to handle browser rounding differences in sRGB interpolation.

---

### Test: high-contrast-faction-colors-differ-from-dark-theme

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: The high-contrast override block produces distinct (brighter) faction and action colors compared to the default dark theme
- **Setup**:
  1. `beforeEach` restores default dark theme
  2. Read `--faction-friendly` and `--action-attack` in default dark state
  3. Call `setTheme("high-contrast")`
  4. Read the same variables again
- **Action**: Compare the two sets of computed values
- **Assertions**:
  1. Dark `--faction-friendly` equals `rgb(0, 114, 178)` (hex `#0072b2`)
  2. High-contrast `--faction-friendly` equals `rgb(0, 153, 255)` (hex `#0099ff`, brighter blue)
  3. Dark `--action-attack` equals `rgb(213, 94, 0)` (hex `#d55e00`)
  4. High-contrast `--action-attack` equals `rgb(255, 102, 51)` (hex `#ff6633`, brighter vermillion)
  5. The dark and high-contrast values differ for both variables
- **Justification**: The high-contrast theme intentionally brightens Okabe-Ito palette colors for better visibility on pure black backgrounds. If the override block's specificity is wrong or the selectors are broken, the dark theme values would leak through. This test validates that the `[data-theme="high-contrast"]` selector properly overrides `:root` declarations for non-`light-dark()` variables (plain hex values that are simply redeclared in the override block).

---

### Test: css-variables-cascade-into-rendered-element-backgrounds

- **File**: `src/styles/theme.browser.test.tsx`
- **Type**: integration
- **Verifies**: CSS custom properties defined on `:root` cascade into child elements and produce resolved `backgroundColor` values (not empty strings or literal `var()` references)
- **Setup**:
  1. `beforeEach` restores default dark theme
  2. Render a `<div>` element with inline style `backgroundColor: "var(--surface-ground)"` using Testing Library's `render()`
- **Action**: Call `getComputedStyle(div).backgroundColor` on the rendered element
- **Assertions**:
  1. The computed `backgroundColor` is not an empty string (CSS processed and cascaded)
  2. The computed `backgroundColor` does not contain the literal string `var(` (the variable was resolved, not passed through raw)
  3. The computed `backgroundColor` starts with `rgb` (it is a resolved color value)
  4. The computed `backgroundColor` equals `rgb(36, 36, 36)` (matches `--surface-ground` dark value, confirming the variable cascaded correctly from `:root` to the child element)
- **Justification**: Tests 1-6 read CSS variables directly from `:root` via `getPropertyValue()`. This test validates the full cascade path: `:root` declaration -> inherited/resolved property -> child element computed style. This is the path that actual components use (e.g., `background-color: var(--surface-ground)` in real components). A failure here would mean variables are defined on `:root` but don't cascade, which could happen if the CSS is loaded in a shadow DOM or scoped context.

---

## Test File 2: Token Selection Glow and Animation

**File:** `src/components/BattleViewer/Token.browser.test.tsx`

**Purpose:** Validate CSS-driven visual feedback on Token that jsdom cannot verify: selection glow filter, animation properties, focus-visible filter, and HP bar width in a real browser.

### Shared Setup

#### Imports

```
import { BattleViewer } from "./BattleViewer";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter } from "../RuleEvaluations/rule-evaluations-test-helpers";
import userEvent from "@testing-library/user-event";
```

`BattleViewer` is rendered (not `Token` directly) because `Token` is an SVG child that requires its parent SVG context. `BattleViewer` imports CSS Modules that include `Token.module.css`, ensuring all styles are loaded.

#### `beforeEach` Cleanup

Following the pattern from `BattleViewer.browser.test.tsx`:

1. `const { actions } = useGameStore.getState()`
2. `actions.initBattle([])`
3. `actions.selectCharacter(null)`
4. Also remove `data-theme` attribute to ensure default dark theme

#### Standard Characters

Every test creates at least two characters (friendly + enemy) since `BattleViewer` needs characters to render tokens. Use `createCharacter()` helper for the friendly token and a minimal enemy character.

### CSS Module Class Name Note

`Token.module.css` classes are mangled by Vite (e.g., `.selected` -> `_selected_xxxx`). Tests should locate elements via `data-testid` attributes (e.g., `token-char-1`) and check computed styles, not class names. For the `.selected` class, the test verifies the visual result (filter, animation) rather than the class string.

---

### Test: selected-token-has-drop-shadow-filter

- **File**: `src/components/BattleViewer/Token.browser.test.tsx`
- **Type**: integration
- **Verifies**: A programmatically selected token has a CSS `filter` containing `drop-shadow`, proving the `.selected` CSS Module class applies its multi-layer drop-shadow filter in a real browser
- **Setup**:
  1. Set viewport to `1280x720` via `page.viewport()`
  2. Create friendly character (`id: "char-1"`, position `{q: 0, r: 0}`) and enemy character (`id: "enemy-1"`, position `{q: 2, r: 0}`)
  3. `actions.initBattle([character, enemy])`
  4. `actions.selectCharacter("char-1")` -- programmatic selection avoids click event complications with SVG hit areas
  5. `render(<BattleViewer />)`
- **Action**: Query `screen.getByTestId("token-char-1")` and read `getComputedStyle(element).filter`
- **Assertions**:
  1. The computed `filter` is not `none` and is not an empty string (a filter is applied)
  2. The computed `filter` contains the string `drop-shadow` (the correct filter type from `.selected { filter: drop-shadow(...) }`)
  3. The computed `filter` contains at least two occurrences of `drop-shadow` (the `.selected` class uses three stacked drop-shadows: `0 0 8px`, `0 0 16px`, `0 0 24px`)
- **Justification**: jsdom returns an empty string for `getComputedStyle().filter` because it does not process CSS Module stylesheets. The selection glow is a critical visual indicator -- if it silently breaks (e.g., CSS Module class not applied, variable `--accent-primary` undefined), users cannot see which character is selected. This test catches such regressions. The multi-shadow check (assertion 3) ensures the full glow effect is present, not just a single shadow.

---

### Test: unselected-token-has-no-drop-shadow-filter

- **File**: `src/components/BattleViewer/Token.browser.test.tsx`
- **Type**: integration
- **Verifies**: A token that is NOT selected has no `drop-shadow` filter applied, confirming the `.selected` class is not leaking to unselected tokens
- **Setup**:
  1. Set viewport to `1280x720`
  2. Create friendly character (`id: "char-1"`, position `{q: 0, r: 0}`) and enemy character (`id: "enemy-1"`, position `{q: 2, r: 0}`)
  3. `actions.initBattle([character, enemy])`
  4. Do NOT call `selectCharacter` (no character selected)
  5. `render(<BattleViewer />)`
- **Action**: Query `screen.getByTestId("token-char-1")` and read `getComputedStyle(element).filter`
- **Assertions**:
  1. The computed `filter` is either `none` or does not contain `drop-shadow` (no glow applied)
- **Justification**: This is the negative complement to the selected test. If CSS specificity is wrong (e.g., `.token` accidentally inherits filter from a parent), all tokens could have glow effects regardless of selection state. The test ensures the filter is exclusively applied when `.selected` is present. Together with the selected test, this pair validates conditional CSS class application through the real CSS engine.

---

### Test: selected-token-has-active-animation

- **File**: `src/components/BattleViewer/Token.browser.test.tsx`
- **Type**: integration
- **Verifies**: A selected token has the `selectionPulse` CSS animation active with the correct duration and iteration count
- **Setup**:
  1. Set viewport to `1280x720`
  2. Create friendly character and enemy character
  3. `actions.initBattle([character, enemy])`
  4. `actions.selectCharacter("char-1")`
  5. `render(<BattleViewer />)`
- **Action**: Query `screen.getByTestId("token-char-1")` and read animation-related computed style properties
- **Assertions**:
  1. `getComputedStyle(element).animationName` is not `none` (an animation is active). Note: CSS Modules may mangle the keyframe name (e.g., `selectionPulse` -> `_selectionPulse_abc12`), so assert not-none rather than exact name match
  2. `getComputedStyle(element).animationDuration` equals `2s` (from `.selected { animation: selectionPulse 2s ease-in-out infinite }`)
  3. `getComputedStyle(element).animationIterationCount` equals `infinite` (the pulse loops forever while selected)
  4. `getComputedStyle(element).animationTimingFunction` equals `ease-in-out` (matches the declared timing)
- **Justification**: CSS animations are completely invisible to jsdom. The `selectionPulse` animation provides a pulsing glow that draws attention to the selected token. If the `@keyframes` block is removed or the animation shorthand is malformed, the token would have a static glow instead of pulsing. This test validates the full animation declaration chain: `.selected` class -> `animation` shorthand -> `@keyframes selectionPulse`. Risk mitigation: assertion 1 uses not-none instead of exact name matching to handle CSS Module keyframe name mangling.

---

### Test: focus-visible-token-has-drop-shadow-filter

- **File**: `src/components/BattleViewer/Token.browser.test.tsx`
- **Type**: integration
- **Verifies**: A token that receives keyboard focus (via Tab) has a `drop-shadow` filter from the `:focus-visible` CSS rule
- **Setup**:
  1. Set viewport to `1280x720`
  2. Create friendly character and enemy character
  3. `actions.initBattle([character, enemy])`
  4. Do NOT select any character (so `.selected` filter is not applied)
  5. `render(<BattleViewer />)`
  6. Set up `userEvent.setup()`
- **Action**:
  1. Press Tab key via `user.tab()` to move keyboard focus to the first focusable token element (tokens have `tabIndex={0}`)
  2. Verify the focused element is a token by checking `document.activeElement` has a `data-testid` starting with `token-`
  3. Read `getComputedStyle(document.activeElement).filter`
- **Assertions**:
  1. `document.activeElement` has a `data-testid` attribute starting with `token-` (focus actually reached a token, not some other element)
  2. The computed `filter` contains `drop-shadow` (the `:focus-visible` rule applies `drop-shadow(0 0 4px ...) drop-shadow(0 0 8px ...)`)
  3. The `drop-shadow` values are from the focus rule, not the selection rule: the focus shadows use `4px` and `8px` blur radii while selection uses `8px`, `16px`, `24px`. Validate by checking the filter string contains `4px` (focus-specific blur radius)
- **Justification**: `:focus-visible` is a CSS pseudo-class that only activates during keyboard navigation (not mouse clicks). jsdom does not implement `:focus-visible` styling. Keyboard accessibility is a critical requirement (WCAG 2.2 AA compliance per spec). If the `:focus-visible` rule breaks, keyboard users see no visual indication of which token has focus. Risk mitigation: if `user.tab()` does not trigger `:focus-visible` in the browser (edge case with focus heuristics), an alternative approach is to dispatch a keyboard event first then call `element.focus()`. The test should check `document.activeElement` before asserting filter to diagnose focus-delivery failures separately from CSS failures. Assertion 3 distinguishes focus glow from selection glow to ensure the correct CSS rule fired.

---

### Test: hp-bar-fill-width-reflects-hp-proportion

- **File**: `src/components/BattleViewer/Token.browser.test.tsx`
- **Type**: integration
- **Verifies**: The HP bar fill `<rect>` SVG element has its `width` attribute set proportionally to the character's HP ratio, and this attribute is present in the real DOM
- **Setup**:
  1. Set viewport to `1280x720`
  2. Create friendly character with `hp: 50`, `maxHp: 100` (50% health)
  3. Create enemy character (standard)
  4. `actions.initBattle([character, enemy])`
  5. `render(<BattleViewer />)`
- **Action**: Query `screen.getByTestId("health-bar-char-1")` to get the HP fill rect element, read its `width` attribute
- **Assertions**:
  1. The element exists (the `data-testid="health-bar-char-1"` is present in the real SVG DOM)
  2. The `width` attribute (via `getAttribute('width')`) equals `"20"` (50% of `HP_BAR_WIDTH=40`, computed as `(50/100) * 40 = 20`)
  3. The element tag name is `rect` (it is an SVG rect, not some other element)
- **Justification**: While the `width` attribute is technically testable in jsdom via `getAttribute()`, this test validates the complete rendering pipeline in a real browser: React renders the SVG, Vite processes the CSS Module, and the `<rect>` element appears in the actual DOM with computed dimensions. The HP bar is a "Level 1 - Glanceable" UI element per the spec's progressive disclosure hierarchy, making its correctness critical. The specific value `20` validates the calculation `Math.max(0, Math.min(HP_BAR_WIDTH, (hp / maxHp) * HP_BAR_WIDTH))` with `hp=50, maxHp=100, HP_BAR_WIDTH=40`. This test also serves as a baseline for future HP animation tests (the CSS `transition: width 0.3s ease-out` on `.hpBarFill`).

---

## Risk Mitigations

### 1. Color Format Matching

**Risk:** `getComputedStyle` returns `rgb()`/`rgba()` format, not hex. Rounding differences possible.

**Mitigation:** All assertions use `rgb(r, g, b)` format. For `color-mix()` results where exact values may vary due to sRGB interpolation rounding, use approximate matching with tolerance (+/- 5 per component, +/- 0.05 for alpha). A helper function `parseRGBA(colorString)` should be created to extract numeric components for approximate comparison.

### 2. CSS Module Name Mangling

**Risk:** `animationName` in computed style is the mangled keyframe name (e.g., `_selectionPulse_abc12`), not `selectionPulse`.

**Mitigation:** Test 3 (selected-token-has-active-animation) asserts `animationName !== "none"` rather than matching the exact name. The animation's other properties (`duration: 2s`, `iterationCount: infinite`, `timingFunction: ease-in-out`) are not mangled and can be matched exactly.

### 3. Theme CSS Loading in Browser Tests

**Risk:** The theme test file imports `theme.css` directly. If Vite does not process this import, variables will not resolve.

**Mitigation:** Test 1 (dark-theme-resolves-surface-ground) includes a smoke check: assert the returned value is not empty before checking the specific color. If the value is empty, the error message will indicate a CSS loading problem rather than a color mismatch.

### 4. `color-mix()` Alpha Resolution

**Risk:** The exact computed representation of `color-mix(in srgb, #0072b2 15%, transparent)` may vary between browser versions. Chromium returns `rgba(0, 114, 178, 0.15)` -- the RGB channels are preserved and the alpha reflects the mix percentage. Some newer browsers may use `color(srgb ...)` syntax instead of `rgba()`.

**Mitigation:** Test 5 (color-mix-produces-resolved-color) uses approximate assertions: alpha within 0.05 tolerance, RGB components within +/- 5 tolerance. The test also accepts both `rgba()` and `color()` formats. RGB values are expected to match the base color (`#0072b2` = 0, 114, 178), not scaled by the mix percentage, since `color-mix` with `transparent` in sRGB adjusts alpha rather than RGB channels.

### 5. Focus-Visible Activation

**Risk:** `:focus-visible` requires the browser to detect keyboard navigation vs mouse. `userEvent.tab()` should trigger it, but browser heuristics vary.

**Mitigation:** Test 4 (focus-visible-token-has-drop-shadow-filter) first verifies focus delivery by checking `document.activeElement` before asserting the filter. If Tab does not reach a token (e.g., other focusable elements intercept), the test fails at assertion 1 with a clear diagnostic. If focus is delivered but `:focus-visible` does not activate, the test can be adjusted to use `page.keyboard.press('Tab')` (Playwright-level keyboard) instead of `userEvent.tab()` (JS-level).

### 6. SVG Computed Style Specifics

**Risk:** SVG `<g>` elements may not report `filter` via `getComputedStyle` the same way HTML elements do.

**Mitigation:** The existing Phase 2 test (`BattleViewer.browser.test.tsx`) successfully uses `getComputedStyle` on token `<g>` elements for z-index checks. The `filter` property should similarly resolve. If SVG `<g>` elements do not report filter, an alternative is to check the style attribute directly or query the child shape element instead.

---

## Summary

| #   | Test Name                                                 | File                   | Type        | Key Assertion                                           |
| --- | --------------------------------------------------------- | ---------------------- | ----------- | ------------------------------------------------------- |
| 1   | dark-theme-resolves-surface-ground-to-dark-value          | theme.browser.test.tsx | integration | `--surface-ground` = `rgb(36, 36, 36)`                  |
| 2   | light-theme-resolves-surface-ground-to-light-value        | theme.browser.test.tsx | integration | `--surface-ground` = `rgb(250, 250, 250)`               |
| 3   | high-contrast-theme-resolves-surface-ground-to-pure-black | theme.browser.test.tsx | integration | `--surface-ground` = `rgb(0, 0, 0)`                     |
| 4   | light-dark-resolves-differently-for-dark-vs-light-themes  | theme.browser.test.tsx | integration | 3 variables differ between themes                       |
| 5   | color-mix-produces-resolved-color-for-faction-friendly-bg | theme.browser.test.tsx | integration | RGBA with alpha ~0.15                                   |
| 6   | high-contrast-faction-colors-differ-from-dark-theme       | theme.browser.test.tsx | integration | `--faction-friendly` differs, `--action-attack` differs |
| 7   | css-variables-cascade-into-rendered-element-backgrounds   | theme.browser.test.tsx | integration | `div.backgroundColor` = resolved RGB                    |
| 8   | selected-token-has-drop-shadow-filter                     | Token.browser.test.tsx | integration | filter contains `drop-shadow` (x3)                      |
| 9   | unselected-token-has-no-drop-shadow-filter                | Token.browser.test.tsx | integration | filter is `none` or no `drop-shadow`                    |
| 10  | selected-token-has-active-animation                       | Token.browser.test.tsx | integration | animationDuration=2s, iterationCount=infinite           |
| 11  | focus-visible-token-has-drop-shadow-filter                | Token.browser.test.tsx | integration | focus filter contains `drop-shadow` + `4px`             |
| 12  | hp-bar-fill-width-reflects-hp-proportion                  | Token.browser.test.tsx | integration | width attribute = "20" for 50/100 HP                    |
