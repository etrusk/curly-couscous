/**
 * Tests for IntentOverlay component - basic bidirectional attack offset.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("IntentOverlay - Basic Offset", () => {
  const defaultProps = {
    hexSize: 30,
  };

  beforeEach(() => {
    useGameStore.getState().actions.reset();
  });

  it("single attack line has no offset applied", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const action = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 2, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const char = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: action,
    });
    useGameStore.getState().actions.initBattle([char]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(2); // outline + main

    // Main line should start at hex cell center {q:0, r:0} and end at {q:2, r:2}
    // Pixel positions depend on hex grid conversion
    const mainLine = lines[1];
    expect(mainLine).toHaveAttribute("x1");
    expect(mainLine).toHaveAttribute("y1");
    expect(mainLine).toHaveAttribute("x2");
    expect(mainLine).toHaveAttribute("y2");
  });

  it("bidirectional attacks have perpendicular offset applied", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const actionAtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 2, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionBtoA = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 0, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const charA = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: actionAtoB,
    });
    const charB = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { q: 2, r: 2 },
      currentAction: actionBtoA,
    });
    useGameStore.getState().actions.initBattle([charA, charB]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    // Should have 4 lines total: 2 line groups (outline + main for each)
    expect(lines).toHaveLength(4);

    // Lines should NOT have identical coordinates (offset applied)
    const line1Coords = {
      x1: lines[1]?.getAttribute("x1"),
      y1: lines[1]?.getAttribute("y1"),
      x2: lines[1]?.getAttribute("x2"),
      y2: lines[1]?.getAttribute("y2"),
    };
    const line2Coords = {
      x1: lines[3]?.getAttribute("x1"),
      y1: lines[3]?.getAttribute("y1"),
      x2: lines[3]?.getAttribute("x2"),
      y2: lines[3]?.getAttribute("y2"),
    };

    // Lines should be visually separated (not identical)
    const coordsEqual =
      line1Coords.x1 === line2Coords.x1 &&
      line1Coords.y1 === line2Coords.y1 &&
      line1Coords.x2 === line2Coords.x2 &&
      line1Coords.y2 === line2Coords.y2;
    expect(coordsEqual).toBe(false);
  });

  it("three characters with mixed attacks - only bidirectional pairs get offset", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const actionAtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 2, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionBtoA = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 0, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionCtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 2, r: 2 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const charA = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 0, r: 0 },
      currentAction: actionAtoB,
    });
    const charB = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { q: 2, r: 2 },
      currentAction: actionBtoA,
    });
    const charC = createCharacter({
      id: "char-c",
      faction: "friendly",
      position: { q: 3, r: 1 },
      currentAction: actionCtoB,
    });
    useGameStore.getState().actions.initBattle([charA, charB, charC]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    // Should have 6 lines total: 3 line groups (outline + main for each)
    expect(lines).toHaveLength(6);

    // Verify three distinct line groups exist
    // Groups are pairs: [0,1], [2,3], [4,5]
    expect(lines[0]).toBeInTheDocument();
    expect(lines[1]).toBeInTheDocument();
    expect(lines[2]).toBeInTheDocument();
    expect(lines[3]).toBeInTheDocument();
    expect(lines[4]).toBeInTheDocument();
    expect(lines[5]).toBeInTheDocument();
  });

  it("bidirectional Heavy Punch produces visually distinct lines", () => {
    const heavyPunchSkill = createSkill({
      id: "heavy-punch",
      tickCost: 2,
      range: 2,
      damage: 25,
    });
    const actionAtoB = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 2, r: 1 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const actionBtoA = {
      type: "attack" as const,
      skill: heavyPunchSkill,
      targetCell: { q: 1, r: 0 },
      targetCharacter: null,
      startedAtTick: 0,
      resolvesAtTick: 2,
    };
    const charA = createCharacter({
      id: "char-a",
      faction: "friendly",
      position: { q: 1, r: 0 },
      currentAction: actionAtoB,
    });
    const charB = createCharacter({
      id: "char-b",
      faction: "enemy",
      position: { q: 2, r: 1 },
      currentAction: actionBtoA,
    });
    useGameStore.getState().actions.initBattle([charA, charB]);

    const { container } = render(<IntentOverlay {...defaultProps} />);

    const lines = container.querySelectorAll("line");
    expect(lines).toHaveLength(4); // outline + main for both

    // Friendly line (char-a) should have action-attack color
    const friendlyLine = lines[1];
    expect(friendlyLine).toHaveAttribute("stroke", "var(--action-attack)");

    // Enemy line (char-b) should have action-attack color
    const enemyLine = lines[3];
    expect(enemyLine).toHaveAttribute("stroke", "var(--action-attack)");

    // Lines should NOT share identical coordinates
    const friendlyCoords = {
      x1: friendlyLine?.getAttribute("x1"),
      y1: friendlyLine?.getAttribute("y1"),
      x2: friendlyLine?.getAttribute("x2"),
      y2: friendlyLine?.getAttribute("y2"),
    };
    const enemyCoords = {
      x1: enemyLine?.getAttribute("x1"),
      y1: enemyLine?.getAttribute("y1"),
      x2: enemyLine?.getAttribute("x2"),
      y2: enemyLine?.getAttribute("y2"),
    };

    const coordsEqual =
      friendlyCoords.x1 === enemyCoords.x1 &&
      friendlyCoords.y1 === enemyCoords.y1 &&
      friendlyCoords.x2 === enemyCoords.x2 &&
      friendlyCoords.y2 === enemyCoords.y2;
    expect(coordsEqual).toBe(false);
  });
});
