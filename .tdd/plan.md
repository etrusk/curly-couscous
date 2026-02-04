# Implementation Plan: Move Skill Duplication

## Summary

Add `instanceId` to the `Skill` type to enable multiple Move skill instances per character. Each instance has independent behavioral configuration (mode, triggers, selector, priority). Max 3 Move instances per character. Duplication via a button in SkillsPanel. Original innate Move protected from removal; duplicates removable unless they are the last Move instance.

## New Architectural Decision

- **Decision**: Add `instanceId` field to `Skill` for instance-level identity, separate from registry `id`.
- **Context**: Move skill duplication requires multiple instances of the same registry skill on one character. The existing `id` field serves three roles (registry lookup, uniqueness constraint, React key) that conflict with duplication.
- **Consequences**: All code using `id` for instance-level operations (updateSkill, removeSkill, React keys) must switch to `instanceId`. Code using `id` for registry lookup (innate detection, faction exclusivity) remains unchanged. Recommend documenting as ADR-009.

---

## Step 1: Add `instanceId` to Skill Type

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/engine/types.ts`

**Changes:**

- Add `instanceId: string` to the `Skill` interface, after the `id` field.

```typescript
export interface Skill {
  id: string; // Registry ID (shared by duplicates)
  instanceId: string; // Unique per-instance (for React keys, targeted updates, removal)
  name: string;
  // ... rest unchanged
}
```

**Dependencies:** None (first step).

**Edge cases:**

- The `IDLE_SKILL` in `game-decisions.ts` and `game-actions.ts` must also get `instanceId`. Use `"__idle__"` for both `id` and `instanceId` since idle is synthetic and never duplicated.

---

## Step 2: Add Instance ID Generation Utility

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Changes:**

- Add a module-level counter and `generateInstanceId(registryId: string): string` function.
- Pattern: `${registryId}-${counter++}` (e.g., `"move-towards-1"`, `"move-towards-2"`).
- Counter is global and monotonically increasing across all calls to prevent collisions.

```typescript
let instanceIdCounter = 0;

export function generateInstanceId(registryId: string): string {
  return `${registryId}-${++instanceIdCounter}`;
}
```

- Export `generateInstanceId` for use in store actions.

**Why module-level counter:** Simple, deterministic within a session. No need for UUIDs since instanceIds are only used client-side within a single session. The counter never resets, so IDs are unique even across character creation/deletion cycles.

**Dependencies:** Step 1 (Skill type must have `instanceId`).

---

## Step 3: Add MAX_MOVE_INSTANCES Constant

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/stores/gameStore-constants.ts`

**Changes:**

- Add `export const MAX_MOVE_INSTANCES = 3;` constant.

**Dependencies:** None.

---

## Step 4: Update Skill Creation Functions

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Changes:**

1. **`getDefaultSkills()`**: Add `instanceId` via `generateInstanceId(def.id)` to each created skill. Remove the hardcoded `"Towards"` name suffix -- all Move instances should simply be named `"Move"`. The mode dropdown in the UI already differentiates.

2. **`createSkillFromDefinition(def)`**: Add `instanceId` via `generateInstanceId(def.id)`. Remove the `"Towards"` name suffix here too.

Updated `getDefaultSkills()`:

```typescript
export function getDefaultSkills(): Skill[] {
  return SKILL_REGISTRY.filter((def) => def.innate).map((def) => ({
    id: def.id,
    instanceId: generateInstanceId(def.id),
    name: def.name, // Use registry name directly ("Move", not "Move Towards")
    tickCost: def.tickCost,
    range: def.range,
    ...(def.damage !== undefined ? { damage: def.damage } : {}),
    ...(def.healing !== undefined ? { healing: def.healing } : {}),
    ...(def.mode !== undefined ? { mode: def.mode } : {}),
    enabled: true,
    triggers: [{ type: "always" as const }],
    selectorOverride: def.defaultSelector ?? { type: "nearest_enemy" as const },
  }));
}
```

Updated `createSkillFromDefinition()`:

