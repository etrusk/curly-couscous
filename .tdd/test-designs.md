# Test Designs: Fix off-by-one in whiff/damage event selectors

## Overview

These test designs cover the fix for `selectRecentDamageEvents` and `selectRecentWhiffEvents` selectors which currently filter `e.tick === tick`, but after `processTick` the store tick has already been incremented to `tick + 1` while events are stamped at the pre-increment tick. The fix changes both selectors to filter `e.tick === tick - 1` and adds a `tick === 0` guard.

All tests that previously set store tick equal to event tick (masking the bug) must be restructured so store tick is one ahead of event tick, simulating realistic post-`processTick` state.

---

## Section 1: Integration tests for `selectRecentDamageEvents`

File: `src/stores/gameStore-integration.test.ts`

These tests update the existing `selectRecentDamageEvents` describe block (lines 22-140) to use realistic post-`processTick` tick alignment, plus one new test for the `tick === 0` guard.

---

### Test: selectRecentDamageEvents-returns-empty-when-no-damage-events

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector returns empty array when history has no damage events
- **Setup**: Create one character, call `initBattle`. Store tick stays at 0 (default). No events added.
- **Assertions**:
  1. `selectRecentDamageEvents(useGameStore.getState())` returns `[]`
- **Justification**: Baseline test ensuring no false positives when history is empty. No change needed from existing test -- this test already passes correctly because there are no events to match regardless of tick logic.

---

### Test: selectRecentDamageEvents-returns-empty-when-tick-is-zero

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: The explicit `tick === 0` guard returns empty array even when damage events exist at tick 0
- **Setup**:
  1. Create one character, call `initBattle`. Store tick stays at 0 (default).
  2. Add a `DamageEvent` with `tick: 0` via `actions.addEvent()`.
- **Assertions**:
  1. `selectRecentDamageEvents(useGameStore.getState())` returns `[]`
  2. Store tick is confirmed to be `0` (precondition check)
- **Justification**: At tick 0 no resolution has occurred, so there are no "just-resolved" events to display. This tests the explicit early return guard. Without the guard, `tick - 1 = -1` would naturally produce empty results, but the explicit guard is required by the acceptance criteria and prevents confusion if someone removes it thinking it is dead code.

---

### Test: selectRecentDamageEvents-filters-by-just-resolved-tick

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector returns damage events stamped at `tick - 1` (the just-resolved tick) when store tick is ahead by one
- **Setup**:
  1. Create two characters, call `initBattle`.
  2. Set store tick to `2` via `useGameStore.setState((state) => { state.gameState.tick = 2; })`.
  3. Add a `DamageEvent` with `tick: 1` (simulating an event stamped during the tick that was just resolved, before the store incremented to 2).
- **Assertions**:
  1. `selectRecentDamageEvents(useGameStore.getState())` has length `1`
  2. The returned event equals the added damage event
- **Justification**: This is the core test for the bug fix. Previously, the test set store tick to `1` and event tick to `1` (aligned), which masked the off-by-one. The new setup simulates the real post-`processTick` state where store tick is one ahead of the event timestamps. If the selector still uses `e.tick === tick`, this test will fail (returning empty array).

---

### Test: selectRecentDamageEvents-excludes-events-from-other-ticks

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector excludes damage events from ticks other than the just-resolved tick (both older and future/current store tick)
- **Setup**:
  1. Create two characters, call `initBattle`.
  2. Add a `DamageEvent` with `tick: 0` (old event from a previous resolution).
  3. Set store tick to `2` via `setState`.
  4. Add a `DamageEvent` with `tick: 1` (event from the just-resolved tick).
  5. Add a `DamageEvent` with `tick: 2` (event at current store tick -- not yet resolved; regression guard against old `e.tick === tick` bug).
- **Assertions**:
  1. `selectRecentDamageEvents(useGameStore.getState())` has length `1`
  2. The returned event has `tick === 1` (matches `tick - 1 = 2 - 1 = 1`)
  3. The old event (tick 0) is not in the result
  4. The future event (tick 2) is not in the result
- **Justification**: Verifies that only the just-resolved tick's events are returned, not historical ones and not events at the current store tick. The tick-2 event directly guards against the original bug: the old selector (`e.tick === tick`) would have matched it, but the fixed selector (`e.tick === tick - 1`) correctly excludes it. Previously the test set store tick to `1`, which with the buggy code matched `tick: 1` events. The new setup uses store tick `2` so the selector must use `tick - 1` to find only the `tick: 1` event.

---

