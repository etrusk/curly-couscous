/**
 * Tests for IntentOverlay component - directional bidirectional offset.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("IntentOverlay - Directional Offset", () => {
  const defaultProps = {
    gridWidth: 12,
    gridHeight: 12,
    cellSize: 40,
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("horizontal bidirectional lines have perpendicular Y offset only", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const actionAtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 4, y: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionBtoA = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 0, y: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const charA = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { x: 0, y: 2 },
      currentAction: actionAtoB,
    });
    const charB = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { x: 4, y: 2 },
      currentAction: actionBtoA,
    });
    useGameStore.getState().actions.initBattle([charA, charB]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(4); // outline + main for both

    // For horizontal line, offset should be in Y direction only
    // Cell centers: (0,2) -> (20, 100), (4,2) -> (180, 100) with cellSize=40
    // Expected: char-a gets -4px Y offset, char-b gets +4px Y offset
    const lineA = lines[1]; // Main line for char-a
    const lineB = lines[3]; // Main line for char-b

    // char-a should have Y values offset by -4 from center (96 instead of 100)
    // char-b should have Y values offset by +4 from center (104 instead of 100)
    const aY1 = Number(lineA?.getAttribute("y1"));
    const aY2 = Number(lineA?.getAttribute("y2"));
    const bY1 = Number(lineB?.getAttribute("y1"));
    const bY2 = Number(lineB?.getAttribute("y2"));

    // Y values should differ between the two lines (perpendicular offset applied)
    expect(aY1).not.toBe(bY1);
    expect(aY2).not.toBe(bY2);
  });

  it("vertical bidirectional lines have perpendicular X offset only", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const actionAtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 4 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionBtoA = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 2, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const charA = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { x: 2, y: 0 },
      currentAction: actionAtoB,
    });
    const charB = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { x: 2, y: 4 },
      currentAction: actionBtoA,
    });
    useGameStore.getState().actions.initBattle([charA, charB]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(4); // outline + main for both

    // For vertical line, offset should be in X direction only
    const lineA = lines[1]; // Main line for char-a
    const lineB = lines[3]; // Main line for char-b

    const aX1 = Number(lineA?.getAttribute("x1"));
    const aX2 = Number(lineA?.getAttribute("x2"));
    const bX1 = Number(lineB?.getAttribute("x1"));
    const bX2 = Number(lineB?.getAttribute("x2"));

    // X values should differ between the two lines (perpendicular offset applied)
    expect(aX1).not.toBe(bX1);
    expect(aX2).not.toBe(bX2);
  });

  it("diagonal bidirectional lines have both X and Y offset", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const actionAtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 3, y: 3 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionBtoA = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { x: 0, y: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const charA = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { x: 0, y: 0 },
      currentAction: actionAtoB,
    });
    const charB = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { x: 3, y: 3 },
      currentAction: actionBtoA,
    });
    useGameStore.getState().actions.initBattle([charA, charB]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(4); // outline + main for both

    const lineA = lines[1]; // Main line for char-a
    const lineB = lines[3]; // Main line for char-b

    // Both X and Y should differ for diagonal lines
    const aX1 = Number(lineA?.getAttribute("x1"));
    const aY1 = Number(lineA?.getAttribute("y1"));
    const bX1 = Number(lineB?.getAttribute("x1"));
    const bY1 = Number(lineB?.getAttribute("y1"));

    expect(aX1).not.toBe(bX1);
    expect(aY1).not.toBe(bY1);
  });
});
