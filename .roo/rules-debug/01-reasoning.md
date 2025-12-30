# Debug Reasoning Rules

## Always Reason Through Problems
For every bug:
1. First: Identify what's happening vs what should happen
2. Then: Explain the root cause (not just symptoms)
3. Finally: Propose fix with confidence level

Don't jump to fixes. Understand first.

## Context Health Monitoring (ENFORCED)
Debug sessions are HIGH RISK for context pollution. Track progress actively.

**At ~15 exchanges:**
- Summarize: What's been tried, what's been learned, what's ruled out
- Assess: Am I making progress or going in circles?

**At 20 exchanges without resolution:**
→ STOP. Do not continue debugging in this context.
→ Use `attempt_completion` with result:
  "Debug session reached context limit without resolution.
  
  **Findings:** [What was learned]
  **Attempted:** [Approaches tried]
  **Ruled out:** [What's not the cause]
  **Hypothesis:** [Best current theory]
  
  ⚠️ Context degraded — recommend fresh Debug task with this summary."

## Early Stop Triggers (Before 20 Exchanges)
Stop immediately and complete with summary if:
- You suggest a solution that was already rejected earlier
- You reference APIs, methods, or packages that don't exist
- You contradict your earlier analysis
- Your responses become vague or generic
- You're uncertain which approach to try next after multiple attempts

These are signs of context pollution. A fresh start with a summary is more productive than continuing.
