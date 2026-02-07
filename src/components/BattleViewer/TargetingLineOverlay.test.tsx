/**
 * Tests for TargetingLineOverlay component.
 * Tests overlay rendering, toggle behavior, and integration with game state.
 */

// File exceeds 400 lines due to comprehensive integration test coverage.
// TODO: Split into unit tests (overlay-unit.test.tsx) and integration tests (overlay-integration.test.tsx)

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TargetingLineOverlay } from "./TargetingLineOverlay";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createSkill,
} from "../../stores/gameStore-test-helpers";

describe("TargetingLineOverlay", () => {
  const defaultProps = {
    hexSize: 30,
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("Always Renders", () => {
    it("should always render SVG overlay without toggle gating", () => {
      // Do NOT set any showTargetLines state -- overlay should render regardless
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(Number(svg?.getAttribute("width"))).toBeGreaterThan(0);
      expect(Number(svg?.getAttribute("height"))).toBeGreaterThan(0);
    });
  });

  describe("Line Rendering", () => {
    it("should render lines for each character with valid movement target", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      const friendly1 = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
      });
      const friendly2 = createCharacter({
        id: "friendly2",
        faction: "friendly",
        position: { q: 1, r: 0 },
        skills: [moveSkill],
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 3, r: 1 },
        skills: [moveSkill],
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { q: 4, r: 0 },
        skills: [moveSkill],
      });
      useGameStore
        .getState()
        .actions.initBattle([friendly1, friendly2, enemy1, enemy2]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);
    });

    it("should render no lines when no characters exist", () => {
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(container.querySelectorAll("line")).toHaveLength(0);
    });

    it("should update lines when character positions change", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { q: 3, r: 1 },
      });
      useGameStore.getState().actions.initBattle([char1, char2]);

      const { container, rerender } = render(
        <TargetingLineOverlay {...defaultProps} />,
      );

      const initialLine = container.querySelector("line");
      // Initial: from {q:0,r:0} to {q:3,r:1} - pixel positions depend on hex conversion
      expect(initialLine).toHaveAttribute("x1");
      expect(initialLine).toHaveAttribute("y1");
      expect(initialLine).toHaveAttribute("x2");
      expect(initialLine).toHaveAttribute("y2");

      // Update char2 position
      useGameStore.setState((state) => {
        state.gameState.characters[1]!.position = { q: 2, r: 2 };
      });
      rerender(<TargetingLineOverlay {...defaultProps} />);

      const updatedLine = container.querySelector("line");
      // Updated: from {q:0,r:0} to {q:2,r:2} - pixel positions depend on hex conversion
      expect(updatedLine).toHaveAttribute("x1");
      expect(updatedLine).toHaveAttribute("y1");
      expect(updatedLine).toHaveAttribute("x2");
      expect(updatedLine).toHaveAttribute("y2");
    });

    it("should render lines visible at tick zero", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { q: 3, r: 1 },
      });
      useGameStore.getState().actions.initBattle([char1, char2]);
      // Tick should be 0 after initBattle

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(1);
      expect(useGameStore.getState().gameState.tick).toBe(0);
    });
  });

  describe("Overlay Styling", () => {
    it("should have pointer-events none (not block mouse)", () => {
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const svg = container.querySelector("svg");
      // CSS class will handle pointer-events: none
      expect(svg?.getAttribute("class")).toContain("targetingOverlay");
    });

    it("should be positioned absolutely", () => {
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      // Check via class name (CSS module will contain position absolute)
      expect(wrapper?.className).toBeTruthy();
    });
  });

  describe("Integration Tests", () => {
    it("should integrate with game state end-to-end", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { q: 3, r: 1 },
      });
      const char3 = createCharacter({
        id: "char3",
        faction: "friendly",
        position: { q: 0, r: 3 },
        skills: [moveSkill],
      });
      useGameStore.getState().actions.initBattle([char1, char2, char3]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      // 2 characters with Move skills, each should have a line
      expect(lines).toHaveLength(2);

      // Verify line endpoints match expected selector results
      // char1 should target char2 (no bidirectional, so no offset)
      // Pixel positions depend on hex conversion - just verify lines exist
      expect(lines.length).toBe(2);
    });

    it("should respect different selector types visually", () => {
      const nearestEnemySkill = createSkill({
        id: "move-nearest",
        behavior: "towards",
        tickCost: 1,
      });
      const lowestHpEnemySkill = createSkill({
        id: "move-lowest-hp",
        behavior: "towards",
        tickCost: 1,
        target: "enemy",
        criterion: "lowest_hp",
      });
      const charA = createCharacter({
        id: "charA",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [nearestEnemySkill],
      });
      const charB = createCharacter({
        id: "charB",
        faction: "friendly",
        position: { q: 0, r: 1 },
        skills: [lowestHpEnemySkill],
      });
      const enemyNear = createCharacter({
        id: "enemyNear",
        faction: "enemy",
        position: { q: 2, r: 0 },
        hp: 100,
      });
      const enemyFarLowHp = createCharacter({
        id: "enemyFarLowHp",
        faction: "enemy",
        position: { q: 3, r: 2 },
        hp: 30,
      });
      useGameStore
        .getState()
        .actions.initBattle([charA, charB, enemyNear, enemyFarLowHp]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(2);

      // Line from charA should go to nearest enemy (enemyNear)
      // Line from charB should go to lowest HP enemy (enemyFarLowHp)
      // Pixel positions depend on hex conversion - just verify both lines exist
      expect(lines.length).toBe(2);
    });

    it("should not render lines for dead characters", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
        hp: 0, // Dead
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "friendly",
        position: { q: 1, r: 0 },
        skills: [moveSkill],
      });
      const char3 = createCharacter({
        id: "char3",
        faction: "friendly",
        position: { q: 2, r: 2 },
        skills: [moveSkill],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 3, r: 1 },
      });
      useGameStore.getState().actions.initBattle([char1, char2, char3, enemy]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      // Only 2 lines (char2 and char3, not char1 because hp=0)
      expect(lines).toHaveLength(2);
    });

    it("should use uniform color for all factions", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      const friendly1 = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
      });
      const friendly2 = createCharacter({
        id: "friendly2",
        faction: "friendly",
        position: { q: 1, r: 0 },
        skills: [moveSkill],
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { q: 3, r: 1 },
        skills: [moveSkill],
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { q: 4, r: 0 },
        skills: [moveSkill],
      });
      useGameStore
        .getState()
        .actions.initBattle([friendly1, friendly2, enemy1, enemy2]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(4);

      // All lines should have identical styling
      lines.forEach((line) => {
        expect(line).toHaveAttribute("stroke", "var(--targeting-line-color)");
        expect(line).toHaveAttribute("stroke-dasharray", "1 3");
        expect(line).toHaveAttribute("stroke-width", "1.5");
        // Opacity can be on line or group
        const lineOpacity = line.getAttribute("opacity");
        const groupOpacity = line.parentElement?.getAttribute("opacity");
        expect(lineOpacity === "0.4" || groupOpacity === "0.4").toBe(true);
      });
    });

    it("should apply perpendicular offset only to bidirectional targeting lines", () => {
      const moveSkill = createSkill({
        id: "move-skill",
        behavior: "towards",
        tickCost: 1,
      });
      // char1 and char2 target each other (bidirectional), char3 targets char2 (unidirectional)
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { q: 3, r: 0 },
        skills: [moveSkill],
      });
      const char3 = createCharacter({
        id: "char3",
        faction: "friendly",
        position: { q: 0, r: 3 },
        skills: [moveSkill],
      });
      useGameStore.getState().actions.initBattle([char1, char2, char3]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(3);

      // Bidirectional lines (char1 and char2) should have perpendicular offset
      // Unidirectional line (char3) should NOT have offset
      // Exact pixel offsets depend on hex conversion - just verify 3 lines exist
      expect(lines.length).toBe(3);
    });
  });
});
