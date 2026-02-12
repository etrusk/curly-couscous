# Test Designs: Two-State Trigger Model

Review Status: APPROVED

Review Date: 2026-02-12
Reviewer Changes:

1. Added missing `idle` scope rule test (idle was the only condition with no scope test; shares rules with channeling but should be verified independently)
2. Added test for condition change to implied-scope condition verifying scope value in callback (plan item 12 from Step 6a was missing)
3. Added test for scope preservation when condition change keeps scope valid (plan item 13 from Step 6a was missing)
4. Added missing breaking test entry #12 for "hides remove button when onRemove not provided" in TriggerDropdown.test.tsx -- the primary trigger now always has an `x` remove button, so the `/remove/i` query will match
5. Strengthened targeting_me test to verify scope in rendered condition select value (implied scope correctness)
6. Updated estimated line count for new test file to reflect 3 additional tests

Created: 2026-02-12

## Overview

Two new test files plus documentation of existing tests that need updating. Tests cover the two-state trigger model (unconditional ghost button vs active trigger controls), condition-scoped scope rules, default trigger rendering, and target=self hiding of selector/filter.

---

## File 1: `TriggerDropdown-two-state.test.tsx`

**Path**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`

**Estimated lines**: ~280-310

### Imports and Setup

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TriggerDropdown } from "./TriggerDropdown";
```

### Render Helper

Follow the existing `renderDropdown` pattern from `TriggerDropdown.test.tsx` and `TriggerDropdown-qualifier.test.tsx`:

```typescript
const defaultProps = {
  skillName: "Light Punch",
  triggerIndex: 0,
  onTriggerChange: vi.fn(),
};

function renderDropdown(
  trigger: Parameters<typeof TriggerDropdown>[0]["trigger"],
  overrides?: Partial<Parameters<typeof TriggerDropdown>[0]>,
) {
  const onTriggerChange = vi.fn();
  const result = render(
    <TriggerDropdown
      trigger={trigger}
      {...defaultProps}
      onTriggerChange={onTriggerChange}
      {...overrides}
    />,
  );
  return { onTriggerChange, ...result };
}
```

### describe: "TriggerDropdown - Two-State Model"

---

### Test: renders ghost button when condition is always

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When trigger has `condition: "always"`, the component renders only a `+ Condition` ghost button with no scope or condition dropdowns visible
- **Setup**: `renderDropdown({ scope: "enemy", condition: "always" })`
- **Assertions**:
  1. `screen.getByRole("button", { name: /add condition for light punch/i })` is in the document and has text content `+ Condition`
  2. `screen.queryByRole("combobox", { name: /trigger for light punch/i })` is NOT in the document (no condition dropdown)
  3. `screen.queryByRole("combobox", { name: /trigger scope for light punch/i })` is NOT in the document (no scope dropdown)
  4. `screen.queryByRole("button", { name: /toggle not/i })` is NOT in the document (no NOT toggle)
- **Justification**: Covers AC "Skills default to no trigger (unconditional). No trigger dropdowns render -- only a `+ Condition` ghost button." This is the core visual distinction of the two-state model and prevents regression to the old always-shows-dropdowns behavior.

---

### Test: clicking + Condition activates trigger with default values

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: Clicking the `+ Condition` button calls `onTriggerChange` with `{ scope: "enemy", condition: "in_range", conditionValue: 1 }` as the activation default
- **Setup**: `renderDropdown({ scope: "enemy", condition: "always" })`
- **Actions**:
  1. `const user = userEvent.setup()`
  2. `await user.click(screen.getByRole("button", { name: /add condition for light punch/i }))`
- **Assertions**:
  1. `onTriggerChange` called exactly once
  2. `onTriggerChange` called with `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`
- **Justification**: Covers AC "Clicking `+ Condition` activates the trigger" and AC "Adding a condition via `+ Condition` sets the trigger to a non-always condition in the store." The default `in_range` with value 1 matches the plan specification.

---

