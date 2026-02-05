# Implementation Plan: Trigger System Expansion

## Overview

Expand the trigger system with three features:

- **B3**: `ally_hp_below` trigger type (simplest - engine only)
- **B2**: NOT modifier via `negated` field (builds on B3)
- **B1**: AND combinator UI (engine already done)

## Implementation Order

**B3 → B2 → B1** (simplest to most complex, each builds on prior)

---

## Feature B3: ally_hp_below Trigger

### Rationale

New trigger type that checks if any ally has HP below a percentage threshold. Enables support-focused skills (e.g., "Heal when ally below 50% HP").

### Files to Modify

#### 1. `/home/bob/Projects/auto-battler/src/engine/types.ts`

- **Change**: Add `"ally_hp_below"` to Trigger type union (line 77)
- **Before**: `type: "always" | "enemy_in_range" | "ally_in_range" | "hp_below" | "my_cell_targeted_by_enemy"`
- **After**: `type: "always" | "enemy_in_range" | "ally_in_range" | "hp_below" | "ally_hp_below" | "my_cell_targeted_by_enemy"`

#### 2. `/home/bob/Projects/auto-battler/src/engine/triggers.ts`

- **Change**: Add new case in `evaluateTrigger` switch statement (after `hp_below` case, ~line 59)
- **Logic**:
  ```typescript
  case "ally_hp_below": {
    const thresholdPercent = trigger.value ?? 0;
    return allCharacters.some(
      (c) =>
        c.faction === evaluator.faction &&
        c.id !== evaluator.id &&
        c.hp > 0 &&
        c.maxHp > 0 &&
        (c.hp / c.maxHp) * 100 < thresholdPercent,
    );
  }
  ```

#### 3. `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx`

- **Change 1**: Add option to trigger type dropdown (~line 241-248)
- **Change 2**: Update `needsValue` check (~line 148-151) to include `"ally_hp_below"`
- **Change 3**: Update `handleTriggerTypeChange` (~line 49-71) to handle `"ally_hp_below"` with default value 50

#### 4. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts`

- **No change needed**: `formatTrigger` already handles `type(value)` format generically

### New Test File

`/home/bob/Projects/auto-battler/src/engine/triggers-ally-hp-below.test.ts`

### Edge Cases

- Ally at exactly threshold (should return false - "below" not "at or below")
- No allies alive (should return false)
- Only evaluator alive (should return false - excludes self)
- Ally with maxHp <= 0 (should skip that ally, not crash)
- Value is 0 (always false - nothing is below 0%)
- Value is 100 (true if any ally not at full HP)

---

## Feature B2: NOT Modifier

### Rationale

Allow negating any trigger condition. E.g., "Attack when NOT hp_below 50%" or "Move when NOT enemy_in_range 2".

### Files to Modify

#### 1. `/home/bob/Projects/auto-battler/src/engine/types.ts`

- **Change**: Add `negated?: boolean` field to Trigger interface (~line 83)
- **After**:
  ```typescript
  export interface Trigger {
    type:
      | "always"
      | "enemy_in_range"
      | "ally_in_range"
      | "hp_below"
      | "ally_hp_below"
      | "my_cell_targeted_by_enemy";
    value?: number;
    negated?: boolean; // If true, invert the trigger result
  }
  ```

#### 2. `/home/bob/Projects/auto-battler/src/engine/triggers.ts`

- **Change**: Wrap result with negation check at end of function
- **Approach**: Extract switch result to variable, apply negation before return
- **Implementation**:
  ```typescript
  export function evaluateTrigger(
    trigger: Trigger,
    evaluator: Character,
    allCharacters: Character[],
  ): boolean {
    let result: boolean;

    switch (
      trigger.type
      // ... existing cases, assign to result instead of return
    ) {
    }

    // Apply negation if specified
    return trigger.negated ? !result : result;
  }
  ```

#### 3. `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx`

- **Change 1**: Add NOT toggle checkbox next to trigger dropdown
- **Change 2**: Add handler `handleNegatedToggle(instanceId, currentNegated)`
- **Change 3**: Preserve `negated` field when changing trigger type/value
- **UI Location**: Before trigger type dropdown in controlRow

#### 4. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts`

- **Change**: Update `formatTrigger` to prefix "NOT " when negated
- **Implementation**:
  ```typescript
  export function formatTrigger(trigger: Trigger): string {
    const prefix = trigger.negated ? "NOT " : "";
    if (trigger.value !== undefined) {
      return `${prefix}${trigger.type}(${trigger.value})`;
    }
    return `${prefix}${trigger.type}`;
  }
  ```

### New Test File

`/home/bob/Projects/auto-battler/src/engine/triggers-not-modifier.test.ts`

### Edge Cases

- NOT always (should always return false)
- NOT with undefined negated field (should behave as false/non-negated)
- Double negation prevented (UI only allows single toggle, no `negated: false` explicit)
- Negated trigger in failedTriggers display (should show "NOT type(value)")

