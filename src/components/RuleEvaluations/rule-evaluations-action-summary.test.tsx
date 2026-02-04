/**
 * Tests for action summary and compact evaluation display in RuleEvaluations component.
 * Tests cover formatActionSummary, formatTrigger, formatRejectionReason, formatEvaluationStatus,
 * and the integration of these features in the UI.
 */

/* eslint-disable max-lines */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RuleEvaluations } from "./RuleEvaluations";
import { useGameStore } from "../../stores/gameStore";
import {
  createCharacter,
  createTarget,
  createAttackAction,
  createMoveAction,
} from "./rule-evaluations-test-helpers";
import type { Action, Skill } from "../../engine/types";

// Helper to create idle action
function createIdleAction(): Action {
  return {
    type: "idle",
    skill: {
      id: "idle",
      name: "Idle",
      tickCost: 1,
      range: 0,
      enabled: true,
      triggers: [],
    },
    targetCell: { q: 0, r: 0 },
    targetCharacter: null,
    startedAtTick: 0,
    resolvesAtTick: 1,
  };
}

describe("RuleEvaluations - Action Summary", () => {
  beforeEach(() => {
    // Reset store before each test
    const { actions } = useGameStore.getState();
    actions.initBattle([]);
    actions.selectCharacter(null);
  });

  // Unit tests for formatActionSummary (will be implemented in component)
  describe("formatActionSummary", () => {
    it("should return skill name for attack action", () => {
      const action = createAttackAction(
        "light-punch",
        "Light Punch",
        { q: 1, r: 0 },
        createTarget(),
        0,
        1,
      );

      // We'll test this by rendering and checking if "Light Punch" appears without emoji
      const character = createCharacter({ currentAction: action });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);
      // Don't select character to see multi-character view

      render(<RuleEvaluations />);

      // Should show skill name without emoji
      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      expect(headerButton.textContent).toContain("Light Punch");
      expect(headerButton.textContent).not.toMatch(
        /[\u{1F44A}\u{1F4A5}\u{1F528}]/u,
      ); // No emojis
      expect(headerButton.textContent).not.toContain("Enemy1"); // No target name
    });

    it("should return skill name for move action", () => {
      const action = createMoveAction(
        "move",
        "Move",
        "towards",
        { q: 1, r: 0 },
        0,
        0,
      );

      const character = createCharacter({ currentAction: action });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      expect(headerButton.textContent).toContain("Move");
      expect(headerButton.textContent).not.toContain("towards"); // No mode details
      expect(headerButton.textContent).not.toContain("away");
    });

    it("should return Idle for idle action", () => {
      const action = createIdleAction();

      const character = createCharacter({ currentAction: action });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      expect(headerButton.textContent).toContain("Idle");
      expect(headerButton.textContent).not.toContain("💤"); // No emoji
    });

    it("should return Idle when game engine selects idle action", () => {
      // When there are no valid actions, the game engine returns an Idle action
      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]); // No enemies, so Idle is selected

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      expect(headerButton.textContent).toContain("Idle");
    });
  });

  // Integration tests for collapsed header action summary display
  describe("Collapsed Header", () => {
    it("should display action summary in multi-character view", () => {
      const target = createTarget();
      target.position = { q: 1, r: 0 }; // Within range 1

      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character, target]);
      // Don't select character - triggers multi-character view

      render(<RuleEvaluations />);

      // Character letter should be visible (badge only)
      expect(screen.getByText("A")).toBeInTheDocument();

      // Action summary "Light Punch" should appear (default skill when enemy in range)
      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      expect(headerButton.textContent).toContain("Light Punch");

      // HP info should still be present
      expect(headerButton.textContent).toContain("HP");
      expect(headerButton.textContent).toContain("100");

      // Arrow separator should be present
      expect(headerButton.textContent).toMatch(/[-→>]/);
    });

    it("should show idle when no valid action", () => {
      // Create character with attack skills only, no Move skill
      const attackOnlySkills: Skill[] = [
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
          id: "heavy-punch",
          name: "Heavy Punch",
          tickCost: 2,
          range: 2,
          damage: 25,
          enabled: true,
          triggers: [{ type: "enemy_in_range", value: 2 }],
          selectorOverride: { type: "nearest_enemy" },
        },
      ];

      const character = createCharacter({
        skills: attackOnlySkills,
        currentAction: null,
      });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]); // No enemies

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      expect(headerButton.textContent).toContain("Idle");
    });
  });

  // Integration tests for compact evaluation list
  describe("Compact Evaluation List", () => {
    it("should show evaluations until selected skill", async () => {
      const user = userEvent.setup();

      // Create character with 4 custom skills
      const customSkills: Skill[] = [
        {
          id: "heavy-punch",
          name: "Heavy Punch",
          tickCost: 2,
          range: 2,
          damage: 25,
          enabled: false, // Will be rejected: disabled
          triggers: [{ type: "always" }],
          selectorOverride: { type: "nearest_enemy" },
        },
        {
          id: "light-punch",
          name: "Light Punch",
          tickCost: 1,
          range: 1,
          damage: 10,
          enabled: true,
          triggers: [{ type: "enemy_in_range", value: 1 }], // Will be rejected: enemy at range 2
          selectorOverride: { type: "nearest_enemy" },
        },
        {
          id: "move",
          name: "Move",
          tickCost: 1,
          range: 0,
          mode: "towards",
          enabled: true,
          triggers: [{ type: "always" }], // Will be selected
          selectorOverride: { type: "nearest_enemy" },
        },
        {
          id: "extra",
          name: "Extra",
          tickCost: 1,
          range: 1,
          damage: 5,
          enabled: true,
          triggers: [{ type: "always" }], // Will be skipped (not evaluated)
          selectorOverride: { type: "nearest_enemy" },
        },
      ];

      const enemy = createTarget();
      enemy.position = { q: 2, r: 0 }; // Range 2

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
      });
      character.position = { q: 0, r: 0 };

      const { actions } = useGameStore.getState();
      actions.initBattle([character, enemy]);

      const { container } = render(<RuleEvaluations />);

      // Expand the character section (click the header button)
      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Get the expanded details section
      const detailsSection = container.querySelector(
        '[id^="character-details-"]',
      );
      expect(detailsSection).toBeInTheDocument();

      // Skill1 (Heavy Punch) should be visible with rejection reason
      expect(detailsSection?.textContent).toContain("Heavy Punch");
      expect(detailsSection?.textContent).toContain("disabled");

      // Skill2 (Light Punch) should be visible with rejection reason
      expect(detailsSection?.textContent).toContain("Light Punch");
      // Could be "out_of_range" or "trigger_failed"

      // Skill3 (Move) should be visible with SELECTED status
      expect(detailsSection?.textContent).toContain("Move");
      expect(detailsSection?.textContent).toContain("SELECTED");

      // Skill4 (Extra) should NOT be visible (it was skipped)
      expect(detailsSection?.textContent).not.toContain("Extra");
    });

    it("should not show skipped skills section", async () => {
      const user = userEvent.setup();

      const target = createTarget();
      target.position = { q: 1, r: 0 };

      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character, target]);

      const { container } = render(<RuleEvaluations />);

      // Expand the character section
      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // No <details> element should exist within expanded content
      const detailsElements = container.querySelectorAll("details");
      expect(detailsElements.length).toBe(0);

      // No text containing "Show" and "more" should appear
      expect(screen.queryByText(/Show.*more/i)).not.toBeInTheDocument();
    });

    it("should use 1-based indices in ordered list", async () => {
      const user = userEvent.setup();

      // Create character where all skills are rejected (idle result)
      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]); // No enemies

      const { container } = render(<RuleEvaluations />);

      // Expand the character section
      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // In compact format, we use <ol> which is inherently 1-based
      // Verify the list exists and has items
      const orderedList = container.querySelector("ol");
      expect(orderedList).toBeInTheDocument();
      const listItems = orderedList?.querySelectorAll("li");
      expect(listItems).toBeTruthy();
      expect(listItems!.length).toBeGreaterThan(0);
    });

    it("should use semantic ordered list structure", async () => {
      const user = userEvent.setup();

      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      const { container } = render(<RuleEvaluations />);

      // Expand the character section
      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should have an <ol> element
      const orderedList = container.querySelector("ol");
      expect(orderedList).toBeInTheDocument();

      // Each evaluation should be an <li> element
      const listItems = orderedList?.querySelectorAll("li");
      expect(listItems).toBeTruthy();
      expect(listItems!.length).toBeGreaterThan(0);
    });
  });

  // Unit tests for formatTrigger (tested via UI output)
  describe("formatTrigger", () => {
    it("should include value parameter", async () => {
      const user = userEvent.setup();

      const customSkills: Skill[] = [
        {
          id: "light-punch",
          name: "Light Punch",
          tickCost: 1,
          range: 1,
          damage: 10,
          enabled: true,
          triggers: [{ type: "enemy_in_range", value: 2 }],
          selectorOverride: { type: "nearest_enemy" },
        },
      ];

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
      });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]); // No enemies - trigger will fail

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "enemy_in_range(2)" in rejection reason
      expect(screen.getByText(/enemy_in_range\(2\)/)).toBeInTheDocument();
    });

    it("should omit value for always trigger", async () => {
      const user = userEvent.setup();

      // This test is tricky because "always" triggers don't usually fail
      // We'll verify by checking that "always" appears without parentheses in UI
      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // The Move skill has "always" trigger and should be visible
      // If formatted correctly, should see "always" not "always()"
      const content = screen.getByText(/Move/).textContent;
      if (content?.includes("always")) {
        expect(content).not.toContain("always()");
      }
    });

    it("should handle hp_below trigger", async () => {
      const user = userEvent.setup();

      const customSkills: Skill[] = [
        {
          id: "heal",
          name: "Heal",
          tickCost: 1,
          range: 1,
          enabled: true,
          triggers: [{ type: "hp_below", value: 50 }],
          selectorOverride: { type: "self" },
        },
      ];

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
        hp: 100, // Full HP, so trigger will fail
      });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "hp_below(50)" in rejection reason
      expect(screen.getByText(/hp_below\(50\)/)).toBeInTheDocument();
    });
  });

  // Unit tests for formatRejectionReason
  describe("formatRejectionReason", () => {
    it("should show failed triggers with params", async () => {
      const user = userEvent.setup();

      const customSkills: Skill[] = [
        {
          id: "heal",
          name: "Heal",
          tickCost: 1,
          range: 1,
          enabled: true,
          triggers: [{ type: "hp_below", value: 50 }],
          selectorOverride: { type: "self" },
        },
      ];

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
        hp: 100, // Full HP, trigger fails
      });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "trigger_failed" with trigger details
      const content = screen.getByText(/Heal/).parentElement?.textContent;
      expect(content).toContain("trigger_failed");
      expect(content).toContain("hp_below(50)");
    });

    it("should show range details for out_of_range", async () => {
      const user = userEvent.setup();

      const enemy = createTarget();
      enemy.position = { q: 5, r: 0 }; // Far away (distance = 5)

      const customSkills: Skill[] = [
        {
          id: "short-attack",
          name: "Short Attack",
          tickCost: 1,
          range: 2,
          damage: 10,
          enabled: true,
          triggers: [{ type: "always" }],
          selectorOverride: { type: "nearest_enemy" },
        },
      ];

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
      });
      character.position = { q: 0, r: 0 };

      const { actions } = useGameStore.getState();
      actions.initBattle([character, enemy]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "out_of_range" with distance and range
      const content =
        screen.getByText(/Short Attack/).parentElement?.textContent;
      expect(content).toContain("out_of_range");
      expect(content).toContain("5"); // distance
      expect(content).toContain("2"); // range
    });

    it("should show disabled", async () => {
      const user = userEvent.setup();

      const customSkills: Skill[] = [
        {
          id: "disabled-skill",
          name: "Disabled Skill",
          tickCost: 1,
          range: 1,
          damage: 10,
          enabled: false,
          triggers: [{ type: "always" }],
          selectorOverride: { type: "nearest_enemy" },
        },
      ];

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
      });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "disabled"
      expect(screen.getByText(/disabled/i)).toBeInTheDocument();
    });

    it("should show no_target", async () => {
      const user = userEvent.setup();

      const customSkills: Skill[] = [
        {
          id: "attack",
          name: "Attack",
          tickCost: 1,
          range: 1,
          damage: 10,
          enabled: true,
          triggers: [{ type: "always" }],
          selectorOverride: { type: "nearest_enemy" },
        },
      ];

      const character = createCharacter({
        skills: customSkills,
        currentAction: null,
      });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]); // No enemies

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "no_target"
      expect(screen.getByText(/no_target/i)).toBeInTheDocument();
    });
  });

  // Unit tests for formatEvaluationStatus
  describe("formatEvaluationStatus", () => {
    it("should show SELECTED with target name", async () => {
      const user = userEvent.setup();

      const target = createTarget();
      target.position = { q: 1, r: 0 };

      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character, target]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Should show "SELECTED" with target letter
      expect(screen.getByText(/SELECTED/i)).toBeInTheDocument();
      const content = screen.getByText(/SELECTED/i).parentElement?.textContent;
      expect(content).toMatch(/SELECTED.*B/);
      expect(content).toMatch(/[-→>]/); // Arrow separator
    });

    it("should show all rejected skills when no skill is selected", async () => {
      const user = userEvent.setup();

      // Create character where all skills are rejected (no enemies)
      // - Light Punch: rejected (trigger_failed: enemy_in_range(1))
      // - Move: rejected (no_target) - Move needs a target from selectorOverride
      // - Heavy Punch: rejected (disabled)
      // Result: Idle action is taken, but compact list shows all rejected skills
      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character]);

      const { container } = render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });
      await user.click(headerButton);

      // Get the expanded details section
      const detailsSection = container.querySelector(
        '[id^="character-details-"]',
      );
      expect(detailsSection).toBeInTheDocument();

      // Should show all three rejected skills
      expect(detailsSection?.textContent).toContain("Light Punch");
      expect(detailsSection?.textContent).toContain("Move");
      expect(detailsSection?.textContent).toContain("Heavy Punch");

      // All should be rejected
      expect(detailsSection?.textContent).toContain("rejected");

      // Should not show undefined/null in error messages
      expect(detailsSection?.textContent).not.toContain("undefined");
      expect(detailsSection?.textContent).not.toContain("null");
    });
  });

  // Accessibility tests
  describe("Accessibility", () => {
    it("should make action summary readable by screen readers", () => {
      const target = createTarget();
      target.position = { q: 1, r: 0 };

      const character = createCharacter({ currentAction: null });
      const { actions } = useGameStore.getState();
      actions.initBattle([character, target]);

      render(<RuleEvaluations />);

      const headerButton = screen.getByRole("button", {
        name: /Toggle details for A/i,
      });

      // Action summary text should be in button's content (accessible)
      expect(headerButton.textContent).toContain("Light Punch");

      // Should not be hidden from assistive technology
      expect(headerButton.getAttribute("aria-hidden")).not.toBe("true");
    });
  });
});
