# TDD Session

## Task

Skill Name Tooltips — Add hover/focus tooltips on skill names that display all relevant stats from the skill registry.

## Confirmed Scope

Create a reusable `SkillNameWithTooltip` component with portal-rendered tooltip showing skill stats on hover/focus. Integrate into SkillRow and PriorityTab inventory. Unit tests with React Testing Library. CSS module following project design system.

## Acceptance Criteria

- [x] Hovering over a skill name in SkillRow displays a tooltip showing registry stats for that skill
- [x] Hovering over a skill name in the Inventory section displays the same tooltip
- [x] Tooltip displays: action type, tick cost, range, and only present optional stats (damage if defined, healing if defined, distance if defined, cooldown if defined, behaviors if non-empty). Absent stats are omitted, not shown as empty.
- [x] Tooltip appears after a 150ms hover delay (prevents flicker when traversing the skill list)
- [x] Tooltip disappears when mouse leaves the skill name (no leave delay — tooltip is non-interactive)
- [x] Focusing the skill name via keyboard also shows the tooltip (WCAG 2.2 SC 1.4.13 compliance)
- [x] Tooltip uses portal rendering (`createPortal` to `document.body`) to escape `overflow-y: auto` clipping on `.content`
- [x] Tooltip positions below the skill name by default; flips above if insufficient space below. Horizontally clamped to viewport bounds with 8px margin.
- [x] Tooltip follows the project's visual design system (monospace font, terminal overlay tokens, compact density, `var(--radius-lg)` border radius, `0 4px 12px rgba(0,0,0,0.3)` box-shadow)
- [x] Tooltip is accessible (`role="tooltip"`, `id` linked via `aria-describedby` on the skill name element)
- [x] A shared `SkillNameWithTooltip` component encapsulates the behavior, used in both SkillRow and PriorityTab inventory

## Current Phase

SYNC_DOCS → COMPLETE (all documentation updated)

## Phase History

- 2026-02-09 INIT → EXPLORE
- 2026-02-09 EXPLORE → COMPLETE (findings in `.tdd/exploration.md`)
- 2026-02-09 PLAN → COMPLETE (plan in `.tdd/plan.md`)
- 2026-02-09 DESIGN_TESTS → COMPLETE (14 tests designed in `.tdd/test-designs.md`)
- 2026-02-09 REVIEW_TESTS → COMPLETE (15 tests: added Escape key dismissal test for WCAG compliance)
- 2026-02-09 WRITE_TESTS → COMPLETE (15 tests implemented in SkillNameWithTooltip.test.tsx, 372 lines)
- 2026-02-09 IMPLEMENT → COMPLETE (component, CSS module, integrations, all 15 tests pass)

## Context Metrics

Orchestrator: ~15K/300K (5%)
Cumulative agent tokens: ~297K
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent             | Phase        | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                     |
| --- | ----------------- | ------------ | --------- | ------ | ----- | -------- | -------- | ----------------------------------------------------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE      | 8         | ~28K   | 24    | 191s     | COMPLETE | CharacterTooltip removed but pattern docs remain; Kick damage:0 edge case                 |
| 2   | tdd-planner       | PLAN         | 5         | ~35K   | 16    | 138s     | COMPLETE | Resolved 5 open questions; no new ADRs needed                                             |
| 3   | tdd-test-designer | DESIGN_TESTS | 4         | ~35K   | 12    | -        | COMPLETE | 14 tests designed (12 from requirements + 2 supplementary)                                |
| 4   | tdd-reviewer      | REVIEW_TESTS | 4         | ~20K   | 12    | -        | COMPLETE | All 11 ACs covered; added Test 15 (Escape key WCAG); all registry data verified           |
| 5   | tdd-coder         | WRITE_TESTS  | 5         | ~40K   | 13    | 110s     | COMPLETE | 15 tests, 372 lines, all fail on import (RED confirmed)                                   |
| 6   | tdd-coder         | IMPLEMENT    | 18        | ~100K  | 45    | -        | COMPLETE | Component + CSS + integrations; fakeTimers config fix; all 15 pass                        |
| 7   | tdd-reviewer      | REVIEW       | 5         | ~25K   | 18    | 100s     | COMPLETE | PASS: 0 critical, 0 important, 2 minor (dead CSS class, stale pattern doc)                |
| 8   | tdd-doc-syncer    | SYNC_DOCS    | 4         | ~16K   | 16    | 99s      | COMPLETE | Updated current-task, architecture, spec, skill-row visual spec, priority-tab visual spec |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- CharacterTooltip was removed in commit 7a4db95 -- no live tooltip code exists, but pattern docs and visual specs remain as reference
- Portal rendering confirmed mandatory: CharacterPanel .panel has overflow:hidden and .content has overflow-y:auto
- Two consumption sites identified: SkillRow line 188 (<h3>) and PriorityTab line 100 (<span>) with different wrapper elements
- Kick skill has damage:0 -- edge case for tooltip display logic

