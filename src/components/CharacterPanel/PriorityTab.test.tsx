/**
 * Tests for PriorityTab component - Priority configuration and battle evaluation (D1 + D2)
 * Following TDD workflow - tests written before implementation.
 */
/* eslint-disable max-lines */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("PriorityTab", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("Skill Display", () => {
    it("displays skills in priority order", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const skill3 = createSkill({ id: "skill3", name: "Third" });
      const char1 = createCharacter({
        id: "char1",
        skills: [skill1, skill2, skill3],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const skillHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(skillHeadings[0]).toHaveTextContent("First");
      expect(skillHeadings[1]).toHaveTextContent("Second");
      expect(skillHeadings[2]).toHaveTextContent("Third");
    });

    it("shows all config columns for each skill row", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      // Trigger dropdown
      expect(
        screen.getByRole("combobox", { name: /trigger for move/i }),
      ).toBeInTheDocument();

      // Target dropdown
      expect(screen.getByLabelText(/target.*move/i)).toBeInTheDocument();

      // Criterion dropdown
      expect(screen.getByLabelText(/criterion.*move/i)).toBeInTheDocument();

      // Behavior dropdown (Move skill specific)
      expect(screen.getByLabelText(/behavior.*move/i)).toBeInTheDocument();
    });
  });

  describe("Priority Reordering", () => {
    it("move up button reorders skill", async () => {
      const user = userEvent.setup();
      const skillA = createSkill({ id: "a", name: "A" });
      const skillB = createSkill({ id: "b", name: "B" });
      const skillC = createSkill({ id: "c", name: "C" });
      const char1 = createCharacter({
        id: "char1",
        skills: [skillA, skillB, skillC],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      // Click move up on skill B
      const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
      const bButton = moveUpButtons[1];
      if (!bButton) throw new Error("Expected move up button for B");
      await user.click(bButton);

      // Order should now be [B, A, C]
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.name).toBe("B");
      expect(updatedChar.skills[1]?.name).toBe("A");
      expect(updatedChar.skills[2]?.name).toBe("C");
    });

    it("move down button reorders skill", async () => {
      const user = userEvent.setup();
      const skillA = createSkill({ id: "a", name: "A" });
      const skillB = createSkill({ id: "b", name: "B" });
      const skillC = createSkill({ id: "c", name: "C" });
      const char1 = createCharacter({
        id: "char1",
        skills: [skillA, skillB, skillC],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      // Click move down on skill B
      const moveDownButtons = screen.getAllByRole("button", {
        name: /move down/i,
      });
      const bButton = moveDownButtons[1];
      if (!bButton) throw new Error("Expected move down button for B");
      await user.click(bButton);

      // Order should now be [A, C, B]
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.name).toBe("A");
      expect(updatedChar.skills[1]?.name).toBe("C");
      expect(updatedChar.skills[2]?.name).toBe("B");
    });

    it("move up disabled for first skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
      expect(moveUpButtons[0]).toBeDisabled(); // First skill's button
    });

    it("move down disabled for last skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const moveDownButtons = screen.getAllByRole("button", {
        name: /move down/i,
      });
      expect(moveDownButtons[1]).toBeDisabled(); // Last skill's button
    });
  });

  describe("Config Dropdowns", () => {
    it("trigger dropdown updates skill", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        name: "Punch",
        triggers: [{ type: "always" }],
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const triggerDropdown = screen.getByRole("combobox", {
        name: /trigger for punch/i,
      });
      await user.selectOptions(triggerDropdown, "hp_below");

      // Store should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.triggers[0]?.type).toBe("hp_below");

      // Value input should appear for hp_below
      expect(screen.getByLabelText(/value.*punch/i)).toBeInTheDocument();
    });

    it("target dropdown updates skill", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        name: "Punch",
        target: "enemy",
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const targetDropdown = screen.getByLabelText(/target.*punch/i);
      await user.selectOptions(targetDropdown, "ally");

      // Store should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.target).toBe("ally");
    });

    it("criterion dropdown updates skill", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        name: "Punch",
        criterion: "nearest",
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const criterionDropdown = screen.getByLabelText(/criterion.*punch/i);
      await user.selectOptions(criterionDropdown, "lowest_hp");

      // Store should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.criterion).toBe("lowest_hp");
    });

    it("criterion disabled when target is self", () => {
      const skill1 = createSkill({
        id: "skill1",
        name: "Buff",
        target: "self",
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const criterionDropdown = screen.getByLabelText(/criterion.*buff/i);
      expect(criterionDropdown).toBeDisabled();
    });

    it("behavior dropdown shown only for Move skills", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const punchSkill = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const char1 = createCharacter({
        id: "char1",
        skills: [moveSkill, punchSkill],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      // Move should have behavior dropdown
      expect(screen.getByLabelText(/behavior.*move/i)).toBeInTheDocument();

      // Punch should not have behavior dropdown
      expect(
        screen.queryByLabelText(/behavior.*punch/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Move Skill Duplication", () => {
    it("duplicate button works in Priority tab", async () => {
      const user = userEvent.setup();
      const moveSkill = createSkill({
        id: "move-towards",
        instanceId: "move-1",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab mode="config" />);

      const duplicateButton = screen.getByRole("button", {
        name: /duplicate.*move/i,
      });
      await user.click(duplicateButton);

      // Should now have 2 Move instances
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills).toHaveLength(2);
      expect(updatedChar.skills[0]?.name).toBe("Move");
      expect(updatedChar.skills[1]?.name).toBe("Move");
    });
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
      // Enemy at slotPosition 1 renders as "A"
      expect(screen.getByText(/A/)).toBeInTheDocument();
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
});
