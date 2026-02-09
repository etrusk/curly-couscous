/** Tests for CharacterTooltip component - content rendering. */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterTooltip } from "./CharacterTooltip";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
  createAttackAction,
} from "../RuleEvaluations/rule-evaluations-test-helpers";
import { createMockRect, mockViewport } from "./tooltip-test-helpers";

describe("CharacterTooltip - Content Rendering", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
    // Reset viewport to default
    mockViewport(1000, 800);
  });

  // Test: renders-next-action-section
  it("renders Next Action section with action name and target", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = createMockRect({
      top: 100,
      left: 100,
      right: 140,
      bottom: 140,
      width: 40,
      height: 40,
      x: 100,
      y: 100,
    });

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Section header
    expect(screen.getByText("Next Action")).toBeInTheDocument();
    // Action display with emoji and skill name
    expect(screen.getAllByText(/Light Punch/i).length).toBeGreaterThanOrEqual(
      1,
    );
    // Target indicator shows character letter
    expect(screen.getByText(/B/i)).toBeInTheDocument();
    // Resolution timing is displayed
    expect(screen.getByText(/next tick/i)).toBeInTheDocument();
  });

  // Test: renders-skill-priority-section
  it("renders Skill Priority section with numbered skill list", () => {
    const target = createTarget();
    const character = createCharacter({
      currentAction: null,
      skills: [
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
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
          target: "enemy",
          criterion: "nearest",
        },
        {
          id: "move",
          instanceId: "move",
          name: "Move",
          tickCost: 1,
          range: 0,
          criterion: "nearest",
          target: "enemy",
          actionType: "attack",
          behavior: "towards",
          enabled: true,
          trigger: { scope: "enemy", condition: "always" },
        },
        {
          id: "heavy-punch",
          instanceId: "heavy-punch",
          name: "Heavy Punch",
          tickCost: 2,
          range: 2,
          criterion: "nearest",
          target: "enemy",
          behavior: "",
          actionType: "attack",
          damage: 25,
          enabled: false,
          trigger: { scope: "enemy", condition: "in_range", conditionValue: 1 },
        },
      ],
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Section header
    expect(screen.getByText("Skill Priority")).toBeInTheDocument();
    // Skills are numbered
    expect(screen.getByText(/1\.\s*Light Punch/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.\s*Move/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.\s*Heavy Punch/i)).toBeInTheDocument();
    // Selected skill has arrow indicator
    expect(screen.getAllByText(/→/).length).toBeGreaterThanOrEqual(1);
    // Skills in collapsed section are present in DOM
    expect(screen.getByText(/Heavy Punch/i)).toBeInTheDocument();
  });

  // Test: renders-collapsible-skipped-skills
  it("renders skipped skills in collapsible section using details/summary", () => {
    const target = createTarget();
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // <details> element exists
    const details = document.querySelector("details");
    expect(details).toBeInTheDocument();
    // <summary> shows "Show N more skills"
    const summary = document.querySelector("summary");
    expect(summary?.textContent).toMatch(/Show \d+ more skill/i);
    // When expanded, skipped skills are visible with their indices
    // Note: This is a static check - interactive expansion will be tested in integration
  });

  // Test: renders-mid-action-display
  it("renders Continuing Action when character is mid-action", () => {
    const target = createTarget();
    const character = createCharacter({
      currentAction: createAttackAction(
        "light-punch",
        "Light Punch",
        target.position,
        target,
        0,
        3,
      ),
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    // Set game tick to 1 (mid-action)
    useGameStore.setState((state) => {
      state.gameState.tick = 1;
    });

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Header shows "Continuing Action" not "Next Action"
    expect(screen.getByText("Continuing Action")).toBeInTheDocument();
    expect(screen.queryByText("Next Action")).not.toBeInTheDocument();
    // Current action skill name is displayed
    expect(screen.getByText(/Light Punch/i)).toBeInTheDocument();
    // Resolution timing shows remaining ticks
    expect(screen.getByText(/2 ticks/i)).toBeInTheDocument();
  });

  // Test: renders-idle-state
  it("renders idle state when character has no valid action", () => {
    const character = createCharacter({ currentAction: null });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]); // No enemies

    const anchorRect = createMockRect();

    render(
      <CharacterTooltip
        characterId={character.id}
        anchorRect={anchorRect}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      />,
    );

    // Idle emoji displayed
    expect(screen.getByText(/💤 Idle/)).toBeInTheDocument();
    // "No valid action" message shown
    expect(screen.getByText(/No valid action/i)).toBeInTheDocument();
    // All skills show rejection reasons
    // (Light Punch: no enemy in range, Move: no target, Heavy Punch: disabled)
  });
});