#### #2 tdd-planner (PLAN)

- All tooltip code confirmed removed — building from scratch with pattern docs as reference
- Resolved 5 open questions from exploration: damage:0 display, h3 wrapping, focusability, tooltip width, stats format
- No new ADRs needed — plan aligns with ADR-004 (local state) and ADR-005 (skill registry)
- Existing test impact assessed as low risk

#### #3 tdd-test-designer (DESIGN_TESTS)

- Designed 14 tests: 10 unit tests for component behavior, 2 integration tests (SkillRow + PriorityTab), 2 supplementary (graceful degradation + timer cleanup)
- Uses real skill IDs from SKILL_REGISTRY -- no mocking needed
- Fake timers with act() for 150ms delay testing
- Portal rendering works in jsdom by default -- no special setup
- Key edge case: Test 6 validates damage:0 display for Kick (catches `if (damage)` vs `if (damage !== undefined)` bug)
- Positioning tests intentionally excluded (jsdom returns zeros for getBoundingClientRect)

#### #4 tdd-reviewer (REVIEW_TESTS)

- All 11 acceptance criteria mapped to tests -- full coverage confirmed
- All 6 skill registry entries verified against actual SKILL_REGISTRY data -- all values correct
- Added Test 15: Escape key dismissal (WCAG 2.2 SC 1.4.13 constraint from requirements)
- No redundancy found, no tests removed
- Timer handling, accessibility assertions, integration setup all validated as correct
- Positioning deferral to browser tests confirmed as appropriate

#### #5 tdd-coder (WRITE_TESTS)

- Clean run

#### #6 tdd-coder (IMPLEMENT)

- Created SkillNameWithTooltip.tsx (155 lines) with portal-rendered tooltip, 150ms delay, keyboard support, Escape dismissal
- Created SkillNameWithTooltip.module.css (47 lines) with design system tokens
- Integrated into SkillRow.tsx (import + skill name wrapping)
- Integrated into PriorityTab.tsx (import + inventory skill name wrapping)
- Fixed fakeTimers compatibility: added `fakeTimers: { shouldAdvanceTime: true }` to vite.config.ts unit test project — required for userEvent.hover() to work with vi.useFakeTimers()
- Added eslint-disable for @typescript-eslint/require-await in test file (act() async callbacks are a standard Testing Library pattern)
- All 15 tests pass, full suite (1452 tests) passes, type-check passes, lint passes
- Browser verified: tooltips appear on hover in both SkillRow and Inventory contexts

#### #7 tdd-reviewer (REVIEW)

- Clean run — PASS verdict with 0 critical, 0 important issues
- 2 minor issues: dead .anchor CSS class (unused), stale pattern doc (out of scope)

#### #8 tdd-doc-syncer (SYNC_DOCS)

- Clean run

## Files Touched

- `.tdd/test-designs.md` (created)
- `.tdd/session.md` (updated)
- `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx` (created, 372 lines, 15 tests; eslint-disable added)
- `src/components/CharacterPanel/SkillNameWithTooltip.tsx` (created, 155 lines)
- `src/components/CharacterPanel/SkillNameWithTooltip.module.css` (created, 47 lines)
- `src/components/CharacterPanel/SkillRow.tsx` (modified: import + SkillNameWithTooltip wrapping, 307 lines)
- `src/components/CharacterPanel/PriorityTab.tsx` (modified: import + SkillNameWithTooltip wrapping, 105 lines)
- `vite.config.ts` (modified: added fakeTimers config, 62 lines)

## Browser Verification

Status: VERIFIED

- Tooltip appears on hover over "Move" skill name in SkillRow: shows Action (move), Tick Cost (1 ticks), Range (1), Distance (1), Cooldown (1 ticks), Behaviors (towards, away)
- Tooltip appears on hover over "Light Punch" in Inventory: shows Action (attack), Tick Cost (0 ticks), Range (1), Damage (10)
- No console errors
- Styling matches design system (monospace font, compact density, proper token usage)

## Human Approval

Status: APPROVED (with cleanup of both minor issues: dead .anchor CSS class + stale pattern doc)

## Blockers

(none)

## Review Cycles

Count: 1

### Review 1 (2026-02-10)

**Verdict**: PASS (0 CRITICAL, 0 IMPORTANT, 2 MINOR)

- MINOR: Dead CSS class `.anchor` defined but unused
- MINOR: Stale portal tooltip pattern doc (out of scope)
- All 11 acceptance criteria met
- All quality gates pass (1452 tests, type-check, lint)
