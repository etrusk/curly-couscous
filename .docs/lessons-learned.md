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

## Lesson 3: Verify CSS variable semantics across all theme modes

**Date:** 2026-01-29

**Context:** The plan specified `--surface-elevated` for tooltip backgrounds based on the theme.css comment ("tooltips, overlays, damage numbers"). During browser verification, the tooltip rendered with a white background in dark mode because `--surface-elevated` is set to `#ffffff` in both modes (intended for damage number overlays that always need white backgrounds).

**Lesson:** CSS variable names can be misleading. Always verify the actual values of CSS variables across all theme modes (light and dark) before using them. The semantic name "elevated" suggested floating UI elements, but the actual values were designed for a specific use case (damage overlays) that requires a constant white background. Use `--surface-primary` for theme-aware backgrounds that should adapt to light/dark modes.

**Impact:** Without browser verification, this would have shipped with broken dark mode styling. The fix was simple (swap one CSS variable) but required human visual testing to catch.
