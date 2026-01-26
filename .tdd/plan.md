# Implementation Plan: Skill Priority Sub-panel UI Enhancement

## Overview

Enhance the `SkillPriorityList` component to group skills by evaluation status rather than by position, improving transparency of AI decision-making.

**Current Behavior**: Shows skills up to and including selected index, collapses rest.

**New Behavior**: Shows rejected skills + selected skill always visible, collapses only skipped skills.

## Spec Alignment Check

- [x] Plan aligns with `.docs/spec.md` requirements (Progressive disclosure, Transparency goal)
- [x] Approach consistent with `.docs/architecture.md` (CSS Modules, functional components)
- [x] Patterns follow `.docs/patterns/index.md` (Collapsible Section Pattern)
- [x] No conflicts with `.docs/decisions/index.md` (ADR-001 unchanged)

---

## Step 1: File Size Constraint Analysis

**Current state**: `RuleEvaluations.tsx` is 444 lines (exceeds 400-line limit).

**Decision**: Do NOT extract `SkillPriorityList` to a separate file at this time.

**Rationale**:

1. The changes will REDUCE line count by simplifying logic
2. Current implementation has redundant slicing logic that can be replaced with filtering
3. If post-implementation line count still exceeds 400, extraction should happen as a follow-up task

**Line count projection**:

- Remove: ~10 lines (redundant slice logic, separate indexing)
- Add: ~15 lines (filtering logic, optional "Checked but not viable" label)
- Net change: approximately +5 lines
- Projected total: ~449 lines (still over limit, but marginal)

**Recommendation**: Proceed with implementation, then evaluate extraction as separate task if needed.

---

## Step 2: Core Logic Change in `SkillPriorityList`

### Current Implementation (Lines 120-168)

```tsx
// Current: position-based grouping
const visibleSkills =
  selectedSkillIndex !== null
    ? skillEvaluations.slice(0, selectedSkillIndex + 1)
    : skillEvaluations;

const collapsedSkills =
  selectedSkillIndex !== null
    ? skillEvaluations.slice(selectedSkillIndex + 1)
    : [];
```

### New Implementation

```tsx
// New: status-based grouping with index tracking
// Primary section: rejected skills + selected skill (always visible)
const primarySkillsWithIndices = skillEvaluations
  .map((evaluation, index) => ({ evaluation, originalIndex: index }))
  .filter(
    ({ evaluation, originalIndex }) =>
      evaluation.status === "rejected" || originalIndex === selectedSkillIndex,
  );

// Expandable section: skipped skills only
const skippedSkillsWithIndices = skillEvaluations
  .map((evaluation, index) => ({ evaluation, originalIndex: index }))
  .filter(({ evaluation }) => evaluation.status === "skipped");
```

### Key Design Decisions

1. **Preserve original indices**: Users see 1-based numbers matching skill priority order
2. **Track indices alongside evaluations**: Use `{ evaluation, originalIndex }` tuples
3. **Filter by status, not position**: `rejected` and `selected` in primary, `skipped` in expandable

---

## Step 3: Rendering Changes

### Modified `SkillPriorityList` Structure

```tsx
function SkillPriorityList({ skillEvaluations, selectedSkillIndex }) {
  // Compute grouped skills with indices
  const primarySkillsWithIndices = skillEvaluations
    .map((evaluation, index) => ({ evaluation, originalIndex: index }))
    .filter(
      ({ evaluation, originalIndex }) =>
        evaluation.status === "rejected" ||
        originalIndex === selectedSkillIndex,
    );

  const skippedSkillsWithIndices = skillEvaluations
    .map((evaluation, index) => ({ evaluation, originalIndex: index }))
    .filter(({ evaluation }) => evaluation.status === "skipped");

  return (
    <div className={styles.skillPrioritySection}>
      <h3 className={styles.sectionHeader}>Skill Priority</h3>

      {/* Primary skills: rejected + selected */}
      <ol className={styles.skillList} role="list">
        {primarySkillsWithIndices.map(({ evaluation, originalIndex }) => (
          <SkillListItem
            key={evaluation.skill.id}
            evaluation={evaluation}
            displayIndex={originalIndex + 1}
            isSelected={originalIndex === selectedSkillIndex}
          />
        ))}
      </ol>

      {/* Expandable: skipped skills */}
      {skippedSkillsWithIndices.length > 0 && (
        <details className={styles.collapsedSkills}>
          <summary className={styles.collapsedSummary}>
            Show {skippedSkillsWithIndices.length} more skill
            {skippedSkillsWithIndices.length > 1 ? "s" : ""}
          </summary>
          <ol className={styles.skillList} role="list">
            {skippedSkillsWithIndices.map(({ evaluation, originalIndex }) => (
              <SkillListItem
                key={evaluation.skill.id}
                evaluation={evaluation}
                displayIndex={originalIndex + 1}
                isSelected={false}
              />
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
```

