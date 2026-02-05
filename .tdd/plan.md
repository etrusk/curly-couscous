# Implementation Plan: Skill System Refactor

## Overview

Three coordinated changes delivered as one coherent refactor:

- **A1**: Universal `behavior` property (rename `mode`, add `behaviors` to registry)
- **A2**: Split `selectorOverride` into `target` + `criterion`
- **A3**: Universal skill duplication via `maxInstances`

## 1. Action Type Inference Decision

### Decision: Explicit `actionType` in SkillDefinition (Option A)

Add `actionType: "attack" | "move" | "heal"` to `SkillDefinition` and propagate to `Skill`.

### Context

`getActionType()` currently infers action type from presence of optional fields: `damage !== undefined` => attack, `healing !== undefined` => heal, `mode !== undefined` => move. When `mode` becomes `behavior` (universal to all skills), the `mode !== undefined` test no longer distinguishes Move skills. We need a different mechanism.

### Options Evaluated

1. **Explicit `actionType` field** -- Every skill declares its type. Simple, unambiguous, zero inference.
2. **Registry-based lookup** -- Map skill name/id to action type via a separate table. Adds indirection.
3. **Behavior-value-based inference** -- If behavior value is "towards"|"away" => move. Fragile; future behaviors (e.g., "patrol") become ambiguous.

### Rationale for Option A

- Aligns with spec's "Skill Categories" section which explicitly lists three action categories (Attack, Heal, Move)
- Aligns with ADR-005's principle: the registry is the single source of truth for skill identity
- Aligns with architecture.md's "Data-Driven Targeting" pattern: declarative data, not inference
- Eliminates the existing mutual-exclusion validation in `getActionType()` (the "can only have one of damage, healing, or mode" check becomes unnecessary because `actionType` is always present)
- Future-proof: new action types (buff, debuff) just add to the union type

### Consequences

- `getActionType()` changes from inference logic to a simple field read
- The error paths for "must have exactly one" property are removed (compile-time safety replaces runtime checks)
- 4 tests in `game-decisions-action-type-inference.test.ts` need updating: the "throw for skill with both" and "throw for skill with neither" tests become obsolete; replace with tests that verify the `actionType` field is respected
- `damage`, `healing` remain as numeric payload fields. `actionType` determines the category. This means a skill could theoretically have `actionType: "attack"` without `damage` -- but TypeScript discriminated unions or runtime validation in the registry can prevent this

### New ADR Recommended

ADR-011: Explicit Action Type on Skill Definitions. Document this decision for future reference.

## 2. Data Model Changes (Before/After)

### 2a. `SkillDefinition` (in `src/engine/skill-registry.ts`)

```typescript
// BEFORE
export interface SkillDefinition {
  id: string;
  name: string;
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  mode?: "towards" | "away";
  innate: boolean;
  defaultSelector?: Selector;
}

// AFTER
export interface SkillDefinition {
  id: string;
  name: string;
  actionType: "attack" | "move" | "heal";
  tickCost: number;
  range: number;
  damage?: number; // Required when actionType === "attack"
  healing?: number; // Required when actionType === "heal"
  behaviors: string[]; // Available behaviors for this skill (e.g., ["towards", "away"])
  defaultBehavior: string; // Default behavior value (first in behaviors array)
  innate: boolean;
  maxInstances: number; // Max duplicates per character (1 = no duplication, 3 = Move default)
  defaultTarget?: Target; // Replaces defaultSelector
  defaultCriterion?: Criterion; // Replaces defaultSelector
}
```

### 2b. `Skill` (in `src/engine/types.ts`)

```typescript
// BEFORE
export interface Skill {
  id: string;
  instanceId: string;
  name: string;
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  mode?: "towards" | "away";
  enabled: boolean;
  triggers: Trigger[];
  selectorOverride?: Selector;
}

// AFTER
export interface Skill {
  id: string;
  instanceId: string;
  name: string;
  actionType: "attack" | "move" | "heal";
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  behavior: string; // Universal: every skill has exactly one active behavior
  enabled: boolean;
  triggers: Trigger[];
  target: Target; // Always present (replaces selectorOverride)
  criterion: Criterion; // Always present (replaces selectorOverride)
}
```

### 2c. New `Target` and `Criterion` types (in `src/engine/types.ts`)

