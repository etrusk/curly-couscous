# Exploration Findings

## Task Understanding

Modernize CSS theming in `src/styles/theme.css` and related files by:

1. Adopting CSS `light-dark()` to unify dark/light theme variable declarations (eliminating the duplicated `:root` / `:root[data-theme="light"]` blocks)
2. Adopting CSS `color-mix()` for opacity/alpha variants (replacing hardcoded `rgba()` values for faction backgrounds, status backgrounds, surfaces, and game-state visuals like whiff and cooldown)

This is a behavior-preserving CSS refactor. Visual output must remain identical.

## Current Theming Architecture

### Three-Block Pattern

`src/styles/theme.css` uses a "three-block" approach documented in architecture.md:

- `:root { ... }` -- Dark theme (default, ~130 lines of custom properties)
- `:root[data-theme="light"] { ... }` -- Light theme overrides (~115 lines)
- `:root[data-theme="high-contrast"] { ... }` -- High contrast overrides (~115 lines)

Theme switching is managed by `src/stores/accessibilityStore.ts`, which sets `data-theme` attribute on `document.documentElement`. Three themes: `"light"`, `"dark"`, `"high-contrast"`.

### Important Constraint: Three themes, not two

`light-dark()` is a CSS function that takes two values: `light-dark(light-value, dark-value)`. It respects the `color-scheme` property. However, this project has **three** themes: dark, light, and high-contrast. `light-dark()` cannot directly encode all three themes -- it only handles the light/dark axis. The high-contrast theme will still need its own override block. This is a critical architectural constraint.

### How `color-scheme` interacts

`src/index.css` already declares `color-scheme: light dark` on `:root`. For `light-dark()` to work correctly, the `color-scheme` property must be set to `light` or `dark` based on the active theme. Currently it is hardcoded to `light dark` (both). The accessibilityStore would need to also set `color-scheme` or the CSS would need `color-scheme` overrides per theme.

### Terminal Overlay Tokens (ADR-019)

There are **two token layers** in theme.css:

1. **Legacy tokens**: `--surface-ground`, `--content-primary`, `--faction-*`, `--action-*`, etc.
2. **Terminal overlay tokens**: `--ground`, `--surface`, `--text-primary`, `--accent`, `--danger`, etc.

Both layers are redefined across all three theme blocks. Both are candidates for `light-dark()` consolidation (for the dark/light axis).

## Relevant Files

### Primary change targets

- `/home/bob/Projects/auto-battler/src/styles/theme.css` - Main theme file. 385 lines. Contains ALL custom property definitions across 3 theme blocks + high-contrast data attribute. This is the primary file for `light-dark()` adoption. Contains ~50 `rgba()` declarations that are candidates for `color-mix()`.
- `/home/bob/Projects/auto-battler/src/index.css` - Imports theme.css, sets `color-scheme: light dark`. Will need `color-scheme` coordination for `light-dark()` to work.
- `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.ts` - Theme switching logic. May need to set `color-scheme` property on root element alongside `data-theme`.

### CSS files using opacity (candidates for `color-mix()` in component CSS)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` - `.statusSkipped { opacity: 0.6 }`, `.onCooldown { opacity: 0.6 }`, `.priorityControls button:disabled { opacity: 0.5 }` -- The cooldown opacity is specifically called out in the task.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.module.css` - `.hpBarBackground { opacity: 0.8 }`, `.token:hover .shape { opacity: 0.9 }`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.module.css` - `box-shadow: ... rgba(0, 0, 0, 0.3)`, fade-in animation (opacity 0 to 1)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageNumber.module.css` - `.damageRect { opacity: 0.95 }`
- `/home/bob/Projects/auto-battler/src/components/PlayControls/PlayControls.module.css` - `button:disabled { opacity: 0.5 }`
- `/home/bob/Projects/auto-battler/src/components/CharacterControls/CharacterControls.module.css` - `button:disabled { opacity: 0.5 }`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css` - `.assignBtn:disabled { opacity: 0.5 }`
- `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.module.css` - `.tickDisplay { opacity: 0.8 }`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLine.module.css` - `transition: opacity 0.2s ease`

### TSX files using inline opacity (candidates for `color-mix()` in component code)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.tsx` - `WHIFF_FILL_OPACITY = 0.2`, applied as SVG attribute `opacity={0.2}`. Uses `var(--action-attack)` and `var(--action-heal)` as fill colors. This is explicitly called out in the task -- could use `color-mix(in srgb, var(--action-attack) 20%, transparent)` instead of a separate opacity attribute.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLine.tsx` - `opacity="0.4"` on SVG `<g>` element.

### Test files that will need updating

