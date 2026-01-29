# ADR-004: Local React State for UI-Only Concerns

## Decision

Use local React state (useState/useRef) instead of Zustand for purely UI concerns like tooltip visibility, hover states, and transient interactions that have no impact on game logic.

## Date

2026-01-29

## Context

When implementing the character tooltip system, we needed to track which character token is being hovered. This state determines whether and where to render a tooltip.

Two options were considered:

1. Add hover state to Zustand global store
2. Use local React state in BattleViewer component

## Options Considered

### Option 1: Zustand Global Store

**Pros:**

- Consistent with existing state management patterns
- Accessible from any component in the tree
- Could enable future features like programmatic tooltip display

**Cons:**

- Adds complexity to global store for ephemeral UI state
- Unnecessary subscriptions in unrelated components
- Game state should not include view-layer concerns
- Violates separation between game logic and presentation

### Option 2: Local React State

**Pros:**

- Simpler implementation
- State scoped to components that need it
- No pollution of global game state
- React handles cleanup automatically
- Follows React idioms for transient UI state

**Cons:**

- Cannot access hover state outside BattleViewer subtree
- Would need refactoring if tooltips need programmatic control

## Decision Rationale

Chose Option 2 (local React state) because:

1. **Separation of concerns**: Tooltip visibility is purely a UI concern with no impact on game logic
2. **Simplicity**: Local state is simpler and sufficient for current requirements
3. **Performance**: Avoids global re-render triggers for mouseover events
4. **Precedent**: Follow React best practices for transient UI state

## Consequences

**Accepted trade-offs:**

- Tooltip state not accessible outside BattleViewer component tree
- If future features need programmatic tooltip control (e.g., tutorial highlighting), will need to lift state or add context provider

**Follow-up:**

- Apply this pattern to other transient UI states (dropdown visibility, etc.)
- Reconsider if cross-component tooltip coordination becomes necessary
