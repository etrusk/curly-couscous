# TDD Spec: Fix off-by-one in whiff/damage event selectors

Created: 2026-02-12

## Goal

Fix `selectRecentWhiffEvents` and `selectRecentDamageEvents` selectors which filter `e.tick === tick`, but after `processTick` the store's `tick` has already been incremented to the _next_ tick. Events stamped during resolution carry the pre-increment tick value, so the selectors never match and both `WhiffOverlay` and `DamageOverlay` render nothing.

## Acceptance Criteria

- [ ] `selectRecentWhiffEvents` returns whiff events from the just-resolved tick (filters `e.tick === tick - 1`)
- [ ] `selectRecentDamageEvents` returns damage events from the just-resolved tick (filters `e.tick === tick - 1`)
- [ ] Both selectors return empty arrays when `tick === 0` (no resolved tick yet)
- [ ] Integration tests use realistic post-`processTick` state (tick is one ahead of event timestamps), not manually aligned tick+event combinations that mask the bug
- [ ] Each selector has a brief comment explaining the `tick - 1` rationale to prevent future "fix-back"

## Approach

Change both selectors to filter `e.tick === tick - 1`. Add a comment explaining that after `processTick`, `state.tick` represents the next tick to process, so events from the just-resolved tick are at `tick - 1`. Update integration tests to reflect realistic post-`processTick` state.

## Scope Boundaries

- In scope:
  - `src/stores/gameStore-selectors.ts` — fix both selectors, add comments
  - `src/stores/gameStore-integration.test.ts` — update whiff and damage event selector tests to use realistic tick state
  - `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts` — update if tests use manually aligned tick values
- Out of scope:
  - Engine tick lifecycle (`game-core.ts`) — tick increment on return is correct behavior
  - `WhiffOverlay` / `DamageOverlay` components — no changes needed, they consume selector data correctly
  - `GameState` type — no new fields

## Assumptions

- The relationship `lastResolvedTick = tick - 1` is always true after `processTick`; no scenario exists where events are stamped at a tick other than `tick - 1`
- Damage numbers are also not displaying (same bug), though this may not have been noticed if battles resolve quickly

## Constraints

- Must not change engine's tick lifecycle contract
- Selectors must remain pure functions (no side effects)
- Existing tests that pass for correct reasons must continue to pass
