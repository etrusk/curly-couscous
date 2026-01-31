---
name: tdd
description: Execute full TDD workflow for a feature or bugfix. Orchestrates all phases automatically.
version: 2.1.0
---

# TDD Workflow Orchestrator

**Role**: Route between specialized agents. Execute COMPLETELY AUTONOMOUSLY—proceed through phases automatically until HUMAN_APPROVAL checkpoint.

**Job**: Read `.tdd/session.md` → spawn agent via Task tool → update session.md "Current Phase" → continue to next phase IMMEDIATELY.

**Context discipline**: Read implementation files only through agent outputs. Keep orchestrator context focused on routing.

---

## Configuration

```yaml
# Token budgets
budgets:
  orchestrator_max: 100000
  orchestrator_warning: 50000
  orchestrator_critical: 75000
  session_md_max: 500

# Constraints (non-negotiable, override all other instructions)
constraints:
  review_cycles_max: 2          # Escalate to human on 3rd cycle
  troubleshooter_exchanges_max: 10  # Escalate if root cause not found
  file_lines_warn: 300
  file_lines_hard: 400
  max_quote_words: 15           # Copyright compliance

# Quality gates
gates:
  critical_issues:
    - tests_failing
    - typescript_errors
    - eslint_errors          # Not warnings
    - security_vulnerabilities  # Moderate+ severity
    - spec_violations         # Against session.md acceptance criteria
    - pattern_violations      # Against .docs/patterns/index.md
    - browser_console_errors  # For UI changes
    - broken_functionality

  non_blocking_issues:
    - code_style_suggestions
    - performance_opportunities
    - additional_test_coverage
    - documentation_improvements
    - eslint_warnings         # Not errors

# Abstention triggers (agents MUST escalate, not assume)
abstention_triggers:
  - api_method_uncertainty: "Cannot verify method/API exists after reading relevant files"
  - ambiguous_requirements: "Acceptance criteria allow multiple interpretations"
  - missing_architecture: "Implementation requires design decisions not in plan.md"
  - domain_knowledge_gaps: "Test design requires domain expertise not in spec.md/codebase"
  - conflicting_information: "Documentation conflicts with code or spec.md conflicts with session.md"

# Confidence calibration for agent communication
confidence_levels:
  verified_90_plus:
    language: "X is Y" / "The component uses X"
    when: "Direct observation in code/docs this session"
    example: "SkillPanel uses Zustand (see src/stores/skillStore.ts:12)"

  high_70_90:
    language: "This appears to use X based on Y"
    when: "Strong inference from multiple signals"
    example: "Follows repository pattern based on /repositories folder structure"

  moderate_50_70:
    language: "X likely handles this, though not explicitly tested/documented"
    when: "Reasonable deduction, incomplete evidence"
    example: "Auth flow likely handles token refresh, though no explicit tests found"

  low_under_50:
    language: "Uncertain—could be X or Y" / "Cannot determine without Z"
    when: "Multiple interpretations, insufficient evidence"
    example: "Cannot determine intended behavior for concurrent edits—spec silent, no tests"
```

---

## State Machine

