# TDD Session

## Task

Skill Expansion UI Gaps — Filter Conditions, Filter NOT, Qualifier Selector

## Confirmed Scope

Expose remaining unified condition system features in the UI: expand filter dropdown to all 7 conditions, add filter NOT toggle, add qualifier selector for `channeling` condition in both triggers and filters. All changes are UI-only — engine types and evaluation logic already complete. Targets: `SkillRow.tsx`, `TriggerDropdown.tsx`, their CSS modules and test files.

## Acceptance Criteria

### A. Filter Condition Dropdown Expansion

- [ ] Filter `<select>` includes all 7 filterable conditions: `hp_below`, `hp_above`, `in_range`, `channeling`, `idle`, `targeting_me`, `targeting_ally`
- [ ] Selecting `channeling`, `idle`, `targeting_me`, or `targeting_ally` hides the numeric `<input>` (these conditions take no value)
- [ ] Selecting `in_range`, `hp_below`, or `hp_above` shows the numeric `<input>` (these conditions require a value)
- [ ] `in_range` defaults to `conditionValue: 3` when selected; `hp_below`/`hp_above` default to `50`
- [ ] `+ Filter` button defaults to `{ condition: "hp_below", conditionValue: 50 }` (unchanged)
- [ ] Switching from a value condition to a non-value condition clears `conditionValue` from the stored filter
- [ ] Switching from a non-value condition to a value condition sets the appropriate default value

### B. Filter NOT Toggle

- [ ] A NOT toggle button appears in the filter group when a filter is active
- [ ] Toggle sets/clears `filter.negated` on the skill via the existing `updateSkill` store action
- [ ] Button uses same visual pattern as trigger NOT toggle: `styles.notToggle` / `styles.notToggleActive` (from `TriggerDropdown.module.css` or equivalent shared style)
- [ ] `aria-label="Toggle NOT modifier for filter on {skillName}"` and `aria-pressed` attributes present
- [ ] NOT toggle is not shown when no filter is set (only the `+ Filter` ghost button is visible)

### C. Qualifier Selector (Triggers and Filters)

- [ ] When trigger condition is `channeling`, an optional qualifier dropdown appears in the TriggerDropdown component
- [ ] When filter condition is `channeling`, an optional qualifier dropdown appears in the filter group
- [ ] Qualifier dropdown has options: `(any)` (no qualifier), `action:attack`, `action:move`, `action:heal`, `action:interrupt`, `action:charge`, plus skill IDs from the skill registry (`skill:light-punch`, `skill:heavy-punch`, `skill:ranged-attack`, `skill:heal`, `skill:kick`, `skill:dash`, `skill:charge`, `skill:move-towards`)
- [ ] Selecting `(any)` removes the `qualifier` field from the trigger/filter
- [ ] Selecting an action/skill qualifier sets `qualifier: { type: "action"|"skill", id: "<value>" }` on the trigger/filter
- [ ] Qualifier dropdown hidden when condition is not `channeling`
- [ ] Switching away from `channeling` clears any existing qualifier

## Current Phase

COMMIT

## Phase History

- 2026-02-11 INIT → EXPLORE
- 2026-02-11 EXPLORE COMPLETE (7 exchanges, ~25K tokens, 22 tool calls, 16 files read)
- 2026-02-11 PLAN COMPLETE (5 exchanges, ~35K tokens, 16 tool calls, 15 files read)
- 2026-02-11 DESIGN_TESTS COMPLETE (5 exchanges, ~35K tokens, 14 tool calls, 14 files read)
- 2026-02-11 ANALYZE_FIX COMPLETE (4 exchanges, ~25K tokens, 10 tool calls, 8 files read)

## Context Metrics

Orchestrator: ~65K/300K (~22%)
Cumulative agent tokens: ~380K
Agent invocations: 11
Compactions: 0

### Agent History

