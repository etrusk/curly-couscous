# Selector Evaluation Test Design v2

## Revision Summary

This document revises the original test design based on human feedback addressing:
- Dead evaluator behavior (design decision required)
- Evaluator-in-array assumptions
- Missing edge cases
- Tie-breaking test clarity
- Metric independence verification
- Parameterized test consolidation

---

## Design Decision: Dead Evaluator Behavior

**Recommendation: Option A — Document as Undefined Behavior (Caller's Responsibility)**

**Rationale:**
1. Per spec Section 4.2, dead characters (HP ≤ 0) are removed in the Resolution Phase before the next Decision Phase
2. In normal game flow, the engine never evaluates selectors for dead characters
3. This aligns with the "pure engine" philosophy — the engine expects valid game states, not defensive programming against impossible states
4. Simpler implementation without runtime overhead for impossible cases

**Documented Precondition:**
> `evaluateSelector()` assumes the evaluator is alive (HP > 0). Calling with a dead evaluator produces undefined behavior. Callers must filter dead characters before selector evaluation.

---

## Tie-Breaking Rules Documentation

**IMPORTANT DISTINCTION:**

| Section | Context | Tie-Breaking Rule |
|---------|---------|-------------------|
| **Section 2.2** | Movement collision (pathfinding) | 1. Prefer horizontal (lower X diff) → 2. Vertical (lower Y diff) → 3. Lower Y → 4. Lower X |
| **Section 6.2** | Selector targeting (target selection) | 1. Lower Y coordinate → 2. Lower X coordinate |

These tests verify **Section 6.2 (Selector Tie-Breaking)** only. Movement tie-breaking is tested separately in the movement module.

---

## Proposed Tests for `evaluateSelector()`

### Test File: `src/engine/__tests__/selectors.test.ts`

### Section 1: `self` Selector

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 1 | `should return evaluator for self selector` | Given evaluator at (5,5), returns evaluator | Basic self-targeting functionality |
| 2 | `should return evaluator regardless of other characters` | Evaluator at (3,3) with 2 enemies nearby, returns evaluator | Confirms `self` ignores all other characters |

**Precondition Note:** Tests assume evaluator is alive (HP > 0) per design decision above.

---

### Section 2: `nearest_enemy` Selector

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 3 | `should return closest enemy by Chebyshev distance` | Evaluator (friendly) at (5,5); Enemy A at (5,7) dist=2, Enemy B at (8,5) dist=3 → returns Enemy A | Basic nearest selection |
| 4 | `should ignore allies when selecting nearest enemy` | Evaluator at (5,5); Ally at (5,6) dist=1, Enemy at (5,8) dist=3 → returns Enemy | Faction filtering |
| 5 | `should handle diagonal distances correctly (Chebyshev)` | Evaluator at (5,5); Enemy A at (7,7) dist=2, Enemy B at (5,8) dist=3 → returns Enemy A | Chebyshev treats diagonals as distance 1 |
| 6 | `should return null when no enemies exist` | Evaluator (friendly) with only allies → returns null | No valid targets case |

---

### Section 3: `nearest_ally` Selector

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 7 | `should return closest ally by Chebyshev distance` | Evaluator (friendly) at (5,5); Ally A at (5,7) dist=2, Ally B at (8,5) dist=3 → returns Ally A | Basic nearest ally selection |
| 8 | `should exclude self from ally selection` | Evaluator at (5,5); only character is evaluator → returns null | Self is not a valid "ally" target for nearest_ally |
| 9 | `should ignore enemies when selecting nearest ally` | Evaluator at (5,5); Enemy at (5,6) dist=1, Ally at (5,8) dist=3 → returns Ally | Faction filtering |
| 10 | `should return null when only evaluator exists (no other allies)` | Evaluator alone → returns null | Edge case: evaluator is only friendly |

**Note for #8 and #10:** These tests document the behavior that evaluator must be present in allCharacters array. The function filters out evaluator from ally candidates. If evaluator is not in the array, behavior is undefined.

---

### Section 4: `lowest_hp_enemy` Selector

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 11 | `should return enemy with lowest current HP` | Enemy A (75 HP), Enemy B (50 HP), Enemy C (90 HP) → returns Enemy B | Basic HP-based selection |
| 12 | `should ignore allies when selecting lowest HP enemy` | Ally at 10 HP, Enemy at 50 HP → returns Enemy | Faction filtering even when ally is lower |
| 13 | `should return null when no enemies exist` | Only allies present → returns null | No valid targets case |

---

### Section 5: `lowest_hp_ally` Selector

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 14 | `should return ally with lowest current HP` | Ally A (75 HP), Ally B (50 HP), Ally C (90 HP) → returns Ally B | Basic HP-based selection |
| 15 | `should exclude self from lowest HP ally selection` | Evaluator at 10 HP, Ally at 50 HP → returns Ally (not self) | Self is excluded even if lowest |
| 16 | `should ignore enemies when selecting lowest HP ally` | Enemy at 10 HP, Ally at 50 HP → returns Ally | Faction filtering |

---

### Section 6: Selector Tie-Breaking (Section 6.2)

**Per spec Section 6.2:** When multiple characters satisfy a selector, tie-break by:
1. Lower Y coordinate
2. Then lower X coordinate

**All tests in this section explicitly state evaluator position and distances.**

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 17 | `nearest_enemy: should prefer lower Y when distances equal` | Evaluator at **(5,5)**; Enemy A at (6,4) **dist=1**, Enemy B at (4,6) **dist=1** → returns Enemy A (Y=4 < Y=6) | Primary tie-breaker: lower Y |
| 18 | `nearest_enemy: should prefer lower X when Y and distances equal` | Evaluator at **(5,5)**; Enemy A at (4,5) **dist=1**, Enemy B at (6,5) **dist=1** → returns Enemy A (X=4 < X=6) | Secondary tie-breaker: lower X (same Y) |
| 19 | `lowest_hp_enemy: should prefer lower Y when HP equal` | Evaluator at **(5,5)**; Enemy A at (3,2) 50HP, Enemy B at (7,4) 50HP → returns Enemy A (Y=2 < Y=4) | HP tie → Y tie-breaker |
| 20 | `lowest_hp_enemy: should prefer lower X when HP and Y equal` | Evaluator at **(0,0)**; Enemy A at (2,3) 50HP, Enemy B at (5,3) 50HP → returns Enemy A (X=2 < X=5) | HP + Y tie → X tie-breaker |
| 21 | `nearest_enemy: three-way tie resolved correctly` | Evaluator at **(5,5)**; Enemy A at (5,4) **dist=1**, Enemy B at (6,5) **dist=1**, Enemy C at (4,5) **dist=1** → returns Enemy A (lowest Y=4; others Y=5) | Multiple candidates: Y wins |

---

### Section 7: Metric Independence

**Purpose:** Verify that `nearest_*` selectors ignore HP and `lowest_hp_*` selectors ignore distance.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 22 | `nearest_enemy: should select by distance regardless of HP values` | Evaluator at (5,5); Enemy A at (5,6) **dist=1** with **100 HP**, Enemy B at (5,9) **dist=4** with **10 HP** → returns Enemy A | Distance metric ignores HP entirely |
| 23 | `lowest_hp_enemy: should select by HP regardless of distance` | Evaluator at (5,5); Enemy A at (5,6) **dist=1** with **100 HP**, Enemy B at (5,9) **dist=4** with **10 HP** → returns Enemy B | HP metric ignores distance entirely |

---

### Section 8: Edge Cases

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 24 | `should return null for any selector when allCharacters is empty` | Empty array, any selector → returns null | Graceful handling of empty state |
| 25 | `should handle evaluator at distance 0 from themselves` | Evaluator at (5,5), selector is nearest_enemy, only evaluator exists → returns null (not self) | Degenerate distance calculation doesn't cause issues |
| 26 | `should handle all characters at same position as evaluator (distance 0)` | Evaluator and enemies all at (5,5) — invalid state but shouldn't crash → returns one of them via tie-break | Defensive against degenerate state |

---

### Section 9: Parameterized "No Valid Targets" Tests

**Consolidation:** Tests #6, #13, #24 all verify "returns null when no valid targets" behavior. Consider using `describe.each`:

```typescript
describe.each([
  ['nearest_enemy', { type: 'nearest_enemy' }, 'friendly', []],
  ['nearest_ally', { type: 'nearest_ally' }, 'friendly', []],
  ['lowest_hp_enemy', { type: 'lowest_hp_enemy' }, 'friendly', []],
  ['lowest_hp_ally', { type: 'lowest_hp_ally' }, 'friendly', []],
])('%s selector with no valid targets', (name, selector, evalFaction, otherChars) => {
  it('should return null when no valid targets exist', () => {
    // Test implementation
  });
});
```

**Justification:** Reduces test boilerplate while maintaining coverage. Individual tests (#6, #13) still exist for documentation clarity; parameterized version catches regressions systematically.

---

## Coverage Analysis

### Happy Path
- Tests #1-2 (self), #3 (nearest_enemy), #7 (nearest_ally), #11 (lowest_hp_enemy), #14 (lowest_hp_ally)

### Edge Cases
- Empty array: #24
- Self-exclusion: #8, #10, #15
- Distance 0 scenarios: #25, #26

### Error Handling
- No valid targets: #6, #13, #24 (consolidated in Section 9)
- Faction filtering: #4, #5, #9, #12, #16

### Tie-Breaking
- All Section 6.2 rules: #17-21

### Metric Independence
- Distance vs HP: #22, #23

---

## Not Testing (and Why)

| Item | Rationale |
|------|-----------|
| Dead evaluator (HP ≤ 0) | Documented as undefined behavior per design decision (caller's responsibility) |
| Evaluator not in allCharacters array | Documented as precondition (caller's responsibility) |
| Invalid selector types | TypeScript ensures only valid selector types at compile time |
| Negative HP values | Character creation validates HP ≥ 0 |
| Out-of-bounds positions | Position validation is handled at character creation |
| Movement tie-breaking (Section 2.2) | Tested separately in movement module |

---

## Preconditions (Documented)

The following are **caller responsibilities**, not validated by `evaluateSelector()`:

1. **Evaluator is alive (HP > 0)** — Dead characters are removed from game state before evaluation
2. **Evaluator exists in allCharacters array** — The evaluator must be part of the provided character list
3. **All characters have valid positions** — Positions are within 12×12 grid bounds

---

## Summary of Changes from v1

| Change Type | Description |
|-------------|-------------|
| **[Design Decision]** | Dead evaluator behavior: Option A (undefined behavior, caller responsibility) |
| **[Documentation]** | Added Section 2.2 vs 6.2 tie-breaking distinction |
| **[Added]** | Test #22: nearest_enemy metric independence (ignores HP) |
| **[Added]** | Test #23: lowest_hp_enemy metric independence (ignores distance) |
| **[Added]** | Test #24: Empty allCharacters array handling |
| **[Added]** | Test #25: Distance 0 from self handling |
| **[Added]** | Test #26: All characters at distance 0 (degenerate state) |
| **[Modified]** | Tests #17-21: Explicit evaluator positions and distances in descriptions |
| **[Modified]** | Test #2 justification: Removed "living check not needed" — now simply tests self returns evaluator |
| **[Modified]** | Tests #8, #10: Added note documenting evaluator-in-array assumption |
| **[Added]** | Section 9: Parameterized test pattern for null-return consolidation |
| **[Added]** | Preconditions section documenting caller responsibilities |

---

**Awaiting approval to proceed with test implementation.**
