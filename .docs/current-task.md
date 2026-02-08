# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

Cleanup session complete. Ready for commit. (TDD/Claude Code)

Note: `.tdd/` ephemeral files can be deleted at commit time -- all tasks are complete.

## Recent Completions

- 2026-02-08: Cleanup Session -- test split, DeathEvent dedup, Dash defaultTrigger (COMPLETE, TDD/Claude Code) - Split `selector-filter-integration.test.ts` (639 lines) into 3 files under 400-line limit. Fixed DeathEvent duplication on charge kills via pre-combat HP snapshot in `combat.ts`. Retrofitted Dash with `defaultTrigger: { scope: "enemy", condition: "in_range", conditionValue: 1 }`. 6 new test files, 2 source files modified. 29 new tests.

- 2026-02-08: Skill Expansion Session C -- Phases 7+8 (COMPLETE, TDD/Claude Code) - Added Kick (interrupt, tickCost 0, range 1, cooldown 4, instant) and Charge (charge, tickCost 1, range 3, damage 20, distance 3, cooldown 3). New action types `interrupt` and `charge` in all type unions. New event types: InterruptEvent, InterruptMissEvent, ChargeEvent. New engine modules: `interrupt.ts`, `charge.ts`. Pipeline order: Healing -> Interrupts -> Charges -> Movement -> Combat. Added `defaultTrigger`/`defaultFilter` to SkillDefinition. 12 source files modified, 6 new test files, 3 existing test files updated. 36 new tests, 1504/1504 passing.

- 2026-02-08: Skill Expansion Session B -- Phases 4+5+6 (COMPLETE, TDD/Claude Code) - Added Ranged Attack (attack, range 4, damage 15, cooldown 2) and Dash (move, distance 2, tickCost 0, cooldown 3) to skill registry. Added `distance` field to Skill/SkillDefinition with `computeMultiStepDestination()` wrapper for multi-step movement. Added `most_enemies_nearby` criterion (2-hex radius, self-exclusion, position tiebreak). 16 source files modified, 4 new test files. 35 new tests, 1468/1468 passing.

## Priority Next Tasks

- [ ] `src/engine/charge-events.test.ts:146` -- TS18048 error (pre-existing, unrelated to recent changes)
- [ ] `src/engine/interrupt.test.ts:122` -- TS2532 error (pre-existing, unrelated to recent changes)

## Next Steps

All Skill Expansion phases and cleanup tasks complete. Potential future work:

- [ ] Fix pre-existing TypeScript errors listed above
- [ ] New skill types or game mechanics
