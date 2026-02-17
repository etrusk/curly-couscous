# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

Mutation score improvement campaign (session 1/5 COMPLETE, sessions 2-5 pending).

| #   | File                | Before | Target | After  | Status   |
| --- | ------------------- | ------ | ------ | ------ | -------- |
| 1   | movement-scoring.ts | 45%    | 80%    | 89.84% | COMPLETE |
| 2   | game-actions.ts     | 63%    | 80%    | --     | Pending  |
| 3   | charge.ts           | 70%    | 80%    | --     | Pending  |
| 4   | movement.ts         | 71%    | 80%    | --     | Pending  |
| 5   | game-decisions.ts   | 77%    | 80%    | --     | Pending  |

## Recent Completions

- 2026-02-17: Mutation score improvement -- movement-scoring.ts session 1/5 (COMPLETE, TDD/Claude Code) - Raised mutation score from 45% to 89.84% (target 80%+). Added 58 unit tests in `src/engine/movement-scoring.test.ts` (345 lines) covering all tiebreaker cascades, obstacle/escape-route logic, and candidate selection. Test-only: no production code changes. 167 mutants killed, 19 survived (equivalent mutants). 1590 tests pass.

- 2026-02-16: Add static analysis toolchain + centralized workflow timers (COMPLETE, TDD/Claude Code) - Installed Stryker Mutator (`npm run mutate`, `npm run mutate:full`), dependency-cruiser (`npm run validate:deps`, wired into lint-staged), and knip (`npm run knip`). Consolidated `.deps-check-timestamp` and `.docs/last-meta-review.txt` into `.workflow-timestamps.json` with 14-day cadence. Config-only task: no source code or test changes. knip intentionally not wired into lint-staged (project-level analyzer, ADR-025). 4 files created, 5 modified, 2 deleted.

- 2026-02-13: Add Zustand DevTools middleware (COMPLETE, TDD/Claude Code) - Wrapped `useGameStore` with `devtools(immer(...))` middleware, configured with `name: 'curly-couscous'` and `enabled: import.meta.env.DEV`. Added action name strings to all 18 `set()` calls for labeled actions in Redux DevTools timeline. Created project `README.md` with install/run/debugging instructions. 6 new tests, 1527 total passing, all quality gates pass. 3 files modified (1 source, 1 test, 1 README).

## Priority Next Tasks (from TDD session)

- [ ] Mutation score improvement session 2/5: game-actions.ts (63% -> 80%+)
- [ ] UX polish: SkillRow trigger/filter wrapping is functional but "clunky" (found during: grid overflow fix, date: 2026-02-13)
- [ ] Update CLAUDE.md version from 0.21.2 to 0.22.0 (found during: stacked labels, date: 2026-02-10)
- [ ] Review unstaged .claude/commands/tdd-spec.md modifications (found during: stacked labels, date: 2026-02-10)
- [ ] Extract gameStore-selectors.ts (492 lines, exceeds 400-line limit) (found during: whiff/damage selector fix, date: 2026-02-12)
- [ ] Fix 2 failing tests in gameStore-devtools.test.ts (set() call count mismatch) (found during: static analysis toolchain, date: 2026-02-16)
- [ ] Sync CLAUDE.md version string (0.25.2) with package.json (0.26.0) (found during: static analysis toolchain, date: 2026-02-16)

## Next Steps
