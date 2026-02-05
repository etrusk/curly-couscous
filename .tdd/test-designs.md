# Test Designs: Skill System Refactor

## Test Updates (Existing Tests to Modify)

This section maps each plan step to the existing test files that need changes and specifies exactly what changes are needed.

---

### Step 1: Add `actionType` to SkillDefinition and Skill

**No existing tests break.** The `actionType` field is additive. Test helpers gain backward-compatible defaults.

#### File: `src/engine/game-test-helpers.ts`

- **Update**: `createSkill()` adds `actionType` field with inference default
- **Change**: Add line after healing: `actionType: overrides.actionType ?? (overrides.damage !== undefined ? "attack" : overrides.healing !== undefined ? "heal" : overrides.mode !== undefined ? "move" : "attack")`
- **Reason**: Backward compat -- all existing callers that do not pass `actionType` get a sensible default inferred from existing fields

#### File: `src/stores/gameStore-test-helpers.ts`

- **Update**: Same as above
- **Reason**: Same backward-compat logic

#### File: `src/engine/game-test-helpers.ts` (`createMoveAction`, `createAttackAction`, `createHealAction`)

- **Update**: Inner `createSkill()` calls inherit `actionType` via the default inference
- **Reason**: No explicit change needed since the inference handles it

---

### Step 2: Switch `getActionType()` to use `actionType` field

#### File: `src/engine/game-decisions-action-type-inference.test.ts`

- **Update 1**: Test "should create attack action for skill with damage" (line 14-39)
  - Add `actionType: "attack"` to the createSkill call (currently relies on inference from `damage`)
  - Assertion unchanged: `expect(decisions[0]!.action.type).toBe("attack")`
  - **Reason**: Test now verifies that `actionType` field is respected, not that damage triggers inference

- **Update 2**: Test "should create move action for skill with mode" (line 41-66)
  - Add `actionType: "move"` to the createSkill call
  - Assertion unchanged: `expect(decisions[0]!.action.type).toBe("move")`
  - **Reason**: Same -- field-based, not inference-based

- **Update 3**: Test "should throw for skill with both damage and mode" (line 68-94)
  - **DELETE** this test entirely
  - **Reason**: With explicit `actionType`, the mutual-exclusion runtime validation is removed. TypeScript compile-time safety replaces it.

- **Update 4**: Test "should throw for skill with neither damage nor mode" (line 96-115)
  - **DELETE** this test entirely
  - **Reason**: Same as above -- `actionType` is always present, so "neither" is impossible

- **Keep**: Both tick-resolution tests (lines 118-180) are unaffected

---

### Step 3: Add `target` + `criterion` alongside `selectorOverride`

**No existing tests break.** Fields are additive. Test helpers gain backward-compatible defaults.

#### File: `src/engine/game-test-helpers.ts`

- **Update**: `createSkill()` adds `target` and `criterion` with defaults derived from `selectorOverride`
- **Change**: Add `target: overrides.target ?? "enemy"` and `criterion: overrides.criterion ?? "nearest"`
- **Reason**: Defaults match the old `DEFAULT_SELECTOR` of `nearest_enemy`

#### File: `src/stores/gameStore-test-helpers.ts`

- **Update**: Same as above
- **Reason**: Same defaults

---

### Step 4: Rename `mode` to `behavior` (universal)

This is the highest-volume mechanical change. All test files that reference `mode` need updating.

#### File: `src/engine/game-test-helpers.ts`

- **Update**: `createSkill()` replaces `mode: overrides.mode` with `behavior: overrides.behavior ?? ""`
- **Update**: `createMoveAction()` replaces `mode: "towards"` with `behavior: "towards"`
- **Reason**: Field rename

#### File: `src/stores/gameStore-test-helpers.ts`

- **Update**: `createSkill()` replaces `mode: overrides.mode ?? undefined` with `behavior: overrides.behavior ?? ""`
- **Reason**: Field rename. Default changes from `undefined` to `""` (empty string sentinel for non-move skills)

#### Files with mechanical `mode:` to `behavior:` replacements (18 files, ~96 occurrences):

