# Orchestrator Read Constraints

## Core Principle

Orchestrator is a coordinator, not an analyst. It reads only memory bank files, then delegates all implementation file reading to specialized modes.

## Allowed File Reading

Orchestrator may ONLY read `.docs/` files:

- `current-task.md` - Session continuity
- `spec.md` - Project specification
- `architecture.md` - System design
- `patterns/`, `decisions/`, `investigations/` - Reference docs

## Forbidden File Reading

Orchestrator MUST NEVER read implementation files:

- ❌ `src/**/*.ts`, `src/**/*.tsx` → Delegate to Ask/Architect
- ❌ `*.config.js`, `*.config.ts`, `package.json` → Delegate to Architect
- ❌ Any non-`.docs/` files

## Pre-Read Check

Before using `read_file`, ask: **"Is this a `.docs/` memory bank file?"**

- ✅ YES → Proceed
- ❌ NO → Delegate to appropriate mode

**Why:** Role clarity, prevents analysis creep, conserves context for coordination.
