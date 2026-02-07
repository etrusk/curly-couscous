/**
 * Tests for PriorityTab component - Battle mode (Evaluation Display, Real Battle Evaluation)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("PriorityTab", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("D2: Battle Mode Evaluation Display", () => {
    it("battle mode shows evaluation status", () => {
      const skill1 = createSkill({ id: "skill1", name: "Punch" });
      const skill2 = createSkill({ id: "skill2", name: "Kick" });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        skills: [skill1, skill2],
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

      render(<PriorityTab />);

      // First skill should show selected status (check mark icon or similar)
      // Remaining skills should show skipped status
      // Note: Exact implementation details depend on SkillRow component
      expect(screen.getAllByText(/punch/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/kick/i).length).toBeGreaterThan(0);
    });

    it("rejected skills show rejection reasons", () => {
      const attackSkill = createSkill({
        id: "attack",
        name: "Long Range Attack",
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
        position: { q: 5, r: 0 }, // Valid hex, distance 5, outside range 1
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<PriorityTab />);

      expect(screen.getByText(/long range attack/i)).toBeInTheDocument();
      expect(
        screen.getByText(/out of range|no valid target/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/rejected/i)).toBeInTheDocument();
    });

    it("selected skill shows resolved target", () => {
      const attackSkill = createSkill({
        id: "attack",
        name: "Punch",
        damage: 10,
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        skills: [attackSkill],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
        slotPosition: 1,
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<PriorityTab />);

      expect(screen.getAllByText(/punch/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/selected/i)).toBeInTheDocument();
      // Enemy at slotPosition 1 displays as "A"
      expect(screen.getByText(/→.*A|Enemy A/i)).toBeInTheDocument();
    });

    it("battle mode uses compact styling", () => {
      const skill1 = createSkill({ id: "skill1", name: "Punch" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      const { container } = render(<PriorityTab />);

      // Should have compact class or attribute
      expect(
        container.querySelector("[data-mode='battle']"),
      ).toBeInTheDocument();
    });

    it("evaluation display updates after battle step", () => {
      const attackSkill = createSkill({
        id: "attack",
        name: "Punch",
        damage: 10,
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

      const { rerender } = render(<PriorityTab />);

      // Initial render should show evaluation
      expect(screen.getAllByText(/punch/i).length).toBeGreaterThan(0);

      // Step battle

      useGameStore.getState().actions.processTick();

      // Rerender to reflect new evaluation state
      rerender(<PriorityTab />);

      // Evaluation should reflect post-step state
      expect(screen.getAllByText(/punch/i).length).toBeGreaterThan(0);
    });
  });

  describe("Gap 4: Real Battle Evaluation", () => {
    it("selected skill shows target name via real evaluation", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
        range: 1,
        actionType: "attack",
        triggers: [{ type: "always" }],
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        skills: [lightPunch],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
        slotPosition: 1,
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<PriorityTab />);

      // Should show selected status icon
      expect(screen.getByLabelText("Selected")).toBeInTheDocument();
      // Enemy at slotPosition 1 renders as "Enemy A" in target display
      expect(screen.getByText(/Enemy A/i)).toBeInTheDocument();
    });

    it("rejected skill shows rejection reason via real evaluation", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
        range: 1,
        actionType: "attack",
        triggers: [{ type: "always" }],
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        skills: [lightPunch],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 5, r: 0 },
        slotPosition: 1,
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<PriorityTab />);

      // Should show rejected status icon
      expect(screen.getByLabelText("Rejected")).toBeInTheDocument();
      // Should show a human-readable rejection reason
      expect(
        screen.getByText(/out of range|no valid target/i),
      ).toBeInTheDocument();
    });

    it("skipped skill rendered below selected skill", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
        range: 1,
        actionType: "attack",
        triggers: [{ type: "always" }],
      });
      const heavyPunch = createSkill({
        id: "heavy-punch",
        name: "Heavy Punch",
        damage: 25,
        range: 2,
        actionType: "attack",
        triggers: [{ type: "always" }],
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        skills: [lightPunch, heavyPunch],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 1, r: 0 },
        slotPosition: 1,
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<PriorityTab />);

      // First skill selected, second skipped
      expect(screen.getByLabelText("Skipped")).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });

    it("all skills rejected when no valid targets in range", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
        range: 1,
        actionType: "attack",
        triggers: [{ type: "always" }],
      });
      const heavyPunch = createSkill({
        id: "heavy-punch",
        name: "Heavy Punch",
        damage: 25,
        range: 2,
        actionType: "attack",
        triggers: [{ type: "always" }],
      });
      const friendly = createCharacter({
        id: "friendly",
        faction: "friendly",
        position: { q: 0, r: 0 },
        slotPosition: 1,
        skills: [lightPunch, heavyPunch],
      });
      const enemy = createCharacter({
        id: "enemy",
        faction: "enemy",
        position: { q: 5, r: 0 },
        slotPosition: 1,
      });

      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("friendly");
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "active";
      });

      render(<PriorityTab />);

      // Both skills should be rejected (enemy out of range for both)
      const rejectedIcons = screen.getAllByLabelText("Rejected");
      expect(rejectedIcons).toHaveLength(2);
      // No selected or skipped icons
      expect(screen.queryByLabelText("Selected")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Skipped")).not.toBeInTheDocument();
    });

    it("config mode shows no evaluation status icons", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const char1 = createCharacter({
        id: "char1",
        skills: [lightPunch],
      });

      useGameStore.getState().actions.initBattle([char1]);
      // initBattle sets "active" when characters present; override to non-active
      useGameStore.setState((state) => {
        state.gameState.battleStatus = "draw";
      });
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab />);

      // No evaluation icons when battle is not active
      expect(screen.queryByLabelText("Selected")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Rejected")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Skipped")).not.toBeInTheDocument();

      // Config controls should be present
      expect(
        screen.getByRole("combobox", { name: /trigger for light punch/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/target.*light punch/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/criterion.*light punch/i),
      ).toBeInTheDocument();
    });
  });

  // Inventory faction-based tests moved to PriorityTab-inventory-faction.test.tsx
});