### Refactor `renderSkillListItems` to `SkillListItem` Component

Convert the inline render function to a proper component for clarity:

```tsx
function SkillListItem({
  evaluation,
  displayIndex,
  isSelected,
}: {
  evaluation: SkillEvaluationResult;
  displayIndex: number;
  isSelected: boolean;
}) {
  const rejectionReason =
    evaluation.status === "rejected" ? formatRejectionReason(evaluation) : "";

  return (
    <li
      key={evaluation.skill.id}
      className={`${styles.skillItem} ${isSelected ? styles.activeSkill : ""}`}
    >
      <div className={styles.skillName}>
        {isSelected && <span className={styles.selectedArrow}>→ </span>}
        {displayIndex}. {evaluation.skill.name}
        {rejectionReason && (
          <span className={styles.rejectionReason}> — {rejectionReason}</span>
        )}
      </div>
    </li>
  );
}
```

---

## Step 4: Edge Cases

### Edge Case 1: No Selected Skill (Idle State)

**Scenario**: All skills are rejected, `selectedSkillIndex` is `null`.

**Behavior**:

- `primarySkillsWithIndices`: All skills with `status === 'rejected'`
- `skippedSkillsWithIndices`: Empty (no skills have `status === 'skipped'`)
- Result: All skills shown in primary section, no expandable section

**No special handling required** - the filter logic naturally handles this.

### Edge Case 2: First Skill Selected

**Scenario**: `selectedSkillIndex === 0` (first skill is selected).

**Behavior**:

- `primarySkillsWithIndices`: Only the selected skill (index 0)
- `skippedSkillsWithIndices`: All remaining skills (status `skipped`)
- Result: Single skill visible, rest in expandable section

**No special handling required**.

### Edge Case 3: Last Skill Selected

**Scenario**: `selectedSkillIndex === skillEvaluations.length - 1`.

**Behavior**:

- `primarySkillsWithIndices`: All rejected skills + selected (last) skill
- `skippedSkillsWithIndices`: Empty (no skills after selected)
- Result: All skills visible, no expandable section

**No special handling required**.

### Edge Case 4: No Skills

**Scenario**: `skillEvaluations` is empty.

**Behavior**:

- Both arrays empty
- Result: Empty ordered list rendered

**Consider**: Add empty state message? Current implementation does not have one. Leave as-is for consistency.

### Edge Case 5: All Skills Skipped (Theoretical)

**Scenario**: A selected skill at index N where all skills before it pass triggers but are not chosen.

**Note**: This cannot happen in the current game logic - a skill is either selected, rejected, or skipped. If a skill passes all checks, it becomes selected. Skills after the selected one are skipped.

**No special handling required**.

---

## Step 5: CSS Changes

### No New CSS Classes Required

The existing CSS classes are sufficient:

- `.skillPrioritySection` - Container
- `.skillList` - Ordered list
- `.skillItem` - Individual skill item
- `.activeSkill` - Selected skill highlighting
- `.selectedArrow` - Arrow indicator
- `.rejectionReason` - Rejection text styling
- `.collapsedSkills` - Details element
- `.collapsedSummary` - Summary text

### Optional Enhancement (Deferred)

Consider adding visual separation between rejected and selected skill:

- A subtle divider or spacing change
- Different background shade for rejected vs selected

