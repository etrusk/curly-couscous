# UI/UX Design Guidelines

> General rules for all components. LLM agents MUST read this file before any UI/styling work.
> Component-specific visual specs live in `.docs/visual-specs/`.
> Last verified: 2026-02-11

## Design Principles

1. **Density over whitespace.** Prefer compact layouts that show more information simultaneously. Use tight padding (`0.25rem`-`0.5rem`), small gaps (`0.25rem`-`0.5rem`), and condensed font sizes (`0.75rem`-`0.85rem`) for data rows. Reserve larger spacing (`1rem`) only for section-level separation.

2. **Monospace unifies the interface.** All UI text uses a monospace font stack (`--font-mono`). This creates a terminal/HUD cohesion where data alignment is natural and the interface reads as a unified instrument panel rather than a web page.

3. **Opacity creates text hierarchy.** Instead of using multiple font sizes, create visual hierarchy through opacity levels: primary (`rgba(255,255,255,0.87)`), secondary (`rgba(255,255,255,0.6)`), muted (`rgba(255,255,255,0.38)`), ghost (`rgba(255,255,255,0.15)`). Font weight (`400`-`700`) adds a secondary hierarchy axis.

4. **Controls are invisible until needed.** Interactive elements (buttons, selects) use transparent or near-transparent backgrounds that blend with their row until hovered. This reduces visual noise while keeping controls accessible. Borders use subtle tokens (`--border`, `rgba(255,255,255,0.12)` in dark mode).

5. **Color is reserved for meaning.** The base UI is achromatic (grays/whites). Color appears only to encode game semantics: faction identity (blue `#0072B2` / orange `#E69F00`), action types (attack red-orange `#d55e00` / heal green `#009e73` / move blue `#0072b2`), and status states (success/error/warning). Never use color decoratively.

## Token System

All design tokens are defined in `src/styles/theme.css` as CSS custom properties on `:root`. The system has two layers: **legacy tokens** (used across all components) and **terminal overlay tokens** (semantic layer for the HUD aesthetic).

### Terminal Overlay Tokens (Current)

These are the primary tokens for new and migrated components.

#### Surfaces

| Token             | Dark Value               | Usage                      |
| ----------------- | ------------------------ | -------------------------- |
| `--ground`        | `#1a1a2e`                | Page background            |
| `--surface`       | `rgba(255,255,255,0.03)` | Subtle element backgrounds |
| `--surface-hover` | `rgba(255,255,255,0.06)` | Hover state backgrounds    |

#### Borders & Dividers

| Token       | Dark Value               | Usage                    |
| ----------- | ------------------------ | ------------------------ |
| `--border`  | `rgba(255,255,255,0.12)` | Standard borders         |
| `--divider` | `rgba(255,255,255,0.06)` | Light section separators |

#### Text

| Token              | Dark Value               | Usage                                 |
| ------------------ | ------------------------ | ------------------------------------- |
| `--text-primary`   | `rgba(255,255,255,0.87)` | Main text, labels                     |
| `--text-secondary` | `rgba(255,255,255,0.6)`  | Muted labels, placeholders            |
| `--text-muted`     | `rgba(255,255,255,0.38)` | Disabled text, hints, cooldown badges |
| `--text-ghost`     | `rgba(255,255,255,0.15)` | Background-level text                 |

#### Accent

| Token             | Dark Value                                           | Usage                                  |
| ----------------- | ---------------------------------------------------- | -------------------------------------- |
| `--accent`        | `#00a8ff`                                            | Selection glow, interactive highlights |
| `--accent-subtle` | `color-mix(in srgb, var(--accent) 15%, transparent)` | Tinted backgrounds                     |
| `--accent-muted`  | `color-mix(in srgb, var(--accent) 8%, transparent)`  | Very subtle tints                      |

#### Status

| Token             | Dark Value                                           | Usage                             |
| ----------------- | ---------------------------------------------------- | --------------------------------- |
| `--danger`        | `#d55e00`                                            | Error states, destructive actions |
| `--danger-subtle` | `color-mix(in srgb, var(--danger) 15%, transparent)` | Error backgrounds                 |
| `--success`       | `#009e73`                                            | Success states                    |