### Test: active trigger renders condition dropdown with 7 options and no Always

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When trigger is active (non-always), the condition dropdown shows exactly 7 options with "Always" removed
- **Setup**: `renderDropdown({ scope: "enemy", condition: "in_range", conditionValue: 3 })`
- **Assertions**:
  1. `screen.getByRole("combobox", { name: "Trigger for Light Punch" })` is in the document
  2. `screen.queryByRole("option", { name: "Always" })` is NOT in the document
  3. `screen.getByRole("option", { name: "In range" })` is in the document
  4. `screen.getByRole("option", { name: "HP below" })` is in the document
  5. `screen.getByRole("option", { name: "HP above" })` is in the document
  6. `screen.getByRole("option", { name: "Cell targeted" })` is in the document
  7. `screen.getByRole("option", { name: "Channeling" })` is in the document
  8. `screen.getByRole("option", { name: "Idle" })` is in the document
  9. `screen.getByRole("option", { name: "Targeting ally" })` is in the document
  10. Get all `option` elements within the condition combobox -- expect length 7
- **Justification**: Covers AC "'Always' is NOT an option in the condition dropdown. The 7 remaining conditions are: in_range, hp_below, hp_above, channeling, idle, targeting_me, targeting_ally." Prevents regression of accidentally re-adding the "Always" option.

---

### Test: active trigger renders x remove button

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When trigger is active, an `x` remove button with correct aria-label is rendered
- **Setup**: `renderDropdown({ scope: "enemy", condition: "in_range", conditionValue: 3 })`
- **Assertions**:
  1. `screen.getByRole("button", { name: /remove condition for light punch/i })` is in the document
- **Justification**: Covers AC "Clicking `+ Condition` activates the trigger: ... a `x` remove button appears." Ensures the primary trigger's remove button is accessible.

---

### Test: clicking x remove returns to ghost button and resets trigger

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: Clicking the `x` remove button calls `onTriggerChange` with `{ scope: "enemy", condition: "always" }` to return to unconditional state
- **Setup**: `renderDropdown({ scope: "self", condition: "hp_below", conditionValue: 50 })`
- **Actions**:
  1. `const user = userEvent.setup()`
  2. `await user.click(screen.getByRole("button", { name: /remove condition for light punch/i }))`
- **Assertions**:
  1. `onTriggerChange` called exactly once
  2. `onTriggerChange` called with `{ scope: "enemy", condition: "always" }` -- note scope resets to "enemy" regardless of prior scope
  3. The call argument does NOT have a `negated` property (or it is falsy) -- verify via `onTriggerChange.mock.calls[0]?.[0]`
- **Justification**: Covers AC "Clicking `x` removes the trigger entirely, returning to the unconditional `+ Condition` state" and AC "Removing via `x` sets it back to `{ scope: 'enemy', condition: 'always' }`."

---

### Test: clicking x remove resets negated flag

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When a negated trigger is removed via `x`, the negated flag is cleared from the callback
- **Setup**: `renderDropdown({ scope: "enemy", condition: "in_range", conditionValue: 3, negated: true })`
- **Actions**:
  1. `const user = userEvent.setup()`
  2. `await user.click(screen.getByRole("button", { name: /remove condition for light punch/i }))`
- **Assertions**:
  1. `onTriggerChange` called with `{ scope: "enemy", condition: "always" }`
  2. The call argument does NOT have `negated` property set to true -- cast `onTriggerChange.mock.calls[0]?.[0]` and check `callArg?.negated` is falsy
- **Justification**: Covers AC "Clicking `x` removes the trigger entirely ... Negated flag resets to false." Prevents stale negated state from persisting after trigger removal.

---

### Test: NOT toggle visible when trigger is active

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: The NOT toggle button appears when the trigger has a non-always condition, and is absent when condition is "always" (ghost button state)
- **Setup**: Two renders with unmount between them.
  - First: `renderDropdown({ scope: "enemy", condition: "in_range", conditionValue: 3 })`
  - Second: `renderDropdown({ scope: "enemy", condition: "always" })`
- **Assertions**:
  1. First render: `screen.getByRole("button", { name: /toggle not.*light punch/i })` is in the document
  2. Second render (after unmount): `screen.queryByRole("button", { name: /toggle not/i })` is NOT in the document
- **Justification**: Covers AC "NOT toggle still works: appears when trigger is active, toggles negated flag." Ensures the NOT toggle visibility is correctly tied to the two-state model.

