# Project Status

<!-- TOKEN BUDGET: Keep this file under 500 tokens (~200 words total).
     Research shows memory files should total 1.3k-2.2k tokens combined.
     This is a breadcrumb trail, not documentation. Prune aggressively. -->

## Current Focus

(Ready for next task)

## Recent Completions

- 2026-01-25: selectors.test.ts decomposition - Removed 523‑line monolithic test file, split into 9 focused test modules (nearest_enemy, nearest_ally, lowest_hp_enemy, lowest_hp_ally, self, tie‑breaking, metric‑independence, edge‑cases, helpers), 627 total tests pass
- 2026-01-25: triggers.test.ts decomposition - Removed 717‑line monolithic test file, split into 7 focused test modules (enemy‑in‑range, ally‑in‑range, hp‑below, cell‑targeted, edge‑cases, always, helpers), 627 total tests pass
- 2026-01-25: combat.test.ts decomposition - Removed 1083‑line monolithic test file, split into 4 focused test modules (basic, multi‑attack, death, edge‑cases) + helpers, 623 tests pass
- 2026-01-25: gameStore.test.ts decomposition - Removed 1313‑line monolithic test file, split into 5 focused test modules (integration, reset, skills, characters, debug‑ui), 623 tests pass
- 2026-01-25: game.test.ts decomposition - Removed 3186‑line monolithic test file, split into 5 focused test modules (action‑type‑inference, attack‑targeting, move‑destination‑basic, move‑destination‑wall‑boundary, evaluate‑skills), 728 total tests pass
- 2026-01-25: gameStore decomposition - Split 484‑line store into 5 focused modules (constants, helpers, selectors, types, actions), 327‑line core, 683 tests pass
- 2026-01-24: Debug UI click-to-place - Selection modes for adding/moving characters, clickable cells, CharacterControls buttons, 583 tests
- 2026-01-03: RuleEvaluations prototype - Read-only decision display, expandable skill details, faction-based grouping, 479 tests (1e4358f)

## Next Steps

- Sentence-builder UI for SkillsPanel configuration
