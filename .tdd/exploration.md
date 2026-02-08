# Exploration Findings

## Task Understanding

Replace web-app styling patterns with a terminal-overlay aesthetic across the project. This exploration covers Phase 1 (Token Foundation in `theme.css`) and Phase 2 (Global Styles in `index.css` and `App.css`). The sweep is styling-only -- no game logic, store logic, or engine code may change.

Phase 1 adds new semantic design tokens to `theme.css` that coexist with existing tokens.
Phase 2 updates `index.css` (root font-family to monospace) and `App.css` (rem to px, smaller h1, ground color token).

## Relevant Files

### Phase 1: Token Foundation

- `/home/bob/Projects/auto-battler/src/styles/theme.css` - Contains all existing CSS custom properties (274 lines, 3 theme blocks: dark, light, high-contrast). New tokens must be added here, coexisting with existing tokens (no removals).

### Phase 2: Global Styles

- `/home/bob/Projects/auto-battler/src/index.css` - Root font-family declaration (currently `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`). Must change to `var(--font-mono)`. Also has `background-color: var(--surface-ground)` which should become `var(--ground)`.
- `/home/bob/Projects/auto-battler/src/App.css` - Layout styles with rem-based spacing (7 violations) and oversized h1 (`2.5rem`). Must convert to px units and reduce h1 to `16px font-weight: 700`.

### Files that consume existing tokens (relevant for compatibility -- Phase 3+ scope)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` - Uses `var(--surface-primary)` (2x), `var(--border-primary)` (10x, undefined token!)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css` - Uses `var(--surface-primary)` (1x), `var(--border-primary)` (2x)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` - Uses `var(--surface-primary)` (2x), `var(--border-primary)` (4x)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css` - Uses `var(--border-primary)` (2x)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.module.css` - Uses `var(--surface-primary)` (2x), `var(--font-mono, monospace)` (already has forward-reference!)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.module.css` - Uses `var(--surface-primary)` (1x)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.module.css` - Has `system-ui` sans-serif font stack for `.letter` class
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageNumber.module.css` - Has `"Courier New", monospace` font-family
- `/home/bob/Projects/auto-battler/src/components/PlayControls/PlayControls.module.css` - Uses `var(--surface-primary)` (1x)
- `/home/bob/Projects/auto-battler/src/components/CharacterControls/CharacterControls.module.css` - Uses `var(--surface-primary)` (1x)
- `/home/bob/Projects/auto-battler/src/components/ThemeToggle/ThemeToggle.module.css` - Uses `var(--surface-primary)` (1x)
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.module.css` - Uses `var(--surface-primary)` (3x)
- `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.module.css` - Uses `var(--surface-primary)` (1x)
- `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.module.css` - Uses rem units

## Existing Patterns

### Current Token Taxonomy in `theme.css`

Existing tokens (dark theme `:root`, mirrored in light and high-contrast themes):

**Surfaces:**

- `--surface-ground: #242424` (page background)
- `--surface-primary: #2a2a2a` (main content panels)
- `--surface-secondary: #1e1e1e` (nested/scroll containers)
- `--surface-elevated: #ffffff` (tooltips/overlays)

**Content (text):**

- `--content-primary: rgba(255, 255, 255, 0.87)` (main text)
- `--content-secondary: rgba(255, 255, 255, 0.6)` (muted text)
- `--content-muted: rgba(255, 255, 255, 0.38)` (disabled/hints)

**Borders:**

- `--border-default: #555` (panel borders)
- `--border-subtle: #444` (dividers)

**Interactive:**

- `--interactive-hover: #3a3a3a`
- `--interactive-focus: #0072b2`

**Also present:** Faction, Action, Token, Status, Health, Contrast, Targeting, Grid, Scrollbar token groups (all well-structured, not changing in Phase 1-2).

### Token Gap Analysis: Required vs Existing

