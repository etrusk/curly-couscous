/**
 * Integration tests for targeting mode through full processTick flow.
 * Validates heal tracking and attack dodge with movement.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("game-targeting-integration", () => {
  it("heal-tracks-ally-through-full-tick", () => {
    // Healer with 2-tick heal action
    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      hp: 100,
      maxHp: 100,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 30, tickCost: 2 }),
        targetCell: { q: 1, r: 0 }, // Original position
        targetCharacter: createCharacter({
          id: "ally",
          faction: "friendly",
          position: { q: 1, r: 0 },
          hp: 50,
          maxHp: 100,
          slotPosition: 1,
        }),
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Ally with move action (resolves tick 2, same as heal)
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      hp: 50,
      maxHp: 100,
      currentAction: {
        type: "move",
        skill: createSkill({ id: "move", behavior: "towards", tickCost: 2 }),
        targetCell: { q: 2, r: 0 }, // Moving to new position
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    const state = createGameState({
      tick: 2,
      characters: [healer, ally],
    });

    const result = processTick(state);

    // Ally should have moved AND been healed
    const updatedAlly = result.state.characters.find((c) => c.id === "ally");
    expect(updatedAlly?.position).toEqual({ q: 2, r: 0 }); // Movement event
    expect(updatedAlly?.hp).toBe(80); // Heal event (50 + 30)

    // Both events should be in history
    const healEvent = result.state.history.find(
      (e) => e.type === "heal" && e.targetId === "ally",
    );
    const moveEvent = result.state.history.find(
      (e) => e.type === "movement" && e.characterId === "ally",
    );

    expect(healEvent).toBeDefined();
    expect(healEvent?.tick).toBe(2);
    expect(moveEvent).toBeDefined();
    expect(moveEvent?.tick).toBe(2);
  });

  it("attack-misses-dodging-character", () => {
    // Attacker with 2-tick attack
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "light-punch", damage: 25, tickCost: 2 }),
        targetCell: { q: 1, r: 0 }, // Original target position
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Target with 2-tick move away (movement before combat)
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 1,
      hp: 100,
      maxHp: 100,
      currentAction: {
        type: "move",
        skill: createSkill({ id: "move", behavior: "away", tickCost: 2 }),
        targetCell: { q: 2, r: 0 }, // Moving away
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    const state = createGameState({
      tick: 2,
      characters: [attacker, target],
    });

    const result = processTick(state);

    // Target should have moved and NOT taken damage (dodged)
    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.position).toEqual({ q: 2, r: 0 }); // Moved
    expect(updatedTarget?.hp).toBe(100); // No damage

    // Movement event should exist, no damage event
    const moveEvent = result.state.history.find(
      (e) => e.type === "movement" && e.characterId === "target",
    );
    const damageEvent = result.state.history.find(
      (e) => e.type === "damage" && e.targetId === "target",
    );

    expect(moveEvent).toBeDefined();
    expect(damageEvent).toBeUndefined();
  });
});