---

### describe: "TriggerDropdown - Condition-Scoped Scope Rules"

---

### Test: in_range shows scope dropdown with enemy and ally only

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When condition is `in_range`, the scope dropdown renders with only `enemy` and `ally` options (no `self`)
- **Setup**: `renderDropdown({ scope: "enemy", condition: "in_range", conditionValue: 3 })`
- **Assertions**:
  1. `screen.getByRole("combobox", { name: /trigger scope for light punch/i })` is in the document
  2. Within the scope combobox, `screen.getByRole("option", { name: "Enemy" })` is present
  3. Within the scope combobox, `screen.getByRole("option", { name: "Ally" })` is present
  4. Within the scope combobox, `screen.queryByRole("option", { name: "Self" })` is NOT present
  5. Get all `option` elements within scope combobox -- expect length 2
- **Justification**: Covers CONDITION_SCOPE_RULES for `in_range`: `showScope: true, validScopes: ["enemy", "ally"]`. Self is always distance 0, making self+in_range nonsensical.

---

### Test: hp_below shows scope dropdown with self, ally, and enemy

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When condition is `hp_below`, the scope dropdown renders with all three scope options
- **Setup**: `renderDropdown({ scope: "self", condition: "hp_below", conditionValue: 50 })`
- **Assertions**:
  1. `screen.getByRole("combobox", { name: /trigger scope for light punch/i })` is in the document
  2. Within the scope combobox, options for "Self", "Ally", "Enemy" are all present
  3. Get all `option` elements within scope combobox -- expect length 3
- **Justification**: Covers CONDITION_SCOPE_RULES for `hp_below`: `showScope: true, validScopes: ["self", "ally", "enemy"]`. All three scopes are semantically valid HP checks.

---

### Test: channeling shows scope dropdown with enemy and ally and qualifier select appears

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When condition is `channeling`, scope dropdown shows enemy/ally only (no self), and the qualifier select is rendered
- **Setup**: `renderDropdown({ scope: "enemy", condition: "channeling" })`
- **Assertions**:
  1. Scope combobox is present with "Enemy" and "Ally" options only (no "Self"), length 2
  2. `screen.getByLabelText(/qualifier for light punch/i)` is in the document (qualifier select renders)
- **Justification**: Covers CONDITION_SCOPE_RULES for `channeling`: `showScope: true, validScopes: ["enemy", "ally"]`. Self can never be channeling during eval. Also validates AC "Qualifier select still appears for channeling condition."

---

### Test: idle shows scope dropdown with enemy and ally only

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When condition is `idle`, scope dropdown shows enemy/ally only (no self) -- same rules as channeling
- **Setup**: `renderDropdown({ scope: "enemy", condition: "idle" })`
- **Assertions**:
  1. `screen.getByRole("combobox", { name: /trigger scope for light punch/i })` is in the document
  2. Within the scope combobox, "Enemy" and "Ally" options are present
  3. Within the scope combobox, `screen.queryByRole("option", { name: "Self" })` is NOT present
  4. Get all `option` elements within scope combobox -- expect length 2
- **Justification**: Covers CONDITION_SCOPE_RULES for `idle`: `showScope: true, validScopes: ["enemy", "ally"]`. Self is always idle during eval, making self+idle nonsensical. Added by reviewer -- idle was the only showScope:true condition without a dedicated scope test.

---

### Test: targeting_me hides scope dropdown and sets implied enemy scope

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When condition is `targeting_me`, the scope dropdown is not rendered (implied enemy scope)
- **Setup**: `renderDropdown({ scope: "enemy", condition: "targeting_me" })`
- **Assertions**:
  1. `screen.queryByRole("combobox", { name: /trigger scope for light punch/i })` is NOT in the document
  2. The condition combobox IS present and has value `targeting_me`
- **Justification**: Covers CONDITION_SCOPE_RULES for `targeting_me`: `showScope: false, impliedScope: "enemy"`. Only enemies targeting your cell matters for dodge.

---

