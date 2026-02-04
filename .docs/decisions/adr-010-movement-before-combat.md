# ADR-010: Movement Resolution Before Combat

**Date:** 2026-02-05
**Status:** Accepted

## Decision

Change the Resolution Phase order from Healing -> Combat -> Movement to Healing -> Movement -> Combat. Movement now resolves before combat in each tick.

## Context

The spec promises a "2-tick wind-up creates dodge window" for Heavy Punch, and the `my_cell_targeted_by_enemy` trigger exists to enable dodge reactions. Under the previous resolution order (combat before movement), dodging was impossible: when a dodge move and an incoming attack both resolved on the same tick, combat resolved first -- hitting the character before they could move away from the targeted cell.

This made the `my_cell_targeted_by_enemy` trigger functionally useless for its primary intended purpose (dodging telegraphed attacks).

## Options Considered

1. **Healing -> Combat -> Movement (status quo)** -- Dodge window non-functional. Rejected.
2. **Movement -> Healing -> Combat** -- Enables dodge but heals could miss if target moves away before heal resolves. Rejected.
3. **Movement -> Combat -> Healing** -- Enables dodge but breaks ADR-006 (heal before combat for last-moment saves). Rejected.
4. **Healing -> Movement -> Combat** -- Enables dodge, preserves ADR-006 (healing still before combat), heals resolve against pre-movement positions (correct since heal targetCell was locked when ally was still there). **Chosen.**

## Decision Rationale

Option 4 is the only ordering that satisfies all three requirements:

- Dodge window works: characters move away before attacks resolve against their former cell
- ADR-006 preserved: healing still resolves before combat, enabling last-moment saves
- Heal targeting correct: heals resolve before movement, so ally is still in the targeted cell

## Consequences

- (+) Dodge window is functional for wind-up attacks via `my_cell_targeted_by_enemy` trigger + Move
- (+) ADR-006 (Heal before Combat) fully preserved
- (+) Characters who move into a targeted cell on the same tick will be hit (intuitive behavior)
- (-) Characters can flee from attacks that resolve the same tick as their movement (this is the intended behavior per spec)
- (-) Existing test "should apply combat before movement" was updated to reflect the new ordering
- (-) Supersedes the resolution order specified in ADR-006's consequences section

### Interaction with ADR-006

ADR-006 established Healing -> Combat -> Movement. This ADR changes it to Healing -> Movement -> Combat. The core principle of ADR-006 (healing before combat) is preserved. Only the relative position of movement changed.
