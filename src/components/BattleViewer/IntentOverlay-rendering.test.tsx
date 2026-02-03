/**
 * Tests for IntentOverlay component - basic rendering with store integration.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("IntentOverlay - Basic Rendering", () => {
  const defaultProps = {
    gridWidth: 12,
    gridHeight: 12,
    cellSize: 40,
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should filter out idle actions and render correct number of lines", () => {
    const skill = createSkill({ id: "attack", tickCost: 2 });
    const attackAction = {
      type: "attack" as const,
      skill,
      targetCell: { x: 5, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const idleAction = {
      type: "idle" as const,
      skill: createSkill({ id: "idle", tickCost: 0 }),
      targetCell: { x: 0, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
      currentAction: attackAction,
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { x: 10, y: 10 },
      currentAction: idleAction,
    });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Should render only one line (for char1)
    const lines = container.querySelectorAll("line");
    // Expect 2 lines per intent (outline + main) = 2 lines total
    expect(lines).toHaveLength(2);
  });

  it("stroke-width 2px for locked-in attack in IntentOverlay integration", () => {
    const skill = createSkill({
      id: "heavy-punch",
      tickCost: 3,
      damage: 25,
    });
    const action = {
      type: "attack" as const,
      skill,
      targetCell: { x: 3, y: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 3,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 1, y: 1 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Verify that IntentLine receives correct props via inspecting SVG elements
    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main
    const mainLine = lines[1];
    expect(mainLine).toHaveAttribute("stroke", "var(--action-attack)");
    expect(mainLine).toHaveAttribute("marker-end", "url(#arrowhead-attack)");
    // stroke-width should be 2 (uniform width)
    expect(mainLine).toHaveAttribute("stroke-width", "2");
  });

  it("should render lines for Light Punch when ticksRemaining > 0 (complete information)", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      damage: 10,
    });
    const action = {
      type: "attack" as const,
      skill: lightPunchSkill,
      targetCell: { x: 2, y: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 0, y: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);
    // tick is 0, ticksRemaining = 1 (> 0)
    // Per "complete information" principle: show all pending actions
    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main
  });

  it("movement intent renders with '4 4' dash pattern in IntentOverlay", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const moveAction = {
      type: "move" as const,
      skill: moveSkill,
      targetCell: { x: 5, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { x: 4, y: 5 },
      currentAction: moveAction,
    });
    useGameStore.getState().actions.initBattle([char]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main

    // Main line (second line element)
    const mainLine = lines[1];
    expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4");
    expect(mainLine).toHaveAttribute("marker-end", "url(#circle-friendly)");
    expect(mainLine).toHaveAttribute("stroke", "var(--action-move)");
  });

  it("enemy movement intent renders with '4 4' dash pattern", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const moveAction = {
      type: "move" as const,
      skill: moveSkill,
      targetCell: { x: 5, y: 5 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "enemy",
      position: { x: 4, y: 5 },
      currentAction: moveAction,
    });
    useGameStore.getState().actions.initBattle([char]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main

    // Main line (second line element)
    const mainLine = lines[1];
    expect(mainLine).toHaveAttribute("stroke-dasharray", "4 4");
    expect(mainLine).toHaveAttribute("marker-end", "url(#diamond-enemy)");
    expect(mainLine).toHaveAttribute("stroke", "var(--action-move)");
  });

  it("Light Punch visible at tick 0 and tick 1 (resolution tick)", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const action = {
      type: "attack" as const,
      skill: lightPunchSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { x: 0, y: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    // At tick 0, line should be visible
    const { container, rerender } = render(<IntentOverlay {...defaultProps} />);
    let lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main

    // Advance to tick 1 (resolution tick, ticksRemaining = 0)
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });
    rerender(<IntentOverlay {...defaultProps} />);

    // Line should still be visible at tick 1
    lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main
  });

  it("movement visible at tick 0 and tick 1 (resolution tick)", () => {
    const moveSkill = createSkill({
      id: "move-towards",
      tickCost: 1,
      mode: "towards",
    });
    const action = {
      type: "move" as const,
      skill: moveSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { x: 0, y: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    // At tick 0, dashed line should be visible
    const { container, rerender } = render(<IntentOverlay {...defaultProps} />);
    let lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main
    expect(lines[1]).toHaveAttribute("stroke-dasharray", "4 4");

    // Advance to tick 1 (resolution tick, ticksRemaining = 0)
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });
    rerender(<IntentOverlay {...defaultProps} />);

    // Line should still be visible at tick 1 (now solid, not dashed)
    lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main
    expect(lines[1]).not.toHaveAttribute("stroke-dasharray");
  });

  it("attack intent line disappears after resolution tick", () => {
    const lightPunchSkill = createSkill({
      id: "light-punch",
      tickCost: 1,
      range: 1,
      damage: 10,
    });
    const action = {
      type: "attack" as const,
      skill: lightPunchSkill,
      targetCell: { x: 1, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { x: 0, y: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    // Advance to tick 2 (past resolution, ticksRemaining = -1)
    useGameStore.setState((state) => {
      state.gameState.tick = 2;
    });

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    // No lines should be rendered
    expect(lines).toHaveLength(0);
  });
});
