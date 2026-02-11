# Test Designs: Skill Expansion UI Gaps

Created: 2026-02-11
Plan: `.tdd/plan.md`
Requirements: `.tdd/requirements.md`

## Overview

24 tests across 3 test files covering 4 feature areas:

- **A. Filter Condition Dropdown Expansion** (6 tests) -- `SkillRow-filter.test.tsx`
- **B. Filter NOT Toggle** (6 tests) -- `SkillRow-filter-not-toggle.test.tsx`
- **C. Qualifier Selector - Filter** (6 tests) -- `SkillRow-filter-not-toggle.test.tsx`
- **D. Qualifier Selector - Trigger** (6 tests) -- `TriggerDropdown-qualifier.test.tsx`

No tests require fake timers. All use `userEvent.setup()` for interactions.

---

## File Organization

| File                                          | Tests        | Estimated Lines |
| --------------------------------------------- | ------------ | --------------- |
| `SkillRow-filter.test.tsx` (existing, expand) | A1-A6        | ~220 (from 168) |
| `SkillRow-filter-not-toggle.test.tsx` (new)   | B1-B6, C1-C6 | ~350            |
| `TriggerDropdown-qualifier.test.tsx` (new)    | D1-D6        | ~200            |

All files stay under 400-line limit.

---

## Shared Setup Patterns

### SkillRow tests (A, B, C groups)

SkillRow calls `updateSkill` from the Zustand store directly (not via callback props). Tests that verify store mutations must:

1. Call `useGameStore.getState().actions.reset()` in `beforeEach`
2. Use `useGameStore.getState().actions.initBattle([character])` to populate the store before rendering
3. After user interaction, read `useGameStore.getState().gameState.characters` to verify the updated skill filter

Import pattern:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillRow } from "./SkillRow";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";
```

Standard render helper:

```typescript
function renderSkillRow(skill, character) {
  return render(
    <SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />
  );
}
```

Store query helper:

```typescript
function getSkillFilter(charId, instanceId) {
  const char = useGameStore
    .getState()
    .gameState.characters.find((c) => c.id === charId);
  return char?.skills.find((s) => s.instanceId === instanceId)?.filter;
}
```

### TriggerDropdown tests (D group)

TriggerDropdown is a controlled component with `onTriggerChange` callback. Tests use the same pattern as `TriggerDropdown.test.tsx` and `TriggerDropdown-not-toggle.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriggerDropdown } from "./TriggerDropdown";
```

Render helper (matching existing `TriggerDropdown.test.tsx` pattern):

```typescript
const defaultProps = { skillName: "Light Punch", triggerIndex: 0, onTriggerChange: vi.fn() };

function renderDropdown(trigger, overrides?) {
  const onTriggerChange = vi.fn();
  const result = render(
    <TriggerDropdown trigger={trigger} {...defaultProps} onTriggerChange={onTriggerChange} {...overrides} />
  );
  return { onTriggerChange, ...result };
}
```

---

## A. Filter Condition Dropdown Expansion

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter.test.tsx`

These tests extend the existing `SkillRow-filter.test.tsx` file. Test A1 replaces the existing test at line 65 ("filter type dropdown has HP below and HP above options"). Tests A2-A6 are new.

### Test: A1-filter-dropdown-all-7-conditions

- **File**: `src/components/CharacterPanel/SkillRow-filter.test.tsx`
- **Type**: unit
- **Verifies**: Filter type dropdown includes all 7 filterable conditions with correct values and display text
- **Setup**: Render SkillRow with `filter: { condition: "hp_below", conditionValue: 50 }`. No store initialization needed (DOM-only check).
- **Assertions**:
  1. `within(filterDropdown).getByRole("option", { name: "HP below" })` has value `"hp_below"`
  2. `within(filterDropdown).getByRole("option", { name: "HP above" })` has value `"hp_above"`
  3. `within(filterDropdown).getByRole("option", { name: "In range" })` has value `"in_range"`
  4. `within(filterDropdown).getByRole("option", { name: "Channeling" })` has value `"channeling"`
  5. `within(filterDropdown).getByRole("option", { name: "Idle" })` has value `"idle"`
  6. `within(filterDropdown).getByRole("option", { name: "Cell targeted" })` has value `"targeting_me"`
  7. `within(filterDropdown).getByRole("option", { name: "Targeting ally" })` has value `"targeting_ally"`
  8. Total option count is exactly 7: `within(filterDropdown).getAllByRole("option")` has length 7
