# Implementation Plan: Phases 7+8 (Kick/Interrupt + Charge)

## Open Questions Resolved

1. **Intent line colors**: Reuse attack color (`var(--action-attack)`, #d55e00 vermillion) for both interrupt and charge. They are offensive actions; adding new CSS variables is scope creep.
2. **Intent line markers**: Reuse attack arrowhead (`url(#arrowhead-attack)`) for both interrupt and charge. No custom markers needed.
3. **ChargeEvent vs DamageEvent**: Charge resolution emits BOTH a `ChargeEvent` (for EventLog/movement tracking) AND a `DamageEvent` (for `useDamageNumbers` hook which listens for DamageEvent). This follows the pattern where combat emits DamageEvent.
4. **Death detection**: Charge resolution emits `DeathEvent` like `combat.ts` does, for consistency and EventLog.
5. **Multiple chargers**: Process by `slotPosition` order (same as combat). First charger's position update is visible to subsequent chargers.
6. **Charge position persistence**: Yes, `updatedCharacters` flows through all phases. Charge-moved characters are at their new positions for movement and combat phases.
7. **defaultTrigger/defaultFilter**: Optional fields on `SkillDefinition`. Backward-compatible, no changes to existing entries needed.

## New Architectural Decision

**Decision**: Add optional `defaultTrigger` and `defaultFilter` fields to `SkillDefinition`.

**Context**: Kick needs `{ scope: "enemy", condition: "channeling" }` trigger and `{ condition: "channeling" }` filter by default. Charge needs `{ scope: "enemy", condition: "in_range", conditionValue: 3 }` trigger. The current code hardcodes `{ scope: "enemy", condition: "always" }` for all skills in `createSkillFromDefinition()` and `getDefaultSkills()`.

**Consequences**: Existing skill definitions continue to work unchanged (fields are optional, fallback to `always`). New skills can declare their intended defaults. Dash could retroactively get `defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 1 }` in a future cleanup pass.

**Recommend**: Add to `.docs/decisions/index.md` as ADR-018 during implementation.

---

## Implementation Steps

### Step 1: Type Changes (Both Phases)

**Files:**

- `/home/bob/Projects/auto-battler/src/engine/types.ts`
- `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**types.ts changes:**

1. **Line 58** - `Skill.actionType`: Change `"attack" | "move" | "heal"` to `"attack" | "move" | "heal" | "interrupt" | "charge"`

2. **Line 146** - `Action.type`: Change `"attack" | "move" | "heal" | "idle"` to `"attack" | "move" | "heal" | "interrupt" | "charge" | "idle"`

3. **After line 271 (WhiffEvent)** - Add new event interfaces:

   ```typescript
   export interface InterruptEvent {
     type: "interrupt";
     tick: number;
     sourceId: string;
     targetId: string;
     cancelledSkillId: string;
   }

   export interface InterruptMissEvent {
     type: "interrupt_miss";
     tick: number;
     sourceId: string;
     targetCell: Position;
     reason: "empty_cell" | "target_idle";
   }

   export interface ChargeEvent {
     type: "charge";
     tick: number;
     sourceId: string;
     fromPosition: Position;
     toPosition: Position;
     targetId?: string;
     damage?: number;
     resultingHp?: number;
   }
   ```

4. **Lines 200-208** - `GameEvent` union: Add `| InterruptEvent | InterruptMissEvent | ChargeEvent`

**skill-registry.ts changes:**

5. **Line 29** - `SkillDefinition.actionType`: Change to `"attack" | "move" | "heal" | "interrupt" | "charge"`

6. **After line 41 (cooldown)** - Add optional fields:
   ```typescript
   defaultTrigger?: { scope: "enemy" | "ally" | "self"; condition: string; conditionValue?: number };
   defaultFilter?: { condition: string; conditionValue?: number; qualifier?: { type: "action" | "skill"; id: string } };
   ```
   Use inline types here (not the full Trigger/SkillFilter types) to avoid coupling SkillDefinition to the runtime Trigger interface. The factory functions will map these to proper typed Trigger/SkillFilter objects.

---

### Step 2: Interrupt Resolution Module (Phase 7)

**Create:** `/home/bob/Projects/auto-battler/src/engine/interrupt.ts`

**Pattern**: Follow `healing.ts` structure (lines 12-92).

```
InterruptResult {
  updatedCharacters: Character[];
  events: (InterruptEvent | InterruptMissEvent)[];
}

resolveInterrupts(characters: Character[], tick: number): InterruptResult
```

**Logic:**

1. Create shallow copies: `characters.map(c => ({...c}))`
2. Find resolving interrupts: `currentAction?.type === "interrupt" && resolvesAtTick === tick`, sorted by `slotPosition`
3. For each interrupt:
   - Find target at `action.targetCell` in `updatedCharacters` (using `positionsEqual`)
   - If target found AND `target.currentAction !== null`:
     - Record `cancelledSkillId = target.currentAction.skill.id`
     - Set `target.currentAction = null` (cancel the action)
     - Do NOT modify target's skill cooldowns (cooldown already committed at decision time)
     - Emit `InterruptEvent`
   - If target found but `target.currentAction === null`:
     - Emit `InterruptMissEvent` with reason `"target_idle"`
   - If no target at cell:
     - Emit `InterruptMissEvent` with reason `"empty_cell"`

**Key detail**: The interrupted character's `currentAction` is set to null on the mutable shallow copy. This means subsequent phases (charge, movement, combat) will not see the cancelled action. `clearResolvedActions` checks `resolvesAtTick === tick` and will not re-null it (it's already null).

---

### Step 3: Kick Skill Registry Entry + defaultTrigger/defaultFilter Support (Phase 7)

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Add Kick entry after Dash (after line 136):**

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
  defaultTrigger: { scope: "enemy", condition: "channeling" },
  defaultFilter: { condition: "channeling" },
}
```

**Update `createSkillFromDefinition` (line 170-187):**
Change the hardcoded trigger line (line 183):

```typescript
// Before:
trigger: { scope: "enemy" as const, condition: "always" as const },
// After:
trigger: def.defaultTrigger
  ? { scope: def.defaultTrigger.scope as TriggerScope, condition: def.defaultTrigger.condition as ConditionType, ...(def.defaultTrigger.conditionValue !== undefined ? { conditionValue: def.defaultTrigger.conditionValue } : {}) }
  : { scope: "enemy" as const, condition: "always" as const },
```

Add filter support (after criterion line, ~line 185):

```typescript
...(def.defaultFilter ? { filter: { condition: def.defaultFilter.condition as ConditionType, ...(def.defaultFilter.conditionValue !== undefined ? { conditionValue: def.defaultFilter.conditionValue } : {}), ...(def.defaultFilter.qualifier ? { qualifier: def.defaultFilter.qualifier } : {}) } } : {}),
```

**Update `getDefaultSkills` (line 147-164):** Same trigger/filter changes as `createSkillFromDefinition`. Only affects innate skills (currently just Move, which has no defaultTrigger), but should be consistent.

**Import additions**: Add `TriggerScope`, `ConditionType` to the import from `./types`.

---

### Step 4: processTick Integration for Interrupts (Phase 7)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts`

**Import (after line 8):**

```typescript
import { resolveInterrupts } from "./interrupt";
```

**Insert after healing resolution (after line 55), before movement:**

```typescript
// 4b. Interrupt resolution (interrupts resolve before movement and combat)
const interruptResult = resolveInterrupts(characters, state.tick);
characters = interruptResult.updatedCharacters;
events.push(...interruptResult.events);
```

**Renumber comments**: 4b Movement becomes 4c, 4c Combat becomes 4d.

**No RNG changes needed**: Interrupt resolution is deterministic (no random elements).

---

### Step 5: Decision Phase Updates for Interrupt (Phase 7)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-actions.ts`

1. **Line 18** - `getActionType` return type: Change to `"attack" | "move" | "heal" | "interrupt" | "charge"`

2. **Line 76** - `createSkillAction` branching: Add `"interrupt"` to the attack/heal branch:
   ```typescript
   if (actionType === "attack" || actionType === "heal" || actionType === "interrupt") {
   ```
   Interrupt targeting is identical to attack: lock to target's cell position, store targetCharacter.

**File:** `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts`

3. **Line 118** - `tryExecuteSkill` range check: Add `"interrupt"`:

   ```typescript
   if (actionType === "attack" || actionType === "heal" || actionType === "interrupt") {
   ```

4. **Line 252** - `evaluateSingleSkill` range check: Same change:
   ```typescript
   if (actionType === "attack" || actionType === "heal" || actionType === "interrupt") {
   ```

---

### Step 6: Charge Resolution Module (Phase 8)

**Create:** `/home/bob/Projects/auto-battler/src/engine/charge.ts`

**Pattern**: Follow `healing.ts`/`combat.ts` structure but with RNG state threading like `movement.ts`.

```
ChargeResult {
  updatedCharacters: Character[];
  events: (ChargeEvent | DamageEvent | DeathEvent)[];
  rngState: number;
}

resolveCharges(characters: Character[], tick: number, rngState: number): ChargeResult
```

**Logic:**

1. Create shallow copies: `characters.map(c => ({...c}))`
2. Find resolving charges: `currentAction?.type === "charge" && resolvesAtTick === tick`, sorted by `slotPosition`
3. For each charger:
   a. **Record fromPosition**: `charger.position` (pre-move, for ChargeEvent)
   b. **Move phase**: Recompute destination at resolution time using `computeMultiStepDestination()`:
   - Create a synthetic target character at `action.targetCell` position (the locked cell from decision time)
   - Call `computeMultiStepDestination(chargerCopy, syntheticTarget, "towards", updatedCharacters, distance)`
   - Use `action.skill.distance ?? 1` for distance
   - Update charger position in `updatedCharacters` to the computed destination
     c. **Attack phase**: Check if any enemy is at distance 1 (hex distance) from charger's post-move position AND at the locked `action.targetCell`:
   - Find character at `action.targetCell` in `updatedCharacters` with `hp > 0`
   - Check `hexDistance(charger.position, target.position) <= 1`
   - If both conditions met: apply `action.skill.damage ?? 0` to target
   - Emit `DamageEvent` for the damage (for `useDamageNumbers` hook)
     d. **Emit ChargeEvent**: Always emitted (movement + optional damage info)
4. **Death detection**: After all charges processed, check for deaths like `combat.ts` (lines 92-101). Emit `DeathEvent` for any character with `hp <= 0`.
5. Return `{ updatedCharacters, events, rngState }` (rngState passed through unchanged since `computeMultiStepDestination` is deterministic - no RNG usage)

**Key detail on movement recomputation**: `computeMultiStepDestination` takes a target Character. For charge, create a minimal synthetic character object at `action.targetCell`:

```typescript
const syntheticTarget: Character = {
  ...charger, // copy required fields
  id: "__charge-target__",
  position: action.targetCell,
};
```

This gives the pathfinding a destination without depending on where the real target actually is now.

**Key detail on RNG**: After re-examination, `computeMultiStepDestination` does NOT use RNG. It is fully deterministic (pathfinding uses A\*, away-mode uses scoring). RNG is only used in `resolveMovement` for two-movers-same-cell collision. Since charge processes one charger at a time with sequential position updates, no collision randomness is needed. RNG state is passed through unchanged.

---

### Step 7: Charge Skill Registry Entry (Phase 8)

**File:** `/home/bob/Projects/auto-battler/src/engine/skill-registry.ts`

**Add Charge entry after Kick:**

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
  defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 3 },
}
```

---

### Step 8: processTick Integration for Charges (Phase 8)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts`

