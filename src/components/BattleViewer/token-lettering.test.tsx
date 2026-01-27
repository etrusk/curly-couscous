/**
 * Tests for Token component letter visibility.
 * Verifies that letters use correct CSS variables and have proper structure.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Token } from "./Token";

describe("Token - Letter Visibility", () => {
  it("should use text-on-faction CSS variable for letter fill", () => {
    const { container } = render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
      />
    );

    // Find the <text> element (letter)
    const textElement = container.querySelector("text");
    expect(textElement).toBeInTheDocument();

    // Should use var(--text-on-faction) for fill
    const fillValue = textElement?.getAttribute("fill");
    expect(fillValue).toContain("var(--text-on-faction)");
  });

  it("should have correct structure for letter on friendly faction", () => {
    const { container } = render(
      <Token
        id="char-1"
        faction="friendly"
        hp={100}
        maxHp={100}
        slotPosition={1}
      />
    );

    const textElement = container.querySelector("text");
    expect(textElement).toBeInTheDocument();

    // Should show letter "A" for slotPosition 1
    expect(textElement?.textContent).toBe("A");

    // Should have class containing "letter"
    expect((textElement?.className as SVGAnimatedString | undefined)?.baseVal).toContain("letter");

    // Should be centered
    expect(textElement?.getAttribute("text-anchor")).toBe("middle");
    expect(textElement?.getAttribute("dominant-baseline")).toBe("central");
  });

  it("should have correct structure for letter on enemy faction", () => {
    const { container } = render(
      <Token
        id="char-2"
        faction="enemy"
        hp={100}
        maxHp={100}
        slotPosition={2}
      />
    );

    const textElement = container.querySelector("text");
    expect(textElement).toBeInTheDocument();

    // Should show letter "B" for slotPosition 2
    expect(textElement?.textContent).toBe("B");

    // Should have class containing "letter"
    expect((textElement?.className as SVGAnimatedString | undefined)?.baseVal).toContain("letter");

    // Should be centered (same structure as friendly)
    expect(textElement?.getAttribute("text-anchor")).toBe("middle");
    expect(textElement?.getAttribute("dominant-baseline")).toBe("central");
  });
});
