# Test Designs: Trigger System Expansion

## Overview

Test designs for B3 (ally_hp_below), B2 (NOT modifier), and B1 (AND combinator UI).

**Implementation order**: B3 → B2 → B1

**Total tests**: 34 tests across 4 files

---

## Feature B3: ally_hp_below Trigger

**Test File**: `src/engine/triggers-ally-hp-below.test.ts` (NEW)

### Test: ally-hp-below-returns-true-when-ally-below-threshold

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Trigger returns true when at least one ally has HP below threshold
- **Setup**: Evaluator at 100%, ally at 30%, threshold 50%
- **Assertions**:
  1. `evaluateTrigger(trigger, evaluator, [evaluator, ally])` returns `true`
- **Justification**: Core functionality for support skills

### Test: ally-hp-below-returns-false-when-no-ally-below-threshold

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Trigger returns false when all allies at/above threshold
- **Setup**: Evaluator at 100%, ally at 70%, threshold 50%
- **Assertions**:
  1. Returns `false`
- **Justification**: Prevents false positives

### Test: ally-hp-below-excludes-self

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Evaluator's own HP is not considered
- **Setup**: Evaluator at 30% (below threshold), ally at 100%, threshold 50%
- **Assertions**:
  1. Returns `false` (self excluded, ally healthy)
- **Justification**: Critical - evaluator should use hp_below for self

### Test: ally-hp-below-returns-false-at-exact-threshold

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Strict inequality ("below" not "at or below")
- **Setup**: Ally at exactly 50%, threshold 50%
- **Assertions**:
  1. Returns `false`
- **Justification**: Consistent with hp_below behavior

### Test: ally-hp-below-returns-true-one-below-threshold

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Trigger fires at 49% when threshold is 50%
- **Setup**: Ally at 49%, threshold 50%
- **Assertions**:
  1. Returns `true`
- **Justification**: Boundary condition

### Test: ally-hp-below-returns-false-when-only-evaluator-alive

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: No allies to check = false
- **Setup**: Only evaluator (at 30%) and enemy, no other allies
- **Assertions**:
  1. Returns `false`
- **Justification**: Cannot heal when no allies exist

### Test: ally-hp-below-ignores-dead-allies

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Dead allies (HP <= 0) excluded
- **Setup**: Dead ally at 0 HP
- **Assertions**:
  1. Returns `false`
- **Justification**: Don't heal dead characters

### Test: ally-hp-below-ignores-enemies

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Enemy HP not considered
- **Setup**: Enemy at 10%, no friendly allies
- **Assertions**:
  1. Returns `false`
- **Justification**: Faction separation

### Test: ally-hp-below-with-threshold-100

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: 100% threshold triggers for any damage
- **Setup**: Ally at 99%
- **Assertions**:
  1. Returns `true`
- **Justification**: "Heal any damaged ally" use case

### Test: ally-hp-below-with-threshold-0

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: 0% threshold always false
- **Setup**: Ally at 1%
- **Assertions**:
  1. Returns `false`
- **Justification**: Nothing below 0%

### Test: ally-hp-below-handles-zero-maxhp

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: Division by zero guard
- **Setup**: Ally with maxHp=0
- **Assertions**:
  1. Returns `false`
  2. No exception
- **Justification**: Defensive programming

### Test: ally-hp-below-with-multiple-allies-one-below

- **File**: `src/engine/triggers-ally-hp-below.test.ts`
- **Type**: unit
- **Verifies**: ANY ally below triggers true
- **Setup**: AllyA at 80%, AllyB at 30%, threshold 50%
- **Assertions**:
  1. Returns `true`
- **Justification**: Uses `some()` logic

---

## Feature B2: NOT Modifier

**Test File**: `src/engine/triggers-not-modifier.test.ts` (NEW)

### Test: not-inverts-true-to-false

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: NOT modifier inverts true -> false
- **Setup**: `{ type: "always", negated: true }`
- **Assertions**:
  1. Returns `false`
- **Justification**: Core NOT functionality

### Test: not-inverts-false-to-true

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: NOT modifier inverts false -> true
- **Setup**: HP at 70%, `{ type: "hp_below", value: 50, negated: true }`
- **Assertions**:
  1. Returns `true`
- **Justification**: "When HP is NOT low" conditions

### Test: not-with-parameterized-trigger

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: NOT with value parameters
- **Setup**: Enemy at distance 1, `{ type: "enemy_in_range", value: 2, negated: true }`
- **Assertions**:
  1. Returns `false` (enemy IS in range, NOT inverts)
- **Justification**: Negation after parameter evaluation

### Test: not-with-enemy-out-of-range

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: NOT enemy_in_range for kiting
- **Setup**: Enemy at distance 5, `{ type: "enemy_in_range", value: 2, negated: true }`
- **Assertions**:
  1. Returns `true`
- **Justification**: Kiting behavior use case

### Test: not-with-undefined-negated-field

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: Missing negated = non-negated (backward compat)
- **Setup**: `{ type: "always" }` (no negated field)
- **Assertions**:
  1. Returns `true`
- **Justification**: Backward compatibility

