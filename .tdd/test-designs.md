# Test Designs: Phases 7+8 (Kick/Interrupt + Charge)

## Overview

Test designs for interrupt resolution (Phase 7) and charge resolution (Phase 8). Tests follow the resolution module pattern established by `healing.test.ts` and `combat-basic.test.ts`. All tests use helpers from `game-test-helpers.ts` (`createCharacter`, `createSkill`) and the new `createInterruptAction`/`createChargeAction` helpers defined in the plan (Step 11).

**New test files:**

1. `src/engine/interrupt.test.ts` -- 12 tests
2. `src/engine/charge.test.ts` -- 18 tests
3. `src/engine/skill-registry-interrupt-charge.test.ts` -- 6 tests

**Existing test files with documented updates:** 4. `game-actions.test.ts` -- 2 tests (noted, not fully designed) 5. `game-decisions-action-type-inference.test.ts` -- 2 tests (noted, not fully designed)

**Total: 36 designed tests + 4 noted updates = 40 tests**

**Review status: APPROVED (with additions noted below)**

**Reviewer additions:**

- Added full pipeline integration test (Healing -> Interrupts -> Charges -> Movement -> Combat) to `charge.test.ts`
- Added charge-kill-does-not-block-subsequent-combat integration test to `charge.test.ts`
- Added charge-ignores-non-charge-actions unit test to `charge.test.ts`
- Fixed vague assertions in `charge-partial-movement-blocked-second-step`
- Cleaned up confusing inline correction in `charge-interruptible-by-kick`
- Noted that "Kick shows intent line for 1 tick" criterion is a UI rendering concern with no engine test needed (no existing intent-line rendering tests exist for any action type)

---

## File 1: `src/engine/interrupt.test.ts`

### Test: interrupt-cancels-channeling-action

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Interrupt cancels the target's currentAction when the target has a pending action (channeling)
- **Setup**:
  - Interrupter (id: "kicker", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 0) with currentAction: interrupt action targeting cell {q: 1, r: 0}, resolvesAtTick: 1
  - Target (id: "channeler", faction: "enemy", position: {q: 1, r: 0}, slotPosition: 1) with currentAction: attack action (id: "heavy-punch", damage: 25, tickCost: 2, startedAtTick: 0, resolvesAtTick: 2) targeting {q: 0, r: 0}
- **Assertions**:
  1. `result.updatedCharacters.find(c => c.id === "channeler").currentAction` is `null`
  2. `result.events` has length 1
  3. `result.events[0]` matches `{ type: "interrupt", tick: 1, sourceId: "kicker", targetId: "channeler", cancelledSkillId: "heavy-punch" }`
- **Justification**: Core acceptance criterion -- "Kick cancels target's currentAction when target is channeling"

---

### Test: interrupt-cooldown-not-reset-on-cancelled-action

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: The interrupted target's cancelled skill cooldown is preserved (already committed at decision time)
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Target (id: "channeler", position: {q: 1, r: 0}, slotPosition: 1) with skills array containing a skill with cooldownRemaining: 3 (the channeled skill), and currentAction referencing that skill (attack action, resolvesAtTick: 3)
- **Assertions**:
  1. `result.updatedCharacters.find(c => c.id === "channeler").currentAction` is `null` (action cancelled)
  2. The target's skill in the skills array still has `cooldownRemaining: 3` (unchanged by interrupt resolution -- cooldowns are managed by `decrementCooldowns` in game-core, not by resolution modules)
- **Justification**: Acceptance criterion -- "Cancelled action's cooldown is NOT reset (already committed)"

---

### Test: interrupt-miss-target-idle

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Interrupt against a target with no pending action emits interrupt_miss with reason "target_idle"
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Target (id: "idler", position: {q: 1, r: 0}, slotPosition: 1, currentAction: null)
- **Assertions**:
  1. `result.events` has length 1
  2. `result.events[0]` matches `{ type: "interrupt_miss", tick: 1, sourceId: "kicker", targetCell: { q: 1, r: 0 }, reason: "target_idle" }`
  3. Target's `currentAction` remains `null`
- **Justification**: Acceptance criterion -- "Kick against idle target generates interrupt_miss event and wastes cooldown"

---

