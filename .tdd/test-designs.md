# Test Designs -- Phase 3: New Trigger Conditions

## Review Status

**APPROVED** -- Reviewed 2026-02-08 by TEST_DESIGN_REVIEW agent.

Findings:

1. Fixed File 2 imports: added `createSkill` (needed by `idle-all-enemies-busy` test setup).
2. Added `idle-multiple-enemies-one-idle` test -- plan Step 2.3 specified this but it was omitted from designs. Needed for existential `pool.some()` coverage parity with channeling tests.
3. Added `idle-ally-scope-channeling-false` test -- negative case for ally scope idle, symmetric with channeling tests that have both positive and negative ally-scope cases.
4. Updated test count summary (4 -> 6 for idle file, 36 -> 38 new, 42 -> 44 total).
5. Verified all acceptance criteria are covered.
6. Verified all test setups against source code in `triggers.ts` lines 39-91 and `evaluateTrigger()` lines 107-151. All assertions are correct.
7. No redundant tests found. No correctness issues in existing designs.

## Overview

Tests for `channeling`, `idle`, and `targeting_ally` conditions in trigger context, NOT modifier extensions, and TriggerDropdown UI additions. All engine tests call `evaluateTrigger(trigger, evaluator, allCharacters)` and assert a boolean result. UI tests use Testing Library with `userEvent`.

**Pattern reference:** `src/engine/triggers-cell-targeted.test.ts` (engine), `src/components/CharacterPanel/TriggerDropdown.test.tsx` (UI).

---

## File 1: `src/engine/triggers-channeling.test.ts`

**Imports:** `{ describe, it, expect }` from `vitest`, `{ evaluateTrigger }` from `./triggers`, `{ Trigger }` from `./types`, `{ createCharacter, createAction, createSkill }` from `./triggers-test-helpers`.

**Top-level describe:** `evaluateTrigger - channeling condition`

---

### Test: channeling-enemy-basic-true

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Enemy with a non-null `currentAction` satisfies `{ scope: "enemy", condition: "channeling" }`
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true)`
- **Justification**: Core happy path -- verifies that a channeling enemy is detected. Without this, the most basic channeling trigger would be untested in trigger context.

---

### Test: channeling-enemy-idle-false

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Enemy with `currentAction === null` does NOT satisfy channeling trigger
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: Ensures idle enemies are not falsely detected as channeling. Guards against a default-true regression.

---

### Test: channeling-enemy-scope-ignores-ally

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Channeling ally is ignored when scope is `"enemy"`
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally])).toBe(false)`
- **Justification**: Validates scope filtering -- same-faction characters must be excluded from enemy pool. Prevents cross-faction pool contamination bugs.

---

### Test: channeling-ally-scope-true

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: `{ scope: "ally", condition: "channeling" }` fires when an ally has a `currentAction`
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `currentAction: createAction({ type: "heal", targetCell: {q:3,r:2}, resolvesAtTick: 2 })`
  - `trigger`: `{ scope: "ally", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally])).toBe(true)`
- **Justification**: Acceptance criterion requires `{ scope: "ally", condition: "channeling" }` to work. Validates that ally scope correctly includes same-faction, non-self characters.

---

### Test: channeling-ally-scope-idle-false

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Ally scope channeling returns false when ally is idle
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `currentAction: null`
  - `trigger`: `{ scope: "ally", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally])).toBe(false)`
- **Justification**: Negative case for ally scope -- ensures idle allies are not detected as channeling.

---

### Test: channeling-ally-scope-excludes-self

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Evaluator's own `currentAction` is NOT included in ally pool
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - No other characters (allCharacters = `[evaluator]`)
  - `trigger`: `{ scope: "ally", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator])).toBe(false)`
- **Justification**: The ally pool must exclude the evaluator (`c.id !== evaluator.id`). Without this test, a bug that includes self in ally pool would go undetected.

---

