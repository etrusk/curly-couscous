# Exploration: Hex Topology Test Failures

## Summary

47 tests across 4 files fail due to rectangular grid assumptions. Failures split into two root causes:

1. **Stale {x,y} coordinates** -- positions use `{x, y}` instead of `{q, r}`, yielding `q=undefined, r=undefined` at runtime
2. **Wrong topology expectations** -- tests expect rectangular boundary properties (edges with 5 neighbors, corners with 3, interior with 8) but hex grid has vertices (3 neighbors), edges (4 neighbors), interior (6 neighbors)

## Hex Grid Topology Reference

```
Hex radius 5 = 91 hexes total
6 vertices (3 neighbors):  (5,0), (-5,0), (0,5), (0,-5), (5,-5), (-5,5)
24 edge hexes (4 neighbors): e.g. (3,2), (4,1), (5,-3)
61 interior hexes (6 neighbors): e.g. (0,0), (1,1), (-3,3)

Validity: max(|q|, |r|, |q+r|) <= 5
Distance: max(|dq|, |dr|, |dq+dr|)
Neighbors: 6 directions (E, W, SE, NW, NE, SW)

Key difference from 12x12 square grid:
- Square: corners=3, edges=5, interior=8 neighbors
- Hex: vertices=3, edges=4, interior=6 neighbors
- No concept of "x=0 wall" or "y=11 wall" -- boundary is hexagonal
- No "perpendicular escape" concept -- escape routes are among 6 hex directions
```

## File-by-File Analysis

### 1. `src/engine/game-movement-wall-boundary.test.ts` (18 failures, 1 pass)

**Root causes:**

- 12 of 18 tests use `{x, y}` coordinates -- these positions have `q=undefined, r=undefined` at runtime, making all distance/neighbor calculations meaningless
- 6 tests already use `{q, r}` but have wrong expected results because they were converted with rectangular-grid mental models

**Test-by-test breakdown:**

| Test                                    | Category   | Issue                                                                                                                                                                          |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| prefer interior over edge at x=0        | MECHANICAL | Uses `{x,y}` positions + expects `{x,y}` result                                                                                                                                |
| prefer interior over edge at x=11       | MECHANICAL | Uses `{x,y}` positions + expects `{x,y}` result                                                                                                                                |
| prefer interior over edge at y=0        | MECHANICAL | Uses `{x,y}` positions + expects `{x,y}` result                                                                                                                                |
| prefer interior over edge at y=11       | MECHANICAL | Uses `{x,y}` positions + expects `{x,y}` result                                                                                                                                |
| escape perpendicular at x=0 (same row)  | LOGIC      | Concept "perpendicular to wall" doesn't exist in hex                                                                                                                           |
| escape perpendicular at x=0, y=0        | LOGIC      | Already {q,r} but expects rect-style behavior                                                                                                                                  |
| escape perpendicular at x=11 (same row) | MECHANICAL | Uses `{x,y}`                                                                                                                                                                   |
| escape perpendicular at y=0 (same col)  | MECHANICAL | Uses `{x,y}`                                                                                                                                                                   |
| escape perpendicular at y=0, x=0        | LOGIC      | Mixed -- enemy {x,y}, char {q,r}                                                                                                                                               |
| escape perpendicular at y=11 (same col) | MECHANICAL | Uses `{x,y}`                                                                                                                                                                   |
| escape corner (0,0) from (1,1)          | LOGIC      | {q,r} used, but (1,1)->(0,0) is NOT adjacent in hex (distance=2). Comment says corner but (0,0) is center. Escape route counts are wrong (expect 4, but (0,0) has 6 neighbors) |
| escape corner (11,11)                   | LOGIC      | Uses invalid position {q:5, r:-40} (not on grid). Expects `{x:11, y:10}`                                                                                                       |
| escape corner (0,11)                    | LOGIC      | Uses {q:0, r:11} which is invalid (max coord = 11 > 5). Expects `{q:0, r:10}`                                                                                                  |
| escape corner (11,0)                    | LOGIC      | Partially converted. Expects `{x:11, y:1}`                                                                                                                                     |
| prefer interior (vertical fallback)     | MECHANICAL | Uses `{x,y}`                                                                                                                                                                   |
| stay in place (dx=dy=0)                 | PASS       | Already correct with {q,r}                                                                                                                                                     |
| towards mode at wall                    | MECHANICAL | Uses `{x,y}`                                                                                                                                                                   |
| towards mode at corner                  | LOGIC      | Uses {q,r} but (1,1)->(0,0) has hex distance=2, not adjacent. A\* first step is (0,1) or (1,0), not (0,0)                                                                      |
| escape from adjacent at wall            | MECHANICAL | Uses `{x,y}`                                                                                                                                                                   |