### Test: interrupt-miss-empty-cell

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Interrupt against an empty cell (target moved away) emits interrupt_miss with reason "empty_cell"
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Target (id: "moved-away", position: {q: 2, r: 0}, slotPosition: 1) -- not at the targeted cell
- **Assertions**:
  1. `result.events` has length 1
  2. `result.events[0]` matches `{ type: "interrupt_miss", tick: 1, sourceId: "kicker", targetCell: { q: 1, r: 0 }, reason: "empty_cell" }`
- **Justification**: Acceptance criterion -- "Kick against empty cell generates interrupt_miss event"

---

### Test: interrupt-instant-tickcost-zero

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Interrupt with tickCost 0 resolves on the same tick it was decided (startedAtTick === resolvesAtTick)
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action where startedAtTick: 5 and resolvesAtTick: 5, targeting {q: 1, r: 0}
  - Target (id: "channeler", position: {q: 1, r: 0}, slotPosition: 1) with currentAction (attack, resolvesAtTick: 7)
- **Assertions**:
  1. `resolveInterrupts([interrupter, target], 5)` returns events with length 1
  2. `result.events[0].type` is `"interrupt"` (successfully resolved at tick 5)
  3. Target's `currentAction` is `null`
- **Justification**: Acceptance criterion -- "Kick is instant (tickCost 0)" and verifies same-tick resolution

---

### Test: interrupt-ignores-non-resolving-actions

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Interrupt actions that do not resolve at the current tick are ignored (matching healing.test.ts pattern)
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action resolvesAtTick: 3
  - Target (id: "channeler", position: {q: 1, r: 0}, slotPosition: 1) with currentAction (attack)
- **Assertions**:
  1. `resolveInterrupts([interrupter, target], 2)` returns events with length 0 (tick 2, not tick 3)
  2. Target's `currentAction` is unchanged (still non-null)
- **Justification**: Ensures interrupt timing correctness -- only processes at resolution tick. Follows pattern from `heal-ignores-non-resolving-actions`.

---

### Test: interrupt-ignores-non-interrupt-actions

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Characters with attack or heal actions are not processed by resolveInterrupts
- **Setup**:
  - Attacker (id: "attacker", position: {q: 0, r: 0}, slotPosition: 0) with currentAction type "attack", resolvesAtTick: 1
  - Target (id: "target", position: {q: 1, r: 0}, slotPosition: 1) with currentAction (attack, resolvesAtTick: 3)
- **Assertions**:
  1. `resolveInterrupts([attacker, target], 1)` returns events with length 0
  2. Target's `currentAction` is unchanged
- **Justification**: Ensures resolution module isolation -- interrupt resolution only processes interrupt actions. Follows pattern from `heal-ignores-attack-actions`.

---

