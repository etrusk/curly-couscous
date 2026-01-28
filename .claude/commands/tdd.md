---
name: tdd
description: Execute full TDD workflow for a feature or bugfix. Orchestrates all phases automatically.
---

# TDD Workflow Orchestrator

You are a LIGHTWEIGHT ROUTER orchestrating Test-Driven Development. Execute the workflow COMPLETELY AUTONOMOUSLY—NEVER ask permission between phases.

**Your job:**

1. Read `.tdd/session.md` for current state
2. Spawn appropriate agent via Task tool
3. Update `.tdd/session.md` after each phase
4. Continue to next phase IMMEDIATELY

**CRITICAL**: Use Task tool to spawn agents. NEVER ask "should I proceed?" or "ready to continue?"—execute the next phase automatically.

Do NOT read implementation files directly.

---

## Browser Automation (When Applicable)

For tasks involving UI implementation or browser-based debugging, use **Claude in Chrome** integration:

**When to use browser automation:**

- Implementing/modifying visual components (buttons, forms, game UI)
- Debugging rendering issues, CSS problems, or interaction bugs
- Verifying browser console errors and DOM state
- Recording workflows as GIFs for documentation

**How to integrate:**

1. During IMPLEMENT: After code changes, verify in browser (navigate, test interactions)
2. During VERIFY_PASS: Run browser-based integration tests if applicable
3. During FIX: Read console errors and DOM state to diagnose issues
4. During troubleshooting: Live debugging with browser context

**Key capabilities:**

- Navigate pages, click elements, fill forms
- Read console errors and network requests
- Inspect DOM state and accessibility tree
- Record sessions as GIFs

**Safety note:** Browser automation requires explicit user permission for sensitive actions (form submissions, downloads, account operations). Agents should request approval when needed.

**Availability:** Requires Claude in Chrome extension (beta, Google Chrome only).

---

## Pre-Workflow Validation

Before starting ANY new workflow:

1. **Check existing session**: `cat .tdd/session.md 2>/dev/null || echo "NO_SESSION"`
   - Session exists with incomplete phase → Resume from current phase
   - No session → Create new session

2. **Check project status**: `cat .docs/current-task.md 2>/dev/null || echo "NO_CURRENT_TASK"`
   - Read "Current Focus" for context from prior sessions
   - If another workflow active, warn user

3. **Verify documentation** (informational only): `ls .docs/spec.md .docs/architecture.md 2>/dev/null`
   - If missing: Note it, agents handle gracefully

4. **Create .tdd/ directory**: `mkdir -p .tdd`

---

## Workflow Phases

```
INIT → EXPLORE → PLAN → DESIGN_TESTS → TEST_DESIGN_REVIEW → WRITE_TESTS →
VERIFY_FAIL → IMPLEMENT → VERIFY_PASS → REVIEW → [FIX if needed] → SYNC_DOCS → COMMIT
```

---

## Agent Summary Format

After EVERY agent completion, output:

```
✓ [AGENT_TYPE] completed [PHASE]
  → [2-4 bullet points of key actions/findings]
  → Next: [NEXT_PHASE]
```

---

## Phase Routing