- **Justification**: Validates acceptance criterion A1 ("Filter `<select>` includes all 7 filterable conditions"). Replaces existing test that only checked 2 options. The display text must match TriggerDropdown conventions exactly ("Cell targeted" for `targeting_me`, etc.). Note: filters do NOT include `always` -- unlike triggers, a filter that always passes is meaningless.

### Test: A2-non-value-condition-hides-input

- **File**: `src/components/CharacterPanel/SkillRow-filter.test.tsx`
- **Type**: unit
- **Verifies**: Non-value conditions (channeling, idle, targeting_me, targeting_ally) hide the numeric input
- **Setup**: Render SkillRow with `filter: { condition: "channeling" }` (no conditionValue). No store needed.
- **Assertions**:
  1. `screen.getByLabelText(/filter type for/i)` is present (filter is active)
  2. `screen.queryByLabelText(/filter value for/i)` is NOT in the document
- **Justification**: Validates acceptance criterion A2 ("Selecting channeling/idle/targeting_me/targeting_ally hides the numeric input"). Tests one representative non-value condition; the value/non-value split is driven by the same `FILTER_VALUE_CONDITIONS` set, so testing one non-value condition is sufficient for DOM hiding logic.

### Test: A3-value-condition-shows-input

- **File**: `src/components/CharacterPanel/SkillRow-filter.test.tsx`
- **Type**: unit
- **Verifies**: Value conditions (hp_below, hp_above, in_range) show the numeric input
- **Setup**: Render SkillRow with `filter: { condition: "in_range", conditionValue: 3 }`. No store needed.
- **Assertions**:
  1. `screen.getByLabelText(/filter value for/i)` is in the document
  2. Input has value `3`
- **Justification**: Validates acceptance criterion A3 ("Selecting in_range/hp_below/hp_above shows the numeric input"). Uses `in_range` specifically because it is a newly-added value condition (hp_below/hp_above were already tested). Also implicitly validates the `in_range` default value of 3 is rendered correctly.

### Test: A4-switching-value-to-non-value-clears-conditionValue

- **File**: `src/components/CharacterPanel/SkillRow-filter.test.tsx`
- **Type**: integration
- **Verifies**: Switching from a value condition to a non-value condition clears conditionValue from the stored filter
- **Setup**: Create skill with `filter: { condition: "hp_below", conditionValue: 50 }`. Call `useGameStore.getState().actions.reset()` in beforeEach. Call `useGameStore.getState().actions.initBattle([character])` before render. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"idle"` in the filter type dropdown via `user.selectOptions(filterDropdown, "idle")`
  2. Read store: `getSkillFilter("char1", "light-punch")` returns object with `condition: "idle"`
  3. Store filter does NOT have `conditionValue` property (or it is `undefined`): `expect(filter).not.toHaveProperty("conditionValue")` or `expect(filter?.conditionValue).toBeUndefined()`
- **Justification**: Validates acceptance criterion A6 ("Switching from a value condition to a non-value condition clears conditionValue"). This prevents stale numeric values from being stored on conditions that do not use them, which would cause engine evaluation bugs.

### Test: A5-switching-to-in_range-defaults-conditionValue-to-3

- **File**: `src/components/CharacterPanel/SkillRow-filter.test.tsx`
- **Type**: integration
- **Verifies**: Switching to `in_range` sets conditionValue default to 3
- **Setup**: Create skill with `filter: { condition: "channeling" }` (a non-value condition). Initialize store with `initBattle`. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"in_range"` in the filter type dropdown
  2. Store filter has `condition: "in_range"` and `conditionValue: 3`
- **Justification**: Validates acceptance criterion A4 ("in_range defaults to conditionValue: 3"). The default value of 3 matches TriggerDropdown's `getDefaultValue` function and reflects a reasonable hex distance.

### Test: A6-switching-to-hp_below-defaults-conditionValue-to-50

- **File**: `src/components/CharacterPanel/SkillRow-filter.test.tsx`
- **Type**: integration
- **Verifies**: Switching to `hp_below` sets conditionValue default to 50
- **Setup**: Create skill with `filter: { condition: "idle" }` (a non-value condition). Initialize store with `initBattle`. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"hp_below"` in the filter type dropdown
  2. Store filter has `condition: "hp_below"` and `conditionValue: 50`
- **Justification**: Validates acceptance criterion A4/A7 ("hp_below/hp_above default to 50" and "switching from non-value to value sets appropriate default"). Covers the complementary direction of A4 (non-value to value).

---

## B. Filter NOT Toggle

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` (new file)