**Import (after interrupt import):**

```typescript
import { resolveCharges } from "./charge";
```

**Insert after interrupt resolution, before movement:**

```typescript
// 4c. Charge resolution (charges resolve before regular movement)
const chargeResult = resolveCharges(characters, state.tick, state.rngState);
characters = chargeResult.updatedCharacters;
events.push(...chargeResult.events);
```

**RNG state threading**: Even though charge doesn't currently use RNG, thread it for future-proofing. Update the `rngState` in newState (line 92):

```typescript
rngState: movementResult.rngState,  // Still use movement's rngState (charge passes through unchanged)
```

No change needed here since charge doesn't modify rngState. If it did in the future, chain: `chargeResult.rngState -> resolveMovement(... chargeResult.rngState ...)`.

**Renumber comments**: 4c Movement becomes 4d, 4d Combat becomes 4e.

---

### Step 9: Decision Phase Updates for Charge (Phase 8)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-actions.ts`

1. **Line 76** (already updated in Step 5): Add `"charge"` to the attack/heal/interrupt branch:
   ```typescript
   if (actionType === "attack" || actionType === "heal" || actionType === "interrupt" || actionType === "charge") {
   ```
   Charge targeting at decision time is identical to attack: lock to target's cell, store targetCharacter. The movement is computed at resolution time in `resolveCharges`, not at decision time.