### Test: channeling-qualifier-skill-match

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: `qualifier: { type: "skill", id: "heal" }` matches only when enemy is channeling Heal
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "heal", skill: createSkill({ id: "heal", healing: 25 }), targetCell: {q:3,r:2}, resolvesAtTick: 2 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling", qualifier: { type: "skill", id: "heal" } }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true)`
- **Justification**: Acceptance criterion: `channeling` with skill qualifier fires only for the specified skill. Tests the `matchesChannelingQualifier` path for `qualifier.type === "skill"`.

---

### Test: channeling-qualifier-skill-no-match

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Skill qualifier rejects when enemy channels a different skill
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", skill: createSkill({ id: "heavy-punch", damage: 25 }), targetCell: {q:3,r:2}, resolvesAtTick: 2 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling", qualifier: { type: "skill", id: "heal" } }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: Ensures skill qualifier is strictly matched. Without this, a qualifier that always returns true would not be caught.

---

### Test: channeling-qualifier-action-type-match

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: `qualifier: { type: "action", id: "attack" }` matches when enemy channels an attack
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling", qualifier: { type: "action", id: "attack" } }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true)`
- **Justification**: Acceptance criterion: `channeling` with action-type qualifier. Tests `qualifier.type === "action"` branch in `matchesChannelingQualifier`.

---

### Test: channeling-qualifier-action-type-no-match

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Action-type qualifier rejects when enemy channels a heal instead of attack
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "heal", skill: createSkill({ id: "heal", healing: 25 }), targetCell: {q:0,r:0}, resolvesAtTick: 2 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling", qualifier: { type: "action", id: "attack" } }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: Negative case for action-type qualifier. Ensures the qualifier compares `candidate.currentAction.type` against `qualifier.id`, not the skill id.

---

### Test: channeling-multiple-enemies-one-channeling

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Trigger fires when at least one enemy is channeling (existential `pool.some()` semantics)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemyA`: enemy faction, id `"enemyA"`, position `{q:2,r:3}`, `currentAction: null`
  - `enemyB`: enemy faction, id `"enemyB"`, position `{q:1,r:4}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemyA, enemyB])).toBe(true)`
- **Justification**: Confirms existential semantics -- only one character in the pool needs to satisfy the condition. This is the core trigger pool evaluation model.

---

### Test: channeling-dead-enemy-excluded

- **File**: `src/engine/triggers-channeling.test.ts`
- **Type**: unit
- **Verifies**: Dead enemy with `currentAction` is excluded from pool (hp filter)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `deadEnemy`: enemy faction, id `"dead"`, position `{q:2,r:3}`, `hp: 0`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, deadEnemy])).toBe(false)`
- **Justification**: Dead characters must be excluded from scope pools (`c.hp > 0` filter in `evaluateTrigger`). Without this test, a regression removing the hp check would cause dead characters to trigger conditions.

---

## File 2: `src/engine/triggers-idle.test.ts`

**Imports:** `{ describe, it, expect }` from `vitest`, `{ evaluateTrigger }` from `./triggers`, `{ Trigger }` from `./types`, `{ createCharacter, createAction, createSkill }` from `./triggers-test-helpers`.

**Top-level describe:** `evaluateTrigger - idle condition`

---

### Test: idle-enemy-basic-true

