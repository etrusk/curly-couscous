# Combat Resolution Test Design

## Overview

This document defines test cases for the `resolveCombat()` function, which handles the attack resolution portion of the Resolution Phase. This follows the pattern established in [`docs/test-design-trigger-evaluation.md`](docs/test-design-trigger-evaluation.md).

**Related Spec Sections:**
- [`.roo/rules/00-project.md`](.roo/rules/00-project.md) lines 80-84: Resolution Phase rules
- [`.roo/rules/00-project.md`](.roo/rules/00-project.md) lines 32-42: Skill definitions (damage values)
- [`src/engine/types.ts`](src/engine/types.ts): Character, Action, DamageEvent, DeathEvent interfaces

---

## Design Decisions

### Decision 1: Function Scope

**Question:** What should `resolveCombat()` handle?

**Answer: Attack resolution and damage only.**

Per project structure (`.roo/rules/00-project.md` line 157):
- `combat.ts` — Attack resolution, damage calculation
- `movement.ts` — Movement, collision resolution

Combat handles steps 1 and 4 of Resolution Phase:
1. Attacks: Check if target still in locked cell → hit or miss
4. Remove characters with HP ≤ 0

Movement is handled separately in `movement.ts`.

---

### Decision 2: When Actions Resolve

**Question:** When does an action with `ticksRemaining=N` resolve?

**Answer: Actions with `ticksRemaining === 1` at start of resolution phase resolve this tick.**

Game flow:
1. Decision Phase: Actions committed with initial `ticksRemaining = skill.tickCost`
2. Resolution Phase: Decrement `ticksRemaining`, resolve if now 0

For `resolveCombat()`:
- Input: Characters with actions where `ticksRemaining === 1` (will resolve)
- These are the "ready to resolve" attacks

---

### Decision 3: Attack Targeting Model — Cell-Only

**Question:** Does an attack hit the original target only, or whoever is in the targeted cell?

**Answer: Cell-only — attacks hit whoever occupies the targeted cell at resolution time.**

This enables bodyblocking as an emergent tactic:
- Ally can move into the targeted cell to "take the hit" for a wounded teammate
- Consistent with Into the Breach's design (a stated inspiration)
- Matches intuition: "attack that location" not "track that person"
- Simpler implementation (no need to verify original target identity)

**Example:**
- A commits Heavy Punch targeting cell (3,3) where B stands
- B moves to (4,3), C moves to (3,3)
- Resolution: Attack hits C (whoever is now at 3,3), not B

---

### Decision 4: Hit/Miss Determination

**Question:** How is hit/miss determined?

**Answer: Check if ANY character occupies the targeted cell.**

- **HIT**: Any character's `position` matches action's `targetCell` → damage that character
- **MISS**: No character occupies `targetCell` → attack whiffs

This follows from Cell-only targeting (Decision 3).

---

### Decision 5: Simultaneous Damage Application

**Question:** In what order is damage applied?

**Answer: All damage is calculated first, then applied simultaneously.**

This enables mutual kills:
1. Calculate all damage from all resolving attacks
2. Apply all damage to targets
3. Check for deaths (HP ≤ 0)

If damage were applied sequentially, a fast character could kill a slow one before the slow one's attack resolves. Simultaneous execution prevents this.

---

### Decision 6: Damage Stacking

**Question:** What happens when multiple attacks hit the same target?

**Answer: All damage stacks (sums).**

- Character A attacks Target for 10 damage
- Character B attacks Target for 25 damage
- Target takes 35 total damage

No diminishing returns, no damage caps (in v0.3).

---

### Decision 7: Overkill Damage / HP Clamping

**Question:** Is damage capped at remaining HP?

**Answer: No — damage is applied as-is, HP can go negative.**

- Target has 10 HP, takes 25 damage → HP becomes -15
- Simplifies damage event reporting (always shows actual damage dealt)
- Death check is simply `hp <= 0`
- UI can choose to display 0 instead of negative values

---

### Decision 8: Death Timing and Character Removal

**Question:** When are dead characters removed?

**Answer: Dead characters remain in returned array; caller handles removal.**

