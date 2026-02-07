/**
 * Tests for SkillRow AND Combinator - Second trigger dropdown functionality
 * Extracted from SkillRow.test.tsx to stay within max-lines limit.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillRow } from "./SkillRow";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";
import { useGameStore } from "../../stores/gameStore";

describe("SkillRow AND Combinator", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("shows + AND button for single-trigger skills", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [{ type: "hp_below", value: 50 }],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /add and trigger for light punch/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows + AND button when trigger is always", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [{ type: "always" }],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /add and/i }),
    ).toBeInTheDocument();
  });

  it("hides + AND button when two triggers exist", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [
        { type: "hp_below", value: 50 },
        { type: "enemy_in_range", value: 3 },
      ],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /add and/i }),
    ).not.toBeInTheDocument();
  });

  it("clicking + AND adds second trigger", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [{ type: "hp_below", value: 50 }],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    // Set up store with the character so updateSkill can modify it
    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const addBtn = screen.getByRole("button", {
      name: /add and trigger for light punch/i,
    });
    await user.click(addBtn);

    // Verify store state after click
    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.instanceId === skill.instanceId,
    );
    expect(updatedSkill?.triggers).toHaveLength(2);
    expect(updatedSkill?.triggers[0]).toEqual({ type: "hp_below", value: 50 });
    expect(updatedSkill?.triggers[1]).toEqual({ type: "hp_below", value: 50 });
  });

  it("auto-replaces always trigger when adding second", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [{ type: "always" }],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const addBtn = screen.getByRole("button", { name: /add and/i });
    await user.click(addBtn);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.instanceId === skill.instanceId,
    );
    expect(updatedSkill?.triggers).toHaveLength(2);
    // "always" should have been auto-replaced, NOT preserved
    expect(updatedSkill?.triggers[0]).not.toEqual({ type: "always" });
    expect(updatedSkill?.triggers[0]).toEqual({ type: "hp_below", value: 50 });
    expect(updatedSkill?.triggers[1]).toEqual({ type: "hp_below", value: 50 });
  });

  it("shows AND label between two triggers", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [
        { type: "hp_below", value: 50 },
        { type: "enemy_in_range", value: 3 },
      ],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const andLabel = screen.getByText("AND");
    expect(andLabel).toBeInTheDocument();
    expect(andLabel).toHaveAttribute("aria-hidden", "true");
  });

  it("shows remove button on second trigger only", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [
        { type: "hp_below", value: 50 },
        { type: "enemy_in_range", value: 3 },
      ],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const removeButtons = screen.getAllByRole("button", {
      name: /remove/i,
    });
    expect(removeButtons).toHaveLength(1);
    expect(removeButtons[0]).toHaveAccessibleName(
      "Remove second trigger for Light Punch",
    );
  });

  it("removing second trigger returns to single trigger", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [
        { type: "hp_below", value: 50 },
        { type: "enemy_in_range", value: 3 },
      ],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const removeBtn = screen.getByRole("button", { name: /remove/i });
    await user.click(removeBtn);

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.instanceId === skill.instanceId,
    );
    expect(updatedSkill?.triggers).toHaveLength(1);
    expect(updatedSkill?.triggers[0]).toEqual({ type: "hp_below", value: 50 });
  });

  it("changing first trigger preserves second trigger", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [
        { type: "hp_below", value: 50 },
        { type: "enemy_in_range", value: 3 },
      ],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    // Change the first trigger (aria-label "Trigger for Light Punch")
    const firstTrigger = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(firstTrigger, "ally_in_range");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.instanceId === skill.instanceId,
    );
    expect(updatedSkill?.triggers).toHaveLength(2);
    expect(updatedSkill?.triggers[0]).toEqual({
      type: "ally_in_range",
      value: 3,
    });
    expect(updatedSkill?.triggers[1]).toEqual({
      type: "enemy_in_range",
      value: 3,
    });
  });

  it("changing second trigger preserves first trigger", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [
        { type: "hp_below", value: 50 },
        { type: "enemy_in_range", value: 3 },
      ],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    // Change the second trigger (aria-label "Second trigger for Light Punch")
    const secondTrigger = screen.getByRole("combobox", {
      name: "Second trigger for Light Punch",
    });
    await user.selectOptions(secondTrigger, "ally_hp_below");

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.instanceId === skill.instanceId,
    );
    expect(updatedSkill?.triggers).toHaveLength(2);
    expect(updatedSkill?.triggers[0]).toEqual({ type: "hp_below", value: 50 });
    expect(updatedSkill?.triggers[1]).toEqual({
      type: "ally_hp_below",
      value: 50,
    });
  });

  it("shows + AND button and trigger controls in battle mode alongside evaluation", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [{ type: "hp_below", value: 50 }],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
        evaluation={{
          status: "selected",
        }}
      />,
    );

    // Config controls remain visible alongside evaluation indicators
    expect(
      screen.getByRole("button", { name: /add and/i }),
    ).toBeInTheDocument();
    // Trigger dropdown also visible
    expect(
      screen.getByRole("combobox", { name: /trigger for light punch/i }),
    ).toBeInTheDocument();
    // Evaluation indicator present
    expect(screen.getByLabelText(/selected/i)).toBeInTheDocument();
  });

  it("shows + AND button for empty triggers array", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    // The fallback "always" trigger should be displayed
    const triggerDropdown = screen.getByRole("combobox", {
      name: /trigger for light punch/i,
    });
    expect(triggerDropdown).toHaveValue("always");

    // The + AND button should be present
    expect(
      screen.getByRole("button", { name: /add and/i }),
    ).toBeInTheDocument();
  });

  it("existing single-trigger behavior unchanged", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      triggers: [{ type: "hp_below", value: 50 }],
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    // Change trigger type via the dropdown
    const triggerDropdown = screen.getByRole("combobox", {
      name: "Trigger for Light Punch",
    });
    await user.selectOptions(triggerDropdown, "enemy_in_range");

    // Verify store was updated with the new trigger
    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const updatedSkill = updatedChar?.skills.find(
      (s) => s.instanceId === skill.instanceId,
    );
    expect(updatedSkill?.triggers).toEqual([
      { type: "enemy_in_range", value: 3 },
    ]);

    // Verify the aria-label is unchanged from before the refactor
    expect(triggerDropdown).toHaveAccessibleName("Trigger for Light Punch");
  });
});