### Test: selectRecentDamageEvents-excludes-non-damage-events

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector filters by event type, returning only damage events (not movement, death, etc.)
- **Setup**:
  1. Create one character, call `initBattle`.
  2. Set store tick to `1` via `setState`.
  3. Add a `movement` event at `tick: 0`, a `death` event at `tick: 0`, and a `DamageEvent` at `tick: 0`.
- **Assertions**:
  1. `selectRecentDamageEvents(useGameStore.getState())` has length `1`
  2. The returned event has `type === "damage"`
  3. The returned event matches the added damage event
- **Justification**: Ensures the type guard (`e.type === "damage"`) works correctly alongside the tick filter. Previously the test had store tick at `0` with events at `tick: 0`, which will no longer match after the fix (tick 0 triggers the early return guard). Setting store tick to `1` makes the selector look for events at `tick - 1 = 0`, matching the events added at tick 0.

---

## Section 2: Integration tests for `selectRecentWhiffEvents`

File: `src/stores/gameStore-integration.test.ts`

These tests update the existing `selectRecentWhiffEvents` describe block (lines 514-585) to use realistic post-`processTick` tick alignment, plus one new test for the `tick === 0` guard.

---

### Test: selectRecentWhiffEvents-returns-whiff-events-for-just-resolved-tick

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector returns whiff events stamped at `tick - 1` when store tick is ahead by one
- **Setup**:
  1. Create one character, call `initBattle`.
  2. Set store tick to `2` via `setState`.
  3. Add a whiff event with `tick: 1`, `sourceId: "char1"`, `actionType: "attack"`, `targetCell: { q: 2, r: 0 }`.
- **Assertions**:
  1. `selectRecentWhiffEvents(useGameStore.getState())` has length `1`
  2. The returned event matches the added whiff event
- **Justification**: Core fix test for the whiff selector. Previously used aligned tick values (store tick 1, event tick 1). The new setup simulates post-`processTick` state where store tick is 2 and events are stamped at 1.

---

### Test: selectRecentWhiffEvents-excludes-events-from-other-ticks

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector excludes whiff events from ticks other than the just-resolved tick (both older and future/current store tick)
- **Setup**:
  1. Create one character, call `initBattle`.
  2. Add a whiff event at `tick: 0` (old event).
  3. Set store tick to `2` via `setState`.
  4. Add a whiff event at `tick: 1` (just-resolved tick event).
  5. Add a whiff event at `tick: 2` (event at current store tick -- not yet resolved; regression guard against old `e.tick === tick` bug).
- **Assertions**:
  1. `selectRecentWhiffEvents(useGameStore.getState())` has length `1`
  2. The returned event has `tick === 1`
  3. The future event (tick 2) is not in the result
- **Justification**: Ensures only the just-resolved tick's whiff events are included, excluding both historical events and events at the current store tick. The tick-2 event directly guards against the original bug: the old selector (`e.tick === tick`) would have matched it. Previously used store tick 1 with event ticks 0 and 1; the new setup uses store tick 2.

---

### Test: selectRecentWhiffEvents-returns-empty-when-no-whiff-events

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: Selector returns empty array when no whiff events exist in history
- **Setup**: Create one character, call `initBattle`. No events added.
- **Assertions**:
  1. `selectRecentWhiffEvents(useGameStore.getState())` returns `[]`
- **Justification**: Baseline test. No change needed -- passes correctly regardless of tick logic because there are no events.

---

### Test: selectRecentWhiffEvents-returns-empty-when-tick-is-zero

- **File**: `src/stores/gameStore-integration.test.ts`
- **Type**: unit
- **Verifies**: The explicit `tick === 0` guard returns empty array even when whiff events exist at tick 0
- **Setup**:
  1. Create one character, call `initBattle`. Store tick stays at 0.
  2. Add a whiff event with `tick: 0` via `actions.addEvent()`.
- **Assertions**:
  1. `selectRecentWhiffEvents(useGameStore.getState())` returns `[]`
  2. Store tick is confirmed to be `0`
- **Justification**: Same rationale as the damage selector tick-0 test. At tick 0 no resolution has occurred. Tests the explicit guard required by the acceptance criteria.

---

## Section 3: Updates to `useWhiffIndicators.test.ts`

File: `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`

All 3 tests that add events at `tick: 0` currently work because both store tick and event tick are 0 (accidentally aligned). After the fix, `tick - 1 = -1` at tick 0 will not match `event.tick = 0`. Additionally, the `tick === 0` guard returns empty array early. Each test must set store tick to `1` after `initBattle` but before adding events, simulating post-`processTick` state.

The "returns empty array when no whiff events" test needs no change (no events added, result is always empty).

---

