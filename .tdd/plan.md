# Implementation Plan: Phase 1 (Token Foundation) + Phase 2 (Global Styles)

Created: 2026-02-08

## Decisions

### D1: No `light-dark()` for new tokens

**Decision**: Continue with existing three-block pattern (`:root`, `:root[data-theme="light"]`, `:root[data-theme="high-contrast"]`).

**Context**: Requirements say "use `light-dark()` where trivially possible," but `light-dark()` is not used anywhere in the codebase. Introducing it for 15+ new tokens while the existing ~50 tokens use the three-block pattern creates inconsistency. `light-dark()` only covers dark+light; high-contrast still needs a separate override block regardless.

**Consequences**: Consistent with existing patterns. Slightly more repetition but zero risk of browser compat issues. `light-dark()` adoption can be done in a future unified migration of ALL tokens.

**Recommendation**: Add to `.docs/decisions/index.md` as ADR-019 after implementation.

### D2: `--border-subtle` value unchanged

**Decision**: Keep `--border-subtle: #444` (dark), `#ddd` (light), `#666666` (high-contrast) as-is.

**Context**: Token already exists with the exact name required. Changing its value would be a modification, not an addition, and could affect existing consumers.

### D3: Focus ring outlines remain 2px

**Decision**: `outline: 2px solid` focus indicators are OUT OF SCOPE. They are accessibility features, not border styling. Requirements say "ARIA attributes, focus indicators, shape redundancy unchanged."

### D4: `--font-mono` value

**Decision**: `'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace`

**Context**: Modern developer font stack. `ui-monospace` provides system-native monospace on macOS (SF Mono) and Windows (Cascadia Mono). Named fonts first for users who have them installed. No external font loading required -- all are fallback-safe.

### D5: `--border-primary` undefined bug

**Decision**: OUT OF SCOPE. Already logged to `.docs/current-task.md` Priority Next Tasks. Will be addressed in Phase 3 component migration.

### D6: New tokens use independent values (not aliases)

**Decision**: New tokens (e.g., `--ground`, `--surface`, `--accent`) use independent color values, NOT `var()` references to existing tokens.

**Context**: The new token taxonomy represents the terminal-overlay aesthetic and may diverge from legacy tokens. Using aliases creates coupling. Independent values allow both systems to coexist during incremental migration and diverge as needed.

**Consequences**: Slightly more maintenance, but cleaner migration path. Legacy tokens can be removed once all consumers are migrated.

---

## Phase 1: Token Foundation

### File: `/home/bob/Projects/auto-battler/src/styles/theme.css`

Current: 274 lines. Adding ~60 lines (19 tokens x 3 theme blocks + comments). Result: ~334 lines. Under 400-line limit.

#### Insertion Point

Add a new `/* === TERMINAL OVERLAY TOKENS === */` section AFTER the existing token groups and BEFORE the closing `}` of each theme block. This keeps new tokens visually separated and preserves all existing tokens.

#### Dark Theme (`:root` block -- insert after scrollbar group, before closing `}`)

```css
/* === TERMINAL OVERLAY TOKENS (new semantic layer) === */

/* Surfaces */
--ground: #1a1a2e;
--surface: rgba(255, 255, 255, 0.03);
--surface-hover: rgba(255, 255, 255, 0.06);

/* Borders & dividers */
--border: rgba(255, 255, 255, 0.12);
/* --border-subtle already defined above */
--divider: rgba(255, 255, 255, 0.06);

/* Text */
--text-primary: rgba(255, 255, 255, 0.87);
--text-secondary: rgba(255, 255, 255, 0.6);
--text-muted: rgba(255, 255, 255, 0.38);
--text-ghost: rgba(255, 255, 255, 0.15);

/* Accent */
--accent: #00a8ff;
--accent-subtle: rgba(0, 168, 255, 0.15);
--accent-muted: rgba(0, 168, 255, 0.08);

/* Status */
--danger: #d55e00;
--danger-subtle: rgba(213, 94, 0, 0.15);
--success: #009e73;

/* Radii */
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;

/* Typography */
--font-mono:
  "Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace;
```

**Dark theme value rationale**:

- `--ground: #1a1a2e` -- slightly blue-tinted dark for terminal aesthetic. Intentionally differs from `--surface-ground: #242424`.
- `--surface: rgba(255,255,255,0.03)` -- translucent panel surface instead of opaque `#2a2a2a`. Creates depth layering.
- `--surface-hover: rgba(255,255,255,0.06)` -- double surface opacity for hover feedback.
- `--border: rgba(255,255,255,0.12)` -- translucent border instead of opaque `#555`. Blends with any surface.
- `--divider: rgba(255,255,255,0.06)` -- very subtle separator.
- `--text-*` tokens reuse existing `--content-*` values (same rgba values).
- `--accent: #00a8ff` same as existing `--accent-primary`.
- `--danger: #d55e00` same as existing `--status-error`.
- `--success: #009e73` same as existing `--status-success`.
- Radii are small (2/4/6px) for dense terminal aesthetic.

