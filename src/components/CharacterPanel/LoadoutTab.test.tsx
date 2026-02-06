/**
 * Tests for LoadoutTab component - Equipped skills + inventory (D1)
 * Following TDD workflow - tests written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { LoadoutTab } from "./LoadoutTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("LoadoutTab", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("Equipped Skills Section", () => {
    it("shows equipped skills section with all skills", () => {
      const skill1 = createSkill({ id: "skill1", name: "Light Punch" });
      const skill2 = createSkill({ id: "skill2", name: "Heavy Punch" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      expect(screen.getByText(/equipped skills/i)).toBeInTheDocument();
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });

    it("displays skills in priority order (top to bottom)", () => {
      const skill1 = createSkill({ id: "light-punch", name: "Light Punch" });
      const skill2 = createSkill({ id: "heavy-punch", name: "Heavy Punch" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      const skillHeadings = screen.getAllByRole("heading", { level: 4 });
      const skillNames = skillHeadings.map((h) => h.textContent);

      const firstIndex = skillNames.findIndex((name) =>
        name?.includes("Light Punch"),
      );
      const secondIndex = skillNames.findIndex((name) =>
        name?.includes("Heavy Punch"),
      );

      expect(firstIndex).toBeLessThan(secondIndex);
    });
  });

  describe("Inventory Section", () => {
    it("shows available skills from inventory", () => {
      const char1 = createCharacter({ id: "char1", skills: [] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      expect(screen.getByText(/inventory/i)).toBeInTheDocument();

      // Should show available skills with Assign buttons
      // Default skills from registry: Light Punch, Heavy Punch, Heal
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heal/i)).toBeInTheDocument();
    });

    it("each inventory skill has Assign button", () => {
      const char1 = createCharacter({ id: "char1", skills: [] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      const assignButtons = screen.getAllByRole("button", { name: /assign/i });
      expect(assignButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Skill Assignment", () => {
    it("assign button adds skill to character", async () => {
      const user = userEvent.setup();
      const moveSkill = createSkill({
        id: "move",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // Light Punch should be in inventory
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /assign light punch/i }),
      );

      // Light Punch should now appear in equipped section
      const equippedSection = screen
        .getByText(/equipped skills/i)
        .closest("div");
      expect(equippedSection).toHaveTextContent(/light punch/i);

      // Light Punch should disappear from inventory
      const inventorySection = screen.getByText(/inventory/i).closest("div");
      expect(inventorySection).not.toHaveTextContent(/assign light punch/i);
    });

    it("unassign removes non-innate skill", async () => {
      const user = userEvent.setup();
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      const unassignButton = screen.getByRole("button", {
        name: /remove.*light punch/i,
      });
      await user.click(unassignButton);

      // Light Punch should be removed from equipped section
      const equippedSection = screen
        .getByText(/equipped skills/i)
        .closest("div");
      expect(equippedSection).not.toHaveTextContent(/light punch/i);

      // Light Punch should reappear in inventory
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Innate Skills", () => {
    it("innate skills cannot be unassigned", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // Innate badge should be displayed
      expect(screen.getByText(/innate/i)).toBeInTheDocument();

      // No unassign button for Move skill
      expect(
        screen.queryByRole("button", { name: /remove.*move/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Move Skill Duplication", () => {
    it("duplicate button creates new move instance", async () => {
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

      render(<LoadoutTab />);

      const duplicateButton = screen.getByRole("button", {
        name: /duplicate.*move/i,
      });
      await user.click(duplicateButton);

      // Should now have 2 Move instances
      const moveHeadings = screen.getAllByText(/move/i);
      expect(moveHeadings.length).toBeGreaterThanOrEqual(2);
    });

    it("duplicate button hidden at max slots", () => {
      // Create 10 move-towards skills to fill all slots
      const moveSkills = Array.from({ length: 10 }, (_, i) =>
        createSkill({
          id: "move-towards",
          instanceId: `move-${i + 1}`,
          name: "Move",
          behavior: "towards",
        }),
      );
      const char1 = createCharacter({
        id: "char1",
        skills: moveSkills,
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // No duplicate button should be visible (all 10 slots full)
      expect(
        screen.queryByRole("button", { name: /duplicate/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Non-Move Skill Duplication", () => {
    it("duplicate button shown for non-Move skills when slots available", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // Duplicate button should be visible for Light Punch (1 skill < MAX_SKILL_SLOTS of 10)
      expect(
        screen.getByRole("button", { name: /duplicate.*light punch/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Faction Exclusivity", () => {
    it("skills assigned to same faction hide from inventory", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const friendly1 = createCharacter({
        id: "friendly1",
        faction: "friendly",
        skills: [lightPunch],
      });
      const friendly2 = createCharacter({
        id: "friendly2",
        faction: "friendly",
        skills: [],
      });
      const enemy1 = createCharacter({
        id: "enemy1",
        faction: "enemy",
        skills: [],
      });

      useGameStore
        .getState()
        .actions.initBattle([friendly1, friendly2, enemy1]);
      useGameStore.getState().actions.selectCharacter("friendly2");

      render(<LoadoutTab />);

      // Light Punch should NOT be available (already assigned to friendly1)
      expect(
        screen.queryByRole("button", { name: /assign light punch/i }),
      ).not.toBeInTheDocument();

      // Select enemy - Light Punch should be available
      cleanup();
      useGameStore.getState().actions.selectCharacter("enemy1");
      render(<LoadoutTab />);

      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Slot Capacity", () => {
    it("assign buttons disabled when slots full", () => {
      const skill1 = createSkill({ id: "light-punch", name: "Light Punch" });
      const skill2 = createSkill({ id: "heavy-punch", name: "Heavy Punch" });
      const skill3 = createSkill({ id: "heal", name: "Heal" });
      const char1 = createCharacter({
        id: "char1",
        skills: [skill1, skill2, skill3],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // All assign buttons should be disabled (slots full)
      const assignButtons = screen.getAllByRole("button", { name: /assign/i });
      for (const button of assignButtons) {
        expect(button).toBeDisabled();
      }
    });
  });

  describe("Remove Duplicate Innate", () => {
    it("shows Remove button for duplicate innate skill", () => {
      const move1 = createSkill({
        id: "move-towards",
        instanceId: "move-1",
        name: "Move",
        behavior: "towards",
      });
      const move2 = createSkill({
        id: "move-towards",
        instanceId: "move-2",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({
        id: "char1",
        skills: [move1, move2],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // At least one Remove button for Move should exist
      const removeButtons = screen.getAllByRole("button", {
        name: /remove.*move/i,
      });
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);

      // Both Move instances should show Innate badges
      const innateBadges = screen.getAllByText(/innate/i);
      expect(innateBadges.length).toBeGreaterThanOrEqual(2);
    });

    it("hides Remove button for single innate skill", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // No Remove button for single innate skill
      expect(
        screen.queryByRole("button", { name: /remove.*move/i }),
      ).not.toBeInTheDocument();

      // Innate badge IS present (skill renders, just without Remove)
      expect(screen.getByText(/innate/i)).toBeInTheDocument();
    });

    it("calls removeSkillFromCharacter when Remove clicked on duplicate innate", async () => {
      const user = userEvent.setup();
      const move1 = createSkill({
        id: "move-towards",
        instanceId: "inst1",
        name: "Move",
        behavior: "towards",
      });
      const move2 = createSkill({
        id: "move-towards",
        instanceId: "inst2",
        name: "Move",
        behavior: "towards",
      });
      const char1 = createCharacter({
        id: "char1",
        skills: [move1, move2],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      // Click one of the Remove buttons
      const removeButtons = screen.getAllByRole("button", {
        name: /remove.*move/i,
      });
      await user.click(removeButtons[0]!);

      // After click, character should have 1 skill
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      expect(updatedChar?.skills).toHaveLength(1);
    });

    it("still shows Unassign (not Remove) for non-innate skills", () => {
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

      render(<LoadoutTab />);

      // The existing Unassign button has aria-label="Remove Light Punch"
      const button = screen.getByRole("button", {
        name: /remove.*light punch/i,
      });
      expect(button).toBeInTheDocument();

      // Button text content should be "Unassign" (not "Remove")
      expect(button).toHaveTextContent("Unassign");
    });
  });

  describe("Enable/Disable Toggle", () => {
    it("enable checkbox toggles skill enabled state", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "light-punch",
        name: "Light Punch",
        enabled: true,
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<LoadoutTab />);

      const checkbox = screen.getByRole("checkbox", { name: /enable.*punch/i });
      expect(checkbox).toBeChecked();

      await user.click(checkbox);

      // Checkbox should be unchecked
      expect(checkbox).not.toBeChecked();

      // Verify store updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      if (!updatedChar) throw new Error("Character not found after update");
      expect(updatedChar.skills[0]?.enabled).toBe(false);
    });
  });
});
