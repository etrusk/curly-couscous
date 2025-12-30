# Manual Verification

## After Automated Tests Pass
Before completing any non-trivial task, provide a manual verification checklist.

## Output Format
"Please verify manually:
- [ ] [Specific action]: [Expected result]
- [ ] [Specific action]: [Expected result]
- [ ] [Specific action]: [Expected result]

Confirm when verified, or report any issues found."

## Examples by Type
- **UI**: "Open /settings page → Click 'Save' → Should show success toast"
- **API**: "Run `curl localhost:3000/api/user` → Should return 200 with user object"
- **CLI**: "Run `npm run build` → Should complete with no warnings"
- **Data**: "Check database → New record should exist with correct fields"

## Important
Wait for human confirmation before marking task complete.
Do not assume verification passed — require explicit confirmation.
