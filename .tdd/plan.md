# Implementation Plan: Skill Name Tooltips

## Summary

Create a reusable `SkillNameWithTooltip` component that wraps skill name text and renders a portal-positioned tooltip on hover/focus, showing skill stats from the registry. Integrate into SkillRow (priority list) and PriorityTab (inventory section).

## Open Questions Resolved

1. **`damage: 0` (Kick)**: Show it. The requirements say "if defined" and `damage: 0` is defined (present on the object). Showing "Damage: 0" is informative -- it confirms the interrupt skill does no damage.

2. **`<h3>` wrapping in SkillRow**: Keep the `<h3>` wrapper in SkillRow. `SkillNameWithTooltip` renders a `<span>` internally. SkillRow replaces `<h3 className={styles.skillName}>{skill.name}</h3>` with `<h3 className={styles.skillName}><SkillNameWithTooltip skillId={skill.id}>{skill.name}</SkillNameWithTooltip></h3>`. PriorityTab replaces `<span className={styles.skillName}>{skillDef.name}</span>` with `<span className={styles.skillName}><SkillNameWithTooltip skillId={skillDef.id}>{skillDef.name}</SkillNameWithTooltip></span>`. This preserves existing element semantics and CSS classes at each site.

3. **Focusability**: `SkillNameWithTooltip` renders a `<span tabindex="0">` as its root element. This makes it keyboard-focusable without changing the parent element type. The span receives `onFocus`/`onBlur` handlers alongside `onMouseEnter`/`onMouseLeave`. The `tabindex="0"` element also gets `role` and `aria-describedby` for accessibility.

4. **Tooltip width**: No `min-width`. Use `max-width: 220px` and `width: max-content`. The tooltip content is compact (label: value pairs). This keeps the tooltip snug around content while preventing overflow on long behavior lists.

5. **Stats format**: Vertical label-value list. Each stat on its own line. Labels left-aligned in secondary text color (`--text-secondary`), values right-aligned in primary text color (`--text-primary`). Use a CSS grid with `auto 1fr` columns for clean alignment. Font size `0.8125rem` (matches tooltip body in typography scale). Display order: Type, Cost, Range, Damage, Healing, Distance, Cooldown, Behaviors.

## Files to Create

### 1. `src/components/CharacterPanel/SkillNameWithTooltip.tsx`

New component file (~120-150 lines estimated).

**Props interface:**

```
interface SkillNameWithTooltipProps {
  skillId: string;
  children: React.ReactNode;
  className?: string;
}
```

**Internal structure:**

- `useState<boolean>(false)` for tooltip visibility (`isVisible`)
- `useRef<number>` for the 150ms appear delay timer
- `useRef<HTMLSpanElement>` for the anchor element (to measure position)
- `useRef<HTMLDivElement>` for the tooltip element (to measure dimensions)
- `useState<{top: number; left: number}>` for computed position
- `useLayoutEffect` to compute position when `isVisible` transitions to true
- `getSkillDefinition(skillId)` call inside render to get stats (returns early with just children if undefined)
- Generate stable `id` for tooltip via `useId()` (React 18+)

**Event handlers:**

- `onMouseEnter`: start 150ms timer, set `isVisible = true` when it fires
- `onMouseLeave`: clear timer, set `isVisible = false` immediately
- `onFocus`: start 150ms timer (same as mouseenter)
- `onBlur`: clear timer, set `isVisible = false` immediately

**Positioning algorithm:**

- On show: `anchorRef.current.getBoundingClientRect()` for anchor position
- Tooltip renders initially off-screen (`top: -9999px`) on first frame
- `useLayoutEffect` measures tooltip dimensions and computes final position:
  - Default: below anchor, left-aligned with anchor
  - `top = anchor.bottom + GAP` (GAP = 4px per requirements)
  - `left = anchor.left`, clamped to `[MARGIN, window.innerWidth - tooltipWidth - MARGIN]` (MARGIN = 8px)
  - Flip above if `anchor.bottom + GAP + tooltipHeight + MARGIN > window.innerHeight`: `top = anchor.top - GAP - tooltipHeight`
- Position via inline `style={{ position: 'fixed', top, left, zIndex: 1000 }}`