```yaml
phases:
  INIT:
    agent: self
    actions:
      - Create .tdd/session.md with task, scope, acceptance criteria
      - Set phase=EXPLORE
    next: EXPLORE

  EXPLORE:
    agent: architect
    inputs:
      [
        ".docs/spec.md",
        ".docs/architecture.md",
        ".docs/patterns/index.md",
        ".docs/lessons-learned/index.md",
      ]
    outputs: [".tdd/exploration.md"]
    note: "session.md acceptance criteria override spec.md if conflicting"
    next: PLAN

  PLAN:
    agent: architect
    inputs: [".tdd/exploration.md"]
    outputs: [".tdd/plan.md"]
    next: DESIGN_TESTS

  DESIGN_TESTS:
    agent: architect
    inputs: [".tdd/plan.md"]
    outputs: [".tdd/test-designs.md"]
    next: TEST_DESIGN_REVIEW

  TEST_DESIGN_REVIEW:
    agent: architect
    inputs: [".tdd/test-designs.md"]
    outputs: [".tdd/test-designs.md"] # Updated in place
    validates:
      - Completeness (all acceptance criteria covered)
      - Clarity (unambiguous descriptions)
      - Correctness (tests detect faults, not just exercise paths)
      - Coverage (edge cases, pattern compliance)
    next: WRITE_TESTS

  WRITE_TESTS:
    agent: coder
    inputs: [".tdd/test-designs.md"]
    outputs: ["test files"]
    verifies: "Tests FAIL (red phase)"
    next: IMPLEMENT

  IMPLEMENT:
    agent: coder
    inputs: [".tdd/test-designs.md", ".tdd/plan.md"]
    actions:
      - Write code to pass tests
      - Run tests → verify PASS (green phase)
      - Run quality gates (lint, type-check, security scan)
      - "UI changes: Perform browser verification (MCP tools only, never curl/bash)"
    next: REVIEW
    next_if_blocked: "Escalate with BLOCKER context"

  REVIEW:
    agent: reviewer
    inputs:
      [
        ".tdd/session.md",
        ".tdd/plan.md",
        ".docs/spec.md",
        ".docs/patterns/index.md",
      ]
    outputs: [".tdd/review-findings.md"]
    validates:
      - Human-confirmed acceptance criteria (session.md is authoritative)
      - Implementation satisfies requirements independently of test mechanics
      - Not just passing tests, but solving the actual problem
    next: "See routing_rules.REVIEW"

  ANALYZE_FIX:
    agent: architect
    inputs: [".tdd/review-findings.md"]
    outputs: [".tdd/fix-plan.md"]
    creates:
      - Root cause analysis
      - Fix plan with specific file changes
      - Patterns to follow
      - Potential risks
    next: FIX

  FIX:
    agent: coder
    inputs: [".tdd/fix-plan.md"]
    requirement: "MUST use browser debugging for ANY UI-related issues"
    next: REVIEW # Re-review

  HUMAN_VERIFY:
    agent: self
    trigger: "CONDITIONAL - only if automated browser verification failed/unavailable"
    actions:
      - Provide task-specific manual test guidance
      - Wait for user confirmation
    next_if_verified: HUMAN_APPROVAL
    next_if_issues: FIX

  HUMAN_APPROVAL:
    agent: self
    trigger: "MANDATORY - always after implementation+verification complete"
    actions:
      - Present implementation summary
      - Request approval before SYNC_DOCS and COMMIT
      - Wait for user confirmation
    next_if_approved: SYNC_DOCS
    next_if_rejected: FIX

  SYNC_DOCS:
    agent: architect
    actions:
      - Compare implementation vs session.md acceptance criteria
      - Update .docs/ files if implementation changed requirements
      - Note: session.md criteria are authoritative, update spec.md to match
      - Prepare completion summary
    substantial_changes_require_human_review:
      - Changing acceptance criteria in spec.md
      - Modifying architectural decisions
      - Removing/significantly changing patterns
      - Adding ADRs
    auto_commit_ok:
      - Typo fixes
      - Adding examples
      - Adding lessons to lessons-learned/
      - Minor clarifications
    next: COMMIT

  COMMIT:
    agent: coder
    actions:
      - Run git status/diff/log
      - Commit ALL changes with Co-Authored-By trailer
      - Update session.md
    next: "Cleanup and completion"

# Routing rules (conditional transitions)
routing_rules:
  REVIEW:
    - condition: "critical_issues_found (see gates.critical_issues)"
      next: ANALYZE_FIX
    - condition: "no_critical_issues AND ui_task AND browser_verification_succeeded"
      next: HUMAN_APPROVAL
    - condition: "no_critical_issues AND (browser_verification_failed OR browser_unavailable OR manual_validation_needed)"
      next: HUMAN_VERIFY
    - condition: "no_critical_issues AND non_ui_task AND tests_pass"
      next: HUMAN_APPROVAL

  FIX:
    - condition: "review_cycles < 2"
      next: REVIEW
    - condition: "review_cycles >= 2"
      action: "ESCALATE to human with full context"

# Troubleshooting
troubleshooting:
  trigger: "Coder reports STUCK (documented in session.md Blockers)"
  protocol:
    - Spawn troubleshooter agent with session.md context
    - Troubleshooter has 10-exchange hard limit
    - For UI bugs, troubleshooter MUST attempt browser automation
    - If browser unavailable, report as BLOCKER for orchestrator escalation
    - Read troubleshooter output from .tdd/troubleshooter-report.md
    - If root cause identified → spawn architect for ANALYZE_FIX
    - If root cause unclear after 10 exchanges → ESCALATE to human
    - Maximum 1 troubleshooting cycle per FIX phase
```

---

## Pre-Workflow Validation

Before starting ANY new workflow:

1. **Check existing session**: `cat .tdd/session.md 2>/dev/null || echo "NO_SESSION"`
   - Session exists with incomplete phase → Resume from current phase
   - No session → Create new session

2. **Check project status**: `cat .docs/current-task.md 2>/dev/null || echo "NO_CURRENT_TASK"`
   - If another workflow active (Current Focus ≠ "[No active task]"):
     - Output: `⚠️  Another workflow is active: [task]. Starting new workflow may cause conflicts.`
     - Ask: `Proceed anyway? (yes/no)`

3. **Verify documentation**: `ls .docs/spec.md .docs/architecture.md 2>/dev/null`
   - If missing: Note in output. Agents handle gracefully.

4. **Create .tdd/ directory**: `mkdir -p .tdd`

5. **Create feature branch** (new workflows only):
   - Resuming → skip (stay on existing branch)
   - New workflow → `git checkout -b feature/[slug-from-task-description]`

---

## Request Clarification (NEW workflows only)

**Skip clarification when:**

- Resuming existing session (session.md exists)
- Human provided detailed spec with clear acceptance criteria
- Task is trivial (single-line fix, typo, formatting-only)

**Clarification flow:**

1. **State understanding**: "I understand you want to [goal]. This appears to be [scope/complexity]."

2. **Identify ambiguities** (ask ONE category at a time):
   - Missing acceptance criteria
   - Unclear constraints/boundaries
   - Edge cases not specified
   - Context needed for decisions

3. **Explore alternatives**: "We could approach this as [A] which [pros/cons], or [B] which [pros/cons]. What matters most?"

4. **Recommend**: Based on discussion, recommend specific approach with rationale.

5. **Confirm scope**: Wait for explicit confirmation. Document in session.md:

```markdown
## Confirmed Scope

[2-4 sentence summary]

## Acceptance Criteria

- [criterion 1 - specific and testable]
- [criterion 2 - specific and testable]
```

**IMPORTANT**: Once confirmed, these criteria are authoritative. If they conflict with `.docs/spec.md`, these take precedence. Spec will be updated during SYNC_DOCS.

---

## Browser Automation (MANDATORY for UI tasks)

**CRITICAL RULES:**

1. Dev server runs at `http://localhost:5173` (started externally)
2. Attempt browser tools FIRST, document actual results
3. Document actual errors with specific messages from tool attempts
4. Escalate BLOCKER status immediately with full error context

**When required:**

- ANY UI implementation/modification
- ANY debugging of rendering/CSS/interaction bugs
- ALL browser console error verification
- DOM state inspection
- Recording workflows as GIFs (for multi-step workflows, complex interactions, bug fixes requiring debugging)

**Protocol (coder agent during IMPLEMENT phase):**

1. **Get browser context**: `mcp__claude-in-chrome__tabs_context_mcp` with `createIfEmpty: true`

