# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

[No active task]

## Recent Completions

- 2026-01-30: Replace RuleEvaluations panel with character hover tooltips - Completed (commit 07d5f28). Implemented progressive disclosure pattern with portal-based tooltips on character hover. Smart viewport-aware positioning, 100ms leave delay, full accessibility (role="tooltip", aria-describedby). Added EmptyPanel placeholder. 31 new tests (902/912 passing), docs updated (architecture.md, patterns, decisions, lessons-learned).
- 2026-01-29: Remove hold mode and reorganize SkillsPanel dropdowns - Completed (commit 0e6cfe8). Removed "hold" mode from Move skill, reorganized Mode dropdown to same row as Target/Selection (far right). Added graceful degradation for legacy data. 5 tests removed, 1 modified, 5 added (880 total passing). Updated spec.md.
- 2026-01-29: Split target selector into two dropdowns - Completed (commit 47f2925). Replaced single selector with side-by-side dropdowns (Target: Enemy/Ally/Self, Selection: Nearest/Lowest HP). Strategy dropdown disabled when Self selected. Added composition/decomposition helpers with defensive validation. 27 new tests, all 880 tests passing.

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
