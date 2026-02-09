# TDD Session

## Task

Set up Vitest Browser Mode config for SVG/component test subset

## Confirmed Scope

Configure Vitest Browser Mode to run a subset of tests that require real DOM/SVG rendering (e.g., SVG element tests, component tests that need actual browser APIs). Set up workspace/project configuration to run browser-mode tests alongside existing jsdom tests. Identify which existing tests should migrate to browser mode.

## Acceptance Criteria

- Vitest Browser Mode configured and working alongside existing jsdom test setup
- SVG/component test subset identified and running in browser mode
- All existing tests continue to pass
- Documentation updated with browser mode patterns

## Current Phase

COMMIT

## Phase History

- 2026-02-09 INIT → EXPLORE
- 2026-02-09 EXPLORE → PLAN [7 exchanges, ~25K tokens]
- 2026-02-09 PLAN → DESIGN_TESTS [4 exchanges, ~35K tokens]
- 2026-02-09 DESIGN_TESTS → TEST_DESIGN_REVIEW [4 exchanges, ~35K tokens]
- 2026-02-09 TEST_DESIGN_REVIEW → WRITE_TESTS [3 exchanges, ~20K tokens]
- 2026-02-09 WRITE_TESTS → IMPLEMENT [17 exchanges, ~55K tokens]
- 2026-02-09 IMPLEMENT → REVIEW [5 exchanges, ~40K tokens]
- 2026-02-09 REVIEW → SYNC_DOCS [5 exchanges, ~25K tokens]
- 2026-02-09 SYNC_DOCS → COMMIT [4 exchanges, ~18K tokens]

## Context Metrics

Orchestrator: ~15K/300K (5%)
Cumulative agent tokens: ~253K
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent             | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                                   |
| --- | ----------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE            | 7         | ~25K   | 30    | ~21s     | COMPLETE | Found 3 tooltip tests for browser mode, 2 must stay jsdom                                                               |
| 2   | tdd-planner       | PLAN               | 4         | ~35K   | 12    | ~30s     | COMPLETE | 10-step plan, Phase 1 = infra + 2-3 browser tests, Phase 2 = follow-up                                                  |
| 3   | tdd-test-designer | DESIGN_TESTS       | 4         | ~35K   | 13    | -        | COMPLETE | 4 tests: 1 smoke + 3 positioning, all target jsdom gaps                                                                 |
| 4   | tdd-test-reviewer | TEST_DESIGN_REVIEW | 3         | ~20K   | 11    | -        | COMPLETE | Approved with 3 minor adjustments: relational assertions, removed fragile negative assertion, added waitFor timing note |
| 5   | tdd-coder         | WRITE_TESTS        | ~17       | ~50K   | ~30   | -        | COMPLETE | Infrastructure set up, 4 browser tests written, 2 pass 2 fail (red phase)                                               |
| 6   | tdd-coder         | IMPLEMENT          | 5         | ~40K   | ~25   | -        | COMPLETE | Fixed 2 failing browser tests: viewport sizing + anchor positioning                                                     |
| 7   | tdd-reviewer      | REVIEW             | 5         | ~25K   | 18    | -        | COMPLETE | APPROVED: 0 critical, 1 important (Chromium path), 2 minor                                                              |
| 8   | tdd-doc-syncer    | SYNC_DOCS          | 4         | ~18K   | 18    | -        | COMPLETE | Fixed Chromium path, added gitignore, created ADR-022, updated arch/patterns/decisions                                  |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- Clean run

#### #2 tdd-planner (PLAN)

- Read exploration findings and all required docs
- Decided: create new .browser.test.tsx files alongside existing jsdom tests (not migrate)
- Decided: keep CharacterTooltip.tsx zero-rect workaround until browser tests prove it removable
- Recommended ADR-022 for Vitest Browser Mode decision
- Plan covers: deps, workspace config, browser setup, proof-of-concept test, npm scripts, docs

#### #3 tdd-test-designer (DESIGN_TESTS)

- Read plan, exploration, existing tests, component source, CSS module, tooltip helpers, patterns, spec
- Designed 4 tests: 1 environment smoke test + 3 positioning tests targeting jsdom gaps
- Smoke test validates workspace config produces real browser (not jsdom)
- Positioning tests validate: real getBoundingClientRect dimensions, positioning with real dimensions, viewport flip with real constraints
- Intentionally excluded content/ARIA/callback/portal tests (already covered by jsdom)
- Noted implementation details: DOMRect constructor, viewport control via Playwright, waitFor timing, CSS processing validation