#### Radii

| Token         | Value | Usage                       |
| ------------- | ----- | --------------------------- |
| `--radius-sm` | `2px` | Small elements (badges)     |
| `--radius-md` | `4px` | Standard containers, panels |
| `--radius-lg` | `6px` | Large containers, tooltips  |

#### Typography

| Token         | Value                                                                     | Usage       |
| ------------- | ------------------------------------------------------------------------- | ----------- |
| `--font-mono` | `"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace` | All UI text |

### Legacy Tokens (Shared)

These tokens are used across both migrated and non-migrated components. They coexist with terminal overlay tokens.

#### Surfaces

| Token                 | Dark Value | Usage                                               |
| --------------------- | ---------- | --------------------------------------------------- |
| `--surface-ground`    | `#242424`  | Fallback page background                            |
| `--surface-primary`   | `#2a2a2a`  | Panel backgrounds, select backgrounds               |
| `--surface-secondary` | `#1e1e1e`  | Nested elements, scroll containers, row backgrounds |
| `--surface-elevated`  | `#ffffff`  | Tooltips, damage number backgrounds                 |

#### Content

| Token                 | Dark Value               | Usage                                      |
| --------------------- | ------------------------ | ------------------------------------------ |
| `--content-primary`   | `rgba(255,255,255,0.87)` | Main text (equivalent to `--text-primary`) |
| `--content-secondary` | `rgba(255,255,255,0.6)`  | Muted text                                 |
| `--content-muted`     | `rgba(255,255,255,0.38)` | Disabled/hint text                         |

#### Borders

| Token              | Dark Value | Usage                         |
| ------------------ | ---------- | ----------------------------- |
| `--border-default` | `#555`     | Panel borders, button borders |
| `--border-subtle`  | `#444`     | Dividers, internal borders    |

#### Interactive

| Token                 | Dark Value | Usage             |
| --------------------- | ---------- | ----------------- |
| `--interactive-hover` | `#3a3a3a`  | Hover backgrounds |
| `--interactive-focus` | `#0072b2`  | Focus ring color  |

#### Faction (Okabe-Ito, preserved across all themes)

| Token                     | Value                                                          | Usage                      |
| ------------------------- | -------------------------------------------------------------- | -------------------------- |
| `--faction-friendly`      | `#0072b2`                                                      | Friendly blue              |
| `--faction-enemy`         | `#e69f00`                                                      | Enemy orange               |
| `--faction-friendly-bg`   | `color-mix(in srgb, var(--faction-friendly) 15%, transparent)` | Friendly tinted background |
| `--faction-enemy-bg`      | `color-mix(in srgb, var(--faction-enemy) 15%, transparent)`    | Enemy tinted background    |
| `--faction-friendly-text` | `#4da6ff`                                                      | Friendly text on tinted bg |
| `--faction-enemy-text`    | `#ffb84d`                                                      | Enemy text on tinted bg    |

#### Action (Intent line colors)

| Token             | Value     | Usage                                      |
| ----------------- | --------- | ------------------------------------------ |
| `--action-attack` | `#d55e00` | Attack intent lines (Okabe-Ito vermillion) |
| `--action-heal`   | `#009e73` | Heal intent lines (Okabe-Ito bluish green) |
| `--action-move`   | `#0072b2` | Move intent lines (Okabe-Ito blue)         |

#### Token / Character Icons

| Token               | Dark Value | Usage                                     |
| ------------------- | ---------- | ----------------------------------------- |
| `--text-on-faction` | `#ffffff`  | White text on colored faction backgrounds |
| `--accent-primary`  | `#00a8ff`  | Selection glow, accent highlights         |

#### Status

