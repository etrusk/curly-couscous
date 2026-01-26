# Test Designs: Skill Priority Sub-panel UI Enhancement

## Overview

These tests verify the new status-based skill grouping in `SkillPriorityList`. Tests should be added to `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`.

---

## Existing Tests to Verify (No Changes Expected)

### Test 12: Skill Priority List with Indices

- **Status**: Should pass unchanged
- **Reason**: Indices are preserved in new implementation

### Test 13: Disabled Skills Indicator

- **Status**: Should pass unchanged
- **Reason**: Rejection reason display unchanged

### Test 14: No Target Rejection Reason

- **Status**: Should pass unchanged
- **Reason**: Rejection reason display unchanged

### Test 17: Collapsible Section for Skills Below Active

- **Status**: Should pass unchanged
- **Reason**: Move and Heavy Punch are `skipped`, still appear in collapsible

### Test 18: No Collapsible When Last Skill Active

- **Status**: Should pass unchanged
- **Reason**: When Heavy Punch selected, Light Punch and Move are `rejected`, no `skipped` skills

### Test 23: Out of Range Rejection

- **Status**: Should pass unchanged
- **Reason**: Rejection reason display unchanged

---

## New Tests

### Test: rejected-skills-always-visible

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- **Type**: integration
- **Verifies**: Rejected skills appear in primary section even when a later skill is selected
- **Setup**:
  ```typescript
  // Skills configuration:
  // - Skill 1: enabled, trigger fails -> rejected (trigger_failed)
  // - Skill 2: enabled, trigger fails -> rejected (trigger_failed)
  // - Skill 3: enabled, trigger succeeds, in range -> selected
  const skills: Skill[] = [
    {
      id: "skill-1",
      name: "Skill One",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "hp_below", value: 50 }], // Will fail at 100 HP
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "skill-2",
      name: "Skill Two",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "hp_below", value: 50 }], // Will fail at 100 HP
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "skill-3",
      name: "Skill Three",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }], // Will succeed
      selectorOverride: { type: "nearest_enemy" },
    },
  ];
  // Character at (0,0), enemy at (1,0) - within range
  ```
- **Assertions**:
  1. "1. Skill One" is visible in the document (rejected, primary section)
  2. "2. Skill Two" is visible in the document (rejected, primary section)
  3. "3. Skill Three" is visible with selected arrow (selected, primary section)
  4. No `<details>` element exists (no skipped skills)
- **Justification**: Validates core behavior change - rejected skills must always be visible to explain why they were not chosen

---

### Test: skipped-skills-in-expandable-section

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- **Type**: integration
- **Verifies**: Skills after the selected skill (status: skipped) appear in expandable section
- **Setup**:
  ```typescript
  // Use default test character with enemy in range
  // - Light Punch: selected (enemy in range)
  // - Move: skipped
  // - Heavy Punch: skipped (disabled doesn't matter, skipped takes precedence)
  const character = createCharacter();
  const target = createTarget(); // Enemy at (1,0)
  ```
- **Assertions**:
  1. "1. Light Punch" is visible with selected arrow (not inside details)
  2. `<details>` element exists
  3. Summary text says "Show 2 more skills"
  4. When details expanded, "2. Move" is visible
  5. When details expanded, "3. Heavy Punch" is visible
- **Justification**: Validates that skipped skills (not evaluated because higher priority matched) are properly collapsed

---

### Test: original-indices-preserved

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- **Type**: integration
- **Verifies**: Skills display their original priority index (1-based) regardless of which section they appear in
- **Setup**:
  ```typescript
  // Skills where middle skill is rejected:
  // - Skill A: selected (index 0, displays as "1.")
  // - Skill B: skipped (index 1, displays as "2." in expandable)
  // - Skill C: skipped (index 2, displays as "3." in expandable)
  const skills: Skill[] = [
    {
      id: "skill-a",
      name: "Alpha Strike",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "skill-b",
      name: "Beta Move",
      tickCost: 1,
      range: 0,
      mode: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "skill-c",
      name: "Gamma Blast",
      tickCost: 2,
      range: 2,
      damage: 25,
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
  ];
  const character = createCharacter({ skills });
  const target = createTarget();
  ```
