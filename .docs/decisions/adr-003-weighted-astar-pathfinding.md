# ADR-003: Weighted A\* for Pathfinding, Chebyshev for Range

## Date

2026-01-29

## Status

Superseded by ADR-007 (Hexagonal Grid with Axial Coordinates)

The dual-distance approach (weighted A* for pathfinding, Chebyshev for range) was rendered unnecessary by the hex grid conversion. On hexagonal grids, all neighbors are equidistant (cost 1), eliminating the cardinal/diagonal distinction that motivated this ADR. A* pathfinding remains but uses uniform cost. Hex distance replaces Chebyshev for all calculations.

## Context

Characters exhibited zig-zag movement when navigating toward targets because the movement system used Chebyshev distance (diagonals cost 1) for both range calculations and step selection. When multiple adjacent cells are equidistant by Chebyshev metric, the tiebreaking rules produced visually erratic paths.

The game needed smooth, natural-looking movement while preserving Chebyshev distance for game mechanics (range checks, attack ranges).

## Options Considered

1. **Chebyshev for everything** -- Existing approach. Simple but produces zig-zag movement.
2. **Euclidean for everything** -- Changes game balance (ranges become circular, not square).
3. **Weighted A\* for pathfinding, Chebyshev for range** -- Dual distance: sqrt(2) diagonal costs for path planning, Chebyshev for game mechanics.

## Decision

Use weighted A\* pathfinding (diagonal cost sqrt(2), cardinal cost 1.0) for "towards" movement mode. Keep Chebyshev distance for range calculations, target selection, and "away" movement mode.

## Consequences

- **Positive**: Natural-looking paths; no unnecessary zig-zagging; optimal obstacle avoidance
- **Positive**: Game balance unchanged (ranges still Chebyshev)
- **Positive**: Performance acceptable (A\* on 12x12 to 30x30 grids is sub-millisecond)
- **Negative**: Two distance concepts in codebase (must document clearly)
- **Negative**: Existing movement tests required updates (6 test assertions changed)
- **Trade-off**: "Towards" and "away" modes now use different algorithms (A\* vs tiebreaking), adding conceptual complexity