- **File**: `src/engine/triggers-idle.test.ts`
- **Type**: unit
- **Verifies**: Enemy with `currentAction === null` satisfies `{ scope: "enemy", condition: "idle" }`
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "idle" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true)`
- **Justification**: Core happy path for idle condition. Verifies the inverse of channeling detection works in trigger context.

---

### Test: idle-enemy-channeling-false

- **File**: `src/engine/triggers-idle.test.ts`
- **Type**: unit
- **Verifies**: Enemy with `currentAction !== null` does NOT satisfy idle trigger
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "idle" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: Negative case -- a busy enemy must not satisfy idle. Guards against inversion bugs where `idle` and `channeling` produce the same result.

---

### Test: idle-ally-scope-true

- **File**: `src/engine/triggers-idle.test.ts`
- **Type**: unit
- **Verifies**: `{ scope: "ally", condition: "idle" }` fires when an ally has null `currentAction`
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `currentAction: null`
  - `trigger`: `{ scope: "ally", condition: "idle" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally])).toBe(true)`
- **Justification**: Validates ally scope works for idle condition. Could be used for "heal ally when they are idle" type rules.

---

### Test: idle-ally-scope-channeling-false

- **File**: `src/engine/triggers-idle.test.ts`
- **Type**: unit
- **Verifies**: `{ scope: "ally", condition: "idle" }` returns false when ally is channeling
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "ally", condition: "idle" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally])).toBe(false)`
- **Justification**: Negative case for ally scope idle. Symmetric with `channeling-ally-scope-idle-false` in the channeling file. Ensures the idle condition correctly rejects channeling allies and does not conflate with ally-scope channeling detection.

---

### Test: idle-multiple-enemies-one-idle

- **File**: `src/engine/triggers-idle.test.ts`
- **Type**: unit
- **Verifies**: Returns true when at least one enemy is idle among multiple enemies (existential `pool.some()` semantics)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemyA`: enemy faction, id `"enemyA"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `enemyB`: enemy faction, id `"enemyB"`, position `{q:1,r:4}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "idle" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemyA, enemyB])).toBe(true)`
- **Justification**: Confirms existential semantics for idle -- at least one idle enemy in the pool is sufficient. This was specified in the plan (Step 2, item 3) and provides parity with `channeling-multiple-enemies-one-channeling`. Without this, a bug that requires ALL enemies to be idle would go undetected.

---

### Test: idle-all-enemies-busy

- **File**: `src/engine/triggers-idle.test.ts`
- **Type**: unit
- **Verifies**: Returns false when all enemies are channeling (no idle enemy exists)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemyA`: enemy faction, id `"enemyA"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `enemyB`: enemy faction, id `"enemyB"`, position `{q:1,r:4}`, `currentAction: createAction({ type: "heal", skill: createSkill({ id: "heal", healing: 25 }), targetCell: {q:0,r:0}, resolvesAtTick: 2 })`
  - `trigger`: `{ scope: "enemy", condition: "idle" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemyA, enemyB])).toBe(false)`
- **Justification**: Validates that `pool.some()` correctly returns false when no candidate satisfies the condition. Important for "attack when enemy is idle" use case where all enemies are busy.

---

## File 3: `src/engine/triggers-targeting-ally.test.ts`

**Imports:** `{ describe, it, expect }` from `vitest`, `{ evaluateTrigger }` from `./triggers`, `{ Trigger }` from `./types`, `{ createCharacter, createAction }` from `./triggers-test-helpers`.

**Top-level describe:** `evaluateTrigger - targeting_ally condition`

---

### Test: targeting-ally-enemy-targets-ally-true

- **File**: `src/engine/triggers-targeting-ally.test.ts`
- **Type**: unit
- **Verifies**: `{ scope: "enemy", condition: "targeting_ally" }` fires when enemy action targets a living ally's cell
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `hp: 80`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:4,r:2}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy])).toBe(true)`
- **Justification**: Core happy path for targeting_ally. Verifies the engine detects an enemy action aimed at a friendly ally's cell. This is the primary use case (e.g., "heal ally when enemy is attacking them").

---

### Test: targeting-ally-enemy-targets-evaluator-false

- **File**: `src/engine/triggers-targeting-ally.test.ts`
- **Type**: unit
- **Verifies**: Enemy targeting the evaluator's cell does NOT satisfy `targeting_ally` (evaluator is not an "ally" of themselves)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:3,r:2}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: The `targeting_ally` condition checks `ally.id !== evaluator.id`. If the evaluator is being targeted, that is `targeting_me`, not `targeting_ally`. This boundary is critical to prevent the two conditions from overlapping.

---

### Test: targeting-ally-dead-ally-target-false

- **File**: `src/engine/triggers-targeting-ally.test.ts`
- **Type**: unit
- **Verifies**: Enemy targeting a dead ally's cell does NOT satisfy `targeting_ally`
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `deadAlly`: friendly faction, id `"dead-ally"`, position `{q:4,r:2}`, `hp: 0`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:4,r:2}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, deadAlly, enemy])).toBe(false)`
- **Justification**: The condition requires `ally.hp > 0` (from `evaluateConditionForCandidate` source). Dead allies at the target cell must not trigger a protective response. This prevents wasted actions healing/protecting corpses.

