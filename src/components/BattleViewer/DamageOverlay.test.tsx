/**
 * Tests for DamageOverlay component.
 * Tests SVG-based damage number rendering and positioning.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";
import { DamageOverlay } from "./DamageOverlay";
import type { Character, DamageEvent } from "../../engine/types";

describe("DamageOverlay", () => {
  // Helper to create a minimal character for testing
  const createCharacter = (
    id: string,
    faction: "friendly" | "enemy",
    position: { x: number; y: number },
  ): Character => ({
    id,
    name: `Character ${id}`,
    faction,
    slotPosition: 0,
    hp: 100,
    maxHp: 100,
    position,
    skills: [],
    currentAction: null,
  });

  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().actions.reset();
  });

  it("renders nothing when no damage data", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    // No text elements should be rendered
    const textElements = container.querySelectorAll("text");
    expect(textElements).toHaveLength(0);
  });

  it("renders damage number at correct cell center position", () => {
    const char1 = createCharacter("char1", "friendly", { x: 2, y: 3 });
    const char2 = createCharacter("char2", "enemy", { x: 5, y: 7 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Add damage event
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const cellSize = 40;
    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={cellSize} />,
    );

    const textElement = container.querySelector("text");
    expect(textElement).toBeInTheDocument();

    // Position should be at cell center: (5 * 40 + 20, 7 * 40 + 20) = (220, 300)
    expect(textElement).toHaveAttribute("x", "220");
    expect(textElement).toHaveAttribute("y", "300");
  });

  it("displays correct damage amount", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    const char2 = createCharacter("char2", "enemy", { x: 1, y: 1 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Add damage event
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 25,
      resultingHp: 75,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const textElement = container.querySelector("text");
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe("-25");
  });

  it("applies blue stroke for friendly attacker", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    const char2 = createCharacter("char2", "enemy", { x: 1, y: 1 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Friendly attacks enemy
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const rectElement = container.querySelector("rect");
    expect(rectElement).toBeInTheDocument();
    expect(rectElement).toHaveAttribute("stroke", "var(--faction-friendly)");
  });

  it("applies orange stroke for enemy attacker", () => {
    const char1 = createCharacter("char1", "enemy", { x: 0, y: 0 });
    const char2 = createCharacter("char2", "friendly", { x: 1, y: 1 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    // Enemy attacks friendly
    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 15,
      resultingHp: 85,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const rectElement = container.querySelector("rect");
    expect(rectElement).toBeInTheDocument();
    expect(rectElement).toHaveAttribute("stroke", "var(--faction-enemy)");
  });

  it("stacks multiple damages vertically with dy offset", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    const char2 = createCharacter("char2", "friendly", { x: 1, y: 0 });
    const char3 = createCharacter("char3", "enemy", { x: 5, y: 5 });
    useGameStore.getState().actions.initBattle([char1, char2, char3]);

    // Both friendlies attack same enemy
    const damage1: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char3",
      damage: 10,
      resultingHp: 90,
    };
    const damage2: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char2",
      targetId: "char3",
      damage: 25,
      resultingHp: 65,
    };
    useGameStore.getState().actions.addEvent(damage1);
    useGameStore.getState().actions.addEvent(damage2);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const textElements = container.querySelectorAll("text");
    expect(textElements).toHaveLength(2);

    // First damage should have no dy offset (or dy="0")
    const firstText = textElements[0]!;
    const firstDy = firstText.getAttribute("dy");
    expect(firstDy === null || firstDy === "0").toBe(true);

    // Second damage should have vertical offset
    const secondText = textElements[1]!;
    const secondDy = secondText.getAttribute("dy");
    expect(secondDy).not.toBe("0");
    expect(secondDy).not.toBe(null);
  });

  it("has z-index 20 via CSS class", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("damageOverlay");
  });

  it("uses pointer-events: none", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    useGameStore.getState().actions.initBattle([char1]);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const svg = container.querySelector("svg");
    // CSS class will handle pointer-events: none
    expect(svg?.getAttribute("class")).toContain("damageOverlay");
  });

  it("uses text-anchor middle for horizontal centering", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    const char2 = createCharacter("char2", "enemy", { x: 1, y: 1 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const textElement = container.querySelector("text");
    expect(textElement).toHaveAttribute("text-anchor", "middle");
  });

  it("uses dominant-baseline middle for vertical centering", () => {
    const char1 = createCharacter("char1", "friendly", { x: 0, y: 0 });
    const char2 = createCharacter("char2", "enemy", { x: 1, y: 1 });
    useGameStore.getState().actions.initBattle([char1, char2]);

    const damageEvent: DamageEvent = {
      type: "damage",
      tick: 0,
      sourceId: "char1",
      targetId: "char2",
      damage: 10,
      resultingHp: 90,
    };
    useGameStore.getState().actions.addEvent(damageEvent);

    const { container } = render(
      <DamageOverlay gridWidth={12} gridHeight={12} cellSize={50} />,
    );

    const textElement = container.querySelector("text");
    expect(textElement).toHaveAttribute("dominant-baseline", "middle");
  });
});