### Test: useWhiffIndicators-returns-empty-when-no-whiff-events

- **File**: `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`
- **Type**: unit
- **Verifies**: Hook returns empty array when no whiff events exist in store
- **Setup**: Create one character, call `initBattle`. No events added. No tick change needed.
- **Assertions**:
  1. `result.current` equals `[]`
- **Justification**: No change from existing test. Passes regardless of selector fix because there are no events to filter.

---

### Test: useWhiffIndicators-transforms-whiff-events-into-display-data

- **File**: `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`
- **Type**: unit
- **Verifies**: Hook transforms whiff events into `WhiffIndicatorData` objects with correct position, actionType, and cellKey
- **Setup**:
  1. Create one character, call `initBattle`.
  2. Set store tick to `1` via `useGameStore.setState((state) => { state.gameState.tick = 1; })`.
  3. Add a whiff event at `tick: 0` with `sourceId: "char1"`, `actionType: "attack"`, `targetCell: { q: 2, r: 3 }`.
  4. Render hook via `renderHook(() => useWhiffIndicators())`.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].position` equals `{ q: 2, r: 3 }`
  3. `result.current[0].actionType` is `"attack"`
  4. `result.current[0].cellKey` is `"2,3"`
- **Justification**: Previously had store tick at 0 and event tick at 0. After the fix, the selector at tick 0 returns early with `[]` (guard), so the hook would return empty. Setting tick to 1 makes the selector look for events at `tick - 1 = 0`, matching the event.

---

### Test: useWhiffIndicators-deduplicates-whiffs-on-same-cell

- **File**: `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`
- **Type**: unit
- **Verifies**: Multiple whiff events on the same cell are deduplicated, with last event's actionType winning
- **Setup**:
  1. Create two characters, call `initBattle`.
  2. Set store tick to `1` via `setState`.
  3. Add two whiff events at `tick: 0` on the same cell (`{ q: 1, r: 0 }`) with different action types: first `"attack"`, then `"heal"`.
  4. Render hook.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].actionType` is `"heal"` (last wins)
  3. `result.current[0].cellKey` is `"1,0"`
- **Justification**: Same tick alignment fix as above. The deduplication behavior is unchanged; only the tick setup needs updating.

---

### Test: useWhiffIndicators-handles-multiple-cells-independently

- **File**: `src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`
- **Type**: unit
- **Verifies**: Whiff events on different cells produce separate entries
- **Setup**:
  1. Create one character, call `initBattle`.
  2. Set store tick to `1` via `setState`.
  3. Add two whiff events at `tick: 0` on different cells: `{ q: 1, r: 0 }` (attack) and `{ q: 2, r: 1 }` (heal).
  4. Render hook.
- **Assertions**:
  1. `result.current` has length `2`
  2. Entry at `{ q: 1, r: 0 }` has `actionType === "attack"`
  3. Entry at `{ q: 2, r: 1 }` has `actionType === "heal"`
- **Justification**: Same tick alignment fix. Multi-cell behavior is unchanged.

---

## Section 4: Updates to `useDamageNumbers.test.ts`

File: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`

Same pattern as `useWhiffIndicators.test.ts`. All 6 tests that add events at `tick: 0` will break after the fix. Each must set store tick to `1` before adding events at tick 0. The "returns empty array when no damage events" test needs no change.

---

### Test: useDamageNumbers-returns-empty-when-no-damage-events

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: Hook returns empty array when no damage events exist
- **Setup**: Create one character, call `initBattle`. No events added. No tick change needed.
- **Assertions**:
  1. `result.current` equals `[]`
- **Justification**: No change from existing test. Passes regardless of selector fix.

---

### Test: useDamageNumbers-returns-correct-targetPosition

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: Hook returns `DamageNumberData` with target's position from token data
- **Setup**:
  1. Create two characters: `char1` at `{ q: 2, r: 3 }` (friendly), `char2` at `{ q: 1, r: 4 }` (enemy).
  2. Call `initBattle`.
  3. Set store tick to `1` via `setState`.
  4. Add a `DamageEvent` at `tick: 0` with `sourceId: "char1"`, `targetId: "char2"`, `damage: 10`, `resultingHp: 90`.
  5. Render hook.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].targetPosition` equals `{ q: 1, r: 4 }`
- **Justification**: Previously at tick 0 with event at tick 0 -- will break with the fix. Setting tick to 1 ensures `tick - 1 = 0` matches the event.

---