### Test: interrupt-multiple-same-tick-slotposition-ordering

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: Multiple interrupts in the same tick are processed in slotPosition order, and first interrupt's cancellation is visible to subsequent interrupters
- **Setup**:
  - Kicker1 (id: "kicker1", position: {q: -1, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Kicker2 (id: "kicker2", position: {q: 2, r: 0}, slotPosition: 2) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Channeler (id: "channeler", position: {q: 1, r: 0}, slotPosition: 1) with currentAction (attack, resolvesAtTick: 3)
- **Assertions**:
  1. `result.events` has length 2
  2. `result.events[0]` is type `"interrupt"` with sourceId "kicker1" (lower slotPosition processed first, successful cancel)
  3. `result.events[1]` is type `"interrupt_miss"` with sourceId "kicker2", reason "target_idle" (action already cancelled by kicker1)
  4. Channeler's `currentAction` is `null`
- **Justification**: Validates deterministic ordering via slotPosition and sequential visibility of state changes within same tick. Matches combat pattern where slotPosition determines processing order.

---

### Test: interrupt-does-not-modify-interrupter-action

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: The interrupter's own currentAction is not cleared by resolveInterrupts (clearing is handled by clearResolvedActions later in processTick)
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Target (id: "channeler", position: {q: 1, r: 0}, slotPosition: 1) with currentAction (attack)
- **Assertions**:
  1. `result.updatedCharacters.find(c => c.id === "kicker").currentAction` is still defined (not null) -- the interrupt action itself is not cleared by interrupt resolution
- **Justification**: Ensures correct separation of concerns between resolution and action clearing phases in processTick

---

### Test: interrupt-returns-shallow-copies

- **File**: `src/engine/interrupt.test.ts`
- **Type**: unit
- **Verifies**: resolveInterrupts returns shallow copies of characters, not mutating the originals
- **Setup**:
  - Interrupter (id: "kicker", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1
  - Target (id: "channeler", position: {q: 1, r: 0}, slotPosition: 1) with currentAction (attack)
  - Store references to original character objects before calling resolveInterrupts
- **Assertions**:
  1. `result.updatedCharacters.find(c => c.id === "channeler")` is not the same object reference as the original target
  2. The original target's `currentAction` is still non-null (not mutated)
- **Justification**: Follows resolution module pattern (healing.ts, combat.ts) of creating shallow copies. Prevents bugs from shared mutable state.

---

### Test: interrupt-resolution-order-before-movement-and-combat (integration)

- **File**: `src/engine/interrupt.test.ts`
- **Type**: integration
- **Verifies**: Interrupt resolves before movement and combat in processTick, so interrupted movement/attack actions do not execute
- **Setup**:
  - Kicker (id: "kicker", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 0) with interrupt action targeting {q: 1, r: 0}, resolvesAtTick: 1 (instant, startedAtTick: 1)
  - Mover (id: "mover", faction: "enemy", position: {q: 1, r: 0}, slotPosition: 1) with currentAction: move action targeting {q: 2, r: 0}, resolvesAtTick: 1
  - Use `processTick` with game state at tick 1
- **Assertions**:
  1. Mover's position remains {q: 1, r: 0} (move was cancelled by interrupt before movement resolution)
  2. Events include an "interrupt" event with sourceId "kicker" and targetId "mover"
  3. Events do NOT include a "movement" event for "mover"
- **Justification**: Acceptance criterion -- "Kick resolves before movement and combat (interrupted actions don't resolve)". Integration test confirms pipeline ordering.

---

### Test: interrupt-with-channeling-filter-prevents-wasting (integration)

- **File**: `src/engine/interrupt.test.ts`
- **Type**: integration
- **Verifies**: When Kick has a channeling filter, the decision phase does not select idle targets, preventing wasted interrupts
- **Setup**:
  - Kicker (id: "kicker", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 0, skills: [Kick skill with trigger: {scope: "enemy", condition: "channeling"}, filter: {condition: "channeling"}, actionType: "interrupt", tickCost: 0, range: 1, cooldown: 4])
  - IdleEnemy (id: "idle-enemy", faction: "enemy", position: {q: 1, r: 0}, slotPosition: 1, currentAction: null, skills: [attack skill])
  - Use `computeDecisions` with game state at tick 1
- **Assertions**:
  1. The decision for "kicker" has action.type "idle" (kick not chosen because filter eliminates the idle target from the pool, resulting in no valid target)
- **Justification**: Acceptance criterion -- "Filter channeling correctly prevents wasting Kick on idle targets". Validates that the channeling filter narrows the target pool to zero when no enemies are channeling.

---

## File 2: `src/engine/charge.test.ts`

### Test: charge-moves-and-attacks-adjacent-target

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Charge moves toward target up to 3 hexes and attacks when adjacent after movement
- **Setup**:
  - Charger (id: "charger", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, distance: 3, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", faction: "enemy", position: {q: 3, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. Charger's position is {q: 2, r: 0} (moved 2 hexes, stopped adjacent to target since target blocks hex 3)
  2. Target's hp is 80 (took 20 charge damage)
  3. Events include a ChargeEvent with `{ sourceId: "charger", fromPosition: {q: 0, r: 0}, toPosition: {q: 2, r: 0}, targetId: "target", damage: 20, resultingHp: 80 }`
- **Justification**: Core acceptance criterion -- "Charge moves toward target up to 3 hexes, then attacks if adjacent after movement"

---

### Test: charge-partial-movement-blocked-second-step

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Charge moves partially when path is blocked, and attacks if adjacent to target after partial movement
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, distance: 3, targetCell: {q: 4, r: 0}, resolvesAtTick: 2)
  - Blocker (id: "blocker", position: {q: 2, r: 0}, slotPosition: 1) -- blocks the path
  - Target (id: "target", position: {q: 4, r: 0}, hp: 100, slotPosition: 2)
  - Call `resolveCharges([charger, blocker, target], 2, rngState)`
- **Assertions**:
  1. Charger's position is {q: 1, r: 0} (moved 1 step toward target, stopped before blocker at {q: 2, r: 0})
  2. Target's hp is 100 (not adjacent after partial movement -- charger at {q: 1, r: 0}, target at {q: 4, r: 0}, distance 3)
  3. Events include a ChargeEvent with `fromPosition: {q: 0, r: 0}`, `toPosition: {q: 1, r: 0}`, `targetId` undefined (miss, no adjacent target)
- **Justification**: Acceptance criterion -- "Collision rules apply per movement step (blocker-wins)" with partial movement. Exact position asserted for determinism.

---

### Test: charge-fully-blocked-no-movement

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: When all movement steps are blocked, charger stays in place; attacks only if already adjacent
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, distance: 3, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Blocker1 (id: "b1", position: {q: 1, r: 0}, slotPosition: 1)
  - Blocker2 (id: "b2", position: {q: 0, r: 1}, slotPosition: 2)
  - Blocker3 (id: "b3", position: {q: 1, r: -1}, slotPosition: 3)
  - Blocker4 (id: "b4", position: {q: -1, r: 1}, slotPosition: 4)
  - Blocker5 (id: "b5", position: {q: -1, r: 0}, slotPosition: 5)
  - Blocker6 (id: "b6", position: {q: 0, r: -1}, slotPosition: 6)
  - Target (id: "target", position: {q: 3, r: 0}, hp: 100, slotPosition: 7)
  - Call `resolveCharges([charger, ...blockers, target], 2, rngState)`
- **Assertions**:
  1. Charger's position remains {q: 0, r: 0}
  2. Target's hp is 100 (no damage -- not adjacent)
  3. Events include a ChargeEvent with `fromPosition` and `toPosition` both {q: 0, r: 0}
- **Justification**: Acceptance criterion -- "If movement fully blocked, attack only hits if already adjacent"

---

### Test: charge-already-adjacent-attacks-without-moving

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: When charger is already adjacent to target, charge deals damage even without movement
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, distance: 3, targetCell: {q: 1, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 1, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. Target's hp is 80 (took 20 charge damage)
  2. ChargeEvent's fromPosition and toPosition are the same (no movement needed) OR charger stayed at {q: 0, r: 0}
  3. ChargeEvent includes `targetId: "target"` and `damage: 20`
- **Justification**: Edge case of charge adjacency -- validates that damage applies when already in melee range regardless of movement

---

### Test: charge-dodgeable-tickcost-one

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Charge has tickCost 1, creating a 1-tick delay between decision and resolution
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action where startedAtTick: 1, resolvesAtTick: 2, targeting {q: 3, r: 0}
  - Target (id: "target", position: {q: 3, r: 0}, hp: 100, slotPosition: 1)
- **Assertions**:
  1. `resolveCharges([charger, target], 1, rngState)` returns 0 events (tick 1, not resolution tick)
  2. `resolveCharges([charger, target], 2, rngState)` returns events with ChargeEvent (resolves at tick 2)
- **Justification**: Acceptance criterion -- "Charge is dodgeable: tickCost 1, intent line visible for 1 tick"

---

### Test: charge-interruptible-by-kick

- **File**: `src/engine/charge.test.ts`
- **Type**: integration
- **Verifies**: Kick (interrupt) resolves before Charge in processTick, cancelling the charge action
- **Setup**:
  - Kicker (id: "kicker", faction: "friendly", position: {q: 4, r: 0}, slotPosition: 0) with interrupt action targeting {q: 5, r: 0}, resolvesAtTick: 2 (startedAtTick: 2, tickCost: 0, range: 1)
  - Charger (id: "charger", faction: "enemy", position: {q: 5, r: 0}, slotPosition: 1) with charge action (damage: 20, targetCell: {q: 2, r: 0}, startedAtTick: 1, resolvesAtTick: 2)
  - Kicker is adjacent to charger (hex distance 1), targets charger's cell. Charger is channeling a charge action.
  - Use `processTick` at tick 2
- **Assertions**:
  1. Events include "interrupt" event with sourceId "kicker", targetId "charger" (kick resolved first)
  2. Charger's position remains {q: 5, r: 0} (charge was cancelled before charge resolution)
  3. Events do NOT include a "charge" event for "charger"
- **Justification**: Acceptance criterion -- "Charge is interruptible: Kick resolves before Charge"

---

### Test: charge-damage-separate-from-combat

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Charge damage is applied in charge resolution, separate from regular combat resolution
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 3, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges` directly (not through processTick)
- **Assertions**:
  1. Target's hp is 80 in the returned updatedCharacters (charge damage applied)
  2. Events include a DamageEvent with `{ type: "damage", sourceId: "charger", targetId: "target", damage: 20, resultingHp: 80 }`
  3. Events also include a ChargeEvent
- **Justification**: Acceptance criterion -- "Charge damage (20) applied in charge resolution phase, separate from regular combat". Also validates DamageEvent emission for `useDamageNumbers` hook integration.

---

### Test: charge-plus-attack-damage-same-tick

- **File**: `src/engine/charge.test.ts`
- **Type**: integration
- **Verifies**: A character can take charge damage AND regular attack damage in the same tick
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Attacker (id: "attacker", position: {q: 4, r: 0}, slotPosition: 2) with attack action (damage: 10, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 3, r: 0}, hp: 100, slotPosition: 1, currentAction: null)
  - Use `processTick` at tick 2
- **Assertions**:
  1. Target's hp is 70 (100 - 20 charge - 10 attack)
  2. Events include both a "charge" event and a "damage" event from the attacker
- **Justification**: Acceptance criterion -- "Character that takes Charge damage can also take regular attack damage same tick"

---

### Test: charge-resolves-before-regular-movement

- **File**: `src/engine/charge.test.ts`
- **Type**: integration
- **Verifies**: Charge resolution occurs before regular movement in processTick pipeline
- **Setup**:
  - Charger (id: "charger", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", faction: "enemy", position: {q: 3, r: 0}, hp: 100, slotPosition: 1) with move action targeting {q: 4, r: 0}, resolvesAtTick: 2
  - Use `processTick` at tick 2
- **Assertions**:
  1. Target moves to {q: 4, r: 0} (movement resolves after charge)
  2. Target took charge damage (hp is 80) -- charger arrived at {q: 2, r: 0} adjacent to {q: 3, r: 0} before target moved
  3. Charge resolved first (charger is at post-charge position), then movement resolved (target moved)
- **Justification**: Acceptance criterion -- "Charge resolves before regular movement (charger arrives before dodge-movers)". The charger's movement via charge happens before regular movement phase.

---

### Test: charge-emits-charge-event-with-correct-fields

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: ChargeEvent is emitted with all required fields
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 3, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. Events include a ChargeEvent matching `{ type: "charge", tick: 2, sourceId: "charger", fromPosition: {q: 0, r: 0}, toPosition: expect.any(Object), targetId: "target", damage: 20, resultingHp: 80 }`
- **Justification**: Validates ChargeEvent structure per the type definition in plan Step 1

---

### Test: charge-emits-damage-event-for-display-hooks

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Charge resolution emits a DamageEvent alongside ChargeEvent so that useDamageNumbers hook shows charge damage
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 2, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 2, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. Events include at least one event with `type: "damage"` and `{ sourceId: "charger", targetId: "target", damage: 20, resultingHp: 80 }`
  2. Events also include an event with `type: "charge"`
- **Justification**: Plan decision -- "Charge resolution emits BOTH a ChargeEvent AND a DamageEvent (for useDamageNumbers hook)". The DamageEvent ensures existing UI damage display infrastructure works.

---

### Test: charge-emits-death-event-when-killing-target

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: DeathEvent is emitted when charge damage kills the target
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 2, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 2, r: 0}, hp: 15, slotPosition: 1)
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. Target's hp is -5 (20 - 15)
  2. Events include a DeathEvent matching `{ type: "death", tick: 2, characterId: "target" }`
  3. DeathEvent appears after the DamageEvent in the events array (follows combat-death.test.ts pattern)
- **Justification**: Plan decision -- "Charge resolution emits DeathEvent like combat.ts does, for consistency and EventLog"

---

### Test: charge-miss-target-moved-away

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Charge misses if target is no longer at the locked cell after charger movement
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 5, r: 0}, hp: 100, slotPosition: 1) -- already moved away from {q: 3, r: 0}
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. Target's hp remains 100 (no damage)
  2. ChargeEvent includes `targetId: undefined` (no target at locked cell)
  3. Charger still moves toward {q: 3, r: 0} (movement happens regardless of target presence)
- **Justification**: Cell-based targeting pattern -- charge commits to locked cell, misses if target relocated

---

### Test: charge-multiple-chargers-slotposition-ordering

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Multiple chargers in the same tick are processed in slotPosition order, with sequential position updates
- **Setup**:
  - Charger1 (id: "charger1", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Charger2 (id: "charger2", position: {q: 0, r: -3}, slotPosition: 2) with charge action (damage: 20, targetCell: {q: 3, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 3, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges([charger1, charger2, target], 2, rngState)`
- **Assertions**:
  1. Charger1 processed first (slotPosition 0): moves toward target, attacks if adjacent
  2. Charger2 processed second (slotPosition 2): sees charger1's updated position, pathfinding accounts for it
  3. At least one ChargeEvent has sourceId "charger1" appearing before any ChargeEvent with sourceId "charger2" in the events array
- **Justification**: Plan decision -- "Multiple chargers: process by slotPosition order. First charger's position update is visible to subsequent chargers."

---

### Test: charge-returns-shallow-copies

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: resolveCharges returns shallow copies, not mutating originals
- **Setup**:
  - Charger (id: "charger", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 2, r: 0}, resolvesAtTick: 2)
  - Target (id: "target", position: {q: 2, r: 0}, hp: 100, slotPosition: 1)
  - Store references to original objects
  - Call `resolveCharges([charger, target], 2, rngState)`
- **Assertions**:
  1. `result.updatedCharacters.find(c => c.id === "target")` is not the same reference as the original target
  2. Original target hp is still 100
  3. Original charger position is still {q: 0, r: 0}
- **Justification**: Resolution module contract -- immutability. Follows healing.test.ts and combat.test.ts patterns.

---

### Test: charge-ignores-non-charge-actions (reviewer addition)

- **File**: `src/engine/charge.test.ts`
- **Type**: unit
- **Verifies**: Characters with attack, heal, move, or interrupt actions are not processed by resolveCharges
- **Setup**:
  - Attacker (id: "attacker", position: {q: 0, r: 0}, slotPosition: 0) with currentAction type "attack", resolvesAtTick: 2
  - Target (id: "target", position: {q: 1, r: 0}, hp: 100, slotPosition: 1)
  - Call `resolveCharges([attacker, target], 2, rngState)`
- **Assertions**:
  1. `result.events` has length 0 (no charge events emitted)
  2. Target's hp remains 100 (no damage)
  3. Attacker's position unchanged
- **Justification**: Ensures resolution module isolation -- charge resolution only processes charge actions. Follows pattern from `heal-ignores-attack-actions` and `interrupt-ignores-non-interrupt-actions`.

---

### Test: full-pipeline-healing-interrupts-charges-movement-combat (reviewer addition, integration)

- **File**: `src/engine/charge.test.ts`
- **Type**: integration
- **Verifies**: Full pipeline ordering in a single tick: Healing -> Interrupts -> Charges -> Movement -> Combat
- **Setup**:
  - Healer (id: "healer", faction: "friendly", position: {q: -2, r: 0}, slotPosition: 0) with heal action targeting {q: -1, r: 0}, healing: 25, resolvesAtTick: 3
  - WoundedAlly (id: "wounded", faction: "friendly", position: {q: -1, r: 0}, hp: 30, maxHp: 100, slotPosition: 1) -- heal target, no action
  - Kicker (id: "kicker", faction: "friendly", position: {q: 3, r: 0}, slotPosition: 2) with interrupt action targeting {q: 4, r: 0}, resolvesAtTick: 3 (instant)
  - EnemyChanneler (id: "channeler", faction: "enemy", position: {q: 4, r: 0}, slotPosition: 3) with attack action (resolvesAtTick: 4) -- will be interrupted
  - Charger (id: "charger", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 4) with charge action (damage: 20, targetCell: {q: 2, r: 0}, resolvesAtTick: 3)
  - ChargeTarget (id: "charge-target", faction: "enemy", position: {q: 2, r: 0}, hp: 100, slotPosition: 5) with move action targeting {q: 3, r: 0}, resolvesAtTick: 3
  - Attacker (id: "attacker", faction: "enemy", position: {q: 0, r: 1}, slotPosition: 6) with attack action targeting {q: -1, r: 0}, damage: 10, resolvesAtTick: 3
  - Use `processTick` at tick 3
- **Assertions**:
  1. WoundedAlly hp is 45 (healed 30+25=55, then took 10 attack damage = 45) -- healing resolved first, combat last
  2. EnemyChanneler's currentAction is null (interrupted by kicker)
  3. Events include "interrupt" event with sourceId "kicker"
  4. ChargeTarget took charge damage (hp is 80) -- charge resolved before movement
  5. ChargeTarget moved to {q: 3, r: 0} after charge -- movement resolved after charge
  6. Events include heal, interrupt, charge, movement, and damage events in logical order
- **Justification**: Validates the complete pipeline ordering: Healing -> Interrupts -> Charges -> Movement -> Combat. This is the key integration test requested for the final resolution order. Addresses the gap identified in review where only pairwise ordering was tested.

---

### Test: charge-kill-followed-by-combat-no-duplicate-death (reviewer addition, integration)

- **File**: `src/engine/charge.test.ts`
- **Type**: integration
- **Verifies**: Character killed by charge is properly handled by subsequent combat phase (Risk Area 2 from plan)
- **Setup**:
  - Charger (id: "charger", faction: "friendly", position: {q: 0, r: 0}, slotPosition: 0) with charge action (damage: 20, targetCell: {q: 2, r: 0}, resolvesAtTick: 2)
  - Victim (id: "victim", faction: "enemy", position: {q: 2, r: 0}, hp: 15, slotPosition: 1) -- will die from charge damage
  - Attacker (id: "attacker", faction: "friendly", position: {q: 3, r: 0}, slotPosition: 2) with attack action targeting {q: 2, r: 0}, damage: 10, resolvesAtTick: 2
  - Use `processTick` at tick 2
- **Assertions**:
  1. Victim is removed from characters in the resulting state (filtered by processTick dead-character removal)
  2. Events include a "death" event for "victim"
  3. Events include a "charge" event with sourceId "charger"
  4. Victim's hp went negative from charge damage (charge was lethal)
- **Justification**: Validates that charge-killed characters are properly removed from the game state by processTick and that the death detection/removal pipeline works correctly across resolution phases. Addresses Risk Area 2 from the plan (death detection timing for charge kills).

---

## File 3: `src/engine/skill-registry-interrupt-charge.test.ts`

### Test: kick-has-correct-intrinsic-stats

- **File**: `src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: Kick registry entry has the correct stats per requirements
- **Setup**:
  - Look up "kick" in SKILL_REGISTRY
- **Assertions**:
  1. `kick.id` is `"kick"`
  2. `kick.name` is `"Kick"`
  3. `kick.actionType` is `"interrupt"`
  4. `kick.tickCost` is `0`
  5. `kick.range` is `1`
  6. `kick.damage` is `0`
  7. `kick.cooldown` is `4`
  8. `kick.innate` is `false`
  9. `kick.defaultTarget` is `"enemy"`
  10. `kick.defaultCriterion` is `"nearest"`
  11. `kick.targetingMode` is `"cell"`
- **Justification**: Validates Kick registry entry matches the spec definition exactly. Follows pattern from `skill-registry-new-skills.test.ts`.

---

### Test: charge-has-correct-intrinsic-stats

- **File**: `src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: Charge registry entry has the correct stats per requirements
- **Setup**:
  - Look up "charge" in SKILL_REGISTRY
- **Assertions**:
  1. `charge.id` is `"charge"`
  2. `charge.name` is `"Charge"`
  3. `charge.actionType` is `"charge"`
  4. `charge.tickCost` is `1`
  5. `charge.range` is `3`
  6. `charge.damage` is `20`
  7. `charge.distance` is `3`
  8. `charge.cooldown` is `3`
  9. `charge.innate` is `false`
  10. `charge.defaultTarget` is `"enemy"`
  11. `charge.defaultCriterion` is `"nearest"`
  12. `charge.targetingMode` is `"cell"`
- **Justification**: Validates Charge registry entry matches the spec definition exactly.

---

### Test: kick-gets-default-channeling-trigger-and-filter

- **File**: `src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: Kick definition includes defaultTrigger with channeling condition and defaultFilter with channeling condition
- **Setup**:
  - Look up "kick" in SKILL_REGISTRY
- **Assertions**:
  1. `kick.defaultTrigger` deep equals `{ scope: "enemy", condition: "channeling" }`
  2. `kick.defaultFilter` deep equals `{ condition: "channeling" }`
- **Justification**: Validates the new `defaultTrigger`/`defaultFilter` fields on SkillDefinition per plan Step 3 and acceptance criterion for default Kick config.

---

### Test: charge-gets-default-in-range-trigger

- **File**: `src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: Charge definition includes defaultTrigger with in_range(3) condition
- **Setup**:
  - Look up "charge" in SKILL_REGISTRY
- **Assertions**:
  1. `charge.defaultTrigger` deep equals `{ scope: "enemy", condition: "in_range", conditionValue: 3 }`
  2. `charge.defaultFilter` is `undefined` (Charge has no default filter)
- **Justification**: Validates Charge default trigger config per plan Step 7.

---

### Test: createSkillFromDefinition-propagates-default-trigger-and-filter

- **File**: `src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: createSkillFromDefinition uses defaultTrigger and defaultFilter from the definition instead of hardcoded "always" trigger
- **Setup**:
  - Look up "kick" in SKILL_REGISTRY, call `createSkillFromDefinition(kickDef)`
  - Look up "charge" in SKILL_REGISTRY, call `createSkillFromDefinition(chargeDef)`
  - Look up "light-punch" in SKILL_REGISTRY, call `createSkillFromDefinition(lightPunchDef)` for backward-compatibility check
- **Assertions**:
  1. Kick skill's `trigger` equals `{ scope: "enemy", condition: "channeling" }` (from defaultTrigger)
  2. Kick skill has `filter` matching `{ condition: "channeling" }` (from defaultFilter)
  3. Charge skill's `trigger` equals `{ scope: "enemy", condition: "in_range", conditionValue: 3 }` (from defaultTrigger)
  4. Light Punch skill's `trigger` equals `{ scope: "enemy", condition: "always" }` (backward compatible -- no defaultTrigger on definition, falls back to "always")
- **Justification**: Validates the defaultTrigger/defaultFilter propagation in createSkillFromDefinition per plan Step 3, and backward compatibility for existing skills.

---

### Test: getDefaultSkills-includes-correct-triggers-for-kick-and-charge

- **File**: `src/engine/skill-registry-interrupt-charge.test.ts`
- **Type**: unit
- **Verifies**: getDefaultSkills produces skills with correct triggers/filters from defaultTrigger/defaultFilter (only applicable to innate skills, but function uses same logic)
- **Setup**:
  - Call `getDefaultSkills()` -- note: Kick and Charge are NOT innate, so they won't appear. This test actually validates that getDefaultSkills' trigger logic is consistent with createSkillFromDefinition.
  - Alternative: Call `createSkillFromDefinition` for kick and charge definitions and verify the resulting Skill objects
- **Assertions**:
  1. Skills returned by `getDefaultSkills()` (currently just Move) still have trigger `{ scope: "enemy", condition: "always" }` (Move has no defaultTrigger, backward compatible)
  2. `createSkillFromDefinition` for Kick returns skill with actionType "interrupt", damage 0, tickCost 0, cooldown 4
  3. `createSkillFromDefinition` for Charge returns skill with actionType "charge", damage 20, distance 3, tickCost 1, cooldown 3
- **Justification**: Ensures both factory functions handle the new defaultTrigger/defaultFilter fields correctly and existing skills are unaffected.

---

## File 4: Updates to Existing Test Files (documented, not fully designed)

### Updates to `src/engine/game-actions.test.ts`

Two new tests should be added:

1. **Interrupt skill creates action with cell targeting (like attack):** Create a character with an interrupt skill (actionType: "interrupt", range: 1), an enemy at distance 1. Call `createSkillAction`. Assert action.type is "interrupt", action.targetCell equals enemy's position.

2. **Charge skill creates action with cell targeting (like attack):** Create a character with a charge skill (actionType: "charge", range: 3, distance: 3), an enemy at distance 3. Call `createSkillAction`. Assert action.type is "charge", action.targetCell equals enemy's position, action.startedAtTick and resolvesAtTick differ by tickCost.

### Updates to `src/engine/game-decisions-action-type-inference.test.ts`

Two new tests should be added:

1. **Interrupt action type in computeDecisions:** Create a character with an interrupt skill (actionType: "interrupt", tickCost: 0, range: 1), channeling enemy at distance 1. Use channeling trigger. Call `computeDecisions`. Assert decision action.type is "interrupt".

2. **Charge action type in computeDecisions:** Create a character with a charge skill (actionType: "charge", tickCost: 1, range: 3), enemy at distance 3. Call `computeDecisions`. Assert decision action.type is "charge" and resolvesAtTick equals currentTick + 1.