- `/home/bob/Projects/auto-battler/src/styles/theme-variables.test.ts` - Static file analysis tests that parse theme.css with regex looking for `:root { }` and `:root[data-theme="light"] { }` blocks. These regex patterns will break if theme.css structure changes significantly. **Critical: these tests must be updated to match new file structure.**
- `/home/bob/Projects/auto-battler/src/styles/theme.integration.test.tsx` - Tests `data-theme` attribute mechanism. These should mostly pass unchanged since the attribute mechanism stays the same, but may need updates if `color-scheme` is also set.
- `/home/bob/Projects/auto-battler/src/stores/accessibilityStore.test.ts` - Tests theme switching via `data-theme`. May need updates if `color-scheme` property setting is added.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.test.tsx` - Tests `opacity="0.2"` attribute on polygons (line 119). Will need updating if whiff moves to `color-mix()` approach.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLine.test.tsx` - Tests `opacity="0.4"` (line 126). Will need updating if targeting line moves to `color-mix()`.

### CSS files with NO theming/opacity concerns (no changes needed)

- `/home/bob/Projects/auto-battler/src/App.css` - Layout only, no color tokens
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.module.css` - Layout only
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.module.css` - Positioning only
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.module.css` - Positioning only
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.module.css` - Empty (comment only)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/TargetingLineOverlay.module.css` - Positioning only
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.module.css` - Minimal, high-contrast only

### CSS files using theme tokens but not opacity (reference only)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.module.css` - Uses `var(--cell-hover-bg)`, high-contrast override
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css` - Uses terminal overlay tokens
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` - Uses terminal overlay tokens
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.module.css` - Uses legacy tokens
- `/home/bob/Projects/auto-battler/src/components/ThemeToggle/ThemeToggle.module.css` - Uses legacy tokens

## Existing Patterns

- **Three-block theming** - `:root` (dark default), `[data-theme="light"]`, `[data-theme="high-contrast"]`. Documented in architecture.md as "CSS Custom Property Theming."
- **Terminal overlay semantic tokens (ADR-019)** - Independent token layer coexisting with legacy tokens. Both layers follow the three-block pattern.
- **CSS Modules** - All component styles use `.module.css` files with `camelCase` locals convention via Vite config.
- **Zustand-driven theme switching** - `accessibilityStore.ts` manages theme state and applies `data-theme` attribute to document root.
- **Static CSS file analysis tests** - `theme-variables.test.ts` reads theme.css as text and uses regex to verify variable presence in each theme block.
- **Inline SVG opacity** - WhiffOverlay and TargetingLine use SVG `opacity` attribute for visual effects rather than CSS.
- **`rgba()` for alpha variants** - theme.css uses raw `rgba()` values throughout for semi-transparent backgrounds (`--faction-friendly-bg: rgba(0, 114, 178, 0.15)`). These are defined per-theme, not derived from base colors.

## Dependencies

- `color-scheme` CSS property must be coordinated with `data-theme` attribute for `light-dark()` to function correctly
- `accessibilityStore.ts` may need to set `color-scheme` on the root element when switching themes
- Vite 7.3's CSS processing must support `light-dark()` and `color-mix()` (should pass through as native CSS, no transform needed)
- No browserslist or explicit build target configured in `vite.config.ts` -- Vite defaults apply

## Constraints Discovered

1. **Three themes vs. two-value function**: `light-dark()` only handles light/dark. High-contrast theme needs its own override block regardless. This means theme.css will have: unified `:root` block with `light-dark()` values, plus a `:root[data-theme="high-contrast"]` override block. This is still a significant reduction (from 3 blocks to 2).

2. **`color-scheme` must be dynamic**: Currently `color-scheme: light dark` is hardcoded in `index.css`. For `light-dark()` to resolve correctly, `color-scheme` must be set to `light` or `dark` based on the active theme. This means either:
   - CSS: `:root { color-scheme: dark }` / `:root[data-theme="light"] { color-scheme: light }` / `:root[data-theme="high-contrast"] { color-scheme: dark }`
   - Or JS: `accessibilityStore` sets `document.documentElement.style.colorScheme`

3. **Browser support**: `light-dark()` is supported in Chrome 123+, Firefox 120+, Safari 17.5+. `color-mix()` is supported in Chrome 111+, Firefox 113+, Safari 16.2+. Both are well-supported in modern browsers (2024+). No polyfill needed for a modern web app.

4. **`rgba()` values are theme-dependent**: Many `rgba()` values in theme.css differ between dark/light themes (e.g., dark uses `rgba(255,255,255,0.87)` for text, light uses `#333`). These cannot simply be converted to `color-mix()` -- they need `light-dark()` wrapping first, or the base color needs to be extracted and `color-mix()` applied.

