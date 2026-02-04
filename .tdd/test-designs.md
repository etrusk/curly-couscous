# Test Designs: Move Skill Duplication

## Overview

Tests for the `instanceId`-based Move skill duplication feature. Organized into three categories: unit tests (pure engine logic), component tests (SkillsPanel UI), and integration tests (end-to-end scenarios with the decision engine).

All tests reference the implementation plan at `.tdd/plan.md` and follow existing patterns from the codebase (Vitest, Testing Library, user-centric queries, co-located test files).

---

## 1. Unit Tests -- Engine Logic

### Test: generateInstanceId-returns-string-with-registry-prefix

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `generateInstanceId()` returns a string formatted as `"${registryId}-${counter}"`
- **Setup**: Import `generateInstanceId` from `skill-registry.ts`. Call with `"move-towards"`.
- **Assertions**:
  1. Return value matches pattern `/^move-towards-\d+$/`
  2. Return value is a non-empty string
- **Justification**: The instanceId format is foundational to all instance-level operations. An incorrect format would break React keys, store lookups, and debugging.

---

### Test: generateInstanceId-produces-unique-ids-across-calls

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Sequential calls to `generateInstanceId()` with the same registryId return different values
- **Setup**: Import `generateInstanceId`. Call it 3 times with `"move-towards"`.
- **Assertions**:
  1. All 3 returned values are distinct (use `new Set(ids).size === 3`)
  2. Each value contains the `"move-towards-"` prefix
- **Justification**: Uniqueness is critical for React key correctness and unambiguous store operations. A counter bug that reuses IDs would cause silent state corruption.

---

### Test: generateInstanceId-unique-across-different-registry-ids

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Calls with different registryIds produce different instanceIds (no counter collision across skill types)
- **Setup**: Call `generateInstanceId("move-towards")`, then `generateInstanceId("light-punch")`.
- **Assertions**:
  1. The two returned values are not equal
  2. First starts with `"move-towards-"`, second starts with `"light-punch-"`
- **Justification**: If the counter were per-registryId rather than global, two different skill types could theoretically collide (e.g., `"move-towards-1"` and `"light-punch-1"` are fine, but the test ensures they actually differ). More importantly, validates the counter is global.

---

### Test: getDefaultSkills-generates-unique-instanceIds

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Each skill returned by `getDefaultSkills()` has a valid, unique `instanceId`
- **Setup**: Call `getDefaultSkills()`.
- **Assertions**:
  1. Every returned skill has a defined, non-empty `instanceId` property
  2. All `instanceId` values are unique within the returned array
  3. Each `instanceId` starts with the skill's `id` prefix (e.g., `"move-towards-"`)
- **Justification**: Default skills are the starting point for all characters. Missing or duplicate instanceIds would break character creation.

---

### Test: getDefaultSkills-returns-fresh-instanceIds-each-call

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Two calls to `getDefaultSkills()` produce skills with different instanceIds (not cached)
- **Setup**: Call `getDefaultSkills()` twice. Compare `instanceId` of the Move skill from each call.
- **Assertions**:
  1. `result1[0].instanceId !== result2[0].instanceId`
- **Justification**: Characters must have unique instanceIds. If `getDefaultSkills()` returned the same instanceId, characters created from it would share IDs, breaking instance-level targeting in the store.

---

### Test: getDefaultSkills-uses-registry-name-without-suffix

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: Move skill name is `"Move"` not `"Move Towards"` (name suffix removed per plan Step 4)
- **Setup**: Call `getDefaultSkills()`. Check the Move skill's `name`.
- **Assertions**:
  1. `skill.name === "Move"`
- **Justification**: Plan removes the hardcoded "Towards" suffix. Existing test `move name includes direction` must be updated to match this new expectation.

---

### Test: createSkillFromDefinition-includes-instanceId