| Required Token     | Exists? | Closest Existing                                                         | Notes                                        |
| ------------------ | ------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| `--ground`         | NO      | `--surface-ground` (#242424)                                             | New alias needed                             |
| `--surface`        | NO      | `--surface-primary` (#2a2a2a)                                            | New alias needed                             |
| `--surface-hover`  | NO      | `--interactive-hover` (#3a3a3a)                                          | New alias needed                             |
| `--border`         | NO      | `--border-default` (#555)                                                | New token; should use translucent rgba value |
| `--border-subtle`  | EXISTS  | `--border-subtle` (#444)                                                 | Name collision -- see Open Questions         |
| `--divider`        | NO      | none                                                                     | New token (e.g., rgba(255,255,255,0.06))     |
| `--text-primary`   | NO      | `--content-primary`                                                      | New alias needed                             |
| `--text-secondary` | NO      | `--content-secondary`                                                    | New alias needed                             |
| `--text-muted`     | NO      | `--content-muted`                                                        | New alias needed                             |
| `--text-ghost`     | NO      | none                                                                     | New token (very faint text)                  |
| `--accent`         | NO      | `--accent-primary` (#00a8ff)                                             | New alias needed                             |
| `--accent-subtle`  | NO      | none                                                                     | New token                                    |
| `--accent-muted`   | NO      | none                                                                     | New token                                    |
| `--danger`         | NO      | `--status-error` (#d55e00)                                               | New alias needed                             |
| `--danger-subtle`  | NO      | `--status-error-bg`                                                      | New token                                    |
| `--success`        | NO      | `--status-success` (#009e73)                                             | New alias needed                             |
| `--radius-sm`      | NO      | none                                                                     | New token (e.g., 2px)                        |
| `--radius-md`      | NO      | none                                                                     | New token (e.g., 4px)                        |
| `--radius-lg`      | NO      | none                                                                     | New token (e.g., 6px)                        |
| `--font-mono`      | NO      | none (RuleEvaluations uses `var(--font-mono, monospace)` as forward-ref) | New token needed                             |

**Summary:** 1 of 20 required tokens already exists (`--border-subtle`). 19 need to be added. The existing `--border-subtle` may need its value adjusted.

### Theming Strategy

- Three themes already exist: dark (default), light (`data-theme="light"`), high-contrast (`data-theme="high-contrast"`)
- `light-dark()` is NOT used anywhere in the codebase currently
- `color-scheme: light dark` declaration already exists in `index.css` line 9 (required for `light-dark()` to work)

### CSS Modules Pattern

- All component styles use `.module.css` files (23 module CSS files found)
- Architecture doc confirms: "Styling: CSS Modules + CSS Custom Properties (for accessibility theming)"

## Dependencies

- Phase 2 depends on Phase 1 (global styles reference new tokens like `--ground` and `--font-mono`)
- Component phases (3+) depend on both Phase 1 and Phase 2 tokens being in place
- `--border-primary` is referenced 18 times across CharacterPanel components but is NEVER defined in `theme.css` -- this is a pre-existing bug that will need addressing in Phase 3

## Constraints Discovered

### Pre-existing Issues

1. **Undefined `--border-primary` token**: Used 18 times in CharacterPanel/ files (SkillRow 10x, CharacterPanel 2x, TriggerDropdown 4x, PriorityTab 2x) but never defined in `theme.css`. CSS custom properties without fallbacks resolve to `initial` (which for `border-color` means `currentColor`). This is a pre-existing bug, not introduced by this sweep. Will need to be mapped to `--border` during Phase 3 component migration.

2. **Three theme variants**: New tokens must be added to all three theme blocks (dark, light, high-contrast) to maintain parity. `light-dark()` can only cover the dark+light pair; high-contrast still needs its own override block.

3. **`color-scheme: light dark` already declared**: Required for `light-dark()` to function. Already present in `index.css` line 9.

### Phase 2: `App.css` Violations (7 rem values to convert)

| Line | Current               | Target                                     |
| ---- | --------------------- | ------------------------------------------ |
| 5    | `padding: 0.5rem`     | `padding: 8px`                             |
| 13   | `margin-bottom: 1rem` | `margin-bottom: 12px`                      |
| 17   | `font-size: 2.5rem`   | `font-size: 16px` + add `font-weight: 700` |
| 24   | `gap: 1rem`           | `gap: 8px`                                 |
| 32   | `gap: 1rem`           | `gap: 8px` or `12px`                       |
| 33   | `margin-bottom: 1rem` | `margin-bottom: 12px`                      |

### Phase 2: `index.css` Violations (2 changes)

1. Line 5: `font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif` -> `font-family: var(--font-mono)`
2. Line 10: `background-color: var(--surface-ground)` -> `background-color: var(--ground)`

### Codebase-wide Violation Inventory (Phase 3+ reference)

**Font-family violations (4 files outside index.css):**

- `Token.module.css`: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- `DamageNumber.module.css`: "Courier New", monospace
- `RuleEvaluations.module.css`: `monospace` (line 122), `var(--font-mono, monospace)` (line 274 -- already prepared)
- `index.css`: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif (Phase 2 target)

**rem/em violations (150+ occurrences in 14 component CSS files):**

- SkillRow.module.css: 44 occurrences (heaviest user)
- RuleEvaluations.module.css: 42 occurrences
- CharacterTooltip.module.css: 28 occurrences
- CharacterPanel.module.css: 6 occurrences
- PriorityTab.module.css: 10 occurrences
- TriggerDropdown.module.css: 10 occurrences
- InventoryPanel.module.css: 16 occurrences
- SkillsPanel.module.css: 24 occurrences
- PlayControls.module.css: 4 occurrences
- CharacterControls.module.css: 4 occurrences
- BattleStatusBadge.module.css: 6 occurrences
- ThemeToggle.module.css: 4 occurrences
- BattleViewer.module.css: 1 occurrence
- App.css: 7 occurrences (Phase 2 target)

**`2px solid` border violations (14 occurrences in 8 files):**

- SkillsPanel.module.css: border (1x) + outlines (2x)
- InventoryPanel.module.css: border (1x)
- PlayControls.module.css: outline (1x)
- BattleStatusBadge.module.css: border (1x)
- ThemeToggle.module.css: border (1x) + outlines (2x)
- CharacterControls.module.css: outline (1x) + border (1x)
- RuleEvaluations.module.css: border (1x)
- CharacterTooltip.module.css: border (1x)

NOTE: `outline: 2px solid` for focus indicators (PlayControls, ThemeToggle, CharacterControls) are accessibility features and may need to remain 2px.

**`var(--surface-primary)` usage (17 occurrences in 10 files):**
All will need migration to `var(--surface)` in Phase 3+.

**`#242424`/`#2a2a2a` hardcoded in components:** None found. These values only appear in `theme.css` token definitions, not in component CSS. Good -- components already use tokens.

## Open Questions

1. **`light-dark()` strategy**: The requirements say "use `light-dark()` where trivially possible." Since there are three themes (dark, light, high-contrast), `light-dark()` only covers two. Should new tokens use `light-dark()` in `:root` and then override in the high-contrast block? Or should all three theme blocks define values independently as existing tokens do? Recommendation: Use `light-dark()` for dark/light pairs in `:root`, override in high-contrast block.

2. **`--border-subtle` naming collision**: The existing `--border-subtle: #444` has the same name as a required new token. Since the requirement says "new tokens coexist with existing tokens (no removals)," this token effectively already exists. The planner needs to decide whether to adjust its value (e.g., from `#444` to a translucent rgba) or keep it as-is.

3. **Focus ring outlines**: Several `outline: 2px solid` declarations exist for focus indicators. These are accessibility features. The requirements say "All borders use 1px solid" but outlines serve a different purpose. Planner should clarify whether outlines are in scope.

4. **`--ground` vs `--surface-ground` aliasing**: Should `--ground` reference `--surface-ground` (e.g., `--ground: var(--surface-ground)`) or have an independent value? Same question for `--surface` vs `--surface-primary`, `--accent` vs `--accent-primary`, `--danger` vs `--status-error`, `--success` vs `--status-success`. Using aliases creates a dependency chain; independent values are more resilient but harder to maintain. Recommendation: Independent values, since the new tokens represent the terminal-overlay aesthetic and may diverge from the old tokens over time.

5. **Font token value**: What monospace font stack should `--font-mono` use? Options:
   - `"Courier New", monospace` (matches existing DamageNumber)
   - `"JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", monospace` (modern dev fonts)
   - Simply `monospace` (minimalist)
     Recommendation: Let the planner decide, but `monospace` is safest (no external font dependencies).

6. **`--border-primary` pre-existing bug**: Should Phase 1 add `--border-primary` as an alias for `--border` to fix the 18 CharacterPanel references proactively, or leave this for Phase 3 component migration? The requirements do not list `--border-primary` as a required token. Recommendation: Leave for Phase 3 (out of scope for token foundation).
