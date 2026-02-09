# Controls Visual Specification

> Extracted from: `src/components/PlayControls/PlayControls.tsx` + `.module.css`, `src/components/CharacterControls/CharacterControls.tsx` + `.module.css`, `src/components/BattleStatus/BattleStatusBadge.tsx` + `.module.css`
> Last verified: 2026-02-09

## Overview

The controls area sits below the BattleViewer in the left column (grid-column 1, grid-row 2). It contains three components stacked vertically: BattleStatusBadge, CharacterControls, and PlayControls. These provide battle state display, character management, and playback control.

## BattleStatusBadge

### Layout

- Direction: `flex` column
- Gap: `0.5rem`
- Padding: `1rem`
- Border-radius: `4px`
- Font-weight: `500`
- Border: `2px solid` (color varies by status)

### Elements

#### Status Container (flex row)

- Gap: `0.5rem`
- Emoji icon: `1.25rem` font-size, line-height `1`
- Status text: `1rem` font-size

#### Tick Display

- Font-size: `0.875rem`
- Opacity: `0.8`
- Format: "Tick: N"

#### Screen Reader Alert

- `.srOnly`: visually hidden (`1px` width/height, `clip: rect(0,0,0,0)`)
- `role="alert"` for terminal statuses (victory/defeat/draw)

### Status Styles

| Status  | Background Token        | Border Token         | Text Token                | Emoji               |
| ------- | ----------------------- | -------------------- | ------------------------- | ------------------- |
| Active  | `--faction-friendly-bg` | `--faction-friendly` | `--faction-friendly-text` | crossed swords      |
| Victory | `--status-success-bg`   | `--status-success`   | `--status-success-text`   | checkmark           |
| Defeat  | `--status-error-bg`     | `--status-error`     | `--status-error-text`     | X mark              |
| Draw    | `--status-neutral-bg`   | `--status-neutral`   | `--status-neutral-text`   | approximately equal |
| Unknown | `--status-warning-bg`   | `--status-warning`   | `--status-warning-text`   | question mark       |

## CharacterControls

### Layout

- Direction: `flex` row
- Gap: `0.5rem`
- Padding: `1rem`
- Background: `var(--surface-secondary)` (`#1e1e1e`)
- Border-radius: `4px`
- `role="group"`, `aria-label="Character controls"`

### Buttons (4 total)

**Add Friendly, Add Enemy, Move, Remove:**

```css
padding: 0.5rem 1rem;
font-size: 1rem;
font-weight: 500;
color: var(--content-primary);
border: 1px solid var(--border-default);
border-radius: 4px;
background-color: var(--surface-primary);
cursor: pointer;
transition: all 0.2s ease;
```

### Button States

| State                 | Background            | Border                          | Weight | Opacity                                 |
| --------------------- | --------------------- | ------------------------------- | ------ | --------------------------------------- |
| Default               | `--surface-primary`   | `1px solid --border-default`    | `500`  | `1`                                     |
| Hover                 | `--interactive-hover` | `--border-default`              | `500`  | `1`                                     |
| Active (pressed mode) | `--interactive-hover` | `2px solid --interactive-focus` | `600`  | `1`                                     |
| Disabled              | `--surface-primary`   | `--border-default`              | `500`  | `0.5`                                   |
| Focus-visible         | `--surface-primary`   | `--border-default`              | `500`  | `1` + `2px --interactive-focus` outline |

### Conditional Rendering

- Add Friendly/Enemy: disabled when grid is full
- Move: disabled when no character selected
- Remove: disabled when no character selected
- Active state: placement/moving mode toggles button appearance

## PlayControls

### Layout

- Direction: `flex` row
- Gap: `0.5rem`
- Padding: `1rem`
- Background: `var(--surface-secondary)` (`#1e1e1e`)
- Border-radius: `4px`

### Buttons (3 total)

**Step, Play/Pause, Reset:**

Same styling as CharacterControls buttons (identical CSS).

### Button States

| Button     | Enabled When               | Disabled When              |
| ---------- | -------------------------- | -------------------------- |
| Step       | Battle active, not playing | Playing or battle inactive |
| Play/Pause | Battle active              | Battle inactive            |
| Reset      | Always                     | Never                      |

### Auto-Play

- Interval: `1000ms` (TICK_INTERVAL_MS constant)
- Auto-play stops when battle becomes inactive
- Play/Pause toggles auto-stepping

## Token Mapping

| Property            | Token                 | Resolved Value (dark)    |
| ------------------- | --------------------- | ------------------------ |
| Controls background | `--surface-secondary` | `#1e1e1e`                |
| Button background   | `--surface-primary`   | `#2a2a2a`                |
| Button text         | `--content-primary`   | `rgba(255,255,255,0.87)` |
| Button border       | `--border-default`    | `#555`                   |
| Hover background    | `--interactive-hover` | `#3a3a3a`                |
| Focus ring          | `--interactive-focus` | `#0072b2`                |
| Active border       | `--interactive-focus` | `#0072b2`                |
| Disabled opacity    | hardcoded             | `0.5`                    |

## Accessibility

- CharacterControls: `role="group"`, `aria-label="Character controls"`
- Toggle buttons: `aria-pressed` reflects current mode
- All buttons: `aria-label` for screen readers
- BattleStatusBadge: `aria-live="polite"` for status updates
- Terminal statuses: `role="alert"` for assertive announcement
- Focus-visible: `2px solid var(--interactive-focus)`, offset `2px`
- High contrast: Badge border-width increases to `3px`
