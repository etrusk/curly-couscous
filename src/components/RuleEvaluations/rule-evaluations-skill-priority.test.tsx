/**
 * Skill priority, rejection, collapsible, and accessibility tests for RuleEvaluations component.
 * Extracted from RuleEvaluations.test.tsx.
 */

/* eslint-disable max-lines */

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
        instanceId: "light-punch",
        name: "Light Punch",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: false, // Disabled
        triggers: [{ type: "enemy_in_range", value: 1 }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "move",
        instanceId: "move",
        name: "Move",
        actionType: "move",
        tickCost: 1,
        range: 0,
        behavior: "towards",
        enabled: false, // Disabled
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "heavy-punch",
        instanceId: "heavy-punch",
        name: "Heavy Punch",
        actionType: "attack",
        tickCost: 2,
        range: 1,
        damage: 25,
        behavior: "",
        enabled: true, // Only this enabled
        triggers: [{ type: "enemy_in_range", value: 1 }],
        target: "enemy",
        criterion: "nearest",
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
      position: { q: 5, r: 0 },
    });
    // Create character with a skill that has no range-based triggers (uses "always")
    const skills: Skill[] = [
      {
        id: "long-punch",
        instanceId: "long-punch",
        name: "Long Punch",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "always" }], // No range-based trigger, so we hit the range check
        target: "enemy",
        criterion: "nearest",
      },
    ];
    const character = createCharacter({
      faction: "friendly",
      position: { q: 0, r: 0 },
      skills,
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Long Punch (range 1) should be out of range to enemy at hex distance 5
    expect(
      screen.getByText(/target out of range \(5 > 1\)/i),
    ).toBeInTheDocument();
  });

  // Test: Rejected skills always visible
  it("should show rejected skills in primary section even when later skill is selected", () => {
    // Skills where first two are rejected by trigger failure, third is selected
    const skills: Skill[] = [
      {
        id: "skill-1",
        instanceId: "skill-1",
        name: "Skill One",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "hp_below", value: 50 }], // Will fail at 100 HP
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "skill-2",
        instanceId: "skill-2",
        name: "Skill Two",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "hp_below", value: 50 }], // Will fail at 100 HP
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "skill-3",
        instanceId: "skill-3",
        name: "Skill Three",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 1 }], // Will succeed
        target: "enemy",
        criterion: "nearest",
      },
    ];
    const character = createCharacter({ skills });
    const target = createTarget(); // Enemy at hex (1,0), within range
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);

    // All rejected skills should be visible in primary section
    expect(screen.getByText(/1\. Skill One/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Skill Two/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Skill Three/)).toBeInTheDocument();

    // Selected skill should have arrow indicator (arrow is in separate span)
    const selectedArrow = screen.getByText("→");
    expect(selectedArrow).toBeInTheDocument();
    expect(screen.getByText(/3\. Skill Three/)).toBeInTheDocument();

    // No expandable section (no skipped skills)
    const details = container.querySelector("details");
    expect(details).not.toBeInTheDocument();
  });

  // Test: Skipped skills in expandable section
  it("should show skipped skills in expandable section", () => {
    // Use default character with enemy in range
    // Light Punch will be selected, Move and Heavy Punch will be skipped
    const character = createCharacter();
    const target = createTarget(); // Enemy at hex (1,0)
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);

    // Selected skill should be visible with arrow (not inside details)
    const selectedArrow = screen.getByText("→");
    expect(selectedArrow).toBeInTheDocument();
    expect(screen.getByText(/1\. Light Punch/)).toBeInTheDocument();

    // Expandable section should exist
    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(screen.getByText(/Show 2 more skills/i)).toBeInTheDocument();

    // When expanded, skipped skills should be visible
    details?.setAttribute("open", "");
    expect(screen.getByText(/2\. Move/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Heavy Punch/)).toBeInTheDocument();
  });

  // Test: Original indices preserved
  it("should preserve original skill indices across sections", () => {
    // Skills where first is selected, rest are skipped
    const skills: Skill[] = [
      {
        id: "skill-a",
        instanceId: "skill-a",
        name: "Alpha Strike",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 1 }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "skill-b",
        instanceId: "skill-b",
        name: "Beta Move",
        actionType: "move",
        tickCost: 1,
        range: 0,
        behavior: "towards",
        enabled: true,
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "skill-c",
        instanceId: "skill-c",
        name: "Gamma Blast",
        actionType: "attack",
        tickCost: 2,
        range: 2,
        damage: 25,
        behavior: "",
        enabled: true,
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
    ];
    const character = createCharacter({ skills });
    const target = createTarget();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);

    // Primary section should show first skill with original index
    expect(screen.getByText(/1\. Alpha Strike/)).toBeInTheDocument();

    // Expandable section should show remaining skills with sequential indices
    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();

    details?.setAttribute("open", "");
    expect(screen.getByText(/2\. Beta Move/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Gamma Blast/)).toBeInTheDocument();
  });

  // Test: All skills rejected, no expandable
  it("should show all rejected skills with no expandable when character is idle", () => {
    // All skills fail - no enemies, so all attack skills have "no target"
    const skills: Skill[] = [
      {
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 1 }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "move",
        instanceId: "move",
        name: "Move",
        actionType: "move",
        tickCost: 1,
        range: 0,
        behavior: "towards",
        enabled: false, // Disabled
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "heavy-punch",
        instanceId: "heavy-punch",
        name: "Heavy Punch",
        actionType: "attack",
        tickCost: 2,
        range: 2,
        damage: 25,
        behavior: "",
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 2 }],
        target: "enemy",
        criterion: "nearest",
      },
    ];
    const character = createCharacter({ skills });
    // NO enemy - all attack skills will have "no target"
    const { actions } = useGameStore.getState();
    actions.initBattle([character]); // No enemies
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);

    // All skills should be visible with rejection reasons
    expect(screen.getByText(/1\. Light Punch/)).toBeInTheDocument();
    // Light Punch has enemy_in_range trigger, which fails before target check
    expect(
      screen.getAllByText(/trigger not met/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2\. Move/)).toBeInTheDocument();
    expect(screen.getByText(/\[disabled\]/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Heavy Punch/)).toBeInTheDocument();

    // No selected arrow (idle state)
    expect(screen.queryByText(/→/)).not.toBeInTheDocument();

    // No expandable section (no skipped skills)
    const details = container.querySelector("details");
    expect(details).not.toBeInTheDocument();
  });

  // Test: Mixed rejection reasons displayed
  it("should display multiple rejection reason types correctly", () => {
    // Skills with different rejection reasons
    const skills: Skill[] = [
      {
        id: "disabled-skill",
        instanceId: "disabled-skill",
        name: "Disabled Skill",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: false,
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "trigger-fail",
        instanceId: "trigger-fail",
        name: "Trigger Fail Skill",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "hp_below", value: 10 }], // 100 HP, will fail
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "out-of-range",
        instanceId: "out-of-range",
        name: "Out of Range Skill",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
      {
        id: "move",
        instanceId: "move",
        name: "Move",
        actionType: "move",
        tickCost: 1,
        range: 0,
        behavior: "towards",
        enabled: true,
        triggers: [{ type: "always" }],
        target: "enemy",
        criterion: "nearest",
      },
    ];
    // Character at (0,0), enemy at (5,0) - out of range for skills with range 1
    const character = createCharacter({ skills, position: { q: 0, r: 0 } });
    const enemy = createCharacter({
      id: "enemy",
      name: "Enemy",
      faction: "enemy",
      position: { q: 5, r: 0 },
      skills: [],
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, enemy]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);

    // Verify each rejection reason is displayed correctly
    expect(screen.getByText(/1\. Disabled Skill/)).toBeInTheDocument();
    expect(screen.getByText(/\[disabled\]/i)).toBeInTheDocument();

    expect(screen.getByText(/2\. Trigger Fail Skill/)).toBeInTheDocument();
    expect(screen.getByText(/trigger not met/i)).toBeInTheDocument();

    expect(screen.getByText(/3\. Out of Range Skill/)).toBeInTheDocument();
    expect(
      screen.getByText(/target out of range \(5 > 1\)/i),
    ).toBeInTheDocument();

    // Move should be selected (arrow is in separate span)
    const selectedArrow = screen.getByText("→");
    expect(selectedArrow).toBeInTheDocument();
    expect(screen.getByText(/4\. Move/)).toBeInTheDocument();

    // No expandable section (no skipped skills)
    const details = container.querySelector("details");
    expect(details).not.toBeInTheDocument();
  });

  // Test: Single skill, no expandable
  it("should not show expandable section when character has only one skill", () => {
    const skills: Skill[] = [
      {
        id: "only-skill",
        instanceId: "only-skill",
        name: "Only Skill",
        actionType: "attack",
        tickCost: 1,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 1 }],
        target: "enemy",
        criterion: "nearest",
      },
    ];
    const character = createCharacter({ skills });
    const target = createTarget();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);

    // Single skill should be visible with selected arrow (arrow is in separate span)
    const selectedArrow = screen.getByText("→");
    expect(selectedArrow).toBeInTheDocument();
    expect(screen.getByText(/1\. Only Skill/)).toBeInTheDocument();

    // No expandable section (nothing to expand)
    const details = container.querySelector("details");
    expect(details).not.toBeInTheDocument();
  });
});
