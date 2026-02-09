# CharacterTooltip Visual Specification

> Extracted from: `src/components/BattleViewer/CharacterTooltip.tsx` + `CharacterTooltip.module.css`
> Last verified: 2026-02-09

## Overview

CharacterTooltip is a portal-rendered tooltip that appears when hovering over a character token on the hex grid. It displays the character's next action, skill priority list with evaluation status, and collapsible sections for skipped skills. Smart viewport-aware positioning places it to the right or left of the token.

## Layout

- Rendering: `createPortal()` to `document.body`
- Position: `fixed`
- z-index: `1000` (above all overlays)
- Min-width: `280px`
- Max-width: `320px`
- Background: `var(--surface-primary)`
- Border: `2px solid var(--border-default)`
- Border-radius: `6px`
- Box-shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`
- Pointer-events: `auto` (tooltip is interactive -- user can hover on it)
- Entry animation: `fadeIn 150ms ease-out` (opacity 0 to 1)

## Positioning Logic

- Prefers right of token anchor
- Falls back to left if right side constrained by viewport
- Vertically centered on token, clamped to viewport bounds
- Calculated via `useLayoutEffect` after render using `getBoundingClientRect()`
- 100ms leave delay allows mouse to travel from token to tooltip

## Elements (top to bottom)

### 1. Tooltip Content Container

- Padding: `0.75rem`
- Color: `var(--content-primary)`

### 2. Header

- Font: `1rem`, weight `600`
- Color: `var(--content-primary)`
- Margin-bottom: `0.75rem`
- Padding-bottom: `0.5rem`
- Border-bottom: `1px solid var(--border-subtle)`
- Content: Character letter (A, B, C, etc.)

### 3. Next Action Section

- Section header: `0.875rem`, weight `600`, `var(--content-secondary)`, uppercase, `letter-spacing: 0.05em`
- Action display box:
  - Padding: `0.75rem`
  - Background: `var(--surface-secondary)`
  - Border: `1px solid var(--border-subtle)`
  - Border-radius: `4px`
- Action text: `1rem`, weight `500`, `var(--content-primary)`
- Action note: `0.75rem`, italic, `var(--content-muted)`
- Action timing: `0.75rem`, `var(--content-secondary)`

### 4. Skill Priority Section

- Margin-top: `1rem`
- Section header: same uppercase style as Next Action

### 5. Skill List (ordered)

- Container: `padding-left: 1.5rem`, `list-style: none`, `counter-reset: skill-counter`

### 6. Skill Item (per skill)

- Margin-bottom: `0.75rem`
- Padding: `0.5rem`
- Background: `var(--surface-secondary)`
- Border-radius: `4px`
- Border-left: `3px solid var(--border-default)` (default)
- Active skill: border-left `var(--faction-friendly)`, background `var(--faction-friendly-bg)`

#### Skill Name

- Font: `0.875rem`, weight `500`
- Color: `var(--content-primary)`

#### Selected Arrow

- Color: `var(--faction-friendly)`
- Weight: `700`
- Margin-right: `0.25rem`
- Content: arrow indicator

#### Rejection Reason

- Color: `var(--content-muted)`
- Font: `0.8125rem`, weight `400`, italic

### 7. Collapsible Skills Section

- Uses native `<details>/<summary>` elements
- Summary: `0.5rem` padding, `0.8125rem` font, `var(--content-secondary)`, `var(--surface-secondary)` background, `1px solid var(--border-subtle)` border, border-radius `4px`
- Summary hover: background `var(--interactive-hover)`, color `var(--content-primary)`
- Default disclosure triangle hidden (`list-style: none`, `::-webkit-details-marker { display: none }`)
- Content: "Show N more skill evaluations"

### 8. Mid-Action Display (alternative view)

- Replaces normal view when character is mid-action
- Shows current action with timing information

## States

| State                    | Content                                              |
| ------------------------ | ---------------------------------------------------- |
| Idle (no pending action) | Header + "Idle" next action + full skill priority    |
| Pending action           | Header + action details with timing + skill priority |
| Mid-action               | MidActionDisplay with current action info            |
| Skipped skills exist     | Collapsible section at bottom                        |

## Conditional Rendering

- **Mid-action**: Shows MidActionDisplay instead of normal header + NextAction + SkillPriority
- **Collapsible section**: Only when there are skipped skills (lower priority than selected)
- **Selected skill**: Highlighted with faction-friendly colors and left border
- **Rejection reasons**: Shown inline in italic for rejected skills

## Token Mapping

| Property            | Token                   | Resolved Value (dark)    |
| ------------------- | ----------------------- | ------------------------ |
| Tooltip background  | `--surface-primary`     | `#2a2a2a`                |
| Tooltip border      | `--border-default`      | `#555`                   |
| Tooltip radius      | hardcoded               | `6px`                    |
| Content padding     | hardcoded               | `0.75rem`                |
| Header text         | `--content-primary`     | `rgba(255,255,255,0.87)` |
| Section header text | `--content-secondary`   | `rgba(255,255,255,0.6)`  |
| Skill item bg       | `--surface-secondary`   | `#1e1e1e`                |
| Skill item border   | `--border-default`      | `#555`                   |
| Active skill bg     | `--faction-friendly-bg` | `color-mix(#0072b2 15%)` |
| Active skill border | `--faction-friendly`    | `#0072B2`                |
| Selected arrow      | `--faction-friendly`    | `#0072B2`                |
| Rejection text      | `--content-muted`       | `rgba(255,255,255,0.38)` |

## Accessibility

- `role="tooltip"` on container
- `id` matches token's `aria-describedby`
- Hover interaction: `onMouseEnter`/`onMouseLeave` on tooltip itself (keeps tooltip open while hovering)
- Collapsible sections use native `<details>/<summary>` (keyboard accessible)
- Custom summary styling removes default disclosure triangle