```typescript
// BEFORE
export interface Selector {
  type:
    | "nearest_enemy"
    | "nearest_ally"
    | "lowest_hp_enemy"
    | "lowest_hp_ally"
    | "self";
}

// AFTER
export type Target = "enemy" | "ally" | "self";
export type Criterion = "nearest" | "furthest" | "lowest_hp" | "highest_hp";
```

Notes:

- `self` target ignores criterion (there is only one possible target)
- 3 targets x 4 criteria = 12 combinations, but `self` with any criterion always returns self
- The `Selector` interface is removed entirely

### 2d. Registry entries (updated)

```typescript
export const SKILL_REGISTRY: readonly SkillDefinition[] = [
  {
    id: "light-punch",
    name: "Light Punch",
    actionType: "attack",
    tickCost: 0,
    range: 1,
    damage: 10,
    behaviors: [], // No behavior choices
    defaultBehavior: "", // N/A (empty string sentinel)
    innate: false,
    maxInstances: 1,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
  },
  {
    id: "heavy-punch",
    name: "Heavy Punch",
    actionType: "attack",
    tickCost: 2,
    range: 2,
    damage: 25,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    maxInstances: 1,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
  },
  {
    id: "move-towards",
    name: "Move",
    actionType: "move",
    tickCost: 1,
    range: 1,
    behaviors: ["towards", "away"],
    defaultBehavior: "towards",
    innate: true,
    maxInstances: 3,
    defaultTarget: "enemy",
    defaultCriterion: "nearest",
  },
  {
    id: "heal",
    name: "Heal",
    actionType: "heal",
    tickCost: 2,
    range: 5,
    healing: 25,
    behaviors: [],
    defaultBehavior: "",
    innate: false,
    maxInstances: 1,
    defaultTarget: "ally",
    defaultCriterion: "lowest_hp",
  },
];
```

## 3. Change Sequence

The refactor is sequenced so that tests pass at each step. Steps are grouped into three layers: types, engine logic, and UI/store.

---

### Step 1: Add `actionType` to SkillDefinition and Skill

- **Files**:
  - `src/engine/skill-registry.ts` -- Add `actionType` field to `SkillDefinition` interface and all 4 registry entries
  - `src/engine/types.ts` -- Add `actionType` field to `Skill` interface (alongside existing `mode`)
  - `src/engine/skill-registry.ts` -- `getDefaultSkills()` and `createSkillFromDefinition()` propagate `actionType`
  - `src/engine/game-test-helpers.ts` -- `createSkill()` adds `actionType` with default based on existing fields
  - `src/stores/gameStore-test-helpers.ts` -- Same change
- **Why now**: This is additive-only. No existing field is removed or renamed. All existing tests continue to pass because `actionType` is just a new field alongside the existing `mode`/`damage`/`healing` inference.
- **Tests affected**: None break. New tests will be designed later.
- **Backward compat**: Test helpers default `actionType` from existing fields: if `damage` => "attack", if `healing` => "heal", if `mode` => "move", else "attack" (safe default for test-only skills)

---

### Step 2: Switch `getActionType()` to use `actionType` field

