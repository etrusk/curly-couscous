# Exploration: Per-Skill Targeting Mode and Cooldown System

## Overview

Explored codebase to understand skill system architecture for implementing:

1. **C1: Per-skill targeting mode** - Cell vs character targeting
2. **C2: Cooldown system** - Skill lockout after use

## Key Findings

### 1. Skill System Architecture

**Skill Registry** (`src/engine/skill-registry.ts`):

- Central source of truth for all skill definitions
- `SkillDefinition` interface defines intrinsic properties
- Skills created via `createSkillFromDefinition()` or `getDefaultSkills()`
- Already supports per-skill configuration (tickCost, range, damage, healing, behaviors, maxInstances)
- No existing cooldown field

**Skill Instance State** (`src/engine/types.ts`):

- `Skill` interface represents runtime instances
- Has `instanceId` for per-instance identity (ADR-009)
- No per-instance state fields like `cooldownRemaining` yet
- Instances are created with `generateInstanceId()` and tracked in `Character.skills[]`

### 2. Current Targeting Mechanism

**Decision Phase** (`src/engine/game-decisions.ts`):

- `computeDecisions()` evaluates skills top-to-bottom
- `createSkillAction()` creates actions with locked `targetCell`
- **Current behavior**: ALL skills lock to `target.position` at decision time (line 75 in `game-actions.ts`)
- Actions stored in `Character.currentAction`

**Action Structure** (`src/engine/types.ts` lines 98-109):

```typescript
interface Action {
  type: "attack" | "move" | "heal" | "idle";
  skill: Skill;
  targetCell: Position; // Locked at decision time
  targetCharacter: Character | null; // Set but not used in resolution
  startedAtTick: number;
  resolvesAtTick: number;
}
```

**Resolution Phase**:

- **Combat** (`src/engine/combat.ts` line 58): Uses cell-based targeting - finds ANY character in `action.targetCell`
- **Healing** (`src/engine/healing.ts` line 50): Uses cell-based targeting - finds ANY character in `action.targetCell`
- `targetCharacter` field exists but is currently unused in resolution logic

**Known Issue** (ADR-006):

> "Cell-based targeting means the heal can 'miss' if the ally moves away during the wind-up period"

This is the exact problem C1 will fix for heal skills.

### 3. Intent Line System

**Visual Tracking** (`src/components/BattleViewer/IntentLine.tsx`):

- Renders lines from `from` position to `to` position
- Uses `action.targetCell` for endpoint
- No mechanism to track moving targets currently

**Intent Data** (`src/stores/gameStore-selectors.ts` line 174):

- `selectIntentData()` extracts intent visualization data
- Reads `action.targetCell` for line endpoints
- Would need to read live character position for character-targeted skills

### 4. Skill Instance State Tracking

**Per-Instance Identity** (ADR-009):

- Each skill instance has unique `instanceId`
- Enables independent configuration of duplicated skills
- Perfect foundation for per-instance cooldown tracking

**No Per-Tick State Management Yet**:

- Skills don't currently have any per-tick state updates
- No precedent for decrementing counters on skills
- Cooldown would be first instance-level temporal state

### 5. Decision Phase Validation

**Rejection Flow** (`src/engine/game-decisions.ts` lines 77-149):

- Skills rejected for: `disabled`, `trigger_failed`, `no_target`, `out_of_range`
- No cooldown rejection reason exists yet
- `evaluateSkillsForCharacter()` mirrors validation for UI display

**Skill Rejection Reasons** (`src/engine/types.ts` lines 276-280):

```typescript
type SkillRejectionReason =
  | "disabled"
  | "trigger_failed"
  | "no_target"
  | "out_of_range";
```

Would need new `on_cooldown` reason.

### 6. Tick System Flow

**processTick Flow** (`src/engine/game-core.ts`):

1. Decision Phase: `computeDecisions()` → `applyDecisions()`
2. Resolution Phase:
   - `resolveHealing()` (line 52)
   - `resolveMovement()` (line 56)
   - `resolveCombat()` (line 66)
