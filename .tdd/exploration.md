# Exploration Findings

## Task Understanding

Add hover/focus tooltips on skill names that display all relevant stats from the skill registry. A shared `SkillNameWithTooltip` component will be used in both SkillRow (priority list) and PriorityTab (inventory section). The tooltip shows action type, tick cost, range, and conditionally: damage, healing, distance, cooldown, and behaviors. Portal rendering is required to escape `overflow-y: auto` clipping. This implements progressive disclosure Level 2 ("on-demand detail").

## Relevant Files

### Source Files to Modify

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` - Line 188: `<h3 className={styles.skillName}>{skill.name}</h3>` must be replaced with `<SkillNameWithTooltip>`. Also uses `skill.id` (line 44) to call `getSkillDefinition(skill.id)` -- same pattern the tooltip component will use.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.tsx` - Line 100: `<span className={styles.skillName}>{skillDef.name}</span>` must be replaced with `<SkillNameWithTooltip>`. Has direct access to `skillDef.id` in the inventory `.map()`.

### Source Files to Create

- `src/components/CharacterPanel/SkillNameWithTooltip.tsx` - New shared component
- `src/components/CharacterPanel/SkillNameWithTooltip.module.css` - New CSS module for tooltip styling

### Test Files to Create

- `src/components/CharacterPanel/SkillNameWithTooltip.test.tsx` - Unit tests for the new component (12 tests per requirements)

### Existing Test Files That May Need Updates

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` - Tests reference skill names via `screen.getByText(/heavy punch/i)` etc. These should still work since `SkillNameWithTooltip` renders the name as children. However, tests that use `.closest("div")` to find the SkillRow container (lines 135, 453, 475, 504) may be affected if the wrapping element changes.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab-inventory.test.tsx` - References skill names in inventory (e.g., `screen.getByText(/light punch/i)` on line 36). Should still work.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab-config.test.tsx` - May reference skill names.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab-battle.test.tsx` - May reference skill names.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab-evaluation.test.tsx` - May reference skill names.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-actions.test.tsx` - May reference skill names.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter.test.tsx` - May reference skill names.

### Reference Files (Read-only Context)

- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - `SkillDefinition` type and `getSkillDefinition()` function
- `/home/bob/Projects/auto-battler/src/styles/theme.css` - CSS custom properties for tooltip styling
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/CharacterPanel.module.css` - Confirms `.content` has `overflow-y: auto` (line 41), which necessitates portal rendering
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` - Existing `.skillName` class (line 86-90): `font-weight: 500; color: var(--text-primary); min-width: 100px`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/PriorityTab.module.css` - Existing `.skillName` class (line 49-53): `flex: 1; color: var(--text-primary); font-size: 0.9rem`

## Skill Registry Shape

The `SkillDefinition` interface (from `src/engine/skill-registry.ts`, lines 32-58):

```typescript
export interface SkillDefinition {
  id: string;
  name: string;
  actionType: "attack" | "move" | "heal" | "interrupt" | "charge";
  tickCost: number;
  range: number;
  damage?: number;        // Optional -- only attack/charge skills
  healing?: number;       // Optional -- only heal skill
  distance?: number;      // Optional -- only move/dash/charge skills
  behaviors: string[];    // Available behaviors (empty for most skills, ["towards","away"] for Move/Dash)
  defaultBehavior: string;
  innate: boolean;
  defaultTarget: Target;
  defaultCriterion: Criterion;
  targetingMode: "cell" | "character";
  cooldown?: number;      // Optional cooldown ticks after use
  defaultTrigger?: { ... };
  defaultFilter?: { ... };
}
```

The tooltip should display: `actionType`, `tickCost`, `range`, and conditionally: `damage`, `healing`, `distance`, `cooldown`, `behaviors` (when non-empty array). `innate`, `defaultTarget`, `defaultCriterion`, `defaultBehavior`, `targetingMode`, `defaultTrigger`, `defaultFilter` are NOT shown.

`getSkillDefinition(id: string): SkillDefinition | undefined` -- looks up by `id` string. Returns `undefined` for unknown IDs.

### Skill Examples for Test Cases

