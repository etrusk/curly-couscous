# TDD Spec: UI/UX Visual Compliance Sweep

Created: 2026-02-08

## Goal

Conform every component in `src/components/` and every stylesheet in `src/styles/` to the game HUD visual language. Replace web-app styling patterns (Inter font, rem/em units, opaque gray surfaces, thick borders, large padding) with a terminal-overlay aesthetic (monospace font, px units, translucent surfaces, 1px borders, dense spacing). This is a styling-only sweep — no game logic, store logic, engine code, accessibility behavior, or existing non-styling test assertions may be altered.

## Acceptance Criteria

### Phase 1: Token Foundation

- [ ] `src/styles/theme.css` contains all required design tokens: `--ground`, `--surface`, `--surface-hover`, `--border`, `--border-subtle`, `--divider`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-ghost`, `--accent`, `--accent-subtle`, `--accent-muted`, `--danger`, `--danger-subtle`, `--success`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--font-mono`
- [ ] New tokens coexist with existing tokens (no removals)
- [ ] New color tokens use `light-dark()` where trivially possible

### Phase 2: Global Styles

- [ ] `src/index.css` uses `var(--font-mono)` as root font-family (not Inter/system-ui/sans-serif)
- [ ] `src/App.css` uses px units for all spacing (no rem/em)
- [ ] `src/App.css` header `h1` font-size reduced to 16px weight 700
- [ ] `src/App.css` gap values use 8px/12px (not 1rem)
- [ ] Ground color references `var(--ground)` (not `#242424`)

### Phase 3: Components (per-component criteria)

- [ ] **Typography**: All font-family declarations use `var(--font-mono)` — zero Inter/system-ui/sans-serif
- [ ] **Typography**: All font sizes in px — zero rem/em
- [ ] **Typography**: Sizes follow scale (16px title, 12px body, 11px detail, 10px section header/label, 8-9px badge)
- [ ] **Spacing**: All padding/margin/gap in px — zero rem/em
- [ ] **Spacing**: Interactive row height 28-32px, row padding 4-8px, panel padding 8-12px
- [ ] **Borders**: All borders use `1px solid var(--border)` — no `2px solid`, no opaque mid-grays (#555)
- [ ] **Surfaces**: Ground uses `var(--ground)` — no `#242424`/`#2a2a2a`/opaque grays
- [ ] **Surfaces**: Panels use `var(--surface)` — no `var(--surface-primary)`
- [ ] **Controls**: Select elements use InlineSelect pattern (appearance: none, transparent bg/border, visible only on hover)
- [ ] **Controls**: Non-primary buttons are ghost style (no border/bg until hover)
- [ ] **Semantic structure**: Row labels use `<span>` not `<h3>`/`<h4>`
- [ ] **Semantic structure**: Section headers use correct element type with text-transform: uppercase

### Cross-cutting

- [ ] All existing non-styling tests continue to pass
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] Okabe-Ito faction colors unchanged
- [ ] ARIA attributes, focus indicators, shape redundancy unchanged
- [ ] No game logic, store logic, or engine code modified

## Approach

Process one component at a time through the full TDD cycle (explore violations → plan fixes → write structural tests → implement fixes → verify). Token foundation first, global styles second, then components in visual-impact order: BattleViewer, SkillsPanel, CharacterPanel, CharacterControls, PlayControls, BattleStatus, CharacterTooltip, then remaining directories. One commit per component.

### Test Strategy

Tests focus on what Testing Library can verify:

- Rendered elements use correct semantic structure (`span` not `h3` for row labels)
- Section headers render as expected element type with correct text-transform
- InlineSelect controls have correct class/attribute structure
- Row elements have correct semantic structure

Pure CSS value violations (padding sizes, border widths, opacity values) are documented in the plan but fixed directly without computed-style tests.

## Scope Boundaries

- **In scope**: All `.module.css` files in `src/components/`, all files in `src/styles/`, `src/index.css`, `src/App.css`, JSX structure changes for semantic elements (`<h3>` → `<span>`, InlineSelect class application)
- **Out of scope**: Game engine (`src/engine/`), stores (`src/stores/`), hooks (`src/hooks/`), accessibility behavior (ARIA, focus, shape redundancy, Okabe-Ito faction colors), existing non-styling test assertions, SVG rendering logic, game mechanics

## Assumptions

- Existing tokens in `theme.css` remain alongside new tokens for incremental migration — components can be migrated one at a time
- Dark theme is the only active theme; `light-dark()` is structural prep only
- Legacy components (SkillsPanel, InventoryPanel) still receive fixes since they exist in the codebase
- The violation reference table in the task description is the authoritative checklist

## Constraints

- Max 400 lines per file — flag for extraction if exceeded
- TDD workflow: tests before implementation for structural changes
- Conventional commits: one commit per component, token commit first
- TypeScript strict mode compliance maintained
- All `px` units — zero `rem`/`em` in game UI CSS
- Single monospace font stack — zero sans-serif in game UI

## Component Processing Order

1. Token Foundation (`theme.css`)
2. Global Styles (`index.css`, `App.css`)
3. `BattleViewer/` (BattleViewer, Grid, Cell, Token, IntentLine, IntentOverlay, DamageOverlay, DamageNumber, WhiffOverlay, TargetingLine, TargetingLineOverlay, CharacterTooltip)
4. `SkillsPanel/`
5. `CharacterPanel/` (CharacterPanel, PriorityTab, SkillRow, TriggerDropdown)
6. `CharacterControls/`
7. `PlayControls/`
8. `BattleStatus/`
9. `RuleEvaluations/`
10. `InventoryPanel/`
11. `ThemeToggle/`

## Violation Reference

```
font-family: Inter, system-ui          →  font-family: var(--font-mono)
font-size: 1rem / 0.875rem            →  font-size: 12px / 11px
padding: 1rem / 0.75rem               →  padding: 8px / 5px 8px
border: 2px solid var(--border-default)→  border: 1px solid var(--border)
border: 2px solid #555                 →  border: 1px solid var(--border)
gap: 1rem                             →  gap: 8px
background: var(--surface-primary)     →  background: var(--surface)
background: #242424 / #2a2a2a         →  background: var(--ground)
<select> with visible border always    →  InlineSelect: transparent until hover
buttons always showing border/bg       →  ghost until hover
<h3> for skill names / row labels      →  <span> with 12px weight 600
border-bottom: 1px solid (heavy)       →  rgba(255,255,255,0.06) or │ char
padding 12-16px on interactive rows    →  padding 4-8px
row height 48px+                       →  row height 28-32px
multiple font families in same view    →  single monospace everywhere
```
