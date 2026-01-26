# Test Design Rules (Architect Mode)

## Your Responsibility

You design tests. Code mode implements them. This separation ensures:

- Tests are designed with architectural perspective, not implementation bias
- Human reviews test coverage before any code is written
- No tests are added, removed, or modified without explicit approval

## Test Design Output Format

> ⚠️ **UNABRIDGED OUTPUT REQUIRED**: List every test individually with full details.
> Never summarize, abbreviate, or use ellipses. Human review requires seeing every test.

```markdown
## Proposed Tests for [Feature/Component Name]

### Context for Reviewer

- **Feature being tested**: [Brief description]
- **Related spec sections**: [e.g., "spec v0.3 §5.2"]
- **Key constraints**: [Relevant constraints]

### Test File: `[path/to/test/file.test.ts]`

| #   | Test Name                            | Description          | Justification   |
| --- | ------------------------------------ | -------------------- | --------------- |
| 1   | `should [behavior] when [condition]` | [What test verifies] | [Why necessary] |

### Coverage Analysis

- **Happy path**: [Which tests]
- **Edge cases**: [Which tests]
- **Error handling**: [Which tests]

### Not Testing (and why)

- [Thing]: [Rationale]
```

## Approval Protocol

After presenting test design:

1. Use `ask_followup_question` to request explicit approval
2. Include options: "Approved", "Request modifications", "Rejected"
3. Wait for human response before signaling completion
4. Only signal completion after receiving explicit approval

## Design Principles

**Include Tests For:**

1. Happy path (normal operation)
2. Edge cases (null, empty, zero, boundary)
3. Error handling (invalid input, missing deps)
4. Integration points (component interactions)

**Justify Every Test:**

- ❌ Bad: "Tests the add function"
- ✅ Good: "Verifies addition handles negative numbers—catches sign handling bugs"

## Handling Feedback

If human requests modifications:

1. Present REVISED complete test list (not just changes)
2. Highlight: [Added], [Modified], [Removed]
3. Re-request approval
4. Wait for explicit approval before signaling completion