---

### Test: targeting-ally-multiple-enemies-one-targets-ally

- **File**: `src/engine/triggers-targeting-ally.test.ts`
- **Type**: unit
- **Verifies**: Returns true when at least one of multiple enemies targets an ally (existential check)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `hp: 80`
  - `enemyA`: enemy faction, id `"enemyA"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })` (targets empty cell)
  - `enemyB`: enemy faction, id `"enemyB"`, position `{q:1,r:4}`, `currentAction: createAction({ type: "attack", targetCell: {q:4,r:2}, resolvesAtTick: 1 })` (targets ally)
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemyA, enemyB])).toBe(true)`
- **Justification**: Validates `pool.some()` existential semantics -- one match in the pool is sufficient. Important for multi-enemy scenarios.

---

### Test: targeting-ally-no-enemy-actions-false

- **File**: `src/engine/triggers-targeting-ally.test.ts`
- **Type**: unit
- **Verifies**: Returns false when all enemies are idle (no actions)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy])).toBe(false)`
- **Justification**: Baseline negative case. No actions means no targeting. Ensures the condition checks `candidate.currentAction !== null` before position comparison.

---

### Test: targeting-ally-ally-scope-combination

- **File**: `src/engine/triggers-targeting-ally.test.ts`
- **Type**: unit
- **Verifies**: `{ scope: "ally", condition: "targeting_ally" }` checks if any ally has an action targeting another ally's cell
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `allyA`: friendly faction, id `"allyA"`, position `{q:4,r:2}`, `hp: 80`
  - `allyB`: friendly faction, id `"allyB"`, position `{q:5,r:2}`, `currentAction: createAction({ type: "heal", skill: createSkill({ id: "heal", healing: 25 }), targetCell: {q:4,r:2}, resolvesAtTick: 2 })`
  - `trigger`: `{ scope: "ally", condition: "targeting_ally" }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, allyA, allyB])).toBe(true)`
- **Justification**: Acceptance criterion requires testing `{ scope: "ally", condition: "targeting_ally" }`. This unusual combination checks if a same-faction character is acting toward another ally's cell (e.g., ally healing another ally). The engine does not restrict scope/condition pairings, and the condition evaluator uses `evaluator.faction` to find allies, which is the same faction when scope is ally.

---

## File 4: `src/engine/triggers-not-modifier.test.ts` (append to existing)

**Pattern:** Append a new `describe` block to the existing file. Same imports already present at file top. Will need to add `createAction` and `createSkill` to the existing import from `./triggers-test-helpers`.

**New describe block:** `describe("evaluateTrigger - NOT modifier for new conditions", () => { ... })`

---

### Test: not-channeling-no-enemy-channeling-true

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: `negated: true` with `channeling` returns true when no enemy is channeling
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "channeling", negated: true }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true)`
- **Justification**: Acceptance criterion: NOT channeling works correctly. This is the tactical use case "act when no enemy is channeling" -- a safe window to commit to a slow skill.

---

### Test: not-channeling-enemy-channeling-false

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: `negated: true` with `channeling` returns false when an enemy IS channeling
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "channeling", negated: true }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: Negative case for NOT channeling. Base condition is true (enemy is channeling), negation inverts to false. Ensures `trigger.negated ? !result : result` works for channeling.

---

### Test: not-idle-all-enemies-busy-true

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: `negated: true` with `idle` returns true when all enemies are channeling (none idle)
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:0,r:0}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "idle", negated: true }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(true)`
- **Justification**: "NOT idle" means "all enemies are busy" -- a reasonable tactical trigger for committing when all enemies are locked into actions.