```typescript
export function createSkillFromDefinition(def: SkillDefinition): Skill {
  return {
    id: def.id,
    instanceId: generateInstanceId(def.id),
    name: def.name, // Use registry name directly
    // ... rest same as before
  };
}
```

**Dependencies:** Steps 1, 2.

**Edge cases:**

- Existing tests that check `skill.name === "Move Towards"` will need updating to `"Move"`.

---

## Step 5: Update Synthetic Idle Skills

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` (IDLE_SKILL constant)
- `/home/bob/Projects/auto-battler/src/engine/game-actions.ts` (IDLE_SKILL in createIdleAction)

**Changes:**

- Add `instanceId: "__idle__"` to both IDLE_SKILL definitions.

**Dependencies:** Step 1.

---

## Step 6: Update Test Helpers

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-test-helpers.ts`
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-test-helpers.ts`

**Changes:**

- Add `instanceId` to `createSkill()` helpers. Default to `overrides.instanceId ?? overrides.id` so existing tests that pass `id` get a valid instanceId without modification.
- Update `createAttackAction`, `createMoveAction`, `createHealAction` to include `instanceId` on their inline skills.

```typescript
export function createSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return {
    id: overrides.id,
    instanceId: overrides.instanceId ?? overrides.id, // Default instanceId to id
    name: overrides.name ?? `Skill-${overrides.id}`,
    // ... rest unchanged
  };
}
```

**Dependencies:** Step 1.

**Rationale:** Defaulting `instanceId` to `id` in test helpers means the vast majority of existing tests work unchanged. Only tests creating duplicate skills need explicit instanceIds.

---

## Step 7: Update Store Action Signatures (Types)

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/stores/gameStore-types.ts`

**Changes:**

1. **Rename parameter in `updateSkill`**: Change from `skillId: string` to `instanceId: string`.
2. **Rename parameter in `removeSkillFromCharacter`**: Change from `skillId: string` to `instanceId: string`.
3. **Add `duplicateSkill` action**:

```typescript
updateSkill: (
  charId: string,
  instanceId: string,  // Changed from skillId
  updates: Partial<Skill>,
) => void;
removeSkillFromCharacter: (charId: string, instanceId: string) => void;  // Changed from skillId
duplicateSkill: (charId: string, instanceId: string) => void;  // NEW
```

**Dependencies:** Step 1.

---

## Step 8: Update Store Actions (Implementation)

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts`

**Changes:**

### 8a. `updateSkill` -- find by `instanceId` instead of `id`

```typescript
updateSkill: (charId, instanceId, updates) =>
  set((state) => {
    const character = state.gameState.characters.find((c) => c.id === charId);
    if (character) {
      const skill = character.skills.find((s) => s.instanceId === instanceId);
      if (skill) {
        Object.assign(skill, updates);
      }
    }
  }),
```

### 8b. `removeSkillFromCharacter` -- find by `instanceId`, enforce Move protection

```typescript
removeSkillFromCharacter: (charId, instanceId) =>
  set((state) => {
    const character = state.gameState.characters.find((c) => c.id === charId);
    if (!character) return;

    const skillIndex = character.skills.findIndex((s) => s.instanceId === instanceId);
    if (skillIndex === -1) return;

    const skill = character.skills[skillIndex]!;

    // Check if skill is innate via registry
    const skillDef = SKILL_REGISTRY.find((s) => s.id === skill.id);

    if (skillDef?.innate) {
      // For innate skills (Move): only allow removal if character has >1 instance
      const moveCount = character.skills.filter((s) => s.id === skill.id).length;
      if (moveCount <= 1) return; // Cannot remove last Move instance
    }

    character.skills.splice(skillIndex, 1);
  }),
