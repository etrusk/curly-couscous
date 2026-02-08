# Exploration Findings

## Task Understanding

Fix the undefined `--border-primary` CSS custom property (referenced 18 times in CharacterPanel components but never defined in theme.css) and migrate component CSS files to use the terminal overlay design tokens established in Phase 1+2. This is a CSS-only task -- no logic or DOM changes.

## `--border-primary` Usage Locations (18 references)

### SkillRow.module.css (10 references)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:7` - `.skillRow` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:75` - `.priorityControls button` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:94` - `.select` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:104` - `.input` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:129` - `.addTriggerBtn` dashed border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:144` - `.duplicateBtn` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:154` - `.removeBtn` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:169` - `.unassignBtn` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:207` - `.addFilterBtn` dashed border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css:222` - `.removeFilterBtn` border

### CharacterPanel.module.css (2 references)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css:10` - `.panel` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css:28` - `.header` border-bottom

### PriorityTab.module.css (2 references)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css:45` - `.inventoryRow` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css:58` - `.assignBtn` border

### TriggerDropdown.module.css (4 references)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css:9` - `.select` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css:19` - `.input` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css:29` - `.removeBtn` border
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css:46` - `.notToggle` border

## `--border-primary` Resolution Strategy

`--border-primary` is NOT defined in any theme block in theme.css. The defined border tokens are:

**Legacy layer:**

- `--border-default` (dark: `#555`, light: `#999`, high-contrast: `#ffffff`) - panel borders
- `--border-subtle` (dark: `#444`, light: `#ddd`, high-contrast: `#666666`) - dividers, internal borders

**Terminal overlay layer (new):**

- `--border` (dark: `rgba(255,255,255,0.12)`, light: `rgba(0,0,0,0.12)`, high-contrast: `#ffffff`) - general borders
- `--divider` (dark: `rgba(255,255,255,0.06)`, light: `rgba(0,0,0,0.06)`, high-contrast: `rgba(255,255,255,0.15)`) - subtle dividers

**Recommended approach:** Replace all 18 `--border-primary` references with `--border` (the terminal overlay token). This aligns with the ADR-019 direction of migrating to terminal overlay tokens. The `--border` token serves the same semantic purpose (general element borders) and is defined in all 3 theme blocks.

## Additional Undefined Tokens Found

Besides `--border-primary`, several other undefined tokens are referenced in component CSS:

### `--surface-tertiary` (12 references, NOT in theme.css)

Used in: SkillRow.module.css (6x), TriggerDropdown.module.css (1x), RuleEvaluations.module.css (2x), SkillsPanel.module.css (2x), InventoryPanel.module.css (1x)
**Recommendation:** Replace with `--surface-hover` (terminal overlay) or `--interactive-hover` (legacy).

### `--text-on-accent` (1 reference, NOT in theme.css)

Used in: PriorityTab.module.css:63 (`.assignBtn` color)
**Recommendation:** Replace with `--text-primary` or use the existing `--text-on-faction` if on a colored background.

### `--focus-ring` (2 references, NOT in theme.css)

Used in: Cell.module.css:20 (stroke) and Cell.tsx:73 (inline SVG attribute)
**Recommendation:** Replace with `--interactive-focus` (legacy) or `--accent` (terminal overlay).

### `--border-emphasis` (1 reference, NOT in theme.css)

Used in: InventoryPanel.module.css:88 (`.assignButton:hover` border-color)
**Recommendation:** Replace with `--accent` or `--border-default`.

### `--content-error` / `--surface-error` / `--border-error` / `--surface-error-hover` (in SkillsPanel only)

Used in: SkillsPanel.module.css:93-95,101,124-126,132 (all with fallback values)
**Note:** These have CSS fallback values (`#ef4444`, etc.) so they render correctly. SkillsPanel is also marked as legacy (to be deleted), so migration is low priority.

## All Defined Tokens in theme.css (Grouped)