**File:** `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts`

2. **Line 118** (already updated in Step 5): Add `"charge"`:

   ```typescript
   if (actionType === "attack" || actionType === "heal" || actionType === "interrupt" || actionType === "charge") {
   ```

3. **Line 252** (already updated in Step 5): Same change.

**Note**: Steps 5 and 9 can be combined during implementation. Listed separately for clarity of which phase each change serves.

---

### Step 10: UI Updates (Both Phases)

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentLine.tsx`

1. **Line 12** - `IntentLineProps.type`: Change to `"attack" | "move" | "heal" | "interrupt" | "charge"`

2. **Lines 101-110** - `getActionColor`: Add cases:

   ```typescript
   case "interrupt":
     return "var(--action-attack)";
   case "charge":
     return "var(--action-attack)";
   ```

3. **Lines 115-129** - `getMarkerEnd`: Add cases:
   ```typescript
   case "interrupt":
     return "url(#arrowhead-attack)";
   case "charge":
     return "url(#arrowhead-attack)";
   ```

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx`

4. **Line 226** - Type cast: Change to:

   ```typescript
   type={intent.action.type as "attack" | "move" | "heal" | "interrupt" | "charge"}
   ```

5. **Line 37** - `detectBidirectionalAttacks`: Consider adding `"charge"` to bidirectional detection. If a charger and an attacker target each other's cells, offset lines. Change:
   ```typescript
   if (intent.action.type !== "attack" && intent.action.type !== "charge")
     continue;
   ```
   And the inner filter:
   ```typescript
   (other.action.type === "attack" || other.action.type === "charge") &&
   ```

