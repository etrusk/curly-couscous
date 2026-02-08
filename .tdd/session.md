# TDD Session

## Task

Skill Expansion Session C — Phases 7+8: Kick (Interrupt) + Charge

## Confirmed Scope

Add interrupt action type with Kick skill (Phase 7) and charge action type with Charge skill (Phase 8). This includes new action types in type unions, new resolution phases in tick processing (Healing → Interrupts → Charges → Movement → Combat), new event types (InterruptEvent, InterruptMissEvent, ChargeEvent), new engine modules (interrupt.ts, charge.ts), and skill registry entries. Charge reuses multi-step movement from Dash (Phase 5).

## Acceptance Criteria

### Phase 7: Kick (Interrupt)

- Kick cancels target's currentAction when target is channeling
- Cancelled action's cooldown is NOT reset (already committed)
- Kick against idle target generates `interrupt_miss` event and wastes cooldown
- Kick against empty cell generates `interrupt_miss` event
- Kick is instant (tickCost 0)
- Kick resolves before movement and combat (interrupted actions don't resolve)
- Kick shows intent line for 1 tick per ADR-002
- Cooldown 4 applied after use
- Filter `channeling` correctly prevents wasting Kick on idle targets

### Phase 8: Charge

- Charge moves toward target up to 3 hexes, then attacks if adjacent after movement
- Collision rules apply per movement step (blocker-wins)
- If movement fully blocked, attack only hits if already adjacent
- Charge is dodgeable: tickCost 1, intent line visible for 1 tick
- Charge is interruptible: Kick resolves before Charge
- Charge damage (20) applied in charge resolution phase, separate from regular combat
- Cooldown 3 applied after use
- Character that takes Charge damage can also take regular attack damage same tick
- Charge resolves before regular movement (charger arrives before dodge-movers)

## Current Phase

EXPLORE (COMPLETE) -> PLAN (COMPLETE) -> DESIGN_TESTS (COMPLETE) -> TEST_DESIGN_REVIEW (COMPLETE) -> WRITE_TESTS (COMPLETE) -> IMPLEMENT (COMPLETE) -> REVIEW (COMPLETE) -> SYNC_DOCS (COMPLETE)

## Phase History

- 2026-02-08 INIT → EXPLORE
- 2026-02-08 EXPLORE COMPLETE (agent 1: 8 exchanges, ~28K tokens, 30 tool calls)
- 2026-02-08 PLAN COMPLETE (agent 2: 8 exchanges, ~35K tokens, 18 tool calls)
- 2026-02-08 DESIGN_TESTS COMPLETE (agent 3: 7 exchanges, ~38K tokens, 18 tool calls)
- 2026-02-08 TEST_DESIGN_REVIEW COMPLETE (agent 4: 5 exchanges, ~20K tokens, 12 tool calls)

## Context Metrics

Orchestrator: ~45K/300K (15%)
Cumulative agent tokens: ~307K
Agent invocations: 8
Compactions: 0

### Agent History

| #   | Agent   | Phase              | Exchanges | Tokens | Tools | Duration | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------- | ------------------ | --------- | ------ | ----- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Explore | EXPLORE            | 8         | ~28K   | 30    | -        | COMPLETE | Explored all 11 areas. Key findings: defaultTrigger/defaultFilter gap, RNG threading for charge, getActionType return type expansion, 6 engine files + 4 UI files + 2 new modules.                                                                                                                                                                                                                                                                                                                                                               |
| 2   | Plan    | PLAN               | 8         | ~35K   | 18    | -        | COMPLETE | 11-step plan. Resolved 7 open questions. Identified 5 risk areas (charge death detection, clearResolvedActions interaction, RNG threading, charge movement recomputation, charge targeting). Recommend ADR-018 for defaultTrigger/defaultFilter. ~33 tests estimated.                                                                                                                                                                                                                                                                            |
| 3   | Design  | DESIGN_TESTS       | 7         | ~38K   | 18    | -        | COMPLETE | 33 tests designed across 3 new files + 4 updates noted for existing files. 12 interrupt tests, 15 charge tests, 6 registry tests. Covers all 18 acceptance criteria.                                                                                                                                                                                                                                                                                                                                                                             |
| 4   | Review  | TEST_DESIGN_REVIEW | 5         | ~20K   | 12    | -        | COMPLETE | APPROVED with 3 test additions (full pipeline integration, charge-kill+combat, charge-ignores-non-charge). Fixed vague assertions in partial-movement test. Cleaned up confusing setup in charge-interruptible-by-kick. Total now 36 designed + 4 noted = 40 tests.                                                                                                                                                                                                                                                                              |
| 5   | Coder   | WRITE_TESTS        | 13        | ~45K   | 28    | -        | COMPLETE | Wrote 36 tests across 6 files (split for 400-line limit). All 35 new tests fail (RED), 1 channeling-filter test passes (pre-existing behavior). 1468 existing tests unaffected.                                                                                                                                                                                                                                                                                                                                                                  |
| 6   | Coder   | IMPLEMENT          | ~20       | ~100K  | ~50   | -        | COMPLETE | Implemented all 11 plan steps. Created interrupt.ts (90 lines), charge.ts (198 lines). Updated types.ts, skill-registry.ts, game-core.ts, game-actions.ts, game-decisions.ts, game.ts, movement.ts, IntentLine.tsx, IntentOverlay.tsx, rule-evaluations-formatters.ts. Fixed 3 existing test files for new skill counts. All 1504 tests pass (36 new + 1468 existing). Key challenge: charge movement required greedy algorithm instead of A\* pathfinding; full-pipeline test required movement blocker exclusion for already-resolved actions. |

### Action Log

- EXPLORE: Read types.ts, game-core.ts, combat.ts, healing.ts, movement.ts, skill-registry.ts, game-decisions.ts, game-movement.ts, game-actions.ts, triggers.ts, selector-filters.ts, IntentLine.tsx, IntentOverlay.tsx, CharacterTooltip.tsx, RuleEvaluations.tsx, rule-evaluations-formatters.ts, gameStore-selectors.ts, theme.css, useWhiffIndicators.ts, game-test-helpers.ts, requirements.md, skill-registry-new-skills.test.ts. Grep for all actionType/action.type references across codebase.
- PLAN: Read exploration.md, requirements.md, patterns/index.md, decisions/index.md, current-task.md, spec.md, architecture.md, types.ts, game-core.ts, skill-registry.ts, game-actions.ts, game-decisions.ts, healing.ts, combat.ts, game-test-helpers.ts, IntentLine.tsx, IntentOverlay.tsx, rule-evaluations-formatters.ts, game.ts, session.md. Wrote plan.md with 11 implementation steps.
- DESIGN_TESTS: Read plan.md, exploration.md, spec.md, patterns/index.md, requirements.md, session.md, game-test-helpers.ts, combat-test-helpers.ts, healing.test.ts, combat-basic.test.ts, combat-death.test.ts, skill-registry-new-skills.test.ts, game-actions.test.ts, game-decisions-action-type-inference.test.ts, game-core-process-tick-resolution-order.test.ts. Wrote test-designs.md with 33 test designs.
- TEST_DESIGN_REVIEW: Read test-designs.md, requirements.md, plan.md, exploration.md, session.md, healing.test.ts, game-test-helpers.ts, game-core-process-tick-resolution-order.test.ts, combat-death.test.ts. Reviewed all 18 acceptance criteria coverage. Added 3 tests, fixed 2 test designs, noted 1 UI-only criterion as out of scope. Updated test-designs.md and session.md.

## Files Touched

### Test Files (from WRITE_TESTS)

- `src/engine/interrupt.test.ts` (NEW - 362 lines, 10 unit tests)
- `src/engine/interrupt-integration.test.ts` (NEW - 140 lines, 2 integration tests)
- `src/engine/charge.test.ts` (NEW - 289 lines, 7 unit tests)
- `src/engine/charge-events.test.ts` (NEW - 244 lines, 6 unit tests)
- `src/engine/charge-integration.test.ts` (NEW - 358 lines, 5 integration tests)
- `src/engine/skill-registry-interrupt-charge.test.ts` (NEW - 152 lines, 6 unit tests)

### Source Files (from IMPLEMENT)

- `src/engine/types.ts` (MODIFIED - 339 lines) -- Added interrupt/charge to type unions, new event interfaces
- `src/engine/interrupt.ts` (NEW - 90 lines) -- Interrupt resolution module
- `src/engine/charge.ts` (NEW - 198 lines) -- Charge resolution module with greedy movement
- `src/engine/skill-registry.ts` (MODIFIED - 229 lines) -- Added Kick/Charge entries, defaultTrigger/defaultFilter
- `src/engine/game-core.ts` (MODIFIED - 258 lines) -- Integrated interrupt+charge into pipeline, added resolvedCharacterIds for movement
- `src/engine/game-actions.ts` (MODIFIED - 102 lines) -- Updated getActionType return type, createSkillAction branching
- `src/engine/game-decisions.ts` (MODIFIED - 289 lines) -- Updated range checks for interrupt/charge
- `src/engine/game.ts` (MODIFIED - 35 lines) -- Barrel exports for interrupt/charge modules
- `src/engine/movement.ts` (MODIFIED - 265 lines) -- Added resolvedCharacterIds parameter to exclude already-resolved characters from blocker checks
- `src/components/BattleViewer/IntentLine.tsx` (MODIFIED - 126 lines) -- Added interrupt/charge to type, color, marker
- `src/components/BattleViewer/IntentOverlay.tsx` (MODIFIED - 213 lines) -- Added interrupt/charge to type cast, bidirectional detection
- `src/components/RuleEvaluations/rule-evaluations-formatters.ts` (MODIFIED - 169 lines) -- Added interrupt/charge cases

### Existing Test Files Updated

- `src/engine/skill-registry.test.ts` -- Updated skill count from 6 to 8, added interrupt/charge to valid actionTypes
- `src/components/InventoryPanel/InventoryPanel.test.tsx` -- Updated tick cost 0 count from 2 to 3, range 1 count from 2 to 3
- `src/components/CharacterPanel/PriorityTab-inventory.test.tsx` -- Added kick and charge skills to assigned skills

## Browser Verification

Status: N/A

## Human Approval

Status: N/A (non-UI engine task — UI updates minor)

## Blockers

(none)

## Review Cycles

Count: 1
Verdict: APPROVED (0 critical, 3 non-blocking)
Non-blocking: NB-1 duplicate DeathEvent on charge kills, NB-2 unnecessary type casts in tests, NB-3 greedy algorithm deviation from plan
Next: COMMIT
