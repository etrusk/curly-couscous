/**
 * Skill priority, rejection, collapsible, and accessibility tests for RuleEvaluations component.
 * Extracted from RuleEvaluations.test.tsx.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RuleEvaluations } from "./RuleEvaluations";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createTarget } from "./rule-evaluations-test-helpers";
import type { Skill } from "../../engine/types";

describe("RuleEvaluations - Skill Priority & Rejection", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 12: Skill priority list
  it("should display skill priority list with indices", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/1\. Light Punch/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Move/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Heavy Punch/)).toBeInTheDocument();
  });

  // Test 13: Disabled skills indicator
  it("should indicate disabled skills with rejection reason", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/\[disabled\]/i)).toBeInTheDocument();
  });

  // Test 14: Rejection reason - no target
  it("should display 'no target' rejection reason", () => {
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]); // No enemies
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Light Punch should show "no target" because there are no enemies
    expect(screen.getByText(/no target/i)).toBeInTheDocument();
  });

  // Test 17: Collapsible skills section with active skill
  it("should show collapsible section for skills below active skill", () => {
    const target = createTarget();
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    // Light Punch is selected (index 0), so Move and Heavy Punch should be collapsible
    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(screen.getByText(/Show 2 more skills/i)).toBeInTheDocument();
  });

  // Test 18: No collapsible section when last skill is active
  it("should not show collapsible section when last skill is active", () => {
    const target = createTarget();
    // Enable Heavy Punch and make it trigger
    const skills: Skill[] = [
      {
        id: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        damage: 10,
        enabled: false, // Disabled
        triggers: [{ type: "enemy_in_range", value: 1 }],
        selectorOverride: { type: "nearest_enemy" },
      },
      {
        id: "move",
        name: "Move",
        tickCost: 1,
        range: 0,
        mode: "towards",
        enabled: false, // Disabled
        triggers: [{ type: "always" }],
        selectorOverride: { type: "nearest_enemy" },
      },
      {
        id: "heavy-punch",
        name: "Heavy Punch",
        tickCost: 2,
        range: 1,
        damage: 25,
        enabled: true, // Only this enabled
        triggers: [{ type: "enemy_in_range", value: 1 }],
        selectorOverride: { type: "nearest_enemy" },
      },
    ];
    const character = createCharacter({ skills });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    // Heavy Punch is active and last skill, so no collapsible section
    const details = container.querySelector("details");
    expect(details).not.toBeInTheDocument();
  });

  // Test 23: Out of range rejection reason with distance
  it("should display out of range rejection with distance information", () => {
    const enemy = createCharacter({
      id: "enemy",
      faction: "enemy",
      position: { x: 10, y: 10 },
    });
    // Create character with a skill that has no range-based triggers (uses "always")
    const skills: Skill[] = [
      {
        id: "long-punch",
        name: "Long Punch",
        tickCost: 1,
        range: 1,
        damage: 10,
        enabled: true,
        triggers: [{ type: "always" }], // No range-based trigger, so we hit the range check
        selectorOverride: { type: "nearest_enemy" },
      },
    ];
    const character = createCharacter({
      faction: "friendly",
      position: { x: 5, y: 5 },
      skills,
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Long Punch (range 1) should be out of range to enemy at distance 5
    expect(
      screen.getByText(/target out of range \(5 > 1\)/i),
    ).toBeInTheDocument();
  });
});
