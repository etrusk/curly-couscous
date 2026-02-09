# Review Findings -- Phase 3 Browser Tests

**Reviewer:** tdd-reviewer | **Date:** 2026-02-09
**Files reviewed:** `src/styles/theme.browser.test.tsx` (254 lines), `src/components/BattleViewer/Token.browser.test.tsx` (197 lines)
**Verdict:** PASS -- No CRITICAL issues. 1 IMPORTANT, 2 MINOR.

## Quality Gates

- Tests: 1470/1470 passing (1448 unit + 22 browser)
- TypeScript: PASS (no errors)
- ESLint: PASS (no warnings)
- File sizes: Both under 300 lines

## Issues

### IMPORTANT-1: Screenshot artifacts from intermediate test runs

Screenshot directories exist from failed intermediate test runs:

- `src/styles/__screenshots__/` (7 files)
- `src/components/BattleViewer/__screenshots__/Token.browser.test.tsx/` (2 files)

These are gitignored (`__screenshots__/` in `.gitignore`) so they will not be committed, but they clutter the working tree. The coder flagged these proactively. **Recommend deleting** the directories before commit to avoid confusion during future development.

### MINOR-1: Enemy character boilerplate repeated across Token browser tests

All 5 Token tests create an identical enemy: `createCharacter({ id: "enemy-1", faction: "enemy", position: { q: 2, r: 0 }, skills: [] })`. This could be extracted to a shared `const` or `beforeEach` setup. However, the existing Phase 2 browser tests (`BattleViewer.browser.test.tsx`) follow the same inline pattern, so this is consistent with established convention.

### MINOR-2: HP bar test (Test 5) largely duplicates jsdom capability

The test design acknowledges this ("technically testable in jsdom via getAttribute()"). The browser-mode value is marginal for this specific assertion (SVG attribute, no computed style involved). However, it validates the full rendering pipeline and serves as a baseline for future HP animation tests, so the inclusion is acceptable.

## Correctness Verification

1. **Probe element technique** -- Correct. `getComputedStyle(el).getPropertyValue('--custom-prop')` returns raw text; using a probe div with `background-color: var(...)` forces resolution. Well-documented in file header.
2. **parseColor dual-format support** -- Handles both `rgb()/rgba()` and `color(srgb ...)` formats. String-split approach avoids ESLint `detect-unsafe-regex` (noted in session log). Parsing logic is correct: sRGB values (0-1 range) are converted to 0-255 via `Math.round(val * 255)`.
3. **color-mix assertions** -- RGB tolerance (+/- 5) and alpha tolerance (+/- 0.05) are appropriate. Expected values (R=0, G=114, B=178, A=0.15) match `color-mix(in srgb, #0072b2 15%, transparent)` semantics correctly (sRGB mixing with transparent preserves RGB, adjusts alpha).
4. **Token filter assertions** -- CSS source confirms `.selected` has 3 `drop-shadow` layers and `.token:focus-visible` has 2 layers with `4px` blur. Assertions align.
5. **Animation assertions** -- CSS source confirms `animation: selectionPulse 2s ease-in-out infinite`. All 4 computed style property checks match.
6. **HP bar calculation** -- `TOKEN_SIZE=40`, `HP_BAR_WIDTH=TOKEN_SIZE=40`, `(50/100)*40=20`. Assertion `width="20"` is correct.

## Pattern Compliance

- Import pattern matches existing browser tests (vitest, testing-library, page from vitest/browser)
- `beforeEach` cleanup matches `BattleViewer.browser.test.tsx` pattern
- `page.viewport()` used consistently in Token tests
- Theme CSS imported explicitly (documented rationale)
- No application code modified -- test-only changes

## Spec Alignment

- Theme switching (light-dark(), color-mix(), cascade): Aligns with ADR-021 theming architecture
- Selection glow (drop-shadow filter): Validates spec's visual feedback for selected character
- Focus-visible: Validates WCAG 2.2 AA keyboard accessibility requirement
- HP bar: Validates "Level 1 - Glanceable" progressive disclosure (spec)

## Recommendation

Approve after deleting screenshot artifacts (IMPORTANT-1). No code changes required.
