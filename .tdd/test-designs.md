## TEST DESIGN REVIEW SUMMARY

**Reviewer**: Architect (TEST_DESIGN_REVIEW phase)
**Date**: 2026-02-04
**Verdict**: APPROVED FOR IMPLEMENTATION

### Completeness Check

- [x] 41 tests accounted for: 3 (movement-groups-stress) + 18 (wall-boundary) + 14 (decisions-wall-boundary) + 6 (escape-routes) = 41
- [x] All 4 test files covered
- [x] Passing tests ("stay in place", "process groups deterministic order") correctly excluded

### Hex Topology Correctness (Verified)

- [x] All 6 vertices confirmed: (5,0), (-5,0), (0,5), (0,-5), (5,-5), (-5,5) -- each has exactly 3 valid neighbors
- [x] All edge positions used satisfy max(|q|,|r|,|q+r|) = 5 and are NOT vertices -- each has exactly 4 neighbors
- [x] All interior positions satisfy max(|q|,|r|,|q+r|) < 5 -- each has exactly 6 neighbors
- [x] No invalid positions (all satisfy max(|q|,|r|,|q+r|) <= 5)

**Positions verified by hand-computation:**

- Vertex (5,-5): neighbors (4,-5),(5,-4),(4,-4) -- 3 neighbors confirmed
- Vertex (5,0): neighbors (4,0),(5,-1),(4,1) -- 3 neighbors confirmed
- Vertex (0,5): neighbors (-1,5),(0,4),(1,4) -- 3 neighbors confirmed
- Vertex (0,-5): neighbors (1,-5),(0,-4),(-1,-4) -- 3 neighbors confirmed
- Vertex (-5,0): neighbors (-4,0),(-5,1),(-4,-1) -- 3 neighbors confirmed
- Vertex (-5,5): neighbors (-4,5),(-5,4),(-4,4) -- 3 neighbors confirmed
- Edge (5,-2): neighbors (4,-2),(5,-1),(5,-3),(4,-1) -- 4 neighbors confirmed
- Edge (-5,2): neighbors (-4,2),(-5,3),(-5,1),(-4,1) -- 4 neighbors confirmed
- Edge (2,3): neighbors (1,3),(2,2),(3,2),(1,4) -- 4 neighbors confirmed
- Edge (-2,-3): neighbors (-1,-3),(-2,-2),(-3,-2),(-1,-4) -- 4 neighbors confirmed
- Edge (4,1): neighbors (3,1),(4,0),(5,0),(3,2) -- 4 neighbors confirmed
- Edge (3,2): neighbors (2,2),(3,1),(4,1),(2,3) -- 4 neighbors confirmed

### Expected Value Correctness (Verified)

All tiebreaking chains verified against `compareAwayMode` source code in `/home/bob/Projects/auto-battler/src/engine/game-movement.ts` (lines 220-275):

1. Maximize composite (distance \* escapeRoutes)
2. Maximize distance
3. Maximize absDq (|target.q - candidate.q|)
4. Maximize absDr (|target.r - candidate.r|)
5. Minimize r
6. Minimize q

**Tests verified by full manual computation (all candidates scored, tiebreakers traced):**

| Test | Expected | Composite | Tiebreaker Used           | Verified |
| ---- | -------- | --------- | ------------------------- | -------- |
| 2.1  | (4,-2)   | 24        | absDr 2>1 over (4,-1)     | YES      |
| 2.5  | (5,-1)   | 12        | dist 3>2 over (4,-1)      | YES      |
| 2.6  | (5,-4)   | 8         | absDq 2>1 over (4,-5)     | YES      |
| 2.8  | (1,4)    | 12        | dist 3>2 over (1,3)       | YES      |
| 2.9  | (-1,-4)  | 12        | dist 3>2 over (0,-4)      | YES      |
| 2.11 | (5,-1)   | 3         | absDq 1>0 over (4,1)      | YES      |
| 2.13 | (-1,5)   | 8         | absDr 2>1 over (1,4)      | YES      |
| 2.14 | (-5,4)   | 3         | absDq 1>0 over (-4,5)     | YES      |
| 2.15 | (4,0)    | 18        | wins outright (composite) | YES      |
| 4.1  | (-2,4)   | 18        | absDr 2>1 over (-2,3)     | YES      |
| 4.2  | (0,0)    | 30        | absDq 3>2 over (1,-1)     | YES      |
| 4.3  | (-1,0)   | 30        | absDq 3>2 over (0,-1)     | YES      |
| 4.4  | (0,2)    | 24        | absDr 3>2 over (0,1)      | YES      |
| 4.5  | (4,0)    | 12        | wins outright (composite) | YES      |
| 4.6  | er=2     | N/A       | 4 neighbors - 2 blocked   | YES      |

**Escape route counts verified with obstacle awareness:**

- Tests correctly account for enemy position in obstacle set (enemy is NOT excluded from obstacles, only mover is)
- Tests correctly handle boundary reducing neighbor count AND obstacles blocking remaining neighbors
- Test 4.6 correctly redesigned: edge (3,2) has 4 neighbors, 2 blocked = 2 escape routes

### Distance Calculations (Verified)

All distances computed using hexDistance formula: (|dq| + |dr| + |dq+dr|) / 2, which equals max(|dq|, |dr|, |dq+dr|).

- [x] No impossible adjacency claims (all "adjacent" positions have hexDistance=1)
- [x] Test 2.17 correctly fixed: original (1,1)->(0,0) had hexDist=2 (NOT adjacent in hex), replaced with (1,0)->(0,0) hexDist=1
- [x] All movement-groups-stress movers are hexDist=1 from their targets

### Test Logic Soundness (Verified)

- [x] MECHANICAL tests (coord swap only) correctly preserve test behavior intent
- [x] LOGIC tests correctly map rectangular concepts to hex equivalents:
  - "Wall boundary" -> "hex boundary" (max(|q|,|r|,|q+r|) = 5)
  - "Corner" -> "vertex" (3 neighbors)
  - "Perpendicular escape" -> "tangential escape"
  - "8-way collision" -> "6-way collision"
- [x] Tests 4.5 and 4.6 correctly redesigned with actual edge positions (original used interior position (-3,3) mislabeled as "edge")
- [x] Test 4.2 correctly renamed and expected value updated (original assumed (0,0) was a corner; in hex it is grid center with 6 neighbors)

### Minor Issues Found (Non-blocking)

1. **Cosmetic typo in Test 2.2 justification**: Says "absDr (4,-2)=2" but should say "absDr (-4,2)=2". The coordinates in the justification text reference the wrong signs. The actual expected value and assertion {q:-4, r:2} are correct.

