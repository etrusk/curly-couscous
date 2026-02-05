# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-05: Skill system reshape (COMPLETE, TDD/Claude Code) - Universal behavior field replaces Move-specific mode. Target+criterion split replaces monolithic Selector. Universal maxInstances replaces Move-only duplication. Explicit actionType replaces inference. ADR-011 created. 1102/1103 tests passing. ~30 files modified across engine, stores, components, and tests.

- 2026-02-04: Move skill duplication (COMPLETE, TDD/Claude Code) - Added instanceId to Skill type for instance-level identity. New duplicateSkill store action, max 3 Move instances per character. ADR-009 created.

- 2026-02-04: Branch cleanup (COMPLETE) - Merged hexagonal grid conversion and skill exclusivity to main, deleted 4 conflicting branches.

- 2026-02-04: Hexagonal grid conversion (COMPLETE, merged to main) - All hex tests passing, TS errors fixed, PR merged.

## Next Steps

- Address selectMovementTargetData known limitation (targeting line shows first Move instance, not trigger-evaluated one)
- Consider migrating old selector tests from evaluateSelector to evaluateTargetCriterion (tech debt cleanup)
- Potential: Additional duplicatable skills beyond Move
- Potential: Skill loadout presets or templates