### Legacy Tokens

| Category        | Token                     | Dark                   | Light   | HC                    |
| --------------- | ------------------------- | ---------------------- | ------- | --------------------- |
| **Surfaces**    | `--surface-ground`        | #242424                | #fafafa | #000000               |
|                 | `--surface-primary`       | #2a2a2a                | #ffffff | #000000               |
|                 | `--surface-secondary`     | #1e1e1e                | #f5f5f5 | #1a1a1a               |
|                 | `--surface-elevated`      | #ffffff                | #ffffff | #ffffff               |
| **Content**     | `--content-primary`       | rgba(255,255,255,0.87) | #333    | #ffffff               |
|                 | `--content-secondary`     | rgba(255,255,255,0.6)  | #666    | #cccccc               |
|                 | `--content-muted`         | rgba(255,255,255,0.38) | #999    | #999999               |
| **Borders**     | `--border-default`        | #555                   | #999    | #ffffff               |
|                 | `--border-subtle`         | #444                   | #ddd    | #666666               |
| **Interactive** | `--interactive-hover`     | #3a3a3a                | #e8e8e8 | #1a1a1a               |
|                 | `--interactive-focus`     | #0072b2                | #0072b2 | #00a8ff               |
| **Faction**     | `--faction-friendly`      | #0072b2                | #0072b2 | #0099ff               |
|                 | `--faction-enemy`         | #e69f00                | #e69f00 | #ff9900               |
|                 | `--faction-friendly-bg`   | rgba(0,114,178,0.15)   | #e6f2ff | rgba(0,153,255,0.2)   |
|                 | `--faction-enemy-bg`      | rgba(230,159,0,0.15)   | #fff4e6 | rgba(255,153,0,0.2)   |
|                 | `--faction-friendly-text` | #4da6ff                | #004d7a | #66ccff               |
|                 | `--faction-enemy-text`    | #ffb84d                | #8f5a00 | #ffb84d               |
| **Action**      | `--action-attack`         | #d55e00                | #d55e00 | #ff6633               |
|                 | `--action-heal`           | #009e73                | #009e73 | #00ff88               |
|                 | `--action-move`           | #0072b2                | #0072b2 | #0099ff               |
| **Token**       | `--text-on-faction`       | #ffffff                | #ffffff | #ffffff               |
|                 | `--accent-primary`        | #00a8ff                | #0072b2 | #00ff00               |
| **Status**      | `--status-success`        | #009e73                | #009e73 | #00ff88               |
|                 | `--status-success-bg`     | rgba(0,158,115,0.15)   | #e6ffe6 | rgba(0,255,136,0.2)   |
|                 | `--status-success-text`   | #00c48c                | #006b4d | #00ff88               |
|                 | `--status-error`          | #d55e00                | #d55e00 | #ff6633               |
|                 | `--status-error-bg`       | rgba(213,94,0,0.15)    | #ffe6e6 | rgba(255,102,51,0.2)  |
|                 | `--status-error-text`     | #ff7f3d                | #8f3e00 | #ff6633               |
|                 | `--status-warning`        | #cc9a06                | #cc9a06 | #ffcc00               |
|                 | `--status-warning-bg`     | rgba(204,154,6,0.15)   | #fff3cd | rgba(255,204,0,0.2)   |
|                 | `--status-warning-text`   | #e6b800                | #664d03 | #ffcc00               |
|                 | `--status-neutral`        | #999                   | #999    | #cccccc               |
|                 | `--status-neutral-bg`     | rgba(153,153,153,0.15) | #f0f0f0 | rgba(204,204,204,0.2) |
|                 | `--status-neutral-text`   | #bbb                   | #666    | #cccccc               |
| **Health**      | `--health-high`           | #4caf50                | #4caf50 | #00ff00               |
|                 | `--health-low`            | #f44336                | #f44336 | #ff0000               |
| **Contrast**    | `--contrast-line`         | #ffffff                | #ffffff | #ffffff               |
| **Targeting**   | `--targeting-line-color`  | #888888                | #666666 | #aaaaaa               |
| **Grid**        | `--grid-bg`               | #1e1e1e                | #f5f5f5 | #000000               |
|                 | `--grid-border`           | #666                   | #333    | #ffffff               |
|                 | `--cell-bg`               | #2a2a2a                | #ffffff | #000000               |
|                 | `--cell-border`           | #444                   | #ddd    | #666666               |
|                 | `--cell-hover-bg`         | #3a3a3a                | #e8e8e8 | #1a1a1a               |
| **Scrollbar**   | `--scrollbar-track`       | #2a2a2a                | #f1f1f1 | #000000               |
|                 | `--scrollbar-thumb`       | #555                   | #999    | #666666               |
|                 | `--scrollbar-thumb-hover` | #666                   | #666    | #999999               |

