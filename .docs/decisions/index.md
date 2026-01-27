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

---

### ADR-002: Uniform Intent Line Filtering for All Action Types

**Decision**: Use uniform `ticksRemaining >= 0` filtering for all action types (attack, move) instead of special-casing movement actions.

**Date**: 2026-01-27

**Context**: During implementation of intent line visualization, a "movement exception" was introduced where movement actions were shown at `ticksRemaining = 0` but attack actions required `ticksRemaining > 0`. This created inconsistent behavior and confusion about when actions should display intent lines. User reported 4 intent line issues, including Light attack lines not showing and movement lines not showing.

**Options Considered**:

1. **Movement exception** (previous approach):
   - Attack actions: `ticksRemaining > 0` (filter out at tick 0)
   - Movement actions: `ticksRemaining >= 0` (show at tick 0)
   - Rationale: "Movement has no visible damage effect"
   - Con: Violates spec.md line 122 which requires `>= 0` for ALL actions
   - Con: Creates inconsistent UX (why would movement be special?)
   - Con: Light Punch (tickCost=1) not visible on tick before resolution

2. **Uniform filtering** (chosen): `ticksRemaining >= 0` for all actions
   - All actions shown when `ticksRemaining >= 0`
   - Filtered when `ticksRemaining < 0` (already resolved)
   - Pro: Matches spec requirement exactly
   - Pro: Consistent UX - all actions behave the same
   - Pro: Simpler code - no special cases
   - Pro: Light Punch (tickCost=1) visible for 1 tick before resolution

**Decision Rationale**:

1. **Spec compliance**: spec.md line 122 explicitly states "Intent lines appear for all pending actions with `ticksRemaining >= 0`"

2. **Complete information principle**: Design vision emphasizes "Complete information enables meaningful decisions—show exactly what will happen." Hiding attack intent lines at ticksRemaining=0 violates this.

3. **Simplicity**: Uniform filtering is easier to understand, test, and maintain than special cases.

4. **Separation of concerns**: Action type distinctions are visual (dashed lines for movement, solid for attacks) not logical (filtering rules).

**Implementation**:

- Changed `src/stores/gameStore-selectors.ts` filter from:

  ```typescript
  intent.ticksRemaining > 0 ||
    (intent.action.type === "move" && intent.ticksRemaining >= 0);
  ```

  to:

  ```typescript
  intent.ticksRemaining >= 0;
  ```

- Updated comment to reflect uniform filtering for all action types
- Added 11 regression tests covering Light/Heavy Punch and Movement at various ticksRemaining values

**Consequences**:

✅ **Benefits**:

- All actions (Light Punch, Heavy Punch, Movement) visible for at least 1 tick before resolution
- Consistent behavior across all action types
- Simpler code with no special cases
- Aligns perfectly with spec.md requirements
- Easier to reason about for developers and players

⚠️ **Trade-offs**:

- Actions resolving on current tick now show intent lines (attack lines visible even as attack lands)
- This is actually correct per spec, but may feel slightly different from previous behavior

📋 **Follow-up Work**:

- None - implementation complete and tested
- INV-001 updated to note the "movement exception" was a misinterpretation of spec