**Decision**: Defer to future enhancement. Current styling provides adequate visual hierarchy through:

- Arrow indicator for selected
- `activeSkill` class with distinct background
- Rejection reason text in muted color

---

## Step 6: Accessibility Preservation

### Current Accessibility Features (Maintain)

1. **Semantic HTML**: `<ol>` with `role="list"` for skill priority
2. **Keyboard Navigation**: Native `<details>/<summary>` provides Enter/Space activation
3. **Screen Reader Support**: Summary announces expanded/collapsed state
4. **Focus Indicators**: `:focus-visible` styling in CSS

### Changes Required

**Remove the `start` attribute workaround**:

Current code uses `start={(selectedSkillIndex ?? -1) + 2}` to continue numbering in the collapsed section. With the new approach, each `<li>` displays its `displayIndex` explicitly, so the `start` attribute is no longer needed.

```tsx
// Before (has start attribute)
<ol className={styles.skillList} role="list" start={(selectedSkillIndex ?? -1) + 2}>

// After (no start attribute needed, indices rendered explicitly)
<ol className={styles.skillList} role="list">
```

---

## Step 7: Test Modifications

### Tests Requiring Updates

#### Test 17: Collapsible Section Behavior

**Current expectation**: "Show 2 more skills" when Light Punch selected.

**File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`

**Scenario**: Character with default skills (Light Punch, Move, Heavy Punch). Enemy at position (1,0), character at (0,0). Light Punch selected.

**Current skill evaluations**:

- Light Punch: `selected` (enemy in range)
- Move: `skipped` (higher priority skill matched)
- Heavy Punch: `skipped` (higher priority skill matched, also disabled but disabled doesn't matter after skip)

**New expectation**: "Show 2 more skills" - UNCHANGED because Move and Heavy Punch are both `skipped`.

**Action**: Verify test still passes without modification.

#### Test 18: No Collapsible When Last Skill Active

**Current expectation**: No `<details>` element when Heavy Punch (last skill) is active.

**Scenario**: Light Punch disabled, Move disabled, Heavy Punch enabled and selected.

**Current skill evaluations**:

- Light Punch: `rejected` (disabled)
- Move: `rejected` (disabled)
- Heavy Punch: `selected`

**New behavior**: Primary section shows all three skills (2 rejected + 1 selected). Skipped section is empty.

**Action**: Verify test still passes - should work because no `skipped` skills means no expandable section.

### New Tests Required

See `.tdd/test-designs.md` for detailed test specifications.

---

## Step 8: Implementation Order

1. **Create `SkillListItem` component** (extracted from `renderSkillListItems`)
2. **Modify `SkillPriorityList` filtering logic**
3. **Update rendering to use new component**
4. **Remove `start` attribute from collapsed `<ol>`**
5. **Run existing tests** - verify no regressions
6. **Add new tests** per test designs
7. **Verify file line count** - if >400, create follow-up task for extraction

---

## Decision Log

### Decision: Keep `SkillPriorityList` in `RuleEvaluations.tsx`

**Context**: File is at 444 lines, over 400-line limit. Considered extraction.

**Decision**: Proceed with inline implementation, evaluate extraction separately.

**Rationale**:

- Changes are focused on logic, not adding new features
- Extraction is orthogonal to the behavior change
- Extracting now conflates two concerns (behavior + organization)
- Post-implementation line count can determine if extraction is needed

**Consequences**:

- File may remain over 400 lines
- Follow-up task may be needed for extraction
- Behavior change is isolated and testable

---

## Files to Modify

1. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`
   - Modify `SkillPriorityList` function (lines 120-168)
   - Modify `renderSkillListItems` function (lines 206-233) - convert to component

2. `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
   - Add new tests for status-based grouping
   - Verify existing tests still pass

---

## Handoff Notes

1. **No new ADRs required** - this is a UI enhancement within existing patterns
2. **Collapsible Section Pattern** already documented in `.docs/patterns/index.md`
3. **File size constraint** remains a concern - recommend evaluation after implementation
4. **Test designs** provided in `.tdd/test-designs.md`
