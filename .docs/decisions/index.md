# Architectural Decision Records (ADR)

This file documents significant architectural and design decisions made during development.

## Format

Each decision should include:

- **Decision**: What was decided
- **Date**: When the decision was made
- **Context**: What prompted this decision
- **Options Considered**: Alternative approaches evaluated
- **Decision Rationale**: Why this option was chosen
- **Consequences**: Trade-offs, implications, and follow-up work

## Decisions

### ADR-001: Spike and Stabilize Pattern for Discovery

**Decision**: Adopt explicit Discovery Track (spikes) separate from Delivery Track (12-step TDD workflow)

**Date**: 2026-01-03

**Context**: AI-assisted development research shows 8x increase in code duplication and 40-73% security vulnerabilities in AI-generated code (GitClear 2024-2025 analysis of 211M lines). Need way to explore uncertainties without compromising production code quality. Existing 12-step TDD workflow optimized for delivery, not discovery.

**Options Considered**:

1. **Status quo**: Force all exploration through TDD workflow
   - Con: Wastes resources testing ideas that should be killed
   - Con: TDD optimized for delivery, not learning velocity

2. **Informal exploration**: Let developers explore without structure
   - Con: No discipline on when to transition to production
   - Con: Prototype code tends to get merged "with tests added later"
   - Con: Research shows adding tests after requires MORE discipline than TDD

3. **Spike and Stabilize** (chosen): Explicit Phase 0 before TDD workflow
   - Pro: Separates discovery thinking from delivery thinking
   - Pro: Hard reset prevents technical debt accumulation
   - Pro: Learnings transfer, code doesn't
   - Pro: Clear transition gate ("Can I write a failing test?")

**Decision Rationale**:

- **Two modes of thinking**: Discovery (learning velocity) vs. Delivery (predictability/quality) require different approaches
- **Throwaway code is cheaper**: Testing ideas with disposable code faster than building production-quality software
- **Transition gate prevents debt**: "Can I write a failing test?" ensures readiness before delivery
- **Git branch strategy enforces discipline**: `spike/*` always deleted, `feat/*` permanent

**Implementation**:

- Created `.roo/rules/09-spike-workflow.md` with streamlined protocol
- Human says "spike" to trigger Discovery Track
- Learnings captured in `.docs/current-task.md` (3-5 bullets)
- Hard reset only (no soft merge option)
- Single transition gate: "Can I write a failing test?"

**Consequences**:

✅ **Benefits**:

- Reduces risk of AI-generated technical debt in production
- Separates exploration from implementation cognitively
- Preserves 12-step TDD workflow quality gates unchanged
- Provides safe space for vibe coding with AI tools

⚠️ **Risks**:

- Developers might skip hard reset (discipline required)
- Could become excuse to avoid TDD (monitor for misuse)
- Timeboxing requires self-discipline

📋 **Follow-up Work**:

- None immediately—pattern ready to use
- Monitor effectiveness over 5-10 spike sessions
- Consider adding examples to `.docs/patterns/` if pattern proves valuable