2. **Step 3 mapping table**: The table correctly maps all 14 Step 3 tests to their Step 2 counterparts. However, Step 3 tests 3.12 and 3.13 need the skill mode explicitly set to "towards" (not "away"). Test 3.1 mentions the skill setup but does not state this is "away" mode; for the tangential/vertex escape tests, mode="away" is implicit from the skill trigger. The document should ensure the coder uses the correct mode for each test. The existing test 2.16/3.12 and 2.17/3.13 notes do mention "towards" mode, so this is covered.

### Approval

All 41 test specifications are **APPROVED FOR IMPLEMENTATION**. The expected values are mathematically verified against the hex engine's tiebreaking algorithm. All positions are valid on the hex grid. The test logic correctly translates rectangular grid concepts to hexagonal equivalents.

No revisions required. Proceed to WRITE_TESTS phase.

---

# Test Designs: Fix 41 Failing Hex Topology Tests

All 41 tests are test-only changes. No engine source code modifications required.

**Tiebreaking Hierarchy (away mode) -- from `compareAwayMode` in game-movement.ts:**

1. Maximize composite score (distance \* escapeRoutes)
2. Maximize distance
3. Maximize absDq (|target.q - candidate.q|)
4. Maximize absDr (|target.r - candidate.r|)
5. Minimize r
6. Minimize q

**Hex neighbor counts:**

- Vertex (max(|q|,|r|,|q+r|) = 5, on a vertex of the hexagonal boundary): 3 neighbors
- Edge (max(|q|,|r|,|q+r|) = 5, NOT on a vertex): 4 neighbors
- Interior (max(|q|,|r|,|q+r|) < 5): 6 neighbors

**6 vertices**: (5,0), (-5,0), (0,5), (0,-5), (5,-5), (-5,5)

---

## Step 1: `src/engine/movement-groups-stress.test.ts` (3 tests)

### Test 1.1: resolve-independent-collision-groups

- **File**: `/home/bob/Projects/auto-battler/src/engine/movement-groups-stress.test.ts`
- **Type**: unit
- **Verifies**: Two separate collision groups each produce exactly one winner
- **Current Implementation**: All positions use `{x,y}`. At runtime q=undefined, r=undefined. `positionsEqual` returns true (undefined===undefined), so movers are filtered as hold actions and no collision events fire.
- **Updated Implementation**: Replace all `{x,y}` with `{q,r}`. No structural changes.
- **Setup**: Two collision groups, each with 2 movers targeting the same cell.
- **Input Positions**:
  ```
  Group 1 target: {q:2, r:1}
    mover1A: position {q:1, r:1}, slotPosition:1, action target {q:2, r:1}
    mover1B: position {q:2, r:0}, slotPosition:2, action target {q:2, r:1}
  Group 2 target: {q:-2, r:-1}
    mover2A: position {q:-1, r:-1}, slotPosition:3, action target {q:-2, r:-1}
    mover2B: position {q:-2, r:0}, slotPosition:4, action target {q:-2, r:-1}
  ```
- **Assertions**:
  1. group1Events with collided===false has length 1
  2. group2Events with collided===false has length 1
- **Justification**: All positions valid (max coord <= 5). All movers are hex-distance 1 from target (adjacent). Validates collision resolution handles independent groups.

---

### Test 1.2: consume-rng-once-per-group

- **File**: `/home/bob/Projects/auto-battler/src/engine/movement-groups-stress.test.ts`
- **Type**: unit
- **Verifies**: RNG state advances exactly twice for two collision groups
- **Current Implementation**: Same {x,y} coordinates cause same failure as Test 1.1.
- **Updated Implementation**: Identical position changes to Test 1.1.
- **Input Positions**: Same as Test 1.1.
- **Assertions**:
  1. `result.rngState === afterTwo.nextState`
- **Justification**: Ensures deterministic RNG consumption for replay fidelity.

---

### Test 1.3: handle-6-way-collision (RENAME from "handle 8-way collision")

- **File**: `/home/bob/Projects/auto-battler/src/engine/movement-groups-stress.test.ts`
- **Type**: unit
- **Verifies**: Maximum hex collision (6 neighbors at one cell) produces 1 winner, 5 losers
- **Current Implementation**: 8 movers with {x,y} positions surrounding (5,5). Asserts 1 winner / 7 losers. Checks `c.position.x === 5 && c.position.y === 5`.
- **Updated Implementation**: Complete rewrite. 6 movers (not 8). New test name. New assertions (5 losers not 7). Position check uses q/r.
- **Hex Topology Concept**: Square grids have 8 neighbors (4 cardinal + 4 diagonal). Hex grids have exactly 6 neighbors. Max collision size is 6.
- **Input Positions**:
  ```
  Target: {q:2, r:1}
  mover0: {q:3, r:1}, slotPosition:1   (East neighbor)
  mover1: {q:1, r:1}, slotPosition:2   (West neighbor)
  mover2: {q:2, r:2}, slotPosition:3   (SE neighbor)
  mover3: {q:2, r:0}, slotPosition:4   (NW neighbor)
  mover4: {q:3, r:0}, slotPosition:5   (NE neighbor)
  mover5: {q:1, r:2}, slotPosition:6   (SW neighbor)
  All actions: createMoveAction({q:2, r:1}, 1)
  ```
- **Assertions**:
  1. `events.filter(e => e.collided === false)` has length 1
  2. `events.filter(e => e.collided === true)` has length **5**
  3. `updatedCharacters.filter(c => c.position.q === 2 && c.position.r === 1)` has length 1
- **Justification**: Validates max collision group for hex. Prevents regression from square-grid assumption (8 -> 6 neighbors).

---

## Step 2: `src/engine/game-movement-wall-boundary.test.ts` (18 tests)

**Rename describe block**: "computeMoveDestination - wall-boundary fallback" -> "computeMoveDestination - hex boundary fallback"

### Test 2.1: prefer-interior-east-boundary

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at east boundary prefers interior neighbor over staying on boundary when fleeing
- **Current Implementation**: char `{x:0, y:5}`, enemy `{q:3, r:2}`, expected `{x:1, y:4}`. Mixed coords cause q=undefined.
- **Updated Implementation**: All `{q,r}`. Rename "at x=0" to "(east boundary)".
- **Input Positions**:
  - character: `{q:5, r:-2}` (boundary: max(5,2,3)=5, 4 neighbors)
  - enemy: `{q:0, r:0}`
- **Expected Output**: `{q:4, r:-2}`
- **Assertions**:
  1. `targetCell` equals `{q:4, r:-2}`
