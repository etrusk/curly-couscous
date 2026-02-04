/**
 * Tests for resolution order: healing → movement → combat (ADR-010).
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createSkill,
  createAttackAction,
  createMoveAction,
  createHealAction,
} from "./game-test-helpers";

describe("processTick - Resolution Order: Healing -> Movement -> Combat", () => {
  it.skip("should allow dodge when move resolves same tick as attack", () => {
    // Enemy commits Heavy Punch (tickCost 2) at tick 0, targeting {q:2, r:0}
    // Friendly at {q:2, r:0} detects threat at tick 1 and moves away
    // At tick 2: movement resolves first (dodge), then attack misses
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    });
    const dodgeMoveSkill = createSkill({
      id: "dodge-move",
      mode: "away",
      tickCost: 1,
      range: 1,
      triggers: [{ type: "my_cell_targeted_by_enemy" }],
      selectorOverride: { type: "nearest_enemy" },
    });

    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 0, r: 0 },
      skills: [heavyPunchSkill],
      currentAction: null,
      slotPosition: 1,
    });

    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 2, r: 0 },
      hp: 100,
      skills: [dodgeMoveSkill],
      currentAction: null,
      slotPosition: 2,
    });

    let state = createGameState({ characters: [enemy, friendly], tick: 0 });

    // Tick 0: Enemy decides Heavy Punch
    const result0 = processTick(state);
    state = result0.state;
    const enemyAfterTick0 = state.characters.find((c) => c.id === "enemy");
    expect(enemyAfterTick0?.currentAction).toBeDefined();
    expect(enemyAfterTick0?.currentAction?.type).toBe("attack");
    expect(enemyAfterTick0?.currentAction?.resolvesAtTick).toBe(2);
    expect(enemyAfterTick0?.currentAction?.targetCell).toEqual({ q: 2, r: 0 });

    // Tick 1: Friendly detects threat and decides dodge move
    const result1 = processTick(state);
    state = result1.state;
    const friendlyAfterTick1 = state.characters.find(
      (c) => c.id === "friendly",
    );
    expect(friendlyAfterTick1?.currentAction).toBeDefined();
    expect(friendlyAfterTick1?.currentAction?.type).toBe("move");
    expect(friendlyAfterTick1?.currentAction?.resolvesAtTick).toBe(2);

    // Tick 2: Movement resolves first (dodge), then attack misses
    const result2 = processTick(state);
    const friendlyFinal = result2.state.characters.find(
      (c) => c.id === "friendly",
    );
    expect(friendlyFinal).toBeDefined();
    expect(friendlyFinal?.hp).toBe(100); // No damage taken
  });

  it("should hit character who moved into targeted cell", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 2, r: 0 }, 30, 1),
    });
    const bystander = createCharacter({
      id: "bystander",
      position: { q: 3, r: 0 },
      hp: 100,
      slotPosition: 2,
      currentAction: createMoveAction({ q: 2, r: 0 }, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, bystander],
    });

    const result = processTick(state);

    const updatedBystander = result.state.characters.find(
      (c) => c.id === "bystander",
    );
    expect(updatedBystander?.position).toEqual({ q: 2, r: 0 }); // Moved there
    expect(updatedBystander?.hp).toBe(70); // Took 30 damage
    const damageEvent = result.events.find(
      (e) => e.type === "damage" && e.targetId === "bystander",
    );
    expect(damageEvent).toBeDefined();
    if (damageEvent && damageEvent.type === "damage") {
      expect(damageEvent.damage).toBe(30);
    }
  });

  it("should resolve healing before combat (ADR-006 preserved)", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createHealAction({ q: 2, r: 0 }, 25, 1),
    });
    const woundedAlly = createCharacter({
      id: "wounded-ally",
      position: { q: 2, r: 0 },
      hp: 20,
      maxHp: 100,
      slotPosition: 1,
    });
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 3, r: 0 },
      slotPosition: 2,
      currentAction: createAttackAction({ q: 2, r: 0 }, 25, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [healer, woundedAlly, attacker],
    });

    const result = processTick(state);

    const updatedAlly = result.state.characters.find(
      (c) => c.id === "wounded-ally",
    );
    expect(updatedAlly).toBeDefined(); // Survived
    const healEvent = result.events.find(
      (e) => e.type === "heal" && e.targetId === "wounded-ally",
    );
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === "heal") {
      expect(healEvent.resultingHp).toBe(45); // 20 + 25 heal
    }
    const damageEvent = result.events.find(
      (e) => e.type === "damage" && e.targetId === "wounded-ally",
    );
    expect(damageEvent).toBeDefined();
    if (damageEvent && damageEvent.type === "damage") {
      expect(damageEvent.resultingHp).toBe(20); // 45 - 25 damage
    }
    expect(updatedAlly?.hp).toBe(20); // Final HP after heal then damage
  });

  it("should resolve healing before movement", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createHealAction({ q: 2, r: 0 }, 25, 1),
    });
    const woundedAlly = createCharacter({
      id: "wounded-ally",
      position: { q: 2, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
      currentAction: createMoveAction({ q: 3, r: 0 }, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [healer, woundedAlly],
    });

    const result = processTick(state);

    const healEvent = result.events.find(
      (e) => e.type === "heal" && e.targetId === "wounded-ally",
    );
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === "heal") {
      expect(healEvent.resultingHp).toBe(75); // 50 + 25 heal
    }
    const updatedAlly = result.state.characters.find(
      (c) => c.id === "wounded-ally",
    );
    expect(updatedAlly?.position).toEqual({ q: 3, r: 0 }); // Moved after healing
    expect(updatedAlly?.hp).toBe(75); // Healed before moving
  });

  it("should resolve healing, movement, and combat correctly on same tick", () => {
    const healer = createCharacter({
      id: "healer",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      currentAction: createHealAction({ q: 2, r: 0 }, 25, 1),
    });
    const ally = createCharacter({
      id: "ally",
      position: { q: 2, r: 0 },
      hp: 50,
      maxHp: 100,
      slotPosition: 1,
      currentAction: createMoveAction({ q: 3, r: 0 }, 1),
    });
    const enemyAttacker = createCharacter({
      id: "enemy-attacker",
      position: { q: 4, r: 0 },
      slotPosition: 2,
      currentAction: createAttackAction({ q: 2, r: 0 }, 100, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [healer, ally, enemyAttacker],
    });

    const result = processTick(state);

    const healEvent = result.events.find(
      (e) => e.type === "heal" && e.targetId === "ally",
    );
    expect(healEvent).toBeDefined();
    if (healEvent && healEvent.type === "heal") {
      expect(healEvent.resultingHp).toBe(75); // 50 + 25 heal
    }
    const movementEvent = result.events.find(
      (e) => e.type === "movement" && e.characterId === "ally",
    );
    expect(movementEvent).toBeDefined();
    if (movementEvent && movementEvent.type === "movement") {
      expect(movementEvent.from).toEqual({ q: 2, r: 0 });
      expect(movementEvent.to).toEqual({ q: 3, r: 0 });
    }
    const damageEvent = result.events.find(
      (e) => e.type === "damage" && e.targetId === "ally",
    );
    expect(damageEvent).toBeUndefined(); // Attack missed the cell
    const updatedAlly = result.state.characters.find((c) => c.id === "ally");
    expect(updatedAlly).toBeDefined();
    expect(updatedAlly?.hp).toBe(75); // Healed, no damage
    expect(updatedAlly?.position).toEqual({ q: 3, r: 0 }); // Moved away
  });

  it("should not affect mutual attacks (no movement involved)", () => {
    const characterA = createCharacter({
      id: "character-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 100,
      slotPosition: 1,
      currentAction: createAttackAction({ q: 1, r: 0 }, 30, 1),
    });
    const characterB = createCharacter({
      id: "character-b",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 100,
      slotPosition: 2,
      currentAction: createAttackAction({ q: 0, r: 0 }, 40, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [characterA, characterB],
    });

    const result = processTick(state);

    const updatedA = result.state.characters.find(
      (c) => c.id === "character-a",
    );
    const updatedB = result.state.characters.find(
      (c) => c.id === "character-b",
    );
    expect(updatedA?.hp).toBe(60); // Took 40 damage from B
    expect(updatedB?.hp).toBe(70); // Took 30 damage from A
    expect(updatedA).toBeDefined(); // Both survived
    expect(updatedB).toBeDefined();
  });
});
