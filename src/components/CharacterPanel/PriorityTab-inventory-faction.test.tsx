/**
 * Tests for PriorityTab component - Faction-based inventory visibility.
 * Verifies inventory shows/hides based on faction presence on the board.
 * Extracted from PriorityTab-inventory.test.tsx to stay under 400-line limit.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PriorityTab } from "./PriorityTab";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("PriorityTab - Inventory Visibility (Faction-Based)", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("inventory-hidden-when-both-factions-present", () => {
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

    // Inventory heading should be absent when both factions present
    expect(screen.queryByText(/inventory/i)).toBeNull();
    // No assign buttons
    expect(screen.queryByRole("button", { name: /^assign/i })).toBeNull();
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

  it("inventory-reappears-when-enemy-faction-removed", async () => {
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
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      skills: [],
    });

    useGameStore.getState().actions.initBattle([friendly, enemy]);
    useGameStore.getState().actions.selectCharacter("friendly");

    render(<PriorityTab />);

    // Sanity check: inventory hidden when both factions present
    expect(screen.queryByText(/inventory/i)).toBeNull();

    // Remove enemy character
    useGameStore.getState().actions.removeCharacter("enemy");

    // Inventory should reappear after removing the enemy faction
    await waitFor(() => {
      expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    });
    // Assign buttons should be present
    expect(
      screen.getAllByRole("button", { name: /assign/i }).length,
    ).toBeGreaterThan(0);
  });

  it("inventory-hidden-regardless-of-battle-status", () => {
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

    // Inventory should still be hidden (both factions present, regardless of battle status)
    expect(screen.queryByText(/inventory/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /^assign/i })).toBeNull();
  });
});

describe("PriorityTab - Inventory Hidden When Both Factions Present (Battle)", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("inventory-hidden-when-both-factions-present-in-battle-file", () => {
    const lightPunch = createSkill({
      id: "light-punch",
      name: "Light Punch",
      damage: 10,
      range: 1,
      actionType: "attack",
      triggers: [{ type: "always" }],
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

    // No inventory section when both factions present
    expect(screen.queryByText(/inventory/i)).toBeNull();
    // No inventory "Assign" buttons (but "Unassign" config button may exist)
    expect(screen.queryByRole("button", { name: /^assign/i })).toBeNull();
    // Skill evaluation content IS present
    expect(screen.getByText(/light punch/i)).toBeInTheDocument();
  });
});