**Rendered output (when visible):**

```
<span tabindex="0" onMouseEnter onMouseLeave onFocus onBlur aria-describedby={tooltipId} className={className}>
  {children}
</span>
{isVisible && createPortal(
  <div ref={tooltipRef} id={tooltipId} role="tooltip" className={styles.tooltip} style={{ position: 'fixed', top, left }}>
    <div className={styles.statRow}><span className={styles.label}>Type</span><span className={styles.value}>{actionType}</span></div>
    <div className={styles.statRow}><span className={styles.label}>Cost</span><span className={styles.value}>{tickCost} ticks</span></div>
    <div className={styles.statRow}><span className={styles.label}>Range</span><span className={styles.value}>{range}</span></div>
    {damage !== undefined && <div>Damage: {damage}</div>}
    {healing !== undefined && <div>Healing: {healing}</div>}
    {distance !== undefined && <div>Distance: {distance}</div>}
    {cooldown !== undefined && <div>Cooldown: {cooldown} ticks</div>}
    {behaviors.length > 0 && <div>Behaviors: {behaviors.join(", ")}</div>}
  </div>,
  document.body
)}
```

**Note on `aria-describedby`**: The anchor span always has `aria-describedby={tooltipId}` set, but the tooltip element with matching `id` only exists in the DOM when visible. This is the standard pattern -- screen readers only reference the described element when it is present.

### 2. `src/components/CharacterPanel/SkillNameWithTooltip.module.css`

New CSS module (~60-80 lines estimated).

**Key classes:**

```css
.tooltip {
  position: fixed;
  z-index: 1000;
  max-width: 220px;
  width: max-content;
  padding: 0.5rem;
  background-color: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg); /* 6px */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--content-primary);
  pointer-events: none; /* non-interactive */
  opacity: 0;
  animation: fadeIn 150ms ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.statRow {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.125rem 0;
}

.label {
  color: var(--content-secondary);
  white-space: nowrap;
}

.value {
  color: var(--content-primary);
  font-weight: 500;
  text-align: right;
}
```

**Design token choices** (aligned with `ui-ux-guidelines.md`):

- `--surface-primary` background (matches panel containers)
- `--border-default` border (matches panel/button borders)
- `--radius-lg` (6px, matches tooltip convention)
- `--content-secondary` for labels, `--content-primary` for values (opacity hierarchy)
- `--font-mono` for all text
- `0.5rem` padding (compact density)
- `0.8125rem` font size (tooltip body in typography scale)
- `pointer-events: none` (non-interactive tooltip, no leave delay needed)
- `fadeIn 150ms` animation (matches previous CharacterTooltip pattern)

### 3. `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx`

New test file (~200-250 lines estimated, 12 tests).

Test structure documented in test design phase.

## Files to Modify

### 4. `src/components/CharacterPanel/SkillRow.tsx`

**Line 188** -- Replace:

```tsx
<h3 className={styles.skillName}>{skill.name}</h3>
```

With:

```tsx
<h3 className={styles.skillName}>
  <SkillNameWithTooltip skillId={skill.id}>{skill.name}</SkillNameWithTooltip>
</h3>
```

Add import at top (after existing imports):

```tsx
import { SkillNameWithTooltip } from "./SkillNameWithTooltip";
```

**Note**: `getSkillDefinition` is already imported (line 13). The `skill.id` is available from the `skill: Skill` prop.

### 5. `src/components/CharacterPanel/PriorityTab.tsx`

**Line 100** -- Replace:

```tsx
<span className={styles.skillName}>{skillDef.name}</span>
```

With:

```tsx
<span className={styles.skillName}>
  <SkillNameWithTooltip skillId={skillDef.id}>
    {skillDef.name}
  </SkillNameWithTooltip>
</span>
```

Add import at top (after existing imports):

```tsx
import { SkillNameWithTooltip } from "./SkillNameWithTooltip";
```

**Note**: `skillDef` is a `SkillDefinition` from `SKILL_REGISTRY` iteration, so `skillDef.id` is directly available.

## Existing Test Impact

Existing tests that reference skill names via `screen.getByText(/skill name/i)` should continue to work because `SkillNameWithTooltip` renders its `children` (the name text) inside a `<span>`. The text content is preserved in the DOM tree.