- **Assertions**:
  1. Primary section contains "1. Alpha Strike" (selected)
  2. Expandable section contains "2. Beta Move" (skipped)
  3. Expandable section contains "3. Gamma Blast" (skipped)
  4. Numbers are sequential 1, 2, 3 despite being in different sections
- **Justification**: Users rely on index numbers to identify skills in their priority list; changing numbers would cause confusion

---

### Test: all-skills-rejected-no-expandable

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- **Type**: integration
- **Verifies**: When all skills are rejected (idle state), all appear in primary section with no expandable
- **Setup**:
  ```typescript
  // All skills fail - no enemies, so all attack skills have "no target"
  // Move disabled
  const skills: Skill[] = [
    {
      id: "light-punch",
      name: "Light Punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "move",
      name: "Move",
      tickCost: 1,
      range: 0,
      mode: "towards",
      enabled: false, // Disabled
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "heavy-punch",
      name: "Heavy Punch",
      tickCost: 2,
      range: 2,
      damage: 25,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 2 }],
      selectorOverride: { type: "nearest_enemy" },
    },
  ];
  const character = createCharacter({ skills });
  // NO enemy - all attack skills will have "no target"
  ```
- **Assertions**:
  1. "1. Light Punch" visible with "no target" rejection
  2. "2. Move" visible with "[disabled]" rejection
  3. "3. Heavy Punch" visible with "no target" rejection
  4. No `<details>` element (no skipped skills when idle)
  5. No selected arrow on any skill (selectedSkillIndex is null)
- **Justification**: Edge case where AI cannot act; all rejection reasons should be visible for debugging

---

### Test: mixed-rejection-reasons-displayed

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- **Type**: integration
- **Verifies**: Multiple rejection reasons are correctly displayed for rejected skills
- **Setup**:
  ```typescript
  // Skills with different rejection reasons:
  // - Skill 1: disabled -> "[disabled]"
  // - Skill 2: trigger fails -> "trigger not met"
  // - Skill 3: out of range -> "target out of range (X > Y)"
  // - Skill 4: selected (Move with always trigger)
  const skills: Skill[] = [
    {
      id: "disabled-skill",
      name: "Disabled Skill",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: false,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "trigger-fail",
      name: "Trigger Fail Skill",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "hp_below", value: 10 }], // 100 HP, will fail
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "out-of-range",
      name: "Out of Range Skill",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "move",
      name: "Move",
      tickCost: 1,
      range: 0,
      mode: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
  ];
  // Character at (0,0), enemy at (5,5) - out of range for skills with range 1
  const character = createCharacter({ skills, position: { x: 0, y: 0 } });
  const enemy = createCharacter({
    id: "enemy",
    name: "Enemy",
    faction: "enemy",
    position: { x: 5, y: 5 },
    skills: [],
  });
  ```
- **Assertions**:
  1. "1. Disabled Skill" shows "[disabled]"
  2. "2. Trigger Fail Skill" shows "trigger not met"
  3. "3. Out of Range Skill" shows "target out of range (5 > 1)"
  4. "4. Move" shows selected arrow (no rejection reason)
  5. No `<details>` element (no skipped skills)
- **Justification**: Validates that all rejection reason types are properly displayed when multiple rejections occur

---

### Test: single-skill-no-expandable

- **File**: `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- **Type**: unit
- **Verifies**: When character has only one skill, no expandable section appears
- **Setup**:
  ```typescript
  const skills: Skill[] = [
    {
      id: "only-skill",
      name: "Only Skill",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
  ];
  const character = createCharacter({ skills });
  const target = createTarget();
  ```
- **Assertions**:
  1. "1. Only Skill" is visible with selected arrow
  2. No `<details>` element
- **Justification**: Edge case - ensures no empty expandable section when there's nothing to expand

---

## Test Implementation Order

1. Run existing tests first - verify no regressions
2. `rejected-skills-always-visible` - validates core behavior change
3. `skipped-skills-in-expandable-section` - validates expandable section works correctly
4. `original-indices-preserved` - validates index numbering
5. `all-skills-rejected-no-expandable` - validates idle state edge case
6. `mixed-rejection-reasons-displayed` - validates multiple rejection types
7. `single-skill-no-expandable` - validates minimal edge case
