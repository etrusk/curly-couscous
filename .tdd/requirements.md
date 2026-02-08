# Skill Expansion Requirements (Phases 3-8)

**Status:** Phases 1-6 complete. Phases 7-8 remain.
**Depends on:** ADR-009, ADR-010, ADR-015, ADR-016

## What's Already In Place

- **Unified Trigger System (Phase 1):** `Trigger` interface with `scope + condition + conditionValue + qualifier + negated`. Single trigger per skill. `evaluateTrigger()` delegates to shared evaluator.
- **Unified Filter System (Phase 2):** `SkillFilter` replaces `SelectorFilter`. `evaluateConditionForCandidate()` in `triggers.ts` is the shared primitive used by both triggers (`pool.some()`) and filters (`pool.filter()`).
- **Condition types already implemented:** `always`, `in_range`, `hp_below`, `hp_above`, `channeling`, `idle`, `targeting_me`, `targeting_ally` -- all work in both trigger and filter contexts.
- **Qualifier support:** `ConditionQualifier` with `action:<type>` and `skill:<id>` -- works for channeling conditions in both contexts.
- **NOT modifier:** Works on all conditions except `always`.

## Remaining Phases

### Phase 3: New Trigger Conditions (Testing + UI Integration)

**Goal:** Verify that channeling-aware and targeting-aware triggers work end-to-end via the unified condition system. The shared evaluator already handles these conditions; this phase ensures trigger-context test coverage and UI dropdown integration.

**Changes:**

- Add trigger-context integration tests for `channeling`, `idle`, `targeting_me`, `targeting_ally` with scope variations
- Add qualifier tests in trigger context (`channeling` + `skill:<id>`, `channeling` + `action:<type>`)
- Update TriggerDropdown component to expose new condition options
- Verify existing `evaluateTrigger()` handles all new conditions correctly (it delegates to `evaluateConditionForCandidate()`)

**Acceptance criteria:**

- `{ scope: "enemy", condition: "channeling" }` fires when any enemy has non-null currentAction
- `{ scope: "enemy", condition: "channeling", qualifier: { type: "skill", id: "heal" } }` fires only when enemy is channeling Heal
- `{ scope: "enemy", condition: "channeling", qualifier: { type: "action", id: "attack" } }` fires only when enemy is channeling an attack
- `{ scope: "enemy", condition: "targeting_me" }` fires when enemy action targets evaluator's cell
- `{ scope: "ally", condition: "targeting_ally" }` -- verify scope/condition combinations
- `{ scope: "ally", condition: "channeling" }` fires when any ally has currentAction
- `NOT channeling` works correctly (fires when no character in scope is channeling)
- All existing triggers still pass
- TriggerDropdown exposes channeling, idle, targeting_me, targeting_ally as selectable conditions

---

### Phase 4: Ranged Attack (Registry Only)

**Goal:** Add Ranged Attack to skill registry. Zero engine changes.

**Registry entry:**

```typescript
{
  id: "ranged-attack",
  name: "Ranged Attack",
  actionType: "attack",
  tickCost: 1,
  range: 4,
  damage: 15,
  behaviors: [],
  defaultBehavior: "",
  innate: false,
  defaultTarget: "enemy",
  defaultCriterion: "nearest",
  targetingMode: "cell",
  cooldown: 2,
}
```

**Characteristics:**

- Wind-up attack (tickCost 1), dodgeable but faster than Heavy Punch
- Range 4 enables backline damage
- Lower damage (15) than Heavy Punch (25) -- trades power for safety
- Cooldown 2 prevents spam

**Default config:**

- Trigger: `{ scope: "enemy", condition: "always" }`
- Target: enemy, Criterion: nearest

**Acceptance criteria:**

- Ranged Attack appears in skill registry with correct stats
- Can be assigned to characters via existing assignment system
- Fires and resolves using existing attack resolution
- Dodgeable (tickCost 1, creates 1-tick intent line)
- Cooldown 2 applied after use
- Hits targets at range 4

---

### Phase 5: `distance` Field + Dash

**Goal:** Parameterize movement distance and add Dash skill.

