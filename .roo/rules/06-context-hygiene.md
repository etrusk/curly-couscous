# Context Hygiene (ALL MODES)

## Clean Slate Triggers

Start a NEW task/conversation when ANY of these occur:

- [ ] Distinct task or feature is complete
- [ ] Context usage exceeds ~50% of available tokens
- [ ] Switching to unrelated area of codebase
- [ ] AI contradicts its earlier analysis
- [ ] Responses become vague or generic (not project-specific)
- [ ] AI references APIs, methods, or packages that don't exist
- [ ] Debugging exceeds 20 exchanges without resolution
- [ ] Same solution suggested that was previously rejected

**DO NOT** try to "fix" a degraded conversation—start fresh with a summary.

## Memory Bank Files

Session continuity is maintained through `.docs/`:

- `.docs/spec.md` - Project specification (mostly static)
- `.docs/architecture.md` - System design, patterns (stable)
- `.docs/current-task.md` - Current focus, recent completions (dynamic - PRUNE OFTEN)
- `.docs/patterns/index.md` - Proven implementation patterns
- `.docs/decisions/index.md` - ADR-style decision log
- `.docs/investigations/index.md` - Debug findings, root causes

**Token budgets:**

- `.docs/current-task.md`: Keep under 500 tokens
- All memory files combined: 1.3k-2.2k tokens total
