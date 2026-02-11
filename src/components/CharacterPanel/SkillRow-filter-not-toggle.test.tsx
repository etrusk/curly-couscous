/**
 * Tests for SkillRow component - Filter NOT toggle and filter qualifier.
 * Tests B1-B6: Filter NOT toggle visibility, interaction, and state.
 * Tests C1-C6: Qualifier dropdown for channeling filter condition.
 * Follows pattern from TriggerDropdown-not-toggle.test.tsx.
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

describe("SkillRow - Filter NOT Toggle", () => {
  // B1: NOT toggle visible when filter is active
  it("NOT toggle visible when filter is active", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      filter: { condition: "hp_below", conditionValue: 50 },
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    const notToggle = screen.getByRole("button", {
      name: /toggle not.*filter.*light punch/i,
    });
    expect(notToggle).toBeInTheDocument();
    expect(notToggle).toHaveTextContent("NOT");
  });

  // B2: NOT toggle hidden when no filter
  it("NOT toggle hidden when no filter is set", () => {
    const skill = createSkill({ id: "light-punch", name: "Light Punch" });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    expect(
      screen.queryByRole("button", { name: /toggle not.*filter/i }),
    ).not.toBeInTheDocument();
  });

  describe("NOT toggle store interactions", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    // B3: Clicking NOT toggle sets negated to true
    it("clicking NOT toggle sets filter.negated to true", async () => {
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

      await user.click(
        screen.getByRole("button", {
          name: /toggle not.*filter.*light punch/i,
        }),
      );

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.negated).toBe(true);
      expect(filter?.condition).toBe("hp_below");
      expect(filter?.conditionValue).toBe(50);
    });

    // B4: Clicking NOT toggle on negated filter clears negated
    it("clicking NOT toggle on negated filter clears negated", async () => {
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

      await user.click(
        screen.getByRole("button", {
          name: /toggle not.*filter.*light punch/i,
        }),
      );

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.negated).toBeFalsy();
    });
  });

  // B5: aria-pressed reflects negated state
  it("aria-pressed reflects negated state", () => {
    const skillNegated = createSkill({
      id: "light-punch",
      name: "Light Punch",
      filter: { condition: "hp_below", conditionValue: 50, negated: true },
    });
    const charNegated = createCharacter({
      id: "char1",
      skills: [skillNegated],
    });

    const { unmount } = renderSkillRow(skillNegated, charNegated);

    expect(
      screen.getByRole("button", {
        name: /toggle not.*filter.*light punch/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    unmount();

    const skillNotNegated = createSkill({
      id: "light-punch",
      name: "Light Punch",
      filter: { condition: "hp_below", conditionValue: 50 },
    });
    const charNotNegated = createCharacter({
      id: "char1",
      skills: [skillNotNegated],
    });

    renderSkillRow(skillNotNegated, charNotNegated);

    expect(
      screen.getByRole("button", {
        name: /toggle not.*filter.*light punch/i,
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  // B6: Switching condition preserves negated
  describe("condition switching preserves negated", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    it("changing filter condition preserves negated flag", async () => {
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

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      await user.selectOptions(filterDropdown, "idle");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.condition).toBe("idle");
      expect(filter?.negated).toBe(true);
    });
  });
});

describe("SkillRow - Filter Qualifier", () => {
  // C1: Qualifier visible when filter condition is channeling
  it("qualifier dropdown visible when filter condition is channeling", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      filter: { condition: "channeling" },
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    const qualifierSelect = screen.getByLabelText(/filter qualifier for/i);
    expect(qualifierSelect).toBeInTheDocument();
    expect(qualifierSelect).toHaveValue("");
  });

  // C2: Qualifier hidden when condition is not channeling
  it("qualifier dropdown hidden when condition is not channeling", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      filter: { condition: "hp_below", conditionValue: 50 },
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    expect(
      screen.queryByLabelText(/filter qualifier for/i),
    ).not.toBeInTheDocument();
  });

  // C3: Qualifier dropdown has (any), action types, and skill options
  it("qualifier dropdown has (any), action type, and skill options", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      filter: { condition: "channeling" },
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    renderSkillRow(skill, character);

    const qualifierSelect = screen.getByLabelText(/filter qualifier for/i);
    const options = within(qualifierSelect).getAllByRole("option");

    // 1 (any) + 5 action types + 8 skills = 14
    expect(options).toHaveLength(14);

    const values = options.map((o) => (o as HTMLOptionElement).value);
    // Verify all expected values are present
    expect(values).toContain("");
    expect(values).toContain("action:attack");
    expect(values).toContain("action:move");
    expect(values).toContain("action:heal");
    expect(values).toContain("action:interrupt");
    expect(values).toContain("action:charge");
    expect(values).toContain("skill:light-punch");
    expect(values).toContain("skill:heavy-punch");
    expect(values).toContain("skill:move-towards");
    expect(values).toContain("skill:heal");
    expect(values).toContain("skill:ranged-attack");
    expect(values).toContain("skill:dash");
    expect(values).toContain("skill:kick");
    expect(values).toContain("skill:charge");

    // Verify display names for unambiguous options
    expect(
      within(qualifierSelect).getByRole("option", { name: "(any)" }),
    ).toHaveValue("");
    expect(
      within(qualifierSelect).getByRole("option", { name: "Attack" }),
    ).toHaveValue("action:attack");
    expect(
      within(qualifierSelect).getByRole("option", { name: "Interrupt" }),
    ).toHaveValue("action:interrupt");
    expect(
      within(qualifierSelect).getByRole("option", { name: "Light Punch" }),
    ).toHaveValue("skill:light-punch");
    expect(
      within(qualifierSelect).getByRole("option", { name: "Ranged Attack" }),
    ).toHaveValue("skill:ranged-attack");

    // Verify colliding names have both entries
    const healOptions = within(qualifierSelect).getAllByRole("option", {
      name: "Heal",
    });
    expect(healOptions).toHaveLength(2);
    const healValues = healOptions.map((o) => (o as HTMLOptionElement).value);
    expect(healValues).toContain("action:heal");
    expect(healValues).toContain("skill:heal");

    const chargeOptions = within(qualifierSelect).getAllByRole("option", {
      name: "Charge",
    });
    expect(chargeOptions).toHaveLength(2);
    const chargeValues = chargeOptions.map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(chargeValues).toContain("action:charge");
    expect(chargeValues).toContain("skill:charge");

    const moveOptions = within(qualifierSelect).getAllByRole("option", {
      name: "Move",
    });
    expect(moveOptions).toHaveLength(2);
    const moveValues = moveOptions.map((o) => (o as HTMLOptionElement).value);
    expect(moveValues).toContain("action:move");
    expect(moveValues).toContain("skill:move-towards");

    // Default selection is (any)
    expect(qualifierSelect).toHaveValue("");
  });

  describe("Qualifier store interactions", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    // C4: Selecting action qualifier sets qualifier on filter
    it("selecting action qualifier sets qualifier on filter", async () => {
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

      const qualifierSelect = screen.getByLabelText(/filter qualifier for/i);
      await user.selectOptions(qualifierSelect, "action:heal");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.qualifier).toEqual({ type: "action", id: "heal" });
      expect(filter?.condition).toBe("channeling");
    });

    // C5: Selecting (any) removes qualifier from filter
    it("selecting (any) removes qualifier from filter", async () => {
      const user = userEvent.setup();
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        filter: {
          condition: "channeling",
          qualifier: { type: "action", id: "heal" },
        },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      const qualifierSelect = screen.getByLabelText(/filter qualifier for/i);
      await user.selectOptions(qualifierSelect, "");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter).not.toHaveProperty("qualifier");
      expect(filter?.condition).toBe("channeling");
    });

    // C6: Switching away from channeling clears qualifier
    it("switching away from channeling clears qualifier", async () => {
      const user = userEvent.setup();
      const skill = createSkill({
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        filter: {
          condition: "channeling",
          qualifier: { type: "skill", id: "heal" },
        },
      });
      const character = createCharacter({ id: "char1", skills: [skill] });
      useGameStore.getState().actions.initBattle([character]);

      renderSkillRow(skill, character);

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      await user.selectOptions(filterDropdown, "idle");

      const filter = getSkillFilter("char1", "light-punch");
      expect(filter?.condition).toBe("idle");
      expect(filter).not.toHaveProperty("qualifier");
      expect(
        screen.queryByLabelText(/filter qualifier for/i),
      ).not.toBeInTheDocument();
    });
  });
});
