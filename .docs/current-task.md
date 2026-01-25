# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus

Debug UI improvements. Next: Additional debugging tools as needed.

## Recent Completions

- 2026-01-25: gameStore.test.ts decomposition - Removed 1313‑line monolithic test file, split into 5 focused test modules (integration, reset, skills, characters, debug‑ui), 623 tests pass
- 2026-01-25: game.test.ts decomposition - Removed 3186‑line monolithic test file, split into 5 focused test modules (action‑type‑inference, attack‑targeting, move‑destination‑basic, move‑destination‑wall‑boundary, evaluate‑skills), 728 total tests pass
- 2026-01-25: gameStore decomposition - Split 484‑line store into 5 focused modules (constants, helpers, selectors, types, actions), 327‑line core, 683 tests pass
- 2026-01-24: Debug UI click-to-place - Selection modes for adding/moving characters, clickable cells, CharacterControls buttons, 583 tests
- 2026-01-03: RuleEvaluations prototype - Read-only decision display, expandable skill details, faction-based grouping, 479 tests (1e4358f)
- 2026-01-03: UI layout restructure - All panels positioned, SkillsPanel/RuleEvaluations span full height, 461 tests (51198c6)

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
