/**
 * Tests for PriorityTab component - Evaluation display gated on store battleStatus.
 * Verifies evaluations show during active battle alongside config controls,
 * and are absent when battle is not active.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("PriorityTab - Evaluation Display (Store-Based Gating)", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("evaluations-display-during-active-battle-with-config-controls", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
      damage: 10,
      range: 1,
      actionType: "attack",
      trigger: { scope: "enemy", condition: "always" },
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      slotPosition: 1,
      skills: [lightPunch],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
      slotPosition: 1,
    });

    useGameStore.getState().actions.initBattle([friendly, enemy]);
    useGameStore.setState((state) => {
      state.gameState.battleStatus = "active";
    });
    useGameStore.getState().actions.selectCharacter("friendly");

    render(<PriorityTab />);

    // Evaluation indicator present (Selected because enemy is in range)
    expect(screen.getByLabelText("Selected")).toBeInTheDocument();
    // Config dropdown still present alongside evaluations
    expect(
      screen.getByRole("combobox", { name: /trigger for light punch/i }),
    ).toBeInTheDocument();
    // Enable checkbox still present
    expect(
      screen.getByRole("checkbox", { name: /enable.*light punch/i }),
    ).toBeInTheDocument();
    // Unassign button still present
    expect(
      screen.getByRole("button", { name: /unassign.*light punch/i }),
    ).toBeInTheDocument();
  });

  it("no-evaluations-when-battle-not-active", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
      damage: 10,
      range: 1,
      actionType: "attack",
      trigger: { scope: "enemy", condition: "always" },
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills: [lightPunch],
    });

    // initBattle sets "active" when characters present; override to "draw"
    useGameStore.getState().actions.initBattle([friendly]);
    useGameStore.setState((state) => {
      state.gameState.battleStatus = "draw";
    });
    useGameStore.getState().actions.selectCharacter("friendly");

    render(<PriorityTab />);

    // No evaluation icons when battle is not active
    expect(screen.queryByLabelText("Selected")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rejected")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Skipped")).not.toBeInTheDocument();
    // Config controls ARE present
    expect(
      screen.getByRole("combobox", { name: /trigger for light punch/i }),
    ).toBeInTheDocument();
  });
});
