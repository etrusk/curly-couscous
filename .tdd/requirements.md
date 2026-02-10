# TDD Spec: Add stacked labels above SkillRow dropdowns

Created: 2026-02-10

## Goal

SkillRow displays a horizontal sequence of unlabeled `<select>` elements — the trigger scope ("Enemy"), trigger condition ("Always"), target ("Enemy"), and criterion ("Lowest HP") are visually identical with no indication of what each controls. Add tiny stacked text labels above each control group so users can tell at a glance what each dropdown configures.

## Acceptance Criteria

- [ ] A visible text label "TRIGGER" appears above the trigger scope dropdown in config mode
- [ ] A visible text label "TARGET" appears above the target select in config mode
- [ ] A visible text label "SELECTOR" appears above the criterion select in config mode
- [ ] A visible text label "FILTER" appears above the filter group (both the active filter controls and the "+ Filter" button) in config mode
- [ ] Each label + control group is wrapped in a vertical stack (label on top, controls below)
- [ ] Labels use `0.6rem`, weight `600`, `--text-secondary`, uppercase, `letter-spacing: 0.05em`
- [ ] Labels are present in both config mode and battle mode
- [ ] Battle mode labels scale down consistently with the existing `.battleMode` compact sizing
- [ ] Minimal additional row height (~10-12px for the label text above controls)
- [ ] Labels have no impact on existing `aria-label` attributes (screen reader labels unchanged)
- [ ] Behavior select (only shown for multi-behavior skills like Move/Dash) does NOT get a separate label — it sits within the target/criterion group and is self-evident from its content ("Towards"/"Away")

## Approach

Wrap each control group (trigger, target, criterion, filter) in a small vertical flex container with a `<span>` label on top and the control(s) below. Extract a `.fieldLabel` class for the label and a `.fieldGroup` wrapper class. Each wrapper uses `display: inline-flex; flex-direction: column;` to stack label above controls. Adds minimal row height for the tiny label text.

## Scope Boundaries

- In scope: `SkillRow.tsx`, `SkillRow.module.css`, `TriggerDropdown.tsx` (if trigger label lives inside it), `TriggerDropdown.module.css`, `.docs/visual-specs/skill-row.md` (update)
- Out of scope: Game logic, store changes, new components, PriorityTab layout, inventory section, tooltip changes

## Assumptions

- "SELECTOR" is the confirmed label for the criterion select (human override of original "PICK" proposal).
- Labels appear unconditionally (not hidden/revealed on hover) since they are passive text, not controls. This is consistent with skill names and other static text in the row.

## Constraints

- Density principle relaxed: minimal vertical space added (~10-12px) for stacked labels (ui-ux-guidelines.md principle #1)
- Must use opacity-based text hierarchy: labels at `--text-secondary` (ui-ux-guidelines.md principle #3)
- Must use `--font-mono` (inherited from row, no extra declaration needed)
- Typography tier: `0.6rem` micro label (below the `0.75rem` badge/small tier)
- Lesson 003: verify label styling renders correctly across dark/light/high-contrast themes
