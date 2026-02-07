# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     This is a breadcrumb trail, not documentation. Prune aggressively.

     FORMAT: Both Roo and Claude Code workflows use this file.
     - Workflow identifier helps track which system is active
     - No mid-task switching between workflows -->

## Current Focus

None -- ready for next task.

## Recent Completions

- 2026-02-07: Battle UI Visual Polish (COMPLETE, TDD/Claude Code) - Four visual improvements: (1) SkillRow cooldown badge ("CD: N") + dimming when cooldownRemaining > 0, (2) WhiffOverlay with faded hex fills for missed cell-targeted attacks/heals via new WhiffEvent type, (3) TargetingLine white contrast outline matching IntentLine pattern, (4) two-pass Grid SVG rendering for token z-ordering + empty cell/background click deselection. 3 new files, 11 modified source files, 40 new tests + 6 updates. 1357/1357 tests passing. spec.md, architecture.md updated.

- 2026-02-07: Remove Phase Switching and Toggles (COMPLETE, TDD/Claude Code) - Removed battle/config phase layout switching (data-phase), auto-focus pill toggle, targeting lines checkbox. Layout fixed at 2fr 3fr. Deleted calculatePreBattleStatus; callers use calculateBattleStatus. TargetingLineOverlay always renders. Single-faction battleStatus changed from "draw" to "victory"/"defeat". 15 tests deleted, 8 new tests added, 4 modified. 1317/1317 tests passing. spec.md, architecture.md updated.

- 2026-02-07: Prototype Mode Simplification (COMPLETE, TDD/Claude Code) - Inventory visibility now based on faction presence (both factions on board = hidden) instead of battle mode. Removed `mode` prop from PriorityTab; reads `battleStatus` from store directly. Auto-focus checkbox replaced with pill/switch toggle (`role="switch"`, `aria-checked`). 8 new tests, ~22 existing test modifications. 1327/1327 tests passing. spec.md, architecture.md updated.

- 2026-02-07: Remove Loadout Tab -- Merge into Priority (COMPLETE, TDD/Claude Code) - Eliminated tab navigation from CharacterPanel. Merged enable/disable checkbox, unassign button, and inventory section into PriorityTab/SkillRow. Extracted SkillRowActions sub-component. Config controls remain visible during battle alongside evaluation indicators. Deleted LoadoutTab files. 1332/1332 tests passing. spec.md, architecture.md updated.

## Next Steps
