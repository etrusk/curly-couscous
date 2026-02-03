# Fix Plan: 4 Test Failures from Heal Feature

## 1. Root Cause Analysis

### Issue 1: game-decisions-action-type-inference.test.ts (2 tests)

- **File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-action-type-inference.test.ts`
- **Lines**: 94-96, 116
- **Why it's failing**: The error messages in `getActionType()` (game-actions.ts L25, L29) were updated to include "healing" as a valid option. Test regexes still match old messages.
- **What changed**: `getActionType()` now validates three properties (damage, healing, mode) instead of two. Error messages changed from "must have damage or mode" to "must have damage, healing, or mode" and from "cannot have both damage and mode" to "can only have one of damage, healing, or mode".
- **What tests should assert**: The new error messages.

### Issue 2: IntentOverlay-offset-basic.test.tsx (1 test, 2 assertions)

- **File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-offset-basic.test.tsx`
- **Lines**: 236, 240
- **Why it's failing**: The test asserts `var(--faction-friendly)` and `var(--faction-enemy)` but the color system was refactored from faction-based to action-based. Both characters have `type: "attack"` actions.
- **What changed**: `IntentLine.tsx` now uses `getActionColor(type)` returning `var(--action-attack)` for attacks instead of `var(--faction-friendly)` / `var(--faction-enemy)`.
- **What tests should assert**: Both lines should have `var(--action-attack)` since both characters have attack actions, regardless of faction.

### Issue 3: IntentOverlay-subscription.test.tsx (1 test)

- **File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-subscription.test.tsx`
- **Lines**: 76-78
- **Why it's failing**: The test uses `addCharacter()` which creates characters with only the Move (innate) skill. Characters at adjacent positions (0,0) and (1,0) with only Move skill will generate move actions, not attack actions. The test asserts `var(--action-attack)` but should assert `var(--action-move)`.
- **What changed**: Characters created via `addCharacter()` get `DEFAULT_SKILLS` = `getDefaultSkills()` which only returns innate skills (Move Towards). Before the color refactor this was masked because faction colors were the same regardless of action type.
- **What tests should assert**: `var(--action-move)` since both characters only have Move skill and will generate move actions.

### Issue 4: InventoryPanel.test.tsx (2 tests)

- **File**: `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.test.tsx`
- **Lines**: 111, 152
- **Why it's failing**:
  - Line 111: `screen.getByText(/tick cost: 0/i)` now matches TWO elements -- Light Punch stats ("Tick Cost: 0 | Range: 1 | Damage: 10") AND Heal stats ("Tick Cost: 0 | Range: 5 | Healing: 25"). `getByText` throws when multiple matches found.
  - Line 152: `screen.getByText(new RegExp(skill.name, "i"))` for skill "Heal" matches both `<h3>Heal</h3>` AND the stats div containing "Healing: 25". The regex `/Heal/i` is a substring match that hits "Healing" too.
- **What changed**: Adding Heal to SKILL_REGISTRY introduced a third non-innate skill with tickCost: 0, and the name "Heal" is a substring of "Healing" in the stats.
- **What tests should assert**:
  - Line 111: Use `getAllByText` and check length, or use a more specific query scoped to a particular skill.
  - Line 152: Use exact text match or `getByRole('heading', { name })` to target only the `<h3>` elements.

---

## 2. Fix Plan

### Fix 1: game-decisions-action-type-inference.test.ts

**File**: `/home/bob/Projects/auto-battler/src/engine/game-decisions-action-type-inference.test.ts`

**Change A - Line 95**:

```
Old: /cannot have both damage and mode/,
New: /can only have one of damage, healing, or mode/,
```

**Change B - Line 116**:

```
Old: expect(() => computeDecisions(state)).toThrow(/must have damage or mode/);
New: expect(() => computeDecisions(state)).toThrow(/must have damage, healing, or mode/);
```

**Explanation**: Regex patterns updated to match the new error messages from `getActionType()` in game-actions.ts.

---

### Fix 2: IntentOverlay-offset-basic.test.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-offset-basic.test.tsx`

**Change A - Lines 234-236**:

```
Old:
    // Friendly line (char-a) should have faction-friendly color
    const friendlyLine = lines[1];
    expect(friendlyLine).toHaveAttribute("stroke", "var(--faction-friendly)");

New:
    // Friendly line (char-a) should have action-attack color
    const friendlyLine = lines[1];
    expect(friendlyLine).toHaveAttribute("stroke", "var(--action-attack)");
```

**Change B - Lines 238-240**:

```
Old:
    // Enemy line (char-b) should have faction-enemy color
    const enemyLine = lines[3];
    expect(enemyLine).toHaveAttribute("stroke", "var(--faction-enemy)");

New:
    // Enemy line (char-b) should have action-attack color
    const enemyLine = lines[3];
    expect(enemyLine).toHaveAttribute("stroke", "var(--action-attack)");
```