| #   | Agent             | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                         |
| --- | ----------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE            | 7         | ~28K   | 22    | 147s     | COMPLETE | All engine types ready; 16 files read                                                                         |
| 2   | tdd-planner       | PLAN               | 5         | ~35K   | 16    | 152s     | COMPLETE | QualifierSelect extraction recommended; 24 tests planned                                                      |
| 3   | tdd-test-designer | DESIGN_TESTS       | 5         | ~35K   | 14    | -        | COMPLETE | 24 tests across 3 files; store interaction patterns documented                                                |
| 4   | tdd-reviewer      | TEST_DESIGN_REVIEW | 4         | ~18K   | 14    | -        | COMPLETE | 3 corrections applied; all 19 acceptance criteria covered                                                     |
| 5   | tdd-coder         | WRITE_TESTS        | 10        | ~45K   | 22    | 432s     | COMPLETE | 24 tests written; 18 fail (RED), 6 pass (existing behavior); no regressions                                   |
| 6   | tdd-coder         | IMPLEMENT          | 12        | ~85K   | 35    | -        | COMPLETE | All 29 tests pass (GREEN); QualifierSelect extracted; filterOverride state for test reactivity                |
| 7   | tdd-reviewer      | REVIEW             | 5         | ~28K   | 21    | 132s     | COMPLETE | 2 critical: negated drop on value change, 429 lines > 400 limit                                               |
| 8   | tdd-analyzer      | ANALYZE_FIX        | 4         | ~25K   | 10    | -        | COMPLETE | Root causes identified; fix plan: spread fix for C1, FilterControls extraction for C2, regression test for C1 |
| 9   | tdd-coder         | FIX                | 10        | ~35K   | 24    | 224s     | COMPLETE | Both criticals fixed; FilterControls extracted (177 lines); SkillRow 286 lines; 1482 tests pass               |
| 10  | tdd-reviewer      | REVIEW             | 5         | ~28K   | 18    | 107s     | COMPLETE | APPROVED; all 19 criteria pass; no new issues from extraction                                                 |
| 11  | tdd-doc-syncer    | SYNC_DOCS          | 4         | ~18K   | 16    | 148s     | COMPLETE | Updated 5 docs: current-task, spec, visual-specs, architecture, decisions                                     |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- Clean run

#### #2 tdd-planner (PLAN)

- Identified SkillRow.tsx will exceed 400 lines; recommended QualifierSelect extraction
- Test files split to stay under 400-line limit

#### #3 tdd-test-designer (DESIGN_TESTS)

- 24 tests designed across 3 files (A1-A6, B1-B6, C1-C6, D1-D6)
- Documented store interaction pattern for SkillRow tests (initBattle + getState)
- Identified qualifier option name collisions (Heal, Charge, Move appear as both action types and skill names)
- No fake timers needed; Lesson 004 does not apply
- Noted D6 re-render limitation for controlled component DOM assertions

#### #4 tdd-reviewer (TEST_DESIGN_REVIEW)

- Mapped all 19 acceptance criteria (A1-A7, B1-B5, C1-C7) to tests -- all covered
- Fixed D4: changed `skill:kick` to `skill:light-punch` to exercise hyphenated ID parsing in `split(":")`
- Fixed D6: removed DOM visibility assertion 4 (controlled component cannot re-render without parent)
- Fixed C3: replaced ambiguous name-based queries with value-based approach for duplicate display names (Heal, Charge, Move)
- Confirmed A5 criterion ("+ Filter button defaults unchanged") needs no new test (existing behavior, not modified)
- Validated all test patterns match existing codebase conventions (store setup, render helpers, query patterns)

#### #5 tdd-coder (WRITE_TESTS)

- Clean run

#### #6 tdd-coder (IMPLEMENT)

