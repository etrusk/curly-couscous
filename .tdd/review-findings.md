# Review Findings: Phase 2 Browser Tests + Zero-Rect Fallback Removal

**Reviewer**: tdd-reviewer | **Date**: 2026-02-09 | **Verdict**: APPROVE

## Quality Gates

| Gate          | Status | Details                                     |
| ------------- | ------ | ------------------------------------------- |
| TypeScript    | PASS   | `tsc --noEmit` clean                        |
| ESLint        | PASS   | Zero warnings, zero errors                  |
| Unit Tests    | PASS   | 1448 passed, 0 failed, 0 skipped            |
| Browser Tests | PASS   | 10 passed (4 Phase 1 + 6 Phase 2), 0 failed |

## Files Reviewed

1. `src/components/BattleViewer/tooltip-positioning.ts` (NEW, 43 lines) -- Clean extraction
2. `src/components/BattleViewer/CharacterTooltip.tsx` (MODIFIED, 269 lines) -- Fallback removed
3. `src/components/BattleViewer/BattleViewer.browser.test.tsx` (NEW, 305 lines) -- 6 browser tests
4. `src/components/BattleViewer/CharacterTooltip.test.tsx` (MODIFIED, 473 lines) -- 5 positioning tests converted

## Findings

### No CRITICAL Issues

### IMPORTANT Issues

None.

### MINOR Issues

**M1: Pattern doc not updated for extraction** (`portal-tooltip-positioning.md`)
The portal-tooltip-positioning pattern's Related Files section still only lists `CharacterTooltip.tsx`. The new `tooltip-positioning.ts` file should be added. This is documentation-only, not a code issue.

**M2: Pre-existing file length** (`CharacterTooltip.test.tsx`, 473 lines)
Exceeds the 400-line guideline. Noted in session.md as pre-existing (was 500 lines before, reduced by 28). Not introduced by this change. Recommend tracking for future extraction.

## Spec Compliance

- Tooltip positioning behavior (right-preferred, left-fallback, viewport clamping) validated by 5 direct unit tests and 4 browser integration tests. Matches spec section "Character Tooltip > Tooltip positioning".
- Z-index stacking (tooltip above all overlays) validated by 2 browser tests. Consistent with documented overlay z-index hierarchy (WhiffOverlay 5 < IntentOverlay 10 < DamageOverlay 20 < Tooltip 1000).

## Pattern Compliance

- Browser tests use `.browser.test.tsx` convention per ADR-022.
- Function extraction to separate file avoids react-refresh ESLint warning (documented rationale).
- Portal tooltip positioning algorithm matches the pattern in `portal-tooltip-positioning.md`.
- Test helpers (`createCharacter`, `createTarget`, `mockViewport`) reused from existing infrastructure.

## Code Quality Assessment

- `tooltip-positioning.ts`: Pure function, well-documented, no side effects beyond `window.innerWidth`/`window.innerHeight` reads. Clean separation of concerns.
- Zero-rect fallback removal is clean -- `rect.width` and `rect.height` passed directly, no conditional branches. Simpler production code path.
- Browser tests use relational assertions (not exact pixels) for SVG geometry, reducing flakiness risk.
- Z-index test handles `"auto"` -> NaN gracefully with `Number.isNaN(raw) ? 0 : raw`.

## Regression Risk

Low. The zero-rect fallback only triggered in jsdom (where `getBoundingClientRect()` returns zeros). Production code always had real dimensions. The 5 positioning tests that relied on the fallback were converted to direct `calculateTooltipPosition()` calls with explicit dimensions, preserving all algorithmic coverage.
