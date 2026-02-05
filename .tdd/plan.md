# Implementation Plan: Per-Skill Targeting Mode and Cooldown System

## Overview

Two independent features extending the existing skill system:

1. **C1: Per-skill targeting mode** - Add `targetingMode: "cell" | "character"` field to skill definitions. Attack skills use cell targeting (preserves dodge), Heal uses character targeting (fixes heal-whiff when ally moves).

2. **C2: Cooldown system** - Add optional `cooldown` field to skill definitions and `cooldownRemaining` to skill instances. Skills on cooldown are rejected during decision phase.

Both features are independent. C1 is implemented first, then C2.

---

## C1: Per-Skill Targeting Mode

### Rationale

Currently all skills use cell-based targeting: the decision phase locks `targetCell` at decision time, and resolution checks if ANY character is in that cell. This enables dodge for attacks (target moves away, attack misses) but causes heals to "whiff" if the ally moves during wind-up.

Adding `targetingMode` allows heal skills to lock onto the target character rather than the cell, ensuring the heal tracks the ally regardless of movement.

### Implementation Steps

#### Step 1: Add `targetingMode` to SkillDefinition

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Changes at lines 26-40 (SkillDefinition interface):**

- Add new field: `targetingMode: "cell" | "character"`

**Changes at lines 46-102 (SKILL_REGISTRY constant):**

- Add `targetingMode: "cell"` to `light-punch` (line ~59)
- Add `targetingMode: "cell"` to `heavy-punch` (line ~73)
- Add `targetingMode: "cell"` to `move-towards` (line ~86)
- Add `targetingMode: "character"` to `heal` (line ~100)

**Changes at lines 112-128 (getDefaultSkills function):**

- No changes needed - does not include non-innate skills

**Changes at lines 134-150 (createSkillFromDefinition function):**

- No changes needed - `targetingMode` is not copied to Skill instance (only used at resolution time)

#### Step 2: Update Healing Resolution

**File:** `/home/bob/Projects/auto-battler/src/engine/healing.ts`

**Changes at lines 29-70 (resolveHealing function):**

Replace the target lookup logic (lines 49-54) with:

```typescript
// Determine target based on targeting mode
let target: Character | undefined;
const skillDef = getSkillDefinition(action.skill.id);
const targetingMode = skillDef?.targetingMode ?? "cell";

if (targetingMode === "character" && action.targetCharacter) {
  // Character-targeted: find the stored target (by ID, in case reference is stale)
  target = updatedCharacters.find(
    (c) => c.id === action.targetCharacter!.id && c.hp > 0,
  );
} else {
  // Cell-targeted: find ANY character in target cell (existing behavior)
  target = updatedCharacters.find(
    (c) => positionsEqual(c.position, action.targetCell) && c.hp > 0,
  );
}
```

**Add import at top:**

```typescript
import { getSkillDefinition } from "./skill-registry";
```

#### Step 3: Update Intent Line Tracking

**File:** `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts`

**Changes at lines 174-232 (selectIntentData function):**

The `IntentData` interface (lines 146-152) uses `action.targetCell` for the line endpoint. For character-targeted skills, we need the endpoint to reflect the target's current position.

**Add helper function before selectIntentData:**

```typescript
/**
 * Get the current target position for an action.
 * For character-targeted skills, returns the live position of targetCharacter.
 * For cell-targeted skills, returns the locked targetCell.
 */
function getActionTargetPosition(
  action: Action,
  characters: Character[],
): Position {
  const skillDef = SKILL_REGISTRY.find((d) => d.id === action.skill.id);
  const targetingMode = skillDef?.targetingMode ?? "cell";

  if (targetingMode === "character" && action.targetCharacter) {
    // Find current position of target character
    const target = characters.find((c) => c.id === action.targetCharacter!.id);
    if (target) {
      return target.position;
    }
  }

  // Fall back to locked target cell
  return action.targetCell;
}
```

**Modify IntentData interface (lines 146-152):**

No changes needed - `action` object contains all needed data. The component will compute the target position.

**Alternative approach (preferred):** Add a computed `targetPosition` field to IntentData:

```typescript
export interface IntentData {
  characterId: string;
  characterPosition: Position;
  faction: Faction;
  action: Action;
  ticksRemaining: number;
  targetPosition: Position; // NEW: computed live position for rendering
}
```

Then update the mapping logic in selectIntentData to call `getActionTargetPosition()`.

**Update at line 183-188 (committed actions mapping):**

```typescript
const committed: IntentData[] = withActions.map((c) => ({
  characterId: c.id,
  characterPosition: c.position,
  faction: c.faction,
  action: c.currentAction,
  ticksRemaining: c.currentAction.resolvesAtTick - tick,
  targetPosition: getActionTargetPosition(c.currentAction, characters), // NEW
}));
```

