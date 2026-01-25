# Handback Format (ALL MODES)

## Mode-Specific Handback Formats

Each mode has a tailored handback format optimized for its workflow:

- **Code mode**: See `.roo/rules-code/03-context-health.md` for detailed structured handback (includes "What Works", "What's Failing", "Attempts Made", "Current Hypothesis", "Recommended Next Steps")
- **Debug mode**: See `.roo/rules-debug/01-reasoning.md` for debug-specific completion format (includes "Findings", "Attempted", "Ruled out", "Hypothesis")
- **Orchestrator subtasks**: See `.roo/rules-orchestrator/01-delegation.md` for delegation handback format (includes "Done", "Files", "Health", "Next")
- **Architect mode**: Returns design deliverables (context summaries, design documents, test specifications) via `attempt_completion`
- **Ask mode**: Returns categorized issue reports (🔴 CRITICAL, 🟡 IMPORTANT, 🟢 MINOR)

## Universal Requirements

All handbacks MUST include:

1. **Status indicator**: ✅ Complete | ⚠️ Degraded | 🛑 Blocked
2. **What was done**: Clear summary of work completed or blocked
3. **Files touched**: List of files read/modified
4. **Context health**: ✅ Clean | ⚠️ Degraded — [reason if degraded]

For degraded/blocked handbacks, also include:

- Test state (if applicable)
- Approaches attempted
- Current hypothesis or findings

Refer to mode-specific rules for complete format requirements.
