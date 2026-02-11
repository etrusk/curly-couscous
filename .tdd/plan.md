# Implementation Plan: Skill Expansion UI Gaps

## Overview

Three UI features to expose existing engine capabilities: filter dropdown expansion (7 conditions), filter NOT toggle, and qualifier selector for `channeling` condition. All changes are UI-only. Engine types and evaluation logic are already complete.

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- Skill Filters section lists all 7 filter conditions; qualifier and negated fields documented
- [x] Approach consistent with `.docs/architecture.md` -- CSS Modules, Zustand store updates, native select elements
- [x] Patterns follow `.docs/patterns/index.md` -- Ghost button, opacity hierarchy, row density patterns
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-015 (per-instance filters), ADR-016 (pre-criterion pool narrowing)
- [x] Visual values match `.docs/ui-ux-guidelines.md` and `visual-specs/skill-row.md` -- filter group in grid column 9, native select, NOT toggle styling

## Files to Modify

### Source Files

1. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` -- filter section expansion (handlers + JSX)
2. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` -- NOT toggle CSS classes
3. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` -- qualifier dropdown for channeling trigger

### Test Files

4. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter.test.tsx` -- expanded filter tests
5. `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` -- qualifier dropdown tests (may need new file if exceeding 400 lines)

### No Changes Required

- Engine types (`types.ts`) -- `SkillFilter`, `ConditionQualifier`, `negated` already exist
- Engine logic (`triggers.ts`, `selector-filters.ts`) -- evaluation already handles all conditions, qualifiers, negation
- Store (`gameStore.ts`) -- `updateSkill` with `Object.assign` via Immer already works for full filter object replacement
- Skill registry (`skill-registry.ts`) -- only imported, not modified

---

## Implementation Steps

### Step 1: Expand Filter Condition Dropdown Options (SkillRow.tsx)

**What:** Add all 7 filter conditions to the filter `<select>` element.

**Current** (lines 278-286):

```tsx
<select ...>
  <option value="hp_below">HP below</option>
  <option value="hp_above">HP above</option>
</select>
```

**Target:**

```tsx
<select ...>
  <option value="hp_below">HP below</option>
  <option value="hp_above">HP above</option>
  <option value="in_range">In range</option>
  <option value="channeling">Channeling</option>
  <option value="idle">Idle</option>
  <option value="targeting_me">Cell targeted</option>
  <option value="targeting_ally">Targeting ally</option>
</select>
```

Note: Option display text matches TriggerDropdown convention exactly (`"Cell targeted"` for `targeting_me`, etc.).

### Step 2: Add Value/Non-Value Condition Logic to Filter (SkillRow.tsx)

**What:** Replicate TriggerDropdown's `VALUE_CONDITIONS` / `getDefaultValue` pattern for filter conditions.

Add at module level (near top of SkillRow.tsx or import from a shared location):

```typescript
const FILTER_VALUE_CONDITIONS = new Set<ConditionType>([
  "hp_below",
  "hp_above",
  "in_range",
]);

function getFilterDefaultValue(condition: ConditionType): number {
  if (condition === "hp_below" || condition === "hp_above") return 50;
  return 3; // in_range
}
```

These are local to SkillRow. They are functionally identical to TriggerDropdown's constants. Extracting a shared module is not warranted yet -- both files are under 400 lines and the duplication is 6 lines.

### Step 3: Rewrite handleFilterTypeChange (SkillRow.tsx)

**What:** Restructure the handler to conditionally include/omit `conditionValue` and clear `qualifier` when switching away from `channeling`.

**Current** (lines 82-90):

```typescript
const handleFilterTypeChange = (e) => {
  const filterType = e.target.value as ConditionType;
  updateSkill(character.id, skill.instanceId, {
    filter: {
      condition: filterType,
      conditionValue: skill.filter?.conditionValue ?? 50,
    },
  });
};
```

**Target:**