| Phase              | Agent     | Task Prompt Template                                                                                                                   | Route To               |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| INIT               | (self)    | Create `.tdd/session.md` with task, set phase=EXPLORE                                                                                  | EXPLORE                |
| EXPLORE            | architect | Read `.docs/{spec,architecture,patterns/index}.md`. Write findings to `.tdd/exploration.md`. Update session.                           | PLAN                   |
| PLAN               | architect | Read `.tdd/exploration.md`. Create implementation plan in `.tdd/plan.md`. Update session.                                              | DESIGN_TESTS           |
| DESIGN_TESTS       | architect | Read `.tdd/plan.md`. Design test specs in `.tdd/test-designs.md`. Update session.                                                      | TEST_DESIGN_REVIEW     |
| TEST_DESIGN_REVIEW | architect | Review `.tdd/test-designs.md` for completeness, clarity, correctness, coverage. Fix if needed. Update session.                         | WRITE_TESTS            |
| WRITE_TESTS        | coder     | Read `.tdd/test-designs.md`. Implement tests (should FAIL). Update session.                                                            | IMPLEMENT              |
| IMPLEMENT          | coder     | Read `.tdd/{test-designs,plan}.md`. Write code to pass tests. Run quality gates. **If UI changes:** verify in browser. Update session. | REVIEW                 |
| REVIEW             | reviewer  | Read `.tdd/plan.md`, `.docs/{spec,patterns/index}.md`. Write findings to `.tdd/review-findings.md`. Update session.                    | FIX or SYNC_DOCS       |
| FIX                | coder     | Read `.tdd/review-findings.md`. Fix all critical/important issues. **Use browser debugging if UI-related.** Update session.            | REVIEW (re-review)     |
| SYNC_DOCS          | architect | See SYNC_DOCS section below. Update session.                                                                                           | COMMIT                 |
| COMMIT             | coder     | Run `git status/diff/log`. Commit ALL changes with Co-Authored-By trailer. Update session.                                             | Cleanup and completion |

**Stuck/Troubleshooting**: If coder reports STUCK, spawn troubleshooter agent for root cause diagnosis. For UI bugs, troubleshooter should use browser automation to read console errors and DOM state.

---

## INIT Phase

```
1. Create .tdd/session.md with task description
2. Update phase to EXPLORE
3. Output summary to user
4. IMMEDIATELY spawn architect agent (no permission needed)
```

**Summary**:

```
✓ Orchestrator initialized TDD workflow
  → Task: [task description]
  → Created .tdd/session.md
  → Next: EXPLORE
```

**Task tool**:

```
subagent_type: "architect"
description: "Explore codebase for TDD task"
prompt: "EXPLORE phase: Explore the codebase for this task: [task description].

Read .docs/spec.md, .docs/architecture.md, .docs/patterns/index.md first.
Write findings to .tdd/exploration.md.
Update .tdd/session.md when complete."
```

---

## Phase Transitions

For each subsequent phase completion:

1. **Output agent summary** (see format above)
2. **Read phase output** (`.tdd/exploration.md`, `.tdd/plan.md`, etc.)
3. **Route per table above** (AUTOMATICALLY spawn next agent)

**Example REVIEW → FIX/SYNC_DOCS routing**:

- Read `.tdd/review-findings.md`
- If critical issues found → Spawn coder for FIX (returns to REVIEW after)
- If no critical issues → Spawn architect for SYNC_DOCS

---

## SYNC_DOCS Phase (Mandatory)

**AUTOMATICALLY spawn architect**:

```
subagent_type: "architect"
description: "Sync documentation with implementation"
prompt: "SYNC_DOCS phase: Synchronize documentation with implementation.

**Step 11a: Spec Alignment Check**

Read and compare:
1. Current implementation (files in .tdd/session.md 'Files Touched')
2. .docs/spec.md (original specification)
3. .docs/current-task.md 'Current Focus' (task context)
4. .tdd/plan.md (planned approach)
5. .tdd/review-findings.md (review notes)

Answer:
- Did human feedback change requirements during implementation?
- Were features implemented differently than originally designed?
- Did implementation reveal spec incompleteness (missing edge cases, unclear rules)?
- Were behavioral details clarified/added during development?
- Did architectural decisions deviate from documented spec?

**If YES to any** → proceed to Step 11b
**If NO to all** → document 'Verified spec.md alignment—no updates needed' → Update phase to complete

**Step 11b: Update Documents (if needed)**

| Change Type                               | Target File                  | Action              |
| ----------------------------------------- | ---------------------------- | ------------------- |
| Behavioral changes, new rules             | .docs/spec.md                | Update sections     |
| Design deviations, architectural changes  | .docs/architecture.md        | Document + rationale|
| New patterns discovered                   | .docs/patterns/index.md      | Add pattern         |
| Significant decisions                     | .docs/decisions/index.md     | Add ADR             |
| Failure patterns, lessons learned         | .docs/lessons-learned.md     | Append finding      |

**Substantial changes?** → Note in .tdd/session.md for human review before commit.

**Step 11c: Session State Update**

Update .docs/current-task.md:
- Prepare completion note for 'Recent Completions' (do NOT move yet - orchestrator does this at COMMIT)
- Verify context budget (file should stay under 500 tokens)

**Step 11d: Lessons Learned (if applicable)**

If implementation revealed spec problems, append to .docs/lessons-learned.md.

Write summary to .tdd/session.md under 'Documentation Updates'.
Update .tdd/session.md phase to complete."
```

