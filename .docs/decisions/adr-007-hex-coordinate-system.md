# ADR-007: Hexagonal Grid with Axial Coordinates

**Date:** 2026-02-03
**Status:** Accepted

## Decision

Replace the 12x12 square grid with a hexagonal grid using axial coordinates {q, r} and flat-top orientation. Map radius 5 produces 91 hexes. Distance uses hex distance formula: max(|dq|, |dr|, |dq+dr|).

## Context

The original square grid (12x12, Chebyshev distance) created gameplay issues:

1. **Diagonal bias**: Chebyshev distance treats diagonals as cost 1, making 8 directions effectively equivalent. This produces unnatural movement patterns and trivializes positioning.
2. **Corner/edge trapping**: 8-directional movement with square grids creates asymmetric escape route counts (corners: 3, edges: 5, interior: 8), leading to predictable AI behavior.
3. **Visual clarity**: Square grids with diagonal movement make intent lines harder to read due to many crossing angles.

Hexagonal grids are standard in tactical games (Civilization, Battle for Wesnoth) because they eliminate diagonal bias -- all 6 neighbors are equidistant.

## Options Considered

1. **Keep square grid, fix edge cases** - Low effort but doesn't solve diagonal bias
2. **Offset hex coordinates** - Simpler conceptually but awkward math (alternating row offsets)
3. **Axial hex coordinates {q, r}** - Clean math, well-documented (Red Blob Games), flat-top orientation matches horizontal layout
4. **Cube hex coordinates {q, r, s}** - Redundant third coordinate (s = -q-r); axial is equivalent with less storage

## Decision Rationale

Axial coordinates chosen because:

- **Clean distance formula**: `max(|dq|, |dr|, |dq+dr|)` -- no sqrt, no diagonals
- **Uniform movement cost**: All 6 neighbors cost 1, eliminating cardinal/diagonal distinction
- **Well-established pattern**: Red Blob Games reference implementation widely used
- **Flat-top orientation**: Matches horizontal UI layout, provides natural left/right movement
- **Radius-based boundary**: `max(|q|, |r|, |q+r|) <= 5` creates a symmetric hexagonal map
- **91 hexes at radius 5**: Comparable playing area to 12x12 (144 cells) with better tactical density

## Consequences

**Benefits:**

- Eliminated diagonal bias in all movement and targeting
- Simplified distance calculation (integer-only, no sqrt)
- Reduced escape routes from 0-8 to 0-6, making flee decisions more meaningful
- Symmetric map shape with no corner/edge asymmetry at map boundary
- Cleaner A\* pathfinding (uniform cost, 6 neighbors)

**Costs:**

- Required converting all coordinates in 49+ files (source + tests)
- Position type changed from {x, y} to {q, r} -- breaking change across entire codebase
- Tiebreaking rules updated: Y/X -> R/Q ordering
- SVG rendering required (CSS Grid cannot render hexagons) -- Phase 3 work
- Test vocabulary changed: "corner" -> "vertex", 8-way -> 6-way

**Migration approach:** Phased conversion across source files first (Phase 0), then test topology rewrites (Phase 1), then mechanical test coordinate updates (Phase 2), then SVG rendering (Phase 3).

## Key Files

- `src/engine/hex.ts` - Core hex math utilities
- `src/engine/types.ts` - Position interface {q, r}
- `src/engine/pathfinding.ts` - A\* on hex grid
- `src/engine/game-movement.ts` - Movement with hex tiebreaking
- `src/engine/selectors.ts` - Target selection with R/Q tiebreaking
