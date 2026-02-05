# Test Designs: Per-Skill Targeting Mode and Cooldown System

## Overview

This document contains test designs for two independent features:

- **C1: Per-skill targeting mode** - Character vs. cell-based targeting for skills
- **C2: Cooldown system** - Per-instance skill cooldowns with post-resolution timing

Tests are ordered for RED phase implementation: unit tests first, then integration tests.

---

## C1: Per-Skill Targeting Mode

### Test File: `/home/bob/Projects/auto-battler/src/engine/healing-targeting-mode.test.ts`

New file for character-targeting behavior in healing resolution.

---

### Test: heal-character-targeting-lands-on-moved-target

- **File**: `/home/bob/Projects/auto-battler/src/engine/healing-targeting-mode.test.ts`
- **Type**: unit
- **Verifies**: Heal with `targetingMode: "character"` lands on target even when target has moved during wind-up
- **Setup**:
  - Create healer with currentAction containing:
    - type="heal"
    - targetCell={q:1, r:0}
    - targetCharacter: full Character object with id="target", position at original {q:1, r:0}
  - Create target character (same id="target") at NEW position {q:2, r:0} (simulating movement during wind-up)
  - Both have hp < maxHp so healing applies
  - Skill registry must have "heal" with `targetingMode: "character"` (use actual registry or mock)
- **Assertions**:
  1. Target HP increases by heal amount
  2. Heal event has targetId="target"
  3. Heal event resultingHp is correct
- **Justification**: Core behavior of character targeting - heal must track the actual character, not the cell they were in when action started. This is the primary fix for the "heal whiff" bug where heals miss allies who move.

---

### Test: heal-character-targeting-fails-on-dead-target

- **File**: `/home/bob/Projects/auto-battler/src/engine/healing-targeting-mode.test.ts`
- **Type**: unit
- **Verifies**: Heal with `targetingMode: "character"` misses if target died during wind-up
- **Setup**:
  - Create healer with currentAction containing:
    - type="heal"
    - targetCell={q:1, r:0}
    - targetCharacter: full Character object with id="target"
  - Create target character (same id="target") with hp=0 (died during wind-up)
- **Assertions**:
  1. No heal events generated
  2. Target remains at hp=0
- **Justification**: Dead characters should not be healed. Edge case where target dies before heal resolves (e.g., killed by enemy attack that resolved first).

---

### Test: heal-character-targeting-finds-target-by-id

- **File**: `/home/bob/Projects/auto-battler/src/engine/healing-targeting-mode.test.ts`
- **Type**: unit
- **Verifies**: Character targeting looks up target by ID, not object reference
- **Setup**:
  - Create healer with currentAction containing targetCharacter with id="target"
  - Create target character with same ID ("target") but as a DIFFERENT JavaScript object (simulating immutable state updates - e.g., `{ ...originalTarget, position: newPosition }`)
  - Target is at a different position than targetCell
- **Assertions**:
  1. Heal lands on the character found by ID lookup
  2. Heal event generated with correct targetId
- **Justification**: Since state is immutable, the targetCharacter reference from decision time may be stale. Lookup by ID ensures we find the current character state.

---

### Test: heal-character-targeting-fallback-when-targetCharacter-null

- **File**: `/home/bob/Projects/auto-battler/src/engine/healing-targeting-mode.test.ts`
- **Type**: unit
- **Verifies**: Heal falls back to cell targeting if targetCharacter is null (defensive coding)
- **Setup**:
  - Create healer with currentAction containing:
    - type="heal"
    - targetCell={q:1, r:0}
    - targetCharacter=null (edge case: malformed action)
  - Create character at targetCell {q:1, r:0}
- **Assertions**:
  1. Heal lands on character at targetCell
  2. No errors thrown
- **Justification**: Defensive coding - ensures backwards compatibility and graceful handling of edge cases where targetCharacter is unexpectedly null.

---

### Test: attack-still-uses-cell-targeting

