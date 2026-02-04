/**
 * Unit tests for hex grid utilities.
 * Tests cover hex distance, neighbors, validation, pixel conversion, and enumeration.
 */

import { describe, it, expect } from "vitest";
import {
  hexDistance,
  getHexNeighbors,
  isValidHex,
  hexToPixel,
  pixelToHex,
  generateAllHexes,
  HEX_DIRECTIONS,
  hexVertices,
  computeHexViewBox,
} from "./hex";
import { Position } from "./types";

describe("hexDistance", () => {
  it("same hex returns 0", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    expect(hexDistance({ q: 3, r: -2 }, { q: 3, r: -2 })).toBe(0);
  });

  it("adjacent hexes return 1", () => {
    const center: Position = { q: 0, r: 0 };

    expect(hexDistance(center, { q: 1, r: 0 })).toBe(1);
    expect(hexDistance(center, { q: -1, r: 0 })).toBe(1);
    expect(hexDistance(center, { q: 0, r: 1 })).toBe(1);
    expect(hexDistance(center, { q: 0, r: -1 })).toBe(1);
    expect(hexDistance(center, { q: 1, r: -1 })).toBe(1);
    expect(hexDistance(center, { q: -1, r: 1 })).toBe(1);
  });

  it("known multi-step distances", () => {
    const center: Position = { q: 0, r: 0 };

    expect(hexDistance(center, { q: 3, r: 0 })).toBe(3);
    expect(hexDistance(center, { q: 0, r: 4 })).toBe(4);
    expect(hexDistance(center, { q: 2, r: -2 })).toBe(2);
    expect(hexDistance(center, { q: 2, r: 1 })).toBe(3);
    expect(hexDistance(center, { q: 5, r: -5 })).toBe(5);
    expect(hexDistance({ q: -5, r: 0 }, { q: 5, r: 0 })).toBe(10);
  });

  it("symmetry", () => {
    const pairs: [Position, Position][] = [
      [
        { q: 0, r: 0 },
        { q: 3, r: 1 },
      ],
      [
        { q: -2, r: 3 },
        { q: 1, r: -1 },
      ],
      [
        { q: 5, r: 0 },
        { q: -5, r: 5 },
      ],
      [
        { q: 2, r: -2 },
        { q: -1, r: 1 },
      ],
    ];

    for (const [a, b] of pairs) {
      expect(hexDistance(a, b)).toBe(hexDistance(b, a));
    }
  });

  it("triangle inequality", () => {
    const a: Position = { q: 0, r: 0 };
    const b: Position = { q: 2, r: 1 };
    const c: Position = { q: -1, r: 3 };

    const distAC = hexDistance(a, c);
    const distAB = hexDistance(a, b);
    const distBC = hexDistance(b, c);

    expect(distAC).toBeLessThanOrEqual(distAB + distBC);
  });
});

describe("getHexNeighbors", () => {
  it("center hex has 6 neighbors", () => {
    const neighbors = getHexNeighbors({ q: 0, r: 0 });

    expect(neighbors).toHaveLength(6);

    // Verify all are valid hexes
    for (const neighbor of neighbors) {
      expect(isValidHex(neighbor)).toBe(true);
    }

    // Check specific neighbors
    const neighborSet = new Set(neighbors.map((pos) => `${pos.q},${pos.r}`));
    expect(neighborSet.has("1,0")).toBe(true);
    expect(neighborSet.has("-1,0")).toBe(true);
    expect(neighborSet.has("0,1")).toBe(true);
    expect(neighborSet.has("0,-1")).toBe(true);
    expect(neighborSet.has("1,-1")).toBe(true);
    expect(neighborSet.has("-1,1")).toBe(true);

    // No duplicates
    expect(neighborSet.size).toBe(6);
  });

  it("edge hex has fewer valid neighbors", () => {
    const neighbors = getHexNeighbors({ q: 5, r: 0 });

    expect(neighbors.length).toBeLessThan(6);

    // All returned neighbors must be valid
    for (const neighbor of neighbors) {
      expect(isValidHex(neighbor, 5)).toBe(true);
    }

    // Should not contain invalid neighbors
    const neighborSet = new Set(neighbors.map((pos) => `${pos.q},${pos.r}`));
    expect(neighborSet.has("6,0")).toBe(false);
    expect(neighborSet.has("6,-1")).toBe(false);

    // Should contain valid neighbors
    expect(neighborSet.has("4,0")).toBe(true);
    expect(neighborSet.has("5,-1")).toBe(true);
    expect(neighborSet.has("4,1")).toBe(true);
  });

  it("vertex hex (corner of hex boundary)", () => {
    const neighbors = getHexNeighbors({ q: 5, r: -5 });

    expect(neighbors).toHaveLength(3);

    // All must be valid
    for (const neighbor of neighbors) {
      expect(isValidHex(neighbor)).toBe(true);
    }
  });

  it("mid-edge hex", () => {
    const neighbors = getHexNeighbors({ q: 3, r: 2 });

    expect(neighbors.length).toBeGreaterThanOrEqual(3);
    expect(neighbors.length).toBeLessThanOrEqual(5);

    // All must be valid
    for (const neighbor of neighbors) {
      expect(isValidHex(neighbor)).toBe(true);
    }
  });
});

