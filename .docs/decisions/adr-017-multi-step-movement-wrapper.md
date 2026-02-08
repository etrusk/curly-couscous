# ADR-017: Wrapper Function for Multi-Step Movement

## Decision

Create `computeMultiStepDestination()` as a separate wrapper function that iteratively calls `computeMoveDestination()`, rather than modifying `computeMoveDestination()` to accept a `distance` parameter.

## Date

2026-02-08

## Context

Phase 5 (Dash skill) introduced multi-step movement via the `distance` field on skills. The engine needed to support moving more than 1 hex per skill use. Two approaches were considered:

1. Add a `distance` parameter to `computeMoveDestination()` and loop internally
2. Create a new `computeMultiStepDestination()` wrapper that calls the existing function iteratively

## Options Considered

**Option A: Modify `computeMoveDestination()`** -- Add optional `distance` parameter. Simpler API surface but risks regressions in all existing callers.

**Option B: Wrapper function** -- New `computeMultiStepDestination()` in `game-movement.ts`. Existing function untouched. Callers with `distance > 1` use the wrapper; all others continue using the original.

## Decision Rationale

Option B chosen. Zero risk to existing movement behavior. The wrapper creates a virtual mover at each intermediate position and delegates to the original single-step logic. Each step independently checks obstacles using the decision-phase snapshot (original `allCharacters` positions). The mover's own position is correctly excluded by ID via `buildObstacleSet`.

**Additional decision:** Hardcode 2-hex radius for `most_enemies_nearby` criterion. The requirement specifies "within 2 hexes" with no configurability needed. Kept as a `NEARBY_RADIUS = 2` constant in the case block. Can be extracted to a criterion parameter if configurability is needed later.

## Consequences

- Existing `computeMoveDestination()` callers are completely unaffected
- `createSkillAction()` conditionally routes to the wrapper when `distance > 1`
- Multi-step away movement uses iterative best-hex selection (each step independently maximizes distance)
- Partial movement is natural: if any step returns the same position (blocked), the loop exits early
- Shared by Dash (Phase 5) and future Charge (Phase 8)
