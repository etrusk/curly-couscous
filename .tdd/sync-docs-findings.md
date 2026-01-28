# SYNC_DOCS Phase Findings

## Step 11a: Spec Alignment Analysis

### Question 1: Did human feedback change requirements during implementation?

No. The task scope remained stable from clarification through implementation. Browser verification is still pending but no requirements were changed.

### Question 2: Were features implemented differently than originally designed?

Minor deviations (none problematic):

1. **`types.ts` not modified** -- Plan suggested adding `PathResult` type; implementation uses `Position[]` directly. Simpler and sufficient.
2. **`buildObstacleSet` excludes both mover AND target** -- Plan only showed excluding the mover. Excluding target is correct: allows A\* to find paths TO the target for melee combat.
3. **Function signature parameter order** -- Plan: `(start, goal, obstacles, gridWidth, gridHeight)`. Implementation: `(start, goal, gridWidth, gridHeight, obstacles)`. Cosmetic difference only.

### Question 3: Did implementation reveal spec incompleteness?

**YES -- SIGNIFICANT finding:**

The spec (`spec.md` lines 129-136) documents "Movement Tiebreaking" rules:

> When multiple cells are equidistant to target:
>
> 1. Prefer horizontal movement (lower X difference)
> 2. Then vertical movement (lower Y difference)
> 3. Then lower Y coordinate
> 4. Then lower X coordinate

With A* pathfinding, these tiebreaking rules **no longer apply to "towards" mode**. A* determines the first step based on full-path optimization with weighted costs, not single-step tiebreaking. The tiebreaking rules are now only relevant for "away" mode.

Additionally, the spec does not mention:

- Pathfinding algorithm usage
- Weighted vs unweighted movement costs
- The dual-distance concept (Chebyshev for range, weighted for pathing)

### Question 4: Were behavioral details clarified/added during development?

Yes:

- Target is excluded from obstacles (so pathfinding can reach melee range)
- When no path exists, character stays in place (graceful degradation)
- A\* neighbor exploration order determines first-step choice when multiple optimal paths exist

### Question 5: Did architectural decisions deviate from documented spec?

One significant architectural decision: **Weighted A\* (sqrt(2) diagonal cost) for pathfinding while keeping Chebyshev (diagonal cost 1) for range calculations**. This dual-distance concept was planned but has not yet been documented in ADRs.

---

## Step 11b: Required Documentation Updates

### Update 1: `.docs/spec.md` -- Movement Tiebreaking Section

**Location**: Lines 128-136 (Movement Tiebreaking section)

**Current text**:

```
### Movement Tiebreaking

When multiple cells are equidistant to target:

1. Prefer horizontal movement (lower X difference)
2. Then vertical movement (lower Y difference)
3. Then lower Y coordinate
4. Then lower X coordinate
```

**Proposed replacement**:

```
### Movement System

**Towards mode:** Uses A* pathfinding to find the optimal path around obstacles (other characters). Diagonal moves cost sqrt(2) while cardinal moves cost 1.0, producing natural-looking paths without unnecessary zig-zagging. When no path exists, the character stays in place.

**Away mode:** Uses single-step maximization with tiebreaking hierarchy:

1. Maximize resulting Chebyshev distance from target
2. Maximize resulting |dx|, then |dy|
3. Then lower Y coordinate
4. Then lower X coordinate

**Hold mode:** Character passes their turn (no movement).
```

**Rationale**: The spec currently describes tiebreaking as if it applies universally. With A\* pathfinding, "towards" mode no longer uses tiebreaking. The spec should accurately describe both modes.

### Update 2: `.docs/architecture.md` -- Project Structure

**Location**: Engine file listing (line 26 area)

**Add after `movement.ts` entry**:

```
│   ├── pathfinding.ts # A* pathfinding algorithm with binary heap
```

**Rationale**: New module added to engine; architecture doc should list all engine modules.

### Update 3: `.docs/decisions/adr-003-weighted-astar-pathfinding.md` (NEW FILE)

**Content**:

```markdown
# ADR-003: Weighted A\* for Pathfinding, Chebyshev for Range

## Date

2026-01-29

## Status

Accepted

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
```

### Update 4: `.docs/decisions/index.md` -- Add ADR-003 Entry

**Add row to table**:

```
| ADR-003 | Weighted A* for Pathfinding, Chebyshev for Range | 2026-01-29 | Accepted | [adr-003-weighted-astar-pathfinding.md](./adr-003-weighted-astar-pathfinding.md) |
```

### Update 5: `.docs/current-task.md` -- Completion Note (for orchestrator to apply at COMMIT)

**Add to Recent Completions**:

```
- 2026-01-29: A* pathfinding for smooth movement - Implemented weighted A* pathfinding algorithm with binary heap priority queue for "towards" movement mode. Characters now navigate optimally around obstacles without zig-zagging. Created pathfinding.ts (210 lines), 21 unit tests, 8 integration tests. Updated 6 existing test assertions to reflect A* behavior. All 851 tests passing. Commit XXXXXXX.
```

**Update Current Focus**: Remove pathfinding task, set to next task.

**Update Next Steps**: Remove the zig-zag bullet point (it is now resolved).

### Update 6: No new patterns needed

The A\* implementation is standard and self-contained in a single file. It does not represent a reusable pattern that other parts of the codebase would adopt. No pattern file needed.

### Update 7: `.docs/lessons-learned.md` (NEW FILE -- if applicable)

**Finding**: Spec documented movement tiebreaking rules without specifying they only apply to a particular movement mode. When A\* replaced tiebreaking for "towards" mode, 6 existing tests broke because they asserted specific tiebreaking outcomes. **Lesson**: Behavioral specs should scope their applicability (e.g., "these tiebreaking rules apply when moving away from targets"). When replacing an algorithm, existing tests that assert implementation-specific details (first-step choices) will need updating.

---

## Step 11c: Session State Completion Summary

**Implementation Summary**: Implemented A\* pathfinding algorithm for 8-directional movement on square grid. Algorithm uses binary heap priority queue, Chebyshev heuristic, and weighted movement costs (cardinal=1.0, diagonal=sqrt(2)). Integrated into `computeMoveDestination()` for "towards" mode; "away" mode unchanged.

**Key Metrics**:

- Files created: 3 (pathfinding.ts, pathfinding.test.ts, game-movement.test.ts)
- Files modified: 4 (game-movement.ts, game-movement-diagonal.test.ts, game-movement-wall-boundary.test.ts, game-decisions-move-destination-wall-boundary.test.ts)
- Tests added: 29 (21 unit + 8 integration)
- Tests updated: 6 existing assertions
- Total tests: 851 passing
- Lines of production code: ~210 (pathfinding.ts) + ~30 (game-movement.ts changes)

---

## Step 11d: Lessons Learned

**Lesson 1: Scope behavioral specs by mode/context**

When spec.md documented "Movement Tiebreaking" rules, it did not specify they only apply to single-step movement selection. When A\* pathfinding replaced the tiebreaking for "towards" mode, 6 tests that asserted specific tiebreaking outcomes broke. Specs should explicitly state the scope of behavioral rules (e.g., "applies to away mode only") to prevent confusion when subsystems are replaced.

**Lesson 2: Exclude target from obstacles in pathfinding**

The initial plan only mentioned excluding the mover from obstacles. During implementation, it became clear the target must also be excluded; otherwise, A\* cannot find a path to the target position (treating it as blocked). This is especially important for melee combat where characters need to reach adjacent cells. The implementation correctly handles this by passing both mover and target IDs to `buildObstacleSet()`.