---

### Test: not-idle-enemy-idle-false

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: `negated: true` with `idle` returns false when an enemy IS idle
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "idle", negated: true }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, enemy])).toBe(false)`
- **Justification**: Negative case for NOT idle. Base condition is true (enemy is idle), negation inverts to false.

---

### Test: not-targeting-ally-no-enemy-targets-ally-true

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: `negated: true` with `targeting_ally` returns true when no enemy targets an ally
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: null`
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally", negated: true }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy])).toBe(true)`
- **Justification**: "NOT targeting_ally" fires when allies are safe. Use case: "move aggressively when allies are not under threat."

---

### Test: not-targeting-ally-enemy-targets-ally-false

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: `negated: true` with `targeting_ally` returns false when an enemy IS targeting an ally
- **Setup**:
  - `evaluator`: friendly, id `"eval"`, position `{q:3,r:2}`
  - `ally`: friendly faction, id `"ally"`, position `{q:4,r:2}`, `hp: 80`
  - `enemy`: enemy faction, id `"enemy"`, position `{q:2,r:3}`, `currentAction: createAction({ type: "attack", targetCell: {q:4,r:2}, resolvesAtTick: 1 })`
  - `trigger`: `{ scope: "enemy", condition: "targeting_ally", negated: true }`
- **Assertions**:
  1. `expect(evaluateTrigger(trigger, evaluator, [evaluator, ally, enemy])).toBe(false)`
- **Justification**: Negative case for NOT targeting_ally. Base condition is true, negation inverts to false. Ensures the `targeting_ally` negation pathway works end-to-end.

---

## File 5: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx` (extracted from existing)

**Action:** Move the entire `describe("Gap 3: NOT Toggle Modifier", ...)` block (lines 315-453 of the current `TriggerDropdown.test.tsx`) to this new file.

**Imports:** `{ describe, it, expect, vi }` from `vitest`, `{ render, screen }` from `@testing-library/react`, `userEvent` from `@testing-library/user-event`, `{ TriggerDropdown }` from `./TriggerDropdown`.

**Setup constant:**

```
const defaultProps = {
  skillName: "Light Punch",
  triggerIndex: 0,
  onTriggerChange: vi.fn(),
};
```

**Tests to extract (no modifications, pure move):**

### Test: NOT toggle visible for non-always triggers (existing, moved)

- **File**: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: NOT toggle button renders for non-always trigger conditions
- **Setup**: Render TriggerDropdown with `hp_below` trigger
- **Assertions**:
  1. Button with aria-label matching `/toggle not.*light punch/i` is present
  2. Button text content is `"NOT"`
- **Justification**: Pre-existing test, moved for file size compliance. Validates NOT toggle visibility.

### Test: NOT toggle hidden for always trigger (existing, moved)

- **File**: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: NOT toggle button is NOT rendered for `always` condition
- **Setup**: Render TriggerDropdown with `always` trigger
- **Assertions**:
  1. No button matching `/toggle not/i` exists
- **Justification**: Pre-existing test, moved. Always condition cannot be negated.

### Test: NOT toggle sets negated to true when clicked (existing, moved)

- **File**: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: Clicking NOT toggle calls `onTriggerChange` with `negated: true`
- **Setup**: Render with non-negated `hp_below` trigger, click NOT button
- **Assertions**:
  1. Callback called with `negated: true` in trigger object
- **Justification**: Pre-existing test, moved. Core NOT toggle interaction.

### Test: NOT toggle sets negated to false when clicked on negated trigger (existing, moved)

