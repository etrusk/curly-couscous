import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RuleEvaluations } from "./RuleEvaluations";
import { useGameStore } from "../../stores/gameStore";
import type { Character, Skill, Action } from "../../engine/types";

// Helper to create test character
function createCharacter(overrides: Partial<Character> = {}): Character {
  const defaultSkills: Skill[] = [
    {
      id: "light-punch",
      name: "Light Punch",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "move",
      name: "Move",
      tickCost: 1,
      range: 0,
      mode: "towards",
      enabled: true,
      triggers: [{ type: "always" }],
      selectorOverride: { type: "nearest_enemy" },
    },
    {
      id: "heavy-punch",
      name: "Heavy Punch",
      tickCost: 2,
      range: 2,
      damage: 25,
      enabled: false,
      triggers: [{ type: "enemy_in_range", value: 1 }],
      selectorOverride: { type: "nearest_enemy" },
    },
  ];

  return {
    id: "char-1",
    name: "Fighter",
    faction: "friendly",
    slotPosition: 0,
    hp: 100,
    maxHp: 100,
    position: { x: 0, y: 0 },
    skills: defaultSkills,
    currentAction: null,
    ...overrides,
  };
}

// Helper to create target character
function createTarget(): Character {
  return {
    id: "enemy-1",
    name: "Enemy1",
    faction: "enemy",
    slotPosition: 1,
    hp: 100,
    maxHp: 100,
    position: { x: 1, y: 0 },
    skills: [],
    currentAction: null,
  };
}

