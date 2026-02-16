# Architectural Decision Records (ADR) Index

LLM-optimized index of significant architectural and design decisions.

**Token Budget**: Keep this index under 200 tokens. Full ADR details are in separate files.

**Usage**: When agents need decision details, reference the specific ADR file (e.g., `decisions/adr-001-spike-and-stabilize.md`), not this index.

## Decisions

| ID      | Title                                                                 | Date       | Status                         | File                                                                                   |
| ------- | --------------------------------------------------------------------- | ---------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| ADR-001 | Spike and Stabilize Pattern for Discovery                             | 2026-01-03 | Accepted                       | [adr-001-spike-and-stabilize.md](./adr-001-spike-and-stabilize.md)                     |
| ADR-002 | Uniform Intent Line Filtering for All Action Types                    | 2026-01-27 | Accepted                       | [adr-002-uniform-intent-filtering.md](./adr-002-uniform-intent-filtering.md)           |
| ADR-003 | Weighted A\* for Pathfinding, Chebyshev for Range                     | 2026-01-29 | Superseded by ADR-007          | [adr-003-weighted-astar-pathfinding.md](./adr-003-weighted-astar-pathfinding.md)       |
| ADR-004 | Local React State for UI-Only Concerns                                | 2026-01-29 | Accepted                       | [adr-004-local-state-for-ui-concerns.md](./adr-004-local-state-for-ui-concerns.md)     |
| ADR-005 | Centralized Skill Registry                                            | 2026-01-30 | Accepted                       | [adr-005-centralized-skill-registry.md](./adr-005-centralized-skill-registry.md)       |
| ADR-006 | Heal Resolution Before Combat                                         | 2026-02-03 | Accepted                       | [adr-006-heal-resolution-order.md](./adr-006-heal-resolution-order.md)                 |
| ADR-007 | Hexagonal Grid with Axial Coordinates                                 | 2026-02-03 | Accepted                       | [adr-007-hex-coordinate-system.md](./adr-007-hex-coordinate-system.md)                 |
| ADR-008 | SVG Hex Grid with Shared ViewBox Coordinate System                    | 2026-02-04 | Accepted                       | [adr-008-svg-hex-grid.md](./adr-008-svg-hex-grid.md)                                   |
| ADR-009 | Instance Identity for Skill Duplication                               | 2026-02-04 | Accepted                       | [adr-009-skill-instance-identity.md](./adr-009-skill-instance-identity.md)             |
| ADR-010 | Movement Resolution Before Combat                                     | 2026-02-05 | Accepted                       | [adr-010-movement-before-combat.md](./adr-010-movement-before-combat.md)               |
| ADR-011 | Reshape Skill System: Universal Behavior + Target/Criterion Split     | 2026-02-05 | Accepted                       | [adr-011-skill-system-reshape.md](./adr-011-skill-system-reshape.md)                   |
| ADR-012 | Tasks DAG for Pipeline Orchestration (Experimental)                   | 2026-02-06 | Proposed                       | [adr-012-tasks-dag-pipeline.md](./adr-012-tasks-dag-pipeline.md)                       |
| ADR-013 | Agent Teams for Parallelized EXPLORE (Experimental)                   | 2026-02-06 | Proposed                       | [adr-013-agent-teams-parallel-explore.md](./adr-013-agent-teams-parallel-explore.md)   |
| ADR-014 | Dev-Only Window API for Smoke Test State Verification                 | 2026-02-06 | Removed (smoke tests archived) | [archived](.archive/smoke-testing/docs/decisions/adr-014-dev-only-test-harness.md)     |
| ADR-015 | Per-Instance Skill Filters                                            | 2026-02-06 | Accepted (updated Phase 2)     | [adr-015-per-instance-selector-filters.md](./adr-015-per-instance-selector-filters.md) |
| ADR-016 | Pre-Criterion Pool Narrowing for Skill Filters                        | 2026-02-08 | Accepted                       | [adr-016-pre-criterion-pool-narrowing.md](./adr-016-pre-criterion-pool-narrowing.md)   |
| ADR-017 | Wrapper Function for Multi-Step Movement                              | 2026-02-08 | Accepted                       | [adr-017-multi-step-movement-wrapper.md](./adr-017-multi-step-movement-wrapper.md)     |
| ADR-018 | Default Trigger and Filter on SkillDefinition                         | 2026-02-08 | Accepted                       | (inline, no detail file)                                                               |
| ADR-019 | Independent Terminal Overlay Token Layer                              | 2026-02-09 | Accepted                       | (inline, no detail file)                                                               |
| ADR-020 | React Compiler Adoption (manual memoization cleanup complete)         | 2026-02-09 | Accepted                       | [adr-020-react-compiler-adoption.md](./adr-020-react-compiler-adoption.md)             |
| ADR-021 | CSS `light-dark()` and `color-mix()` Theme Consolidation              | 2026-02-09 | Accepted                       | [adr-021-css-light-dark-color-mix.md](./adr-021-css-light-dark-color-mix.md)           |
| ADR-022 | Vitest Browser Mode for Real DOM Testing                              | 2026-02-09 | Accepted                       | [adr-022-vitest-browser-mode.md](./adr-022-vitest-browser-mode.md)                     |
| ADR-023 | Duplicate VALUE_CONDITIONS Between TriggerDropdown and FilterControls | 2026-02-11 | Accepted                       | (inline, no detail file)                                                               |
| ADR-024 | Extract Scoring Functions to movement-scoring.ts                      | 2026-02-11 | Accepted                       | [adr-024-movement-scoring-extraction.md](./adr-024-movement-scoring-extraction.md)     |
| ADR-025 | knip Excluded from lint-staged (Project-Level Analyzer)               | 2026-02-16 | Accepted                       | (inline, no detail file)                                                               |

## Adding New ADRs

1. Create new file: `.docs/decisions/adr-XXX-brief-title.md`
2. Use template:
   - Decision: What was decided
   - Date: When decided
   - Context: What prompted this
   - Options Considered: Alternatives evaluated
   - Decision Rationale: Why chosen
   - Consequences: Trade-offs and follow-up
3. Add row to table above

**Remember**: Keep index minimal. Put details in separate files.
