# Exploration Findings

## Task Understanding

Add stacked text labels ("TRIGGER", "TARGET", "SELECTOR", "FILTER") above each control group in SkillRow so users can tell at a glance what each dropdown configures. Labels use `0.6rem`, weight `600`, `--text-secondary`, uppercase, `letter-spacing: 0.05em`. Labels appear in both config and battle modes. Each label + control group is wrapped in a vertical flex container. Behavior select does NOT get a separate label.

## Relevant Files

### Source files to modify

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` - Main component. Contains the horizontal flex row with all control groups. Lines 227-234 render trigger group, lines 236-245 render target select, lines 247-259 render criterion select, lines 261-295 render filter group (active filter or "+ Filter" button), lines 297-310 render behavior select (conditional). Each of these sections needs a wrapper div with a label span above.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` - CSS module for SkillRow. Currently 245 lines. Needs `.fieldGroup` and `.fieldLabel` classes, plus `.battleMode .fieldLabel` variant for compact sizing.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` - The "TRIGGER" label could live either in SkillRow (wrapping the `.triggerGroup` div) or inside TriggerDropdown itself. Since the label wraps the entire trigger group (not individual TriggerDropdown controls), it should live in SkillRow.tsx wrapping the existing `.triggerGroup` div. TriggerDropdown itself does NOT need modification.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` - No changes needed; trigger label wrapper lives in SkillRow.
- `/home/bob/Projects/auto-battler/.docs/visual-specs/skill-row.md` - Visual spec to update with new field label/group documentation.

### Test files

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` - 606 lines. Tests for config mode and battle mode display. Tests use `screen.getByRole`, `screen.getByLabelText`, and `screen.getByText` queries. New tests will verify labels are visible in config and battle modes.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` - 379 lines. Tests should NOT need changes since TriggerDropdown component itself is not being modified. The TRIGGER label lives in SkillRow.

### Documentation files

- `/home/bob/Projects/auto-battler/.docs/ui-ux-guidelines.md` - Design guidelines (read-only reference). Typography scale, spacing scale, component patterns.
- `/home/bob/Projects/auto-battler/.docs/visual-specs/skill-row.md` - Visual spec to update after implementation.
- `/home/bob/Projects/auto-battler/.tdd/requirements.md` - Task requirements (read-only reference).

## Current Component Structure

### SkillRow.tsx Layout (left to right within horizontal flex row)

```
<div .skillRow [.battleMode] [.statusSelected/.statusRejected/.statusSkipped] [.onCooldown]>
  1. [battle] <span .statusIcon>  -- evaluation icon (check/X/dash)
  2. <label .enableCheckbox>      -- enable/disable checkbox
  3. <div .priorityControls>      -- up/down arrow buttons
  4. <h3 .skillName>              -- skill name with tooltip
  5. [cooldown] <span .cooldownBadge>  -- "CD: N"
  6. [battle+selected] <span .target>  -- "-> Enemy B"
  7. [battle+rejected] <span .rejectionReason>  -- formatted reason
  8. <div .triggerGroup>           -- wraps TriggerDropdown (scope select + condition select + optional value input)
  9. <select .select>              -- target select (Enemy/Ally/Self)
  10. <select .select>             -- criterion select (Nearest/Furthest/...)
  11. [filter active] <span .filterGroup>  -- filter condition select + value input + remove button
      [no filter] <button .addFilterBtn>   -- "+ Filter" ghost button
  12. [multi-behavior] <select .select>  -- behavior select (Towards/Away)
  13. <SkillRowActions>             -- unassign/remove/duplicate buttons
</div>
```

### Where labels and wrappers need to go

Each label+controls wrapper replaces a flat control with a vertical stack:

1. **TRIGGER label**: Wrap existing `<div .triggerGroup>` (item 8) inside a new `.fieldGroup` div with a `<span .fieldLabel>TRIGGER</span>` above it.

2. **TARGET label**: Wrap the target `<select>` (item 9) inside a new `.fieldGroup` div with `<span .fieldLabel>TARGET</span>` above it. The criterion `<select>` (item 10) and the conditional behavior `<select>` (item 12) should also go inside this same group's controls area, OR each get their own wrapper. Per requirements, behavior does NOT get a separate label, which suggests it either sits inside the TARGET group or stands alone unlabeled. The requirements say "SELECTOR" is a separate label for criterion.

   **Revised approach based on requirements**: TARGET wraps only the target select. SELECTOR wraps only the criterion select. Behavior select sits adjacent without a label (self-evident from "Towards"/"Away" content).

3. **SELECTOR label**: Wrap the criterion `<select>` (item 10) inside a new `.fieldGroup` div with `<span .fieldLabel>SELECTOR</span>` above it.

4. **FILTER label**: Wrap the filter section (items 11 -- either the active `.filterGroup` span or the `+ Filter` button) inside a new `.fieldGroup` div with `<span .fieldLabel>FILTER</span>` above it.

### SkillRow.module.css Key Patterns

- `.skillRow`: `display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem`
- `.skillRow.battleMode`: `padding: 0.25rem 0.5rem; gap: 0.35rem; font-size: 0.85rem`
- `.triggerGroup`: `display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap`
- `.filterGroup`: `display: inline-flex; align-items: center; gap: 0.25rem`
- `.select`: `padding: 0.25rem 0.5rem; font-size: 0.85rem`
- `.priorityControls`: existing vertical flex column pattern (`flex-direction: column; gap: 0.25rem`)

The `.fieldGroup` wrapper will need to change `align-items` on the parent row. Currently the row uses `align-items: center`, but with vertical field groups the alignment should likely become `align-items: flex-start` or the field groups should use `align-items: stretch`. Actually, since the labels add minimal height (~10-12px), keeping `align-items: center` on the parent should work fine -- the wrappers just stack a small label on top of the controls.