### Terminal Overlay Tokens (New Layer - ADR-019)

| Category       | Token              | Dark                                                              | Light                | HC                     |
| -------------- | ------------------ | ----------------------------------------------------------------- | -------------------- | ---------------------- |
| **Surfaces**   | `--ground`         | #1a1a2e                                                           | #f0f0f5              | #000000                |
|                | `--surface`        | rgba(255,255,255,0.03)                                            | rgba(0,0,0,0.02)     | rgba(255,255,255,0.05) |
|                | `--surface-hover`  | rgba(255,255,255,0.06)                                            | rgba(0,0,0,0.05)     | rgba(255,255,255,0.1)  |
| **Borders**    | `--border`         | rgba(255,255,255,0.12)                                            | rgba(0,0,0,0.12)     | #ffffff                |
|                | `--divider`        | rgba(255,255,255,0.06)                                            | rgba(0,0,0,0.06)     | rgba(255,255,255,0.15) |
| **Text**       | `--text-primary`   | rgba(255,255,255,0.87)                                            | #333                 | #ffffff                |
|                | `--text-secondary` | rgba(255,255,255,0.6)                                             | #666                 | #cccccc                |
|                | `--text-muted`     | rgba(255,255,255,0.38)                                            | #999                 | #999999                |
|                | `--text-ghost`     | rgba(255,255,255,0.15)                                            | rgba(0,0,0,0.15)     | rgba(255,255,255,0.3)  |
| **Accent**     | `--accent`         | #00a8ff                                                           | #0072b2              | #00ff00                |
|                | `--accent-subtle`  | rgba(0,168,255,0.15)                                              | rgba(0,114,178,0.12) | rgba(0,255,0,0.2)      |
|                | `--accent-muted`   | rgba(0,168,255,0.08)                                              | rgba(0,114,178,0.06) | rgba(0,255,0,0.1)      |
| **Status**     | `--danger`         | #d55e00                                                           | #d55e00              | #ff6633                |
|                | `--danger-subtle`  | rgba(213,94,0,0.15)                                               | rgba(213,94,0,0.12)  | rgba(255,102,51,0.2)   |
|                | `--success`        | #009e73                                                           | #009e73              | #00ff88                |
| **Radii**      | `--radius-sm`      | 2px                                                               | 2px                  | 2px                    |
|                | `--radius-md`      | 4px                                                               | 4px                  | 4px                    |
|                | `--radius-lg`      | 6px                                                               | 6px                  | 6px                    |
| **Typography** | `--font-mono`      | Fira Code, Cascadia Code, JetBrains Mono, ui-monospace, monospace | (same)               | (same)                 |

## Per-Component CSS Audit

### CharacterPanel Components (PRIMARY migration targets)

#### SkillRow.module.css (NEEDS MIGRATION - highest change count)

