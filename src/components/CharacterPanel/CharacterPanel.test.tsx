/**
 * Tests for CharacterPanel component - Unified single-panel layout (no tabs)
 * Following TDD workflow - tests written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterPanel } from "./CharacterPanel";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("CharacterPanel", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("No Tab Bar", () => {
    it("no-tablist-rendered", () => {
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      expect(screen.queryByRole("tablist")).toBeNull();
      expect(screen.queryByRole("tab")).toBeNull();
      expect(screen.queryByRole("tabpanel")).toBeNull();
    });
  });

  describe("No Selection State", () => {
    it("placeholder-when-no-selection", () => {
      render(<CharacterPanel />);

      expect(
        screen.getByText(/click a character on the grid to configure/i),
      ).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).toBeNull();
      expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    });
  });

  describe("Character Header", () => {
    it("character-header-shows-letter", () => {
      const char1 = createCharacter({ id: "char1", slotPosition: 1 });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      // slotPosition 1 = letter A (0-indexed)
      expect(screen.getByText(/character.*a/i)).toBeInTheDocument();
    });
  });

  describe("Config Mode", () => {
    it("renders-config-mode-by-default", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      // Set to config phase
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });

      render(<CharacterPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /trigger for light punch/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/selected|rejected|skipped/i)).toBeNull();
    });
  });

  describe("Battle Mode", () => {
    it("renders-battle-mode-when-active", () => {
      const attackSkill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
        range: 1,
        actionType: "attack",
        trigger: { scope: "enemy", condition: "always" },
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [attackSkill],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<CharacterPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/selected|rejected/i)).toBeInTheDocument();
      // Config controls remain visible alongside evaluation indicators
      expect(
        screen.getByRole("combobox", { name: /^Trigger for/i }),
      ).toBeInTheDocument();
    });
  });

  describe("No Tab Navigation", () => {
    it("no-tab-switch-during-battle-mode-transition", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });

      const { rerender } = render(<CharacterPanel />);

      // Initial render: no tab elements
      expect(screen.queryByRole("tablist")).toBeNull();

      // Switch to battle mode
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });
      rerender(<CharacterPanel />);

      // Still no tab elements
      expect(screen.queryByRole("tablist")).toBeNull();

      // Skill content still renders (no crash, no blank panel)
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
    });
  });
});
