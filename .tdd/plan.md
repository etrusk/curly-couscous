# Implementation Plan: Stacked Field Labels for SkillRow

## Summary

Add four stacked text labels ("TRIGGER", "TARGET", "SELECTOR", "FILTER") above corresponding control groups in SkillRow. Each label + control is wrapped in a `.fieldGroup` vertical flex container. Labels appear in both config and battle modes. Behavior select does NOT get a label.

## Files to Modify

1. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` -- Add `.fieldGroup` and `.fieldLabel` classes plus `.battleMode .fieldLabel` variant
2. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` -- Wrap four control groups in `.fieldGroup` divs with `.fieldLabel` spans
3. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` -- Add tests for label presence in config and battle modes
4. `/home/bob/Projects/auto-battler/.docs/visual-specs/skill-row.md` -- Update visual spec with field label/group documentation

Files NOT modified (confirmed by explorer):

- `TriggerDropdown.tsx` -- TRIGGER label wraps `.triggerGroup` in SkillRow, not inside TriggerDropdown
- `TriggerDropdown.module.css` -- No changes needed
- `TriggerDropdown.test.tsx` -- No changes needed

## Step 1: CSS -- Add `.fieldGroup` and `.fieldLabel` classes

File: `SkillRow.module.css` (currently 245 lines, will grow to ~265 lines)

Add after `.onCooldown` (end of file):

```css
.fieldGroup {
  display: inline-flex;
  flex-direction: column;
}

.fieldLabel {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}

.battleMode .fieldLabel {
  font-size: 0.55rem;
}
```

Design notes:

- `inline-flex` + `column` stacks label above controls without breaking the parent row's `align-items: center`
- `line-height: 1` on the label keeps the added height to ~10px (0.6rem at default 16px base = 9.6px)
- No explicit gap needed in `.fieldGroup` -- the label's natural line-height provides sufficient visual separation
- Battle mode scales from `0.6rem` to `0.55rem` for proportional compaction
- Parent `.skillRow` keeps `align-items: center` -- field groups will be slightly taller than non-labeled items (checkbox, priority controls, skill name, action buttons), which will naturally center-align

## Step 2: TSX -- Wrap control groups in `.fieldGroup` wrappers

File: `SkillRow.tsx` (currently 335 lines, will grow to ~355 lines)

Four wrapping operations. Each follows the same pattern:

```tsx
<div className={styles.fieldGroup}>
  <span className={styles.fieldLabel}>LABEL</span>
  {/* existing control(s) */}
</div>
```

### 2a: TRIGGER label (lines 227-234)

Wrap the existing `<div className={styles.triggerGroup}>` in a `.fieldGroup`:

Before:

```tsx
<div className={styles.triggerGroup}>
  <TriggerDropdown ... />
</div>
```

After:

```tsx
<div className={styles.fieldGroup}>
  <span className={styles.fieldLabel}>TRIGGER</span>
  <div className={styles.triggerGroup}>
    <TriggerDropdown ... />
  </div>
</div>
```

### 2b: TARGET label (lines 236-245)

Wrap the target `<select>` in a `.fieldGroup`:

Before:

```tsx
<select
  value={skill.target}
  onChange={handleTargetChange}
  className={styles.select}
  aria-label={`Target for ${skill.name}`}
>
  ...
</select>
```

After:

```tsx
<div className={styles.fieldGroup}>
  <span className={styles.fieldLabel}>TARGET</span>
  <select
    value={skill.target}
    onChange={handleTargetChange}
    className={styles.select}
    aria-label={`Target for ${skill.name}`}
  >
    ...
  </select>
</div>
```

### 2c: SELECTOR label (lines 247-259)

Wrap the criterion `<select>` in a `.fieldGroup`:

Before:

```tsx
<select
  value={skill.criterion}
  onChange={handleCriterionChange}
  disabled={skill.target === "self"}
  className={styles.select}
  aria-label={`Criterion for ${skill.name}`}
>
  ...
</select>
```

After:

```tsx
<div className={styles.fieldGroup}>
  <span className={styles.fieldLabel}>SELECTOR</span>
  <select
    value={skill.criterion}
    onChange={handleCriterionChange}
    disabled={skill.target === "self"}
    className={styles.select}
    aria-label={`Criterion for ${skill.name}`}
  >
    ...
  </select>