This is a new file following the pattern of `TriggerDropdown-not-toggle.test.tsx`. Uses the same import/render/store patterns as the SkillRow-filter tests.

### Test: B1-not-toggle-visible-when-filter-active

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: NOT toggle button appears in the filter group when a filter is active
- **Setup**: Render SkillRow with `filter: { condition: "hp_below", conditionValue: 50 }`. No store needed (DOM-only check).
- **Assertions**:
  1. `screen.getByRole("button", { name: /toggle not.*filter.*light punch/i })` is in the document
  2. Button has text content `"NOT"`
- **Justification**: Validates acceptance criterion B1 ("A NOT toggle button appears in the filter group when a filter is active"). The aria-label distinguishes filter NOT from trigger NOT by including the word "filter".

### Test: B2-not-toggle-hidden-when-no-filter

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: NOT toggle is hidden when no filter is set
- **Setup**: Render SkillRow with no filter (default skill). No store needed.
- **Assertions**:
  1. `screen.queryByRole("button", { name: /toggle not.*filter/i })` is NOT in the document
- **Justification**: Validates acceptance criterion B5 ("NOT toggle is not shown when no filter is set"). When there is no filter, only the `+ Filter` ghost button should be visible. The NOT toggle should not appear because there is no filter to negate.

### Test: B3-not-toggle-click-sets-negated

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: integration
- **Verifies**: Clicking NOT toggle sets `filter.negated` to true
- **Setup**: Create skill with `filter: { condition: "hp_below", conditionValue: 50 }` (negated not set). Initialize store with `initBattle`. Use `userEvent.setup()`.
- **Assertions**:
  1. Click the NOT toggle button: `user.click(screen.getByRole("button", { name: /toggle not.*filter.*light punch/i }))`
  2. Store filter has `negated: true`: `expect(getSkillFilter("char1", "light-punch")?.negated).toBe(true)`
  3. Store filter preserves other fields: `condition` is still `"hp_below"`, `conditionValue` is still `50`
- **Justification**: Validates acceptance criterion B2 ("Toggle sets filter.negated on the skill via updateSkill store action"). Tests the activate direction of the toggle.

### Test: B4-not-toggle-click-clears-negated

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: integration
- **Verifies**: Clicking NOT toggle on a negated filter clears `filter.negated`
- **Setup**: Create skill with `filter: { condition: "hp_below", conditionValue: 50, negated: true }`. Initialize store with `initBattle`. Use `userEvent.setup()`.
- **Assertions**:
  1. Click the NOT toggle button
  2. Store filter has `negated` falsy: `expect(getSkillFilter("char1", "light-punch")?.negated).toBeFalsy()`
- **Justification**: Validates acceptance criterion B2 (deactivate direction). Ensures the toggle is bidirectional.

### Test: B5-not-toggle-aria-pressed-reflects-state

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: `aria-pressed` attribute correctly reflects the negated state
- **Setup**: Render SkillRow twice: once with `filter: { condition: "hp_below", conditionValue: 50, negated: true }`, once with `filter: { condition: "hp_below", conditionValue: 50 }` (no negated). Unmount between renders (following TriggerDropdown-not-toggle.test.tsx pattern).
- **Assertions**:
  1. First render (negated: true): button has `aria-pressed="true"`
  2. After unmount and second render (no negated): button has `aria-pressed="false"`
- **Justification**: Validates acceptance criterion B4 ("aria-pressed attributes present"). Screen readers rely on `aria-pressed` to communicate toggle state. The test verifies both states.

### Test: B6-switching-condition-preserves-negated

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: integration
- **Verifies**: Changing the filter condition preserves the `negated` flag
- **Setup**: Create skill with `filter: { condition: "hp_below", conditionValue: 50, negated: true }`. Initialize store. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"idle"` in the filter type dropdown
  2. Store filter has `condition: "idle"` AND `negated: true`
- **Justification**: Validates that `handleFilterTypeChange` preserves the `negated` flag when rebuilding the filter object (as specified in plan Step 3). Without this, toggling NOT and then changing condition would silently lose the negation.

---

## C. Qualifier Selector - Filter

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` (same new file as B group, in a separate `describe` block)

### Test: C1-qualifier-visible-when-channeling

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: Qualifier dropdown appears when filter condition is `channeling`
- **Setup**: Render SkillRow with `filter: { condition: "channeling" }`. No store needed.
- **Assertions**:
  1. `screen.getByLabelText(/filter qualifier for/i)` is in the document
  2. The qualifier select has a default value of `""` (meaning "(any)" is selected)
