# Architectural Decision Records (ADR) Index

LLM-optimized index of significant architectural and design decisions.

**Token Budget**: Keep this index under 200 tokens. Full ADR details are in separate files.

**Usage**: When agents need decision details, reference the specific ADR file (e.g., `decisions/adr-001-spike-and-stabilize.md`), not this index.

## Decisions

| ID      | Title                                              | Date       | Status   | File                                                                         |
| ------- | -------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------- |
| ADR-001 | Spike and Stabilize Pattern for Discovery          | 2026-01-03 | Accepted | [adr-001-spike-and-stabilize.md](./adr-001-spike-and-stabilize.md)           |
| ADR-002 | Uniform Intent Line Filtering for All Action Types | 2026-01-27 | Accepted | [adr-002-uniform-intent-filtering.md](./adr-002-uniform-intent-filtering.md) |

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
