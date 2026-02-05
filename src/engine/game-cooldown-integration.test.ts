/**
 * Integration tests for cooldown through full processTick flow.
 * Validates cooldown timing and interaction with decision system.
 */

import { describe, it, expect } from "vitest";
import { processTick } from "./game-core";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("game-cooldown-integration", () => {
  it("cooldown-full-cycle-tickCost-then-cooldown", () => {
    // Character uses skill with tickCost=2 and cooldown=3 at tick 0
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [
        createSkill({
          id: "test-skill",
          instanceId: "test-skill",
          damage: 20,
          tickCost: 2,
          triggers: [{ type: "always" }],
        }),
      ],
      currentAction: {
        type: "attack",
        skill: createSkill({
          id: "test-skill",
          instanceId: "test-skill",
          damage: 20,
          tickCost: 2,
          cooldownRemaining: 3, // Set by applyDecisions at tick 0
        }),
        targetCell: { q: 1, r: 0 },
        targetCharacter: null,
        startedAtTick: 0,
        resolvesAtTick: 2,
      },
    });

    // Set skill cooldown (simulating applyDecisions already ran)
    character.skills[0]!.cooldownRemaining = 3;

    // Tick 1: Mid-action, cooldown should NOT decrement (character has currentAction)
    const state1 = createGameState({
      tick: 1,
      characters: [character],
    });
    const result1 = processTick(state1);
    const char1 = result1.state.characters.find((c) => c.id === "char1");
    expect(char1?.skills[0]?.cooldownRemaining).toBe(3); // Unchanged

    // Tick 2: Action resolves. clearResolvedActions runs, then decrementCooldowns,
    // so cooldown decrements to 2.
    const state2 = createGameState({
      tick: 2,
      characters: result1.state.characters,
    });
    const result2 = processTick(state2);
    const char2 = result2.state.characters.find((c) => c.id === "char1");
    expect(char2?.currentAction).toBeNull(); // Action cleared
    expect(char2?.skills[0]?.cooldownRemaining).toBe(2); // Decremented

    // Tick 3: Idle (no action), cooldown decrements
    const state3 = createGameState({
      tick: 3,
      characters: result2.state.characters,
    });
    const result3 = processTick(state3);
    const char3 = result3.state.characters.find((c) => c.id === "char1");
    expect(char3?.skills[0]?.cooldownRemaining).toBe(1);

    // Tick 4: Idle, cooldown reaches 0 (ready)
    const state4 = createGameState({
      tick: 4,
      characters: result3.state.characters,
    });
    const result4 = processTick(state4);
    const char4 = result4.state.characters.find((c) => c.id === "char1");
    expect(char4?.skills[0]?.cooldownRemaining).toBe(0); // READY
  });

  it("cooldown-blocks-skill-until-ready", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
      slotPosition: 1,
    });

    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [
        createSkill({
          id: "primary-skill",
          instanceId: "primary-skill",
          damage: 20,
          cooldownRemaining: 2, // ON COOLDOWN
          triggers: [{ type: "always" }],
          range: 3,
        }),
      ],
    });

    // Tick 0: Character should be idle (primary on cooldown)
    const state0 = createGameState({
      tick: 0,
      characters: [character, enemy],
    });
    const result0 = processTick(state0);
    const char0 = result0.state.characters.find((c) => c.id === "char1");
    expect(char0?.currentAction?.type).toBe("idle");
    const cooldown0 = char0?.skills.find(
      (s) => s.id === "primary-skill",
    )?.cooldownRemaining;
    expect(cooldown0).toBe(1); // Decremented from 2 to 1

    // Tick 1: Still idle, cooldown decrements to 0
    const state1 = createGameState({
      tick: 1,
      characters: result0.state.characters,
    });
    const result1 = processTick(state1);
    const char1 = result1.state.characters.find((c) => c.id === "char1");
    const cooldown1 = char1?.skills.find(
      (s) => s.id === "primary-skill",
    )?.cooldownRemaining;
    expect(cooldown1).toBe(0); // Decremented from 1 to 0

    // Tick 2: Primary skill should now be available
    const state2 = createGameState({
      tick: 2,
      characters: result1.state.characters,
    });
    const result2 = processTick(state2);
    const char2 = result2.state.characters.find((c) => c.id === "char1");
    expect(char2?.currentAction?.skill.id).toBe("primary-skill");
  });

  it("duplicate-skills-independent-cooldowns-through-ticks", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
      slotPosition: 1,
    });

    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 0,
      skills: [
        createSkill({
          id: "move-towards",
          instanceId: "move1",
          behavior: "towards",
          tickCost: 1,
          cooldownRemaining: 0, // READY
          triggers: [{ type: "always" }],
          target: "enemy",
        }),
        createSkill({
          id: "move-towards",
          instanceId: "move2",
          behavior: "towards",
          tickCost: 1,
          cooldownRemaining: 0, // READY
          triggers: [{ type: "always" }],
          target: "enemy",
        }),
      ],
    });

    // Tick 0: Use move1 (first skill)
    const state0 = createGameState({
      tick: 0,
      characters: [character, enemy],
    });
    const result0 = processTick(state0);
    const char0 = result0.state.characters.find((c) => c.id === "char1");

    // move1 should have cooldown set (assuming cooldown=1 in registry)
    const move1_tick0 = char0?.skills.find((s) => s.instanceId === "move1");
    const move2_tick0 = char0?.skills.find((s) => s.instanceId === "move2");
    expect(move1_tick0?.cooldownRemaining).toBeDefined();
    expect(move1_tick0?.cooldownRemaining).toBeGreaterThan(0);
    expect(move2_tick0?.cooldownRemaining).toBe(0); // Unchanged

    // Tick 1: Action resolves, cooldown decrements to 0, move1 ready again
    const state1 = createGameState({
      tick: 1,
      characters: result0.state.characters,
    });
    const result1 = processTick(state1);
    const char1 = result1.state.characters.find((c) => c.id === "char1");

    // After tick 1, action resolved, no new decision yet
    const move1_tick1 = char1?.skills.find((s) => s.instanceId === "move1");
    expect(char1?.currentAction).toBeNull(); // Action resolved, no new decision yet
    expect(move1_tick1?.cooldownRemaining).toBe(0); // Decremented after action cleared

    // Tick 2: Decision system should select move1 again (now ready, higher priority)
    const state2 = createGameState({
      tick: 2,
      characters: result1.state.characters,
    });
    const result2 = processTick(state2);
    const char2 = result2.state.characters.find((c) => c.id === "char1");
    expect(char2?.currentAction?.skill.instanceId).toBe("move1");
    const move1_tick2 = char2?.skills.find((s) => s.instanceId === "move1");
    expect(move1_tick2?.cooldownRemaining).toBeGreaterThan(0); // Cooldown set again
  });
});
