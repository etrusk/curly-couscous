# ADR-013: Agent Teams for Parallelized EXPLORE (Experimental)

## Status

PROPOSED — Low priority, high risk. Only attempt after WP1-WP4 are stable.

## Context

The INIT -> EXPLORE -> PLAN sequence has natural parallelism: codebase exploration, test landscape analysis, and documentation review can happen simultaneously. Agent Teams (experimental in Claude Code) enable peer-to-peer coordination between multiple Claude instances.

## Experiment Design

Enable with environment variable:

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model claude-opus-4-6
```

Structure for a single complex feature:

```
Team Lead (orchestrator)
+-- Teammate 1: Explore test landscape (existing tests, coverage gaps, patterns)
+-- Teammate 2: Explore implementation (architecture, dependencies, affected files)
+-- Teammate 3: Review documentation (.docs/ spec, architecture, patterns)
```

All three report findings to Team Lead, who synthesizes into a unified exploration.md.

## Evaluation Criteria

Compare against sequential EXPLORE on similar-complexity task:

- Wall-clock time for the exploration phase
- Quality of resulting plan (did parallel exploration miss cross-cutting concerns?)
- Rate limit impact (did 3 teammates hit the 5x ceiling?)
- Context isolation (did teammates avoid duplicating work?)

## Rate Limit Considerations

- Each teammate counts against 5x tier limits
- If limits are hit: reduce to 2 teammates, or upgrade to 20x tier
- If quality suffers: add synchronization step where Team Lead reconciles findings

## Git Worktrees for Isolation

For tasks where teammates might make conflicting changes:

```bash
git worktree add ../auto-battler-explore-tests feature/explore-tests
git worktree add ../auto-battler-explore-impl feature/explore-impl
```

Not needed for read-only exploration, but noted for future parallel implementation experiments.

## Consequences

- If successful: significant wall-clock time reduction for EXPLORE phase
- If unsuccessful: parallel exploration may miss dependencies; fall back to sequential
- Risk: experimental feature instability, rate limit pressure