```

**Key change from current behavior:** Currently, innate skills can NEVER be removed. With duplication, innate duplicates CAN be removed as long as at least one instance remains. This means the removal logic changes from "innate = never remove" to "innate = must keep at least one".

### 8c. `assignSkillToCharacter` -- add `instanceId` to created skills

No change needed beyond what `createSkillFromDefinition` already handles (Step 4 adds instanceId there).

### 8d. NEW: `duplicateSkill` action

```typescript
duplicateSkill: (charId, instanceId) =>
  set((state) => {
    const character = state.gameState.characters.find((c) => c.id === charId);
    if (!character) return;

    // Find source skill
    const sourceSkill = character.skills.find((s) => s.instanceId === instanceId);
    if (!sourceSkill) return;

    // Only Move skills can be duplicated (skills with mode property)
    if (sourceSkill.mode === undefined) return;

    // Check move instance count limit
    const moveCount = character.skills.filter((s) => s.mode !== undefined).length;
    if (moveCount >= MAX_MOVE_INSTANCES) return;

    // Check total skill slot limit
    if (character.skills.length >= MAX_SKILL_SLOTS) return;

    // Create new instance with default config
    const newSkill: Skill = {
      id: sourceSkill.id,
      instanceId: generateInstanceId(sourceSkill.id),
      name: sourceSkill.name, // "Move"
      tickCost: sourceSkill.tickCost,
      range: sourceSkill.range,
      mode: "towards", // Default mode for new duplicate
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    };

    // Insert directly after source skill in priority list
    const sourceIndex = character.skills.findIndex((s) => s.instanceId === instanceId);
    character.skills.splice(sourceIndex + 1, 0, newSkill);
  }),
```

**New imports needed:** `generateInstanceId` from skill-registry, `MAX_MOVE_INSTANCES` from gameStore-constants.

**Dependencies:** Steps 1-4, 7.

**Edge cases:**

- Duplicating when at MAX_SKILL_SLOTS: silently rejected (button should be disabled in UI).
- Duplicating when at MAX_MOVE_INSTANCES: silently rejected (button should be disabled in UI).
- Duplicating a non-Move skill: silently rejected (button only shown for Move skills).
- New duplicate gets default config, not a copy of source config. This is intentional -- the point of duplication is to create a differently-configured instance.

---

## Step 9: Update SkillsPanel UI

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx`

**Changes:**

### 9a. Switch all `skill.id` references to `skill.instanceId` for instance-level operations

- `key={skill.instanceId}` (line 196)
- `id={`enable-${skill.instanceId}`}` (line 200)
- `htmlFor={`enable-${skill.instanceId}`}` (line 207)
- All handler calls: pass `skill.instanceId` instead of `skill.id` to `updateSkill`, `handleEnabledToggle`, `handleUnassignSkill`, `handleTriggerTypeChange`, `handleTriggerValueChange`, `handleCategoryChange`, `handleStrategyChange`, `handleModeChange`

### 9b. Update internal handler signatures

Change all `skillId: string` parameters to `instanceId: string` in handler functions. Update all `find((s) => s.id === skillId)` lookups to `find((s) => s.instanceId === instanceId)`.

### 9c. Keep registry lookup by `skill.id`

The innate detection still uses `SKILL_REGISTRY.find((def) => def.id === skill.id)?.innate` -- this is correct and stays as-is.

### 9d. Update innate badge and unassign button logic

Currently: innate skills show "Innate" badge, non-innate show "Unassign" button.

New logic for Move skills (innate):

- Always show "Innate" badge on the original (first) Move instance? No -- simpler approach: show the badge on ALL Move instances since they're all based on an innate definition. But show "Unassign"/"Remove" button on duplicates.
- Better: For innate skills, show "Innate" badge. Additionally, show "Remove" button if there are multiple instances of that skill (moveCount > 1). The "Remove" button replaces "Unassign" terminology for innate duplicates since they were never "assigned" from inventory.

Revised logic:

```typescript
const isInnate = !!SKILL_REGISTRY.find((def) => def.id === skill.id)?.innate;
const isMove = skill.mode !== undefined;
const moveCount = isMove
  ? selectedCharacter.skills.filter((s) => s.mode !== undefined).length
  : 0;
const canRemove = !isInnate || (isInnate && moveCount > 1);
```

