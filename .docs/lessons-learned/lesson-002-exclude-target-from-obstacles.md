# Lesson 2: Exclude target from obstacles in pathfinding

**Date:** 2026-01-29

**Context:** The initial plan only mentioned excluding the mover from obstacles. During implementation, it became clear the target must also be excluded; otherwise, A\* cannot find a path to the target position (treating it as blocked).

**Lesson:** In pathfinding for combat systems, both the pathfinding entity and its target should be excluded from obstacle sets. This is especially important for melee combat where characters need to reach adjacent cells to the target.

**Implementation:** The `buildObstacleSet()` helper correctly handles this by accepting both mover and target IDs and excluding both from the obstacle set.