**File:** `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts`

6. **`formatActionSummary` (lines 11-30)**: Add interrupt and charge cases:

   ```typescript
   if (action.type === "interrupt") {
     return action.skill.name;
   }
   if (action.type === "charge") {
     return action.skill.name;
   }
   ```

7. **`formatActionDisplay` (lines 118-150)**: Add interrupt and charge cases:
   ```typescript
   if (action.type === "interrupt") {
     const targetName = action.targetCharacter
       ? slotPositionToLetter(action.targetCharacter.slotPosition)
       : "Unknown target";
     return `Kick -> ${targetName}`;
   }
   if (action.type === "charge") {
     const targetName = action.targetCharacter
       ? slotPositionToLetter(action.targetCharacter.slotPosition)
       : "Unknown target";
     return `Charge -> ${targetName}`;
   }
   ```
   Note: Using arrow text instead of emojis; existing code uses emojis for attack/heal/move, so follow that pattern with a suitable emoji or use the skill name directly.

---

### Step 11: Test Helper Updates (Both Phases)

**File:** `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts`

1. **Add `createInterruptAction` helper (after `createHealAction`, line 147):**

   ```typescript
   export function createInterruptAction(
     targetCell: { q: number; r: number },
     resolveTick: number,
   ): Action {
     return {
       type: "interrupt",
       skill: createSkill({
         id: "test-interrupt",
         instanceId: "test-interrupt",
         actionType: "interrupt",
         tickCost: 0,
         range: 1,
       }),
       targetCell,
       targetCharacter: null,
       startedAtTick: resolveTick,
       resolvesAtTick: resolveTick,
     };
   }
   ```

