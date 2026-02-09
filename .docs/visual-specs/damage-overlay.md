# DamageOverlay / DamageNumber Visual Specification

> Extracted from: `src/components/BattleViewer/DamageOverlay.tsx` + `DamageOverlay.module.css`, `DamageNumber.tsx` + `DamageNumber.module.css`
> Last verified: 2026-02-09

## Overview

DamageOverlay renders floating damage numbers at hex centers when damage or healing occurs. It sits above intent lines in the z-order. Each DamageNumber is an SVG group with a white background rectangle and colored text, stacked vertically when multiple damage events hit the same cell.

## Layout

- DamageOverlay: `position: absolute; top: 0; left: 0; pointer-events: none; z-index: 20`
- Same viewBox as Grid SVG (coordinate-aligned)
- Contains DamageNumber components positioned at hex pixel coordinates

## Elements

### DamageNumber

Each damage event renders an SVG `<g>` group:

#### 1. Background Rectangle

- Dimensions: `40x20` (hardcoded)
- Position: centered on hex, offset by `offsetIndex * 20px` vertically
- Fill: `white` (hardcoded)
- Opacity: `0.95`
- Border-radius: `rx="3"` (3px rounded corners)
- Stroke: faction color of attacker, width `2`

#### 2. Damage Text

- Font: `var(--font-mono)`, `14px`, `bold`
- Fill: `#333` (hardcoded dark text on white background)
- Text-anchor: `middle`, dominant-baseline: `central`
- Pointer-events: `none`
- Content: damage amount number (e.g., "10", "25")

## Stacking

When multiple damage events occur on the same hex:

- Each subsequent DamageNumber is offset `20px` upward (negative Y)
- `offsetIndex` determines vertical stacking position
- Most recent damage appears on top

## Attacker Faction Stroke Colors

| Faction  | Stroke Color | Token                |
| -------- | ------------ | -------------------- |
| Friendly | `#0072B2`    | `--faction-friendly` |
| Enemy    | `#E69F00`    | `--faction-enemy`    |

## States

| State                  | Visual                                            |
| ---------------------- | ------------------------------------------------- |
| No damage events       | Overlay empty                                     |
| Single hit             | One DamageNumber at hex center                    |
| Multiple hits same hex | Stacked DamageNumbers (20px vertical offset each) |
| Damage from friendly   | Blue stroke border                                |
| Damage from enemy      | Orange stroke border                              |

## Token Mapping

| Property           | Token                | Resolved Value (dark)                      |
| ------------------ | -------------------- | ------------------------------------------ |
| Background fill    | hardcoded            | `white`                                    |
| Background opacity | hardcoded            | `0.95`                                     |
| Text fill          | hardcoded            | `#333`                                     |
| Text font          | `--font-mono`        | Fira Code / Cascadia Code / JetBrains Mono |
| Friendly stroke    | `--faction-friendly` | `#0072B2`                                  |
| Enemy stroke       | `--faction-enemy`    | `#E69F00`                                  |

**Note**: DamageNumber uses several hardcoded values (`white`, `#333`, `40x20`, `0.95`). These could be tokenized in future for theme consistency.

## Accessibility

- Overlay and all numbers are `pointer-events: none` (purely visual)
- Damage information is also conveyed through HP bar changes on tokens
- No ARIA attributes on damage numbers (transient visual feedback)
