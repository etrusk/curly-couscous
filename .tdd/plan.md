# Implementation Plan: Two-State Trigger Model

## Overview

Three parts: (1) TriggerDropdown two-state model with condition-scoped scopes, (2) SkillRow target=self hiding, (3) existing test updates. UI-only change -- no engine, type, or store action modifications.

---

## Step 1: Add CONDITION_SCOPE_RULES constant to TriggerDropdown.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx`

Add after the `VALUE_CONDITIONS` constant (line 24), before `getDefaultValue`:

```typescript
import type { ConditionType, TriggerScope } from "../../engine/types";

interface ConditionScopeRule {
  showScope: boolean;
  validScopes: TriggerScope[];
  impliedScope?: TriggerScope;
}

const CONDITION_SCOPE_RULES: Record<
  Exclude<ConditionType, "always">,
  ConditionScopeRule
> = {
  in_range: { showScope: true, validScopes: ["enemy", "ally"] },
  hp_below: { showScope: true, validScopes: ["self", "ally", "enemy"] },
  hp_above: { showScope: true, validScopes: ["self", "ally", "enemy"] },
  channeling: { showScope: true, validScopes: ["enemy", "ally"] },
  idle: { showScope: true, validScopes: ["enemy", "ally"] },
  targeting_me: {
    showScope: false,
    validScopes: ["enemy"],
    impliedScope: "enemy",
  },
  targeting_ally: {
    showScope: false,
    validScopes: ["enemy"],
    impliedScope: "enemy",
  },
};
```

**Estimated lines added**: ~20

---

## Step 2: Refactor TriggerDropdown rendering to two-state model

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx`

### Changes to make:

1. **Add `handleAddCondition` handler** -- sets trigger to `{ scope: "enemy", condition: "in_range", conditionValue: 1 }` via `onTriggerChange`.

2. **Add `handleRemoveCondition` handler** -- sets trigger to `{ scope: "enemy", condition: "always" }` via `onTriggerChange`.

3. **Modify `handleConditionChange`**:
   - Remove the `always` branch (no longer possible to select "always" from dropdown).
   - After determining the new trigger shape, look up `CONDITION_SCOPE_RULES[newCondition]` and check if `trigger.scope` is in `validScopes`. If not, reset scope to `validScopes[0]`. If the rule has `impliedScope`, set scope to that value.
   - Always preserve `negated` when switching between non-always conditions.

4. **Replace the render return** with a two-branch structure:

```tsx
// When condition is "always": render ghost button only
if (trigger.condition === "always") {
  return (
    <button
      type="button"
      onClick={handleAddCondition}
      className={styles.addConditionBtn}
      aria-label={`Add condition for ${skillName}`}
    >
      + Condition
    </button>
  );
}

// When condition is non-always: render active trigger controls
const rule = CONDITION_SCOPE_RULES[trigger.condition];

return (
  <span className={styles.triggerControl}>
    {/* NOT toggle */}
    <button type="button" onClick={handleNotToggle} ...>NOT</button>

    {/* Scope dropdown -- only when rule.showScope */}
    {rule.showScope && (
      <select value={trigger.scope} onChange={handleScopeChange} ...>
        {rule.validScopes.map(s => <option key={s} value={s}>...</option>)}
      </select>
    )}

    {/* Condition dropdown -- 7 options, no "always" */}
    <select value={trigger.condition} onChange={handleConditionChange} ...>
      <option value="in_range">In range</option>
      <option value="hp_below">HP below</option>
      <option value="hp_above">HP above</option>
      <option value="targeting_me">Cell targeted</option>
      <option value="channeling">Channeling</option>
      <option value="idle">Idle</option>
      <option value="targeting_ally">Targeting ally</option>
    </select>

    {/* Value input -- unchanged condition */}
    {hasValue && <input .../>}

    {/* Qualifier select -- unchanged condition */}
    {trigger.condition === "channeling" && <QualifierSelect .../>}

    {/* Remove button -- always shown (replaces onRemove-gated logic) */}
    <button onClick={handleRemoveCondition} className={styles.removeBtn}
      aria-label={`Remove condition for ${skillName}`}>x</button>
  </span>
);
```

5. **Props interface**: `onRemove` prop remains for AND trigger future use but is no longer the primary removal mechanism. The `x` button in the active state calls `handleRemoveCondition` (resets to always). The `onRemove` prop is only used for AND trigger's second trigger removal. When `onRemove` is provided, render a second remove button with the existing "Remove second trigger" aria-label, OR simply call `onRemove` from the `x` button instead of `handleRemoveCondition`. **Decision**: When `onRemove` is provided (triggerIndex > 0), the `x` button calls `onRemove` instead of `handleRemoveCondition`. When `onRemove` is NOT provided (primary trigger), the `x` button calls `handleRemoveCondition`. This preserves backward compatibility for future AND trigger support.

6. **Scope dropdown label capitalization**: Map scope values to display text: `enemy` -> `Enemy`, `ally` -> `Ally`, `self` -> `Self`.

### Estimated final file size

Current: 156 lines. After changes: ~195 lines (well under 400).

---

## Step 3: Add ghost button CSS to TriggerDropdown.module.css

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css`

