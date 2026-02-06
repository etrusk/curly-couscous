# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-06: Test harness for smoke tests (COMPLETE, TDD/Claude Code) - Dev-only `window.__TEST_HARNESS__` API exposing read-only game state (getState, getCharacters, getTick, getBattleStatus, getSelectedCharacterId). Added data-testid attributes to 4 components (11 testids). Smoke tests updated with 7 verify_js fields. 1235/1235 tests passing. ADR-014 created.

- 2026-02-06: Two-panel tabbed layout + inline evaluation + hex grid rotation (COMPLETE, TDD/Claude Code) - D1: CharacterPanel with Loadout/Priority tabs replacing 3-panel layout. D2: Inline evaluation display in SkillRow (selected/rejected/skipped status). D3: Hex rotation to pointy-top orientation (flat-top board shape). 1220/1220 tests passing. Smoke tests updated. Architecture documented.

- 2026-02-05: Trigger system expansion (COMPLETE, TDD/Claude Code) - Added ally_hp_below trigger type, NOT modifier for all triggers, AND combinator UI deferred. Engine and formatters fully implemented. 1161 tests passing. ADR planned (trigger composition rules). UI changes to SkillsPanel.tsx deferred to v0.4.

- 2026-02-05: Skill system reshape (COMPLETE, TDD/Claude Code) - Universal behavior field replaces Move-specific mode. Target+criterion split replaces monolithic Selector. Universal maxInstances replaces Move-only duplication. Explicit actionType replaces inference. ADR-011 created. 1102/1103 tests passing. ~30 files modified across engine, stores, components, and tests.

- 2026-02-04: Move skill duplication (COMPLETE, TDD/Claude Code) - Added instanceId to Skill type for instance-level identity. New duplicateSkill store action, max 3 Move instances per character. ADR-009 created.

## Next Steps

- Implement UI changes for AND combinator (second trigger dropdown in SkillsPanel.tsx) - deferred from trigger expansion
- Address selectMovementTargetData known limitation (targeting line shows first Move instance, not trigger-evaluated one)
- Consider migrating old selector tests from evaluateSelector to evaluateTargetCriterion (tech debt cleanup)
