/**
 * Tests for SkillRow component - Config mode and battle mode display (D2)
 * Following TDD workflow - tests written before implementation.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillRow } from "./SkillRow";
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
});