**Update at lines 216-225 (preview decisions mapping):**

```typescript
const mapped = afterTypeFilter.map((d) => {
  const character = characters.find((c) => c.id === d.characterId)!;
  return {
    characterId: d.characterId,
    characterPosition: character.position,
    faction: character.faction,
    action: d.action,
    ticksRemaining: d.action.resolvesAtTick - tick,
    targetPosition: getActionTargetPosition(d.action, characters), // NEW
  };
});
```

#### Step 4: Update IntentLine Component

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx` (or IntentLine.tsx)

The component currently reads `action.targetCell` for the line endpoint. Update to read from `IntentData.targetPosition` instead.

**Changes:** Update the line endpoint from `action.targetCell` to the new `targetPosition` field passed in IntentData.

### C1 Backward Compatibility

- All attack skills continue to use cell targeting (dodge preserved)
- Move skill uses cell targeting (movement destination is a cell, not a character)
- Existing tests will pass without modification
- New `targetingMode` field defaults to "cell" if undefined (defensive coding)

---

## C2: Cooldown System

### Rationale

Cooldowns allow skills to have a lockout period after use. This enables design of powerful skills that cannot be spammed. Cooldown is tracked per skill instance, so duplicate skills (e.g., 3x Move) have independent cooldowns.

### Implementation Steps

#### Step 1: Add `cooldown` to SkillDefinition

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Changes at lines 26-40 (SkillDefinition interface):**

- Add new field: `cooldown?: number` (optional, undefined = no cooldown)

**Changes at lines 46-102 (SKILL_REGISTRY constant):**

- No changes needed for current skills (all have no cooldown)
- Future skills can add `cooldown: N` to enable cooldown

#### Step 2: Add `cooldownRemaining` to Skill Type

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts`

**Changes at lines 54-68 (Skill interface):**

- Add new field: `cooldownRemaining?: number` (optional, undefined or 0 = ready)

#### Step 3: Add `on_cooldown` Rejection Reason

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts`

**Changes at lines 276-280 (SkillRejectionReason type):**

- Add new value: `"on_cooldown"` to the union type

```typescript
export type SkillRejectionReason =
  | "disabled"
  | "trigger_failed"
  | "no_target"
  | "out_of_range"
  | "on_cooldown"; // NEW
```

#### Step 4: Check Cooldown in Decision Phase

**File:** `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts`

**Changes in computeDecisions function (lines 65-164):**

Add cooldown check after the disabled check (line 79-81):

```typescript
// 3. Skip disabled skills
if (!skill.enabled) {
  continue;
}

// 3b. Skip skills on cooldown (NEW)
if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
  continue;
}
```

**Changes in evaluateSkillsForCharacter function (lines 176-316):**

Add cooldown check after disabled check (line 204-212):

```typescript
// Check disabled
if (!skill.enabled) {
  evaluations.push({
    skill,
    status: "rejected",
    rejectionReason: "disabled",
  });
  currentIndex++;
  continue;
}

// Check cooldown (NEW)
if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
  evaluations.push({
    skill,
    status: "rejected",
    rejectionReason: "on_cooldown",
  });
  currentIndex++;
  continue;
}
```

#### Step 5: Initialize Cooldown When Action Created

**File:** `/home/bob/Projects/auto-battler/src/engine/game-actions.ts`

**Changes in createSkillAction function (lines 61-96):**

After creating the action, update the skill's cooldownRemaining:

**Add import at top:**

```typescript
import { getSkillDefinition } from "./skill-registry";
```

**Modify the return to set cooldown on the skill:**

The challenge: `skill` is passed by reference from the character's skill list. We need to mutate it OR return the updated skill for the caller to apply.

**Recommended approach:** Return both the Action and the updated skill cooldown value. The caller (computeDecisions) sets the cooldown when applying the decision.

**Alternative approach (simpler):** Set cooldown in `applyDecisions` in game-core.ts after the action is committed.

**Best approach (chosen):** Modify `applyDecisions` to also set the skill's cooldown when an action is applied.

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts`

**Changes in applyDecisions function (lines 136-154):**

