---
name: tdd
description: Execute full TDD workflow for a feature or bugfix. Orchestrates all phases automatically.
version: 4.0.0
---

# TDD Workflow Orchestrator

**Role**: Lightweight router between specialized agents. Execute COMPLETELY AUTONOMOUSLY (UI changes require HUMAN_APPROVAL).

**CRITICAL: NO CONFIRMATION PROMPTS** - Phase transitions are AUTOMATIC. NEVER ask "Do you want to proceed?" or similar questions between phases. The ONLY phases requiring user input are HUMAN_VERIFY and HUMAN_APPROVAL. All other phase transitions happen immediately without waiting for user confirmation.

**Job**: Read `.tdd/session.md` → spawn agent → parse completion block → run checkpoint → update session.md → route to next phase IMMEDIATELY (no user prompt).

**Context discipline**: Orchestrator NEVER reads implementation files. Agents read files. Orchestrator reads only: session.md, agent completion blocks, routing tables.

**Commit policy**: Changes are committed directly to the current branch. NEVER create pull requests. NEVER use `gh pr create` or similar commands.

---

## Configuration

```yaml
# Token budgets (revised for 1M context window beta)
# If 1M beta unavailable, fall back to previous: warning=40K, compact=80K, max=100K
budgets:
  orchestrator_max: 300000 # Hard restart threshold
  orchestrator_warning: 100000 # Earlier awareness
  orchestrator_compact: 200000 # MANDATORY compact (PreCompact hook preserves state)
  session_md_max: 500 # Keep tight — read every phase

# Agent budgets (HARD LIMITS - exceed = escalate)
# Agent names match .claude/agents/tdd-*.md definitions
agent_budgets:
  tdd-explorer:
    exchanges: 10
    tokens_est: 30000
    escalation: human
  tdd-planner:
    exchanges: 15
    tokens_est: 40000
    escalation: human
  tdd-test-designer:
    exchanges: 15
    tokens_est: 40000
    escalation: human
  tdd-test-reviewer:
    exchanges: 8
    tokens_est: 20000
    escalation: human
  tdd-analyzer:
    exchanges: 10
    tokens_est: 30000
    escalation: human
  tdd-doc-syncer:
    exchanges: 8
    tokens_est: 20000
    escalation: human
  tdd-coder_write_tests:
    exchanges: 20
    tokens_est: 50000
    escalation: tdd-troubleshooter
  tdd-coder_implement:
    exchanges: 25
    tokens_est: 100000
    escalation: tdd-troubleshooter
  tdd-coder_fix:
    exchanges: 15
    tokens_est: 40000
    escalation: tdd-troubleshooter
  tdd-committer:
    exchanges: 5
    tokens_est: 10000
    escalation: human
    note: "Commit to current branch only - NEVER create PRs"
  tdd-reflector:
    exchanges: 5
    tokens_est: 10000
    escalation: human
    note: "Process analysis with efficiency metrics - most sessions return 0 items"
  tdd-reviewer:
    exchanges: 10
    tokens_est: 30000
    escalation: human
  tdd-troubleshooter:
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
  # SUCCESS CRITERIA (ALL must be true for workflow completion)
  success_criteria:
    tests_pass_rate: 100% # No failing tests allowed
    tests_skipped: 0 # No skipped tests allowed
    quality_gates_pass_rate: 100% # All gates must pass (typescript, eslint, tests, smoke)
    smoke_tests_pass: 100% # All smoke tests must pass

  critical_issues:
    - tests_failing
    - tests_skipped # Skipped tests block completion
    - typescript_errors
    - eslint_errors
    - smoke_test_failures # Smoke tests catch app-breaking regressions
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

# Unrelated issues handling
unrelated_issues:
  trigger: "Issue found during session that is NOT related to current task"
  action: "Add to .docs/current-task.md as PRIORITY next task"
  format: |
    ## Priority Next Tasks (from TDD session)
    - [ ] [Issue description] (found during: [task name], date: [ISO date])

# Abstention triggers (agents MUST escalate, not assume)
abstention_triggers:
  - api_method_uncertainty
  - ambiguous_requirements
  - missing_architecture
  - domain_knowledge_gaps
  - conflicting_information

# Adaptive thinking effort by phase (experimental - verify CLI support)
# High reasoning phases: tdd-planner, tdd-test-designer, tdd-reviewer, tdd-reflector, tdd-analyzer
# Medium reasoning phases: tdd-explorer, tdd-coder, tdd-committer, tdd-doc-syncer
# If --reasoning-effort flag or effort levels are available per-agent:
#   max: tdd-test-designer, tdd-reviewer, tdd-reflector
#   high: tdd-planner, tdd-test-reviewer, tdd-analyzer
#   medium: tdd-explorer, tdd-coder, tdd-committer, tdd-doc-syncer

# Model selection: ALL agents use model: inherit (Opus 4.6 via Claude Max)
# With flat-rate pricing, no per-token cost optimization needed.
# All tdd-*.md agents set model: inherit in frontmatter.
# If rate limits become an issue on 5x tier, fallback:
#   Keep inherit (Opus): tdd-test-designer, tdd-reviewer, tdd-reflector, tdd-analyzer
#   Switch to sonnet: tdd-explorer, tdd-coder, tdd-committer, tdd-doc-syncer
models:
  inherit: # All agents inherit parent model (Opus 4.6)
    - tdd-explorer
    - tdd-planner
    - tdd-test-designer
    - tdd-test-reviewer
    - tdd-coder
    - tdd-reviewer
    - tdd-analyzer
    - tdd-doc-syncer
    - tdd-committer
    - tdd-reflector
    - tdd-troubleshooter
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
tool_calls: [integer]
files_read: [integer]
files_modified: [integer]
tests_passing: [integer or null]
tests_failing: [integer or null]
tests_skipped: [integer or null] # MUST be 0 for successful completion
quality_gates:
  typescript: PASS | FAIL | SKIP
  eslint: PASS | FAIL | SKIP
  tests: PASS | FAIL | SKIP
  smoke: PASS | FAIL | SKIP | BLOCKED # BLOCKED routes to HUMAN_VERIFY
  all_gates_pass: true | false # MUST be true for successful completion
actions_summary: [list, 2-5 items] # Concise log of key actions taken (e.g., "Read 3 pattern files", "Created CooldownManager class", "Fixed type error in triggers.ts:45")
notable_events: [list or empty] # Significant events: retries, partial failures, large operations
retry_count: [integer] # Number of retry cycles within this agent
blockers: [list or empty]
unrelated_issues: [list or empty] # Issues found but not related to current task
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

Update `.tdd/session.md` Context Metrics section. Parse the AGENT_COMPLETION block and append a row to the Agent History table including token metrics, tool call count, and notable events. IMPORTANT: Use the full agent file name (e.g., `tdd-explorer`, `tdd-planner`, `tdd-coder`) in the Agent column, NOT shortened names like "Explorer" or "Coder".

```markdown
## Context Metrics