3. Clear resolved actions: `clearResolvedActions()` (line 71)
4. Remove dead characters (line 75)
5. Increment tick (line 84)

**No per-tick skill state update yet**:

- Cooldown decrement would happen after resolution, before tick increment
- New function needed: `decrementCooldowns()`

## Files That Will Need Modification

### C1: Per-Skill Targeting Mode

1. **`src/engine/skill-registry.ts`**:
   - Add `targetingMode: "cell" | "character"` to `SkillDefinition`
   - Set for each skill (attacks: "cell", heal: "character")

2. **`src/engine/healing.ts`**:
   - Change resolution logic to use `action.targetCharacter` instead of finding by cell
   - Check if target character exists and is alive

3. **`src/engine/game-actions.ts`**:
   - Store actual Character reference in `action.targetCharacter` (already exists)
   - Keep `targetCell` for backward compatibility with cell-targeted skills

4. **`src/stores/gameStore-selectors.ts`**:
   - Update `selectIntentData()` to compute live position for character-targeted skills
   - Check `skill.targetingMode` to decide between `targetCell` vs `targetCharacter.position`

5. **Test files**:
   - New tests: heal lands on moved target, intent line tracks moving target
   - Verify existing combat tests still pass (dodge mechanic preserved)

### C2: Cooldown System

1. **`src/engine/skill-registry.ts`**:
   - Add `cooldown?: number` to `SkillDefinition`
   - Optional field (undefined = no cooldown)

2. **`src/engine/types.ts`**:
   - Add `cooldownRemaining?: number` to `Skill` interface
   - Add `"on_cooldown"` to `SkillRejectionReason` type

3. **`src/engine/game-decisions.ts`**:
   - Check `skill.cooldownRemaining > 0` before triggers
   - Reject with `on_cooldown` reason if active

4. **`src/engine/game-core.ts`**:
   - New function: `decrementCooldowns(characters: Character[]): Character[]`
   - Call after `clearResolvedActions()`, before tick increment
   - Decrement all `cooldownRemaining > 0` by 1

5. **`src/engine/game-actions.ts`**:
   - When creating skill action, set `skill.cooldownRemaining = skill.cooldown` (from definition)
   - Initialize cooldown on skill execution

6. **Test files**:
   - New tests: cooldown rejection, cooldown decrement, cooldown independence, cooldown + tickCost interaction

## Integration Points

### C1: Targeting Mode Integration

**Decision → Resolution Bridge**:

- Decision phase already stores `targetCharacter` in Action
- Resolution phase needs to READ from `targetCharacter` instead of searching by cell
- Need to handle case where target character died during wind-up

**Visual Feedback**:

- Intent lines must track live target position for character-targeted skills
- Requires selector to check `skill.targetingMode` and compute endpoint dynamically

### C2: Cooldown Integration

**Lifecycle**:

1. **Skill execution**: Set `cooldownRemaining` from registry `cooldown` value
2. **Decision phase**: Check `cooldownRemaining > 0`, reject if active
3. **Resolution phase**: After action clears, cooldown remains
4. **Tick end**: Decrement `cooldownRemaining` for all skills

**Per-Instance Tracking**:

- Each `instanceId` maintains independent cooldown state
- Multiple instances of same skill (e.g., 3x Move) track separately
- Skill removal resets cooldown (removed from array)

## Potential Risks and Complexities

### C1 Risks

1. **Target Death During Wind-Up**:
   - Character-targeted skill locks to character at decision time
   - Character could die before heal resolves
   - Resolution must check `targetCharacter` still exists and is alive
   - If dead: heal misses (no event generated)

2. **Intent Line Staleness**:
   - Intent lines need to re-render when target moves
   - Current system uses static `targetCell`
   - Need selector that reads live position from `action.targetCharacter.position`
   - Performance: re-compute every render for character-targeted intents

3. **Backward Compatibility**:
   - All existing tests assume cell-based targeting for heals
   - Must preserve cell-based targeting for attack skills (dodge mechanic)
   - Clear separation via `targetingMode` field

### C2 Risks