### Test: useDamageNumbers-includes-attackerFaction

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: Hook enriches damage data with attacker's faction from token data
- **Setup**:
  1. Create two characters: `char1` (friendly), `char2` (enemy).
  2. Call `initBattle`.
  3. Set store tick to `1` via `setState`.
  4. Add a `DamageEvent` at `tick: 0` from `char1` to `char2`.
  5. Render hook.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].damages` has length `1`
  3. `result.current[0].damages[0].attackerFaction` is `"friendly"`
- **Justification**: Same tick alignment fix.

---

### Test: useDamageNumbers-groups-multiple-damages-by-same-target

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: Multiple damage events on the same target are grouped into one `DamageNumberData` entry
- **Setup**:
  1. Create three characters: `char1` (friendly), `char2` (friendly), `char3` (enemy).
  2. Call `initBattle`.
  3. Set store tick to `1` via `setState`.
  4. Add two `DamageEvent`s at `tick: 0`, both targeting `char3` from `char1` and `char2`.
  5. Render hook.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].targetId` is `"char3"`
  3. `result.current[0].damages` has length `2`
- **Justification**: Same tick alignment fix. Grouping logic is unchanged.

---

### Test: useDamageNumbers-calculates-totalDamage-correctly

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: `totalDamage` field sums all individual damage amounts for grouped events
- **Setup**:
  1. Create three characters as above.
  2. Call `initBattle`.
  3. Set store tick to `1` via `setState`.
  4. Add two `DamageEvent`s at `tick: 0` targeting `char3` with `damage: 10` and `damage: 25`.
  5. Render hook.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].totalDamage` is `35`
- **Justification**: Same tick alignment fix. Summation logic is unchanged.

---

### Test: useDamageNumbers-preserves-individual-damage-entries

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: Individual damage entries are preserved in the `damages` array with correct `amount` and `attackerId`
- **Setup**:
  1. Create three characters: `char1` (friendly), `char2` (enemy), `char3` (enemy).
  2. Call `initBattle`.
  3. Set store tick to `1` via `setState`.
  4. Add two `DamageEvent`s at `tick: 0` targeting `char3` from `char1` (10 damage) and `char2` (25 damage).
  5. Render hook.
- **Assertions**:
  1. `result.current` has length `1`
  2. `result.current[0].damages` has length `2`
  3. `result.current[0].damages[0].amount` is `10` and `attackerId` is `"char1"`
  4. `result.current[0].damages[1].amount` is `25` and `attackerId` is `"char2"`
- **Justification**: Same tick alignment fix. Individual entry structure is unchanged.

---

### Test: useDamageNumbers-handles-multiple-targets-independently

- **File**: `src/components/BattleViewer/hooks/useDamageNumbers.test.ts`
- **Type**: unit
- **Verifies**: Damage events on different targets produce separate `DamageNumberData` entries
- **Setup**:
  1. Create three characters: `char1` (friendly), `char2` (enemy at `{ q: 2, r: 3 }`), `char3` (enemy at `{ q: 3, r: 2 }`).
  2. Call `initBattle`.
  3. Set store tick to `1` via `setState`.
  4. Add two `DamageEvent`s at `tick: 0`: one targeting `char2` (10 damage), one targeting `char3` (15 damage).
  5. Render hook.
- **Assertions**:
  1. `result.current` has length `2`
  2. Entry for `char2` has `totalDamage === 10`
  3. Entry for `char3` has `totalDamage === 15`
- **Justification**: Same tick alignment fix. Multi-target separation is unchanged.

---

## Summary

| File                                     | Tests Updated | Tests Added | Tests Unchanged |
| ---------------------------------------- | ------------- | ----------- | --------------- |
| `gameStore-integration.test.ts` (damage) | 3             | 1           | 1               |
| `gameStore-integration.test.ts` (whiff)  | 2             | 1           | 1               |
| `useWhiffIndicators.test.ts`             | 3             | 0           | 1               |
| `useDamageNumbers.test.ts`               | 6             | 0           | 1               |
| **Total**                                | **14**        | **2**       | **4**           |

### Change Pattern

All updates follow the same mechanical pattern:

1. After `initBattle`, add `useGameStore.setState((state) => { state.gameState.tick = 1; })` (or `tick = 2` where the test needs events at tick 1).
2. Keep event tick values as-is (or adjust to be `tick - 1` relative to the new store tick).
3. Assertions remain the same -- the behavioral contract is unchanged; only the tick alignment is corrected.

### New Tests

Two new tests (one per selector) verify the `tick === 0` guard, which is an explicit requirement in the acceptance criteria.

### Key Invariant Under Test

After `processTick`, `state.gameState.tick` is the _next_ tick to process. Events from the just-resolved tick are stamped at `tick - 1`. Both selectors must filter `e.tick === tick - 1` to find events from the just-resolved tick.