- **Justification**: Validates acceptance criterion C2 ("When filter condition is channeling, qualifier dropdown appears"). The default `(any)` selection means no qualifier is set, matching the most permissive behavior.

### Test: C2-qualifier-hidden-when-not-channeling

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: Qualifier dropdown is hidden when condition is not `channeling`
- **Setup**: Render SkillRow with `filter: { condition: "hp_below", conditionValue: 50 }`. No store needed.
- **Assertions**:
  1. `screen.queryByLabelText(/filter qualifier for/i)` is NOT in the document
- **Justification**: Validates acceptance criterion C6 ("Qualifier dropdown hidden when condition is not channeling"). Qualifier selection is only meaningful for `channeling` because it narrows what type of channeling to match.

### Test: C3-qualifier-has-any-action-and-skill-options

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: Qualifier dropdown has (any), action type optgroups, and skill optgroups with correct entries
- **Setup**: Render SkillRow with `filter: { condition: "channeling" }`. No store needed.
- **Assertions**:
  Use value-based approach to avoid name collision ambiguity (Heal, Charge, Move appear as both action type and skill name):
  1. Get the qualifier select: `const qualifierSelect = screen.getByLabelText(/filter qualifier for/i)`
  2. Get all options: `const options = within(qualifierSelect).getAllByRole("option")`
  3. Total option count is exactly 14: `expect(options).toHaveLength(14)` -- 1 (any) + 5 (actions) + 8 (skills)
  4. Extract all option values: `const values = options.map(o => (o as HTMLOptionElement).value)`. Assert the set contains all of: `""`, `"action:attack"`, `"action:move"`, `"action:heal"`, `"action:interrupt"`, `"action:charge"`, `"skill:light-punch"`, `"skill:heavy-punch"`, `"skill:move-towards"`, `"skill:heal"`, `"skill:ranged-attack"`, `"skill:dash"`, `"skill:kick"`, `"skill:charge"`
  5. Verify display names for unambiguous options: `within(qualifierSelect).getByRole("option", { name: "(any)" })` has value `""`, `within(qualifierSelect).getByRole("option", { name: "Attack" })` has value `"action:attack"`, `within(qualifierSelect).getByRole("option", { name: "Interrupt" })` has value `"action:interrupt"`, `within(qualifierSelect).getByRole("option", { name: "Light Punch" })` has value `"skill:light-punch"`, `within(qualifierSelect).getByRole("option", { name: "Ranged Attack" })` has value `"skill:ranged-attack"`
  6. Verify colliding names have both entries: `within(qualifierSelect).getAllByRole("option", { name: "Heal" })` has length 2 with values `"action:heal"` and `"skill:heal"` (any order). Same for "Charge" (`"action:charge"`, `"skill:charge"`) and "Move" (`"action:move"`, `"skill:move-towards"`)
  7. Default selection is `(any)`: `expect(qualifierSelect).toHaveValue("")`
- **Justification**: Validates acceptance criterion C3 ("Qualifier dropdown has options: (any), action types, skill IDs from registry"). Uses value-based assertions to handle the 3 name collisions robustly. Verifying all 14 options ensures no action types or registry skills are accidentally omitted. [REVIEWER NOTE: Restructured assertions to use value-based approach, replacing ambiguous name-based queries that would fail on duplicate display names for Heal/Charge/Move.]

### Test: C4-selecting-action-qualifier-sets-qualifier

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: integration
- **Verifies**: Selecting an action qualifier sets `qualifier: { type: "action", id: "heal" }` on the filter
- **Setup**: Create skill with `filter: { condition: "channeling" }`. Initialize store. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"action:heal"` in the qualifier dropdown: `user.selectOptions(qualifierSelect, "action:heal")`
  2. Store filter has `qualifier: { type: "action", id: "heal" }`
  3. Store filter still has `condition: "channeling"`
- **Justification**: Validates acceptance criterion C5 ("Selecting an action/skill qualifier sets qualifier on trigger/filter"). Uses `action:heal` as a representative action type.

### Test: C5-selecting-any-removes-qualifier

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: integration
- **Verifies**: Selecting `(any)` removes the qualifier field from the filter
- **Setup**: Create skill with `filter: { condition: "channeling", qualifier: { type: "action", id: "heal" } }`. Initialize store. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `""` (the `(any)` option) in the qualifier dropdown
  2. Store filter does NOT have `qualifier` property: `expect(getSkillFilter(...)).not.toHaveProperty("qualifier")` or qualifier is `undefined`
  3. Store filter still has `condition: "channeling"`
- **Justification**: Validates acceptance criterion C4 ("Selecting (any) removes the qualifier field from the trigger/filter"). The qualifier must be fully removed (not set to null or empty), because the engine checks for the presence of `qualifier` to decide whether to narrow matching.

### Test: C6-switching-away-from-channeling-clears-qualifier

- **File**: `src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx`
- **Type**: integration
- **Verifies**: Switching filter condition away from `channeling` clears any existing qualifier
- **Setup**: Create skill with `filter: { condition: "channeling", qualifier: { type: "skill", id: "heal" } }`. Initialize store. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"idle"` in the filter type dropdown
  2. Store filter has `condition: "idle"`
  3. Store filter does NOT have `qualifier` property
  4. Qualifier dropdown is no longer visible: `screen.queryByLabelText(/filter qualifier for/i)` not in document
