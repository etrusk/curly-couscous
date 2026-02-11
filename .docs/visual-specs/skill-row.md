# SkillRow Visual Specification

> Extracted from: `src/components/CharacterPanel/SkillRow.tsx` + `SkillRow.module.css`
> Last verified: 2026-02-11 (filter expansion + NOT toggle + qualifier select)

## Overview

SkillRow displays a single skill in a character's priority list. It has two visual modes: **config mode** (full dropdowns and controls) and **battle mode** (compact with evaluation indicators). The component renders a 12-column CSS grid row containing enable checkbox, status icon, priority controls, skill name, evaluation info, trigger/target/selector/filter field groups, behavior field group, and action buttons. All grid children have explicit `grid-column` assignments to prevent auto-placement issues. The grid layout ensures column alignment across all SkillRows in a character's priority list.

## Layout

- Display: `grid` with 12-column template
- Grid template (config):
  ```
  auto 1.5rem auto 9rem 12rem auto auto auto auto minmax(0,auto) 1fr auto
  ```
- Grid template (battle):
  ```
  auto 1.5rem auto 7.5rem 10rem auto auto auto auto minmax(0,auto) 1fr auto
  ```
- Align-items: `center`
- Padding: `0.5rem` (config) / `0.25rem 0.5rem` (battle)
- Column-gap: `0.5rem` (config) / `0.35rem` (battle)
- Border: `1px solid var(--border)`
- Background: `var(--surface-secondary)`
- Border-radius: `var(--radius-md)` (4px)

### Grid Columns

| #   | Column   | Width             | Content                                                           | CSS Class           |
| --- | -------- | ----------------- | ----------------------------------------------------------------- | ------------------- |
| 1   | checkbox | `auto`            | Enable/disable checkbox label                                     | `.enableCheckbox`   |
| 2   | status   | `1.5rem`          | Status icon (battle mode only; reserves space even when empty)    | `.statusIcon`       |
| 3   | priority | `auto`            | Up/Down priority buttons                                          | `.priorityControls` |
| 4   | name     | `9rem`            | `.nameCell` wrapper: skill name + cooldown badge                  | `.nameCell`         |
| 5   | eval     | `12rem`           | `.evalCell` wrapper: target display, rejection reason             | `.evalCell`         |
| 6   | trigger  | `auto`            | TRIGGER fieldGroup                                                | `.triggerField`     |
| 7   | target   | `auto`            | TARGET fieldGroup                                                 | `.targetField`      |
| 8   | selector | `auto`            | SELECTOR fieldGroup                                               | `.selectorField`    |
| 9   | filter   | `auto`            | FILTER fieldGroup                                                 | `.filterField`      |
| 10  | behavior | `minmax(0, auto)` | BEHAVIOR fieldGroup (conditional, only for multi-behavior skills) | `.behaviorField`    |
| 11  | spacer   | `1fr`             | Empty spacer pushing actions to the right                         | (no element)        |
| 12  | actions  | `auto`            | `.actionsCell` wrapper: SkillRowActions buttons (right-aligned)   | `.actionsCell`      |

### Grid Column Assignments

All grid children have explicit `grid-column` CSS assignments to prevent CSS Grid auto-placement from creating implicit rows:

```css
.enableCheckbox {
  grid-column: 1;
}
.statusIcon {
  grid-column: 2;
}
.priorityControls {
  grid-column: 3;
}
.nameCell {
  grid-column: 4;
}
.evalCell {
  grid-column: 5;
}
.triggerField {
  grid-column: 6;
}
.targetField {
  grid-column: 7;
}
.selectorField {
  grid-column: 8;
}
.filterField {
  grid-column: 9;
}
.behaviorField {
  grid-column: 10;
}
/* col 11 = spacer, no element placed */
.actionsCell {
  grid-column: 12;
}
```

### Column Sizing Rationale

- **Name (col 4, `9rem`)**: Sized for "Ranged Attack" plus ~20% headroom.
- **Eval (col 5, `12rem`)**: Sized for "Filter condition not met" plus ~20% headroom.
- **Battle mode** reduces name to `7.5rem` and eval to `10rem` for compact fit.
- **Columns 6-9 (`auto`)**: Each wraps a `.fieldGroup` div with a stacked label; auto-sizing lets content drive width.
- **Column 10 (`minmax(0, auto)`)**: Conditional content; `minmax(0, auto)` collapses to 0 when behavior select is absent.
- **Column 11 (`1fr`)**: Spacer absorbs remaining space, pushing actions to the right edge.