| Skill         | actionType | tickCost | range | damage | healing | distance | cooldown | behaviors          |
| ------------- | ---------- | -------- | ----- | ------ | ------- | -------- | -------- | ------------------ |
| Light Punch   | attack     | 0        | 1     | 10     | -       | -        | -        | []                 |
| Heavy Punch   | attack     | 2        | 2     | 25     | -       | -        | 3        | []                 |
| Move          | move       | 1        | 1     | -      | -       | 1        | 1        | ["towards","away"] |
| Heal          | heal       | 2        | 5     | -      | 25      | -        | -        | []                 |
| Ranged Attack | attack     | 1        | 4     | 15     | -       | -        | 2        | []                 |
| Dash          | move       | 0        | 1     | -      | -       | 2        | 3        | ["towards","away"] |
| Kick          | interrupt  | 0        | 1     | 0      | -       | -        | 4        | []                 |
| Charge        | charge     | 1        | 3     | 20     | -       | 3        | 3        | []                 |

## Existing Patterns

### Portal Tooltip Positioning (from CharacterTooltip, removed in commit 7a4db95)

The previous CharacterTooltip used:

- `createPortal(tooltipContent, document.body)` for portal rendering
- `position: fixed` with `z-index: 1000`
- `useLayoutEffect` for flicker-free positioning after render
- `calculateTooltipPosition(anchorRect, tooltipWidth, tooltipHeight)` extracted to separate file
- Constants: `OFFSET = 12` (gap), `MARGIN = 8` (viewport edge margin)
- Leave delay: 100ms `setTimeout` (for interactive tooltips only -- the new tooltip is non-interactive, so no leave delay needed)
- `role="tooltip"` with `id` linked to trigger's `aria-describedby`
- Entry animation: `fadeIn 150ms ease-out` (opacity 0 to 1)

### Tooltip CSS Tokens (from CharacterTooltip.module.css)

```css
.tooltip {
  position: fixed;
  z-index: 1000;
  min-width: 280px;
  max-width: 320px;
  background-color: var(--surface-primary);
  border: 2px solid var(--border-default);
  border-radius: 6px; /* matches var(--radius-lg) */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  opacity: 0;
  animation: fadeIn 150ms ease-out forwards;
}
```

For the new skill tooltip, differences from CharacterTooltip:

- **Smaller**: stat-only content needs less width (no skill priority list)
- **Non-interactive**: `pointer-events: none` (no hover-on-tooltip)
- **Positioned below/above**: not right/left of anchor
- **150ms appear delay**: mouseenter starts timer, mouseleave clears it
- **No leave delay**: disappears immediately on mouse leave

### CSS Module Pattern

All components use CSS Modules (`.module.css`). Import as `import styles from "./Component.module.css"` and apply as `className={styles.className}`.

### Component Test Pattern

Tests use React Testing Library with:

- `import { render, screen } from "@testing-library/react"`
- `import userEvent from "@testing-library/user-event"`
- `createSkill()` and `createCharacter()` from `src/engine/game-test-helpers.ts`
- Direct store manipulation: `useGameStore.getState().actions.initBattle([...])`
- Assertions: `screen.getByRole("tooltip")`, `screen.queryByRole("tooltip")` for presence/absence
- `vi.useFakeTimers()` for delay testing (150ms appear delay needs fake timers)
- `waitFor()` or `act()` for async state updates after timer fires

### Key Test Helper: `createSkill`

From `src/engine/game-test-helpers.ts` (line 47):

```typescript
export function createSkill(overrides: Partial<Skill> & { id: string }): Skill;
```

Requires `id` field, defaults everything else. For tooltip tests, need `id` matching a registry entry (e.g., `"light-punch"`, `"heal"`, `"move-towards"`) so `getSkillDefinition()` returns data.

## Dependencies

- `getSkillDefinition()` from `src/engine/skill-registry.ts` -- core data source
- `createPortal` from `react-dom` -- portal rendering
- `useLayoutEffect`, `useRef`, `useState` from `react` -- positioning logic
- CSS custom properties from `src/styles/theme.css` -- styling tokens
- `SkillRow` and `PriorityTab` -- consumption sites for the new component

## Constraints Discovered

