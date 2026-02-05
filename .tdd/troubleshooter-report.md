# Troubleshooter Report

## Problem Statement

21 SkillsPanel tests and 1 RuleEvaluations test are failing after `selectorOverride` was removed from the Skill type. Additionally, 59 TypeScript errors exist across test files. The production code is working correctly -- all failures are in test files that still reference the removed `selectorOverride` field or query UI elements by the old `mode` label instead of the new `Behavior` label.

## Reproduction

```bash
npx vitest run src/components/SkillsPanel/SkillsPanel.test.tsx
# Result: 21 failed, 43 passed (64 total)

npx vitest run src/components/RuleEvaluations/rule-evaluations-action-summary.test.tsx
# Result: 1 failed (hp_below trigger test)

npx tsc --noEmit 2>&1 | grep -c "error TS"
# Result: 59 TypeScript errors
```

## Investigation Summary

- Exchanges used: 7/10
- Hypotheses tested: 3

## Root Cause

**Confidence**: HIGH

There are exactly **three distinct issues**, all in test files only:

### Issue 1: `selectorOverride` in createSkill() calls (14 tests, 31 TS errors)

Tests pass `selectorOverride: { target: "X", criterion: "Y" }` to `createSkill()`, but the `Skill` type no longer has a `selectorOverride` field. Since `createSkill()` uses `Partial<Skill> & { id: string }`, TypeScript rejects the unknown property. Additionally, since `selectorOverride` is silently ignored by the helper, the skill gets default `target: "enemy"` and `criterion: "nearest"` instead of the intended values.

**Effect on tests**: Skills are created with default target/criterion instead of the test-specified values. Assertions like `expect(categoryDropdown).toHaveValue("ally")` fail because the skill actually has `target: "enemy"`.

**Fix pattern**: Replace `selectorOverride: { target: X, criterion: Y }` with `target: X, criterion: Y` directly.

### Issue 2: Assertions checking `updatedSkill?.selectorOverride` (15 assertions across 8 tests)

After UI interactions (dropdown changes), tests assert on `updatedSkill?.selectorOverride` which no longer exists on the Skill type. The store now updates `target` and `criterion` as separate fields.

**Effect on tests**: `updatedSkill?.selectorOverride` evaluates to `undefined`, causing every assertion to fail.

**Fix pattern**: Replace `expect(updatedSkill?.selectorOverride).toEqual({ target: X, criterion: Y })` with two assertions: `expect(updatedSkill?.target).toBe(X)` and `expect(updatedSkill?.criterion).toBe(Y)`.

### Issue 3: `aria-label="Behavior"` vs test query `/mode/i` (8 queries across 5 tests)

The SkillsPanel component renamed the dropdown label from "Mode" to "Behavior" (`aria-label="Behavior"` at SkillsPanel.tsx:319), but 8 test queries still use `screen.getByRole("combobox", { name: /mode/i })` or `screen.getAllByRole("combobox", { name: /mode/i })`.

**Effect on tests**: `TestingLibraryElementError: Unable to find an accessible element with the role "combobox" and name /mode/i`.

**Fix pattern**: Replace `/mode/i` with `/behavior/i` in role queries.

### Bonus Issue: RuleEvaluations inline Skill objects (2 tests, 2 TS errors)

Two tests in `rule-evaluations-action-summary.test.tsx` create inline Skill objects (`const customSkills: Skill[] = [{ ... }]`) that are missing required fields: `actionType`, `behavior`, `enabled`, and `triggers`. One test at line 475 is additionally missing the `triggers` field entirely (it should have `triggers: [{ type: "hp_below", value: 50 }]`).

### Bonus Issue: Selector type references in selector tests (25 TS errors)

Multiple selector test files still reference the removed `Selector` type, but these tests likely still pass at runtime because Vitest does not enforce TypeScript compilation.

## Evidence

1. **createSkill helper** (`/home/bob/Projects/auto-battler/src/engine/game-test-helpers.ts:47`): Accepts `Partial<Skill> & { id: string }`. Since `selectorOverride` is not in `Skill`, TypeScript error TS2353 fires. The helper defaults `target` to `"enemy"` and `criterion` to `"nearest"` when not provided.

2. **Test line 327**: `selectorOverride: { target: "ally", criterion: "lowest_hp" }` -- TypeScript rejects it, and even at runtime the helper ignores this unknown field, producing a skill with `target: "enemy"` instead of `"ally"`.

3. **Test line 481**: `expect(updatedSkill?.selectorOverride).toEqual(...)` -- `selectorOverride` property does not exist on `Skill`, so evaluates to `undefined`.

4. **SkillsPanel.tsx line 319**: `aria-label="Behavior"` -- component uses "Behavior", but test line 871 queries `{ name: /mode/i }`.

5. **Test output confirms**: "Expected the element to have value: ally, Received: enemy" (line 338) -- the `selectorOverride` is silently ignored, skill gets default "enemy".

## Ruled Out

- **Production code bug**: The component correctly reads `skill.target` and `skill.criterion` directly. The handlers correctly call `updateSkill` with `target` and `criterion` fields. All production code is correct.

