# Exploration Findings

## Task Understanding

Fix SkillRow grid overflow when trigger (col 6) and filter (col 9) columns contain complex conditions such as "NOT Enemy Channeling (any)". The root cause is that CSS `auto` grid tracks enforce `min-width: auto` on grid items, preventing columns 6-9 from shrinking below their intrinsic minimum content width. When content is wide enough, the `1fr` spacer (col 11) collapses first, then content overflows. The fix is to change columns 6-9 from `auto` to `minmax(0, auto)` and add `flex-wrap: wrap` on the inline-flex containers inside those columns.

## Relevant Files

### Files to Modify (CSS)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` (lines 1-16) - `.skillRow` grid-template-columns: columns 6-9 are `auto`, need `minmax(0, auto)`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` (lines 25-38) - `.skillRow.battleMode` grid-template-columns: columns 6-9 are `auto`, need `minmax(0, auto)`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` (lines 228-232) - `.filterGroup`: currently `display: inline-flex` with no `flex-wrap`, needs `flex-wrap: wrap`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` (lines 1-5) - `.triggerControl`: currently `display: inline-flex` with no `flex-wrap`, needs `flex-wrap: wrap`

### Files to Update (Documentation)

- `/home/bob/Projects/auto-battler/.docs/visual-specs/skill-row.md` - Grid template documentation (lines 13-19 for templates, line 91 for column sizing rationale) needs `minmax(0, auto)` for columns 6-9
- `/home/bob/Projects/auto-battler/.docs/ui-ux-guidelines.md` - Interactive Row pattern snippet (lines 266-295) needs `minmax(0, auto)` for columns 6-9

### Files for Reference (No Changes)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/FilterControls.tsx` - Uses `styles.filterGroup` class (line 115), renders filter controls as `<span>` children
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` - Uses `styles.triggerControl` class (line 166), renders trigger controls as inline children
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` (line 276) - `.fieldGroup` already has `min-width: 0` which is good -- it allows the fieldGroup itself to shrink within the grid cell
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` (lines 140-145) - `.triggerGroup` already has `flex-wrap: wrap` -- this wraps multiple TriggerDropdown instances but does NOT wrap controls within a single trigger

### Test Files (May Need Verification)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-actions.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-scope-rules.test.tsx`

## Current Values

### `.skillRow` grid-template-columns (config mode, lines 3-16)

```css
grid-template-columns:
  /* 1: checkbox    */
  auto
  /* 2: status icon */ 1.5rem
  /* 3: priority    */ auto
  /* 4: name        */ 9rem
  /* 5: eval        */ 12rem
  /* 6: trigger     */ auto /* <-- change to minmax(0, auto) */
  /* 7: target      */ auto /* <-- change to minmax(0, auto) */
  /* 8: selector    */ auto /* <-- change to minmax(0, auto) */
  /* 9: filter      */ auto /* <-- change to minmax(0, auto) */
  /* 10: behavior   */ minmax(0, auto) /* already correct */
  /* 11: spacer     */ 1fr
  /* 12: actions    */ auto;
```

### `.skillRow.battleMode` grid-template-columns (lines 26-38)

```css
grid-template-columns:
  auto /* 1: checkbox */
  1.5rem /* 2: status icon */
  auto /* 3: priority */
  7.5rem /* 4: name */
  10rem /* 5: eval */
  auto /* 6: trigger -- change to minmax(0, auto) */
  auto /* 7: target -- change to minmax(0, auto) */
  auto /* 8: selector -- change to minmax(0, auto) */
  auto /* 9: filter -- change to minmax(0, auto) */
  minmax(0, auto) /* 10: behavior -- already correct */
  1fr /* 11: spacer */
  auto; /* 12: actions */
```

### `.triggerControl` (TriggerDropdown.module.css, lines 1-5)

```css
.triggerControl {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  /* needs: flex-wrap: wrap; */
}
```

### `.filterGroup` (SkillRow.module.css, lines 228-232)

```css
.filterGroup {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  /* needs: flex-wrap: wrap; */
}
```

### `.fieldGroup` (SkillRow.module.css, lines 276-281)

```css
.fieldGroup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0; /* already allows shrinking -- good */
}
```

## Existing Patterns

- **Row Density** - The SkillRow uses compact spacing (0.5rem padding/gap in config, 0.25rem/0.35rem in battle). The fix preserves this.
- **`minmax(0, auto)` pattern** - Already used on column 10 (behavior). This change extends it to columns 6-9 for consistency. The pattern allows a column to grow to fit content but can shrink to 0 when space is constrained.
- **`min-width: 0` on flex/grid children** - `.fieldGroup` already has `min-width: 0`, which is the flex-item equivalent of `minmax(0, auto)` for grid tracks. This ensures field groups can actually shrink.
- **`flex-wrap: wrap`** - Already used on `.triggerGroup` (the container for multiple TriggerDropdown instances). The same pattern needs to be applied to the individual control containers.

## Dependencies

- `.fieldGroup` already has `min-width: 0` (line 280 of SkillRow.module.css) -- this is required for the `minmax(0, auto)` grid track change to propagate shrinking through to the flex children. Without it, the flex container would still refuse to shrink.
- FilterControls renders `.filterGroup` as a `<span>` with `inline-flex` -- adding `flex-wrap: wrap` is safe because `<span>` children are all inline elements (buttons, selects, inputs).
- TriggerDropdown renders `.triggerControl` as a `<span>` with `inline-flex` -- same situation as FilterControls.

## Applicable Lessons

- **Lesson 003** - "Verify CSS variable semantics across all theme modes." Applies here: after the CSS change, visual verification in dark theme (the primary dev theme) is needed to confirm no layout regressions. The requirements doc explicitly calls this out as a constraint.

## Constraints Discovered

- **Only CSS changes needed**: No TypeScript/JSX changes required. The fix is purely CSS: 2 grid template changes, 2 `flex-wrap` additions, and 2 documentation updates.
- **Column 10 precedent**: Column 10 already uses `minmax(0, auto)`, so this is extending an established pattern rather than introducing a new one.
- **`flex-wrap` visual impact**: When controls wrap to a second line, the row height will increase. This is acceptable -- it prevents overflow, which is worse. The wrapping only occurs when the column is actually constrained (complex conditions at narrower viewports or when many columns are populated simultaneously).
- **No test changes expected**: This is a CSS-only change. Existing tests use Testing Library (DOM queries, not layout assertions), so they should not be affected. However, test suite should be run to confirm no breakage.
- **Battle mode column comments**: The `.skillRow.battleMode` grid template (lines 26-38) has NO inline comments -- values are just listed as bare numbers. The implementation should add comments to match the config mode style for clarity, or at minimum apply the `minmax(0, auto)` values correctly.

## Open Questions

- **None**: The task is well-scoped with clear acceptance criteria. The requirements document identifies all files in scope and the exact changes needed. No ambiguity requiring planning-phase resolution.