- **File**: `/home/bob/Projects/auto-battler/src/engine/combat-targeting-mode.test.ts`
- **Type**: unit
- **Verifies**: Attack skills with `targetingMode: "cell"` continue to use cell-based targeting (dodge works)
- **Setup**:
  - Create attacker with currentAction: type="attack", targetCell={q:2, r:0}
  - Create target character at NEW position {q:3, r:0} (moved away from targetCell)
- **Assertions**:
  1. No damage events targeting the moved character
  2. Attack "misses" the cell (no character there)
- **Justification**: Preserves existing dodge behavior. Attacks hit cells, not characters, so movement creates dodge opportunities.

---

### Test: attack-hits-different-character-in-cell

- **File**: `/home/bob/Projects/auto-battler/src/engine/combat-targeting-mode.test.ts`
- **Type**: unit
- **Verifies**: Cell-targeted attack hits any character in the target cell
- **Setup**:
  - Create attacker with currentAction: type="attack", targetCell={q:2, r:0}
  - Create original target at different position (moved away)
  - Create bystander at {q:2, r:0}
- **Assertions**:
  1. Damage event targets bystander, not original target
  2. Bystander HP reduced
- **Justification**: Cell targeting means the skill hits whoever is in the cell at resolution time. This is existing behavior that must be preserved.

---

### Test File: `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-targeting.test.ts`

New file for intent line behavior with targeting modes.

---

### Test: intent-line-tracks-character-targeted-heal

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-targeting.test.ts`
- **Type**: unit
- **Verifies**: IntentData.targetPosition updates to reflect character's current position for character-targeted skills
- **Setup**:
  - Create character A with heal action targeting character B
  - Character B's position differs from action.targetCell (B has moved)
  - Action uses skill with id="heal" (character targeting mode)
- **Assertions**:
  1. selectIntentData returns entry with targetPosition equal to B's current position
  2. targetPosition is NOT equal to action.targetCell
- **Justification**: Visual intent lines should show where the heal will land, which for character-targeted skills is the target's current position.

---

### Test: intent-line-uses-cell-for-attack

- **File**: `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-intent-targeting.test.ts`
- **Type**: unit
- **Verifies**: IntentData.targetPosition uses locked targetCell for cell-targeted skills
- **Setup**:
  - Create character A with attack action targeting cell {q:2, r:0}
  - Original target has moved to {q:3, r:0}
  - Action uses skill with id="light-punch" (cell targeting mode)
- **Assertions**:
  1. selectIntentData returns entry with targetPosition equal to {q:2, r:0}
  2. targetPosition matches action.targetCell exactly
- **Justification**: Attack intent lines show the targeted cell, not where the enemy might have moved.

---

### Test File: `/home/bob/Projects/auto-battler/src/engine/game-targeting-integration.test.ts`

Integration tests for targeting mode through full processTick flow.

---

### Test: heal-tracks-ally-through-full-tick

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-targeting-integration.test.ts`
- **Type**: integration
- **Verifies**: Heal lands on ally who moves during wind-up in full processTick
- **Setup**:
  - Healer with 2-tick heal action (started tick 0, resolves tick 2)
  - Target ally with move action (resolves tick 2, same tick as heal)
  - Ally moves from targetCell to new position
- **Assertions**:
  1. Heal event generated with correct targetId
  2. Ally HP increases
  3. Movement event shows ally moved
  4. Final ally HP reflects both heal and position change
- **Justification**: End-to-end validation that heal + movement on same tick work correctly with character targeting.

---