**Important**: The `.skillRow` uses `align-items: center`. With field groups of varying heights (some have labels, some do not), this will vertically center each item. This means items without labels (checkbox, priority controls, skill name, action buttons) will naturally center-align with the taller field groups. This is acceptable behavior.

### TriggerDropdown.tsx Structure

```
<span .triggerControl>     -- inline-flex, align-items: center, gap: 0.25rem
  [NOT button]             -- toggle for negation
  <select .select>         -- trigger scope (Enemy/Ally/Self)
  <select .select>         -- trigger condition (Always/In range/HP below/...)
  [value input]            -- number input for value-based conditions
  [remove button]          -- for second trigger (not currently used in SkillRow)
</span>
```

The TriggerDropdown renders as a flat inline-flex span with controls. The "TRIGGER" label wraps the entire `.triggerGroup` div in SkillRow (which contains TriggerDropdown), not the TriggerDropdown component itself.

## Existing Patterns

- **Opacity-based text hierarchy** - `--text-secondary` at `rgba(255,255,255,0.6)` is the correct token for the labels, matching the design's muted label convention.
- **Section header pattern** - `RuleEvaluations.module.css` has `.sectionHeader` with `0.875rem`, weight 600, `--content-secondary`, `text-transform: uppercase`, `letter-spacing: 0.05em`. The field labels follow a similar pattern but at a smaller size (`0.6rem`) since they are micro labels within a dense row, not section headers.
- **AND label pattern** - `SkillRow.module.css` has `.andLabel` with `0.75rem`, weight 600, `--text-secondary`, uppercase. This is the closest existing pattern to the new field labels. The new labels are even smaller (0.6rem) and use letter-spacing.
- **Priority controls column pattern** - `.priorityControls` uses `flex-direction: column; gap: 0.25rem`, which is exactly the pattern needed for `.fieldGroup` (vertical flex stacking).
- **Ghost button pattern** - `.addFilterBtn` uses dashed border, transparent background, `--text-secondary` -- this button will be wrapped inside the FILTER field group.
- **Battle mode compact sizing** - `.battleMode` reduces padding and gap. Labels need a `.battleMode .fieldLabel` rule to scale down proportionally.
- **Row Density pattern** - documented in `patterns/index.md` as `visual-specs/skill-row.md`. Config mode uses `0.5rem` padding, battle mode uses `0.25rem 0.5rem`.

## Dependencies

- No game logic changes needed
- No store changes needed
- No new components needed (labels are `<span>` elements within existing SkillRow)
- CSS custom properties `--text-secondary` and `--font-mono` (inherited) already exist in theme.css
- The `.fieldGroup` and `.fieldLabel` classes are entirely new CSS; no naming conflicts

## Applicable Lessons

- **Lesson 003** - "Verify CSS variable semantics across all theme modes." The field labels use `--text-secondary` which maps to `rgba(255,255,255,0.6)` in dark mode. Should verify this renders correctly in light and high-contrast themes. Since `--text-secondary` uses `light-dark()`, it should adapt correctly, but browser verification is needed.
- **Lesson 004** - Not directly applicable (no fake timers or hover tests expected).

## Constraints Discovered

1. **SkillRow.module.css is at 245 lines** -- adding ~20 lines for `.fieldGroup`, `.fieldLabel`, and `.battleMode .fieldLabel` brings it to ~265 lines, well within the 400-line max.
2. **SkillRow.tsx is at 335 lines** -- adding ~20-30 lines for wrapper divs and label spans brings it to ~360-365 lines, within the 400-line limit.
3. **align-items: center on parent row** -- field groups with labels will be slightly taller than non-labeled items. The center alignment of the parent flex row means non-labeled items (checkbox, priority controls, skill name, action buttons) will center-align relative to the taller labeled groups. This should look natural.
4. **No new CSS class naming conflicts** -- `.fieldGroup` and `.fieldLabel` are new names not used anywhere in the codebase.
5. **Test impact is additive** -- existing tests should not break since we are wrapping existing elements (not removing or renaming them). New tests verify label presence and styling.
6. **Typography tier** -- `0.6rem` is a new micro label tier below the existing `0.75rem` badge/small tier. This is explicitly called out in the requirements as acceptable.
7. **Battle mode scaling** -- the `.battleMode` rule sets `font-size: 0.85rem` on the entire row. Since the label uses `0.6rem` (an absolute rem value, not relative to parent), it will NOT automatically scale with battle mode. A `.battleMode .fieldLabel` rule should reduce to ~`0.55rem` for proportional scaling.

## Open Questions

1. **Should the behavior select sit visually between TARGET and SELECTOR groups, or after SELECTOR?** Currently it renders after the filter section (line 297-310 in SkillRow.tsx), which is AFTER the filter group. The requirements say it does NOT get a separate label and is "self-evident from its content." Its current render position (after filter) means it appears at the end of the control groups, which seems fine. No change to render order needed.

2. **Should `.fieldGroup` wrapper change `align-items` on the parent row?** The parent `.skillRow` uses `align-items: center`. With field groups adding ~10-12px of label height, the non-labeled items will be vertically centered relative to the taller field groups. This should look acceptable but needs browser verification. If it looks odd, `align-items: flex-end` on the parent row could align everything to the baseline of the controls, but this would affect priority controls and checkbox alignment.

3. **Label visibility in disabled/skipped state** -- when a skill is disabled (checkbox unchecked) or skipped (opacity 0.6), the labels inherit the dimming. Since labels use `--text-secondary` (already at 60% opacity), combined with the `.statusSkipped` opacity of 0.6, labels would be at ~36% opacity. This matches the `--text-muted` tier, which seems appropriate for de-emphasized state. No special handling needed.