- **Files**:
  - `src/engine/game-actions.ts` -- `getActionType()` reads `skill.actionType` instead of inferring from `damage`/`healing`/`mode` presence. Remove the mutual-exclusion validation.
  - `src/engine/game-actions.ts` -- `createSkillAction()` reads `skill.behavior` for move destination (but `behavior` doesn't exist yet, so for now still reads `skill.mode!`; this is addressed in Step 4)
- **Why now**: With `actionType` available from Step 1, we can switch the inference. This must happen before removing `mode`.
- **Tests affected**:
  - `src/engine/game-decisions-action-type-inference.test.ts` -- "throw for skill with both damage and mode" and "throw for skill with neither" tests: these runtime validation tests become obsolete. Replace with tests that verify `actionType` is read correctly.
  - All other tests that call `getActionType()` indirectly (via `computeDecisions`, `createSkillAction`) continue to work because test helpers now provide `actionType`.

---

### Step 3: Split `Selector` into `Target` + `Criterion`

- **Files**:
  - `src/engine/types.ts` -- Add `Target` and `Criterion` types. Add `target` and `criterion` fields to `Skill` (alongside existing `selectorOverride`). Keep `Selector` interface temporarily.
  - `src/engine/selectors.ts` -- Add `evaluateTargetCriterion(target, criterion, evaluator, allCharacters)` function alongside existing `evaluateSelector()`. Add `furthest_enemy`, `furthest_ally`, `highest_hp_enemy`, `highest_hp_ally` logic using reversed comparators.
  - `src/engine/skill-registry.ts` -- Add `defaultTarget` and `defaultCriterion` to `SkillDefinition` and all registry entries. Update `getDefaultSkills()` and `createSkillFromDefinition()` to set `target` and `criterion` on created Skills.
  - `src/engine/game-test-helpers.ts` -- `createSkill()` adds `target` and `criterion` with defaults derived from `selectorOverride` if present
  - `src/stores/gameStore-test-helpers.ts` -- Same
- **Why now**: Adding the new target/criterion infrastructure alongside the existing selector lets both coexist. No existing code breaks because `evaluateSelector()` is still used by the decision engine.
- **Tests affected**: None break. New selector tests (furthest, highest_hp) will be added.

---

### Step 4: Rename `mode` to `behavior` (universal)

- **Files**:
  - `src/engine/types.ts` -- Remove `mode?: "towards" | "away"`, add `behavior: string` (required field, not optional)
  - `src/engine/skill-registry.ts` -- Remove `mode` from `SkillDefinition`, add `behaviors: string[]` and `defaultBehavior: string`. Update all registry entries and factory functions.
  - `src/engine/game-actions.ts` -- `createSkillAction()`: replace `skill.mode!` with `skill.behavior` (cast to `"towards" | "away"` for `computeMoveDestination` call)
  - `src/engine/game-movement.ts` -- No change (still accepts `mode: "towards" | "away"` parameter; the cast happens in the caller)
  - `src/engine/game-decisions.ts` -- Replace `(skill.mode as string) === "hold"` with `(skill.behavior as string) === "hold"` for legacy check
  - `src/engine/game-test-helpers.ts` -- `createSkill()`: replace `mode` with `behavior`. Default to `""` for non-move skills, pass through existing `mode` values as `behavior`.
  - `src/stores/gameStore-test-helpers.ts` -- Same
  - `src/components/RuleEvaluations/rule-evaluations-formatters.ts` -- Replace `action.skill.mode` with `action.skill.behavior`
  - `src/components/InventoryPanel/InventoryPanel.tsx` -- Replace `skill.mode` with registry lookup for display
- **Why now**: With `actionType` in place (Step 2), `mode` is no longer used for action type inference. Safe to rename.
- **Tests affected**: **All tests that reference `mode`** (~39 occurrences across 16 files). This is a mechanical find-replace of `mode:` to `behavior:` in test skill creation. Test helpers handle the default so most tests that don't set `mode` explicitly are unaffected.
- **Migration**: Test helpers change `mode` parameter to `behavior`. Since both helpers default `mode` to `undefined`, and the new field defaults `behavior` to `""`, tests that don't set mode explicitly continue to work. Tests that do set `mode: "towards"` change to `behavior: "towards"`.

---

### Step 5: Switch decision engine from `evaluateSelector` to `evaluateTargetCriterion`

- **Files**:
  - `src/engine/game-decisions.ts` -- Replace `evaluateSelector(selector, ...)` calls with `evaluateTargetCriterion(skill.target, skill.criterion, ...)`. Remove `DEFAULT_SELECTOR` constant, replace with `DEFAULT_TARGET` and `DEFAULT_CRITERION`.
  - `src/engine/game-decisions.ts` -- `evaluateSkillsForCharacter()` same change
  - `src/stores/gameStore-selectors.ts` -- `selectMovementTargetData`: replace `moveSkill.selectorOverride` with `evaluateTargetCriterion(moveSkill.target, moveSkill.criterion, ...)`
  - `src/engine/types.ts` -- Remove `selectorOverride` from `Skill` interface. Remove `Selector` interface.
  - `src/engine/selectors.ts` -- Remove `evaluateSelector()`. Keep `evaluateTargetCriterion()`.
- **Why now**: Both selector systems coexisted in Step 3. Now switch all consumers to the new system and remove the old.
- **Tests affected**: **All tests that reference `selectorOverride`** (~120 occurrences across 24 files). Replace `selectorOverride: { type: "nearest_enemy" }` with `target: "enemy", criterion: "nearest"`. This is a mechanical replacement. Test helpers handle the default.
- **Migration**: Test helpers change `selectorOverride` parameter to `target` + `criterion`. Default values: `target: "enemy"`, `criterion: "nearest"` (matching the old DEFAULT_SELECTOR).

---

### Step 6: Universal skill duplication

- **Files**:
  - `src/stores/gameStore.ts` -- `duplicateSkill()`: Remove `sourceSkill.mode === undefined` guard. Replace `moveCount >= MAX_MOVE_INSTANCES` with registry lookup of `maxInstances`. Replace hardcoded `mode: "towards"` with `behavior: def.defaultBehavior`.
  - `src/stores/gameStore.ts` -- `removeSkillFromCharacter()`: Replace `mode !== undefined` innate-Move protection with `actionType === "move"` or registry `innate` check combined with instance count.
  - `src/stores/gameStore-constants.ts` -- Remove `MAX_MOVE_INSTANCES` constant.
  - `src/engine/skill-registry.ts` -- Add `getSkillDefinition(id: string): SkillDefinition | undefined` helper for registry lookup.
- **Why now**: Depends on Step 4 (`behavior` field) and Step 1 (`actionType` field). The duplication logic must reference registry `maxInstances` instead of hardcoded move limits.
- **Tests affected**:
  - `src/stores/gameStore-skills-duplication.test.ts` -- Update `mode`-based checks to `behavior`-based. Add tests for non-Move skill duplication (designed in test-designs.md).
  - `src/components/SkillsPanel/SkillsPanel.test.tsx` -- Update duplicate button conditions

---

### Step 7: Update SkillsPanel UI

- **Files**:
  - `src/components/SkillsPanel/SkillsPanel.tsx`:
    - Replace `decomposeSelector`/`composeSelector` with direct `skill.target`/`skill.criterion` reads
    - Replace `isMove = skill.mode !== undefined` with `skill.actionType === "move"` or `skill.behaviors.length > 0` check from registry
    - Replace `handleModeChange` with `handleBehaviorChange` using `updateSkill(charId, instanceId, { behavior: value })`
    - Show behavior dropdown when registry `behaviors.length > 1` (not just for Move)
    - Replace `moveCount < MAX_MOVE_INSTANCES` with registry `maxInstances` check for duplicate button
    - Add "furthest" and "highest_hp" to criterion dropdown
    - Remove `decomposeSelector` and `composeSelector` functions entirely
  - `src/components/SkillsPanel/SkillsPanel.tsx` -- Import `getSkillDefinition` from registry for `behaviors` and `maxInstances` lookup
  - `src/stores/gameStore-constants.ts` -- `MAX_MOVE_INSTANCES` already removed in Step 6
- **Why now**: Final consumer of old `mode`/`selectorOverride` patterns. All engine logic already migrated.
- **Tests affected**:
  - `src/components/SkillsPanel/SkillsPanel.test.tsx` -- Update selector-related tests to use target/criterion. Update mode tests to behavior. Add tests for new criterion options.

---

### Step 8: Cleanup and documentation

- **Files**:
  - `src/engine/selectors.ts` -- Verify `evaluateSelector()` is removed (done in Step 5). Clean up any unused imports.
  - `src/engine/types.ts` -- Verify `Selector` interface is removed (done in Step 5). Verify `mode` is removed (done in Step 4).
  - `.docs/spec.md` -- Update "Targeting System" section: document Target + Criterion model, add furthest and highest_hp selectors. Update "Starting Skills" section: document behaviors field.
  - `.docs/architecture.md` -- Update skill system description if needed.
  - `.docs/decisions/adr-011-explicit-action-type.md` -- Create new ADR for the actionType decision.
- **Why now**: All code changes are complete and tests pass.
- **Tests affected**: None.

## 4. UI Changes Summary

### SkillsPanel (`src/components/SkillsPanel/SkillsPanel.tsx`)

| Current                                     | After                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `decomposeSelector()` / `composeSelector()` | Removed -- direct `skill.target` / `skill.criterion` access                                    |
| Target dropdown: enemy, ally, self          | Same (reads `skill.target`)                                                                    |
| Strategy dropdown: nearest, lowest_hp       | Criterion dropdown: nearest, furthest, lowest_hp, highest_hp                                   |
| Mode dropdown: towards, away (Move only)    | Behavior dropdown: dynamic from registry `behaviors` array (shown when `behaviors.length > 1`) |
| `isMove = skill.mode !== undefined`         | `const def = getSkillDefinition(skill.id)` for behaviors/maxInstances                          |
| `moveCount < MAX_MOVE_INSTANCES`            | `instanceCount < def.maxInstances` (universal)                                                 |
| `MAX_MOVE_INSTANCES` import                 | Removed                                                                                        |

### InventoryPanel (`src/components/InventoryPanel/InventoryPanel.tsx`)

| Current                        | After       |
| ------------------------------ | ----------- | ------------------------------ | -------------------------------------------- |
| `skill.mode !== undefined && " | Mode: ..."` | `def.behaviors.length > 0 && " | Behavior: ..."` (or display defaultBehavior) |

### RuleEvaluations formatters (`src/components/RuleEvaluations/rule-evaluations-formatters.ts`)

| Current                                        | After                                                  |
| ---------------------------------------------- | ------------------------------------------------------ |
| `action.skill.mode`                            | `action.skill.behavior`                                |
| Check `mode === "towards"` / `mode === "away"` | Check `behavior === "towards"` / `behavior === "away"` |

## 5. Test Strategy

### Tests that need mechanical updates (find-replace)

These tests reference `mode` or `selectorOverride` in their test data and need value substitution but no logic changes:

| Pattern                             | Count | Replacement                   |
| ----------------------------------- | ----- | ----------------------------- |
| `mode: "towards"`                   | ~20   | `behavior: "towards"`         |
| `mode: "away"`                      | ~10   | `behavior: "away"`            |
| `selectorOverride: { type: "X_Y" }` | ~120  | `target: "Y", criterion: "X"` |
| `skill.mode !== undefined`          | ~5    | `skill.actionType === "move"` |

### Tests that need logic changes

| Test File                                      | Change                                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `game-decisions-action-type-inference.test.ts` | Remove "throw for both" and "throw for neither" tests. Add tests for `actionType` field being respected. |
| `gameStore-skills-duplication.test.ts`         | Replace Move-specific guard tests with universal maxInstances tests. Add non-Move duplication tests.     |
| `SkillsPanel.test.tsx`                         | Update selector tests to target/criterion. Update duplicate button tests for universal duplication.      |

### Tests that remain unchanged

- All selector logic tests (`selectors-nearest-enemy.test.ts`, etc.) -- the underlying comparison functions don't change; only the entry point function name changes
- Pathfinding tests
- Hex grid tests
- Combat/healing resolution tests
- Collision resolution tests
- Trigger evaluation tests

### New tests needed

- Mirror selectors: `furthest_enemy`, `furthest_ally`, `highest_hp_enemy`, `highest_hp_ally` with tiebreaking
- `evaluateTargetCriterion()` with all 12 target+criterion combinations
- `self` target ignoring criterion
- Non-Move skill duplication with `maxInstances`
- `maxInstances: 1` preventing duplication
- Behavior dropdown visibility (UI test: shown only when `behaviors.length > 1`)
- `getActionType()` reading from `actionType` field

## 6. Migration Path (Tests Passing at Each Step)

| Step | What Changes                                               | Tests Status                                                     |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Add `actionType` (additive)                                | All pass (new field, not read yet)                               |
| 2    | Switch `getActionType()`                                   | 2 obsolete tests removed, 2+ new tests added. All others pass.   |
| 3    | Add target/criterion alongside selector (additive)         | All pass (new fields, not read by engine yet)                    |
| 4    | Rename mode -> behavior                                    | ~30 test files updated mechanically. All pass after rename.      |
| 5    | Switch engine to target/criterion, remove selectorOverride | ~24 test files updated mechanically. All pass after replacement. |
| 6    | Universal duplication                                      | ~3 test files updated. All pass.                                 |
| 7    | Update UI components                                       | ~3 test files updated. All pass.                                 |
| 8    | Cleanup + docs                                             | No test changes. All pass.                                       |

**Critical**: Steps 4 and 5 are the highest-risk steps due to volume of mechanical test changes. These should be done as complete sweeps (every reference in every file) to avoid partial migration states.

## 7. Risk Mitigation

### Risk 1: Large mechanical test changes (Steps 4, 5)

**Mitigation**: The test helpers (`createSkill()` in both `game-test-helpers.ts` and `gameStore-test-helpers.ts`) handle defaults. When we rename `mode` to `behavior` in the helper, most tests that don't explicitly set `mode` continue to work without changes. Only tests that explicitly pass `mode: "towards"` or `mode: "away"` need updating.

For `selectorOverride`, the helper defaults to `undefined` (currently) and will default to `target: "enemy", criterion: "nearest"` (matching the old `DEFAULT_SELECTOR`). Tests that don't set `selectorOverride` explicitly are unaffected.

### Risk 2: `computeMoveDestination` type mismatch

**Mitigation**: `computeMoveDestination()` still accepts `mode: "towards" | "away"` as its parameter type. In `createSkillAction()`, we cast `skill.behavior as "towards" | "away"` when calling it for Move skills. This is safe because the registry constrains Move's `behaviors` to `["towards", "away"]`. A runtime assertion could be added if desired.

### Risk 3: `Selector` type used in imports across many files

**Mitigation**: In Step 3, we add the new types alongside `Selector`. In Step 5, we remove `Selector` and update all imports. The TypeScript compiler will catch any missed import -- this is a compile-time-safe change.

### Risk 4: `self` target edge cases

**Mitigation**: When `target === "self"`, `criterion` is ignored. The `evaluateTargetCriterion()` function short-circuits for `self` and returns the evaluator regardless of criterion. UI disables criterion dropdown when target is "self" (existing behavior preserved).

### Risk 5: Breaking game logic during transition

**Mitigation**: Steps are sequenced so that at each point, exactly one system is active:

- Steps 1-2: `actionType` replaces inference, but `mode`/`damage`/`healing` are still present as data
- Steps 3-5: `target`+`criterion` replaces `selectorOverride`, with a coexistence window
- Step 6: Duplication uses `maxInstances` from registry instead of hardcoded constant
- No step removes an old mechanism before the new one is fully wired

### Risk 6: SkillsPanel `composeSelector` validation

**Mitigation**: `composeSelector()` currently validates composed selector strings against a whitelist. This function is removed entirely in Step 7 because the data model no longer composes strings -- `target` and `criterion` are stored directly. No validation needed because the dropdown options map directly to the type union values.

## 8. File Change Summary

### Modified files (by step)

| File                                                            | Steps                                     |
| --------------------------------------------------------------- | ----------------------------------------- | -------- |
| `src/engine/types.ts`                                           | 1, 3, 4, 5                                |
| `src/engine/skill-registry.ts`                                  | 1, 3, 4, 6                                |
| `src/engine/game-actions.ts`                                    | 2, 4                                      |
| `src/engine/selectors.ts`                                       | 3, 5                                      |
| `src/engine/game-decisions.ts`                                  | 4, 5                                      |
| `src/engine/game-movement.ts`                                   | (none -- parameter stays `mode: "towards" | "away"`) |
| `src/engine/game-test-helpers.ts`                               | 1, 3, 4, 5                                |
| `src/stores/gameStore.ts`                                       | 6                                         |
| `src/stores/gameStore-constants.ts`                             | 6                                         |
| `src/stores/gameStore-selectors.ts`                             | 5                                         |
| `src/stores/gameStore-test-helpers.ts`                          | 1, 3, 4, 5                                |
| `src/components/SkillsPanel/SkillsPanel.tsx`                    | 7                                         |
| `src/components/InventoryPanel/InventoryPanel.tsx`              | 7                                         |
| `src/components/RuleEvaluations/rule-evaluations-formatters.ts` | 4                                         |
| ~30 test files                                                  | 4, 5 (mechanical)                         |
| `.docs/spec.md`                                                 | 8                                         |

### New files

| File                                              | Step |
| ------------------------------------------------- | ---- |
| `.docs/decisions/adr-011-explicit-action-type.md` | 8    |

### Deleted constants

| Constant              | Location                 | Step |
| --------------------- | ------------------------ | ---- |
| `MAX_MOVE_INSTANCES`  | `gameStore-constants.ts` | 6    |
| `Selector` interface  | `types.ts`               | 5    |
| `evaluateSelector()`  | `selectors.ts`           | 5    |
| `decomposeSelector()` | `SkillsPanel.tsx`        | 7    |
| `composeSelector()`   | `SkillsPanel.tsx`        | 7    |

## 9. Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` -- Skill Categories (Attack/Heal/Move) map to `actionType`. Targeting selectors expanded with furthest and highest_hp per acceptance criteria.
- [x] Approach consistent with `.docs/architecture.md` -- Data-driven targeting (declarative `target` + `criterion`), centralized registry (ADR-005), pure engine logic.
- [x] Patterns follow `.docs/patterns/index.md` -- No new UI patterns introduced; existing dropdown patterns preserved.
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-005 (centralized registry) reinforced. ADR-009 (instance identity) preserved. New ADR-011 proposed.