- 10x `--border-primary` -> `--border`
- 6x `--surface-tertiary` -> `--surface-hover`
- 5x `border-radius: 3px` -> `var(--radius-sm)` or keep as-is (3px is close to 2px `--radius-sm`)
- 1x `border-radius: 4px` -> `var(--radius-md)`
- 2x `color: white` (lines 163, 232) -> `var(--text-on-faction)` (used on hover states with colored bg)
- Multiple `rem` font-sizes that may need px conversion per Phase 1+2 pattern
- References `--surface-primary`, `--surface-secondary`, `--text-primary`, `--text-secondary`, `--text-muted`, `--health-high`, `--health-low`, `--accent-primary` (all defined)

#### CharacterPanel.module.css (NEEDS MIGRATION)

- 2x `--border-primary` -> `--border`
- 1x `border-radius: 4px` -> `var(--radius-md)`
- References `--surface-primary`, `--surface-secondary`, `--text-primary`, `--text-secondary` (all defined)

#### PriorityTab.module.css (NEEDS MIGRATION)

- 2x `--border-primary` -> `--border`
- 1x `--text-on-accent` (undefined) -> needs resolution
- 1x `border-radius: 4px` -> `var(--radius-md)`
- 1x `border-radius: 3px` -> keep or `var(--radius-sm)`
- 1x `--accent-primary` used for `.assignBtn` background (defined)

#### TriggerDropdown.module.css (NEEDS MIGRATION)

- 4x `--border-primary` -> `--border`
- 1x `--surface-tertiary` -> `--surface-hover`
- 2x `color: white` (lines 39, 60) -> `var(--text-on-faction)`
- 3x `border-radius: 3px` -> `var(--radius-sm)` or keep

### BattleViewer Components

#### DamageNumber.module.css (NEEDS MIGRATION)

- `fill: white` (line 7) -> hardcoded, could use `var(--surface-elevated)` since it's always white
- `font-family: "Courier New", monospace` (line 13) -> `var(--font-mono)`
- `fill: #333` (line 16) -> hardcoded dark text, could use a token but this is SVG fill on a white bg

#### Cell.module.css (MINOR)

- `--focus-ring` (undefined) -> `--interactive-focus` or `--accent`
- Note: Also in Cell.tsx line 73 as inline attribute `stroke="var(--focus-ring)"` (needs TSX change too)

#### Token.module.css (MINOR)

- `font-family: system-ui, ...` (line 65-71) -> potentially `var(--font-mono)` but this is for letter labels inside tokens; system-ui may be intentional for readability at small sizes

#### CharacterTooltip.module.css (OK - already uses legacy tokens well)

- Uses `--surface-primary`, `--border-default`, `--border-subtle`, `--content-*` tokens
- `border-radius: 6px` -> `var(--radius-lg)`
- `border-radius: 4px` -> `var(--radius-md)`
- `box-shadow: 0 4px 12px rgba(0,0,0,0.3)` -> hardcoded, no shadow token exists

#### BattleViewer.module.css (OK - minimal)

- `padding: 20px` -> hardcoded but this is structural spacing

### Other Components

#### RuleEvaluations.module.css (NEEDS MIGRATION)

- 2x `--surface-tertiary` -> `--surface-hover`
- `font-family: monospace` (line 122) -> `var(--font-mono)`
- `color: white` (line 199) -> `var(--text-on-faction)`
- Uses legacy `--content-*` and `--border-*` tokens (all defined)

#### InventoryPanel.module.css (LEGACY - low priority)

- 1x `--surface-tertiary` -> `--surface-hover`
- 1x `--border-emphasis` (undefined) -> `--accent` or `--border-default`
- Marked as legacy (to be deleted per architecture.md)

#### SkillsPanel.module.css (LEGACY - low priority)

- 2x `--surface-tertiary` -> `--surface-hover`
- Multiple undefined error tokens with fallbacks (`--content-error`, `--surface-error`, etc.)
- Marked as legacy (to be deleted per architecture.md)

#### PlayControls.module.css (OK - uses legacy tokens properly)