Add `.addConditionBtn` class following the ghost button pattern from `ui-ux-guidelines.md`:

```css
.addConditionBtn {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 3px;
}

.addConditionBtn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
```

**Note**: This duplicates `.addTriggerBtn` from SkillRow.module.css, which is acceptable per ADR-023 (duplicate VALUE_CONDITIONS precedent). The existing `.addTriggerBtn` in SkillRow.module.css remains unused and can be removed in a separate cleanup, or kept for future AND trigger `+ AND` button.

**Estimated lines added**: ~14. File goes from 63 to ~77 lines.

---

## Step 4: SkillRow target=self conditional rendering

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx`

### Changes:

1. **Wrap SELECTOR fieldGroup** (lines 223-238) in a conditional:

```tsx
{skill.target !== "self" && (
  <div className={`${styles.fieldGroup} ${styles.selectorField}`}>
    <span className={styles.fieldLabel}>SELECTOR</span>
    <select ... disabled={skill.target === "self"} ...>
      ...
    </select>
  </div>
)}
```

Remove the now-unnecessary `disabled={skill.target === "self"}` since it will never be rendered when target is self.

2. **Wrap FilterControls** (line 240) in a conditional:

```tsx
{
  skill.target !== "self" && (
    <FilterControls skill={skill} characterId={character.id} />
  );
}
```

The filter and selector config remain in the store -- only rendering is suppressed.

### Estimated impact

Removes ~2 lines, adds ~4 lines of wrapping. File stays at ~289 lines, well under 400.

---

## Step 5: Update existing tests that will break

### 5a. TriggerDropdown.test.tsx (378 lines)

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx`

Tests that will **break** and how to fix:

| #   | Test Name                                                                           | Current Trigger         | Why Breaks                                             | Fix                                                                                           |
| --- | ----------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 1   | "hides value input for non-value triggers" (line 71)                                | `condition: "always"`   | Now renders ghost button, no spinbutton query target   | Change trigger to `condition: "targeting_me"` (non-value, non-always)                         |
| 2   | "calls onTriggerChange when condition changes" (line 80)                            | `condition: "always"`   | No condition dropdown rendered -- ghost button instead | Change trigger to `condition: "in_range", conditionValue: 3` and select a different condition |
| 3   | "calls onTriggerChange with hp defaults on condition change" (line 98)              | `condition: "always"`   | Same -- no dropdown                                    | Change trigger to `condition: "in_range", conditionValue: 3` and select `hp_below`            |
| 4   | "renders trigger type dropdown with correct value" (line 32)                        | `condition: "hp_below"` | Asserts "Always" option exists                         | Remove the `Always` option assertion; change to assert 7 options without Always               |
| 5   | "strips value when changing to non-value trigger" (line 249)                        | Selects "always"        | "Always" option no longer exists                       | Change to select `targeting_me` instead; update expected callback                             |
| 6   | "renders all 8 condition options" (line 268)                                        | `condition: "hp_below"` | Asserts "Always" option, expects 8                     | Change to assert 7 options, remove "Always" assertion                                         |
| 7   | "calls onTriggerChange with correct shape when selecting channeling" (line 311)     | `condition: "always"`   | No dropdown                                            | Change trigger to `condition: "in_range", conditionValue: 3`                                  |
| 8   | "calls onTriggerChange with correct shape when selecting idle" (line 328)           | `condition: "always"`   | No dropdown                                            | Change trigger to `condition: "in_range", conditionValue: 3`                                  |
| 9   | "calls onTriggerChange with correct shape when selecting targeting_ally" (line 344) | `condition: "always"`   | No dropdown                                            | Change trigger to `condition: "in_range", conditionValue: 3`                                  |

