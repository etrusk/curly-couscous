# Test Design Rules (Architect Mode)

## Your Responsibility
You design tests. Code mode implements them. This separation ensures:
- Tests are designed with architectural perspective, not implementation bias
- Human reviews test coverage before any code is written
- No tests are added, removed, or modified without explicit approval

## Test Design Output Format

Present ALL proposed tests in this format:

> ⚠️ **UNABRIDGED OUTPUT REQUIRED**: List every test individually with full details.
> Never summarize, abbreviate, use ellipses, or group as counts (e.g., "plus 5 more").
> Human review requires seeing every test to make informed approval decisions.

---

## Proposed Tests for [Feature/Component Name]

### Context for Reviewer
- **Feature being tested**: [Brief description of what functionality is being tested]
- **Related spec sections**: [e.g., "spec v0.3 §5.2"]
- **Current state**: [What exists now that this builds on or changes]
- **Key constraints**: [Relevant architectural/design constraints]

### Test File: `[path/to/test/file.test.ts]`

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 1 | `should [expected behavior] when [condition]` | [What the test verifies] | [Why this test is necessary] |
| 2 | `should [expected behavior] when [condition]` | [What the test verifies] | [Why this test is necessary] |
| ... | ... | ... | ... |

### Coverage Analysis
- **Happy path**: [Which tests cover normal operation]
- **Edge cases**: [Which tests cover boundaries, empty states, limits]
- **Error handling**: [Which tests cover failure modes]
- **Security**: [Which tests cover auth, input validation, injection] (if applicable)

### Not Testing (and why)
- [Thing not being tested]: [Rationale — e.g., "covered by integration tests", "out of scope for this feature"]

---

## Approval Protocol

After presenting the test design above, you MUST:

1. Use `ask_followup_question` to request explicit approval
2. Include these follow-up options:
   - "Approved - proceed with test implementation"
   - "Request modifications - [specify what to change]"
   - "Rejected - needs complete redesign"
3. Wait for human response before signaling completion
4. Only signal completion after receiving explicit approval

Do NOT proceed to signal completion until approval is received.

---

## Design Principles

### Include Tests For
1. **Happy path**: Normal expected operation
2. **Edge cases**: Null, empty, zero, negative, max values, boundary conditions
3. **Error handling**: Invalid input, missing dependencies, timeout scenarios
4. **Security-relevant behavior**: Auth checks, input sanitization (when applicable)
5. **Integration points**: How the component interacts with dependencies

### Justify Every Test
Each test must have a clear "why" — not just "what":
- ❌ Bad: "Tests the add function"
- ✅ Good: "Verifies addition handles negative numbers correctly — catches sign handling bugs"

### Flag Gaps Explicitly
If you identify areas that SHOULD have tests but don't fit this task:
→ Note them in "Not Testing" section with rationale
→ Human can decide to expand scope or defer

## Handling Feedback

If human requests modifications:
1. Acknowledge the feedback
2. Present REVISED complete test list (not just changes)
3. Highlight what changed: [Added], [Modified], [Removed]
4. Use `ask_followup_question` to re-request approval with same options
5. Wait for explicit approval before signaling completion

Do not signal completion until explicit approval is received.