- **Justification**: Interior (4,-2) composite=24 (d=4,er=6) > boundary candidates (5,-1),(5,-3) composite=20 (d=5,er=4). Also beats (4,-1) composite=24 on tiebreak: same dist=4, absDq=4 (tie), absDr: (4,-2) has 2 vs (4,-1) has 1. (4,-2) wins.
- **Comment**: `"Interior (4,-2) score=24 (dist=4, routes=6) > boundary (5,-1) score=20 (dist=5, routes=4)"`

---

### Test 2.2: prefer-interior-west-boundary

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at west boundary prefers interior neighbor when fleeing
- **Current Implementation**: char `{x:11, y:5}`, expected `{x:10, y:4}`.
- **Updated Implementation**: All `{q,r}`. Rename "at x=11" to "(west boundary)".
- **Input Positions**:
  - character: `{q:-5, r:2}` (boundary: max(5,2,3)=5, 4 neighbors)
  - enemy: `{q:0, r:0}`
- **Expected Output**: `{q:-4, r:2}`
- **Assertions**:
  1. `targetCell` equals `{q:-4, r:2}`
- **Justification**: Interior (-4,2) composite=24 (d=4,er=6) > boundary (-5,3),(-5,1) composite=20 (d=5,er=4). Tiebreak over (-4,1): absDr (4,-2)=2 > (-4,1)=1.
- **Comment**: `"Interior (-4,2) score=24 (dist=4, routes=6) > boundary (-5,3) score=20 (dist=5, routes=4)"`

---

### Test 2.3: prefer-interior-se-boundary

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at SE boundary prefers interior neighbor when fleeing
- **Current Implementation**: char `{x:5, y:0}`, expected `{x:4, y:1}`.
- **Updated Implementation**: All `{q,r}`. Rename "at y=0" to "(SE boundary)".
- **Input Positions**:
  - character: `{q:2, r:3}` (boundary: max(2,3,5)=5, 4 neighbors)
  - enemy: `{q:-2, r:-1}`
- **Expected Output**: `{q:2, r:2}`
- **Assertions**:
  1. `targetCell` equals `{q:2, r:2}`
- **Justification**: (2,2) and (1,3) both composite=42 (d=7,er=6). Tiebreak: dist=7 (tie). absDq: (2,2) has |(-2)-2|=4, (1,3) has |(-2)-1|=3. (2,2) wins absDq 4>3.
- **Comment**: `"Interior (2,2) score=42 (dist=7, routes=6), tiebreak absDq 4>3 over (1,3)"`

---

### Test 2.4: prefer-interior-nw-boundary

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at NW boundary prefers interior neighbor when fleeing
- **Current Implementation**: char `{x:5, y:11}`, expected `{x:4, y:10}`.
- **Updated Implementation**: All `{q,r}`. Rename "at y=11" to "(NW boundary)".
- **Input Positions**:
  - character: `{q:-2, r:-3}` (boundary: max(2,3,5)=5, 4 neighbors)
  - enemy: `{q:2, r:1}`
- **Expected Output**: `{q:-2, r:-2}`
- **Assertions**:
  1. `targetCell` equals `{q:-2, r:-2}`
- **Justification**: (-2,-2) and (-1,-3) both composite=42 (d=7,er=6). absDq: (-2,-2) has |2-(-2)|=4, (-1,-3) has |2-(-1)|=3. (-2,-2) wins absDq 4>3.
- **Comment**: `"Interior (-2,-2) score=42 (dist=7, routes=6), tiebreak absDq 4>3 over (-1,-3)"`

---

### Test 2.5: tangential-escape-east-boundary (RENAME from "perpendicular...x=0 same row")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at east boundary escapes tangentially when threat approaches along same axis
- **Current Implementation**: char `{x:0, y:5}`, enemy `{x:2, y:5}`, expected `{x:0, y:4}`.
- **Updated Implementation**: All `{q,r}`. Rename to "tangential escape along east boundary (same axis)".
- **Hex Topology Concept**: "Perpendicular escape along wall" does not exist in hex. Instead, characters at boundary positions flee tangentially (along the boundary perimeter) when the interior is towards the threat. The tangential move maintains greater distance at the cost of fewer escape routes.
- **Input Positions**:
  - character: `{q:5, r:-2}` (east boundary, 4 neighbors)
  - enemy: `{q:3, r:-2}` (2 hexes away on same axis)
- **Expected Output**: `{q:5, r:-1}`
- **Assertions**:
  1. `targetCell` equals `{q:5, r:-1}`
- **Justification**: (5,-1) and (4,-1) both composite=12. (5,-1) dist=3 > (4,-1) dist=2. (5,-1) wins distance tiebreak.
- **Comment**: `"Tangential (5,-1) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (4,-1)"`

---

### Test 2.6: tangential-escape-vertex-5neg5 (RENAME+REWRITE from "perpendicular...x=0 y=0")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at vertex escapes tangentially when doubly constrained
- **Current Implementation**: char `{q:0, r:0}`, enemy `{q:2, r:0}`, expected `{q:0, r:1}`. Position (0,0) is grid CENTER with 6 neighbors, not a corner.
- **Updated Implementation**: Complete scenario rewrite. Use actual hex vertex position.
- **Hex Topology Concept**: "Double-boundary" (corner in rectangle = both x and y at wall) maps to hex "vertex" (3 neighbors only). The vertex is maximally constrained with only 3 escape options.
- **Input Positions**:
  - character: `{q:5, r:-5}` (vertex, 3 neighbors: (4,-5),(5,-4),(4,-4))
  - enemy: `{q:3, r:-3}` (2 hexes away)
- **Expected Output**: `{q:5, r:-4}`
- **Assertions**:
  1. `targetCell` equals `{q:5, r:-4}`
- **Justification**: (5,-4) and (4,-5) both composite=8 (d=2,er=4). Tiebreak: dist=2 (tie). absDq: (5,-4) has |3-5|=2, (4,-5) has |3-4|=1. (5,-4) wins absDq 2>1. (4,-4) composite=5 (d=1,er=5) loses.
- **Comment**: `"Tangential (5,-4) score=8 (dist=2, routes=4), tiebreak absDq 2>1 over (4,-5)"`

---

### Test 2.7: tangential-escape-west-boundary (RENAME from "perpendicular...x=11 same row")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at west boundary escapes tangentially
- **Current Implementation**: char `{x:11, y:5}`, enemy `{x:9, y:5}`, expected `{x:11, y:4}`.
- **Updated Implementation**: All `{q,r}`. Rename to "tangential escape along west boundary (same axis)".
- **Input Positions**:
  - character: `{q:-5, r:2}` (west boundary, 4 neighbors)
  - enemy: `{q:-3, r:2}` (2 hexes away on same axis)
- **Expected Output**: `{q:-5, r:1}`
- **Assertions**:
  1. `targetCell` equals `{q:-5, r:1}`
