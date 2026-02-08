/**
 * Tests for PriorityTab component - Inventory section, enable/disable checkboxes,
 * and unassign buttons.
 * Split from PriorityTab-config.test.tsx per 400-line project limit (review directive).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("PriorityTab - Inventory Section", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("inventory-section-visible-in-config-mode", () => {
    // Character with only default Move (innate) -- no non-innate skills
    const moveSkill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    const assignButtons = screen.getAllByRole("button", { name: /assign/i });
    expect(assignButtons.length).toBeGreaterThan(0);
    // Non-innate skills from registry should be visible
    expect(screen.getByText(/light punch/i)).toBeInTheDocument();
    expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
    expect(screen.getByText(/heal/i)).toBeInTheDocument();
  });

  it("inventory-excludes-innate-skills", () => {
    const char1 = createCharacter({ id: "char1", skills: [] });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    // Innate skill Move should not have an assign button
    expect(screen.queryByRole("button", { name: /assign.*move/i })).toBeNull();
    // Inventory section exists
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // Non-innate skills ARE present
    expect(
      screen.getByRole("button", { name: /assign.*light punch/i }),
    ).toBeInTheDocument();
  });

  it("inventory-excludes-skills-assigned-to-same-faction", () => {
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

    useGameStore.getState().actions.initBattle([friendly1, friendly2]);
    useGameStore.getState().actions.selectCharacter("friendly2");

    render(<PriorityTab />);

    // Light Punch should NOT be available (assigned to friendly1)
    expect(
      screen.queryByRole("button", { name: /assign light punch/i }),
    ).toBeNull();
    // Other unassigned skills should be available
    expect(
      screen.getByRole("button", { name: /assign heavy punch/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /assign heal/i }),
    ).toBeInTheDocument();
  });

  it("assign-button-adds-skill", async () => {
    const user = userEvent.setup();
    const moveSkill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    await user.click(
      screen.getByRole("button", { name: /assign light punch/i }),
    );

    // Verify store updated
    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    const hasLightPunch = updatedChar?.skills.some(
      (s) => s.name === "Light Punch",
    );
    expect(hasLightPunch).toBe(true);

    // Light Punch should no longer have an assign button in inventory
    expect(
      screen.queryByRole("button", { name: /assign light punch/i }),
    ).toBeNull();
  });

  it("assign-button-disabled-at-max-slots", () => {
    // Create 10 skills to fill all slots
    const skills = Array.from({ length: 10 }, (_, i) =>
      createSkill({
        id: "move-towards",
        instanceId: `move-${i + 1}`,
        name: "Move",
        behavior: "towards",
      }),
    );
    const char1 = createCharacter({ id: "char1", skills });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    // All assign buttons should be disabled
    const assignButtons = screen.getAllByRole("button", { name: /assign/i });
    for (const button of assignButtons) {
      expect(button).toBeDisabled();
    }
  });

  it("assign-button-hidden-for-already-assigned-skill", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const moveSkill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const char1 = createCharacter({
      id: "char1",
      skills: [lightPunch, moveSkill],
    });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    // Light Punch already assigned -- should not have assign button
    expect(
      screen.queryByRole("button", { name: /assign light punch/i }),
    ).toBeNull();
    // Heavy Punch not assigned -- should have assign button
    expect(
      screen.getByRole("button", { name: /assign heavy punch/i }),
    ).toBeInTheDocument();
  });

  it("empty-inventory-when-all-skills-assigned", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const heavyPunch = createSkill({
      id: "heavy-punch",
      name: "Heavy Punch",
    });
    const heal = createSkill({
      id: "heal",
      name: "Heal",
    });
    const rangedAttack = createSkill({
      id: "ranged-attack",
      name: "Ranged Attack",
    });
    const dash = createSkill({
      id: "dash",
      name: "Dash",
      behavior: "away",
    });
    const friendly1 = createCharacter({
      id: "friendly1",
      faction: "friendly",
      skills: [lightPunch],
    });
    const friendly2 = createCharacter({
      id: "friendly2",
      faction: "friendly",
      skills: [heavyPunch],
    });
    const friendly3 = createCharacter({
      id: "friendly3",
      faction: "friendly",
      skills: [heal, rangedAttack],
    });
    const friendly4 = createCharacter({
      id: "friendly4",
      faction: "friendly",
      skills: [dash],
    });
    const friendly5 = createCharacter({
      id: "friendly5",
      faction: "friendly",
      skills: [],
    });

    useGameStore
      .getState()
      .actions.initBattle([
        friendly1,
        friendly2,
        friendly3,
        friendly4,
        friendly5,
      ]);
    useGameStore.getState().actions.selectCharacter("friendly5");

    render(<PriorityTab />);

    // Inventory section heading still renders
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // No assignable skills
    expect(screen.queryAllByRole("button", { name: /assign/i })).toHaveLength(
      0,
    );
  });
});

describe("PriorityTab - Enable/Disable Checkbox Integration", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("enable-checkbox-visible-on-skill-rows", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const moveSkill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const char1 = createCharacter({
      id: "char1",
      skills: [lightPunch, moveSkill],
    });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    expect(
      screen.getByRole("checkbox", { name: /enable.*light punch/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /enable.*move/i }),
    ).toBeInTheDocument();
  });

  it("enable-checkbox-toggles-skill-state", async () => {
    const user = userEvent.setup();
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
      enabled: true,
    });
    const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    const checkbox = screen.getByRole("checkbox", {
      name: /enable.*light punch/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    const updatedChar = useGameStore
      .getState()
      .gameState.characters.find((c) => c.id === "char1");
    expect(updatedChar?.skills[0]?.enabled).toBe(false);
  });
});

describe("PriorityTab - Unassign Button Integration", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("unassign-button-on-non-innate-in-priority-view", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const char1 = createCharacter({ id: "char1", skills: [lightPunch] });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    expect(
      screen.getByRole("button", { name: /unassign.*light punch/i }),
    ).toBeInTheDocument();
  });

  it("no-unassign-for-innate-in-priority-view", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const char1 = createCharacter({ id: "char1", skills: [moveSkill] });
    useGameStore.getState().actions.initBattle([char1]);
    useGameStore.getState().actions.selectCharacter("char1");

    render(<PriorityTab />);

    expect(
      screen.queryByRole("button", { name: /unassign.*move/i }),
    ).toBeNull();
  });
});

// Faction-based inventory visibility tests are in PriorityTab-inventory-faction.test.tsx
