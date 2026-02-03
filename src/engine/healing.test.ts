/**
 * Unit tests for resolveHealing function.
 * Validates heal action resolution, HP capping, event generation, and cell-based targeting.
 */

import { describe, it, expect } from "vitest";
import { resolveHealing } from "./healing";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("resolveHealing", () => {
  it("heal-basic-hit", () => {
    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { x: 1, y: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      75,
    );
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toEqual({
      type: "heal",
      tick: 0,
      sourceId: "healer",
      targetId: "target",
      healing: 25,
      resultingHp: 75,
    });
  });

  it("heal-capped-at-maxHp", () => {
    const healer = createCharacter({
      id: "healer",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 90,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
    expect(result.events[0]!.resultingHp).toBe(100);
  });

  it("heal-generates-HealEvent", () => {
    const healer = createCharacter({
      id: "healer-a",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { x: 2, y: 0 },
        targetCharacter: null,
        startedAtTick: 3,
        resolvesAtTick: 3,
      },
    });
    const target = createCharacter({
      id: "target-b",
      position: { x: 2, y: 0 },
      hp: 60,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 3);

    expect(result.events[0]).toEqual({
      type: "heal",
      tick: 3,
      sourceId: "healer-a",
      targetId: "target-b",
      healing: 25,
      resultingHp: 85,
    });
  });

  it("heal-wind-up-timing", () => {
    const healer = createCharacter({
      id: "healer",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 2 }),
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 5,
        resolvesAtTick: 7,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 75,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 7);

    expect(result.events).toHaveLength(1);
    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
  });

  it("heal-miss-target-moved", () => {
    const healer = createCharacter({
      id: "healer",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 0 }),
        targetCell: { x: 3, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 4, y: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      50,
    );
    expect(result.events).toHaveLength(0);
  });

  it("heal-multiple-healers-same-target", () => {
    const healer1 = createCharacter({
      id: "healer1",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal1", healing: 25, tickCost: 0 }),
        targetCell: { x: 2, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const healer2 = createCharacter({
      id: "healer2",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal2", healing: 25, tickCost: 0 }),
        targetCell: { x: 2, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 2, y: 0 },
      hp: 40,
      maxHp: 100,
      slotPosition: 2,
    });

    const result = resolveHealing([healer1, healer2, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      90,
    );
    expect(result.events).toHaveLength(2);
  });

  it("heal-multiple-healers-hp-cap", () => {
    const healer1 = createCharacter({
      id: "healer1",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal1", healing: 25, tickCost: 0 }),
        targetCell: { x: 2, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const healer2 = createCharacter({
      id: "healer2",
      position: { x: 1, y: 0 },
      slotPosition: 1,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal2", healing: 25, tickCost: 0 }),
        targetCell: { x: 2, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 2, y: 0 },
      hp: 80,
      maxHp: 100,
      slotPosition: 2,
    });

    const result = resolveHealing([healer1, healer2, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      100,
    );
    expect(result.events[0]!.resultingHp).toBe(100);
    expect(result.events[1]!.resultingHp).toBe(100);
  });

  it("heal-ignores-non-resolving-actions", () => {
    const healer = createCharacter({
      id: "healer",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "heal",
        skill: createSkill({ id: "heal", healing: 25, tickCost: 1 }),
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 2,
        resolvesAtTick: 3,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([healer, target], 2);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      50,
    );
    expect(result.events).toHaveLength(0);
  });

  it("heal-ignores-attack-actions", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { x: 0, y: 0 },
      slotPosition: 0,
      currentAction: {
        type: "attack",
        skill: createSkill({ id: "attack", damage: 25, tickCost: 0 }),
        targetCell: { x: 1, y: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    });
    const target = createCharacter({
      id: "target",
      position: { x: 1, y: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
    });

    const result = resolveHealing([attacker, target], 0);

    expect(result.updatedCharacters.find((c) => c.id === "target")?.hp).toBe(
      50,
    );
    expect(result.events).toHaveLength(0);
  });
});
