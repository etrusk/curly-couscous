# Exploration Findings

## Task Understanding

Fix an off-by-one bug in `selectRecentWhiffEvents` and `selectRecentDamageEvents` selectors. Both selectors filter `e.tick === tick`, but after `processTick` the store's `tick` has already been incremented to the next tick (N+1), while events were stamped with the pre-increment tick value (N). The selectors therefore never match any events, causing `WhiffOverlay` and `DamageOverlay` to render nothing.

**Root cause chain:**

1. Engine `processTick(state)` in `src/engine/game-core.ts` (line 36) receives state with `tick = N`
2. Events (damage, whiff, death, etc.) are stamped with `tick` parameter value N (see `combat.ts` lines 74, 87)
3. Engine returns `newState` with `tick: state.tick + 1` (line 116 of game-core.ts)
4. Store action `processTick` sets `state.gameState.tick = result.state.tick` (line 170 of gameStore.ts), so store tick becomes N+1
5. Selectors filter `e.tick === tick` where `tick` is now N+1, but events have `tick = N` -- no match

**Fix:** Change both selectors to filter `e.tick === tick - 1`. Add guard for `tick === 0` (return empty array).

## Relevant Files

### Files to modify (in scope)

- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts` (lines 263-279) - Contains both buggy selectors: `selectRecentDamageEvents` (line 263) and `selectRecentWhiffEvents` (line 274). Both filter `e.tick === tick` which should be `e.tick === tick - 1`.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-integration.test.ts` (lines 22-140, 514-585) - Contains tests for `selectRecentDamageEvents` and `selectRecentWhiffEvents`. Tests currently manually set tick values aligned with event tick values (e.g., `tick = 1, event.tick = 1`), which masks the real-world off-by-one since `processTick` would have left `tick` at 2 for events stamped at 1.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.test.ts` - Tests add events at `tick: 0` and never advance tick, so they work by accident (both store tick and event tick are 0). After the fix (`tick - 1` = -1 at tick 0), these tests will need updating: either advance tick to 1 and stamp events at 0, or set tick to 1 to simulate post-processTick state.

### Files to understand (out of scope, no changes needed)

- `/home/bob/Projects/auto-battler/src/engine/game-core.ts` - Engine tick processing. Line 116: `tick: state.tick + 1` -- this is the increment that causes the off-by-one relative to event stamps. **Not changing this; it is correct behavior.**
- `/home/bob/Projects/auto-battler/src/engine/combat.ts` - Stamps damage events (line 87) and whiff events (line 74) with `tick` parameter (the pre-increment value). **Not changing this.**
- `/home/bob/Projects/auto-battler/src/engine/healing.ts` - Also stamps whiff events with tick parameter (for heal whiffs). Same pattern as combat.ts.
- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` - Store `processTick` action (line 153): calls `engineProcessTick`, then assigns `result.state.tick` to `state.gameState.tick`. This is where the tick advances past event stamps.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts` - Hook consuming `selectRecentWhiffEvents`. No changes needed; it correctly transforms whatever the selector returns.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.ts` - Hook consuming `selectRecentDamageEvents`. No changes needed.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.test.ts` - Tests add events at `tick: 0` and never advance tick. Same pattern as useWhiffIndicators.test.ts. **May need updating** if the tick-0 guard (`tick === 0` returns empty array) applies. Worth checking during planning.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.tsx` - Renders whiff indicators from `useWhiffIndicators`. No changes needed.
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.tsx` - Renders damage numbers from `useDamageNumbers`. No changes needed.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-test-helpers.ts` - Test helpers for creating characters and skills.

## Existing Patterns

- **Selector-based subscriptions** - Zustand selectors are pure functions of `GameStore` state. Both affected selectors follow this pattern correctly; only the filter logic is wrong.
- **Event history filtering** - Events are appended to `state.gameState.history` array. Selectors filter by `type` and `tick` to get events for the current display tick. The "current tick" concept needs redefining as "just-resolved tick" (`tick - 1`).
- **Test pattern for selectors** - Integration tests use `useGameStore.setState()` to manually set tick values and `actions.addEvent()` to inject events. This bypass of `processTick` is what allowed the bug to go undetected -- tests manually aligned tick and event values rather than using realistic post-`processTick` state.

## Dependencies

- The fix depends on the invariant that `lastResolvedTick = tick - 1` is always true after `processTick`. This is guaranteed by `game-core.ts` line 116 (`tick: state.tick + 1`).
- The `tick === 0` guard depends on the fact that at tick 0 no resolution has occurred yet, so there are no events to show.

## Applicable Lessons

- None of the existing lessons (001-004) directly apply to this off-by-one bug. However, lesson 001 ("Scope behavioral specs by mode/context") is tangentially relevant: the selector spec should clarify that "current tick" means "just-resolved tick" not "store's current tick value."

## Constraints Discovered

1. **tick === 0 edge case:** At tick 0, `tick - 1 = -1`. No events will ever have `tick: -1`, so the filter naturally returns empty array. An explicit `tick === 0` guard (returning `[]` early) is cleaner and more self-documenting but functionally equivalent.
2. **useDamageNumbers.test.ts impact:** All 7 tests in `useDamageNumbers.test.ts` add events at `tick: 0` while the store tick is also 0. After the fix, these tests will return empty arrays since `tick - 1 = -1` will not match `event.tick = 0`. These tests will need to either set store tick to 1 (simulating post-processTick) or be restructured. **This file was NOT listed in the requirements scope** but IS affected.
3. **useWhiffIndicators.test.ts impact:** Same pattern -- all 4 tests add events at `tick: 0` with store tick at 0. All will break after the fix.
4. **Selectors must remain pure functions** -- no side effects, no mutable state.
5. **Max 400 lines per file** -- `gameStore-selectors.ts` is 487 lines but already exists in this state; no new extraction needed for this task.

## Open Questions

1. **Should `useDamageNumbers.test.ts` be updated too?** It is not listed in the requirements scope, but all its tests will break after the selector fix since they add events at `tick: 0` while the store is also at tick 0. The requirements only list `useWhiffIndicators.test.ts`, but the same bug pattern exists in `useDamageNumbers.test.ts`. **Recommendation: add it to scope.**
2. **Guard style for tick === 0:** Should the selectors use an explicit early return (`if (tick === 0) return []`) or rely on the natural `tick - 1 = -1` never matching? The requirements say "both selectors return empty arrays when tick === 0" suggesting an explicit guard is expected.
3. **Should the `selectRecentDamageEvents` tests in gameStore-integration.test.ts that use `useGameStore.setState` to manually set tick remain as unit-style tests, or should they be converted to use `processTick` for more realistic testing?** The requirements say "use realistic post-processTick state" but the existing tests cover different concerns (type filtering, tick filtering). A mix of both styles may be appropriate.