#### #4 tdd-test-reviewer (TEST_DESIGN_REVIEW)

- Approved 4 tests with 3 minor adjustments
- Changed test 3 assertion 1 from exact equality to relational (tolerance of 2px) to reduce brittleness
- Replaced test 3 assertion 3 from fragile negative assertion (height !== 150) to positive assertion (width > 0)
- Added explicit timing note: coder MUST use waitFor() for positioning assertions due to useLayoutEffect + setState re-render cycle
- Confirmed no overlap with existing jsdom tests
- Confirmed spec alignment for tooltip positioning requirements

#### #5 tdd-coder (WRITE_TESTS)

- Installed @vitest/browser, @vitest/browser-playwright, playwright
- Playwright chromium download failed (SOCKS proxy issue); used system Chromium at /usr/bin/chromium via launchOptions.executablePath
- Discovered vitest.workspace.ts is removed in Vitest 4; migrated to test.projects in vite.config.ts
- Discovered @vitest/browser/providers/playwright types don't exist in Vitest 4; reverted tsconfig change
- Fixed deprecation: changed import from @vitest/browser/context to vitest/browser
- All 1448 unit tests pass, 2/4 browser tests pass (tests 1+2), 2/4 fail (tests 3+4) -- red phase achieved
- Failing tests fail at assertion level (not infrastructure) -- positioning with real dimensions differs from expected values
- Test 3 fails: left=200 (fallback path) instead of expected ~252 (right-side positioning) -- real tooltip width (~280px+) is too wide for right-side placement with DOMRect(200,200,40,40) in default viewport
- Test 4 fails: left=300 (fallback path) instead of < 300 -- page.viewport() may not affect the component's window.innerWidth reading, or the tooltip calculation uses fallback when neither side fits

#### #6 tdd-coder (IMPLEMENT - green phase)

- Root cause: default Vitest browser iframe viewport is ~335px wide (not 1280px as assumed)
- Test 3 fix: added `await page.viewport(1280, 720)` to set explicit wide viewport before rendering
- Test 4 fix: increased viewport to 620x600 and moved anchor to x=350 so left-side check passes (strict inequality `> MARGIN` requires `anchorLeft - OFFSET - tooltipWidth > 8`)
- All 4 browser tests now pass, all 1448 unit tests still pass
- Quality gates: TypeScript PASS, ESLint PASS, tests PASS

#### #7 tdd-reviewer (REVIEW)

- APPROVED with 0 critical, 1 important, 2 minor issues
- All quality gates pass

#### #8 tdd-doc-syncer (SYNC_DOCS)

- Fixed hardcoded Chromium path to use `process.env.CHROMIUM_PATH || undefined`
- Added `__screenshots__/` to .gitignore
- Created ADR-022 for Vitest Browser Mode
- Updated decisions/index.md, architecture.md, patterns/index.md
- Updated current-task.md with completion status

## Files Touched

- .tdd/session.md (updated)
- .tdd/exploration.md (created)
- .tdd/plan.md (created)
- .tdd/test-designs.md (created)
- vite.config.ts (modified: replaced `defineConfig` import from `vite` to `vitest/config`, added `test.projects` with unit + browser configs, removed old `test` block)
- src/test/setup.browser.ts (created: browser test setup without matchMedia mock)
- src/components/BattleViewer/CharacterTooltip.browser.test.tsx (created: 4 browser positioning tests)
- package.json (modified: added `@vitest/browser`, `@vitest/browser-playwright`, `playwright` devDeps; added `test:unit`, `test:browser` scripts)

## Browser Verification

Status: N/A

## Human Approval

Status: N/A

## Blockers

- (none)

## Review Cycles

Count: 1

### Review #1 (2026-02-09)

**Verdict**: APPROVED with minor notes

- 0 CRITICAL issues
- 1 IMPORTANT issue: hardcoded Chromium path (`/usr/bin/chromium`) reduces portability
- 2 MINOR issues: screenshot artifacts not gitignored, planned docs not created
- All quality gates pass (1448 unit + 4 browser tests, TypeScript, ESLint)