| Test File                                                          | Occurrences | Change                                                |
| ------------------------------------------------------------------ | ----------- | ----------------------------------------------------- |
| `src/engine/game-decisions-action-type-inference.test.ts`          | 2           | `mode: "towards"` -> `behavior: "towards"`            |
| `src/engine/game-decisions-move-destination-basic.test.ts`         | 5           | Same                                                  |
| `src/engine/game-decisions-move-destination-wall-boundary.test.ts` | 15          | Same                                                  |
| `src/engine/game-decisions-evaluate-skills.test.ts`                | 4           | Same (including `mode: "hold"` -> `behavior: "hold"`) |
| `src/engine/game-decisions-skill-priority.test.ts`                 | 18          | Same                                                  |
| `src/engine/game-healing-integration.test.ts`                      | 4           | Same                                                  |
| `src/engine/game-integration.test.ts`                              | 1           | Same                                                  |
| `src/engine/game-core-process-tick-resolution-order.test.ts`       | 1           | Same                                                  |
| `src/stores/gameStore-reset.test.ts`                               | 1           | Same                                                  |
| `src/stores/gameStore-selectors-faction-skills.test.ts`            | 2           | Same                                                  |
| `src/stores/gameStore-selectors-intent-filter.test.ts`             | 1           | Same                                                  |
| `src/stores/gameStore-selectors-intent-ticks.test.ts`              | 3           | Same                                                  |
| `src/stores/gameStore-selectors-movement-intent.test.ts`           | 5           | Same                                                  |
| `src/stores/gameStore-selectors-movement-target.test.ts`           | 8           | Same                                                  |
| `src/stores/gameStore-selectors-intent-preview.test.ts`            | 7           | Same                                                  |
| `src/stores/gameStore-skills-faction-exclusivity.test.ts`          | 1           | Same                                                  |
| `src/stores/gameStore-skills-duplication.test.ts`                  | 16          | Same                                                  |
| `src/stores/gameStore-skills.test.ts`                              | 2           | Same                                                  |

#### File: `src/engine/skill-registry.test.ts`

- **Update 1**: Test "attack skills have damage" (line 47-56)
  - Replace `expect(lightPunch?.mode).toBeUndefined()` -> `expect(lightPunch?.behaviors).toEqual([])`
  - Replace `expect(heavyPunch?.mode).toBeUndefined()` -> `expect(heavyPunch?.behaviors).toEqual([])`
- **Update 2**: Test "move skill has mode" (line 58-63)
  - Rename test to "move skill has behaviors"
  - Replace `expect(moveSkill?.mode).toBe("towards")` -> `expect(moveSkill?.behaviors).toEqual(["towards", "away"])`
  - Replace `expect(moveSkill?.damage).toBeUndefined()` -> keep as-is
- **Update 3**: Test "heal skill has healing and no damage" (line 75-84)
  - Replace `expect(heal?.mode).toBeUndefined()` -> `expect(heal?.behaviors).toEqual([])`
- **Update 4**: Test "preserves intrinsic properties for innate skills" (line 126-138)
  - Replace `expect(move.mode).toBe("towards")` -> `expect(move.behavior).toBe("towards")`
- **Update 5**: Test "creates move skill with direction in name" (line 178-185)
  - Replace `expect(skill.mode).toBe("towards")` -> `expect(skill.behavior).toBe("towards")`
- **Update 6**: Test "adds behavioral fields to innate skills" (line 112-124)
  - Replace `expect(skill.selectorOverride?.type).toBe("nearest_enemy")` with `expect(skill.target).toBe("enemy")` and `expect(skill.criterion).toBe("nearest")` (this actually bridges Steps 4 and 5, done at Step 5)

#### File: `src/components/SkillsPanel/SkillsPanel.test.tsx`

- **Update**: All `mode: "towards"` / `mode: "away"` -> `behavior: "towards"` / `behavior: "away"` (~15 occurrences in Move Skill Duplication UI and Mode Dropdown sections)
- **Update**: `screen.getByRole("combobox", { name: /mode/i })` -> `screen.getByRole("combobox", { name: /behavior/i })` (if the UI label changes from "Mode" to "Behavior")
  - **Note**: The plan says the UI dropdown is shown dynamically from registry `behaviors` array. If the label changes from "Mode" to "Behavior", all `name: /mode/i` queries must change. If the label stays "Mode" for user-facing text, no query change needed. **Decision**: The plan renames the field but the UI label should remain as-is for user familiarity; the coder should verify the actual label used.
- **Update**: `expect(updatedSkill?.mode).toBe("away")` -> `expect(updatedSkill?.behavior).toBe("away")` (lines 987, 1506, 1508)

---

### Step 5: Switch engine from `evaluateSelector` to `evaluateTargetCriterion`; remove `selectorOverride`

#### Files with mechanical `selectorOverride` to `target`+`criterion` replacements:

| Test File                                                                 | Occurrences | Change Pattern                                                                                                                                   |
| ------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/engine/game-healing-integration.test.ts`                             | 9           | `selectorOverride: { type: "lowest_hp_ally" }` -> `target: "ally", criterion: "lowest_hp"`                                                       |
| `src/engine/skill-registry.test.ts`                                       | 4           | `expect(skill.selectorOverride?.type).toBe("nearest_enemy")` -> `expect(skill.target).toBe("enemy")` + `expect(skill.criterion).toBe("nearest")` |
| `src/engine/game-decisions-skill-priority.test.ts`                        | 4           | Same pattern                                                                                                                                     |
| `src/engine/game-core-process-tick-combat-movement.test.ts`               | 2           | Same pattern                                                                                                                                     |
| `src/engine/game-core-process-tick-resolution-order.test.ts`              | 2           | Same pattern                                                                                                                                     |
| `src/stores/gameStore-selectors-movement-target.test.ts`                  | 6           | Same pattern                                                                                                                                     |
| `src/stores/gameStore-skills-duplication.test.ts`                         | 2           | Same pattern                                                                                                                                     |
| `src/stores/gameStore-skills.test.ts`                                     | 3           | Same pattern                                                                                                                                     |
| `src/components/SkillsPanel/SkillsPanel.test.tsx`                         | 31          | Same pattern                                                                                                                                     |
| `src/components/BattleViewer/TargetingLineOverlay.test.tsx`               | 1           | Same pattern                                                                                                                                     |
| `src/components/BattleViewer/battle-viewer-tooltip.test.tsx`              | 1           | Same pattern                                                                                                                                     |
| `src/components/BattleViewer/CharacterTooltip.test.tsx`                   | 3           | Same pattern                                                                                                                                     |
| `src/components/PlayControls/PlayControls.test.tsx`                       | 1           | Same pattern                                                                                                                                     |
| `src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx` | 18          | Same pattern                                                                                                                                     |
| `src/components/RuleEvaluations/rule-evaluations-action-summary.test.tsx` | 13          | Same pattern                                                                                                                                     |

**Detailed SkillsPanel changes** (most impacted file):

- **Helper function tests** (lines 304-390): `decomposeSelector`/`composeSelector` tests are **DELETED entirely** -- these functions no longer exist
- **UI Rendering tests** (lines 392-491): Target/criterion dropdowns remain, but data source changes:
  - `selectorOverride: { type: "lowest_hp_ally" }` -> `target: "ally", criterion: "lowest_hp"`
  - `selectorOverride: { type: "nearest_enemy" }` -> `target: "enemy", criterion: "nearest"`
  - Strategy dropdown label may change from "Selection Strategy" to "Criterion" (coder to verify)
- **Disabled State tests** (lines 494-545):
  - `selectorOverride: { type: "self" }` -> `target: "self", criterion: "nearest"` (criterion ignored for self)
  - `selectorOverride: { type: "nearest_enemy" }` -> `target: "enemy", criterion: "nearest"`
- **User Interaction tests** (lines 547-801):
  - All `expect(updatedSkill?.selectorOverride?.type).toBe(...)` -> split into `expect(updatedSkill?.target).toBe(...)` and `expect(updatedSkill?.criterion).toBe(...)`
  - `expect(updatedSkill?.selectorOverride).toEqual({ type: "nearest_ally" })` -> `expect(updatedSkill?.target).toBe("ally")` + `expect(updatedSkill?.criterion).toBe("nearest")`
- **Backward Compatibility tests** (lines 804-933):
  - Same mechanical replacement pattern
  - "default selector displays correctly when undefined" test: change to verify defaults `target: "enemy"` and `criterion: "nearest"` (these are now always present, never undefined)

#### File: `src/engine/selectors-*.test.ts` (7 files)

- **Update**: `evaluateSelector(selector, evaluator, allCharacters)` -> `evaluateTargetCriterion(target, criterion, evaluator, allCharacters)`
- **Update**: `const selector: Selector = { type: "nearest_enemy" }` -> `const target: Target = "enemy"` + `const criterion: Criterion = "nearest"`
- **Update**: Import changes: `import { evaluateSelector } from "./selectors"` -> `import { evaluateTargetCriterion } from "./selectors"`
- **Update**: Import changes: `import { Selector } from "./types"` -> `import { Target, Criterion } from "./types"`
- **Reason**: Function signature change, but behavior unchanged. These are mechanical updates.

---

### Step 6: Universal skill duplication

#### File: `src/stores/gameStore-skills-duplication.test.ts`

- **Update 1**: Test "rejects non-move skills" (line 152-167)
  - **RENAME** to "respects maxInstances: 1 for non-duplicatable skills"
  - Keep the same test body but update the justification comment
  - **Note**: After Step 6, skills with `maxInstances: 1` (like light-punch) still cannot be duplicated. The test remains valid but the reason changes from "rejects non-move" to "maxInstances is 1".

- **Update 2**: Test "new instance has default config" (line 69-90)
  - Replace `expect(newSkill?.mode).toBe("towards")` -> `expect(newSkill?.behavior).toBe("towards")`
  - Replace `expect(newSkill?.selectorOverride).toEqual({ type: "nearest_enemy" })` -> `expect(newSkill?.target).toBe("enemy")` + `expect(newSkill?.criterion).toBe("nearest")`
  - **Reason**: Field renames from Steps 4-5

- **Update 3**: Test "enforces max 3 move instances" (line 92-120)
  - Test remains valid -- Move's `maxInstances` is 3 in the registry
  - **Reason**: Same limit, now driven by registry instead of hardcoded constant

---

### Step 7: Update SkillsPanel UI

#### File: `src/components/SkillsPanel/SkillsPanel.test.tsx`

- **Update 1**: "strategy dropdown shows all options" (line 471-491)
  - Add assertions for the two new criterion options: `furthest` and `highest_hp`
  - `expect(screen.getByRole("option", { name: /^furthest$/i })).toBeInTheDocument()`
  - `expect(screen.getByRole("option", { name: /^highest hp$/i })).toBeInTheDocument()`

- **Update 2**: "duplicate button not visible for non-move skills" (line 1297-1312)
  - This test may need updating depending on whether `maxInstances > 1` now applies to other skills. Per the plan, Light Punch has `maxInstances: 1`, so this test remains valid for light-punch. But the assertion text might change.

- **Update 3**: Move-specific detection changes:
  - `skill.mode !== undefined` checks in tests change to `skill.actionType === "move"` or registry lookup
  - Already handled by Steps 4-5 mechanical replacements

---

### Step 8: Cleanup and documentation

**No test changes needed.**

---

## New Tests

### 1. Action Type Field Tests

#### Test: getActionType reads actionType field directly

- **File**: `src/engine/game-decisions-action-type-inference.test.ts`
- **Type**: unit
- **Verifies**: `getActionType()` returns the `actionType` field value without inference
- **Setup**: Create skill with `actionType: "attack"`, no `damage` field
- **Assertions**:
  1. `getActionType(skill)` returns `"attack"` when `actionType` is `"attack"`
  2. `getActionType(skill)` returns `"move"` when `actionType` is `"move"`
  3. `getActionType(skill)` returns `"heal"` when `actionType` is `"heal"`
- **Justification**: Replaces the deleted inference tests. Verifies that the new field-based approach works correctly and that payload fields (damage/healing) no longer affect action type determination.

#### Test: actionType propagated from registry to Skill instances

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `createSkillFromDefinition()` propagates `actionType` from SkillDefinition to Skill
- **Setup**: Get each SkillDefinition from registry, call `createSkillFromDefinition()`
- **Assertions**:
  1. Light Punch skill instance has `actionType: "attack"`
  2. Heavy Punch skill instance has `actionType: "attack"`
  3. Move skill instance has `actionType: "move"`
  4. Heal skill instance has `actionType: "heal"`
- **Justification**: Ensures the registry-to-instance pipeline preserves the new field. Prevents regression where `actionType` could be lost during skill creation.

#### Test: registry entries all have actionType

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Every entry in `SKILL_REGISTRY` has a valid `actionType` field
- **Setup**: Iterate `SKILL_REGISTRY`
- **Assertions**:
  1. Every skill has `actionType` field
  2. `actionType` is one of `"attack" | "move" | "heal"`
  3. Light Punch and Heavy Punch have `actionType: "attack"`
  4. Move has `actionType: "move"`
  5. Heal has `actionType: "heal"`
- **Justification**: Registry is the single source of truth (ADR-005). Verifying its shape prevents silent data corruption.

---

### 2. Mirror Selector Tests

#### Test: furthest enemy basic selection

- **File**: `src/engine/selectors-furthest.test.ts` (NEW FILE)
- **Type**: unit
- **Verifies**: `evaluateTargetCriterion("enemy", "furthest", evaluator, allCharacters)` returns the enemy at maximum hex distance
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, faction friendly
  - Enemy A at `{q: 0, r: 2}` (distance 2)
  - Enemy B at `{q: 3, r: 0}` (distance 3)
- **Assertions**:
  1. Returns Enemy B (distance 3 > distance 2)
- **Justification**: Core new selector that mirrors `nearest`. Must verify basic distance maximization works.

#### Test: furthest enemy ignores allies

- **File**: `src/engine/selectors-furthest.test.ts`
- **Type**: unit
- **Verifies**: Ally characters are filtered out when using `target: "enemy"` with `criterion: "furthest"`
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, faction friendly
  - Ally at `{q: 0, r: 5}` (distance 5, same faction)
  - Enemy at `{q: 0, r: 2}` (distance 2, opposite faction)
- **Assertions**:
  1. Returns the enemy, not the further ally
- **Justification**: Ensures faction filtering applies correctly to the new criterion.

#### Test: furthest enemy tiebreaking by lower R then lower Q

- **File**: `src/engine/selectors-furthest.test.ts`
- **Type**: unit
- **Verifies**: When multiple enemies share the maximum distance, tiebreaker uses lower R, then lower Q
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, faction friendly
  - Enemy A at `{q: 1, r: -1}` (distance 1, R=-1)
  - Enemy B at `{q: -1, r: 1}` (distance 1, R=1)
- **Assertions**:
  1. Returns Enemy A (R=-1 < R=1)
- **Justification**: Tiebreaking consistency with existing selectors (spec Section 6.2). Without this test, ties could produce nondeterministic behavior.

#### Test: furthest enemy three-way tie

- **File**: `src/engine/selectors-furthest.test.ts`
- **Type**: unit
- **Verifies**: Three enemies at equal max distance resolve via R then Q tiebreak
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`
  - Enemy A at `{q: 0, r: -1}` (dist 1, R=-1)
  - Enemy B at `{q: 1, r: 0}` (dist 1, R=0)
  - Enemy C at `{q: -1, r: 0}` (dist 1, R=0, Q=-1)
