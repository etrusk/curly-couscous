# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-13: Add Zustand DevTools middleware (COMPLETE, TDD/Claude Code) - Wrapped `useGameStore` with `devtools(immer(...))` middleware, configured with `name: 'curly-couscous'` and `enabled: import.meta.env.DEV`. Added action name strings to all 18 `set()` calls for labeled actions in Redux DevTools timeline. Created project `README.md` with install/run/debugging instructions. 6 new tests, 1527 total passing, all quality gates pass. 3 files modified (1 source, 1 test, 1 README).

- 2026-02-13: Fix SkillRow grid overflow for complex trigger/filter conditions (COMPLETE, TDD/Claude Code) - Pure CSS fix: changed grid columns 6-9 from `auto` to `minmax(0, auto)` in both config and battle mode templates, added `flex-wrap: wrap` to `.triggerControl` and `.filterGroup` containers. Prevents overflow when complex conditions (e.g., "NOT Enemy Channeling (any)") are set. 4 CSS edits across 2 files, 2 doc updates. 1521 tests passing, all quality gates pass. Human verified: wrapping works but is "clunky" -- potential future UX polish.

- 2026-02-12: Fix off-by-one in whiff/damage event selectors (COMPLETE, TDD/Claude Code) - `selectRecentWhiffEvents` and `selectRecentDamageEvents` filtered `e.tick === tick` but post-`processTick` tick is N+1 while events stamped at N. Fixed to `e.tick === tick - 1` with `tick === 0` guard. Updated 5 test files to use realistic post-`processTick` tick alignment. 1521 tests passing, all quality gates pass. 6 files modified (1 source + 5 test).

## Priority Next Tasks (from TDD session)

- [ ] UX polish: SkillRow trigger/filter wrapping is functional but "clunky" (found during: grid overflow fix, date: 2026-02-13)
- [ ] Update CLAUDE.md version from 0.21.2 to 0.22.0 (found during: stacked labels, date: 2026-02-10)
- [ ] Review unstaged .claude/commands/tdd-spec.md modifications (found during: stacked labels, date: 2026-02-10)
- [ ] Extract gameStore-selectors.ts (492 lines, exceeds 400-line limit) (found during: whiff/damage selector fix, date: 2026-02-12)

## Next Steps