Orchestrator: [current]K/100K ([percent]%)
Cumulative agent tokens: [sum]K (estimated)
Agent invocations: [count]

### Agent History

| #   | Agent        | Phase   | Exchanges | Tokens | Tools | Duration | Status   | Notes |
| --- | ------------ | ------- | --------- | ------ | ----- | -------- | -------- | ----- |
| 1   | tdd-explorer | EXPLORE | 8         | ~25K   | 34    | 45s      | COMPLETE | —     |
```

The "Notes" column captures notable events from the AGENT_COMPLETION block: retry counts, partial failures, escalations, large operations.

Also append the agent's `actions_summary` to the **Action Log** section of session.md:

```markdown
### Action Log

#### #1 tdd-explorer (EXPLORE)

- Read 4 pattern files and architecture.md
- Identified SkillSystem as entry point
- Found 2 existing test patterns to follow

#### #2 tdd-planner (PLAN)

- Created 6-step plan targeting 3 files
- Decided against new abstraction (used existing SkillSystem)
```

Each entry uses the agent invocation number, agent name, and phase as header, then lists the `actions_summary` items verbatim from the AGENT_COMPLETION block.

### Step 3: Evaluate Thresholds

| Check               | Condition | Action                                                |
| ------------------- | --------- | ----------------------------------------------------- |
| Agent status        | BLOCKED   | STOP. Escalate to human.                              |
| Agent status        | STUCK     | Route to troubleshooter (or human if troubleshooter). |
| Agent exchanges     | > budget  | STOP. Escalate per agent_budgets.escalation.          |
| Orchestrator tokens | > 200K    | STOP. Escalate to human to run `/compact`.            |
| Orchestrator tokens | > 300K    | STOP. Escalate to human for task split/restart.       |
| Review cycles       | >= 2      | STOP. Escalate to human.                              |

### Step 4: Output Checkpoint Summary

```
═══ CHECKPOINT ═══
Task: [task name from session.md]
Phase: [COMPLETED] → [NEXT] ([N]/7 phases)