### Test: attack-misses-dodging-character

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-targeting-integration.test.ts`
- **Type**: integration
- **Verifies**: Attack misses when target moves away (dodge), existing behavior preserved
- **Setup**:
  - Attacker with 2-tick attack (resolves tick 2)
  - Target with 1-tick move away (resolves tick 2, movement before combat)
- **Assertions**:
  1. No damage event for the dodging character
  2. Target HP unchanged
  3. Movement event shows target moved
- **Justification**: Regression test ensuring cell targeting for attacks remains unchanged.

---

## C2: Cooldown System

### Test File: `/home/bob/Projects/auto-battler/src/engine/game-decisions-cooldown.test.ts`

New file for cooldown rejection in decision phase.

---

### Test: skill-on-cooldown-rejected

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Skill with `cooldownRemaining > 0` is rejected with reason `on_cooldown`
- **Setup**:
  - Create character with skill having cooldownRemaining=2 (use updated createSkill helper)
  - Skill has triggers=[{type:"always"}] so would normally fire
  - Enemy in range so targeting would succeed
- **Assertions**:
  1. evaluateSkillsForCharacter returns status="rejected"
  2. rejectionReason="on_cooldown"
- **Justification**: Core cooldown behavior - skills cannot be used while on cooldown.

---

### Test: skill-cooldown-zero-is-available

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Skill with `cooldownRemaining=0` is available for selection
- **Setup**:
  - Create character with skill having cooldownRemaining=0 (explicitly set)
  - Skill has triggers=[{type:"always"}], enemy in range
- **Assertions**:
  1. evaluateSkillsForCharacter returns status="selected"
  2. No rejectionReason
- **Justification**: Cooldown of 0 means ready to use.

---

### Test: skill-cooldown-undefined-is-available

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Skill without cooldownRemaining field is available (backward compatibility)
- **Setup**:
  - Create character with skill having NO cooldownRemaining property (undefined)
  - Skill has triggers=[{type:"always"}], enemy in range
- **Assertions**:
  1. evaluateSkillsForCharacter returns status="selected"
- **Justification**: Existing skills don't have cooldownRemaining. They must continue to work.

---

### Test: cooldown-skips-to-next-skill

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-cooldown.test.ts`
- **Type**: unit
- **Verifies**: When first skill is on cooldown, second skill is evaluated and selected
- **Setup**:
  - Character with two skills: skill1 (cooldownRemaining=3), skill2 (no cooldown)
  - Both skills have valid triggers and target
- **Assertions**:
  1. skill1 status="rejected", rejectionReason="on_cooldown"
  2. skill2 status="selected"
  3. selectedSkillIndex=1
- **Justification**: Priority fallthrough must work with cooldown rejection.

---

### Test File: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`

New file for cooldown decrement and apply logic in game-core.

---

### Test: cooldown-set-when-action-applied

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: applyDecisions sets cooldownRemaining on the used skill
- **Setup**:
  - Create a test skill definition with cooldown=3 (either mock getSkillDefinition or use a real skill)
  - Character with skill having id matching the test definition
  - Decision to use that skill
- **Assertions**:
  1. After applyDecisions, skill.cooldownRemaining=3
  2. Other skills on character unaffected
- **Justification**: Cooldown must be initialized when skill is used.

---

### Test: cooldown-set-uses-instanceId

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: applyDecisions sets cooldown on correct instance when duplicates exist
- **Setup**:
  - Character with 2 instances of same skill (e.g., move-towards with instanceId "move1" and "move2")
  - Both have same id but different instanceId
  - Decision uses skill with instanceId="move2"
  - Skill definition in registry has cooldown defined
- **Assertions**:
  1. Skill with instanceId="move2" has cooldownRemaining set
  2. Skill with instanceId="move1" has no cooldownRemaining (undefined or 0)
- **Justification**: Duplicate skills must have independent cooldowns tracked by instanceId.

---

### Test: cooldown-not-set-for-skills-without-registry-cooldown

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Skills without cooldown in registry don't get cooldownRemaining set
- **Setup**:
  - Character with skill that has no cooldown defined in registry (e.g., current light-punch)
  - Decision to use that skill
- **Assertions**:
  1. After applyDecisions, skill.cooldownRemaining is undefined or 0
- **Justification**: Backward compatibility - existing skills without cooldown stay ready.

---

### Test: cooldown-not-set-for-registry-cooldown-zero

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Skills with cooldown=0 in registry don't get cooldownRemaining set
- **Setup**:
  - Create skill definition with cooldown=0 (explicit zero)
  - Character with skill matching that definition
  - Decision to use that skill
- **Assertions**:
  1. After applyDecisions, skill.cooldownRemaining is undefined or 0 (not set to 0 explicitly)
