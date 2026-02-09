# Implementation Plan: CSS `light-dark()` and `color-mix()` Adoption

## Summary

Consolidate the 3-block theming in `theme.css` (`:root` dark, `[data-theme="light"]`, `[data-theme="high-contrast"]`) into a 2-block structure using CSS `light-dark()` for the dark/light axis. Replace `rgba()` alpha variants in theme tokens with `color-mix()` where they derive from a base color. Convert WhiffOverlay SVG opacity to `color-mix()` fill. Leave TargetingLine, cooldown, and disabled-button opacity as-is.

## Architectural Decisions

### Decision: CSS-based `color-scheme` coordination (not JS-based)

**Decision**: Set `color-scheme` per selector in CSS (`color-scheme: dark` on `:root`, `color-scheme: light` on `[data-theme="light"]`, `color-scheme: dark` on `[data-theme="high-contrast"]`) rather than having `accessibilityStore.ts` set `document.documentElement.style.colorScheme` via JavaScript.

**Context**: `light-dark()` resolves based on the inherited `color-scheme` property. Two strategies exist: (a) CSS selectors set it alongside `data-theme`, (b) JS store sets it alongside the attribute. CSS-based is simpler, keeps the color-scheme concern in the stylesheet, and does not require store changes.

**Consequences**: The `index.css` line `color-scheme: light dark` (which tells the UA to support both) must be removed from `:root` and replaced with theme-specific values in `theme.css`. No JS store changes needed. The `accessibilityStore.ts` and its tests remain untouched.

### Decision: WhiffOverlay converts to `color-mix()`, TargetingLine stays as-is

**Decision**: WhiffOverlay's `opacity={0.2}` on polygons will be replaced with `color-mix()` in the `fill` attribute (e.g., `color-mix(in srgb, var(--action-attack) 20%, transparent)`). TargetingLine's `opacity="0.4"` on the `<g>` element stays as-is.

**Context**: WhiffOverlay applies opacity to tint a hex cell with an action color -- a natural fit for `color-mix()` since the intent is "20% of this color." TargetingLine applies opacity to an entire `<g>` group containing two `<line>` elements with different strokes (contrast outline + main color). Converting the group opacity to individual `color-mix()` fills on each line would complicate the rendering and break the outline/main layering. The group opacity approach is the correct pattern for "fade the whole group."

**Consequences**: WhiffOverlay.tsx changes: remove `WHIFF_FILL_OPACITY` constant, remove `opacity` attribute, use `color-mix()` in fill. WhiffOverlay.test.tsx: update opacity test to assert `fill` contains `color-mix` instead of asserting `opacity="0.2"`. TargetingLine.tsx and TargetingLine.test.tsx: no changes.

### Decision: Leave cooldown/disabled/skipped `opacity` as-is

**Decision**: CSS `opacity` declarations on `.onCooldown`, `.statusSkipped`, `.priorityControls button:disabled` (and similar disabled-button patterns in other components) remain unchanged.

**Context**: These are whole-element opacity fades, not color alpha. `color-mix()` is for deriving alpha-variant colors, not for dimming entire DOM subtrees. Converting these would require replacing every color property in the subtree with a mixed variant -- impractical and wrong in intent. CSS `opacity` is the correct tool for "dim this element."

**Consequences**: No changes to any `.module.css` file for opacity-based dimming patterns.

### Decision: `rgba()` tokens in `theme.css` where base color is reused get `color-mix()`

**Decision**: Replace `rgba()` declarations in theme.css that are provably alpha variants of an existing base token with `color-mix()` referencing that token. Example: `--faction-friendly-bg: rgba(0, 114, 178, 0.15)` becomes `--faction-friendly-bg: color-mix(in srgb, var(--faction-friendly) 15%, transparent)` since `--faction-friendly: #0072b2` is `rgb(0, 114, 178)`.

For `rgba()` values that use white/black with alpha (e.g., `--content-primary: rgba(255, 255, 255, 0.87)`), these will be wrapped in `light-dark()` with the appropriate dark/light values. They will NOT be converted to `color-mix()` because they don't derive from a named base token in the system.

**Context**: `color-mix()` is most valuable when it references a CSS variable, creating a dependency. Hardcoding `color-mix(in srgb, white 87%, transparent)` is no better than `rgba(255, 255, 255, 0.87)`. But `color-mix(in srgb, var(--faction-friendly) 15%, transparent)` is better because changing `--faction-friendly` automatically updates the bg.

**Consequences**: Faction bg tokens, status bg tokens, accent-subtle/muted tokens, and danger-subtle tokens in the `:root` block gain `color-mix()`. Light-theme equivalents that use opaque hex colors (e.g., `--faction-friendly-bg: #e6f2ff`) cannot use `color-mix()` since they aren't simple alpha variants -- they stay as opaque values inside `light-dark()`.

