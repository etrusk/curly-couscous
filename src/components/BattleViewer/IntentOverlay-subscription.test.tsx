/**
 * Tests for IntentOverlay subscription behavior.
 * Verifies component re-renders when characters are added via store actions.
 *
 * These tests specifically target the Zustand subscription fix where
 * selectIntentData was not triggering re-renders on addCharacter/addCharacterAtPosition.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("IntentOverlay - Subscription Behavior", () => {
  const defaultProps = {
    hexSize: 40,
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.initBattle([]);
  });

  it("intent-overlay-re-renders-on-character-addition", async () => {
    // Render IntentOverlay with empty battle
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Initially, no lines (0 characters)
    let lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(0);

    // Add first character (friendly at 0,0)
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });

    // Still no lines (1 character, needs target)
    await waitFor(() => {
      lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(0);
    });

    // Add second character (enemy at 1,0, adjacent)
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 1, r: 0 });

    // Should now have 4 lines (2 characters x 2 lines each for bidirectional attack)
    await waitFor(() => {
      lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);
    });
  });

  it("intent-lines-appear-for-attack-with-addCharacter", async () => {
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Add friendly at (0,0)
    useGameStore.getState().actions.addCharacter("friendly");

    // Add enemy at (1,0) which is adjacent
    useGameStore.getState().actions.addCharacter("enemy");

    // Should have 4 lines (2 characters x 2 lines each)
    await waitFor(() => {
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);

      // Main lines are at indices 1 and 3
      const mainLine1 = lines[1]!;
      const mainLine2 = lines[3]!;

      // Both lines should use action-move color (addCharacter only assigns innate Move skill)
      expect(mainLine1).toHaveAttribute("stroke", "var(--action-move)");
      expect(mainLine2).toHaveAttribute("stroke", "var(--action-move)");
    });
  });

  it("intent-lines-appear-for-movement-when-characters-far-apart", async () => {
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Add friendly at (0,0)
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });

    // Add enemy far apart at (10,10) - out of attack range
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 4, r: 0 });

    // Should have 4 lines (2 characters x 2 lines each for movement intents)
    await waitFor(() => {
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);

      // Main lines are at indices 1 and 3
      const mainLine1 = lines[1]!;
      const mainLine2 = lines[3]!;

      // Both should be dashed (movement style)
      expect(mainLine1).toHaveAttribute("stroke-dasharray", "4 4");
      expect(mainLine2).toHaveAttribute("stroke-dasharray", "4 4");

      // Check markers for movement endpoints
      const friendlyMarker = mainLine1.getAttribute("marker-end");
      const enemyMarker = mainLine2.getAttribute("marker-end");

      // One should have circle-friendly, one should have diamond-enemy
      const hasFriendlyCircle =
        friendlyMarker?.includes("circle-friendly") ||
        enemyMarker?.includes("circle-friendly");
      const hasEnemyDiamond =
        friendlyMarker?.includes("diamond-enemy") ||
        enemyMarker?.includes("diamond-enemy");

      expect(hasFriendlyCircle).toBe(true);
      expect(hasEnemyDiamond).toBe(true);
    });
  });

  it("component-updates-after-store-action-without-rerender", async () => {
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Initial state: no lines
    let lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(0);

    // Add friendly at (0,0) - store action
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });

    // Add enemy at (1,0) - store action
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 1, r: 0 });

    // Final state: should have 4 lines WITHOUT explicit rerender
    await waitFor(() => {
      lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);
    });
  });

  it("existing-initBattle-tests-still-pass", () => {
    // Create two characters with pre-set currentAction for attack
    const skill = createSkill({
      id: "light-punch",
      tickCost: 1,
      damage: 10,
      range: 1,
    });
    const attackAction1 = {
      type: "attack" as const,
      skill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const attackAction2 = {
      type: "attack" as const,
      skill,
      targetCell: { q: 0, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: attackAction1,
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { q: 1, r: 0 },
      currentAction: attackAction2,
    });

    // Initialize with initBattle
    useGameStore.getState().actions.initBattle([char1, char2]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Should have 4 lines for bidirectional attack
    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(4);

    // Verify correct stroke colors
    const mainLine1 = lines[1]!;
    const mainLine2 = lines[3]!;

    // Both attack lines should use action-attack color
    expect(mainLine1).toHaveAttribute("stroke", "var(--action-attack)");
    expect(mainLine2).toHaveAttribute("stroke", "var(--action-attack)");
  });

  it("no-intent-lines-for-single-character", () => {
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Add single character
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });

    // No lines (no valid target)
    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(0);
  });

  it("intent-lines-update-on-third-character-addition", async () => {
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Add friendly at (0,0) and enemy at (1,0) - adjacent
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 1, r: 0 });

    // Should have 4 attack lines (bidirectional attack)
    await waitFor(() => {
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);
    });

    // Add second friendly at (5,5) - far from both
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 3, r: 1 });

    // Should now have 6 lines total (4 for attack pair + 2 for movement)
    await waitFor(() => {
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(6);
    });
  });

  it("intent-lines-update-on-character-removal", async () => {
    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Add friendly and enemy adjacent
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("friendly", { q: 0, r: 0 });
    useGameStore
      .getState()
      .actions.addCharacterAtPosition("enemy", { q: 1, r: 0 });

    // Should have 4 lines
    await waitFor(() => {
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);
    });

    // Get enemy ID and remove it
    const enemy = useGameStore
      .getState()
      .gameState.characters.find((c) => c.faction === "enemy");
    expect(enemy).toBeDefined();
    useGameStore.getState().actions.removeCharacter(enemy!.id);

    // Should have 0 lines (single character has no target, returns idle)
    await waitFor(() => {
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(0);
    });
  });
});