---

## COMMIT Phase → Completion

When coder completes COMMIT:

1. **Output agent summary**:

   ```
   ✓ Coder completed COMMIT
     → Committed [N] files
     → Commit message: [message]
     → Commit hash: [hash]
     → Next: Cleanup and final summary
   ```

2. **Update `.docs/current-task.md`**:
   - Move "Current Focus" to "Recent Completions" with timestamp and summary
   - Set "Current Focus" to `[No active task]`
   - Prune old completions if token budget exceeded (keep under 500 tokens)

3. **Delete ephemeral files**:

   ```bash
   rm -f .tdd/session.md .tdd/exploration.md .tdd/plan.md .tdd/test-designs.md .tdd/review-findings.md .tdd/troubleshooter-report.md
   ```

   **Note**: Do NOT delete `.docs/` files—version-controlled project knowledge.

4. **Output final workflow summary**:

   ```
   ═══════════════════════════════════════
   TDD WORKFLOW COMPLETE
   ═══════════════════════════════════════

   Task: [task description]
   Commit: [commit-hash]

   Implementation:
   → Files created: [list]
   → Files modified: [list]
   → Tests added: [count] tests in [files]

   Documentation:
   → [files updated or "No documentation updates needed"]

   Quality Gates:
   ✓ Tests pass
   ✓ Lint pass
   ✓ Type check pass
   ✓ Review approved
   ═══════════════════════════════════════
   ```

---

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

## Key Decisions

- [Decision 1]

## Documentation Used

- .docs/spec.md: [sections referenced]

## Files Touched

- [path/to/file.ts] (created | modified)

## Browser Verification

[If applicable: browser testing performed, interactions verified, console errors checked, GIF recorded]

## Blockers

- [Any issues preventing progress]

## Review Cycles

Count: [0-2]

## Documentation Updates

[SYNC_DOCS phase findings]

## Documentation Recommendations

- [ ] Pattern to add: [description]
```

**Note**: `.tdd/session.md` is workflow-specific ephemeral state. Long-term project status lives in `.docs/current-task.md` (shared with Roo workflow).

---

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

---

## Starting/Resuming Workflow

**New workflow** (`/tdd Implement user authentication`):

1. Update `.docs/current-task.md` "Current Focus" with task + workflow + timestamp
2. Create `.tdd/session.md` with task description
3. Set phase = EXPLORE
4. Route to architect

**Resume workflow** (`/tdd`):

1. Read `.tdd/session.md`
2. Determine current phase
3. Continue from that phase

---

## CRITICAL EXECUTION RULES

**YOU MUST EXECUTE AUTONOMOUSLY:**

1. NEVER ask "should I proceed to next phase?"
2. NEVER ask "ready to continue?"
3. NEVER wait for user permission between phases
4. ALWAYS use Task tool to spawn next agent immediately
5. ALWAYS continue until COMMIT phase or ESCALATE

**The user expects ZERO interruptions during the workflow.**

When a phase completes:

1. Read agent output
2. Update `.tdd/session.md` with phase completion
3. IMMEDIATELY determine next phase
4. IMMEDIATELY spawn next agent with Task tool
5. Repeat until workflow complete

**Do NOT stop and wait. Execute the entire workflow in one continuous sequence.**
