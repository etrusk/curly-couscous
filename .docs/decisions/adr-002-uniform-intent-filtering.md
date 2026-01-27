# ADR-002: Uniform Intent Line Filtering for All Action Types

**Date**: 2026-01-27

**Status**: Accepted

## Decision

Use uniform `ticksRemaining >= 0` filtering for all action types (attack, move) instead of special-casing movement actions.

## Context

During implementation of intent line visualization, a "movement exception" was introduced where movement actions were shown at `ticksRemaining = 0` but attack actions required `ticksRemaining > 0`. This created inconsistent behavior and confusion about when actions should display intent lines. User reported 4 intent line issues, including Light attack lines not showing and movement lines not showing.

## Options Considered

1. **Movement exception** (previous approach):
   - Attack actions: `ticksRemaining > 0` (filter out at tick 0)
   - Movement actions: `ticksRemaining >= 0` (show at tick 0)
   - Rationale: "Movement has no visible damage effect"
   - Con: Violates spec.md line 122 which requires `>= 0` for ALL actions
   - Con: Creates inconsistent UX (why would movement be special?)
   - Con: Light Punch (tickCost=1) not visible on tick before resolution

2. **Uniform filtering** (chosen): `ticksRemaining >= 0` for all actions
   - All actions shown when `ticksRemaining >= 0`
   - Filtered when `ticksRemaining < 0` (already resolved)
   - Pro: Matches spec requirement exactly
   - Pro: Consistent UX - all actions behave the same
   - Pro: Simpler code - no special cases
   - Pro: Light Punch (tickCost=1) visible for 1 tick before resolution

## Decision Rationale

1. **Spec compliance**: spec.md line 122 explicitly states "Intent lines appear for all pending actions with `ticksRemaining >= 0`"

2. **Complete information principle**: Design vision emphasizes "Complete information enables meaningful decisions—show exactly what will happen." Hiding attack intent lines at ticksRemaining=0 violates this.

3. **Simplicity**: Uniform filtering is easier to understand, test, and maintain than special cases.

4. **Separation of concerns**: Action type distinctions are visual (dashed lines for movement, solid for attacks) not logical (filtering rules).

## Implementation

Changed `src/stores/gameStore-selectors.ts` filter from:

```typescript
intent.ticksRemaining > 0 ||
  (intent.action.type === "move" && intent.ticksRemaining >= 0);
```

to:

```typescript
intent.ticksRemaining >= 0;
```

- Updated comment to reflect uniform filtering for all action types
- Added 11 regression tests covering Light/Heavy Punch and Movement at various ticksRemaining values

## Consequences

### Benefits

- All actions (Light Punch, Heavy Punch, Movement) visible for at least 1 tick before resolution
- Consistent behavior across all action types
- Simpler code with no special cases
- Aligns perfectly with spec.md requirements
- Easier to reason about for developers and players

### Trade-offs

- Actions resolving on current tick now show intent lines (attack lines visible even as attack lands)
- This is actually correct per spec, but may feel slightly different from previous behavior

### Follow-up Work

- None - implementation complete and tested
- INV-001 updated to note the "movement exception" was a misinterpretation of spec