- **createSkill helper bug**: The helper correctly defaults `target: "enemy"` and `criterion: "nearest"`. It simply does not have (and should not have) support for the removed `selectorOverride` field.

- **Store update bug**: The store `updateSkill` action correctly updates `target` and `criterion` as separate fields. The handlers in SkillsPanel.tsx pass them correctly.

## Documentation Check

- Plan alignment: PASS -- Plan Step 5 explicitly states "Replace `selectorOverride: { type: "X_Y" }` with `target: "Y", criterion: "X"` in ~120 occurrences across ~24 test files" and Step 7 states "Update selector tests to target/criterion". The SkillsPanel test file was not fully updated during the FIX phase.
- Pattern compliance: PASS -- No pattern violations. Test helpers follow the correct pattern.
- Spec compliance: PASS -- The Skill type matches the spec. Tests need updating to match.

## Recommendation

[x] Route to Coder with fix instructions
[ ] Route to Architect for design review (design flaw detected)
[ ] Unable to determine -- requires human review

### For Coder

Apply the following mechanical fixes to `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.test.tsx`:

**Step 1: Fix createSkill calls (14 occurrences)**

Replace all `selectorOverride: { target: X, criterion: Y }` with `target: X, criterion: Y`.

Before:

```typescript
const skill1 = createSkill({
  id: "skill1",
  selectorOverride: { target: "ally", criterion: "lowest_hp" },
});
```

After:

```typescript
const skill1 = createSkill({
  id: "skill1",
  target: "ally",
  criterion: "lowest_hp",
});
```

Special case for `selectorOverride: undefined` (line 789): Simply remove the property entirely, as the helper defaults to `target: "enemy", criterion: "nearest"`.

**Step 2: Fix assertions (15 occurrences)**

Replace all `expect(updatedSkill?.selectorOverride).toEqual({ target: X, criterion: Y })` with separate field assertions.

Before:

```typescript
expect(updatedSkill?.selectorOverride).toEqual({
  target: "ally",
  criterion: "nearest",
});
```

After:

```typescript
expect(updatedSkill?.target).toBe("ally");
expect(updatedSkill?.criterion).toBe("nearest");
```

**Step 3: Fix mode/behavior aria-label queries (8 occurrences)**

Replace `{ name: /mode/i }` with `{ name: /behavior/i }` in all `getByRole`/`getAllByRole` calls.

Before:

```typescript
const modeSelect = screen.getByRole("combobox", { name: /mode/i });
const modeDropdowns = screen.getAllByRole("combobox", { name: /mode/i });
```

After:

```typescript
const modeSelect = screen.getByRole("combobox", { name: /behavior/i });
const modeDropdowns = screen.getAllByRole("combobox", { name: /behavior/i });
```

Lines affected: 871, 893, 931, 1317, 1388, 1410, 1493 (getAllByRole), plus any other occurrences.

**Step 4: Fix RuleEvaluations inline Skill objects (2 occurrences)**

In `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-action-summary.test.tsx`:

At line 475, the inline Skill object is missing `actionType`, `behavior`, `enabled`, and `triggers`. Add:

```typescript
actionType: "heal",
behavior: "",
enabled: true,
triggers: [{ type: "hp_below", value: 50 }],
```

At line 513, the inline Skill object is missing `actionType` and `behavior`. Add:

```typescript
actionType: "heal",
behavior: "",
```

**Step 5: Fix Selector type references (25 TS errors, 7 test files)**

In the following files, replace `Selector` type references with the appropriate new approach. These tests call `evaluateSelector()` which may also need updating to `evaluateTargetCriterion()`:

- `src/engine/selectors-edge-cases.test.ts`
- `src/engine/selectors-lowest-hp-ally.test.ts`
- `src/engine/selectors-lowest-hp-enemy.test.ts`
- `src/engine/selectors-metric-independence.test.ts`
- `src/engine/selectors-nearest-ally.test.ts`
- `src/engine/selectors-nearest-enemy.test.ts`
- `src/engine/selectors-self.test.ts`
- `src/engine/selectors-tie-breaking.test.ts`

These files need investigation to determine whether `evaluateSelector()` was fully removed or still exists. If removed, tests must switch to `evaluateTargetCriterion()`.

### Estimated Scope

| File                                     | Tests to fix                        | Changes needed                                                  |
| ---------------------------------------- | ----------------------------------- | --------------------------------------------------------------- |
| SkillsPanel.test.tsx                     | 21                                  | ~14 createSkill fixes, ~15 assertion fixes, ~8 aria-label fixes |
| rule-evaluations-action-summary.test.tsx | 1                                   | 2 inline Skill object fixes                                     |
| 7 selector test files                    | 0 runtime failures but 25 TS errors | Selector type removal                                           |
| **Total**                                | **22 test failures**                | **~62 changes**                                                 |

### For Architect

No design issues found. The production code refactor is correctly implemented. All remaining work is mechanical test file updates that were partially completed during the FIX phase.