2. **Add `createChargeAction` helper:**
   ```typescript
   export function createChargeAction(
     targetCell: { q: number; r: number },
     damage: number,
     resolveTick: number,
   ): Action {
     return {
       type: "charge",
       skill: createSkill({
         id: "test-charge",
         instanceId: "test-charge",
         actionType: "charge",
         damage,
         distance: 3,
         tickCost: 1,
         range: 3,
       }),
       targetCell,
       targetCharacter: null,
       startedAtTick: resolveTick - 1,
       resolvesAtTick: resolveTick,
     };
   }
   ```

**File:** `/home/bob/Projects/auto-battler/src/engine/game.ts`

3. **Add barrel exports for new modules:**
   ```typescript
   export { resolveInterrupts } from "./interrupt";
   export type { InterruptResult } from "./interrupt";
   export { resolveCharges } from "./charge";
   export type { ChargeResult } from "./charge";
   ```

---

## Spec Alignment Checklist

- [x] Plan aligns with `.docs/spec.md` requirements (interrupt and charge action types, resolution order)
- [x] Approach consistent with `.docs/architecture.md` (pure engine, resolution module pattern, cell-based targeting)
- [x] Patterns follow `.docs/patterns/index.md` (bidirectional line offset for charge, no new patterns needed)
- [x] No conflicts with `.docs/decisions/index.md` (ADR-002 uniform intent filtering, ADR-005 centralized registry, ADR-010 movement before combat, ADR-017 multi-step movement)
- [x] New decision documented: defaultTrigger/defaultFilter on SkillDefinition (recommend ADR-018)

## Risk Areas

1. **Charge movement recomputation at resolution time**: Using `computeMultiStepDestination` with a synthetic target character. Risk: the synthetic character must have all required Character fields. Mitigation: use `createCharacter` from test helpers pattern to build a minimal valid character, or spread from the charger.

