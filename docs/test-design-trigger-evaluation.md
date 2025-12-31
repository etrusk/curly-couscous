# Trigger Evaluation Test Design v2

## Revision Summary

This document revises the original test design based on human feedback addressing:
- Same-cell occupancy contradiction (spec: 1 character per cell)
- Same-tick detection model confusion (game flow architecture)
- Dead evaluator testing conflict
- Multi-tick lifecycle coverage gaps
- Vague test outcomes
- Missing edge cases

---

## Overview

This document defines test cases for the `evaluateTrigger()` function, which determines whether a skill's trigger conditions are met for a given character and game state. This follows the pattern established in [`docs/test-design-selector-evaluation-v2.md`](docs/test-design-selector-evaluation-v2.md).

**Related Spec Sections:**
- [`.roo/rules/00-project.md`](../.roo/rules/00-project.md) lines 60-66: Trigger Conditions
- [`src/engine/types.ts`](../src/engine/types.ts) lines 69-72: Trigger interface

---

## Design Decisions

### Decision 1: `always` Trigger Representation

**Question:** How should the "always true" (unconditional) trigger be represented?

**Recommendation: Option C — Support both explicit `'always'` type AND empty array semantics**

**Rationale:**
1. Empty triggers array (`triggers: []`) is intuitive for "no conditions"
2. Explicit `'always'` type provides clarity for UI display
3. Both should evaluate to true in the skill evaluation layer
4. Matches "progressive disclosure" design philosophy

**Implementation Note:** The `evaluateTrigger()` function evaluates a single trigger. The calling code (skill evaluation) handles the empty array case by treating it as "always true" before calling `evaluateTrigger()`.

---

### Decision 2: HP Threshold Boundary

**Question:** Is `hp_below 50%` true when HP is exactly 50%?

**Answer: No — "below" means strictly less than (`<`).**

- HP=50 of maxHP=100 is exactly 50%, so `hp_below 50%` → **FALSE**
- HP=49 of maxHP=100 is 49%, so `hp_below 50%` → **TRUE**

---

### Decision 3: Range Boundary

**Question:** Is `enemy_in_range 3` true when enemy is exactly at Chebyshev distance 3?

**Answer: Yes — "within X cells" includes the boundary (≤).**

- Distance 3 is within 3 cells → **TRUE**
- Distance 4 is not within 3 cells → **FALSE**

---

### Decision 4: Self as Ally

**Question:** Does the evaluator count as "ally in range" for themselves?

**Answer: No — self is excluded from ally range checks.**

Consistent with selector behavior where `nearest_ally` excludes self.

---

### Decision 5: `my_cell_targeted_by_enemy` Detection — Game Flow Architecture

**Key insight from review:** Same-tick invisibility is an **architectural property**, not something `evaluateTrigger()` needs to check.

**The actual game flow (from Section 4.1):**
1. **Decision Phase Start**: All characters evaluate based on game state at tick start
2. **During evaluation**: `my_cell_targeted_by_enemy` checks existing `currentAction` objects
3. **After evaluation**: New actions are committed
4. **Resolution Phase**: `ticksRemaining` decremented; actions at 0 resolve and are removed

**This means:**
- Actions committed THIS tick don't exist yet when `evaluateTrigger()` runs
- Actions from previous ticks have already had `ticksRemaining` decremented
- `ticksRemaining=0` states don't exist — actions resolve and are removed immediately

**What to actually test:**
- Actions with `ticksRemaining >= 1` targeting evaluator's cell → **TRUE**
- No `currentAction` at all → **FALSE**
- `currentAction` targeting different cell → **FALSE**
- Allied actions → **FALSE**

---

### Decision 6: Same-Cell Occupancy

**Question:** Can two characters occupy the same cell?

**Answer: No — per spec Section 2, "Occupancy: 1 character per cell".**

**Impact:** Tests #10 and #11 (range 0 with two characters at same cell) are removed as they test impossible game states. Range 0 is only meaningful for `self` selector or future AoE mechanics.

---

### Decision 7: Dead Evaluator