2. **Verify in browser**:
   - Navigate to relevant page (check plan.md for routes, fallback: http://localhost:5173/)
   - Take screenshot to verify page loaded
   - Check console using `read_console_messages`
   - Test interactions (buttons, inputs, state changes)
   - Document in session.md: URL, tab ID, interactions tested, console errors, visual rendering

3. **CRITICAL - Use ONLY browser automation tools**:
   - ✓ CORRECT: `mcp__claude-in-chrome__*` tools
   - ✗ WRONG: `curl http://localhost:5173` (blocked by permissions)
   - ✗ WRONG: `wget`, `nc`, bash network commands (blocked)

**If browser tools fail:**

- Document ACTUAL error message in session.md Blockers section
- Example CORRECT:
  ```markdown
  ## Blockers

  - Browser automation BLOCKED: tabs_context_mcp returned "Error: Extension not available"
  - Attempted at: 2026-01-31T12:34:56Z
  ```
- Example INCORRECT (no evidence): "Browser automation blocked by permissions" ❌
- Set Automation Status to BLOCKED
- Escalate to HUMAN_VERIFY immediately

**Session.md documentation:**

```markdown
## Browser Verification (Automated)

Automation Status: [SUCCESS | FAILED | BLOCKED | NOT_APPLICABLE]
URL tested: [URL]
Interactions tested: [list]
Console errors: [none | list]
Visual rendering: [verified correct | issues: description]
GIF recorded: [yes - multi-step workflow | no - simple change | N/A]

[If SUCCESS: "Automated verification passed - proceeding to HUMAN_APPROVAL"]
[If FAILED: "Automated verification failed: [reason]. Escalating to HUMAN_VERIFY."]
[If BLOCKED: "Browser tools encountered errors: [actual error]. BLOCKER - escalating to HUMAN_VERIFY."]
[If NOT_APPLICABLE: "No UI changes"]
```

---

## Agent Summary Format

After EVERY agent completion:

```
✓ [AGENT_TYPE] completed [PHASE] [Agent: ~XK tokens]
  → [2-4 bullet points of key actions/findings]
  → Orchestrator: XK/100K tokens (X% utilization)
  → Next: [NEXT_PHASE]
```

**Token reporting:**

- Agent: Read from agent output metrics, or estimate based on phase complexity
- Orchestrator: Current context size / 100K limit
- Alert user at 50K (warning) or 75K (critical)

---

## Context Management

**Target**: <100K tokens orchestrator context
**Warning**: 50K tokens (50%) - compact proactively, report to user
**Critical**: 75K tokens (75%) - offload to `.tdd/orchestrator-context.md`, start fresh

**Compaction protocol (`/compact`):**

| Trigger                              | Action                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Context >50K tokens                  | `/compact preserve: current phase, session.md location, pending decisions` |
| After IMPLEMENT (if >30K)            | `/compact preserve: implementation summary, test results, files modified`  |
| Debug >8 exchanges, no resolution    | `/compact preserve: root cause findings, attempted fixes, hypotheses`      |
| Phase transition after extended work | `/compact preserve: phase output location, routing decision, blockers`     |

**ALWAYS before compacting:**

1. Update session.md with current state
2. Compaction without current state causes workflow amnesia

**After every compact:**

1. Verify session.md reflects current phase
2. Re-read Phase Routing table
3. If behavior degrades, escalate to human

**Complete current agent execution before compacting. Never compact mid-agent-execution or during HUMAN_VERIFY/HUMAN_APPROVAL.**

---

## HUMAN_VERIFY Phase (Conditional)

**CONDITIONAL**: Only if automated browser verification failed/unavailable OR manual validation needed.

Output:

```
✓ Reviewer approved implementation
  → All tests passing
  → No critical issues found
  → Automated browser verification: [FAILED | UNAVAILABLE | N/A]
  → Requesting manual verification as fallback

Please manually verify the implementation works as expected.
```

**Guidance for UI changes:**

```
Dev server: http://localhost:5173

Verify:
1. Navigate to [URL from plan.md]
2. Test: [specific interactions from plan.md]
3. Check browser console (should be zero errors)
4. Verify visual appearance matches requirements

Respond:
- "verified" / "looks good" → Continue to HUMAN_APPROVAL
- "issue: [description]" → Return to FIX phase
```

**Update session.md:**

```markdown
## Human Verification

Status: [PENDING | VERIFIED | ISSUES_FOUND]
Tested: [What human verified]
Issues: [Problems discovered, if any]
```

---

## HUMAN_APPROVAL Phase (Mandatory)

**MANDATORY**: Always after implementation+verification complete, before SYNC_DOCS and COMMIT.

Output:

```
✓ Implementation complete
  → All tests passing
  → Review approved (no critical issues)
  → [Automated browser verification passed | Manual verification completed]
  → Ready for documentation sync and commit

Please review the implementation and approve to proceed.

Implementation Summary:
- Files modified: [list from session.md]
- Tests added: [count and files]
- Key changes: [2-3 bullets from plan.md]

To approve:
- "approved" / "lgtm" / "proceed" → SYNC_DOCS → COMMIT
- "issue: [description]" → FIX phase
```

**Update session.md:**

```markdown
## Human Approval

Status: [PENDING | APPROVED | REJECTED]
Feedback: [Notes from human]
```

---

## COMMIT Phase → Completion

When coder completes COMMIT:

1. **Output agent summary**

2. **Update `.docs/current-task.md`**:
   - Move "Current Focus" to "Recent Completions" with timestamp and summary from session.md
   - Set "Current Focus" to `[No active task]`
   - Prune old completions if >500 tokens (keep 3-5 recent)

3. **Delete ephemeral files**:

   ```bash
   rm -f .tdd/session.md .tdd/exploration.md .tdd/plan.md .tdd/test-designs.md .tdd/review-findings.md .tdd/fix-plan.md .tdd/troubleshooter-report.md .tdd/orchestrator-context.md
   ```

4. **Output final summary**:

   ```
   ═══════════════════════════════════════
   TDD WORKFLOW COMPLETE
   ═══════════════════════════════════════

   Task: [description]
   Commit: [hash]

   Implementation:
   → Files created: [list]
   → Files modified: [list]
   → Tests added: [count] in [files]

   Documentation:
   → [files updated or "No documentation updates needed"]

   Quality Gates:
   ✓ Tests pass
   ✓ Lint pass
   ✓ Type check pass
   ✓ Review approved
   [If UI: ✓ Automated browser verification passed]
   [If triggered: ✓ Human verification passed]
   ✓ Human approval granted

   Context Efficiency:
   → Peak orchestrator context: XK/100K tokens (X%)
   → Total agent invocations: [count]
   → Context offloads: [count or none]
   ═══════════════════════════════════════
   ```

---

## Session State Format

`.tdd/session.md` (ephemeral - deleted after commit):

```markdown
# TDD Session

## Task

[Description]

## Confirmed Scope

[2-4 sentences from clarification]

## Acceptance Criteria

- [criterion 1]
- [criterion 2]

## Constraints

- [if any]

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

## Browser Verification (Automated)

[See Browser Automation section for format]

## Human Verification (Conditional)

[Only if HUMAN_VERIFY triggered]

## Human Approval (Mandatory)

Status: [PENDING | APPROVED | REJECTED]
Feedback: [Notes]

## Blockers

- [Issues preventing progress]

## Review Cycles

Count: [0-2]

## Context Metrics

Peak orchestrator context: [XK tokens]
Agent invocations: [count]
Context offloads: [count or 0]

## Documentation Updates

[SYNC_DOCS findings]

## Completion Summary

[One-line summary from SYNC_DOCS, used to update current-task.md]

## Documentation Recommendations

- [ ] Pattern to add: [description]
```

---

## Starting/Resuming

**New workflow** (`/tdd [task]`):

1. Request Clarification (get human confirmation)
2. Pre-Workflow Validation
3. Update `.docs/current-task.md` "Current Focus"
4. Create `.tdd/session.md` (INIT phase)
5. Route to architect (EXPLORE phase)

**Resume workflow** (`/tdd`):

1. Read `.tdd/session.md`
2. Determine current phase
3. Continue from that phase

---

## Routing Summary

| After Phase        | Route To           | Condition                                         |
| ------------------ | ------------------ | ------------------------------------------------- |
| EXPLORE            | PLAN               | Always                                            |
| PLAN               | DESIGN_TESTS       | Always                                            |
| DESIGN_TESTS       | TEST_DESIGN_REVIEW | Always                                            |
| TEST_DESIGN_REVIEW | WRITE_TESTS        | Always                                            |
| WRITE_TESTS        | IMPLEMENT          | Tests fail (red verified)                         |
| IMPLEMENT          | REVIEW             | Tests pass + gates pass                           |
| REVIEW             | ANALYZE_FIX        | Critical issues found                             |
| REVIEW             | HUMAN_VERIFY       | No critical issues BUT browser failed/unavailable |
| REVIEW             | HUMAN_APPROVAL     | No critical issues AND (browser passed OR non-UI) |
| ANALYZE_FIX        | FIX                | Always                                            |
| FIX                | REVIEW             | Always (re-review)                                |
| HUMAN_VERIFY       | HUMAN_APPROVAL     | Verified                                          |
| HUMAN_VERIFY       | FIX                | Issues found                                      |
| HUMAN_APPROVAL     | SYNC_DOCS          | Approved                                          |
| HUMAN_APPROVAL     | FIX                | Rejected                                          |
| SYNC_DOCS          | COMMIT             | Always                                            |

---

## Critical Constraints (Non-Negotiable)

These override any conflicting instructions:

1. **Human approval MANDATORY** at HUMAN_APPROVAL before SYNC_DOCS/COMMIT
2. **Browser verification REQUIRED** for all UI tasks (MCP tools only, escalate if unavailable)
3. **Max 2 review cycles** (escalate on 3rd attempt)
4. **Troubleshooter: 10 exchanges max** (escalate if root cause not found)
5. **Token budgets**: session.md <500, orchestrator <100K (compact at 50K, offload at 75K)
6. **File size limits**: warn at 300 lines, mandatory decomposition at 400
7. **Acceptance criteria authority**: session.md human-confirmed criteria override spec.md
8. **Abstention over assumption**: When uncertain, escalate rather than guess
9. **Confidence calibration**: Agents use calibrated language matching actual certainty
10. **Copyright compliance**: Max 1 quote per response, <15 words, in quotation marks