Completed: [1-2 sentence summary of what prior phase achieved]

Tests: [passing] passing, [failing] failing, [skipped] skipped
Gates: TS [✓|✗]  ESLint [✓|✗]  Tests [✓|✗]  Smoke [✓|✗|⊘]
Files: [count] modified ([truncated list...])
Agent: [exchanges]/[limit] exchanges ([tool_calls] tools) | Orchestrator: [current]K ([percent]%)
Status: [PROCEEDING | COMPACTING | ESCALATING] → [brief next step]
══════════════════
```

**Phase-specific "Completed" examples:**

| Phase              | Completed Summary Example                                        |
| ------------------ | ---------------------------------------------------------------- |
| EXPLORE            | Found 4 relevant patterns, identified SkillSystem as entry point |
| PLAN               | Created 6-step plan targeting 3 files, no architectural changes  |
| DESIGN_TESTS       | Designed 8 test cases covering cooldown init, decrement, reset   |
| TEST_DESIGN_REVIEW | Validated coverage, added edge case for zero cooldown            |
| WRITE_TESTS        | Wrote 8 tests in 2 files, all failing (red confirmed)            |
| IMPLEMENT          | All tests passing, added CooldownManager class                   |
| REVIEW             | Found 2 critical issues: missing edge case, type error           |
| ANALYZE_FIX        | Root cause: cooldown not reset on battle end                     |
| FIX                | Resolved 2 issues, added cleanup in BattleManager                |
| SYNC_DOCS          | Updated spec.md with cooldown rules, added pattern doc           |
| COMMIT             | Committed: "feat(skills): add cooldown system"                   |

### Step 5: Route or Escalate

- If all checks pass → spawn next agent IMMEDIATELY with budget in prompt (NO user confirmation)
- If any check fails → escalate to human (for compaction, troubleshooting, or task split)

**Checkpoint is BLOCKING but AUTOMATIC. Cannot spawn next agent until checkpoint completes. Do NOT ask user for confirmation - proceed immediately after checkpoint.**

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
    agent: tdd-explorer
    budget: tdd-explorer
    inputs:
      [".docs/spec.md", ".docs/architecture.md", ".docs/patterns/index.md"]
    outputs: [".tdd/exploration.md"]
    next: PLAN

  PLAN:
    agent: tdd-planner
    budget: tdd-planner
    inputs: [".tdd/exploration.md"]
    outputs: [".tdd/plan.md"]
    next: DESIGN_TESTS

  DESIGN_TESTS:
    agent: tdd-test-designer
    budget: tdd-test-designer
    inputs: [".tdd/plan.md", ".docs/smoke-tests.yaml"]
    outputs: [".tdd/test-designs.md"]
    smoke_evaluation: |
      After designing unit/integration tests, evaluate:
      - Does this task add or modify user-facing functionality on a critical path?
      - If YES → add new smoke check(s) to .tdd/test-designs.md in YAML format
      - If NO → state "No smoke test changes needed" (one line)
    next: TEST_DESIGN_REVIEW

  TEST_DESIGN_REVIEW:
    agent: tdd-test-reviewer
    budget: tdd-test-reviewer
    inputs: [".tdd/test-designs.md"]
    outputs: [".tdd/test-designs.md"]
    next: WRITE_TESTS

  WRITE_TESTS:
    agent: tdd-coder
    budget: tdd-coder_write_tests
    inputs: [".tdd/test-designs.md"]
    outputs: ["test files"]
    verifies: "Tests FAIL (red phase)"
    next: IMPLEMENT

  IMPLEMENT:
    agent: tdd-coder
    budget: tdd-coder_implement
    inputs: [".tdd/test-designs.md", ".tdd/plan.md", ".docs/smoke-tests.yaml"]
    actions:
      - Write code to pass tests
      - Run quality gates (lint, type-check)
      - Run smoke tests (after quality gates pass)
      - UI changes: browser verification (MCP tools only)
    smoke_gate: |
      After quality gates pass, execute smoke tests per .docs/smoke-test-instructions.md.
      Read the instructions file and the manifest before starting.
      Report results using the summary format defined in Rule 10.
      Route per: all pass → REVIEW, any fail → ANALYZE_FIX, blocked → HUMAN_VERIFY.
    gate_order: "tests pass (green) → lint → type-check → smoke test → REVIEW"
    next: REVIEW

  REVIEW:
    agent: tdd-reviewer
    budget: tdd-reviewer
    inputs: [".tdd/session.md", ".tdd/plan.md", ".docs/spec.md"]
    outputs: [".tdd/review-findings.md"]
    next: "See routing_rules"

  ANALYZE_FIX:
    agent: tdd-analyzer
    budget: tdd-analyzer
    inputs: [".tdd/review-findings.md"]
    outputs: [".tdd/fix-plan.md"]
    next: FIX

  FIX:
    agent: tdd-coder
    budget: tdd-coder_fix
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
    agent: tdd-doc-syncer
    budget: tdd-doc-syncer
    inputs: [".docs/smoke-tests.yaml", ".tdd/test-designs.md"]
    smoke_manifest_update: |
      If Architect proposed new smoke check(s) in DESIGN_TESTS:
      - Append new YAML entries to .docs/smoke-tests.yaml
      - Do not modify existing entries unless consolidating duplicates
      If no smoke checks proposed → no action needed.
    next: COMMIT

  COMMIT:
    agent: tdd-committer
    budget: tdd-committer
    actions:
      - Bump package.json version per SemVer (see App Versioning section)
      - Commit changes to current branch
      - Push to remote automatically
      - DO NOT create pull requests
    next: REFLECT

  REFLECT:
    agent: tdd-reflector
    budget: tdd-reflector
    inputs: [".tdd/session.md", ".docs/lessons-learned/index.md"]
    outputs: ["inline text only - no files"]
    next: "Cleanup and completion"

routing_rules:
  IMPLEMENT:
    - condition: "tests pass AND gates pass AND smoke pass"
      next: REVIEW
    - condition: "tests pass AND gates pass AND smoke fail"
      next: ANALYZE_FIX
    - condition: "tests pass AND gates pass AND smoke blocked"
      next: HUMAN_VERIFY
    - condition: "tests fail OR gates fail"
      action: "fix before smoke runs"

  REVIEW:
    - condition: "critical_issues_found OR tests_failing > 0 OR tests_skipped > 0 OR all_gates_pass == false"
      next: ANALYZE_FIX
    - condition: "100%_pass AND ui_task AND browser_passed"
      next: HUMAN_APPROVAL
    - condition: "100%_pass AND browser_failed"
      next: HUMAN_VERIFY
    - condition: "100%_pass AND non_ui"
      next: SYNC_DOCS
    # 100%_pass means: tests_failing == 0 AND tests_skipped == 0 AND all_gates_pass == true (including smoke)

  FIX:
    - condition: "review_cycles < 2"
      next: REVIEW
    - condition: "review_cycles >= 2"
      action: "ESCALATE to human"

  UNRELATED_ISSUES:
    - condition: "unrelated_issues not empty"
      action: "Write issues to .docs/current-task.md BEFORE proceeding to next phase"
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
| Orchestrator hits >200K tokens                      | Current token count, request `/compact`     |
| Orchestrator hits 300K despite compaction           | Phase history, recommendation to split task |
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
| >100K     | Output `⚠️ 100K threshold (33%)` to user       | Yes           |
| >200K     | STOP. Escalate to human to run `/compact`      | **MANDATORY** |
| >300K     | STOP. Escalate to human for task split/restart | **MANDATORY** |

**Compaction protocol (human-executed):**

When orchestrator hits >200K tokens:

1. STOP immediately - do NOT spawn next agent
2. Update session.md with current state
3. Escalate to human with message: "⚠️ COMPACTION REQUIRED: Orchestrator at [X]K/300K. Please run `/compact` before continuing."
4. Wait for human to execute `/compact preserve: phase=[X], next=[Y], agent_count=[N], blockers=[list]`
5. After human completes compact: re-read session.md, verify phase routing, then continue
6. PreCompact hook will automatically preserve critical state (phase, files, decisions)

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

Orchestrator: [X]K/300K ([Y]%)
Cumulative agent tokens: [Z]K
Agent invocations: [N]
Compactions: [N]

### Agent History

| #   | Agent        | Phase   | Exchanges | Tokens | Tools | Duration | Status   | Notes |
| --- | ------------ | ------- | --------- | ------ | ----- | -------- | -------- | ----- |
| 1   | tdd-explorer | EXPLORE | 8         | ~25K   | 34    | 45s      | COMPLETE | —     |
| 2   | tdd-planner  | PLAN    | 12        | ~35K   | 18    | 62s      | COMPLETE | —     |

### Action Log

#### #1 tdd-explorer (EXPLORE)

- [actions_summary items from completion block]

#### #2 tdd-planner (PLAN)

- [actions_summary items from completion block]

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

## Smoke Testing

**Purpose**: Catch "app is fundamentally broken" regressions after every implementation.

**Manifest**: `.docs/smoke-tests.yaml`
**Instructions**: `.docs/smoke-test-instructions.md`

Read both files before executing. The instructions file contains 10 operational rules governing session budgets, tiered verification, screenshot caps, and stateless execution. Follow them exactly.

**Routing** (unchanged):

- All pass → REVIEW
- Any fail → ANALYZE_FIX
- Blocked (MCP timeout after 3 retries) → HUMAN_VERIFY

---

## App Versioning (SemVer)

**Scope**: `package.json` version only. Does NOT apply to:

- Workflow files (`.claude/commands/*.md`)
- Documentation (`.docs/**`)
- Configuration files
- Test files

**When to bump** (determined in COMMIT phase):

| Change Type                                   | Bump  | Example                                  |
| --------------------------------------------- | ----- | ---------------------------------------- |
| Breaking changes to game mechanics or API     | MAJOR | Rule system overhaul, save format change |
| New features (characters, abilities, systems) | MINOR | Add new trigger type, new character      |
| Bug fixes, performance, internal refactors    | PATCH | Fix HP calculation, optimize rendering   |

**Rules**:

1. One version bump per TDD session (even if multiple files changed)
2. Use highest applicable bump (breaking > feature > fix)
3. Commit message determines bump: `feat:` → MINOR, `fix:` → PATCH, `feat!:` or `BREAKING CHANGE:` → MAJOR
4. If task is purely test/doc changes with no app behavior change → no bump

**COMMIT phase action**: Coder reads commit type, bumps `package.json` version accordingly, includes in same commit.

---

## Routing Summary

| After              | Next               | Condition                                              |
| ------------------ | ------------------ | ------------------------------------------------------ |
| EXPLORE            | PLAN               | Always                                                 |
| PLAN               | DESIGN_TESTS       | Always                                                 |
| DESIGN_TESTS       | TEST_DESIGN_REVIEW | Always                                                 |
| TEST_DESIGN_REVIEW | WRITE_TESTS        | Always                                                 |
| WRITE_TESTS        | IMPLEMENT          | Tests fail (red)                                       |
| IMPLEMENT          | REVIEW             | Tests pass + gates pass + smoke pass                   |
| IMPLEMENT          | ANALYZE_FIX        | Tests pass + gates pass + smoke **fail**               |
| IMPLEMENT          | HUMAN_VERIFY       | Tests pass + gates pass + smoke **blocked**            |
| REVIEW             | ANALYZE_FIX        | ANY: failing > 0, skipped > 0, gates fail, or critical |
| REVIEW             | HUMAN_VERIFY       | 100% pass (0 fail, 0 skip, all gates), browser failed  |
| REVIEW             | HUMAN_APPROVAL     | 100% pass, UI task, browser passed                     |
| REVIEW             | SYNC_DOCS          | 100% pass, non-UI task                                 |
| ANALYZE_FIX        | FIX                | Always                                                 |
| FIX                | REVIEW             | review_cycles < 2                                      |
| FIX                | ESCALATE           | review_cycles >= 2                                     |
| HUMAN_VERIFY       | HUMAN_APPROVAL     | Verified                                               |
| HUMAN_VERIFY       | FIX                | Issues found                                           |
| HUMAN_APPROVAL     | SYNC_DOCS          | Approved                                               |
| HUMAN_APPROVAL     | FIX                | Rejected                                               |
| SYNC_DOCS          | COMMIT             | Always                                                 |
| COMMIT             | REFLECT            | Always                                                 |
| REFLECT            | Cleanup            | Always                                                 |
| ANY_PHASE          | (document first)   | If unrelated_issues found → add to current-task.md     |

**100% pass** = tests_failing == 0 AND tests_skipped == 0 AND all_gates_pass == true (including smoke == PASS)

---

## REFLECT → Immediate Workflow Improvement

After COMMIT, spawn `tdd-reflector` agent. Full instructions are in `.claude/agents/tdd-reflector.md`.

The reflector reads session.md Agent History table and identifies 0-3 items across three categories:

- **FIX**: Something went wrong
- **IMPROVE**: Process could be better
- **EFFICIENCY**: Disproportionate resource consumption

**Orchestrator handles the output:**

| Subagent Returns | Orchestrator Action                                          |
| ---------------- | ------------------------------------------------------------ |
| "Clean session"  | Log `Process: ✓ Clean` in final summary. Proceed to cleanup. |
| Items found      | Present to user: `[type]: [summary]. Apply now? (y/n)`       |
| User says yes    | Apply the change immediately, include in completion summary  |
| User says no     | Note as declined, proceed to cleanup                         |

**Immediate application**: Changes are applied to workflow files in the same session, not logged for later. Continuous improvement happens NOW.

### Validation Cleanup

If the REFLECT output contains a `VALIDATION:` block (from `.tdd/validation-manifest.md`):

| VALIDATION Result   | Orchestrator Action                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All checks PASS     | Ask user: "All workflow validation checks passed. Remove validation scaffolding? (.tdd/validation-manifest.md, .tdd/validate-session.sh, reflector manifest reference) (y/n)" |
| Any check FAIL      | Show failures. Do NOT offer cleanup. Note in final summary: `Validation: X/Y passed — keep scaffolding.`                                                                      |
| No VALIDATION block | `.tdd/validation-manifest.md` doesn't exist — skip this step.                                                                                                                 |

**If user says yes to cleanup:**

1. Delete `.tdd/validation-manifest.md`
2. Delete `.tdd/validate-session.sh`
3. Remove the validation manifest line from `.claude/agents/tdd-reflector.md` Required Reading section
4. Include in final summary: `Validation: scaffolding removed.`

**If user says no:** Note as kept, proceed to final summary.

---

## Final Completion Summary

After REFLECT, output completion banner:

```
═══ TDD COMPLETE ═══
Task: [task name]
Commit: [hash] [message]
Tests: [X] passing
Gates: TS ✓  ESLint ✓  Tests ✓  Smoke ✓
Files: [N] modified
Process: [Clean session | type: summary (logged/noted)]
════════════════════
```

Then delete ephemeral files: `.tdd/session.md`, `.tdd/exploration.md`, `.tdd/plan.md`, `.tdd/test-designs.md`, `.tdd/review-findings.md`, `.tdd/fix-plan.md`

---

## Critical Constraints (Override All Other Instructions)

0. **NO CONFIRMATION PROMPTS** - NEVER ask user "Do you want to proceed?" or request confirmation between phases. Phase transitions are AUTOMATIC. Only HUMAN_VERIFY and HUMAN_APPROVAL phases involve user input.
1. **Checkpoint is BLOCKING** - Cannot proceed without completing post-agent checkpoint
2. **Agent completion block REQUIRED** - Unparseable = escalate
3. **Exchange budgets are HARD limits** - Exceed = escalate per agent_budgets
4. **Escalation at 200K is MANDATORY** - Human must run `/compact` (PreCompact hook preserves state)
5. **Human approval MANDATORY for UI changes only** - Non-UI changes proceed directly to SYNC_DOCS
6. **Max 2 review cycles** - Escalate on 3rd
7. **Troubleshooter: 10 exchanges** - Then mandatory human escalation
8. **Orchestrator reads ONLY**: session.md, completion blocks, routing tables
9. **Agents read files** - Orchestrator never reads implementation files
10. **Terse routing output** - Details stay in files, not orchestrator context
11. **NO PULL REQUESTS** - Commit directly to current branch, never create PRs
12. **100% TEST PASS RATE** - Zero failing tests required for successful completion
13. **ZERO SKIPPED TESTS** - All tests must run; skipped tests block completion
14. **100% QUALITY GATES** - All gates (typescript, eslint, tests) must PASS; no SKIPs allowed
15. **UNRELATED ISSUES → current-task.md** - Issues found unrelated to session MUST be added to `.docs/current-task.md` as priority next task before completion
16. **SMOKE TESTS REQUIRED** - Smoke tests run after quality gates pass; failures route to ANALYZE_FIX; blocked routes to HUMAN_VERIFY
17. **SMOKE MANIFEST UPDATES** - Architect proposes new checks in DESIGN_TESTS; SYNC_DOCS appends to manifest automatically
18. **APP VERSIONING** - Bump `package.json` per SemVer in COMMIT phase; does NOT apply to workflow/docs/config files
19. **NO ASSISTANT PREFILLING** - Opus 4.6 returns 400 for assistant message prefilling. Use structured instructions ("Output the following YAML block...") instead.
20. **RESUMABLE FIX CYCLES** - For ANALYZE_FIX → FIX cycles, consider resuming the previous agent (Task tool `resume` parameter) to preserve root cause context, rather than spawning fresh.
