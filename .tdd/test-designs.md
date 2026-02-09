# Test Designs: CSS `light-dark()` and `color-mix()` Adoption

## Overview

These test designs cover the restructuring of `src/styles/theme.css` from a 3-block pattern to a 2-block pattern using CSS `light-dark()`, the adoption of `color-mix()` for derived alpha tokens, the WhiffOverlay `color-mix()` fill migration, and the removal of `color-scheme: light dark` from `src/index.css`.

All tests use **static file analysis** (reading CSS/TSX files as text and asserting via regex), consistent with the existing pattern in `theme-variables.test.ts`. jsdom cannot process CSS custom properties or `light-dark()`, so runtime assertions on computed styles are not viable.

---

## File: `src/styles/theme-variables.test.ts`

### Existing Tests That Must Change

The following existing tests will **break** after the refactor and must be updated as part of the implementation. The designs below replace them.

- `--text-on-faction variable > should be defined in light theme` -- currently asserts `--text-on-faction` exists in the `[data-theme="light"]` block, which will shrink to just `color-scheme: light`.
- `--accent-primary variable > should be defined in light theme` -- same issue.

These two tests are replaced by new tests below that verify light-theme coverage through the `light-dark()` mechanism instead.

---

### Test: root-block-has-color-scheme-dark

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: The `:root` block sets `color-scheme: dark` as the default, which is required for `light-dark()` to resolve to its dark-value argument.
- **Setup**: Read `theme.css` as text. Extract the `:root` block using the existing `/:root\s*\{([^}]+)\}/s` regex.
- **Assertions**:
  1. The `:root` block contains `color-scheme: dark` (regex: `/color-scheme\s*:\s*dark\s*;/`)
- **Justification**: `light-dark()` resolution depends on the inherited `color-scheme` property. If `:root` does not default to `dark`, all `light-dark()` calls would resolve incorrectly in the default (dark) theme. This is the foundational invariant of the new architecture.

---

### Test: light-theme-block-sets-color-scheme-light

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: The `[data-theme="light"]` block sets `color-scheme: light`, which flips `light-dark()` resolution to choose the light-value argument.
- **Setup**: Read `theme.css` as text. Extract the `[data-theme="light"]` block using `/:root\[data-theme="light"\]\s*\{([^}]+)\}/s`.
- **Assertions**:
  1. The light-theme block contains `color-scheme: light` (regex: `/color-scheme\s*:\s*light\s*;/`)
- **Justification**: Without `color-scheme: light` in this block, switching to light theme via `data-theme="light"` would not cause `light-dark()` values to resolve to their light arguments. This is the mechanism that replaces the full variable override block.

---

### Test: light-theme-block-is-minimal

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: The `[data-theme="light"]` block contains only `color-scheme` and no CSS custom property definitions. This confirms the full light/dark unification via `light-dark()` is complete -- no variables are still manually overridden in the light block.
- **Setup**: Read `theme.css` as text. Extract the `[data-theme="light"]` block content.
- **Assertions**:
  1. The light-theme block does NOT contain any `--` custom property declarations (regex: assert no match for `/--[\w-]+\s*:/`)
  2. The light-theme block DOES contain `color-scheme` (ensuring the block is not empty/missing)
- **Justification**: If any `--variable` declarations remain in the light block, the migration to `light-dark()` is incomplete. This test enforces that the light block's sole purpose is to flip `color-scheme`, which is the core architectural change.

---

### Test: high-contrast-block-has-color-scheme-dark

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: The `[data-theme="high-contrast"]` block sets `color-scheme: dark`, ensuring `light-dark()` values resolve to their dark arguments in high-contrast mode (high-contrast is a dark-themed variant).
- **Setup**: Read `theme.css` as text. Extract the `[data-theme="high-contrast"]` block.
- **Assertions**:
  1. The high-contrast block contains `color-scheme: dark` (regex: `/color-scheme\s*:\s*dark\s*;/`)
