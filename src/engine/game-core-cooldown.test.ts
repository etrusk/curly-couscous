/**
 * Tests for cooldown decrement and apply logic in game-core.
 * Validates cooldown initialization and decrement mechanics.
 */

import { describe, it, expect } from "vitest";
import { applyDecisions, decrementCooldowns } from "./game-core";
import { createCharacter, createSkill } from "./game-test-helpers";
import type { Decision } from "./game-decisions";

describe("game-core-cooldown", () => {
  it("cooldown-set-when-action-applied", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "heavy-punch", // Skill with cooldown in registry
          instanceId: "heavy-punch",
          damage: 25,
          tickCost: 2,
        }),
      ],
    });

    const decision: Decision = {
      characterId: "char1",
      action: {
        type: "attack",
        skill: character.skills[0]!,
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    };

    const result = applyDecisions([character], [decision]);

    // Skill should have cooldownRemaining set (assuming heavy-punch has cooldown=3 in registry)
    const updatedChar = result.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.id === "heavy-punch",
    );
    expect(updatedSkill?.cooldownRemaining).toBe(3);
  });

  it("cooldown-set-uses-instanceId", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move1",
          behavior: "towards",
          tickCost: 1,
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move2",
          behavior: "towards",
          tickCost: 1,
        }),
      ],
    });

    const decision: Decision = {
      characterId: "char1",
      action: {
        type: "move",
        skill: character.skills[1]!, // Use move2
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    };

    const result = applyDecisions([character], [decision]);

    const updatedChar = result.find((c) => c.id === "char1");
    const move1 = updatedChar?.skills.find((s) => s.instanceId === "move1");
    const move2 = updatedChar?.skills.find((s) => s.instanceId === "move2");

    // Only move2 should have cooldown set
    expect(move2?.cooldownRemaining).toBeDefined();
    expect(move2?.cooldownRemaining).toBeGreaterThan(0);
    expect(move1?.cooldownRemaining).toBeUndefined();
  });

  it("cooldown-not-set-for-skills-without-registry-cooldown", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "light-punch", // No cooldown in registry
          instanceId: "light-punch",
          damage: 10,
          tickCost: 1,
        }),
      ],
    });

    const decision: Decision = {
      characterId: "char1",
      action: {
        type: "attack",
        skill: character.skills[0]!,
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 1,
      },
    };

    const result = applyDecisions([character], [decision]);

    const updatedChar = result.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.id === "light-punch",
    );
    // cooldownRemaining should be undefined or 0
    expect(updatedSkill?.cooldownRemaining).toBeFalsy();
  });

  it("cooldown-not-set-for-registry-cooldown-zero", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "instant-skill", // Skill with cooldown=0 in registry
          instanceId: "instant-skill",
          damage: 5,
          tickCost: 0,
        }),
      ],
    });

    const decision: Decision = {
      characterId: "char1",
      action: {
        type: "attack",
        skill: character.skills[0]!,
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 0,
      },
    };

    const result = applyDecisions([character], [decision]);

    const updatedChar = result.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.id === "instant-skill",
    );
    // cooldownRemaining should not be set (undefined or 0)
    expect(updatedSkill?.cooldownRemaining).toBeFalsy();
  });

  it("cooldown-decrements-when-idle", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: null, // IDLE
      skills: [
        createSkill({
          id: "skill1",
          cooldownRemaining: 3,
          damage: 10,
        }),
      ],
    });

    const result = decrementCooldowns([character]);

    const updatedChar = result.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill?.cooldownRemaining).toBe(2);
  });

  it("cooldown-paused-during-action", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: {
        // HAS ACTION (mid-action)
        type: "attack",
        skill: createSkill({ id: "attack", damage: 10 }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
      skills: [
        createSkill({
          id: "skill1",
          cooldownRemaining: 3,
          damage: 10,
        }),
      ],
    });

    const result = decrementCooldowns([character]);

    const updatedChar = result.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
    // Cooldown should NOT decrement (character has action)
    expect(updatedSkill?.cooldownRemaining).toBe(3);
  });

  it("cooldown-decrements-to-zero", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: null, // IDLE
      skills: [
        createSkill({
          id: "skill1",
          cooldownRemaining: 1,
          damage: 10,
        }),
      ],
    });

    const result1 = decrementCooldowns([character]);
    const updatedChar1 = result1.find((c) => c.id === "char1");
    const updatedSkill1 = updatedChar1?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill1?.cooldownRemaining).toBe(0);

    // Call again - should stay at 0
    const result2 = decrementCooldowns(result1);
    const updatedChar2 = result2.find((c) => c.id === "char1");
    const updatedSkill2 = updatedChar2?.skills.find((s) => s.id === "skill1");
    expect(updatedSkill2?.cooldownRemaining).toBe(0);
  });

  it("cooldown-independent-per-instance", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: null, // IDLE
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move1",
          cooldownRemaining: 2,
          behavior: "towards",
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move2",
          cooldownRemaining: 0,
          behavior: "towards",
        }),
      ],
    });

    const result = decrementCooldowns([character]);

    const updatedChar = result.find((c) => c.id === "char1");
    const move1 = updatedChar?.skills.find((s) => s.instanceId === "move1");
    const move2 = updatedChar?.skills.find((s) => s.instanceId === "move2");

    // move1 should decrement
    expect(move1?.cooldownRemaining).toBe(1);
    // move2 should stay at 0
    expect(move2?.cooldownRemaining).toBe(0);
  });
});