- **Assertions**:
  1. Returns Enemy A (lowest R=-1)
- **Justification**: Multi-way ties must be deterministic for replay consistency.

#### Test: furthest enemy returns null when no enemies

- **File**: `src/engine/selectors-furthest.test.ts`
- **Type**: unit
- **Verifies**: Returns null when no enemies exist
- **Setup**: Evaluator + ally only, no enemies
- **Assertions**:
  1. Returns null
- **Justification**: Edge case -- prevents runtime errors on empty candidate sets.

#### Test: furthest ally basic selection

- **File**: `src/engine/selectors-furthest.test.ts`
- **Type**: unit
- **Verifies**: `evaluateTargetCriterion("ally", "furthest", evaluator, allCharacters)` returns the furthest ally (excluding self)
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, faction friendly
  - Ally A at `{q: 0, r: 1}` (distance 1)
  - Ally B at `{q: 0, r: 3}` (distance 3)
  - Enemy at `{q: 0, r: 5}` (distance 5, opposite faction)
- **Assertions**:
  1. Returns Ally B (distance 3, excludes self and enemies)
- **Justification**: Ally targeting with furthest criterion is a new combination. Must verify self-exclusion and faction filtering.

#### Test: furthest ally excludes self

- **File**: `src/engine/selectors-furthest.test.ts`
- **Type**: unit
- **Verifies**: Evaluator is not returned as a candidate for `ally` + `furthest`
- **Setup**: Evaluator alone, no other allies
- **Assertions**:
  1. Returns null
