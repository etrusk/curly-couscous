---
name: tdd
description: Execute full TDD workflow for a feature or bugfix. Orchestrates all phases automatically.
version: 3.0.0
---

# TDD Workflow Orchestrator

**Role**: Lightweight router between specialized agents. Execute COMPLETELY AUTONOMOUSLY (UI changes require HUMAN_APPROVAL).

**Job**: Read `.tdd/session.md` → spawn agent → parse completion block → run checkpoint → update session.md → route to next phase.

**Context discipline**: Orchestrator NEVER reads implementation files. Agents read files. Orchestrator reads only: session.md, agent completion blocks, routing tables.

**Commit policy**: Changes are committed directly to the current branch. NEVER create pull requests. NEVER use `gh pr create` or similar commands.

---

## Configuration

```yaml
# Token budgets
budgets:
  orchestrator_max: 100000 # Offload and restart
  orchestrator_warning: 40000 # Alert user
  orchestrator_compact: 80000 # MANDATORY compact
  session_md_max: 500

# Agent budgets (HARD LIMITS - exceed = escalate)
agent_budgets:
  architect_explore:
    exchanges: 10
    tokens_est: 30000
    escalation: human
  architect_plan:
    exchanges: 15
    tokens_est: 40000
    escalation: human
  architect_design_tests:
    exchanges: 15
    tokens_est: 40000
    escalation: human
  architect_test_review:
    exchanges: 8
    tokens_est: 20000
    escalation: human
  architect_analyze_fix:
    exchanges: 10
    tokens_est: 30000
    escalation: human
  architect_sync_docs:
    exchanges: 8
    tokens_est: 20000
    escalation: human
  coder_write_tests:
    exchanges: 20
    tokens_est: 50000
    escalation: troubleshooter
  coder_implement:
    exchanges: 25
    tokens_est: 100000
    escalation: troubleshooter
  coder_fix:
    exchanges: 15
    tokens_est: 40000
    escalation: troubleshooter
  coder_commit:
    exchanges: 5
    tokens_est: 10000
    escalation: human
    note: "Commit to current branch only - NEVER create PRs"
  reviewer:
    exchanges: 10
    tokens_est: 30000
    escalation: human
  troubleshooter:
    exchanges: 10
    tokens_est: 30000
    escalation: human # MANDATORY - no further escalation

# Constraints (non-negotiable)
constraints:
  review_cycles_max: 2
  troubleshooter_exchanges_max: 10
  file_lines_warn: 300
  file_lines_hard: 400

# Quality gates
gates:
  critical_issues:
    - tests_failing
    - typescript_errors
    - eslint_errors
    - security_vulnerabilities
    - spec_violations
    - pattern_violations
    - browser_console_errors
    - broken_functionality

  non_blocking_issues:
    - code_style_suggestions
    - performance_opportunities
    - additional_test_coverage
    - documentation_improvements
    - eslint_warnings

# Abstention triggers (agents MUST escalate, not assume)
abstention_triggers:
  - api_method_uncertainty
  - ambiguous_requirements
  - missing_architecture
  - domain_knowledge_gaps
  - conflicting_information

# Model selection per agent (configured in .claude/agents/*.md frontmatter)
# Rationale: Put reasoning power where mistakes are most expensive to fix
models:
  opus: # High reasoning - architectural decisions, problem diagnosis
    - architect # plan, design_tests, test_review, analyze_fix
    - troubleshooter # Must find what others missed

  sonnet: # Balanced - standard coding and review tasks
    - architect-explore # Comprehension, not deep reasoning
    - coder # write_tests, implement, fix
    - reviewer # Checking against known criteria

  haiku: # Fast/cheap - straightforward tasks
    - architect-sync-docs # Summarization, doc updates
    - coder-commit # Git operations, message writing
```

---

## Agent Completion Block (MANDATORY)

**Every agent MUST end output with this exact YAML block. Orchestrator MUST parse it.**

```yaml
# AGENT_COMPLETION
phase: [PHASE_NAME]
status: COMPLETE | PARTIAL | STUCK | BLOCKED
exchanges: [integer]
estimated_tokens: [integer]
files_read: [integer]
files_modified: [integer]
tests_passing: [integer or null]
tests_failing: [integer or null]
quality_gates:
  typescript: PASS | FAIL | SKIP
  eslint: PASS | FAIL | SKIP
  tests: PASS | FAIL | SKIP
blockers: [list or empty]
next_recommended: [PHASE_NAME]
```