### Test: targeting_ally hides scope dropdown

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: When condition is `targeting_ally`, the scope dropdown is not rendered
- **Setup**: `renderDropdown({ scope: "enemy", condition: "targeting_ally" })`
- **Assertions**:
  1. `screen.queryByRole("combobox", { name: /trigger scope for light punch/i })` is NOT in the document
- **Justification**: Covers CONDITION_SCOPE_RULES for `targeting_ally`: `showScope: false, impliedScope: "enemy"`. Same rationale as `targeting_me`.

---

### Test: condition change resets scope when current scope is invalid for new condition

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: Changing from `hp_below` (scope=self) to `channeling` resets scope to "enemy" because self is not valid for channeling
- **Setup**: `renderDropdown({ scope: "self", condition: "hp_below", conditionValue: 50 })`
- **Actions**:
  1. `const user = userEvent.setup()`
  2. `const conditionSelect = screen.getByRole("combobox", { name: "Trigger for Light Punch" })`
  3. `await user.selectOptions(conditionSelect, "channeling")`
- **Assertions**:
  1. `onTriggerChange` called with an object where `scope` is `"enemy"` (first valid scope for channeling)
  2. `onTriggerChange` called with `condition: "channeling"`
- **Justification**: Covers AC "When the condition changes, if the current scope is not in the new condition's valid scopes, reset scope to the first valid scope for that condition." Prevents nonsensical self+channeling combination.

---

### Test: condition change to implied-scope condition sets scope to implied value

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: Changing from `hp_below` (scope=self) to `targeting_me` sets scope to "enemy" (implied scope) in the callback
- **Setup**: `renderDropdown({ scope: "self", condition: "hp_below", conditionValue: 50 })`
- **Actions**:
  1. `const user = userEvent.setup()`
  2. `const conditionSelect = screen.getByRole("combobox", { name: "Trigger for Light Punch" })`
  3. `await user.selectOptions(conditionSelect, "targeting_me")`
- **Assertions**:
  1. `onTriggerChange` called with `{ scope: "enemy", condition: "targeting_me" }` -- scope set to implied "enemy", no conditionValue
- **Justification**: Covers AC "When scope dropdown is hidden (implied scope), the store still holds the correct scope value." Tests the transition from a condition with explicit scope to one with implied scope. Added by reviewer -- plan Step 6a item 12 was designed but not included in test designs.

---

### Test: condition change preserves scope when still valid

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: Changing from `in_range` (scope=enemy) to `hp_below` preserves scope "enemy" because it remains valid
- **Setup**: `renderDropdown({ scope: "enemy", condition: "in_range", conditionValue: 3 })`
- **Actions**:
  1. `const user = userEvent.setup()`
  2. `const conditionSelect = screen.getByRole("combobox", { name: "Trigger for Light Punch" })`
  3. `await user.selectOptions(conditionSelect, "hp_below")`
- **Assertions**:
  1. `onTriggerChange` called with `{ scope: "enemy", condition: "hp_below", conditionValue: 50 }` -- scope stays "enemy" (valid for hp_below)
- **Justification**: Complements the scope reset test by proving scope is preserved when it IS valid for the new condition. Without this, a naive implementation could always reset scope to validScopes[0]. Added by reviewer -- plan Step 6a item 13 was designed but not included in test designs.

---

### Test: value input visible for in_range, hp_below, hp_above but hidden for other conditions

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: Value input (spinbutton) appears for value-based conditions and is absent for non-value conditions
- **Setup**: Render and unmount for each condition to check:
  - `in_range` with `conditionValue: 3` -- spinbutton present
  - `hp_below` with `conditionValue: 50` -- spinbutton present
  - `hp_above` with `conditionValue: 75` -- spinbutton present
  - `channeling` -- spinbutton NOT present
  - `idle` -- spinbutton NOT present
  - `targeting_me` -- spinbutton NOT present
  - `targeting_ally` -- spinbutton NOT present
- **Assertions**:
  1. For `in_range`, `hp_below`, `hp_above`: `screen.getByRole("spinbutton")` is in the document
  2. For `channeling`, `idle`, `targeting_me`, `targeting_ally`: `screen.queryByRole("spinbutton")` is NOT in the document
- **Justification**: Covers AC "Value input still appears for in_range, hp_below, hp_above." Ensures value conditions remain correctly identified after removing "Always" from the set.

