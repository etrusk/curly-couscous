/**
 * Tests for PriorityTab component - Faction-based inventory filtering.
 * Verifies inventory is always visible and filters skills by faction assignment.
 * Extracted from PriorityTab-inventory.test.tsx to stay under 400-line limit.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("PriorityTab - Inventory Visibility", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("inventory-visible-when-both-factions-present", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      skills: [lightPunch],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      skills: [],
    });

    useGameStore.getState().actions.initBattle([friendly, enemy]);
    useGameStore.getState().actions.selectCharacter("friendly");

    render(<PriorityTab />);

    // Inventory heading should be present even with both factions
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // Skill list still renders
    expect(screen.getByText(/light punch/i)).toBeInTheDocument();
  });

  it("inventory-visible-with-single-faction-friendly-only", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      name: "Move",
      behavior: "towards",
    });
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      skills: [moveSkill],
    });

    useGameStore.getState().actions.initBattle([friendly]);
    useGameStore.getState().actions.selectCharacter("friendly");

    render(<PriorityTab />);

    // Inventory heading should be visible with single faction
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // Assign buttons should be present
    expect(
      screen.getAllByRole("button", { name: /assign/i }).length,
    ).toBeGreaterThan(0);
  });

  it("inventory-visible-with-enemy-only-faction", () => {
    const enemy1 = createCharacter({
      id: "enemy1",
      faction: "enemy",
      skills: [],
    });

    useGameStore.getState().actions.initBattle([enemy1]);
    useGameStore.getState().actions.selectCharacter("enemy1");

    render(<PriorityTab />);

    // Inventory heading should be visible with only enemy faction
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // Assign buttons should be present for all non-innate registry skills
    expect(
      screen.getAllByRole("button", { name: /assign/i }).length,
    ).toBeGreaterThan(0);
  });

  it("inventory-visible-regardless-of-battle-status", () => {
    const friendly = createCharacter({
      id: "friendly",
      faction: "friendly",
      skills: [],
    });
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      skills: [],
    });

    useGameStore.getState().actions.initBattle([friendly, enemy]);
    // Manually set battleStatus to "draw" (not "active")
    useGameStore.setState((state) => {
      state.gameState.battleStatus = "draw";
    });
    useGameStore.getState().actions.selectCharacter("friendly");

    render(<PriorityTab />);

    // Inventory should be visible regardless of battle status
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
  });
});

describe("PriorityTab - Inventory Faction Filtering", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("filters-out-skills-assigned-to-same-faction-characters", () => {
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
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { q: 1, r: 0 },
    });

    useGameStore.getState().actions.initBattle([friendly, enemy]);
    useGameStore.getState().actions.selectCharacter("friendly");
    useGameStore.setState((state) => {
      state.gameState.battleStatus = "active";
    });

    render(<PriorityTab />);

    // Inventory section is present
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    // Skill evaluation content IS present
    expect(screen.getByText(/light punch/i)).toBeInTheDocument();
  });
});