**Additional scope-related test updates** (these may also need fixing due to scope dropdown changes):

| #   | Test Name                                                    | Issue                                                                          | Fix                                                                                       |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 10  | "preserves negated field on condition change" (line 207)     | Scope is "self" but switches to "in_range" which does not allow "self"         | The expected callback should show scope reset to "enemy" (first valid scope for in_range) |
| 11  | "strips value when changing to non-value trigger" (line 249) | After fix (#5), changing to targeting_me should set scope to "enemy" (implied) | Update expected scope in callback                                                         |

**Tests that will NOT break** (already use non-always conditions):

- "renders value input for value-based triggers" -- uses `hp_below`
- "calls onTriggerChange when value changes" -- uses `hp_below`
- "shows remove button when onRemove provided" -- uses `hp_below`
- "calls onRemove when remove button clicked" -- uses `hp_below`
- "hides remove button when onRemove not provided" -- uses `hp_below`
- "preserves negated field on value change" -- uses `hp_below`
- "handles empty value input without propagating NaN" -- uses `hp_below`
- "unique aria-labels include trigger index" -- uses `hp_below`
- "does not render value input for channeling/idle/targeting_ally" -- uses non-always
- "preserves negated field when switching to a new condition" (line 360) -- uses `hp_below`

### 5b. TriggerDropdown-not-toggle.test.tsx (156 lines)

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`

| #   | Test Name                                                     | Why Breaks                                                                                                                                                                          | Fix                                                                                                                                                                                             |
| --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "NOT toggle hidden for always trigger" (line 34)              | Still correct -- ghost button renders instead of NOT toggle. But the test also implicitly expects scope/condition dropdowns. It queries for NOT toggle absence which is still true. | **No break** -- test only queries `queryByRole("button", { name: /toggle not/i })` which will still be absent in ghost button state. Keep as-is.                                                |
| 2   | "switching to always clears negated from callback" (line 128) | Selects "always" from dropdown -- option no longer exists                                                                                                                           | **Rewrite**: Instead of selecting "always", click the `x` remove button. Assert `onTriggerChange` was called with `{ scope: "enemy", condition: "always" }` and that `negated` is absent/falsy. |

### 5c. TriggerDropdown-qualifier.test.tsx (141 lines)

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx`

No tests will break. All tests use `condition: "channeling"` which renders in active state. The qualifier dropdown tests do not interact with "always" or scope dropdown visibility.

### 5d. SkillRow.test.tsx (686 lines)

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx`

Tests that will **break**:

| #   | Test Name                                                              | Why Breaks                                                                                                                                                                                                                         | Fix                                                                                                                                    |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "shows all config controls" (line 16)                                  | Queries `getByRole("combobox", { name: /trigger for light punch/i })` -- Light Punch has default trigger `always`, so ghost button renders, no combobox                                                                            | Change assertion: instead of expecting combobox, expect ghost button `getByRole("button", { name: /add condition for light punch/i })` |
| 2   | "shows config controls alongside evaluation in battle mode" (line 141) | Same -- queries trigger combobox for Light Punch with always trigger                                                                                                                                                               | Same fix as #1                                                                                                                         |
| 3   | "shows all four labels in battle mode" (line 642)                      | Tests `TRIGGER`, `TARGET`, `SELECTOR`, `FILTER` labels. TRIGGER label will still render. But `SELECTOR` will render since Light Punch's target is "enemy". **No break** -- all labels should still appear for enemy-target skills. |

**Tests that will NOT break for target=self changes**: No existing tests render with `target: "self"` and check for SELECTOR/FILTER presence, so no breakage from the target=self hiding.

### 5e. SkillRow-filter-not-toggle.test.tsx (389 lines)

No tests will break. All filter tests use `createSkill` with default `target: "enemy"`, so FilterControls will still render.

---

## Step 6: Write new tests

### 6a. New file: TriggerDropdown-two-state.test.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-two-state.test.tsx`

New tests to write (following `renderDropdown` helper pattern):

**Two-state model tests:**

1. Ghost button renders when `condition === "always"` -- assert `+ Condition` button visible, no combobox, no NOT toggle
2. Clicking `+ Condition` calls `onTriggerChange` with `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`
3. Active state renders condition dropdown with 7 options (no "Always")
4. Active state renders `x` remove button
5. Clicking `x` calls `onTriggerChange` with `{ scope: "enemy", condition: "always" }` (negated absent)
6. Clicking `x` on negated trigger resets negated (callback has no negated field)

**Condition-scoped scope tests:** 7. `in_range` shows scope dropdown with Enemy, Ally (no Self) 8. `hp_below` shows scope dropdown with Self, Ally, Enemy 9. `targeting_me` hides scope dropdown entirely 10. `targeting_ally` hides scope dropdown entirely 11. Changing condition from `hp_below` (scope=self) to `channeling` resets scope to "enemy" (self not valid for channeling) 12. Changing condition from `hp_below` (scope=self) to `targeting_me` sets scope to "enemy" (implied) 13. Changing condition from `in_range` to `hp_below` preserves scope "enemy" (still valid) 14. Implied scope conditions store correct scope value in callback

**Estimated lines**: ~200-250

### 6b. New file: SkillRow-target-self.test.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-target-self.test.tsx`

New tests to write:

1. When `target: "self"`, SELECTOR fieldGroup is not rendered -- no criterion combobox
2. When `target: "self"`, FILTER section is not rendered -- no `+ Filter` button, no filter controls
3. When `target: "self"` with existing filter, filter fieldGroup not rendered
4. When `target: "enemy"`, SELECTOR and FILTER are both rendered
5. (Store interaction) Change target from enemy to self -> SELECTOR and FILTER disappear
6. (Store interaction) Change target from self to enemy -> SELECTOR and FILTER reappear with prior config

**Estimated lines**: ~120-150

### 6c. New tests in existing files (optional, if scope allows)

Registry default trigger rendering tests could go in SkillRow.test.tsx or a new file:

- Kick (defaultTrigger: channeling) renders with active trigger controls (condition dropdown visible)
- Light Punch (no defaultTrigger) renders with `+ Condition` button

These can be added to `SkillRow.test.tsx` if it stays under ~750 lines, or a new `SkillRow-trigger-defaults.test.tsx`.

---

## Implementation Order

1. **Step 1**: CONDITION_SCOPE_RULES constant (pure data, no UI impact)
2. **Step 3**: CSS for ghost button (no UI impact until TSX changes)
3. **Step 2**: TriggerDropdown two-state refactor (breaks existing tests)
4. **Step 5**: Fix broken existing tests (restore green)
5. **Step 6a**: New TriggerDropdown two-state tests
6. **Step 4**: SkillRow target=self hiding
7. **Step 6b**: New SkillRow target=self tests
8. **Step 6c**: Registry default trigger tests (if time permits)

---

## CONDITION_SCOPE_RULES Definition (canonical)

```typescript
const CONDITION_SCOPE_RULES: Record<
  Exclude<ConditionType, "always">,
  ConditionScopeRule
> = {
  in_range: { showScope: true, validScopes: ["enemy", "ally"] },
  hp_below: { showScope: true, validScopes: ["self", "ally", "enemy"] },
  hp_above: { showScope: true, validScopes: ["self", "ally", "enemy"] },
  channeling: { showScope: true, validScopes: ["enemy", "ally"] },
  idle: { showScope: true, validScopes: ["enemy", "ally"] },
  targeting_me: {
    showScope: false,
    validScopes: ["enemy"],
    impliedScope: "enemy",
  },
  targeting_ally: {
    showScope: false,
    validScopes: ["enemy"],
    impliedScope: "enemy",
  },
};
```

This is the **single source of truth** for what the UI allows. Exported as a named export for test assertions if needed, or kept as a module-level constant.

---

## CSS Changes Summary

| File                         | Change                            | Lines |
| ---------------------------- | --------------------------------- | ----- |
| `TriggerDropdown.module.css` | Add `.addConditionBtn` + `:hover` | +14   |
| `SkillRow.module.css`        | No changes                        | 0     |

The existing `.addTriggerBtn` in SkillRow.module.css is unused and stays as-is (future AND trigger use).

---

## File Size Check

| File                                      | Current Lines         | After Changes                          | Under 400?                 |
| ----------------------------------------- | --------------------- | -------------------------------------- | -------------------------- |
| `TriggerDropdown.tsx`                     | 156                   | ~195                                   | Yes                        |
| `TriggerDropdown.module.css`              | 63                    | ~77                                    | Yes                        |
| `SkillRow.tsx`                            | 287                   | ~289                                   | Yes                        |
| `SkillRow.module.css`                     | 366                   | 366                                    | Yes                        |
| `TriggerDropdown.test.tsx`                | 378                   | ~370 (fewer always-related assertions) | Yes                        |
| `TriggerDropdown-not-toggle.test.tsx`     | 156                   | ~160                                   | Yes                        |
| `TriggerDropdown-qualifier.test.tsx`      | 141                   | 141                                    | Yes                        |
| `SkillRow.test.tsx`                       | 686 (eslint disabled) | ~690                                   | Over 400, but pre-existing |
| New: `TriggerDropdown-two-state.test.tsx` | 0                     | ~220                                   | Yes                        |
| New: `SkillRow-target-self.test.tsx`      | 0                     | ~140                                   | Yes                        |

---

## Risk Assessment

1. **Scope reset on condition change may surprise users**: When switching from `hp_below` (scope=self) to `in_range`, scope auto-resets to "enemy". This is correct per requirements but could feel unexpected. Mitigation: this is the intended UX behavior per spec.

2. **Tests querying by aria-label for trigger combobox**: Several tests across files use `getByRole("combobox", { name: /trigger for/i })`. With the two-state model, this query fails when trigger is "always". Mitigation: systematically fix every test that renders with "always" to either use a non-always condition or query for the ghost button.

3. **Remove button aria-label change**: Current remove button (for AND triggers) says "Remove second trigger for X". The new primary `x` button needs a different label: "Remove condition for X". Tests checking for "Remove second trigger" use `triggerIndex: 1` and `onRemove` prop -- these should still work if the AND trigger remove button retains its label.

4. **FilterControls wrapping in fieldGroup**: FilterControls currently renders its own `<div className={fieldGroup filterField}>` wrapper (line 112 of FilterControls.tsx). Wrapping it in a conditional in SkillRow means the entire fieldGroup disappears, which is correct. The grid column 9 will simply be empty when target=self -- CSS Grid handles this gracefully with `auto` column sizing.

5. **Scope dropdown dynamic options**: The scope dropdown now renders different options per condition. Tests that check for specific scope options need to be condition-aware. The current tests do not heavily test scope dropdown options, so risk is low.

6. **Default value for `+ Condition`**: Requirements say "sensible default (e.g., `in_range`)". Using `{ scope: "enemy", condition: "in_range", conditionValue: 1 }` as the activation default. The `conditionValue: 1` matches Dash's default (adjacent range), which is the most common use case.

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements -- trigger scope+condition model preserved, UI-only change
- [x] Approach consistent with `.docs/architecture.md` -- controlled components, CSS modules, no engine changes
- [x] Patterns follow `.docs/patterns/index.md` -- ghost button pattern, opacity hierarchy
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-023 allows CSS duplication, ADR-004 local state for UI
- [x] UI tasks: Visual values match `.docs/ui-ux-guidelines.md` -- ghost button spec, compact spacing, native selects, aria-labels

---

## New Decision

**Decision**: `CONDITION_SCOPE_RULES` is kept as a local constant in `TriggerDropdown.tsx` rather than extracted to a shared config file.

**Context**: Only TriggerDropdown needs this lookup. It follows the precedent of `VALUE_CONDITIONS` being local to TriggerDropdown (and duplicated as `FILTER_VALUE_CONDITIONS` in FilterControls per ADR-023).

**Consequences**: If a future feature (e.g., tooltip showing valid trigger configurations) needs this data, it would need to import from TriggerDropdown or the constant would need extraction. Acceptable tradeoff for simplicity now.

Recommend adding to `.docs/decisions/index.md` as ADR-025 after implementation if the team decides it merits a formal ADR.
