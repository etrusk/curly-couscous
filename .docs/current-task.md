# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus

UI layout improvements complete. Controls positioned under battle grid, side panels span full height, all characters have complete skill sets. Next: sentence-builder UI for skill configuration.

## Recent Completions

<!-- Prune when >10 items or too long. Older completions live in git history. -->

- 2026-01-03: UI layout restructure - BattleStatusBadge + PlayControls moved under grid, SkillsPanel and RuleEvaluations span full height, all 6 characters now have all 3 skills (Light Punch, Heavy Punch, Move), selection UX guidance: "Click a character on the grid to configure skills", 461 tests passing (51198c6)
- 2026-01-02: SkillsPanel 80/20 prototype - Token click-to-select (keyboard accessible), skill configuration UI (trigger/selector/mode dropdowns), priority reordering (up/down buttons), store actions (selectCharacter, updateSkill, moveSkillUp/Down), 50 new tests, 461 total tests
- 2026-01-02: Theming system foundation - Dark (default), light, high-contrast modes with localStorage + system preference, ThemeToggle component, 30 new tests, 411 total tests
  - **Files created**: accessibilityStore.ts, theme.css, ThemeToggle component, 4 test files
  - **Architecture**: Zustand store, CSS custom properties (--surface-_, --content-_), Okabe-Ito colors preserved
- 2026-01-02: Battle Viewer Phase 5 (reduced scope) - Contrasting outlines on intent lines/markers, 16 new accessibility tests, 381 total tests (df64f1f)
- 2026-01-02: EventLog component - Scrollable list, filtering, faction colors, 366 total tests (9a3a611)
- 2026-01-02: BattleStatusBadge - Victory/Defeat/Draw display, emoji indicators, tick count (751011c)
- 2026-01-02: PlayControls - Step/Play/Pause/Reset, auto-play with pause on battle end (c7499da)
- 2026-01-02: Battle Viewer Phase 4 - Damage Numbers overlay, SVG-based, 294 total tests (9e96722)
- 2026-01-02: Battle Viewer Phases 1-3 - Grid, Tokens, Intent Lines, 273 tests

## Open Questions

- None currently

## Next Steps

- Skills Panel: Sentence-builder UI for skill configuration
- Future theming system: Configurable colors, UI scale, high contrast mode, persistence (deferred from Phase 5)