- **Justification**: cooldown=0 in registry should behave same as undefined - no lockout.

---

### Test: cooldown-decrements-when-idle

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: decrementCooldowns reduces cooldownRemaining by 1 when character has no currentAction
- **Setup**:
  - Character with currentAction=null
  - Skill with cooldownRemaining=3
- **Assertions**:
  1. After decrementCooldowns, skill.cooldownRemaining=2
- **Justification**: Core cooldown timing - decrements each tick when idle.

---

### Test: cooldown-paused-during-action

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: decrementCooldowns does NOT reduce cooldownRemaining when character has currentAction
- **Setup**:
  - Character with currentAction (mid-action, any valid action)
  - Skill with cooldownRemaining=3
- **Assertions**:
  1. After decrementCooldowns, skill.cooldownRemaining=3 (unchanged)
- **Justification**: Cooldown only ticks when idle - this is the "post-resolution" timing model.

---

### Test: cooldown-decrements-to-zero

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Cooldown stops at 0, does not go negative
- **Setup**:
  - Character with currentAction=null
  - Skill with cooldownRemaining=1
- **Assertions**:
  1. After decrementCooldowns, skill.cooldownRemaining=0
  2. Call decrementCooldowns again, still 0
- **Justification**: Cooldown should not go negative or wrap.

---

### Test: cooldown-independent-per-instance

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-core-cooldown.test.ts`
- **Type**: unit
- **Verifies**: Multiple instances of same skill have independent cooldowns
- **Setup**:
  - Character with 2 move skills: move1 (cooldownRemaining=2), move2 (cooldownRemaining=0)
  - Character has currentAction=null
- **Assertions**:
  1. After decrementCooldowns: move1.cooldownRemaining=1, move2.cooldownRemaining=0
- **Justification**: Duplicate skills must track cooldowns independently.

---

### Test File: `/home/bob/Projects/auto-battler/src/engine/game-cooldown-integration.test.ts`

Integration tests for cooldown through full processTick flow.

---

### Test: cooldown-full-cycle-tickCost-then-cooldown

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-cooldown-integration.test.ts`
- **Type**: integration
- **Verifies**: Total lockout = tickCost + cooldown (post-resolution timing)
- **Setup**:
  - Skill with tickCost=2 and cooldown=3 (from registry or mock)
  - Character uses skill at tick 0
  - Run processTick through tick 5
- **Assertions**:
  1. Tick 0: Action committed, cooldownRemaining=3 set by applyDecisions
  2. Tick 1: Mid-action (currentAction exists), cooldown unchanged (still 3) because decrement skipped for active characters
  3. Tick 2: Action resolves. Decrement runs BEFORE clear (character still has action), so cooldown unchanged (still 3). Then clearResolvedActions clears action.
  4. Tick 3: Idle (no action), cooldown=2
  5. Tick 4: Idle, cooldown=1
  6. Tick 5: Idle, cooldown=0 (ready)
- **Justification**: End-to-end validation of the "tickCost + cooldown" lockout model. Total lockout = 2 (wind-up) + 3 (cooldown) = 5 ticks.

---

### Test: cooldown-blocks-skill-until-ready

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-cooldown-integration.test.ts`
- **Type**: integration
- **Verifies**: Skill on cooldown cannot be selected by decision system until cooldown=0
- **Setup**:
  - Character with skill having cooldownRemaining=2
  - Character has a fallback skill without cooldown
  - Run processTick, character should select fallback skill
  - Decrement cooldown to 0 (run 2 more idle ticks)
  - Run processTick again
- **Assertions**:
  1. First processTick: fallback skill selected (not the cooled-down skill)
  2. After cooldown=0: original skill can be selected
- **Justification**: Integration of cooldown check with decision system.

---

### Test: duplicate-skills-independent-cooldowns-through-ticks

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-cooldown-integration.test.ts`
- **Type**: integration
- **Verifies**: Using skill instance A doesn't affect cooldown of instance B
- **Setup**:
  - Character with 2 move skills (cooldown=1 each in registry)
  - Use move1 at tick 0
  - Run 2 ticks
  - Check move2 is still available while move1 is on cooldown
