# Design: SkillEvaluationResult Interface

<!-- PULSE: [2026-01-03] architect - Designing skill evaluation result interface for RuleEvaluations panel enhancement -->

## Problem Statement

**Current behavior**: RuleEvaluations shows "Light Punch: if always ✓" for ALL skills, only displaying trigger pass/fail status.

**Desired behavior**: Show WHY each skill wasn't selected:

- "1. Light Punch - no target in range"
- "2. Heavy Punch - no target in range"
- "→ Move Towards" (selected action)

The triggers are already visible in SkillsPanel, so showing them again is redundant.

## Comprehensive Context Discovery Results

### Project Context

- **Appetite Constraints** (from spec.md): v0.3 scope, clarity over cleverness, progressive disclosure
- **System Constraints** (from architecture.md): Pure game engine in `/src/engine/`, no React dependencies in engine
- **Design Vision**: "always let players see why AI made each choice"

### Current Implementation Analysis

**[`computeDecisions()`](src/engine/game.ts:280-361)** silently skips skills for these reasons:

1. **Mid-action** (line 285-287): Character has `currentAction !== null`
2. **Disabled** (line 294-296): `skill.enabled === false`
3. **Trigger failed** (line 299-304): `skill.triggers.some(t => !passes)`
4. **No target** (line 327-329): `evaluateSelector()` returns `null`
5. **Out of range** (line 337-342): Attack target beyond `skill.range`
6. **Selected** (line 346): Skill matched all criteria

**[`evaluateSkillTriggers()`](src/components/RuleEvaluations/RuleEvaluations.tsx:23-35)** only returns `{ trigger, passed }` - insufficient for the new display.

## Design Decision

### Options Considered

| Option                                  | Approach                                      | Pros                          | Cons                                                  |
| --------------------------------------- | --------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| 1. Refactor `computeDecisions()`        | Return evaluation results alongside decisions | Single source of truth        | Changes engine API, perf concern if called frequently |
| 2. Separate `evaluateSkills()` function | New function dedicated to evaluation          | Clean separation, engine pure | Duplicates logic                                      |
| 3. **Extract shared helpers**           | Factor out evaluation logic, both use it      | DRY, consistent, testable     | More refactoring upfront                              |

### Chosen Approach: Option 3 - Extract Shared Helpers

Create a pure function `evaluateSkillsForCharacter()` in the engine that returns structured evaluation results. Both `computeDecisions()` and the RuleEvaluations component will use this shared logic.

**Rationale**:

- Maintains engine purity (no React dependencies)
- Single source of truth for skill evaluation logic
- Testable in isolation
- Progressive disclosure: component decides what to show

## Interface Design

### New Types (add to `src/engine/types.ts`)

```typescript
/**
 * Reason why a skill was not selected during decision phase.
 */
export type SkillRejectionReason =
  | "disabled" // skill.enabled === false
  | "trigger_failed" // One or more triggers didn't pass
  | "no_target" // Selector returned null (no valid target exists)
  | "out_of_range"; // Target exists but beyond skill.range

/**
 * Result of evaluating a single skill for a character.
 */
export interface SkillEvaluationResult {
  skill: Skill;
  status: "selected" | "rejected" | "skipped";
  rejectionReason?: SkillRejectionReason;

  // Additional context for display (optional, enriches understanding)
  target?: Character; // The selected/attempted target
  distance?: number; // Distance to target (for out_of_range context)
  failedTriggers?: Trigger[]; // Which triggers failed (for trigger_failed)
}

/**
 * Complete evaluation results for a character's skill list.
 */
export interface CharacterEvaluationResult {
  characterId: string;
  isMidAction: boolean; // True if continuing existing action
  currentAction?: Action; // The action being continued (if mid-action)
  skillEvaluations: SkillEvaluationResult[];
  selectedSkillIndex: number | null; // Index of selected skill, null if idle
}
```

### New Function (add to `src/engine/game.ts`)

```typescript
/**
 * Evaluate all skills for a character and return detailed results.
 *
 * This function mirrors the decision logic in computeDecisions() but
 * returns structured data for UI display instead of creating actions.
 *
 * @param character - Character to evaluate skills for
 * @param allCharacters - All characters in battle (for targeting)
 * @returns Detailed evaluation results for all skills
 */
export function evaluateSkillsForCharacter(
  character: Character,
  allCharacters: Character[],
): CharacterEvaluationResult {
  // 1. Check if mid-action
  if (character.currentAction !== null) {
    return {
      characterId: character.id,
      isMidAction: true,
      currentAction: character.currentAction,
      skillEvaluations: [],
      selectedSkillIndex: null,
    };
  }

  const evaluations: SkillEvaluationResult[] = [];
  let selectedIndex: number | null = null;

  for (let i = 0; i < character.skills.length; i++) {
    const skill = character.skills[i];

    // Already found a valid skill - mark remaining as skipped
    if (selectedIndex !== null) {
      evaluations.push({ skill, status: "skipped" });
      continue;
    }

    // Check disabled
    if (!skill.enabled) {
      evaluations.push({
        skill,
        status: "rejected",
        rejectionReason: "disabled",
      });
      continue;
    }

    // Check triggers
    const failedTriggers = skill.triggers.filter(
      (t) => !evaluateTrigger(t, character, allCharacters),
    );
    if (failedTriggers.length > 0) {
      evaluations.push({
        skill,
        status: "rejected",
        rejectionReason: "trigger_failed",
        failedTriggers,
      });
      continue;
    }

    // Special case: hold mode doesn't need target
    if (skill.mode === "hold") {
      evaluations.push({ skill, status: "selected" });
      selectedIndex = i;
      continue;
    }

    // Evaluate selector
    const selector = skill.selectorOverride ?? DEFAULT_SELECTOR;
    const target = evaluateSelector(selector, character, allCharacters);

    if (!target) {
      evaluations.push({
        skill,
        status: "rejected",
        rejectionReason: "no_target",
      });
      continue;
    }

    // Check range for attacks
    const actionType = getActionType(skill);
    if (actionType === "attack") {
      const distance = chebyshevDistance(character.position, target.position);
      if (distance > skill.range) {
        evaluations.push({
          skill,
          status: "rejected",
          rejectionReason: "out_of_range",
          target,
          distance,
        });
        continue;
      }
    }

    // Skill selected!
    evaluations.push({ skill, status: "selected", target });
    selectedIndex = i;
  }

  return {
    characterId: character.id,
    isMidAction: false,
    skillEvaluations: evaluations,
    selectedSkillIndex: selectedIndex,
  };
}
```