- **File**: `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- **Type**: unit
- **Verifies**: `createSkillFromDefinition()` generates an `instanceId` on the returned skill
- **Setup**: Call `createSkillFromDefinition()` with the `"light-punch"` definition from `SKILL_REGISTRY`.
- **Assertions**:
  1. Returned skill has `instanceId` property defined and non-empty
  2. `instanceId` starts with `"light-punch-"`
- **Justification**: Skills assigned from inventory also need instanceIds. Without this, assigned skills would have undefined instanceId, breaking store operations that look up by instanceId.

---

### Test: duplicateSkill-creates-new-instance-with-unique-instanceId

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: `duplicateSkill` action creates a new Move instance with a unique `instanceId` distinct from the source
- **Setup**:
  - Create character with one Move skill (`id: "move-towards"`, `instanceId: "move-towards-inst1"`, `mode: "towards"`)
  - Init battle, call `duplicateSkill("char1", "move-towards-inst1")`
- **Assertions**:
  1. Character now has 2 skills
  2. Both skills have `id === "move-towards"` (same registry ID)
  3. The two skills have different `instanceId` values
  4. The new skill's `instanceId` is not empty and starts with `"move-towards-"`
- **Justification**: Core duplication behavior. If the new instance shares an instanceId with the source, all instance-level operations would be ambiguous.

---

### Test: duplicateSkill-inserts-after-source-in-priority-list

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: The duplicated skill is inserted directly after the source skill in priority order
- **Setup**:
  - Create character with skills: `[Move (inst1), Light Punch (inst2)]`
  - Call `duplicateSkill("char1", "inst1")`
- **Assertions**:
  1. Character has 3 skills
  2. Skills order is: `[Move (inst1), Move (new), Light Punch (inst2)]`
  3. `character.skills[1].id === "move-towards"` (new Move is at index 1)
- **Justification**: Priority order determines decision-making. Inserting at the wrong position would change combat behavior unexpectedly.

---

### Test: duplicateSkill-new-instance-has-default-config

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: Duplicated skill gets default configuration (mode: "towards", trigger: always, selector: nearest_enemy), NOT a copy of source config
- **Setup**:
  - Create character with Move skill configured as: `mode: "away"`, `triggers: [{ type: "hp_below", value: 50 }]`, `selectorOverride: { type: "lowest_hp_enemy" }`
  - Call `duplicateSkill("char1", sourceInstanceId)`
- **Assertions**:
  1. New skill has `mode === "towards"` (default, not source's "away")
  2. New skill has `triggers` of `[{ type: "always" }]` (default, not source's hp_below)
  3. New skill has `selectorOverride` of `{ type: "nearest_enemy" }` (default)
  4. New skill has `enabled === true`
- **Justification**: Plan specifies "New duplicate gets default config, not a copy of source." Copying source config would defeat the purpose of duplication (creating differently-configured instances).

---

### Test: duplicateSkill-enforces-max-3-move-instances

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: Duplication is silently rejected when character already has MAX_MOVE_INSTANCES (3) Move skills
- **Setup**:
  - Create character with 3 Move skill instances (all with `id: "move-towards"`, different instanceIds)
  - Call `duplicateSkill("char1", firstInstanceId)`
- **Assertions**:
  1. Character still has exactly 3 skills
  2. No new skill was added
- **Justification**: Without this guard, unbounded duplication could fill all skill slots with Move skills and break the intended gameplay balance.

---

### Test: duplicateSkill-enforces-max-skill-slots

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: Duplication is silently rejected when character already has MAX_SKILL_SLOTS (3) total skills
- **Setup**:
  - Create character with 3 skills: `[Move, Light Punch, Heavy Punch]`
  - Call `duplicateSkill("char1", moveInstanceId)`
- **Assertions**:
  1. Character still has exactly 3 skills
  2. No duplicate Move was added
- **Justification**: The skill slot limit is a core game constraint. Duplication must respect it even though the Move skill is innate.

---

### Test: duplicateSkill-rejects-non-move-skills

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: Attempting to duplicate a non-Move skill (one without `mode` property) does nothing
- **Setup**:
  - Create character with Light Punch skill (`mode: undefined`)
  - Call `duplicateSkill("char1", lightPunchInstanceId)`
- **Assertions**:
  1. Character skill count unchanged
  2. No error thrown
- **Justification**: Only Move skills support duplication. Silently rejecting prevents the UI from needing additional error handling.

---

### Test: duplicateSkill-handles-nonexistent-character-gracefully

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: Calling `duplicateSkill` with an invalid character ID does not throw
- **Setup**: Init empty battle. Call `duplicateSkill("nonexistent", "some-id")`.
- **Assertions**:
  1. No error thrown
  2. State unchanged
- **Justification**: Defensive programming. UI events could race with character removal.

---

### Test: duplicateSkill-handles-nonexistent-instanceId-gracefully

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: Calling `duplicateSkill` with an invalid instanceId does not throw
- **Setup**: Create character with one Move skill. Call `duplicateSkill("char1", "nonexistent-instance")`.
- **Assertions**:
  1. No error thrown
  2. Character skill count unchanged
- **Justification**: Defensive programming. Stale UI state could reference removed instances.

---

### Test: removeSkillFromCharacter-allows-removing-duplicate-move

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: A duplicate Move instance can be removed when the character has 2+ Move instances
- **Setup**:
  - Create character with 2 Move skills (different instanceIds)
  - Call `removeSkillFromCharacter("char1", secondMoveInstanceId)`
- **Assertions**:
  1. Character has 1 skill remaining
  2. Remaining skill has the first instanceId
  3. Removed instanceId is no longer in skills array
- **Justification**: Validates the key behavioral change: innate duplicates CAN be removed, unlike the original which previously could never be removed.

---

### Test: removeSkillFromCharacter-prevents-removing-last-move-instance

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: The last Move instance cannot be removed (innate protection)
- **Setup**:
  - Create character with 1 Move skill
  - Call `removeSkillFromCharacter("char1", moveInstanceId)`
- **Assertions**:
  1. Character still has 1 skill
  2. The Move skill is still present
- **Justification**: Core invariant: every character must always have at least one Move skill. This is the "innate cannot be removed" rule adapted for duplication.

---

### Test: removeSkillFromCharacter-allows-removing-original-if-duplicate-exists

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: The original (first-created) Move instance can be removed as long as another Move instance remains
- **Setup**:
  - Create character with 2 Move skills (originalInstanceId and duplicateInstanceId)
  - Call `removeSkillFromCharacter("char1", originalInstanceId)`
- **Assertions**:
  1. Character has 1 skill remaining
  2. Remaining skill has the duplicateInstanceId
- **Justification**: There is no special protection for the "original" -- any Move can be removed as long as one remains. This prevents a confusing UX where only the original is protected.

---

### Test: updateSkill-targets-correct-instance-by-instanceId

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts`
- **Type**: unit
- **Verifies**: `updateSkill` finds and updates the skill matching the given `instanceId`, not all skills with the same registry `id`
- **Setup**:
  - Create character with 2 Move skills: `instanceId: "inst1"` (mode: towards), `instanceId: "inst2"` (mode: towards)
  - Call `updateSkill("char1", "inst2", { mode: "away" })`
