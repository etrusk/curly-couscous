# Project Status
<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus
Spec alignment complete. Ready for selector/trigger evaluation implementation (data-driven).

## Recent Completions
<!-- Prune when >3 items. Older completions live in git history. -->
- 2025-12-31: Handback protocol - Added return instructions to delegation template
- 2025-12-31: Spec alignment - types.ts aligned with spec v0.3 §13 (Chebyshev distance, data interfaces, field renames)
- 2025-12-31: gameStore.ts updated for field renames (slotPosition, skills, tickCost)

## Open Questions
- None currently

## Next Steps
- Implement selector evaluation (data-driven: nearestEnemy, lowestHp, self, etc.)
- Implement trigger evaluation (data-driven: always, healthBelow, enemyInRange, etc.)
- Implement combat system (attack resolution, damage calculation)
- Implement movement system (collision detection, Chebyshev distance)
