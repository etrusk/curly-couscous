/**
 * Action display and timing tests for RuleEvaluations component.
 * Extracted from RuleEvaluations.test.tsx.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RuleEvaluations } from "./RuleEvaluations";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createTarget } from "./rule-evaluations-test-helpers";
import type { Action } from "../../engine/types";

describe("RuleEvaluations - Next Action Display", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 5: Attack action display
  it("should display attack action with skill name and target", () => {
    const target = createTarget();
    const attackAction: Action = {
      type: "attack",
      skill: {
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        criterion: "nearest",
        target: "enemy",
        behavior: "",
        actionType: "attack",
        damage: 10,
        enabled: true,
        triggers: [{ type: "enemy_in_range", value: 1 }],
      },
      targetCell: { q: 1, r: 0 },
      targetCharacter: target,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.updateCharacter(character.id, { currentAction: attackAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/⚔️ Light Punch → B/i)).toBeInTheDocument();
  });

  // Test 6: Move action with towards mode
  it("should display move action with mode towards", () => {
    const moveAction: Action = {
      type: "move",
      skill: {
        id: "move",
        instanceId: "move",
        name: "Move",
        tickCost: 1,
        range: 0,
        criterion: "nearest",
        target: "enemy",
        actionType: "move",
        behavior: "towards",
        enabled: true,
        triggers: [{ type: "always" }],
      },
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
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
        instanceId: "move",
        name: "Move",
        tickCost: 1,
        range: 0,
        criterion: "nearest",
        target: "enemy",
        actionType: "move",
        behavior: "away",
        enabled: true,
        triggers: [{ type: "always" }],
      },
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const character = createCharacter();
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.updateCharacter(character.id, { currentAction: moveAction });
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(screen.getByText(/🚶 Move away/i)).toBeInTheDocument();
  });

  // Test 9: Same-tick resolution
  it('should display "Resolves: this tick" for same-tick actions', () => {
    const target = createTarget();
    const attackAction: Action = {
      type: "attack",
      skill: {
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        criterion: "nearest",
        target: "enemy",
        behavior: "",
        actionType: "attack",
        damage: 10,
        enabled: true,
        triggers: [],
      },
      targetCell: { q: 1, r: 0 },
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
        instanceId: "light-punch",
        name: "Light Punch",
        tickCost: 1,
        range: 1,
        criterion: "nearest",
        target: "enemy",
        behavior: "",
        actionType: "attack",
        damage: 10,
        enabled: true,
        triggers: [],
      },
      targetCell: { q: 1, r: 0 },
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
        instanceId: "heavy-punch",
        name: "Heavy Punch",
        tickCost: 2,
        range: 1,
        criterion: "nearest",
        target: "enemy",
        behavior: "",
        actionType: "attack",
        damage: 25,
        enabled: true,
        triggers: [],
      },
      targetCell: { q: 1, r: 0 },
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

  // Test 15: Next-tick preview for idle character
  it("should preview next action for idle character", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Character should preview Light Punch (first enabled skill with enemy in range)
    expect(screen.getByText(/⚔️ Light Punch → B/i)).toBeInTheDocument();
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
});
