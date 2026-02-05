/**
 * Basic rendering tests for RuleEvaluations component.
 * Extracted from RuleEvaluations.test.tsx.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RuleEvaluations } from "./RuleEvaluations";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createTarget } from "./rule-evaluations-test-helpers";

describe("RuleEvaluations - Basic Rendering", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Test 1: No character selected
  it("should show placeholder when no character selected", () => {
    render(<RuleEvaluations />);
    expect(screen.getByText(/No characters on the board/i)).toBeInTheDocument();
  });

  // Test 2: Character letter in header
  it("should show character letter in header when selected", () => {
    const character = createCharacter({ name: "TestWarrior" });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    expect(
      screen.getByRole("heading", { name: /Rule Evaluations: A/i }),
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

  // Test 19: Accessible panel
  it("should have accessible panel with role and label", () => {
    const character = createCharacter({ name: "TestChar" });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    const panel = screen.getByRole("region", {
      name: /Rule Evaluations: A/i,
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

  // Test 23: Empty board shows appropriate message when no characters
  it("should show empty board message when no characters on board", () => {
    // No characters added to battle
    render(<RuleEvaluations />);
    expect(screen.getByText(/No characters on the board/i)).toBeInTheDocument();
  });

  // Test 24: Renders all characters when no character selected
  it("should render condensed headers for all characters when no character selected", () => {
    const char1 = createCharacter({ id: "char1", name: "Alpha" });
    const char2 = createCharacter({
      id: "char2",
      name: "Beta",
      faction: "enemy",
    });
    const { actions } = useGameStore.getState();
    actions.initBattle([char1, char2]);
    // No character selected

    render(<RuleEvaluations />);
    // Should show both character letters in condensed headers (badge only)
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    // Should not show placeholder "Click a character"
    expect(
      screen.queryByText(/Click a character on the grid to see AI decisions/i),
    ).not.toBeInTheDocument();
  });

  // Test 25: Expand/collapse works for each character section
  it("should expand character section when clicked", async () => {
    const char1 = createCharacter({ id: "char1", name: "Alpha" });
    const { actions } = useGameStore.getState();
    actions.initBattle([char1]);
    // No character selected

    const { container } = render(<RuleEvaluations />);
    // Find expand button (the character header button contains the character letter)
    const expandButton = screen.getByRole("button", {
      name: /Toggle details for A/i,
    });
    // Click it
    await userEvent.click(expandButton);
    // Should show compact evaluation list (ordered list of skill evaluations)
    const orderedList = container.querySelector("ol");
    expect(orderedList).toBeInTheDocument();
    expect(orderedList?.querySelectorAll("li").length).toBeGreaterThan(0);
  });

  // Test 26: Accessibility attributes present for all character sections
  it("should have accessible region for each character", () => {
    const char1 = createCharacter({ id: "char1", name: "Alpha" });
    const char2 = createCharacter({ id: "char2", name: "Beta" });
    const { actions } = useGameStore.getState();
    actions.initBattle([char1, char2]);

    render(<RuleEvaluations />);
    const regions = screen.getAllByRole("region");
    expect(regions).toHaveLength(2);
    expect(regions[0]).toHaveAccessibleName(/Rule Evaluations: A/i);
    expect(regions[1]).toHaveAccessibleName(/Rule Evaluations: B/i);
  });

  // Test 27: Performance with many characters (limit to 10)
  it("should render up to 10 characters without performance issues", () => {
    const characters = Array.from({ length: 10 }, (_, i) =>
      createCharacter({ id: `char${i}`, name: `Char${i}` }),
    );
    const { actions } = useGameStore.getState();
    actions.initBattle(characters);

    render(<RuleEvaluations />);
    // Should render all 10 character headers with letters A-J
    const expectedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    for (let i = 0; i < 10; i++) {
      expect(
        screen.getAllByText(expectedLetters[i]!).length,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // Test: RuleEvaluations-displays-correct-letter
  it("should display correct letter A for character with slotPosition 1", () => {
    const character = createCharacter({ id: "char1", name: "TestChar" });
    const { actions } = useGameStore.getState();
    actions.initBattle([character]);
    // Don't select character - render MultiCharacterView to show letters

    render(<RuleEvaluations />);
    // Character section should display letter "A" in the multi-character view (badge only)
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  // Test: RuleEvaluations-handles-positions-beyond-26
  it("should display AA for character with slotPosition 27", () => {
    // Create character with slotPosition 27 by directly setting state
    // (bypassing initBattle which would reassign based on array index)
    const character = createCharacter({
      id: "char27",
      name: "CharAA",
      slotPosition: 27,
    });

    // Directly set state to include character with slotPosition 27
    useGameStore.setState((state) => {
      state.gameState.characters = [character];
      state.gameState.battleStatus = "active";
    });

    // Don't select character - render MultiCharacterView to show letters
    render(<RuleEvaluations />);
    // Should display "AA" for position 27 in multi-character view
    // The letter appears twice: badge span + name span
    expect(screen.getAllByText("AA").length).toBeGreaterThanOrEqual(1);
  });

  // Test: mid-action-display-uses-letter-notation
  it("should display letter notation in mid-action view header", () => {
    const target = createTarget();
    const attackAction = {
      type: "attack" as const,
      skill: {
        id: "light-punch",
        instanceId: "light-punch",
        name: "Light Punch",
        actionType: "attack" as const,
        tickCost: 3,
        range: 1,
        damage: 10,
        behavior: "",
        enabled: true,
        triggers: [{ type: "enemy_in_range" as const, value: 1 }],
        target: "enemy" as const,
        criterion: "nearest" as const,
      },
      targetCell: { q: 1, r: 0 },
      targetCharacter: target,
      startedAtTick: 0,
      resolvesAtTick: 3,
    };
    const character = createCharacter({ name: "Fighter" });
    const { actions } = useGameStore.getState();
    actions.initBattle([character, target]);
    actions.updateCharacter(character.id, { currentAction: attackAction });
    // Set tick to 1 to be mid-action (between startedAtTick 0 and resolvesAtTick 3)
    useGameStore.setState((state) => ({
      ...state,
      gameState: { ...state.gameState, tick: 1 },
    }));
    actions.selectCharacter(character.id);

    render(<RuleEvaluations />);
    // Should show letter "A" in the header (not "Fighter")
    expect(
      screen.getByRole("heading", { name: /Rule Evaluations: A/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /Rule Evaluations: A/i }),
    ).toBeInTheDocument();
    // Character name should NOT appear in the header
    expect(
      screen.queryByRole("heading", { name: /Fighter/i }),
    ).not.toBeInTheDocument();
  });
});
