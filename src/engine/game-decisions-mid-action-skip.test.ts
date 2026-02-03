/**
 * Tests for mid-action skip logic in computeDecisions.
 */

import { describe, it, expect } from "vitest";
import { computeDecisions } from "./game-decisions";
import {
  createGameState,
  createCharacter,
  createSkill,
  createAttackAction,
} from "./game-test-helpers";

describe("computeDecisions - mid-action skip", () => {
  it("should skip characters with currentAction (mid-action)", () => {
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
      currentAction: createAttackAction({ x: 6, y: 5 }, 10, 2),
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

    expect(decisions).toHaveLength(0);
  });

  it("should return decision for idle characters (no currentAction)", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 6, y: 5 },
      currentAction: createAttackAction({ q: 3, r: 2 }, 10, 2),
    });
    const character = createCharacter({
      id: "char1",
      position: { q: 3, r: 2 },
      currentAction: null,
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

    expect(decisions).toHaveLength(1);
    expect(decisions[0]!.characterId).toBe("char1");
  });

  it("should handle mix of mid-action and idle characters", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 7, y: 5 },
      currentAction: createAttackAction({ x: 6, y: 5 }, 10, 2),
    });
    const midAction = createCharacter({
      id: "mid-action",
      position: { q: 3, r: 2 },
      currentAction: createAttackAction({ x: 6, y: 5 }, 10, 2),
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const idle = createCharacter({
      id: "idle",
      position: { x: 6, y: 5 },
      currentAction: null,
      skills: [
        createSkill({
          id: "skill2",
          damage: 10,
          triggers: [{ type: "always" }],
        }),
      ],
    });
    const state = createGameState({
      tick: 1,
      characters: [midAction, idle, enemy],
    });

    const decisions = computeDecisions(state);

    expect(decisions).toHaveLength(1);
    expect(decisions[0]!.characterId).toBe("idle");
  });
});