```typescript
const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const filterType = e.target.value as ConditionType;
  const newFilter: SkillFilter = FILTER_VALUE_CONDITIONS.has(filterType)
    ? {
        condition: filterType,
        conditionValue: getFilterDefaultValue(filterType),
      }
    : { condition: filterType };

  // Preserve negated if present
  if (skill.filter?.negated) {
    newFilter.negated = true;
  }

  updateSkill(character.id, skill.instanceId, { filter: newFilter });
};
```

Key behaviors:

- Value conditions (`hp_below`, `hp_above`, `in_range`) get appropriate default value
- Non-value conditions (`channeling`, `idle`, `targeting_me`, `targeting_ally`) omit `conditionValue`
- `negated` is preserved when switching conditions
- `qualifier` is NOT preserved (cleared when switching away from `channeling`)

### Step 4: Conditionally Render Numeric Input (SkillRow.tsx)

**What:** Only show the numeric `<input>` when the filter condition is a value condition.

**Current:** Input always renders when filter exists.

**Target:** Wrap input in `hasFilterValue &&` guard:

```tsx
const hasFilterValue =
  skill.filter && FILTER_VALUE_CONDITIONS.has(skill.filter.condition);

{
  /* In JSX: */
}
{
  hasFilterValue && (
    <input
      key={skill.filter!.condition}
      type="number"
      defaultValue={skill.filter!.conditionValue}
      onChange={handleFilterValueChange}
      className={styles.input}
      aria-label={`Filter value for ${skill.name}`}
    />
  );
}
```

Note the `key={skill.filter!.condition}` to force re-mount when condition type changes (ensures `defaultValue` resets), matching TriggerDropdown pattern.

### Step 5: Add Filter NOT Toggle (SkillRow.tsx + SkillRow.module.css)

**What:** Add NOT toggle button inside the filter group, matching TriggerDropdown's NOT toggle pattern.

#### 5a. Add handler (SkillRow.tsx):

```typescript
const handleFilterNotToggle = () => {
  if (!skill.filter) return;
  updateSkill(character.id, skill.instanceId, {
    filter: { ...skill.filter, negated: !skill.filter.negated },
  });
};
```

#### 5b. Add JSX (inside the `skill.filter ?` branch, before the condition select):

```tsx
<button
  type="button"
  onClick={handleFilterNotToggle}
  className={`${styles.notToggle} ${skill.filter.negated ? styles.notToggleActive : ""}`}
  aria-label={`Toggle NOT modifier for filter on ${skill.name}`}
  aria-pressed={!!skill.filter.negated}
>
  NOT
</button>
```

#### 5c. Duplicate CSS to SkillRow.module.css:

Add `.notToggle` and `.notToggleActive` classes duplicated from TriggerDropdown.module.css (~12 lines). Uses identical tokens: `--border`, `--text-secondary`, `--surface-hover`, `--health-low`, `--text-on-faction`.

```css
.notToggle {
  padding: 0.15rem 0.35rem;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 3px;
  text-transform: uppercase;
}

.notToggle:hover {
  background: var(--surface-hover);
}

.notToggleActive {
  background: var(--health-low);
  color: var(--text-on-faction);
  border-color: var(--health-low);
}
```

These tokens are already verified in dark theme (Lesson 003) since TriggerDropdown uses the same ones.

### Step 6: Add Qualifier Dropdown for Filter (SkillRow.tsx)

**What:** When filter condition is `channeling`, show a qualifier `<select>` with optgroups.

#### 6a. Import SKILL_REGISTRY:

```typescript
import {
  getSkillDefinition,
  SKILL_REGISTRY,
} from "../../engine/skill-registry";
```

#### 6b. Import ConditionQualifier type:

Add `ConditionQualifier` to the existing type import from `../../engine/types`.

#### 6c. Add handler:

```typescript
const handleFilterQualifierChange = (
  e: React.ChangeEvent<HTMLSelectElement>,
) => {
  if (!skill.filter) return;
  const value = e.target.value;
  if (value === "") {
    // (any) selected -- remove qualifier
    const { qualifier: _, ...rest } = skill.filter;
    updateSkill(character.id, skill.instanceId, { filter: rest });
  } else {
    const [type, id] = value.split(":");
    updateSkill(character.id, skill.instanceId, {
      filter: {
        ...skill.filter,
        qualifier: { type: type as "action" | "skill", id },
      },
    });
  }
};
```

