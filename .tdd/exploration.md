# Exploration Findings: Trigger System Expansion

## Current Trigger Data Model

**Location:** `src/engine/types.ts` (lines 72-83)

```typescript
export interface Trigger {
  type:
    | "always"
    | "enemy_in_range"
    | "ally_in_range"
    | "hp_below"
    | "my_cell_targeted_by_enemy";
  value?: number;
}
```

**Skill.triggers field:** Already an array `triggers: Trigger[]`

**Critical finding:** AND logic already implemented in `game-decisions.ts`:

```typescript
const allTriggersPass = skill.triggers.every((trigger) =>
  evaluateTrigger(trigger, character, allCharacters),
);
```

## Trigger Evaluation Logic

**Location:** `src/engine/triggers.ts`

**Function:** `evaluateTrigger(trigger, evaluator, allCharacters): boolean`

**Current types:** always, enemy_in_range, ally_in_range, hp_below, my_cell_targeted_by_enemy

**Rejection tracking:** `game-decisions.ts` lines 240-249 capture failed triggers in `failedTriggers` array.

## UI Components

**Location:** `src/components/SkillsPanel/SkillsPanel.tsx`

**Current limitation:** UI assumes single trigger - displays only `skill.triggers[0]`

**Key handlers:** `handleTriggerTypeChange`, `handleTriggerValueChange` - both work with single trigger

**Formatting:** `src/components/RuleEvaluations/rule-evaluations-formatters.ts` - `formatTrigger()` returns `type(value)` format

## Data Model Readiness

| Feature           | Engine              | UI                | Gap                   |
| ----------------- | ------------------- | ----------------- | --------------------- |
| B1: AND           | ✅ Done             | ❌ Single only    | UI needs 2nd dropdown |
| B2: NOT           | ❌ No negated field | ❌ No toggle      | Both need work        |
| B3: ally_hp_below | ❌ Type missing     | ❌ Option missing | Both need work        |

## Files to Modify

### Engine

- `src/engine/types.ts` - Add `negated?: boolean`, add `"ally_hp_below"` type
- `src/engine/triggers.ts` - Add NOT wrapper, add ally_hp_below case

### UI

- `src/components/SkillsPanel/SkillsPanel.tsx` - 2nd trigger dropdown, NOT toggle, ally_hp_below option
- `src/components/RuleEvaluations/rule-evaluations-formatters.ts` - NOT prefix, AND display

### Tests

- New: `triggers-ally-hp-below.test.ts`
- New: `triggers-not-modifier.test.ts`
- Update: `game-decisions-trigger-and-logic.test.ts`

## Patterns to Follow

1. Type exhaustiveness with `never` in switch default
2. Trigger format: `type(value)`
3. Test organization: one file per trigger type
4. Rejection tracking: preserve `failedTriggers` array
5. Pure engine: no React in `/src/engine/`
