# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

[TDD Workflow - Claude Code] Hexagonal grid conversion - Started 2026-02-03. Converting 12×12 square grid to hexagon-shaped map (radius 5, 91 hexes) with axial coordinates, flat-top orientation, SVG rendering. Phase: EXPLORE.

## Recent Completions

- 2026-02-03: Heal skill and action-based intent colors - Completed. Added Heal skill (tickCost: 2, range: 5, healing: 25, lowest_hp_ally). Refactored intent line colors from faction-based (blue/orange) to action-based (red=attack, green=heal, blue=move) using Okabe-Ito palette. Added cross/plus endpoint marker for heals. Healing resolves before combat (ADR-006). 24 new tests, 25 assertion updates across 11 test files. 1019/1029 passing. Docs updated (spec.md, ADR-006, decisions/index.md).

- 2026-02-02: Instant attacks and simplified intent line visuals - Completed (commit 6e88fea). Implemented Light Punch as instant attack (tickCost: 0) to prevent infinite kiting. Simplified intent line visual encoding with timing-based styling: solid 4px lines for immediate actions, dashed 2px lines with numeric labels for future actions. 14 new tests, 10 updated tests.

- 2026-02-01: Escape route weighting for AI movement - Completed (commit b27c4df). Implemented composite scoring (distance \* escape_routes) for away-mode movement. Characters now prefer positions with more unblocked adjacent cells when fleeing. 15 new tests, 16 updated expectations.

- 2026-01-31: Skill exclusivity between same-faction characters - Completed (commit 3d2ba07). Implemented faction-scoped skill exclusivity. 18 new tests.

- 2026-01-30: Skill assignment/unassignment synchronization - Completed (commit 1bc7860). Bidirectional inventory management with automatic UI sync. 14 new tests.

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
