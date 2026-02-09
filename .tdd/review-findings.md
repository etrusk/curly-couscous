# Review Findings: CSS `light-dark()` and `color-mix()` Adoption

## Verdict: PASS

All 5 modified files reviewed. Implementation matches plan. No critical issues found.

## Acceptance Criteria Check

- [x] All theme-dependent color declarations use `light-dark()` -- confirmed ~43 variables in `:root` block
- [x] Opacity variants use `color-mix()` where appropriate -- 9 derived tokens in `:root`, 9 in high-contrast, WhiffOverlay fill
- [x] Visual appearance unchanged (behavior-preserving) -- `color-mix(... 20%, transparent)` equivalent to `opacity: 0.2`; browser verified per session.md
- [x] All 1448 tests pass, 0 failing, 0 skipped
- [x] All quality gates pass (TypeScript, ESLint, build)

## Spec Compliance

Spec defines whiff opacity as "Opacity: 0.2" (spec.md line 406). Implementation uses `color-mix(in srgb, ${fillColor} 20%, transparent)` which produces visually identical 20% alpha. Acceptable behavior-preserving equivalent.

## Plan Compliance

All planned changes implemented correctly:

- Phase 1: `color-scheme` declarations in all 3 blocks, `light-dark()` unification, `index.css` removal -- DONE
- Phase 2: WhiffOverlay `WHIFF_FILL_OPACITY` removed, opacity attribute removed, fill uses `color-mix()` -- DONE
- Phase 3: Tests updated (2 removed, 15 added in theme-variables; 3 replaced + 1 added in WhiffOverlay) -- DONE
- Phase 4: Quality gates all pass -- DONE

## CSS Correctness

- `light-dark()` argument order verified: light value first, dark value second (e.g., `light-dark(#fafafa, #242424)`)
- `color-mix()` syntax correct: `color-mix(in srgb, <color> <percentage>, transparent)`
- Nesting valid: `light-dark(#e6f2ff, color-mix(in srgb, var(--faction-friendly) 15%, transparent))`
- `rgba()` values without named base tokens correctly kept as `rgba()` per plan decision

## Issues Found

### IMPORTANT: Architecture doc outdated (1)

`/home/bob/Projects/auto-battler/.docs/architecture.md` lines 10 and 20 reference "three-block theming" which is now a "two-block + high-contrast override" pattern. This should be updated to reflect the new structure in a follow-up task or as part of the commit for this change.

### MINOR: Duplicate token definitions (1)

`:root` block defines both `--content-primary` (line 31) and `--text-primary` (line 112) with identical values (`light-dark(#333, rgba(255, 255, 255, 0.87))`). Same for `--content-secondary`/`--text-secondary` and `--content-muted`/`--text-muted`. This is a pre-existing concern (terminal overlay tokens coexisting with legacy tokens per ADR-019), not introduced by this change.

### MINOR: Test file reads CSS multiple times (1)

`theme-variables.test.ts` calls `getThemeCssContent()` and extract helpers in every single test case. A `beforeAll` with shared content would reduce I/O. Pre-existing pattern, not introduced by this change.

## Duplication Check

No new duplication introduced. `light-dark()` and `color-mix()` usage confined to `theme.css`. WhiffOverlay `color-mix()` usage is in JSX (inline SVG attribute), architecturally distinct from CSS token definitions.

## File Hygiene

- `theme.css`: 280 lines (under 300-line flag threshold)
- `theme-variables.test.ts`: 294 lines (under threshold)
- `WhiffOverlay.test.tsx`: 167 lines (fine)

## Summary

0 CRITICAL, 1 IMPORTANT (architecture doc outdated), 2 MINOR (pre-existing). Implementation is clean, well-tested, and follows the plan precisely. The IMPORTANT issue is a documentation sync task and does not block approval.
