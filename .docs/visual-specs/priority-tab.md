# PriorityTab Visual Specification

> Extracted from: `src/components/CharacterPanel/PriorityTab.tsx` + `PriorityTab.module.css`
> Last verified: 2026-02-09

## Overview

PriorityTab renders inside CharacterPanel's content area. It displays the character's skill list in priority order (top = highest priority) with SkillRow components, plus an Inventory section for assigning new skills. During battle, evaluation indicators appear within each SkillRow.

## Layout

- Direction: `flex` column
- Gap: `1rem`
- No border or background (inherits from CharacterPanel content area)

## Elements (top to bottom)

### 1. Skill List Section

#### 1a. Section Title (auto height)

- Font: `0.95rem`, weight `600`
- Color: `var(--text-primary)`
- Margin: `0`

#### 1b. Skill List Container

- Direction: `flex` column
- Gap: `0.5rem`
- Contains ordered SkillRow components (see `skill-row.md`)

### 2. Inventory Section (conditional)

#### 2a. Section Title

- Font: `0.95rem`, weight `600`
- Color: `var(--text-primary)`
- Margin: `0`

#### 2b. Inventory List

- Direction: `flex` column
- Gap: `0.5rem`

#### 2c. Inventory Row (per available skill)

- Direction: `flex` row, `align-items: center`
- Gap: `0.5rem`
- Padding: `0.5rem`
- Background: `var(--surface-secondary)`
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-md)` (4px)

##### Skill Name (flex: 1)

- Color: `var(--text-primary)`
- Font: `0.9rem`
- **Tooltip on hover/focus**: Wrapped in `SkillNameWithTooltip` component. Shows portal-rendered tooltip with skill stats from the registry. Same behavior as SkillRow skill name tooltips. See `patterns/portal-tooltip-positioning.md`.

##### Assign Button (fixed)

- Padding: `0.25rem 0.75rem`
- Font: `0.85rem`
- Border: `1px solid var(--border)`, border-radius `3px`
- Background: `var(--accent-primary)` (`#00a8ff`)
- Color: `var(--text-on-faction)` (`#ffffff`)
- Transition: `all 0.2s ease`
- Hover: `brightness(1.1)` filter
- Disabled: opacity `0.5`, `cursor: not-allowed`

## States

| State                   | Inventory Visible     | Evaluation Shown              |
| ----------------------- | --------------------- | ----------------------------- |
| Single faction on board | Yes                   | No (unless battle active)     |
| Both factions on board  | No (hidden)           | Yes (if battle active)        |
| Battle active           | No                    | Yes (indicators on SkillRows) |
| MAX_SKILL_SLOTS reached | Yes (assign disabled) | N/A                           |

## Conditional Rendering

- **Inventory section**: Only visible when a character is selected AND only one faction present on the board. Hidden when both factions are present.
- **Evaluation data**: Flows to SkillRow components when `battleStatus === "active"`. Uses cached evaluations during mid-action ticks to prevent flickering.
- **Assign button disabled**: When character has MAX_SKILL_SLOTS (10) skills.
- **Inventory filtering**: Only shows non-innate skills not assigned to any same-faction character.

## Token Mapping

| Property             | Token                 | Resolved Value (dark)    |
| -------------------- | --------------------- | ------------------------ |
| Inventory row bg     | `--surface-secondary` | `#1e1e1e`                |
| Inventory row border | `--border`            | `rgba(255,255,255,0.12)` |
| Inventory row radius | `--radius-md`         | `4px`                    |
| Skill name color     | `--text-primary`      | `rgba(255,255,255,0.87)` |
| Assign button bg     | `--accent-primary`    | `#00a8ff`                |
| Assign button text   | `--text-on-faction`   | `#ffffff`                |

## Accessibility

- Skill list is rendered as ordered SkillRow components (priority = visual order)
- Assign buttons have accessible labels
- No specific ARIA landmarks on the tab itself
