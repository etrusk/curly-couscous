# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-06: 5 UI gap fixes (COMPLETE, TDD/Claude Code) - Universal behavior dropdown (registry-driven), universal skill duplication (maxInstances 1->2 for light-punch/heavy-punch/heal), NOT trigger toggle UI, real battle evaluation in PriorityTab, compact battle view. 15 new tests + 4 existing updates. 1281/1281 tests passing. Smoke checks 24-25 added. spec.md maxInstances updated.

- 2026-02-06: AND combinator UI (COMPLETE, TDD/Claude Code) - Second trigger dropdown with "+ AND" button, "AND" label, remove button. Extracted TriggerDropdown sub-component from SkillRow. 28 new tests (15 TriggerDropdown unit, 13 SkillRow integration). 1263/1263 tests passing. Smoke tests 22-23 added.

- 2026-02-06: Test harness for smoke tests (COMPLETE, TDD/Claude Code) - Dev-only `window.__TEST_HARNESS__` API exposing read-only game state. Added data-testid attributes to 4 components (11 testids). Smoke tests updated with 7 verify_js fields. 1235/1235 tests passing. ADR-014 created.

- 2026-02-06: Two-panel tabbed layout + inline evaluation + hex grid rotation (COMPLETE, TDD/Claude Code) - CharacterPanel with Loadout/Priority tabs. Inline evaluation display. Hex rotation to pointy-top. 1220/1220 tests passing.

- 2026-02-05: Trigger system expansion (COMPLETE, TDD/Claude Code) - ally_hp_below trigger, NOT modifier, AND combinator deferred. 1161 tests passing.

## Next Steps

- Address selectMovementTargetData known limitation (targeting line shows first Move instance, not trigger-evaluated one)
- Consider migrating old selector tests from evaluateSelector to evaluateTargetCriterion (tech debt cleanup)
- Extract PriorityTab.test.tsx into smaller files (669 lines, exceeds 400-line limit)
