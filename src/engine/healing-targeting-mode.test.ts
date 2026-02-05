/**
 * Unit tests for character-based targeting mode in healing resolution.
 * Validates heal actions track target character, not target cell.
 */

import { describe, it, expect } from "vitest";
import { resolveHealing } from "./healing";
import { createCharacter, createSkill } from "./game-test-helpers";
import type { Character } from "./types";

describe("healing-targeting-mode", () => {
  it("heal-character-targeting-lands-on-moved-target", () => {
    // Create target character object for action.targetCharacter
    const originalTargetSnapshot: Character = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 2 }),
        targetCell: { q: 1, r: 0 }, // Original position
        targetCharacter: originalTargetSnapshot, // Full Character object
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Target has moved to NEW position during wind-up
    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 2, r: 0 }, // MOVED from q:1 to q:2
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 2);

    // Heal should land on target at NEW position (tracked by character ID)
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      75,
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toEqual({
      type: "heal",
      tick: 2,
      sourceId: "healer",
      targetId: "target",
      healing: 25,
      resultingHp: 75,
    });
  });

  it("heal-character-targeting-fails-on-dead-target", () => {
    const originalTargetSnapshot: Character = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 2 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: originalTargetSnapshot,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Target died during wind-up (hp=0)
    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 0, // DEAD
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 2);

    // Heal should NOT apply to dead target
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(0);
    expect(result.events).toHaveLength(0);
  });

  it("heal-character-targeting-finds-target-by-id", () => {
    const originalTargetSnapshot: Character = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 2 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: originalTargetSnapshot,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Target is a DIFFERENT JavaScript object (immutable state update)
    // but same ID and at DIFFERENT position
    const target = createCharacter({
      id: "target", // Same ID
      faction: "friendly",
      position: { q: 3, r: 0 }, // Different position
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 2);

    // Heal should find target by ID, not by object reference
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      75,
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.targetId).toBe("target");
  });

  it("heal-character-targeting-fallback-when-targetCharacter-null", () => {
    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null, // NULL - edge case
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });

    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 }, // At targetCell
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    // Should fall back to cell targeting
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      75,
    );
    expect(result.events).toHaveLength(1);
  });
});
