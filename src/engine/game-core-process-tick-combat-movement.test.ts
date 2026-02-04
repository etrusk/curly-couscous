/**
 * Tests for combat and movement integration functionality of processTick.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createSkill,
  createAttackAction,
  createMoveAction,
  initRNG,
} from "./game-test-helpers";

describe("processTick - combat and movement integration", () => {
  it("should resolve attack actions at correct tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 1, r: 0 }, 10, 1),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(90);
  });

  it("should not resolve actions with future resolvesAtTick", () => {
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 1, r: 0 }, 10, 5), // Resolves at tick 5
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1, // Current tick is 1
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(100); // No damage applied
  });

  it("should resolve movement actions at correct tick", () => {
    const mover = createCharacter({
      id: "mover",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: createMoveAction({ q: 3, r: -1 }, 2),
    });

    const state = createGameState({
      tick: 2,
      characters: [mover],
    });

    const result = processTick(state);

    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    expect(updatedMover?.position).toEqual({ q: 3, r: -1 });
  });

  it("should apply combat before movement", () => {
    // Attacker and target at same position, target tries to move away
    const attacker = createCharacter({
      id: "attacker",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      currentAction: createAttackAction({ q: 1, r: 0 }, 100, 1),
    });
    const target = createCharacter({
      id: "target",
      position: { q: 1, r: 0 },
      hp: 50,
      slotPosition: 2,
      currentAction: createMoveAction({ q: 2, r: 0 }, 1),
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    // Target should be hit and killed before movement resolves
    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget).toBeUndefined(); // Dead, removed from characters
  });

  it("should thread RNG state through movement", () => {
    const moverA = createCharacter({
      id: "moverA",
      position: { q: 4, r: 1 },
      slotPosition: 1,
      currentAction: createMoveAction({ q: 3, r: 2 }, 1),
    });
    const moverB = createCharacter({
      id: "moverB",
      position: { q: 5, r: -1 },
      slotPosition: 2,
      currentAction: createMoveAction({ q: 3, r: 2 }, 1),
    });

    const initialRng = initRNG(1000);
    const state = createGameState({
      tick: 1,
      characters: [moverA, moverB],
      rngState: initialRng,
    });

    const result = processTick(state);

    // RNG should have advanced due to collision resolution
    expect(result.state.rngState).not.toBe(initialRng);
  });

  // NEW TESTS FOR INSTANT ATTACKS
  describe("Instant Attacks (tickCost 0)", () => {
    it("instant attack (tickCost 0) resolves and clears in single processTick", () => {
      const attackSkill = createSkill({
        id: "light-punch",
        tickCost: 0,
        range: 1,
        damage: 10,
        triggers: [{ type: "always" }],
        selectorOverride: { type: "nearest_enemy" },
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [attackSkill],
        currentAction: null,
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
        hp: 100,
        skills: [],
      });
      const state = createGameState({ characters: [friendly, enemy] });

      const { state: newState } = processTick(state);

      const updatedEnemy = newState.characters.find((c) => c.id === "enemy");
      expect(updatedEnemy?.hp).toBe(90); // 100 - 10 damage
      const updatedFriendly = newState.characters.find(
        (c) => c.id === "friendly",
      );
      expect(updatedFriendly?.currentAction).toBeNull();
    });

    it("instant attack resolvesAtTick equals the tick it was created on", () => {
      const attackSkill = createSkill({
        id: "light-punch",
        tickCost: 0,
        range: 1,
        damage: 10,
        triggers: [{ type: "always" }],
        selectorOverride: { type: "nearest_enemy" },
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [attackSkill],
        currentAction: null,
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
        hp: 100,
        skills: [],
      });
      const state = createGameState({ characters: [friendly, enemy], tick: 5 });

      const { events } = processTick(state);

      const damageEvent = events.find((e) => e.type === "damage");
      expect(damageEvent).toBeDefined();
      expect(damageEvent?.tick).toBe(5);
    });
  });
});
