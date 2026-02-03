/**
 * Tests for attack targeting logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - attack targeting", () => {
  it("should lock attack targetCell to target's position", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          range: 5,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.targetCell).toEqual({ q: 4, r: 2 });
  });

  it("should set targetCharacter for attack actions", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.targetCharacter).toBeTruthy();
    expect(decisions[0]!.action.targetCharacter?.id).toBe("enemy");
  });

  it("should skip attack skill when target out of range", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          range: 1,
          triggers: [{ type: "always" }],
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

  it("should select attack skill when target exactly at range", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          range: 1,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("attack");
    expect(decisions[0]!.action.skill.id).toBe("skill1");
  });

  it("should skip attack skill when no valid target exists", () => {
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.type).toBe("idle");
  });
});
