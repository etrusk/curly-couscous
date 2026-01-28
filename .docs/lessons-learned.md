# Lessons Learned

This file captures important lessons from implementation work to prevent repeated mistakes and inform future decisions.

## Lesson 1: Scope behavioral specs by mode/context

**Date:** 2026-01-29

**Context:** When spec.md documented "Movement Tiebreaking" rules, it did not specify they only apply to single-step movement selection. When A\* pathfinding replaced the tiebreaking for "towards" mode, 6 tests that asserted specific tiebreaking outcomes broke.

**Lesson:** Specs should explicitly state the scope of behavioral rules (e.g., "applies to away mode only") to prevent confusion when subsystems are replaced. Implementation-specific details should be clearly flagged as such in test designs.

**Impact:** When replacing an algorithm, existing tests that assert implementation-specific details (first-step choices) will need updating if the spec didn't clearly scope the behavior.

## Lesson 2: Exclude target from obstacles in pathfinding

**Date:** 2026-01-29

**Context:** The initial plan only mentioned excluding the mover from obstacles. During implementation, it became clear the target must also be excluded; otherwise, A\* cannot find a path to the target position (treating it as blocked).

**Lesson:** In pathfinding for combat systems, both the pathfinding entity and its target should be excluded from obstacle sets. This is especially important for melee combat where characters need to reach adjacent cells to the target.

**Implementation:** The `buildObstacleSet()` helper correctly handles this by accepting both mover and target IDs and excluding both from the obstacle set.
