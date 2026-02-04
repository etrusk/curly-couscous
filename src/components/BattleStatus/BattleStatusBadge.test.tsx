/**
 * Tests for BattleStatusBadge component.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BattleStatusBadge } from "./BattleStatusBadge";
import { useGameStore } from "../../stores/gameStore";
import type { Character } from "../../engine/types";

describe("BattleStatusBadge", () => {
  beforeEach(() => {
    // Reset store before each test
    const actions = useGameStore.getState().actions;
    actions.initBattle([]);
  });

  describe("Status Display", () => {
    it.each([
      ["active", "Battle Active", "statusActive", "⚔️"],
      ["victory", "Victory!", "statusVictory", "✓"],
      ["defeat", "Defeat", "statusDefeat", "✗"],
      ["draw", "Draw", "statusDraw", "≈"],
    ] as const)(
      "should display correct text and CSS class for %s status",
      (status, expectedText, expectedClass, expectedEmoji) => {
        // Setup: Set battle to the target status
        const actions = useGameStore.getState().actions;

        if (status === "active") {
          // Active state - need at least one character from each faction
          const testCharacters: Character[] = [
            {
              id: "friendly-1",
              name: "Friendly",
              faction: "friendly",
              slotPosition: 1,
              hp: 100,
              maxHp: 100,
              position: { q: 0, r: 0 },
              skills: [],
              currentAction: null,
            },
            {
              id: "enemy-1",
              name: "Enemy",
              faction: "enemy",
              slotPosition: 2,
              hp: 100,
              maxHp: 100,
              position: { q: -5, r: 5 },
              skills: [],
              currentAction: null,
            },
          ];
          actions.initBattle(testCharacters);
        } else if (status === "victory") {
          // Victory state - only friendly alive
          const testCharacters: Character[] = [
            {
              id: "friendly-1",
              name: "Friendly",
              faction: "friendly",
              slotPosition: 1,
              hp: 100,
              maxHp: 100,
              position: { q: 0, r: 0 },
              skills: [],
              currentAction: null,
            },
            {
              id: "enemy-1",
              name: "Enemy",
              faction: "enemy",
              slotPosition: 2,
              hp: 0, // Dead
              maxHp: 100,
              position: { q: -5, r: 5 },
              skills: [],
              currentAction: null,
            },
          ];
          actions.initBattle(testCharacters);
          actions.processTick(); // Process to trigger status update
        } else if (status === "defeat") {
          // Defeat state - only enemy alive
          const testCharacters: Character[] = [
            {
              id: "friendly-1",
              name: "Friendly",
              faction: "friendly",
              slotPosition: 1,
              hp: 0, // Dead
              maxHp: 100,
              position: { q: 0, r: 0 },
              skills: [],
              currentAction: null,
            },
            {
              id: "enemy-1",
              name: "Enemy",
              faction: "enemy",
              slotPosition: 2,
              hp: 100,
              maxHp: 100,
              position: { q: -5, r: 5 },
              skills: [],
              currentAction: null,
            },
          ];
          actions.initBattle(testCharacters);
          actions.processTick(); // Process to trigger status update
        } else if (status === "draw") {
          // Draw state - no characters or all dead
          actions.initBattle([]);
        }

        const { container } = render(<BattleStatusBadge />);

        // Verify text content
        expect(screen.getByText(expectedText)).toBeInTheDocument();

        // Verify emoji is present
        expect(screen.getByText(expectedEmoji)).toBeInTheDocument();

        // Verify CSS class is applied (CSS Modules generate hashed names, so check substring)
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toContain(expectedClass);
      },
    );
  });

  describe("Tick Display", () => {
    it("should display current tick number", () => {
      // Setup: Initialize with active battle at tick 0
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly",
          faction: "friendly",
          slotPosition: 1,
          hp: 100,
          maxHp: 100,
          position: { q: 0, r: 0 },
          skills: [],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy",
          faction: "enemy",
          slotPosition: 2,
          hp: 100,
          maxHp: 100,
          position: { q: -5, r: 5 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      render(<BattleStatusBadge />);

      // Verify tick display at initial state
      expect(screen.getByText(/tick:.*0/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should include status emoji with aria-hidden for accessibility", () => {
      // Setup: Active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly",
          faction: "friendly",
          slotPosition: 1,
          hp: 100,
          maxHp: 100,
          position: { q: 0, r: 0 },
          skills: [],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy",
          faction: "enemy",
          slotPosition: 2,
          hp: 100,
          maxHp: 100,
          position: { q: -5, r: 5 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      const { container } = render(<BattleStatusBadge />);

      // Find emoji element
      const emojiElement = container.querySelector('[aria-hidden="true"]');
      expect(emojiElement).toBeInTheDocument();
      expect(emojiElement?.textContent).toBe("⚔️");
    });

    it("should have aria-live region for status announcements", () => {
      // Setup: Active battle
      const actions = useGameStore.getState().actions;
      const testCharacters: Character[] = [
        {
          id: "friendly-1",
          name: "Friendly",
          faction: "friendly",
          slotPosition: 1,
          hp: 100,
          maxHp: 100,
          position: { q: 0, r: 0 },
          skills: [],
          currentAction: null,
        },
        {
          id: "enemy-1",
          name: "Enemy",
          faction: "enemy",
          slotPosition: 2,
          hp: 100,
          maxHp: 100,
          position: { q: -5, r: 5 },
          skills: [],
          currentAction: null,
        },
      ];
      actions.initBattle(testCharacters);

      const { container } = render(<BattleStatusBadge />);

      // Verify aria-live region exists
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe("Defensive Rendering", () => {
    it("should handle unexpected status value defensively", () => {
      // Setup: Manually corrupt the store state to have an invalid status
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      // Manually override battleStatus to invalid value for defensive test
      useGameStore.setState((state) => {
        // @ts-expect-error - intentionally setting invalid value for defensive test
        state.gameState.battleStatus = "invalid-status";
      });

      const { container } = render(<BattleStatusBadge />);

      // Should render "Unknown" text
      expect(screen.getByText("Unknown")).toBeInTheDocument();

      // Should apply neutral/unknown CSS class (CSS Modules generate hashed names)
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("statusUnknown");
    });
  });
});
