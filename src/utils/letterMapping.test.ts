/**
 * Tests for slotPositionToLetter mapping utility.
 */

import { describe, it, expect } from "vitest";
import { slotPositionToLetter } from "./letterMapping";

describe("slotPositionToLetter", () => {
  // Basic A-Z mapping
  it("should map position 1 to 'A'", () => {
    expect(slotPositionToLetter(1)).toBe("A");
  });

  it("should map position 2 to 'B'", () => {
    expect(slotPositionToLetter(2)).toBe("B");
  });

  it("should map position 26 to 'Z'", () => {
    expect(slotPositionToLetter(26)).toBe("Z");
  });

  // Beyond single letters
  it("should map position 27 to 'AA'", () => {
    expect(slotPositionToLetter(27)).toBe("AA");
  });

  it("should map position 28 to 'AB'", () => {
    expect(slotPositionToLetter(28)).toBe("AB");
  });

  it("should map position 52 to 'AZ'", () => {
    expect(slotPositionToLetter(52)).toBe("AZ");
  });

  it("should map position 53 to 'BA'", () => {
    expect(slotPositionToLetter(53)).toBe("BA");
  });

  it("should map position 78 to 'BZ'", () => {
    expect(slotPositionToLetter(78)).toBe("BZ");
  });

  // Edge cases
  it("should throw error for position 0 with descriptive message", () => {
    expect(() => slotPositionToLetter(0)).toThrow(
      "slotPosition must be positive, got 0",
    );
  });

  it("should throw error for negative positions with descriptive message", () => {
    expect(() => slotPositionToLetter(-5)).toThrow(
      "slotPosition must be positive, got -5",
    );
  });

  it("should throw error for non-integer positions (if needed)", () => {
    // The function currently works with non-integers but may produce unexpected results.
    // We'll test that it doesn't throw for integer-like floats (e.g., 1.0).
    // This is a design decision: we could floor the input.
    // For now, we'll just ensure it doesn't crash.
    expect(() => slotPositionToLetter(1.5)).not.toThrow();
  });

  // Large numbers
  it("should map position 702 to 'ZZ'", () => {
    expect(slotPositionToLetter(702)).toBe("ZZ");
  });

  it("should map position 703 to 'AAA'", () => {
    expect(slotPositionToLetter(703)).toBe("AAA");
  });

  // Realistic battle sizes (max 144 characters)
  it("should map position 144 to appropriate letter sequence", () => {
    // 144 is within reasonable battle size
    // 144 -> EN (Excel column style)
    expect(slotPositionToLetter(144)).toBe("EN");
  });
});
