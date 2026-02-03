/**
 * Tests for trigger AND logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
} from "./game-test-helpers";

describe("computeDecisions - trigger AND logic", () => {
  it("should pass when all triggers pass (AND logic)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [
            { type: "enemy_in_range", value: 3 },
            { type: "hp_below", value: 50 },
          ],
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

  it("should fail when any trigger fails (AND logic)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: -3 }, // Distance 5 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      hp: 30,
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [
            { type: "enemy_in_range", value: 3 },
            { type: "hp_below", value: 50 },
          ],
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

  it("should pass when triggers array is empty (vacuous truth)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 4, r: 2 }, // Distance 1 from {q:3, r:2}
    });
    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 3, r: 2 },
      skills: [createSkill({ id: "skill1", damage: 10, triggers: [] })],
    });
    const state = createGameState({
      tick: 1,
      characters: [character, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions[0]!.action.skill.id).toBe("skill1");
  });
});
