# Implementation Plan: Fix 41 Failing Hex Topology Tests

## Overview

41 tests across 4 files fail because they still use rectangular grid assumptions. The engine source code is already fully converted to hex. Only test files need updating.

**Classification:** ~20 MECHANICAL (coordinate swap) + ~21 LOGIC (topology rewrite)
**Sequence:** MECHANICAL first, then LOGIC. Group by file.
**Source code changes:** NONE. All fixes are test-only.

---

## Hex Grid Reference

```
Vertices (3 neighbors):  (5,0) (-5,0) (0,5) (0,-5) (5,-5) (-5,5)
Edges (4 neighbors):     (3,2) (4,1) (5,-3) (5,-2) (5,-1) (-3,-2) (4,-5) (-4,5) (2,3) (-2,-3) (1,4) (-1,-4)
Interior (6 neighbors):  Any hex with max(|q|,|r|,|q+r|) < 5
Validity: max(|q|, |r|, |q+r|) <= 5
Distance: max(|dq|, |dr|, |dq+dr|)
Away-mode score: distance * escapeRoutes (higher is better)
```

---

## Step 1: `src/engine/movement-groups-stress.test.ts` (3 fixes)

Simplest file -- pure coordinate replacement + 8-way to 6-way conversion.

### Test 1: "resolve independent collision groups" (MECHANICAL)

Replace all `{x,y}` with `{q,r}`. Two collision groups at separate targets:

```
Group 1: target {q:2,r:1}
  mover1A: position {q:1,r:1}, action target {q:2,r:1}
  mover1B: position {q:2,r:0}, action target {q:2,r:1}

Group 2: target {q:-2,r:-1}
  mover2A: position {q:-1,r:-1}, action target {q:-2,r:-1}
  mover2B: position {q:-2,r:0}, action target {q:-2,r:-1}
```

Assertions unchanged (1 winner per group).

### Test 2: "consume RNG once per group" (MECHANICAL)

Same position changes as Test 1. Same assertion (RNG advances twice).

### Test 3: "handle 8-way collision" -> RENAME "handle 6-way collision" (LOGIC)

Hex has 6 neighbors. Use center `{q:2,r:1}` with all 6 neighbors as movers:

```
movers (6 total, from getHexNeighbors(2,1)):
  mover0: {q:3,r:1}, slotPosition:1
  mover1: {q:1,r:1}, slotPosition:2
  mover2: {q:2,r:2}, slotPosition:3
  mover3: {q:2,r:0}, slotPosition:4
  mover4: {q:3,r:0}, slotPosition:5
  mover5: {q:1,r:2}, slotPosition:6
All target: {q:2,r:1}
```

Change assertions:

- `filter(e => e.collided === false)` -> toHaveLength(1) (unchanged)
- `filter(e => e.collided === true)` -> toHaveLength(**5**) (was 7)
- Line 209: `c.position.x === 5 && c.position.y === 5` -> `c.position.q === 2 && c.position.r === 1`

---

## Step 2: `src/engine/game-movement-wall-boundary.test.ts` (17 fixes)

### Rename: `describe` block from "wall-boundary fallback" to "hex boundary fallback"

### MECHANICAL Tests (10 tests) -- coordinate replacement only

Each test below needs `{x,y}` replaced with `{q,r}`. Comments and test names updated.

**A. Prefer interior over boundary (4 tests)**

| Old name suffix | New name suffix   | char          | enemy         | expected      | comment                                                                                                                 |
| --------------- | ----------------- | ------------- | ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| "at x=0"        | "(east boundary)" | `{q:5,r:-2}`  | `{q:0,r:0}`   | `{q:4,r:-2}`  | Interior (4,-2) score=24 (d=4,r=6) > boundary (5,-1) score=20 (d=5,r=4)                                                 |
| "at x=11"       | "(west boundary)" | `{q:-5,r:2}`  | `{q:0,r:0}`   | `{q:-4,r:2}`  | Interior (-4,2) score=24 > boundary (-5,3) score=20                                                                     |
| "at y=0"        | "(SE boundary)"   | `{q:2,r:3}`   | `{q:-2,r:-1}` | `{q:2,r:2}`   | Interior (2,2) score=42 (d=7,r=6) > boundary (3,2) score=32. Tiebreak with (1,3) score=42: (2,2) has absDq=4 > 3, wins. |
| "at y=11"       | "(NW boundary)"   | `{q:-2,r:-3}` | `{q:2,r:1}`   | `{q:-2,r:-2}` | Interior (-2,-2) score=42 > boundary (-1,-4) score=32. Tiebreak with (-1,-3) score=42: (-2,-2) has absDq=4 > 3, wins.   |