Note: The split on `:` works because action types (`attack`, `move`, etc.) and skill IDs (`light-punch`, `heavy-punch`, etc.) do not contain colons.

#### 6d. Add JSX (after filter condition select, when condition is `channeling`):

```tsx
{
  skill.filter?.condition === "channeling" && (
    <select
      value={
        skill.filter.qualifier
          ? `${skill.filter.qualifier.type}:${skill.filter.qualifier.id}`
          : ""
      }
      onChange={handleFilterQualifierChange}
      className={styles.select}
      aria-label={`Filter qualifier for ${skill.name}`}
    >
      <option value="">(any)</option>
      <optgroup label="Action Type">
        <option value="action:attack">Attack</option>
        <option value="action:move">Move</option>
        <option value="action:heal">Heal</option>
        <option value="action:interrupt">Interrupt</option>
        <option value="action:charge">Charge</option>
      </optgroup>
      <optgroup label="Skill">
        {SKILL_REGISTRY.map((def) => (
          <option key={def.id} value={`skill:${def.id}`}>
            {def.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
```

### Step 7: Add Qualifier Dropdown for Trigger (TriggerDropdown.tsx)

**What:** Mirror step 6 for the trigger condition in TriggerDropdown.

#### 7a. Import SKILL_REGISTRY:

```typescript
import { SKILL_REGISTRY } from "../../engine/skill-registry";
```

#### 7b. Import ConditionQualifier type:

Add `ConditionQualifier` to the existing type import.

#### 7c. Add handler:

```typescript
const handleQualifierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const value = e.target.value;
  if (value === "") {
    // (any) -- remove qualifier from trigger
    const { qualifier: _, ...rest } = trigger;
    onTriggerChange(rest);
  } else {
    const [type, id] = value.split(":");
    onTriggerChange({
      ...trigger,
      qualifier: { type: type as "action" | "skill", id },
    });
  }
};
```

#### 7d. Update handleConditionChange to clear qualifier when switching away from channeling:

Currently (lines 48-63), the handler builds `newTrigger` for value/non-value conditions and preserves `negated`. Add clearing of qualifier:

```typescript
// After building newTrigger and preserving negated:
// qualifier is already cleared since newTrigger is built from scratch
// (no spread of existing trigger), so no explicit clearing needed.
```

Confirmed: `handleConditionChange` already builds `newTrigger` from scratch (only `scope` + `condition` + optional `conditionValue`), so `qualifier` is naturally excluded when switching away from `channeling`.

#### 7e. Add JSX (after the value input conditional, before the remove button):

```tsx
{
  trigger.condition === "channeling" && (
    <select
      value={
        trigger.qualifier
          ? `${trigger.qualifier.type}:${trigger.qualifier.id}`
          : ""
      }
      onChange={handleQualifierChange}
      className={styles.select}
      aria-label={`Qualifier for ${skillName}`}
    >
      <option value="">(any)</option>
      <optgroup label="Action Type">
        <option value="action:attack">Attack</option>
        <option value="action:move">Move</option>
        <option value="action:heal">Heal</option>
        <option value="action:interrupt">Interrupt</option>
        <option value="action:charge">Charge</option>
      </optgroup>
      <optgroup label="Skill">
        {SKILL_REGISTRY.map((def) => (
          <option key={def.id} value={`skill:${def.id}`}>
            {def.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
```

### Step 8: Import SkillFilter type in SkillRow.tsx

Add `SkillFilter` to the import from `../../engine/types` since the rewritten `handleFilterTypeChange` constructs a `SkillFilter` object.

---

## Test Plan (High-Level)

### A. Filter Dropdown Expansion Tests (SkillRow-filter.test.tsx)

