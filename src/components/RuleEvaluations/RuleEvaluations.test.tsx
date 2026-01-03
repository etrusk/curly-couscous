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
      range: 1,
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
    expect(screen.getByText(/No valid skill triggered/i)).toBeInTheDocument();
  });

  // Test 4: Idle action state
  it("should display idle action with explanation", () => {
    const idleAction: Action = {
      type: "idle",
      skill: {
        id: "__idle__",
        name: "Idle",
        tickCost: 1,
        range: 0,
        enabled: true,
        triggers: [],
      },
      targetCell: { x: 0, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.updateCharacter(character.id, { currentAction: idleAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/💤 Idle/i)).toBeInTheDocument();
    expect(screen.getByText(/No valid skill triggered/i)).toBeInTheDocument();
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
  it("should indicate disabled skills with visual marker", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/\[disabled\]/i)).toBeInTheDocument();
  });

  // Test 14: Single trigger display
  it("should display single trigger condition", () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Multiple skills have this trigger, so use getAllByText
    const triggers = screen.getAllByText(/if enemy_in_range 1/i);
    expect(triggers.length).toBeGreaterThan(0);
  });

  // Test 15: Multiple triggers with AND
  it("should display multiple triggers with AND", () => {
    const multiTriggerSkill: Skill = {
      id: "multi-skill",
      name: "Complex Skill",
      tickCost: 1,
      range: 1,
      damage: 10,
      enabled: true,
      triggers: [
        { type: "enemy_in_range", value: 1 },
        { type: "hp_below", value: 50 },
      ],
      selectorOverride: { type: "nearest_enemy" },
    };
    const character = createCharacter({ skills: [multiTriggerSkill] });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(
      screen.getByText(/if enemy_in_range 1 AND hp_below 50%/i),
    ).toBeInTheDocument();
  });

  // Test 16: Always trigger display
  it('should display "always" for skills with always trigger', () => {
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Move skill has always trigger
    expect(screen.getByText(/if always/i)).toBeInTheDocument();
  });

  // Test 17: Accessible panel
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

  // Test 18: Semantic list structure
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

  // Test 19: Next-tick preview for idle character
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

  // Test 20: Section header renamed to "Next Action"
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

  // Test 21: Collapsible skills section with active skill
  it("should show collapsible section for skills below active skill", () => {
    const target = createTarget();
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    // Light Punch is active (index 0), so Move and Heavy Punch should be collapsible
    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(screen.getByText(/Show 2 more skills/i)).toBeInTheDocument();
  });

  // Test 22: No collapsible section when last skill is active
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

  // Test 23: Collapsible section correct skill count text
  it("should display singular 'skill' for one collapsed skill", () => {
    const target = createTarget();
    // Only 2 skills total, first active
    const skills: Skill[] = [
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
    ];
    const character = createCharacter({ skills });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Only 1 skill below active, should be singular "skill"
    expect(screen.getByText(/Show 1 more skill$/i)).toBeInTheDocument();
  });

  // Test 24: Collapsible section uses native <details> element
  it("should use native <details> element for accessibility", () => {
    const target = createTarget();
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    const summary = details?.querySelector("summary");
    expect(summary).toBeInTheDocument();
  });

  // Test 25: Correct skill numbering in collapsed section
  it("should maintain correct numbering for collapsed skills", () => {
    const target = createTarget();
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    const { container } = render(<RuleEvaluations />);
    // Open the details element
    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();

    // Check that the collapsed list has correct start attribute
    const collapsedList = details?.querySelector("ol");
    expect(collapsedList).toBeInTheDocument();
    expect(collapsedList?.getAttribute("start")).toBe("2"); // activeSkillIndex + 2
  });

  // Test 26: Active skill highlighting with next-tick preview
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
});
