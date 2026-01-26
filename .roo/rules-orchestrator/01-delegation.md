# Delegation Rules

## Subtask Message Template

Every subtask MUST use this format:

```
**Goal**: [One sentence — what this subtask must accomplish]

**Files**: [Explicit paths — e.g., src/auth/login.ts, src/auth/login.test.ts]

**Prior Findings**: [Factual data from completed subtasks — command outputs, measurements, decisions]

**Scope**: [What IS and IS NOT this subtask's concern — prevent false alarms]

**Context**: [2-3 bullets max — only decisions affecting THIS subtask]

**Success Criteria**: [Specific, testable conditions for completion]

**Budget**: Complete within ~20 exchanges. Report degradation if hit.

**Handback**: When complete, use `attempt_completion` with:
- **Done**: [One sentence summary]
- **Files**: [List of files read/modified]
- **Health**: ✅ Clean | ⚠️ Degraded — [reason if applicable]
- **Next**: [Suggested next step for Orchestrator]
```

## DO NOT Include in Subtasks

- Conversation history or reasoning from prior subtasks
- Alternatives already rejected
- Background context the subtask doesn't need
- Speculative "might also need" files

## Context Ownership

**Orchestrator owns context from completed subtasks.** Extract key findings from handbacks and pass them forward.

**Pass Forward:**

- Command outputs, measurements, decisions made
- Scope boundaries (what IS/IS NOT this subtask's responsibility)
- Recent patterns (2-3 bullets max)

## Mode Selection

- **Architect**: Design, tradeoffs, planning, test design
- **Code**: Implementation, writing tests, fixes, visual verification
- **Ask**: Review, critique (read-only)
- **Debug**: Root cause analysis when Code is stuck (10-exchange limit)

## Completion Requirements

Every `attempt_completion` MUST include:

1. What was done (one sentence)
2. Files modified (list)
3. Context health: ✅ Clean | ⚠️ Degraded — [reason]

When subtask reports "⚠️ Degraded":
→ Do NOT extend that subtask
→ Create NEW subtask with the summary as starting context

## Human Escalation Protocol

When Code mode returns with `⚠️ Degraded`:

1. Do NOT create another Code subtask for the same problem
2. Use `ask_followup_question` presenting options:
   - Start fresh Code task with context summary
   - Reassign to Architect for design review
   - Provide guidance and retry
   - Defer this issue
3. Wait for human response before taking action

## Final Step: Workflow Completion

Before completing ANY task, delegate **Steps 11-12** to Code mode:

1. **Step 11 (SYNC DOCS)**: Doc verification and updates
2. **Step 12 (COMMIT & PUSH)**: Git operations

🛑 Do NOT use `attempt_completion` until Code confirms changes are committed and pushed.