**Type changes:**

- Add optional `distance?: number` to `SkillDefinition` and `Skill`
- Set `distance: 1` on Move definition (explicit, was implicit)

**Engine changes:**

1. `createSkillFromDefinition()` and `createSkill()` helper propagate `distance` field
2. Movement resolution reads `action.skill.distance ?? 1` instead of hardcoded 1
3. Multi-step movement: iterate single-step logic `distance` times with collision check per step
   - Each step applies existing single-step movement logic (hex selection, tiebreaking)
   - If step N is blocked, character stops at step N-1 position
   - This is iterative application of `computeMoveDestination()`, not a new pathfinding algorithm
4. Decision phase: `computeMoveDestination()` must compute multi-step destinations for skills with `distance > 1`

**Registry entry:**

```typescript
{
  id: "dash",
  name: "Dash",
  actionType: "move",
  tickCost: 0,
  range: 1,
  distance: 2,
  behaviors: ["towards", "away"],
  defaultBehavior: "away",
  innate: false,
  defaultTarget: "enemy",
  defaultCriterion: "nearest",
  targetingMode: "cell",
  cooldown: 3,
}
```

**Default config:**

- Trigger: `{ scope: "enemy", condition: "in_range", conditionValue: 1 }`
- Target: enemy, Criterion: nearest, Behavior: away

**Acceptance criteria:**

- Move still moves 1 hex (explicit distance: 1, backward compatible)
- Dash moves 2 hexes when path is clear
- Dash moves 1 hex if second step is blocked (partial movement)
- Dash moves 0 hexes if first step is blocked (blocked entirely)
- Dash respects blocker-wins collision rule per step
- Dash instant (tickCost 0) resolves same tick as decision
- Cooldown 3 applied after use
- Multi-step towards uses A\* pathfinding per step
- Multi-step away uses iterative best-hex selection per step

---

### Phase 6: `most_enemies_nearby` Criterion

**Goal:** Add criterion for AoE-optimal targeting.

**Type changes:**

- Add `"most_enemies_nearby"` to `Criterion` type union

**Engine changes:**

- Implement counting logic in `selectors.ts`: for each candidate, count enemies within 2 hexes (hardcoded distance)
- Tiebreak: existing position rules (lower R, lower Q)

**Acceptance criteria:**

- Selects the target with the most enemies within 2 hexes of them
- Ties broken by position (lower R then lower Q)
- Works with filter (filtered candidates only)
- Returns first valid target if all have equal counts
- Works for both enemy and ally target pools

---

### Phase 7: Kick (Interrupt)

**Goal:** Add interrupt action type and Kick skill.

**Type changes:**

- Add `"interrupt"` to `Action.type` union: `"attack" | "move" | "heal" | "interrupt" | "idle"`
- Add `"interrupt"` to `Skill.actionType` and `SkillDefinition.actionType` unions
- New event types:
  ```typescript
  interface InterruptEvent {
    type: "interrupt";
    tick: number;
    sourceId: string;
    targetId: string;
    cancelledSkillId: string;
  }
  interface InterruptMissEvent {
    type: "interrupt_miss";
    tick: number;
    sourceId: string;
    targetCell: Position;
    reason: "empty_cell" | "target_idle";
  }
  ```
- Add `InterruptEvent | InterruptMissEvent` to `GameEvent` union

**Engine changes:**

1. New `resolveInterrupts()` in `src/engine/interrupt.ts`
2. Insert into `processTick()` after healing, before movement:
   `Healing -> Interrupts -> Movement -> Combat`
3. Interrupt resolution logic:
   - Find all interrupt actions where `resolvesAtTick === tick`
   - For each: find character at `targetCell`
   - If target exists AND has `currentAction !== null`: cancel action (set to null), do NOT reset cancelled skill's cooldown, emit `InterruptEvent`
   - If target idle or cell empty: emit `InterruptMissEvent` (whiff)
4. Update `createSkill` test helper for interrupt actionType

**Registry entry:**

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

**Default config:**