**B. Tangential escape along boundary (3 tests)**

Old "perpendicular" tests where char and enemy both use `{x,y}`.

| Old name                                | New name                                 | char          | enemy         | expected      | comment                                                                   |
| --------------------------------------- | ---------------------------------------- | ------------- | ------------- | ------------- | ------------------------------------------------------------------------- |
| "perpendicular...at x=0 (same row)"     | "tangential...east boundary (same axis)" | `{q:5,r:-2}`  | `{q:3,r:-2}`  | `{q:5,r:-1}`  | Tangential: (5,-1) and (4,-1) both score=12. (5,-1) has dist=3 > 2, wins. |
| "perpendicular...at y=0 (same column)"  | "tangential...SE boundary (same axis)"   | `{q:2,r:3}`   | `{q:2,r:1}`   | `{q:1,r:4}`   | Tangential along SE boundary. (1,4) score=12 (d=3,r=4).                   |
| "perpendicular...at y=11 (same column)" | "tangential...NW boundary (same axis)"   | `{q:-2,r:-3}` | `{q:-2,r:-1}` | `{q:-1,r:-4}` | (- 1,-4) score=12 (d=3,r=4), beats (-1,-3) on distance (3>2).             |

**C. Towards at boundary (1 test)**

| Old name                          | New name                              | char        | enemy       | expected    |
| --------------------------------- | ------------------------------------- | ----------- | ----------- | ----------- |
| "towards mode...approaching wall" | "towards mode...approaching boundary" | `{q:4,r:1}` | `{q:5,r:0}` | `{q:5,r:0}` |

A\* pathfinding: hexDistance(4,1)->(5,0) = 1, direct adjacent move.

**D. Escape adjacent at boundary (1 test)**

| Old name                    | New name                        | char         | enemy        | expected     | comment                                                                |
| --------------------------- | ------------------------------- | ------------ | ------------ | ------------ | ---------------------------------------------------------------------- |
| "escape...adjacent at wall" | "escape...adjacent at boundary" | `{q:5,r:-2}` | `{q:5,r:-1}` | `{q:4,r:-2}` | Interior (4,-2) score=12 (d=2,r=6) > boundary (5,-3) score=8 (d=2,r=4) |

**E. Interior with better escape routes / vertical fallback (1 test)**

| Old name                       | New name                               | char        | enemy       | expected    | comment                                                              |
| ------------------------------ | -------------------------------------- | ----------- | ----------- | ----------- | -------------------------------------------------------------------- |
| "interior...vertical fallback" | "interior over boundary (angled flee)" | `{q:4,r:1}` | `{q:2,r:3}` | `{q:4,r:0}` | Interior (4,0) score=18 (d=3,r=6) > boundary (5,0) score=9 (d=3,r=3) |

### LOGIC Tests (7 tests) -- scenario redesign

**F. Escape from vertex (replaces 4 "corner" tests)**

"Corner" concept maps to hex "vertex" (6 positions with 3 neighbors each).

