---
name: tdd
description: Execute full TDD workflow for a feature or bugfix. Orchestrates all phases automatically.
version: 2.0.0
---

# TDD Workflow Orchestrator

Your goal is to orchestrate Test-Driven Development by routing between specialized agents. This lightweight routing approach prevents context accumulation and keeps each agent focused on its specific expertise. Execute the workflow COMPLETELY AUTONOMOUSLY—proceed through phases automatically without asking permission.

**Your job:**

1. Read `.tdd/session.md` for current state
2. Spawn appropriate agent via Task tool
3. Update `.tdd/session.md` "Current Phase" field when transitioning phases
4. Continue to next phase IMMEDIATELY

**Note**: Agents update session.md with their phase results and findings. Orchestrator updates the "Current Phase" field when routing to next phase.

**CRITICAL**: Use Task tool to spawn agents. Execute the next phase automatically upon completion of the previous phase.

**Read implementation files only through agent outputs.** This keeps your context focused on orchestration rather than accumulating implementation details.

---

## Request Clarification (MANDATORY for new workflows)

**For NEW workflows only**, analyze and clarify the request BEFORE starting INIT:

**Analyze:**

- What/why/where/scope/complexity
- Missing: acceptance criteria, constraints, edge cases
- Alternatives: simpler approaches, phased implementation, architectural concerns
- Examples: "Add dark mode" → too broad, suggest phase 1 (toggle) vs phase 2 (styling). "Fix bug" → which bug, reproduction steps?

**Present to human:**

```
Understanding: [what needs to be done, scope, complexity]
Questions: [ambiguities requiring answers]
Alternatives: [if multiple valid approaches exist]
Concerns: [architectural/scope issues if any]
```

**Wait for confirmation.** After receiving confirmation, proceed to INIT phase to create `.tdd/session.md` with:

```markdown
## Confirmed Scope

[2-4 sentence summary]

## Acceptance Criteria

- [criterion 1]
- [criterion 2]
```

**Skip clarification when:**

- Resuming existing session (session.md exists)
- Human provided detailed spec with clear acceptance criteria
- Task is trivial: single-line bug fix, typo correction, adding missing import, or formatting-only change

If skipping, document reason in session.md and proceed to INIT.

---

## Browser Automation (MANDATORY for UI Tasks)

**CRITICAL**: For ANY task involving UI implementation or browser-based debugging, agents MUST use **Claude in Chrome** integration for AUTOMATED verification.

**Automated browser verification is required for all UI tasks.** Agents mark implementation complete only after successfully verifying behavior in the browser and documenting findings. Human verification is ONLY required if automated verification fails or browser automation is unavailable.

**Agents MUST use browser automation for:**

- ANY implementation/modification of visual components (buttons, forms, game UI)
- ANY debugging of rendering issues, CSS problems, or interaction bugs
- ALL browser console error verification and DOM state inspection
- Recording workflows as GIFs for documentation when:
  - Implementing multi-step user workflows (e.g., form submission flow)
  - Demonstrating complex interactions (e.g., drag-and-drop, animations)
  - Documenting a bug fix that required browser debugging
  - Skip GIF for simple single-interaction changes or non-visual changes

**Automated browser verification (agents MUST perform):**

1. **During IMPLEMENT (coder agent)**: MUST ALWAYS perform after writing ANY UI code:
   - **Assume dev server is running**: The development server is assumed to be running at `http://localhost:5173`
   - **Navigate to relevant page**:
     - Check `.tdd/plan.md` for mentioned routes/pages
     - If implementing new component, navigate to page that uses it
     - If modifying existing page, navigate to that page's route
     - Default fallback: `http://localhost:5173/` (root page)
     - Document the URL navigated to in Browser Verification section
   - **Verify component renders without console errors**: Use browser console inspection
   - **Test interactions relevant to changes**:
     - If added button: Click it and verify expected action occurs
     - If added form field: Enter text and verify it appears/validates correctly
     - If added toggle/checkbox: Click it and verify state changes
     - Check browser console shows zero errors after interactions
     - Document which interactions were tested in Browser Verification section
   - **Document findings** in `.tdd/session.md` under "Browser Verification"
   - **Always complete browser verification** before marking implementation phase as done

