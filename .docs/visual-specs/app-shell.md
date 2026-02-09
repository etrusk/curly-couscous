# App Shell Visual Specification

> Extracted from: `src/App.tsx` + `src/App.css`, `src/index.css`
> Last verified: 2026-02-09

## Overview

The App shell provides the top-level layout structure: a header bar, and a CSS Grid container holding the BattleViewer (left), controls (below BattleViewer), and CharacterPanel (right, spanning both rows). The layout uses a fixed `2fr 3fr` grid giving ~40% to the battle area and ~60% to the character panel.

## Root Styles (`index.css`)

```css
:root {
  font-family: var(--font-mono);
  line-height: 1.5;
  font-weight: 400;
  color: var(--content-primary);
  background-color: var(--ground);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
body {
  min-width: 320px;
  min-height: 100vh;
}
#root {
  width: 100%;
  margin: 0;
  padding: 0;
}
```

## App Container (`App.css → .app`)

- Width: `100%`
- Max-width: `100%`
- Margin: `0`
- Padding: `8px`
- Box-sizing: `border-box`

## Elements (top to bottom)

### 1. Header (`.header`)

- Direction: `flex` row
- Justify: `space-between`
- Align: `center`
- Margin-bottom: `12px`

#### 1a. Title (`<h1>`)

- Font-size: `16px`
- Font-weight: `700`
- Line-height: `1.1`
- Margin: `0`

#### 1b. Header Controls (`.headerControls`)

- Direction: `flex` row
- Gap: `8px`
- Align: `center`
- Contains: ThemeToggle component

### 2. Grid Container (`.gridContainer`)

- Display: `grid`
- Grid-template-columns: `2fr 3fr`
- Grid-template-rows: `auto auto`
- Gap: `12px`
- Margin-bottom: `12px`

#### Grid Placement

| Area           | Grid Column | Grid Row                | Component                                            |
| -------------- | ----------- | ----------------------- | ---------------------------------------------------- |
| BattleViewer   | 1           | 1                       | BattleViewer                                         |
| Controls       | 1           | 2                       | BattleStatusBadge + CharacterControls + PlayControls |
| CharacterPanel | 2           | 1 / 3 (spans both rows) | CharacterPanel                                       |

### 3. ThemeToggle (in header)

- Container: `<button>` with flex layout
- Gap: `0.5rem`
- Padding: `0.5rem 1rem`
- Background: `var(--surface-primary)`
- Border: `2px solid var(--border-default)`
- Border-radius: `4px`
- Font-size: `0.875rem`
- Font-weight: `500`
- Color: `var(--content-primary)`
- Cursor: `pointer`
- Transition: `background-color 0.2s ease, border-color 0.2s ease`
- Icon: `1.25rem` font-size (sun/moon emoji)
- High contrast: `3px` border-width

## Responsive Breakpoints

### <= 1200px

```css
grid-template-columns: 1fr;
grid-template-rows: auto auto auto;
/* BattleViewer: row 1, Controls: row 2, CharacterPanel: row 3 */
/* All single column */
```

### <= 768px

Same as 1200px (no additional changes currently).

## States

| State                    | Layout                    |
| ------------------------ | ------------------------- |
| Desktop (>1200px)        | `2fr 3fr` two-column grid |
| Tablet/narrow (<=1200px) | Single column stacked     |

## Token Mapping

| Property        | Token               | Resolved Value (dark)                      |
| --------------- | ------------------- | ------------------------------------------ |
| Page background | `--ground`          | `#1a1a2e`                                  |
| Root text color | `--content-primary` | `rgba(255,255,255,0.87)`                   |
| Root font       | `--font-mono`       | Fira Code / Cascadia Code / JetBrains Mono |

## Accessibility

- `<h1>` for page title provides document outline
- ThemeToggle button: `aria-label` with current/target theme
- ThemeToggle keyboard: Enter/Space to toggle
- Responsive layout stacks for narrower viewports
