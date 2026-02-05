/**
 * Integration tests for processTick decision flow and cross-module integration.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
  createAttackAction,
} from "./game-test-helpers";

describe("processTick decision integration", () => {
  it("idle character should receive decision and execute same tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 2 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    // With new formula, tickCost=1 action created at tick 1 resolves at tick 2
    let result = processTick(state);
    result = processTick(result.state);

    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(90);
  });

  it("idle character with tickCost 2 skill should not resolve same tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "heavy",
          damage: 25,
          tickCost: 2,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 2 },
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
    expect(updatedTarget?.hp).toBe(100);
    const updatedAttacker = result.state.characters.find(
      (c) => c.id === "attacker",
    );
    expect(updatedAttacker?.currentAction).not.toBeNull();
    // With new formula: tick 1 + tickCost 2 = resolvesAtTick 3
    expect(updatedAttacker?.currentAction?.resolvesAtTick).toBe(3);
  });

  it("mid-action character should continue action, not receive new decision", () => {
    const action = createAttackAction({ q: 3, r: -1 }, 25, 2);
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: action,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 2 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const result = processTick(state);

    const updatedAttacker = result.state.characters.find(
      (c) => c.id === "attacker",
    );
    expect(updatedAttacker?.currentAction).toEqual(action);
  });

  it("resolved action should be cleared, allowing new decision next tick", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 2 },
      hp: 100,
      slotPosition: 2,
    });

    const state1 = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    // With new formula, action created at tick 1 resolves at tick 2
    const result1 = processTick(state1);
    const result2 = processTick(result1.state);

    const attackerAfterTick2 = result2.state.characters.find(
      (c) => c.id === "attacker",
    );
    expect(attackerAfterTick2?.currentAction).toBeNull();

    const result3 = processTick(result2.state);
    const result4 = processTick(result3.state);

    const targetAfterTick4 = result4.state.characters.find(
      (c) => c.id === "target",
    );
    expect(targetAfterTick4?.hp).toBe(80);
  });

  it("character with no valid skill should idle and be cleared same tick", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "enemy_in_range", value: 1 }],
        }),
      ],
    });

    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    // With new formula, idle action (tickCost=1) created at tick 1 resolves at tick 2
    let result = processTick(state);
    result = processTick(result.state);

    const updatedChar = result.state.characters.find((c) => c.id === "char1");
    expect(updatedChar?.currentAction).toBeNull();
  });
});

describe("cross-module integration", () => {
  it("should integrate computeDecisions with processTick for full decision flow", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 2 },
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    // First, compute decisions
    const decisions = computeDecisions(state);
    // Both characters are idle: attacker has attack skill, target has no skills (idle)
    expect(decisions).toHaveLength(2);

    // Find attacker's decision
    const attackerDecision = decisions.find(
      (d) => d.characterId === "attacker",
    );
    expect(attackerDecision).toBeDefined();
    expect(attackerDecision!.action.type).toBe("attack");

    // Find target's decision (should be idle)
    const targetDecision = decisions.find((d) => d.characterId === "target");
    expect(targetDecision).toBeDefined();
    expect(targetDecision!.action.type).toBe("idle");

    // Then process tick to execute decisions
    // With new formula, tickCost=1 action created at tick 1 resolves at tick 2
    let result = processTick(state);
    result = processTick(result.state);
    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(90);
  });

  it("should handle movement decision integration", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "move",
          behavior: "towards",
          range: 1, // Need to get within range 1
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 5, r: 2 },
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [mover, target],
    });

    const decisions = computeDecisions(state);
    // Both characters are idle: mover has move skill, target has no skills (idle)
    expect(decisions).toHaveLength(2);

    // Find mover's decision
    const moverDecision = decisions.find((d) => d.characterId === "mover");
    expect(moverDecision).toBeDefined();
    expect(moverDecision!.action.type).toBe("move");
    // Mover should have a move action with a targetCell
    expect(moverDecision!.action.targetCell).toBeDefined();

    // Find target's decision (should be idle)
    const targetDecision = decisions.find((d) => d.characterId === "target");
    expect(targetDecision).toBeDefined();
    expect(targetDecision!.action.type).toBe("idle");

    // With new formula, tickCost=1 action created at tick 1 resolves at tick 2
    let result = processTick(state);
    result = processTick(result.state);
    const updatedMover = result.state.characters.find((c) => c.id === "mover");
    // Verify mover still exists after processing
    expect(updatedMover).toBeDefined();
    expect(updatedMover?.id).toBe("mover");
  });

  it("should integrate priority ordering across modules", () => {
    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 3, r: 2 },
      slotPosition: 1,
      currentAction: null,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "enemy_in_range", value: 1 }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          range: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 5, r: 0 }, // Distance 5 from {q:3, r:2}
      hp: 100,
      slotPosition: 2,
    });

    const state = createGameState({
      tick: 1,
      characters: [attacker, target],
    });

    const decisions = computeDecisions(state);
    expect(decisions[0]!.action.skill.id).toBe("skill2");

    // With new formula, tickCost=1 action created at tick 1 resolves at tick 2
    let result = processTick(state);
    result = processTick(result.state);
    const updatedTarget = result.state.characters.find(
      (c) => c.id === "target",
    );
    expect(updatedTarget?.hp).toBe(80);
  });
});