- **Justification**: Validates acceptance criterion C7 ("Switching away from channeling clears any existing qualifier"). This prevents stale qualifier data from being stored on conditions that do not support qualifiers.

---

## D. Qualifier Selector - Trigger

File: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx` (new file)

TriggerDropdown is a controlled component. Tests verify the `onTriggerChange` callback shape.

### Test: D1-qualifier-visible-when-channeling

- **File**: `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- **Type**: unit
- **Verifies**: Qualifier dropdown appears when trigger condition is `channeling`
- **Setup**: Render TriggerDropdown with `trigger: { scope: "enemy", condition: "channeling" }`.
- **Assertions**:
  1. `screen.getByLabelText(/qualifier for light punch/i)` is in the document
  2. The qualifier select has value `""` (meaning `(any)` selected by default)
- **Justification**: Validates acceptance criterion C1 ("When trigger condition is channeling, qualifier dropdown appears in TriggerDropdown").

### Test: D2-qualifier-hidden-when-not-channeling

- **File**: `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- **Type**: unit
- **Verifies**: Qualifier dropdown is hidden when trigger condition is not `channeling`
- **Setup**: Render TriggerDropdown with `trigger: { scope: "enemy", condition: "hp_below", conditionValue: 50 }`.
- **Assertions**:
  1. `screen.queryByLabelText(/qualifier for/i)` is NOT in the document
- **Justification**: Validates acceptance criterion C6 ("Qualifier dropdown hidden when condition is not channeling"). Confirms the conditional rendering logic.

### Test: D3-selecting-action-qualifier-updates-trigger

- **File**: `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- **Type**: unit
- **Verifies**: Selecting an action qualifier calls `onTriggerChange` with qualifier on the trigger
- **Setup**: Render TriggerDropdown with `trigger: { scope: "enemy", condition: "channeling" }`. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"action:attack"` in the qualifier dropdown: `user.selectOptions(qualifierSelect, "action:attack")`
  2. `onTriggerChange` called with `expect.objectContaining({ scope: "enemy", condition: "channeling", qualifier: { type: "action", id: "attack" } })`
- **Justification**: Validates acceptance criterion C5 for triggers ("Selecting an action/skill qualifier sets qualifier on the trigger").

### Test: D4-selecting-skill-qualifier-updates-trigger

- **File**: `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- **Type**: unit
- **Verifies**: Selecting a skill qualifier calls `onTriggerChange` with the correct qualifier type and ID, including hyphenated skill IDs
- **Setup**: Render TriggerDropdown with `trigger: { scope: "enemy", condition: "channeling" }`. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"skill:light-punch"` in the qualifier dropdown
  2. `onTriggerChange` called with `expect.objectContaining({ qualifier: { type: "skill", id: "light-punch" } })`
- **Justification**: Validates the skill qualifier branch (as opposed to action qualifier in D3). Uses `light-punch` (a hyphenated ID) to exercise the `split(":")` parsing logic -- since `split(":")` splits on ALL colons, it is important to verify that hyphenated IDs are not mangled. The split on `"skill:light-punch"` produces `["skill", "light-punch"]` which is correct because neither the type prefix nor skill IDs contain colons (verified in exploration). [REVIEWER NOTE: Changed from `skill:kick` to `skill:light-punch` to exercise hyphenated ID parsing.]

### Test: D5-selecting-any-removes-qualifier

- **File**: `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- **Type**: unit
- **Verifies**: Selecting `(any)` calls `onTriggerChange` with qualifier removed from the trigger
- **Setup**: Render TriggerDropdown with `trigger: { scope: "enemy", condition: "channeling", qualifier: { type: "action", id: "heal" } }`. Use `userEvent.setup()`.
- **Assertions**:
  1. The qualifier dropdown currently shows `"action:heal"`: `expect(qualifierSelect).toHaveValue("action:heal")`
  2. Select `""` (the `(any)` option) in the qualifier dropdown
  3. `onTriggerChange` called once
  4. The callback argument does NOT have a `qualifier` property: verify via `expect(callArg).not.toHaveProperty("qualifier")` or `expect(callArg.qualifier).toBeUndefined()` using destructured rest pattern
  5. The callback argument still has `scope: "enemy"` and `condition: "channeling"`
