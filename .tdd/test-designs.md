# Test Designs: Phase 1 (Token Foundation) + Phase 2 (Global Styles)

Created: 2026-02-08

## Decision: No New Tests Required

Phase 1 and Phase 2 introduce **zero testable structural or semantic changes**. All modifications are pure CSS: custom property declarations (Phase 1) and CSS value substitutions (Phase 2). No DOM structure, ARIA attributes, component behavior, TypeScript logic, or semantic elements are affected.

### Analysis Summary

| Phase   | Change Type                                                    | DOM Impact | Testable with Testing Library?                    |
| ------- | -------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| Phase 1 | Add 19 CSS custom properties to `theme.css` (3 theme blocks)   | None       | No (JSDOM does not compute CSS custom properties) |
| Phase 2 | Swap font-family to `var(--font-mono)` in `index.css`          | None       | No (CSS value, not DOM)                           |
| Phase 2 | Swap `var(--surface-ground)` to `var(--ground)` in `index.css` | None       | No (CSS value, not DOM)                           |
| Phase 2 | Convert 7 rem values to px in `App.css`                        | None       | No (CSS values, not DOM)                          |
| Phase 2 | Add `font-weight: 700` to `.header h1` in `App.css`            | None       | No (CSS property, not DOM)                        |

### Why Not Static File Analysis Tests?

The codebase has a precedent for static CSS file analysis in `src/styles/theme-variables.test.ts`, which reads `theme.css` with `fs.readFileSync` and uses regex matching to verify that specific tokens (e.g., `--text-on-faction`, `--accent-primary`) exist in each theme block. This approach was considered for the 19 new tokens but rejected for the following reasons:

1. **Cost vs. value**: Writing 57 assertions (19 tokens x 3 theme blocks) that regex-match token names in CSS text provides extremely low regression protection. The only failure mode they catch -- accidentally deleting a token line -- is also caught immediately during Phase 3+ component migration when `var()` references resolve to `initial`.

2. **Existing tests are targeted, not comprehensive**: The existing `theme-variables.test.ts` tests only 2 specific tokens (`--text-on-faction` and `--accent-primary`) that were added as part of specific feature work. They do not attempt comprehensive token coverage. Extending this pattern to 19 tokens would be inconsistent with the established approach.

3. **Phase 1 tokens are not yet consumed**: The 19 new tokens are a foundation for Phase 3+ component migration. Until components reference these tokens, there is nothing to regress. A missing token would simply mean the consuming `var()` falls back to `initial` or its fallback value -- which is the same behavior as the pre-implementation state.

4. **Phase 2 changes are value swaps, not additions**: Changing `font-family: Inter, ...` to `font-family: var(--font-mono)` or `0.5rem` to `8px` cannot be meaningfully verified in JSDOM. These are visual changes that require browser rendering.

### Verification Plan (Non-Test)

The following verification steps replace automated tests for Phase 1+2:

**Automated (CI-equivalent):**

- `npm run build` -- Confirms no CSS syntax errors, validates import chain
- `npm run lint` -- Confirms no linting regressions
- `npm run type-check` -- Confirms no TypeScript errors (no TS files modified, but validates no collateral damage)
- `npm run test` -- Confirms all existing tests pass (zero behavioral changes expected)

**Manual (code review):**

- Verify `theme.css` contains all 19 new tokens in each of the 3 theme blocks (dark, light, high-contrast)
- Verify `theme.css` remains under 400-line limit (~334 lines expected)
- Verify `index.css` font-family is `var(--font-mono)` and background-color is `var(--ground)`
- Verify `App.css` has zero `rem`/`em` values, h1 is `16px` with `font-weight: 700`
- Verify no existing tokens were removed or modified

**Deferred (post-component phases):**

- Browser visual verification of font rendering, spacing, and colors
- Theme toggle verification across dark, light, and high-contrast modes

### Test Strategy Alignment

From `.tdd/requirements.md` test strategy:

> "Tests focus on what Testing Library can verify: rendered elements use correct semantic structure, section headers render as expected element type, InlineSelect controls have correct class/attribute structure, row elements have correct semantic structure."

> "Pure CSS value violations (padding sizes, border widths, opacity values) are documented in the plan but fixed directly without computed-style tests."

Phase 1+2 contains zero semantic structure changes, zero component changes, and zero DOM changes. All changes fall squarely in the "fixed directly without computed-style tests" category.

### Impact on Existing Tests

No existing tests should be affected because:

1. **Phase 1** only adds new CSS custom properties -- no existing properties are modified or removed
2. **Phase 2** changes CSS values in global stylesheets -- JSDOM does not compute these values, so no existing test assertions depend on them
3. The existing `theme-variables.test.ts` tests for `--text-on-faction` and `--accent-primary` are unaffected (those tokens remain unchanged)
4. The existing `theme.integration.test.tsx` tests verify the `data-theme` attribute mechanism, not CSS values (unaffected)

## Files Referenced

- `/home/bob/Projects/auto-battler/src/styles/theme.css` -- Phase 1 target (19 new tokens added)
- `/home/bob/Projects/auto-battler/src/index.css` -- Phase 2 target (2 CSS value changes)
- `/home/bob/Projects/auto-battler/src/App.css` -- Phase 2 target (6 CSS value changes)
- `/home/bob/Projects/auto-battler/src/styles/theme-variables.test.ts` -- Existing static analysis test (not modified)
- `/home/bob/Projects/auto-battler/src/styles/theme.integration.test.tsx` -- Existing integration test (not modified)