2. **During FIX (coder agent)**: MUST be performed for ALL UI-related bugs:
   - Read browser console for errors
   - Inspect DOM state and element properties
   - Test problematic interactions
   - Verify fixes resolve console errors
   - **Always use browser verification for UI bug fixes** to confirm the issue is resolved

3. **During troubleshooting**: MUST use live debugging with browser context for ANY UI-related issues

**Browser availability check (agents MUST perform):**

When browser verification is required, agents MUST:

1. **Always attempt** to use browser tools (start with `tabs_context_mcp`)
2. **If browser automation succeeds**: Document automated verification results in session.md, proceed to next phase
3. **If browser tools fail or error**:
   - **STOP immediately** - do not proceed with implementation phase
   - **Document as BLOCKER** in `.tdd/session.md` under "Blockers" section:
     ```markdown
     ## Blockers

     - Browser automation failed: [exact error message from tool]
     - Cannot complete automated verification for UI changes
     ```
   - **Report to orchestrator**: Include actual error message in phase output
   - **Orchestrator MUST escalate** to HUMAN_VERIFY phase immediately with manual verification guidance
   - Do NOT attempt to work around browser tool failures - escalation to human is required

**Human verification (HUMAN_VERIFY phase - CONDITIONAL):**

- **Only triggered if**: Automated browser verification fails OR browser automation is unavailable
- Orchestrator provides specific manual test guidance for the user
- User verifies end-to-end functionality, visual appearance, edge cases
- User confirms implementation meets requirements
- **If automated verification succeeded**: Skip HUMAN_VERIFY entirely and proceed to SYNC_DOCS

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
   - If another workflow active (Current Focus is not "[No active task]"):
     - Output: `⚠️  Another workflow is active: [task from current-task.md]. Starting a new workflow may cause conflicts.`
     - Ask: `Proceed anyway? (yes/no)`
     - If yes → Continue with new workflow (will overwrite Current Focus)
     - If no → Abort and output: `Use '/tdd' without arguments to resume the existing workflow.`

3. **Verify documentation** (informational only): `ls .docs/spec.md .docs/architecture.md 2>/dev/null`
   - If missing: Note in output. Agents will handle gracefully by:
     - Noting in `.tdd/exploration.md`: "Missing [file] - proceeding with codebase exploration only"
     - Relying on code patterns and existing implementations for guidance
     - Considering documentation creation recommendation in session.md

4. **Create .tdd/ directory**: `mkdir -p .tdd`

---

## Workflow Phases

```
INIT → EXPLORE → PLAN → DESIGN_TESTS → TEST_DESIGN_REVIEW → WRITE_TESTS → IMPLEMENT → REVIEW → [FIX if needed] → [HUMAN_VERIFY if automated verification failed] → SYNC_DOCS → COMMIT
```

**Note**: Test verification is handled within phases (WRITE_TESTS verifies tests fail, IMPLEMENT verifies tests pass), not as separate phases.

**Note**: HUMAN_VERIFY is only triggered if automated browser verification fails or is unavailable. Successful automated verification proceeds directly to SYNC_DOCS.

---

## Agent Summary Format

After EVERY agent completion, output:

```
✓ [AGENT_TYPE] completed [PHASE]
  → [2-4 bullet points of key actions/findings]
  → Next: [NEXT_PHASE]
```

---

## Agent Communication Guidelines

**All agents should express uncertainty appropriately:**

When findings are based on direct observation (reading code, test results, documentation):

- State findings directly: "The component uses Zustand for state management"
- Reference specific locations: "See `src/stores/authStore.ts:45`"

When inferring or deducing from incomplete information:

- Use qualifying language: "This appears to use X pattern based on Y"
- Be explicit about confidence: "The code likely handles this case, though it's not explicitly tested"
- Note what would increase certainty: "Confirming this would require checking Z"

