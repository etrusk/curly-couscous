/**
 * Tests for IntentOverlay component - basic rendering with store integration.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createSkill,
  createMoveAction,
} from "../../engine/game-test-helpers";

describe("IntentOverlay - Basic Rendering", () => {
  const defaultProps = {
    hexSize: 40,
    viewBox: "0 0 800 800",
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("should filter out idle actions and render correct number of lines", () => {
    const skill = createSkill({ id: "attack", tickCost: 2 });
    const attackAction = {
      type: "attack" as const,
      skill,
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const idleAction = {
      type: "idle" as const,
      skill: createSkill({ id: "idle", tickCost: 0 }),
      targetCell: { q: 0, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 0,
    };
    const char1 = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: attackAction,
    });
    const char2 = createCharacter({
      id: "char2",
      faction: "enemy",
      position: { q: 5, r: 0 },
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
      targetCell: { q: 3, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 3,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 1, r: 1 },
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
      targetCell: { q: 2, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 0, r: 0 },
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
      behavior: "towards",
    });
    const moveAction = {
      type: "move" as const,
      skill: moveSkill,
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "friendly",
      position: { q: 4, r: 1 },
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
      behavior: "towards",
    });
    const moveAction = {
      type: "move" as const,
      skill: moveSkill,
      targetCell: { q: 2, r: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char1",
      faction: "enemy",
      position: { q: 4, r: 1 },
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
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
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
      behavior: "towards",
    });
    const action = {
      type: "move" as const,
      skill: moveSkill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
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
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 1,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
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

  it("D3: Intent overlay positions correctly on rotated grid", () => {
    // D3: After hex rotation, intent lines should use correct pixel positions
    const moveAction = createMoveAction({ q: 2, r: 0 }, 1);
    const char1 = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: moveAction,
    });
    const char2 = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { q: 2, r: 0 },
    });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    // Should render intent line
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);

    const line = lines[0];
    if (!line) throw new Error("Expected at least one line element");
    const x1 = parseFloat(line.getAttribute("x1") || "0");
    const y1 = parseFloat(line.getAttribute("y1") || "0");
    const x2 = parseFloat(line.getAttribute("x2") || "0");
    const y2 = parseFloat(line.getAttribute("y2") || "0");

    // Verify coordinates match pointy-top pixel positions
    // (0,0) -> (0,0) and (2,0) -> (2 * hexSize * sqrt(3), 0)
    const sqrt3 = Math.sqrt(3);
    const hexSize = defaultProps.hexSize;
    expect(x1).toBeCloseTo(0, 0);
    expect(y1).toBeCloseTo(0, 0);
    expect(x2).toBeCloseTo(2 * hexSize * sqrt3, 0);
    expect(y2).toBeCloseTo(0, 0);

    // Verify viewBox is computed correctly for pointy-top grid
    const svg = container.querySelector("svg");
    const viewBox = svg?.getAttribute("viewBox");
    expect(viewBox).toBeTruthy();

    // ViewBox should be wider than tall for pointy-top hexes (landscape aspect)
    const viewBoxParts = viewBox!.split(/\s+/).map(parseFloat);
    if (viewBoxParts.length < 4) throw new Error("Invalid viewBox format");
    const width = viewBoxParts[2];
    const height = viewBoxParts[3];
    if (width === undefined || height === undefined)
      throw new Error("Invalid viewBox values");
    expect(width).toBeGreaterThan(height);
  });
});