1. **Update existing test** (line 65): "filter type dropdown has all 7 condition options" -- verify all 7 options present with correct values
2. **New test**: "selecting non-value condition hides numeric input" -- render with `channeling` filter, assert no `filter value` input
3. **New test**: "selecting value condition shows numeric input" -- render with `hp_below`, assert input present
4. **New test**: "switching from value to non-value condition clears conditionValue" -- use `userEvent.selectOptions` to change from `hp_below` to `idle`, verify store call has no `conditionValue`
5. **New test**: "switching to in_range defaults conditionValue to 3" -- verify store call
6. **New test**: "switching to hp_below defaults conditionValue to 50" -- verify store call

### B. Filter NOT Toggle Tests (SkillRow-filter.test.tsx or new file)

7. **New test**: "NOT toggle visible when filter is active" -- render with filter, assert button present with correct aria-label
8. **New test**: "NOT toggle not visible when no filter" -- render without filter, assert button absent
9. **New test**: "NOT toggle click sets filter.negated" -- click, verify `updateSkill` called with `filter: { ...filter, negated: true }`
10. **New test**: "NOT toggle click clears filter.negated" -- start with negated, click, verify cleared
11. **New test**: "NOT toggle aria-pressed reflects negated state" -- assert `aria-pressed="true"` / `"false"`
12. **New test**: "switching condition preserves negated" -- change condition with negated filter, verify negated preserved in store call

### C. Qualifier Tests -- Filter (SkillRow-filter.test.tsx or new file)

13. **New test**: "qualifier dropdown visible when filter condition is channeling"
14. **New test**: "qualifier dropdown hidden when filter condition is not channeling"
15. **New test**: "qualifier dropdown has (any), action optgroups, and skill optgroups"
16. **New test**: "selecting action qualifier sets qualifier on filter" -- select `action:heal`, verify store call
17. **New test**: "selecting (any) removes qualifier from filter"
18. **New test**: "switching away from channeling clears qualifier"

### D. Qualifier Tests -- Trigger (TriggerDropdown.test.tsx or new file)

19. **New test**: "qualifier dropdown visible when trigger condition is channeling"
20. **New test**: "qualifier dropdown hidden when trigger condition is not channeling"
21. **New test**: "selecting action qualifier updates trigger with qualifier"
22. **New test**: "selecting skill qualifier updates trigger with qualifier"
23. **New test**: "selecting (any) removes qualifier from trigger"
24. **New test**: "switching away from channeling clears qualifier in callback"

### File Size Considerations

- `SkillRow-filter.test.tsx` is currently 168 lines. Adding ~18 tests will likely push it near or past 400 lines.
  - **Solution**: Split into `SkillRow-filter.test.tsx` (condition dropdown tests) and `SkillRow-filter-not-toggle.test.tsx` (NOT toggle + qualifier tests). This mirrors the existing TriggerDropdown split (`TriggerDropdown.test.tsx` + `TriggerDropdown-not-toggle.test.tsx`).
- `TriggerDropdown.test.tsx` is currently 378 lines. Adding ~6 qualifier tests will push it past 400 lines.
  - **Solution**: Create `TriggerDropdown-qualifier.test.tsx` for qualifier-specific tests.

### New Test Files

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` -- NOT toggle + qualifier filter tests (~12 tests)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx` -- qualifier trigger tests (~6 tests)

---

## CSS/Styling Notes

1. NOT toggle CSS duplicated to `SkillRow.module.css` (~15 lines including hover/active). This follows CSS module scoping convention and avoids cross-module import.
2. All tokens used (`--border`, `--text-secondary`, `--surface-hover`, `--health-low`, `--text-on-faction`, `--surface-primary`, `--text-primary`) are already resolved correctly in dark theme per Lesson 003.
3. Qualifier `<select>` uses existing `.select` class from SkillRow.module.css -- no new CSS needed.
4. Optgroup styling is browser-native; no custom CSS required.

## Default Value Logic Summary

