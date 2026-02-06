# TDD Workflow Validation Manifest (TEMPORARY)

This file is automatically checked by the orchestrator after REFLECT.
When all checks pass, the orchestrator will ask the human whether to remove this scaffolding.

## Instructions for tdd-reflector

When this file exists, read it AFTER your normal REFLECT analysis. For each assertion below, check the session.md data and report PASS or FAIL. Output a `VALIDATION:` block after your normal REFLECT output.

## Assertions

### WP1: Agent Names

- [ ] All agents in Agent History table use `tdd-` prefix names (not `architect`, `coder`, `reviewer`)
- [ ] At minimum these agents appeared: `tdd-explorer`, `tdd-planner`, `tdd-coder`

### WP2: Enhanced Metrics

- [ ] Agent History table has 8 columns: #, Agent, Phase, Exchanges, Tokens, Tools, Duration, Status, Notes
- [ ] At least one AGENT_COMPLETION block contained `tool_calls` field (check Notes column for non-dash entries)
- [ ] At least one AGENT_COMPLETION block contained `notable_events` field
- [ ] At least one AGENT_COMPLETION block contained `retry_count` field

### WP3: SubagentStop Hook

- [ ] No agent completed without an AGENT_COMPLETION block (all statuses are valid enum values)
- [ ] If WRITE_TESTS phase ran: tests_failing > 0 was reported (red phase)
- [ ] If IMPLEMENT phase ran: all_gates_pass == true was reported (green phase)

### WP4: Context Budgets

- [ ] Context Metrics section shows `/300K` denominator (not `/100K` or `/80K`)

### WP7: Completion Block Format

- [ ] No agent used the old completion format (missing `tool_calls`, `notable_events`, `retry_count`)

## Output Format

```
VALIDATION: [date]
- WP1 Agent Names: PASS | FAIL [details]
- WP2 Enhanced Metrics: PASS | FAIL [details]
- WP3 SubagentStop Gates: PASS | FAIL [details]
- WP4 Context Budgets: PASS | FAIL [details]
- WP7 Completion Format: PASS | FAIL [details]
Overall: X/5 passed
```

Report FAIL with the specific assertion that didn't hold so the issue can be fixed.
