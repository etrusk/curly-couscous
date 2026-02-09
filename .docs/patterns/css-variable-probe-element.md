# CSS Variable Probe Element Pattern

## Context

When testing CSS custom property resolution in browser tests, `getComputedStyle(element).getPropertyValue('--custom-prop')` returns the raw declaration text (e.g., `light-dark(#fafafa, #242424)`) rather than the resolved computed value. This is because CSS custom properties are substitution values -- the browser preserves them as-is until they are used in a standard property context.

## Implementation

Instead of reading the custom property directly, create a temporary "probe" element that uses the variable in a standard CSS property, then read the resolved standard property:

```tsx
function getCSSVar(name: string): string {
  const probe = document.createElement("div");
  probe.style.color = `var(${name})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return value;
}
```

The browser resolves `var(--surface-ground)` into an actual color value when computing the `color` property, producing `rgb(36, 36, 36)` instead of the raw `light-dark(#fafafa, #242424)`.

## Rationale

CSS custom properties are defined as substitution-time values in the CSS spec. `getPropertyValue('--custom-prop')` returns the value before substitution. Only when a custom property is used in a standard property (like `color`, `background-color`) does the browser resolve `light-dark()`, `color-mix()`, and nested `var()` references. The probe element forces this resolution.

## Additional Notes

- Chromium returns `color(srgb ...)` format for `color-mix()` results, not `rgba()`. Tests should handle both formats.
- The probe element must be appended to the document (not just created) for `getComputedStyle` to resolve inherited custom properties from `:root`.
- Clean up the probe element after reading to avoid DOM pollution.

## Related Files

- `src/styles/theme.browser.test.tsx` -- Uses this pattern for all theme variable assertions
- `src/components/BattleViewer/Token.browser.test.tsx` -- Uses computed style on rendered elements (standard properties resolve naturally)
