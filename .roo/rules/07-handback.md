# Handback Format (ALL MODES)

Every degraded/blocked handback MUST use this format:

```
**Status**: 🛑 Blocked | ⚠️ Degraded | ✅ Complete
**Summary**: [One sentence - what was accomplished or blocked on]
**Files**: [List of files read/modified]
**Test State**: [X passing / Y failing] (if tests exist)
**Attempts**: [Numbered list of approaches tried] (if blocked/degraded)
**Hypothesis**: [Current best theory on root cause/next step]
**Health**: ✅ Clean | ⚠️ Degraded — [reason]
```

## Required Fields by Status

| Field      | ✅ Complete   | ⚠️ Degraded | 🛑 Blocked |
| ---------- | ------------- | ----------- | ---------- |
| Summary    | ✓             | ✓           | ✓          |
| Files      | ✓             | ✓           | ✓          |
| Test State | if applicable | ✓           | ✓          |
| Attempts   | -             | ✓           | ✓          |
| Hypothesis | -             | ✓           | ✓          |
| Health     | ✓             | ✓           | ✓          |