```typescript
export function applyDecisions(
  characters: Character[],
  decisions: Decision[],
): Character[] {
  const decisionMap = new Map<string, Action>();
  for (const decision of decisions) {
    decisionMap.set(decision.characterId, decision.action);
  }

  return characters.map((character) => {
    const action = decisionMap.get(character.id);
    if (action) {
      // Find the skill that was used and set its cooldown
      const skillDef = getSkillDefinition(action.skill.id);
      const cooldown = skillDef?.cooldown;

      // Update skills array with cooldown (if applicable)
      const updatedSkills = cooldown
        ? character.skills.map((s) =>
            s.instanceId === action.skill.instanceId
              ? { ...s, cooldownRemaining: cooldown }
              : s,
          )
        : character.skills;

      return {
        ...character,
        currentAction: action,
        skills: updatedSkills,
      };
    }
    return character;
  });
}
```

**Add import at top:**

```typescript
import { getSkillDefinition } from "./skill-registry";
```

#### Step 6: Decrement Cooldowns Each Tick

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts`

**Add new function after clearResolvedActions (line 173):**

```typescript
/**
 * Decrement cooldownRemaining for all skills that have active cooldowns.
 * Called at the end of each tick after actions resolve.
 *
 * @param characters - Characters to update
 * @returns New array with decremented cooldowns (immutable)
 */
export function decrementCooldowns(characters: Character[]): Character[] {
  return characters.map((character) => {
    const hasActiveCooldowns = character.skills.some(
      (s) => s.cooldownRemaining && s.cooldownRemaining > 0,
    );

    if (!hasActiveCooldowns) {
      return character;
    }

    return {
      ...character,
      skills: character.skills.map((skill) => {
        if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
          return { ...skill, cooldownRemaining: skill.cooldownRemaining - 1 };
        }
        return skill;
      }),
    };
  });
}
```

**Call in processTick (after line 71, before line 75):**

```typescript
// 5. Clear resolved actions
characters = clearResolvedActions(characters, state.tick);

// 5b. Decrement cooldowns (NEW)
characters = decrementCooldowns(characters);

// 6. Apply all mutations
// Remove dead characters (HP <= 0)
```

### C2 Timing Analysis

When a skill with tickCost=2 and cooldown=3 is used:

1. **Tick 0 (Decision):** Skill selected, action created with `resolvesAtTick=2`
   - `applyDecisions` sets `cooldownRemaining=3`
   - `decrementCooldowns` runs but skill is mid-action (doesn't matter)
   - Result: `cooldownRemaining=2` (decremented)

2. **Tick 1 (Mid-action):** Character continues action
   - `decrementCooldowns` runs
   - Result: `cooldownRemaining=1`

3. **Tick 2 (Resolution):** Action resolves
   - `clearResolvedActions` clears `currentAction`
   - `decrementCooldowns` runs
   - Result: `cooldownRemaining=0`

4. **Tick 3 (Ready):** Skill available again

**Issue identified:** Cooldown decrements during wind-up, reducing effective lockout.

**Correction:** Should cooldown start AFTER resolution, not at decision time?

**Decision:** Set cooldown at decision time, but account for this in cooldown values. A skill with tickCost=2 and cooldown=3 has total gap of 5 ticks (2 wind-up + 3 post-resolution). The spec mentions: "Total lockout = tickCost + cooldown ticks."

However, with current implementation, cooldown decrements during wind-up too, so effective lockout = max(tickCost, cooldown).

**Alternative implementation:** Don't decrement cooldown while action is pending (character has currentAction). This gives true "cooldown starts after resolution" behavior.

**Revised decrementCooldowns:**

```typescript
export function decrementCooldowns(characters: Character[]): Character[] {
  return characters.map((character) => {
    // Skip if character has a pending action - cooldown ticks after resolution
    if (character.currentAction !== null) {
      return character;
    }

    const hasActiveCooldowns = character.skills.some(
      (s) => s.cooldownRemaining && s.cooldownRemaining > 0,
    );

    if (!hasActiveCooldowns) {
      return character;
    }

    return {
      ...character,
      skills: character.skills.map((skill) => {
        if (skill.cooldownRemaining && skill.cooldownRemaining > 0) {
          return { ...skill, cooldownRemaining: skill.cooldownRemaining - 1 };
        }
        return skill;
      }),
    };
  });
}
```

**Wait:** But `clearResolvedActions` already cleared `currentAction` before `decrementCooldowns` runs. Need to check BEFORE clearing.

**Revised approach:** Move cooldown decrement BEFORE clearResolvedActions, and skip characters with pending actions.

**Final implementation:**

In processTick, the order becomes:

1. computeDecisions + applyDecisions (sets cooldown on used skill)
2. resolveHealing, resolveMovement, resolveCombat
3. **decrementCooldowns** (skip if currentAction exists)
4. clearResolvedActions
5. Remove dead, check victory

This ensures cooldown only ticks when the character is idle.

**Revised processTick order (lines 33-93):**

```typescript
// ... existing code through line 68 (combat resolution)

