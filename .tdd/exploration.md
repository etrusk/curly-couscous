# Exploration Findings

## Task Understanding

Three UI features need to be added to expose already-implemented engine capabilities in the SkillRow filter section and TriggerDropdown component:

1. **Filter Condition Dropdown Expansion** -- expand filter `<select>` from 2 options (`hp_below`, `hp_above`) to all 7 filterable conditions. Non-value conditions (`channeling`, `idle`, `targeting_me`, `targeting_ally`) hide the numeric input. Value conditions (`hp_below`, `hp_above`, `in_range`) show it.

2. **Filter NOT Toggle** -- add a NOT toggle button in the filter group, replicating the trigger NOT toggle pattern from TriggerDropdown.

3. **Qualifier Selector** -- add a qualifier dropdown for `channeling` condition in both TriggerDropdown (triggers) and SkillRow (filters). Options: `(any)`, action types (`attack`, `move`, `heal`, `interrupt`, `charge`), and skill IDs from `SKILL_REGISTRY`.

All engine types (`SkillFilter.qualifier`, `SkillFilter.negated`, `ConditionQualifier`) and evaluation logic (`evaluateConditionForCandidate`, `evaluateFilterForCandidate`, `matchesChannelingQualifier`) already exist. This is purely UI work.

## Relevant Files

### Primary Implementation Files

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.tsx` -- filter section (lines 76-104 handlers, lines 274-311 JSX). Currently only `hp_below`/`hp_above` options, always shows numeric input, no NOT toggle, no qualifier.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.module.css` -- `.filterGroup`, `.addFilterBtn`, `.removeFilterBtn`, `.select`, `.input` classes. Will need new `.notToggle`/`.notToggleActive` classes for filter NOT toggle (or import from TriggerDropdown).
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` -- trigger NOT toggle pattern (lines 66-68, 78-87), VALUE_CONDITIONS set (lines 19-23), getDefaultValue (lines 25-28). Needs qualifier dropdown for `channeling`.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` -- `.notToggle`, `.notToggleActive` CSS classes (lines 42-62). Reference pattern for filter NOT toggle styling.

### Test Files

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow-filter.test.tsx` -- 168 lines, 7 tests. Tests filter controls visibility, filter type dropdown options (currently only checks `hp_below`/`hp_above`), filter value display, add/remove filter buttons, filter_failed rejection display. Will need new tests for expanded conditions, NOT toggle, qualifier.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/SkillRow.test.tsx` -- 686 lines. Tests config mode, battle mode, evaluation display, cooldown, field labels. Filter label test exists (line 637). Not directly modified but verifies filter field group.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` -- 378 lines. Tests all 8 condition options, value/no-value toggling, negated field preservation. Will need new qualifier dropdown tests.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx` -- 156 lines. Dedicated NOT toggle tests: visibility, click behavior, aria-pressed, switching to always clears negated. Reference for filter NOT toggle test patterns.

### Engine Type Files

- `/home/bob/Projects/auto-battler/src/engine/types.ts` -- `SkillFilter` interface (lines 77-82) with `condition`, `conditionValue?`, `qualifier?`, `negated?`. `ConditionType` union (lines 92-100), `ConditionQualifier` interface (lines 105-108) with `type: "action" | "skill"` and `id: string`. `Trigger` interface (lines 114-120) also has `qualifier?` and `negated?`.
- `/home/bob/Projects/auto-battler/src/engine/triggers.ts` -- `evaluateConditionForCandidate()` (lines 39-91) handles all condition types including `channeling` with qualifier matching via `matchesChannelingQualifier()`. Shared by both triggers and filters.
- `/home/bob/Projects/auto-battler/src/engine/selector-filters.ts` -- `evaluateFilterForCandidate()` (lines 13-28) delegates to shared condition evaluator. Already handles `qualifier` and `negated`.
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` -- `SKILL_REGISTRY` array (lines 64-196) with 8 skills. IDs: `light-punch`, `heavy-punch`, `move-towards`, `heal`, `ranged-attack`, `dash`, `kick`, `charge`. Used for qualifier skill options.

### Store

- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` -- `updateSkill` action (lines 222-235) uses `Object.assign(skill, updates)` via Immer. Accepts partial `Skill` updates including `filter`. Setting `filter: undefined` removes it. Setting `filter: { condition, conditionValue, qualifier, negated }` replaces it entirely.

