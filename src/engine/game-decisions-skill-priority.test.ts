/**
 * Tests for skill priority order logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - skill priority order", () => {
  it("should select first matching skill (priority order)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 5 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill1");
  });

  it("should skip to second skill when first trigger fails", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
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
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill2");
  });

  it("should skip to third skill when first two fail", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 10 },
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 5, y: 5 },
      hp: 100,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "enemy_in_range", value: 1 }],
        }),
        createSkill({
          id: "skill2",
          damage: 20,
          triggers: [{ type: "hp_below", value: 50 }],
        }),
        createSkill({
          id: "skill3",
          damage: 30,
          range: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill3");
  });
});
