# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

(none -- ready for next task)

## Recent Completions

- 2026-02-12: Fix off-by-one in whiff/damage event selectors (COMPLETE, TDD/Claude Code) - `selectRecentWhiffEvents` and `selectRecentDamageEvents` filtered `e.tick === tick` but post-`processTick` tick is N+1 while events stamped at N. Fixed to `e.tick === tick - 1` with `tick === 0` guard. Updated 5 test files to use realistic post-`processTick` tick alignment. 1521 tests passing, all quality gates pass. 6 files modified (1 source + 5 test).

- 2026-02-12: Two-State Trigger Model (COMPLETE, TDD/Claude Code) - Replaced always-present trigger dropdowns with two-state model: unconditional (`+ Condition` ghost button) or conditional (full controls with `x` remove). Removed "Always" from condition dropdown (7 options). Added CONDITION_SCOPE_RULES constant for per-condition valid scopes. When target=self, SELECTOR and FILTER controls hidden (not just disabled). Uses `liveSkill` store subscription for dynamic target changes. 33 new tests across 3 files, 1519 total passing, all quality gates pass.

- 2026-02-11: Plural Target Scopes -- `enemies` / `allies` (COMPLETE, TDD/Claude Code) - Extended Target type with "enemies" and "allies" for group movement. Added isPluralTarget() guard and PLURAL_TARGETS constant. Extracted scoring functions from game-movement.ts to movement-scoring.ts (ADR-024) to stay under 400-line budget. Implemented computePluralMoveDestination() (away: maximize min distance, towards: minimize avg distance) and multi-step variant. Added plural target branches in decision logic and action creation. 13 new tests across 3 files, 1495 total passing, all quality gates pass.

- 2026-02-11: Skill Expansion UI Gaps -- Filter Conditions, Filter NOT, Qualifier Selector (COMPLETE, TDD/Claude Code) - Expanded filter dropdown from 2 to 7 conditions. Added filter NOT toggle (same pattern as trigger NOT). Added qualifier selector for channeling condition in both filter and trigger. Extracted FilterControls.tsx (177 lines) and QualifierSelect.tsx (55 lines) from SkillRow. 25 new tests across 3 files, 1482 total passing, all quality gates pass.

## Priority Next Tasks (from TDD session)

- [ ] Update CLAUDE.md version from 0.21.2 to 0.22.0 (found during: stacked labels, date: 2026-02-10)
- [ ] Review unstaged .claude/commands/tdd-spec.md modifications (found during: stacked labels, date: 2026-02-10)
- [ ] Extract gameStore-selectors.ts (492 lines, exceeds 400-line limit) (found during: whiff/damage selector fix, date: 2026-02-12)

## Next Steps
