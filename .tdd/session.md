# TDD Session

## Task

Two-State Trigger Model: Replace the current "always-present scope + condition" trigger UI with a two-state model where triggers are either absent (unconditional) or present (conditional). Remove "Always" as a dropdown option. Condition-scoped scope dropdown. Hide selector/filter when target=self.

## Confirmed Scope

UI-only changes to TriggerDropdown.tsx (two-state model + condition-scoped scopes), SkillRow.tsx (conditional rendering of selector/filter for target=self), new CONDITION_SCOPE_RULES constant. No engine, type, or store action changes. Visual spec update.

## Acceptance Criteria

- [x] Skills default to no trigger (unconditional). No trigger dropdowns render -- only a `+ Condition` ghost button in the trigger area
- [x] Clicking `+ Condition` activates the trigger: condition dropdown appears with a sensible default (e.g., `in_range`), scope dropdown appears if the condition requires one, and a `x` remove button appears
- [x] Clicking `x` removes the trigger entirely, returning to the unconditional `+ Condition` state. Negated flag resets to false
- [x] "Always" is NOT an option in the condition dropdown. The 7 remaining conditions are: `in_range`, `hp_below`, `hp_above`, `channeling`, `idle`, `targeting_me`, `targeting_ally`
- [x] The store representation: a skill with no trigger has `trigger: { scope: "enemy", condition: "always" }` (unchanged wire format). The UI interprets `condition: "always"` as "no trigger" and renders the `+ Condition` button
- [x] Adding a condition via `+ Condition` sets the trigger to a non-always condition in the store. Removing via `x` sets it back to `{ scope: "enemy", condition: "always" }`
- [x] Each condition defines which scopes are valid and whether the scope dropdown is shown at all (per CONDITION_SCOPE_RULES table)
- [x] When the condition changes, if the current scope is not in the new condition's valid scopes, reset scope to the first valid scope for that condition
- [x] When scope dropdown is hidden (implied scope), the store still holds the correct scope value
- [ ] AND trigger follows the same condition-scoped scope rules (deferred -- no data model support)
- [x] NOT toggle still works: appears when trigger is active, toggles `negated` flag
- [x] Value input still appears for `in_range`, `hp_below`, `hp_above`
- [x] Qualifier select still appears for `channeling` condition
- [x] Trigger evaluation engine is UNCHANGED
- [x] Skills loaded from existing state with `condition: "always"` render as unconditional
- [x] Filter controls and filter behavior are UNCHANGED
- [x] When target is set to `self`, the SELECTOR dropdown and its fieldGroup are hidden
- [x] When target is set to `self`, the FILTER section is hidden entirely
- [x] When target changes FROM `self` to `enemy`/`ally`, selector and filter controls reappear with prior configuration
- [x] Skills from the registry with `defaultTrigger` (non-always) render with trigger active on assignment
- [x] Skills with no `defaultTrigger` or `{ condition: "always" }` render with `+ Condition` button
- [x] Manually removing a default trigger (clicking `x`) works

## Current Phase

EXPLORE (COMPLETE) -> PLAN (COMPLETE) -> DESIGN_TESTS (COMPLETE) -> TEST_DESIGN_REVIEW (COMPLETE) -> WRITE_TESTS (COMPLETE) -> IMPLEMENT (COMPLETE) -> REVIEW (COMPLETE) -> SYNC_DOCS (COMPLETE)

## Phase History

- 2026-02-12T00:00 INIT -> EXPLORE
- 2026-02-12 EXPLORE COMPLETE. Findings in .tdd/exploration.md.
- 2026-02-12 PLAN COMPLETE. Plan in .tdd/plan.md.
- 2026-02-12 DESIGN_TESTS COMPLETE. Test designs in .tdd/test-designs.md. 14 TriggerDropdown tests + 6 SkillRow tests + 12 existing test update docs.
- 2026-02-12 TEST_DESIGN_REVIEW COMPLETE. Added 3 new tests, 1 missing breaking test entry, minor corrections. Approved.
- 2026-02-12 WRITE_TESTS COMPLETE. 3 new test files created (17+10+6=33 new tests), 4 existing test files updated (12 tests modified). 25 tests failing (RED), 1494 passing. TypeScript and ESLint clean.
- 2026-02-12 IMPLEMENT COMPLETE. 3 source files modified, 4 additional upstream test files fixed (plan gap). All 1519 tests passing, TypeScript clean, ESLint clean.

## Context Metrics