5. **Some variables are identical across dark/light**: Variables like `--action-attack: #d55e00`, `--faction-friendly: #0072b2` are the same in dark and light themes. These don't benefit from `light-dark()` and can remain simple values. Only the high-contrast theme changes them.

6. **Opacity on SVG elements vs. color-mix()**: WhiffOverlay uses SVG `opacity` attribute on `<polygon>` elements with CSS variable fills. Converting to `color-mix()` would mean putting the mixed color directly in the `fill` attribute. This changes the DOM structure (no more separate `opacity` attribute) and tests will need updating.

7. **Disabled button opacity is UI pattern, not theming**: `opacity: 0.5` on disabled buttons across PlayControls, CharacterControls, PriorityTab is a standard UI disabled pattern, not a theming concern. These should likely remain as `opacity` declarations, not `color-mix()`.

8. **Static analysis tests use regex**: `theme-variables.test.ts` parses theme.css with regex like `/:root\s*\{([^}]+)\}/s`. If the file structure changes (e.g., merging dark/light blocks), these regexes will need updating or rewriting.

## Quantitative Analysis

### Variables in theme.css by category

**Variables that differ between dark and light (candidates for `light-dark()`)**:

- Surfaces: `--surface-ground`, `--surface-primary`, `--surface-secondary` (3)
- Content: `--content-primary`, `--content-secondary`, `--content-muted` (3)
- Borders: `--border-default`, `--border-subtle` (2)
- Interactive: `--interactive-hover` (1)
- Faction backgrounds/text: `--faction-friendly-bg`, `--faction-enemy-bg`, `--faction-friendly-text`, `--faction-enemy-text` (4)
- Token/accent: `--accent-primary` (1)
- Status backgrounds/text: 8 variables (success/error/warning/neutral bg + text)
- Contrast: `--contrast-line` same in both, `--targeting-line-color` differs (1)
- Grid: `--grid-bg`, `--grid-border`, `--cell-bg`, `--cell-border`, `--cell-hover-bg` (5)
- Scrollbar: `--scrollbar-track`, `--scrollbar-thumb`, `--scrollbar-thumb-hover` (3)
- Terminal overlay: `--ground`, `--surface`, `--surface-hover`, `--border`, `--divider`, `--text-primary` through `--text-ghost`, `--accent`, `--accent-subtle`, `--accent-muted`, `--danger-subtle` (12+)

**Total ~43 variables differ between dark and light** -- all candidates for `light-dark()`.

**Variables identical in dark and light (no `light-dark()` needed)**:

- `--faction-friendly`, `--faction-enemy`, `--action-attack`, `--action-heal`, `--action-move`, `--text-on-faction`, `--interactive-focus`, `--status-success`, `--status-error`, `--status-warning`, `--status-neutral`, `--health-high`, `--health-low`, `--contrast-line`, plus all radius and font tokens (~20)

### `rgba()` values that could use `color-mix()`

In theme.css dark block alone: ~25 `rgba()` values. Examples:

- `--content-primary: rgba(255, 255, 255, 0.87)` -- `color-mix(in srgb, white 87%, transparent)`
- `--faction-friendly-bg: rgba(0, 114, 178, 0.15)` -- `color-mix(in srgb, var(--faction-friendly) 15%, transparent)`
- `--status-success-bg: rgba(0, 158, 115, 0.15)` -- derived from base status color

The `color-mix()` approach would allow deriving alpha variants from base colors rather than hardcoding RGB values.

## Open Questions

1. **Scope of `light-dark()` adoption**: Should we merge dark and light blocks entirely using `light-dark()` for every differing variable, or only for a subset? Merging fully would eliminate the `[data-theme="light"]` block but requires `color-scheme` coordination.

2. **High-contrast theme handling**: Should high-contrast remain a full override block, or could it be partially merged? Since high-contrast uses significantly different values (brighter colors, pure black/white), a separate block seems necessary.

3. **`color-mix()` scope**: Should `color-mix()` only target whiff/cooldown (as explicitly stated in the task), or also the many `rgba()` declarations in theme.css? Converting all `rgba()` to `color-mix()` derived from base colors is a larger but cleaner change.

4. **SVG opacity vs color-mix**: For WhiffOverlay and TargetingLine, is it preferable to keep SVG `opacity` attributes (simpler, well-tested) or convert to `color-mix()` in the fill value (more aligned with the CSS modernization goal)?

5. **Disabled button opacity**: Should `opacity: 0.5` on disabled buttons be left as-is (it's a UI pattern, not a color theming concern), or converted to a CSS custom property / `color-mix()` approach?

6. **`color-scheme` coordination strategy**: CSS-based (`color-scheme` set per data-theme selector) vs. JS-based (`accessibilityStore` sets it on the element). CSS-based is simpler and doesn't require store changes.