- Show "Innate" badge if `isInnate` is true
- Show "Unassign" button if `!isInnate` (for inventory skills)
- Show "Remove" button if `isInnate && moveCount > 1` (for duplicate Move instances)

### 9e. Add "Duplicate" button for Move skills

Add a "Duplicate" button next to the Move skill header. Visible only when:

- `isMove === true`
- `moveCount < MAX_MOVE_INSTANCES` (from gameStore-constants)
- `selectedCharacter.skills.length < MAX_SKILL_SLOTS`

```tsx
{
  isMove &&
    moveCount < MAX_MOVE_INSTANCES &&
    selectedCharacter.skills.length < MAX_SKILL_SLOTS && (
      <button
        onClick={() => duplicateSkill(selectedCharacter.id, skill.instanceId)}
        className={styles.duplicateButton}
        aria-label={`Duplicate ${skill.name}`}
      >
        Duplicate
      </button>
    );
}
```

**New imports needed:** `duplicateSkill` from actions, `MAX_MOVE_INSTANCES` from gameStore-constants.

### 9f. Add `duplicateButton` CSS class

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.module.css`

Add minimal styling for the duplicate button (similar to existing button styles).

**Dependencies:** Steps 1-8.

---

## Step 10: Update RuleEvaluations and CharacterTooltip React Keys

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx`

**Changes:**

- Replace all `key={evaluation.skill.id}` with `key={evaluation.skill.instanceId}`.
- There are 4 occurrences in RuleEvaluations.tsx (lines 81, 125, 143, 206) and 3 in CharacterTooltip.tsx (lines 142, 160, 190).
- These are purely React key changes -- no behavioral logic changes.

**Dependencies:** Step 1.

---

## Step 11: Update `selectMovementTargetData` Selector

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts`

**Changes:**
The current implementation finds the first Move skill:

```typescript
const moveSkill = character.skills.find((s) => s.mode !== undefined);
```

This should find the Move skill that the decision engine would actually select (the highest-priority enabled Move whose triggers pass). However, the current behavior is "show targeting line for the first Move skill's selector", which is a reasonable approximation. For now, **keep the existing behavior** -- the targeting line is a visualization aid, not a game mechanic. A future enhancement could make it aware of trigger evaluation.

No changes needed in this step, but document this as a known limitation.

**Dependencies:** None.

---

## Step 12: Update Existing Tests

**Files requiring `instanceId` additions to Skill fixtures:**

Many test files create inline Skill objects. With `instanceId` as a required field on `Skill`, all inline Skill objects must include it. Test files that use the `createSkill` helper (Steps 6) are automatically covered by the default `instanceId ?? id` behavior.

Test files with inline Skill objects that need `instanceId`:

- Files creating skills via `createSkill()` helper: **No changes needed** (Step 6 handles default).
- Files creating skills inline (without helper): Need `instanceId` added.

Key test files to audit:

- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills.test.ts` -- uses `createSkill` helper, covered.
- `/home/bob/Projects/auto-battler/src/stores/gameStore-skills-faction-exclusivity.test.ts` -- uses store actions which generate instanceId, covered.
- `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx` -- creates inline skills, needs `instanceId` added.
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts` -- tests registry functions, needs to verify `instanceId` is present.
- Various engine test files that create inline skills in character fixtures.

**Strategy:** Since `instanceId` is required on the `Skill` type, TypeScript will flag every missing occurrence. The coder can fix these by:

1. Adding `instanceId: "some-id"` to inline skill objects.
2. Using the `createSkill` helper which defaults `instanceId` to `id`.

For SkillsPanel tests that use `find((s) => s.id === "skill1")`, these may need updating to `find((s) => s.instanceId === "skill1")` if the store action now operates on instanceId.

**Dependencies:** Steps 1-8.

---

## Step 13: Update Skill Name Assertions in Tests

**Files to modify:**

- `/home/bob/Projects/auto-battler/src/engine/skill-registry.test.ts`
- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-default-skills.test.ts`
- Any test asserting `skill.name === "Move Towards"`