---

### describe: "TriggerDropdown - Default Trigger from Registry"

---

### Test: skill with defaultTrigger renders with active trigger controls

- **File**: `src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`
- **Type**: unit
- **Verifies**: A skill whose registry entry has `defaultTrigger: { condition: "channeling" }` renders with the active trigger state (condition dropdown, scope dropdown), not the `+ Condition` ghost button
- **Setup**: `renderDropdown({ scope: "enemy", condition: "channeling" })` -- simulates Kick's default trigger
- **Assertions**:
  1. `screen.queryByRole("button", { name: /add condition/i })` is NOT in the document (no ghost button)
  2. `screen.getByRole("combobox", { name: "Trigger for Light Punch" })` IS in the document with value `"channeling"` (condition dropdown visible)
  3. `screen.getByRole("combobox", { name: /trigger scope for light punch/i })` IS in the document (scope dropdown visible for channeling)
- **Justification**: Covers AC "Skills from the registry that have defaultTrigger with a non-always condition render with the trigger active on assignment." Tests this at the TriggerDropdown level since the component receives the trigger prop from SkillRow.

---

## File 2: `SkillRow-target-self.test.tsx`

**Path**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-target-self.test.tsx`

**Estimated lines**: ~150-180

### Imports and Setup

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillRow } from "./SkillRow";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";
```

### Render Helper

Follow the existing `renderSkillRow` pattern from `SkillRow-filter-not-toggle.test.tsx`:

```typescript
function renderSkillRow(
  skill: ReturnType<typeof createSkill>,
  character: ReturnType<typeof createCharacter>,
) {
  return render(
    <SkillRow
      skill={skill}
      character={character}
      index={0}
      isFirst={false}
      isLast={false}
    />,
  );
}
```

### describe: "SkillRow - Target Self Hides Selector and Filter"

---

### Test: skill with target self does not render SELECTOR fieldGroup

- **File**: `src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- **Type**: unit
- **Verifies**: When a skill has `target: "self"`, the SELECTOR fieldGroup (containing the criterion combobox) is not rendered
- **Setup**:
  ```typescript
  const skill = createSkill({
    id: "light-punch",
    name: "Light Punch",
    target: "self",
  });
  const character = createCharacter({ id: "char1", skills: [skill] });
  renderSkillRow(skill, character);
  ```
- **Assertions**:
  1. `screen.queryByRole("combobox", { name: /criterion for light punch/i })` is NOT in the document
  2. `screen.queryByText("SELECTOR")` is NOT in the document (the entire fieldGroup including label is hidden)
- **Justification**: Covers AC "When target is set to self, the SELECTOR dropdown and its fieldGroup are hidden (not rendered)." Currently the selector is only disabled, not hidden -- this test proves the new hiding behavior.

---

### Test: skill with target self does not render FilterControls

- **File**: `src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- **Type**: unit
- **Verifies**: When a skill has `target: "self"`, no filter controls render -- no `+ Filter` button, no filter dropdown, no FILTER label
- **Setup**:
  ```typescript
  const skill = createSkill({
    id: "light-punch",
    name: "Light Punch",
    target: "self",
  });
  const character = createCharacter({ id: "char1", skills: [skill] });
  renderSkillRow(skill, character);
  ```
- **Assertions**:
  1. `screen.queryByRole("button", { name: /add filter for light punch/i })` is NOT in the document
  2. `screen.queryByText("FILTER")` is NOT in the document
- **Justification**: Covers AC "When target is set to self, the FILTER section is hidden entirely (no `+ Filter` button, no filter controls)."

---

### Test: skill with target enemy renders both SELECTOR and FilterControls