### 2. `src/engine/game-decisions-move-destination-wall-boundary.test.ts` (14 failures, 1 pass)

**Root causes:** Mirror of file 1 -- same tests wrapped in `computeDecisions()` instead of direct `computeMoveDestination()`. Same 14 coordinate/topology issues.

| Test                               | Category   | Issue                                   |
| ---------------------------------- | ---------- | --------------------------------------- |
| escape perpendicular x=0 same row  | MECHANICAL | `{x,y}` positions                       |
| escape perpendicular x=0, y=0      | LOGIC      | Already {q,r}, needs rethink for hex    |
| escape perpendicular x=11 same row | MECHANICAL | `{x,y}`                                 |
| escape perpendicular y=0 same col  | MECHANICAL | `{x,y}`                                 |
| escape perpendicular y=0, x=0      | LOGIC      | Mixed coords                            |
| escape perpendicular y=11 same col | MECHANICAL | `{x,y}`                                 |
| escape corner (0,0) from (1,1)     | LOGIC      | (0,0) isn't a corner in hex, distance=2 |
| escape corner (11,11)              | LOGIC      | Invalid position {q:5, r:-40}           |
| escape corner (0,11)               | LOGIC      | Invalid position {q:0, r:11}            |
| escape corner (11,0)               | LOGIC      | Partial conversion, wrong expected      |
| prefer interior vertical fallback  | MECHANICAL | `{x,y}`                                 |
| stay in place                      | PASS       | Already correct                         |
| towards at wall                    | MECHANICAL | `{x,y}`                                 |
| towards at corner                  | LOGIC      | (1,1)->(0,0) is distance 2 in hex       |
| escape adjacent at wall            | MECHANICAL | `{x,y}`                                 |

### 3. `src/engine/game-movement-escape-routes.test.ts` (6 failures, 9 pass)

**Root causes:** Already fully converted to `{q, r}` coordinates, but escape route counts and expected destinations are based on rectangular topology assumptions.

| Test                             | Category | Issue                                                                                                                                                                                                      |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| avoid corner positions           | LOGIC    | Test says (0,0) is a "corner" with 2 routes, but (0,0) is center with 6 neighbors. Comment says "vertex" but means rect corner. Expected dest `{q:1,r:1}` may be wrong for hex scoring.                    |
| penalize low escape routes       | LOGIC    | Blockers at (1,0) and (0,1) -- expects (1,-1) score=6 (dist=2, routes=3). Need to verify: (1,-1) has which neighbors blocked? In hex, neighbor count changes. Actual result: `{q:-1,r:1}`                  |
| preserve open field equal routes | LOGIC    | Expects `{q:0,r:1}` but gets `{q:0,r:2}`. Tiebreaking produces different winner because hex has different neighbor geometry. All interior candidates have 6 routes (not 8), and relative positions differ. |
| prefer moving inward from edge   | LOGIC    | Position (-3,3) has maxCoord=3, so it's INTERIOR (6 neighbors) not edge. Comment says "edge" but (-3,3) is well inside hex boundary. Expects (-3,2) but gets (-4,4).                                       |
| subtract obstacles at edge       | LOGIC    | Position (-3,3) is interior (6 neighbors), not edge. With 2 obstacles, expects 2 routes, but actual is 4 (6-2=4).                                                                                          |
| escape from corner trap          | LOGIC    | (0,0) is center with 6 neighbors. With enemy at (1,1) (distance=2), expects (-1,0) but gets different result since topology differs.                                                                       |

### 4. `src/engine/movement-groups-stress.test.ts` (3 failures, 1 pass)

**Root causes:** All positions use `{x, y}` format. When `q=undefined, r=undefined`:

- `positionsEqual(targetCell, position)` returns `true` (undefined === undefined)
- Characters are filtered out as "hold actions" in `resolveMovement` line 108
- No movement events are generated at all

| Test                                 | Category         | Issue                                                                                                                                                             |
| ------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| resolve independent collision groups | MECHANICAL       | All 8 positions use `{x,y}`. Need valid hex coords for 2 collision groups.                                                                                        |
| consume RNG once per group           | MECHANICAL       | Same `{x,y}` issue.                                                                                                                                               |
| process groups deterministic order   | PASS             | Passes by accident (both orderings produce same empty result).                                                                                                    |
| handle 8-way collision               | LOGIC+MECHANICAL | Uses `{x,y}` AND assumes 8 neighbors. Hex only has 6 neighbors. Need 6-way collision test. Also uses `position.x === 5 && position.y === 5` assertion (line 209). |