| Token                   | Dark Value                                                   | Usage              |
| ----------------------- | ------------------------------------------------------------ | ------------------ |
| `--status-success`      | `#009e73`                                                    | Victory            |
| `--status-success-bg`   | `color-mix(in srgb, var(--status-success) 15%, transparent)` | Victory badge bg   |
| `--status-success-text` | `#00c48c`                                                    | Victory badge text |
| `--status-error`        | `#d55e00`                                                    | Defeat             |
| `--status-error-bg`     | `color-mix(in srgb, var(--status-error) 15%, transparent)`   | Defeat badge bg    |
| `--status-error-text`   | `#ff7f3d`                                                    | Defeat badge text  |
| `--status-warning`      | `#cc9a06`                                                    | Unknown            |
| `--status-warning-bg`   | `color-mix(in srgb, var(--status-warning) 15%, transparent)` | Warning badge bg   |
| `--status-warning-text` | `#e6b800`                                                    | Warning badge text |
| `--status-neutral`      | `#999`                                                       | Draw               |
| `--status-neutral-bg`   | `color-mix(in srgb, var(--status-neutral) 15%, transparent)` | Draw badge bg      |
| `--status-neutral-text` | `#bbb`                                                       | Draw badge text    |

#### Health

| Token           | Value     | Usage            |
| --------------- | --------- | ---------------- |
| `--health-high` | `#4caf50` | HP > 30% (green) |
| `--health-low`  | `#f44336` | HP <= 30% (red)  |

#### Grid

| Token             | Dark Value | Usage                  |
| ----------------- | ---------- | ---------------------- |
| `--grid-bg`       | `#1e1e1e`  | Battle grid background |
| `--grid-border`   | `#666`     | Grid outer border      |
| `--cell-bg`       | `#2a2a2a`  | Hex cell fill          |
| `--cell-border`   | `#444`     | Hex cell stroke        |
| `--cell-hover-bg` | `#3a3a3a`  | Hex cell hover fill    |

#### Scrollbar

| Token                     | Dark Value | Usage                      |
| ------------------------- | ---------- | -------------------------- |
| `--scrollbar-track`       | `#2a2a2a`  | Scrollbar track background |
| `--scrollbar-thumb`       | `#555`     | Scrollbar thumb            |
| `--scrollbar-thumb-hover` | `#666`     | Scrollbar thumb hover      |

#### Contrast

| Token                    | Value     | Usage                       |
| ------------------------ | --------- | --------------------------- |
| `--contrast-line`        | `#ffffff` | Intent line white outlines  |
| `--targeting-line-color` | `#888888` | Targeting line neutral gray |

## Typography Scale

All text uses `var(--font-mono)` (`"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace`).

| Role              | Size                | Weight      | Color Token                               | Usage Example                                                 |
| ----------------- | ------------------- | ----------- | ----------------------------------------- | ------------------------------------------------------------- |
| Page title        | `16px`              | `700`       | `--content-primary`                       | App header `<h1>`                                             |
| Section header    | `1.125rem`          | `600`       | `--content-primary`                       | RuleEvaluations panel header                                  |
| Panel title       | `1.1rem`            | `600`       | `--text-primary`                          | CharacterPanel title                                          |
| Section title     | `0.95rem`           | `600`       | `--text-primary`                          | PriorityTab section title                                     |
| Body text         | `1rem`              | `400`-`500` | `--content-primary`                       | BattleStatusBadge status text, button labels                  |
| Row label         | `0.9rem`            | `500`       | `--text-primary`                          | Inventory skill name                                          |
| Control text      | `0.85rem`           | `400`       | `--text-primary`                          | Select dropdowns, battle mode font size                       |
| Subsection header | `0.875rem`          | `600`       | `--content-secondary`                     | Tooltip section headers (uppercase, `letter-spacing: 0.05em`) |
| Badge / small     | `0.75rem`           | `400`-`600` | `--text-muted` / `--text-secondary`       | Cooldown badge, priority buttons, timing text                 |
| NOT toggle        | `0.7rem`            | `600`       | `--text-secondary`                        | TriggerDropdown NOT button (uppercase)                        |
| Tooltip body      | `0.8125rem`         | `400`       | `--content-secondary` / `--content-muted` | Rejection reasons, collapsed summary                          |
| Tick display      | `0.875rem`          | `400`       | inherited                                 | BattleStatusBadge tick, opacity 0.8                           |
| Placeholder       | `0.875rem`-`0.9rem` | `400`       | `--text-secondary` / `--content-muted`    | Empty state text (italic)                                     |
| SVG damage text   | `14px`              | `bold`      | `#333`                                    | DamageNumber (uses `--font-mono`)                             |

