/**
 * Tests for selectIntentData selector - targeting mode behavior.
 * Validates intent lines track character position for character-targeted skills.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";
import { createCharacter, createSkill } from "./gameStore-test-helpers";
import type { Action, Character } from "../engine/types";

describe("selectIntentData - Targeting Mode", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("intent-line-tracks-character-targeted-heal", () => {
    // Create target character snapshot for action.targetCharacter
    const targetSnapshot: Character = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 1, r: 0 }, // Original position when action was decided
    });

    const healAction: Action = {
      type: "heal",
      skill: createSkill({
        id: "heal", // Character-targeting mode
        healing: 25,
        tickCost: 2,
      }),
      targetCell: { q: 1, r: 0 }, // Locked cell from decision time
      targetCharacter: targetSnapshot,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };

    const healer = createCharacter({
      id: "healer",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: healAction,
    });

    // Target has MOVED to new position
    const target = createCharacter({
      id: "target",
      faction: "friendly",
      position: { q: 2, r: 0 }, // NEW position (moved during wind-up)
    });

    useGameStore.getState().actions.initBattle([healer, target]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    const intent = result[0];
    expect(intent?.characterId).toBe("healer");
    // Intent line should point to target's CURRENT position, not locked targetCell
    expect(intent?.targetPosition).toEqual({ q: 2, r: 0 }); // NOT { q: 1, r: 0 }
    expect(intent?.action.targetCell).toEqual({ q: 1, r: 0 }); // Original locked cell unchanged
  });

  it("intent-line-uses-cell-for-attack", () => {
    const attackAction: Action = {
      type: "attack",
      skill: createSkill({
        id: "light-punch", // Cell-targeting mode
        damage: 10,
        tickCost: 2,
      }),
      targetCell: { q: 2, r: 0 }, // Locked cell from decision time
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };

    const attacker = createCharacter({
      id: "attacker",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: attackAction,
    });

    // Original target has MOVED away
    const target = createCharacter({
      id: "target",
      faction: "enemy",
      position: { q: 3, r: 0 }, // NEW position (dodged)
    });

    useGameStore.getState().actions.initBattle([attacker, target]);

    const result = selectIntentData(useGameStore.getState());

    expect(result).toHaveLength(1);
    const intent = result[0];
    expect(intent?.characterId).toBe("attacker");
    // Intent line should point to locked targetCell (cell targeting)
    expect(intent?.targetPosition).toEqual({ q: 2, r: 0 });
    expect(intent?.action.targetCell).toEqual({ q: 2, r: 0 });
  });
});
