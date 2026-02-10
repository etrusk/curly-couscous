# Test Designs: Field Labels for SkillRow

> Designed: 2026-02-10
> Plan reference: `.tdd/plan.md` Step 3
> Target file: `src/components/CharacterPanel/SkillRow.test.tsx`

## Overview

Six tests verifying the DOM presence of stacked text labels above SkillRow control groups. These tests go inside a new `describe("Field Labels", ...)` block within the existing top-level `describe("SkillRow", ...)`.

All tests verify that label text is rendered in the document. They do NOT verify CSS styling (font-size, color, layout) -- those properties are verified in browser per the plan.

---

### Test: shows TRIGGER label in config mode

- **File**: `src/components/CharacterPanel/SkillRow.test.tsx`
- **Type**: unit
- **Verifies**: The text "TRIGGER" is rendered above the trigger scope dropdown when SkillRow is in config mode (no `evaluation` prop).
- **Setup**:
  - Create a skill with `createSkill({ id: "light-punch", name: "Light Punch" })` -- a standard attack skill with no special behavior.
  - Create a character with `createCharacter({ id: "char1", skills: [skill] })`.
  - Render `<SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />` -- no `evaluation` prop means config mode.
- **Assertions**:
  1. `expect(screen.getByText("TRIGGER")).toBeInTheDocument()` -- the uppercase label text is present in the DOM.
- **Justification**: Confirms the TRIGGER label renders for config mode. Without this test, a regression could remove the label text or misspell it, leaving users unable to identify the trigger control group. Maps directly to acceptance criterion: "A visible text label TRIGGER appears above the trigger scope dropdown in config mode."

---

### Test: shows TARGET label in config mode

- **File**: `src/components/CharacterPanel/SkillRow.test.tsx`
- **Type**: unit
- **Verifies**: The text "TARGET" is rendered above the target select dropdown when SkillRow is in config mode.
- **Setup**:
  - Create a skill with `createSkill({ id: "light-punch", name: "Light Punch" })`.
  - Create a character with `createCharacter({ id: "char1", skills: [skill] })`.
  - Render `<SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />`.
- **Assertions**:
  1. `expect(screen.getByText("TARGET")).toBeInTheDocument()` -- the uppercase label text is present in the DOM.
- **Justification**: Confirms the TARGET label renders for config mode. The target select (Enemy/Ally/Self) is visually identical to other selects without this label. Maps to acceptance criterion: "A visible text label TARGET appears above the target select in config mode."

---

### Test: shows SELECTOR label in config mode

- **File**: `src/components/CharacterPanel/SkillRow.test.tsx`
- **Type**: unit
- **Verifies**: The text "SELECTOR" is rendered above the criterion select dropdown when SkillRow is in config mode.
- **Setup**:
  - Create a skill with `createSkill({ id: "light-punch", name: "Light Punch" })`.
  - Create a character with `createCharacter({ id: "char1", skills: [skill] })`.
  - Render `<SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />`.
- **Assertions**:
  1. `expect(screen.getByText("SELECTOR")).toBeInTheDocument()` -- the uppercase label text is present in the DOM.
- **Justification**: Confirms the SELECTOR label renders for config mode. The criterion select (Nearest/Furthest/Lowest HP/Highest HP/Most Enemies Nearby) is the hardest dropdown to identify without a label since "criterion" is not a user-facing term. The label "SELECTOR" was chosen by human override. Maps to acceptance criterion: "A visible text label SELECTOR appears above the criterion select in config mode."

---

### Test: shows FILTER label in config mode

- **File**: `src/components/CharacterPanel/SkillRow.test.tsx`
- **Type**: unit
- **Verifies**: The text "FILTER" is rendered above the filter section when SkillRow is in config mode.
- **Setup**:
  - Create a skill with `createSkill({ id: "light-punch", name: "Light Punch" })` -- default has no filter, so the "+ Filter" ghost button renders beneath the label.
  - Create a character with `createCharacter({ id: "char1", skills: [skill] })`.
  - Render `<SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />`.
- **Assertions**:
  1. `expect(screen.getByText("FILTER")).toBeInTheDocument()` -- the uppercase label text is present in the DOM.
- **Justification**: Confirms the FILTER label renders for config mode. The filter section conditionally shows either an active filter (select + input + remove button) or a "+ Filter" ghost button. The label wraps both states. Maps to acceptance criterion: "A visible text label FILTER appears above the filter group in config mode."

**Note for coder**: The plan wraps the entire filter conditional (`skill.filter ? ... : ...`) inside the `.fieldGroup` div, so the "FILTER" label is always present regardless of whether a filter is active. This test uses a skill with no filter (the default), which renders the "+ Filter" button. A supplementary check with an active filter is not needed because the label is unconditional -- it is outside the ternary, not inside it.

---

### Test: shows all four labels in battle mode

- **File**: `src/components/CharacterPanel/SkillRow.test.tsx`
- **Type**: unit
- **Verifies**: All four labels ("TRIGGER", "TARGET", "SELECTOR", "FILTER") are present in the DOM when SkillRow is rendered in battle mode (with an `evaluation` prop).
- **Setup**:
  - Create a skill with `createSkill({ id: "light-punch", name: "Light Punch" })`.
  - Create a character with `createCharacter({ id: "char1", skills: [skill] })`.
  - Render with an evaluation prop to activate battle mode:
    ```tsx
    <SkillRow
      skill={skill}
      character={character}
      index={0}
      isFirst={false}
      isLast={false}
      evaluation={{ status: "selected", resolvedTarget: undefined }}
    />
    ```
  - The `evaluation` prop triggers `evalDisplay` to be non-null, which adds the `.battleMode` class to the row div.
