# Fix Plan: Cooldown Integration Test Failures

## Root Cause Analysis

### Core Issue: The Idle Action Paradox

The implementation has a logical inconsistency between idle actions and cooldown decrement:

1. **`decrementCooldowns`** (game-core.ts:205-229) skips characters with `currentAction !== null`
2. **Idle characters** get an explicit IDLE action (`type: "idle"`, `tickCost: 1`) created by `createIdleAction` (game-actions.ts:26-50)
3. **Result**: Cooldowns never decrement because idle characters have `currentAction !== null`

This creates a paradox: if a character's only skill is on cooldown, they take an idle action, which prevents cooldown from decrementing, keeping the skill on cooldown forever.

### Test-Specific Analyses

#### Test 1: "cooldown-full-cycle-tickCost-then-cooldown"

At tick 3, the skill is on cooldown (remaining=2), so `computeDecisions` rejects it and creates an IDLE action. The IDLE action means `currentAction !== null`, so `decrementCooldowns` skips this character. Cooldown stays at 2 instead of decrementing to 1.

#### Test 2: "cooldown-blocks-skill-until-ready"

Same idle action paradox. The test manually sets `currentAction: null` hoping to force idle state, but `processTick` runs `computeDecisions` first, which creates an idle action before `decrementCooldowns` runs.

#### Test 3: "duplicate-skills-independent-cooldowns-through-ticks"

Different issue. The test expects `currentAction.skill.instanceId = "move1"` after tick 1, but the decision phase runs at START of a tick (before resolution). After tick 1 processing, the character is idle (`currentAction=null`), not executing a new action. The test expectation is wrong about timing.

---

## Recommendation: Fix Implementation + Fix Test 3

### Implementation Fix

**File:** `/home/bob/Projects/auto-battler/src/engine/game-core.ts`

**Function:** `decrementCooldowns` (lines 205-229)

**Change at line 208:**

```typescript
// Before:
if (character.currentAction !== null) {
  return character;
}

// After:
if (
  character.currentAction !== null &&
  character.currentAction.type !== "idle"
) {
  return character;
}
```

This allows cooldowns to decrement for characters taking idle actions.

### Test Fix

**File:** `/home/bob/Projects/auto-battler/src/engine/game-cooldown-integration.test.ts`

**Test 3 at lines 226-231:**

```typescript
// Before:
expect(char1?.currentAction?.skill.instanceId).toBe("move1");
expect(move1_tick1?.cooldownRemaining).toBeGreaterThan(0);

// After:
expect(char1?.currentAction).toBeNull(); // Action resolved, no new decision yet
expect(move1_tick1?.cooldownRemaining).toBe(0); // Decremented after action cleared

// Add verification that move1 is selected at tick 2:
const state2 = createGameState({
  tick: 2,
  characters: result1.state.characters,
});
const result2 = processTick(state2);
const char2 = result2.state.characters.find((c) => c.id === "char1");
expect(char2?.currentAction?.skill.instanceId).toBe("move1");
```

---

## Summary of Changes

| File                                                                           | Line    | Change                                                        |
| ------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------- |
| `/home/bob/Projects/auto-battler/src/engine/game-core.ts`                      | 208     | Add `&& character.currentAction.type !== "idle"` to condition |
| `/home/bob/Projects/auto-battler/src/engine/game-cooldown-integration.test.ts` | 226-231 | Fix timing expectations and add tick 2 verification           |
