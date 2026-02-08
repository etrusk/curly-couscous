# Implementation Plan: Accessibility Improvements

## Overview

Add ARIA semantics to HP bars and battle status, update docs with WCAG 2.2 AA reference, fix stale project references. Death event `role="alert"` is out of scope (no UI component exists).

## Work Items

### 1. HP Bar `role="meter"` (Token.tsx)

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx`
**Test file:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-visual.test.tsx`

**Approach:** Wrap the two HP bar `<rect>` elements (lines 198-219) in a `<g>` element with meter semantics. The wrapping `<g>` groups background + fill as a single conceptual meter widget.

**Changes to Token.tsx:**

- Add a `<g>` wrapper around the HP bar background rect and HP bar fill rect
- On the wrapper `<g>`, set:
  - `role="meter"`
  - `aria-label="HP"` (short label; full HP context already in parent `<g>` aria-label)
  - `aria-valuemin={0}`
  - `aria-valuemax={maxHp}`
  - `aria-valuenow={Math.max(0, hp)}` (clamp negative HP to 0 for ARIA)
  - `aria-valuetext={`${hp} of ${maxHp} HP`}` (human-readable for screen readers)

**Why `<g>` wrapper instead of attributes on `<rect>`:** The HP bar is two rects (background + fill). A wrapping `<g>` with `role="meter"` semantically groups them as one meter. Placing `role="meter"` on just the fill rect would leave the background rect semantically orphaned.

**Tests to add (token-visual.test.tsx):**

- New `describe("HP Bar Accessibility")` block with tests:
  1. HP bar wrapper has `role="meter"`
  2. HP bar has `aria-valuemin="0"`
  3. HP bar has `aria-valuemax` matching `maxHp` prop
  4. HP bar has `aria-valuenow` matching `hp` prop
  5. HP bar has `aria-valuetext` with human-readable HP string
  6. HP bar `aria-valuenow` clamps to 0 for zero HP (edge case)

**Risk: SVG `role="meter"` AT support.** The WAI-ARIA spec allows roles on SVG elements, but AT support varies. The `aria-valuetext` attribute provides a text fallback. This is the best-practice approach per SVG Accessibility API Mappings. No alternative provides better support.

### 2. Terminal State `role="alert"` (BattleStatusBadge.tsx)

**File:** `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.tsx`
**Test file:** `/home/bob/Projects/auto-battler/src/components/BattleStatus/BattleStatusBadge.test.tsx`

**Problem:** The `statusContainer` div already has `aria-live="polite"`. Adding `role="alert"` to the same element would conflict because `role="alert"` implicitly sets `aria-live="assertive"`.

**Approach: Separate alert element.** Add a visually-hidden `<div role="alert">` that only renders content for terminal states (victory, defeat, draw). This keeps the existing `aria-live="polite"` region untouched for non-terminal status updates.

**Changes to BattleStatusBadge.tsx:**

- Determine if status is terminal: `const isTerminal = battleStatus !== "active"`
- Add a new `<div role="alert">` inside the badge div (sibling to `statusContainer`)
- When `isTerminal` is true, render the status text inside the alert div
- When `isTerminal` is false, render the alert div empty (present but empty so screen readers register it; content appears only on transition)
- Use visually-hidden CSS for the alert div (screen-reader-only, no visual impact)
- The existing `aria-live="polite"` region on `statusContainer` remains unchanged

**Why separate element, not conditional switching:**

- Conditional `aria-live` switching (polite vs assertive) requires the element to already exist in DOM for AT to track it. Swapping the attribute value may not trigger re-announcement.
- A dedicated `role="alert"` element that transitions from empty to containing text reliably triggers assertive announcement in all major screen readers.
- Keeps the existing `aria-live="polite"` behavior intact (no regression risk).

**CSS addition to BattleStatusBadge.module.css:**

- Add a `.srOnly` class (visually hidden, screen-reader accessible):
  ```css
  .srOnly {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  ```

**Tests to add (BattleStatusBadge.test.tsx):**

- New tests under `describe("Accessibility")`:
  1. Terminal state (victory) renders `role="alert"` element with status text
  2. Terminal state (defeat) renders `role="alert"` element with status text
  3. Terminal state (draw) renders `role="alert"` element with status text
  4. Active state renders `role="alert"` element but with no text content (empty)
  5. Existing `aria-live="polite"` region still present for all states (regression guard)

