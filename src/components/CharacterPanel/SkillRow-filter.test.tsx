/**
 * Tests for SkillRow component - Filter UI controls and display.
 * Updated for Phase 2: uses `filter` field (not `selectorFilter`)
 * and new SkillFilter type `{ condition, conditionValue }`.
 * Split from SkillRow.test.tsx to stay under 400-line limit.
 *
 * Tests A1-A6: Filter condition dropdown expansion.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillRow } from "./SkillRow";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";

function renderSkillRow(
  skill: ReturnType<typeof createSkill>,
  character: ReturnType<typeof createCharacter>,
) {
  return render(
    <SkillRow
      skill={skill}
      character={character}
      index={0}
      isFirst={false}
      isLast={false}
    />,
  );
}

function getSkillFilter(charId: string, instanceId: string) {
  const char = useGameStore
    .getState()
    .gameState.characters.find((c) => c.id === charId);
  return char?.skills.find((s) => s.instanceId === instanceId)?.filter;
}

describe("SkillRow - Filter", () => {
  describe("Config Mode - Filter Controls", () => {
    it("shows 'Add filter' button when skill has no filter", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      expect(
        screen.getByRole("button", { name: /add filter/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/filter type/i)).not.toBeInTheDocument();
    });

    it("shows filter controls when filter is set", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        filter: { condition: "hp_below", conditionValue: 50 },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      // Filter type dropdown present
      expect(screen.getByLabelText(/filter type for/i)).toBeInTheDocument();
      // Filter value input present
      expect(screen.getByLabelText(/filter value for/i)).toBeInTheDocument();
      // Remove filter button present
      expect(screen.getByLabelText(/remove filter for/i)).toBeInTheDocument();
      // "Add filter" button should NOT be present
      expect(
        screen.queryByRole("button", { name: /add filter/i }),
      ).not.toBeInTheDocument();
    });

    // A1: Filter type dropdown includes all 7 filterable conditions
    it("filter type dropdown has all 7 condition options", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        filter: { condition: "hp_below", conditionValue: 50 },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      const scope = within(filterDropdown);
      expect(scope.getByRole("option", { name: "HP below" })).toHaveValue(
        "hp_below",
      );
      expect(scope.getByRole("option", { name: "HP above" })).toHaveValue(
        "hp_above",
      );
      expect(scope.getByRole("option", { name: "In range" })).toHaveValue(
        "in_range",
      );
      expect(scope.getByRole("option", { name: "Channeling" })).toHaveValue(
        "channeling",
      );
      expect(scope.getByRole("option", { name: "Idle" })).toHaveValue("idle");
      expect(scope.getByRole("option", { name: "Cell targeted" })).toHaveValue(
        "targeting_me",
      );
      expect(scope.getByRole("option", { name: "Targeting ally" })).toHaveValue(
        "targeting_ally",
      );
      // Exactly 7 options (no "always" for filters)
      expect(scope.getAllByRole("option")).toHaveLength(7);
    });

    // A2: Non-value condition hides numeric input
    it("non-value condition hides numeric input", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        filter: { condition: "channeling" },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      expect(screen.getByLabelText(/filter type for/i)).toBeInTheDocument();
      expect(
        screen.queryByLabelText(/filter value for/i),
      ).not.toBeInTheDocument();
    });

    // A3: Value condition shows numeric input
    it("value condition shows numeric input with correct value", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        filter: { condition: "in_range", conditionValue: 3 },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      const input = screen.getByLabelText(/filter value for/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(3);
    });

    it("filter value input displays current threshold value", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        filter: { condition: "hp_below", conditionValue: 75 },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      const input = screen.getByLabelText(/filter value for/i);
      expect(input).toHaveValue(75);
    });

    it("no filter controls rendered when skill has no filter", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      renderSkillRow(skill, character);

      expect(
        screen.queryByLabelText(/filter type for/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/filter value for/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/remove filter for/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Config Mode - Filter Condition Switching", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    // A4: Switching from value to non-value condition clears conditionValue
    it("switching from value to non-value condition clears conditionValue", async () => {
      const user = userEvent.setup();
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        filter: { condition: "hp_below", conditionValue: 50 },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      await user.selectOptions(filterDropdown, "idle");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.condition).toBe("idle");
      expect(filter?.conditionValue).toBeUndefined();
    });

    // A5: Switching to in_range defaults conditionValue to 3
    it("switching to in_range defaults conditionValue to 3", async () => {
      const user = userEvent.setup();
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        filter: { condition: "channeling" },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      await user.selectOptions(filterDropdown, "in_range");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.condition).toBe("in_range");
      expect(filter?.conditionValue).toBe(3);
    });

    // A6: Switching to hp_below defaults conditionValue to 50
    it("switching to hp_below defaults conditionValue to 50", async () => {
      const user = userEvent.setup();
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        filter: { condition: "idle" },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      await user.selectOptions(filterDropdown, "hp_below");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.condition).toBe("hp_below");
      expect(filter?.conditionValue).toBe(50);
    });
  });

  describe("Filter value change preserves state", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("changing filter value preserves negated flag", async () => {
      const user = userEvent.setup();
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        filter: { condition: "hp_below", conditionValue: 50, negated: true },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      const valueInput = screen.getByLabelText(/filter value for/i);
      await user.clear(valueInput);
      await user.type(valueInput, "30");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.negated).toBe(true);
      expect(filter?.condition).toBe("hp_below");
      expect(filter?.conditionValue).toBe(30);
    });
  });

  describe("Battle Mode - Filter Rejection Display", () => {
    it("shows generic rejection message for filter_failed", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          index={0}
          isFirst={false}
          isLast={false}
          evaluation={{
            status: "rejected",
            rejectionReason: "filter_failed",
          }}
        />,
      );

      // X mark visible for rejected status
      expect(screen.getByLabelText(/rejected/i)).toBeInTheDocument();
      // Rejection reason text shows generic filter failure message
      expect(screen.getByText(/filter condition not met/i)).toBeInTheDocument();
    });
  });
});
