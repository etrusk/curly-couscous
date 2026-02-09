# ADR-021: CSS `light-dark()` and `color-mix()` Theme Consolidation

**Date:** 2026-02-09
**Status:** Accepted

## Decision

Use CSS `light-dark()` to unify dark/light theme variable declarations into a single `:root` block. Use `color-mix()` for alpha-variant tokens derived from named base variables. Set `color-scheme` via CSS selectors (not JavaScript).

## Context

The previous three-block theming pattern (`:root` for dark, `[data-theme="light"]` for light, `[data-theme="high-contrast"]` for high-contrast) duplicated ~43 variable declarations between dark and light blocks. CSS `light-dark()` (Chrome 123+, Firefox 120+, Safari 17.5+) eliminates this duplication by accepting both values inline: `--surface-ground: light-dark(#fafafa, #242424)`.

Additionally, ~9 derived tokens used `rgba()` with hardcoded RGB values that duplicated their base token colors. `color-mix()` references the base variable directly: `color-mix(in srgb, var(--faction-friendly) 15%, transparent)`.

## Options Considered

1. **Keep three-block pattern** -- Status quo, works but duplicates ~43 variables
2. **`light-dark()` + `color-mix()` consolidation** -- Eliminates duplication, auto-derives alpha variants
3. **JS-based `color-scheme` coordination** -- Set `color-scheme` via `accessibilityStore` instead of CSS selectors

## Decision Rationale

Option 2 chosen. `light-dark()` resolves based on the inherited `color-scheme` CSS property, so the light block reduces to a single `color-scheme: light` declaration. `color-mix()` with `var()` references creates true dependency chains (changing `--faction-friendly` automatically updates `--faction-friendly-bg`). CSS-based `color-scheme` keeps the concern in the stylesheet with no JS store changes.

Only `rgba()` values derived from named base tokens were converted to `color-mix()`. White/black alpha values (e.g., `rgba(255, 255, 255, 0.87)`) lack a named base token and stay as `rgba()` inside `light-dark()`.

## Consequences

- `:root` block uses `light-dark()` for ~43 differing variables and `color-mix()` for 9 derived tokens
- `[data-theme="light"]` block reduced from ~115 lines to 1 declaration (`color-scheme: light`)
- `[data-theme="high-contrast"]` block unchanged (full override), with 9 bg tokens converted to `color-mix()`
- WhiffOverlay SVG uses `color-mix()` in fill attribute instead of separate `opacity` attribute
- Browser support: Chrome 123+, Firefox 120+, Safari 17.5+ (no polyfill needed for this project)
- `index.css` no longer declares `color-scheme: light dark` (moved to per-theme selectors in `theme.css`)
