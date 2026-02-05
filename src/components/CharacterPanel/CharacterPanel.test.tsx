/**
 * Tests for CharacterPanel component - Two-panel tabbed layout (D1)
 * Following TDD workflow - tests written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CharacterPanel } from "./CharacterPanel";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("CharacterPanel", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("Tab Structure", () => {
    it("renders tabs for Loadout and Priority", () => {
      const char1 = createCharacter({ id: "char1", name: "Hero" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      const loadoutTab = screen.getByRole("tab", { name: /loadout/i });
      const priorityTab = screen.getByRole("tab", { name: /priority/i });

      expect(loadoutTab).toBeInTheDocument();
      expect(priorityTab).toBeInTheDocument();

      // Exactly 2 tabs
      const allTabs = screen.getAllByRole("tab");
      expect(allTabs).toHaveLength(2);
    });

    it("default tab is Loadout in config phase", () => {
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      // Ensure battleStatus is not "active" (config phase)
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });

      render(<CharacterPanel />);

      const loadoutTab = screen.getByRole("tab", { name: /loadout/i });
      const priorityTab = screen.getByRole("tab", { name: /priority/i });

      expect(loadoutTab).toHaveAttribute("aria-selected", "true");
      expect(priorityTab).toHaveAttribute("aria-selected", "false");

      // Loadout content visible
      expect(screen.getByText(/equipped skills/i)).toBeInTheDocument();
    });

    it("switches tabs when clicked", async () => {
      const user = userEvent.setup();
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      const priorityTab = screen.getByRole("tab", { name: /priority/i });
      await user.click(priorityTab);

      expect(priorityTab).toHaveAttribute("aria-selected", "true");

      // Priority content becomes visible
      const priorityPanel = screen.getByRole("tabpanel", { name: /priority/i });
      expect(priorityPanel).toBeInTheDocument();
    });
  });

  describe("No Selection State", () => {
    it("shows placeholder when no character selected", () => {
      render(<CharacterPanel />);

      expect(
        screen.getByText(/click a character on the grid to configure/i),
      ).toBeInTheDocument();

      // No tab content visible
      expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
    });
  });

  describe("Character Header", () => {
    it("shows character letter in header", () => {
      const char1 = createCharacter({ id: "char1", slotPosition: 1 });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      // Character A (slotPosition 1 = index 0)
      expect(screen.getByText(/character.*a/i)).toBeInTheDocument();
    });
  });

  describe("Phase-Based Tab Selection", () => {
    it("auto-selects Priority tab when battle starts", () => {
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      // Start in config phase with Loadout tab
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });

      const { rerender } = render(<CharacterPanel />);

      // Loadout tab should be selected initially
      expect(screen.getByRole("tab", { name: /loadout/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      // Change to battle phase
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      rerender(<CharacterPanel />);

      // Priority tab should now be selected
      expect(screen.getByRole("tab", { name: /priority/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("preserves tab selection when returning to config phase", async () => {
      const user = userEvent.setup();
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });

      const { rerender } = render(<CharacterPanel />);

      // Click Priority tab
      const priorityTab = screen.getByRole("tab", { name: /priority/i });
      await user.click(priorityTab);

      expect(priorityTab).toHaveAttribute("aria-selected", "true");

      // Enter battle phase
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });
      rerender(<CharacterPanel />);

      // Priority should still be selected
      expect(priorityTab).toHaveAttribute("aria-selected", "true");

      // Return to config phase
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });
      rerender(<CharacterPanel />);

      // Priority should still be selected (preserves last selection)
      expect(priorityTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA roles for tablist", () => {
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(2);

      // Each tab should have aria-controls linking to panel
      for (const tab of tabs) {
        const controls = tab.getAttribute("aria-controls");
        expect(controls).toBeTruthy();
      }
    });

    it("tabpanels have correct ARIA attributes", () => {
      const char1 = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<CharacterPanel />);

      // Active tabpanel should exist
      const activePanel = screen.getByRole("tabpanel");
      expect(activePanel).toBeInTheDocument();

      // Should have aria-labelledby linking to tab
      const labelledBy = activePanel.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
    });
  });

  describe("D2: Full flow battle evaluation integration", () => {
    it("battle start auto-switches to Priority tab with evaluation display", () => {
      const attackSkill = createSkill({
        id: "attack",
        name: "Punch",
        damage: 10,
        range: 1,
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

      // Start in config
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });

      const { rerender } = render(<CharacterPanel />);

      // Start battle
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });
      rerender(<CharacterPanel />);

      // Priority tab should be selected
      expect(screen.getByRole("tab", { name: /priority/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      // Should show skill with evaluation (selected status and target)
      // Note: This test checks integration - actual evaluation display tested in PriorityTab
      expect(screen.getByText(/punch/i)).toBeInTheDocument();
    });
  });
});