### Visual Separation

- `.evalCell` has `margin-left: 0.5rem` for visual separation from the name column.
- `.triggerField` has `margin-left: 0.5rem` for visual separation from the eval column.

### DOM Order

The checkbox (col 1) appears BEFORE the status icon (col 2) in DOM order. This is intentional -- placing status icon first caused CSS Grid auto-placement to create implicit rows. Explicit `grid-column` assignments on all children combined with checkbox-first DOM order prevents this issue.

## Elements (left to right)

### 1. Enable Checkbox (col 1, auto width)

- Native `<input type="checkbox">`
- Wrapped in `.enableCheckbox` label: `display: flex; align-items: center; cursor: pointer`
- `aria-label`: "Enable/Disable [skillName]"
- `grid-column: 1`

### 2. Status Icon (col 2, 1.5rem) (battle mode only)

- Font: `1.2rem` bold (config) / `0.95rem` bold, `1.1rem` min-width (battle)
- Text-align: center
- Selected: `checkmark` in `--health-high`
- Rejected: `X` in `--health-low`
- Skipped: `dash` in `--text-secondary`
- `grid-column: 2`

### 3. Priority Controls (col 3, auto width)

- Flex column, gap `0.25rem`
- Two buttons: Up (arrow up) and Down (arrow down)
- Button: `0.25rem 0.5rem` padding, `0.75rem` font-size, border `1px solid var(--border)`, background `var(--surface-hover)`, border-radius `3px`
- Disabled: opacity `0.5`, `cursor: not-allowed`
- `grid-column: 3`

### 4. Name Cell (col 4, 9rem fixed)

- Wrapped in `<span className="nameCell">`: `display: flex; align-items: center; gap: 0.25rem`
- Contains: skill name `<h3>`, cooldown badge (conditional)
- Skill name: weight `500`, color `var(--text-primary)`, `margin: 0`
- Battle mode: font-size `0.85rem`
- Cooldown badge inline: `0.75rem`, color `var(--text-muted)`, margin-left `0.5em`, weight normal
- **Tooltip on hover/focus**: Wrapped in `SkillNameWithTooltip` component. Shows portal-rendered tooltip with skill stats (action type, tick cost, range, plus optional damage/healing/distance/cooldown/behaviors). 150ms appear delay, immediate dismiss. Positioned below by default, flips above if insufficient space. See `patterns/portal-tooltip-positioning.md`.
- `grid-column: 4`

### 5. Eval Cell (col 5, 12rem fixed)

- Wrapped in `<span className="evalCell">`: `display: flex; align-items: center; gap: 0.25rem; min-width: 0; overflow: hidden`
- Extra `margin-left: 0.5rem` for visual separation from name column
- Contains: target display (conditional), rejection reason (conditional)
- Empty in config mode
- `grid-column: 5`

### 6. Trigger Group (col 6, auto width) -- wrapped in `.fieldGroup` with "TRIGGER" label

- Container: `display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap`
- Contains TriggerDropdown component(s)
- AND label between triggers: `0.75rem`, weight `600`, `--text-secondary`, uppercase
- Add trigger button: ghost button style (dashed border)
- Extra `margin-left: 0.5rem` for visual separation from eval column
- `grid-column: 6`

### 7. Target Select (col 7, auto width) -- wrapped in `.fieldGroup` with "TARGET" label

- Standard select: `0.25rem 0.5rem` padding, `0.85rem` font, `1px solid var(--border)`, background `var(--surface-primary)`, border-radius `3px`
- `grid-column: 7`

### 8. Selector Select (col 8, auto width) -- wrapped in `.fieldGroup` with "SELECTOR" label

- Same styling as Target select
- `grid-column: 8`

### 9. Filter Group (col 9, auto width) -- wrapped in `.fieldGroup` with "FILTER" label

- Container: `display: inline-flex; align-items: center; gap: 0.25rem`
- Rendered by `FilterControls` component (extracted from SkillRow)
- Contains (when filter is active): NOT toggle, condition select (7 options), value input (conditional), qualifier select (conditional), remove button
- Add filter button: ghost button (dashed border) when no filter set
- Remove filter button: `0.15rem 0.35rem` padding, `0.75rem` font, hover goes danger (`--health-low`)
- `grid-column: 9`