---

## Feature B1: AND Combinator UI

### Rationale

Engine already supports multiple triggers with AND logic via `skill.triggers.every()`. UI currently only shows/edits the first trigger. Need to expose second trigger slot.

### Current State

- Engine: `triggers: Trigger[]` with AND logic in `game-decisions.ts` line 79
- UI: Only displays `skill.triggers[0]`
- Rejection tracking: `failedTriggers` array captures all failed triggers

### Files to Modify

#### 1. `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.tsx`

**Change 1**: Add "Add Trigger" button when triggers.length < 2

- Location: After first trigger row
- Condition: `skill.triggers.length < 2`
- Action: Adds `{ type: "always" }` to triggers array

**Change 2**: Display second trigger row when triggers.length === 2

- Reuse existing trigger UI pattern
- Add "AND" label between triggers
- Add "Remove" button on second trigger

**Change 3**: Update handlers for multi-trigger support

- `handleTriggerTypeChange(instanceId, triggerType, triggerIndex)`
- `handleTriggerValueChange(instanceId, triggerType, value, triggerIndex)`
- `handleNegatedToggle(instanceId, negated, triggerIndex)`
- New: `handleAddTrigger(instanceId)`
- New: `handleRemoveTrigger(instanceId, triggerIndex)`

**Change 4**: Update skill update calls to preserve full triggers array

- When modifying trigger at index 0, preserve trigger at index 1
- When modifying trigger at index 1, preserve trigger at index 0

#### 2. `/home/bob/Projects/auto-battler/src/components/SkillsPanel/SkillsPanel.module.css`

- **Change**: Add styles for AND label and trigger rows
- Classes: `.andLabel`, `.triggerRow`, `.removeTriggerButton`

#### 3. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-formatters.ts`

- **Change**: Add function to format multiple triggers with AND
- **Implementation**:
  ```typescript
  export function formatTriggers(triggers: Trigger[]): string {
    if (triggers.length === 0) return "always";
    return triggers.map(formatTrigger).join(" AND ");
  }
  ```

### Edge Cases

- Adding trigger when triggers array is empty (initialize with `[{ type: "always" }]`)
- Removing last trigger (should leave `[{ type: "always" }]`, not empty array)
- Trigger value preservation when switching types
- UI state sync when triggers array changes externally (e.g., skill registry update)

---

## Backward Compatibility

### Existing Single-Trigger Behavior

- Skills with `triggers: [{ type: "always" }]` continue to work unchanged
- Empty triggers array still passes (vacuous truth - tested in `game-decisions-trigger-and-logic.test.ts`)
- `negated: undefined` treated as `negated: false`

### Migration Path

- No data migration needed - existing skills have valid structure
- New fields (`negated`, second trigger) are optional additions

---

## Spec Alignment Check

- [x] `ally_hp_below` follows spec trigger pattern (Section 13.3)
- [x] NOT modifier doesn't conflict with existing trigger logic
- [x] AND UI exposes existing engine capability (already spec-compliant)
- [x] Follows architecture: pure engine, no React in `/src/engine/`
- [x] Test organization: one file per trigger type (pattern from existing tests)

---

## Risk Assessment

### Low Risk

- B3 (ally_hp_below): Follows established trigger pattern exactly
- B2 (NOT): Simple boolean inversion, no logic changes

### Medium Risk

- B1 (AND UI): More complex state management for multiple triggers
  - Mitigation: Reuse existing trigger UI components
  - Mitigation: Preserve triggers array immutably

### Testing Strategy

- Unit tests for each trigger type (engine)
- Integration tests for AND logic (already exists, extend)
- Component tests for UI changes (SkillsPanel)

---

## Implementation Sequence

### Phase 1: B3 - ally_hp_below (Engine)

1. Add type to `types.ts`
2. Add case to `triggers.ts`
3. Add UI option to `SkillsPanel.tsx`
4. Write tests

### Phase 2: B2 - NOT modifier (Engine + UI)

1. Add `negated` field to `types.ts`
2. Wrap evaluateTrigger result in `triggers.ts`
3. Update `formatTrigger` in formatters
4. Add NOT toggle to `SkillsPanel.tsx`
5. Write tests

### Phase 3: B1 - AND UI (UI only)

1. Refactor SkillsPanel trigger handlers for index parameter
2. Add second trigger row rendering
3. Add Add/Remove trigger buttons
4. Add CSS styles
5. Update formatters for multi-trigger display
6. Write component tests

---

## New Decision

**Decision**: Limit UI to maximum 2 triggers per skill

**Context**: Engine supports unlimited triggers, but UI complexity increases exponentially. Two triggers cover most tactical scenarios (e.g., "enemy_in_range AND hp_below").

**Consequences**:

- Simpler UI implementation
- Clear user mental model
- Can extend to 3+ later if needed
- Recommend documenting in ADR if this becomes a permanent constraint
