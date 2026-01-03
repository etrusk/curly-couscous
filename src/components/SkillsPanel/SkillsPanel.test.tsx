/**
 * Tests for SkillsPanel component.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SkillsPanel } from "./SkillsPanel";
import { useGameStore } from "../../stores/gameStore";
import type { Character, Skill } from "../../engine/types";

// ============================================================================
// Test Helpers
// ============================================================================

const createCharacter = (
  overrides: Partial<Character> & { id: string },
): Character => ({
  id: overrides.id,
  name: overrides.name ?? `Character ${overrides.id}`,
  faction: overrides.faction ?? "friendly",
  slotPosition: overrides.slotPosition ?? 0,
  hp: overrides.hp ?? 100,
  maxHp: overrides.maxHp ?? 100,
  position: overrides.position ?? { x: 0, y: 0 },
  skills: overrides.skills ?? [],
  currentAction: overrides.currentAction ?? null,
});

const createSkill = (overrides: Partial<Skill> & { id: string }): Skill => ({
  id: overrides.id,
  name: overrides.name ?? `Skill-${overrides.id}`,
  tickCost: overrides.tickCost ?? 1,
  range: overrides.range ?? 1,
  damage: overrides.damage,
  mode: overrides.mode,
  enabled: overrides.enabled ?? true,
  triggers: overrides.triggers ?? [{ type: "always" }],
  selectorOverride: overrides.selectorOverride,
});

// ============================================================================
// SkillsPanel Tests
// ============================================================================

describe("SkillsPanel", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("No Selection State", () => {
    it("should display 'No character selected' message when no character is selected", () => {
      render(<SkillsPanel />);

      expect(screen.getByText(/no character selected/i)).toBeInTheDocument();
    });

    it("should not display any skill controls when no character is selected", () => {
      render(<SkillsPanel />);

      expect(
        screen.queryByRole("button", { name: /up/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /down/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("Character Display", () => {
    it("should display selected character name", () => {
      const char1 = createCharacter({ id: "char1", name: "Hero" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/hero/i)).toBeInTheDocument();
    });

    it("should display all skills for selected character", () => {
      const skill1 = createSkill({ id: "skill1", name: "Light Punch" });
      const skill2 = createSkill({ id: "skill2", name: "Heavy Punch" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    });

    it("should display skills in priority order (top to bottom)", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const skill3 = createSkill({ id: "skill3", name: "Third" });
      const char1 = createCharacter({
        id: "char1",
        skills: [skill1, skill2, skill3],
      });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const skillNames = screen.getAllByRole("heading", { level: 3 });
      expect(skillNames[0]).toHaveTextContent("First");
      expect(skillNames[1]).toHaveTextContent("Second");
      expect(skillNames[2]).toHaveTextContent("Third");
    });
  });

  describe("Enable/Disable Toggle", () => {
    it("should show enabled checkbox checked when skill is enabled", () => {
      const skill1 = createSkill({
        id: "skill1",
        name: "Punch",
        enabled: true,
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const checkbox = screen.getByRole("checkbox", { name: /enable punch/i });
      expect(checkbox).toBeChecked();
    });

    it("should show enabled checkbox unchecked when skill is disabled", () => {
      const skill1 = createSkill({
        id: "skill1",
        name: "Punch",
        enabled: false,
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const checkbox = screen.getByRole("checkbox", { name: /enable punch/i });
      expect(checkbox).not.toBeChecked();
    });

    it("should call updateSkill when enabled checkbox is toggled", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        name: "Punch",
        enabled: true,
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const checkbox = screen.getByRole("checkbox", { name: /enable punch/i });
      await user.click(checkbox);

      // After implementation, skill should be disabled
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
      expect(updatedSkill?.enabled).toBe(false);
    });
  });

  describe("Trigger Dropdown", () => {
    it("should display current trigger type", () => {
      const skill1 = createSkill({
        id: "skill1",
        triggers: [{ type: "enemy_in_range", value: 3 }],
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/enemy in range/i)).toBeInTheDocument();
    });

    it("should display trigger value when applicable", () => {
      const skill1 = createSkill({
        id: "skill1",
        triggers: [{ type: "hp_below", value: 50 }],
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    });

    it("should show all trigger options in dropdown", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        triggers: [{ type: "always" }],
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const triggerSelect = screen.getByRole("combobox", { name: /trigger/i });
      await user.click(triggerSelect);

      // All trigger types should be available
      expect(
        screen.getByRole("option", { name: /always/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /enemy in range/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /ally in range/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /hp below/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /my cell targeted/i }),
      ).toBeInTheDocument();
    });

    it("should call updateSkill when trigger type is changed", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        triggers: [{ type: "always" }],
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const triggerSelect = screen.getByRole("combobox", { name: /trigger/i });
      await user.selectOptions(triggerSelect, "enemy_in_range");

      // After implementation, trigger should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
      expect(updatedSkill?.triggers[0]?.type).toBe("enemy_in_range");
    });

    it("should update trigger value when value input is changed", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        triggers: [{ type: "enemy_in_range", value: 3 }],
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const valueInput = screen.getByRole("spinbutton", { name: /range/i });
      await user.clear(valueInput);
      await user.type(valueInput, "5");

      // After implementation, value should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
      expect(updatedSkill?.triggers[0]?.value).toBe(5);
    });
  });

  describe("Selector Dropdown", () => {
    it("should display current selector type", () => {
      const skill1 = createSkill({
        id: "skill1",
        selectorOverride: { type: "lowest_hp_enemy" },
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/lowest hp enemy/i)).toBeInTheDocument();
    });

    it("should show all selector options in dropdown", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "skill1" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const selectorSelect = screen.getByRole("combobox", {
        name: /selector/i,
      });
      await user.click(selectorSelect);

      // All selector types should be available
      expect(
        screen.getByRole("option", { name: /nearest enemy/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /nearest ally/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /lowest hp enemy/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /lowest hp ally/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /self/i })).toBeInTheDocument();
    });

    it("should call updateSkill when selector is changed", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({
        id: "skill1",
        selectorOverride: { type: "nearest_enemy" },
      });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const selectorSelect = screen.getByRole("combobox", {
        name: /selector/i,
      });
      await user.selectOptions(selectorSelect, "lowest_hp_enemy");

      // After implementation, selector should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
      expect(updatedSkill?.selectorOverride?.type).toBe("lowest_hp_enemy");
    });

    it("should display default selector when selectorOverride is undefined", () => {
      const skill1 = createSkill({ id: "skill1", selectorOverride: undefined });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      // Should show default (nearest_enemy) or indicate default somehow
      const selectorSelect = screen.getByRole("combobox", {
        name: /selector/i,
      });
      expect(selectorSelect).toBeInTheDocument();
    });
  });

  describe("Mode Dropdown (for Move skill)", () => {
    it("should display current mode for Move skill", () => {
      const skill1 = createSkill({ id: "move", name: "Move", mode: "towards" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/towards/i)).toBeInTheDocument();
    });

    it("should show all mode options in dropdown", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "move", name: "Move", mode: "towards" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const modeSelect = screen.getByRole("combobox", { name: /mode/i });
      await user.click(modeSelect);

      // All mode options should be available
      expect(
        screen.getByRole("option", { name: /towards/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /away/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /hold/i })).toBeInTheDocument();
    });

    it("should call updateSkill when mode is changed", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "move", name: "Move", mode: "towards" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const modeSelect = screen.getByRole("combobox", { name: /mode/i });
      await user.selectOptions(modeSelect, "away");

      // After implementation, mode should be updated
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      const updatedSkill = updatedChar?.skills.find((s) => s.id === "move");
      expect(updatedSkill?.mode).toBe("away");
    });

    it("should not display mode dropdown for non-Move skills", () => {
      const skill1 = createSkill({ id: "punch", name: "Punch", damage: 10 });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(
        screen.queryByRole("combobox", { name: /mode/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Priority Controls", () => {
    it("should display up arrow button for each skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const upButtons = screen.getAllByRole("button", { name: /move up/i });
      expect(upButtons).toHaveLength(2);
    });

    it("should display down arrow button for each skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const downButtons = screen.getAllByRole("button", { name: /move down/i });
      expect(downButtons).toHaveLength(2);
    });

    it("should disable up button for first skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const upButtons = screen.getAllByRole("button", { name: /move up/i });
      expect(upButtons[0]).toBeDisabled();
      expect(upButtons[1]).not.toBeDisabled();
    });

    it("should disable down button for last skill", () => {
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const downButtons = screen.getAllByRole("button", { name: /move down/i });
      expect(downButtons[0]).not.toBeDisabled();
      expect(downButtons[1]).toBeDisabled();
    });

    it("should call moveSkillUp when up button is clicked", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "skill1", name: "First" });
      const skill2 = createSkill({ id: "skill2", name: "Second" });
      const char1 = createCharacter({ id: "char1", skills: [skill1, skill2] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const upButtons = screen.getAllByRole("button", { name: /move up/i });
      await user.click(upButtons[1]!); // Click up on second skill (non-null assertion safe in test context)

      // After implementation, skill order should be reversed
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      expect(updatedChar?.skills[0]?.id).toBe("skill2");
      expect(updatedChar?.skills[1]?.id).toBe("skill1");
    });
  });
});