// 5a. Decrement cooldowns (before clearing actions)
// Only decrement for characters without pending actions
characters = decrementCooldowns(characters);

// 5b. Clear resolved actions
characters = clearResolvedActions(characters, state.tick);
```

### C2 Backward Compatibility

- Existing skills have no cooldown (undefined), so no change in behavior
- Cooldown check uses optional chaining (`skill.cooldownRemaining && skill.cooldownRemaining > 0`)
- New `on_cooldown` rejection reason extends existing SkillRejectionReason type

---

## Test Strategy Overview

### C1 Tests

1. **Heal lands on moved target** - Target moves during wind-up, heal still lands
2. **Heal fails on dead target** - Target dies during wind-up, heal misses
3. **Attack still uses cell targeting** - Target dodges, attack misses (existing behavior preserved)
4. **Intent line tracks moving target** - Character-targeted heal intent follows target position

### C2 Tests

1. **Cooldown rejection** - Skill on cooldown is rejected with `on_cooldown` reason
2. **Cooldown decrement** - Cooldown decreases by 1 each tick when idle
3. **Cooldown paused during action** - Cooldown does not decrement while character has pending action
4. **Cooldown independence** - Duplicate skills (e.g., 3x Move) have independent cooldowns
5. **Cooldown + tickCost interaction** - Total lockout = tickCost + cooldown ticks
6. **Cooldown ready at zero** - Skill becomes available when cooldownRemaining reaches 0

---

## Implementation Order

1. **C1 Step 1:** Add `targetingMode` to SkillDefinition and SKILL_REGISTRY
2. **C1 Step 2:** Update healing.ts to use character targeting
3. **C1 Step 3:** Update gameStore-selectors.ts for intent line tracking
4. **C1 Step 4:** Update IntentOverlay/IntentLine component
5. Run all existing tests - should pass
6. Write C1-specific tests

7. **C2 Step 1:** Add `cooldown` to SkillDefinition
8. **C2 Step 2:** Add `cooldownRemaining` to Skill type
9. **C2 Step 3:** Add `on_cooldown` rejection reason
10. **C2 Step 4:** Add cooldown check in game-decisions.ts
11. **C2 Step 5:** Initialize cooldown in applyDecisions
12. **C2 Step 6:** Add decrementCooldowns function and integrate into processTick
13. Run all existing tests - should pass
14. Write C2-specific tests

---

## Risk Mitigation

### C1 Risks

| Risk                                      | Mitigation                              |
| ----------------------------------------- | --------------------------------------- |
| `targetCharacter` reference becomes stale | Look up by ID, not reference            |
| Target dies during wind-up                | Check `hp > 0` in resolution            |
| Intent lines don't update                 | Use live position from characters array |
| Breaks existing attack dodge              | Attacks explicitly use "cell" mode      |

### C2 Risks

| Risk                                     | Mitigation                               |
| ---------------------------------------- | ---------------------------------------- |
| Cooldown ticks during wind-up            | Skip decrement if `currentAction` exists |
| Mutating skill array breaks immutability | Create new skill objects with spread     |
| Duplicate skills share cooldown          | Use `instanceId` for matching, not `id`  |
| UI shows stale cooldown                  | No UI changes in scope (engine-only)     |

---

## New Decision (for ADR consideration)

**Decision:** Cooldown timing follows "post-resolution" model.

**Context:** When a skill with both `tickCost` and `cooldown` is used, the total lockout must be predictable.

**Implementation:** Cooldown is set when action is committed, but only decrements when the character is idle (no `currentAction`). This means tickCost and cooldown add together: a skill with tickCost=2 and cooldown=3 is locked for 5 ticks total.

**Consequences:**

- Simple mental model: "2 ticks to resolve, then 3 ticks to recharge"
- Cooldown values in registry represent post-resolution lockout, not total lockout
- UI can show "resolving in X" during wind-up, "ready in Y" during cooldown

This decision should be documented in `.docs/decisions/` if accepted.

---

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements (heal tracking, skill system)
- [x] Approach consistent with `.docs/architecture.md` (pure engine, selector patterns)
- [x] Patterns follow `.docs/patterns/index.md` (no new patterns needed)
- [x] No conflicts with `.docs/decisions/index.md` (extends ADR-005 centralized registry, ADR-006 heal timing, ADR-009 instance identity)

---

## Summary

**C1 (Targeting Mode):**

- 4 files modified
- Low complexity, clear separation from combat
- Preserves all existing dodge behavior

**C2 (Cooldown):**

- 4 files modified
- Medium complexity due to timing/state management
- Per-instance tracking leverages existing instanceId infrastructure

Both features are additive and backward compatible. No breaking changes to existing tests expected.