- **Justification**: (-5,1) and (-4,1) both composite=12. (-5,1) dist=3 > (-4,1) dist=2. (-5,1) wins distance tiebreak.
- **Comment**: `"Tangential (-5,1) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (-4,1)"`

---

### Test 2.8: tangential-escape-se-boundary (RENAME from "perpendicular...y=0 same col")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at SE boundary escapes tangentially
- **Current Implementation**: char `{x:5, y:0}`, enemy `{x:5, y:2}`, expected `{x:4, y:0}`.
- **Updated Implementation**: All `{q,r}`. Rename to "tangential escape along SE boundary (same axis)".
- **Input Positions**:
  - character: `{q:2, r:3}` (SE boundary)
  - enemy: `{q:2, r:1}` (2 hexes away on same q axis)
- **Expected Output**: `{q:1, r:4}`
- **Assertions**:
  1. `targetCell` equals `{q:1, r:4}`
- **Justification**: (1,3) composite=12 (d=2,er=6) and (1,4) composite=12 (d=3,er=4). Tiebreak: (1,4) dist=3 > (1,3) dist=2. (1,4) wins.
- **Comment**: `"Tangential (1,4) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (1,3)"`

---

### Test 2.9: tangential-escape-vertex-0neg5 (RENAME+REWRITE from "perpendicular...y=0 x=0")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at vertex (0,-5) escapes tangentially from approaching threat
- **Current Implementation**: enemy `{x:0, y:2}`, char `{q:0, r:0}`, expected `{q:1, r:0}`. (0,0) is center, not a corner.
- **Updated Implementation**: Complete scenario rewrite with actual vertex.
- **Hex Topology Concept**: Vertex (0,-5) has 3 neighbors: (1,-5), (0,-4), (-1,-4). Same "double-boundary" concept as Test 2.6.
- **Input Positions**:
  - character: `{q:0, r:-5}` (vertex, 3 neighbors)
  - enemy: `{q:2, r:-4}` (2 hexes away)
- **Expected Output**: `{q:-1, r:-4}`
- **Assertions**:
  1. `targetCell` equals `{q:-1, r:-4}`
- **Justification**: (-1,-4) composite=12 (d=3,er=4) and (0,-4) composite=12 (d=2,er=6). Tiebreak: (-1,-4) dist=3 > (0,-4) dist=2. (-1,-4) wins. (1,-5) composite=8 (d=2,er=4) loses.
- **Comment**: `"(-1,-4) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (0,-4)"`

---

### Test 2.10: tangential-escape-nw-boundary (RENAME from "perpendicular...y=11 same col")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at NW boundary escapes tangentially
- **Current Implementation**: char `{x:5, y:11}`, enemy `{x:5, y:9}`, expected `{x:4, y:11}`.
- **Updated Implementation**: All `{q,r}`. Rename to "tangential escape along NW boundary (same axis)".
- **Input Positions**:
  - character: `{q:-2, r:-3}` (NW boundary)
  - enemy: `{q:-2, r:-1}` (2 hexes away)
- **Expected Output**: `{q:-1, r:-4}`
- **Assertions**:
  1. `targetCell` equals `{q:-1, r:-4}`
- **Justification**: (-1,-3) composite=12 (d=2,er=6) and (-1,-4) composite=12 (d=3,er=4). (-1,-4) dist=3 > (-1,-3) dist=2. (-1,-4) wins.
- **Comment**: `"Tangential (-1,-4) score=12 (dist=3, routes=4), tiebreak dist 3>2 over (-1,-3)"`

---

### Test 2.11: vertex-escape-5_0 (RENAME+REWRITE from "corner (0,0)")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at vertex (5,0) flees from adjacent threat to best escape position
- **Current Implementation**: char `{q:0, r:0}`, enemy `{q:1, r:1}`, expected `{q:0, r:1}`. (0,0) is center with 6 neighbors, not a corner. hex dist(1,1 -> 0,0)=2, not adjacent.
- **Updated Implementation**: Complete scenario rewrite with actual vertex.
- **Hex Topology Concept**: Rectangle "corner" (3 neighbors) maps to hex "vertex" (3 neighbors). The 6 hex vertices are the most constrained positions on the grid.
- **Input Positions**:
  - character: `{q:5, r:0}` (vertex, 3 neighbors: (5,-1), (4,1), (4,0))
  - enemy: `{q:4, r:0}` (adjacent, dist=1)
- **Expected Output**: `{q:5, r:-1}`
- **Assertions**:
  1. `targetCell` equals `{q:5, r:-1}`
- **Justification**: (5,-1) and (4,1) both composite=3 (d=1,er=3). Tiebreak: dist=1 (tie). absDq: (5,-1) has |4-5|=1, (4,1) has |4-4|=0. (5,-1) wins absDq 1>0. Stay at (5,0) composite=2.
- **Comment**: `"Vertex (5,-1) score=3 (dist=1, routes=3), tiebreak absDq 1>0 over (4,1)"`

---

### Test 2.12: vertex-escape-neg5_0 (RENAME+REWRITE from "corner (11,11)")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at vertex (-5,0) flees from distant threat
- **Current Implementation**: char `{q:5, r:0}`, enemy `{q:5, r:-40}`. Enemy position INVALID (max(5,40,35)=40 > 5). Expected uses `{x:11, y:10}`.
- **Updated Implementation**: Complete rewrite with valid positions.
- **Input Positions**:
  - character: `{q:-5, r:0}` (vertex, 3 neighbors: (-5,1), (-4,0), (-4,-1))
  - enemy: `{q:-3, r:0}` (2 hexes away)
- **Expected Output**: `{q:-5, r:1}`
- **Assertions**:
  1. `targetCell` equals `{q:-5, r:1}`
- **Justification**: (-5,1) and (-4,-1) both composite=8 (d=2,er=4). Tiebreak: dist=2 (tie). absDq: (-5,1) has |(-3)-(-5)|=2, (-4,-1) has |(-3)-(-4)|=1. (-5,1) wins absDq 2>1. (-4,0) composite=5 loses.
- **Comment**: `"(-5,1) score=8 (dist=2, routes=4), tiebreak absDq 2>1 over (-4,-1)"`

---

### Test 2.13: vertex-escape-0_5 (RENAME+REWRITE from "corner (0,11)")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at vertex (0,5) flees from distant threat
- **Current Implementation**: char `{q:0, r:11}`, enemy `{q:1, r:10}`. Both INVALID (r=11 > 5, r=10 > 5). Expected `{q:0, r:10}`.
- **Updated Implementation**: Complete rewrite with valid positions.
- **Input Positions**:
  - character: `{q:0, r:5}` (vertex, 3 neighbors: (-1,5), (0,4), (1,4))
  - enemy: `{q:0, r:3}` (2 hexes away)