- **Justification**: High-contrast mode uses brightened colors on black backgrounds (a dark variant). Without explicitly setting `color-scheme: dark`, a user's OS-level light preference could cause `light-dark()` values inherited from `:root` to resolve incorrectly. The explicit declaration ensures deterministic behavior.

---

### Test: root-block-uses-light-dark-for-differing-variables

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: Variables that differ between dark and light themes use the `light-dark()` function in the `:root` block, confirming the unification strategy is applied.
- **Setup**: Read `theme.css` as text. Extract the `:root` block.
- **Assertions**:
  1. `--surface-ground` value contains `light-dark(` (regex: `/--surface-ground\s*:\s*light-dark\(/`)
  2. `--content-primary` value contains `light-dark(` (regex: `/--content-primary\s*:\s*light-dark\(/`)
  3. `--accent-primary` value contains `light-dark(` (regex: `/--accent-primary\s*:\s*light-dark\(/`)
  4. `--grid-bg` value contains `light-dark(` (regex: `/--grid-bg\s*:\s*light-dark\(/`)
  5. `--ground` (terminal overlay) value contains `light-dark(` (regex: `/--ground\s*:\s*light-dark\(/`)
- **Justification**: These five variables are sampled from different token categories (surfaces, content, token/accent, grid, terminal overlay). If any of them lacks `light-dark()`, the unification is incomplete for that category. This catches partial migrations without exhaustively testing all ~43 variables.

---

### Test: root-block-keeps-simple-values-for-identical-variables

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: Variables that are identical across dark and light themes do NOT use `light-dark()` -- they remain simple values. Using `light-dark()` for identical values would be unnecessary complexity.
- **Setup**: Read `theme.css` as text. Extract the `:root` block. For each tested variable, extract the full declaration value (from `--var:` to `;`).
- **Assertions**:
  1. `--faction-friendly` value does NOT contain `light-dark(` (it is `#0072b2` in both themes)
  2. `--action-attack` value does NOT contain `light-dark(` (it is `#d55e00` in both themes)
  3. `--text-on-faction` value does NOT contain `light-dark(` (it is `#ffffff` in both themes)
  4. `--radius-sm` value does NOT contain `light-dark(` (design tokens, identical across themes)
- **Justification**: Unnecessary `light-dark()` wrapping on identical values adds complexity without benefit. If a future change accidentally wraps these, the test catches it. Also validates that the `--text-on-faction` variable (previously tested for presence in the light block) is correctly handled as a simple value.

---

### ~~Test: text-on-faction-defined-in-root~~ (REMOVED BY REVIEWER)

> **Removed**: This test is redundant with the existing `--text-on-faction > should be defined in dark theme` test (line 23 of current file), which already asserts `--text-on-faction:` exists in the `:root` block. No new test code needed; the existing KEEP test covers this.

---

### Test: accent-primary-uses-light-dark-in-root (replaces old light-theme test)

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: `--accent-primary` uses `light-dark()` in the `:root` block, confirming light-theme coverage (dark: `#00a8ff`, light: `#0072b2`).
- **Setup**: Read `theme.css` as text. Extract the `:root` block.
- **Assertions**:
  1. The `:root` block contains `--accent-primary` with a `light-dark(` value
- **Justification**: Replaces the old "should be defined in light theme" test which looked for `--accent-primary` in the `[data-theme="light"]` block. Since `--accent-primary` differs between dark (`#00a8ff`) and light (`#0072b2`), it must use `light-dark()`. This test confirms light-theme coverage through the new mechanism.

---

### Test: light-dark-argument-order-light-first (ADDED BY REVIEWER)

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: `light-dark()` calls place the light value as the first argument and the dark value as the second argument. The CSS `light-dark()` function resolves its first argument when `color-scheme` is `light` and its second argument when `color-scheme` is `dark`. Swapping the arguments would silently invert both themes.
- **Setup**: Read `theme.css` as text. Extract the `:root` block. Find the `--surface-ground` declaration value.
- **Assertions**:
  1. `--surface-ground` contains `light-dark(` (precondition -- already tested elsewhere)
  2. `--surface-ground` light-dark arguments are in the correct order: light value `#fafafa` appears before dark value `#242424` (regex: `/--surface-ground\s*:\s*light-dark\(\s*#fafafa\s*,\s*#242424\s*\)/`)