### Root Typography

```css
:root {
  font-family: var(--font-mono);
  line-height: 1.5;
  font-weight: 400;
  color: var(--content-primary);
}
```

## Spacing Scale

| Context                 | Value                              | Where Used                                                                      |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| App padding             | `8px`                              | `.app` wrapper                                                                  |
| Grid gap (layout)       | `12px`                             | `.gridContainer` gap between panels                                             |
| Section gap             | `1rem`                             | PriorityTab gap, tooltip `skillPrioritySection` margin-top                      |
| Panel padding           | `1rem`                             | CharacterPanel header/content, PlayControls, CharacterControls, RuleEvaluations |
| Skill list gap          | `0.5rem`                           | PriorityTab `.skillList` gap                                                    |
| Row padding             | `0.5rem`                           | SkillRow, inventory row                                                         |
| Row padding (battle)    | `0.25rem 0.5rem`                   | SkillRow in battle mode                                                         |
| Row gap                 | `0.5rem`                           | SkillRow config mode                                                            |
| Row gap (battle)        | `0.35rem`                          | SkillRow battle mode                                                            |
| Control gap             | `0.25rem`                          | TriggerDropdown, filter group, priority button column                           |
| Control padding         | `0.25rem 0.5rem`                   | Select, input, priority buttons                                                 |
| Button padding          | `0.5rem 1rem`                      | PlayControls, CharacterControls buttons                                         |
| Action button padding   | `0.25rem 0.75rem`                  | Assign, unassign, duplicate, remove buttons                                     |
| Small button padding    | `0.15rem 0.35rem`-`0.15rem 0.5rem` | Add trigger/filter buttons, NOT toggle                                          |
| Tooltip content padding | `0.75rem`                          | CharacterTooltip inner content                                                  |
| BattleViewer padding    | `20px`                             | BattleViewer wrapper                                                            |
| Header margin bottom    | `12px`                             | App header                                                                      |

## Component Patterns

### Panel Container

```css
/* CharacterPanel.module.css → .panel */
display: flex;
flex-direction: column;
height: 100%;
background: var(--surface-primary);
border: 1px solid var(--border);
border-radius: var(--radius-md);
overflow: hidden;
```

### Interactive Row

```css
/* SkillRow.module.css → .skillRow (12-column grid) */
display: grid;
grid-template-columns:
  /* 1: checkbox    */
  auto
  /* 2: status icon */ 1.5rem
  /* 3: priority    */ auto
  /* 4: name        */ 9rem
  /* 5: eval        */ 12rem
  /* 6: trigger     */ auto
  /* 7: target      */ auto
  /* 8: selector    */ auto
  /* 9: filter      */ auto
  /* 10: behavior   */ minmax(0, auto)
  /* 11: spacer     */ 1fr
  /* 12: actions    */ auto;
align-items: center;
column-gap: 0.5rem;
padding: 0.5rem;
background: var(--surface-secondary);
border: 1px solid var(--border);
border-radius: var(--radius-md);

/* Battle mode compact variant */
.skillRow.battleMode {
  grid-template-columns: auto 1.5rem auto 7.5rem 10rem auto auto auto auto minmax(
      0,
      auto
    ) 1fr auto;
  padding: 0.25rem 0.5rem;
  column-gap: 0.35rem;
  font-size: 0.85rem;
}
```

### Section Header

```css
/* CharacterTooltip.module.css → .sectionHeader */
margin: 0 0 0.5rem 0;
font-size: 0.875rem;
font-weight: 600;
color: var(--content-secondary);
text-transform: uppercase;
letter-spacing: 0.05em;
```

### Buttons

