# Review Findings: Fix off-by-one in whiff/damage event selectors

**Reviewer**: tdd-reviewer | **Date**: 2026-02-12 | **Verdict**: PASS

## Source Fix (gameStore-selectors.ts, lines 258-285)

Both selectors correctly implement:

- `tick === 0` early guard returning `[]`
- Filter `e.tick === tick - 1` (was `e.tick === tick`)
- JSDoc comment explaining the tick-1 rationale

No remaining instances of the old `e.tick === tick` pattern in the codebase (verified via grep).

## Test Quality

All 5 test files use realistic post-processTick tick alignment (store tick = event tick + 1):

- **gameStore-integration.test.ts**: Uses `setState` to set tick to 2, events at tick 1. Includes tick-0 guard tests and future-tick regression guards.
- **useWhiffIndicators.test.ts**: Sets tick to 1 via `setState`, events at tick 0.
- **useDamageNumbers.test.ts**: Same pattern, 6 tests updated.
- **DamageOverlay.test.tsx**: 7 tests with consistent "Simulate post-processTick state" comments.
- **WhiffOverlay.test.tsx**: 4 tests with same pattern.

The "excludes events from other ticks" tests (both damage and whiff) include a future-tick event at `tick === 2` to guard against the old `e.tick === tick` bug regressing.

## Acceptance Criteria

1. `selectRecentWhiffEvents` filters `e.tick === tick - 1` -- PASS
2. `selectRecentDamageEvents` filters `e.tick === tick - 1` -- PASS
3. Both return `[]` when `tick === 0` -- PASS
4. Tests use realistic post-processTick alignment -- PASS
5. Explanatory JSDoc comments present -- PASS

## Quality Gates

- Tests: 1521 passed, 0 failed, 0 skipped -- PASS
- ESLint: clean -- PASS
- TypeScript: clean -- PASS

## Pre-existing Issue (not blocking)

MINOR: `gameStore-selectors.ts` is 492 lines (exceeds 400-line limit). Already logged by the coder as a pre-existing issue.

## Issues Found

None.
