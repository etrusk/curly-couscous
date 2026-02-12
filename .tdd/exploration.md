# Exploration Findings

## Task Understanding

Replace the always-present trigger dropdown with a two-state model:

1. **Absent** (unconditional): no trigger controls render, only a `+ Condition` ghost button
2. **Present** (conditional): condition dropdown (7 options, no "always"), condition-scoped scope dropdown, NOT toggle, value/qualifier inputs, and `x` remove button

Also hide SELECTOR and FILTER fieldGroups when `target === "self"`.

This is a **UI-only change** -- engine trigger evaluation (`triggers.ts`) and the `Trigger` type (`types.ts`) are unchanged. The store wire format is preserved: `{ scope: "enemy", condition: "always" }` = unconditional.

## Key Questions Answered

### 1. Current TriggerDropdown Structure

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` (156 lines)

Current structure (lines 86-155):

- Always renders a scope `<select>` (Enemy/Ally/Self) -- line 99-108
- Always renders a condition `<select>` with 8 options including "Always" -- lines 109-123
- Conditionally renders NOT toggle (hidden when `condition === "always"`) -- lines 88-98
- Conditionally renders value `<input>` for `hp_below`, `hp_above`, `in_range` -- lines 125-134
- Conditionally renders `QualifierSelect` for `channeling` -- lines 136-143
- Conditionally renders remove button when `onRemove` is provided -- lines 145-153
- All wrapped in `<span className={styles.triggerControl}>` (inline-flex, gap 0.25rem)

**Props interface** (lines 10-16):

```typescript
interface TriggerDropdownProps {
  trigger: Trigger;
  skillName: string;
  triggerIndex: number;
  onTriggerChange: (trigger: Trigger) => void;
  onRemove?: () => void;
}
```

**Key change needed**: This component needs to handle two states -- when `trigger.condition === "always"`, render `+ Condition` ghost button instead of dropdowns. When active, remove "Always" from the condition dropdown and make scope dropdown conditional per `CONDITION_SCOPE_RULES`.

### 2. Current Condition Options and "Always" Handling

The condition dropdown (lines 114-123) has 8 options:

- `always`, `in_range`, `hp_below`, `hp_above`, `targeting_me`, `channeling`, `idle`, `targeting_ally`

When "always" is selected:

- NOT toggle is hidden (line 88: `trigger.condition !== "always"`)
- No value input (not in `VALUE_CONDITIONS`)
- No qualifier select (not `channeling`)
- Scope dropdown still shows (this is the "nonsensical" part the task eliminates)

When switching to "always", negated is cleared (line 60: `if (trigger.negated && newCondition !== "always")`)

### 3. SkillRow Integration with TriggerDropdown

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` (287 lines)

SkillRow renders TriggerDropdown at lines 197-207:

```tsx
<div className={`${styles.fieldGroup} ${styles.triggerField}`}>
  <span className={styles.fieldLabel}>TRIGGER</span>
  <div className={styles.triggerGroup}>
    <TriggerDropdown
      trigger={skill.trigger}
      skillName={skill.name}
      triggerIndex={0}
      onTriggerChange={handleTriggerUpdate}
    />
  </div>
</div>
```

The `handleTriggerUpdate` callback (lines 43-45):

```typescript
const handleTriggerUpdate = (newTrigger: Trigger) => {
  updateSkill(character.id, skill.instanceId, { trigger: newTrigger });
};
```

**Important**: SkillRow wraps TriggerDropdown in a `.fieldGroup` div with TRIGGER label and `.triggerGroup` container. The two-state rendering (ghost button vs dropdown) should be handled inside TriggerDropdown itself, since SkillRow just passes the trigger prop.

### 4. Current target=self Handling for Selector/Filter

**Selector**: Currently only **disabled**, not hidden (line 228):

```tsx
disabled={skill.target === "self"}
```

**Filter**: FilterControls always renders regardless of target (line 240):

```tsx
<FilterControls skill={skill} characterId={character.id} />
```

**Needed changes in SkillRow**:

- Wrap selector fieldGroup (lines 223-238) in a `skill.target !== "self"` conditional
- Wrap FilterControls (line 240) in the same conditional
- The filter is NOT removed from the store when hidden -- just not rendered. Existing filter config persists.

### 5. defaultTrigger Values in Skill Registry

**File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

Skills with `defaultTrigger`:

- **Dash** (line 152-156): `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`
- **Kick** (line 172): `{ scope: "enemy", condition: "channeling" }`
- **Charge** (line 190-193): `{ scope: "enemy", condition: "in_range", conditionValue: 3 }`

Skills WITHOUT `defaultTrigger` (get `{ scope: "enemy", condition: "always" }` in `createSkillFromDefinition`):

- Light Punch, Heavy Punch, Move, Heal, Ranged Attack

These three skills (Dash, Kick, Charge) should render with active trigger controls. The other five should render with `+ Condition` ghost button.

### 6. Existing Test Patterns

**TriggerDropdown tests** are split across 3 files:

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` (378 lines, 16 tests)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx` (156 lines, 6 tests)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx` (141 lines, 6 tests)

Pattern: `renderDropdown()` helper returns `{ onTriggerChange, ...result }`, uses `defaultProps` with `vi.fn()`.

**SkillRow tests** are also split:

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` (686 lines, 25 tests)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` (389 lines, 12 tests)

Pattern: Uses `createSkill()` and `createCharacter()` from `game-test-helpers.ts`. Store setup via `useGameStore.getState().actions.initBattle([character])` when testing store interactions.

**Key test concerns for the refactor**:

- Many existing TriggerDropdown tests render with `condition: "always"` and expect scope/condition dropdowns to be present. These will BREAK because "always" now renders as `+ Condition` ghost button.
- Tests that select "always" via `user.selectOptions(select, "always")` will need rewriting since "Always" is removed.
- Tests specifically checking `condition === "always"` behavior (e.g., "strips value when changing to non-value trigger" selecting "always") need updating.

### 7. Current CSS Module Structure for TriggerDropdown

**File**: `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` (63 lines)

Classes: `.triggerControl`, `.select`, `.input`, `.removeBtn`, `.notToggle`, `.notToggleActive`

**SkillRow.module.css** (366 lines) has related CSS:

- `.triggerField` (grid-column: 6, margin-left: 0.5rem)
- `.triggerGroup` (flex, center, gap 0.25rem, flex-wrap)
- `.addTriggerBtn` (ghost button style -- ALREADY EXISTS but unused in TSX!)
- `.andLabel` (AND label style -- exists but unused)

The ghost button CSS for `+ Condition` is already defined in SkillRow.module.css as `.addTriggerBtn` (lines 155-168). It matches the `.addFilterBtn` pattern (dashed border, transparent bg, 0.15rem 0.5rem padding, 0.75rem font).

### 8. How the NOT Toggle Currently Works

In TriggerDropdown (lines 67-69, 88-98):

- Only rendered when `trigger.condition !== "always"`
- Click toggles `trigger.negated` via spread: `{ ...trigger, negated: !trigger.negated }`
- CSS classes: `.notToggle` (default), `.notToggleActive` (when negated)
- `aria-label="Toggle NOT modifier for {skillName}"`, `aria-pressed={!!trigger.negated}`

**Interaction with removal**: When trigger is removed (set to `always`), the NOT toggle disappears. The requirements say negated should reset to false -- this is already handled because `handleConditionChange` clears negated when switching to "always" (line 60).

In the new model, the `x` button should set `{ scope: "enemy", condition: "always" }` without negated, which naturally resets it.

### 9. AND Trigger Support

**No AND trigger implementation exists in the data model or UI**. The `Skill` type has a single `trigger: Trigger` field (types.ts line 66). There are CSS styles defined (`.addTriggerBtn`, `.andLabel`) but no TSX code uses them. The requirements doc notes: "If AND trigger code does not yet exist, those acceptance criteria are deferred."

**Conclusion**: AND trigger acceptance criteria are deferred. The CSS classes already exist for future use.

### 10. Ghost Button Pattern (from `+ Filter` button)

The `+ Filter` ghost button is implemented in FilterControls.tsx (lines 166-172):

```tsx
<button
  onClick={handleAddFilter}
  className={styles.addFilterBtn}
  aria-label={`Add filter for ${skill.name}`}