**Standard button (PlayControls, CharacterControls):**

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

/* Hover */
background-color: var(--interactive-hover);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;

/* Focus */
outline: 2px solid var(--interactive-focus);
outline-offset: 2px;

/* Active/pressed */
background-color: var(--interactive-hover);
font-weight: 600;
border: 2px solid var(--interactive-focus);
```

**Action button (assign, unassign, duplicate, remove):**

```css
padding: 0.25rem 0.75rem;
font-size: 0.85rem;
border: 1px solid var(--border);
background: var(--surface-hover);
color: var(--text-primary);
cursor: pointer;
border-radius: 3px;
```

**Primary button (assign):**

```css
background: var(--accent-primary);
color: var(--text-on-faction);
/* Hover: filter: brightness(1.1) */
```

**Danger hover (remove, NOT active):**

```css
background: var(--health-low);
color: var(--text-on-faction);
```

**Ghost button (add trigger/filter):**

```css
padding: 0.15rem 0.5rem;
font-size: 0.75rem;
border: 1px dashed var(--border);
background: transparent;
color: var(--text-secondary);
/* Hover: background: var(--surface-hover); color: var(--text-primary); */
```

### Select Controls

Standard `<select>` elements, no custom InlineSelect component:

```css
padding: 0.25rem 0.5rem;
border: 1px solid var(--border);
border-radius: 3px;
background: var(--surface-primary);
color: var(--text-primary);
font-size: 0.85rem;
```

### Badges

**Cooldown badge:**

```css
font-size: 0.75rem;
color: var(--text-muted);
margin-left: 0.5em;
font-weight: normal;
```

**Status badge (BattleStatusBadge):**

```css
display: flex;
flex-direction: column;
gap: 0.5rem;
padding: 1rem;
border-radius: 4px;
font-weight: 500;
border: 2px solid;
/* Color varies by status: faction-friendly, status-success, status-error, status-neutral */
```

### Evaluation Status Indicators

```css
/* Selected: green check */
.statusSelected {
  border-left: 3px solid var(--health-high);
}
.statusSelected .statusIcon {
  color: var(--health-high);
}

/* Rejected: red X */
.statusRejected {
  border-left: 3px solid var(--health-low);
}
.statusRejected .statusIcon {
  color: var(--health-low);
}

/* Skipped: dimmed */
.statusSkipped {
  opacity: 0.6;
}
.statusSkipped .statusIcon {
  color: var(--text-secondary);
}
```

## Accessibility Rules

### Shape Redundancy

- **Friendly faction**: Circle shape (SVG `<circle>`)
- **Enemy faction**: Diamond shape (SVG `<polygon>`, rotated square)
- **Movement intent endpoints**: Circle (friendly) / Diamond (enemy) retain faction shapes
- **Attack/heal markers**: Uniform across factions (arrowhead for attack, cross for heal)

### Pattern Fills

- **Friendly tokens**: Solid fill (`--faction-friendly`)
- **Enemy tokens**: Diagonal stripe pattern (45deg, 4px width) over solid fill (`--faction-enemy`)

### Color Palette (Okabe-Ito colorblind-safe)

| Color        | Hex       | Usage                                          |
| ------------ | --------- | ---------------------------------------------- |
| Blue         | `#0072B2` | Friendly faction, move action                  |
| Orange       | `#E69F00` | Enemy faction                                  |
| Vermillion   | `#d55e00` | Attack/interrupt/charge actions                |
| Bluish green | `#009e73` | Heal action, success status                    |
| White        | `#ffffff` | Text on faction backgrounds, contrast outlines |

### Focus Indicators

```css
/* Standard focus ring */
outline: 2px solid var(--interactive-focus);
outline-offset: 2px;

/* SVG token focus (drop-shadow) */
filter: drop-shadow(0 0 4px var(--interactive-focus))
  drop-shadow(0 0 8px var(--interactive-focus));
```

### ARIA Patterns