### Test: not-with-explicit-false-negated

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: Explicit false same as undefined
- **Setup**: `{ type: "always", negated: false }`
- **Assertions**:
  1. Returns `true`
- **Justification**: False not treated as truthy

### Test: not-with-ally-hp-below

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: NOT works with new ally_hp_below
- **Setup**: Ally at 30%, `{ type: "ally_hp_below", value: 50, negated: true }`
- **Assertions**:
  1. Returns `false` (ally IS below, NOT inverts)
- **Justification**: B2 + B3 integration

### Test: not-with-my-cell-targeted

- **File**: `src/engine/triggers-not-modifier.test.ts`
- **Type**: unit
- **Verifies**: NOT works with my_cell_targeted_by_enemy
- **Setup**: No enemy targeting evaluator's cell, `{ type: "my_cell_targeted_by_enemy", negated: true }`
- **Assertions**:
  1. Returns `true` (cell NOT targeted, negation inverts to true)
- **Justification**: Covers all existing trigger types with NOT

---

## Feature B2: NOT Modifier - Formatter Tests

**Test File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts` (NEW file)

### Test: formatTrigger-adds-not-prefix-when-negated

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: "NOT " prefix when negated: true
- **Setup**: `{ type: "hp_below", value: 50, negated: true }`
- **Assertions**:
  1. Returns `"NOT hp_below(50)"`
- **Justification**: User-facing display

### Test: formatTrigger-no-prefix-when-not-negated

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: No prefix for non-negated
- **Setup**: Triggers without negated or with negated: false
- **Assertions**:
  1. Both return `"hp_below(50)"`
- **Justification**: Non-negated normal display

### Test: formatTrigger-not-with-no-value

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: NOT with value-less triggers
- **Setup**: `{ type: "always", negated: true }`
- **Assertions**:
  1. Returns `"NOT always"`
- **Justification**: NOT works without values

### Test: formatTrigger-ally-hp-below

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: New trigger type formats correctly
- **Setup**: `{ type: "ally_hp_below", value: 50 }`
- **Assertions**:
  1. Returns `"ally_hp_below(50)"`
- **Justification**: New trigger type display

### Test: formatRejectionReasonCompact-shows-not-prefix

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: Rejection reasons display NOT prefix for negated triggers
- **Setup**: SkillEvaluationResult with `failedTriggers: [{ type: "hp_below", value: 50, negated: true }]`
- **Assertions**:
  1. Returns `"trigger_failed: NOT hp_below(50)"`
- **Justification**: Rejection reasons must show what actually failed

---

## Feature B1: AND Combinator - Formatter Tests

### Test: formatTriggers-joins-with-and

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: New formatTriggers joins with " AND "
- **Setup**: `[{ type: "enemy_in_range", value: 3 }, { type: "hp_below", value: 50 }]`
- **Assertions**:
  1. Returns `"enemy_in_range(3) AND hp_below(50)"`
- **Justification**: Compound trigger display

### Test: formatTriggers-handles-single-trigger

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: Single trigger works
- **Setup**: `[{ type: "always" }]`
- **Assertions**:
  1. Returns `"always"`
- **Justification**: Common case

### Test: formatTriggers-handles-empty-array

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: Empty = "always"
- **Setup**: `[]`
- **Assertions**:
  1. Returns `"always"`
- **Justification**: Vacuous truth

### Test: formatTriggers-handles-negated-in-compound

- **File**: `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts`
- **Type**: unit
- **Verifies**: NOT in compound expressions
- **Setup**: `[{ type: "enemy_in_range", value: 3 }, { type: "hp_below", value: 50, negated: true }]`
- **Assertions**:
  1. Returns `"enemy_in_range(3) AND NOT hp_below(50)"`
- **Justification**: Integration

---

## Feature B1: AND Combinator - Engine Integration

**Test File**: `src/engine/game-decisions-trigger-and-logic.test.ts` (extend)

### Test: and-logic-with-negated-trigger-all-pass

- **File**: `src/engine/game-decisions-trigger-and-logic.test.ts`
- **Type**: integration
- **Verifies**: AND with positive + negated triggers both passing
- **Setup**: HP at 80%, triggers: `[enemy_in_range(3), NOT hp_below(50)]`
- **Assertions**:
  1. Skill selected
- **Justification**: AND with NOT modifier

### Test: and-logic-with-negated-trigger-one-fails

- **File**: `src/engine/game-decisions-trigger-and-logic.test.ts`
- **Type**: integration
- **Verifies**: AND fails when negated trigger fails
- **Setup**: HP at 30%, triggers: `[enemy_in_range(3), NOT hp_below(50)]`
- **Assertions**:
  1. Skill rejected (idle action)
- **Justification**: Negated trigger failure

### Test: and-logic-with-ally-hp-below

- **File**: `src/engine/game-decisions-trigger-and-logic.test.ts`
- **Type**: integration
- **Verifies**: ally_hp_below in AND combination
- **Setup**: Ally at 30%, triggers: `[ally_in_range(3), ally_hp_below(50)]`
- **Assertions**:
  1. Heal skill selected
- **Justification**: New trigger type in compound

### Test: failed-triggers-include-negated-display

- **File**: `src/engine/game-decisions-trigger-and-logic.test.ts`
- **Type**: integration
- **Verifies**: failedTriggers includes negated field
- **Setup**: HP at 30%, trigger: `[NOT hp_below(50)]` (fails)
- **Assertions**:
  1. failedTriggers[0].negated equals true
- **Justification**: Rejection reasons display "NOT"

### Test: evaluateSkillsForCharacter-captures-negated-failed-triggers

- **File**: `src/engine/game-decisions-trigger-and-logic.test.ts`
- **Type**: integration
- **Verifies**: evaluateSkillsForCharacter captures negated field in failedTriggers
- **Setup**: HP at 30%, skill with trigger `[{ type: "hp_below", value: 50, negated: true }]` (fails because HP IS below 50, negated makes trigger false)
- **Assertions**:
  1. Result status is "rejected"
  2. rejectionReason is "trigger_failed"
  3. failedTriggers[0].type equals "hp_below"
  4. failedTriggers[0].negated equals true
- **Justification**: Ensures UI has complete trigger info for display

---

## Summary

| Feature                          | Test Count | Test File                                  |
| -------------------------------- | ---------- | ------------------------------------------ |
| B3: ally_hp_below                | 12         | `triggers-ally-hp-below.test.ts`           |
| B2: NOT modifier (engine)        | 8          | `triggers-not-modifier.test.ts`            |
| B2: NOT modifier (formatter)     | 5          | `rule-evaluations-formatters.test.ts`      |
| B1: AND combinator (formatter)   | 4          | `rule-evaluations-formatters.test.ts`      |
| B1: AND combinator (integration) | 5          | `game-decisions-trigger-and-logic.test.ts` |
| **Total**                        | **34**     | 4 files                                    |

---

## Smoke Test Evaluation

This task modifies user-facing functionality on critical paths.

**Smoke tests needed**: YES

```yaml
smoke_tests:
  - id: 05-trigger-compound
    action: "Configure skill with two triggers and verify activation"
    expect: "Skill activates only when both triggers pass (AND logic)"
