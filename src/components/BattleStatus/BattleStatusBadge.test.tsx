/**
 * Tests for BattleStatusBadge component.
 * Following TDD workflow - tests written first.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BattleStatusBadge } from "./BattleStatusBadge";
import { useGameStore } from "../../stores/gameStore";
import type { Character } from "../../engine/types";

/** Create a character fixture with hp override */
function makeChar(faction: "friendly" | "enemy", hp = 100): Character {
  const isFriendly = faction === "friendly";
  return {
    id: isFriendly ? "friendly-1" : "enemy-1",
    name: isFriendly ? "Friendly" : "Enemy",
    faction,
    slotPosition: isFriendly ? 1 : 2,
    hp,
    maxHp: 100,
    position: isFriendly ? { q: 0, r: 0 } : { q: -5, r: 5 },
    skills: [],
    currentAction: null,
  };
}

/** Both characters alive -- active battle */
function activePair(): Character[] {
  return [makeChar("friendly"), makeChar("enemy")];
}

/** Friendly alive, enemy dead -- victory */
function victoryPair(): Character[] {
  return [makeChar("friendly"), makeChar("enemy", 0)];
}

/** Friendly dead, enemy alive -- defeat */
function defeatPair(): Character[] {
  return [makeChar("friendly", 0), makeChar("enemy")];
}

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
          actions.initBattle(activePair());
        } else if (status === "victory") {
          actions.initBattle(victoryPair());
          actions.processTick();
        } else if (status === "defeat") {
          actions.initBattle(defeatPair());
          actions.processTick();
        } else if (status === "draw") {
          actions.initBattle([]);
        }

        const { container } = render(<BattleStatusBadge />);

        // Verify text content via testid (avoids ambiguity with role="alert" duplicate)
        const statusEl = screen.getByTestId("battle-status");
        expect(statusEl).toHaveTextContent(expectedText);

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
      const actions = useGameStore.getState().actions;
      actions.initBattle(activePair());

      render(<BattleStatusBadge />);

      // Verify tick display at initial state
      expect(screen.getByText(/tick:.*0/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should include status emoji with aria-hidden for accessibility", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle(activePair());

      const { container } = render(<BattleStatusBadge />);

      // Find emoji element
      const emojiElement = container.querySelector('[aria-hidden="true"]');
      expect(emojiElement).toBeInTheDocument();
      expect(emojiElement?.textContent).toBe("⚔️");
    });

    it("should have aria-live region for status announcements", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle(activePair());

      const { container } = render(<BattleStatusBadge />);

      // Verify aria-live region exists
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it("renders role='alert' with 'Victory!' text for victory state", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle(victoryPair());
      actions.processTick();

      render(<BattleStatusBadge />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
      expect(alertElement.textContent).toContain("Victory!");
    });

    it("renders role='alert' with 'Defeat' text for defeat state", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle(defeatPair());
      actions.processTick();

      render(<BattleStatusBadge />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
      expect(alertElement.textContent).toContain("Defeat");
    });

    it("renders role='alert' with 'Draw' text for draw state", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle([]);

      render(<BattleStatusBadge />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
      expect(alertElement.textContent).toContain("Draw");
    });

    it("renders role='alert' element with no text content during active state", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle(activePair());

      render(<BattleStatusBadge />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
      expect(alertElement.textContent?.trim()).toBe("");
    });

    it("preserves aria-live='polite' region alongside role='alert' element", () => {
      const actions = useGameStore.getState().actions;
      actions.initBattle(victoryPair());
      actions.processTick();

      const { container } = render(<BattleStatusBadge />);

      // The aria-live="polite" region should still exist
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.textContent).toContain("Victory!");
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