| Component            | Role                  | ARIA Attributes                                              |
| -------------------- | --------------------- | ------------------------------------------------------------ |
| Grid SVG             | `role="grid"`         | `aria-label="Battle grid with 91 cells"`                     |
| Cell `<g>`           | `role="gridcell"`     | `aria-label` with position info                              |
| Token `<g>`          | `role="button"`       | `aria-label="Character [Letter], [faction]"`, `tabindex="0"` |
| CharacterControls    | `role="group"`        | `aria-label="Character controls"`                            |
| Buttons              | native `<button>`     | `aria-label`, `aria-pressed` for toggles                     |
| Tooltip              | `role="tooltip"`      | `id` linked to token `aria-describedby`                      |
| BattleStatusBadge    | `aria-live="polite"`  | Terminal statuses trigger `role="alert"`                     |
| Collapsible sections | `<details>/<summary>` | Native keyboard accessible                                   |

### Keyboard Navigation

- Tokens: `Enter`/`Space` to select (via `tabindex="0"`)
- ThemeToggle: `Enter`/`Space` to toggle
- All buttons: native keyboard support
- Collapsible sections: native `<details>` keyboard support

### Screen Reader Support

- `.srOnly` class for visually hidden but accessible content
- Terminal battle statuses announced via `role="alert"`
- Status changes use `aria-live="polite"`

## Anti-Patterns

| Don't                                      | Do                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Use multiple font families in game UI      | Use `var(--font-mono)` exclusively (exception: Token letter uses `system-ui` for SVG rendering) |
| Use raw color values in component CSS      | Use CSS custom property tokens from `theme.css`                                                 |
| Add large padding/margins (>1rem for rows) | Use compact spacing: `0.25rem`-`0.5rem` for rows, `1rem` for sections                           |
| Make buttons visually prominent by default | Use transparent/subtle backgrounds; reveal on hover                                             |
| Use color alone to convey information      | Combine color with shape (circle/diamond), pattern (solid/stripe), and text                     |
| Create custom dropdown components          | Use native `<select>` elements with theme tokens                                                |
| Add decorative borders or shadows to rows  | Use `1px solid var(--border)` only                                                              |
| Use box-shadow for depth in panels         | Reserve box-shadow for tooltips only (`0 4px 12px rgba(0,0,0,0.3)`)                             |
| Nest z-index above overlay stack           | Follow z-order: grid(0) < whiff(5) < intents(10) < damage(20) < tooltip(1000)                   |
| Use `px` for text-related spacing          | Use `rem` for spacing/font-size; `px` only for SVG/borders                                      |
| Create separate light-theme CSS files      | Use `light-dark()` in `:root` + `color-scheme` swap                                             |

## Theme Scope

### Implemented Themes

| Theme         | Attribute                                          | Status                                |
| ------------- | -------------------------------------------------- | ------------------------------------- |
| Dark          | `color-scheme: dark` (default)                     | Active, primary development theme     |
| Light         | `[data-theme="light"]` sets `color-scheme: light`  | Functional via `light-dark()`         |
| High Contrast | `[data-theme="high-contrast"]` full override block | Functional, `color-scheme: dark` base |

### Prototyping Scope

- **Dark theme only** is the active development theme during prototyping
- Light and high-contrast themes are functional but not visually refined
- Theme toggle exists (`ThemeToggle` component, dark/light only)
- High-contrast is treated as a separate accessibility control (not in toggle)

### Theme Architecture

- `:root` block uses `light-dark()` for ~43 theme-dependent variables
- `color-mix()` used for derived alpha tokens
- `[data-theme="light"]` only sets `color-scheme: light` (triggers `light-dark()` swap)
- `[data-theme="high-contrast"]` provides full override block with enhanced values
- `[data-high-contrast="true"]` is a separate orthogonal flag for border enhancement

## Visual Spec Workflow

1. **Prototype** -- JSX/HTML mockup created and rendered in browser
2. **Approve** -- Human confirms visual direction
3. **Extract** -- Convert to LLM-readable spec in `.docs/visual-specs/*.md`
4. **Implement** -- Architect reads spec + this guidelines file + `architecture.md`
5. **Verify** -- Human confirms in browser
