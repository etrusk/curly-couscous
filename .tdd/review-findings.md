# Review Findings: Skill Expansion Phases 4+5+6

**Reviewer:** review agent | **Date:** 2026-02-08 | **Verdict:** PASS

## Summary

Implementation of Ranged Attack, distance/Dash, and most_enemies_nearby is clean, well-structured, and spec-compliant. No CRITICAL issues found. Two MINOR observations documented below.

## Checklist Results

| Check              | Status | Notes                                                            |
| ------------------ | ------ | ---------------------------------------------------------------- |
| Spec compliance    | PASS   | All 25 acceptance criteria satisfied                             |
| Pattern compliance | PASS   | Exhaustive switch, registry pattern, test helpers                |
| Type safety        | PASS   | Exhaustive switch guard in selectors.ts, proper union extensions |
| Edge cases         | PASS   | Null/empty handled, partial movement, blocked movement           |
| Test quality       | PASS   | 35 tests with meaningful assertions, proper isolation            |
| File limits        | PASS   | All files under 400 lines (max: SkillsPanel.tsx at 369)          |
| No regressions     | PASS   | Existing callers unaffected; distance defaults to 1              |
| Security           | PASS   | No injection risks, all inputs validated by type system          |

## MINOR Issues

### M1: Performance -- enemy count recalculated per comparison in most_enemies_nearby

**File:** `/home/bob/Projects/auto-battler/src/engine/selectors.ts` (lines 140-159)

The `findMinimum` comparator recalculates enemy-nearby counts for both `a` and `b` on every comparison. With N candidates and E enemies, this is O(N _ E) per `reduce` pass, giving O(N^2 _ E) worst case. With small battle sizes (typically <10 characters) this is negligible, but if battles scale up, pre-computing counts in a Map would be more efficient.

**Recommendation:** Consider fixing only if battles grow beyond ~20 characters. Current implementation is correct and clear.

### M2: Redundant cast of `MOST_ENEMIES_NEARBY` in test file

**File:** `/home/bob/Projects/auto-battler/src/engine/selectors-most-enemies-nearby.test.ts` (line 14)

```typescript
const MOST_ENEMIES_NEARBY = "most_enemies_nearby" as Criterion;
```

This cast was needed during the red-phase before the type was extended. Now that `most_enemies_nearby` is in the `Criterion` union, the cast is unnecessary. Purely cosmetic -- no functional impact.

## Positive Observations

1. **Multi-step wrapping pattern** is well-designed: `computeMultiStepDestination` wraps `computeMoveDestination` iteratively without modifying the original function, preserving backward compatibility.

2. **Self-exclusion in most_enemies_nearby** (`e.id !== a.id`) correctly prevents enemy candidates from counting themselves, which would inflate all counts equally and make the criterion meaningless.

3. **distance propagation** uses conditional spread (`...(def.distance !== undefined ? { distance: def.distance } : {})`) consistent with the existing `damage` and `healing` patterns.

4. **Test coverage** includes both boundary conditions (fully blocked, partially blocked, single candidate, no candidates) and integration tests through `createSkillAction`.

5. **UI dropdowns** updated in both `SkillRow.tsx` (active) and `SkillsPanel.tsx` (legacy) for completeness.
