# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

[No active task]

<!-- When starting a task, replace above with:
Task: [description]
Workflow: [roo|claude-code]
Started: [YYYY-MM-DD HH:MM]
-->

## Recent Completions

- 2026-01-27: Action resolution timing fix - Changed resolvesAtTick formula from tick+tickCost-1 to tick+tickCost. All actions now have 1+ tick visibility before resolution. Light Punch now dodgeable. Updated spec.md (3 sections), tdd.md (added SYNC_DOCS phase). All 724 tests passing. Commit 44d5cf4.
- 2026-01-27: Critical Immer middleware bug fix - Fixed gameStore.processTick wholesale state replacement breaking Zustand+Immer tracking. Changed to mutate arrays in place using splice(). Bug affected ALL intent lines (attacks and movement), pre-existing issue revealed by movement feature. All 724 tests passing. Commit c38b80f.
- 2026-01-27: Movement intent line visualization - Added visual movement intent lines (blue dashed) to show where characters plan to move. Modified selectIntentData to include movement actions with ticksRemaining >= 0 (exception to attack rule since movement has no visible damage effect). Extracted 6 movement tests to separate file. All 724 tests passing. Commit adceb43.
- 2026-01-27: Rule Evaluations action preview + compact debugging - Added action summary to collapsed headers (shows skill + target without expanding). Compact evaluation list on expand (stops at selected skill, debugging-friendly format with parameter names). Added missing --text-on-faction/--accent-primary CSS variables for character icon lettering. Extracted formatters to separate module. 29 new tests, all 716 passing. Commit c0fd64a.
- 2026-01-27: Fixed slotPosition 0-based bug - Changed gameStore to use 1-based slotPosition (position 1='A', 2='B') fixing "slotPosition must be positive, got 0" error when adding characters. Refactored RuleEvaluations to use shared letterMapping utility. Updated 142 test fixtures. All 687 tests passing. Commit 7b4eb90.

## Next Steps

- If only 2 characters, they move erratically in a zig-zag towards each other, should be smoother
- Sentence-builder UI for SkillsPanel configuration
