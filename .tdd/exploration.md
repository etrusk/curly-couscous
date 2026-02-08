# Exploration Findings

## Task Understanding

Add two new action types to the auto-battler engine: **interrupt** (Phase 7, with Kick skill) and **charge** (Phase 8, with Charge skill). This requires expanding type unions, creating new resolution modules, inserting them into the tick processing pipeline, adding skill registry entries, and updating UI components that switch on action types.

Final resolution order: Healing -> Interrupts -> Charges -> Movement -> Combat

## 1. Type Definitions (Action.type, Skill.actionType, SkillDefinition.actionType, GameEvent)

### Current Action.type union

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts` line 146

```typescript
export interface Action {
  type: "attack" | "move" | "heal" | "idle";
```

Must add `"interrupt"` and `"charge"`.

### Current Skill.actionType union

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts` line 58

```typescript
actionType: "attack" | "move" | "heal";
```

Must add `"interrupt"` and `"charge"`.

### Current SkillDefinition.actionType union

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` line 29

```typescript
actionType: "attack" | "move" | "heal";
```

Must add `"interrupt"` and `"charge"`.

### Current GameEvent union

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts` lines 200-208

```typescript
export type GameEvent =
  | SkillDecisionEvent
  | SkillExecutionEvent
  | DamageEvent
  | HealEvent
  | MovementEvent
  | DeathEvent
  | TickEvent
  | WhiffEvent;
```

Must add `InterruptEvent`, `InterruptMissEvent`, and `ChargeEvent`.

### WhiffEvent.actionType union (also needs expansion for charge)

**File:** `/home/bob/Projects/auto-battler/src/engine/types.ts` line 269

```typescript
actionType: "attack" | "heal";
```

Charge may generate whiff events if target not in cell after charge movement, OR charge uses its own event type. Per requirements, `ChargeEvent` includes `targetId?: string` (optional = miss). No WhiffEvent expansion needed for charge.

## 2. processTick() Implementation

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts` lines 34-99

Current resolution order (lines 52-69):

```
4a. Healing resolution
4b. Movement resolution
4c. Combat resolution
```

New order after both phases:

```
4a. Healing resolution
4b. Interrupt resolution (NEW - Phase 7)
4c. Charge resolution (NEW - Phase 8)
4d. Movement resolution
4e. Combat resolution
```

Key detail: `processTick()` passes `state.rngState` to `resolveMovement()` and gets back `movementResult.rngState`. Charge resolution also needs RNG state for collision resolution since it uses multi-step movement. Must chain RNG state through: healing -> interrupts -> charges(rng) -> movement(rng) -> combat.

Import changes needed at line 7-11:

```typescript
import { resolveInterrupts } from "./interrupt";
import { resolveCharges } from "./charge";
```

### clearResolvedActions (line 185-195)

Clears `currentAction` when `resolvesAtTick === tick`. Interrupt resolution sets target's `currentAction` to null. Must ensure clearResolvedActions doesn't re-null or conflict with interrupt's action cancellation. Since interrupt nullifies the target's action mid-resolution (before clearResolvedActions runs), the already-null action won't be affected by clearResolvedActions.

### decrementCooldowns (line 205-233)

Skips characters with pending non-idle actions. This means interrupted characters (whose action was cancelled) will start decrementing cooldowns the tick after interrupt. The cancelled skill's cooldown was already set at decision time (in `applyDecisions`, line 156-157), and per spec "Cancelled action's cooldown is NOT reset."

## 3. Combat Resolution (pattern for Charge's attack phase)

**File:** `/home/bob/Projects/auto-battler/src/engine/combat.ts` lines 42-104

Pattern:

1. Create shallow copies of characters (`characters.map(c => ({...c}))`)
2. Filter for resolving attacks sorted by `slotPosition`
3. Cell-based targeting: `updatedCharacters.find(c => positionsEqual(c.position, action.targetCell))`
4. Apply damage: `target.hp -= damage`
5. Generate DamageEvent/DeathEvent

Charge attack phase is similar but:

- Uses post-movement position of charger for adjacency check (distance 1 from charger to target)
- Applies damage directly in charge resolution, not combat resolution
- Generates ChargeEvent (not DamageEvent) -- but death detection still needed

**Important:** Combat's death detection (lines 93-101) runs after ALL damage is applied. Charge resolution will need its own death detection OR deaths from charge damage are detected at the existing death-check point in processTick (line 80: `characters.filter(c => c.hp > 0)`).

## 4. Healing Resolution (pattern for new resolution modules)

**File:** `/home/bob/Projects/auto-battler/src/engine/healing.ts` lines 30-92

Pattern for resolution module:

```typescript
interface HealingResult {
  updatedCharacters: Character[];
  events: (HealEvent | WhiffEvent)[];
}

function resolveHealing(characters: Character[], tick: number): HealingResult {
  // 1. Create shallow copies
  const updatedCharacters = characters.map((c) => ({ ...c }));
  // 2. Find resolving actions sorted by slotPosition
  // 3. Process each, emit events
  // 4. Return { updatedCharacters, events }
}
```

InterruptResult and ChargeResult should follow this pattern.

## 5. Multi-step Movement (for Charge)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-movement.ts` lines 83-111

```typescript
export function computeMultiStepDestination(
  mover: Character,
  target: Character,
  mode: "towards" | "away",
  allCharacters: Character[],
  distance: number = 1,
): Position;
```

Charge will reuse this for its movement phase. The function:

- Creates a virtual mover at each step
- Calls `computeMoveDestination()` per step
- Stops if stuck (returns same position)

**Charge-specific concern:** Charge movement is toward the `targetCell`, not a character. The function takes a `target: Character` parameter. For charge, we need to create a synthetic "target" character at the targetCell position, or pass the target character directly (which is natural since charge targets a character and locks their cell).

Actually, looking at `createSkillAction` in game-actions.ts (line 76): for charge `actionType`, the action's `targetCell` is locked to target's position and `targetCharacter` is set. So charge resolution can use `action.targetCharacter` to create a target reference for `computeMultiStepDestination`.

However, `computeMultiStepDestination` uses the target character's position for pathfinding. Since charge locks `targetCell` at decision time, we should create a synthetic character at `targetCell` position for the movement calculation to ensure deterministic behavior even if the real target moved.

### Movement resolution (collision system)

**File:** `/home/bob/Projects/auto-battler/src/engine/movement.ts` lines 98-252

`resolveMovement()` handles collision resolution for move actions. Charge movement is NOT processed through `resolveMovement()` -- charge does its own movement inline using `computeMultiStepDestination` during charge resolution. However, charge movement must respect blocker-wins collision rules. The charge resolution will need to handle collisions itself or use a subset of this logic.

Actually, re-reading the requirements: "Collision rules apply per movement step (blocker-wins)" -- this is already handled by `computeMultiStepDestination` -> `computeMoveDestination` which considers occupied cells as obstacles. The mover stops if blocked. This is sufficient for charge.

But there's a subtlety: charge movement happens at resolution time (not decision time). The `computeMultiStepDestination` computes the destination at decision time for regular move actions. For charge, we may need to recompute the destination at resolution time using current character positions (post-healing, post-interrupts).

Wait -- looking more carefully: for regular moves, the destination is computed at decision time and stored in `action.targetCell`. Movement resolution then just moves to that cell (with collision checks). For charge, the movement destination should also be computed at resolution time since characters may have moved due to interrupts cancelling their channeled moves.

Actually, `resolveMovement` uses `action.targetCell` which was computed at decision time. It does NOT recompute. So blocker-wins is handled by `resolveMovement` checking if someone is already at the target cell at resolution time. For charge, we should recompute the movement path at resolution time to account for state changes from healing/interrupts.

## 6. Skill Registry Structure

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

### Current entries (lines 48-137):

- `light-punch` (attack, tickCost 0, range 1, damage 10)
- `heavy-punch` (attack, tickCost 2, range 2, damage 25, cooldown 3)
- `move-towards` (move, tickCost 1, range 1, distance 1, innate, cooldown 1)
- `heal` (heal, tickCost 2, range 5, healing 25, targetingMode: "character")
- `ranged-attack` (attack, tickCost 1, range 4, damage 15, cooldown 2)
- `dash` (move, tickCost 0, range 1, distance 2, cooldown 3)

### New entries needed:

**Kick:**

```typescript
{
  id: "kick",
  name: "Kick",
  actionType: "interrupt",
  tickCost: 0,
  range: 1,
  damage: 0,
  behaviors: [],
  defaultBehavior: "",
  innate: false,
  defaultTarget: "enemy",
  defaultCriterion: "nearest",
  targetingMode: "cell",
  cooldown: 4,
}
```

**Charge:**

```typescript
{
  id: "charge",
  name: "Charge",
  actionType: "charge",
  tickCost: 1,
  range: 3,
  damage: 20,
  distance: 3,
  behaviors: [],
  defaultBehavior: "",
  innate: false,
  defaultTarget: "enemy",
  defaultCriterion: "nearest",
  targetingMode: "cell",
  cooldown: 3,
}
```

## 7. createSkillFromDefinition / getDefaultSkills

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` lines 147-187

Both functions hardcode the default trigger:

```typescript
trigger: { scope: "enemy" as const, condition: "always" as const },
```

The spec requires:

- Kick default trigger: `{ scope: "enemy", condition: "channeling" }`
- Kick default filter: `{ condition: "channeling" }`
- Charge default trigger: `{ scope: "enemy", condition: "in_range", conditionValue: 3 }`

**SkillDefinition currently has no `defaultTrigger` or `defaultFilter` field.** This needs to be added to support non-default triggers/filters for new skills. The same issue existed for Dash (spec says default trigger `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`), but looking at the actual code, Dash uses the hardcoded always trigger.

Options:

1. Add `defaultTrigger?: Trigger` and `defaultFilter?: SkillFilter` to `SkillDefinition`
2. Override triggers in `createSkillFromDefinition()` after creation
3. Accept that defaults are always `{ scope: "enemy", condition: "always" }` and users configure manually

Since requirements explicitly call out default configs for Kick and Charge, option 1 is the cleanest approach.

### createSkill test helper

**File:** `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` lines 47-77

The `createSkill` helper infers `actionType` from properties:

```typescript
actionType: overrides.actionType ??
  (overrides.damage !== undefined ? "attack"
  : overrides.healing !== undefined ? "heal"
  : overrides.behavior ? "move"
  : "attack"),
```

This won't infer `"interrupt"` or `"charge"`. Tests must explicitly pass `actionType: "interrupt"` or `actionType: "charge"`. May want to add helpers like `createInterruptAction()` and `createChargeAction()`.

## 8. Trigger/Filter System for Kick's Default Channeling Filter

**File:** `/home/bob/Projects/auto-battler/src/engine/triggers.ts` lines 39-91 (shared evaluator)
**File:** `/home/bob/Projects/auto-battler/src/engine/selector-filters.ts` (filter evaluation)

The `channeling` condition is already implemented (line 81):

```typescript
case "channeling":
  return matchesChannelingQualifier(candidate, qualifier);
```

And `matchesChannelingQualifier` (lines 19-32) checks `candidate.currentAction !== null`.

Kick's default filter `{ condition: "channeling" }` will work with existing filter infrastructure. The filter narrows the target pool to only channeling targets, preventing Kick from being wasted on idle targets.

## 9. Decision Phase: Action Creation

**File:** `/home/bob/Projects/auto-battler/src/engine/game-actions.ts` lines 64-110

### getActionType (line 18)

```typescript
export function getActionType(skill: Skill): "attack" | "move" | "heal" {
  return skill.actionType;
}
```

**Must update return type** to include `"interrupt"` and `"charge"`.

### createSkillAction (lines 64-110)

Currently handles two branches:

1. `actionType === "attack" || actionType === "heal"` -> lock to target position
2. Else (move) -> compute movement destination

For **interrupt**: Same as attack/heal -- lock to target's current position (cell-based targeting). Interrupt targets a cell.

For **charge**: This is more complex. Charge locks `targetCell` to target's position (like attack), but needs `distance` for movement at resolution time. The distance is already on `action.skill.distance`. Target cell at decision time represents where the charger is aiming, but charge movement at resolution time will be recomputed.

Actually, re-reading the requirements: "Charge targets a cell (like all actions). Cell locked at decision time." So for decision phase, charge is like attack -- targetCell = target.position. The charge resolution module handles the movement + attack logic.

### tryExecuteSkill / evaluateSingleSkill (game-decisions.ts)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` lines 65-131, 190-269

Range check (line 117-127):

```typescript
if (actionType === "attack" || actionType === "heal") {
  const distance = hexDistance(character.position, target.position);
  if (distance > skill.range) {
    return null;
  }
}
```

For **interrupt**: Same range check as attack (interrupt has range 1). Must add `"interrupt"` to the range check condition.

For **charge**: Range check applies (charge has range 3). Must add `"charge"` to the range check condition.

Also in `evaluateSingleSkill` (line 252-263):

```typescript
if (actionType === "attack" || actionType === "heal") {
  // range check...
}
if (actionType === "heal" && target.hp >= target.maxHp) {
  // full HP check...
}
```

Must add `"interrupt"` and `"charge"` to the range check.

## 10. Intent Line Rendering

### IntentLine component

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx`

**Props type (line 12):**

```typescript
type: "attack" | "move" | "heal";
```

Must add `"interrupt"` and `"charge"`.

**getActionColor (line 101):**

```typescript
function getActionColor(type: "attack" | "move" | "heal"): string {
  switch (type) {
    case "attack":
      return "var(--action-attack)";
    case "heal":
      return "var(--action-heal)";
    case "move":
      return "var(--action-move)";
  }
}
```

Must add cases for `"interrupt"` and `"charge"`. Need to decide colors:

- Interrupt: Could use attack color (vermillion) since it's offensive, or a new color
- Charge: Same as attack color since it deals damage, or a new color

Per Okabe-Ito palette options: yellow (#F0E442), sky blue (#56B4E9), reddish purple (#CC79A7). The requirements don't specify new colors, so reusing attack color for both is reasonable since both are offensive actions.

**getMarkerEnd (line 115):**
Similar treatment needed for markers.

### IntentOverlay component

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx`

**Line 228:** Action type cast:

```typescript
type={intent.action.type as "attack" | "move" | "heal"}
```

Must update this cast.

**detectBidirectionalAttacks (line 37):** Checks `intent.action.type !== "attack"`. May need to include charge actions in bidirectional detection.

### Theme CSS

**File:** `/home/bob/Projects/auto-battler/src/styles/theme.css`

Current action colors (lines 47-49):

```css
--action-attack: #d55e00;
--action-heal: #009e73;
--action-move: #0072b2;
```

If new colors are needed for interrupt/charge, add CSS variables here across all three themes (dark, light, high-contrast).

## 11. UI Components That Switch on actionType

### formatActionSummary / formatActionDisplay

**File:** `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts`

**formatActionSummary (lines 11-30):** Switches on `action.type` for idle/attack/heal/move. Must add interrupt and charge.

**formatActionDisplay (lines 118-150):** Switches on `action.type`. Must add interrupt and charge.

### CharacterTooltip.tsx

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/CharacterTooltip.tsx`
Uses `formatActionDisplay` and `formatResolutionText` -- no direct actionType switching.

### RuleEvaluations.tsx

**File:** `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`
Uses formatters -- no direct actionType switching. Checks `action.type !== "idle"` and `action.type === "idle"` which don't need changes.

### gameStore-selectors.ts

**File:** `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors.ts`

**selectIntentData (line 214):** Filters `intent.action.type !== "idle"` -- no change needed (interrupt/charge pass through).

**selectMovementTargetData (line 326):** Filters `s.actionType !== "move"` -- no change needed (interrupt/charge are not movement targeting).

### useWhiffIndicators.ts

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts`
**WhiffIndicatorData.actionType (line 20):** `"attack" | "heal"` -- no change needed since interrupt misses use InterruptMissEvent (not WhiffEvent) and charge uses ChargeEvent.

### game-core.ts decrementCooldowns

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts` line 210

```typescript
character.currentAction.type !== "idle";
```

This check ensures characters with pending non-idle actions don't decrement cooldowns. Interrupt and charge are non-idle types, so this check naturally works. However, since Kick is instant (tickCost 0), its action will be created and resolved in the same tick. The action is cleared by `clearResolvedActions` before `decrementCooldowns` runs, so the character will be idle and cooldowns will decrement normally.

## Relevant Files

### Must modify (engine)

- `/home/bob/Projects/auto-battler/src/engine/types.ts` - Add interrupt/charge to type unions, new event interfaces
- `/home/bob/Projects/auto-battler/src/engine/game-core.ts` - Insert interrupt/charge resolution into processTick()
- `/home/bob/Projects/auto-battler/src/engine/game-actions.ts` - Update getActionType return type, handle interrupt/charge in createSkillAction
- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` - Add interrupt/charge to range check conditions
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts` - Add Kick and Charge entries, optionally add defaultTrigger/defaultFilter to SkillDefinition
- `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` - Add createInterruptAction/createChargeAction helpers
- `/home/bob/Projects/auto-battler/src/engine/game.ts` - Barrel exports for new modules

### Must create (engine)

- `/home/bob/Projects/auto-battler/src/engine/interrupt.ts` - resolveInterrupts()
- `/home/bob/Projects/auto-battler/src/engine/charge.ts` - resolveCharges()

### Must modify (UI)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx` - New action type colors/markers
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx` - Update type cast
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts` - New action type formatting
- `/home/bob/Projects/auto-battler/src/styles/theme.css` - New CSS variables if needed

### Test files to create

- `/home/bob/Projects/auto-battler/src/engine/interrupt.test.ts` - Interrupt resolution tests
- `/home/bob/Projects/auto-battler/src/engine/charge.test.ts` - Charge resolution tests
- `/home/bob/Projects/auto-battler/src/engine/skill-registry-interrupt-charge.test.ts` - Registry entry tests

### Test files that may need updates (reference actionType)

- `/home/bob/Projects/auto-battler/src/engine/game-actions.test.ts` - Tests getActionType
- `/home/bob/Projects/auto-battler/src/engine/game-decisions-action-type-inference.test.ts` - Tests action type inference
- Various component test files that hardcode `actionType: "attack"` in test data (no functional changes needed)

## Existing Patterns

- **Resolution module pattern** (healing.ts, combat.ts) - Shallow copy characters, find resolving actions by tick, process each, return `{ updatedCharacters, events }`
- **Centralized skill registry** (ADR-005) - Single file for all skill definitions
- **Cell-based targeting** - Actions lock targetCell at decision time, resolution checks cell occupancy
- **Shared condition evaluator** - `evaluateConditionForCandidate()` used by both triggers and filters
- **Multi-step movement** (ADR-017) - `computeMultiStepDestination()` iterates single-step logic
- **SlotPosition ordering** - Resolving actions sorted by `slotPosition` for determinism
- **CSS variable theming** - Action colors via `--action-*` variables across 3 themes
- **Barrel exports** - `game.ts` re-exports from decomposed modules

## Dependencies

- Multi-step movement from Phase 5 (Dash) is reused by Charge
- Shared condition evaluator from Phase 2 is reused by Kick's channeling filter
- `computeMultiStepDestination` in game-movement.ts for Charge movement
- `evaluateConditionForCandidate` in triggers.ts for filter evaluation
- Cooldown system from game-core.ts (applyDecisions sets cooldown at decision time)
- Existing collision system in movement.ts for understanding blocker-wins

## Constraints Discovered

1. **No defaultTrigger/defaultFilter on SkillDefinition**: Currently all skills get `{ scope: "enemy", condition: "always" }` trigger. Kick and Charge need non-default triggers. Must add `defaultTrigger?` and `defaultFilter?` to `SkillDefinition` and update `createSkillFromDefinition` / `getDefaultSkills`. This is also a gap for Dash (spec says in_range(1) default trigger but code uses always).

2. **getActionType return type is narrower than Action.type**: `getActionType` returns `"attack" | "move" | "heal"` while `Action.type` includes `"idle"`. Adding interrupt/charge requires updating both.

3. **RNG state threading for Charge**: If charge movement involves collision resolution (multiple chargers targeting same cell), it needs RNG state. Must thread rngState through charge resolution similar to movement resolution.

4. **Charge movement at resolution vs decision time**: Regular move actions compute destination at decision time (stored in targetCell). Charge must compute movement at resolution time since it's a combined move+attack. The `targetCell` stores the target's position (for the attack), not the movement destination.

5. **Death detection timing**: Combat checks deaths after all damage. Charge damage happens before combat. Characters killed by charge should be removed before combat phase. processTick filters dead characters at line 80, which runs after all resolution phases.

6. **IntentLine type prop is strictly typed**: The `type` prop only accepts `"attack" | "move" | "heal"`. Must expand and handle new types in getActionColor/getMarkerEnd exhaustive switches.

7. **createSkillAction branching**: Currently only two branches (attack/heal vs move). Must add interrupt and charge branches. Interrupt is like attack (targetCell = target position). Charge is like attack for targeting (targetCell = target position, targetCharacter = target).

8. **Charge position update side effects**: When a charger moves during charge resolution, their position changes. This position change must be reflected for subsequent charge resolutions in the same tick and for the movement/combat phases that follow.

## Open Questions

1. **Intent line colors for interrupt and charge**: Should interrupt/charge get their own CSS color variables, or reuse existing attack color? The Okabe-Ito palette has unused colors (#F0E442 yellow, #56B4E9 sky blue, #CC79A7 reddish purple). Requirements don't specify.

2. **Intent line markers for interrupt and charge**: Should they use the attack arrowhead, or get new markers? A boot/foot for Kick? A charging arrow for Charge?

3. **Charge: should it produce DamageEvent + ChargeEvent or just ChargeEvent?** Requirements say ChargeEvent includes damage fields. If only ChargeEvent, damage numbers display (useDamageNumbers hook) won't show charge damage unless it also listens for ChargeEvent. The hook currently only listens for DamageEvent.

4. **Charge: death detection**: If charge kills a target, should a DeathEvent be emitted by charge resolution, or should deaths only be detected by the final `characters.filter(c => c.hp > 0)` in processTick? Current combat.ts emits DeathEvents during resolution. Charge should probably do the same for consistency.

5. **Multiple chargers targeting same cell**: If two chargers aim at the same cell, both compute multi-step movement independently. Do they collide with each other during charge movement? Since charge resolution iterates by slotPosition, the first charger's position update should be visible to subsequent chargers.

6. **Charge position update persistence**: When charge resolution moves a character, does that position change persist for the movement phase? It should, since charge resolution returns `updatedCharacters` and those are fed into the next phase.

7. **defaultTrigger/defaultFilter scope**: Should this be a breaking change to SkillDefinition (making it required) or optional fields? Optional is safer and backward-compatible.