</div>
```

### 2d: FILTER label (lines 261-295)

Wrap the entire filter conditional (both the active filter span and the "+ Filter" button) in a `.fieldGroup`:

Before:

```tsx
{
  skill.filter ? (
    <span className={styles.filterGroup}>...</span>
  ) : (
    <button className={styles.addFilterBtn}>+ Filter</button>
  );
}
```

After:

```tsx
<div className={styles.fieldGroup}>
  <span className={styles.fieldLabel}>FILTER</span>
  {skill.filter ? (
    <span className={styles.filterGroup}>...</span>
  ) : (
    <button className={styles.addFilterBtn}>+ Filter</button>
  )}
</div>
```

### Items NOT wrapped

- Behavior select (lines 297-310): No label. It sits adjacent to the field groups after FILTER, unlabeled. Its "Towards"/"Away" content is self-evident.
- Status icon, enable checkbox, priority controls, skill name, cooldown badge, target display, rejection reason, SkillRowActions: No labels. These are not "control groups" for the skill configuration dropdowns.

## Step 3: Tests -- Verify label DOM presence

File: `SkillRow.test.tsx` (currently 606 lines, will grow to ~655 lines)

Add a new `describe` block for field labels. Tests verify labels appear in the DOM as text content. This is appropriate because:

- Labels are functional text that helps users identify controls (not purely decorative)
- Testing DOM presence is a user-centric assertion (users can see the labels)
- CSS styling (font size, weight, color) is visual and should be verified in browser, not unit tests

### Tests to add

```
describe("Field Labels", () => {
  it("shows TRIGGER label in config mode")
  it("shows TARGET label in config mode")
  it("shows SELECTOR label in config mode")
  it("shows FILTER label in config mode")
  it("shows all four labels in battle mode")
  it("does not show label for behavior select")
})
```

Each test renders a SkillRow and asserts `screen.getByText("TRIGGER")` (etc.) is in the document. The battle mode test passes an `evaluation` prop to activate battle mode.

The "no label for behavior" test renders a multi-behavior skill (Move) and asserts no text content matching common label candidates ("BEHAVIOR") exists.

### Test pattern

All tests follow the existing render pattern:

```tsx
const skill = createSkill({ id: "light-punch", name: "Light Punch" });
const character = createCharacter({ id: "char1", skills: [skill] });
render(
  <SkillRow
    skill={skill}
    character={character}
    index={0}
    isFirst={false}
    isLast={false}
  />,
);
expect(screen.getByText("TRIGGER")).toBeInTheDocument();
```

### What NOT to test in unit tests

- CSS properties (font-size, color, letter-spacing) -- verify in browser
- Vertical stacking layout -- verify in browser
- Battle mode label scaling -- verify in browser (browser test could be added if needed, but the rule is simple enough to verify visually)

## Step 4: Visual Spec Update

File: `.docs/visual-specs/skill-row.md`

Add a new section between "5. Trigger Group" and "6. Target Select" (renumbering subsequent sections), or add a cross-cutting "Field Labels" section. The latter is cleaner since labels apply to four different groups.

Add before the "States" section:

```markdown
## Field Labels

Each of four control groups (Trigger, Target, Criterion, Filter) is wrapped in a `.fieldGroup` container with a `.fieldLabel` above it.

### Layout

- `.fieldGroup`: `display: inline-flex; flex-direction: column`
- `.fieldLabel`: Above the control(s), stacked vertically

### Typography

- Font-size: `0.6rem` (config) / `0.55rem` (battle)
- Font-weight: `600`
- Color: `var(--text-secondary)`
- Text-transform: `uppercase`
- Letter-spacing: `0.05em`
- Line-height: `1`

### Labels

| Label    | Wraps                                       |
| -------- | ------------------------------------------- |
| TRIGGER  | `.triggerGroup` (TriggerDropdown)           |
| TARGET   | Target `<select>` (Enemy/Ally/Self)         |
| SELECTOR | Criterion `<select>` (Nearest/Furthest/...) |
| FILTER   | Filter group or "+ Filter" button           |

### Notes