**Changes:**

- Update assertions from `"Move Towards"` to `"Move"` since the hardcoded suffix is removed.

**Dependencies:** Step 4.

---

## Implementation Order Summary

| Order | Step                         | Scope                    | Risk                                |
| ----- | ---------------------------- | ------------------------ | ----------------------------------- |
| 1     | Skill type change            | Engine types             | Low -- additive field               |
| 2     | Instance ID generator        | Engine utility           | Low -- new function                 |
| 3     | MAX_MOVE_INSTANCES constant  | Store constants          | Low -- new constant                 |
| 4     | Skill creation functions     | Engine registry          | Medium -- name change affects tests |
| 5     | Idle skill updates           | Engine decisions/actions | Low -- synthetic skill              |
| 6     | Test helper updates          | Test utilities           | Low -- defaults maintain compat     |
| 7     | Store type signatures        | Store types              | Medium -- API change                |
| 8     | Store action implementations | Store logic              | High -- core behavior change        |
| 9     | SkillsPanel UI               | React component          | High -- many ID references          |
| 10    | RuleEvaluations/Tooltip keys | React components         | Low -- key-only changes             |
| 11    | selectMovementTargetData     | Store selector           | None -- no changes needed           |
| 12    | Existing test updates        | Tests                    | Medium -- many files, mechanical    |
| 13    | Skill name test updates      | Tests                    | Low -- string changes               |

---

## Validation Strategy

### 1. Duplicates Work Correctly

- Create character with default Move skill
- Duplicate Move: verify new instance appears after source in priority list
- Verify new instance has unique `instanceId`
- Verify new instance has default config (mode: towards, trigger: always)
- Verify registry `id` is shared between original and duplicate

### 2. Priority Evaluation with Multiple Move Instances

- Create character with 2 Move skills: Move-away (hp_below 50%, priority 1) and Move-towards (always, priority 2)
- At HP=100: Move-away rejected (trigger fails), Move-towards selected
- At HP=30: Move-away selected (trigger passes, higher priority)
- This validates the existing `computeDecisions` loop handles duplicates correctly

### 3. Duplication Limits Enforced

- Cannot duplicate beyond MAX_MOVE_INSTANCES (3)
- Cannot duplicate when at MAX_SKILL_SLOTS (3)
- Cannot duplicate non-Move skills
- Duplicate button hidden when limits reached

### 4. Removal Constraints Work

- Cannot remove the only Move instance (last one standing)
- Can remove a duplicate when 2+ Move instances exist
- Can remove either the original or a duplicate (as long as one remains)
- Removing returns no skill to inventory (Move is innate, not assignable)

### 5. React Key Uniqueness

- With 3 Move instances, no React key collisions
- Each instance has distinct `instanceId` used as key

### 6. Store Operations Target Correct Instance

- `updateSkill` with instanceId updates only the targeted instance
- `removeSkillFromCharacter` with instanceId removes only the targeted instance
- Mode change on one instance does not affect others

### 7. Backward Compatibility

- Characters created via `addCharacter` get Move with valid `instanceId`
- Existing test helpers work with default `instanceId`
- Inventory assignment flow unchanged (non-innate skills)
- Faction exclusivity unchanged (Move excluded as innate)

---

## Migration Considerations

### New Characters

Characters created via `addCharacter` / `addCharacterAtPosition` use `structuredClone(DEFAULT_SKILLS)`. Since `DEFAULT_SKILLS` is computed from `getDefaultSkills()` at module load time (Step 4), all new characters automatically get Move with an `instanceId`.

**Warning:** `DEFAULT_SKILLS` in `gameStore-constants.ts` is evaluated ONCE at import time. All characters get clones of the same skill array. The `instanceId` in DEFAULT_SKILLS will be the same for all characters, but since `structuredClone` creates deep copies, we can generate unique IDs at clone time. However, looking at the current code, `structuredClone(DEFAULT_SKILLS)` copies the same instanceId.