### Test Helpers

- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` -- `createSkill()` (lines 47-77) accepts `filter` override. `createCharacter()` (lines 28-42) for test setup.

### Requirements

- `/home/bob/Projects/auto-battler/.tdd/requirements.md` -- detailed acceptance criteria for all 3 features.

## Existing Patterns

### 1. Value/Non-Value Condition Toggling (TriggerDropdown)

TriggerDropdown already implements this pattern:

- `VALUE_CONDITIONS` set: `hp_below`, `hp_above`, `in_range`
- `getDefaultValue()`: returns 50 for HP conditions, 3 for in_range
- `hasValue = VALUE_CONDITIONS.has(trigger.condition)` controls input visibility
- When switching conditions: value conditions get `conditionValue` set; non-value conditions get clean object without `conditionValue`
- **This exact pattern should be replicated in SkillRow's filter section.** Note: filter does not use `always` or `scope`, but otherwise identical.

### 2. NOT Toggle Pattern (TriggerDropdown)

- Button with text "NOT", appears when condition is not `always`
- CSS: `styles.notToggle` (inactive) + `styles.notToggleActive` (active, red background)
- ARIA: `aria-label="Toggle NOT modifier for ${skillName}"`, `aria-pressed={!!trigger.negated}`
- Handler: spreads existing trigger and toggles `negated`
- When switching to `always`, negated is cleared from the callback
- **For filter NOT toggle: same visual pattern but different aria-label (`"Toggle NOT modifier for filter on ${skillName}"`) and applied to `filter.negated` via `updateSkill`.**

### 3. Store Update Pattern

- `updateSkill(charId, instanceId, { filter: {...} })` -- Object.assign merges updates
- To set filter with all fields: `{ filter: { condition, conditionValue, qualifier, negated } }`
- To remove filter: `{ filter: undefined }`
- Important: when changing filter condition, the entire filter object should be reconstructed (not partially merged), because `Object.assign` on the skill level replaces the filter reference entirely.

### 4. CSS Module Scoping

- Each component has its own `.module.css` file
- TriggerDropdown's `.notToggle`/`.notToggleActive` classes are scoped to TriggerDropdown
- For filter NOT toggle, options are:
  a. Duplicate the CSS classes into `SkillRow.module.css` (simple, follows CSS module convention)
  b. Import TriggerDropdown's styles (possible but breaks encapsulation)
  - **Recommendation: duplicate into SkillRow.module.css** since it is only ~12 lines and keeps modules independent.

### 5. Test Patterns

- Tests use `createSkill()` / `createCharacter()` from `game-test-helpers.ts`
- Filter tests use `within()` for scoped queries within filter dropdown
- Trigger tests verify callback shapes with `expect.objectContaining()`
- NOT toggle tests verify: visibility (present/absent), click behavior (sets/clears negated), aria-pressed reflects state
- Tests use `userEvent.setup()` for interactions, `screen.getByRole/getByLabelText` for queries

## Dependencies

- **Engine types are complete**: `SkillFilter`, `ConditionType`, `ConditionQualifier`, `Trigger` all support qualifier and negated fields.
- **Engine evaluation is complete**: `evaluateConditionForCandidate`, `evaluateFilterForCandidate`, `matchesChannelingQualifier` all handle qualifier matching.
- **SKILL_REGISTRY is stable**: 8 skill definitions with stable IDs for qualifier options.
- **Store action is sufficient**: `updateSkill` with `Object.assign` handles filter updates including undefined to remove.

## Applicable Lessons

- **Lesson 003 (ui-styling)**: "Verify CSS variable semantics across all theme modes." When adding NOT toggle styling to SkillRow.module.css, verify `--health-low`, `--text-on-faction`, `--surface-hover` resolve correctly in dark theme. These are the same tokens used by TriggerDropdown's NOT toggle, so they should be fine, but worth confirming.
- **Lesson 004 (testing)**: "fakeTimers requires shouldAdvanceTime for userEvent compatibility." The filter and trigger tests use `userEvent.setup()` without fake timers, so this should not be an issue. But if any new tests need timers, remember this.

## Constraints Discovered

### 1. handleFilterTypeChange Currently Preserves conditionValue

Current implementation (SkillRow.tsx lines 82-90):

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

This always passes `conditionValue`, even for non-value conditions. Must be restructured to:

- Set appropriate default value for value conditions
- Omit `conditionValue` for non-value conditions
- Clear `qualifier` when switching away from `channeling`

### 2. Filter Does Not Use `always` or `in_range` in Current Dropdown

The spec's filter conditions table includes `in_range` but not `always`. The requirements confirm 7 filterable conditions: `hp_below`, `hp_above`, `in_range`, `channeling`, `idle`, `targeting_me`, `targeting_ally`. Note `always` is NOT a filterable condition (it would be meaningless as a filter). `in_range` IS included for filters per requirements.

### 3. Qualifier Dropdown Requires optgroup

Requirements specify `<select>` with optgroups for "Action Type" and "Skill" categories, plus a standalone `(any)` option. This follows the native `<select>` anti-pattern guideline.

### 4. CSS Module Scoping for NOT Toggle Styles

Cannot import TriggerDropdown.module.css classes in SkillRow.tsx. Must duplicate `.notToggle` and `.notToggleActive` CSS into SkillRow.module.css, or extract to a shared CSS file. Duplication is simpler and follows existing patterns.

### 5. SKILL_REGISTRY Import for Qualifier Options

`SKILL_REGISTRY` is already imported via `getSkillDefinition` in SkillRow.tsx. For qualifier options, need to also import `SKILL_REGISTRY` directly to map over all skill IDs. This is a new import but from the same module.

### 6. Qualifier Conditional Rendering

Qualifier dropdown appears ONLY when condition is `channeling`. When switching away from `channeling`, existing qualifier must be cleared. When switching to `channeling`, qualifier defaults to none (`(any)`).

### 7. Filter `in_range` Default Value

When selecting `in_range` for filter, default `conditionValue` should be 3 (matching TriggerDropdown's `getDefaultValue`).

### 8. Existing Test Assertion for Filter Options

`SkillRow-filter.test.tsx` line 65 test "filter type dropdown has HP below and HP above options" will need to be updated to verify all 7 options instead of just 2.

## Open Questions

1. **Should filter NOT toggle CSS be duplicated or extracted to a shared module?** Requirements say "same visual pattern as trigger NOT toggle." Duplicating ~12 lines of CSS is simpler than creating a shared module. Recommend duplication.

2. **Should qualifier dropdown use optgroups?** Requirements specify optgroups for "Action Type" and "Skill" categories. Need to confirm this works well with native `<select>` styling.

3. **Qualifier dropdown label text?** Requirements don't specify display text for skill IDs. Should `move-towards` display as "Move" (from registry name) or "move-towards" (the ID)? Recommendation: use registry name for display, ID for value.

4. **Filter `in_range` -- is it meaningful as a per-candidate filter?** The engine's `evaluateConditionForCandidate` checks `hexDistance(candidate.position, evaluator.position) <= cv`, which would filter candidates by distance from evaluator. This is indeed useful (e.g., "only target enemies within 2 hexes"). The spec and requirements both list it as a valid filter condition.

5. **Should the qualifier dropdown in TriggerDropdown and SkillRow share a component?** Both need identical qualifier options and similar handling. Could extract a `QualifierSelect` component, or duplicate the `<select>` JSX. Recommend extraction for DRY, but planning phase should decide.