- **Expected Output**: `{q:-1, r:5}`
- **Assertions**:
  1. `targetCell` equals `{q:-1, r:5}`
- **Justification**: (-1,5) and (1,4) both composite=8 (d=2,er=4). Tiebreak: dist=2 (tie). absDq: (-1,5) has |0-(-1)|=1, (1,4) has |0-1|=1 (tie). absDr: (-1,5) has |3-5|=2, (1,4) has |3-4|=1. (-1,5) wins absDr 2>1.
- **Comment**: `"(-1,5) score=8 (dist=2, routes=4), tiebreak absDr 2>1 over (1,4)"`

---

### Test 2.14: vertex-escape-neg5_5 (RENAME+REWRITE from "corner (11,0)")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character at vertex (-5,5) flees from adjacent threat
- **Current Implementation**: char `{q:5, r:-5}`, enemy `{q:5, r:-4}`. Expected `{x:11, y:1}` (stale {x,y}).
- **Updated Implementation**: Complete rewrite.
- **Input Positions**:
  - character: `{q:-5, r:5}` (vertex, 3 neighbors: (-5,4), (-4,5), (-4,4))
  - enemy: `{q:-4, r:4}` (adjacent, dist=1)
- **Expected Output**: `{q:-5, r:4}`
- **Assertions**:
  1. `targetCell` equals `{q:-5, r:4}`
- **Justification**: (-5,4) and (-4,5) both composite=3 (d=1,er=3). Tiebreak: dist=1 (tie). absDq: (-5,4) has |(-4)-(-5)|=1, (-4,5) has |(-4)-(-4)|=0. (-5,4) wins absDq 1>0.
- **Comment**: `"(-5,4) score=3 (dist=1, routes=3), tiebreak absDq 1>0 over (-4,5)"`

---

### Test 2.15: interior-over-boundary-angled-flee (RENAME from "vertical fallback")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Interior position with more escape routes beats boundary position at same distance
- **Current Implementation**: char `{x:0, y:3}`, enemy `{x:2, y:5}`, expected `{x:1, y:2}`.
- **Updated Implementation**: All `{q,r}`. Rename to "interior over boundary (angled flee)".
- **Input Positions**:
  - character: `{q:4, r:1}` (boundary: max(4,1,5)=5, 4 neighbors)
  - enemy: `{q:2, r:3}`
- **Expected Output**: `{q:4, r:0}`
- **Assertions**:
  1. `targetCell` equals `{q:4, r:0}`
- **Justification**: Interior (4,0) composite=18 (d=3,er=6) > vertex (5,0) composite=9 (d=3,er=3). (3,1) composite=12 loses. (3,2) composite=3 loses.
- **Comment**: `"Interior (4,0) score=18 (dist=3, routes=6) > vertex (5,0) score=9 (dist=3, routes=3)"`

---

### Test 2.16: towards-mode-approaching-boundary (RENAME from "approaching wall")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Towards mode correctly moves to boundary target (A\* pathfinding works at boundary)
- **Current Implementation**: char `{x:1, y:5}`, enemy `{x:0, y:5}`, expected `{x:0, y:5}`.
- **Updated Implementation**: All `{q,r}`. Rename to "towards mode approaching boundary".
- **Input Positions**:
  - character: `{q:4, r:1}` (boundary, 4 neighbors)
  - enemy: `{q:5, r:0}` (vertex, adjacent to character at dist=1)
- **Expected Output**: `{q:5, r:0}`
- **Assertions**:
  1. `targetCell` equals `{q:5, r:0}`
- **Justification**: A\* pathfinding: hexDistance(4,1 -> 5,0) = 1 (adjacent). Path returns [start, target]. First step is target directly.
- **Comment**: `"A* returns adjacent target directly (hexDist=1)"`

---

### Test 2.17: towards-mode-at-interior (RENAME+REWRITE from "towards at corner")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Towards mode navigates to adjacent target from interior position
- **Current Implementation**: char `{q:1, r:1}`, enemy `{q:0, r:0}`, expected `{q:0, r:0}`. BUT hexDist(1,1 -> 0,0) = 2 (NOT adjacent). A\* first step would be (0,1) or (1,0), not (0,0).
- **Updated Implementation**: Change character position so target IS adjacent.
- **Hex Topology Concept**: In hex, (1,1) is distance 2 from (0,0), unlike square grid where it is distance 1. The original test assumed square-grid adjacency.
- **Input Positions**:
  - character: `{q:1, r:0}` (interior, 6 neighbors)
  - enemy: `{q:0, r:0}` (adjacent at dist=1)
- **Expected Output**: `{q:0, r:0}`
- **Assertions**:
  1. `targetCell` equals `{q:0, r:0}`
- **Justification**: hexDistance(1,0 -> 0,0) = 1. A\* returns [start, target]. First step is target.
- **Comment**: `"A* returns adjacent target directly (hexDist=1)"`

---

### Test 2.18: escape-adjacent-at-boundary (RENAME from "escape adjacent at wall")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: Character adjacent to enemy at boundary escapes to interior position with more routes
- **Current Implementation**: char `{x:0, y:5}`, enemy `{x:1, y:5}`, expected `{x:1, y:4}`.
- **Updated Implementation**: All `{q,r}`. Rename to "escape from adjacent threat at boundary".
- **Input Positions**:
  - character: `{q:5, r:-2}` (east boundary, 4 neighbors)
  - enemy: `{q:5, r:-1}` (adjacent at dist=1, also boundary)
- **Expected Output**: `{q:4, r:-2}`
- **Assertions**:
  1. `targetCell` equals `{q:4, r:-2}`
- **Justification**: Interior (4,-2) composite=12 (d=2,er=6) > boundary (5,-3) composite=8 (d=2,er=4). (4,-1) composite=5 (d=1,er=5) loses.
- **Comment**: `"Interior (4,-2) score=12 (dist=2, routes=6) > boundary (5,-3) score=8 (dist=2, routes=4)"`

---

## Step 3: `src/engine/game-decisions-move-destination-wall-boundary.test.ts` (14 tests)

This file mirrors Step 2 exactly, but wraps each scenario in `createGameState()` and `computeDecisions()`. Each test also adds a skill with `createSkill()` and asserts `decisions[0]!.action.type === "move"` plus `decisions[0]!.action.targetCell`.

**Rename describe block**: "computeDecisions - move destination - wall-boundary fallback" -> "computeDecisions - move destination - hex boundary fallback"

The 14 failing tests map directly to Step 2 tests. The "prefer interior over edge" tests (2.1-2.4) do not exist in this file, and "stay in place" already passes, leaving 14 failing tests:

| Step 2 Test                  | This File Test | Same Positions | Same Expected  |
| ---------------------------- | -------------- | -------------- | -------------- |
| 2.5 (tangential east)        | 3.1            | Yes            | `{q:5, r:-1}`  |
| 2.6 (tangential vertex 5,-5) | 3.2            | Yes            | `{q:5, r:-4}`  |
| 2.7 (tangential west)        | 3.3            | Yes            | `{q:-5, r:1}`  |
| 2.8 (tangential SE)          | 3.4            | Yes            | `{q:1, r:4}`   |
| 2.9 (tangential vertex 0,-5) | 3.5            | Yes            | `{q:-1, r:-4}` |
| 2.10 (tangential NW)         | 3.6            | Yes            | `{q:-1, r:-4}` |
| 2.11 (vertex 5,0)            | 3.7            | Yes            | `{q:5, r:-1}`  |
| 2.12 (vertex -5,0)           | 3.8            | Yes            | `{q:-5, r:1}`  |
| 2.13 (vertex 0,5)            | 3.9            | Yes            | `{q:-1, r:5}`  |
| 2.14 (vertex -5,5)           | 3.10           | Yes            | `{q:-5, r:4}`  |
| 2.15 (interior angled)       | 3.11           | Yes            | `{q:4, r:0}`   |
| 2.16 (towards boundary)      | 3.12           | Yes            | `{q:5, r:0}`   |
| 2.17 (towards interior)      | 3.13           | Yes            | `{q:0, r:0}`   |
| 2.18 (escape adjacent)       | 3.14           | Yes            | `{q:4, r:-2}`  |

Each test below follows the same pattern. Only the boilerplate differs.

---

### Test 3.1: tangential-escape-east-boundary (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns tangential escape along east boundary
- **Current Implementation**: char `{x:0, y:5}`, enemy `{x:2, y:5}`, expected `{x:0, y:4}`. Named "perpendicular...x=0 same row".
- **Updated Implementation**: Same as Test 2.5. Add `skills: [createSkill({id:"skill1", mode:"away", triggers:[{type:"always"}]})]` to character.
- **Input Positions**:
  - character: `{q:5, r:-2}`, enemy: `{q:3, r:-2}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:5, r:-1}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:5, r:-1}`
- **Justification**: Same as Test 2.5.

---

### Test 3.2: tangential-escape-vertex-5neg5 (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns tangential escape from vertex (5,-5)
- **Current Implementation**: char `{q:0, r:0}`, enemy `{q:2, r:0}`, expected `{q:0, r:1}`. Named "perpendicular...x=0 y=0".
- **Updated Implementation**: Same as Test 2.6.
- **Input Positions**:
  - character: `{q:5, r:-5}`, enemy: `{q:3, r:-3}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:5, r:-4}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:5, r:-4}`
- **Justification**: Same as Test 2.6.

---

### Test 3.3: tangential-escape-west-boundary (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns tangential escape along west boundary
- **Current Implementation**: char `{x:11, y:5}`, enemy `{x:9, y:5}`, expected `{x:11, y:4}`. Named "perpendicular...x=11 same row".
- **Updated Implementation**: Same as Test 2.7.
- **Input Positions**:
  - character: `{q:-5, r:2}`, enemy: `{q:-3, r:2}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:-5, r:1}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:-5, r:1}`
- **Justification**: Same as Test 2.7.

---

### Test 3.4: tangential-escape-se-boundary (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns tangential escape along SE boundary
- **Current Implementation**: char `{x:5, y:0}`, enemy `{x:5, y:2}`, expected `{x:4, y:0}`. Named "perpendicular...y=0 same col".
- **Updated Implementation**: Same as Test 2.8.
- **Input Positions**:
  - character: `{q:2, r:3}`, enemy: `{q:2, r:1}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:1, r:4}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:1, r:4}`
- **Justification**: Same as Test 2.8.

---

### Test 3.5: tangential-escape-vertex-0neg5 (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns tangential escape from vertex (0,-5)
- **Current Implementation**: enemy `{x:0, y:2}`, char `{q:0, r:0}`, expected `{q:1, r:0}`. Named "perpendicular...y=0 x=0". Mixed coords.
- **Updated Implementation**: Same as Test 2.9.
- **Input Positions**:
  - character: `{q:0, r:-5}`, enemy: `{q:2, r:-4}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:-1, r:-4}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:-1, r:-4}`
- **Justification**: Same as Test 2.9.

---

### Test 3.6: tangential-escape-nw-boundary (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns tangential escape along NW boundary
- **Current Implementation**: char `{x:5, y:11}`, enemy `{x:5, y:9}`, expected `{x:4, y:11}`. Named "perpendicular...y=11 same col".
- **Updated Implementation**: Same as Test 2.10.
- **Input Positions**:
  - character: `{q:-2, r:-3}`, enemy: `{q:-2, r:-1}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:-1, r:-4}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:-1, r:-4}`
- **Justification**: Same as Test 2.10.

---

### Test 3.7: vertex-escape-5_0 (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns vertex (5,0) escape
- **Current Implementation**: char `{q:0, r:0}`, enemy `{q:1, r:1}`, expected `{q:0, r:1}`. Named "corner (0,0)".
- **Updated Implementation**: Same as Test 2.11.
- **Input Positions**:
  - character: `{q:5, r:0}`, enemy: `{q:4, r:0}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:5, r:-1}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:5, r:-1}`
- **Justification**: Same as Test 2.11.

---

### Test 3.8: vertex-escape-neg5_0 (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns vertex (-5,0) escape
- **Current Implementation**: char `{q:5, r:0}`, enemy `{q:5, r:-40}`, expected `{x:11, y:10}`. Named "corner (11,11)". Invalid positions.
- **Updated Implementation**: Same as Test 2.12.
- **Input Positions**:
  - character: `{q:-5, r:0}`, enemy: `{q:-3, r:0}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:-5, r:1}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:-5, r:1}`
- **Justification**: Same as Test 2.12.

---

### Test 3.9: vertex-escape-0_5 (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns vertex (0,5) escape
- **Current Implementation**: char `{q:0, r:11}`, enemy `{q:1, r:10}`, expected `{q:0, r:10}`. Named "corner (0,11)". Invalid positions.
- **Updated Implementation**: Same as Test 2.13.
- **Input Positions**:
  - character: `{q:0, r:5}`, enemy: `{q:0, r:3}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:-1, r:5}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:-1, r:5}`
- **Justification**: Same as Test 2.13.

---