Tests that use `.closest("div")` from the skill name element (SkillRow.test.tsx lines 135, 453, 475, 504) will now traverse through an additional `<span>` wrapper. This should still work since `.closest("div")` walks up the DOM tree and will find the `.skillRow` div. No changes expected.

**Verify after implementation**: Run full test suite to confirm no regressions.

## Implementation Order

1. Create `SkillNameWithTooltip.module.css` (styling)
2. Create `SkillNameWithTooltip.tsx` (component)
3. Create `SkillNameWithTooltip.test.tsx` (unit tests -- RED phase)
4. Iterate on component until tests pass (GREEN phase)
5. Integrate into `SkillRow.tsx` (line 188)
6. Integrate into `PriorityTab.tsx` (line 100)
7. Run full test suite to verify no regressions
8. Browser verification (visual check by human)

## Architectural Decisions

### Decision: Tooltip state as local React state (not Zustand)

- **Context**: Tooltip visibility is purely a UI concern with no impact on game logic. Per ADR-004, transient UI state uses local React state.
- **Decision**: Use `useState` and `useRef` inside `SkillNameWithTooltip` for visibility, timer, and positioning.
- **Consequences**: Each `SkillNameWithTooltip` instance manages its own state independently. No coordination between tooltips needed (only one can be hovered at a time naturally).

### Decision: No shared positioning utility

- **Context**: The previous `tooltip-positioning.ts` was extracted for CharacterTooltip and then removed. The skill tooltip has simpler positioning needs (below/above, not right/left).
- **Decision**: Inline the positioning logic in `SkillNameWithTooltip`. If a future tooltip needs similar logic, extract then.
- **Consequences**: Simple and self-contained. If CharacterTooltip is restored, the positioning logic may need to be shared.

### Decision: `useId()` for tooltip ID generation

- **Context**: Each tooltip needs a unique `id` for `aria-describedby` linkage. Multiple `SkillNameWithTooltip` instances can exist on the same page.
- **Decision**: Use React's `useId()` hook (stable, SSR-safe, unique per instance). Prefix with `skill-tooltip-` for debuggability.
- **Consequences**: Requires React 18+ (already using React 19.2).

## Risks and Mitigations

1. **Risk**: Multiple tooltips visible simultaneously if user rapidly moves between skill names.
   - **Mitigation**: The 150ms appear delay and immediate disappear on mouseleave naturally prevent this. Only one tooltip can be visible at a time since mouseenter on one skill triggers mouseleave on the previous.

2. **Risk**: Tooltip positioning flicker on first render.
   - **Mitigation**: Use `useLayoutEffect` (synchronous after render, before paint) and initially render tooltip off-screen (`top: -9999px`). Position is computed before the browser paints.

3. **Risk**: Existing tests break due to DOM structure changes.
   - **Mitigation**: The change is additive (wrapping text in a `<span>`). Text queries and `.closest()` traversals should be unaffected. Run full suite to verify.

4. **Risk**: `getSkillDefinition` returns `undefined` for invalid skill IDs.
   - **Mitigation**: Component renders children without tooltip if definition is not found. No crash, graceful degradation.

5. **Risk**: Tooltip clipped by viewport edges on small screens.
   - **Mitigation**: Horizontal clamping to `[8px, viewport - tooltipWidth - 8px]` and vertical flip (above when no room below) handle edge cases. Positioning tests deferred to browser tests since they depend on real layout.

## Spec Alignment Checklist

- [x] Plan aligns with `.docs/spec.md` -- implements progressive disclosure Level 2 ("on-demand detail")
- [x] Approach consistent with `.docs/architecture.md` -- local React state for UI concerns (ADR-004), CSS modules, centralized skill registry (ADR-005)
- [x] Patterns follow `.docs/patterns/index.md` -- portal tooltip positioning pattern (adapted for below/above instead of right/left)
- [x] No conflicts with `.docs/decisions/index.md` -- uses local state (ADR-004), reads from skill registry (ADR-005)
- [x] Visual design follows `.docs/ui-ux-guidelines.md` -- monospace font, compact density, opacity hierarchy, token system, tooltip conventions
