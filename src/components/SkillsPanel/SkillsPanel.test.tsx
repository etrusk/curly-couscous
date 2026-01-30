/**
 * Tests for SkillsPanel component.
 * Following TDD workflow - these tests are written before implementation.
 */
/* eslint-disable max-lines */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SkillsPanel } from "./SkillsPanel";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("SkillsPanel", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  describe("No Selection State", () => {
    it("should display 'No character selected' message when no character is selected", () => {
      render(<SkillsPanel />);

      expect(
        screen.getByText(/click a character on the grid to configure skills/i),
      ).toBeInTheDocument();
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
    it("should display selected character letter notation", () => {
      const char1 = createCharacter({ id: "char1", name: "Hero" });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/Skills & Priority: A/i)).toBeInTheDocument();
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

  describe("Innate Skill Badge", () => {
    it("shows innate badge for innate skills", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move Towards",
        mode: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.getByText(/innate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/innate skill/i)).toBeInTheDocument();
    });

    it("does not show innate badge for non-innate skills", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
      });
      const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      expect(screen.queryByText(/innate/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/innate skill/i)).not.toBeInTheDocument();
    });

    it("innate badge has accessible label", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move Towards",
        mode: "towards",
      });
      const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const innateBadge = screen.getByLabelText("Innate skill");
      expect(innateBadge).toBeInTheDocument();
      expect(innateBadge).toHaveTextContent("Innate");
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

  describe("Target Selector Dropdowns", () => {
    describe("Helper Functions", () => {
      it("decomposeSelector correctly parses 'nearest_enemy'", async () => {
        const { decomposeSelector } = await import("./SkillsPanel");
        const result = decomposeSelector("nearest_enemy");
        expect(result).toEqual({ category: "enemy", strategy: "nearest" });
      });

      it("decomposeSelector correctly parses 'nearest_ally'", async () => {
        const { decomposeSelector } = await import("./SkillsPanel");
        const result = decomposeSelector("nearest_ally");
        expect(result).toEqual({ category: "ally", strategy: "nearest" });
      });

      it("decomposeSelector correctly parses 'lowest_hp_enemy'", async () => {
        const { decomposeSelector } = await import("./SkillsPanel");
        const result = decomposeSelector("lowest_hp_enemy");
        expect(result).toEqual({ category: "enemy", strategy: "lowest_hp" });
      });

      it("decomposeSelector correctly parses 'lowest_hp_ally'", async () => {
        const { decomposeSelector } = await import("./SkillsPanel");
        const result = decomposeSelector("lowest_hp_ally");
        expect(result).toEqual({ category: "ally", strategy: "lowest_hp" });
      });

      it("decomposeSelector correctly handles 'self' special case", async () => {
        const { decomposeSelector } = await import("./SkillsPanel");
        const result = decomposeSelector("self");
        expect(result).toEqual({ category: "self", strategy: "nearest" });
      });

      it("composeSelector correctly combines enemy+nearest", async () => {
        const { composeSelector } = await import("./SkillsPanel");
        const result = composeSelector("enemy", "nearest");
        expect(result).toBe("nearest_enemy");
      });

      it("composeSelector correctly combines ally+nearest", async () => {
        const { composeSelector } = await import("./SkillsPanel");
        const result = composeSelector("ally", "nearest");
        expect(result).toBe("nearest_ally");
      });

      it("composeSelector correctly combines enemy+lowest_hp", async () => {
        const { composeSelector } = await import("./SkillsPanel");
        const result = composeSelector("enemy", "lowest_hp");
        expect(result).toBe("lowest_hp_enemy");
      });

      it("composeSelector correctly combines ally+lowest_hp", async () => {
        const { composeSelector } = await import("./SkillsPanel");
        const result = composeSelector("ally", "lowest_hp");
        expect(result).toBe("lowest_hp_ally");
      });

      it("composeSelector returns 'self' regardless of strategy", async () => {
        const { composeSelector } = await import("./SkillsPanel");
        const result1 = composeSelector("self", "nearest");
        const result2 = composeSelector("self", "lowest_hp");
        expect(result1).toBe("self");
        expect(result2).toBe("self");
      });

      it("roundtrip decompose then compose returns original type", async () => {
        const { decomposeSelector, composeSelector } =
          await import("./SkillsPanel");
        const selectorTypes: Array<
          | "nearest_enemy"
          | "nearest_ally"
          | "lowest_hp_enemy"
          | "lowest_hp_ally"
          | "self"
        > = [
          "nearest_enemy",
          "nearest_ally",
          "lowest_hp_enemy",
          "lowest_hp_ally",
          "self",
        ];

        selectorTypes.forEach((type) => {
          const { category, strategy } = decomposeSelector(type);
          const roundtrip = composeSelector(category, strategy);
          expect(roundtrip).toBe(type);
        });
      });
    });

    describe("UI Rendering", () => {
      it("renders two dropdowns for target selection", () => {
        const skill1 = createSkill({ id: "skill1" });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        expect(categoryDropdown).toBeInTheDocument();
        expect(strategyDropdown).toBeInTheDocument();
      });

      it("category dropdown shows correct initial value", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_ally" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        expect(categoryDropdown).toHaveValue("ally");
      });

      it("strategy dropdown shows correct initial value", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_enemy" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        expect(strategyDropdown).toHaveValue("lowest_hp");
      });

      it("category dropdown shows all options", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({ id: "skill1" });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        await user.click(categoryDropdown);

        expect(
          screen.getByRole("option", { name: /^enemy$/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: /^ally$/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: /^self$/i }),
        ).toBeInTheDocument();
      });

      it("strategy dropdown shows all options", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({ id: "skill1" });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        await user.click(strategyDropdown);

        expect(
          screen.getByRole("option", { name: /^nearest$/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("option", { name: /^lowest hp$/i }),
        ).toBeInTheDocument();
      });
    });

    describe("Strategy Dropdown Disabled State", () => {
      it("strategy dropdown is disabled when self is selected", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "self" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        expect(strategyDropdown).toBeDisabled();
      });

      it("strategy dropdown is enabled when enemy is selected", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "nearest_enemy" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        expect(strategyDropdown).not.toBeDisabled();
      });

      it("strategy dropdown is enabled when ally is selected", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_ally" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        expect(strategyDropdown).not.toBeDisabled();
      });
    });

    describe("User Interactions", () => {
      it("changing category from enemy to ally updates selector", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "nearest_enemy" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        await user.selectOptions(categoryDropdown, "ally");

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("nearest_ally");
      });

      it("changing category from ally to self updates selector", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_ally" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        await user.selectOptions(categoryDropdown, "self");

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("self");
      });

      it("changing strategy from nearest to lowest_hp updates selector", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "nearest_enemy" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        await user.selectOptions(strategyDropdown, "lowest_hp");

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("lowest_hp_enemy");
      });

      it("changing strategy from lowest_hp to nearest updates selector", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_ally" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });
        await user.selectOptions(strategyDropdown, "nearest");

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("nearest_ally");
      });

      it("changing from self to enemy enables strategy dropdown", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "self" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        await user.selectOptions(categoryDropdown, "enemy");

        expect(strategyDropdown).not.toBeDisabled();

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("nearest_enemy");
      });

      it("changing from self to ally enables strategy dropdown", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "self" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        await user.selectOptions(categoryDropdown, "ally");

        expect(strategyDropdown).not.toBeDisabled();

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("nearest_ally");
      });

      it("changing to self sets correct selector and disables strategy", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_enemy" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        await user.selectOptions(categoryDropdown, "self");

        expect(strategyDropdown).toBeDisabled();

        const updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        const updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("self");
      });

      // eslint-disable-next-line complexity
      it("all category/strategy combinations produce correct types", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({ id: "skill1" });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        // Test enemy + nearest
        await user.selectOptions(categoryDropdown, "enemy");
        await user.selectOptions(strategyDropdown, "nearest");
        let updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        let updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("nearest_enemy");

        // Test enemy + lowest_hp
        await user.selectOptions(strategyDropdown, "lowest_hp");
        updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("lowest_hp_enemy");

        // Test ally + nearest
        await user.selectOptions(categoryDropdown, "ally");
        await user.selectOptions(strategyDropdown, "nearest");
        updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("nearest_ally");

        // Test ally + lowest_hp
        await user.selectOptions(strategyDropdown, "lowest_hp");
        updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("lowest_hp_ally");

        // Test self + nearest (strategy ignored)
        await user.selectOptions(categoryDropdown, "self");
        await user.selectOptions(strategyDropdown, "nearest");
        updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("self");

        // Test self + lowest_hp (strategy ignored)
        await user.selectOptions(strategyDropdown, "lowest_hp");
        updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride?.type).toBe("self");
      });
    });

    describe("Backward Compatibility", () => {
      it("existing nearest_enemy displays correctly", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "nearest_enemy" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        expect(categoryDropdown).toHaveValue("enemy");
        expect(strategyDropdown).toHaveValue("nearest");
        expect(strategyDropdown).not.toBeDisabled();
      });

      it("existing lowest_hp_ally displays correctly", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "lowest_hp_ally" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        expect(categoryDropdown).toHaveValue("ally");
        expect(strategyDropdown).toHaveValue("lowest_hp");
        expect(strategyDropdown).not.toBeDisabled();
      });

      it("existing self displays correctly", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: { type: "self" },
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        expect(categoryDropdown).toHaveValue("self");
        expect(strategyDropdown).toHaveValue("nearest");
        expect(strategyDropdown).toBeDisabled();
      });

      it("default selector displays correctly when undefined", () => {
        const skill1 = createSkill({
          id: "skill1",
          selectorOverride: undefined,
        });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        expect(categoryDropdown).toHaveValue("enemy");
        expect(strategyDropdown).toHaveValue("nearest");
        expect(strategyDropdown).not.toBeDisabled();
      });

      it("store updates work with new handlers", async () => {
        const user = userEvent.setup();
        const skill1 = createSkill({ id: "skill1" });
        const char1 = createCharacter({ id: "char1", skills: [skill1] });
        useGameStore.getState().actions.initBattle([char1]);
        useGameStore.getState().actions.selectCharacter("char1");

        render(<SkillsPanel />);

        const categoryDropdown = screen.getByRole("combobox", {
          name: /target category/i,
        });
        const strategyDropdown = screen.getByRole("combobox", {
          name: /selection strategy/i,
        });

        // Change category to ally
        await user.selectOptions(categoryDropdown, "ally");
        let updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        let updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride).toEqual({
          type: "nearest_ally",
        });

        // Change strategy to lowest_hp
        await user.selectOptions(strategyDropdown, "lowest_hp");
        updatedChar = useGameStore
          .getState()
          .gameState.characters.find((c) => c.id === "char1");
        updatedSkill = updatedChar?.skills.find((s) => s.id === "skill1");
        expect(updatedSkill?.selectorOverride).toEqual({
          type: "lowest_hp_ally",
        });
      });
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

    it("should show only towards and away mode options in dropdown", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "move", name: "Move", mode: "towards" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const modeSelect = screen.getByRole("combobox", { name: /mode/i });
      await user.click(modeSelect);

      // Only towards and away mode options should be available
      expect(
        screen.getByRole("option", { name: /towards/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /away/i })).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: /hold/i }),
      ).not.toBeInTheDocument();
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

    it("should render mode dropdown on same row as target and selection dropdowns", () => {
      const skill1 = createSkill({ id: "move", name: "Move", mode: "towards" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const targetDropdown = screen.getByRole("combobox", {
        name: /target category/i,
      });
      const selectionDropdown = screen.getByRole("combobox", {
        name: /selection strategy/i,
      });
      const modeDropdown = screen.getByRole("combobox", { name: /mode/i });

      // All three dropdowns should share the same parent container
      // Dropdowns are inside labels, labels are in the same div
      const targetLabel = targetDropdown.parentElement;
      const selectionLabel = selectionDropdown.parentElement;
      const modeLabel = modeDropdown.parentElement;

      const targetRow = targetLabel?.parentElement;
      const selectionRow = selectionLabel?.parentElement;
      const modeRow = modeLabel?.parentElement;

      expect(targetRow).toBe(selectionRow);
      expect(selectionRow).toBe(modeRow);
      expect(targetRow).not.toBeNull();
    });

    it("should exclude self option from target dropdown for move skills", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "move", name: "Move", mode: "towards" });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const categoryDropdown = screen.getByRole("combobox", {
        name: /target category/i,
      });
      await user.click(categoryDropdown);

      // Enemy and Ally should be available, but not Self
      expect(
        screen.getByRole("option", { name: /^enemy$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /^ally$/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: /^self$/i }),
      ).not.toBeInTheDocument();
    });

    it("should include self option in target dropdown for non-move skills", async () => {
      const user = userEvent.setup();
      const skill1 = createSkill({ id: "skill1", name: "Heal", damage: 10 });
      const char1 = createCharacter({ id: "char1", skills: [skill1] });
      useGameStore.getState().actions.initBattle([char1]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const categoryDropdown = screen.getByRole("combobox", {
        name: /target category/i,
      });
      await user.click(categoryDropdown);

      // All three options should be available for non-Move skills
      expect(
        screen.getByRole("option", { name: /^enemy$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /^ally$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: /^self$/i }),
      ).toBeInTheDocument();
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

  describe("Unassign Button", () => {
    it("shows unassign button for non-innate skills", () => {
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
      });
      const character = createCharacter({ id: "char1", skills: [lightPunch] });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      const unassignButton = screen.getByRole("button", {
        name: /unassign light punch/i,
      });
      expect(unassignButton).toBeInTheDocument();
      expect(unassignButton).toHaveTextContent("Unassign");
    });

    it("does not show unassign button for innate skills", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move Towards",
        mode: "towards",
      });
      const character = createCharacter({ id: "char1", skills: [moveSkill] });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      // No Unassign button for any skill
      expect(screen.queryByRole("button", { name: /unassign/i })).toBeNull();
      // The skill itself is still rendered
      expect(screen.getByText(/move towards/i)).toBeInTheDocument();
      // Innate badge is present
      expect(screen.getByLabelText(/innate skill/i)).toBeInTheDocument();
    });

    it("clicking unassign removes skill from character", async () => {
      const user = userEvent.setup();
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move Towards",
        mode: "towards",
      });
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
      });
      const character = createCharacter({
        id: "char1",
        skills: [moveSkill, lightPunch],
      });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      // Click the Unassign button for Light Punch
      await user.click(
        screen.getByRole("button", { name: /unassign light punch/i }),
      );

      // After click: Light Punch removed from SkillsPanel
      expect(screen.queryByText(/light punch/i)).toBeNull();
      // Move remains
      expect(screen.getByText(/move towards/i)).toBeInTheDocument();
      // Character has only 1 skill (Move)
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      expect(updatedChar?.skills.length).toBe(1);
    });

    it("unassign button not shown when both innate and non-innate skills present", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move Towards",
        mode: "towards",
      });
      const lightPunch = createSkill({
        id: "light-punch",
        name: "Light Punch",
        damage: 10,
      });
      const character = createCharacter({
        id: "char1",
        skills: [moveSkill, lightPunch],
      });
      useGameStore.getState().actions.initBattle([character]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<SkillsPanel />);

      // Unassign button appears for Light Punch
      expect(
        screen.getByRole("button", { name: /unassign light punch/i }),
      ).toBeInTheDocument();
      // No Unassign button for Move
      expect(
        screen.queryByRole("button", { name: /unassign move/i }),
      ).toBeNull();
      // Exactly 1 button with "Unassign" text
      const unassignButtons = screen.getAllByRole("button", {
        name: /unassign/i,
      });
      expect(unassignButtons).toHaveLength(1);
    });
  });
});
