# IntentLine / IntentOverlay Visual Specification

> Extracted from: `src/components/BattleViewer/IntentLine.tsx`, `IntentOverlay.tsx` + `.module.css`
> Last verified: 2026-02-09

## Overview

IntentOverlay renders all pending action visualizations as an SVG layer above the grid. It contains IntentLine components for each pending action, plus SVG marker definitions for endpoint indicators. Bidirectional attacks are detected and offset perpendicular to the line (4px) to prevent overlap.

## Layout

- IntentOverlay: `position: absolute; top: 0; left: 0; pointer-events: none; z-index: 10`
- Same viewBox as Grid SVG (coordinate-aligned)
- Contains: `<defs>` with marker definitions, `<IntentLine>` components

## SVG Marker Definitions

All markers use white outline (contrast line) + colored fill/stroke for visibility on any background.

### arrowhead-attack

- Filled triangle arrowhead
- Color: `var(--action-attack)` (`#d55e00`)
- White outline stroke for contrast

### cross-heal

- Plus/cross shape
- Color: `var(--action-heal)` (`#009e73`)
- White outline stroke for contrast

### circle-friendly (movement endpoint)

- Hollow circle
- Color: `var(--action-move)` (`#0072b2`)
- Stroke: action-move with white outline

### diamond-enemy (movement endpoint)

- Hollow diamond
- Color: `var(--action-move)` (`#0072b2`)
- Stroke: action-move with white outline

## IntentLine Elements

Each IntentLine renders two overlapping `<line>` elements (outline-behind-main pattern):

### 1. Contrast Outline

- Stroke: `var(--contrast-line)` (`#ffffff`)
- Width: main stroke width + 1px
- Linecap: `round`

### 2. Main Stroke

- Color: determined by action type
- Immediate (ticksRemaining=0): `4px` solid, `5px` outline
- Future (ticksRemaining>0): `2px` dashed (`4 4` pattern), `3px` outline

### 3. Numeric Label (future actions only)

- Position: midpoint of line
- Font: `12px` bold
- Fill: action color
- Stroke: `#ffffff`, `3px`, `paintOrder="stroke"`
- Content: `ticksRemaining` number

## Action Color Mapping

| Action Type | Color Token       | Value     |
| ----------- | ----------------- | --------- |
| Attack      | `--action-attack` | `#d55e00` |
| Heal        | `--action-heal`   | `#009e73` |
| Move        | `--action-move`   | `#0072b2` |
| Interrupt   | `--action-attack` | `#d55e00` |
| Charge      | `--action-attack` | `#d55e00` |

## Timing Visual Encoding

| Timing                       | Line Style   | Stroke Width | Outline Width | Marker         | Label                 |
| ---------------------------- | ------------ | ------------ | ------------- | -------------- | --------------------- |
| Immediate (ticksRemaining=0) | Solid        | `4px`        | `5px`         | Yes (endpoint) | None                  |
| Future (ticksRemaining>0)    | Dashed `4 4` | `2px`        | `3px`         | Yes (endpoint) | ticksRemaining number |

## Endpoint Marker Selection

| Action Type               | Marker                                |
| ------------------------- | ------------------------------------- |
| Attack, Interrupt, Charge | `arrowhead-attack` (filled arrowhead) |
| Heal                      | `cross-heal` (cross shape)            |
| Move (friendly)           | `circle-friendly` (hollow circle)     |
| Move (enemy)              | `diamond-enemy` (hollow diamond)      |

## Bidirectional Offset

When two characters target each other simultaneously, lines are offset perpendicular to the line direction by `4px` to prevent visual overlap. The offset direction is deterministic based on character positions.

## States

| State              | Visual                                                   |
| ------------------ | -------------------------------------------------------- |
| No pending actions | Overlay empty (not rendered)                             |
| Immediate action   | Solid thick line with endpoint marker                    |
| Future action      | Dashed thin line with endpoint marker + tick count label |
| Bidirectional      | Both lines offset perpendicular                          |

## Token Mapping

| Property      | Token             | Resolved Value (dark) |
| ------------- | ----------------- | --------------------- |
| Attack color  | `--action-attack` | `#d55e00`             |
| Heal color    | `--action-heal`   | `#009e73`             |
| Move color    | `--action-move`   | `#0072b2`             |
| Outline color | `--contrast-line` | `#ffffff`             |

## Accessibility

- Overlay is `pointer-events: none` (purely visual)
- Action information conveyed via tooltip text, not just line color
- Shape redundancy in movement markers (circle vs diamond for faction)
- High contrast outline ensures visibility on any cell background
