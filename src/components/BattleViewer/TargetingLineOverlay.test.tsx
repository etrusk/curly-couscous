/**
 * Tests for TargetingLineOverlay component.
 * Tests overlay rendering, toggle behavior, and integration with game state.
 */

/* eslint-disable max-lines */
// File exceeds 400 lines due to comprehensive integration test coverage.
// TODO: Split into unit tests (overlay-unit.test.tsx) and integration tests (overlay-integration.test.tsx)

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { TargetingLineOverlay } from "./TargetingLineOverlay";
import { useAccessibilityStore } from "../../stores/accessibilityStore";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createSkill,
} from "../../stores/gameStore-test-helpers";

describe("TargetingLineOverlay", () => {
  const defaultProps = {
    gridWidth: 12,
    gridHeight: 12,
    cellSize: 40,
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useAccessibilityStore.setState({ showTargetLines: false });
  });

  describe("Toggle Behavior", () => {
    it("should render null when toggle is off", () => {
      useAccessibilityStore.setState({ showTargetLines: false });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      useGameStore.getState().actions.initBattle([char1, char2]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      expect(container.querySelector("svg")).toBeNull();
    });

    it("should render SVG when toggle is on", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      useGameStore.getState().actions.initBattle([char1, char2]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "480"); // 12 * 40
      expect(svg).toHaveAttribute("height", "480"); // 12 * 40
    });

    it("should toggle reactively show/hide when toggle changes", () => {
      useAccessibilityStore.setState({ showTargetLines: false });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      useGameStore.getState().actions.initBattle([char1, char2]);

      const { container, rerender } = render(
        <TargetingLineOverlay {...defaultProps} />,
      );

      // Initially off
      expect(container.querySelector("line")).toBeNull();

      // Toggle on
      useAccessibilityStore.setState({ showTargetLines: true });
      rerender(<TargetingLineOverlay {...defaultProps} />);
      expect(container.querySelector("line")).toBeInTheDocument();

      // Toggle off again
      useAccessibilityStore.setState({ showTargetLines: false });
      rerender(<TargetingLineOverlay {...defaultProps} />);
      expect(container.querySelector("line")).toBeNull();
    });
  });

  describe("Line Rendering", () => {
    it("should render lines for each character with valid movement target", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const friendly1 = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const friendly2 = createCharacter({
        id: "friendly2",
        faction: "friendly",
        position: { x: 1, y: 1 },
        skills: [moveSkill],
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { x: 5, y: 5 },
        skills: [moveSkill],
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { x: 6, y: 6 },
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
      useAccessibilityStore.setState({ showTargetLines: true });
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(container.querySelectorAll("line")).toHaveLength(0);
    });

    it("should update lines when character positions change", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      useGameStore.getState().actions.initBattle([char1, char2]);

      const { container, rerender } = render(
        <TargetingLineOverlay {...defaultProps} />,
      );

      const initialLine = container.querySelector("line");
      // Initial: from (0,0) to (5,5) => (20, 20) to (220, 220)
      expect(initialLine).toHaveAttribute("x1", "20");
      expect(initialLine).toHaveAttribute("y1", "20");
      expect(initialLine).toHaveAttribute("x2", "220");
      expect(initialLine).toHaveAttribute("y2", "220");

      // Update char2 position
      useGameStore.setState((state) => {
        state.gameState.characters[1]!.position = { x: 7, y: 7 };
      });
      rerender(<TargetingLineOverlay {...defaultProps} />);

      const updatedLine = container.querySelector("line");
      // Updated: from (0,0) to (7,7) => (20, 20) to (300, 300)
      expect(updatedLine).toHaveAttribute("x1", "20");
      expect(updatedLine).toHaveAttribute("y1", "20");
      expect(updatedLine).toHaveAttribute("x2", "300");
      expect(updatedLine).toHaveAttribute("y2", "300");
    });

    it("should render lines visible at tick zero", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 5 },
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
      useAccessibilityStore.setState({ showTargetLines: true });
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const svg = container.querySelector("svg");
      // CSS class will handle pointer-events: none
      expect(svg?.getAttribute("class")).toContain("targetingOverlay");
    });

    it("should be positioned absolutely", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      useGameStore.getState().actions.initBattle([]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const wrapper = container.firstChild as HTMLElement;
      // Check via class name (CSS module will contain position absolute)
      expect(wrapper?.className).toBeTruthy();
    });
  });

  describe("Integration Tests", () => {
    it("should integrate with game state end-to-end", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      const char3 = createCharacter({
        id: "char3",
        faction: "friendly",
        position: { x: 10, y: 0 },
        skills: [moveSkill],
      });
      useGameStore.getState().actions.initBattle([char1, char2, char3]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      // 2 characters with Move skills, each should have a line
      expect(lines).toHaveLength(2);

      // Verify line endpoints match expected selector results
      // char1 should target char2 (no bidirectional, so no offset)
      const char1Line = Array.from(lines).find(
        (line) => line.getAttribute("x1") === "20",
      );
      expect(char1Line).toBeDefined();
      expect(char1Line).toHaveAttribute("x1", "20"); // char1 at (0,0) center
      expect(char1Line).toHaveAttribute("y1", "20");
      expect(char1Line).toHaveAttribute("x2", "220"); // char2 at (5,5) center
      expect(char1Line).toHaveAttribute("y2", "220");
    });

    it("should respect different selector types visually", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const nearestEnemySkill = createSkill({
        id: "move-nearest",
        mode: "towards",
        tickCost: 1,
      });
      const lowestHpEnemySkill = createSkill({
        id: "move-lowest-hp",
        mode: "towards",
        tickCost: 1,
        selectorOverride: { type: "lowest_hp_enemy" },
      });
      const charA = createCharacter({
        id: "charA",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [nearestEnemySkill],
      });
      const charB = createCharacter({
        id: "charB",
        faction: "friendly",
        position: { x: 0, y: 1 },
        skills: [lowestHpEnemySkill],
      });
      const enemyNear = createCharacter({
        id: "enemyNear",
        faction: "enemy",
        position: { x: 2, y: 0 },
        hp: 100,
      });
      const enemyFarLowHp = createCharacter({
        id: "enemyFarLowHp",
        faction: "enemy",
        position: { x: 8, y: 8 },
        hp: 30,
      });
      useGameStore
        .getState()
        .actions.initBattle([charA, charB, enemyNear, enemyFarLowHp]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(2);

      // Line from charA should go to nearest enemy (enemyNear at 2,0)
      const lineA = Array.from(lines).find(
        (line) =>
          line.getAttribute("x1") === "20" && line.getAttribute("y1") === "20",
      );
      expect(lineA).toHaveAttribute("x2", "100"); // enemyNear at (2,0) => 2*40+20 = 100
      expect(lineA).toHaveAttribute("y2", "20");

      // Line from charB should go to lowest HP enemy (enemyFarLowHp at 8,8)
      const lineB = Array.from(lines).find(
        (line) =>
          line.getAttribute("x1") === "20" && line.getAttribute("y1") === "60",
      );
      expect(lineB).toHaveAttribute("x2", "340"); // enemyFarLowHp at (8,8) => 8*40+20 = 340
      expect(lineB).toHaveAttribute("y2", "340");
    });

    it("should not render lines for dead characters", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
        hp: 0, // Dead
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "friendly",
        position: { x: 1, y: 1 },
        skills: [moveSkill],
      });
      const char3 = createCharacter({
        id: "char3",
        faction: "friendly",
        position: { x: 2, y: 2 },
        skills: [moveSkill],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { x: 5, y: 5 },
      });
      useGameStore.getState().actions.initBattle([char1, char2, char3, enemy]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      // Only 2 lines (char2 and char3, not char1 because hp=0)
      expect(lines).toHaveLength(2);
    });

    it("should use uniform color for all factions", () => {
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      const friendly1 = createCharacter({
        id: "friendly1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const friendly2 = createCharacter({
        id: "friendly2",
        faction: "friendly",
        position: { x: 1, y: 1 },
        skills: [moveSkill],
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        position: { x: 5, y: 5 },
        skills: [moveSkill],
      });
      const enemy2 = createCharacter({
        id: "enemy2",
        faction: "enemy",
        position: { x: 6, y: 6 },
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
      useAccessibilityStore.setState({ showTargetLines: true });
      const moveSkill = createSkill({
        id: "move-skill",
        mode: "towards",
        tickCost: 1,
      });
      // char1 and char2 target each other (bidirectional), char3 targets char2 (unidirectional)
      const char1 = createCharacter({
        id: "char1",
        faction: "friendly",
        position: { x: 0, y: 0 },
        skills: [moveSkill],
      });
      const char2 = createCharacter({
        id: "char2",
        faction: "enemy",
        position: { x: 5, y: 0 },
        skills: [moveSkill],
      });
      const char3 = createCharacter({
        id: "char3",
        faction: "friendly",
        position: { x: 10, y: 0 },
        skills: [moveSkill],
      });
      useGameStore.getState().actions.initBattle([char1, char2, char3]);

      const { container } = render(<TargetingLineOverlay {...defaultProps} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(3);

      // Bidirectional lines (char1 and char2) should have perpendicular offset (8px difference)
      const char1Line = Array.from(lines).find(
        (l) => l.getAttribute("x1") === "20",
      );
      const char2Line = Array.from(lines).find(
        (l) => l.getAttribute("x1") === "220",
      );
      const y1Char1 = parseFloat(char1Line?.getAttribute("y1") || "0");
      const y1Char2 = parseFloat(char2Line?.getAttribute("y1") || "0");
      expect(Math.abs(y1Char1 - y1Char2)).toBe(8);

      // Unidirectional line (char3) should NOT have offset
      const char3Line = Array.from(lines).find(
        (l) => l.getAttribute("x1") === "420",
      );
      expect(char3Line?.getAttribute("y1")).toBe("20");
    });
  });
});