`resolveCombat()` returns:
- Updated characters with new HP values (including dead ones with HP ≤ 0)
- `DeathEvent` for each character with HP ≤ 0

The calling code (game tick processor) handles actual removal from game state. This allows:
- Death events to be logged with full character context
- Simultaneous death detection (for draw condition)
- Clean separation of concerns
- Overkill damage visibility

---

### Decision 9: Attack on Dead Target

**Question:** What happens if target died earlier this tick (from another attack)?

**Answer: Attack still hits if target in correct cell.**

Since damage is simultaneous:
1. All attacks check positions at tick start
2. All damage applied simultaneously
3. Deaths determined after all damage

A character can "trade" — both die on same tick.

---

### Decision 10: Self-Targeting Attacks

**Question:** Can a character attack themselves?

**Answer: Possible but unlikely in v0.3.**

All v0.3 attack skills use enemy selectors. However, if a character ends up at their own attack's target cell (edge case), the attack would hit them per Cell-only targeting.

---

### Decision 11: Missing Target Character

**Question:** What if `targetCharacter` in Action references a character not in the array?

**Answer: Use Cell-only resolution — check if ANY character is in targetCell.**

Since we use Cell-only targeting, the `targetCharacter` field is informational (for logging/UI). Resolution checks `targetCell` against all character positions.

---

### Decision 12: Undefined Damage Value

**Question:** What if `skill.damage` is undefined?

**Answer: Treat as 0 damage.**

The `Skill` interface has `damage?: number` (optional). For attacks without explicit damage, default to 0. This enables future "utility" attacks that apply effects without damage.

---

### Decision 13: Event Ordering

**Question:** In what order should events appear in the result?

**Answer: Ordered by attacker's `slotPosition` for determinism.**

For replay and debugging consistency:
1. Process attacks in attacker `slotPosition` order (lower first)
2. DamageEvents appear before DeathEvents
3. All DamageEvents for a target appear before that target's DeathEvent

---

## Function Signature

```typescript
/**
 * Result of combat resolution containing updated state and events.
 */
export interface CombatResult {
  /** Characters with updated HP values after damage */
  updatedCharacters: Character[];
  /** Damage and death events generated during resolution */
  events: (DamageEvent | DeathEvent)[];
}

/**
 * Resolves all attack actions for the current tick.
 * 
 * Handles the attack portion of Resolution Phase:
 * 1. For each attack action ready to resolve (ticksRemaining === 1)
 * 2. Check if target is still in locked cell (hit/miss)
 * 3. Apply damage simultaneously
 * 4. Generate damage events and death events
 * 
 * @param characters - All characters in the battle
 * @param tick - Current game tick (for event timestamps)
 * @returns CombatResult with updated characters and events
 * 
 * @preconditions
 * - All characters have valid positions
 * - Attack actions have valid targetCell and targetCharacter
 * - Characters with HP <= 0 should have been removed in previous tick
 */
export function resolveCombat(
  characters: Character[],
  tick: number
): CombatResult;
```

---

## Proposed Tests for `resolveCombat()`

### Test File: `src/engine/combat.test.ts`

---

### Section 1: Basic Attack Hit

**Purpose**: Verify attacks hit when target remains in locked cell.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 1 | `should hit target when target is in locked cell` | Attacker at (0,0) with attack action targeting (1,0); Target at (1,0) → hit, damage applied | Core hit detection — target stayed in targeted cell |
| 2 | `should apply correct damage from skill` | Light Punch (damage=10) hits → target HP reduced by 10 | Damage comes from skill.damage property |
| 3 | `should generate DamageEvent on hit` | Attack hits → DamageEvent with sourceId, targetId, damage, resultingHp | Event logging for UI and history |
| 4 | `should include correct tick in DamageEvent` | Attack at tick 5 → DamageEvent.tick === 5 | Events timestamped for history |
| 5 | `should handle Heavy Punch damage correctly` | Heavy Punch (damage=25) hits → target HP reduced by 25 | Different skills have different damage values |

---

### Section 2: Attack Miss