## Classification Summary

### MECHANICAL (coordinate updates only) -- 22 tests

Tests that only need `{x, y}` replaced with valid `{q, r}` hex coordinates and updated expected values. The test _logic_ (what behavior is being verified) is sound for hex grids.

**Wall-boundary files (both):** 16 tests total (8 per file)

- "prefer interior over edge" x 4 (per file)
- "escape perpendicular" at x=11, y=0, y=11 (per file -- 3 each)
- "towards mode at wall" (per file)

**Movement-groups-stress:** 2 tests

- "resolve independent collision groups"
- "consume RNG once per group"

### LOGIC (topology rewrites) -- 19 tests

Tests where the _concept_ being tested doesn't translate to hex grids. These need new scenarios designed around hex boundary shape (vertices with 3 neighbors, edges with 4, hexagonal boundary instead of rectangular walls).

**Wall-boundary files (both):** 12 tests total (6 per file)

- "escape perpendicular at x=0 y=0" -- no perpendicular concept in hex
- "escape perpendicular at y=0, x=0" -- same
- "escape corner (0,0)" -- (0,0) is center, not corner; distance (1,1)->(0,0) = 2
- "escape corner (11,11)" -- invalid position
- "escape corner (0,11)" -- invalid position
- "escape corner (11,0)" -- partially converted, still wrong topology
- "towards at corner" -- (1,1) to (0,0) is not adjacent in hex

Note: "escape corner (0,11)" at line 263-275 in wall-boundary.test.ts uses `{q:0, r:11}` which is INVALID (max(0,11,11)=11 > 5). The position `{q:0, r:10}` is also invalid. These need complete redesign with valid hex vertex/edge positions.

**Escape-routes:** 6 tests

- All 6 failing tests have wrong escape route counts or wrong expected destinations due to hex topology differences

**Movement-groups-stress:** 1 test

- "8-way collision" -- hex only has 6 directions, and assertion uses `position.x/y`

## Key Design Decisions for Rewrites

### Wall-Boundary Tests -> Hex Boundary Tests

The concept of "wall" (x=0, x=11, y=0, y=11) maps to the hexagonal boundary where `max(|q|, |r|, |q+r|) = 5`. Test scenarios should use:

- **Vertex positions** (3 neighbors): `(5,0)`, `(-5,0)`, `(0,5)`, `(0,-5)`, `(5,-5)`, `(-5,5)`
- **Edge positions** (4 neighbors): e.g. `(3,2)`, `(4,1)`, `(5,-3)`
- **Interior positions** (6 neighbors): any position with `max(...) < 5`

### Escape Route Counts

- Vertex: 3 unblocked routes (was 3 for corners -- similar!)
- Edge: 4 unblocked routes (was 5 for edges -- different!)
- Interior: 6 unblocked routes (was 8 -- different!)
- The multiplicative scoring formula `distance * escapeRoutes` still works, just with different max values

### "Corner" -> "Vertex" Mapping

- Rectangle had 4 corners (3 neighbors each)
- Hex has 6 vertices (3 neighbors each)
- Conceptually similar -- low-mobility positions to escape from

### "Perpendicular Escape" -> "Tangential Escape"

- Rectangle: flee along wall perpendicular to threat approach
- Hex: flee along boundary tangent, away from threat
- No clean 1:1 mapping; scenarios must be rethought

### Towards Mode at Boundary

- A\* pathfinding still works correctly on hex grid
- Tests just need valid hex positions as input
- Key check: adjacent means hexDistance=1, not Chebyshev distance=1
- (1,1) to (0,0) in hex = distance 2 (NOT adjacent!)

### 8-Way Collision -> 6-Way Collision

- Hex grid has 6 neighbors, so max collision is 6-way
- Assertions checking `position.x/y` must use `position.q/r`

## Effort Estimate

| Category                 | Tests | Effort                                                               |
| ------------------------ | ----- | -------------------------------------------------------------------- |
| MECHANICAL (coord swap)  | 22    | Low -- formulaic replacement                                         |
| LOGIC (topology rewrite) | 19    | Medium -- need to design new hex scenarios, compute expected results |
| Combined total           | 41\*  | ~4-6 hours                                                           |

\*Note: Current task says 47 failures but actual count from test runs is 18+14+6+3 = 41. The discrepancy of 6 may come from counting the wall-boundary files differently or including some that now pass.
