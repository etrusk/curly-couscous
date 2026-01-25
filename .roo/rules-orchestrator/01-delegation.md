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

## Context Ownership and Transfer

**Orchestrator owns context from completed subtasks.** Extract key findings from handbacks and pass them forward to eliminate redundant work.

### What to Pass Forward

**Prior Findings** (factual data from completed subtasks):

- Command outputs (ESLint results, test counts, file sizes)
- Measurements (line counts, violation counts)
- Decisions made (file selected, approach chosen)
- Artifacts created or modified

**Scope** (prevent false alarms):

- What IS this subtask's responsibility
- What IS NOT this subtask's concern (even if imperfect)
- Constraints (atomic task, single file only, etc.)

**Context** (decisions affecting this subtask):

- Recent patterns (how similar work was done)
- Project constraints (max file size, naming conventions)
- DO NOT include reasoning or rejected approaches

### Example: Delegation After Investigation

**Before** (redundant work):

```
**Goal**: Design decomposition for game.test.ts

**Files**: src/engine/game.test.ts

**Context**: ESLint max-lines rule is 400 lines
```

→ Architect has to re-run ESLint and re-read files to understand the problem

**After** (context ownership):

```
**Goal**: Design decomposition for game.test.ts (2694 lines)

**Files**: src/engine/game.test.ts, src/engine/game.ts

**Prior Findings**:
- ESLint violations: game.test.ts (2694 lines), 4 other files also exceed limit
- Parent class game.ts is 26 lines (compliant)

**Scope**: This is an atomic task. Decompose game.test.ts only. Other violations are out of scope.

**Context**: Recent gameStore decomposed into 5 focused modules (constants, helpers, selectors, types, actions)

**Success Criteria**: Propose decomposition plan with each resulting file under 400 lines
```

→ Architect has all information needed without re-running commands or re-reading files

## Mode Selection

- **Architect**: Design decisions, tradeoff analysis, planning docs, **test design**
- **Code**: Implementation, writing tests from approved designs, fixes, **visual verification**
- **Ask**: Review, explanation, critique (read-only)
- **Debug**: Root cause analysis, systematic troubleshooting, **visual debugging** (expensive specialist—call when Code is stuck)
  - Route when tests fail after 2+ Code attempts
  - Route when root cause is unclear
  - Route before human escalation for technical issues
  - ⚠️ Debug has strict 10-exchange limit — see rules-debug

## Completion Requirements

Every `attempt_completion` MUST include:

1. What was done (one sentence)
2. Files modified (list)
3. Context health: ✅ Clean | ⚠️ Degraded — [reason]

When a subtask reports "⚠️ Degraded":
→ Do NOT extend that subtask
→ Create NEW subtask with the summary as starting context

## Human Escalation Protocol

When Code mode returns with `⚠️ Degraded` status:

1. **Do NOT** create another Code subtask for the same problem
2. **Do NOT** attempt to solve it yourself
3. **DO** use `ask_followup_question` to present the situation to the human:

```
Code mode hit a context limit while working on [task].

**Summary from Code mode:**
[Paste the "What's Failing" and "Current Hypothesis" sections]

**Attempts made:**
[Paste the attempts list]

**Options:**
1. Start fresh Code task with this context summary
2. Reassign to Architect for design review
3. Provide guidance and retry
4. Defer this issue

How would you like to proceed?
```

4. Wait for human response before taking any action
5. Execute human's chosen option

### Detecting Stuck Subtasks (Proactive)

If you observe a Code subtask:

- Reporting "trying another approach" 2+ times in status updates
- On exchange 15+ without test state improvement
- Editing same file repeatedly

Use `ask_followup_question` to check in with human:

```
Code mode is at [N] exchanges on [task]. Current state: [brief].
Should it continue, or would you like to intervene?
```

## Final Step: Workflow Completion

Before completing ANY task, delegate **Workflow Steps 10-12** to Code mode (see `01-workflow.md`):

1. **Step 10 (SYNC DOCS)** via Code: Delegate doc verification and updates
2. **Step 11 (COMMIT)** via Code: Delegate git staging and commit operations
3. **Step 12 (PUSH)** via Code: Delegate git push operation

🛑 **MANDATORY**: Do NOT use `attempt_completion` until Code mode confirms changes are committed and pushed

**Exception**: If explicitly instructed not to commit/push, note this in handback with reason