2. **Death detection timing for charge kills**: Charge emits DeathEvent during resolution. Characters killed by charge are still in `updatedCharacters` (with hp <= 0). The `characters.filter(c => c.hp > 0)` at line 80 of `game-core.ts` removes them before the next tick. Combat resolution (which runs after charge) will see dead characters. Risk: combat may try to apply damage to already-dead characters. Mitigation: combat finds targets via `positionsEqual` and does not check `hp > 0` (line 64-66 of combat.ts). A dead character could receive additional damage (hp goes more negative). This is acceptable -- DeathEvent is already emitted by charge, and combat.ts also checks deaths after all damage (lines 92-101). The duplicate DeathEvent is a concern. Mitigation: combat's death check should skip characters already at hp <= 0 before combat damage was applied, OR accept duplicate death events and deduplicate in the UI.

   **Recommended approach**: In charge resolution, do NOT filter dead characters out of `updatedCharacters`. Let them flow to combat. Combat already handles death detection after all damage. The `characters.filter(c => c.hp > 0)` at line 80 handles final removal. For DeathEvent: charge resolution should emit DeathEvents for charge kills. Combat will also emit DeathEvents if combat further damages already-dead characters, but `processTick` line 80 will remove them regardless. The EventLog can deduplicate by characterId+tick if needed. This matches existing combat.ts behavior where a character hit by two attacks in the same tick gets one DeathEvent (death check runs after ALL damage).

   **Refined approach**: Charge resolution should check deaths ONLY for characters killed by charge damage (hp dropped to <= 0 due to charge). Emit DeathEvent only for those. Combat's death check will not re-emit for characters already at hp <= 0 before combat started, since combat.ts checks deaths after ALL combat damage -- if character was already dead, combat won't change that. But combat.ts iterates ALL `updatedCharacters` looking for `hp <= 0` (line 93-94). So it WILL emit a duplicate DeathEvent. To avoid this, charge should NOT emit DeathEvents. Instead, let the death check at line 80 of processTick handle all deaths, and only combat.ts emits DeathEvents. But that means charge kills won't have DeathEvents in the event log until we add them.

   **Final approach**: Emit DeathEvent from charge resolution. Accept that combat's death check (lines 92-101) may emit duplicates for charge-killed characters. The simplest fix: modify combat.ts death check to skip characters with `hp <= 0` who had `hp <= 0` BEFORE combat damage was applied. This requires tracking pre-combat HP. Alternatively, since charge kills happen before combat, the dead character is still at their position. An attacker targeting that cell would "hit" a dead target, dealing pointless extra damage. This is a minor edge case and acceptable for v1. Document it and address if it causes issues.

3. **clearResolvedActions interaction with interrupt cancellation**: Interrupt sets target's `currentAction` to null during interrupt resolution. Later, `clearResolvedActions` checks `resolvesAtTick === tick`. Since the target's action was already nulled, `clearResolvedActions` does nothing for that character. The interrupter's own action (the kick) will be cleared by `clearResolvedActions` since kick's `resolvesAtTick === tick`. No conflict.

4. **RNG state threading**: Charge resolution does not use RNG (movement via `computeMultiStepDestination` is deterministic). The `rngState` parameter is passed through unchanged. This is correct but should be documented in the function signature. If future charge mechanics need randomness, the threading is already in place.

5. **Charge targeting at decision time vs resolution time**: At decision time, charge locks `targetCell` to the target's position and stores `targetCharacter`. At resolution time, charge recomputes movement toward `targetCell` (not the target's current position). The attack check then looks for any character at `targetCell` within 1 hex of the charger's post-move position. This means if the target moved away, the charge might hit a different character at the locked cell, or miss entirely. This matches the cell-based targeting pattern used by all other actions.

## Test File Plan

**New test files to create:**

- `/home/bob/Projects/auto-battler/src/engine/interrupt.test.ts` - Phase 7 interrupt resolution tests
- `/home/bob/Projects/auto-battler/src/engine/charge.test.ts` - Phase 8 charge resolution tests

**Existing test files to update:**

- `/home/bob/Projects/auto-battler/src/engine/game-actions.test.ts` - Test getActionType with new types
- `/home/bob/Projects/auto-battler/src/engine/skill-registry-new-skills.test.ts` - Test Kick and Charge registry entries, defaultTrigger/defaultFilter on createSkillFromDefinition

**Test counts (estimated):**

- Interrupt resolution: ~10 tests (happy path, idle target miss, empty cell miss, multiple interrupts, interrupt then combat, cooldown preservation)
- Charge resolution: ~12 tests (happy path, blocked movement, partial movement, adjacent already, miss after charge, multiple chargers, charge + combat same tick, interruptible)
- Registry/decision: ~6 tests (getActionType, range checks, registry entries, defaultTrigger/defaultFilter)
- Integration: ~5 tests (full tick with interrupt, full tick with charge, interrupt cancels charge, death from charge)
- Total: ~33 tests (aligns with ~35 criteria estimate from requirements)
