# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

**Task:** Move rule evaluations from RuleEvaluations panel to mouseover popups on character icons
**Workflow:** Claude Code TDD
**Started:** 2026-01-29

## Recent Completions

- 2026-01-29: Remove hold mode and reorganize SkillsPanel dropdowns - Completed (commit 0e6cfe8). Removed "hold" mode from Move skill, reorganized Mode dropdown to same row as Target/Selection (far right). Added graceful degradation for legacy data. 5 tests removed, 1 modified, 5 added (880 total passing). Updated spec.md.
- 2026-01-29: Split target selector into two dropdowns - Completed (commit 47f2925). Replaced single selector with side-by-side dropdowns (Target: Enemy/Ally/Self, Selection: Nearest/Lowest HP). Strategy dropdown disabled when Self selected. Added composition/decomposition helpers with defensive validation. 27 new tests, all 880 tests passing.
- 2026-01-29: Standardized Rule Evaluations panel to use Excel-style letter notation (A, B, C) matching battlefield tokens - Completed (commit a57fb56). Added letter notation to all character references, removed duplicate character name display, updated 28 test assertions, added 1 new test. All 852 tests passing.
- 2026-01-29: A* pathfinding for smooth movement - Implemented weighted A* pathfinding algorithm with binary heap priority queue for "towards" movement mode. Characters now navigate optimally around obstacles without zig-zagging. Created pathfinding.ts (210 lines), 21 unit tests, 8 integration tests. Updated 6 existing test assertions to reflect A\* behavior. All 851 tests passing. Commit e88249e.

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