**Purpose**: Verify attacks miss when no character occupies targeted cell.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 6 | `should miss when no character in target cell` | Action targeting (1,0); Cell is empty (target moved) → miss, no damage | Core miss detection — cell empty |
| 7 | `should not generate DamageEvent on miss` | Attack misses → no DamageEvent generated | No damage = no damage event |
| 8 | `should not modify any HP on miss` | Attack misses empty cell → all characters unchanged | Miss means no effect |

---

### Section 3: Bodyblocking (Cell-Only Targeting)

**Purpose**: Verify attacks hit whoever occupies the targeted cell, enabling bodyblocking tactics.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 9 | `should hit different character who moved into target cell` | A attacks (1,0) where B was; B moves to (2,0), C moves to (1,0) → C takes damage | Cell-only targeting — hit whoever is there |
| 10 | `should allow ally to bodyblock for teammate` | Enemy attacks cell (5,5) where wounded Ally A is; Ally B moves to (5,5), A moves away → B takes friendly fire | Bodyblocking emergent tactic |
| 11 | `should generate DamageEvent with actual target hit` | A attacks cell where B was; C now there → DamageEvent.targetId === C.id | Events reflect actual target |
| 12 | `should hit self if attacker moves into own target cell` | A attacks (3,3); A moves to (3,3) during resolution → A hits self | Cell-only means even self can be hit |

---

### Section 4: Multiple Attacks Same Target

**Purpose**: Verify damage stacking from simultaneous attacks.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 13 | `should apply damage from multiple attackers to same target` | Attacker A (10 dmg) and Attacker B (25 dmg) both hit Target → Target takes 35 damage | Simultaneous damage stacking |
| 14 | `should generate separate DamageEvents for each attacker` | Two attackers hit same target → two DamageEvents generated | Each attack logged separately |
| 15 | `should show cumulative HP in sequential DamageEvents` | Target at 100 HP; Attack A (10 dmg), Attack B (25 dmg) → Events show resultingHp=90 then resultingHp=65 | Events reflect running HP total |
| 16 | `should handle three attackers on same target` | Three attackers deal 10+10+25=45 damage → target takes 45 total | No limit on simultaneous attackers |

---

### Section 5: Death Detection

**Purpose**: Verify characters with HP ≤ 0 are flagged for death.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 17 | `should generate DeathEvent when HP reaches exactly 0` | Target at 10 HP takes 10 damage → HP=0, DeathEvent generated | Zero HP means death |
| 18 | `should generate DeathEvent when HP goes negative` | Target at 10 HP takes 25 damage → HP=-15, DeathEvent generated | Overkill still causes death |
| 19 | `should include correct characterId in DeathEvent` | Target "char-1" dies → DeathEvent.characterId === "char-1" | Identify who died |
| 20 | `should include correct tick in DeathEvent` | Death at tick 3 → DeathEvent.tick === 3 | Event timestamped |
| 21 | `should not generate DeathEvent when HP remains positive` | Target at 100 HP takes 25 damage → HP=75, no DeathEvent | Alive means no death event |
| 22 | `should generate DeathEvent after DamageEvent in events array` | Attack kills target → events array has DamageEvent before DeathEvent | Logical ordering: damage causes death |
| 23 | `should keep dead characters in returned array` | Target dies → still present in updatedCharacters with HP ≤ 0 | Caller handles removal |

---

### Section 6: Simultaneous Kills (Mutual Elimination)

**Purpose**: Verify mutual kills work correctly for draw detection.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 24 | `should allow both characters to die on same tick` | A attacks B (killing blow), B attacks A (killing blow), both in range → both die | Mutual elimination = draw |
| 25 | `should generate DeathEvents for both characters` | Mutual kill → two DeathEvents generated | Both deaths recorded |
| 26 | `should apply damage from dying character` | A at 10 HP attacks B; B at 10 HP attacks A; both deal 25 damage → both take damage and die | "Trading" — dying doesn't prevent attack |
| 27 | `should handle three-way mutual kill` | A→B, B→C, C→A, all lethal → all three die | Complex simultaneous deaths |

---

### Section 7: Multiple Independent Attacks