#### Light Theme (`:root[data-theme="light"]` block -- insert before closing `}`)

```css
/* === TERMINAL OVERLAY TOKENS (new semantic layer) === */

/* Surfaces */
--ground: #f0f0f5;
--surface: rgba(0, 0, 0, 0.02);
--surface-hover: rgba(0, 0, 0, 0.05);

/* Borders & dividers */
--border: rgba(0, 0, 0, 0.12);
/* --border-subtle already defined above */
--divider: rgba(0, 0, 0, 0.06);

/* Text */
--text-primary: #333;
--text-secondary: #666;
--text-muted: #999;
--text-ghost: rgba(0, 0, 0, 0.15);

/* Accent */
--accent: #0072b2;
--accent-subtle: rgba(0, 114, 178, 0.12);
--accent-muted: rgba(0, 114, 178, 0.06);

/* Status */
--danger: #d55e00;
--danger-subtle: rgba(213, 94, 0, 0.12);
--success: #009e73;

/* Radii */
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;

/* Typography */
--font-mono:
  "Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace;
```

#### High Contrast Theme (`:root[data-theme="high-contrast"]` block -- insert before closing `}`)

```css
/* === TERMINAL OVERLAY TOKENS (new semantic layer) === */

/* Surfaces */
--ground: #000000;
--surface: rgba(255, 255, 255, 0.05);
--surface-hover: rgba(255, 255, 255, 0.1);

/* Borders & dividers */
--border: #ffffff;
/* --border-subtle already defined above */
--divider: rgba(255, 255, 255, 0.15);

/* Text */
--text-primary: #ffffff;
--text-secondary: #cccccc;
--text-muted: #999999;
--text-ghost: rgba(255, 255, 255, 0.3);

/* Accent */
--accent: #00ff00;
--accent-subtle: rgba(0, 255, 0, 0.2);
--accent-muted: rgba(0, 255, 0, 0.1);

/* Status */
--danger: #ff6633;
--danger-subtle: rgba(255, 102, 51, 0.2);
--success: #00ff88;

/* Radii */
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;

/* Typography */
--font-mono:
  "Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace;
```

**High contrast rationale**: Brighter/purer colors matching existing high-contrast patterns. `--border: #ffffff` matches existing `--border-default: #ffffff`. `--accent: #00ff00` matches existing `--accent-primary: #00ff00`. `--text-ghost` at 0.30 (higher than dark's 0.15) for minimum visibility on black.

#### Token Count Verification

19 new tokens added per block:

| #   | Token              | Dark                     | Light                  | High Contrast            |
| --- | ------------------ | ------------------------ | ---------------------- | ------------------------ |
| 1   | `--ground`         | `#1a1a2e`                | `#f0f0f5`              | `#000000`                |
| 2   | `--surface`        | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.02)`     | `rgba(255,255,255,0.05)` |
| 3   | `--surface-hover`  | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.05)`     | `rgba(255,255,255,0.10)` |
| 4   | `--border`         | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.12)`     | `#ffffff`                |
| 5   | `--divider`        | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)`     | `rgba(255,255,255,0.15)` |
| 6   | `--text-primary`   | `rgba(255,255,255,0.87)` | `#333`                 | `#ffffff`                |
| 7   | `--text-secondary` | `rgba(255,255,255,0.6)`  | `#666`                 | `#cccccc`                |
| 8   | `--text-muted`     | `rgba(255,255,255,0.38)` | `#999`                 | `#999999`                |
| 9   | `--text-ghost`     | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.15)`     | `rgba(255,255,255,0.30)` |
| 10  | `--accent`         | `#00a8ff`                | `#0072b2`              | `#00ff00`                |
| 11  | `--accent-subtle`  | `rgba(0,168,255,0.15)`   | `rgba(0,114,178,0.12)` | `rgba(0,255,0,0.20)`     |
| 12  | `--accent-muted`   | `rgba(0,168,255,0.08)`   | `rgba(0,114,178,0.06)` | `rgba(0,255,0,0.10)`     |
| 13  | `--danger`         | `#d55e00`                | `#d55e00`              | `#ff6633`                |
| 14  | `--danger-subtle`  | `rgba(213,94,0,0.15)`    | `rgba(213,94,0,0.12)`  | `rgba(255,102,51,0.20)`  |
| 15  | `--success`        | `#009e73`                | `#009e73`              | `#00ff88`                |
| 16  | `--radius-sm`      | `2px`                    | `2px`                  | `2px`                    |
| 17  | `--radius-md`      | `4px`                    | `4px`                  | `4px`                    |
| 18  | `--radius-lg`      | `6px`                    | `6px`                  | `6px`                    |
| 19  | `--font-mono`      | (same stack)             | (same stack)           | (same stack)             |

Plus existing `--border-subtle` (already present in all 3 blocks). Total required: 20. Existing: 1. New: 19. Confirmed.

---

