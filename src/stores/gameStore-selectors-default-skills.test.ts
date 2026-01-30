/**
 * Tests for selectIntentData selector - DEFAULT_SKILLS integration.
 * Extracted from gameStore-selectors-intent-preview.test.ts to maintain file size under 400 lines.
 *
 * Tests verify that selectIntentData correctly computes intent data when using
 * DEFAULT_SKILLS (Light Punch, Heavy Punch, Move Towards) via addCharacter/addCharacterAtPosition.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, selectIntentData } from "./gameStore";

describe("selectIntentData - DEFAULT_SKILLS integration", () => {
  beforeEach(() => {
    // Clear all characters by initializing with empty array
    // This prevents characters from previous tests persisting in initialCharacters
    useGameStore.getState().actions.initBattle([]);
  });

  it("movement-intent-when-far-apart-via-addCharacterAtPosition", () => {
    // Setup: characters with DEFAULT_SKILLS placed far apart
    const { actions } = useGameStore.getState();
    actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
    actions.addCharacterAtPosition("enemy", { x: 10, y: 10 });
    // Chebyshev distance = max(10, 10) = 10 cells
    // Outside Light Punch (range=1) and Heavy Punch (range=2)
    // Should select Move Towards

    const result = selectIntentData(useGameStore.getState());

    // Should have 2 intents (both characters)
    expect(result).toHaveLength(2);

    const friendlyIntent = result.find((r) => r.faction === "friendly");
    const enemyIntent = result.find((r) => r.faction === "enemy");

    // Both should be movement (not attack)
    expect(friendlyIntent?.action.type).toBe("move");
    expect(enemyIntent?.action.type).toBe("move");

    // Both should have ticksRemaining=1 (Move Towards tickCost=1)
    expect(friendlyIntent?.ticksRemaining).toBe(1);
    expect(enemyIntent?.ticksRemaining).toBe(1);

    // Verify character positions
    expect(friendlyIntent?.characterPosition).toEqual({ x: 0, y: 0 });
    expect(enemyIntent?.characterPosition).toEqual({ x: 10, y: 10 });

    // Both should have targetCell defined (movement target)
    expect(friendlyIntent?.action.targetCell).toBeDefined();
    expect(enemyIntent?.action.targetCell).toBeDefined();
  });

  it("attack-intent-when-adjacent-via-addCharacter", () => {
    // Setup: characters with DEFAULT_SKILLS placed adjacent
    const { actions } = useGameStore.getState();
    actions.addCharacter("friendly"); // Places at (0,0)
    actions.addCharacter("enemy"); // Places at (1,0) - next available

    // Assign Light Punch to both characters (now they start with only Move)
    const characters = useGameStore.getState().gameState.characters;
    actions.assignSkillToCharacter(characters[0]!.id, "light-punch");
    actions.assignSkillToCharacter(characters[1]!.id, "light-punch");
    // Chebyshev distance = 1, within Light Punch range

    // Verify skills were assigned
    const charsAfterAssign = useGameStore.getState().gameState.characters;
    expect(charsAfterAssign[0]?.skills).toHaveLength(2);
    expect(charsAfterAssign[1]?.skills).toHaveLength(2);

    const result = selectIntentData(useGameStore.getState());

    // Should have 2 intents
    expect(result).toHaveLength(2);

    const friendlyIntent = result.find((r) => r.faction === "friendly");
    const enemyIntent = result.find((r) => r.faction === "enemy");

    // Both should be attack
    expect(friendlyIntent?.action.type).toBe("attack");
    expect(enemyIntent?.action.type).toBe("attack");

    // Both should use Light Punch (tickCost=1)
    expect(friendlyIntent?.ticksRemaining).toBe(1);
    expect(enemyIntent?.ticksRemaining).toBe(1);

    // Both should be using Light Punch skill
    expect(friendlyIntent?.action.skill.id).toBe("light-punch");
    expect(enemyIntent?.action.skill.id).toBe("light-punch");
  });

  it("attack-intent-when-at-range-2-via-addCharacterAtPosition", () => {
    // Setup: characters at range 2
    const { actions } = useGameStore.getState();
    actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
    actions.addCharacterAtPosition("enemy", { x: 2, y: 0 });

    // Assign Light Punch and Heavy Punch to both characters
    const characters = useGameStore.getState().gameState.characters;
    actions.assignSkillToCharacter(characters[0]!.id, "light-punch");
    actions.assignSkillToCharacter(characters[0]!.id, "heavy-punch");
    actions.assignSkillToCharacter(characters[1]!.id, "light-punch");
    actions.assignSkillToCharacter(characters[1]!.id, "heavy-punch");
    // Chebyshev distance = 2
    // Outside Light Punch (range=1), within Heavy Punch (range=2)

    const result = selectIntentData(useGameStore.getState());

    // Should have 2 intents
    expect(result).toHaveLength(2);

    const friendlyIntent = result.find((r) => r.faction === "friendly");
    const enemyIntent = result.find((r) => r.faction === "enemy");

    // Both should be attack
    expect(friendlyIntent?.action.type).toBe("attack");
    expect(enemyIntent?.action.type).toBe("attack");

    // Both should use Heavy Punch
    expect(friendlyIntent?.action.skill.id).toBe("heavy-punch");
    expect(enemyIntent?.action.skill.id).toBe("heavy-punch");

    // Heavy Punch has tickCost=2
    expect(friendlyIntent?.ticksRemaining).toBe(2);
    expect(enemyIntent?.ticksRemaining).toBe(2);
  });

  it("movement-intent-when-just-outside-heavy-punch-range", () => {
    // Setup: characters at range 3
    const { actions } = useGameStore.getState();
    actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
    actions.addCharacterAtPosition("enemy", { x: 3, y: 0 });
    // Chebyshev distance = 3
    // Outside Light Punch (range=1) and Heavy Punch (range=2)

    const result = selectIntentData(useGameStore.getState());

    // Should have 2 intents
    expect(result).toHaveLength(2);

    const friendlyIntent = result.find((r) => r.faction === "friendly");
    const enemyIntent = result.find((r) => r.faction === "enemy");

    // Both should be movement
    expect(friendlyIntent?.action.type).toBe("move");
    expect(enemyIntent?.action.type).toBe("move");

    // Both should use Move Towards
    expect(friendlyIntent?.action.skill.id).toBe("move-towards");
    expect(enemyIntent?.action.skill.id).toBe("move-towards");

    // Move Towards has tickCost=1
    expect(friendlyIntent?.ticksRemaining).toBe(1);
    expect(enemyIntent?.ticksRemaining).toBe(1);
  });

  it("mixed-intent-types-when-asymmetric-distances", () => {
    // Setup: multiple characters at different distances
    const { actions } = useGameStore.getState();
    actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
    actions.addCharacterAtPosition("friendly", { x: 1, y: 0 }); // Second friendly
    actions.addCharacterAtPosition("enemy", { x: 10, y: 10 });
    // First friendly: distance = 10, should move
    // Second friendly: distance = max(9, 10) = 10, should move
    // Enemy: distance to nearest = 10, should move

    const result = selectIntentData(useGameStore.getState());

    // Should have 3 intents
    expect(result).toHaveLength(3);

    // All three should be movement (all out of attack range)
    expect(result[0]?.action.type).toBe("move");
    expect(result[1]?.action.type).toBe("move");
    expect(result[2]?.action.type).toBe("move");
  });

  it("intent-data-includes-correct-faction-with-default-skills", () => {
    // Setup: characters with DEFAULT_SKILLS at medium distance
    const { actions } = useGameStore.getState();
    actions.addCharacterAtPosition("friendly", { x: 0, y: 0 });
    actions.addCharacterAtPosition("enemy", { x: 5, y: 5 });
    // Chebyshev distance = max(5, 5) = 5, outside attack range

    const result = selectIntentData(useGameStore.getState());

    // Should have 2 intents
    expect(result).toHaveLength(2);

    const friendlyIntent = result.find((r) => r.faction === "friendly");
    const enemyIntent = result.find((r) => r.faction === "enemy");

    // Verify faction fields
    expect(friendlyIntent?.faction).toBe("friendly");
    expect(enemyIntent?.faction).toBe("enemy");

    // Verify characterId contains faction
    expect(friendlyIntent?.characterId).toContain("friendly");
    expect(enemyIntent?.characterId).toContain("enemy");
  });
});