- **Justification**: Self-exclusion is critical for ally selectors. Without this, a character could target itself when it should find no valid target.

#### Test: highest_hp enemy basic selection

- **File**: `src/engine/selectors-highest-hp.test.ts` (NEW FILE)
- **Type**: unit
- **Verifies**: `evaluateTargetCriterion("enemy", "highest_hp", evaluator, allCharacters)` returns the enemy with maximum HP
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, faction friendly
  - Enemy A with hp 50, position `{q: 0, r: 1}`
  - Enemy B with hp 80, position `{q: 0, r: 2}`
- **Assertions**:
  1. Returns Enemy B (hp 80 > hp 50)
- **Justification**: Core new selector. Must verify HP maximization selects the healthiest target.

#### Test: highest_hp enemy tiebreaking by lower R then lower Q

- **File**: `src/engine/selectors-highest-hp.test.ts`
- **Type**: unit
- **Verifies**: When enemies share maximum HP, tiebreak uses lower R then lower Q
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`
  - Enemy A with hp 80, position `{q: -2, r: -1}` (R=-1)
  - Enemy B with hp 80, position `{q: 2, r: 1}` (R=1)
- **Assertions**:
  1. Returns Enemy A (R=-1 < R=1)
- **Justification**: Tiebreaking consistency with spec Section 6.2.

#### Test: highest_hp enemy ignores dead characters

- **File**: `src/engine/selectors-highest-hp.test.ts`
- **Type**: unit
- **Verifies**: Characters with hp <= 0 are excluded from selection
- **Setup**:
  - Enemy A with hp 0
  - Enemy B with hp 30
- **Assertions**:
  1. Returns Enemy B (Enemy A is dead)
- **Justification**: Dead character filtering must apply to all selectors. Prevents targeting corpses.

#### Test: highest_hp ally basic selection

- **File**: `src/engine/selectors-highest-hp.test.ts`
- **Type**: unit
- **Verifies**: Returns the ally with maximum HP (excluding self)
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, hp 100
  - Ally A at `{q: 0, r: 1}`, hp 60
  - Ally B at `{q: 0, r: 2}`, hp 90
- **Assertions**:
  1. Returns Ally B (hp 90 > hp 60, excludes evaluator)
- **Justification**: Ally+highest_hp is useful for skills that buff the healthiest ally. Must verify self-exclusion.

#### Test: highest_hp ally returns null when no allies

- **File**: `src/engine/selectors-highest-hp.test.ts`
- **Type**: unit
- **Verifies**: Returns null when only evaluator exists (no other allies)
- **Setup**: Evaluator alone
- **Assertions**:
  1. Returns null
- **Justification**: Edge case consistency with existing ally selectors.

---

### 3. Target + Criterion Combination Tests

#### Test: evaluateTargetCriterion handles all 12 combinations

- **File**: `src/engine/selectors-target-criterion.test.ts` (NEW FILE)
- **Type**: unit
- **Verifies**: All target+criterion combinations produce correct results
- **Setup**:
  - Evaluator (friendly) at `{q: 0, r: 0}`, hp 100
  - Ally at `{q: 0, r: 1}`, hp 60
  - Enemy near at `{q: 1, r: 0}`, hp 80
  - Enemy far at `{q: 3, r: 0}`, hp 40
- **Assertions** (one per combination):
  1. `("enemy", "nearest")` -> Enemy near
  2. `("enemy", "furthest")` -> Enemy far
  3. `("enemy", "lowest_hp")` -> Enemy far (hp 40)
  4. `("enemy", "highest_hp")` -> Enemy near (hp 80)
  5. `("ally", "nearest")` -> Ally
  6. `("ally", "furthest")` -> Ally (only one ally)
  7. `("ally", "lowest_hp")` -> Ally (only one ally)
  8. `("ally", "highest_hp")` -> Ally (only one ally)
  9. `("self", "nearest")` -> Evaluator
  10. `("self", "furthest")` -> Evaluator
  11. `("self", "lowest_hp")` -> Evaluator
  12. `("self", "highest_hp")` -> Evaluator
- **Justification**: Exhaustive coverage of the 3x4 matrix. Acceptance criterion requires all target+criterion combinations to work. This single test validates the complete combinatorial space.

#### Test: self target ignores criterion

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: When target is `"self"`, the criterion parameter is completely ignored and the evaluator is always returned
- **Setup**:
  - Evaluator at `{q: 0, r: 0}`, hp 50
  - Enemy at `{q: 0, r: 1}`, hp 10 (lower hp, nearer)
- **Assertions**:
  1. `("self", "nearest")` returns evaluator
  2. `("self", "furthest")` returns evaluator
  3. `("self", "lowest_hp")` returns evaluator
  4. `("self", "highest_hp")` returns evaluator
- **Justification**: Self-targeting is a special case documented in the plan. Must verify criterion is truly ignored, not accidentally filtering.

#### Test: evaluateTargetCriterion returns null for empty candidate set

- **File**: `src/engine/selectors-target-criterion.test.ts`
- **Type**: unit
- **Verifies**: Returns null when no valid candidates exist for the given target+criterion
- **Setup**:
  - Evaluator (friendly) alone, no enemies
- **Assertions**:
  1. `("enemy", "nearest")` returns null
  2. `("enemy", "furthest")` returns null
  3. `("enemy", "lowest_hp")` returns null
  4. `("enemy", "highest_hp")` returns null
- **Justification**: Prevents null-pointer exceptions when no targets exist. Critical for graceful idle fallback.

---

### 4. Non-Move Skill Duplication Tests

#### Test: Light Punch duplication blocked by maxInstances: 1

- **File**: `src/stores/gameStore-skills-duplication.test.ts`
- **Type**: integration
- **Verifies**: Skills with `maxInstances: 1` in the registry cannot be duplicated
- **Setup**:
  - Character with one Light Punch skill (`id: "light-punch"`)
  - Call `duplicateSkill(charId, lightPunchInstanceId)`
- **Assertions**:
  1. Character still has 1 skill
  2. No new instance was created
- **Justification**: `maxInstances: 1` must prevent duplication. This was previously blocked by `mode === undefined` guard; now it is blocked by registry lookup. Verifies the new guard mechanism works.

#### Test: Skill duplication with maxInstances: 2

- **File**: `src/stores/gameStore-skills-duplication.test.ts`
- **Type**: integration
- **Verifies**: Skills with `maxInstances > 1` can be duplicated up to the limit
- **Setup**:
  - Modify test to use a skill with `maxInstances: 2` (since current registry only has Move at 3 and others at 1, this test would need a registry override or mock. **Alternative**: Test Move at its `maxInstances: 3` limit which already works, and verify the general mechanism by testing that `maxInstances` is read from registry)
  - **Practical approach**: Test that duplicating a Move skill works up to 3 instances, then stops. Also verify via registry lookup that `maxInstances` is the controlling value.
- **Assertions**:
  1. First duplication succeeds (2 instances)
  2. Second duplication succeeds (3 instances)
  3. Third duplication blocked (still 3 instances)
- **Justification**: Verifies the registry-driven limit replaces the hardcoded `MAX_MOVE_INSTANCES` constant.

#### Test: Duplicated non-Move skill gets default config from registry

- **File**: `src/stores/gameStore-skills-duplication.test.ts`
- **Type**: integration
- **Verifies**: When a skill is duplicated, the new instance gets defaults from the registry (defaultBehavior, defaultTarget, defaultCriterion), not a copy of the source skill's config
- **Setup**:
  - Character with a Move skill configured with `behavior: "away"`, `target: "ally"`, `criterion: "lowest_hp"`, trigger `hp_below 50`
  - Duplicate the skill
- **Assertions**:
  1. New instance has `behavior: "towards"` (registry defaultBehavior)
  2. New instance has `target: "enemy"` (registry defaultTarget)
  3. New instance has `criterion: "nearest"` (registry defaultCriterion)
  4. New instance has `triggers: [{ type: "always" }]`
  5. New instance has `enabled: true`
- **Justification**: Ensures new duplicates start with registry defaults, not inheriting customized config. This is the documented behavior from the existing "new instance has default config" test, updated for new field names.

---

### 5. Registry Field Tests

#### Test: all registry entries have behaviors array

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Every `SkillDefinition` in `SKILL_REGISTRY` has a `behaviors` array and `defaultBehavior` string
- **Setup**: Iterate SKILL_REGISTRY
- **Assertions**:
  1. Every skill has `behaviors` as an array
  2. Light Punch: `behaviors: []`, `defaultBehavior: ""`
  3. Heavy Punch: `behaviors: []`, `defaultBehavior: ""`
  4. Move: `behaviors: ["towards", "away"]`, `defaultBehavior: "towards"`
  5. Heal: `behaviors: []`, `defaultBehavior: ""`
- **Justification**: Registry is the source of truth. These fields drive UI dropdown visibility and duplication default values.

#### Test: all registry entries have maxInstances

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Every `SkillDefinition` has a `maxInstances` field >= 1
- **Setup**: Iterate SKILL_REGISTRY
- **Assertions**:
  1. Light Punch: `maxInstances: 1`
  2. Heavy Punch: `maxInstances: 1`
  3. Move: `maxInstances: 3`
  4. Heal: `maxInstances: 1`
- **Justification**: `maxInstances` replaces `MAX_MOVE_INSTANCES` constant. Must verify all skills have sensible values.

#### Test: all registry entries have defaultTarget and defaultCriterion

- **File**: `src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Every `SkillDefinition` has `defaultTarget` and `defaultCriterion`
- **Setup**: Iterate SKILL_REGISTRY
- **Assertions**:
  1. Light Punch: `defaultTarget: "enemy"`, `defaultCriterion: "nearest"`
  2. Heavy Punch: `defaultTarget: "enemy"`, `defaultCriterion: "nearest"`
  3. Move: `defaultTarget: "enemy"`, `defaultCriterion: "nearest"`
  4. Heal: `defaultTarget: "ally"`, `defaultCriterion: "lowest_hp"`
