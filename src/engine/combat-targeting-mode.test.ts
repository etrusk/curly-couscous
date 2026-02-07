/**
 * Unit tests for cell-based targeting mode in combat resolution.
 * Validates attack skills continue to use cell targeting (preserve dodge).
 */

import { describe, it, expect } from "vitest";
import { resolveCombat } from "./combat";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("combat-targeting-mode", () => {
  it("attack-still-uses-cell-targeting", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "light-punch", damage: 25, tickCost: 2 }),
        targetCell: { q: 2, r: 0 }, // Original target position
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Target MOVED away from targetCell during wind-up (dodge)
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: 0 }, // NEW position (dodged)
      hp: 100,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveCombat([attacker, target], 2);

    // Attack should MISS (cell targeting means attack hits cell, not character)
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
    // WhiffEvent is emitted on miss
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ type: "whiff" });
  });

  it("attack-hits-different-character-in-cell", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "light-punch", damage: 25, tickCost: 2 }),
        targetCell: { q: 2, r: 0 }, // Target cell
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Original target moved away
    const originalTarget = createCharacter({
      id: "original-target",
      faction: "enemy",
      position: { q: 3, r: 0 }, // Moved away
      hp: 100,
      maxHp: 100,
      slotPosition: 1,
    });

    // Bystander is now in the target cell
    const bystander = createCharacter({
      id: "bystander",
      faction: "enemy",
      position: { q: 2, r: 0 }, // In targetCell
      hp: 100,
      maxHp: 100,
      slotPosition: 2,
    });

    const result = resolveCombat([attacker, originalTarget, bystander], 2);

    // Attack should hit bystander (whoever is in the cell)
    expect(result.updatedCharacters.find((c) => c.id === "bystander")?.hp).toBe(
      75,
    );
    expect(
      result.updatedCharacters.find((c) => c.id === "original-target")?.hp,
    ).toBe(100);
    expect(result.events).toHaveLength(1);
    const damageEvent = result.events[0];
    expect(damageEvent?.type).toBe("damage");
    if (damageEvent?.type === "damage") {
      expect(damageEvent.targetId).toBe("bystander");
    }
  });
});