## UI Display Format

### Component Changes (`RuleEvaluations.tsx`)

Replace trigger display with rejection reason display:

```tsx
function formatRejectionReason(result: SkillEvaluationResult): string {
  switch (result.rejectionReason) {
    case "disabled":
      return "[disabled]";
    case "trigger_failed":
      return "trigger not met";
    case "no_target":
      return "no target";
    case "out_of_range":
      return `target out of range (${result.distance} > ${result.skill.range})`;
    default:
      return "";
  }
}
```

### Display Examples

**When Move is selected (attacks have no target in range)**:

```
Skill Priority

1. Light Punch — no target
2. Heavy Punch — no target
→ 3. Move Towards
```

**When Light Punch is selected**:

```
Skill Priority

→ 1. Light Punch
```

**When character is mid-action**:

```
Continuing: Heavy Punch (resolves next tick)
```

**When idle (no valid skills)**:

```
Skill Priority

1. Light Punch — no target
2. Heavy Punch — no target
3. Move [disabled]

💤 No valid action
```

### Visual Design

- Selected skill: Arrow prefix "→" and highlight styling
- Rejected skills: Muted text color, reason in em-dash suffix
- Skipped skills: Hidden by default (use existing collapsible pattern)

## Implementation Roadmap

### Step 1: Add Types to Engine

- Add `SkillRejectionReason`, `SkillEvaluationResult`, `CharacterEvaluationResult` to `src/engine/types.ts`
- Export from types.ts

### Step 2: Implement Engine Function

- Add `evaluateSkillsForCharacter()` to `src/engine/game.ts`
- Ensure `getActionType()` and `DEFAULT_SELECTOR` are accessible (move to module scope or export)
- Add unit tests for all rejection cases

### Step 3: Update RuleEvaluations Component

- Import new function and types
- Replace `evaluateSkillTriggers()` with call to `evaluateSkillsForCharacter()`
- Update display formatting
- Remove trigger display (already shown in SkillsPanel)

### Step 4: Update CSS

- Style for selected skill (arrow + highlight)
- Style for rejection reason (muted, suffix)
- Ensure accessibility (not relying on color alone)

## Files to Modify

| File                                                        | Changes                                     |
| ----------------------------------------------------------- | ------------------------------------------- |
| `src/engine/types.ts`                                       | Add 3 new types                             |
| `src/engine/game.ts`                                        | Add `evaluateSkillsForCharacter()` function |
| `src/components/RuleEvaluations/RuleEvaluations.tsx`        | Replace evaluation logic, update display    |
| `src/components/RuleEvaluations/RuleEvaluations.module.css` | Add styles for new display format           |

## Test Strategy

### Engine Tests (`src/engine/game.test.ts`)

| Test                                   | Description                                                      |
| -------------------------------------- | ---------------------------------------------------------------- |
| `evaluates disabled skill as rejected` | Returns `rejectionReason: 'disabled'`                            |
| `evaluates failed trigger as rejected` | Returns `rejectionReason: 'trigger_failed'` with failed triggers |
| `evaluates no target as rejected`      | Returns `rejectionReason: 'no_target'`                           |
| `evaluates out of range as rejected`   | Returns `rejectionReason: 'out_of_range'` with distance          |
| `marks selected skill correctly`       | Returns `status: 'selected'` for valid skill                     |
| `marks subsequent skills as skipped`   | Skills after selected are `status: 'skipped'`                    |
| `handles mid-action character`         | Returns `isMidAction: true` with current action                  |
| `handles hold mode without target`     | Hold mode skill can be selected without target                   |

### Component Tests (`src/components/RuleEvaluations/RuleEvaluations.test.tsx`)

| Test                                       | Description                              |
| ------------------------------------------ | ---------------------------------------- |
| `displays rejection reason for each skill` | Shows "no target" / "out of range" / etc |
| `highlights selected skill with arrow`     | Arrow prefix and highlight class         |
| `shows mid-action state correctly`         | "Continuing: X" format                   |
| `hides triggers (shown in SkillsPanel)`    | No trigger display in skill list         |

## Constraints Satisfied

- ✅ Engine remains pure TypeScript (no React dependencies)
- ✅ Separation of concerns (engine evaluates, component displays)
- ✅ Follows existing patterns (types in types.ts, logic in game.ts)
- ✅ Progressive disclosure (skipped skills hidden by default)
- ✅ Testable (pure function with deterministic output)
