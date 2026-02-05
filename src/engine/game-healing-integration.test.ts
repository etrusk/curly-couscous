/**
 * Integration tests for heal through processTick.
 * Validates heal resolution order, decision system integration, and full-HP rejection.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createCharacter,
  createSkill,
  createGameState,
} from "./game-test-helpers";

describe("game-healing-integration", () => {
  it("heal-resolves-before-combat-saves-ally", () => {
    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 2 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 1,
        resolvesAtTick: 3,
      },
    });
    const woundedAlly = createCharacter({
      id: "wounded-ally",
      faction: "friendly",
      position: { q: 2, r: 0 },
      hp: 20,
      maxHp: 100,
      slotPosition: 1,
    });
    const attacker = createCharacter({
      id: "attacker",
      faction: "enemy",
      position: { q: 3, r: 0 },
      slotPosition: 2,
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "attack", damage: 25, tickCost: 2 }),
        targetCell: { q: 2, r: 0 },
        targetCharacter: null,
        startedAtTick: 1,
        resolvesAtTick: 3,
      },
    });

    const state = createGameState({
      tick: 3,
      characters: [healer, woundedAlly, attacker],
    });
    const result = processTick(state);

    const survivedAlly = result.state.characters.find(
      (c) => c.id === "wounded-ally",
    );
    expect(survivedAlly).toBeDefined();
    expect(survivedAlly?.hp).toBe(20);

    const healEvent = result.events.find((e) => e.type === "heal");
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === "heal") {
      expect(healEvent.resultingHp).toBe(45);
    }

    const damageEvent = result.events.find((e) => e.type === "damage");
    expect(damageEvent).toBeDefined();
    if (damageEvent && damageEvent.type === "damage") {
      expect(damageEvent.resultingHp).toBe(20);
    }
  });

  it("decision-selects-heal-for-wounded-ally", () => {
    const healSkill = createSkill({
      id: "heal",
      name: "Heal",
      tickCost: 0,
      range: 5,
      healing: 25,
      enabled: true,
      triggers: [{ type: "always" }],
      target: "ally",
      criterion: "lowest_hp",
    });
    const moveSkill = createSkill({
      id: "move",
      name: "Move",
      tickCost: 1,
      range: 1,
      behavior: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [healSkill, moveSkill],
      currentAction: null,
    });
    const woundedAlly = createCharacter({
      id: "wounded-ally",
      faction: "friendly",
      position: { q: 3, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 }, // Distance 5 from origin
      hp: 100,
      slotPosition: 2,
      currentAction: null,
    });

    const state = createGameState({
      tick: 0,
      characters: [healer, woundedAlly, enemy],
    });
    const result = processTick(state);

    const healEvent = result.events.find((e) => e.type === "heal");
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === "heal") {
      expect(healEvent.targetId).toBe("wounded-ally");
    }

    const finalAlly = result.state.characters.find(
      (c) => c.id === "wounded-ally",
    );
    expect(finalAlly?.hp).toBe(75);
  });

  it("heal-rejected-when-all-allies-full-hp", () => {
    const healSkill = createSkill({
      id: "heal",
      healing: 25,
      range: 5,
      tickCost: 0,
      enabled: true,
      triggers: [{ type: "always" }],
      target: "ally",
      criterion: "lowest_hp",
    });
    const moveSkill = createSkill({
      id: "move",
      tickCost: 1,
      range: 1,
      behavior: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [healSkill, moveSkill],
      currentAction: null,
    });
    const fullHpAlly = createCharacter({
      id: "full-hp-ally",
      faction: "friendly",
      position: { q: 3, r: 0 },
      hp: 100,
      maxHp: 100,
      slotPosition: 1,
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 }, // Distance 5 from origin
      hp: 100,
      slotPosition: 2,
      currentAction: null,
    });

    const state = createGameState({
      tick: 0,
      characters: [healer, fullHpAlly, enemy],
    });
    const result = processTick(state);

    const healEvent = result.events.find((e) => e.type === "heal");
    expect(healEvent).toBeUndefined();

    // Healer should have fallen through to Move skill (action created, not yet resolved)
    const healerAfter = result.state.characters.find((c) => c.id === "healer");
    expect(healerAfter?.currentAction?.type).toBe("move");
  });

  it("heal-rejected-out-of-range", () => {
    const healSkill = createSkill({
      id: "heal",
      healing: 25,
      range: 5,
      tickCost: 0,
      enabled: true,
      triggers: [{ type: "always" }],
      target: "ally",
      criterion: "lowest_hp",
    });
    const moveSkill = createSkill({
      id: "move",
      tickCost: 1,
      range: 1,
      behavior: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [healSkill, moveSkill],
      currentAction: null,
    });
    const distantAlly = createCharacter({
      id: "distant-ally",
      faction: "friendly",
      position: { q: 5, r: 1 }, // Distance 6 from origin (out of range 5)
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -5 },
      slotPosition: 2,
      currentAction: null,
    });

    const state = createGameState({
      tick: 0,
      characters: [healer, distantAlly, enemy],
    });
    const result = processTick(state);

    const healEvent = result.events.find((e) => e.type === "heal");
    expect(healEvent).toBeUndefined();

    // Healer should have fallen through to Move skill (action created, not yet resolved)
    const healerAfter = result.state.characters.find((c) => c.id === "healer");
    expect(healerAfter?.currentAction?.type).toBe("move");
  });

  it("heal-no-allies-solo-character", () => {
    const healSkill = createSkill({
      id: "heal",
      healing: 25,
      range: 5,
      tickCost: 0,
      enabled: true,
      triggers: [{ type: "always" }],
      target: "ally",
      criterion: "lowest_hp",
    });
    const moveSkill = createSkill({
      id: "move",
      tickCost: 1,
      range: 1,
      behavior: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [healSkill, moveSkill],
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 }, // Distance 5 from origin
      slotPosition: 1,
      currentAction: null,
    });

    const state = createGameState({
      tick: 0,
      characters: [healer, enemy],
    });
    const result = processTick(state);

    const healEvent = result.events.find((e) => e.type === "heal");
    expect(healEvent).toBeUndefined();

    // Healer should have fallen through to Move skill (action created, not yet resolved)
    const healerAfter = result.state.characters.find((c) => c.id === "healer");
    expect(healerAfter?.currentAction?.type).toBe("move");
  });

  it("heal-selects-lowest-hp-ally", () => {
    const healSkill = createSkill({
      id: "heal",
      healing: 25,
      range: 5,
      tickCost: 0,
      enabled: true,
      triggers: [{ type: "always" }],
      target: "ally",
      criterion: "lowest_hp",
    });

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [healSkill],
      currentAction: null,
    });
    const nearAlly = createCharacter({
      id: "near-ally",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
      slotPosition: 1,
      currentAction: null,
    });
    const farAlly = createCharacter({
      id: "far-ally",
      faction: "friendly",
      position: { q: 4, r: 0 },
      hp: 30,
      maxHp: 100,
      slotPosition: 2,
      currentAction: null,
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: -5 },
      slotPosition: 3,
      currentAction: null,
    });

    const state = createGameState({
      tick: 0,
      characters: [healer, nearAlly, farAlly, enemy],
    });
    const result = processTick(state);

    const healEvent = result.events.find((e) => e.type === "heal");
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === "heal") {
      expect(healEvent.targetId).toBe("far-ally");
    }

    const finalFarAlly = result.state.characters.find(
      (c) => c.id === "far-ally",
    );
    expect(finalFarAlly?.hp).toBe(55);

    const finalNearAlly = result.state.characters.find(
      (c) => c.id === "near-ally",
    );
    expect(finalNearAlly?.hp).toBe(80);
  });
});