- **File**: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: Clicking NOT toggle on already-negated trigger removes negation
- **Setup**: Render with `negated: true` trigger, click NOT button
- **Assertions**:
  1. Callback called with `negated: false` in trigger object
- **Justification**: Pre-existing test, moved. Toggle-off behavior.

### Test: NOT toggle aria-pressed reflects negated state (existing, moved)

- **File**: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: `aria-pressed` attribute accurately reflects the `negated` state
- **Setup**: Render with `negated: true`, assert `aria-pressed="true"`. Unmount, render with non-negated, assert `aria-pressed="false"`.
- **Assertions**:
  1. `aria-pressed="true"` when negated
  2. `aria-pressed="false"` when not negated
- **Justification**: Pre-existing test, moved. Accessibility compliance.

### Test: switching to always clears negated from callback (existing, moved)

- **File**: `src/components/CharacterPanel/TriggerDropdown-not-toggle.test.tsx`
- **Type**: unit
- **Verifies**: Changing condition to `always` strips the `negated` field from the callback trigger
- **Setup**: Render with negated `hp_below` trigger, select `always` condition
- **Assertions**:
  1. Callback trigger has `condition: "always"` and no `negated` field
- **Justification**: Pre-existing test, moved. Always condition clears negation.

---

## File 6: `src/components/CharacterPanel/TriggerDropdown.test.tsx` (modifications after split)

**Action:** After extracting the NOT toggle tests (File 5), the remaining file will be approximately 315 lines. Add the following new tests.

**New describe block:** `describe("TriggerDropdown - new condition options", () => { ... })`

---

### Test: renders-all-8-condition-options

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: The condition dropdown renders all 8 condition options including the 3 new ones
- **Setup**: Render TriggerDropdown with `{ scope: "self", condition: "hp_below", conditionValue: 50 }` trigger (same as existing "renders trigger type dropdown" test)
- **Assertions**:
  1. `screen.getByRole("option", { name: "Always" })` exists
  2. `screen.getByRole("option", { name: "In range" })` exists
  3. `screen.getByRole("option", { name: "HP below" })` exists
  4. `screen.getByRole("option", { name: "HP above" })` exists
  5. `screen.getByRole("option", { name: "Cell targeted" })` exists
  6. `screen.getByRole("option", { name: "Channeling" })` exists
  7. `screen.getByRole("option", { name: "Idle" })` exists
  8. `screen.getByRole("option", { name: "Targeting ally" })` exists
- **Justification**: Acceptance criterion: TriggerDropdown exposes all 8 conditions. This test is an UPDATE to the existing "renders trigger type dropdown with correct value" test -- the comment "All 5 condition type options present" should become "All 8 condition type options present" and 3 new assertions added.

---

### Test: no-value-input-for-channeling

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: `channeling` condition does not render a numeric value input
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "channeling" }` trigger
- **Assertions**:
  1. `screen.queryByRole("spinbutton")` returns null (no number input)
- **Justification**: Channeling is not in `VALUE_CONDITIONS`. Ensures no value input is spuriously rendered, which could confuse users.

---

### Test: no-value-input-for-idle

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: `idle` condition does not render a numeric value input
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "idle" }` trigger
- **Assertions**:
  1. `screen.queryByRole("spinbutton")` returns null
- **Justification**: Same rationale as channeling. Idle has no numeric parameter.

---

### Test: no-value-input-for-targeting-ally

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: `targeting_ally` condition does not render a numeric value input
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "targeting_ally" }` trigger
- **Assertions**:
  1. `screen.queryByRole("spinbutton")` returns null
- **Justification**: Same rationale. Targeting_ally has no numeric parameter.

---

### Test: condition-change-to-channeling

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: Selecting `channeling` from the condition dropdown calls `onTriggerChange` with correct shape (no `conditionValue`)
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "always" }`, use `userEvent.selectOptions` to select `"channeling"`
- **Assertions**:
  1. `onTriggerChange` called once
  2. Called with `{ scope: "enemy", condition: "channeling" }` (no `conditionValue` key)