**Note on debouncing:** The exploration found that status text only changes on meaningful state transitions, not continuously. The tick counter is in a separate div outside the `aria-live` region. Debouncing is not needed for this implementation.

### 3. Stale Reference Fix (.roo/rules/00-project.md)

**File:** `/home/bob/Projects/auto-battler/.roo/rules/00-project.md`

**Changes:**

- Line 194: Replace `SkillsPanel/  # Sentence-builder UI (planned)` with `CharacterPanel/ # Single-view panel (skill config, priority ordering, inventory)`
- Line 195: Replace `RuleEvaluations/ # (planned)` with `RuleEvaluations/ # Formatters and display components`

Both entries are stale. SkillsPanel was deleted (commit 497e10f). RuleEvaluations already exists. These are documentation-only fixes with no test impact.

### 4. WCAG 2.2 AA Reference (spec.md + architecture.md)

**File:** `/home/bob/Projects/auto-battler/.docs/spec.md`
**File:** `/home/bob/Projects/auto-battler/.docs/architecture.md`

**Changes to spec.md:**

- In the "Accessibility" section (lines 437-441), add a line: `- Accessibility target: WCAG 2.2 Level AA compliance`
- This is the requirements-level statement.

**Changes to architecture.md:**

- In the "Accessibility Requirements" section (lines 133-140), add: `- Compliance target: WCAG 2.2 Level AA`
- This is the architecture-level constraint.

No test changes needed. Documentation only.

## Implementation Order

1. **Tests first** (RED phase):
   - Write HP bar meter tests in `token-visual.test.tsx`
   - Write terminal alert tests in `BattleStatusBadge.test.tsx`
   - Verify all new tests fail

2. **Implementation** (GREEN phase):
   - Token.tsx: Add `<g role="meter">` wrapper
   - BattleStatusBadge.tsx: Add `<div role="alert">` element
   - BattleStatusBadge.module.css: Add `.srOnly` class

3. **Documentation fixes** (no tests needed):
   - `.roo/rules/00-project.md`: Fix stale references
   - `.docs/spec.md`: Add WCAG 2.2 AA reference
   - `.docs/architecture.md`: Add WCAG 2.2 AA reference

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements (accessibility section covers ARIA labels, letters, colorblind support)
- [x] Approach consistent with `.docs/architecture.md` (SVG ARIA pattern matches Grid/Cell/Token existing approach)
- [x] Patterns follow `.docs/patterns/index.md` (no new patterns needed; follows existing SVG ARIA conventions)
- [x] No conflicts with `.docs/decisions/index.md` (no ADRs affected)

## Files Modified (planned)

| File                                                       | Type   | Changes                                       |
| ---------------------------------------------------------- | ------ | --------------------------------------------- |
| `src/components/BattleViewer/token-visual.test.tsx`        | Test   | Add 6 HP bar ARIA meter tests                 |
| `src/components/BattleViewer/Token.tsx`                    | Source | Add `<g role="meter">` wrapper around HP bars |
| `src/components/BattleStatus/BattleStatusBadge.test.tsx`   | Test   | Add 5 terminal alert tests                    |
| `src/components/BattleStatus/BattleStatusBadge.tsx`        | Source | Add `<div role="alert">` for terminal states  |
| `src/components/BattleStatus/BattleStatusBadge.module.css` | Style  | Add `.srOnly` class                           |
| `.roo/rules/00-project.md`                                 | Docs   | Fix 2 stale references                        |
| `.docs/spec.md`                                            | Docs   | Add WCAG 2.2 AA reference                     |
| `.docs/architecture.md`                                    | Docs   | Add WCAG 2.2 AA reference                     |

## Risks

1. **SVG `role="meter"` AT support**: Variable across screen readers. Mitigated by `aria-valuetext` fallback. No better alternative exists.
2. **`role="alert"` timing**: The alert div must be in DOM before content appears for reliable announcement. Rendering it empty on active state ensures AT registers it. Content insertion triggers announcement.
3. **Existing test breakage**: The `<g>` wrapper changes DOM structure of HP bars. Existing tests query `health-bar-${id}` by testid which will still work (testid stays on fill rect). No breakage expected.

## No New Architectural Decisions

This plan uses existing patterns (SVG ARIA roles, CSS Modules, screen-reader-only styling). No new ADR needed.