**Filter Condition Select** (7 options):

| Value            | Display Text   | Has Value Input  | Has Qualifier |
| ---------------- | -------------- | ---------------- | ------------- |
| `hp_below`       | HP below       | Yes (default 50) | No            |
| `hp_above`       | HP above       | Yes (default 50) | No            |
| `in_range`       | In range       | Yes (default 3)  | No            |
| `channeling`     | Channeling     | No               | Yes           |
| `idle`           | Idle           | No               | No            |
| `targeting_me`   | Cell targeted  | No               | No            |
| `targeting_ally` | Targeting ally | No               | No            |

**Filter NOT Toggle:**

- Same visual pattern as trigger NOT toggle in TriggerDropdown
- Padding: `0.15rem 0.35rem`, font-size: `0.7rem`, font-weight: `600`, uppercase
- Default: `border: 1px solid var(--border)`, `background: transparent`, `color: var(--text-secondary)`
- Hover: `background: var(--surface-hover)`
- Active (negated): `background: var(--health-low)`, `color: var(--text-on-faction)`, `border-color: var(--health-low)`
- CSS classes: `.notToggle` / `.notToggleActive` in `SkillRow.module.css` (duplicated from TriggerDropdown)
- `aria-label="Toggle NOT modifier for filter on {skillName}"`, `aria-pressed`
- Only visible when filter is active (not shown with ghost "+ Filter" button)

**Qualifier Select** (channeling condition only):

- Rendered by shared `QualifierSelect` component (used by both FilterControls and TriggerDropdown)
- Standard `.select` styling, same as condition select
- Options: `(any)` (clears qualifier), then two `<optgroup>` sections:
  - "Action Type": attack, move, heal, interrupt, charge
  - "Skill": all entries from SKILL_REGISTRY (light-punch, heavy-punch, ranged-attack, heal, kick, dash, charge, move-towards)
- Value encoding: `type:id` format (e.g., `"action:heal"`, `"skill:light-punch"`)
- `aria-label="Filter qualifier for {skillName}"`
- Only rendered when filter condition is `channeling`

### 10. Behavior Select (col 10, minmax(0, auto)) -- wrapped in `.fieldGroup` with "BEHAVIOR" label

- Same styling as Target select
- Only rendered when skill has multiple behaviors
- Wrapped in `.fieldGroup` with "BEHAVIOR" stacked label
- `grid-column: 10`

### 11. Target Display (battle mode, inside evalCell)

- Font: `0.9rem` / `0.8rem` (battle), weight `500`, color `var(--accent-primary)`
- Shows resolved target: "-> Enemy B"
- Rendered inside `.evalCell` wrapper (column 5), not as a separate grid child

### 12. Rejection Reason (battle mode, inside evalCell)

- Font: `0.85rem` / `0.8rem` (battle), italic, color `var(--health-low)`
- Rendered inside `.evalCell` wrapper (column 5), not as a separate grid child

### 13. Action Buttons (col 12, auto width)

- Wrapped in `<span className="actionsCell">`: `display: flex; align-items: center; gap: 0.25rem; justify-content: flex-end`
- Via SkillRowActions component (renders Fragment, wrapper needed for single grid cell)
- Buttons: Unassign, Remove, Duplicate
- All: `0.25rem 0.75rem` padding, `0.85rem` font, `1px solid var(--border)`, background `var(--surface-hover)`, border-radius `3px`
- Remove hover: `--health-low` background, `--text-on-faction` color
- Unassign hover: `brightness(1.1)` filter
- `grid-column: 12`

## Field Labels

Each of five control groups (Trigger, Target, Selector, Filter, Behavior) is wrapped in a `.fieldGroup` container with a `.fieldLabel` above it.

### Layout

- `.fieldGroup`: `display: flex; flex-direction: column; align-items: flex-start; min-width: 0`
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
| BEHAVIOR | Behavior `<select>` (conditional)           |

### Notes

- Labels are unconditionally visible (not hover-revealed)
- Labels have no impact on existing `aria-label` attributes
- In disabled/skipped states, labels inherit the row's dimming (opacity 0.6)

## States

