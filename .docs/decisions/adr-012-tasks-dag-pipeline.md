# ADR-012: Tasks DAG for Pipeline Orchestration (Experimental)

## Status

PROPOSED — Requires manual validation before adoption.

## Context

The current TDD orchestrator manages phase transitions by parsing AGENT_COMPLETION blocks and updating session.md. The Claude Code Tasks system (v2.1.16+) provides native dependency-aware task management with DAGs, cross-session persistence, and built-in token metrics.

## Decision

Evaluate whether the Tasks DAG system can supplement (not replace) the current session.md-based orchestration.

## Phase-to-Task Mapping

```
INIT (Task 0) --> EXPLORE (Task 1) --> PLAN (Task 2) --> DESIGN_TESTS (Task 3)
                                                              |
                                                              v
COMMIT (Task 11) <-- SYNC_DOCS (Task 10) <-- HUMAN_APPROVAL (Task 9)
    |                                              ^
    v                                              |
REFLECT (Task 12)                    REVIEW (Task 8) <-- IMPLEMENT (Task 7)
                                       |                       ^
                                       v                       |
                                 ANALYZE_FIX (Task A) --> FIX (Task B) --+
                                                    (cycle, max 2)
```

Each phase becomes a Task node with:

- Explicit dependency on predecessor (blockedBy)
- Agent assignment (from .claude/agents/tdd-\*.md)
- Budget constraints
- Exit criteria (enforced by SubagentStop hooks)

HUMAN_APPROVAL is a blocking task requiring human input.

## Evaluation Approach

1. Test manually: create a simple 3-task DAG (EXPLORE -> PLAN -> IMPLEMENT) for a trivial feature
2. Verify: task persistence across sessions, dependency enforcement, token metrics in results
3. If successful, prototype the full 13-phase DAG
4. Compare: is the Tasks DAG simpler and more reliable than session.md routing?
5. Run in parallel with session.md — do NOT replace session.md yet

## What to Preserve

The current orchestrator handles things Tasks may not support natively:

- AGENT_COMPLETION block parsing and validation
- session.md as a human-readable audit trail
- Checkpoint summaries between phases
- The ANALYZE_FIX -> FIX -> REVIEW cycle with max 2 iterations

Keep session.md as the audit trail even if Tasks handles routing. The two systems complement each other.

## Consequences

- If adopted: simpler routing logic, native dependency enforcement, cross-session persistence
- If rejected: current session.md routing continues to work
- Risk: Tasks system may not support cyclic dependencies (ANALYZE_FIX cycles)
