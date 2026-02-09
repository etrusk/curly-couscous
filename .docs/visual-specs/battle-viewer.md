# BattleViewer Visual Specification

> Extracted from: `src/components/BattleViewer/BattleViewer.tsx` + `BattleViewer.module.css`, `Grid.tsx` + `Grid.module.css`, `Cell.tsx` + `Cell.module.css`
> Last verified: 2026-02-09

## Overview

BattleViewer is the left panel (~40% width, `2fr` in layout) containing the hexagonal battle grid, overlay layers, and character tooltip portal. It renders an SVG grid of 91 hex cells with character tokens, plus absolute-positioned SVG overlays for intent lines, whiff indicators, targeting lines, and damage numbers.

## Layout

- Direction: `flex` column, centered both axes
- Padding: `20px`
- CSS custom property: `--cell-size: 50px`
- UI scaling: `font-size: calc(1rem * var(--ui-scale-factor, 1))`
- Grid container: `position: relative; display: inline-block` (enables overlay stacking)

## Elements

### 1. Grid SVG (`role="grid"`)

- Renders as `<svg>` with dynamically computed viewBox via `computeHexViewBox(hexSize, radius)`
- Default `hexSize = 30` (hex width = 60px, height ~52px)
- `user-select: none`
- `aria-label="Battle grid with 91 cells"`
- Two-pass rendering:
  - **Pass 1**: All 91 hex cell polygons (no tokens)
  - **Pass 2**: All token `<g>` elements directly in grid

### 2. Hex Cell (`role="gridcell"`)

- SVG `<g>` containing `<polygon>` with 6 vertices from `hexVertices()`
- Fill: `var(--cell-bg)` (`#2a2a2a`)
- Stroke: `var(--cell-border)` (`#444`), width `1`
- Transition: `fill 0.15s ease-in-out`
- Hover: fill `var(--cell-hover-bg)` (`#3a3a3a`)
- Clickable cells: `cursor: pointer` + clickable overlay polygon with `stroke: var(--accent)` (`#00a8ff`), `stroke-width: 2`, `fill: transparent`
- High contrast: `stroke-width: 2` on hexagons
- `aria-label` with hex position info

### 3. Overlay Stack (absolute positioned SVGs)

All overlays use `position: absolute; top: 0; left: 0; pointer-events: none` with identical viewBox.

| Layer                | z-index       | Component                 | Purpose                            |
| -------------------- | ------------- | ------------------------- | ---------------------------------- |
| Grid SVG             | 0             | Grid                      | Hex cells + tokens                 |
| WhiffOverlay         | 5             | WhiffOverlay              | Faded hex fills for missed actions |
| IntentOverlay        | 10            | IntentOverlay             | Intent lines with markers          |
| TargetingLineOverlay | (unspecified) | TargetingLineOverlay      | Dotted targeting lines             |
| DamageOverlay        | 20            | DamageOverlay             | Floating damage numbers            |
| CharacterTooltip     | 1000          | CharacterTooltip (portal) | Hover tooltip                      |

### 4. Grid Background

- Grid outer background: `var(--grid-bg)` (`#1e1e1e`)
- Grid outer border: `var(--grid-border)` (`#666`)
- Background click triggers character deselection in idle mode

## States

| State          | Visual Change                                          |
| -------------- | ------------------------------------------------------ |
| Idle           | Grid with cells, no overlays active                    |
| Placement mode | Clickable cells highlighted with accent stroke overlay |
| Moving mode    | Clickable cells highlighted with accent stroke overlay |
| Battle active  | Intent lines visible, damage numbers appear on hits    |
| Token hovered  | Tooltip portal appears after delay                     |

## Conditional Rendering

- **Clickable overlay**: Only on cells in `clickableCells` set
- **WhiffOverlay**: Only when recent whiff events exist
- **IntentOverlay**: Only when pending actions exist
- **TargetingLineOverlay**: Only during placement/moving modes
- **DamageOverlay**: Only when damage events exist
- **CharacterTooltip**: Only when a token is hovered (with 100ms leave delay)
- **Background deselection**: Only in `idle` selection mode

## Token Mapping

| Property         | Token             | Resolved Value (dark) |
| ---------------- | ----------------- | --------------------- |
| Cell fill        | `--cell-bg`       | `#2a2a2a`             |
| Cell stroke      | `--cell-border`   | `#444`                |
| Cell hover       | `--cell-hover-bg` | `#3a3a3a`             |
| Clickable accent | `--accent`        | `#00a8ff`             |
| Grid background  | `--grid-bg`       | `#1e1e1e`             |

## Accessibility

- Grid SVG: `role="grid"`, `aria-label`
- Each cell: `role="gridcell"`, `aria-label` with position
- Tokens: `role="button"`, `tabindex="0"`, keyboard accessible (Enter/Space)
- Overlays: `pointer-events: none` (non-interactive visual layers)
- Tooltip linked via `aria-describedby` on token