- **Assertions**:
  1. Skill with `instanceId === "inst1"` still has `mode === "towards"`
  2. Skill with `instanceId === "inst2"` now has `mode === "away"`
- **Justification**: Before this feature, `updateSkill` found by `skill.id`. With duplicates sharing the same `id`, it must use `instanceId` to avoid updating the wrong instance.

---

### Test: priority-evaluation-selects-higher-priority-move-when-trigger-passes

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: unit
- **Verifies**: When a character has two Move instances, the decision engine selects the first one (highest priority) whose triggers pass
- **Setup**:
  - Create character at `{q: 0, r: 0}` with skills:
    1. Move (mode: "away", trigger: `hp_below 50%`) -- priority 1
    2. Move (mode: "towards", trigger: `always`) -- priority 2
  - Create enemy at `{q: 2, r: 0}`
  - Set character HP to 30 (below 50%)
  - Create game state and call `computeDecisions()`
- **Assertions**:
  1. Decision action type is `"move"`
  2. Decision action skill has `mode === "away"` (the higher-priority Move was selected)
- **Justification**: This is the primary use case for Move duplication: HP-conditional movement. The test validates that the decision engine correctly evaluates multiple Move instances.

---

### Test: priority-evaluation-skips-to-lower-priority-move-when-trigger-fails

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: unit
- **Verifies**: When the higher-priority Move's trigger fails, the engine falls through to the lower-priority Move
- **Setup**:
  - Create character at `{q: 0, r: 0}` with skills:
    1. Move (mode: "away", trigger: `hp_below 50%`) -- priority 1
    2. Move (mode: "towards", trigger: `always`) -- priority 2
  - Create enemy at `{q: 2, r: 0}`
  - Set character HP to 100 (above 50%)
  - Create game state and call `computeDecisions()`