## Implementation Steps (Ordered)

### Phase 1: `color-scheme` + `light-dark()` in theme.css

**Files modified**: `src/styles/theme.css`, `src/index.css`

1. **Remove `color-scheme: light dark` from `src/index.css`** -- delete line 9.

2. **Restructure `src/styles/theme.css`** into 2 blocks:

   **Block 1: `:root`** -- Unified dark+light declarations:
   - Add `color-scheme: dark;` at top of `:root` block.
   - For ~43 variables that differ between dark and light: use `light-dark(light-value, dark-value)`.
     - Example: `--surface-ground: light-dark(#fafafa, #242424);`
   - For ~20 variables identical in dark and light: keep simple values (no `light-dark()` needed).
   - For variables that can use `color-mix()` in dark but not light (e.g., faction bg): use `light-dark(#e6f2ff, color-mix(in srgb, var(--faction-friendly) 15%, transparent))`.
   - Terminal overlay tokens follow the same pattern.
   - Keep radii and font-mono as simple values (identical across themes).

   **Block 2: `:root[data-theme="light"]`** -- Only sets `color-scheme: light;`. All variable values are handled by `light-dark()` in `:root`. This block is 1-2 lines.

   **Block 3: `:root[data-theme="high-contrast"]`** -- Unchanged (full override block). Add `color-scheme: dark;` at top.

   **Block 4: `:root[data-high-contrast="true"]`** -- Unchanged.

3. **`color-mix()` for derived tokens in `:root` block**:

   Apply `color-mix()` to these tokens (dark-theme value only, inside `light-dark()`):
   - `--faction-friendly-bg`: `color-mix(in srgb, var(--faction-friendly) 15%, transparent)` (dark)
   - `--faction-enemy-bg`: `color-mix(in srgb, var(--faction-enemy) 15%, transparent)` (dark)
   - `--status-success-bg`: `color-mix(in srgb, var(--status-success) 15%, transparent)` (dark)
   - `--status-error-bg`: `color-mix(in srgb, var(--status-error) 15%, transparent)` (dark)
   - `--status-warning-bg`: `color-mix(in srgb, var(--status-warning) 15%, transparent)` (dark)
   - `--status-neutral-bg`: `color-mix(in srgb, var(--status-neutral) 15%, transparent)` (dark)
   - `--accent-subtle`: `color-mix(in srgb, var(--accent) 15%, transparent)` (dark)
   - `--accent-muted`: `color-mix(in srgb, var(--accent) 8%, transparent)` (dark)
   - `--danger-subtle`: `color-mix(in srgb, var(--danger) 15%, transparent)` (dark)

   For these, the light-theme values are opaque hex colors, so use `light-dark(#e6f2ff, color-mix(...))`.

   High-contrast block also uses `rgba()` for bg tokens -- convert those to `color-mix()` referencing the high-contrast base colors (e.g., `color-mix(in srgb, var(--faction-friendly) 20%, transparent)` where `--faction-friendly` in high-contrast is `#0099ff`).

   **Note on terminal overlay tokens with `rgba()` in dark block**: `--surface: rgba(255,255,255,0.03)`, `--surface-hover: rgba(255,255,255,0.06)`, `--border: rgba(255,255,255,0.12)`, `--divider: rgba(255,255,255,0.06)`, `--text-*`, `--text-ghost`, `--accent-subtle`, `--accent-muted`, `--danger-subtle`. The white/black-with-alpha terminal tokens do NOT have a named base token to reference (there is no `--white` variable). These stay as `rgba()` values wrapped in `light-dark()`. Only tokens derived from a named variable (accent, danger, faction, status) get `color-mix()`.

### Phase 2: WhiffOverlay `color-mix()` adoption

**Files modified**: `src/components/BattleViewer/WhiffOverlay.tsx`

1. Remove the `WHIFF_FILL_OPACITY` constant.
2. Remove the `opacity={WHIFF_FILL_OPACITY}` attribute from `<polygon>`.
3. Change `fill={fillColor}` to use `color-mix()`:
   ```
   fill={`color-mix(in srgb, ${fillColor} 20%, transparent)`}
   ```

### Phase 3: Update tests

**Files modified**: `src/styles/theme-variables.test.ts`, `src/components/BattleViewer/WhiffOverlay.test.tsx`