- **Justification**: A static CSS analysis test cannot resolve `light-dark()` at runtime; jsdom does not support it. If the coder reverses the argument order, all themes would visually invert (dark theme shows light colors, light theme shows dark colors). Spot-checking one well-known variable (`--surface-ground`, whose values are `#fafafa` light and `#242424` dark) catches this class of error. This is the most important correctness check that no other test covers.

---

### Test: faction-bg-color-mix-nested-in-light-dark (ADDED BY REVIEWER)

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: Faction background tokens that use `color-mix()` for their dark-theme value are properly nested inside a `light-dark()` call. The light-theme value for these tokens is an opaque hex color (e.g., `#e6f2ff`), not a `color-mix()` expression. Without `light-dark()` wrapping, the light theme would incorrectly display the semi-transparent `color-mix()` value.
- **Setup**: Read `theme.css` as text. Extract the `:root` block. Find the `--faction-friendly-bg` declaration value.
- **Assertions**:
  1. `--faction-friendly-bg` value contains both `light-dark(` and `color-mix(` (regex: `/--faction-friendly-bg\s*:[^;]*light-dark\([^;]*color-mix\(/`)
  2. `--faction-friendly-bg` value contains the light-theme opaque hex value `#e6f2ff` before the `color-mix()` call (regex: `/--faction-friendly-bg\s*:[^;]*light-dark\(\s*#e6f2ff\s*,\s*color-mix\(/`)
- **Justification**: The plan specifies a nested pattern: `light-dark(#e6f2ff, color-mix(in srgb, var(--faction-friendly) 15%, transparent))`. The existing `color-mix-used-for-faction-bg-tokens` test only checks for `color-mix()` and `var()` presence but does not verify the `light-dark()` wrapper. If `color-mix()` is used without `light-dark()`, the light theme would show a semi-transparent color over a light background instead of the intended opaque `#e6f2ff`. This test closes that gap.

---

