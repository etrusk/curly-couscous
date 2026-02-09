# Token Visual Specification

> Extracted from: `src/components/BattleViewer/Token.tsx` + `Token.module.css`
> Last verified: 2026-02-09

## Overview

Token represents a character on the hex grid. It renders as an SVG `<g>` group positioned at a hex center. Each token displays a faction-specific shape (circle for friendly, diamond for enemy), a letter identifier, and an HP bar. Tokens support selection glow, hover effects, and keyboard interaction.

## Layout

- Container: SVG `<g>` with `transform="translate(cx-20, cy-20)"` to position at hex center
- Internal coordinate space: 0..40 (40x40 units)
- Shape center: (20, 18) for main shape, HP bar at bottom
- Positioned in Grid's pass-2 rendering (always above hex cells)

## Elements (layered, back to front)

### 1. Stripe Pattern Definition (enemy only)

- `<pattern>` with `patternUnits="userSpaceOnUse"`, width `4`, height `4`
- Background rect: fill `var(--faction-enemy)` (`#E69F00`)
- Stripe line: `(0,0)` to `(4,4)`, stroke `rgba(0,0,0,0.3)`, width `1`
- Applied via `url(#stripes-[id])` fill on enemy shape

### 2. Token Shape (faction-dependent)

**Friendly (circle):**

- `<circle>` at `(20, 18)`, radius `16`
- Fill: `var(--faction-friendly)` (`#0072B2`)
- Stroke: `var(--cell-border)` (`#444`), width `1`

**Enemy (diamond):**

- `<polygon>` with points forming rotated square at `(20, 18)`, size `16`
- Points: `(20,2) (36,18) (20,34) (4,18)`
- Fill: `url(#stripes-[id])` (striped pattern over `--faction-enemy`)
- Stroke: `var(--cell-border)` (`#444`), width `1`

### 3. Letter Identifier

- SVG `<text>` at `(20, 18)`
- Font: `16px`, weight `bold`
- Fill: `var(--text-on-faction)` (`#ffffff`)
- Font-family: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Text-anchor: `middle`, dominant-baseline: `central`
- `user-select: none`, `pointer-events: none`
- Letter derived from `slotPositionToLetter()` (A, B, C, ... AA, AB, ...)

### 4. HP Bar

- Position: below shape, `y=35`
- Background rect: `(0, 35)`, `40x4`, fill `#333`, opacity `0.8`
- Fill rect: `(0, 35)`, width proportional to HP%, height `4`
- Fill color: `var(--health-high)` (`#4caf50`) when HP > 30%, `var(--health-low)` (`#f44336`) when HP <= 30%
- Transition: `width 0.3s ease-out`

## States

| State         | Visual Effect                                                                                           | CSS                                           |
| ------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Default       | Standard shape + letter + HP bar                                                                        | -                                             |
| Hovered       | Shape opacity `0.9`, brightness `1.1` filter                                                            | `.token:hover .shape`                         |
| Selected      | Triple drop-shadow glow (8px, 16px, 24px) in `--accent-primary`, pulsing animation                      | `.selected` class, `selectionPulse` keyframes |
| Focus-visible | Dual drop-shadow (4px, 8px) in `--interactive-focus`                                                    | `.token:focus-visible`                        |
| HP > 30%      | HP bar green                                                                                            | `--health-high` fill                          |
| HP <= 30%     | HP bar red                                                                                              | `--health-low` fill                           |
| High contrast | Shape stroke-width `2`, letter font-weight `900`, HP bar background uses `--surface-ground` with stroke | `:root[data-theme="high-contrast"]` selectors |

### Selection Pulse Animation

```css
@keyframes selectionPulse {
  0%,
  100% {
    filter: drop-shadow(0 0 8px var(--accent-primary))
      drop-shadow(0 0 16px var(--accent-primary))
      drop-shadow(0 0 24px var(--accent-primary));
  }
  50% {
    filter: drop-shadow(0 0 12px var(--accent-primary))
      drop-shadow(0 0 24px var(--accent-primary))
      drop-shadow(0 0 32px var(--accent-primary));
  }
}
/* Duration: 2s, ease-in-out, infinite */
```

## Conditional Rendering

- **Faction**: Circle (friendly) vs diamond (enemy)
- **Enemy stripe pattern**: Only rendered for enemy faction tokens
- **Selection glow**: Only when character is currently selected
- **HP bar color**: Switches at 30% HP threshold

## Token Mapping

| Property          | Token                 | Resolved Value (dark) |
| ----------------- | --------------------- | --------------------- |
| Friendly fill     | `--faction-friendly`  | `#0072B2`             |
| Enemy fill        | `--faction-enemy`     | `#E69F00`             |
| Letter color      | `--text-on-faction`   | `#ffffff`             |
| Shape stroke      | `--cell-border`       | `#444`                |
| Selection glow    | `--accent-primary`    | `#00a8ff`             |
| Focus glow        | `--interactive-focus` | `#0072b2`             |
| HP high           | `--health-high`       | `#4caf50`             |
| HP low            | `--health-low`        | `#f44336`             |
| HP bar background | hardcoded `#333`      | `#333`                |

## Accessibility

- `role="button"`, `tabindex="0"` on token `<g>`
- `aria-label`: "Character [Letter], [faction]" (e.g., "Character A, friendly")
- `aria-describedby`: links to tooltip `id` when tooltip is shown
- Keyboard: `Enter`/`Space` to select via `onKeyDown` handler
- Shape redundancy: circle (friendly) vs diamond (enemy)
- Pattern redundancy: solid (friendly) vs striped (enemy)
- Focus indicator: drop-shadow glow instead of outline (SVG context)