- **Justification**: These fields replace `defaultSelector`. Must verify the decomposition matches the original monolithic selector values.

---

### 6. Behavior Dropdown Visibility Tests

#### Test: behavior dropdown visible when registry has multiple behaviors

- **File**: `src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: component (integration)
- **Verifies**: Behavior dropdown renders only when the skill's registry definition has `behaviors.length > 1`
- **Setup**:
  - Character with a Move skill (`behaviors: ["towards", "away"]` in registry)
- **Assertions**:
  1. A combobox labeled "behavior" (or "mode") is rendered
  2. Options include "towards" and "away"
- **Justification**: UI must dynamically show/hide the behavior dropdown based on registry data. This is the new mechanism replacing the hardcoded `mode !== undefined` check.

#### Test: behavior dropdown hidden when registry has zero behaviors

- **File**: `src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: component (integration)
- **Verifies**: Behavior dropdown is not rendered for skills with `behaviors: []` in the registry
- **Setup**:
  - Character with a Light Punch skill (`behaviors: []` in registry)
- **Assertions**:
  1. No combobox labeled "behavior" (or "mode") is rendered
- **Justification**: Non-move skills should not show behavior configuration. Mirrors existing test "should not display mode dropdown for non-Move skills" but validates via registry lookup instead of `mode !== undefined`.

