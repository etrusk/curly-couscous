/** Integration tests for selector filters through evaluateSkillsForCharacter pipeline. */

import { describe, it, expect } from "vitest";
import { evaluateSkillsForCharacter } from "./game-decisions";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("selector filter integration via evaluateSkillsForCharacter", () => {
  it("no filter: skill without selectorFilter is selected as before (no regression)", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("selected");
    expect(result.skillEvaluations[0]!.target).toEqual(enemy);
  });

  it("hp_below filter passes when target HP is at 30%", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 30,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("selected");
    expect(result.skillEvaluations[0]!.target!.id).toBe("enemy");
  });

  it("hp_below filter rejects when target HP is at 80%", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("hp_above filter passes when target HP is at 80%", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_above", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("selected");
  });

  it("hp_above filter rejects when target HP is at 30%", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_above", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 30,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("filter rejection includes failedFilter context", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.failedFilter).toEqual({
      type: "hp_below",
      value: 50,
    });
  });

  it("filter rejection includes target context", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.target).toBeDefined();
    expect(result.skillEvaluations[0]!.target!.id).toBe("enemy");
  });

  it("filter fallthrough: first skill rejected by filter, second skill selected", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack1",
          instanceId: "attack1",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
        createSkill({
          id: "attack2",
          instanceId: "attack2",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
    expect(result.skillEvaluations[1]!.status).toBe("selected");
    expect(result.selectedSkillIndex).toBe(1);
  });

  it("filter with self target: evaluator's own HP is checked", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      hp: 30,
      maxHp: 100,
      skills: [
        createSkill({
          id: "heal",
          healing: 25,
          range: 5,
          target: "self",
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly]);

    expect(result.skillEvaluations[0]!.status).toBe("selected");
  });

  it("trigger passes but filter fails: rejection reason is filter_failed", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "attack",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
    expect(result.skillEvaluations[0]!.failedTrigger).toBeUndefined();
  });

  it("filter on move skill: filter checked even though move skips range check", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "move",
          behavior: "towards",
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 3, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("filter checked before heal-full-HP: filter_failed takes precedence", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "heal",
          healing: 25,
          range: 5,
          target: "ally",
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
      ],
    });
    const ally = createCharacter({
      id: "ally",
      faction: "friendly",
      position: { q: 1, r: 0 },
      hp: 100,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, ally]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("duplicated skill instances have independent filter configurations", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "light-punch",
          instanceId: "lp-1",
          name: "Light Punch",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
          selectorFilter: { type: "hp_below", value: 50 },
        }),
        createSkill({
          id: "light-punch",
          instanceId: "lp-2",
          name: "Light Punch",
          damage: 10,
          range: 5,
          trigger: { scope: "enemy", condition: "always" },
        }),
      ],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });

    const result = evaluateSkillsForCharacter(friendly, [friendly, enemy]);

    expect(result.skillEvaluations[0]!.status).toBe("rejected");
    expect(result.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
    expect(result.skillEvaluations[1]!.status).toBe("selected");
    expect(result.selectedSkillIndex).toBe(1);
  });
});
