/**
 * Tests for SkillRow component - Selector filter UI controls and display.
 * Split from SkillRow.test.tsx to stay under 400-line limit.
 */

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SkillRow } from "./SkillRow";
import { createSkill, createCharacter } from "../../engine/game-test-helpers";

describe("SkillRow - Selector Filter", () => {
  describe("Config Mode - Filter Controls", () => {
    it("shows 'Add filter' button when skill has no selectorFilter", () => {
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

      expect(
        screen.getByRole("button", { name: /add filter/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/filter type/i)).not.toBeInTheDocument();
    });

    it("shows filter controls when selectorFilter is set", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        selectorFilter: { type: "hp_below", value: 50 },
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

      // Filter type dropdown present
      expect(screen.getByLabelText(/filter type for/i)).toBeInTheDocument();
      // Filter value input present
      expect(screen.getByLabelText(/filter value for/i)).toBeInTheDocument();
      // Remove filter button present
      expect(screen.getByLabelText(/remove filter for/i)).toBeInTheDocument();
      // "Add filter" button should NOT be present
      expect(
        screen.queryByRole("button", { name: /add filter/i }),
      ).not.toBeInTheDocument();
    });

    it("filter type dropdown has HP below and HP above options", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        selectorFilter: { type: "hp_below", value: 50 },
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

      const filterDropdown = screen.getByLabelText(/filter type for/i);
      const filterScope = within(filterDropdown);
      expect(
        filterScope.getByRole("option", { name: /hp below/i }),
      ).toHaveValue("hp_below");
      expect(
        filterScope.getByRole("option", { name: /hp above/i }),
      ).toHaveValue("hp_above");
      // Current value should be hp_below
      expect(filterDropdown).toHaveValue("hp_below");
    });

    it("filter value input displays current threshold value", () => {
      const skill = createSkill({
        id: "light-punch",
        name: "Light Punch",
        selectorFilter: { type: "hp_below", value: 75 },
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

      const input = screen.getByLabelText(/filter value for/i);
      expect(input).toHaveValue(75);
    });

    it("no filter controls rendered when skill has no selectorFilter", () => {
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

      expect(
        screen.queryByLabelText(/filter type for/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/filter value for/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/remove filter for/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Battle Mode - Filter Rejection Display", () => {
    it("shows formatted rejection reason for filter_failed", () => {
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
            rejectionReason: "filter_failed",
          }}
        />,
      );

      // X mark visible for rejected status
      expect(screen.getByLabelText(/rejected/i)).toBeInTheDocument();
      // Rejection reason text mentions "filter"
      expect(screen.getByText(/filter/i)).toBeInTheDocument();
    });
  });
});