- **Justification**: Validates the `handleConditionChange` logic correctly strips `conditionValue` for non-VALUE conditions. This is the primary interaction flow for the new conditions.

---

### Test: condition-change-to-idle

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: Selecting `idle` from the condition dropdown calls `onTriggerChange` with correct shape
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "always" }`, use `userEvent.selectOptions` to select `"idle"`
- **Assertions**:
  1. `onTriggerChange` called with `{ scope: "enemy", condition: "idle" }`
- **Justification**: Parallel to channeling test. Ensures each new condition value is correctly handled.

---

### Test: condition-change-to-targeting-ally

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: Selecting `targeting_ally` from the condition dropdown calls `onTriggerChange` with correct shape
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "always" }`, use `userEvent.selectOptions` to select `"targeting_ally"`
- **Assertions**:
  1. `onTriggerChange` called with `{ scope: "enemy", condition: "targeting_ally" }`
- **Justification**: Parallel to channeling/idle. Ensures `targeting_ally` value is correctly propagated.

---

### Test: condition-change-preserves-negated-for-new-conditions

- **File**: `src/components/CharacterPanel/TriggerDropdown.test.tsx`
- **Type**: unit
- **Verifies**: Switching from a negated condition to a new condition preserves the `negated` field
- **Setup**: Render TriggerDropdown with `{ scope: "enemy", condition: "hp_below", conditionValue: 50, negated: true }`, select `"channeling"`
- **Assertions**:
  1. `onTriggerChange` called with `{ scope: "enemy", condition: "channeling", negated: true }` (negated preserved, conditionValue stripped)
- **Justification**: The existing `handleConditionChange` preserves `negated` when switching to non-always conditions. This test confirms that behavior extends to the new conditions and that `conditionValue` is correctly stripped simultaneously.

---

## Test Count Summary

| File                                  | New Tests | Moved Tests | Total         |
| ------------------------------------- | --------- | ----------- | ------------- |
| `triggers-channeling.test.ts`         | 12        | 0           | 12            |
| `triggers-idle.test.ts`               | 6         | 0           | 6             |
| `triggers-targeting-ally.test.ts`     | 6         | 0           | 6             |
| `triggers-not-modifier.test.ts`       | 6         | 0           | 6 (appended)  |
| `TriggerDropdown-not-toggle.test.tsx` | 0         | 6           | 6 (extracted) |
| `TriggerDropdown.test.tsx`            | 8         | 0           | 8 (added)     |
| **Total**                             | **38**    | **6**       | **44**        |

## Notes for Implementor

1. **Import update for `triggers-not-modifier.test.ts`:** The existing file only imports `createCharacter`. The new NOT tests need `createAction` and (for the idle all-busy test) `createSkill`. Update the import line from `import { createCharacter } from "./triggers-test-helpers"` to `import { createCharacter, createAction, createSkill } from "./triggers-test-helpers"`.

2. **Existing test update in `TriggerDropdown.test.tsx`:** The "renders trigger type dropdown with correct value" test (line 15-42) currently asserts "All 5 condition type options present". Update the comment to "All 8 condition type options present" and add the 3 new option assertions. Alternatively, the new `renders-all-8-condition-options` test can replace this assertion block entirely.

3. **File line counts after changes:**
   - `triggers-channeling.test.ts`: ~200 lines (new)
   - `triggers-idle.test.ts`: ~130 lines (new)
   - `triggers-targeting-ally.test.ts`: ~140 lines (new)
   - `triggers-not-modifier.test.ts`: ~300 lines (237 existing + ~63 new)
   - `TriggerDropdown-not-toggle.test.tsx`: ~155 lines (extracted)
   - `TriggerDropdown.test.tsx`: ~380 lines (315 after split + ~65 new)

4. **All estimates within the 400-line file limit.**