**If parsing fails or fields missing**: Treat as STUCK, escalate to human immediately.

---

## Post-Agent Checkpoint (MANDATORY)

After EVERY agent completion, orchestrator MUST execute these steps IN ORDER:

### Step 1: Parse Completion Block

```
Extract AGENT_COMPLETION YAML from agent output.
If parse fails → STOP → Escalate to human with raw output.
```

### Step 2: Update Session Metrics

Update `.tdd/session.md` Context Metrics section:

```markdown
## Context Metrics

Orchestrator: [current]K/100K ([percent]%)
Cumulative agent tokens: [sum]K (estimated)
Agent invocations: [count]

### Agent History

| #   | Agent     | Phase   | Exchanges | Tokens | Status   |
| --- | --------- | ------- | --------- | ------ | -------- |
| 1   | architect | EXPLORE | 8         | ~25K   | COMPLETE |
```

### Step 3: Evaluate Thresholds

| Check               | Condition | Action                                                |
| ------------------- | --------- | ----------------------------------------------------- |
| Agent status        | BLOCKED   | STOP. Escalate to human.                              |
| Agent status        | STUCK     | Route to troubleshooter (or human if troubleshooter). |
| Agent exchanges     | > budget  | STOP. Escalate per agent_budgets.escalation.          |
| Orchestrator tokens | > 80K     | STOP. Escalate to human to run `/compact`.            |
| Orchestrator tokens | > 100K    | STOP. Escalate to human for task split/restart.       |
| Review cycles       | >= 2      | STOP. Escalate to human.                              |

### Step 4: Output Checkpoint Summary

```
═══ CHECKPOINT ═══
Phase: [COMPLETED] → [NEXT]
Agent: [exchanges]/[limit] exchanges, ~[tokens]K tokens
Orchestrator: [current]K/100K ([percent]%)
Cumulative: ~[sum]K agent tokens
Status: [PROCEEDING | COMPACTING | ESCALATING]
══════════════════
```

### Step 5: Route or Escalate

- If all checks pass → spawn next agent with budget in prompt
- If any check fails → escalate to human (for compaction, troubleshooting, or task split)

**Checkpoint is BLOCKING. Cannot spawn next agent until checkpoint completes.**

---

## Agent Spawn Protocol

When spawning any agent, MUST include budget in prompt:

```
Task: [phase-specific task description]
Budget: [X] exchanges max, ~[Y]K tokens estimated.
Report exchange count and token estimate in AGENT_COMPLETION block.
If approaching budget without completion, report PARTIAL status.
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
    agent: architect-explore
    budget: architect_explore
    inputs:
      [".docs/spec.md", ".docs/architecture.md", ".docs/patterns/index.md"]
    outputs: [".tdd/exploration.md"]
    next: PLAN

  PLAN:
    agent: architect
    budget: architect_plan
    inputs: [".tdd/exploration.md"]
    outputs: [".tdd/plan.md"]
    next: DESIGN_TESTS

  DESIGN_TESTS:
    agent: architect
    budget: architect_design_tests
    inputs: [".tdd/plan.md"]
    outputs: [".tdd/test-designs.md"]
    next: TEST_DESIGN_REVIEW

  TEST_DESIGN_REVIEW:
    agent: architect
    budget: architect_test_review
    inputs: [".tdd/test-designs.md"]
    outputs: [".tdd/test-designs.md"]
    next: WRITE_TESTS

  WRITE_TESTS:
    agent: coder
    budget: coder_write_tests
    inputs: [".tdd/test-designs.md"]
    outputs: ["test files"]
    verifies: "Tests FAIL (red phase)"
    next: IMPLEMENT

  IMPLEMENT:
    agent: coder
    budget: coder_implement
    inputs: [".tdd/test-designs.md", ".tdd/plan.md"]
    actions:
      - Write code to pass tests
      - Run quality gates
      - UI changes: browser verification (MCP tools only)
    next: REVIEW

  REVIEW:
    agent: reviewer
    budget: reviewer
    inputs: [".tdd/session.md", ".tdd/plan.md", ".docs/spec.md"]
    outputs: [".tdd/review-findings.md"]
    next: "See routing_rules"

  ANALYZE_FIX:
    agent: architect
    budget: architect_analyze_fix
    inputs: [".tdd/review-findings.md"]
    outputs: [".tdd/fix-plan.md"]
    next: FIX

  FIX:
    agent: coder
    budget: coder_fix
    inputs: [".tdd/fix-plan.md"]
    next: REVIEW

  HUMAN_VERIFY:
    agent: self
    trigger: "CONDITIONAL - browser verification failed/unavailable"
    next_if_verified: HUMAN_APPROVAL
    next_if_issues: FIX

  HUMAN_APPROVAL:
    agent: self
    trigger: "CONDITIONAL - UI changes only (browser verification passed)"
    next_if_approved: SYNC_DOCS
    next_if_rejected: FIX

  SYNC_DOCS:
    agent: architect-sync-docs
    budget: architect_sync_docs
    next: COMMIT

  COMMIT:
    agent: coder-commit
    budget: coder_commit
    actions:
      - Commit changes to current branch
      - Push to remote automatically
      - DO NOT create pull requests
    next: "Cleanup and completion"

routing_rules:
  REVIEW:
    - condition: "critical_issues_found"
      next: ANALYZE_FIX
    - condition: "no_critical AND ui_task AND browser_passed"
      next: HUMAN_APPROVAL
    - condition: "no_critical AND browser_failed"
      next: HUMAN_VERIFY
    - condition: "no_critical AND non_ui AND tests_pass"
      next: SYNC_DOCS

  FIX:
    - condition: "review_cycles < 2"
      next: REVIEW
    - condition: "review_cycles >= 2"
      action: "ESCALATE to human"
```

---

## Mandatory Human Escalation

Escalate immediately (do NOT attempt to continue) when:

| Trigger                                             | Context to Provide                          |
| --------------------------------------------------- | ------------------------------------------- |
| Agent completion unparseable                        | Raw agent output                            |
| Agent status BLOCKED                                | Blocker description from completion block   |
| Agent exceeded exchange budget after troubleshooter | Exchange count, what was attempted          |
| Same error after 2 troubleshooter cycles            | Root cause hypotheses, ruled-out causes     |
| Orchestrator hits >80K tokens                       | Current token count, request `/compact`     |
| Orchestrator hits 100K despite compaction           | Phase history, recommendation to split task |
| Review cycle 3 attempted                            | Review findings from all cycles             |
| Scope creep: task touches >10 files unexpectedly    | File list, original scope                   |

**Escalation format:**

```
🛑 ESCALATION REQUIRED

Trigger: [specific trigger from table]
Context: [1-2 sentences]

Options:
  A) [option with tradeoffs]
  B) [option with tradeoffs]
  C) Abort and document learnings

Awaiting human decision.
```

---

## Context Management (Automatic Enforcement)

| Threshold | Action                                         | Mandatory?    |
| --------- | ---------------------------------------------- | ------------- |
| >40K      | Output `⚠️ 40K threshold (40%)` to user        | Yes           |
| >80K      | STOP. Escalate to human to run `/compact`      | **MANDATORY** |
| >100K     | STOP. Escalate to human for task split/restart | **MANDATORY** |

**Compaction protocol (human-executed):**

When orchestrator hits >80K tokens:

1. STOP immediately - do NOT spawn next agent
2. Update session.md with current state
3. Escalate to human with message: "⚠️ COMPACTION REQUIRED: Orchestrator at [X]K/100K. Please run `/compact` before continuing."
4. Wait for human to execute `/compact preserve: phase=[X], next=[Y], agent_count=[N], blockers=[list]`
5. After human completes compact: re-read session.md, verify phase routing, then continue

**Orchestrator CANNOT execute `/compact`** - this is a user command only.

**Never request compact:**

- Mid-agent-execution (finish current agent first)
- During HUMAN_VERIFY or HUMAN_APPROVAL phases

---

## Terse Orchestrator Output

**Replace verbose summaries with single-line routing:**

