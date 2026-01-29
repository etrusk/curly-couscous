---
name: tdd-status
description: Check current TDD workflow state and project documentation status
---

# TDD Status Check

Read and report the current state of the TDD workflow.

## Project Status

1. Check `.docs/current-task.md` (shared with Roo workflow):

   ```bash
   cat .docs/current-task.md 2>/dev/null || echo "NO_CURRENT_TASK"
   ```

   Report:
   - Current Focus (task, workflow, started timestamp)
   - Recent Completions (last 3-5 entries)
   - Next Steps (planned improvements)

## Workflow Status

2. Check `.tdd/session.md`:

   ```bash
   cat .tdd/session.md 2>/dev/null || echo "NO_SESSION"
   ```

3. If no session: Report "No active TDD session. Start with `/tdd [task description]`"

4. If session exists, report:
   - Current phase
   - Task description
   - Phases completed
   - Review cycle count
   - Any blockers
   - Files touched

## Documentation Status

Check project documentation:

```bash
echo "=== Documentation ==="
ls -la .docs/*.md 2>/dev/null || echo "No .docs/*.md files"
ls -la .docs/*/index.md 2>/dev/null || echo "No .docs/*/index.md files"
```

Report:

- Which documentation files exist
- Which are missing (spec.md, architecture.md, patterns/index.md, decisions/index.md)

## Recommendations

Based on state, recommend next action:

- If no session: `/tdd [task]` to start
- If mid-workflow: `/tdd` to resume
- If documentation missing: Suggest creating stubs
