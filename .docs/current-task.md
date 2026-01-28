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

- 2026-01-28: Movement target lines feature - Added constantly visible movement target lines showing which character each character is moving toward. Features: bidirectional line offset pattern (3px perpendicular), accessibility toggle with localStorage persistence, neutral gray styling across all themes. Created TargetingLine/TargetingLineOverlay components, selectMovementTargetData selector with memoization. All 19 files with tests passing. Commit 0fd9cd8.
- 2026-01-28: TDD workflow request clarification - Added mandatory request clarification phase to TDD workflow. Ensures scope, acceptance criteria, and constraints are validated before implementation. Aligns with research guidelines on spec-driven development. Added ~50 lines while keeping concise. Commit 2778011.
- 2026-01-28: TDD workflow improvements - Added HUMAN_VERIFY quality gate phase to TDD workflow between REVIEW and SYNC_DOCS. Documented browser automation verification patterns for UI changes. Updated workflow routing and session template. Merged to main. Commit 4bf90f9.
- 2026-01-28: IntentOverlay subscription fix - Fixed Zustand subscription bug where IntentOverlay component did not re-render when characters added via addCharacter/addCharacterAtPosition. Root cause: complex selector logic prevented Zustand from detecting dependency on characters array. Solution: Added explicit selectCharacters subscription in IntentOverlay. 8 new tests added. All tests passing. Commit 090290b.
- 2026-01-28: Movement targeting line investigation - Investigated reported missing movement lines. Found NO BUG - user issue caused by adjacent character placement (attacks triggered instead of movement) and tick counter displaying post-resolution state. Added 6 DEFAULT_SKILLS integration tests to verify correct behavior. Documented findings in INV-003. All 772 tests passing. Commit 55c876e.
- 2026-01-28: Preview intent lines for idle characters - Modified selectIntentData to compute and display preview decisions for characters without currentAction (at tick 0 or after action resolves). Enables immediate visibility when movement targets are changed. Created 13 tests for preview behavior. All 766 tests passing. Commit a5d5913.

- 2026-01-27: Documentation and refactoring follow-up - Added ADR-002 documenting uniform filtering architectural decision. Updated INV-001 to clarify movement exception was incorrect (spec always required ticksRemaining >= 0 for all actions). Refactored duplicate posEqual() helper to use existing positionsEqual() from engine/types.ts. All 753 tests passing. Commit c4564b4.
- 2026-01-27: Intent lines fixes - Unified action filtering (removed movement exception, all actions now ticksRemaining >= 0). Added 4px perpendicular offset for bidirectional attacks (prevents overlap). Split test files to comply with 400-line limit (2 files → 7 organized files). Fixed 4 issues: Light attack visibility, movement special treatment, movement targeting visibility, overlapping Heavy attack lines. All 753 tests passing. Commit 049fb6e.

## Next Steps

- If only 2 characters, they move erratically in a zig-zag towards each other, should be smoother
- Sentence-builder UI for SkillsPanel configuration