### Test 3.10: vertex-escape-neg5_5 (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns vertex (-5,5) escape
- **Current Implementation**: char `{q:5, r:-5}`, enemy `{q:5, r:-4}`, expected `{x:11, y:1}`. Named "corner (11,0)". Stale {x,y} expected.
- **Updated Implementation**: Same as Test 2.14.
- **Input Positions**:
  - character: `{q:-5, r:5}`, enemy: `{q:-4, r:4}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:-5, r:4}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:-5, r:4}`
- **Justification**: Same as Test 2.14.

---

### Test 3.11: interior-over-boundary-angled-flee (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions prefers interior position when fleeing at angle
- **Current Implementation**: char `{x:0, y:3}`, enemy `{x:2, y:5}`, expected `{x:1, y:2}`. Named "vertical fallback".
- **Updated Implementation**: Same as Test 2.15.
- **Input Positions**:
  - character: `{q:4, r:1}`, enemy: `{q:2, r:3}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:4, r:0}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:4, r:0}`
- **Justification**: Same as Test 2.15.

---

### Test 3.12: towards-mode-approaching-boundary (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions towards mode works correctly at boundary
- **Current Implementation**: char `{x:1, y:5}`, enemy `{x:0, y:5}`, expected `{x:0, y:5}`. Named "approaching wall".
- **Updated Implementation**: Same as Test 2.16. Skill mode="towards".
- **Input Positions**:
  - character: `{q:4, r:1}`, enemy: `{q:5, r:0}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:5, r:0}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:5, r:0}`
- **Justification**: Same as Test 2.16.

---

### Test 3.13: towards-mode-at-interior (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions towards mode at interior hex works correctly
- **Current Implementation**: char `{q:1, r:1}`, enemy `{q:0, r:0}`, expected `{q:0, r:0}`. Named "towards at corner". hex dist(1,1->0,0)=2 (not adjacent).
- **Updated Implementation**: Same as Test 2.17. Skill mode="towards".
- **Input Positions**:
  - character: `{q:1, r:0}`, enemy: `{q:0, r:0}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:0, r:0}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:0, r:0}`
- **Justification**: Same as Test 2.17.

---

### Test 3.14: escape-adjacent-at-boundary (decisions)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-move-destination-wall-boundary.test.ts`
- **Type**: unit
- **Verifies**: computeDecisions returns correct escape from adjacent threat at boundary
- **Current Implementation**: char `{x:0, y:5}`, enemy `{x:1, y:5}`, expected `{x:1, y:4}`. Named "escape adjacent at wall".
- **Updated Implementation**: Same as Test 2.18.
- **Input Positions**:
  - character: `{q:5, r:-2}`, enemy: `{q:5, r:-1}`
- **Expected Output**: `decisions[0]!.action.targetCell` equals `{q:4, r:-2}`
- **Assertions**:
  1. `decisions[0]!.action.type` equals `"move"`
  2. `decisions[0]!.action.targetCell` equals `{q:4, r:-2}`
- **Justification**: Same as Test 2.18.

---

## Step 4: `src/engine/game-movement-escape-routes.test.ts` (6 tests)

All tests in this file already use `{q,r}` coordinates. Fixes are updating expected values and/or redesigning scenarios where position descriptions are wrong (interior positions described as "edge" or "corner").

---

### Test 4.1: prefer-interior-over-edge-close-distances

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts`
- **Type**: unit
- **Verifies**: Character at interior prefers higher composite score position when fleeing
- **Current Implementation**: char `{q:-1, r:3}`, enemy `{q:1, r:2}`. Expects `{q:-1, r:2}`. Actual result: `{q:-2, r:4}`.
- **Updated Implementation**: Change expected from `{q:-1, r:2}` to `{q:-2, r:4}`. Update comment.
- **Input Positions** (unchanged):
  - mover: `{q:-1, r:3}` (interior, 6 neighbors)
  - enemy: `{q:1, r:2}`
- **Expected Output**: `{q:-2, r:4}`
- **Assertions**:
  1. `result` equals `{q:-2, r:4}`
- **Justification**: (-2,4) and (-2,3) both composite=18 (d=3,er=6). Tiebreak: dist=3 (tie), absDq: (-2,4) has |1-(-2)|=3, (-2,3) has |1-(-2)|=3 (tie). absDr: (-2,4) has |2-4|=2, (-2,3) has |2-3|=1. (-2,4) wins absDr 2>1.
- **Comment Update**: `"(-2,4) score=18 (dist=3, routes=6), tiebreak absDr 2>1 over (-2,3)"`

---

### Test 4.2: maximize-composite-score-fleeing (RENAME from "avoid corner positions")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts`
- **Type**: unit
- **Verifies**: Character maximizes composite score (distance \* escapeRoutes) when fleeing
- **Current Implementation**: char `{q:1, r:0}`, enemy `{q:3, r:2}`. Expects `{q:1, r:1}` (score=18). Actual: `{q:0, r:0}` (score=30).
- **Updated Implementation**: Change expected from `{q:1, r:1}` to `{q:0, r:0}`. Rename test. Update comment.
- **Hex Topology Concept**: The original test assumed (0,0) was a "corner" with limited routes. In hex, (0,0) is the grid CENTER with 6 neighbors and maximum mobility. The test now verifies correct composite scoring instead.
- **Input Positions** (unchanged):
  - mover: `{q:1, r:0}` (interior)
  - enemy: `{q:3, r:2}`
- **Expected Output**: `{q:0, r:0}`
- **Assertions**:
  1. `result` equals `{q:0, r:0}`
- **Justification**: (0,0) and (1,-1) both composite=30 (d=5,er=6). Tiebreak: dist=5 (tie), absDq: (0,0) has |3-0|=3, (1,-1) has |3-1|=2. (0,0) wins absDq 3>2.
- **Comment Update**: `"(0,0) score=30 (dist=5, routes=6), tiebreak absDq 3>2 over (1,-1)"`
- **Name Update**: "should maximize composite score when fleeing" (was "should avoid corner positions in favor of interior positions")

---

