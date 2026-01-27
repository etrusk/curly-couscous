# INV-001: Intent Lines Not Rendering After Timing Fix

**Date**: 2026-01-27

**Status**: Resolved

## Issue

Intent lines stopped rendering after commit 44d5cf4 (action timing fix).

## Symptoms

- No intent lines visible on the battle grid despite characters having pending actions
- IntentOverlay component rendering but showing 0 intents
- Browser console logs showed decisions being made but `selectIntentData` returning empty array

## Investigation Process

1. **Initial Hypothesis**: Suspected IntentOverlay component or SVG rendering issue
   - Added debug logging to IntentOverlay and IntentLine components
   - Confirmed components were receiving 0 intents from selector

2. **Selector Investigation**: Checked `selectIntentData` selector
   - Added debug logging showing `withActions: 0` despite decisions being made
   - Suspected actions weren't being applied to characters

3. **Engine Investigation**: Traced through processTick flow
   - Added logging to `computeDecisions`, `applyDecisions`, `resolveCombat`, `resolveMovement`, `clearResolvedActions`
   - Discovered actions WERE being applied (`withActions: 2`) but then cleared
   - Found `clearResolvedActions` was clearing actions with `resolvesAtTick: 0` on tick 0

4. **Root Cause Discovery**:
   - Commit 44d5cf4 changed timing formula from `tick + tickCost - 1` to `tick + tickCost`
   - Commit also "simplified" the `selectIntentData` filter from complex logic to `ticksRemaining >= 0`
   - The simplification removed the distinction between attack and movement actions
   - Original filter: attacks need `ticksRemaining > 0`, movement needs `ticksRemaining >= 0`
   - Broken filter: all actions need `ticksRemaining >= 0`

## Root Cause

The `selectIntentData` selector filter was incorrectly simplified in commit 44d5cf4. The comment at line 127-133 clearly stated the business logic:

- Attack actions should be filtered out when `ticksRemaining <= 0` (they're resolving/resolved)
- Movement actions should be shown even with `ticksRemaining = 0` (movement has no visible damage effect)

The actual filter at line 155 was:

```typescript
intent.action.type !== "idle" && intent.ticksRemaining >= 0;
```

This showed ALL actions (including attacks) with `ticksRemaining >= 0`, meaning attacks resolving on the current tick were included when they should be filtered out.

## Fix Applied

Restored the proper filter logic in `src/stores/gameStore-selectors.ts`:

```typescript
const filtered = mapped.filter(
  (intent) =>
    intent.action.type !== "idle" &&
    (intent.ticksRemaining > 0 ||
      (intent.action.type === "move" && intent.ticksRemaining >= 0)),
);
```

Also added two regression tests:

1. Test that attack actions with `ticksRemaining = 0` are filtered out
2. Test that movement actions with `ticksRemaining = 0` are included (movement exception)

## Prevention

1. **Never simplify complex business logic without tests**: The original filter had complex logic for a reason (documented in comments). The "simplification" broke the intended behavior.

2. **Test coverage for edge cases**: Add tests for boundary conditions (ticksRemaining = 0, 1, 2) for both attack and movement types.

3. **Document business logic in tests**: The comment explained the logic, but tests would have caught the regression immediately.

4. **Be suspicious of "cleanup" changes**: When a commit includes both feature work AND cleanup/refactoring, the cleanup often introduces bugs.

## Related Files

- `src/stores/gameStore-selectors.ts` (fix location)
- `src/stores/gameStore-selectors.test.ts` (regression tests added)
- `src/components/BattleViewer/IntentOverlay.tsx`
- `src/components/BattleViewer/IntentLine.tsx`
- `src/engine/game-core.ts`
- `src/engine/game-decisions.ts`
- `src/engine/game-actions.ts`

## Lessons Learned

- Comments describing complex business logic should be matched by tests
- "Simplifications" of multi-branch conditionals deserve extra scrutiny
- Debug logging at selector boundaries is invaluable for diagnosing data flow issues

## Update (2026-01-27)

This investigation was partially incorrect. The "fix" restored a movement exception that was itself a bug. See commit 049fb6e which correctly unified filtering to `ticksRemaining >= 0` for ALL actions, matching spec.md line 122. The spec always required uniform filtering; the "movement exception" was a misinterpretation. The movement/attack distinction is purely visual (dashed vs solid lines), not filtering logic.
