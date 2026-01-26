# Exploration Findings: Skill Priority Sub-panel UI Enhancement

## Task Summary

Enhance the `SkillPriorityList` component in `RuleEvaluations.tsx` to improve transparency of AI decision-making by:

1. Always showing higher-priority skills that failed (with rejection reasons)
2. Showing an expandable section with remaining lower-priority skills
3. Maintaining existing functionality for selected skill highlighting and collapsible sections

## Current Implementation Analysis

### SkillPriorityList Component (Lines 120-168)

The current `SkillPriorityList` function divides skills into two groups:

```tsx
// Current logic:
const visibleSkills =
  selectedSkillIndex !== null
    ? skillEvaluations.slice(0, selectedSkillIndex + 1) // Skills up to selected
    : skillEvaluations; // All if none selected

const collapsedSkills =
  selectedSkillIndex !== null
    ? skillEvaluations.slice(selectedSkillIndex + 1) // Skills after selected
    : [];
```

**Current Behavior:**

- Shows skills from index 0 through `selectedSkillIndex` (inclusive)
- Collapses remaining skills below selected skill
- When `selectedSkillIndex` is null (idle), shows all skills without collapsing
- Uses `<details>/<summary>` pattern per documented collapsible section pattern

**Problem:** This shows ALL higher-priority skills, but the new requirement is:

- Always show higher-priority skills that are NOT satisfied (rejected)
- The selected skill should be visible
- Lower-priority skills (below selected) go in expandable section

### Data Structures Available

From `src/engine/types.ts`:

```typescript
interface SkillEvaluationResult {
  skill: Skill;
  status: "selected" | "rejected" | "skipped";
  rejectionReason?: SkillRejectionReason; // "disabled" | "trigger_failed" | "no_target" | "out_of_range"
  target?: Character;
  distance?: number; // For out_of_range context
  failedTriggers?: Trigger[]; // For trigger_failed context
}

interface CharacterEvaluationResult {
  characterId: string;
  isMidAction: boolean;
  currentAction?: Action;
  skillEvaluations: SkillEvaluationResult[];
  selectedSkillIndex: number | null; // null if idle
}
```

### Rejection Reason Formatting (Lines 26-39)

Already implemented in `formatRejectionReason()`:

- `"disabled"` -> `"[disabled]"`
- `"trigger_failed"` -> `"trigger not met"`
- `"no_target"` -> `"no target"`
- `"out_of_range"` -> `"target out of range (X > Y)"`

### renderSkillListItems Helper (Lines 206-233)

Renders skill items with:

- Index numbering (1-based)
- Arrow indicator for selected skill
- Rejection reason display
- Active skill CSS class

## Spec Alignment Check

From `.docs/spec.md`:

- **Design Vision**: "Progressive disclosure: Show minimum needed for immediate decisions, reveal depth on demand"
- **Transparency Goal**: "always let players see why AI made each choice"
- **Rule Evaluations Panel**: "Real-time AI decision display...shows skill priority evaluation"

**Alignment**: The enhancement directly supports the transparency goal by showing WHY higher-priority skills were skipped.

## Architecture Alignment

From `.docs/architecture.md`:

- **CSS Modules**: Used for styling
- **Zustand selectors**: For fine-grained re-renders
- **Functional Components with Hooks**: Pattern followed

No conflicts with architecture.

## Pattern Alignment

From `.docs/patterns/index.md`:

- **Collapsible Section Pattern**: Uses native `<details>/<summary>` elements
- Already implemented in `SkillPriorityList` for lower-priority skills

The enhancement should continue using this pattern for the lower-priority expandable section.

## Existing Tests

### rule-evaluations-skill-priority.test.tsx (154 lines)

Relevant tests:

- Test 12: Displays skill priority list with indices
- Test 13: Indicates disabled skills with `[disabled]` rejection reason
- Test 14: Displays "no target" rejection reason
- Test 17: Shows collapsible section for skills below active skill (expects "Show 2 more skills")
- Test 18: No collapsible section when last skill is active
- Test 23: Displays out of range rejection with distance information

**Impact:** Tests 17 and 18 test the collapsible behavior and may need updates if the grouping logic changes.

### rule-evaluations-basic.test.tsx (195 lines)

Relevant tests:

- Test 20: Semantic list structure (expects `<ol>` element)
- Test 21: Selected skill arrow indicator
- Test 22: Active skill highlighting (expects `activeSkill` class)

**Impact:** These test the visual indicators that should remain unchanged.

## Constraints

1. **File Size Limit**: RuleEvaluations.tsx is currently **444 lines** (over 400 limit)
   - May need decomposition if changes add significant lines
   - Consider extracting `SkillPriorityList` to separate file

2. **TypeScript Strict Mode**: All code must type-check without errors

3. **Accessibility Requirements**:
   - Screen reader compatibility via semantic HTML
   - `<details>/<summary>` provides built-in accessibility
   - Focus ring for keyboard navigation
   - Respect reduced motion preference

4. **CSS Variables**: Use existing variables (`--content-muted`, `--border-subtle`, etc.)

## Key Observations

### Current Skill Display Logic Flaw

The current implementation shows "skills up to selected index" which includes ALL skills, not just rejected ones. Example:

Skills: [Light Punch, Move, Heavy Punch]

- Light Punch: rejected (no target)
- Move: selected (always triggers)
- Heavy Punch: skipped

Current display:

1. Light Punch - no target
2. Move (selected)
   [Collapsed: Heavy Punch]

This is actually correct behavior for the current implementation. The issue is that the task description says "always show any higher priority skills that are not satisfied" - which is what the current code does. The real change is about GROUPING:

**Desired behavior:**

1. **Primary section (always visible)**:
   - All skills with status "rejected" (higher priority but not satisfied)
   - The selected skill (if any)
2. **Expandable section**:
   - All remaining skills (status "skipped")

### Edge Cases to Consider

1. **No selected skill (idle)**: All skills are rejected, show all in primary section, no expandable
2. **First skill selected**: No rejected skills above, just show selected, expandable has rest
3. **Last skill selected**: All above rejected, show all, no expandable section
4. **All skills disabled**: All rejected with "disabled", show all, idle state
5. **Mid-action state**: Shows "Continuing Action" instead of skill list (handled by MidActionDisplay)

## Files to Modify

1. **`src/components/RuleEvaluations/RuleEvaluations.tsx`**
   - Modify `SkillPriorityList` function to change grouping logic
   - May need to add sub-headers or visual separators

2. **`src/components/RuleEvaluations/RuleEvaluations.module.css`**
   - May need styles for visual hierarchy between rejected/selected/skipped groups

3. **`src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`**
   - Update Test 17 expectations if collapsible content changes
   - Add new tests for the enhanced grouping logic

## Recommended Approach

1. **Modify `SkillPriorityList` to group by status**:

   ```tsx
   // Primary section: rejected + selected
   const primarySkills = skillEvaluations.filter(
     (e, idx) => e.status === "rejected" || idx === selectedSkillIndex,
   );

   // Expandable section: skipped
   const expandableSkills = skillEvaluations.filter(
     (e) => e.status === "skipped",
   );
   ```

2. **Maintain original indices for numbering** (critical for user understanding)

3. **Keep existing visual patterns**:
   - Arrow indicator for selected
   - Rejection reason formatting
   - Collapsible pattern for expandable section

4. **Consider file decomposition** if changes push beyond 400 lines:
   - Extract `SkillPriorityList` to `SkillPriorityList.tsx`
   - Extract helper functions to `rule-evaluations-helpers.ts`
