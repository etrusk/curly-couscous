# ADR-014: Dev-Only Window API for Smoke Test State Verification

## Decision

Introduce a `window.__TEST_HARNESS__` API that provides read-only access to game state, conditionally loaded only in development mode. Add `data-testid` attributes to smoke-test-critical UI components.

## Date

2026-02-06

## Status

Accepted

## Context

Smoke tests verify game state by traversing the DOM and accessibility tree, costing ~62K tokens per partial run. This is expensive, fragile (dependent on DOM structure), and slow. A structured API allows single JS calls to verify state programmatically.

## Options Considered

1. **data-testid only** -- Cheaper element targeting, but still requires DOM text parsing for state values.
2. **Full test driver API** (read + write) -- Would allow programmatic state setup, but diverges from "testing what the user sees."
3. **Read-only window API + data-testid** (chosen) -- Verification via JS calls, interaction still via UI. Best balance of token savings and test fidelity.

## Decision Rationale

- Read-only API preserves the principle that smoke tests interact through the UI
- `import.meta.env.DEV` guard ensures zero production bundle impact (Vite tree-shakes the entire module)
- Thin wrapper over `useGameStore.getState()` keeps the API trivially maintainable
- `data-testid` attributes follow existing codebase convention (`cell-${q}-${r}`, `token-${id}`)

## Consequences

- Dev-only dependency on `useGameStore.getState()` for non-React access
- Establishes a pattern for future dev tooling (debug panels, replay inspection)
- Harness API surface (5 methods) must be maintained alongside store changes
- Smoke tests in `.docs/smoke-tests.yaml` gain `verify_js` fields as optional programmatic verification
