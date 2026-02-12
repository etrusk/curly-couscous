/**
 * Tests for SkillRow - Target Self hides SELECTOR and FILTER sections.
 * Covers: conditional rendering of selector/filter based on target value,
 * dynamic target changes, and filter config preservation through round-trip.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("SkillRow - Target Self Hides Selector and Filter", () => {
  it("skill with target self does not render SELECTOR fieldGroup", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      target: "self",
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    expect(
      screen.queryByRole("combobox", { name: /criterion for light punch/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("SELECTOR")).not.toBeInTheDocument();
  });

  it("skill with target self does not render FilterControls", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      target: "self",
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    expect(
      screen.queryByRole("button", { name: /add filter for light punch/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("FILTER")).not.toBeInTheDocument();
  });

  it("skill with target enemy renders both SELECTOR and FilterControls", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      target: "enemy",
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    expect(
      screen.getByRole("combobox", { name: /criterion for light punch/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("SELECTOR")).toBeInTheDocument();
    expect(screen.getByText("FILTER")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add filter for light punch/i }),
    ).toBeInTheDocument();
  });

  describe("dynamic target changes", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("changing target from enemy to self hides SELECTOR and FilterControls", async () => {
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        target: "enemy",
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      // Initially visible
      expect(screen.getByText("SELECTOR")).toBeInTheDocument();

      const user = userEvent.setup();
      const targetSelect = screen.getByRole("combobox", {
        name: /target for light punch/i,
      });
      await user.selectOptions(targetSelect, "self");

      // After changing to self: hidden
      expect(screen.queryByText("SELECTOR")).not.toBeInTheDocument();
      expect(screen.queryByText("FILTER")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: /criterion for light punch/i }),
      ).not.toBeInTheDocument();
    });

    it("changing target from self to enemy restores SELECTOR and FilterControls", async () => {
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        target: "self",
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      // Initially hidden
      expect(screen.queryByText("SELECTOR")).not.toBeInTheDocument();

      const user = userEvent.setup();
      const targetSelect = screen.getByRole("combobox", {
        name: /target for light punch/i,
      });
      await user.selectOptions(targetSelect, "enemy");

      // After changing to enemy: visible
      expect(screen.getByText("SELECTOR")).toBeInTheDocument();
      expect(screen.getByText("FILTER")).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: /criterion for light punch/i }),
      ).toBeInTheDocument();
    });

    it("filter config preserved through target self round-trip", async () => {
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        target: "enemy",
        filter: { condition: "hp_below", conditionValue: 30 },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      // Filter initially visible with hp_below
      expect(screen.getByLabelText(/filter type for light punch/i)).toHaveValue(
        "hp_below",
      );

      const user = userEvent.setup();
      const targetSelect = screen.getByRole("combobox", {
        name: /target for light punch/i,
      });

      // Change to self -- filter hidden
      await user.selectOptions(targetSelect, "self");
      expect(
        screen.queryByLabelText(/filter type for/i),
      ).not.toBeInTheDocument();

      // Change back to enemy -- filter restored
      await user.selectOptions(targetSelect, "enemy");
      expect(screen.getByLabelText(/filter type for light punch/i)).toHaveValue(
        "hp_below",
      );

      // Verify store data preserved
      const storeSkill =
        useGameStore.getState().gameState.characters[0]?.skills[0];
      expect(storeSkill?.filter?.condition).toBe("hp_below");
      expect(storeSkill?.filter?.conditionValue).toBe(30);
    });
  });
});