- **File**: `src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- **Type**: unit
- **Verifies**: When target is "enemy", both SELECTOR and FILTER sections render normally (baseline for comparison)
- **Setup**:
  ```typescript
  const skill = createSkill({
    id: "light-punch",
    name: "Light Punch",
    target: "enemy",
  });
  const character = createCharacter({ id: "char1", skills: [skill] });
  renderSkillRow(skill, character);
  ```
- **Assertions**:
  1. `screen.getByRole("combobox", { name: /criterion for light punch/i })` IS in the document
  2. `screen.getByText("SELECTOR")` IS in the document
  3. `screen.getByText("FILTER")` IS in the document (FilterControls renders at minimum the FILTER label and `+ Filter` button)
  4. `screen.getByRole("button", { name: /add filter for light punch/i })` IS in the document
- **Justification**: Establishes baseline: target=enemy shows both sections. Tests the positive case to prove the conditional rendering works both ways.

---

### Test: changing target from enemy to self hides SELECTOR and FilterControls

- **File**: `src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- **Type**: integration
- **Verifies**: When a user changes target from "enemy" to "self" via the target dropdown, the SELECTOR and FILTER sections disappear from the DOM
- **Setup**:

  ```typescript
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  const skill = createSkill({
    id: "light-punch",
    instanceId: "light-punch",
    name: "Light Punch",
    target: "enemy",
  });
  const character = createCharacter({ id: "char1", skills: [skill] });
  useGameStore.getState().actions.initBattle([character]);
  renderSkillRow(skill, character);
  ```

- **Actions**:
  1. Verify SELECTOR is initially present: `screen.getByText("SELECTOR")`
  2. `const user = userEvent.setup()`
  3. `const targetSelect = screen.getByRole("combobox", { name: /target for light punch/i })`
  4. `await user.selectOptions(targetSelect, "self")`
- **Assertions**:
  1. `screen.queryByText("SELECTOR")` is NOT in the document (disappeared after target change)
  2. `screen.queryByText("FILTER")` is NOT in the document
  3. `screen.queryByRole("combobox", { name: /criterion for light punch/i })` is NOT in the document
- **Justification**: Covers the dynamic transition case. The user starts with a visible selector/filter and sees them disappear when switching to self-target. Integrates with the Zustand store via `initBattle` + `updateSkill`.

---

### Test: changing target from self to enemy restores SELECTOR and FilterControls

