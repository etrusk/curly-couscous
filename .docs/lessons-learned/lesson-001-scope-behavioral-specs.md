# Lesson 1: Scope behavioral specs by mode/context

**Date:** 2026-01-29

**Context:** When spec.md documented "Movement Tiebreaking" rules, it did not specify they only apply to single-step movement selection. When A\* pathfinding replaced the tiebreaking for "towards" mode, 6 tests that asserted specific tiebreaking outcomes broke.

**Lesson:** Specs should explicitly state the scope of behavioral rules (e.g., "applies to away mode only") to prevent confusion when subsystems are replaced. Implementation-specific details should be clearly flagged as such in test designs.

**Impact:** When replacing an algorithm, existing tests that assert implementation-specific details (first-step choices) will need updating if the spec didn't clearly scope the behavior.