describe("isValidHex", () => {
  it("all 91 hexes for radius 5 are valid", () => {
    let validCount = 0;

    for (let q = -5; q <= 5; q++) {
      for (let r = -5; r <= 5; r++) {
        if (isValidHex({ q, r }, 5)) {
          validCount++;
        }
      }
    }

    expect(validCount).toBe(91);
    expect(isValidHex({ q: 0, r: 0 })).toBe(true);
    expect(isValidHex({ q: 5, r: 0 })).toBe(true);
    expect(isValidHex({ q: -5, r: 5 })).toBe(true);
  });

  it("positions outside radius 5 are invalid", () => {
    expect(isValidHex({ q: 6, r: 0 })).toBe(false);
    expect(isValidHex({ q: 3, r: 3 })).toBe(false);
    expect(isValidHex({ q: 0, r: 6 })).toBe(false);
    expect(isValidHex({ q: -3, r: -3 })).toBe(false);
    expect(isValidHex({ q: -6, r: 0 })).toBe(false);
  });

  it("boundary positions (exactly at radius)", () => {
    expect(isValidHex({ q: 5, r: 0 })).toBe(true);
    expect(isValidHex({ q: 0, r: 5 })).toBe(true);
    expect(isValidHex({ q: -5, r: 5 })).toBe(true);
    expect(isValidHex({ q: -5, r: 0 })).toBe(true);
    expect(isValidHex({ q: 0, r: -5 })).toBe(true);
    expect(isValidHex({ q: 5, r: -5 })).toBe(true);
  });

  it("default radius uses HEX_RADIUS constant", () => {
    expect(isValidHex({ q: 5, r: 0 })).toBe(true);
    expect(isValidHex({ q: 6, r: 0 })).toBe(false);
  });
});

