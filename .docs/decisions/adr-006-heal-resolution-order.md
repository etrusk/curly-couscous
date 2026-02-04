# ADR-006: Heal Resolution Before Combat

**Date:** 2026-02-03
**Status:** Accepted

## Decision

Heal actions resolve before combat (attack) actions in the Resolution Phase. The resolution order is: Healing → Combat → Movement.

## Context

Adding heal as a new action type required deciding where it fits in the resolution order. The Resolution Phase previously had two steps: Combat → Movement. Healing needed to be placed relative to these.

## Options Considered

1. **Heal before combat** -- Heals apply first, then attacks resolve against the healed HP values. (Chosen)
2. **Heal after combat** -- Attacks resolve first, then heals apply to surviving characters.
3. **Simultaneous with combat** -- Heals and attacks resolve in the same step, requiring complex ordering logic.

## Decision Rationale

Option 1 makes healing tactically meaningful:

- A well-timed heal can save an ally from a lethal attack (heal raises HP above the damage threshold before damage is applied)
- Creates interesting counterplay: healers must anticipate incoming damage and commit 2 ticks in advance
- Rewards players who correctly predict enemy targeting and timing
- Simpler implementation: healing is a standalone step with no interaction with combat logic

Option 2 would make healing reactive rather than predictive, reducing tactical depth. Option 3 adds unnecessary complexity.

## Consequences

- Healing is predictive, not reactive -- healer must commit 2 ticks before damage lands
- Last-moment saves are possible: a heal resolving the same tick as a lethal attack will save the target
- Resolution order in `game-core.ts` processTick: `resolveHealing()` → `resolveCombat()` → `resolveMovement()`
- Cell-based targeting means the heal can "miss" if the ally moves away during the wind-up period