- **Assertions**:
  1. `expect(screen.getByText("TRIGGER")).toBeInTheDocument()`
  2. `expect(screen.getByText("TARGET")).toBeInTheDocument()`
  3. `expect(screen.getByText("SELECTOR")).toBeInTheDocument()`
  4. `expect(screen.getByText("FILTER")).toBeInTheDocument()`
- **Justification**: Confirms labels persist in battle mode and are not conditionally hidden. The plan states labels appear in both config and battle modes. Battle mode triggers `.battleMode` class which changes sizing -- this test ensures the labels are still rendered (CSS scaling is verified in browser, not here). Maps to acceptance criterion: "Labels are present in both config mode and battle mode."

**Design note**: Using `evaluation={{ status: "selected", resolvedTarget: undefined }}` follows the existing pattern from the "D2: Battle Mode - Config Controls Visible" test (line 140-174 of the existing test file). This is the minimal evaluation prop that activates battle mode without needing a target character.

---

### Test: does not show label for behavior select

- **File**: `src/components/CharacterPanel/SkillRow.test.tsx`
- **Type**: unit
- **Verifies**: When a multi-behavior skill (Move) renders its behavior select dropdown, no "BEHAVIOR" label text appears in the DOM.
- **Setup**:
  - Create a Move skill with `createSkill({ id: "move-towards", name: "Move", behavior: "towards" })` -- uses the registry ID `move-towards` which has `behaviors: ["towards", "away"]` (2 behaviors, so the behavior `<select>` renders).
  - Create a character with `createCharacter({ id: "char1", skills: [skill] })`.
  - Render `<SkillRow skill={skill} character={character} index={0} isFirst={false} isLast={false} />`.
- **Assertions**:
  1. `expect(screen.getByLabelText(/behavior.*move/i)).toBeInTheDocument()` -- confirms the behavior select IS rendered (precondition: the select exists, proving the test is exercising the right code path).
  2. `expect(screen.queryByText("BEHAVIOR")).not.toBeInTheDocument()` -- confirms no "BEHAVIOR" label text exists anywhere in the DOM.
- **Justification**: The plan explicitly states "Behavior select does NOT get a label." This negative test prevents a well-intentioned developer from adding a fifth label. The precondition assertion (step 1) ensures the test is meaningful -- without it, the absence of "BEHAVIOR" text could be trivially true because the behavior select itself might not render. Maps to acceptance criterion: "Behavior select does NOT get a separate label."

---

## Query Strategy Notes

All label queries use `screen.getByText("LABEL")` with exact string matching (not regex). This is appropriate because:

1. The labels are uppercase static text ("TRIGGER", "TARGET", "SELECTOR", "FILTER") rendered via `textContent` of `<span>` elements.
2. Exact matching prevents false positives from aria-labels or option values that might contain these words in different casing (e.g., the aria-label "Trigger for Light Punch" would match `/trigger/i` but not `"TRIGGER"`).
3. The labels use `text-transform: uppercase` in CSS, but the JSX text content is already uppercase (`"TRIGGER"` not `"trigger"`), so the test matches the source text directly.

## Describe Block Structure

```
describe("SkillRow", () => {
  // ... existing describe blocks ...

  describe("Field Labels", () => {
    it("shows TRIGGER label in config mode")
    it("shows TARGET label in config mode")
    it("shows SELECTOR label in config mode")
    it("shows FILTER label in config mode")
    it("shows all four labels in battle mode")
    it("does not show label for behavior select")
  })
})
```

This block should be added after the existing "Remove Duplicate Button" describe block (after line 605 of the current file), keeping the file organized with field labels as the last describe block.

## Review Notes (added by reviewer)

### Shared setup advisory

Tests 1-4 share identical setup (same skill, character, and render call). The coder MAY extract a shared render helper or use a `beforeEach` to reduce boilerplate, following the pattern from the "Remove Duplicate Button" block (lines 514-527). This is optional -- the test designer's inline setup is also acceptable for clarity. If a helper is used, keep it scoped to the `describe("Field Labels", ...)` block.

### AC 10 coverage (aria-labels unchanged)

AC 10 states: "Labels have no impact on existing aria-label attributes (screen reader labels unchanged)." No dedicated test is needed because:

1. The implementation adds `<span>` elements (not `<label>` elements), so they do not participate in accessibility label resolution.
2. Existing tests already assert on aria-labels -- e.g., line 40-41 (`getByRole("combobox", { name: /trigger for light punch/i })`) and line 44 (`getByLabelText(/target/i)`). If the new labels broke aria-label resolution, these existing tests would fail.
3. Adding a redundant aria-label assertion to the new test block would duplicate existing coverage.

### No false positive risks identified

- `getByText("TARGET")` uses exact matching and will not match the aria-label `"Target for Light Punch"` (different casing, different element query type).
- `getByText("FILTER")` uses exact matching and will not match `"+ Filter"` button text (different string).
- `getByLabelText(/target/i)` in existing tests (line 44) queries aria-label attributes, not `<span>` text content, so the new "TARGET" span will not create a duplicate match.
- `"No valid target"` rejection reason (line 109) is a different string from "TARGET" under exact matching.
