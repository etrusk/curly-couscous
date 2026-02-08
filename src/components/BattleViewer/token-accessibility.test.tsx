/**
 * Accessibility tests for Token component HP bar ARIA meter semantics.
 * Extracted from token-visual.test.tsx to stay under 400-line file limit.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Token } from "./Token";

describe("Token HP Bar Accessibility", () => {
  it("has role='meter' on the HP bar group element", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toBeInTheDocument();

    // The meter element should contain the HP bar fill rect
    const healthBar = screen.getByTestId("health-bar-char-1");
    expect(meter).toContainElement(healthBar);
  });

  it("has aria-label='HP' on the meter element", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-label", "HP");
  });

  it("has aria-valuemin='0' on the meter element", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={50}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-valuemin", "0");
  });

  it("has aria-valuemax matching maxHp prop", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={80}
        maxHp={150}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-valuemax", "150");
  });

  it("has aria-valuenow matching hp prop", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={63}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-valuenow", "63");
  });

  it("clamps aria-valuenow to 0 when hp is zero", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={0}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-valuenow", "0");
  });

  it("clamps aria-valuenow to 0 when hp is negative (overkill)", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={-10}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-valuenow", "0");
  });

  it("has aria-valuetext in '{hp} of {maxHp} HP' format", () => {
    render(
      <Token
        id="char-1"
        faction="friendly"
        hp={75}
        maxHp={100}
        slotPosition={1}
        cx={0}
        cy={0}
      />,
    );

    const token = screen.getByTestId("token-char-1");
    const meter = token.querySelector('[role="meter"]');
    expect(meter).toHaveAttribute("aria-valuetext", "75 of 100 HP");
  });
});
