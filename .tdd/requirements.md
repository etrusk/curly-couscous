# TDD Spec: Fix SkillRow grid overflow for complex trigger/filter conditions

Created: 2026-02-13

## Goal

Fix the SkillRow grid layout overflow that occurs when trigger and/or filter columns contain complex conditions (e.g., Channeling with qualifier). The root cause is CSS `auto` grid tracks enforcing `min-width: auto`, preventing columns 6-9 from shrinking below their content's intrinsic minimum size. The `1fr` spacer collapses first, then content overflows into adjacent columns.

## Acceptance Criteria

- [ ] Columns 6-9 (trigger, target, selector, filter) use `minmax(0, auto)` instead of `auto` in both config and battle mode grid templates
- [ ] `.triggerControl` (TriggerDropdown.module.css) has `flex-wrap: wrap` so trigger controls wrap to a second line when column is constrained
- [ ] `.filterGroup` (SkillRow.module.css) has `flex-wrap: wrap` so filter controls wrap to a second line when column is constrained
- [ ] Visual verification: trigger with "NOT Enemy Channeling (any)" does not overflow into adjacent columns
- [ ] Visual verification: filter with "NOT Channeling (any)" does not overflow into adjacent columns
- [ ] Visual verification: both trigger AND filter set to Channeling with qualifiers simultaneously renders without overflow
- [ ] No regressions: simple trigger/filter conditions (e.g., "In range 1", "HP below 50") still render on a single line without unnecessary wrapping
- [ ] `.docs/visual-specs/skill-row.md` grid template documentation updated to reflect `minmax(0, auto)` for columns 6-9

## Approach

Change grid track sizing for columns 6-9 from `auto` to `minmax(0, auto)` in both `.skillRow` and `.skillRow.battleMode` grid templates. Add `flex-wrap: wrap` to `.triggerControl` and `.filterGroup` containers so their inline-flex children wrap gracefully when the grid column shrinks. No panel width changes needed.

## Scope Boundaries

- In scope: `SkillRow.module.css` (grid templates + filterGroup), `TriggerDropdown.module.css` (triggerControl), `.docs/visual-specs/skill-row.md`, `.docs/ui-ux-guidelines.md` (Interactive Row snippet)
- Out of scope: panel width ratios in `App.css`, battle mode column 10 (already `minmax(0, auto)`), any refactoring of trigger/filter components

## Assumptions

- The existing `flex-wrap: wrap` on `.triggerGroup` is sufficient for wrapping multiple TriggerDropdown instances; only `.triggerControl` (individual trigger controls) needs wrapping added
- Wrapped controls in a two-line layout will be visually acceptable at typical viewport widths (1400px+); if not, a complementary panel widen can be considered separately

## Constraints

- Lesson #003 (verify CSS variable semantics across themes): verify the fix renders correctly in dark theme (primary dev theme)
- Keep changes minimal — this is a targeted CSS fix, not a layout redesign
- Column 10 (behavior) already uses `minmax(0, auto)` — this change makes columns 6-9 consistent with it