| Condition      | Type      | Default conditionValue | qualifier | Notes                    |
| -------------- | --------- | ---------------------- | --------- | ------------------------ |
| hp_below       | value     | 50                     | n/a       |                          |
| hp_above       | value     | 50                     | n/a       |                          |
| in_range       | value     | 3                      | n/a       |                          |
| channeling     | non-value | omitted                | optional  | Qualifier dropdown shows |
| idle           | non-value | omitted                | n/a       |                          |
| targeting_me   | non-value | omitted                | n/a       |                          |
| targeting_ally | non-value | omitted                | n/a       |                          |

## Risks and Tradeoffs

1. **VALUE_CONDITIONS duplication**: Both TriggerDropdown and SkillRow define their own `VALUE_CONDITIONS` set and `getDefaultValue` function. This is 6 lines of duplication. Acceptable because: (a) filter does not have `always` condition, (b) trigger has `always`+scope that filter does not, (c) extracting a shared module adds indirection for minimal benefit. If a third consumer emerges, extract then.

2. **Qualifier `<select>` value encoding**: Uses `type:id` string encoding (e.g., `"action:heal"`, `"skill:light-punch"`). Parsing relies on `split(":")`. This is safe because neither action type names nor skill IDs contain colons. If future IDs might contain colons, switch to a compound value format.

3. **SKILL_REGISTRY import in SkillRow**: New direct import of `SKILL_REGISTRY` (currently only `getSkillDefinition` is imported). This couples SkillRow to the full registry array, but the registry is already a stable dependency (ADR-005). The import is lightweight (just the array reference).

4. **File size**: SkillRow.tsx is currently ~357 lines. Adding ~30 lines for new handlers and ~25 lines for new JSX brings it to ~412. This is slightly over the 400-line limit. **Mitigation**: The qualifier `<select>` JSX is identical in both SkillRow and TriggerDropdown. Extract a `QualifierSelect` component (~30 lines) that both import. This reduces SkillRow to ~390 and TriggerDropdown to ~150, well under limit, and follows DRY.

## Recommended Extraction: QualifierSelect Component

**New file**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/QualifierSelect.tsx`

Props: `value: ConditionQualifier | undefined`, `onChange: (qualifier: ConditionQualifier | undefined) => void`, `ariaLabel: string`

This component encapsulates:

- The optgroup structure (action types + skill registry entries)
- The `type:id` encoding/decoding
- The `(any)` option for clearing

Both SkillRow and TriggerDropdown delegate to this component, passing their respective change handlers. This keeps both files under 400 lines and eliminates the qualifier dropdown JSX duplication (~20 lines each).

**Test file**: No separate test file needed for QualifierSelect since it is a controlled component fully tested via its parent component tests (SkillRow-filter and TriggerDropdown-qualifier tests exercise all its behavior).

## Implementation Order

1. Add `.notToggle` / `.notToggleActive` CSS to `SkillRow.module.css` (Step 5c)
2. Create `QualifierSelect.tsx` component (extraction from Step 6/7)
3. Update `SkillRow.tsx` -- all filter changes (Steps 1-6 + 8)
4. Update `TriggerDropdown.tsx` -- qualifier dropdown (Step 7)
5. Update `SkillRow-filter.test.tsx` -- expand existing filter option test
6. Create `SkillRow-filter-not-toggle.test.tsx` -- new NOT toggle + qualifier tests
7. Create `TriggerDropdown-qualifier.test.tsx` -- new qualifier tests

Total files modified: 3 existing + 3 new = 6 files.

## New Decision

**Decision**: Duplicate `VALUE_CONDITIONS` and `getDefaultValue` between TriggerDropdown and SkillRow rather than extracting to a shared module.

**Context**: Both components need to determine whether a condition type requires a numeric value and what the default should be. The logic is 6 lines (3 for Set, 3 for function). Filters do not have `always` or `scope`, so the sets are not perfectly identical (trigger includes `always` handling in condition change logic).

**Consequences**: 6 lines of duplicated logic. If a third consumer needs this logic, extract to `src/engine/condition-utils.ts`. Accept duplication for now to avoid premature abstraction.

Recommend adding to `.docs/decisions/index.md` after implementation is verified.