#### CharacterControls.module.css (OK - uses legacy tokens properly)

#### ThemeToggle.module.css (OK - uses legacy tokens properly)

#### BattleStatusBadge.module.css (OK - uses legacy tokens properly)

### Global Files (Already Migrated in Phase 1+2)

- `index.css` - already uses `--font-mono`, `--ground`
- `App.css` - already converted to px values

## Existing Patterns

- **Three-block theming**: All custom properties defined in `:root`, `[data-theme="light"]`, and `[data-theme="high-contrast"]`
- **Dual token layers**: Legacy tokens (e.g., `--surface-primary`) coexist with terminal overlay tokens (e.g., `--surface`) per ADR-019
- **CSS Modules**: All component styles use `*.module.css` convention
- **No shadow tokens**: Box shadows are hardcoded (only one instance in CharacterTooltip)
- **Fallback pattern**: Some SkillsPanel tokens use CSS fallback syntax `var(--token, fallback)` for undefined tokens

## Dependencies

- ADR-019 establishes the terminal overlay token design pattern and coexistence strategy
- Phase 1+2 already completed: theme.css tokens, index.css, App.css
- Cell.tsx has an inline `stroke="var(--focus-ring)"` that needs TSX change alongside CSS fix (scope expansion beyond CSS-only)

## Constraints Discovered

1. **Cell.tsx inline SVG attribute**: `--focus-ring` is used both in CSS (`Cell.module.css:20`) and inline in TSX (`Cell.tsx:73`). Fixing the CSS-only part won't fully resolve this -- the TSX file also needs updating. This is the ONLY TSX change needed.
2. **Legacy components**: SkillsPanel and InventoryPanel are marked "Legacy - to be deleted" in architecture.md. Full migration effort there is questionable -- recommend minimal fix (just undefined token resolution) or skip entirely.
3. **Token naming collision**: The terminal overlay `--surface` token collides with the legacy `--surface-primary`/`--surface-secondary` names conceptually but not literally. The `--text-primary`/`--text-secondary` tokens exist in BOTH layers with identical values, which is safe but worth noting.
4. **Border radius values**: Components use 3px and 4px. Terminal overlay tokens provide `--radius-sm: 2px` and `--radius-md: 4px`. The 3px values have no exact match -- either round to 2px (`--radius-sm`) or keep as-is.
5. **`rem` vs `px` sizing**: Phase 1+2 converted App.css to px. Component CSS files still use `rem` for font-sizes. Decision needed: convert component rem to px too, or only convert structural layout values?

## Open Questions

1. **Should `--border-primary` be replaced with `--border` (terminal overlay) or `--border-default` (legacy)?** The terminal overlay direction per ADR-019 suggests `--border`, but this means CharacterPanel components would use terminal overlay tokens while other components (PlayControls, CharacterControls, ThemeToggle) continue using legacy `--border-default`. Is this intentional incremental migration or inconsistency?

2. **Should legacy components (SkillsPanel, InventoryPanel) be migrated?** They are marked for deletion. Minimal undefined-token fixes vs full migration.

3. **Should Cell.tsx inline `var(--focus-ring)` be fixed as part of this task?** It's a TSX change, not pure CSS. The task description says "CSS-only task -- no logic or DOM changes expected" but this is a simple attribute value change (no logic change).

4. **What to do with `3px` border-radius values?** Round down to `--radius-sm` (2px), round up to `--radius-md` (4px), or leave as hardcoded `3px`?

5. **Should `rem` font-sizes in component CSS be converted to `px`?** Phase 1+2 converted App.css from rem to px. SkillRow.module.css has many rem-based font-sizes (0.75rem, 0.8rem, 0.85rem, etc.).

6. **How to handle `color: white` hardcodes?** Some are hover states on colored backgrounds (e.g., remove button hover turns red with white text). `--text-on-faction` is the closest token but semantically different.
