# Review Findings: Plural Target Scopes (`enemies` / `allies`)

## Quality Gates

- Tests: PASS (1495/1495)
- TypeScript: PASS
- ESLint: PASS

## Acceptance Criteria: All 13 ACs Satisfied

AC 1-13 verified against implementation. No gaps found.

## CRITICAL Issues

None.

## IMPORTANT Issues

None.

## MINOR (Non-Blocking)

### M-1: Towards-mode obstacle set not built for plural targets

`computePluralMoveDestination` only builds the obstacle set for away mode (line 194-195). For towards mode, `obstacles` is `undefined`, so `escapeRoutes` defaults to 6 for all candidates. This is correct because `compareTowardsMode` never uses escape routes in its scoring hierarchy. However, the plan text says "Build obstacle set excluding mover and ALL targets (per Lesson 002)" without qualifying by mode. A clarifying comment at line 194 would prevent future confusion.

### M-2: `evaluateSingleSkill` plural path omits `target` field

For plural targets, `evaluateSingleSkill` returns `{ skill, status: "selected" }` (line 273) with no `target` field. Singular selected results include `target: Character`. The plan acknowledges this (`target: null` or omit). This is fine for the engine scope but the UI tooltip code (`selectMovementTargetData`) should be checked when the UI task is picked up.

### M-3: `behavior` cast to `"towards" | "away"` without validation

In `createPluralMoveAction` (game-actions.ts lines 144, 150) and `createSkillAction` (lines 96, 104), `skill.behavior` is cast via `as "towards" | "away"`. If a skill with plural target has a non-movement behavior (e.g., empty string), the cast would pass TypeScript but produce undefined runtime behavior. The decision logic gates on `actionType !== "move"` which prevents this in practice, but the cast is still unsafe. This pre-exists the plural target work (same pattern in singular path) so it is not a regression.

## Compliance Checks

- **Pattern compliance**: All files under 400 lines (types.ts: 396, game-decisions.ts: 383, movement-scoring.ts: 274, game-movement.ts: 268). Extraction to `movement-scoring.ts` was well-executed.
- **Tiebreak preservation**: Existing `compareAwayMode` and `compareTowardsMode` used unchanged. Plural scoring constructs `CandidateScore` objects with aggregated distances, feeding into the same comparators.
- **Lesson 002**: All plural targets excluded from obstacle set via `excludeIds` spread (game-movement.ts line 193).
- **No regressions**: Existing singular movement, selector, and decision logic untouched. Re-exports maintain backward compatibility.
- **Test quality**: Tests verify meaningful behavioral properties (min-distance improvement, determinism, single-member parity, empty group safety, multi-step distance growth). Integration tests cover the full decision pipeline including rejection paths.
- **Spec alignment**: `Target` union extended; spec doc update deferred per scope boundaries (acceptable).

## Verdict

PASS -- no critical or important issues. Ready to commit.