1. **`theme-variables.test.ts`**: The existing regex `/:root\s*\{([^}]+)\}/s` will still match the `:root` block (it's still `:root { ... }`). The light-theme tests that look for `:root[data-theme="light"]` block will fail because that block now only contains `color-scheme: light` and no variable definitions.

   **Strategy**:
   - Keep dark-theme tests (`:root` block assertions). They still work because variables are still defined in `:root`.
   - Modify light-theme tests: instead of asserting variables exist in the `[data-theme="light"]` block, assert that variables in `:root` use `light-dark()`. This verifies light-theme coverage.
   - Keep high-contrast tests unchanged (block still exists with full overrides).
   - Specifically:
     - `--text-on-faction` dark test: passes as-is (still in `:root` block).
     - `--text-on-faction` light test: change to verify the variable in `:root` uses `light-dark()` OR is a plain value (meaning it's the same across both themes, which covers light). Since `--text-on-faction` is `#ffffff` in both themes, it will be a plain value -- test should verify it exists in `:root`.
     - `--accent-primary` light test: same approach -- `--accent-primary` differs between dark/light, so it will use `light-dark()`. Test should verify `light-dark()` is used for this variable.
     - High-contrast tests: unchanged.

2. **`WhiffOverlay.test.tsx`**: The test at line 119 (`expect(polygon).toHaveAttribute("opacity", "0.2")`) must change:
   - Remove opacity assertion.
   - Assert fill attribute contains `color-mix`.
   - Example: `expect(polygon?.getAttribute("fill")).toMatch(/color-mix/)`.
   - Also update the fill assertions in the action-type tests (lines 83, 101) since fill now wraps the CSS variable in `color-mix()`.

3. **`theme.integration.test.tsx`**: No changes needed. Tests verify `data-theme` attribute mechanism which is unchanged.

4. **`accessibilityStore.test.ts`**: No changes needed. Store behavior is unchanged.

5. **`TargetingLine.test.tsx`**: No changes needed. Opacity stays as-is.

### Phase 4: Quality gates

1. Run `npm run type-check` -- WhiffOverlay changes are TypeScript (template string in fill).
2. Run `npm run lint` -- verify no new lint issues.
3. Run `npm run test` -- all tests must pass.
4. Run `npm run build` -- verify Vite builds successfully with `light-dark()` and `color-mix()` in CSS.

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- behavior-preserving refactor, no functional changes.
- [x] Approach consistent with `.docs/architecture.md` -- CSS Custom Property Theming pattern preserved, three theme support maintained (via 2-block + high-contrast).
- [x] Patterns follow `.docs/patterns/index.md` -- no new patterns needed, CSS Modules pattern unchanged.
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-019 terminal overlay tokens maintained as independent layer.

## Risk Assessment

**Low risk:**

- `light-dark()` and `color-mix()` have broad browser support (Chrome 111+/123+, Firefox 113+/120+, Safari 16.2+/17.5+). No polyfill needed.
- Vite 7.3 passes CSS through without transformation by default (no browserslist or build target configured).
- Behavior-preserving refactor with no game logic changes.

**Medium risk:**

- `color-mix()` with CSS variables in `light-dark()` creates nested function calls: `--faction-friendly-bg: light-dark(#e6f2ff, color-mix(in srgb, var(--faction-friendly) 15%, transparent))`. This is valid CSS but complex to read. If any browser has issues with nested `light-dark()` + `color-mix()` + `var()`, it would fail silently (custom property becomes invalid). Mitigation: test in browser after changes.
- `theme-variables.test.ts` regex changes require careful construction. The existing regex `/:root\s*\{([^}]+)\}/s` uses `[^}]+` which will NOT match if the `:root` block contains nested braces (it shouldn't, but `light-dark()` has parentheses, not braces, so this is fine).

**Excluded from scope (per decisions above):**

- TargetingLine SVG opacity -- stays as group opacity.
- Cooldown/disabled/skipped CSS opacity -- stays as `opacity` property.
- `rgba()` values not derived from named tokens -- stay as `rgba()` inside `light-dark()`.
- `accessibilityStore.ts` -- no JS changes needed.

## Files Modified (Expected)

| File                                                | Change                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/styles/theme.css`                              | Restructure to 2-block + high-contrast, add `light-dark()`, add `color-mix()` for derived tokens |
| `src/index.css`                                     | Remove `color-scheme: light dark`                                                                |
| `src/components/BattleViewer/WhiffOverlay.tsx`      | Replace opacity attribute with `color-mix()` fill                                                |
| `src/styles/theme-variables.test.ts`                | Update regex tests for new file structure                                                        |
| `src/components/BattleViewer/WhiffOverlay.test.tsx` | Update fill/opacity assertions                                                                   |

## New ADR Recommendation

Recommend adding **ADR-021: CSS light-dark() and color-mix() Theme Consolidation** to `.docs/decisions/index.md`:

- **Decision**: Use CSS `light-dark()` to unify dark/light theme declarations; high-contrast retains full override block. Use `color-mix()` for alpha variants derived from named tokens. `color-scheme` set via CSS selectors.
- **Context**: Three-block theming duplicated ~43 variables between dark and light. `light-dark()` eliminates the duplication.
- **Consequences**: Light theme block reduced to just `color-scheme: light`. High-contrast block unchanged. Browser support requires Chrome 123+ / Firefox 120+ / Safari 17.5+ for `light-dark()`.