**Question:** What happens when evaluator has HP ≤ 0?

**Answer: Documented as undefined behavior (caller's responsibility).**

Per game flow, dead characters (HP ≤ 0) are removed in Resolution Phase before next Decision Phase. The engine never evaluates triggers for dead characters in normal game flow.

**Impact:** Test #25 (HP=0 evaluator) removed — cannot have living evaluator with 0 HP.

---

## Function Signature

```typescript
/**
 * Evaluates whether a single trigger condition is satisfied.
 * 
 * @param trigger - The trigger to evaluate
 * @param evaluator - The character whose trigger is being evaluated
 * @param allCharacters - All characters in the battle (for range/targeting checks)
 * @returns true if the trigger condition is met, false otherwise
 * 
 * @preconditions
 * - Evaluator must be alive (HP > 0)
 * - Evaluator must exist in allCharacters array
 * - All characters must have valid positions
 * - All characters occupy distinct cells (1 per cell)
 */
export function evaluateTrigger(
  trigger: Trigger,
  evaluator: Character,
  allCharacters: Character[]
): boolean;
```

---

## Proposed Tests for `evaluateTrigger()`

### Test File: `src/engine/triggers.test.ts`

---

### Section 1: `always` Trigger (Unconditional)

**Purpose**: Verify unconditional skill activation when no conditions required.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 1 | `should return true for always trigger type` | Given trigger `{ type: 'always' }` → returns true regardless of game state | Unconditional trigger must always pass — enables skills like "always attack nearest enemy" |
| 2 | `should return true for always trigger regardless of evaluator state` | Evaluator at low HP (10), enemies at dist=1, allies nearby → still returns true | Confirms `always` truly ignores ALL conditions |

**Design Note:** If `'always'` is NOT added to the Trigger type, these tests should be removed and the empty-array handling tested at the skill evaluation layer instead.

---

### Section 2: `enemy_in_range` Trigger

**Purpose**: Verify proximity-based skill activation for offensive abilities.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 3 | `should return true when enemy is within range` | Evaluator at (5,5); Enemy at (5,7) dist=2; trigger `enemy_in_range 3` → true | Basic range check — core functionality for melee skills |
| 4 | `should return false when enemy is outside range` | Evaluator at (5,5); Enemy at (5,9) dist=4; trigger `enemy_in_range 3` → false | Ensures trigger fails when no enemy reachable |
| 5 | `should return true when enemy is exactly at range boundary` | Evaluator at (5,5); Enemy at (5,8) dist=3; trigger `enemy_in_range 3` → true | Boundary case: "within X" includes X |
| 6 | `should use Chebyshev distance (diagonal counts as 1)` | Evaluator at (5,5); Enemy at (7,7) dist=2 (diagonal); trigger `enemy_in_range 2` → true | Spec §2.1: Chebyshev metric — diagonals cost 1 |
| 7 | `should return true if any enemy is in range` | Evaluator at (5,5); Enemy A at (10,10) dist=5, Enemy B at (5,6) dist=1; trigger `enemy_in_range 3` → true | "Any enemy" semantics — one valid target is enough |
| 8 | `should return false when no enemies exist` | Evaluator (friendly) with only allies present; trigger `enemy_in_range 3` → false | No targets = trigger fails |
| 9 | `should ignore allies when checking enemy range` | Evaluator at (5,5); Ally at (5,6) dist=1, Enemy at (10,10) dist=5; trigger `enemy_in_range 3` → false | Faction filtering — allies don't count as enemies |
| 10 | `should handle maximum grid distance` | Evaluator at (0,0); Enemy at (11,11) dist=11; trigger `enemy_in_range 11` → true | Max Chebyshev distance on 12×12 grid |
| 11 | `should return false at maximum grid distance when range insufficient` | Evaluator at (0,0); Enemy at (11,11) dist=11; trigger `enemy_in_range 10` → false | Boundary verification at max distance |

---

### Section 3: `ally_in_range` Trigger

**Purpose**: Verify proximity-based skill activation for support abilities.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 12 | `should return true when ally is within range` | Evaluator at (5,5); Ally at (5,7) dist=2; trigger `ally_in_range 3` → true | Basic range check — enables "heal nearby ally" type skills |
| 13 | `should return false when ally is outside range` | Evaluator at (5,5); Ally at (5,9) dist=4; trigger `ally_in_range 3` → false | No ally in range = trigger fails |
| 14 | `should return true when ally is exactly at range boundary` | Evaluator at (5,5); Ally at (5,8) dist=3; trigger `ally_in_range 3` → true | Boundary case: consistent with enemy_in_range behavior |
| 15 | `should exclude self from ally range check` | Evaluator alone at (5,5); trigger `ally_in_range 0` → false | Critical: "ally" means OTHER ally — self excluded |
| 16 | `should return true if any ally (not self) is in range` | Evaluator at (5,5); Ally A at (10,10) dist=5, Ally B at (5,6) dist=1; trigger `ally_in_range 3` → true | "Any ally" semantics |
| 17 | `should return false when no allies except self exist` | Evaluator alone with enemies only; trigger `ally_in_range 3` → false | Solo character can't trigger ally-based conditions |
| 18 | `should ignore enemies when checking ally range` | Evaluator at (5,5); Enemy at (5,6) dist=1; no other allies; trigger `ally_in_range 3` → false | Faction filtering |

---

### Section 4: `hp_below` Trigger

**Purpose**: Verify HP-based conditional skill activation for defensive/emergency abilities.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 19 | `should return true when HP percentage is below threshold` | Evaluator HP=30, maxHP=100 (30%); trigger `hp_below 50` → true | Basic HP check — enables "retreat when hurt" behaviors |
| 20 | `should return false when HP percentage is above threshold` | Evaluator HP=70, maxHP=100 (70%); trigger `hp_below 50` → false | Healthy characters don't trigger low-HP conditions |
| 21 | `should return false when HP percentage equals threshold exactly` | Evaluator HP=50, maxHP=100 (50%); trigger `hp_below 50` → false | Critical boundary: "below" means `<`, not `≤` |
| 22 | `should return true when HP is 1 below threshold` | Evaluator HP=49, maxHP=100 (49%); trigger `hp_below 50` → true | Boundary verification: 49% IS below 50% |
| 23 | `should handle threshold of 100% correctly` | Evaluator HP=99, maxHP=100 (99%); trigger `hp_below 100` → true | "hp_below 100" = any damage triggers |
| 24 | `should return false for threshold 100% at full HP` | Evaluator HP=100, maxHP=100 (100%); trigger `hp_below 100` → false | Full HP is NOT below 100% |
| 25 | `should handle near-death HP correctly` | Evaluator HP=1, maxHP=100 (1%); trigger `hp_below 2` → true | Near-death detection without dead evaluator |
| 26 | `should handle non-standard maxHP values` | Evaluator HP=25, maxHP=50 (50%); trigger `hp_below 60` → true | Percentage calculation works with any maxHP |
| 27 | `should handle fractional HP percentages` | Evaluator HP=33, maxHP=100 (33%); trigger `hp_below 34` → true | Non-round percentages handled correctly |
| 28 | `should return false for hp_below 0 threshold` | Evaluator HP=1, maxHP=100 (1%); trigger `hp_below 0` → false | 1% is not below 0% — minimum threshold edge case |

---

### Section 5: `my_cell_targeted_by_enemy` Trigger

**Purpose**: Verify detection of incoming multi-tick enemy attacks for dodge mechanics.

**Architecture Note**: Same-tick invisibility is guaranteed by game flow — actions committed this tick don't exist in game state during evaluation. Tests focus on what states CAN exist during the decision phase.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 29 | `should return true when enemy has locked-in action on evaluator cell` | Evaluator at (5,5); Enemy with currentAction targeting (5,5), ticksRemaining=1 → true | Core dodge mechanic — detect incoming attack |
| 30 | `should return false when no actions target evaluator cell` | Evaluator at (5,5); Enemy with currentAction targeting (6,6) → false | Actions targeting other cells don't threaten this character |
| 31 | `should return false when no characters have current actions` | Evaluator at (5,5); all characters have currentAction=null → false | No active actions = no threats |
| 32 | `should ignore allied actions targeting evaluator cell` | Evaluator at (5,5); Ally with currentAction targeting (5,5), ticksRemaining=1 → false | Only ENEMY actions trigger — ally isn't a threat |
| 33 | `should return true if any enemy targets the cell` | Evaluator at (5,5); Enemy A targets (6,6), Enemy B targets (5,5) → true | Any single enemy threat is enough |
| 34 | `should detect multi-tick action with ticksRemaining=1 (last chance to dodge)` | Evaluator at (5,5); Enemy Heavy Punch targeting (5,5), ticksRemaining=1 → true | This is the critical "dodge window" tick — action resolves next resolution |
| 35 | `should detect multi-tick action with ticksRemaining > 1` | Evaluator at (5,5); Enemy Heavy Punch targeting (5,5), ticksRemaining=2 → true | Wind-up attacks detected early — player can plan ahead |
| 36 | `should return true when multiple enemies target evaluator cell` | Evaluator at (5,5); Enemy A targets (5,5), Enemy B targets (5,5) → true | Multiple threats still trigger (doesn't short-circuit incorrectly) |

**Note on ticksRemaining states:**
- `ticksRemaining=1`: Action from previous tick(s), resolves next resolution phase — **valid state**
- `ticksRemaining=2+`: Multi-tick action committed in previous ticks — **valid state**
- `ticksRemaining=0`: Cannot exist — actions resolve and are removed immediately
- Freshly committed actions: Don't exist yet during decision phase evaluation

---

### Section 6: Edge Cases

**Purpose**: Verify graceful handling of unusual game states.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 37 | `should handle empty allCharacters array for range triggers` | Empty array; trigger `enemy_in_range 3` → false | Defensive: empty battle shouldn't crash |
| 38 | `should handle evaluator as only character` | Evaluator alone; `enemy_in_range 5` → false; `ally_in_range 5` → false | Solo character: no enemies, no allies |
| 39 | `should handle evaluator as only character with hp_below` | Evaluator alone, HP=30, maxHP=100; `hp_below 50` → true | HP triggers work regardless of other characters |

---

### Section 7: Dead Character Handling

**Purpose**: Verify dead characters (HP ≤ 0) are excluded from trigger calculations.

**Note**: Dead evaluator is undefined behavior per Decision 7. These tests verify that OTHER dead characters are excluded.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 40 | `should ignore dead enemies in range calculations` | Evaluator at (5,5); Dead enemy (HP=0) at (5,6), live enemy at (10,10); trigger `enemy_in_range 3` → false | Dead enemies don't count — corpses aren't threats |
| 41 | `should ignore dead allies in range calculations` | Evaluator at (5,5); Dead ally (HP=0) at (5,6), no other allies; trigger `ally_in_range 3` → false | Dead allies can't be supported |
| 42 | `should ignore actions from dead enemies` | Evaluator at (5,5); Dead enemy (HP=0) with currentAction targeting (5,5) → false | Dead enemy actions are cancelled — no threat |

---

## Coverage Analysis

| Category | Tests | Notes |
|----------|-------|-------|
| **Happy path** | #1, #3, #12, #19, #29 | Basic functionality per trigger type |
| **Boundaries** | #5, #10-11, #14, #21-22, #28 | Range limits, HP thresholds, grid max |
| **Faction filtering** | #9, #18, #32 | Enemies vs allies |
| **Self-exclusion** | #15 | Self not counted as ally |
| **Chebyshev metric** | #6 | Diagonal distance = 1 |
| **Multi-tick detection** | #34-36 | ticksRemaining lifecycle |
| **Dead characters** | #40-42 | HP ≤ 0 excluded |
| **Edge cases** | #37-39 | Empty arrays, solo character |

---

## Not Testing (and Why)

| Item | Rationale |
|------|-----------|
| Dead evaluator (HP ≤ 0) | Documented as undefined behavior — caller's responsibility per game flow |
| Same-cell occupancy | Spec states 1 character per cell — impossible game state |
| ticksRemaining=0 states | Cannot exist — actions resolve and are removed immediately |
| Freshly committed actions (same-tick) | Architectural guarantee — actions don't exist during evaluation |
| Invalid trigger types | TypeScript compile-time enforcement |
| Negative trigger values | Validated at trigger creation |
| Skill-level AND/OR logic | Tested in skill evaluation layer |

---

## Preconditions (Documented)

The following are **caller responsibilities**, not validated by `evaluateTrigger()`:

1. **Evaluator is alive (HP > 0)** — Dead characters are removed before evaluation
2. **Evaluator exists in allCharacters array** — Must be part of provided list
3. **All characters have valid positions** — Within 12×12 grid bounds
4. **All characters occupy distinct cells** — 1 character per cell
5. **Trigger value is appropriate for type** — Range values ≥ 0, HP threshold 0-100

---

## Summary of Changes from v1

| Change Type | Description |
|-------------|-------------|
| **[Removed]** | Tests #10, #11: Same-cell occupancy contradicts spec (1 per cell) |
| **[Removed]** | Test #25 (HP=0): Dead evaluator is undefined behavior |
| **[Removed]** | Tests #34, #35: Tested impossible game states (ticksRemaining=0, freshly committed) |
| **[Added]** | Test #10: Maximum grid distance (enemy at 11,11) |
| **[Added]** | Test #11: Max distance boundary verification |
| **[Added]** | Test #28: hp_below 0 threshold edge case |
| **[Added]** | Test #34: ticksRemaining=1 "last chance to dodge" explicit coverage |
| **[Added]** | Test #36: Multiple enemies targeting same cell |
| **[Modified]** | Test #25: Changed from HP=0 to HP=1 (near-death but alive) |
| **[Modified]** | Section 5: Clarified game flow architecture for same-tick invisibility |
| **[Clarified]** | Added precondition: All characters occupy distinct cells |
| **[Removed]** | Test #37 vague outcome: Now specifies concrete return value (false) |

---

## Test Count Summary

| Section | Test Count |
|---------|------------|
| 1. `always` trigger | 2 |
| 2. `enemy_in_range` | 9 |
| 3. `ally_in_range` | 7 |
| 4. `hp_below` | 10 |
| 5. `my_cell_targeted_by_enemy` | 8 |
| 6. Edge cases | 3 |
| 7. Dead character handling | 3 |
| **Total** | **42** |

---

## Implementation Notes

### Type Extension Required

The current [`Trigger`](../src/engine/types.ts:69) type needs extension for `'always'`:

```typescript
export interface Trigger {
  type: 'always' | 'enemy_in_range' | 'ally_in_range' | 'hp_below' | 'my_cell_targeted_by_enemy';
  value?: number; // for range X or X% (undefined for 'always' and 'my_cell_targeted_by_enemy')
}
```

### Helper Pattern

Following [`selectors.ts`](../src/engine/selectors.ts), consider helper functions:
- `getEnemiesInRange(evaluator, allCharacters, range)`
- `getAlliesInRange(evaluator, allCharacters, range)` (excluding self)
- `isHpBelowThreshold(evaluator, threshold)`
- `isCellTargetedByEnemy(evaluator, allCharacters)`

### Test Helper

Reuse or extend the `createCharacter()` helper from [`selectors.test.ts`](../src/engine/selectors.test.ts:13).

Additional helper for creating actions:

```typescript
function createAction(overrides: Partial<Action>): Action {
  return {
    type: overrides.type ?? 'attack',
    skill: overrides.skill ?? createSkill({ id: 'test-skill' }),
    targetCell: overrides.targetCell ?? { x: 0, y: 0 },
    targetCharacter: overrides.targetCharacter ?? null,
    ticksRemaining: overrides.ticksRemaining ?? 1,
  };
}
```

---

**Awaiting approval to proceed with test implementation.**