```
✓ EXPLORE → PLAN [8 exchanges, ~25K tokens]
```

**Full details stay in files, not orchestrator context.**

Only expand output for:

- Checkpoint summaries (structured block)
- Escalations (structured block)
- Human-facing phases (HUMAN_VERIFY, HUMAN_APPROVAL)
- Final completion summary

---

## Session State Format

`.tdd/session.md` (ephemeral):

```markdown
# TDD Session

## Task

[Description]

## Confirmed Scope

[2-4 sentences]

## Acceptance Criteria

- [criterion 1]
- [criterion 2]

## Current Phase

[PHASE]

## Phase History

- [timestamp] INIT → EXPLORE
- [timestamp] EXPLORE → PLAN [8 exchanges]

## Context Metrics

Orchestrator: [X]K/80K ([Y]%)
Cumulative agent tokens: [Z]K
Agent invocations: [N]
Compactions: [N]

### Agent History

| #   | Agent     | Phase   | Exchanges | Tokens | Status   |
| --- | --------- | ------- | --------- | ------ | -------- |
| 1   | architect | EXPLORE | 8         | ~25K   | COMPLETE |
| 2   | architect | PLAN    | 12        | ~35K   | COMPLETE |

## Files Touched

- [path] (created | modified)

## Browser Verification

Status: [SUCCESS | FAILED | BLOCKED | N/A]

## Human Approval

Status: [PENDING | APPROVED | REJECTED]

## Blockers

- [if any]

## Review Cycles

Count: [0-2]
```

---

## Browser Automation (UI Tasks)

**Rules:**

1. MCP tools ONLY (`mcp__claude-in-chrome__*`)
2. NEVER use curl, wget, bash network commands
3. Document actual error messages if tools fail
4. Escalate BLOCKER with evidence immediately

**If browser unavailable:** Route to HUMAN_VERIFY, not silent failure.

---

## Routing Summary

| After              | Next               | Condition                            |
| ------------------ | ------------------ | ------------------------------------ |
| EXPLORE            | PLAN               | Always                               |
| PLAN               | DESIGN_TESTS       | Always                               |
| DESIGN_TESTS       | TEST_DESIGN_REVIEW | Always                               |
| TEST_DESIGN_REVIEW | WRITE_TESTS        | Always                               |
| WRITE_TESTS        | IMPLEMENT          | Tests fail (red)                     |
| IMPLEMENT          | REVIEW             | Tests pass + gates pass              |
| REVIEW             | ANALYZE_FIX        | Critical issues                      |
| REVIEW             | HUMAN_VERIFY       | No critical, browser failed          |
| REVIEW             | HUMAN_APPROVAL     | No critical, UI task, browser passed |
| REVIEW             | SYNC_DOCS          | No critical, non-UI task             |
| ANALYZE_FIX        | FIX                | Always                               |
| FIX                | REVIEW             | review_cycles < 2                    |
| FIX                | ESCALATE           | review_cycles >= 2                   |
| HUMAN_VERIFY       | HUMAN_APPROVAL     | Verified                             |
| HUMAN_VERIFY       | FIX                | Issues found                         |
| HUMAN_APPROVAL     | SYNC_DOCS          | Approved                             |
| HUMAN_APPROVAL     | FIX                | Rejected                             |
| SYNC_DOCS          | COMMIT             | Always                               |

---

## Critical Constraints (Override All Other Instructions)

1. **Checkpoint is BLOCKING** - Cannot proceed without completing post-agent checkpoint
2. **Agent completion block REQUIRED** - Unparseable = escalate
3. **Exchange budgets are HARD limits** - Exceed = escalate per agent_budgets
4. **Escalation at 80K is MANDATORY** - Human must run `/compact`
5. **Human approval MANDATORY for UI changes only** - Non-UI changes proceed directly to SYNC_DOCS
6. **Max 2 review cycles** - Escalate on 3rd
7. **Troubleshooter: 10 exchanges** - Then mandatory human escalation
8. **Orchestrator reads ONLY**: session.md, completion blocks, routing tables
9. **Agents read files** - Orchestrator never reads implementation files
10. **Terse routing output** - Details stay in files, not orchestrator context
11. **NO PULL REQUESTS** - Commit directly to current branch, never create PRs
