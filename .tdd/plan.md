# Implementation Plan: Fix off-by-one in whiff/damage event selectors

## Bug Summary

`selectRecentWhiffEvents` and `selectRecentDamageEvents` filter `e.tick === tick`, but after `processTick` the store's `tick` is already incremented to N+1 while events are stamped at N. Both selectors always return empty arrays in real usage.

## Changes

### 1. Fix selectors in `src/stores/gameStore-selectors.ts`

**Lines 263-279.** Two changes:

**selectRecentDamageEvents (line 263):**

- Add early return: `if (tick === 0) return [];` (no resolved tick yet)
- Change filter from `e.tick === tick` to `e.tick === tick - 1`
- Update JSDoc comment to explain: after `processTick`, `state.tick` is the _next_ tick to process; events from the just-resolved tick are at `tick - 1`

**selectRecentWhiffEvents (line 274):**

- Same pattern: early return for `tick === 0`, filter `e.tick === tick - 1`
- Same explanatory comment

### 2. Update integration tests in `src/stores/gameStore-integration.test.ts`

All tests currently mask the bug by manually aligning store tick and event tick values. Restructure to simulate realistic post-`processTick` state where store tick = event tick + 1.

**`selectRecentDamageEvents` describe block (lines 22-140), 4 tests:**

- **"returns empty array when no damage events"** (line 28): No change needed (already returns empty).

- **"filters damage events by current tick"** (line 37): Change store tick from 1 to 2. Keep event tick at 1. This simulates post-processTick where tick was incremented from 1 to 2 after stamping events at 1. Assertion: selector returns the event.

- **"excludes damage from previous ticks"** (line 64): Change store tick from 1 to 2. Keep `currentDamageEvent.tick = 1` and `oldDamageEvent.tick = 0`. Selector should return only the tick-1 event (tick=1). Assertion: result has length 1 with `tick === 1`.

- **"excludes non-damage events"** (line 103): Currently at tick 0 with events at tick 0. Change store tick to 1. Keep events at tick 0. Selector returns only the damage event at tick 0 (matching `tick - 1 = 0`).

- **Add new test: "returns empty array when tick is 0"**: Verify the `tick === 0` guard. Set store tick to 0, add damage event at tick 0, verify selector returns `[]`.

**`selectRecentWhiffEvents` describe block (lines 514-585), 3 tests:**

- **"returns whiff events for current tick"** (line 519): Change store tick from 1 to 2. Keep event tick at 1. Selector returns the event.

- **"excludes whiff events from other ticks"** (line 544): Change store tick from 1 to 2. Keep current event tick at 1, old event tick at 0. Selector returns only the tick-1 event.

- **"returns empty array when no whiff events exist"** (line 577): No change needed.

- **Add new test: "returns empty array when tick is 0"**: Same pattern as damage selector test.

### 3. Update hook tests in `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`

All 4 tests add events at `tick: 0` while the store is also at tick 0. After the fix, `tick - 1 = -1` will not match `event.tick = 0`, so these tests will break.

**Fix for all tests with events:** Set store tick to 1 after `initBattle` but before adding events. Keep event ticks at 0. This simulates the post-processTick state.

- **"returns empty array when no whiff events"** (line 33): No change needed (no events added).
- **"transforms whiff events into display data..."** (line 42): Add `useGameStore.setState` to set tick to 1 before adding event at tick 0.
- **"deduplicates whiffs on same cell..."** (line 63): Same -- set tick to 1 before adding events.
- **"handles multiple cells independently"** (line 91): Same -- set tick to 1 before adding events.

### 4. Update hook tests in `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`

Same pattern as whiff indicators tests. All 7 tests add events at `tick: 0` while store tick is 0.

**Note:** This file was not in the original requirements scope but was identified during EXPLORE as affected. The explorer recommended adding it to scope. All tests will break without this update.

- **"returns empty array when no damage events"** (line 35): No change needed (no events added).
- **"returns DamageNumberData with correct targetPosition"** (line 44): Set tick to 1 before adding event at tick 0.
- **"includes attackerFaction from TokenData"** (line 66): Set tick to 1 before adding event at tick 0.
- **"groups multiple damages by same target"** (line 89): Set tick to 1 before adding events at tick 0.
- **"calculates totalDamage correctly..."** (line 122): Set tick to 1 before adding events at tick 0.
- **"preserves individual damage entries..."** (line 154): Set tick to 1 before adding events at tick 0.
- **"handles multiple targets independently"** (line 190): Set tick to 1 before adding events at tick 0.

## Scope Expansion Justification

`useDamageNumbers.test.ts` is added to scope because all 6 of its event-based tests will fail after the selector fix. Without updating these tests, `npm run test` will report 6 failures. This is a mechanical change (set tick to 1 before events), not a behavioral change.

## Files Modified (exhaustive list)

| File                                                           | Change Type | Lines Affected                                    |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------- |
| `src/stores/gameStore-selectors.ts`                            | Bug fix     | Lines 258-279 (both selectors + comments)         |
| `src/stores/gameStore-integration.test.ts`                     | Test update | Lines 22-140, 514-585 (tick values + 2 new tests) |
| `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts` | Test update | 3 tests: add tick=1 setState calls                |
| `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`   | Test update | 6 tests: add tick=1 setState calls                |

**Total: 4 files.** No new files created. No files deleted.

## Implementation Order

1. Fix selectors (source of truth)
2. Update integration tests (most thorough coverage of the fix)
3. Update useWhiffIndicators.test.ts
4. Update useDamageNumbers.test.ts
5. Run `npm run test` to verify all tests pass

## Risks and Tradeoffs

**Risk: Other consumers of these selectors.** Mitigated -- the explorer confirmed only `useWhiffIndicators` and `useDamageNumbers` consume these selectors. No other call sites exist.

**Tradeoff: Explicit `tick === 0` guard vs. natural no-match.** The plan uses an explicit early return for clarity and self-documentation, even though `tick - 1 = -1` would naturally produce empty results. This matches the requirements ("both selectors return empty arrays when tick === 0").

**Tradeoff: Scope expansion.** Adding `useDamageNumbers.test.ts` was not in original requirements but is necessary to prevent test failures. This is a minimal, mechanical change.

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements (whiff/damage selectors serve WhiffOverlay and DamageOverlay display)
- [x] Approach consistent with `.docs/architecture.md` (selectors remain pure functions, no engine changes)
- [x] Patterns follow `.docs/patterns/index.md` (selector-based subscriptions pattern preserved)
- [x] No conflicts with `.docs/decisions/index.md` (no ADRs govern selector tick logic)
- [x] No UI changes -- not a visual task

## No New Decisions

This fix does not introduce any new architectural decisions. It corrects existing behavior to match the documented tick lifecycle invariant (`lastResolvedTick = tick - 1`).