| Old name                      | New name                             | char         | enemy        | expected     | comment                                                                                   |
| ----------------------------- | ------------------------------------ | ------------ | ------------ | ------------ | ----------------------------------------------------------------------------------------- |
| "corner (0,0) from (1,1)"     | "vertex (5,0) from adjacent threat"  | `{q:5,r:0}`  | `{q:4,r:0}`  | `{q:5,r:-1}` | Vertex has 3 nbrs: (5,-1),(4,1). Both score=3 (d=1,r=3). (5,-1) wins tiebreak: absDq 1>0. |
| "corner (11,11) from (10,10)" | "vertex (-5,0) from distant threat"  | `{q:-5,r:0}` | `{q:-3,r:0}` | `{q:-5,r:1}` | (-5,1) and (-4,-1) both score=8 (d=2,r=4). (-5,1) wins: absDq 2>1.                        |
| "corner (0,11) from (1,10)"   | "vertex (0,5) from distant threat"   | `{q:0,r:5}`  | `{q:0,r:3}`  | `{q:-1,r:5}` | (-1,5) and (1,4) both score=8 (d=2,r=4). (-1,5) wins: absDr 2>1.                          |
| "corner (11,0) from (10,1)"   | "vertex (-5,5) from adjacent threat" | `{q:-5,r:5}` | `{q:-4,r:4}` | `{q:-5,r:4}` | (-5,4) and (-4,5) both score=3 (d=1,r=3). (-5,4) wins: absDq 1>0.                         |

**G. Tangential escape at vertex (replaces 2 "perpendicular at double-boundary" tests)**

These replace "perpendicular at x=0,y=0" and "perpendicular at y=0,x=0" which tested double-constrained positions (hex vertices).

| Old name                     | New name                               | char         | enemy        | expected      | comment                                                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------- | ------------ | ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "perpendicular...at x=0 y=0" | "tangential escape from vertex (5,-5)" | `{q:5,r:-5}` | `{q:3,r:-3}` | `{q:5,r:-4}`  | Vertex has 3 nbrs. (5,-4) and (4,-5) both score=8 (d=2,r=4). (5,-4) wins: absDq 2>1. (4,-4) score=5 loses.                                                                                                                                  |
| "perpendicular...at y=0 x=0" | "tangential escape from vertex (0,-5)" | `{q:0,r:-5}` | `{q:2,r:-4}` | `{q:-1,r:-4}` | (-1,-4) score=12 (d=3,r=4) > (0,-4) score=12 but (-1,-4) has dist=3 > (0,-4) dist=2. Actually tie at 12: both have different dist. Let me recheck. (-1,-4): d=3,r=4,score=12. (0,-4): d=2,r=6,score=12. Tiebreak: (-1,-4) dist=3 > 2, wins. |

**H. Towards at vertex (replaces "towards at corner")**

| Old name              | New name                       | char        | enemy       | expected    | comment                                                            |
| --------------------- | ------------------------------ | ----------- | ----------- | ----------- | ------------------------------------------------------------------ |
| "towards...at corner" | "towards mode at interior hex" | `{q:1,r:0}` | `{q:0,r:0}` | `{q:0,r:0}` | hexDistance(1,0)->(0,0) = 1. A\* returns adjacent target directly. |

---

## Step 3: `src/engine/game-decisions-move-destination-wall-boundary.test.ts` (14 fixes)

Mirrors Step 2 exactly. Same positions and expected values. Extra boilerplate: each test wraps scenario in `createGameState()` and uses `createSkill()`.

This file has 14 failing tests (not 17) because it lacks the 4 "prefer interior over edge at x/y" tests. The 14 map to:

| Step 2 Group             | Tests in this file |
| ------------------------ | ------------------ |
| B (tangential escape)    | 3 tests            |
| C (towards at boundary)  | 1 test             |
| D (escape adjacent)      | 1 test             |
| E (interior fallback)    | 1 test             |
| F (vertex escape)        | 4 tests            |
| G (tangential at vertex) | 2 tests            |
| H (towards at vertex)    | 1 test             |
| **Total**                | **13**             |

Wait, 13 not 14. The 14th is "escape perpendicular at x=11 same row" which is in Group B. Let me recount from the test file:

1. escape perp x=0 same row -> Group B tangential (MECHANICAL: `{x,y}`)
2. escape perp x=0 y=0 -> Group G tangential at vertex (LOGIC)
3. escape perp x=11 same row -> Group B tangential (MECHANICAL: `{x,y}`)
4. escape perp y=0 same col -> Group B tangential (MECHANICAL: `{x,y}`)
5. escape perp y=0 x=0 -> Group G tangential at vertex (LOGIC)
6. escape perp y=11 same col -> Group B tangential (MECHANICAL: `{x,y}`)
7. escape corner (0,0) -> Group F vertex (LOGIC)
8. escape corner (11,11) -> Group F vertex (LOGIC)
9. escape corner (0,11) -> Group F vertex (LOGIC)
10. escape corner (11,0) -> Group F vertex (LOGIC)
11. prefer interior vertical -> Group E (MECHANICAL: `{x,y}`)
12. stay in place -> PASS (already correct)
13. towards at wall -> Group C (MECHANICAL: `{x,y}`)
14. towards at corner -> Group H (LOGIC)
15. escape adjacent at wall -> Group D (MECHANICAL: `{x,y}`)

14 failing = 15 total - 1 pass. File 2 has 4 tangential + 2 tangential-at-vertex + 4 vertex + 1 interior + 1 towards-boundary + 1 towards-vertex + 1 adjacent = 14. Correct.

For this file, add `{q,r}` to `createSkill()` wrapper AND `computeDecisions()` assertions. Extra assertion: `decisions[0]!.action.type` stays `"move"`, `decisions[0]!.action.targetCell` gets new expected.

---

## Step 4: `src/engine/game-movement-escape-routes.test.ts` (6 fixes)

All tests already use `{q,r}` coordinates. Fixes are updating expected values and/or redesigning scenarios where position descriptions are wrong.

### Test 1: "prefer interior over edge when distances are close" (L15)

**Current:** char `{q:-1,r:3}`, enemy `{q:1,r:2}`. Expects `{q:-1,r:2}`. Gets `{q:-2,r:4}`.

**Fix:** Update expected to `{q:-2,r:4}`. Both (-1,2) and (-2,4) score=18 (d=3,r=6) but (-2,4) wins tiebreak: absDq 3>2.

**Update comment:** "(-2,4) score=18 (dist=3, routes=6) beats (-1,2) score=18 on tiebreak (absDq 3>2)"

### Test 2: "avoid corner positions in favor of interior" (L33)

**Current:** char `{q:1,r:0}`, enemy `{q:3,r:2}`. Expects `{q:1,r:1}`. Gets `{q:0,r:0}`.

**Issue:** (0,0) is the grid center (6 neighbors), not a corner. (1,1) score=18 < (0,0) score=30. The test scenario doesn't demonstrate corner avoidance at all.

**Fix option A (simple):** Update expected to `{q:0,r:0}`. Rename test to "should maximize composite score when fleeing". Update comment.

**Fix option B (redesign for vertex avoidance):** Change scenario so that a vertex neighbor competes with an interior neighbor and loses. For example:

- char `{q:4,r:-4}`, enemy `{q:2,r:-2}`
- Candidates include vertex (5,-5) score=9 (d=3,r=3) and interior (3,-3) score=6 (d=1,r=6), interior (4,-3) score=12 (d=2,r=6), etc.
- Best is (4,-3) score=12 or (3,-4) score=12. Vertex (5,-5) definitely loses.

**Recommendation:** Option A. The test verifies correct scoring, which is what matters. Vertex avoidance is already tested in the wall-boundary file vertex tests (Group F). No need to duplicate.

### Test 3: "penalize positions with low escape routes" (L51)

**Current:** char `{q:0,r:0}`, enemy `{q:2,r:2}`, blockers at `{q:1,r:0}` and `{q:0,r:1}`.
Expects `{q:1,r:-1}`. Gets `{q:-1,r:0}`.

**Fix:** Update expected to `{q:-1,r:0}`. Score=30 (d=5,r=6). Old expected (1,-1) has score=20 (d=4,r=5).

**Update comment:** "(-1,0) score=30 (dist=5, routes=6) beats (1,-1) score=20 (dist=4, routes=5). Open interior position far from threat is optimal."

### Test 4: "preserve open field equal routes" (L84)

