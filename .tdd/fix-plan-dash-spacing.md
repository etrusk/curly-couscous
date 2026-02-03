# Fix Plan: Improve Dashed Line Visibility

## Root Cause Analysis

User feedback during HUMAN_VERIFY: Dashed lines for wind-up actions are hard to see because the spacing between dashes is too narrow.

**Current implementation**: `strokeDasharray="4 2"` (4px dash, 2px gap)
**Issue**: 2px gap is too narrow for clear visual distinction
**Fix**: Increase gap to improve visibility

## Proposed Solution

Change dash pattern from `"4 2"` to `"4 4"` (4px dash, 4px gap).

**Rationale**:

- Doubles the gap spacing (2px → 4px)
- Maintains same dash length (4px)
- Creates equal dash/gap ratio for balanced appearance
- Improves visual distinction from solid lines

## Files to Modify

### 1. IntentLine.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx`
**Line**: ~50-60 (where strokeDasharray is set for future actions)

**Current code**:

```typescript
strokeDasharray={ticksRemaining > 0 ? "4 2" : undefined}
```

**New code**:

```typescript
strokeDasharray={ticksRemaining > 0 ? "4 4" : undefined}
```

**Location**: This appears twice - once for the outline stroke and once for the main stroke.

## Impact Analysis

### Visual Changes

- Wind-up actions (Heavy Punch, Heal, Move) will have more visible dashed lines
- Immediate actions (Light Punch) remain solid (unchanged)
- No functional changes, purely visual improvement

### Tests Affected

- No test changes needed (tests don't assert specific dash patterns)
- All tests should continue to pass

### Spec Updates

- `.docs/spec.md` line 214 documents the dash pattern as "4 2"
- Should be updated to "4 4" during SYNC_DOCS phase

## Validation

After applying fix:

1. Visual check in browser: dashed lines should be clearly visible
2. Tests should all pass (no behavioral changes)
3. Lint should pass

## Alternative Considered

- `"4 6"`: Even larger gap, but may look too sparse
- `"3 3"`: Smaller but equal, may still be hard to see
- `"4 4"`: **Recommended** - balanced improvement