**Purpose**: Verify multiple attack pairs resolve correctly.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 28 | `should resolve multiple independent attack pairs` | A attacks B, C attacks D → both attacks resolve independently | Parallel combat scenarios |
| 29 | `should handle mix of hits and misses` | A attacks B (hit), C attacks D (miss) → A's attack applies, C's doesn't | Mixed resolution outcomes |
| 30 | `should handle attacker with no action` | A has attack action, B has no currentAction → only A's attack resolves | Not everyone attacks every tick |

---

### Section 8: Action Filtering

**Purpose**: Verify only ready attack actions resolve.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 31 | `should only resolve actions with ticksRemaining === 1` | A has ticksRemaining=1 (resolves), B has ticksRemaining=2 (doesn't) → only A's attack applies | Only "ready" actions resolve |
| 32 | `should ignore move actions` | Character has move action (type='move') → no combat resolution | Combat only handles attacks |
| 33 | `should ignore idle actions` | Character has idle action (type='idle') → no combat resolution | Idle is not an attack |
| 34 | `should handle character with null currentAction` | Character has currentAction=null → skipped in combat resolution | No action = nothing to resolve |

---

### Section 9: Edge Cases

**Purpose**: Verify graceful handling of unusual states.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 35 | `should return empty events when no attacks resolve` | All characters have move actions or null → empty events array | No attacks = no combat events |
| 36 | `should return unchanged characters when no attacks resolve` | No attack actions → characters unchanged | No attacks = no HP changes |
| 37 | `should handle empty characters array` | Empty array input → empty result | Defensive: empty battle |
| 38 | `should handle attack when targetCharacter not in array` | Action references missing character; check cell instead → hit if occupied, miss if empty | Cell-only fallback |
| 39 | `should preserve non-HP character properties` | Attack resolves → character id, name, faction, position unchanged | Only HP changes from damage |

---

### Section 10: HP Boundary Cases

**Purpose**: Verify HP calculations at boundaries.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 40 | `should handle target at 1 HP surviving` | Target at 1 HP, takes 0 damage (skill.damage undefined) → still alive | Boundary: HP=1 is alive |
| 41 | `should handle exactly lethal damage` | Target at 25 HP takes exactly 25 damage → HP=0, dies | Boundary: HP=0 is dead |
| 42 | `should handle massive overkill without clamping` | Target at 10 HP takes 100 damage → HP=-90, one DeathEvent | HP goes negative, no clamping |
| 43 | `should handle target at maxHP taking damage` | Target at 100/100 HP takes 10 damage → 90/100 HP | Full health target |

---

### Section 11: Undefined Damage and Event Ordering

**Purpose**: Verify edge cases for damage values and deterministic event ordering.

| # | Test Name | Description | Justification |
|---|-----------|-------------|---------------|
| 44 | `should treat undefined skill.damage as 0` | Skill with no damage property hits → 0 damage, DamageEvent with damage=0 | Future utility attacks |
| 45 | `should order events by attacker slotPosition` | A (slot 2) and B (slot 1) both attack → B's event first | Deterministic for replay |
| 46 | `should order all DamageEvents before DeathEvents` | Multiple kills → all DamageEvents, then all DeathEvents | Logical causality |

---

## Coverage Analysis

| Category | Tests | Notes |
|----------|-------|-------|
| **Happy path** | #1-5 | Basic hit + damage |
| **Miss detection** | #6-8 | Empty cell = miss |
| **Bodyblocking** | #9-12 | Cell-only targeting, friendly fire, self-hit |
| **Damage stacking** | #13-16 | Multiple attackers |
| **Death detection** | #17-23 | HP ≤ 0 handling, character retention |
| **Mutual kills** | #24-27 | Simultaneous death |
| **Multiple combats** | #28-30 | Independent attacks |
| **Action filtering** | #31-34 | Only ready attacks resolve |
| **Edge cases** | #35-39 | Empty, missing target, preservation |
| **HP boundaries** | #40-43 | Exact values, overkill, undefined damage |
| **Event ordering** | #44-46 | Determinism, causality |

---

## Not Testing (and Why)

| Item | Rationale |
|------|-----------|
| Movement collision | Handled in `movement.ts` |
| Decision phase logic | Handled in `game.ts` |
| Target selection | Handled in `selectors.ts` |
| Trigger evaluation | Handled in `triggers.ts` |
| Invalid positions | Precondition — validated elsewhere |
| Negative damage values | Validated at skill creation |
| Non-integer damage | TypeScript type enforcement |
| Character removal from array | Caller responsibility after death events |
| HP clamping to 0 | Decision 7: HP intentionally goes negative |

---

## Preconditions (Documented)

The following are **caller responsibilities**, not validated by `resolveCombat()`:

1. **Characters have valid positions** — Within 12×12 grid bounds
2. **Attack actions have valid targetCell** — Must be valid grid position
3. **Actions have non-negative ticksRemaining** — 0 or greater
4. **Skill damage is non-negative** — 0 or greater (undefined treated as 0)
5. **Dead characters removed from previous tick** — No HP ≤ 0 characters in input

**Note:** `targetCharacter` is informational; resolution uses cell-only targeting.

---

## Test Count Summary

| Section | Test Count |
|---------|------------|
| 1. Basic Attack Hit | 5 |
| 2. Attack Miss | 3 |
| 3. Bodyblocking | 4 |
| 4. Multiple Attacks Same Target | 4 |
| 5. Death Detection | 7 |
| 6. Simultaneous Kills | 4 |
| 7. Multiple Independent Attacks | 3 |
| 8. Action Filtering | 4 |
| 9. Edge Cases | 5 |
| 10. HP Boundary Cases | 4 |
| 11. Undefined Damage and Event Ordering | 3 |
| **Total** | **46** |

---

## Implementation Notes

### Test Helper Functions

Reuse helpers from [`selectors.test.ts`](src/engine/selectors.test.ts) and [`triggers.test.ts`](src/engine/triggers.test.ts):

```typescript
function createCharacter(overrides: Partial<Character>): Character {
  return {
    id: overrides.id ?? 'test-char',
    name: overrides.name ?? 'Test Character',
    faction: overrides.faction ?? 'friendly',
    slotPosition: overrides.slotPosition ?? 0,
    hp: overrides.hp ?? 100,
    maxHp: overrides.maxHp ?? 100,
    position: overrides.position ?? { x: 0, y: 0 },
    skills: overrides.skills ?? [],
    currentAction: overrides.currentAction ?? null,
  };
}

function createAttackAction(
  targetCell: Position,
  targetCharacter: Character,
  damage: number = 10,
  ticksRemaining: number = 1
): Action {
  return {
    type: 'attack',
    skill: {
      id: 'test-attack',
      name: 'Test Attack',
      tickCost: 1,
      range: 1,
      damage,
      enabled: true,
      triggers: [],
    },
    targetCell,
    targetCharacter,
    ticksRemaining,
  };
}
```

### Suggested Implementation Pattern

```typescript
export function resolveCombat(
  characters: Character[],
  tick: number
): CombatResult {
  const events: (DamageEvent | DeathEvent)[] = [];
  const updatedCharacters = characters.map(c => ({ ...c })); // shallow copy
  
  // 1. Find all resolving attacks, sorted by attacker slotPosition for determinism
  const resolvingAttacks = characters
    .filter(c => c.currentAction?.type === 'attack' && c.currentAction.ticksRemaining === 1)
    .map(c => ({ attacker: c, action: c.currentAction! }))
    .sort((a, b) => a.attacker.slotPosition - b.attacker.slotPosition);
  
  // 2. Calculate and apply damage (cell-only targeting)
  for (const { attacker, action } of resolvingAttacks) {
    // Cell-only: find ANY character in target cell
    const target = updatedCharacters.find(c =>
      positionsEqual(c.position, action.targetCell)
    );
    if (!target) continue; // Miss: cell is empty
    
    const damage = action.skill.damage ?? 0;
    target.hp -= damage;
    events.push({
      type: 'damage',
      tick,
      sourceId: attacker.id,
      targetId: target.id,
      damage,
      resultingHp: target.hp,
    });
  }
  
  // 3. Check for deaths (after all damage applied)
  for (const character of updatedCharacters) {
    if (character.hp <= 0) {
      events.push({
        type: 'death',
        tick,
        characterId: character.id,
      });
    }
  }
  
  return { updatedCharacters, events };
}
```

---

**Awaiting approval to proceed with test implementation.**
