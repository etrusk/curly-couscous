# SkillRow Visual Specification

> Extracted from: `src/components/CharacterPanel/SkillRow.tsx` + `SkillRow.module.css`
> Last verified: 2026-02-09

## Overview

SkillRow displays a single skill in a character's priority list. It has two visual modes: **config mode** (full dropdowns and controls) and **battle mode** (compact with evaluation indicators). The component renders a horizontal flex row containing enable checkbox, priority controls, skill name, trigger/target/criterion/behavior/filter dropdowns, evaluation status, and action buttons.

## Layout

- Direction: `flex` row, `align-items: center`
- Padding: `0.5rem` (config) / `0.25rem 0.5rem` (battle)
- Gap: `0.5rem` (config) / `0.35rem` (battle)
- Border: `1px solid var(--border)`
- Background: `var(--surface-secondary)`
- Border-radius: `var(--radius-md)` (4px)

## Elements (left to right)

### 1. Enable Checkbox (auto width, fixed)

- Native `<input type="checkbox">`
- Wrapped in `.enableCheckbox` label: `display: flex; align-items: center; cursor: pointer`
- `aria-label`: "Enable/Disable [skillName]"

### 2. Status Icon (battle mode only) (1.5rem min-width, fixed)

- Font: `1.2rem` bold (config) / `0.95rem` bold, `1.1rem` min-width (battle)
- Text-align: center
- Selected: `checkmark` in `--health-high`
- Rejected: `X` in `--health-low`
- Skipped: `dash` in `--text-secondary`

### 3. Priority Controls (auto width, fixed)

- Flex column, gap `0.25rem`
- Two buttons: Up (arrow up) and Down (arrow down)
- Button: `0.25rem 0.5rem` padding, `0.75rem` font-size, border `1px solid var(--border)`, background `var(--surface-hover)`, border-radius `3px`
- Disabled: opacity `0.5`, `cursor: not-allowed`

### 4. Skill Name (100px min-width, auto)

- Font: weight `500`, color `var(--text-primary)`, min-width `100px`
- Battle mode: font-size `0.85rem`, min-width `auto`
- Cooldown badge inline: `0.75rem`, color `var(--text-muted)`, margin-left `0.5em`, weight normal
- **Tooltip on hover/focus**: Wrapped in `SkillNameWithTooltip` component. Shows portal-rendered tooltip with skill stats (action type, tick cost, range, plus optional damage/healing/distance/cooldown/behaviors). 150ms appear delay, immediate dismiss. Positioned below by default, flips above if insufficient space. See `patterns/portal-tooltip-positioning.md`.

### 5. Trigger Group (auto width, flex)

- Container: `display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap`
- Contains TriggerDropdown component(s)
- AND label between triggers: `0.75rem`, weight `600`, `--text-secondary`, uppercase
- Add trigger button: ghost button style (dashed border)

### 6. Target Select (auto width, fixed)

- Standard select: `0.25rem 0.5rem` padding, `0.85rem` font, `1px solid var(--border)`, background `var(--surface-primary)`, border-radius `3px`

### 7. Criterion Select (auto width, fixed)

- Same styling as Target select

### 8. Behavior Select (auto width, conditional)

- Same styling as Target select
- Only rendered when skill has multiple behaviors

### 9. Filter Group (auto width, conditional)

- Container: `display: inline-flex; align-items: center; gap: 0.25rem`
- Contains filter condition select + value input when filter exists
- Add filter button: ghost button (dashed border)
- Remove filter button: `0.15rem 0.35rem` padding, `0.75rem` font, hover goes danger (`--health-low`)

### 10. Target Display (battle mode) (auto width, conditional)

- Font: `0.9rem` / `0.8rem` (battle), weight `500`, color `var(--accent-primary)`
- Shows resolved target: "-> Enemy B"

### 11. Rejection Reason (battle mode) (auto width, conditional)

- Font: `0.85rem` / `0.8rem` (battle), italic, color `var(--health-low)`

### 12. Action Buttons (auto width, fixed)

- Via SkillRowActions component
- Buttons: Unassign, Remove, Duplicate
- All: `0.25rem 0.75rem` padding, `0.85rem` font, `1px solid var(--border)`, background `var(--surface-hover)`, border-radius `3px`
- Remove hover: `--health-low` background, `--text-on-faction` color
- Unassign hover: `brightness(1.1)` filter

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
- **Has filter**: Filter group visible with condition select, value input, remove button.
- **No filter**: "Add Filter" ghost button shown.
- **Multi-behavior skill**: Behavior select appears.
- **Innate skill**: No Unassign button.
- **Duplicate instance**: Remove button shown.

## Token Mapping

| Property              | Token                 | Resolved Value (dark)    |
| --------------------- | --------------------- | ------------------------ |
| Row background        | `--surface-secondary` | `#1e1e1e`                |
| Row border            | `--border`            | `rgba(255,255,255,0.12)` |
| Row border-radius     | `--radius-md`         | `4px`                    |
| Skill name color      | `--text-primary`      | `rgba(255,255,255,0.87)` |
| Select background     | `--surface-primary`   | `#2a2a2a`                |
| Select border         | `--border`            | `rgba(255,255,255,0.12)` |
| Selected status color | `--health-high`       | `#4caf50`                |
| Rejected status color | `--health-low`        | `#f44336`                |
| Skipped text color    | `--text-secondary`    | `rgba(255,255,255,0.6)`  |
| Target display color  | `--accent-primary`    | `#00a8ff`                |
| Rejection color       | `--health-low`        | `#f44336`                |
| Cooldown badge color  | `--text-muted`        | `rgba(255,255,255,0.38)` |

## Accessibility

- Enable checkbox: `aria-label="Enable/Disable [skillName]"`
- All selects have `aria-label` attributes
- Priority buttons are standard `<button>` elements with disabled states
- Trigger NOT toggle: `aria-label="Toggle NOT modifier for [skillName]"`, `aria-pressed`
- Focus indicators via browser defaults on native form elements
- Skill name tooltip: `role="tooltip"`, linked via `aria-describedby`, keyboard-accessible (`tabindex="0"` on skill name span, shows on focus, dismissible via Escape key per WCAG 2.2 SC 1.4.13)