| State             | Background            | Border                                                     | Text Color       | Opacity | Other                          |
| ----------------- | --------------------- | ---------------------------------------------------------- | ---------------- | ------- | ------------------------------ |
| Default           | `--surface-secondary` | `1px solid var(--border)`                                  | `--text-primary` | 1       | -                              |
| Selected (battle) | `--surface-secondary` | `1px solid var(--border)` + left `3px solid --health-high` | `--text-primary` | 1       | Status icon green              |
| Rejected (battle) | `--surface-secondary` | `1px solid var(--border)` + left `3px solid --health-low`  | `--text-primary` | 1       | Status icon red                |
| Skipped (battle)  | `--surface-secondary` | `1px solid var(--border)`                                  | `--text-primary` | 0.6     | Status icon `--text-secondary` |
| On Cooldown       | `--surface-secondary` | `1px solid var(--border)`                                  | `--text-primary` | 0.6     | Cooldown badge visible         |
| Disabled skill    | `--surface-secondary` | `1px solid var(--border)`                                  | `--text-primary` | 1       | Checkbox unchecked             |

## Conditional Rendering

- **Config mode (no battle)**: Shows enable checkbox, priority controls, all dropdowns, action buttons. No status icon or evaluation display.
- **Battle mode (active battle)**: Shows all config controls plus evaluation indicators. Status icon appears. Target/rejection reason shown based on evaluation. Row compact sizing applied.
- **Cooldown active**: Cooldown badge appears after skill name. Row opacity `0.6`.
- **Has filter**: Filter group visible with NOT toggle, condition select (7 options), conditional value input, conditional qualifier select, remove button.
- **Has filter (value condition)**: Numeric input shown for `hp_below`, `hp_above`, `in_range`.
- **Has filter (channeling)**: Qualifier select shown with action type and skill optgroups.
- **Has filter (negated)**: NOT toggle highlighted with `--health-low` background.
- **No filter**: "Add Filter" ghost button shown.
- **Multi-behavior skill**: Behavior select appears inside `.fieldGroup` with "BEHAVIOR" label.
- **Innate skill**: No Unassign button.
- **Duplicate instance**: Remove button shown.

## Token Mapping

| Property               | Token                 | Resolved Value (dark)    |
| ---------------------- | --------------------- | ------------------------ |
| Row background         | `--surface-secondary` | `#1e1e1e`                |
| Row border             | `--border`            | `rgba(255,255,255,0.12)` |
| Row border-radius      | `--radius-md`         | `4px`                    |
| Skill name color       | `--text-primary`      | `rgba(255,255,255,0.87)` |
| Select background      | `--surface-primary`   | `#2a2a2a`                |
| Select border          | `--border`            | `rgba(255,255,255,0.12)` |
| Selected status color  | `--health-high`       | `#4caf50`                |
| Rejected status color  | `--health-low`        | `#f44336`                |
| Skipped text color     | `--text-secondary`    | `rgba(255,255,255,0.6)`  |
| Target display color   | `--accent-primary`    | `#00a8ff`                |
| Rejection color        | `--health-low`        | `#f44336`                |
| Cooldown badge color   | `--text-muted`        | `rgba(255,255,255,0.38)` |
| Field label color      | `--text-secondary`    | `rgba(255,255,255,0.6)`  |
| NOT toggle border      | `--border`            | `rgba(255,255,255,0.12)` |
| NOT toggle text        | `--text-secondary`    | `rgba(255,255,255,0.6)`  |
| NOT toggle hover bg    | `--surface-hover`     | (theme-dependent)        |
| NOT toggle active bg   | `--health-low`        | `#f44336`                |
| NOT toggle active text | `--text-on-faction`   | `#ffffff`                |

## Accessibility

- Enable checkbox: `aria-label="Enable/Disable [skillName]"`
- All selects have `aria-label` attributes
- Priority buttons are standard `<button>` elements with disabled states
- Trigger NOT toggle: `aria-label="Toggle NOT modifier for [skillName]"`, `aria-pressed`
- Filter NOT toggle: `aria-label="Toggle NOT modifier for filter on [skillName]"`, `aria-pressed`
- Filter qualifier select: `aria-label="Filter qualifier for [skillName]"`
- Trigger qualifier select: `aria-label="Qualifier for [skillName]"`
- Focus indicators via browser defaults on native form elements
- Skill name tooltip: `role="tooltip"`, linked via `aria-describedby`, keyboard-accessible (`tabindex="0"` on skill name span, shows on focus, dismissible via Escape key per WCAG 2.2 SC 1.4.13)
