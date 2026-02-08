# Exploration Findings

## Task Understanding

Phase 3: New Trigger Conditions -- add trigger-context integration tests for `channeling`, `idle`, `targeting_me`, `targeting_ally` conditions with scope/qualifier variations, and update TriggerDropdown to expose those conditions in the UI. The shared condition evaluator (`evaluateConditionForCandidate()`) already handles all four conditions; this phase verifies trigger-context behavior and wires UI.

## Relevant Files

### Engine -- Trigger System (source)

- `/home/bob/Projects/auto-battler/src/engine/triggers.ts` (152 lines) - Contains `evaluateTrigger()` and `evaluateConditionForCandidate()`. The shared condition evaluator already handles all 8 conditions including `channeling`, `idle`, `targeting_me`, `targeting_ally`. No source changes expected here.
- `/home/bob/Projects/auto-battler/src/engine/types.ts` (355 lines) - Defines `Trigger`, `ConditionType`, `ConditionQualifier`, `TriggerScope`, `SkillFilter`, `Character`, `Action`. All types already include the new conditions. No source changes expected.
- `/home/bob/Projects/auto-battler/src/engine/selector-filters.ts` (29 lines) - `evaluateFilterForCandidate()` wrapper. Uses shared evaluator. No changes expected.
- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` (323 lines) - Decision pipeline: disabled -> cooldown -> hold -> trigger -> filter -> criterion -> range -> heal-full-HP. Calls `evaluateTrigger()` at line 91. No changes expected.

### Engine -- Trigger Tests (existing, reference for patterns)

- `/home/bob/Projects/auto-battler/src/engine/triggers-cell-targeted.test.ts` (297 lines) - Tests `targeting_me` with `enemy` scope. Extensive coverage: basic detection, no actions, ally actions ignored, multi-enemy, multi-tick actions. This is the closest pattern reference for new tests.
- `/home/bob/Projects/auto-battler/src/engine/triggers-always.test.ts` (67 lines) - Tests `always` condition.
- `/home/bob/Projects/auto-battler/src/engine/triggers-not-modifier.test.ts` (237 lines) - Tests NOT modifier on various conditions. Already tests NOT + `targeting_me` (line 165-191). Need to add NOT + `channeling`, NOT + `idle`, NOT + `targeting_ally`.
- `/home/bob/Projects/auto-battler/src/engine/triggers-edge-cases.test.ts` (250 lines) - Dead character handling, scope pool tests, edge cases. Already tests dead enemies with `targeting_me` (line 226-248).
- `/home/bob/Projects/auto-battler/src/engine/triggers-hp-below.test.ts` - HP below tests (reference).
- `/home/bob/Projects/auto-battler/src/engine/triggers-enemy-in-range.test.ts` - Enemy in_range tests (reference).
- `/home/bob/Projects/auto-battler/src/engine/triggers-ally-hp-below.test.ts` - Ally hp_below tests (reference).
- `/home/bob/Projects/auto-battler/src/engine/triggers-ally-in-range.test.ts` - Ally in_range tests (reference).
- `/home/bob/Projects/auto-battler/src/engine/triggers-test-helpers.ts` (49 lines) - Test helpers: `createCharacter()`, `createSkill()`, `createAction()`. These are the helpers to use for new trigger tests.
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` (150 lines) - Base test helpers used by triggers-test-helpers. Defines `createSkill()` with `filter` field support.

### Engine -- Filter Tests (Phase 2 pattern reference)

- `/home/bob/Projects/auto-battler/src/engine/selector-filters.test.ts` (459 lines) - Unit tests for `evaluateFilterForCandidate()`. Contains tests for `channeling`, `idle`, `targeting_me`, `targeting_ally` in filter context -- these are the behavioral mirror for the trigger tests we need to write.
- `/home/bob/Projects/auto-battler/src/engine/selector-filter-integration.test.ts` (639 lines) - Integration tests through `evaluateSkillsForCharacter` pipeline. Contains filter-context tests with `channeling`, `idle`, `targeting_me`, `targeting_ally` and qualifiers.