- **Assertions**:
  1. Decision action type is `"move"`
  2. Decision action skill has `mode === "towards"` (fell through to second Move)
- **Justification**: Complementary to the previous test. Together they prove the HP-conditional movement scenario works end-to-end in the decision engine.

---

### Test: evaluateSkillsForCharacter-reports-correct-status-for-multiple-moves

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-evaluate-skills.test.ts`
- **Type**: unit
- **Verifies**: `evaluateSkillsForCharacter()` correctly marks the first passing Move as "selected" and the second as "skipped" (or vice versa if the first fails)
- **Setup**:
  - Create character with 2 Move skills:
    1. Move (mode: "away", trigger: `hp_below 50%`) -- HP is 100, trigger fails
    2. Move (mode: "towards", trigger: `always`) -- trigger passes
  - Create enemy in range
  - Call `evaluateSkillsForCharacter(character, allCharacters)`
- **Assertions**:
  1. First skill evaluation has `status === "rejected"` and `rejectionReason === "trigger_failed"`
  2. Second skill evaluation has `status === "selected"`
  3. `selectedSkillIndex === 1`
- **Justification**: The UI uses `evaluateSkillsForCharacter()` to show rule evaluation tooltips. It must correctly display which Move instance was chosen and which was rejected, especially when multiple instances of the same skill are present.

---

## 2. Component Tests -- SkillsPanel UI

### Test: duplicate-button-visible-for-move-skills

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: A "Duplicate" button appears for skills with `mode !== undefined` (Move skills)
- **Setup**:
  - Create character with one Move skill (`id: "move-towards"`, `instanceId: "move-inst-1"`, `mode: "towards"`)
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. `screen.getByRole("button", { name: /duplicate move/i })` is in the document
- **Justification**: The Duplicate button is the user entry point for the feature. Without it, users cannot create duplicate Move instances.

---

### Test: duplicate-button-not-visible-for-non-move-skills

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: No "Duplicate" button appears for skills without `mode` (attack/heal skills)
- **Setup**:
  - Create character with one Light Punch skill (`id: "light-punch"`, `instanceId: "lp-inst-1"`, `damage: 10`)
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. `screen.queryByRole("button", { name: /duplicate/i })` is null
- **Justification**: Only Move skills support duplication. Showing a Duplicate button for other skills would confuse users and potentially trigger silent errors.

---

### Test: duplicate-button-disabled-at-max-move-instances

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: The Duplicate button is not rendered (hidden) when the character already has MAX_MOVE_INSTANCES (3) Move skills
- **Setup**:
  - Create character with 3 Move skill instances (all `id: "move-towards"`, different instanceIds)
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. `screen.queryByRole("button", { name: /duplicate/i })` is null
- **Justification**: The plan specifies the button is hidden (not just disabled) when at the limit. Prevents users from attempting an action that would be silently rejected.

---

### Test: duplicate-button-hidden-at-max-skill-slots

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: The Duplicate button is hidden when the character has MAX_SKILL_SLOTS (3) total skills, even if fewer than 3 are Move
- **Setup**:
  - Create character with 3 skills: `[Move (inst1), Light Punch (inst2), Heavy Punch (inst3)]`
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. `screen.queryByRole("button", { name: /duplicate/i })` is null
- **Justification**: The total skill slot limit must be respected even for Move duplication. This prevents exceeding the MAX_SKILL_SLOTS constraint.

---

### Test: clicking-duplicate-creates-new-move-instance

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: Clicking the Duplicate button creates a new Move instance in the store and it renders in the UI
- **Setup**:
  - Create character with 1 Move skill (`instanceId: "move-inst-1"`)
  - Init battle, select character, render `<SkillsPanel />`
  - Click the "Duplicate Move" button using `userEvent`
- **Assertions**:
  1. Store: Character now has 2 skills
  2. Store: Both skills have `id === "move-towards"`
  3. Store: The two skills have different `instanceId` values
  4. UI: Two mode dropdowns are visible (`screen.getAllByRole("combobox", { name: /mode/i }).length === 2`)
- **Justification**: End-to-end validation that the UI button triggers the store action and the new instance renders correctly.

---

### Test: remove-button-appears-for-duplicate-move-instances

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: When multiple Move instances exist, a "Remove" button appears for each Move instance
- **Setup**:
  - Create character with 2 Move skills (different instanceIds)
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. `screen.getAllByRole("button", { name: /remove/i })` has length 2 (one for each Move)
  2. Innate badge still appears for all Move instances
- **Justification**: Users need a way to remove duplicate Move instances. The Remove button must appear for each instance when there are 2+ Move skills.

---

### Test: remove-button-hidden-for-single-move-instance

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: When only one Move instance exists, no Remove button appears for it
- **Setup**:
  - Create character with 1 Move skill
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. No button matching `/remove move/i` is in the document
  2. Innate badge is still present
- **Justification**: The last Move instance must be protected. Hiding the Remove button prevents the user from attempting to remove the only Move.

---

### Test: clicking-remove-deletes-duplicate-move-instance

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: Clicking Remove on a duplicate Move removes it from the store and UI
- **Setup**:
  - Create character with 2 Move skills (`instanceId: "inst1"`, `instanceId: "inst2"`)
  - Init battle, select character, render `<SkillsPanel />`
  - Click the Remove button for the second instance
- **Assertions**:
  1. Store: Character now has 1 skill
  2. Store: Remaining skill has `instanceId === "inst1"`
  3. UI: Only one mode dropdown remains
- **Justification**: Validates the Remove flow from click to store update to UI re-render.

---

### Test: each-move-instance-has-independent-mode-configuration

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: Changing the mode dropdown on one Move instance does not affect another
- **Setup**:
  - Create character with 2 Move skills (both initially mode: "towards", different instanceIds)
  - Init battle, select character, render `<SkillsPanel />`
  - Get both mode dropdowns, change the second one to "away"
- **Assertions**:
  1. First mode dropdown still shows "towards"
  2. Second mode dropdown shows "away"
  3. Store: First skill has `mode === "towards"`, second has `mode === "away"`
- **Justification**: Independent configuration is the core value proposition of duplication. If changing one instance's mode affected the other, the feature would be broken.

---

### Test: each-move-instance-has-independent-trigger-configuration

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: Changing the trigger on one Move instance does not affect another
- **Setup**:
  - Create character with 2 Move skills (both initially trigger: "always", different instanceIds)
  - Init battle, select character, render `<SkillsPanel />`
  - Change the first skill's trigger dropdown to "hp_below"
- **Assertions**:
  1. Store: First skill has `triggers[0].type === "hp_below"`
  2. Store: Second skill still has `triggers[0].type === "always"`
- **Justification**: Each Move instance represents a different tactical rule. Independent triggers are essential for HP-conditional movement strategies.

---

### Test: react-keys-use-instanceId-no-duplicate-key-warnings

- **File**: `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`
- **Type**: unit (component)
- **Verifies**: Rendering multiple Move instances with the same `id` but different `instanceId` values does not produce React key collision warnings
- **Setup**:
  - Create character with 3 Move skills (same `id: "move-towards"`, different instanceIds)
  - Spy on `console.error` before render
  - Init battle, select character, render `<SkillsPanel />`
- **Assertions**:
  1. `console.error` was not called with a message containing "key" or "unique" (React duplicate key warning)
  2. All 3 skill sections are rendered (3 mode dropdowns visible)
- **Justification**: React key collisions cause unpredictable rendering behavior and are a telltale sign that `skill.id` is being used instead of `skill.instanceId`. This test catches the most common implementation mistake.

---

## 3. Integration Tests

### Test: hp-conditional-movement-full-scenario-low-hp-triggers-away

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: integration
- **Verifies**: Complete HP-conditional movement scenario: a character with HP below 50% selects "Move away" over "Move towards"
- **Setup**:
  - Create friendly character at `{q: 0, r: 0}`, HP: 30, maxHp: 100
  - Skills in priority order:
    1. Move (instanceId: "move-away-inst", mode: "away", trigger: `{ type: "hp_below", value: 50 }`, selector: `{ type: "nearest_enemy" }`)
    2. Move (instanceId: "move-towards-inst", mode: "towards", trigger: `{ type: "always" }`, selector: `{ type: "nearest_enemy" }`)
  - Create enemy at `{q: 2, r: 0}`
  - Build game state, call `computeDecisions(state)`
- **Assertions**:
  1. Exactly 1 decision for the friendly character
  2. Decision action type is `"move"`
  3. Decision action skill mode is `"away"`
  4. Decision action targetCell is farther from enemy than character's current position (hex distance increased)
- **Justification**: This is THE canonical use case from the task description. It validates the entire stack: trigger evaluation, priority ordering, skill selection, and action creation work together for conditional movement.

---

### Test: hp-conditional-movement-full-scenario-high-hp-triggers-towards

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: integration
- **Verifies**: Same setup but with HP above 50% -- character selects "Move towards" because "Move away" trigger fails
- **Setup**:
  - Create friendly character at `{q: 0, r: 0}`, HP: 100, maxHp: 100
  - Same skill order as above (Move away hp_below 50% at priority 1, Move towards always at priority 2)
  - Create enemy at `{q: 2, r: 0}`
  - Build game state, call `computeDecisions(state)`
- **Assertions**:
  1. Decision action type is `"move"`
  2. Decision action skill mode is `"towards"`
  3. Decision action targetCell is closer to enemy than character's current position (hex distance decreased)
- **Justification**: The complementary case to the previous test. Together they prove the HP-conditional strategy works in both branches.

---

### Test: multiple-characters-with-different-move-configs

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: integration
- **Verifies**: Two friendly characters with different Move duplication configs each make independent correct decisions
- **Setup**:
  - Character A at `{q: -2, r: 0}`, HP: 30 (low):
    - Skills: Move away (hp_below 50%), Move towards (always)
  - Character B at `{q: -2, r: 2}`, HP: 100 (full):
    - Skills: Move away (hp_below 50%), Move towards (always)
  - Enemy at `{q: 2, r: 0}`
  - Build game state, call `computeDecisions(state)`
- **Assertions**:
  1. Character A's decision: action type "move", skill mode "away" (hp_below triggered)
  2. Character B's decision: action type "move", skill mode "towards" (hp_below NOT triggered, falls through to always)
- **Justification**: Validates that each character's Move duplication configuration is evaluated independently. State from one character's evaluation must not leak into another's.

---

### Test: three-move-instances-priority-cascade

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: integration
- **Verifies**: With 3 Move instances, the engine correctly cascades through priority when earlier triggers fail
- **Setup**:
  - Character at `{q: 0, r: 0}`, HP: 80, maxHp: 100:
    - Skills:
      1. Move away (trigger: `hp_below 25%`) -- HP is 80%, fails
      2. Move away (trigger: `hp_below 50%`) -- HP is 80%, fails
      3. Move towards (trigger: `always`) -- passes
  - Enemy at `{q: 3, r: 0}`
  - Call `computeDecisions(state)`
- **Assertions**:
  1. Decision action skill mode is `"towards"` (fell through both hp_below triggers)
  2. Decision action type is `"move"`
- **Justification**: Tests the maximum allowed Move instances (3) in a cascade. Validates that the decision engine handles the full priority chain without issues.

---

### Test: three-move-instances-middle-trigger-passes

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-skill-priority.test.ts`
- **Type**: integration
- **Verifies**: With 3 Move instances, the engine selects the middle one when only its trigger passes (first fails, second passes, third skipped)
- **Setup**:
  - Character at `{q: 0, r: 0}`, HP: 40, maxHp: 100:
    - Skills:
      1. Move away (trigger: `hp_below 25%`) -- HP is 40%, fails (40 >= 25)
      2. Move away (trigger: `hp_below 50%`) -- HP is 40%, passes (40 < 50)
      3. Move towards (trigger: `always`) -- skipped
  - Enemy at `{q: 3, r: 0}`
  - Call `computeDecisions(state)`