- Created QualifierSelect.tsx shared component for channeling qualifier dropdown
- Expanded filter dropdown from 2 to 7 conditions in SkillRow.tsx
- Added FILTER_VALUE_CONDITIONS set and getFilterDefaultValue for value/non-value toggling
- Rewrote handleFilterTypeChange to properly set defaults and preserve negated
- Added NOT toggle button with duplicated CSS from TriggerDropdown.module.css
- Added qualifier dropdown to both filter (SkillRow) and trigger (TriggerDropdown)
- Used filterOverride local state pattern to ensure DOM reactivity after store mutations in isolated test contexts
- All 1481 tests pass; lint and type-check clean

#### #7 tdd-reviewer (REVIEW)

- C1: handleFilterValueChange drops negated/qualifier fields on value change (data-loss bug)
- C2: SkillRow.tsx at 429 lines exceeds 400-line project limit
- 17/19 acceptance criteria pass; B2 partially affected by C1

#### #8 tdd-analyzer (ANALYZE_FIX)

- C1 root cause: manual object construction on line 123 instead of spread; fix is `{ ...currentFilter!, conditionValue: parsed }`
- C1-test: add regression test in SkillRow-filter.test.tsx for value change preserving negated
- C2 root cause: filter handlers + JSX + constants + local state = 116 lines of filter-specific code in SkillRow
- C2 fix: extract FilterControls.tsx (~100 lines), bringing SkillRow to ~318 lines
- Fix plan written to `.tdd/fix-plan.md`

#### #9 tdd-coder (FIX)

- C1: replaced manual object construction with spread on handleFilterValueChange (1-line fix)
- C1-test: added regression test "changing filter value preserves negated flag" in SkillRow-filter.test.tsx
- C2: extracted FilterControls.tsx (177 lines) from SkillRow.tsx; SkillRow now 286 lines
- Removed isBattleMode prop (unused in FilterControls, would cause TS6133 error)
- All 1482 tests pass; lint clean; type-check clean

## Files Touched

- `src/components/CharacterPanel/SkillRow.tsx` (modified, 286 lines -- extracted filter code to FilterControls)
- `src/components/CharacterPanel/FilterControls.tsx` (new, 177 lines -- extracted from SkillRow)
- `src/components/CharacterPanel/SkillRow.module.css` (modified, 314 lines -- added notToggle CSS)
- `src/components/CharacterPanel/TriggerDropdown.tsx` (modified, 139 lines)
- `src/components/CharacterPanel/QualifierSelect.tsx` (new, 55 lines)
- `src/components/CharacterPanel/SkillRow-filter.test.tsx` (modified, 302 lines -- added regression test)
- `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` (new, 336 lines)
- `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx` (new, 123 lines)

## Browser Verification

Status: HUMAN_VERIFIED (user confirmed UI looks correct)

## Human Approval

Status: APPROVED (verified via HUMAN_VERIFY)

## Blockers

(none)

## Review Cycles

Count: 2

### Review 1 (2026-02-11)

Verdict: CHANGES REQUESTED

- CRITICAL x2: (C1) handleFilterValueChange drops negated/qualifier fields; (C2) SkillRow.tsx at 429 lines exceeds 400-line limit
- NON-BLOCKING x3: CSS duplication intentional, VALUE_CONDITIONS duplication intentional, QualifierSelect indexOf parsing is robust
- Quality gates: all PASS (1481 tests, lint clean, type-check clean)
- See `.tdd/review-findings.md` for details

### Review 2 (2026-02-11)

Verdict: APPROVED

- C1 FIXED: handleFilterValueChange uses spread operator, preserves negated/qualifier
- C2 FIXED: SkillRow.tsx at 286 lines, FilterControls.tsx at 177 lines (both under 400)
- Regression test added: "changing filter value preserves negated flag" in SkillRow-filter.test.tsx
- All 19 acceptance criteria PASS
- No new issues introduced by extraction
- Quality gates: all PASS (1482 tests, lint clean, type-check clean)
- Browser verification recommended (structural change, no visual change)
