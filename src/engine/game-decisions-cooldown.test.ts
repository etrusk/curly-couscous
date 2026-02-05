/**
 * Tests for cooldown rejection in decision phase.
 * Validates skills on cooldown are rejected with on_cooldown reason.
 */

import { describe, it, expect } from "vitest";
import { evaluateSkillsForCharacter } from "./game-decisions";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("game-decisions-cooldown", () => {
  it("skill-on-cooldown-rejected", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });

    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          cooldownRemaining: 2, // ON COOLDOWN
          triggers: [{ type: "always" }],
          range: 3,
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(character, [character, enemy]);

    expect(result.skillEvaluations).toHaveLength(1);
    expect(result.skillEvaluations[0]?.status).toBe("rejected");
    expect(result.skillEvaluations[0]?.rejectionReason).toBe("on_cooldown");
  });

  it("skill-cooldown-zero-is-available", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });

    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          cooldownRemaining: 0, // READY
          triggers: [{ type: "always" }],
          range: 3,
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(character, [character, enemy]);

    expect(result.skillEvaluations).toHaveLength(1);
    expect(result.skillEvaluations[0]?.status).toBe("selected");
    expect(result.skillEvaluations[0]?.rejectionReason).toBeUndefined();
  });

  it("skill-cooldown-undefined-is-available", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });

    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          damage: 10,
          // cooldownRemaining: undefined (no cooldown field)
          triggers: [{ type: "always" }],
          range: 3,
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(character, [character, enemy]);

    expect(result.skillEvaluations).toHaveLength(1);
    expect(result.skillEvaluations[0]?.status).toBe("selected");
  });

  it("cooldown-skips-to-next-skill", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });

    const character = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "skill1",
          instanceId: "skill1",
          damage: 20,
          cooldownRemaining: 3, // ON COOLDOWN
          triggers: [{ type: "always" }],
          range: 3,
        }),
        createSkill({
          id: "skill2",
          instanceId: "skill2",
          damage: 10,
          cooldownRemaining: 0, // READY
          triggers: [{ type: "always" }],
          range: 3,
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(character, [character, enemy]);

    expect(result.skillEvaluations).toHaveLength(2);

    // skill1 rejected
    expect(result.skillEvaluations[0]?.skill.id).toBe("skill1");
    expect(result.skillEvaluations[0]?.status).toBe("rejected");
    expect(result.skillEvaluations[0]?.rejectionReason).toBe("on_cooldown");

    // skill2 selected
    expect(result.skillEvaluations[1]?.skill.id).toBe("skill2");
    expect(result.skillEvaluations[1]?.status).toBe("selected");
    expect(result.selectedSkillIndex).toBe(1);
  });
});