```

---

## Spec Alignment

- [x] ally_hp_below follows existing trigger pattern
- [x] NOT modifier extends Trigger interface (backward compatible)
- [x] AND logic already in engine, this adds UI
- [x] Test organization: one file per trigger type
- [x] Pure engine tests: no React in /src/engine/

---

## Review Status

**Status: APPROVED**

### Review Findings

The test designs were reviewed against the acceptance criteria. The following gaps were identified and addressed:

1. **Added test**: `not-with-my-cell-targeted` - Ensures NOT modifier works with all existing trigger types, not just a subset.

2. **Added test**: `formatTrigger-ally-hp-below` - Ensures the new trigger type displays correctly in the formatter.

3. **Added test**: `formatRejectionReasonCompact-shows-not-prefix` - Ensures rejection reasons display the NOT prefix for negated triggers, satisfying the acceptance criterion "Rejection reasons in evaluation display the specific trigger that failed."

4. **Added test**: `evaluateSkillsForCharacter-captures-negated-failed-triggers` - Ensures the evaluation function (used by UI) properly captures negated triggers in failedTriggers array.

### Coverage Verification

All acceptance criteria are now covered:

| Acceptance Criterion                                            | Test(s)                                                                                                                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skills can have 0, 1, or 2 triggers with AND logic              | `formatTriggers-handles-empty-array`, `formatTriggers-handles-single-trigger`, `formatTriggers-joins-with-and`, existing AND tests                        |
| Any trigger can be negated with NOT                             | Full B2 test suite (8 tests)                                                                                                                              |
| ally_hp_below evaluates correctly against all allies (not self) | Full B3 test suite (12 tests), especially `ally-hp-below-excludes-self`                                                                                   |
| AND with both passing                                           | `and-logic-with-negated-trigger-all-pass` + existing tests                                                                                                |
| AND with one failing                                            | `and-logic-with-negated-trigger-one-fails` + existing tests                                                                                               |
| NOT inverted triggers                                           | `not-inverts-true-to-false`, `not-inverts-false-to-true`                                                                                                  |
| Compound NOT + AND combinations                                 | `and-logic-with-negated-trigger-all-pass`, `formatTriggers-handles-negated-in-compound`                                                                   |
| Rejection reasons display specific failed trigger               | `formatRejectionReasonCompact-shows-not-prefix`, `failed-triggers-include-negated-display`, `evaluateSkillsForCharacter-captures-negated-failed-triggers` |
| All existing single-trigger behavior unchanged                  | `not-with-undefined-negated-field`, `not-with-explicit-false-negated`                                                                                     |

### Notes for Implementation

1. The formatter test file `src/components/RuleEvaluations/rule-evaluations-formatters.test.ts` is NEW and should be created during WRITE_TESTS phase.

2. The `formatTriggers` function does not exist yet and must be added to `rule-evaluations-formatters.ts`.

3. The `formatTrigger` function must be updated to handle the `negated` field.

4. Test count updated from 30 to 34 to reflect the 4 new tests added during review.
