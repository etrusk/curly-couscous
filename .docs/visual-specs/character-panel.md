# CharacterPanel Visual Specification

> Extracted from: `src/components/CharacterPanel/CharacterPanel.tsx` + `CharacterPanel.module.css`
> Last verified: 2026-02-09

## Overview

CharacterPanel is the main container for character configuration. It occupies the right 60% of the app layout (`3fr` in `2fr 3fr` grid). It shows a placeholder when no character is selected, or a header + PriorityTab content when a character is selected. No tab navigation -- single-view design.

## Layout

- Direction: `flex` column
- Dimensions: `height: 100%` (fills grid row span)
- Border: `1px solid var(--border)`
- Background: `var(--surface-primary)`
- Border-radius: `var(--radius-md)` (4px)
- Overflow: `hidden`

## Elements (top to bottom)

### 1. Header (auto height, fixed)

- Padding: `1rem`
- Border-bottom: `1px solid var(--border)`
- Background: `var(--surface-secondary)`
- Contains title `<h2>`

#### 1a. Title

- Font: `1.1rem`, weight `600`
- Color: `var(--text-primary)`
- Margin: `0`
- Format: "Character [Faction] [Letter]" (e.g., "Character Friendly A")

### 2. Content Area (flex: 1, scrollable)

- Flex: `1`
- Overflow-y: `auto`
- Padding: `1rem`
- Contains PriorityTab component

### 3. Placeholder (when no character selected)

- Display: `flex`, centered both axes
- Height: `100%`
- Color: `var(--text-secondary)`
- Font: `0.9rem`
- Padding: `2rem`
- Text-align: `center`
- Text: "Select a character on the grid to configure"

## States

| State              | Content              | Background          | Border                    |
| ------------------ | -------------------- | ------------------- | ------------------------- |
| No selection       | Placeholder text     | `--surface-primary` | `1px solid var(--border)` |
| Character selected | Header + PriorityTab | `--surface-primary` | `1px solid var(--border)` |

## Conditional Rendering

- **No character selected**: Shows centered placeholder message
- **Character selected**: Shows header with character identity + scrollable content with PriorityTab

## Token Mapping

| Property            | Token                 | Resolved Value (dark)    |
| ------------------- | --------------------- | ------------------------ |
| Panel background    | `--surface-primary`   | `#2a2a2a`                |
| Panel border        | `--border`            | `rgba(255,255,255,0.12)` |
| Panel border-radius | `--radius-md`         | `4px`                    |
| Header background   | `--surface-secondary` | `#1e1e1e`                |
| Header border       | `--border`            | `rgba(255,255,255,0.12)` |
| Title color         | `--text-primary`      | `rgba(255,255,255,0.87)` |
| Placeholder color   | `--text-secondary`    | `rgba(255,255,255,0.6)`  |

## Accessibility

- Panel header uses `<h2>` for document outline
- Scrollable content area has overflow-y for keyboard scrolling
- No specific ARIA roles on the panel container
