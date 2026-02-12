/**
 * Tests for PriorityTab component - Config mode (Skill Display, Priority Reordering,
 * Config Dropdowns, Move Skill Duplication)
 */

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

      render(<PriorityTab />);

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

      render(<PriorityTab />);

      // Trigger ghost button (Move defaults to always = unconditional)
      expect(
        screen.getByRole("button", { name: /add condition for move/i }),
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

      render(<PriorityTab />);

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

      render(<PriorityTab />);

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

      render(<PriorityTab />);

      const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
      expect(moveUpButtons[0]).toBeDisabled(); // First skill's button
    });

    it("move down disabled for last skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab />);

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
        trigger: { scope: "enemy", condition: "always" },
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab />);

      // Two-state model: click "+ Condition" ghost button to activate trigger
      await user.click(
        screen.getByRole("button", { name: /add condition for punch/i }),
      );

      // Now select hp_below from the condition dropdown
      const triggerDropdown = screen.getByRole("combobox", {
        name: /trigger for punch/i,
      });
      await user.selectOptions(triggerDropdown, "hp_below");

      // Store should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.trigger?.condition).toBe("hp_below");

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

      render(<PriorityTab />);

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

      render(<PriorityTab />);

      const criterionDropdown = screen.getByLabelText(/criterion.*punch/i);
      await user.selectOptions(criterionDropdown, "lowest_hp");

      // Store should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.criterion).toBe("lowest_hp");
    });

    it("criterion hidden when target is self", () => {
      const skill1 = createSkill({
        id: "skill1",
        name: "Buff",
        target: "self",
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<PriorityTab />);

      // Criterion is hidden (not rendered) when target is self
      expect(
        screen.queryByLabelText(/criterion.*buff/i),
      ).not.toBeInTheDocument();
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

      render(<PriorityTab />);

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

      render(<PriorityTab />);

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
});