---

### 7. Criterion Dropdown Expansion Tests

#### Test: criterion dropdown includes furthest option

- **File**: `src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: component (integration)
- **Verifies**: The criterion (strategy) dropdown includes the new "furthest" option
- **Setup**: Character with a skill, render SkillsPanel
- **Assertions**:
  1. `screen.getByRole("option", { name: /^furthest$/i })` is in the document
- **Justification**: Acceptance criterion requires mirror selectors to be available in the UI.

#### Test: criterion dropdown includes highest_hp option

- **File**: `src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: component (integration)
- **Verifies**: The criterion (strategy) dropdown includes the new "highest HP" option
- **Setup**: Character with a skill, render SkillsPanel
- **Assertions**:
  1. `screen.getByRole("option", { name: /^highest hp$/i })` is in the document
- **Justification**: Same as above.

#### Test: selecting furthest criterion updates skill

- **File**: `src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: component (integration)
- **Verifies**: Selecting "furthest" from the criterion dropdown updates the skill's `criterion` field in the store
- **Setup**:
  - Character with skill `target: "enemy"`, `criterion: "nearest"`
  - User selects "furthest" from criterion dropdown
- **Assertions**:
  1. `updatedSkill?.criterion` equals `"furthest"`
  2. `updatedSkill?.target` remains `"enemy"` (unchanged)
- **Justification**: End-to-end validation that new criterion values propagate through the store correctly.

#### Test: selecting highest_hp criterion updates skill

- **File**: `src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: component (integration)
- **Verifies**: Selecting "highest HP" from the criterion dropdown updates the skill's `criterion` field
- **Setup**:
  - Character with skill `target: "ally"`, `criterion: "lowest_hp"`
  - User selects "highest_hp" from criterion dropdown
- **Assertions**:
  1. `updatedSkill?.criterion` equals `"highest_hp"`
  2. `updatedSkill?.target` remains `"ally"`