1. **Portal rendering is mandatory**: `CharacterPanel .content` (line 41 of `CharacterPanel.module.css`) uses `overflow-y: auto`, which clips absolutely positioned children. The outer `.panel` also has `overflow: hidden` (line 12). Both ancestors clip tooltips.

2. **SkillRow renders name as `<h3>`**: Line 188 of SkillRow.tsx: `<h3 className={styles.skillName}>{skill.name}</h3>`. The `SkillNameWithTooltip` component needs to either render as an `<h3>` or be wrapped in one. The `<h3>` tag is semantic for skill name within the list. The new component should accept a `className` prop and an element type or just render a `<span>` and let SkillRow keep the `<h3>` wrapper.

3. **PriorityTab renders name as `<span>`**: Line 100 of PriorityTab.tsx: `<span className={styles.skillName}>{skillDef.name}</span>`. Different element than SkillRow. The shared component needs flexibility.

4. **Existing `.skillName` CSS classes differ**: SkillRow's `.skillName` has `min-width: 100px; font-weight: 500` while PriorityTab's has `flex: 1; font-size: 0.9rem`. The shared component should accept a `className` prop to preserve site-specific styling.

5. **`skillId` vs full `SkillDefinition`**: SkillRow has `skill.id` available (from the `Skill` instance). PriorityTab inventory has `skillDef.id` available (from `SKILL_REGISTRY` iteration). Both provide the `id` string needed for `getSkillDefinition()`.

6. **Kick has `damage: 0`**: The Kick skill definition includes `damage: 0`. The tooltip should probably omit damage when it's 0 (same as absent), or show it as "0". The requirements say "only present optional stats" -- `damage: 0` is technically present. This is an edge case to clarify. Convention should match what's useful: showing "Damage: 0" for Kick is informative (it confirms the skill does no damage despite being interrupt type).

7. **CharacterTooltip was removed**: The previous tooltip implementation was removed in commit `7a4db95`. The pattern documentation (`.docs/patterns/portal-tooltip-positioning.md`) and visual spec (`.docs/visual-specs/character-tooltip.md`) still exist as reference, but no live tooltip code exists in the codebase.

8. **Max 400 lines per file**: Project constraint. The `SkillNameWithTooltip` component + tests should stay under this limit. Component will be small; tests may approach but should stay under.

## Open Questions

1. **Damage: 0 display**: Should the tooltip show "Damage: 0" for Kick (interrupt skill with `damage: 0`), or omit it? Requirements say "only present optional stats" -- `damage` is defined but zero. Recommend showing it to be informative.

2. **SkillRow `<h3>` wrapping**: Should `SkillNameWithTooltip` render as a generic element (span) and sit inside the existing `<h3>`, or should it replace the `<h3>` entirely? The simpler approach is: `SkillNameWithTooltip` renders a `<span>` (or accepts an `as` prop), and SkillRow wraps it in `<h3>`. But current SkillRow has `<h3 className={styles.skillName}>{skill.name}</h3>` -- simplest replacement is `<h3 className={styles.skillName}><SkillNameWithTooltip skillId={skill.id}>{skill.name}</SkillNameWithTooltip></h3>`.

3. **Focus mechanism**: The requirements say focusing the skill name shows the tooltip. The `<h3>` element is not focusable by default. Options: (a) add `tabindex="0"` to a child `<span>` inside the `<h3>`, (b) make the `SkillNameWithTooltip` a `<button>` element, (c) use `tabindex="0"` on the `SkillNameWithTooltip` wrapper. Option (a) or (c) is cleanest -- a `<span tabindex="0">` inside the name element.

4. **Tooltip width**: CharacterTooltip used `min-width: 280px; max-width: 320px`. The skill stat tooltip has less content. What width constraints? Recommend: no min-width (auto-size), max-width around `220px` to keep compact, or let it auto-size with `white-space: nowrap` on single-value rows.

5. **Tooltip content format**: Should stats be displayed as a vertical list (`Type: attack`, `Cost: 0 ticks`, `Range: 1`, `Damage: 10`) or more compactly (e.g., a small grid or inline tokens)? The requirements spec mentions "compact density patterns" -- a vertical label:value list with small font is consistent with the design system.