**Explanation**: Both characters have `type: "attack"` actions. The color system is now action-based, so both should use `var(--action-attack)` regardless of faction.

---

### Fix 3: IntentOverlay-subscription.test.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay-subscription.test.tsx`

**Change - Lines 76-78**:

```
Old:
      // Both attack lines should use action-attack color (same for both factions)
      expect(mainLine1).toHaveAttribute("stroke", "var(--action-attack)");
      expect(mainLine2).toHaveAttribute("stroke", "var(--action-attack)");

New:
      // Both lines should use action-move color (addCharacter only assigns innate Move skill)
      expect(mainLine1).toHaveAttribute("stroke", "var(--action-move)");
      expect(mainLine2).toHaveAttribute("stroke", "var(--action-move)");
```

**Explanation**: `addCharacter()` creates characters with only innate skills (Move Towards). Adjacent characters with only Move skill generate move actions, not attack actions. The test name "intent-lines-appear-for-attack-with-addCharacter" is misleading but renaming is not strictly required for the fix -- the test still validates that intent lines appear when using `addCharacter`. However, the comment and test name should ideally be updated for clarity.

**Optional improvement** - also update the test name and the line count comment at line 67:

Line 58:

```
Old: it("intent-lines-appear-for-attack-with-addCharacter", async () => {
New: it("intent-lines-appear-for-move-with-addCharacter", async () => {
```

Line 67:

```
Old: // Should have 4 lines (2 characters x 2 lines each)
New: // Should have 4 lines (2 characters x 2 lines each for movement)
```

---

### Fix 4: InventoryPanel.test.tsx

**File**: `/home/bob/Projects/auto-battler/src/components/InventoryPanel/InventoryPanel.test.tsx`

**Change A - Lines 110-111** (tick cost test):

```
Old:
      // One skill has tick cost 0 (Light Punch)
      expect(screen.getByText(/tick cost: 0/i)).toBeInTheDocument();

New:
      // Two skills have tick cost 0 (Light Punch and Heal)
      const tickCost0Elements = screen.getAllByText(/tick cost: 0/i);
      expect(tickCost0Elements.length).toBe(2);
```

**Change B - Lines 150-153** (registry skill names test):

```
Old:
      SKILL_REGISTRY.filter((s) => !s.innate).forEach((skill) => {
        expect(
          screen.getByText(new RegExp(skill.name, "i")),
        ).toBeInTheDocument();
      });

New:
      SKILL_REGISTRY.filter((s) => !s.innate).forEach((skill) => {
        expect(
          screen.getByRole("heading", { name: new RegExp(skill.name, "i") }),
        ).toBeInTheDocument();
      });
```

**Explanation for Change A**: With Heal added to the registry, there are now two skills with `tickCost: 0` (Light Punch and Heal). Using `getAllByText` and checking the count is appropriate since the test verifies tick cost display, not a specific skill.

**Explanation for Change B**: Using `getByRole("heading")` targets only `<h3>` elements. The skill name "Heal" rendered in `<h3>Heal</h3>` is an `h3` heading, so `getByRole("heading", { name: /Heal/i })` will match exactly one element. The stats div containing "Healing: 25" is a regular `div`, not a heading, so it won't be matched.

---

## 3. Patterns to Follow

- **Error message regex tests**: Match the exact error text from implementation. The regex should be specific enough to fail if the message changes unexpectedly.
- **Color assertions**: Use `var(--action-TYPE)` pattern consistently. No more `var(--faction-*)` colors in intent line tests.
- **Testing Library queries**: Prefer `getByRole` over `getByText` when elements have semantic roles (headings, buttons, etc.). When multiple matches are expected, use `getAllByText` and verify count.
- **Test naming**: Test names should accurately describe what is being tested. Update if the test behavior changes.

## 4. Potential Risks

- **Fix 1 (error messages)**: Zero risk. Regex patterns directly match implementation strings.
- **Fix 2 (offset-basic colors)**: Zero risk. Both characters have explicit `type: "attack"` in their `currentAction`. The action type is deterministic.
- **Fix 3 (subscription colors)**: Low risk. Need to verify that adjacent Move-only characters actually produce move intent lines (not idle). The existing test at lines 82-113 ("intent-lines-appear-for-movement-when-characters-far-apart") already validates `var(--action-move)` for movement lines using `addCharacterAtPosition`, confirming the pattern works.
- **Fix 4 (InventoryPanel)**: Low risk.
  - Change A: `getAllByText` count of 2 assumes exactly two skills with tickCost: 0 in the registry. If a future skill is added with tickCost: 0, this test would need updating. This is acceptable -- the test validates that tick costs are displayed.
  - Change B: `getByRole("heading")` assumes skill names are rendered in heading elements. This is structurally sound since `InventoryPanel.tsx` uses `<h3>{skill.name}</h3>` (line 52).
- **No cross-dependencies**: All four fixes are independent. They can be applied in any order.
