/**
 * Tests for no match to idle logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - no match to idle", () => {
  it("should return idle action when no skills match", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should return idle action when character has no skills", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should return idle action when all skills disabled", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 5, r: 0 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          enabled: false,
          trigger: { scope: "enemy", condition: "always" },
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          enabled: false,
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should return idle action with type=idle", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
      skills: [],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });

  it("should set idle targetCell to character position", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 1, r: 4 },
      skills: [],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.targetCell).toEqual({ q: 1, r: 4 });
  });

  it("should use new trigger shape in IDLE_SKILL", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "attack1",
          damage: 10,
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 }, // Out of range
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
    expect(decisions[0]!.action.skill.trigger.scope).toBe("enemy");
    expect(decisions[0]!.action.skill.trigger.condition).toBe("always");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- runtime guard
    expect((decisions[0]!.action.skill as any).triggers).toBeUndefined();
  });
});
