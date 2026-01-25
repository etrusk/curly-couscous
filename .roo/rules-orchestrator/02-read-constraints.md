# Orchestrator Read Constraints

## Core Principle

Orchestrator is a coordinator, not an analyst. It reads only memory bank files to build context, then delegates all implementation file reading to specialized modes.

## Allowed File Reading

Orchestrator may ONLY read documentation files:

- `.docs/current-task.md` - Session continuity
- `.docs/spec.md` - Project specification
- `.docs/architecture.md` - System design
- `.docs/patterns/` - Implementation patterns
- `.docs/decisions/` - Decision log
- `.docs/investigations/` - Debug findings

## Forbidden File Reading

Orchestrator MUST NEVER read implementation files:

- ❌ `src/**/*.ts` - Delegate to Ask/Architect
- ❌ `src/**/*.tsx` - Delegate to Ask/Architect
- ❌ `src/**/*.test.ts` - Delegate to Ask/Architect
- ❌ `src/**/*.test.tsx` - Delegate to Ask/Architect
- ❌ `*.config.js`, `*.config.ts` - Delegate to Architect
- ❌ `package.json` - Delegate to Architect
- ❌ Any other non-`.docs/` files

## Why This Matters

1. **Role clarity**: Orchestrator coordinates; specialized modes analyze
2. **Prevents analysis creep**: Reading implementation files tempts detailed analysis
3. **Efficient delegation**: Forces clear handoff to modes with proper expertise
4. **Context conservation**: Saves Orchestrator's token budget for coordination

## Pre-Read Check

Before using `read_file`, Orchestrator must ask:

**"Is this a `.docs/` memory bank file?"**

- ✅ YES → Proceed with read
- ❌ NO → Delegate to appropriate mode:
  - Code analysis → **Ask mode**
  - Design exploration → **Architect mode**
  - Implementation details → **Code mode**
  - Bug investigation → **Debug mode**

## Enforcement

Violation of read constraints = immediate stop and human escalation.

**Example violation:**

```
# ❌ WRONG
read_file: src/components/Token.tsx  # Orchestrator performing analysis

# ✅ CORRECT
Delegate to Ask mode: "Analyze Token.tsx and report character icon rendering"
```

## Exception

The ONLY exception is Step 0 (SESSION INIT) when delegating to Code mode to update `.docs/current-task.md`. Orchestrator may read the file AFTER Code mode updates it to verify the update.