- **Assertions**:
  1. Decision action skill mode is `"away"` (second Move selected)
  2. Decision action type is `"move"`
- **Justification**: Validates the mid-cascade selection path, ensuring the engine does not short-circuit incorrectly when the first skill fails but the second passes.

---

## Test Summary

| Category                        | Count  | Test File(s)                                                                                            |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Unit - Engine (skill-registry)  | 7      | `src/engine/skill-registry.test.ts`                                                                     |
| Unit - Store (gameStore-skills) | 10     | `src/stores/gameStore-skills.test.ts`                                                                   |
| Unit - Engine (game-decisions)  | 3      | `src/engine/game-decisions-skill-priority.test.ts`, `src/engine/game-decisions-evaluate-skills.test.ts` |
| Component - SkillsPanel         | 10     | `src/components/SkillsPanel/SkillsPanel.test.tsx`                                                       |
| Integration - Decision Engine   | 4      | `src/engine/game-decisions-skill-priority.test.ts`                                                      |
| **Total**                       | **34** |                                                                                                         |

## Notes for Coder

1. **Test helpers need `instanceId`**: Before writing these tests, update `createSkill()` in both `game-test-helpers.ts` and `gameStore-test-helpers.ts` to default `instanceId` to `overrides.instanceId ?? overrides.id` (plan Step 6). This allows existing tests to pass without modification.

2. **Existing test updates**: Several existing tests assert `skill.name === "Move Towards"` and will need updating to `"Move"` per plan Step 13. The test `move name includes direction` in `skill-registry.test.ts` should be replaced by the new `getDefaultSkills-uses-registry-name-without-suffix` test.

3. **SkillsPanel test skill fixtures**: The existing SkillsPanel tests create skills via `createSkill()` from the engine test helpers. After adding `instanceId` to the `Skill` type, these will get `instanceId` defaulting to `id` from the updated helper, so they should continue to work.

4. **Console spy for React key test**: Use `vi.spyOn(console, "error")` before render, and `vi.restoreAllMocks()` in afterEach. Check that no call args include "key" substring.

5. **Store action parameter name change**: Existing tests that call `updateSkill("char1", "skill1", ...)` will still work because the test helper defaults `instanceId` to `id`. The parameter is renamed from `skillId` to `instanceId` but the value passed in tests is the same string.

6. **Move skill in store tests**: When testing `duplicateSkill`, you can either create characters with pre-built skill arrays (using `createSkill` with explicit `instanceId`) or use the store's `addCharacter` action which generates instanceIds via `getDefaultSkills()`. The former gives more control; prefer it.