>
  + Filter
</button>
```

CSS (SkillRow.module.css lines 234-247):

```css
.addFilterBtn {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 3px;
}
.addFilterBtn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
```

The `+ Condition` button should follow this exact same pattern. The CSS class `.addTriggerBtn` already exists with identical styling (SkillRow.module.css lines 155-168).

**Decision**: The `+ Condition` button should use `.addTriggerBtn` from SkillRow.module.css. But TriggerDropdown imports from TriggerDropdown.module.css. Two options:

1. Add a ghost button class to TriggerDropdown.module.css
2. Pass the className from SkillRow (which already has `.addTriggerBtn`)
3. Move the ghost button rendering to SkillRow and handle the two states there

Option 1 or having the ghost button inside TriggerDropdown with its own CSS is cleanest since TriggerDropdown already handles rendering logic.

## Relevant Files

### Must modify

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` - Main target: two-state model, condition-scoped scopes, remove "Always" option
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` - Add ghost button styles for `+ Condition`
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` - Conditional render of selector/filter when target=self

### Tests to modify (existing tests will break)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` - Tests render with "always" and expect dropdowns; need update for ghost button
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx` - "NOT toggle hidden for always trigger" test changes meaning; "switching to always clears negated" test needs rewriting
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-qualifier.test.tsx` - No direct breakage expected (tests use channeling condition)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` - Tests query for "Trigger for Light Punch" combobox with always condition; these will break

### Tests to add (new behavior)

- New tests for two-state model (ghost button render, click to activate, click x to deactivate)
- New tests for condition-scoped scope rules
- New tests for target=self hiding selector/filter
- New tests for registry default trigger rendering

### Read-only references

- `/home/bob/Projects/auto-battler/src/engine/types.ts` - Trigger type definition (unchanged)
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - defaultTrigger values (unchanged)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/FilterControls.tsx` - Filter UI (unchanged, but conditionally rendered)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/QualifierSelect.tsx` - Shared qualifier component (unchanged)
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` - Has `.addTriggerBtn` CSS already
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter-not-toggle.test.tsx` - Existing filter tests (may need update if target=self tests overlap)
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - `createSkill()` defaults trigger to `{ scope: "enemy", condition: "always" }`
- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` - `updateSkill` action uses `Object.assign` (line 232)

## Existing Patterns

- **Ghost Button** - Defined in ui-ux-guidelines.md: `padding: 0.15rem 0.5rem`, `font-size: 0.75rem`, `border: 1px dashed var(--border)`, `background: transparent`, `color: var(--text-secondary)`. CSS class `.addTriggerBtn` already exists in SkillRow.module.css with this exact pattern.
- **Filter two-state model** - FilterControls.tsx already implements the add/remove pattern with `+ Filter` ghost button and `x` remove button. This is the direct pattern to follow.
- **Controlled component** - TriggerDropdown is a controlled component receiving `trigger` and `onTriggerChange`. This pattern should be preserved.
- **Test helper pattern** - `renderDropdown()` helper returning `{ onTriggerChange, ...result }` with `defaultProps`. New tests should follow this.
- **Store interaction pattern** - SkillRow tests use `useGameStore.getState().actions.initBattle([character])` for setup and read store state directly for assertions.
- **CSS Module imports** - TriggerDropdown uses its own module CSS. SkillRow has `.addTriggerBtn` but TriggerDropdown cannot import SkillRow's CSS. Either duplicate the style or pass className.

## Dependencies

