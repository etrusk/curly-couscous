# Architectural Decision Records (ADR) Index

LLM-optimized index of significant architectural and design decisions.

**Token Budget**: Keep this index under 200 tokens. Full ADR details are in separate files.

**Usage**: When agents need decision details, reference the specific ADR file (e.g., `decisions/adr-001-spike-and-stabilize.md`), not this index.

## Decisions

| ID      | Title                                                             | Date       | Status                | File                                                                                   |
| ------- | ----------------------------------------------------------------- | ---------- | --------------------- | -------------------------------------------------------------------------------------- |
| ADR-001 | Spike and Stabilize Pattern for Discovery                         | 2026-01-03 | Accepted              | [adr-001-spike-and-stabilize.md](./adr-001-spike-and-stabilize.md)                     |
| ADR-002 | Uniform Intent Line Filtering for All Action Types                | 2026-01-27 | Accepted              | [adr-002-uniform-intent-filtering.md](./adr-002-uniform-intent-filtering.md)           |
| ADR-003 | Weighted A\* for Pathfinding, Chebyshev for Range                 | 2026-01-29 | Superseded by ADR-007 | [adr-003-weighted-astar-pathfinding.md](./adr-003-weighted-astar-pathfinding.md)       |
| ADR-004 | Local React State for UI-Only Concerns                            | 2026-01-29 | Accepted              | [adr-004-local-state-for-ui-concerns.md](./adr-004-local-state-for-ui-concerns.md)     |
| ADR-005 | Centralized Skill Registry                                        | 2026-01-30 | Accepted              | [adr-005-centralized-skill-registry.md](./adr-005-centralized-skill-registry.md)       |
| ADR-006 | Heal Resolution Before Combat                                     | 2026-02-03 | Accepted              | [adr-006-heal-resolution-order.md](./adr-006-heal-resolution-order.md)                 |
| ADR-007 | Hexagonal Grid with Axial Coordinates                             | 2026-02-03 | Accepted              | [adr-007-hex-coordinate-system.md](./adr-007-hex-coordinate-system.md)                 |
| ADR-008 | SVG Hex Grid with Shared ViewBox Coordinate System                | 2026-02-04 | Accepted              | [adr-008-svg-hex-grid.md](./adr-008-svg-hex-grid.md)                                   |
| ADR-009 | Instance Identity for Skill Duplication                           | 2026-02-04 | Accepted              | [adr-009-skill-instance-identity.md](./adr-009-skill-instance-identity.md)             |
| ADR-010 | Movement Resolution Before Combat                                 | 2026-02-05 | Accepted              | [adr-010-movement-before-combat.md](./adr-010-movement-before-combat.md)               |
| ADR-011 | Reshape Skill System: Universal Behavior + Target/Criterion Split | 2026-02-05 | Accepted              | [adr-011-skill-system-reshape.md](./adr-011-skill-system-reshape.md)                   |
| ADR-012 | Tasks DAG for Pipeline Orchestration (Experimental)               | 2026-02-06 | Proposed              | [adr-012-tasks-dag-pipeline.md](./adr-012-tasks-dag-pipeline.md)                       |
| ADR-013 | Agent Teams for Parallelized EXPLORE (Experimental)               | 2026-02-06 | Proposed              | [adr-013-agent-teams-parallel-explore.md](./adr-013-agent-teams-parallel-explore.md)   |
| ADR-014 | Dev-Only Window API for Smoke Test State Verification             | 2026-02-06 | Accepted              | [adr-014-dev-only-test-harness.md](./adr-014-dev-only-test-harness.md)                 |
| ADR-015 | Per-Instance Selector Filters                                     | 2026-02-06 | Accepted              | [adr-015-per-instance-selector-filters.md](./adr-015-per-instance-selector-filters.md) |

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