## Phase 2: Global Styles

### File: `/home/bob/Projects/auto-battler/src/index.css`

Two changes:

**Change 1 -- Font family (line 5)**:

```
BEFORE: font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
AFTER:  font-family: var(--font-mono);
```

**Change 2 -- Background color (line 11)**:

```
BEFORE: background-color: var(--surface-ground);
AFTER:  background-color: var(--ground);
```

### File: `/home/bob/Projects/auto-battler/src/App.css`

Six changes (7 rem values across 6 locations):

**Change 1 -- `.app` padding (line 5)**:

```
BEFORE: padding: 0.5rem;
AFTER:  padding: 8px;
```

**Change 2 -- `.header` margin-bottom (line 13)**:

```
BEFORE: margin-bottom: 1rem;
AFTER:  margin-bottom: 12px;
```

**Change 3 -- `.header h1` (lines 17-19)**:

```
BEFORE:
  font-size: 2.5rem;
  line-height: 1.1;
  margin: 0;

AFTER:
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
```

Note: `font-weight: 700` is added (not present before). `line-height: 1.1` is unitless ratio, stays. `margin: 0` unchanged.

**Change 4 -- `.headerControls` gap (line 24)**:

```
BEFORE: gap: 1rem;
AFTER:  gap: 8px;
```

**Change 5 -- `.gridContainer` gap (line 32)**:

```
BEFORE: gap: 1rem;
AFTER:  gap: 12px;
```

12px for main grid gap (more breathing room between battle viewer and character panel than between header controls).

**Change 6 -- `.gridContainer` margin-bottom (line 33)**:

```
BEFORE: margin-bottom: 1rem;
AFTER:  margin-bottom: 12px;
```

---

## Test Strategy

### Phase 1 (Token Foundation): No Tests

All changes are CSS custom property declarations. No structural, semantic, or behavioral change. CSS custom property values cannot be meaningfully tested with Testing Library (JSDOM does not compute styles).

**Verification**: Manual review of CSS file confirming 19 tokens present in all 3 blocks. Run `npm run lint`.

### Phase 2 (Global Styles): No Tests

All changes are CSS value substitutions (font-family swap, rem-to-px, h1 resize, token swap). None change DOM structure, ARIA attributes, or semantic elements.

**Verification**: `npm run build` to confirm no syntax errors. Visual verification deferred to post-component-phase browser inspection.

### Cross-cutting Verification

After both phases:

1. `npm run test` -- all existing tests must pass (zero behavioral changes)
2. `npm run lint` -- no regressions
3. `npm run type-check` -- no type errors
4. `npm run build` -- clean compilation

---

## Implementation Order

1. Add 19 tokens to dark block in `theme.css`
2. Add 19 tokens to light block in `theme.css`
3. Add 19 tokens to high-contrast block in `theme.css`
4. Verify `theme.css` is under 400 lines (~334 expected)
5. Update `index.css` (2 changes)
6. Update `App.css` (6 changes)
7. Run `npm run test && npm run lint && npm run type-check && npm run build`
8. Commit: `style(tokens): add terminal overlay design tokens and update global styles`

---

## Files Modified

| File                   | Phase | Changes                                                  |
| ---------------------- | ----- | -------------------------------------------------------- |
| `src/styles/theme.css` | 1     | Add 19 new tokens to each of 3 theme blocks              |
| `src/index.css`        | 2     | Font-family to `var(--font-mono)`, bg to `var(--ground)` |
| `src/App.css`          | 2     | 6 rem-to-px conversions, h1 resize + weight              |

Total: 3 files modified. 0 new files. 0 deleted files.

---

## Risks

1. **`--ground: #1a1a2e` blue tint**: Intentional for terminal aesthetic but may look off. Can adjust to `#1a1a1a` (neutral) during browser verification. Low risk -- easily tweaked.

2. **Translucent `--surface` stacking**: `rgba(255,255,255,0.03)` assumes dark parent background. Nested translucent surfaces stack opacity. This is desired for depth but could wash out if nested too deep. Phase 3 will account for this.

3. **Font availability**: `ui-monospace` supported in all modern browsers. Worst case falls back to browser default `monospace` (Courier New / Menlo). No external font dependencies.

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` (styling-only, no game logic changes)
- [x] Approach consistent with `.docs/architecture.md` (CSS Custom Properties theming pattern)
- [x] Patterns follow `.docs/patterns/index.md` (CSS Modules + custom properties)
- [x] No conflicts with `.docs/decisions/index.md` (no ADR contradictions)
- [x] Okabe-Ito faction colors unchanged
- [x] ARIA attributes, focus indicators, shape redundancy unchanged
- [x] No game logic, store logic, or engine code modified

## New Decision to Record

Recommend adding ADR-019: "Independent Terminal Overlay Token Layer" to `.docs/decisions/index.md` after implementation. Documents D1 (no `light-dark()`, consistency with existing three-block pattern) and D6 (independent values, not aliases, for migration flexibility).