- `src/engine/types.ts` - Trigger, ConditionType, TriggerScope types (read-only)
- `src/engine/skill-registry.ts` - SKILL_REGISTRY for registry default triggers (read-only)
- `src/stores/gameStore.ts` - `updateSkill` action for store mutations (unchanged)
- `src/components/CharacterPanel/QualifierSelect.tsx` - Shared qualifier component (unchanged)
- `src/components/CharacterPanel/FilterControls.tsx` - Filter UI (conditionally rendered based on target)
- Ghost button CSS pattern (exists in SkillRow.module.css, needs duplication or alternative)

## Applicable Lessons

- **Lesson 003** (ui-styling): "Verify CSS variable semantics across all theme modes" - Relevant for any new CSS (ghost button in TriggerDropdown.module.css). Should verify `--border`, `--text-secondary`, `--surface-hover` resolve correctly.
- **Lesson 004** (testing): "fakeTimers requires shouldAdvanceTime for userEvent compatibility" - Relevant if any tests use fake timers with userEvent (current TriggerDropdown tests do not, but good to keep in mind).

## Constraints Discovered

1. **File size limits**: TriggerDropdown.tsx is currently 156 lines (well under 400). SkillRow.tsx is 287 lines (under 400). Adding `CONDITION_SCOPE_RULES` constant and the two-state logic to TriggerDropdown should keep it under 400.

2. **Existing test breakage**: At least 6-8 existing TriggerDropdown tests will break because they render with `condition: "always"` and expect dropdowns. The "switching to always clears negated" test needs fundamental rewriting. These must be updated as part of implementation.

3. **CSS class location**: The `.addTriggerBtn` ghost button CSS already exists in SkillRow.module.css but TriggerDropdown imports from TriggerDropdown.module.css. Either:
   - Add equivalent ghost button styles to TriggerDropdown.module.css (simplest, follows ADR-023 duplication precedent)
   - Have SkillRow render the ghost button and conditionally render TriggerDropdown (changes component responsibility)

4. **AND trigger deferred**: The Skill type has a single `trigger` field. AND trigger acceptance criteria are deferred per requirements.

5. **Backward compatibility**: `condition: "always"` must remain valid in types and engine. The UI reinterprets it as "no active trigger."

6. **Filter persistence on target=self**: The requirements say filter is hidden when target=self but NOT removed from the store. This is critical -- just `{skill.target !== "self" && <FilterControls .../>}`.

7. **Scope reset on condition change**: When condition changes and current scope is invalid for new condition, scope must reset to first valid scope. This is new logic in TriggerDropdown's `handleConditionChange`.

## Open Questions

1. **Ghost button rendering location**: Should the `+ Condition` ghost button be rendered inside TriggerDropdown (which then needs ghost button CSS), or should SkillRow handle the two-state rendering externally? The FilterControls pattern renders its own ghost button internally (same component handles both states). Following that precedent, TriggerDropdown should handle it.

2. **Default condition when activating**: Requirements say "sensible default (e.g., `in_range`)" when clicking `+ Condition`. What scope should be set? The `CONDITION_SCOPE_RULES` for `in_range` lists `enemy`, `ally` -- so `enemy` (first valid scope) is the natural default.

3. **Scope dropdown hiding for targeting_me/targeting_ally**: The scope is implied (`enemy`). Should the scope text be shown as a non-interactive label (e.g., "Enemy" text), or should it simply be absent? The requirements say "scope dropdown not shown" and "store still holds the correct scope value." Simplest is to not render the scope dropdown at all.

4. **CONDITION_SCOPE_RULES location**: Should this be in TriggerDropdown.tsx as a local constant, or extracted to a shared file? Since it is only used by TriggerDropdown, keeping it local is simplest and follows the existing pattern of `VALUE_CONDITIONS` being local to TriggerDropdown.

5. **Test file organization**: Given existing test files are already at 378 lines (TriggerDropdown.test.tsx) and 686 lines (SkillRow.test.tsx, already over 400 with eslint disable), should new two-state trigger tests go in a new file (e.g., `TriggerDropdown-two-state.test.tsx`)? And target=self tests in `SkillRow-target-self.test.tsx`? This follows the established split pattern.