- **File**: `src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- **Type**: integration
- **Verifies**: When target changes from "self" back to "enemy", SELECTOR and FILTER sections reappear
- **Setup**:

  ```typescript
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  const skill = createSkill({
    id: "light-punch",
    instanceId: "light-punch",
    name: "Light Punch",
    target: "self",
  });
  const character = createCharacter({ id: "char1", skills: [skill] });
  useGameStore.getState().actions.initBattle([character]);
  renderSkillRow(skill, character);
  ```

- **Actions**:
  1. Verify SELECTOR is initially absent: `screen.queryByText("SELECTOR")` is NOT in the document
  2. `const user = userEvent.setup()`
  3. `const targetSelect = screen.getByRole("combobox", { name: /target for light punch/i })`
  4. `await user.selectOptions(targetSelect, "enemy")`
- **Assertions**:
  1. `screen.getByText("SELECTOR")` IS in the document (reappeared)
  2. `screen.getByText("FILTER")` IS in the document
  3. `screen.getByRole("combobox", { name: /criterion for light punch/i })` IS in the document
- **Justification**: Covers AC "When target changes FROM self to enemy/ally, selector and filter controls reappear."

---

### Test: filter config preserved through target self round-trip

- **File**: `src/components/CharacterPanel/SkillRow-target-self.test.tsx`
- **Type**: integration
- **Verifies**: Setting a filter on an enemy-target skill, changing to self (filter hidden), and changing back to enemy restores the filter with its prior configuration
- **Setup**:

  ```typescript
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  const skill = createSkill({
    id: "light-punch",
    instanceId: "light-punch",
    name: "Light Punch",
    target: "enemy",
    filter: { condition: "hp_below", conditionValue: 30 },
  });
  const character = createCharacter({ id: "char1", skills: [skill] });
  useGameStore.getState().actions.initBattle([character]);
  renderSkillRow(skill, character);
  ```

- **Actions**:
  1. Verify filter is initially visible: `screen.getByLabelText(/filter type for light punch/i)` has value `"hp_below"`
  2. `const user = userEvent.setup()`
  3. Change target to self: `await user.selectOptions(screen.getByRole("combobox", { name: /target for light punch/i }), "self")`
  4. Verify filter is hidden: `screen.queryByLabelText(/filter type for/i)` is NOT in the document
  5. Change target back to enemy: `await user.selectOptions(screen.getByRole("combobox", { name: /target for light punch/i }), "enemy")`
- **Assertions**:
  1. After round-trip, `screen.getByLabelText(/filter type for light punch/i)` IS in the document with value `"hp_below"` (filter condition preserved)
  2. Store verification: `useGameStore.getState().gameState.characters[0].skills[0].filter` has `condition: "hp_below"` and `conditionValue: 30` (store data intact through round-trip)
- **Justification**: Covers AC "Any previously-configured filter that was hidden is still in the store and reappears with its prior configuration." This is the critical data preservation test -- the filter is hidden but NOT removed from the store.

---

## Existing Tests to Update

The following existing tests will break due to the two-state model changes and need updating by the coder. These are documented here for reference but do NOT need new test designs -- they are modifications to existing tests.

### TriggerDropdown.test.tsx (10 tests affected)

| #   | Test Name (line)                                                                    | Current Setup           | Why Breaks                                           | Recommended Fix                                                                                                                            |
| --- | ----------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | "hides value input for non-value triggers" (line 70)                                | `condition: "always"`   | Now renders ghost button, no spinbutton query target | Change trigger to `condition: "targeting_me"` (non-value, non-always)                                                                      |
| 2   | "calls onTriggerChange when condition changes" (line 80)                            | `condition: "always"`   | No condition dropdown -- ghost button instead        | Change trigger to `{ condition: "in_range", conditionValue: 3, scope: "enemy" }` and select a different condition                          |
| 3   | "calls onTriggerChange with hp defaults on condition change" (line 98)              | `condition: "always"`   | Same -- no condition dropdown                        | Change trigger to `{ condition: "in_range", conditionValue: 3, scope: "enemy" }` and select `hp_below`                                     |
| 4   | "renders trigger type dropdown with correct value" (line 32)                        | `condition: "hp_below"` | Asserts "Always" option exists                       | Remove the "Always" option assertion; update to assert 7 options without Always                                                            |
| 5   | "strips value when changing to non-value trigger" (line 249)                        | Selects "always"        | "Always" option no longer exists                     | Change to select `targeting_me` instead; update expected callback to `{ scope: "enemy", condition: "targeting_me" }` (implied scope reset) |
| 6   | "renders all 8 condition options" (line 268)                                        | `condition: "hp_below"` | Asserts "Always" option, expects 8                   | Change to assert 7 options, remove "Always" assertion                                                                                      |
| 7   | "calls onTriggerChange with correct shape when selecting channeling" (line 311)     | `condition: "always"`   | No condition dropdown                                | Change trigger to `{ condition: "in_range", conditionValue: 3, scope: "enemy" }`                                                           |
| 8   | "calls onTriggerChange with correct shape when selecting idle" (line 328)           | `condition: "always"`   | No condition dropdown                                | Change trigger to `{ condition: "in_range", conditionValue: 3, scope: "enemy" }`                                                           |
| 9   | "calls onTriggerChange with correct shape when selecting targeting_ally" (line 344) | `condition: "always"`   | No condition dropdown                                | Change trigger to `{ condition: "in_range", conditionValue: 3, scope: "enemy" }`                                                           |

**Additional tests that break due to new primary remove button**:

| #   | Test Name (line)                                            | Current Setup                               | Why Breaks                                                                                                                                                                          | Recommended Fix                                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | "hides remove button when onRemove not provided" (line 161) | `condition: "hp_below"`, no `onRemove` prop | Active trigger now always renders an `x` remove button (aria-label: "Remove condition for ..."). The query `queryByRole("button", { name: /remove/i })` will match this new button. | Change query to be specific: assert `screen.queryByRole("button", { name: /remove second trigger/i })` is NOT in the document (testing that the AND trigger remove button is absent). The primary `x` remove button IS expected to be present. |

**Additional scope-related updates** (tests that may also need adjustment due to condition-scoped scope rules):

| #   | Test Name (line)                                             | Issue                                                                          | Fix                                                                                                  |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 11  | "preserves negated field on condition change" (line 207)     | Scope is "self" but switches to "in_range" which does not allow "self"         | Expected callback should show `scope: "enemy"` (first valid scope for in_range), not `scope: "self"` |
| 12  | "strips value when changing to non-value trigger" (line 249) | After fix (#5), changing to targeting_me should set scope to "enemy" (implied) | Update expected scope in callback                                                                    |

### TriggerDropdown-not-toggle.test.tsx (1 test affected)

| #   | Test Name (line)                                              | Why Breaks                                                          | Recommended Fix                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "switching to always clears negated from callback" (line 128) | Selects "always" from condition dropdown -- option no longer exists | Rewrite: instead of selecting "always", click the `x` remove button (`screen.getByRole("button", { name: /remove condition for light punch/i })`). Assert `onTriggerChange` was called with `{ scope: "enemy", condition: "always" }` and that `negated` is absent/falsy. |

**Tests that will NOT break**: "NOT toggle hidden for always trigger" (line 34) -- still correct because ghost button renders instead of NOT toggle, and the test only queries for absence of the toggle button.

### TriggerDropdown-qualifier.test.tsx (0 tests affected)

No tests will break. All tests use `condition: "channeling"` which renders in active state.

### SkillRow.test.tsx (2 tests affected)

| #   | Test Name (line)                                                       | Why Breaks                                                                                                                                              | Recommended Fix                                                                                                                        |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "shows all config controls" (line 16)                                  | Queries `getByRole("combobox", { name: /trigger for light punch/i })` -- Light Punch has default trigger `always`, so ghost button renders, no combobox | Change assertion: instead of expecting combobox, expect ghost button `getByRole("button", { name: /add condition for light punch/i })` |
| 2   | "shows config controls alongside evaluation in battle mode" (line 141) | Same -- queries trigger combobox for Light Punch with always trigger                                                                                    | Same fix as #1                                                                                                                         |

**Tests that will NOT break for target=self**: No existing tests render with `target: "self"` and check for SELECTOR/FILTER presence.

### SkillRow-filter-not-toggle.test.tsx (0 tests affected)

No tests will break. All filter tests use `createSkill` with default `target: "enemy"`, so FilterControls will still render.

---

## Test Coverage Matrix

| Acceptance Criterion                                                   | Test(s) Covering It                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Skills default to no trigger -- only `+ Condition` ghost button        | Test 1 (ghost button renders)                                            |
| Clicking `+ Condition` activates trigger with defaults                 | Test 2 (click + Condition)                                               |
| Clicking `x` removes trigger, returns to ghost button                  | Test 5 (click x remove)                                                  |
| "Always" NOT an option, 7 conditions                                   | Test 3 (7 options)                                                       |
| Store uses `{ scope: "enemy", condition: "always" }` for unconditional | Test 5 (x remove callback shape)                                         |
| Adding condition sets non-always in store                              | Test 2 (+ Condition callback shape)                                      |
| Condition-scoped scope rules                                           | Tests 7-12 (scope rules per condition, including idle)                   |
| Scope reset on invalid combination                                     | Test 13 (scope reset)                                                    |
| Implied scope stored correctly                                         | Test 14 (condition change to implied-scope) + Tests 10-12 (scope hidden) |
| Scope preserved when valid for new condition                           | Test 15 (scope preservation)                                             |
| NOT toggle: visible when active, hidden when unconditional             | Test 6 (NOT toggle visibility)                                           |
| Value input for in_range, hp_below, hp_above                           | Test 16 (value input per condition)                                      |
| Qualifier for channeling                                               | Test 9 (channeling + qualifier)                                          |
| x remove resets negated                                                | Tests 5-6 (negated reset)                                                |
| defaultTrigger renders active                                          | Test 17 (default trigger)                                                |
| target=self hides SELECTOR                                             | SkillRow Test 1 (no selector)                                            |
| target=self hides FILTER                                               | SkillRow Test 2 (no filter)                                              |
| target=enemy shows both                                                | SkillRow Test 3 (baseline)                                               |
| Dynamic target change hides/shows                                      | SkillRow Tests 4-5 (transitions)                                         |
| Filter config preserved through round-trip                             | SkillRow Test 6 (filter persistence)                                     |