**Current:** char `{q:1,r:1}`, enemy `{q:4,r:-1}`. Expects `{q:0,r:1}`. Gets `{q:0,r:2}`.

**Fix:** Update expected to `{q:0,r:2}`. Both (0,1) and (0,2) score=24 (d=4,r=6). Tiebreak: (0,2) has absDr=|(-1)-2|=3 > (0,1) absDr=|(-1)-1|=2. (0,2) wins.

**Update comment:** "(0,2) score=24 (dist=4, routes=6) beats (0,1) score=24 on tiebreak (absDr 3>2)"

### Test 5: "prefer moving inward from edge" (L169)

**Current:** char `{q:-3,r:3}`, enemy `{q:2,r:1}`. Expects `{q:-3,r:2}`. Gets `{q:-4,r:4}`.

**Issue:** (-3,3) has max(3,3,0)=3, so it is INTERIOR (6 neighbors), not "edge". Comment says "edge" but position is interior. All candidates have 6 routes, so escape routes don't differentiate. Composite scores are just distance\*6.

**Fix -- redesign scenario with actual edge position:**

- char `{q:4,r:1}` (edge, 4 neighbors), enemy `{q:2,r:1}`
- Expected: `{q:4,r:0}` -- interior (4,0) score=12 (d=2,r=6) > vertex (5,0) score=9 (d=3,r=3)
- Update test name: "should prefer interior neighbor over vertex when fleeing from edge"
- Update comment: "Interior (4,0) score=12 (dist=2, routes=6) beats vertex (5,0) score=9 (dist=3, routes=3)"

### Test 6: "subtract obstacles at edge" (L286)

**Current:** `calculateCandidateScore({q:-3,r:3}, {q:2,r:1}, new Set(["-3,2", "-2,3"]))`. Expects escapeRoutes=2.

**Issue:** (-3,3) is interior (6 neighbors), not edge. With 2 obstacles blocked, actual = 4 (6-2=4).

**Fix -- redesign with actual edge position:**

- Position `{q:3,r:2}` (edge, 4 neighbors)
- Obstacles: `new Set(["2,3", "4,1"])`
- Expected: escapeRoutes=2 (4 neighbors - 2 blocked = 2)
- Target position parameter: `{q:0,r:0}` (any valid target, used only for distance calc)

---

## Implementation Sequence

1. **Step 1:** movement-groups-stress.test.ts (3 tests) -- 15 min
2. **Step 2:** game-movement-wall-boundary.test.ts (17 tests) -- 60 min
3. **Step 3:** game-decisions-move-destination-wall-boundary.test.ts (14 tests) -- 30 min (mirrors Step 2)
4. **Step 4:** game-movement-escape-routes.test.ts (6 tests) -- 30 min
5. **Verification:** `npm run test` full suite -- 5 min

Total estimated: ~2.5 hours

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- hex conversion feature work
- [x] Approach consistent with `.docs/architecture.md` -- engine-only tests
- [x] Patterns follow `.docs/patterns/index.md` -- no new patterns
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-003 still applies

**Note:** spec.md still references 12x12 grid and Chebyshev distance. To be updated separately in Phase 5 of the overall hex conversion project.

---

## Risk Assessment

1. **Tiebreaking precision:** All expected values computed using the actual `compareAwayMode` tiebreaking logic (composite -> distance -> absDq -> absDr -> r -> q). Risk: LOW.
2. **No cascading failures:** These 4 files are independent test suites. No other tests depend on them.
3. **No source code bugs:** The 12 passing tests across these files demonstrate the engine works correctly. All failures are test-side only.

---

## New Decision

**Decision:** "Perpendicular escape" concept replaced by "tangential escape along boundary" in test vocabulary.

**Context:** Rectangular grids have walls (x=0, x=11) where perpendicular escape is meaningful (flee along the wall). Hex grids have a hexagonal boundary where this concept doesn't cleanly map. Instead, characters at boundary positions flee tangentially (along the boundary) or inward (toward interior).

**Consequences:** Test names and comments updated. No source code impact. Recommend adding note to `.docs/decisions/index.md` when hex ADR is created.