1. **State Mutation Complexity**:
   - Cooldown adds first per-instance temporal state
   - Must update nested `character.skills[i].cooldownRemaining`
   - Requires immutable update patterns in multiple places

2. **Skill Duplication Edge Cases**:
   - Adding duplicate skill: cooldown should NOT transfer
   - Removing skill: cooldown lost (expected)
   - Duplicating mid-cooldown skill: new instance starts ready (expected)

3. **Cooldown + tickCost Interaction**:
   - Wind-up skills have `tickCost` delay before resolution
   - After resolution, cooldown begins
   - Total lockout = `tickCost + cooldown` ticks
   - Example: Heavy Punch (tickCost=2, cooldown=3) = 2 tick wind-up + 3 tick lockout = 5 tick gap
   - Need clear test coverage for this interaction

4. **UI Display**:
   - Skills on cooldown need visual feedback in SkillsPanel
   - Cooldown counter display (e.g., "Ready in 2 ticks")
   - Not in scope for this task (engine-only), but worth documenting

## Questions and Ambiguities

### C1 Questions

1. **When does heal set cooldown?**
   - On decision (action created)?
   - On resolution (heal lands)?
   - **Answer**: On decision (consistent with action commitment)

2. **What if character-targeted skill's target dies during wind-up?**
   - Heal misses (no event)?
   - Re-target to another character?
   - **Answer**: Heal misses (simpler, maintains determinism)

### C2 Questions

1. **When exactly is cooldown initialized?**
   - When skill is selected (decision phase)?
   - When skill resolves (resolution phase)?
   - **Proposed**: When skill is selected (action committed), so cooldown starts even if target dodges

2. **Does cooldown tick during wind-up or after?**
   - **Proposed**: After resolution only (cooldown begins AFTER action completes)
   - Rationale: Wind-up is already a lockout period via `currentAction`
   - Example: tickCost=2, cooldown=3 means 2 ticks locked (mid-action) + 3 ticks locked (cooldown) = total 5 tick gap

3. **What happens to cooldown if character dies mid-action?**
   - Character removed from game → cooldown lost with character (expected)

## Implementation Strategy

### C1: Character-Targeted Heals (Implement First)

**Phase 1: Registry + Type Changes**

- Add `targetingMode` to `SkillDefinition` and creation functions
- Set heal to "character", attacks to "cell"

**Phase 2: Resolution Logic**

- Update `healing.ts` to check `skill.targetingMode`
- Use `action.targetCharacter` for character mode, fall back to cell search for cell mode
- Handle null/dead target case

**Phase 3: Visual Tracking**

- Update `selectIntentData()` to compute live target position for character-targeted skills
- Intent lines automatically update via existing reactive system

**Phase 4: Testing**

- Heal lands on moved target
- Heal tracks during wind-up
- Attack dodge still works (cell targeting preserved)

### C2: Cooldown System (Implement Second)

**Phase 1: Type and Registry Changes**

- Add `cooldown?: number` to registry definitions
- Add `cooldownRemaining?: number` to Skill type
- Add `on_cooldown` rejection reason

**Phase 2: Decision Phase Integration**

- Check cooldown in `computeDecisions()`
- Set cooldown when action created
- Reject with `on_cooldown` if active

**Phase 3: Tick Decrement**

- Add `decrementCooldowns()` function to `game-core.ts`
- Call after `clearResolvedActions()`
- Decrement all `cooldownRemaining > 0`

**Phase 4: Testing**

- Cooldown rejection
- Cooldown decrement
- Cooldown independence across duplicates
- Cooldown + tickCost interaction

## Exchange Count

**Exchange 1 of 10** (budget: 10 exchanges, ~30K tokens)
**Token estimate**: ~7K tokens used

## Summary

Both features extend the existing skill system cleanly:

**C1 (Targeting Mode)**: Adds registry field, modifies healing resolution, updates intent tracking. Low risk, clear separation from attack mechanics.

**C2 (Cooldown)**: Adds registry field and instance state, integrates with decision validation and tick flow. Medium complexity due to per-instance state management.

Both features are independent and can be implemented/tested separately. C1 should be implemented first as it's simpler and has no dependency on C2.