- **Assertions**:
  1. move1.cooldownRemaining starts at 1 after use
  2. move2.cooldownRemaining stays undefined/0
  3. Decision system can select move2 even while move1 on cooldown
- **Justification**: Per-instance cooldown tracking for duplicate skills.

---

## Implementation Order for RED Phase

### Phase 1: C1 Unit Tests (healing-targeting-mode.test.ts, combat-targeting-mode.test.ts)

1. heal-character-targeting-lands-on-moved-target
2. heal-character-targeting-fails-on-dead-target
3. heal-character-targeting-finds-target-by-id
4. heal-character-targeting-fallback-when-targetCharacter-null (NEW)
5. attack-still-uses-cell-targeting
6. attack-hits-different-character-in-cell

### Phase 2: C1 Selector Tests (gameStore-selectors-intent-targeting.test.ts)

7. intent-line-tracks-character-targeted-heal
8. intent-line-uses-cell-for-attack

### Phase 3: C1 Integration Tests (game-targeting-integration.test.ts)

9. heal-tracks-ally-through-full-tick
10. attack-misses-dodging-character

### Phase 4: C2 Decision Tests (game-decisions-cooldown.test.ts)

11. skill-on-cooldown-rejected
12. skill-cooldown-zero-is-available
13. skill-cooldown-undefined-is-available
14. cooldown-skips-to-next-skill

### Phase 5: C2 Core Tests (game-core-cooldown.test.ts)

15. cooldown-set-when-action-applied
16. cooldown-set-uses-instanceId
17. cooldown-not-set-for-skills-without-registry-cooldown
18. cooldown-not-set-for-registry-cooldown-zero (NEW)
19. cooldown-decrements-when-idle
20. cooldown-paused-during-action
21. cooldown-decrements-to-zero
22. cooldown-independent-per-instance

### Phase 6: C2 Integration Tests (game-cooldown-integration.test.ts)

23. cooldown-full-cycle-tickCost-then-cooldown
24. cooldown-blocks-skill-until-ready
25. duplicate-skills-independent-cooldowns-through-ticks

---

## Test Helper Updates Needed

The `createSkill` helper in `/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts` needs to support:

- `cooldownRemaining?: number` - for creating skills with active cooldowns

Add to the Skill interface extension in the helper:

```typescript
export function createSkill(overrides: Partial<Skill> & { id: string }): Skill {
  return {
    // ... existing fields ...
    cooldownRemaining: overrides.cooldownRemaining, // NEW - optional field
  };
}
```

No other helper updates expected - existing helpers should suffice.

---

## Spec Alignment

- [x] Tests verify heal tracks target during wind-up (spec: heal-whiff fix)
- [x] Tests verify attack still uses cell targeting (spec: dodge preserved)
- [x] Tests verify cooldown rejection with clear reason (spec: rejection reasons)
- [x] Tests verify cooldown decrements each tick when idle (spec: post-resolution timing)
- [x] Tests verify per-instance cooldown tracking (spec: duplicate skills)
- [x] Tests verify total lockout = tickCost + cooldown (spec: timing model)

---

## Review Status

**APPROVED**

### Review Summary

The test designs have been reviewed and approved with the following additions:

**Added Tests (2):**

1. `heal-character-targeting-fallback-when-targetCharacter-null` - Defensive coding edge case
2. `cooldown-not-set-for-registry-cooldown-zero` - Explicit zero cooldown edge case

**Clarifications Made:**

- Setup for `heal-character-targeting-lands-on-moved-target` clarified that targetCharacter must be a full Character object
- Setup for `cooldown-set-when-action-applied` clarified that test must mock or use real skill with cooldown
- Assertions for `cooldown-full-cycle-tickCost-then-cooldown` clarified timing order (decrement runs before clearResolvedActions)

**Total Test Count:** 25 tests (was 23, added 2)

**Review Date:** 2026-02-05
**Reviewer:** Architect Agent (TEST_DESIGN_REVIEW phase)