describe("RuleEvaluations", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 1: No character selected
  it("should show placeholder when no character selected", () => {
    render(<RuleEvaluations />);
    expect(
      screen.getByText(/Click a character on the grid to see AI decisions/i),
    ).toBeInTheDocument();
  });

  // Test 2: Character name in header
  it("should show character name in header when selected", () => {
    const character = createCharacter({ name: "TestWarrior" });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(
      screen.getByRole("heading", { name: /Rule Evaluations: TestWarrior/i }),
    ).toBeInTheDocument();
  });

  // Test 3: Idle character with no target previews idle action
  it("should preview idle action when character has no valid targets", () => {
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]); // No enemies, so will preview idle
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/💤 Idle/i)).toBeInTheDocument();
    expect(screen.getByText(/💤 No valid action/i)).toBeInTheDocument();
  });

  // Test 4: Idle action state (character with no current action shows preview)
  it("should display idle action with explanation", () => {
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]); // No enemies
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/💤 Idle/i)).toBeInTheDocument();
    expect(screen.getByText(/💤 No valid action/i)).toBeInTheDocument();
  });

  // Test 5: Attack action display
  it("should display attack action with skill name and target", () => {
    const target = createTarget();
    const attackAction: Action = {
      type: "attack",
      skill: {
        id: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        damage: 10,
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 1 }],
      },
      targetCell: { x: 1, y: 0 },
      targetCharacter: target,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.updateCharacter(character.id, { currentAction: attackAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/⚔️ Light Punch → Enemy1/i)).toBeInTheDocument();
  });

  // Test 6: Move action with towards mode
  it("should display move action with mode towards", () => {
    const moveAction: Action = {
      type: "move",
      skill: {
        id: "move",
        name: "Move",
        tickCost: 1,
        range: 0,
        mode: "towards",
        enabled: true,
        triggers: [{ type: "always" }],
      },
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.updateCharacter(character.id, { currentAction: moveAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/🚶 Move towards/i)).toBeInTheDocument();
  });

  // Test 7: Move action with away mode
  it("should display move action with mode away", () => {
    const moveAction: Action = {
      type: "move",
      skill: {
        id: "move",
        name: "Move",
        tickCost: 1,
        range: 0,
        mode: "away",
        enabled: true,
        triggers: [{ type: "always" }],
      },
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.updateCharacter(character.id, { currentAction: moveAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/🚶 Move away/i)).toBeInTheDocument();
  });

  // Test 8: Move action with hold mode
  it("should display move action with mode hold", () => {
    const moveAction: Action = {
      type: "move",
      skill: {
        id: "move",
        name: "Move",
        tickCost: 1,
        range: 0,
        mode: "hold",
        enabled: true,
        triggers: [{ type: "always" }],
      },
      targetCell: { x: 0, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.updateCharacter(character.id, { currentAction: moveAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/🚶 Move \(hold\)/i)).toBeInTheDocument();
  });

  // Test 9: Same-tick resolution
  it('should display "Resolves: this tick" for same-tick actions', () => {
    const target = createTarget();
    const attackAction: Action = {
      type: "attack",
      skill: {
        id: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        damage: 10,
        enabled: true,
        triggers: [],
      },
      targetCell: { x: 1, y: 0 },
      targetCharacter: target,
      startedAtTick: 5,
      resolvesAtTick: 5, // Same as current tick
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    // Set current tick to 5
    useGameStore.setState((state) => ({
      ...state,
      gameState: { ...state.gameState, tick: 5 },
    }));
    actions.updateCharacter(character.id, { currentAction: attackAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/Resolves: this tick/i)).toBeInTheDocument();
  });

  // Test 10: Next tick resolution
  it('should display "Resolves: next tick" for 1-tick remaining', () => {
    const target = createTarget();
    const attackAction: Action = {
      type: "attack",
      skill: {
        id: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        damage: 10,
        enabled: true,
        triggers: [],
      },
      targetCell: { x: 1, y: 0 },
      targetCharacter: target,
      startedAtTick: 5,
      resolvesAtTick: 6, // Current tick + 1
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    // Set current tick to 5
    useGameStore.setState((state) => ({
      ...state,
      gameState: { ...state.gameState, tick: 5 },
    }));
    actions.updateCharacter(character.id, { currentAction: attackAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/Resolves: next tick/i)).toBeInTheDocument();
  });

  // Test 11: Multi-tick resolution
  it('should display "Resolves: in 2 ticks" for multi-tick actions', () => {
    const target = createTarget();
    const attackAction: Action = {
      type: "attack",
      skill: {
        id: "heavy-punch",
        name: "Heavy Punch",
        tickCost: 2,
        range: 1,
        damage: 25,
        enabled: true,
        triggers: [],
      },
      targetCell: { x: 1, y: 0 },
      targetCharacter: target,
      startedAtTick: 5,
      resolvesAtTick: 7, // Current tick + 2
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    // Set current tick to 5
    useGameStore.setState((state) => ({
      ...state,
      gameState: { ...state.gameState, tick: 5 },
    }));
    actions.updateCharacter(character.id, { currentAction: attackAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/Resolves: in 2 ticks/i)).toBeInTheDocument();
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

  // Test 15: Next-tick preview for idle character
  it("should preview next action for idle character", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Character should preview Light Punch (first enabled skill with enemy in range)
    expect(screen.getByText(/⚔️ Light Punch → Enemy1/i)).toBeInTheDocument();
  });

  // Test 16: Section header renamed to "Next Action"
  it('should display "Next Action" section header', () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(
      screen.getByRole("heading", { name: /Next Action/i }),
    ).toBeInTheDocument();
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

  // Test 19: Accessible panel
  it("should have accessible panel with role and label", () => {
    const character = createCharacter({ name: "TestChar" });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    const panel = screen.getByRole("region", {
      name: /Rule Evaluations: TestChar/i,
    });
    expect(panel).toBeInTheDocument();
  });

  // Test 20: Semantic list structure
  it("should render skill list as ordered list element", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    const orderedList = container.querySelector("ol");
    expect(orderedList).toBeInTheDocument();
    expect(orderedList?.children.length).toBe(3); // 3 skills
  });

  // Test 21: Selected skill arrow indicator
  it("should show arrow indicator for selected skill", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    // Light Punch should be selected and have arrow in its text content
    const firstSkill = container.querySelector("li");
    expect(firstSkill?.textContent).toContain("→ ");
    expect(firstSkill?.textContent).toContain("1. Light Punch");
  });

  // Test 22: Active skill highlighting
  it("should highlight active skill based on next-tick preview", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    // Light Punch should be active (first skill with enemy in range)
    const skillItems = container.querySelectorAll("li");
    const firstSkill = skillItems[0];
    expect(firstSkill?.className).toContain("activeSkill");
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