### UI Components (need changes)

- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.tsx` (134 lines) - Currently exposes 5 condition options: `always`, `in_range`, `hp_below`, `hp_above`, `targeting_me`. Missing: `channeling`, `idle`, `targeting_ally`. Need to add 3 new `<option>` elements.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.test.tsx` (454 lines) - Tests for TriggerDropdown. Already at 454 lines (exceeds 400-line limit noted in current-task.md). Need to add tests for new condition options. May need to split or be careful about line count.
- `/home/bob/Projects/auto-battler/src/components/CharacterPanel/TriggerDropdown.module.css` - CSS for TriggerDropdown. Likely no changes needed.
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts` (168 lines) - `formatTrigger()` function. Already handles all conditions generically (just outputs `condition` string and optional `conditionValue`). No changes needed.
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.test.ts` (209 lines) - Already tests `targeting_me` and `channeling` formatting. No changes needed.

### Legacy (reference only)

- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx` (line 246) - Legacy component that has `targeting_me` option as "Cell Targeted". Reference for display name convention.

## Existing Patterns

### Test file naming convention

Trigger tests are split by condition type into separate files: `triggers-always.test.ts`, `triggers-cell-targeted.test.ts`, `triggers-enemy-in-range.test.ts`, `triggers-hp-below.test.ts`, `triggers-ally-hp-below.test.ts`, `triggers-ally-in-range.test.ts`, `triggers-not-modifier.test.ts`, `triggers-edge-cases.test.ts`. New tests should follow this pattern with new files like `triggers-channeling.test.ts`, `triggers-idle.test.ts`, `triggers-targeting-ally.test.ts`.

### Test structure pattern

Each trigger test file:

1. Imports from `vitest`, `./triggers`, `./types`, `./triggers-test-helpers`
2. Uses `createCharacter()`, `createAction()`, `createSkill()` from helpers
3. Creates characters with explicit `faction`, `position`, `hp`, `maxHp`
4. Creates trigger objects with explicit type annotation `const trigger: Trigger = { ... }`
5. Calls `evaluateTrigger(trigger, evaluator, allCharacters)`
6. Asserts boolean result with `expect(result).toBe(true/false)`

### Action creation pattern for channeling/targeting tests

From `triggers-cell-targeted.test.ts` (lines 26-31):

```typescript
currentAction: createAction({
  type: "attack",
  targetCell: { q: 3, r: 2 },
  resolvesAtTick: 1,
});
```

From `selector-filters.test.ts` (lines 18-38), a `createChannelingAction()` helper is defined locally in the filter test file. The trigger tests should follow a similar pattern.

### TriggerDropdown option display names

Current mapping in `TriggerDropdown.tsx`:

- `always` -> "Always"
- `in_range` -> "In range"
- `hp_below` -> "HP below"
- `hp_above` -> "HP above"
- `targeting_me` -> "Cell targeted"

The legacy `SkillsPanel.tsx` uses "Cell Targeted" (capitalized) for `targeting_me`. The TriggerDropdown uses title case for multi-word options ("In range", "HP below", "HP above", "Cell targeted").

### VALUE_CONDITIONS set

`TriggerDropdown.tsx` line 19-23 defines `VALUE_CONDITIONS = new Set(["hp_below", "hp_above", "in_range"])`. The new conditions (`channeling`, `idle`, `targeting_ally`) are NOT value-based, so they do not need to be added to this set.

### handleConditionChange behavior

When switching conditions, the handler (lines 48-63) clears `conditionValue` for non-VALUE conditions and preserves `negated` if present. This already works correctly for the new conditions -- no changes to handler logic needed.

## Dependencies

- **evaluateConditionForCandidate() (triggers.ts)** - Already implements all 8 conditions. No engine changes required.
- **evaluateTrigger() (triggers.ts)** - Already delegates to shared evaluator for all conditions. No engine changes required.
- **ConditionType union (types.ts)** - Already includes `channeling`, `idle`, `targeting_me`, `targeting_ally`. No type changes required.
- **ConditionQualifier (types.ts)** - Already defined with `type: "action" | "skill"` and `id: string`. Used by `channeling` condition. No changes required.
- **triggers-test-helpers.ts** - `createAction()` helper exists and returns an `Action` object. Sufficient for creating `currentAction` on characters.

## Constraints Discovered

1. **TriggerDropdown test file is already at 454 lines** (exceeds 400-line limit per CLAUDE.md). Adding tests for 3 new conditions will push it further. Consider: (a) splitting into separate test file, (b) acknowledging pre-existing tech debt, or (c) being very concise with new tests.

2. **No qualifier UI in TriggerDropdown** - The `qualifier` field on `Trigger` exists in the type system and is supported by the engine, but TriggerDropdown has NO UI for setting qualifiers. The acceptance criteria include qualifier tests in trigger context (`channeling` + `skill:heal`, `channeling` + `action:attack`), but these are engine tests only -- TriggerDropdown does not need qualifier UI in this phase.

3. **Trigger tests are per-file by condition type** - Following this convention means creating 2-3 new test files rather than appending to existing ones. `targeting_me` already has `triggers-cell-targeted.test.ts` so it may only need supplementary tests in a new file or additions for scope variations (currently only `enemy` scope is tested).

4. **`targeting_me` with non-enemy scope** - The spec says `targeting_me` is for `enemy` scope. The `targeting_ally` is also `enemy` scope only. But the engine does not enforce scope restrictions -- `evaluateTrigger()` evaluates whatever scope is given. The acceptance criteria include `{ scope: "ally", condition: "targeting_ally" }` which tests ally scope, but this would check if any ally (same faction, not self) has an action targeting another ally's cell.

5. **`idle` has no qualifier support** - The `idle` condition simply checks `candidate.currentAction === null`. No qualifier field is meaningful. Tests should not include qualifiers for `idle`.

6. **`channeling` with qualifier tests need specific skillId/actionType on actions** - The `createAction()` helper in `triggers-test-helpers.ts` creates actions with `skill: createSkill({ id: "test-skill" })` by default. For qualifier tests, need to specify `skill: createSkill({ id: "heal" })` or similar.

## Open Questions

1. **Display names for new conditions** - What should the dropdown option text be for `channeling`, `idle`, and `targeting_ally`? Following the existing pattern (title case, descriptive): "Channeling", "Idle", "Targeting ally"? Or different wording?

2. **Should `targeting_me` tests be expanded?** - The acceptance criteria say `{ scope: "enemy", condition: "targeting_me" }` fires when enemy targets evaluator's cell. This is already covered by `triggers-cell-targeted.test.ts`. Should we skip re-testing this, or add scope variation tests (e.g., what happens with `ally` scope + `targeting_me`)?

3. **TriggerDropdown test file splitting** - Given the 400-line limit and current 454 lines, should the test file be split as a prerequisite? Or should new tests be added as a separate file (e.g., `TriggerDropdown-conditions.test.tsx`)? The current-task.md already flags this as a known issue.

4. **Integration test depth** - Should we write trigger-context tests ONLY at the `evaluateTrigger()` level, or also through the `evaluateSkillsForCharacter()` pipeline (like the filter integration tests in `selector-filter-integration.test.ts`)? The acceptance criteria focus on `evaluateTrigger()` behavior.

5. **Scope validation** - Should tests verify invalid scope/condition combinations (e.g., `{ scope: "self", condition: "channeling" }` which would check if the evaluator themselves is channeling)? The engine doesn't restrict this but the spec only documents specific scope/condition pairings.