### Test 4.3: penalize-low-escape-routes

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts`
- **Type**: unit
- **Verifies**: Blocked adjacent cells reduce composite score, causing character to prefer open positions
- **Current Implementation**: char `{q:0, r:0}`, enemy `{q:2, r:2}`, blockers at `{q:1, r:0}` and `{q:0, r:1}`. Expects `{q:1, r:-1}`. Actual: `{q:-1, r:0}`.
- **Updated Implementation**: Change expected from `{q:1, r:-1}` to `{q:-1, r:0}`. Update comment.
- **Input Positions** (unchanged):
  - mover: `{q:0, r:0}`, enemy: `{q:2, r:2}`
  - blocker1: `{q:1, r:0}`, blocker2: `{q:0, r:1}`
- **Expected Output**: `{q:-1, r:0}`
- **Assertions**:
  1. `result` equals `{q:-1, r:0}`
- **Justification**: (-1,0) composite=30 (d=5,er=6) > (1,-1) composite=20 (d=4,er=5). (-1,0) is unblocked interior, far from threat. (0,-1) also composite=30 but loses tiebreak: absDq (-1,0)=3 > (0,-1)=2.
- **Comment Update**: `"(-1,0) score=30 (dist=5, routes=6) beats (1,-1) score=20 (dist=4, routes=5)"`

---

### Test 4.4: preserve-open-field-equal-routes

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts`
- **Type**: unit
- **Verifies**: When all candidates have equal escape routes (6), tiebreaking produces correct winner
- **Current Implementation**: char `{q:1, r:1}`, enemy `{q:4, r:-1}`. Expects `{q:0, r:1}`. Actual: `{q:0, r:2}`.
- **Updated Implementation**: Change expected from `{q:0, r:1}` to `{q:0, r:2}`. Update comment.
- **Input Positions** (unchanged):
  - mover: `{q:1, r:1}`, enemy: `{q:4, r:-1}`
- **Expected Output**: `{q:0, r:2}`
- **Assertions**:
  1. `result` equals `{q:0, r:2}`
- **Justification**: (0,1) and (0,2) both composite=24 (d=4,er=6). Tiebreak: dist=4 (tie), absDq: both |4-0|=4 (tie). absDr: (0,2) has |(-1)-2|=3, (0,1) has |(-1)-1|=2. (0,2) wins absDr 3>2.
- **Comment Update**: `"(0,2) score=24 (dist=4, routes=6), tiebreak absDr 3>2 over (0,1)"`

---

### Test 4.5: prefer-interior-from-edge (REDESIGN from "prefer moving inward from edge")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts`
- **Type**: unit
- **Verifies**: Character at actual edge position prefers interior neighbor over vertex when fleeing
- **Current Implementation**: char `{q:-3, r:3}`, enemy `{q:2, r:1}`. Expects `{q:-3, r:2}`. Actual: `{q:-4, r:4}`. Problem: (-3,3) has max(3,3,0)=3, which is INTERIOR (6 neighbors), not edge. Test description is misleading.
- **Updated Implementation**: Complete scenario redesign with actual edge position.
- **Hex Topology Concept**: An "edge" position in hex has max(|q|,|r|,|q+r|)=5 and is NOT a vertex, giving it 4 neighbors. The test verifies that interior neighbors (6 routes) beat vertex neighbors (3 routes) even when the vertex is farther away.
- **Input Positions** (changed):
  - mover: `{q:4, r:1}` (edge: max(4,1,5)=5, 4 neighbors)
  - enemy: `{q:2, r:1}` (2 hexes away)
- **Expected Output**: `{q:4, r:0}`
- **Assertions**:
  1. `result` equals `{q:4, r:0}`
- **Justification**: Interior (4,0) composite=12 (d=2,er=6) > vertex (5,0) composite=9 (d=3,er=3). Interior wins because 6 escape routes outweigh the vertex's extra distance.
- **Name Update**: "should prefer interior neighbor over vertex when fleeing from edge"
- **Comment Update**: `"Interior (4,0) score=12 (dist=2, routes=6) > vertex (5,0) score=9 (dist=3, routes=3)"`

---

### Test 4.6: subtract-obstacles-at-edge (REDESIGN from "subtract obstacles at edge")

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-movement-escape-routes.test.ts`
- **Type**: unit
- **Verifies**: calculateCandidateScore correctly subtracts blocked neighbors from escape route count at actual edge position
- **Current Implementation**: `calculateCandidateScore({q:-3,r:3}, {q:2,r:1}, new Set(["-3,2","-2,3"]))`. Expects escapeRoutes=2. Problem: (-3,3) has 6 neighbors (interior), so with 2 blocked = 4, not 2.
- **Updated Implementation**: Change position to actual edge hex. Adjust obstacle keys.
- **Hex Topology Concept**: Edge positions have 4 neighbors. Blocking 2 of them leaves 2 escape routes. Interior positions have 6 neighbors; blocking 2 leaves 4.
- **Input Positions** (changed):
  - position: `{q:3, r:2}` (edge: max(3,2,5)=5, 4 neighbors: (2,2),(3,1),(4,1),(2,3))
  - target: `{q:0, r:0}` (used for distance calc only)
  - obstacles: `new Set(["2,3", "4,1"])`
- **Expected Output**: `escapeRoutes` equals 2
- **Assertions**:
  1. `result.escapeRoutes` equals 2
- **Justification**: (3,2) has 4 neighbors: (4,2)--invalid so actually need to recheck. Let me verify: neighbors of (3,2) = (4,2): max(4,2,6)=6>5 INVALID. (2,2): max(2,2,4)=4 valid. (3,3): max(3,3,6)=6>5 INVALID. (3,1): max(3,1,4)=4 valid. (4,1): max(4,1,5)=5 valid. (2,3): max(2,3,5)=5 valid. So 4 valid neighbors. Blocked: "2,3" and "4,1". Unblocked: (2,2) and (3,1). Routes = 2. Correct.
- **Comment Update**: `"Edge (3,2) has 4 neighbors, 2 blocked by obstacles -> 2 escape routes"`

---

## Verification Checklist

After implementing all 41 tests, run:

```bash
npm run test -- --run src/engine/movement-groups-stress.test.ts
npm run test -- --run src/engine/game-movement-wall-boundary.test.ts
npm run test -- --run src/engine/game-decisions-move-destination-wall-boundary.test.ts
npm run test -- --run src/engine/game-movement-escape-routes.test.ts
npm run test
```

All 41 previously-failing tests should now pass. No other tests should be affected (these 4 files are independent test suites with no cross-dependencies).

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- hex conversion feature work
- [x] Approach consistent with `.docs/architecture.md` -- engine-only tests, no React
- [x] Patterns follow `.docs/patterns/index.md` -- no new patterns needed
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-003 pathfinding still applies
- [x] All expected values independently verified using hex engine tiebreaking algorithm

## New Decision

**Decision**: "Perpendicular escape" vocabulary replaced by "tangential escape along boundary" in test names and comments.

**Context**: Rectangular grids have linear walls (x=0, x=11) where perpendicular escape is meaningful. Hex grids have a hexagonal boundary without the concept of walls, so characters flee tangentially along the boundary perimeter or inward toward higher-mobility positions.

**Consequences**: Test names and comments updated. No source code impact. Recommend adding note to `.docs/decisions/index.md` when hex ADR is formalized.
