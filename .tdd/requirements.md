# TDD Spec: Skill Name Tooltips

Created: 2026-02-09

## Goal

Add hover/focus tooltips on skill names that display all relevant stats from the skill registry (action type, tick cost, range, damage, healing, distance, cooldown, behaviors). The tooltip is inherent to the skill name element — wherever a skill name appears in the UI (SkillRow priority list, Inventory section), hovering or focusing reveals the tooltip. This implements the spec's progressive disclosure Level 2 ("on-demand detail").

## Acceptance Criteria

- [ ] Hovering over a skill name in SkillRow displays a tooltip showing registry stats for that skill
- [ ] Hovering over a skill name in the Inventory section displays the same tooltip
- [ ] Tooltip displays: action type, tick cost, range, and only present optional stats (damage if defined, healing if defined, distance if defined, cooldown if defined, behaviors if non-empty). Absent stats are omitted, not shown as empty.
- [ ] Tooltip appears after a 150ms hover delay (prevents flicker when traversing the skill list)
- [ ] Tooltip disappears when mouse leaves the skill name (no leave delay — tooltip is non-interactive)
- [ ] Focusing the skill name via keyboard also shows the tooltip (WCAG 2.2 SC 1.4.13 compliance)
- [ ] Tooltip uses portal rendering (`createPortal` to `document.body`) to escape `overflow-y: auto` clipping on `.content`
- [ ] Tooltip positions below the skill name by default; flips above if insufficient space below. Horizontally clamped to viewport bounds with 8px margin.
- [ ] Tooltip follows the project's visual design system (monospace font, terminal overlay tokens, compact density, `var(--radius-lg)` border radius, `0 4px 12px rgba(0,0,0,0.3)` box-shadow)
- [ ] Tooltip is accessible (`role="tooltip"`, `id` linked via `aria-describedby` on the skill name element)
- [ ] A shared `SkillNameWithTooltip` component encapsulates the behavior, used in both SkillRow and PriorityTab inventory

## Approach

Create a reusable `SkillNameWithTooltip` component that wraps the skill name text and renders a portal-positioned tooltip on hover/focus. The component accepts a `skillId` string and looks up the `SkillDefinition` from `SKILL_REGISTRY` via `getSkillDefinition()`.

**Portal rendering** is required because `CharacterPanel .content` uses `overflow-y: auto`, which clips absolutely-positioned children. The tooltip renders via `createPortal(tooltip, document.body)` with `position: fixed`.

**Positioning strategy**: On show, measure the anchor element with `getBoundingClientRect()`. Place tooltip below anchor with 4px gap. If `anchor.bottom + gap + tooltipHeight + 8px > window.innerHeight`, flip above (`anchor.top - gap - tooltipHeight`). Horizontally align left edge with anchor, clamped to `[8px, window.innerWidth - tooltipWidth - 8px]`. Use `useLayoutEffect` for flicker-free positioning.

**Appear delay**: 150ms `setTimeout` on mouseenter/focus, cleared on mouseleave/blur. Prevents twitchy tooltip flicker when moving through skill lists.

**Both consumption sites** (SkillRow `.skillName` and PriorityTab `.skillName`) have identical needs: display skill name text, show tooltip with stats on hover/focus. The shared component is the right abstraction — both receive a `skillId` and optional children/className for styling flexibility.

## Test Strategy

Tests use React Testing Library (unit tests, not browser tests — no `getBoundingClientRect` dependency in assertions):

1. **Renders tooltip on hover** — hover skill name, assert tooltip with `role="tooltip"` appears after delay
2. **Shows correct stats for attack skill** — tooltip for Light Punch shows damage, range, tickCost; does NOT show healing or distance
3. **Shows correct stats for heal skill** — tooltip for Heal shows healing, range, tickCost; does NOT show damage
4. **Shows correct stats for move skill** — tooltip for Move shows distance, behaviors; does NOT show damage or healing
5. **Shows correct stats for skill with cooldown** — tooltip for Heavy Punch shows cooldown value
6. **Omits absent stats** — no "Healing: —" or empty rows for stats the skill doesn't have
7. **Tooltip disappears on mouse leave** — hover then unhover, assert tooltip removed from DOM
8. **Renders on keyboard focus** — focus skill name via tab, assert tooltip appears
9. **Disappears on blur** — focus then blur, assert tooltip removed
10. **Accessibility wiring** — skill name has `aria-describedby` pointing to tooltip `id`
11. **Works in SkillRow context** — render SkillRow with a skill, hover name, tooltip appears
12. **Works in Inventory context** — render PriorityTab inventory row, hover name, tooltip appears

Positioning tests (viewport overflow, flip behavior) are deferred to browser tests if needed, since they depend on real layout.

## Scope Boundaries

- In scope: New `SkillNameWithTooltip` component + CSS module, integration into `SkillRow` and `PriorityTab` inventory, unit tests
- Out of scope: Human-written skill descriptions (no `description` field on `SkillDefinition`), tooltip nesting, CharacterTooltip restoration, browser-level positioning tests

## Assumptions

- Stats are derived entirely from `SkillDefinition` in the registry — no runtime skill state (like current cooldownRemaining) shown in the tooltip
- Tooltip is non-interactive (no links, no hover-on-tooltip behavior, no leave delay needed)
- 150ms appear delay is sufficient for comfortable traversal; can be tuned after human testing

## Constraints

- Must use CSS custom property tokens from `theme.css` (no raw color values)
- Must use `var(--font-mono)` for all text
- Must follow compact density patterns (`0.5rem` padding, `0.75rem`-`0.85rem` font sizes)
- Must comply with WCAG 2.2 Level AA (SC 1.4.13: hover and focus triggers, dismissible via Escape or mouse leave/blur)
- Portal rendering required (parent has `overflow-y: auto`)
- Component must be testable with React Testing Library
- Max 400 lines per file
