# Fix Plan: Thicken Solid Intent Lines

## Context

After REVIEW completion, human requested visual enhancement: thicken solid intent lines (ticksRemaining = 0) from 2px to 3px to increase visual prominence of immediate threats.

## Root Cause

Not a bug - this is a human-requested refinement to strengthen the visual hierarchy:

- Current: Uniform 2px stroke for all intent lines
- Requested: 3px for solid (immediate), keep 2px for dashed (future)

## Rationale

Stronger visual distinction:

- **Solid 3px**: Immediate threat (ticksRemaining = 0) - highest urgency
- **Dashed 2px**: Future action (ticksRemaining > 0) - lower urgency, time to react

## Changes Required

### 1. Implementation File

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx`

**Current** (line ~44):

```typescript
const strokeWidth = 2; // Uniform width
```

**Change to**:

```typescript
const strokeWidth = ticksRemaining === 0 ? 3 : 2; // Solid (immediate): 3px, Dashed (future): 2px
```

**Current** (line ~48):

```typescript
const outlineStrokeWidth = strokeWidth + 1;
```

**Keep unchanged** - outline will automatically adjust (3+1=4px for solid, 2+1=3px for dashed)

### 2. Test Updates

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.test.tsx`

Update test expectations for solid line stroke width:

**Visual-3**: "should render uniform 2px stroke width"

- Change test name to reflect new behavior
- Update assertion: expect solid line (ticksRemaining=0) to be 3px, dashed to be 2px

**Visual-8**: "should render with uniform 2px stroke (no variable thickness)"

- Update to expect 3px for solid, 2px for dashed
- Verify outline is strokeWidth + 1

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine-accessibility.test.tsx`

**Update-C1**: "should apply thick outline (strokeWidth + 1) for contrast"

- Update to test both cases: 3+1=4px for solid, 2+1=3px for dashed

### 3. Documentation

**File**: `.tdd/session.md`

Update "Key Decisions" to reflect new visual hierarchy:

- Solid lines (immediate): 3px stroke
- Dashed lines (future): 2px stroke

## Implementation Steps

1. Update `IntentLine.tsx` line ~44 with conditional stroke width
2. Update Visual-3 test name and assertions
3. Update Visual-8 test assertions
4. Update Update-C1 test assertions
5. Run tests → verify all pass
6. Run browser verification → verify visual change
7. Update session.md with changes

## Risks

**Low risk**:

- Small, isolated change
- Only affects visual rendering
- Tests clearly define expected behavior
- Browser verification will catch any issues

## Expected Outcome

- All tests pass with new expectations
- Solid lines visibly thicker (3px) than dashed lines (2px)
- Visual hierarchy strengthened: solid = urgent, dashed = time to react
