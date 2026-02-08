/**
 * Integration tests for createSkillAction with distance support.
 * Phase 5: Tests multi-step movement wiring for Dash skill.
 */

import { describe, it, expect } from "vitest";
import { createSkillAction } from "./game-actions";
import { createCharacter, createSkill } from "./game-test-helpers";

describe("createSkillAction - distance integration", () => {
  it("Move skill (distance 1) produces single-step destination", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const moveSkill = createSkill({
      id: "move-towards",
      actionType: "move",
      behavior: "towards",
      distance: 1,
      tickCost: 1,
    });

    const action = createSkillAction(moveSkill, mover, target, 0, [
      mover,
      target,
    ]);

    expect(action.targetCell).toEqual({ q: 1, r: 0 });
    expect(action.type).toBe("move");
  });

  it("Dash skill (distance 2) produces two-step destination", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 0 },
    });
    const dashSkill = createSkill({
      id: "dash",
      actionType: "move",
      behavior: "towards",
      distance: 2,
      tickCost: 0,
    });

    const action = createSkillAction(dashSkill, mover, target, 0, [
      mover,
      target,
    ]);

    expect(action.targetCell).toEqual({ q: 2, r: 0 });
    expect(action.type).toBe("move");
  });

  it("Dash with blocked second step produces partial destination", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 4, r: 0 },
    });
    const blocker = createCharacter({
      id: "blocker",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    const dashSkill = createSkill({
      id: "dash",
      actionType: "move",
      behavior: "towards",
      distance: 2,
      tickCost: 0,
    });

    const action = createSkillAction(dashSkill, mover, target, 0, [
      mover,
      target,
      blocker,
    ]);

    // Should have moved at least 1 step
    expect(action.targetCell).not.toEqual({ q: 0, r: 0 });
    // Should not have reached the blocked cell
    expect(action.targetCell).not.toEqual({ q: 2, r: 0 });
  });

  it("Dash tickCost 0 resolves at the same tick", () => {
    const mover = createCharacter({
      id: "mover",
      faction: "friendly",
      position: { q: 0, r: 0 },
    });
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: 0 },
    });
    const dashSkill = createSkill({
      id: "dash",
      actionType: "move",
      behavior: "towards",
      distance: 2,
      tickCost: 0,
    });

    const action = createSkillAction(dashSkill, mover, target, 5, [
      mover,
      target,
    ]);

    expect(action.startedAtTick).toBe(5);
    expect(action.resolvesAtTick).toBe(5);
  });
});
