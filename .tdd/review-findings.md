# Review Findings: SkillNameWithTooltip

**Reviewer**: tdd-reviewer | **Date**: 2026-02-10 | **Verdict**: PASS

## Quality Gates

| Gate              | Status |
| ----------------- | ------ |
| Tests (1452/1452) | PASS   |
| TypeScript        | PASS   |
| ESLint            | PASS   |

## Acceptance Criteria (11/11 met)

All 11 acceptance criteria verified against the implementation:

1. SkillRow tooltip on hover -- SkillRow.tsx line 190 wraps skill name with `SkillNameWithTooltip`
2. Inventory tooltip on hover -- PriorityTab.tsx line 102 wraps inventory skill name
3. Conditional stat display -- `!== undefined` checks at lines 140-168 correctly show defined stats and omit absent ones; `damage: 0` (Kick) is handled correctly
4. 150ms hover delay -- `APPEAR_DELAY = 150` at line 21, tested at lines 28-56
5. Immediate disappear on mouse leave -- `hide()` calls `setIsVisible(false)` directly
6. Keyboard focus/blur -- `onFocus={show}` and `onBlur={hide}` at lines 101-102
7. Portal rendering -- `createPortal(..., document.body)` at line 119
8. Position below/flip above -- `useLayoutEffect` at lines 65-86 with vertical flip and horizontal clamp
9. Design system compliance -- CSS uses `--surface-primary`, `--border-default`, `--radius-lg`, `--font-mono`, `--content-primary/secondary`, compact `0.5rem` padding
10. Accessibility -- `role="tooltip"`, `aria-describedby`, `useId()` at lines 35-36, 104, 113
11. Shared component -- Single `SkillNameWithTooltip` used in both SkillRow and PriorityTab

## Issues

### MINOR: Dead CSS class `.anchor` (SkillNameWithTooltip.module.css line 6-8)

The `.anchor` class with `cursor: help` is defined but never referenced in the component. The anchor `<span>` receives `className={className}` from props, not `styles.anchor`. Either apply the class or remove it.

### MINOR: Portal tooltip pattern doc is stale (`.docs/patterns/portal-tooltip-positioning.md`)

The "Related Files" section references `tooltip-positioning.ts` and `CharacterTooltip.tsx` which were removed in commit 7a4db95. The new `SkillNameWithTooltip` component is not listed. This is a documentation-only issue, out of scope for this task but worth noting.

## Positive Observations

- Correct use of `!== undefined` instead of truthiness check for `damage: 0` edge case
- Clean separation: `TooltipContent` extracted as a sub-component for readability
- Proper timer cleanup on unmount path (hide clears timer)
- Escape key dismissal implemented for WCAG 2.2 SC 1.4.13
- `pointer-events: none` on tooltip CSS prevents tooltip from intercepting mouse events
- No security concerns (no user input rendered as HTML, no external data)
- All files within size limits (component 173 lines, CSS 54 lines, tests 447 lines)
- `vite.config.ts` change is appropriate: `shouldAdvanceTime: true` is scoped to unit test project and enables `userEvent` + `fakeTimers` interop

## Duplication Check

No duplicate tooltip implementations found. `createPortal` and `role="tooltip"` are only used in this new component (CharacterTooltip was previously removed).

## Summary

Implementation is clean, well-tested (15 tests covering all acceptance criteria), and follows project patterns. Two MINOR issues found (dead CSS class, stale pattern doc). No CRITICAL or IMPORTANT issues. Recommend approval.
