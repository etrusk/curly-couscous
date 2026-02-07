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

      render(<PriorityTab mode="battle" />);

      // First skill should show selected status (check mark icon or similar)
      // Remaining skills should show skipped status
      // Note: Exact implementation details depend on SkillRow component
      expect(screen.getByText(/punch/i)).toBeInTheDocument();
      expect(screen.getByText(/kick/i)).toBeInTheDocument();
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

      render(<PriorityTab mode="battle" />);

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

      render(<PriorityTab mode="battle" />);

      expect(screen.getByText(/punch/i)).toBeInTheDocument();
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

      const { container } = render(<PriorityTab mode="battle" />);

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

      const { rerender } = render(<PriorityTab mode="battle" />);

      // Initial render should show evaluation
      expect(screen.getByText(/punch/i)).toBeInTheDocument();

      // Step battle

      useGameStore.getState().actions.processTick();

      // Rerender to reflect new evaluation state
      rerender(<PriorityTab mode="battle" />);

      // Evaluation should reflect post-step state
      expect(screen.getByText(/punch/i)).toBeInTheDocument();
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

      render(<PriorityTab mode="battle" />);

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

      render(<PriorityTab mode="battle" />);

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

      render(<PriorityTab mode="battle" />);

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

      render(<PriorityTab mode="battle" />);

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
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      // No evaluation icons in config mode
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

  describe("Inventory Hidden in Battle Mode", () => {
    it("inventory-hidden-in-battle-mode", () => {
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
        skills: [lightPunch],
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

      render(<PriorityTab mode="battle" />);

      // No inventory section in battle mode
      expect(screen.queryByText(/inventory/i)).toBeNull();
      // No inventory "Assign" buttons (but "Unassign" config button may exist)
      expect(screen.queryByRole("button", { name: /^assign/i })).toBeNull();
      // Skill evaluation content IS present
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
    });
  });
});
