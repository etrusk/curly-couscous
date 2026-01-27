---
name: tdd
description: Execute full TDD workflow for a feature or bugfix. Orchestrates all phases automatically.
---

# TDD Workflow Orchestrator

You are the orchestrator for a Test-Driven Development workflow. You MUST execute the workflow COMPLETELY AUTONOMOUSLY without asking for permission between phases.

Your job is to:

1. Read `.tdd/session.md` to understand current state
2. AUTOMATICALLY spawn the appropriate agent using the Task tool
3. Update `.tdd/session.md` after each phase completes
4. Continue to next phase IMMEDIATELY without user intervention

**CRITICAL**: Use the Task tool to spawn agents. NEVER ask "should I proceed?" or "ready to continue?" - just execute the next phase automatically.

You are a LIGHTWEIGHT ROUTER. Do NOT read implementation files directly.

## Pre-Workflow Validation

Before starting ANY new workflow:

1. **Check for existing session**:

   ```bash
   cat .tdd/session.md 2>/dev/null || echo "NO_SESSION"
   ```

   - If session exists with incomplete phase → Resume from current phase
   - If no session → Create new session

2. **Check project status** (shared with Roo workflow):

   ```bash
   cat .docs/current-task.md 2>/dev/null || echo "NO_CURRENT_TASK"
   ```

   - Read "Current Focus" section for context from prior sessions
   - If another workflow is active, warn user

3. **Verify documentation exists** (informational only):

   ```bash
   ls .docs/spec.md .docs/architecture.md 2>/dev/null
   ```

   - If missing: Note it, agents will handle gracefully

4. **Create .tdd/ directory if needed**:
   ```bash
   mkdir -p .tdd
   ```

## Workflow Phases

```
INIT → EXPLORE → PLAN → DESIGN_TESTS → TEST_DESIGN_REVIEW → WRITE_TESTS →
VERIFY_FAIL → IMPLEMENT → VERIFY_PASS → REVIEW → [FIX if needed] → COMMIT
```

## Phase Definitions

| Phase              | Agent     | Success Criteria                                    |
| ------------------ | --------- | --------------------------------------------------- |
| INIT               | (self)    | `.tdd/session.md` created with task description     |
| EXPLORE            | architect | `.tdd/exploration.md` contains codebase analysis    |
| PLAN               | architect | `.tdd/plan.md` contains implementation plan         |
| DESIGN_TESTS       | architect | `.tdd/test-designs.md` contains test specifications |
| TEST_DESIGN_REVIEW | architect | Test designs reviewed and approved                  |
| WRITE_TESTS        | coder     | Tests implemented, all FAIL (red)                   |
| VERIFY_FAIL        | coder     | Confirmed tests fail for right reasons              |
| IMPLEMENT          | coder     | Code written, tests PASS (green)                    |
| VERIFY_PASS        | coder     | All tests pass, quality gates pass                  |
| REVIEW             | reviewer  | `.tdd/review-findings.md` created                   |
| FIX                | coder     | All review issues addressed                         |
| COMMIT             | coder     | Changes committed with conventional commit message  |

## Routing Logic

**IMPORTANT**: Use the Task tool with `subagent_type` parameter to spawn agents. Execute each phase AUTOMATICALLY without asking permission.

### INIT Phase

```
1. Create .tdd/session.md with task description
2. Update phase to EXPLORE
3. IMMEDIATELY spawn architect agent (no permission needed)
```

Use Task tool:

```
subagent_type: "architect"
description: "Explore codebase for TDD task"
prompt: "EXPLORE phase: Explore the codebase for this task: [task description].

Read .docs/spec.md, .docs/architecture.md, .docs/patterns/index.md first.
Write findings to .tdd/exploration.md.
Update .tdd/session.md when complete."
```

### EXPLORE Phase Complete → PLAN Phase

When architect completes exploration, AUTOMATICALLY spawn architect again for planning:

```
subagent_type: "architect"
description: "Create implementation plan"
prompt: "PLAN phase: Read .tdd/exploration.md and create detailed implementation plan.

Write plan to .tdd/plan.md.
Update .tdd/session.md when complete."
```

### PLAN Phase Complete → DESIGN_TESTS Phase

AUTOMATICALLY spawn architect for test design:

```
subagent_type: "architect"
description: "Design test specifications"
prompt: "DESIGN_TESTS phase: Read .tdd/plan.md and design test specifications.

Write test designs to .tdd/test-designs.md using the required format.
Update .tdd/session.md when complete."
```

### DESIGN_TESTS Phase Complete → TEST_DESIGN_REVIEW Phase

AUTOMATICALLY spawn architect to review test designs:

```
subagent_type: "architect"
description: "Review test designs"
prompt: "TEST_DESIGN_REVIEW phase: Review your test designs in .tdd/test-designs.md.

Check for:
- Completeness: Do tests cover all edge cases?
- Clarity: Are test specifications unambiguous?
- Correctness: Do assertions match expected behavior?
- Coverage: Are all requirements from .tdd/plan.md tested?

If issues found, update .tdd/test-designs.md.
Update .tdd/session.md when complete."
```

### TEST_DESIGN_REVIEW Phase Complete → WRITE_TESTS Phase

AUTOMATICALLY spawn coder for test implementation:

```
subagent_type: "coder"
description: "Implement tests (red)"
prompt: "WRITE_TESTS phase: Read .tdd/test-designs.md and implement tests.

Implement tests exactly as specified. They should FAIL (red).
Update .tdd/session.md when complete."
```

### WRITE_TESTS Phase Complete → IMPLEMENT Phase

AUTOMATICALLY spawn coder for implementation:

```
subagent_type: "coder"
description: "Implement code (green)"
prompt: "IMPLEMENT phase: Read .tdd/test-designs.md and .tdd/plan.md.

Write code to make tests pass (green).
Run quality gates (npm run test, lint, type-check).
Update .tdd/session.md when complete."
```

### IMPLEMENT Phase Complete → REVIEW Phase

AUTOMATICALLY spawn reviewer:

```
subagent_type: "reviewer"
description: "Review implementation"
prompt: "REVIEW phase: Review the implementation.

Read .tdd/plan.md, .docs/spec.md, .docs/patterns/index.md.
Write findings to .tdd/review-findings.md.
Update .tdd/session.md when complete."
```

### REVIEW Phase Complete → FIX or COMMIT

Read `.tdd/review-findings.md`:

- If critical issues found: AUTOMATICALLY spawn coder to fix
- If no critical issues: AUTOMATICALLY spawn coder to commit

```
# If fixes needed:
subagent_type: "coder"
description: "Fix review issues"
prompt: "FIX phase: Read .tdd/review-findings.md and fix all issues.

Address all critical and important issues.
Update .tdd/session.md when complete."

# If ready to commit:
subagent_type: "coder"
description: "Commit changes"
prompt: "COMMIT phase: Create conventional commit for this work.

Run git status, git diff, git log to understand changes.
Create commit with Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
Update .tdd/session.md when complete."
```

### Handling Stuck/Troubleshooting

If coder reports STUCK, AUTOMATICALLY spawn troubleshooter:

```
subagent_type: "troubleshooter"
description: "Diagnose root cause"
prompt: "TROUBLESHOOT: Coder is stuck. Diagnose root cause.

Review .tdd/plan.md and recent work.
Write findings to .tdd/troubleshooter-report.md.
Recommend next action."
```

## Session State Format

`.tdd/session.md` template (ephemeral - deleted after commit):

```markdown
# TDD Session

## Task

[Description from /tdd invocation]

## Current Phase

[EXPLORE | PLAN | DESIGN_TESTS | ...]

## Phase History

- [timestamp] INIT: Started task "[description]"
- [timestamp] EXPLORE: Completed. Found [summary].
- ...

## Key Decisions

- [Decision 1]
- [Decision 2]

## Documentation Used

- .docs/spec.md: [sections referenced]
- .docs/architecture.md: [sections referenced]
- .docs/patterns/index.md: [patterns applied]

## Files Touched

- [path/to/file.ts] (created | modified)

## Blockers

- [Any issues preventing progress]

## Review Cycles

Count: [0-2]

## Documentation Recommendations

- [ ] Pattern to add: [description]
- [ ] Decision to record: [description]
```

**Note**: `.tdd/session.md` is workflow-specific ephemeral state. Long-term project status lives in `.docs/current-task.md` (shared with Roo workflow).

## Context Preservation

You are a LIGHTWEIGHT ROUTER. Do NOT:

- Read implementation files directly
- Accumulate detailed code knowledge
- Make implementation decisions
- Second-guess agent outputs

Your context should contain:

- Task description
- Current phase
- Phase transition history (1-2 sentences per phase)
- Agent handoff summaries

If context exceeds ~50% utilization, summarize phase history and continue.

## Starting New Workflow

When invoked with a task:

```
/tdd Implement user authentication with JWT tokens
```

1. Update `.docs/current-task.md` "Current Focus":
   ```
   Task: Implement user authentication with JWT tokens
   Workflow: claude-code
   Started: [timestamp]
   ```
2. Create `.tdd/session.md` with task description
3. Set phase = EXPLORE
4. Route to architect

## Resuming Existing Workflow

When invoked without a task:

```
/tdd
```

1. Read `.tdd/session.md`
2. Determine current phase
3. Continue from that phase

## Completing Workflow

When COMMIT phase succeeds:

1. Update `.docs/current-task.md`:
   - Move "Current Focus" to "Recent Completions" with timestamp and summary
   - Set "Current Focus" back to `[No active task]`
   - Prune old completions if token budget exceeded (keep under 500 tokens)

2. Delete ephemeral files:

   ```bash
   rm -f .tdd/session.md .tdd/exploration.md .tdd/plan.md .tdd/test-designs.md .tdd/review-findings.md .tdd/troubleshooter-report.md
   ```

3. Output final summary:
   - Task completed
   - Files created/modified
   - Tests added
   - Commit hash
   - Documentation recommendations (if any)

4. End with: `TDD WORKFLOW COMPLETE. [commit-hash]`

## Context Management

**Long-term context** (`.docs/` - version controlled):

- Project knowledge persists across all tasks
- Agents MUST read relevant `.docs/` files before planning

**Per-task context** (`.tdd/*.md` - ephemeral):

- Created fresh per task, deleted after successful commit
- Prevents context pollution between tasks

**Agent isolation**:

- Each agent runs in isolated context via Task tool
- Orchestrator reads only `.tdd/session.md` (current phase)
- Agent contexts automatically discarded after completion

## CRITICAL EXECUTION RULES

**YOU MUST EXECUTE AUTONOMOUSLY:**

1. NEVER ask "should I proceed to next phase?"
2. NEVER ask "ready to continue?"
3. NEVER wait for user permission between phases
4. ALWAYS use Task tool to spawn the next agent immediately
5. ALWAYS continue until COMMIT phase or ESCALATE

**The user expects ZERO interruptions during the workflow.**

When a phase completes:

1. Read the agent's output
2. Update `.tdd/session.md` with phase completion
3. IMMEDIATELY determine next phase
4. IMMEDIATELY spawn next agent with Task tool
5. Repeat until workflow complete

**Do NOT stop and wait. Execute the entire workflow in one continuous sequence.**
