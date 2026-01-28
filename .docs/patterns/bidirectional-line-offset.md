# Pattern: Bidirectional Line Offset

## Context

When rendering overlay lines (intent lines, targeting lines) between characters on a grid, bidirectional pairs (A targets B and B targets A) result in overlapping lines that become visually indistinguishable.

## Problem

Two lines connecting the same endpoints (but in opposite directions) render on top of each other, making it impossible to see that two characters are mutually targeting.

## Solution

Apply a perpendicular offset to each line in the bidirectional pair, shifting them apart by 4px each (8px total separation).

### Implementation

```typescript
function detectBidirectionalPairs(
  data: LineData[],
): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>();
  const processed = new Set<string>();

  for (const item of data) {
    if (processed.has(item.fromId)) continue;

    // Find reverse pair
    const reverse = data.find(
      (other) =>
        other.fromId !== item.fromId &&
        positionsEqual(other.fromPosition, item.toPosition) &&
        positionsEqual(other.toPosition, item.fromPosition),
    );

    if (reverse) {
      processed.add(item.fromId);
      processed.add(reverse.fromId);

      // Calculate perpendicular direction
      const dx = item.toPosition.x - item.fromPosition.x;
      const dy = item.toPosition.y - item.fromPosition.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) continue;

      // Perpendicular vector: (-dy, dx), normalized, scaled by 4px
      const perpX = (-dy / length) * 4;
      const perpY = (dx / length) * 4;

      // Alphabetically lower ID gets negative offset (deterministic)
      const isFirstLower = item.fromId < reverse.fromId;

      offsets.set(item.fromId, {
        x: isFirstLower ? -perpX : perpX,
        y: isFirstLower ? -perpY : perpY,
      });
      offsets.set(reverse.fromId, {
        x: isFirstLower ? perpX : -perpX,
        y: isFirstLower ? perpY : -perpY,
      });
    }
  }

  return offsets;
}
```

### Key Details

1. **Perpendicular vector**: Use `(-dy, dx)` rotated 90 degrees from line direction
2. **4px offset each**: Results in 8px total separation between parallel lines
3. **Alphabetical ID ordering**: Ensures deterministic offset assignment across renders
4. **Apply to both endpoints**: Shift entire line, not just one end

## Rationale

- Perpendicular offset keeps lines parallel to their original direction
- Alphabetical ordering provides consistent visual behavior
- 4px offset balances visibility with minimal visual disruption

## Related Files

- `/src/components/BattleViewer/IntentOverlay.tsx` - `detectBidirectionalAttacks()`
- `/src/components/BattleViewer/TargetingLineOverlay.tsx` - `detectBidirectionalTargeting()`
- `/src/components/BattleViewer/IntentLine.tsx` - `offset` prop
- `/src/components/BattleViewer/TargetingLine.tsx` - `offset` prop
