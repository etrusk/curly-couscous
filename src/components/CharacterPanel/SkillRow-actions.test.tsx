/**
 * Tests for SkillRow component - Enable/Disable checkbox and Unassign button
 * Split from SkillRow.test.tsx per 400-line project limit (review directive).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SkillRow } from "./SkillRow";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";

describe("SkillRow - Enable/Disable Checkbox", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("enable-checkbox-in-config-mode", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      enabled: true,
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="config"
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /enable.*light punch/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("enable-checkbox-reflects-disabled-state", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      enabled: false,
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="config"
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /enable.*light punch/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("enable-checkbox-calls-updateSkill", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      enabled: true,
    });
    const character = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="config"
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /enable/i }));

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.enabled).toBe(false);
  });

  it("enable-checkbox-visible-in-battle-mode", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
      enabled: true,
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="battle"
        index={0}
        isFirst={false}
        isLast={false}
        evaluation={{ status: "selected" }}
      />,
    );

    // Config controls remain visible during battle mode
    expect(
      screen.getByRole("checkbox", { name: /enable/i }),
    ).toBeInTheDocument();
  });
});

describe("SkillRow - Unassign Button", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("unassign-button-for-non-innate-skills", () => {
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="config"
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    const unassignButton = screen.getByRole("button", {
      name: /unassign.*light punch/i,
    });
    expect(unassignButton).toBeInTheDocument();
    expect(unassignButton).toHaveTextContent("Unassign");
  });

  it("no-unassign-button-for-innate-skills", () => {
    const skill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const character = createCharacter({ id: "char1", skills: [skill] });

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="config"
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /unassign.*move/i }),
    ).toBeNull();
  });

  it("unassign-calls-removeSkillFromCharacter", async () => {
    const user = userEvent.setup();
    const skill = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const character = createCharacter({ id: "char1", skills: [skill] });
    useGameStore.getState().actions.initBattle([character]);

    render(
      <SkillRow
        skill={skill}
        character={character}
        mode="config"
        index={0}
        isFirst={false}
        isLast={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /unassign.*light punch/i }),
    );

    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills).toHaveLength(0);
  });
});
