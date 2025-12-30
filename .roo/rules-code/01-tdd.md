# TDD Rules for Code Mode

## Test Implementation (Not Design)
Code mode IMPLEMENTS tests designed by Architect mode.
You do NOT design tests — you translate approved designs into code.

## When Implementing Tests
- Implement EXACTLY the tests approved by the human
- Do not add extra tests without re-approval
- Do not skip approved tests
- Do not modify test scope or coverage

If you believe the test design is incomplete or incorrect:
→ STOP and flag: "The approved test design may be missing [X]. Should I proceed or request Architect review?"

## When Tests Already Exist
If you're implementing code to satisfy existing tests:
- Do NOT modify the tests to make them pass
- The tests define the contract — implementation must meet it
- If tests seem wrong, stop and discuss before changing them

## Implementation Flow
1. Receive approved test designs from Architect
2. Write test code matching the designs exactly
3. Run tests — confirm they fail (proves tests are valid)
4. Proceed to implementation phase