- Behavior select does NOT get a label
- Labels are unconditionally visible (not hover-revealed)
- Labels have no impact on existing `aria-label` attributes
- In disabled/skipped states, labels inherit the row's dimming (opacity 0.6)
```

Update the elements list (items 5-9) to note each is wrapped in a `.fieldGroup`.

## Alignment Verification

### Spec alignment

- [x] Labels match spec.md's "Universal Skill Shape" concept: trigger, target, criterion + filter
- [x] Consistent with progressive disclosure Level 1 (glanceable labels)
- [x] Density principle: minimal height added (~10px)

### Architecture alignment

- [x] CSS Modules pattern maintained
- [x] No game logic changes
- [x] No store changes
- [x] Component-level changes only (SkillRow.tsx + SkillRow.module.css)

### Pattern alignment

- [x] Uses `--text-secondary` for opacity-based text hierarchy (Principle #3)
- [x] Labels follow `.andLabel` pattern (weight 600, uppercase, `--text-secondary`)
- [x] Ghost button pattern preserved for "+ Filter" (just wrapped)
- [x] Row Density pattern: battle mode variant included

### Decision alignment

- [x] No conflicts with any existing ADRs
- [x] ADR-004 (local state for UI concerns): N/A -- labels are static text, no state needed
- [x] ADR-021 (CSS theming): `--text-secondary` uses `light-dark()`, will adapt correctly

### UI/UX guidelines alignment

- [x] Uses `var(--text-secondary)` token (not raw color)
- [x] Uses `var(--font-mono)` (inherited from `.skillRow`, no extra declaration)
- [x] `0.6rem` is a new micro label tier, below existing `0.75rem` badge tier -- approved by human override
- [x] Density relaxed slightly (~10px) per human approval

## Risks and Mitigations

1. **Visual alignment with non-labeled items**: Field groups add ~10px height. Parent row uses `align-items: center`, so non-labeled items (checkbox, priority controls, skill name, buttons) will center-align with the taller field groups. Mitigation: Browser verification. If misaligned, consider `align-items: flex-end` or adding `margin-top: auto` to non-labeled items.

2. **Row wrapping on narrow viewports**: Adding wrapper divs increases total row width slightly. Mitigation: The wrapper divs are `inline-flex` and do not add padding or margin, so width increase is negligible. Browser verification at minimum viewport.

3. **Label visibility in dimmed states**: When skill is skipped (opacity 0.6) and label uses `--text-secondary` (also 60% opacity), effective label opacity is ~36%. This matches `--text-muted` tier, which is acceptable for de-emphasized state. No special handling needed.

4. **Existing test stability**: Wrapping elements in new divs does not change text content, roles, or aria-labels. Existing tests query by role/text/label, so they should pass without modification. If any test uses `.closest("div")` to find the SkillRow root, the additional wrapper divs could shift the DOM tree. Verify by running `npm run test` after implementation.

## Browser Verification Checklist

After implementation, verify in browser:

- [ ] Labels visible above each control group in config mode
- [ ] Labels visible in battle mode (with evaluation)
- [ ] Label font size appears smaller than control text
- [ ] Labels are muted (`--text-secondary` opacity)
- [ ] Vertical stacking: label above, controls below
- [ ] Non-labeled items (checkbox, priority arrows, skill name, buttons) align reasonably with labeled groups
- [ ] Battle mode labels are slightly smaller than config mode labels
- [ ] Row height increase is minimal (~10-12px)
- [ ] Skipped/cooldown state: labels dim appropriately
- [ ] Filter area: label shows above both active filter controls and "+ Filter" button
- [ ] Behavior select (Move/Dash): appears without a label
- [ ] No horizontal overflow or wrapping issues
- [ ] Lesson 003: Verify labels render correctly in dark theme (primary development theme)

## Implementation Order

1. Write tests (RED) -- 6 new tests for label presence
2. Add CSS classes to `SkillRow.module.css`
3. Add JSX wrappers to `SkillRow.tsx` -- tests go GREEN
4. Run full test suite: `npm run test`
5. Run linting: `npm run lint`
6. Run type-check: `npm run type-check`
7. Browser verification
8. Update `.docs/visual-specs/skill-row.md`
