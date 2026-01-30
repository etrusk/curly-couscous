/**
 * Tests for InventoryPanel component.
 * Following TDD workflow - these tests are written before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InventoryPanel } from "./InventoryPanel";
import { useGameStore } from "../../stores/gameStore";
import { createCharacter, createSkill } from "../../engine/game-test-helpers";
import { SKILL_REGISTRY } from "../../engine/skill-registry";
import { act } from "react";

describe("InventoryPanel", () => {
  beforeEach(() => {
    useGameStore.getState().actions.reset();
    useGameStore.getState().actions.selectCharacter(null);
  });

  describe("Header and Layout", () => {
    it("renders inventory header", () => {
      render(<InventoryPanel />);

      const heading = screen.getByRole("heading", { name: /inventory/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");
    });

    it("has accessible region role", () => {
      render(<InventoryPanel />);

      const region = screen.getByRole("region", { name: /inventory/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe("Placeholder States", () => {
    it("shows placeholder when no character selected", () => {
      render(<InventoryPanel />);

      expect(
        screen.getByText(/select a character to view available skills/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/light punch/i)).not.toBeInTheDocument();
    });
  });

  describe("Skill Display", () => {
    it("shows skills when friendly selected", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(screen.getByText(/^move$/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
    });

    it("shows skills when enemy selected", () => {
      const moveSkill = createSkill({
        id: "move-towards",
        name: "Move",
        mode: "towards",
      });
      const enemy = createCharacter({
        id: "enemy1",
        faction: "enemy",
        skills: [moveSkill],
      });
      useGameStore.getState().actions.initBattle([enemy]);
      useGameStore.getState().actions.selectCharacter("enemy1");

      render(<InventoryPanel />);

      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(screen.getByText(/heavy punch/i)).toBeInTheDocument();
      expect(screen.getByText(/^move$/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /assign light punch/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/assigned/i)).toBeInTheDocument();
    });

    it("no innate badge displayed for any skill", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.queryByText(/innate/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/innate skill/i)).not.toBeInTheDocument();
    });

    it("displays skill stats tick cost", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Two skills have tick cost 1 (Light Punch and Move)
      const tickCost1Elements = screen.getAllByText(/tick cost: 1/i);
      expect(tickCost1Elements.length).toBeGreaterThanOrEqual(1);

      // One skill has tick cost 2 (Heavy Punch)
      expect(screen.getByText(/tick cost: 2/i)).toBeInTheDocument();
    });

    it("displays skill stats range", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Two skills have range 1 (Light Punch and Move)
      const range1Elements = screen.getAllByText(/range: 1/i);
      expect(range1Elements.length).toBeGreaterThanOrEqual(1);

      // One skill has range 2 (Heavy Punch)
      expect(screen.getByText(/range: 2/i)).toBeInTheDocument();
    });

    it("displays skill stats damage", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.getByText(/damage: 10/i)).toBeInTheDocument();
      expect(screen.getByText(/damage: 25/i)).toBeInTheDocument();
    });

    it("displays skill mode for move", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      expect(screen.getByText(/mode: towards/i)).toBeInTheDocument();
    });

    it("displays skills from registry not hardcoded", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Verify all skill names from SKILL_REGISTRY appear in the document
      SKILL_REGISTRY.forEach((skill) => {
        expect(
          screen.getByText(new RegExp(skill.name, "i")),
        ).toBeInTheDocument();
      });

      // Total count matches registry length (all skills are present)
      const skillNameCount = SKILL_REGISTRY.filter((skill) => {
        return screen.queryByText(new RegExp(skill.name, "i")) !== null;
      }).length;

      expect(skillNameCount).toBe(SKILL_REGISTRY.length);
    });
  });

  describe("Selection Transitions", () => {
    it("transitions from placeholder to skills on selection", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);

      render(<InventoryPanel />);

      // Initially shows placeholder
      expect(
        screen.getByText(/select a character to view available skills/i),
      ).toBeInTheDocument();

      // Select character
      act(() => {
        useGameStore.getState().actions.selectCharacter("char1");
      });

      // Now shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
    });

    it("transitions from skills to placeholder on deselection", () => {
      const friendly = createCharacter({ id: "char1" });
      useGameStore.getState().actions.initBattle([friendly]);
      useGameStore.getState().actions.selectCharacter("char1");

      render(<InventoryPanel />);

      // Initially shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();

      // Deselect character
      act(() => {
        useGameStore.getState().actions.selectCharacter(null);
      });

      // Now shows placeholder
      expect(
        screen.getByText(/select a character to view available skills/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/light punch/i)).not.toBeInTheDocument();
    });

    it("transitions between enemy and friendly shows skills for both", () => {
      const friendly = createCharacter({ id: "char1" });
      const enemy = createCharacter({ id: "enemy1", faction: "enemy" });
      useGameStore.getState().actions.initBattle([friendly, enemy]);
      useGameStore.getState().actions.selectCharacter("enemy1");

      render(<InventoryPanel />);

      // Enemy selected - shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();

      // Switch to friendly
      act(() => {
        useGameStore.getState().actions.selectCharacter("char1");
      });

      // Friendly selected - shows skills
      expect(screen.getByText(/light punch/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/select a character to view available skills/i),
      ).not.toBeInTheDocument();
    });
  });
});