- **Justification**: Validates acceptance criterion C4 for triggers ("Selecting (any) removes the qualifier field"). The handler uses object destructuring with rest (`const { qualifier: _, ...rest } = trigger`) to exclude qualifier, so the resulting object must not contain the key at all.

### Test: D6-switching-away-from-channeling-clears-qualifier

- **File**: `src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`
- **Type**: unit
- **Verifies**: Switching trigger condition away from `channeling` clears qualifier from the callback
- **Setup**: Render TriggerDropdown with `trigger: { scope: "enemy", condition: "channeling", qualifier: { type: "skill", id: "heal" } }`. Use `userEvent.setup()`.
- **Assertions**:
  1. Select `"hp_below"` in the trigger condition dropdown (the combobox with aria-label `"Trigger for Light Punch"`)
  2. `onTriggerChange` called with `{ scope: "enemy", condition: "hp_below", conditionValue: 50 }` -- no `qualifier` property
  3. Verify explicitly: `expect(callArg).not.toHaveProperty("qualifier")`
- **Justification**: Validates acceptance criterion C7 for triggers ("Switching away from channeling clears any existing qualifier"). The existing `handleConditionChange` builds `newTrigger` from scratch (only scope + condition + optional conditionValue + optional negated), which naturally excludes qualifier. This test confirms that contract. [REVIEWER NOTE: Removed DOM visibility assertion (original assertion 4) because TriggerDropdown is a controlled component -- the parent must re-render with the new trigger for the qualifier dropdown to disappear, which does not happen in this test. Qualifier dropdown visibility when condition is not channeling is already covered by D2.]

---

## Edge Cases and Notes

### Name collisions in qualifier options

The SKILL_REGISTRY contains skills whose names match action type labels:

- Action `"heal"` displays as "Heal"; Skill `"heal"` (id) displays as "Heal" (name)
- Action `"charge"` displays as "Charge"; Skill `"charge"` (id) displays as "Charge" (name)
- Action `"move"` displays as "Move"; Skill `"move-towards"` displays as "Move" (name)

Test C3 must account for duplicate display names by querying within the qualifier select and checking values (not just names). The optgroup labels ("Action Type" and "Skill") disambiguate visually, but `getByRole("option", { name: "Heal" })` will match multiple elements. Use `getAllByRole` and filter by value, or use `within()` on optgroup elements if supported.

**Recommended approach for C3**: Use `within(qualifierSelect).getAllByRole("option")` to get all options, then verify the full set by checking `option.value` for each expected value string.

### Store initialization pattern for SkillRow interaction tests

Tests A4-A6, B3-B4, B6, C4-C6 require store initialization. The pattern is:

1. `beforeEach(() => useGameStore.getState().actions.reset())`
2. In each test: `useGameStore.getState().actions.initBattle([character])`
3. Render SkillRow
4. Perform user interaction
5. Read `useGameStore.getState().gameState.characters[0].skills[0].filter`

This matches the pattern in `SkillRow.test.tsx` lines 510-578.

### No fake timers needed

None of these tests require `vi.useFakeTimers()`. All interactions are synchronous select/click events that do not involve hover delays, tooltips, or animations. Lesson 004 does not apply.

### Split(":") safety note

The qualifier value encoding uses `type:id` format (e.g., `"action:heal"`, `"skill:light-punch"`). The `split(":")` call in the handler splits on ALL colons. This is safe because:

- Action type IDs: `attack`, `move`, `heal`, `interrupt`, `charge` -- no colons
- Skill IDs from registry: `light-punch`, `heavy-punch`, `move-towards`, `heal`, `ranged-attack`, `dash`, `kick`, `charge` -- no colons

If the coder wants extra safety, `value.split(":", 2)` or `value.indexOf(":")` + `value.slice()` could be used, but this is an implementation choice, not a test design concern.