describe("hexToPixel", () => {
  it("center hex maps to origin", () => {
    const pixel = hexToPixel({ q: 0, r: 0 }, 30);
    expect(pixel.x).toBe(0);
    expect(pixel.y).toBe(0);
  });

  it("flat-top formula correctness", () => {
    const sqrt3 = Math.sqrt(3);

    const pixel1 = hexToPixel({ q: 1, r: 0 }, 30);
    expect(pixel1.x).toBeCloseTo(45, 1);
    expect(pixel1.y).toBeCloseTo((30 * sqrt3) / 2, 1);

    const pixel2 = hexToPixel({ q: 0, r: 1 }, 30);
    expect(pixel2.x).toBeCloseTo(0, 1);
    expect(pixel2.y).toBeCloseTo(30 * sqrt3, 1);

    const pixel3 = hexToPixel({ q: 1, r: -1 }, 30);
    expect(pixel3.x).toBeCloseTo(45, 1);
    expect(pixel3.y).toBeCloseTo((-30 * sqrt3) / 2, 1);

    const pixel4 = hexToPixel({ q: -1, r: 0 }, 30);
    expect(pixel4.x).toBeCloseTo(-45, 1);
    expect(pixel4.y).toBeCloseTo((-30 * sqrt3) / 2, 1);
  });

  it("adjacent hexes are properly spaced", () => {
    const sqrt3 = Math.sqrt(3);
    const center = hexToPixel({ q: 0, r: 0 }, 30);

    const neighbors = [
      { q: 1, r: 0 },
      { q: -1, r: 0 },
      { q: 0, r: 1 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
      { q: -1, r: 1 },
    ];

    for (const neighbor of neighbors) {
      const pixel = hexToPixel(neighbor, 30);
      const dx = pixel.x - center.x;
      const dy = pixel.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      expect(distance).toBeCloseTo(30 * sqrt3, 1);
    }
  });
});

describe("pixelToHex", () => {
  it("center of hex returns correct coordinates", () => {
    const testHex: Position = { q: 2, r: -1 };
    const pixel = hexToPixel(testHex, 30);
    const result = pixelToHex(pixel.x, pixel.y, 30);

    expect(result.q).toBe(testHex.q);
    expect(result.r).toBe(testHex.r);
  });

  it("round-trip for all 91 hexes", () => {
    const allHexes = generateAllHexes(5);

    for (const hex of allHexes) {
      const pixel = hexToPixel(hex, 30);
      const result = pixelToHex(pixel.x, pixel.y, 30);

      expect(result.q).toBe(hex.q);
      expect(result.r).toBe(hex.r);
    }
  });

  it("points near hex edge round to correct hex", () => {
    const center: Position = { q: 0, r: 0 };
    const neighbor: Position = { q: 1, r: 0 };

    const centerPixel = hexToPixel(center, 30);
    const neighborPixel = hexToPixel(neighbor, 30);

    // 40% toward neighbor should still resolve to center
    const point40 = {
      x: centerPixel.x + 0.4 * (neighborPixel.x - centerPixel.x),
      y: centerPixel.y + 0.4 * (neighborPixel.y - centerPixel.y),
    };
    const result40 = pixelToHex(point40.x, point40.y, 30);
    expect(result40.q).toBe(center.q);
    expect(result40.r).toBe(center.r);

    // 80% toward neighbor should resolve to neighbor
    const point80 = {
      x: centerPixel.x + 0.8 * (neighborPixel.x - centerPixel.x),
      y: centerPixel.y + 0.8 * (neighborPixel.y - centerPixel.y),
    };
    const result80 = pixelToHex(point80.x, point80.y, 30);
    expect(result80.q).toBe(neighbor.q);
    expect(result80.r).toBe(neighbor.r);
  });
});

describe("generateAllHexes", () => {
  it("returns exactly 91 hexes for radius 5", () => {
    const hexes = generateAllHexes(5);

    expect(hexes).toHaveLength(91);

    // All must be valid
    for (const hex of hexes) {
      expect(isValidHex(hex, 5)).toBe(true);
    }

    // No duplicates
    const hexSet = new Set(hexes.map((h) => `${h.q},${h.r}`));
    expect(hexSet.size).toBe(91);

    // Includes center
    expect(hexSet.has("0,0")).toBe(true);

    // Includes all 6 boundary vertices
    expect(hexSet.has("5,0")).toBe(true);
    expect(hexSet.has("0,5")).toBe(true);
    expect(hexSet.has("-5,5")).toBe(true);
    expect(hexSet.has("-5,0")).toBe(true);
    expect(hexSet.has("0,-5")).toBe(true);
    expect(hexSet.has("5,-5")).toBe(true);
  });

  it("deterministic ordering", () => {
    const hexes1 = generateAllHexes(5);
    const hexes2 = generateAllHexes(5);

    expect(hexes1).toEqual(hexes2);
  });

  it("smaller radius works correctly", () => {
    const hexes0 = generateAllHexes(0);
    expect(hexes0).toHaveLength(1);
    expect(hexes0[0]).toEqual({ q: 0, r: 0 });

    const hexes1 = generateAllHexes(1);
    expect(hexes1).toHaveLength(7);

    const hexes2 = generateAllHexes(2);
    expect(hexes2).toHaveLength(19);
  });
});

describe("HEX_DIRECTIONS", () => {
  it("has exactly 6 directions", () => {
    expect(HEX_DIRECTIONS).toHaveLength(6);
  });

  it("all directions are distance 1 from origin", () => {
    for (const dir of HEX_DIRECTIONS) {
      expect(hexDistance({ q: 0, r: 0 }, dir)).toBe(1);
    }
  });

  it("no duplicates", () => {
    const dirSet = new Set(HEX_DIRECTIONS.map((d) => `${d.q},${d.r}`));
    expect(dirSet.size).toBe(6);
  });
});

describe("computeHexViewBox", () => {
  it("returns object with viewBox, width, and height", () => {
    const result = computeHexViewBox(30);

    // Should have all three properties
    expect(result).toHaveProperty("viewBox");
    expect(result).toHaveProperty("width");
    expect(result).toHaveProperty("height");

    // viewBox should be a string with 4 space-separated numbers
    expect(typeof result.viewBox).toBe("string");
    const viewBoxParts = result.viewBox.trim().split(/\s+/);
    expect(viewBoxParts).toHaveLength(4);
    for (const part of viewBoxParts) {
      expect(Number.isFinite(parseFloat(part))).toBe(true);
    }

    // width and height should be positive numbers
    expect(typeof result.width).toBe("number");
    expect(typeof result.height).toBe("number");
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);

    // width and height should match the last two numbers in viewBox
    const [, , vbWidth, vbHeight] = viewBoxParts.map(parseFloat);
    expect(result.width).toBe(vbWidth);
    expect(result.height).toBe(vbHeight);
  });

  it("default radius covers all 91 hexes with margin", () => {
    const result = computeHexViewBox(30);
    const allHexes = generateAllHexes(5);

    // Parse viewBox
    const [minX, minY, width, height] = result.viewBox
      .trim()
      .split(/\s+/)
      .map(parseFloat);
    const maxX = minX + width;
    const maxY = minY + height;

    // Check that all hex vertices fall within viewBox bounds
    for (const hex of allHexes) {
      const center = hexToPixel(hex, 30);
      const vertices = hexVertices(center, 30);

      for (const vertex of vertices) {
        expect(vertex.x).toBeGreaterThanOrEqual(minX);
        expect(vertex.x).toBeLessThanOrEqual(maxX);
        expect(vertex.y).toBeGreaterThanOrEqual(minY);
        expect(vertex.y).toBeLessThanOrEqual(maxY);
      }
    }

    // Verify there's margin (at least 5px beyond outermost vertices)
    let outerMinX = Infinity,
      outerMaxX = -Infinity;
    let outerMinY = Infinity,
      outerMaxY = -Infinity;

    for (const hex of allHexes) {
      const center = hexToPixel(hex, 30);
      const vertices = hexVertices(center, 30);
      for (const v of vertices) {
        outerMinX = Math.min(outerMinX, v.x);
        outerMaxX = Math.max(outerMaxX, v.x);
        outerMinY = Math.min(outerMinY, v.y);
        outerMaxY = Math.max(outerMaxY, v.y);
      }
    }

    // ViewBox bounds should be at least 5px beyond the actual vertices
    expect(minX).toBeLessThanOrEqual(outerMinX - 5);
    expect(maxX).toBeGreaterThanOrEqual(outerMaxX + 5);
    expect(minY).toBeLessThanOrEqual(outerMinY - 5);
    expect(maxY).toBeGreaterThanOrEqual(outerMaxY + 5);
  });

  it("scales proportionally with hexSize", () => {
    const result30 = computeHexViewBox(30);
    const result60 = computeHexViewBox(60);

    // Width and height should approximately double
    // Note: margin is constant (10px), so the scaling isn't perfectly 2x
    // For hexSize=30, typical width ~530, for hexSize=60, width ~1040
    // Ratio should be close to 2.0 (within 5%)
    const widthRatio = result60.width / result30.width;
    const heightRatio = result60.height / result30.height;
    expect(widthRatio).toBeGreaterThan(1.95);
    expect(widthRatio).toBeLessThan(2.05);
    expect(heightRatio).toBeGreaterThan(1.95);
    expect(heightRatio).toBeLessThan(2.05);
  });

  it("handles radius 0 (single hex) edge case", () => {
    const result = computeHexViewBox(30, 0);

    // Parse viewBox
    const [minX, minY, width, height] = result.viewBox
      .trim()
      .split(/\s+/)
      .map(parseFloat);

    // All values should be finite
    expect(Number.isFinite(minX)).toBe(true);
    expect(Number.isFinite(minY)).toBe(true);
    expect(Number.isFinite(width)).toBe(true);
    expect(Number.isFinite(height)).toBe(true);

    // Width should be approximately hex width (2 * 30) + margins (2 * 10) = 80
    expect(width).toBeCloseTo(80, 0);

    // Height should be approximately hex height (sqrt(3) * 30) + margins (2 * 10) ≈ 72
    const expectedHeight = Math.sqrt(3) * 30 + 2 * 10;
    expect(height).toBeCloseTo(expectedHeight, 0);
  });

  it("viewBox is symmetric around origin", () => {
    const result = computeHexViewBox(30);

    // Parse viewBox
    const [minX, minY, width, height] = result.viewBox
      .trim()
      .split(/\s+/)
      .map(parseFloat);

    // Center should be approximately at origin (0, 0)
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    expect(centerX).toBeCloseTo(0, 1);
    expect(centerY).toBeCloseTo(0, 1);
  });
});