When information is unavailable or ambiguous:

- State the gap clearly: "The acceptance criteria don't specify behavior for edge case X"
- Suggest how to resolve: "Recommend clarifying with human" or "Documented assumption in session.md"
- Distinguish between verified facts and assumptions

**Agents should document:**

- What they observed directly (code, tests, docs)
- What they inferred and why
- What remains uncertain or requires clarification
- Assumptions made when proceeding despite uncertainty

This calibrated communication helps the orchestrator make better routing decisions and alerts humans to areas needing clarification.

---

## Phase Routing

| Phase              | Agent     | Task Prompt Template                                                                                                                                                                                                                                                                                        | Route To                                       |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| INIT               | (self)    | Create `.tdd/session.md` with task, set phase=EXPLORE                                                                                                                                                                                                                                                       | EXPLORE                                        |
| EXPLORE            | architect | Read `.docs/{spec,architecture,patterns/index,lessons-learned/index}.md`. Write findings to `.tdd/exploration.md`. Update session.                                                                                                                                                                          | PLAN                                           |
| PLAN               | architect | Read `.tdd/exploration.md`. Create implementation plan in `.tdd/plan.md`. Update session.                                                                                                                                                                                                                   | DESIGN_TESTS                                   |
| DESIGN_TESTS       | architect | Read `.tdd/plan.md`. Design test specs in `.tdd/test-designs.md`. Update session.                                                                                                                                                                                                                           | TEST_DESIGN_REVIEW                             |
| TEST_DESIGN_REVIEW | architect | Review `.tdd/test-designs.md` for completeness, clarity, correctness, coverage. Fix if any issues found (missing test cases for acceptance criteria, unclear descriptions, missing edge cases, pattern violations). Update session.                                                                         | WRITE_TESTS                                    |
| WRITE_TESTS        | coder     | Read `.tdd/test-designs.md`. Implement tests. Run tests and verify they FAIL (red phase). Update session.                                                                                                                                                                                                   | IMPLEMENT                                      |
| IMPLEMENT          | coder     | Read `.tdd/{test-designs,plan}.md`. Write code to pass tests. Run tests and verify they PASS (green phase). Run quality gates (lint, type-check). **MUST verify in browser for ANY UI changes (assumes dev server running on :5173). If browser tools fail, document as BLOCKER and stop.** Update session. | REVIEW (or escalate if BLOCKED)                |
| REVIEW             | reviewer  | Read `.tdd/plan.md`, `.docs/{spec,patterns/index}.md`. Write findings to `.tdd/review-findings.md`. Update session.                                                                                                                                                                                         | FIX or SYNC_DOCS or HUMAN_VERIFY (conditional) |
| FIX                | coder     | Read `.tdd/review-findings.md`. Fix all critical/important issues. **MUST use browser debugging for ANY UI-related issues.** Update session.                                                                                                                                                                | REVIEW (re-review)                             |
| HUMAN_VERIFY       | (self)    | **CONDITIONAL**: Only if automated browser verification failed or unavailable. See HUMAN_VERIFY section below.                                                                                                                                                                                              | SYNC_DOCS or FIX                               |
| SYNC_DOCS          | architect | See SYNC_DOCS section below. Update session.                                                                                                                                                                                                                                                                | COMMIT                                         |
| COMMIT             | coder     | Run `git status/diff/log`. Commit ALL changes with Co-Authored-By trailer. Update session.                                                                                                                                                                                                                  | Cleanup and completion                         |

**Stuck/Troubleshooting**: If coder reports STUCK (documented in session.md Blockers section), spawn troubleshooter agent for root cause diagnosis. For UI bugs, troubleshooter MUST attempt browser automation to read console errors and DOM state. If browser unavailable, report as BLOCKER for orchestrator to escalate.

**Troubleshooting Protocol**:

1. Spawn troubleshooter agent with context from session.md
2. Read troubleshooter output from `.tdd/troubleshooter-report.md`
3. If root cause identified → Spawn coder for FIX with troubleshooter findings
4. If root cause unclear after troubleshooting → ESCALATE to human with full context
5. Maximum 1 troubleshooting cycle per FIX phase