### Test: color-mix-used-for-faction-bg-tokens

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: Faction background tokens use `color-mix()` referencing their base faction variable, rather than hardcoded `rgba()` values.
- **Setup**: Read `theme.css` as text. Extract the `:root` block.
- **Assertions**:
  1. `--faction-friendly-bg` value contains `color-mix(` (regex: `/--faction-friendly-bg\s*:[^;]*color-mix\(/`)
  2. `--faction-friendly-bg` value references `var(--faction-friendly)` (regex: `/--faction-friendly-bg\s*:[^;]*var\(--faction-friendly\)/)
  3. `--faction-enemy-bg` value contains `color-mix(` (regex: `/--faction-enemy-bg\s*:[^;]*color-mix\(/`)
  4. `--faction-enemy-bg` value references `var(--faction-enemy)` (regex: `/--faction-enemy-bg\s*:[^;]*var\(--faction-enemy\)/)
- **Justification**: The primary value of `color-mix()` is creating a dependency chain -- changing `--faction-friendly` automatically updates `--faction-friendly-bg`. If the implementation hardcodes RGB values inside `color-mix()` instead of referencing the variable, this benefit is lost. Testing both `color-mix(` presence AND `var()` reference prevents this regression.

---

### Test: color-mix-used-for-status-bg-tokens

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: Status background tokens use `color-mix()` referencing their base status variable.
- **Setup**: Read `theme.css` as text. Extract the `:root` block.
- **Assertions**:
  1. `--status-success-bg` value contains `color-mix(` and `var(--status-success)`
  2. `--status-error-bg` value contains `color-mix(` and `var(--status-error)`
  3. `--status-warning-bg` value contains `color-mix(` and `var(--status-warning)`
  4. `--status-neutral-bg` value contains `color-mix(` and `var(--status-neutral)`
- **Justification**: All four status-bg tokens follow the same pattern as faction-bg: alpha variants of a named base color. If any are missed during implementation, the derived color won't track the base color. Testing all four catches partial migrations.

---

### Test: color-mix-used-for-accent-and-danger-subtle-tokens

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: Terminal overlay accent and danger derived tokens use `color-mix()` referencing their base variables.
- **Setup**: Read `theme.css` as text. Extract the `:root` block.
- **Assertions**:
  1. `--accent-subtle` value contains `color-mix(` and `var(--accent)`
  2. `--accent-muted` value contains `color-mix(` and `var(--accent)`
  3. `--danger-subtle` value contains `color-mix(` and `var(--danger)`
- **Justification**: These three tokens are in the terminal overlay layer (ADR-019) and follow the same derived-from-base pattern. They are separated from the status tokens test because they belong to a different semantic layer, and a coder might handle the terminal overlay tokens separately.

---

### Test: color-mix-in-high-contrast-bg-tokens

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: The high-contrast block also uses `color-mix()` for its background tokens, referencing high-contrast base colors.
- **Setup**: Read `theme.css` as text. Extract the `[data-theme="high-contrast"]` block.
- **Assertions**:
  1. `--faction-friendly-bg` in the high-contrast block contains `color-mix(` and `var(--faction-friendly)`
  2. `--status-success-bg` in the high-contrast block contains `color-mix(` and `var(--status-success)`
- **Justification**: The plan specifies high-contrast `rgba()` bg tokens should also convert to `color-mix()`. Testing two representative tokens (one faction, one status) verifies the pattern is applied consistently in this block. The high-contrast block redefines base colors (e.g., `--faction-friendly: #0099ff`), so `color-mix()` here derives from those brighter values -- a different path than the `:root` block.

---

### Test: no-light-dark-in-high-contrast-block

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: The high-contrast block does not use `light-dark()` -- it remains a full override block with explicit values.
- **Setup**: Read `theme.css` as text. Extract the `[data-theme="high-contrast"]` block.
- **Assertions**:
  1. The high-contrast block does NOT contain `light-dark(` (regex: assert no match)
- **Justification**: `light-dark()` is only meaningful in the `:root` block where it handles the dark/light axis. High-contrast is a complete override theme that sets `color-scheme: dark` and defines all its own values. If `light-dark()` appears here, it indicates a misunderstanding of the architecture (high-contrast is not a dark/light variant, it is a third mode).

---

### ~~Test: existing-dark-theme-tests-still-pass~~ (RECLASSIFIED BY REVIEWER)

> **Reclassified**: These are existing tests that require no code changes, not new test designs. They are already tracked in the KEEP rows of the summary table. No new test code needed.

---

### ~~Test: existing-high-contrast-tests-still-pass~~ (RECLASSIFIED BY REVIEWER)

> **Reclassified**: These are existing tests that require no code changes, not new test designs. They are already tracked in the KEEP rows of the summary table. No new test code needed.

---

## File: `src/index.css` (verified via static analysis in theme-variables.test.ts)

### Test: index-css-no-color-scheme-declaration

- **File**: `src/styles/theme-variables.test.ts`
- **Type**: unit
- **Verifies**: `src/index.css` does not contain a `color-scheme` declaration. The `color-scheme: light dark` line must be removed because `color-scheme` is now managed per-theme in `theme.css`.
- **Setup**: Read `src/index.css` as text (using `readFileSync` with a path relative to `__dirname`, navigating up one directory: `join(__dirname, "..", "index.css")`).
- **Assertions**:
  1. The file content does NOT contain `color-scheme` (regex: assert no match for `/color-scheme\s*:/`)
- **Justification**: Having `color-scheme: light dark` in `index.css` tells the browser to support both schemes simultaneously, which conflicts with the per-theme `color-scheme` declarations in `theme.css`. If this line is not removed, `light-dark()` may resolve ambiguously. Since `index.css` is imported before `theme.css`, the conflicting declaration could cause subtle bugs depending on CSS specificity.

---

## File: `src/components/BattleViewer/WhiffOverlay.test.tsx`

### Existing Tests That Must Change

- `whiff polygons have low opacity (0.2)` (line 104) -- currently asserts `opacity="0.2"` attribute. The polygon will no longer have an `opacity` attribute; instead opacity is baked into `fill` via `color-mix()`.
- `attack whiff uses action-attack color fill` (line 68) -- currently asserts `fill` is exactly `var(--action-attack)`. The fill will now be `color-mix(in srgb, var(--action-attack) 20%, transparent)`.
- `heal whiff uses action-heal color fill` (line 86) -- same issue with `var(--action-heal)`.

---

### Test: whiff-polygon-fill-uses-color-mix-with-attack-color

- **File**: `src/components/BattleViewer/WhiffOverlay.test.tsx`
- **Type**: unit
- **Verifies**: Attack whiff polygons use `color-mix()` in the fill attribute, wrapping the `--action-attack` CSS variable with the correct opacity percentage.
- **Setup**: Create a character, init battle, add a whiff event with `actionType: "attack"`, render `WhiffOverlay`.
- **Assertions**:
  1. The polygon's `fill` attribute contains `color-mix(` (regex match on `getAttribute("fill")`)
  2. The polygon's `fill` attribute contains `var(--action-attack)` (the base color variable)
  3. The polygon's `fill` attribute contains `20%` (the opacity percentage matching the original 0.2 opacity)
  4. The polygon's `fill` attribute contains `transparent` (the mixing target)
- **Justification**: Replaces the old `fill === "var(--action-attack)"` assertion. The fill now includes the opacity via `color-mix()`, so a simple equality check would fail. Testing for each component (`color-mix`, variable name, percentage, `transparent`) ensures the implementation is correct and not just any `color-mix()` call.

---

### Test: whiff-polygon-fill-uses-color-mix-with-heal-color

- **File**: `src/components/BattleViewer/WhiffOverlay.test.tsx`
- **Type**: unit
- **Verifies**: Heal whiff polygons use `color-mix()` in the fill attribute, wrapping the `--action-heal` CSS variable.
- **Setup**: Create a character, init battle, add a whiff event with `actionType: "heal"`, render `WhiffOverlay`.
- **Assertions**:
  1. The polygon's `fill` attribute contains `color-mix(`
  2. The polygon's `fill` attribute contains `var(--action-heal)`
  3. The polygon's `fill` attribute contains `20%`
  4. The polygon's `fill` attribute contains `transparent`
- **Justification**: Mirrors the attack-color test for the heal action type. Both action types must use `color-mix()` with their respective CSS variables. If the heal path is missed, heal whiffs would render differently from attack whiffs.

---

### Test: whiff-polygon-no-opacity-attribute

- **File**: `src/components/BattleViewer/WhiffOverlay.test.tsx`
- **Type**: unit
- **Verifies**: Whiff polygons no longer have an `opacity` SVG attribute. The opacity is now baked into the `fill` via `color-mix()`.
- **Setup**: Create a character, init battle, add a whiff event with `actionType: "attack"`, render `WhiffOverlay`.
- **Assertions**:
  1. The polygon does NOT have an `opacity` attribute (`expect(polygon).not.toHaveAttribute("opacity")`)
- **Justification**: Replaces the old `expect(polygon).toHaveAttribute("opacity", "0.2")` test. If both `opacity` and `color-mix()` are present, the visual result would be double-faded (0.2 opacity on an already 20%-mixed color = 4% effective opacity). This test prevents that regression.

---

### Test: whiff-overlay-no-opacity-constant-in-source

- **File**: `src/components/BattleViewer/WhiffOverlay.test.tsx`
- **Type**: unit
- **Verifies**: The `WHIFF_FILL_OPACITY` constant has been removed from the WhiffOverlay source file. Dead constants create confusion about the implementation approach.
- **Setup**: Read `src/components/BattleViewer/WhiffOverlay.tsx` as text using `readFileSync`.
- **Assertions**:
  1. The file content does NOT contain `WHIFF_FILL_OPACITY` (string or regex match)
- **Justification**: The plan explicitly calls for removing this constant (Phase 2, step 1). If it remains but is unused, it is dead code that misleads future developers into thinking opacity is still applied as a separate attribute. Static analysis catches this cleanly.

---

### Tests That Remain Unchanged

The following existing tests in `WhiffOverlay.test.tsx` require NO changes:

- `renders no polygons when no whiff data` (line 34) -- SVG structure unchanged
- `renders hex polygon for each whiff cell` (line 46) -- polygon count logic unchanged
- `whiff overlay has no pointer events CSS class` (line 122) -- CSS class unchanged
- `whiff overlay shares grid viewBox` (line 133) -- viewBox logic unchanged

---

## Summary of Test Changes by File

### `src/styles/theme-variables.test.ts`

| Action | Test                                                           | Reason                                                           |
| ------ | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| REMOVE | `--text-on-faction > should be defined in light theme`         | Light block no longer contains variables                         |
| REMOVE | `--accent-primary > should be defined in light theme`          | Light block no longer contains variables                         |
| KEEP   | `--text-on-faction > should be defined in dark theme`          | `:root` block still has this variable                            |
| KEEP   | `--text-on-faction > should be defined in high-contrast theme` | High-contrast block unchanged                                    |
| KEEP   | `--accent-primary > should be defined in dark theme`           | `:root` block still has this variable                            |
| KEEP   | `--accent-primary > should be defined in high-contrast theme`  | High-contrast block unchanged                                    |
| ADD    | `root-block-has-color-scheme-dark`                             | New architectural invariant                                      |
| ADD    | `light-theme-block-sets-color-scheme-light`                    | New architectural invariant                                      |
| ADD    | `light-theme-block-is-minimal`                                 | Enforces complete migration                                      |
| ADD    | `high-contrast-block-has-color-scheme-dark`                    | New architectural invariant                                      |
| ADD    | `root-block-uses-light-dark-for-differing-variables`           | Verifies unification mechanism                                   |
| ADD    | `root-block-keeps-simple-values-for-identical-variables`       | Prevents unnecessary wrapping                                    |
| ADD    | `accent-primary-uses-light-dark-in-root`                       | Replaces removed light-block test                                |
| ADD    | `light-dark-argument-order-light-first`                        | Correctness: light value is first arg (ADDED BY REVIEWER)        |
| ADD    | `faction-bg-color-mix-nested-in-light-dark`                    | Verifies color-mix() wrapped in light-dark() (ADDED BY REVIEWER) |
| ADD    | `color-mix-used-for-faction-bg-tokens`                         | Verifies derived token pattern                                   |
| ADD    | `color-mix-used-for-status-bg-tokens`                          | Verifies derived token pattern                                   |
| ADD    | `color-mix-used-for-accent-and-danger-subtle-tokens`           | Verifies terminal overlay tokens                                 |
| ADD    | `color-mix-in-high-contrast-bg-tokens`                         | Verifies high-contrast migration                                 |
| ADD    | `no-light-dark-in-high-contrast-block`                         | Architectural boundary check                                     |
| ADD    | `index-css-no-color-scheme-declaration`                        | Prevents conflicting declarations                                |

### `src/components/BattleViewer/WhiffOverlay.test.tsx`

| Action | Test                                                  | Reason                                      |
| ------ | ----------------------------------------------------- | ------------------------------------------- |
| REMOVE | `whiff polygons have low opacity (0.2)`               | Opacity attribute no longer exists          |
| REMOVE | `attack whiff uses action-attack color fill`          | Fill value changes to include `color-mix()` |
| REMOVE | `heal whiff uses action-heal color fill`              | Fill value changes to include `color-mix()` |
| ADD    | `whiff-polygon-fill-uses-color-mix-with-attack-color` | Replaces old fill test                      |
| ADD    | `whiff-polygon-fill-uses-color-mix-with-heal-color`   | Replaces old fill test                      |
| ADD    | `whiff-polygon-no-opacity-attribute`                  | Replaces old opacity test                   |
| ADD    | `whiff-overlay-no-opacity-constant-in-source`         | Dead code prevention                        |
| KEEP   | `renders no polygons when no whiff data`              | Unchanged behavior                          |
| KEEP   | `renders hex polygon for each whiff cell`             | Unchanged behavior                          |
| KEEP   | `whiff overlay has no pointer events CSS class`       | Unchanged behavior                          |
| KEEP   | `whiff overlay shares grid viewBox`                   | Unchanged behavior                          |

### Files Requiring No Test Changes

- `src/styles/theme.integration.test.tsx` -- Tests `data-theme` attribute mechanism, which is unchanged.
- `src/stores/accessibilityStore.test.ts` -- Store behavior is unchanged (no JS changes).
- `src/components/BattleViewer/TargetingLine.test.tsx` -- TargetingLine opacity stays as-is per plan.

---

## Reviewer Findings

### Changes Made

1. **Removed `text-on-faction-defined-in-root`**: Redundant with the existing KEEP test `--text-on-faction > should be defined in dark theme`, which already asserts `--text-on-faction:` exists in the `:root` block. Net change: -1 test.

2. **Reclassified `existing-dark-theme-tests-still-pass` and `existing-high-contrast-tests-still-pass`**: These were listed as ADD tests but contained no new test code -- they just documented that existing tests should still pass. The summary table already tracked them as KEEP entries. Reclassified to avoid coder confusion. Net change: -2 pseudo-tests.

3. **Added `light-dark-argument-order-light-first`**: The `light-dark()` function takes `light-dark(light-value, dark-value)` -- light first, dark second. No existing test validated argument order. If the coder reverses arguments, both themes silently invert. A spot-check on `--surface-ground` (light: `#fafafa`, dark: `#242424`) catches this. Net change: +1 test.

4. **Added `faction-bg-color-mix-nested-in-light-dark`**: The plan specifies `--faction-friendly-bg: light-dark(#e6f2ff, color-mix(...))`. The existing `color-mix-used-for-faction-bg-tokens` test only checks for `color-mix()` presence but not the `light-dark()` wrapper. Without the wrapper, the light theme would show a semi-transparent overlay instead of the intended opaque `#e6f2ff`. Net change: +1 test.

### Net Effect

Original: 19 test designs (15 + 4), of which 2 were documentation-only pseudo-tests.
After review: 18 real test designs (14 in theme-variables + 4 in WhiffOverlay), all requiring actual test code.

### Accepted Without Change

- All WhiffOverlay tests (4): Well-designed, correct assertions, good justifications.
- All `color-scheme` tests (3): `root-block-has-color-scheme-dark`, `light-theme-block-sets-color-scheme-light`, `high-contrast-block-has-color-scheme-dark` -- correct architectural invariants.
- `light-theme-block-is-minimal`: Strong indirect completeness check -- catches any leftover variable in the light block.
- All `color-mix()` pattern tests (4): `faction-bg`, `status-bg`, `accent-and-danger-subtle`, `high-contrast-bg` -- good sampling strategy.
- `no-light-dark-in-high-contrast-block`: Correct architectural boundary enforcement.
- `index-css-no-color-scheme-declaration`: Correct, prevents conflicting `color-scheme` from `index.css`.
- `root-block-uses-light-dark-for-differing-variables`: Good 5-variable sample across token categories.
- `root-block-keeps-simple-values-for-identical-variables`: Good 4-variable sample of non-differing tokens.
- `accent-primary-uses-light-dark-in-root`: Correct replacement for the removed light-block test.

### Considered But Not Added

- **Total variable count test**: Considered a test asserting the number of `light-dark()` calls in `:root` equals ~43. Rejected because `light-theme-block-is-minimal` already catches incomplete migrations indirectly (any variable still in the light block means migration is incomplete), and a count test would be brittle as variables are added/removed.
- **`--surface-elevated` identical test**: This variable is `#ffffff` in both themes but is not in the identical-variables test sample. The 4-variable sample is sufficient -- `--surface-elevated` is in the same category as `--text-on-faction` (identical across themes).