- **Justification**: Same as above, for the other new criterion.

---

### 8. Integration Regression Tests

#### Test: Move skill still resolves correctly with behavior field

- **File**: `src/engine/game-decisions-move-destination-basic.test.ts` (EXISTING, verified no new tests needed)
- **Type**: integration
- **Verifies**: Existing move destination tests pass after `mode` -> `behavior` rename
- **Reason**: These tests verify `computeMoveDestination()` which still accepts `mode: "towards" | "away"` as its parameter. The cast from `behavior` to `mode` happens in `createSkillAction()`. As long as the mechanical rename is correct, no new tests are needed.

#### Test: computeDecisions uses actionType for move action creation

- **File**: `src/engine/game-decisions-action-type-inference.test.ts`
- **Type**: integration
- **Verifies**: The full decision pipeline creates correct action types using the `actionType` field
- **Setup**:
  - Character with `actionType: "move"`, `behavior: "towards"`, enemy in range
- **Assertions**:
  1. Decision action has `type: "move"`
  2. Decision action has correct `targetCell` (computed by pathfinding)
- **Justification**: End-to-end verification that `actionType` + `behavior` work together in the decision pipeline.

---

## Test File Organization

### New test files

| File                                            | Purpose                                                                   | Co-located with           |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------- |
| `src/engine/selectors-furthest.test.ts`         | Tests for `furthest` criterion (enemy + ally)                             | `src/engine/selectors.ts` |
| `src/engine/selectors-highest-hp.test.ts`       | Tests for `highest_hp` criterion (enemy + ally)                           | `src/engine/selectors.ts` |
| `src/engine/selectors-target-criterion.test.ts` | Tests for all 12 target+criterion combinations and self-ignores-criterion | `src/engine/selectors.ts` |

### Modified test files (organized by step)

| Step | Files Modified                                    | Change Type                                                                                            |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1    | 2 helper files                                    | Add `actionType` default                                                                               |
| 2    | `game-decisions-action-type-inference.test.ts`    | Delete 2 tests, add 1                                                                                  |
| 3    | 2 helper files                                    | Add `target`/`criterion` defaults                                                                      |
| 4    | 18 test files + 2 helpers                         | Mechanical `mode` -> `behavior`                                                                        |
| 5    | 15 test files + 2 helpers + 7 selector test files | Mechanical `selectorOverride` -> `target`+`criterion`; `evaluateSelector` -> `evaluateTargetCriterion` |
| 6    | `gameStore-skills-duplication.test.ts`            | Update guard tests, add registry-based tests                                                           |
| 7    | `SkillsPanel.test.tsx`                            | Add criterion options, update duplication tests                                                        |
| 8    | None                                              |                                                                                                        |

### Test count impact

| Category                | Current | Added | Removed | Updated | Final  |
| ----------------------- | ------- | ----- | ------- | ------- | ------ |
| Action type inference   | 6       | 2     | 2       | 2       | 8      |
| Selector: furthest      | 0       | 7     | 0       | 0       | 7      |
| Selector: highest_hp    | 0       | 5     | 0       | 0       | 5      |
| Target+criterion combos | 0       | 3     | 0       | 0       | 3      |
| Registry                | 14      | 4     | 0       | 5       | 18     |
| Duplication (store)     | 13      | 2     | 0       | 3       | 15     |
| SkillsPanel (UI)        | ~45     | 4     | 11      | 20+     | ~38    |
| Mechanical updates      | ~1000+  | 0     | 0       | ~100+   | ~1000+ |
| **Total**               | ~1086   | ~27   | ~13     | ~130+   | ~1100  |

The 11 removed from SkillsPanel are the `decomposeSelector`/`composeSelector` helper tests and the roundtrip test (11 tests in the Helper Functions describe block). These functions are deleted in Step 7.

---

## Spec Alignment Verification

- [x] Every skill slot has shape: trigger + target + criterion + behavior -- verified by registry tests and target+criterion combination tests
- [x] No special-case fields -- verified by deletion of `mode`-based inference tests and addition of `actionType` field tests
- [x] All skills duplicatable up to maxInstances -- verified by duplication tests with registry lookup
- [x] Existing game logic unchanged -- verified by mechanical test updates (same assertions, different field names)
- [x] Mirror selectors covered -- 12 new tests across 2 new test files
- [x] Target+criterion combinations covered -- 3 new tests in dedicated file
- [x] Non-Move duplication covered -- 2 new tests in duplication file
- [x] maxInstances enforcement covered -- registry tests + duplication limit tests

## New Architectural Decision

**Decision**: ADR-011 -- Explicit Action Type on Skill Definitions

- **Document**: Recommend adding to `.docs/decisions/adr-011-explicit-action-type.md` in Step 8
- **Context**: `getActionType()` inference via `mode !== undefined` breaks when `mode` becomes universal `behavior`
- **Consequences**: Runtime validation for mutual-exclusion removed; compile-time safety via TypeScript types preferred
