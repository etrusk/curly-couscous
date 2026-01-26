# Context Hygiene (ALL MODES)

## Memory Bank Files

Session continuity is maintained through `.docs/`:

| File                      | Purpose                           | Volatility            |
| ------------------------- | --------------------------------- | --------------------- |
| `spec.md`                 | Project specification             | Mostly static         |
| `architecture.md`         | System design, patterns           | Stable                |
| `current-task.md`         | Current focus, recent completions | Dynamic (prune often) |
| `patterns/index.md`       | Proven implementation patterns    | Stable                |
| `decisions/index.md`      | ADR-style decision log            | Append-only           |
| `investigations/index.md` | Debug findings, root causes       | Append-only           |

**Token budgets:**

- `current-task.md`: Keep under 500 tokens
- All memory files combined: 1.3k-2.2k tokens total

## Clean Slate Triggers

See `01-workflow.md` → "Clean Slate Triggers" section.
