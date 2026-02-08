# Implementation Plan: Fix Undefined Tokens + Terminal Overlay Token Migration

## Summary

Replace all undefined CSS custom properties (`--border-primary`, `--surface-tertiary`, `--text-on-accent`, `--focus-ring`, `--border-emphasis`) with defined terminal overlay or legacy tokens. Migrate border-radius hardcodes to token equivalents where exact matches exist. Fix one inline TSX reference in Cell.tsx.

## Testing Decision

**No new tests needed.** Rationale:

- All changes are CSS custom property name replacements (token swaps) or TSX inline attribute value changes
- No logic, DOM structure, or behavior changes
- Existing tests will catch any breakage from misapplied class names
- Visual verification by running the app in all 3 themes is the appropriate validation method
- Run `npm run build` and `npm run test` to confirm no regressions

## Scope

### In Scope (this task)

1. **Critical fix**: Replace 18x undefined `--border-primary` with `--border`
2. **Undefined token fixes**: `--surface-tertiary` (12x), `--text-on-accent` (1x), `--focus-ring` (2x + 1 TSX), `--border-emphasis` (1x)
3. **Border-radius tokenization**: Replace `4px` with `var(--radius-md)` where used
4. **Font-family tokenization**: Replace `monospace` / `"Courier New", monospace` with `var(--font-mono)`
5. **`color: white` hardcodes**: Replace with `var(--text-on-faction)` in hover states on colored backgrounds
6. **Cell.tsx inline fix**: Change `stroke="var(--focus-ring)"` to `stroke="var(--accent)"`

### Out of Scope (deferred)

- **Legacy components** (SkillsPanel.module.css, InventoryPanel.module.css): Marked for deletion in architecture.md. Their undefined tokens have CSS fallbacks and render correctly. Not worth migration effort.
- **`rem` to `px` conversion** in component CSS: Phase 1+2 only converted App.css. Component-level rem conversion is a separate task with broader impact.
- **`3px` border-radius values**: No exact token match (`--radius-sm` is 2px, `--radius-md` is 4px). Changing 3px to 2px is a visible regression. Leave as hardcoded `3px`.
- **DamageNumber `fill` values**: `fill: white` and `fill: #333` are SVG-specific and serve a fixed purpose (white background rect, dark text on white). Not theme-responsive by design.
- **CharacterTooltip.module.css border-radius/box-shadow tokenization**: Already uses defined tokens for colors. Radius tokenization is cosmetic polish, not a bug fix.
- **Token.module.css font-family**: Uses `system-ui` intentionally for readability at small sizes.

## Token Mapping Reference

| Undefined Token      | Replacement         | Rationale                                                 |
| -------------------- | ------------------- | --------------------------------------------------------- |
| `--border-primary`   | `--border`          | Terminal overlay border token, defined in all 3 themes    |
| `--surface-tertiary` | `--surface-hover`   | Terminal overlay hover surface, semantically equivalent   |
| `--text-on-accent`   | `--text-on-faction` | White text on colored background, already defined         |
| `--focus-ring`       | `--accent`          | Terminal overlay accent, matches selection/focus semantic |
| `--border-emphasis`  | `--accent`          | Used for hover emphasis on assign button, accent fits     |

## Implementation Steps

### Step 1: SkillRow.module.css (16 changes)

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css`

| Line | Current                   | New                               |
| ---- | ------------------------- | --------------------------------- |
| 7    | `var(--border-primary)`   | `var(--border)`                   |
| 8    | `border-radius: 4px`      | `border-radius: var(--radius-md)` |
| 75   | `var(--border-primary)`   | `var(--border)`                   |
| 76   | `var(--surface-tertiary)` | `var(--surface-hover)`            |
| 94   | `var(--border-primary)`   | `var(--border)`                   |
| 104  | `var(--border-primary)`   | `var(--border)`                   |
| 129  | `var(--border-primary)`   | `var(--border)`                   |
| 137  | `var(--surface-tertiary)` | `var(--surface-hover)`            |
| 144  | `var(--border-primary)`   | `var(--border)`                   |
| 145  | `var(--surface-tertiary)` | `var(--surface-hover)`            |
| 154  | `var(--border-primary)`   | `var(--border)`                   |
| 155  | `var(--surface-tertiary)` | `var(--surface-hover)`            |
| 163  | `color: white`            | `color: var(--text-on-faction)`   |
| 169  | `var(--border-primary)`   | `var(--border)`                   |
| 170  | `var(--surface-tertiary)` | `var(--surface-hover)`            |
| 207  | `var(--border-primary)`   | `var(--border)`                   |
| 215  | `var(--surface-tertiary)` | `var(--surface-hover)`            |
| 222  | `var(--border-primary)`   | `var(--border)`                   |
| 232  | `color: white`            | `color: var(--text-on-faction)`   |

Summary: 10x `--border-primary` -> `--border`, 6x `--surface-tertiary` -> `--surface-hover`, 1x `border-radius: 4px` -> `var(--radius-md)`, 2x `color: white` -> `var(--text-on-faction)`

### Step 2: CharacterPanel.module.css (3 changes)

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css`

