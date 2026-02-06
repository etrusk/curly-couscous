/**
 * Tests for SkillRow component - Config mode and battle mode display (D2)
 * Following TDD workflow - tests written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { SkillRow } from "./SkillRow";
import { useGameStore } from "../../stores/gameStore";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";

describe("SkillRow", () => {
  describe("Config Mode", () => {
    it("shows all config controls", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="config"
          index={0}
          isFirst={false}
          isLast={false}
        />,
      );

      // Priority arrows should be visible
      expect(
        screen.getByRole("button", { name: /move up/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /move down/i }),
      ).toBeInTheDocument();

      // Trigger dropdown visible
      expect(
        screen.getByRole("combobox", { name: /trigger for light punch/i }),
      ).toBeInTheDocument();

      // Target dropdown visible
      expect(screen.getByLabelText(/target/i)).toBeInTheDocument();
    });
  });

  describe("D2: Battle Mode - Selected", () => {
    it("shows check mark status and resolved target", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });
      const targetChar = createCharacter({
        id: "enemy",
        slotPosition: 2,
        name: "Enemy B",
        faction: "enemy",
      });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="battle"
          index={0}
          isFirst={false}
          isLast={false}
          evaluation={{
            status: "selected",
            resolvedTarget: targetChar,
          }}
        />,
      );

      // Green check mark icon should be visible
      expect(screen.getByLabelText(/selected/i)).toBeInTheDocument();

      // Priority arrows should NOT be visible
      expect(
        screen.queryByRole("button", { name: /move up/i }),
      ).not.toBeInTheDocument();

      // Resolved target should be shown
      expect(screen.getByText(/enemy b|-> b/i)).toBeInTheDocument();
    });
  });

  describe("D2: Battle Mode - Rejected", () => {
    it("shows X mark and rejection reason", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="battle"
          index={0}
          isFirst={false}
          isLast={false}
          evaluation={{
            status: "rejected",
            rejectionReason: "no_target",
          }}
        />,
      );

      // Red X mark icon should be visible
      expect(screen.getByLabelText(/rejected/i)).toBeInTheDocument();

      // Rejection reason should be displayed
      expect(screen.getByText(/no valid target/i)).toBeInTheDocument();
    });
  });

  describe("D2: Battle Mode - Skipped", () => {
    it("shows dash mark and de-emphasized styling", () => {
      const skill = createSkill({ id: "heavy-punch", name: "Heavy Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="battle"
          index={1}
          isFirst={false}
          isLast={false}
          evaluation={{
            status: "skipped",
          }}
        />,
      );

      // Gray dash icon should be visible
      expect(screen.getByLabelText(/skipped/i)).toBeInTheDocument();

      // Row should have de-emphasized styling
      const row = screen.getByText(/heavy punch/i).closest("div");
      expect(row).toHaveClass(/skipped|disabled/i);
    });
  });

  describe("D2: Battle Mode - Controls Hidden", () => {
    it("hides config controls in battle mode", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="battle"
          index={0}
          isFirst={false}
          isLast={false}
          evaluation={{
            status: "selected",
            resolvedTarget: undefined,
          }}
        />,
      );

      // No priority arrows
      expect(
        screen.queryByRole("button", { name: /move up/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /move down/i }),
      ).not.toBeInTheDocument();

      // No unassign button
      expect(
        screen.queryByRole("button", { name: /unassign/i }),
      ).not.toBeInTheDocument();

      // Dropdowns should be hidden or disabled
      expect(screen.queryByLabelText(/trigger/i)).not.toBeInTheDocument();
    });
  });

  describe("D2: Rejection Reason Formatting", () => {
    it("formats rejection reasons human-readably", () => {
      const testCases = [
        { reason: "disabled", expected: "Skill disabled" },
        { reason: "trigger_failed", expected: "Trigger failed" },
        { reason: "no_target", expected: "No valid target" },
        { reason: "out_of_range", expected: "Target out of range" },
        { reason: "on_cooldown", expected: "On cooldown" },
      ];

      for (const { reason, expected } of testCases) {
        const skill = createSkill({ id: "light-punch", name: "Light Punch" });
        const character = createCharacter({ id: "char1", skills: [skill] });

        const { unmount } = render(
          <SkillRow
            skill={skill}
            character={character}
            mode="battle"
            index={0}
            isFirst={false}
            isLast={false}
            evaluation={{
              status: "rejected",
              rejectionReason: reason,
            }}
          />,
        );

        expect(screen.getByText(new RegExp(expected, "i"))).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("Gap 1: Universal Behavior Dropdown", () => {
    it("behavior dropdown renders options from registry for multi-behavior skill", () => {
      const skill = createSkill({
        id: "move-towards",
        name: "Move",
        behavior: "towards",
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="config"
          index={0}
          isFirst={false}
          isLast={false}
        />,
      );

      // Behavior dropdown should be present
      const select = screen.getByLabelText(/behavior.*move/i);
      expect(select).toBeInTheDocument();

      // Options should be dynamically rendered from registry behaviors
      expect(
        screen.getByRole("option", { name: "Towards" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Away" })).toBeInTheDocument();

      // Current value should match skill's behavior
      expect(select).toHaveValue("towards");
    });

    it("behavior dropdown hidden for skills with no behaviors in registry", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="config"
          index={0}
          isFirst={false}
          isLast={false}
        />,
      );

      // No behavior dropdown for light-punch (empty behaviors array)
      expect(
        screen.queryByLabelText(/behavior.*light punch/i),
      ).not.toBeInTheDocument();
    });

    it("behavior dropdown hidden for single-behavior skills", () => {
      // Use an ID that does not match any registry entry to simulate
      // a skill with no behaviors (getSkillDefinition returns undefined)
      const skill = createSkill({
        id: "custom-skill",
        name: "Custom Skill",
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="config"
          index={0}
          isFirst={false}
          isLast={false}
        />,
      );

      // No behavior dropdown should appear
      expect(screen.queryByLabelText(/behavior/i)).not.toBeInTheDocument();
    });
  });

  describe("Gap 2b: Universal Skill Duplication", () => {
    it("duplicate button visible when skill slots available", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
      });
      const character = createCharacter({ id: "char1", skills: [skill] });

      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="config"
          index={0}
          isFirst={false}
          isLast={false}
        />,
      );

      // Duplicate button should appear (1 skill < MAX_SKILL_SLOTS of 10)
      expect(
        screen.getByRole("button", { name: /duplicate.*light punch/i }),
      ).toBeInTheDocument();
    });

    it("duplicate button hidden when all skill slots are full", () => {
      const lp1 = createSkill({
        id: "light-punch",
        instanceId: "lp-1",
        name: "Light Punch",
      });
      // Create 9 filler skills to fill all 10 slots
      const fillerSkills = Array.from({ length: 9 }, (_, i) =>
        createSkill({
          id: `filler-${i}`,
          instanceId: `filler-${i}`,
          name: `Filler ${i}`,
        }),
      );
      const character = createCharacter({
        id: "char1",
        skills: [lp1, ...fillerSkills],
      });

      render(
        <SkillRow
          skill={lp1}
          character={character}
          mode="config"
          index={0}
          isFirst={true}
          isLast={false}
        />,
      );

      // No duplicate button (10 skills = MAX_SKILL_SLOTS)
      expect(
        screen.queryByRole("button", { name: /duplicate.*light punch/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Remove Duplicate Button", () => {
    beforeEach(() => {
      useGameStore.getState().actions.reset();
    });

    const renderSkillRow = (
      skill: ReturnType<typeof createSkill>,
      character: ReturnType<typeof createCharacter>,
    ) =>
      render(
        <SkillRow
          skill={skill}
          character={character}
          mode="config"
          index={0}
          isFirst={true}
          isLast={false}
        />,
      );

    it("shows Remove button when skill has duplicate instances", () => {
      const lp1 = createSkill({
        id: "light-punch",
        instanceId: "lp-1",
        name: "Light Punch",
      });
      const lp2 = createSkill({
        id: "light-punch",
        instanceId: "lp-2",
        name: "Light Punch",
      });
      const character = createCharacter({ id: "char1", skills: [lp1, lp2] });
      renderSkillRow(lp1, character);
      expect(
        screen.getByRole("button", { name: /remove.*light punch/i }),
      ).toBeInTheDocument();
    });

    it("hides Remove button when skill has single instance", () => {
      const skill = createSkill({ id: "light-punch", name: "Light Punch" });
      const character = createCharacter({ id: "char1", skills: [skill] });
      renderSkillRow(skill, character);
      expect(
        screen.queryByRole("button", { name: /remove.*light punch/i }),
      ).not.toBeInTheDocument();
    });

    it("calls removeSkillFromCharacter when Remove clicked", async () => {
      const user = userEvent.setup();
      const lp1 = createSkill({
        id: "light-punch",
        instanceId: "lp-1",
        name: "Light Punch",
      });
      const lp2 = createSkill({
        id: "light-punch",
        instanceId: "lp-2",
        name: "Light Punch",
      });
      const character = createCharacter({ id: "char1", skills: [lp1, lp2] });
      useGameStore.getState().actions.initBattle([character]);
      renderSkillRow(lp1, character);
      await user.click(
        screen.getByRole("button", { name: /remove.*light punch/i }),
      );
      const updatedChar = useGameStore
        .getState()
        .gameState.characters.find((c) => c.id === "char1");
      expect(updatedChar?.skills).toHaveLength(1);
      expect(updatedChar?.skills[0]?.instanceId).toBe("lp-2");
    });

    it("shows both Duplicate and Remove buttons when both conditions met", () => {
      const move1 = createSkill({
        id: "move-towards",
        instanceId: "move-1",
        name: "Move",
        behavior: "towards",
      });
      const move2 = createSkill({
        id: "move-towards",
        instanceId: "move-2",
        name: "Move",
        behavior: "towards",
      });
      const character = createCharacter({
        id: "char1",
        skills: [move1, move2],
      });
      renderSkillRow(move1, character);
      expect(
        screen.getByRole("button", { name: /duplicate.*move/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /remove.*move/i }),
      ).toBeInTheDocument();
    });
  });
});
