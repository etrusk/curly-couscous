# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

**Workflow:** Claude Code TDD
**Task:** Implement instant attacks and simplified intent line visuals
**Started:** 2026-02-02
**Branch:** feature/escape-route-weighting

## Recent Completions

- 2026-02-01: Escape route weighting for AI movement - Completed (commit b27c4df). Implemented composite scoring (distance × escape_routes) for away-mode movement. Characters now prefer positions with more unblocked adjacent cells when fleeing, preventing corner-trapping. Added countEscapeRoutes() helper, modified CandidateScore interface and compareAwayMode(). 15 new tests in game-movement-escape-routes.test.ts, 16 updated test expectations. All 78 movement/integration tests passing. Updated spec.md Movement System documentation.

- 2026-01-31: Skill exclusivity between same-faction characters - Completed (commit 3d2ba07). Implemented faction-scoped skill exclusivity (same-faction characters cannot share assignable skills, cross-faction sharing allowed). Added getFactionAssignedSkillIds helper, faction guard in assignSkillToCharacter, faction-wide InventoryPanel filtering. 18 new tests (959 total passing). Docs updated (spec.md).
- 2026-01-30: Skill assignment/unassignment synchronization - Completed (commit 1bc7860). Implemented bidirectional inventory management with automatic UI sync. InventoryPanel shows only unassigned non-innate skills. SkillsPanel displays Unassign button for non-innate skills. Added MAX_SKILL_SLOTS=3 capacity enforcement. 14 new tests across fix cycles (941/951 passing). Initial implementation rejected due to spec vs acceptance criteria conflict; fix cycle corrected behavior and docs.
- 2026-01-30: Enemy skill inventory access and innate badge visual distinction - Completed (commit 96db1d4). Removed faction gate from InventoryPanel, added innate badge to SkillsPanel. Enemies now have same 3-slot skill inventory as friendlies. 5 tests removed, 4 updated, 6 added (74 component tests passing). Docs updated (spec.md, architecture.md).
- 2026-01-30: Inventory panel with skill assignment - Completed (commit f7b8d73). Replaced EmptyPanel with InventoryPanel showing available skills for selected friendly characters. Implemented centralized skill registry (ADR-005), assign/remove actions, innate vs assignable classification. Characters start with only innate skills (Move). 32 new tests (927/937 passing), docs updated (spec.md, architecture.md, ADR-005).
- 2026-01-30: Replace RuleEvaluations panel with character hover tooltips - Completed (commit 07d5f28). Implemented progressive disclosure pattern with portal-based tooltips on character hover. Smart viewport-aware positioning, 100ms leave delay, full accessibility (role="tooltip", aria-describedby). Added EmptyPanel placeholder. 31 new tests (902/912 passing), docs updated (architecture.md, patterns, decisions, lessons-learned).
- 2026-01-29: Remove hold mode and reorganize SkillsPanel dropdowns - Completed (commit 0e6cfe8). Removed "hold" mode from Move skill, reorganized Mode dropdown to same row as Target/Selection (far right). Added graceful degradation for legacy data. 5 tests removed, 1 modified, 5 added (880 total passing). Updated spec.md.

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
