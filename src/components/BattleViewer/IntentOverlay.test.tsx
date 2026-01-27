/**
 * Tests for IntentOverlay component - marker definitions and outline rendering.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { IntentOverlay } from "./IntentOverlay";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";

describe("IntentOverlay", () => {
  const defaultProps = {
    gridWidth: 12,
    gridHeight: 12,
    cellSize: 40,
  };

  describe("Marker Outline Rendering", () => {
    it("should render arrowhead-friendly marker with outline polygon first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="arrowhead-friendly"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is contrast-line outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "var(--contrast-line)");
      expect(outlinePolygon).toHaveAttribute("stroke", "var(--contrast-line)");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "var(--faction-friendly)");
    });

    it("should render arrowhead-enemy marker with outline polygon first", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="arrowhead-enemy"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is contrast-line outline
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("fill", "var(--contrast-line)");
      expect(outlinePolygon).toHaveAttribute("stroke", "var(--contrast-line)");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("fill", "var(--faction-enemy)");
    });

    it("should render circle-friendly marker with outline stroke behind", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="circle-friendly"]');
      expect(marker).toBeInTheDocument();

      const circles = marker?.querySelectorAll("circle");
      expect(circles).toHaveLength(2);

      // First circle is contrast-line outline (thicker)
      const outlineCircle = circles?.[0];
      expect(outlineCircle).toHaveAttribute("stroke", "var(--contrast-line)");
      expect(outlineCircle).toHaveAttribute("stroke-width", "4");
      expect(outlineCircle).toHaveAttribute("fill", "none");

      // Second circle is colored main
      const mainCircle = circles?.[1];
      expect(mainCircle).toHaveAttribute("stroke", "var(--faction-friendly)");
      expect(mainCircle).toHaveAttribute("stroke-width", "2");
    });

    it("should render diamond-enemy marker with outline stroke behind", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const marker = container.querySelector('marker[id="diamond-enemy"]');
      expect(marker).toBeInTheDocument();

      const polygons = marker?.querySelectorAll("polygon");
      expect(polygons).toHaveLength(2);

      // First polygon is white outline (thicker)
      const outlinePolygon = polygons?.[0];
      expect(outlinePolygon).toHaveAttribute("stroke", "white");
      expect(outlinePolygon).toHaveAttribute("stroke-width", "4");
      expect(outlinePolygon).toHaveAttribute("fill", "none");

      // Second polygon is colored main
      const mainPolygon = polygons?.[1];
      expect(mainPolygon).toHaveAttribute("stroke", "#E69F00");
      expect(mainPolygon).toHaveAttribute("stroke-width", "2");
    });

    it("should set overflow='visible' on all markers", () => {
      const { container } = render(<IntentOverlay {...defaultProps} />);

      const markers = container.querySelectorAll("marker");
      expect(markers.length).toBeGreaterThanOrEqual(4);

      markers.forEach((marker) => {
        expect(marker).toHaveAttribute("overflow", "visible");
      });
    });

    describe("Integration with store", () => {
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

      it("should pass proper props to IntentLine", () => {
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
        expect(mainLine).toHaveAttribute("stroke", "var(--faction-friendly)");
        expect(mainLine).toHaveAttribute(
          "marker-end",
          "url(#arrowhead-friendly)",
        );
        // stroke-width should be 4 because ticksRemaining = 3 (locked-in)
        expect(mainLine).toHaveAttribute("stroke-width", "4");
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

      it("should render movement intent with dashed line and circle marker", () => {
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
          resolvesAtTick: 0,
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
        expect(mainLine).toHaveAttribute("stroke-dasharray", "8 4");
        expect(mainLine).toHaveAttribute("marker-end", "url(#circle-friendly)");
        expect(mainLine).toHaveAttribute("stroke", "var(--faction-friendly)");
      });

      it("should render enemy movement intent with dashed line and diamond marker", () => {
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
          resolvesAtTick: 0,
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
        expect(mainLine).toHaveAttribute("stroke-dasharray", "8 4");
        expect(mainLine).toHaveAttribute("marker-end", "url(#diamond-enemy)");
        expect(mainLine).toHaveAttribute("stroke", "var(--faction-enemy)");
      });
    });
  });
});