## Decision Criteria

### Critical Issues (REVIEW → FIX routing)

**MUST route to FIX phase if ANY of these found:**

- Tests failing
- TypeScript type errors
- ESLint errors (not warnings)
- Security vulnerabilities
- Violations of spec requirements from `.docs/spec.md`
- Violations of established patterns from `.docs/patterns/index.md`
- Browser console errors (for UI changes)
- Broken functionality

**CAN proceed to SYNC_DOCS (or HUMAN_VERIFY as fallback) if only these found:**

- Code style suggestions (non-blocking)
- Performance optimization opportunities
- Additional test coverage suggestions
- Documentation improvements
- ESLint warnings (not errors)

### Automated Verification Success (REVIEW → SYNC_DOCS routing)

**MUST route directly to SYNC_DOCS if ALL of these true:**

- No critical issues found in REVIEW
- For UI tasks: Automated browser verification completed successfully (documented in session.md Browser Verification section)
- For non-UI tasks: All tests passing and quality gates passed

**MUST route to HUMAN_VERIFY if ANY of these true:**

- Automated browser verification failed (for UI tasks)
- Browser automation unavailable (for UI tasks)
- Complex end-to-end scenarios requiring manual validation
- Human explicitly requested verification

### Substantial Documentation Changes (SYNC_DOCS)

**Require human review before commit:**

- Changing acceptance criteria in `spec.md`
- Modifying architectural decisions in `architecture.md`
- Removing or significantly changing patterns
- Adding new ADRs
- Changing behavioral specifications

**Auto-commit OK:**

- Fixing typos in documentation
- Adding examples to existing sections
- Adding lessons to `lessons-learned/` directory
- Minor clarifications that don't change meaning

### Review Cycle Limit

Maximum 2 FIX → REVIEW cycles allowed per workflow.

If 3rd cycle needed → ESCALATE to human:

```
⚠️  Implementation has gone through 2 review cycles with persistent issues. Manual intervention required.

Issues: [summary from review-findings.md]
```

---

## INIT Phase

```
1. Create .tdd/session.md with task, confirmed scope, acceptance criteria
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

Scope: [from clarification]
Acceptance criteria: [from clarification]

Read .docs/spec.md, .docs/architecture.md, .docs/patterns/index.md, .docs/lessons-learned/index.md first.
Write findings to .tdd/exploration.md.
Update .tdd/session.md when complete."
```

---

## Phase Transitions

For each subsequent phase completion:

1. **Output agent summary** (see format above)
2. **Read phase output** (`.tdd/exploration.md`, `.tdd/plan.md`, etc.)
3. **Route per table above** (AUTOMATICALLY spawn next agent)

**Example REVIEW → FIX/SYNC_DOCS/HUMAN_VERIFY routing**:

- Read `.tdd/review-findings.md`
- If critical issues found → Spawn coder for FIX (returns to REVIEW after)
- If no critical issues AND automated browser verification succeeded (for UI tasks) → Proceed directly to SYNC_DOCS
- If no critical issues BUT automated browser verification failed or unavailable → Proceed to HUMAN_VERIFY

---

## HUMAN_VERIFY Phase (Conditional Quality Gate)

**CONDITIONAL PHASE**: This phase is ONLY triggered when automated browser verification fails or is unavailable. If automated verification succeeds, skip this phase and proceed directly to SYNC_DOCS.

**When triggered**: Automated browser verification failed OR browser automation unavailable OR non-UI task requiring manual validation.

When REVIEW passes (no critical issues) but automated verification could not be completed, PAUSE and request human verification:

```
✓ Reviewer approved implementation
  → All tests passing
  → No critical issues found
  → Automated browser verification: [FAILED | UNAVAILABLE | N/A for non-UI task]
  → Requesting manual verification as fallback

Please manually verify the implementation works as expected.
```

**Provide guidance based on task type:**

