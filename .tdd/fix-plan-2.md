# Fix Plan 2: Adjust Stroke Width + Fix Bidirectional Offset Bug

## Changes Requested

1. Increase solid line stroke width from 3px to 4px (dashed stays 2px)
2. Fix bidirectional offset bug - intent lines not respecting offset when two characters target each other

## Issue 1: Stroke Width Adjustment

### Change Required

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx`

**Current** (line ~44):

```typescript
const strokeWidth = ticksRemaining === 0 ? 3 : 2;
```

**Change to**:

```typescript
const strokeWidth = ticksRemaining === 0 ? 4 : 2;
```

**Test Updates**:

- `IntentLine.test.tsx`: Update Visual-8 to expect 4px (was 3px), outline 5px (was 4px)
- `IntentLine-accessibility.test.tsx`: Update solid line test to expect 4px + 5px outline

## Issue 2: Bidirectional Offset Bug

### Root Cause Analysis

The bidirectional offset detection in `IntentOverlay.tsx` (function `detectBidirectionalAttacks`) only processes `attack` type actions:

```typescript
for (const intent of intents) {
  if (intent.action.type !== "attack") continue; // ← Only attacks get offset
  // ...
}
```

This is correct - movement shouldn't get bidirectional offset. However, need to verify:

1. Are both instant (ticksRemaining=0) and wind-up (ticksRemaining>0) attacks being detected?
2. Is the offset being applied correctly to both solid and dashed lines?

### Investigation Steps

1. Check if `detectBidirectionalAttacks` filters work with new visual encoding
2. Verify offset is applied to IntentLine component regardless of ticksRemaining
3. Test with browser: create two characters attacking each other (one instant, one wind-up)

### Potential Fix

If the issue is that offset detection works but rendering doesn't apply it, check `IntentLine.tsx` - the offset is applied via transform/positioning, which should work regardless of stroke width or dash pattern.

Most likely: The detection logic is correct, but we need to verify it's being called and the offset Map is being populated correctly.

## Implementation Steps

1. Update stroke width 3px → 4px in IntentLine.tsx
2. Update test expectations for 4px/5px
3. Debug bidirectional offset:
   - Add console.log to detectBidirectionalAttacks to see if it detects pairs
   - Check if offset Map has entries
   - Verify IntentLine receives offset prop
4. Fix offset bug if found
5. Run tests
6. Browser verification: test bidirectional attacks with both instant and wind-up

## Expected Outcome

- Solid lines render at 4px, dashed at 2px
- Bidirectional attacks (A→B, B→A) show perpendicular offset
- All tests pass