**Fix needed:** Change `addCharacter` and `addCharacterAtPosition` to generate fresh instanceIds when creating characters, rather than cloning DEFAULT_SKILLS. Use `getDefaultSkills()` directly (which calls `generateInstanceId` each time) instead of `structuredClone(DEFAULT_SKILLS)`.

```typescript
// In addCharacter and addCharacterAtPosition:
skills: getDefaultSkills(), // Each call generates fresh instanceIds
```

This means `DEFAULT_SKILLS` constant in `gameStore-constants.ts` becomes unnecessary for character creation but may still be useful as a reference. Alternatively, keep using it but regenerate instanceIds after cloning. The simpler approach is calling `getDefaultSkills()` directly.

**Files affected:**

- `/home/bob/Projects/auto-battler/src/stores/gameStore.ts` -- `addCharacter` and `addCharacterAtPosition` actions

### initBattle

Characters passed to `initBattle` should already have `instanceId` on their skills. If they don't (e.g., legacy test data), the system will have skills with `undefined` instanceId, which will break lookups. Test data must be updated.

### Reset

`reset()` restores from `initialCharacters` which were cloned at `initBattle` time. If `initBattle` characters have valid instanceIds, reset works correctly. No changes needed to reset logic.

---

## Files Changed Summary

| File                                                              | Type of Change                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/engine/types.ts`                                             | Add `instanceId` to Skill interface                                                                       |
| `src/engine/skill-registry.ts`                                    | Add `generateInstanceId`, update `getDefaultSkills`, `createSkillFromDefinition`, remove name suffix      |
| `src/engine/game-decisions.ts`                                    | Add `instanceId` to IDLE_SKILL                                                                            |
| `src/engine/game-actions.ts`                                      | Add `instanceId` to IDLE_SKILL                                                                            |
| `src/stores/gameStore-constants.ts`                               | Add `MAX_MOVE_INSTANCES`                                                                                  |
| `src/stores/gameStore-types.ts`                                   | Update `updateSkill`/`removeSkillFromCharacter` params, add `duplicateSkill`                              |
| `src/stores/gameStore.ts`                                         | Update `updateSkill`, `removeSkillFromCharacter`, add `duplicateSkill`, use `getDefaultSkills()` directly |
| `src/stores/gameStore-selectors.ts`                               | No changes needed                                                                                         |
| `src/components/SkillsPanel/SkillsPanel.tsx`                      | Switch to `instanceId`, add Duplicate/Remove buttons                                                      |
| `src/components/SkillsPanel/SkillsPanel.module.css`               | Add `duplicateButton` style                                                                               |
| `src/components/RuleEvaluations/RuleEvaluations.tsx`              | Switch React keys to `instanceId`                                                                         |
| `src/components/BattleViewer/CharacterTooltip.tsx`                | Switch React keys to `instanceId`                                                                         |
| `src/engine/game-test-helpers.ts`                                 | Add `instanceId` default to `createSkill`                                                                 |
| `src/stores/gameStore-test-helpers.ts`                            | Add `instanceId` default to `createSkill`                                                                 |
| `src/components/RuleEvaluations/rule-evaluations-test-helpers.ts` | Add `instanceId` to skill fixtures                                                                        |
| Multiple test files                                               | Add `instanceId` to inline Skill objects, update name assertions                                          |

---

## Known Limitations

1. **selectMovementTargetData**: Still uses first Move skill for targeting line visualization. With multiple Move instances, the displayed targeting line may not match the actually-selected Move skill. Acceptable for v0.3.

2. **SkillDecisionEvent / SkillExecutionEvent**: These event types use `skillId: string` which is the registry ID. They don't need `instanceId` since events are for logging/debugging and the registry ID provides sufficient context. If future needs require instance-level event tracking, `instanceId` can be added to these event types later.

3. **DEFAULT_SKILLS constant**: After this change, `DEFAULT_SKILLS` in `gameStore-constants.ts` will have a fixed `instanceId` that should not be reused across characters. Either remove the constant or document that it should only be used as a template.