For UI changes:

```
The dev server is assumed to be running at http://localhost:5173.

Please verify:
1. Navigate to [URL from plan.md or browser verification section]
2. Test the following interactions: [list specific interactions from plan.md]
3. Check browser console for errors (should be zero)
4. Verify visual appearance matches requirements

Once verified, respond:
- "verified" or "looks good" → Continue to SYNC_DOCS
- "issue: [description]" → Return to FIX phase
```

For bug fixes:

```
Please verify the bug is fixed:
1. Reproduce the original bug using these steps: [steps from plan.md]
2. Confirm the bug no longer occurs
3. Test related functionality to ensure no regressions

Once verified, respond:
- "verified" or "looks good" → Continue to SYNC_DOCS
- "issue: [description]" → Return to FIX phase
```

For new features:

```
Please verify the feature works as expected:
1. Test happy path: [from plan.md and acceptance criteria]
2. Test edge cases: [from plan.md]
3. Verify all acceptance criteria are met

Once verified, respond:
- "verified" or "looks good" → Continue to SYNC_DOCS
- "issue: [description]" → Return to FIX phase
```

**Update `.tdd/session.md`:**

```markdown
## Human Verification

Status: [PENDING | VERIFIED | ISSUES_FOUND]
Tested: [What the human verified]
Issues: [Any problems discovered, if applicable]
```

**After human responds:**

- If verified → Output summary and spawn architect for SYNC_DOCS
- If issues → Document in `.tdd/review-findings.md` and spawn coder for FIX

---

## SYNC_DOCS Phase (Mandatory)

**AUTOMATICALLY spawn architect**:

```
subagent_type: "architect"
description: "Sync documentation with implementation"
prompt: "SYNC_DOCS phase: Synchronize documentation with implementation.

**1. Spec Alignment Check**

Read and compare:
- Current implementation (files in .tdd/session.md 'Files Touched')
- .docs/spec.md (original specification)
- .docs/current-task.md 'Current Focus' (task context)
- .tdd/plan.md (planned approach)
- .tdd/review-findings.md (review notes)

Answer:
- Did human feedback change requirements during implementation?
- Were features implemented differently than originally designed?
- Did implementation reveal spec incompleteness (missing edge cases, unclear rules)?
- Were behavioral details clarified/added during development?
- Did architectural decisions deviate from documented spec?

**If YES to any** → proceed to step 2
**If NO to all** → document 'Verified spec.md alignment—no updates needed' → Skip to step 4

**2. Update Documents (only if misalignment found)**

| Change Type                               | Target File                  | Action              |
| ----------------------------------------- | ---------------------------- | ------------------- |
| Behavioral changes, new rules             | .docs/spec.md                | Update sections     |
| Design deviations, architectural changes  | .docs/architecture.md        | Document + rationale|
| New patterns discovered                   | .docs/patterns/index.md      | Add pattern         |
| Significant decisions                     | .docs/decisions/index.md     | Add ADR             |
| Failure patterns, lessons learned         | .docs/lessons-learned/       | Create lesson file + update index |

**If substantial changes made** (changing acceptance criteria, modifying architectural decisions, removing/changing patterns, adding ADRs):
- Note in .tdd/session.md under 'Documentation Updates': 'SUBSTANTIAL CHANGES - Human review recommended before commit'
- List which files were updated and why

**3. Prepare Completion Summary**

Write completion summary to .tdd/session.md under 'Completion Summary' section:
- Format: 'Completed [task]. [Key changes]. [Tests added]. [Docs updated].'
- Keep concise (1-3 sentences)
- Do NOT modify .docs/current-task.md (orchestrator does this at COMMIT)
- Verify .docs/current-task.md context budget (should stay under 500 tokens total)

**4. Finalize**

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
   - Read completion summary from `.tdd/session.md` "Completion Summary" section
   - Move "Current Focus" to "Recent Completions" with timestamp and completion summary
   - Set "Current Focus" to `[No active task]`
   - Prune old completions if file exceeds 500 tokens (keep most recent 3-5 completions)

3. **Delete ephemeral files**:

   ```bash
   rm -f .tdd/session.md .tdd/exploration.md .tdd/plan.md .tdd/test-designs.md .tdd/review-findings.md .tdd/troubleshooter-report.md
   ```

   **Note**: Do NOT delete `.docs/` files—version-controlled project knowledge.
   **Note**: If any other `.tdd/*.md` files exist not in the above list, they may be orphaned from a previous session. You can safely delete them.

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
   [If UI changes: ✓ Automated browser verification passed]
   [If human verification triggered: ✓ Human verification passed]
   ═══════════════════════════════════════
   ```

---

## Session State Format

`.tdd/session.md` template (ephemeral - deleted after commit):

```markdown
# TDD Session

## Task

[Description from /tdd invocation]

## Confirmed Scope

[2-4 sentences summarizing what was agreed during Request Clarification]

## Acceptance Criteria

- [criterion 1 from clarification phase]
- [criterion 2 from clarification phase]

## Constraints

- [constraint 1 if any]

## Current Phase

[EXPLORE | PLAN | DESIGN_TESTS | ...]

## Phase History

- [timestamp] CLARIFICATION: Analyzed request, confirmed scope
- [timestamp] INIT: Started task "[description]"
- [timestamp] EXPLORE: Completed. Found [summary].

## Key Decisions

- [Decision 1]

## Documentation Used

- .docs/spec.md: [sections referenced]

## Files Touched

- [path/to/file.ts] (created | modified)

## Browser Verification (Automated)

**REQUIRED for ALL UI tasks - agents MUST document this section**

Automation Status: [SUCCESS | FAILED | BLOCKED | NOT_APPLICABLE]
URL tested: [URL navigated to]
Interactions tested: [list of interactions performed]
Console errors: [none | list of errors found]
Visual rendering: [verified correct | issues found: description]
GIF recorded: [yes - multi-step workflow | no - simple change | N/A]

[If SUCCESS: "Automated verification passed - proceeding to SYNC_DOCS"]
[If FAILED: "Automated verification failed: [reason]. Escalating to HUMAN_VERIFY."]
[If BLOCKED: "Browser tools encountered errors: [actual error message]. BLOCKER - stopping implementation and escalating to HUMAN_VERIFY."]
[For non-UI tasks: "NOT_APPLICABLE - no UI changes"]

## Human Verification (Conditional)

**Only populated if HUMAN_VERIFY phase triggered**

Status: [PENDING | VERIFIED | ISSUES_FOUND | SKIPPED]
Reason for human verification: [automated verification failed | browser unavailable | explicit request]
Tested: [What the human verified]
Issues: [Any problems discovered, if applicable]

[If SKIPPED: "Automated browser verification succeeded - human verification not required"]

## Blockers

- [Any issues preventing progress]

## Review Cycles

Count: [0-2]

## Documentation Updates

[SYNC_DOCS phase findings]

## Completion Summary

[One-line summary prepared by architect during SYNC_DOCS, used by orchestrator to update current-task.md]

## Documentation Recommendations

- [ ] Pattern to add: [description]
```

**Note**: `.tdd/session.md` is workflow-specific ephemeral state. Long-term project status lives in `.docs/current-task.md` (shared with Roo workflow).

---

## Context Preservation

As the orchestrator, maintain a lightweight context focused on routing decisions. This prevents token exhaustion and keeps you efficient at phase transitions.

**Keep your context focused on:**

- Task description
- Current phase
- Phase transition history (1-2 sentences per phase)
- Agent handoff summaries

**Delegate to agents:**

- Reading implementation files (architect/coder/reviewer agents handle this)
- Accumulating detailed code knowledge (preserved in agent outputs)
- Making implementation decisions (agents apply their specialized expertise)
- Evaluating agent outputs (trust agent expertise; only escalate on blockers)

- Task description
- Current phase
- Phase transition history (1-2 sentences per phase)
- Agent handoff summaries

If context exceeds 50% utilization (100,000 tokens used), summarize phase history by:

- Condensing detailed agent outputs into one-line summaries
- Removing redundant information
- Preserving key decisions and current state

---

## Workflow Improvement Protocol

The TDD workflow instructions are living documentation that should improve based on empirical evidence of what works and what doesn't.

**When agents encounter repeated issues or blockers:**

1. **Document the failure pattern** in `.tdd/session.md` under "Blockers" section:

   ```markdown
   ## Blockers

   - [Phase] Unclear instructions for [specific scenario]
   - Repeatedly hit issue: [description]
   ```

2. **Note which instructions were insufficient:**
   - Which phase had unclear guidance?
   - What specific scenario wasn't covered?
   - What assumption did the agent make that was incorrect?

3. **After workflow completion**, if significant instruction gaps were identified, create a new lesson in `.docs/lessons-learned/`:

   Create `lesson-NNN-[descriptive-slug].md`:

   ```markdown
   # Lesson NNN: [Title]

   **Date:** [YYYY-MM-DD]

   **Context:** [What went wrong - be specific about the failure mode]

   **Lesson:** [Why it happened and what should be done differently]

   **Impact:** [Consequences and how this improves future workflows]
   ```

   Then update `.docs/lessons-learned/index.md` YAML frontmatter with new entry.

   ```

   ```

**Orchestrator responsibilities:**

- Track patterns across multiple workflows (are the same phases consistently problematic?)
- Escalate instruction gaps to human when they block progress
- Note in session.md when agent behavior suggests instruction ambiguity

**Human responsibilities:**

- Review accumulated lessons in `lessons-learned/` directory periodically
- Update `.claude/commands/tdd.md` with proven improvements
- Version control prompt changes to track what works
- Test prompt changes on representative tasks before deploying broadly

**Metrics to consider tracking:**

- Which phases most frequently require troubleshooter intervention?
- How many FIX → REVIEW cycles typically occur?
- Which acceptance criteria types lead to test design issues?
- What percentage of workflows complete without escalation?

This empirical iteration ensures the workflow improves over time based on real usage patterns rather than theoretical assumptions.

---

## Starting/Resuming Workflow

**New workflow** (`/tdd Implement user authentication`):

1. Request Clarification (see section above - get human confirmation)
2. Pre-Workflow Validation (check sessions, project status, docs)
3. Update `.docs/current-task.md` "Current Focus" with task + workflow + timestamp
4. Create `.tdd/session.md` with task + scope + criteria (INIT phase)
5. Route to architect (EXPLORE phase)

**Resume workflow** (`/tdd`):

1. Read `.tdd/session.md`
2. Determine current phase
3. Continue from that phase

---

## CRITICAL EXECUTION RULES

**Execute phases fully autonomously:**

1. Proceed to the next phase automatically upon completion of the current phase
2. Use Task tool to spawn next agent immediately when phase completes
3. Continue executing until reaching COMMIT phase or encountering a blocker requiring ESCALATE
4. Maintain forward momentum through all phases
5. Automated browser verification replaces mandatory human verification for UI tasks

**CONDITIONAL human verification (HUMAN_VERIFY phase):**

Human verification is ONLY triggered when:

- Automated browser verification fails for UI tasks
- Browser automation is unavailable for UI tasks
- Non-UI tasks require manual validation (rare)

If automated browser verification succeeds, skip HUMAN_VERIFY and proceed directly to SYNC_DOCS.

**Phase completion workflow:**

1. Read agent output from completed phase
2. Update `.tdd/session.md` with phase completion and findings
3. Determine next phase based on routing table:
   - If REVIEW passed AND automated browser verification succeeded → Route to SYNC_DOCS
   - If REVIEW passed BUT automated verification failed/unavailable → Route to HUMAN_VERIFY
   - Otherwise → Route per standard routing table
4. Immediately spawn next agent with Task tool
5. Repeat until workflow reaches completion

**Execute the entire workflow autonomously. Human verification is a fallback mechanism, not a mandatory gate.**
