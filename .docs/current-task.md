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

- 2026-02-04: Move skill duplication (COMPLETE, TDD/Claude Code) - Added instanceId to Skill type for instance-level identity. New duplicateSkill store action, max 3 Move instances per character. UI duplicate/remove buttons in SkillsPanel. React keys migrated to instanceId. 26 new tests, 1086 total passing. All quality gates clean. 16+ files modified across engine, stores, components, and tests.

- 2026-02-04: Branch cleanup (COMPLETE) - Merged hexagonal grid conversion and skill exclusivity to main, deleted 4 conflicting branches, cleaned up remote branches.

- 2026-02-04: Hexagonal grid conversion (COMPLETE, merged to main) - All hex tests passing, TS errors fixed, PR merged.

- 2026-02-04: Fix 28 pre-existing TypeScript errors in test files (COMPLETE, TDD/Claude Code) - Fixed token-visual.test.tsx (18 missing cx/cy props) and hex.test.ts (4 tuple type assertions). All 1048/1048 tests passing.

- 2026-02-04: Skill exclusivity between same-faction characters (COMPLETE) - Faction-based skill assignment restrictions.

## Next Steps

- Merge Move skill duplication feature branch to main (pending human approval and branch creation)
- Consider ADR-009 for instanceId pattern (registry ID vs instance ID separation)
- Address selectMovementTargetData known limitation (targeting line shows first Move instance, not trigger-evaluated one)
- Potential: Additional duplicatable skills beyond Move
- Potential: Skill loadout presets or templates