- Trigger: `{ scope: "enemy", condition: "channeling" }`
- Target: enemy, Criterion: nearest
- Filter: `{ condition: "channeling" }`

**Acceptance criteria:**

- Kick cancels target's currentAction when target is channeling
- Cancelled action's cooldown is NOT reset (already committed)
- Kick against idle target generates `interrupt_miss` event and wastes cooldown
- Kick against empty cell generates `interrupt_miss` event
- Kick is instant (tickCost 0)
- Kick resolves before movement and combat (interrupted actions don't resolve)
- Kick shows intent line for 1 tick per ADR-002
- Cooldown 4 applied after use
- Filter `channeling` correctly prevents wasting Kick on idle targets

---

### Phase 8: Charge

**Goal:** Add charge action type (combined move + attack) and Charge skill.

**Type changes:**

- Add `"charge"` to `Action.type` union: `"attack" | "move" | "heal" | "interrupt" | "charge" | "idle"`
- Add `"charge"` to `Skill.actionType` and `SkillDefinition.actionType` unions
- New event type:
  ```typescript
  interface ChargeEvent {
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
- Add `ChargeEvent` to `GameEvent` union

**Engine changes:**

1. New `resolveCharges()` in `src/engine/charge.ts`
2. Insert into `processTick()` after interrupts, before movement:
   `Healing -> Interrupts -> Charges -> Movement -> Combat`
3. Charge resolution logic:
   - Find all charge actions where `resolvesAtTick === tick`
   - For each charger:
     a. **Move phase:** Move up to `distance` hexes toward `targetCell` using iterative single-step pathfinding (shared with Dash)
     b. **Attack phase:** After movement, check if target is within melee range (1 hex) of charger's post-move position. If yes, apply damage.
     c. If movement fully blocked, attack only hits if already adjacent from original position.
   - Generate ChargeEvent (movement + damage or miss)
4. Charge targets a cell (like all actions). Cell locked at decision time. Commits to locked cell.

**Registry entry:**

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

**Default config:**

- Trigger: `{ scope: "enemy", condition: "in_range", conditionValue: 3 }`
- Target: enemy, Criterion: nearest

**Acceptance criteria:**

- Charge moves toward target up to 3 hexes, then attacks if adjacent after movement
- Collision rules apply per movement step (blocker-wins)
- If movement fully blocked, attack only hits if already adjacent (never with typical config)
- Charge is dodgeable: tickCost 1, intent line visible for 1 tick
- Charge is interruptible: Kick resolves before Charge
- Charge damage (20) applied in charge resolution phase, separate from regular combat
- Cooldown 3 applied after use
- Character that takes Charge damage can also take regular attack damage same tick
- Charge resolves before regular movement (charger arrives before dodge-movers)

---

## Resolution Phase Order (Final)

Current: `Healing -> Movement -> Combat`

After Phase 7: `Healing -> Interrupts -> Movement -> Combat`

After Phase 8: `Healing -> Interrupts -> Charges -> Movement -> Combat`

## Implementation Sessions (from current-task.md)

- **Session A remainder -- Phase 3**: New Trigger Conditions
- **Session B -- Phases 4+5+6**: Ranged Attack + distance/Dash + most_enemies_nearby (~25 criteria)
- **Session C -- Phases 7+8**: Kick (Interrupt) + Charge (~35 criteria)

## Shared Concerns Across Phases

1. **Multi-step movement (Phases 5, 8):** Dash and Charge both use iterative single-step pathfinding. Extract shared helper to avoid duplication.
2. **Action type expansion (Phases 7, 8):** Every union containing action types (`Action.type`, `Skill.actionType`, `SkillDefinition.actionType`) must be updated together. UI components rendering action types need exhaustive handling.
3. **Test helper updates:** `createSkill()` helper must handle new `actionType` values and `distance` field.
4. **UI components:** TriggerDropdown, SkillRow, intent line colors, and evaluation formatters need updates for new action types and conditions.
5. **Instant actions (tickCost 0):** Kick (Phase 7) and Dash (Phase 5) are instant. Verify they show 1-tick intent lines per ADR-002 and resolve same tick as decision.