| Line | Current                 | New                               |
| ---- | ----------------------- | --------------------------------- |
| 10   | `var(--border-primary)` | `var(--border)`                   |
| 11   | `border-radius: 4px`    | `border-radius: var(--radius-md)` |
| 28   | `var(--border-primary)` | `var(--border)`                   |

Summary: 2x `--border-primary` -> `--border`, 1x `border-radius: 4px` -> `var(--radius-md)`

### Step 3: PriorityTab.module.css (4 changes)

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css`

| Line | Current                 | New                               |
| ---- | ----------------------- | --------------------------------- |
| 45   | `var(--border-primary)` | `var(--border)`                   |
| 46   | `border-radius: 4px`    | `border-radius: var(--radius-md)` |
| 58   | `var(--border-primary)` | `var(--border)`                   |
| 63   | `var(--text-on-accent)` | `var(--text-on-faction)`          |

Summary: 2x `--border-primary` -> `--border`, 1x `border-radius: 4px` -> `var(--radius-md)`, 1x `--text-on-accent` -> `--text-on-faction`

### Step 4: TriggerDropdown.module.css (6 changes)

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css`

| Line | Current                   | New                             |
| ---- | ------------------------- | ------------------------------- |
| 9    | `var(--border-primary)`   | `var(--border)`                 |
| 19   | `var(--border-primary)`   | `var(--border)`                 |
| 29   | `var(--border-primary)`   | `var(--border)`                 |
| 39   | `color: white`            | `color: var(--text-on-faction)` |
| 46   | `var(--border-primary)`   | `var(--border)`                 |
| 55   | `var(--surface-tertiary)` | `var(--surface-hover)`          |
| 60   | `color: white`            | `color: var(--text-on-faction)` |

Summary: 4x `--border-primary` -> `--border`, 1x `--surface-tertiary` -> `--surface-hover`, 2x `color: white` -> `var(--text-on-faction)`

### Step 5: RuleEvaluations.module.css (4 changes)

File: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.module.css`

| Line | Current                   | New                             |
| ---- | ------------------------- | ------------------------------- |
| 122  | `font-family: monospace`  | `font-family: var(--font-mono)` |
| 149  | `var(--surface-tertiary)` | `var(--surface-hover)`          |
| 180  | `var(--surface-tertiary)` | `var(--surface-hover)`          |
| 199  | `color: white`            | `color: var(--text-on-faction)` |

Summary: 2x `--surface-tertiary` -> `--surface-hover`, 1x `font-family: monospace` -> `var(--font-mono)`, 1x `color: white` -> `var(--text-on-faction)`

### Step 6: Cell.module.css + Cell.tsx (3 changes)

File: `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.module.css`

| Line | Current                     | New                     |
| ---- | --------------------------- | ----------------------- |
| 20   | `stroke: var(--focus-ring)` | `stroke: var(--accent)` |

File: `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx`

| Line | Current                      | New                      |
| ---- | ---------------------------- | ------------------------ |
| 73   | `stroke="var(--focus-ring)"` | `stroke="var(--accent)"` |

Summary: 2x `--focus-ring` -> `--accent` (1 CSS, 1 TSX inline attribute)

### Step 7: DamageNumber.module.css (1 change)

File: `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageNumber.module.css`

| Line | Current                                 | New                             |
| ---- | --------------------------------------- | ------------------------------- |
| 13   | `font-family: "Courier New", monospace` | `font-family: var(--font-mono)` |

Summary: 1x font-family tokenization

Note: `fill: white` (line 7) and `fill: #333` (line 16) are intentionally left as hardcoded values. The damage number background is always white with dark text, independent of theme. This is consistent with `--surface-elevated: #ffffff` being the same in all 3 themes.

### Step 8: Validation

1. `npm run build` -- confirm no TypeScript or build errors
2. `npm run test` -- confirm all existing tests pass
3. `npm run lint` -- confirm no ESLint errors introduced
4. Visual check in browser: dark, light, and high-contrast themes

## Files Modified (8 total)

1. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css`
2. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css`
3. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css`
4. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css`
5. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.module.css`
6. `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.module.css`
7. `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx`
8. `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageNumber.module.css`

## Risks

1. **Visual regression with `--surface-hover` replacing `--surface-tertiary`**: The `--surface-hover` token uses semi-transparent rgba values which may render differently than what the undefined `--surface-tertiary` was falling back to (likely transparent/inherited). This is actually a fix -- undefined tokens resolve to `initial`, meaning these hover states currently have no background. The migration will give them proper themed backgrounds.

2. **`--border` opacity in dark mode**: The terminal overlay `--border` uses `rgba(255,255,255,0.12)` which is subtler than the legacy `--border-default: #555`. This is intentional per the terminal overlay design aesthetic. CharacterPanel borders will become more subtle, consistent with the design direction.

3. **`color: white` -> `var(--text-on-faction)`**: The `--text-on-faction` token is `#ffffff` in all 3 themes, so this is a no-op visually. It just makes the intent explicit and theme-aware.

## Architectural Notes

- No new decisions introduced. This work follows ADR-019 (Independent Terminal Overlay Token Layer).
- The incremental migration approach (CharacterPanel components use terminal overlay tokens while some other components still use legacy tokens) is the intended coexistence strategy from ADR-019.
- Legacy components (SkillsPanel, InventoryPanel) are explicitly excluded per their "to be deleted" status in architecture.md.
