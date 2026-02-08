/**
 * Integration tests for skill filters: HP conditions, rejection context, and edge cases.
 * Split from selector-filter-integration.test.ts
 */

import { describe, it, expect } from "vitest";
import { evaluateSkillsForCharacter } from "./game-decisions";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("filter integration - HP, rejection context, and edge cases", () => {
  it("no filter -- skill without filter is selected as before", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [createSkill({ id: "atk", damage: 10, range: 5 })],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target).toEqual(e);
  });

  it("hp_below filter passes when target HP is at 30%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 30,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
    expect(r.skillEvaluations[0]!.target!.id).toBe("e");
  });

  it("hp_below filter rejects when target HP is at 80%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("hp_above filter passes when target HP is at 80%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_above", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });

  it("hp_above filter rejects when target HP is at 30%", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_above", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 30,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("rejected");
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("filter rejection includes failedFilter context with SkillFilter shape", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.failedFilter).toEqual({
      condition: "hp_below",
      conditionValue: 50,
    });
  });

  it("filter_failed result does not include a target (pre-criterion semantics)", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.target).toBeUndefined();
  });

  it("empty filtered pool produces filter_failed when base pool is non-empty", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("filter_failed");
  });

  it("no_target produced when base pool is empty (no living enemies)", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50 },
        }),
      ],
    });
    const r = evaluateSkillsForCharacter(f, [f]);
    expect(r.skillEvaluations[0]!.rejectionReason).toBe("no_target");
  });

  it("negated filter in pipeline -- NOT hp_below passes when target is above threshold", () => {
    const f = createCharacter({
      id: "f",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [
        createSkill({
          id: "atk",
          damage: 10,
          range: 5,
          filter: { condition: "hp_below", conditionValue: 50, negated: true },
        }),
      ],
    });
    const e = createCharacter({
      id: "e",
      faction: "enemy",
      position: { q: 1, r: 0 },
      hp: 80,
      maxHp: 100,
    });
    const r = evaluateSkillsForCharacter(f, [f, e]);
    expect(r.skillEvaluations[0]!.status).toBe("selected");
  });
});
