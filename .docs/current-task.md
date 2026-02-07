# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-07: Remove SkillRow unused `mode` prop (COMPLETE, Claude Code) - Removed dead `mode` prop from SkillRowProps interface, component destructuring, PriorityTab call site, and all test files. 1318/1318 tests passing.

- 2026-02-07: Remove Loadout Tab -- Merge into Priority (COMPLETE, TDD/Claude Code) - Eliminated tab navigation from CharacterPanel. Merged enable/disable checkbox, unassign button, and inventory section into PriorityTab/SkillRow. Extracted SkillRowActions sub-component. Config controls remain visible during battle alongside evaluation indicators. Deleted LoadoutTab files. 1332/1332 tests passing. spec.md, architecture.md updated.

- 2026-02-07: Remove per-skill maxInstances limit (COMPLETE, TDD/Claude Code) - Removed `maxInstances` from `SkillDefinition` interface and all SKILL_REGISTRY entries. Duplication now capped only by MAX_SKILL_SLOTS=10. 1336/1336 tests passing. spec.md updated.

- 2026-02-06: Remove duplicate button + auto-focus toggle (COMPLETE, TDD/Claude Code) - "Remove" button for duplicate skill instances (visible when instanceCount > 1). "Auto-focus battle" checkbox with localStorage persistence. 17 new tests. 1336/1336 tests passing.

## Next Steps