Orchestrator: ~15K/300K (~5%)
Cumulative agent tokens: ~309K
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent             | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                |
| --- | ----------------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| 1   | tdd-explorer      | EXPLORE            | 6         | ~27K   | 35    | ~3min    | COMPLETE | Ghost button CSS exists unused; AND trigger deferred; 6-8 tests will break                           |
| 2   | tdd-planner       | PLAN               | 7         | ~38K   | 20    | ~4min    | COMPLETE | 9 breaking tests identified across 3 files; 2 new test files planned; CONDITION_SCOPE_RULES designed |
| 3   | tdd-test-designer | DESIGN_TESTS       | 5         | ~35K   | 16    | ~3.5min  | COMPLETE | 14+6 tests designed, 12 existing test updates documented, all 20 AC covered                          |
| 4   | tdd-reviewer      | TEST_DESIGN_REVIEW | 5         | ~18K   | 18    | ~3min    | COMPLETE | +3 tests, +1 breaking test entry, approved                                                           |
| 5   | tdd-coder         | WRITE_TESTS        | 12        | ~45K   | 30    | ~5min    | COMPLETE | 3 new test files, 4 updated test files, 25 failing/1494 passing                                      |
| 6   | tdd-coder         | IMPLEMENT          | 14        | ~100K  | 35    | ~8min    | COMPLETE | 3 source files, 4 upstream test fixes; all 1519 tests green                                          |
| 7   | tdd-reviewer      | REVIEW             | 7         | ~28K   | 25    | ~2.5min  | COMPLETE | APPROVED, 0 critical issues, 21/22 AC met (1 deferred)                                               |
| 8   | tdd-doc-syncer    | SYNC_DOCS          | 4         | ~18K   | 16    | ~2.5min  | COMPLETE | Updated visual-specs, spec.md, current-task.md, architecture.md                                      |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- Ghost button CSS (.addTriggerBtn) already exists in SkillRow.module.css but is unused in TSX
- AND trigger deferred -- no data model support (Skill.trigger is single Trigger field)
- 6-8 existing TriggerDropdown tests will break due to always->ghost button change
- FilterControls.tsx is direct pattern reference for two-state model
- Selector currently only disabled for target=self, not hidden -- new implementation needed

#### #2 tdd-planner (PLAN)

- Identified exactly 12 breaking tests across 3 test files
- CONDITION_SCOPE_RULES designed with 7 entries covering all non-always conditions
- Ghost button CSS needs own .addConditionBtn in TriggerDropdown.module.css (CSS module isolation)
- SkillRow.test.tsx already at 686 lines -- new target=self tests go in separate file

#### #3 tdd-test-designer (DESIGN_TESTS)

- Clean run

#### #4 tdd-reviewer (TEST_DESIGN_REVIEW)

- Added `idle` scope test (was the only showScope:true condition without a dedicated test)
- Added condition-change-to-implied-scope test (plan item 12 missing from designs)
- Added scope-preservation-when-valid test (plan item 13 missing from designs)
- Found missing breaking test: "hides remove button when onRemove not provided" will break because primary trigger now has `x` remove button
- All other test designs verified correct against codebase patterns and requirements

#### #5 tdd-coder (WRITE_TESTS)

- Split TriggerDropdown-two-state.test.tsx into two files (two-state 238 lines + scope-rules 256 lines) to stay under 400-line limit
- 4 new tests already pass against current implementation (hp_below scope, scope preservation, value input visibility, default trigger rendering)

#### #6 tdd-coder (IMPLEMENT)

- Plan gap: 4 upstream test files broke that were not identified in the plan (CharacterPanel.test.tsx, PriorityTab-config.test.tsx, PriorityTab-battle.test.tsx, PriorityTab-evaluation.test.tsx)
- Fixed 8 test assertions across 4 upstream files: combobox queries -> ghost button queries, criterion disabled -> criterion hidden
- Added `liveSkill` store subscription to SkillRow for dynamic target changes (self -> enemy transitions)
- `liveSkill` only used for target conditional; original `skill` prop still passed to FilterControls to avoid stale store state in unit tests

#### #7 tdd-reviewer (REVIEW)

- Clean run — APPROVED with 0 critical/important issues
- 2 minor observations: unused .addTriggerBtn CSS class in SkillRow.module.css, visual-spec update deferred to doc-syncer

## Files Touched

- .tdd/session.md (created, updated)
- .tdd/requirements.md (pre-existing)
- .tdd/exploration.md (created)
- .tdd/plan.md (created)
- .tdd/test-designs.md (created)
- src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx (CREATED - 238 lines, 8 tests)
- src/components/CharacterPanel/TriggerDropdown-scope-rules.test.tsx (CREATED - 256 lines, 10 tests)
- src/components/CharacterPanel/SkillRow-target-self.test.tsx (CREATED - 187 lines, 6 tests)
- src/components/CharacterPanel/TriggerDropdown.test.tsx (UPDATED - 392 lines, 9 tests modified)
- src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx (UPDATED - 157 lines, 1 test rewritten)
- src/components/CharacterPanel/SkillRow.test.tsx (UPDATED - 686 lines, 2 tests modified)
- **src/components/CharacterPanel/TriggerDropdown.tsx** (MODIFIED - 229 lines) -- two-state model + CONDITION_SCOPE_RULES
- **src/components/CharacterPanel/TriggerDropdown.module.css** (MODIFIED - 77 lines) -- .addConditionBtn ghost button styles
- **src/components/CharacterPanel/SkillRow.tsx** (MODIFIED - 297 lines) -- target=self hides selector/filter, liveSkill store sub
- src/components/CharacterPanel/CharacterPanel.test.tsx (UPDATED - 153 lines) -- combobox -> ghost button query
- src/components/CharacterPanel/PriorityTab-config.test.tsx (UPDATED - 315 lines) -- ghost button, criterion hidden
- src/components/CharacterPanel/PriorityTab-battle.test.tsx (UPDATED - 373 lines) -- combobox -> ghost button query
- src/components/CharacterPanel/PriorityTab-evaluation.test.tsx (UPDATED - 99 lines) -- combobox -> ghost button query

## Browser Verification

Status: HUMAN_VERIFY PASSED (manual verification)

## Human Approval

Status: APPROVED

## Blockers

(none)

## Review Cycles

Count: 1

### Review #1 -- APPROVED

- Critical issues: 0
- Important issues: 0
- Minor observations: 2 (unused CSS class, visual-spec update deferred to doc-syncer)
- All quality gates: PASS (1519 tests, TypeScript clean, ESLint clean)
- Verdict: APPROVED -- ready for commit
