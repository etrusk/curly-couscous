# TDD Spec: Skill Expansion UI Gaps — Filter Conditions, Filter NOT, Qualifier Selector

Created: 2026-02-11

## Goal

Expose the remaining unified condition system features in the UI. The engine already supports all condition types, qualifiers, and negation for both triggers and filters — but the filter dropdown only offers `hp_below`/`hp_above`, has no NOT toggle, and neither triggers nor filters expose qualifier selection for the `channeling` condition. These three gaps prevent users from configuring skills like Kick (`filter: channeling`) or precise interrupts (`channeling skill:heal`) without editing data directly.

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

## Approach

Extend existing SkillRow.tsx filter section and TriggerDropdown.tsx with the missing controls. Reuse the trigger's NOT toggle styling for the filter NOT toggle. Add a new qualifier `<select>` that conditionally renders when condition is `channeling`. Qualifier options are built from the action type union (hardcoded: attack, move, heal, interrupt, charge) plus skill registry IDs (imported from `SKILL_REGISTRY`). All changes are UI-only — the engine types and evaluation logic are already complete.

## Scope Boundaries

- In scope: `SkillRow.tsx` (filter section), `TriggerDropdown.tsx` (qualifier dropdown), `SkillRow.module.css` / `TriggerDropdown.module.css` (styling), and their test files
- Out of scope: Engine types, condition evaluation, skill registry, resolution logic, starter templates, visual-specs updates (update after implementation verified)

## Assumptions

- The `(any)` option for qualifiers is sufficient — no need for a separate "clear qualifier" button
- Qualifier options use a single flat `<select>` with optgroups for "Action Type" and "Skill" rather than two separate dropdowns (simpler, fits pattern of native `<select>` per ui-ux-guidelines anti-pattern "Create custom dropdown components → Use native `<select>`")
- Skill registry IDs are stable enough to import directly for the qualifier option list
- Filter NOT toggle can reuse TriggerDropdown's CSS classes directly (or duplicate them to `SkillRow.module.css` if CSS module scoping requires it)

## Constraints

- Follow `ui-ux-guidelines.md`: native `<select>` elements, `--font-mono`, compact spacing, design tokens from `theme.css`
- Follow `visual-specs/skill-row.md`: filter group is grid column 9, all styling consistent with existing filter controls
- Lesson 003: Verify CSS variables resolve correctly in dark theme
- Lesson 004: Tests using `userEvent` must account for `shouldAdvanceTime` if `fakeTimers` are in use
- All new controls need `aria-label` attributes per existing accessibility patterns
