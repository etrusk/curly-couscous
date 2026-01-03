# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus

SkillsPanel 80/20 prototype complete. Token click-to-select with keyboard accessibility, skill configuration UI with dropdowns, priority reordering. 461 tests passing.

## Recent Completions

<!-- Prune when >10 items or too long. Older completions live in git history. -->

- 2026-01-02: SkillsPanel 80/20 prototype - Token click-to-select (keyboard accessible), skill configuration UI (trigger/selector/mode dropdowns), priority reordering (up/down buttons), store actions (selectCharacter, updateSkill, moveSkillUp/Down), 50 new tests, 461 total tests
- 2026-01-02: Theming system foundation - Dark (default), light, high-contrast modes with localStorage + system preference, ThemeToggle component, 30 new tests, 411 total tests
  - **Files created**: accessibilityStore.ts, theme.css, ThemeToggle component, 4 test files
  - **Architecture**: Zustand store, CSS custom properties (--surface-_, --content-_), Okabe-Ito colors preserved
  - **Migration ready**: ~15 CSS modules identified for token migration (BattleViewer, Token, IntentLine, panels)
- 2026-01-02: Battle Viewer Phase 5 (reduced scope) - Contrasting outlines on intent lines/markers, 16 new accessibility tests, 381 total tests (df64f1f)
  - **Scope decision**: Shipped core accessibility (outlines) immediately. Deferred configurable themes, UI scale, persistence for future theming system.
- 2026-01-02: Workflow rules updated - Debug mode escalation at steps 5a/6a/9a/9b, browser tool for GUI testing (381d857)
- 2026-01-02: EventLog component - Scrollable list, filtering, faction colors, 366 total tests (9a3a611)
- 2026-01-02: BattleStatusBadge - Victory/Defeat/Draw display, emoji indicators, tick count (751011c)
- 2026-01-02: PlayControls - Step/Play/Pause/Reset, auto-play with pause on battle end (c7499da)
- 2026-01-02: Battle Viewer Phase 4 - Damage Numbers overlay, SVG-based, 294 total tests (9e96722)
- 2026-01-02: Battle Viewer Phases 1-3 - Grid, Tokens, Intent Lines, 273 tests
- 2026-01-02: Battle Viewer architecture design - CSS Grid + SVG overlay, 6-phase roadmap
- 2026-01-02: Decision integration - applyDecisions(), clearResolvedActions(), wired into processTick() (50374d3)
- 2026-01-02: AI decisions - computeDecisions() with skill priority, trigger AND logic

## Open Questions

- None currently

## Next Steps

- Skills Panel: Sentence-builder UI for skill configuration
- Future theming system: Configurable colors, UI scale, high contrast mode, persistence (deferred from Phase 5)
