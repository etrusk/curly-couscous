/**
 * Hexagonal grid utilities for flat-top hexagons using axial coordinates.
 * Provides hex math, validation, and pixel conversion functions.
 */

// ============================================================================
// Types
// ============================================================================

export interface HexCoordinate {
  q: number;
  r: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Radius of the hexagonal map (hexes per side).
 * A radius of 5 produces a map with 91 total hexes.
 */
export const HEX_RADIUS = 5;

/**
 * Six hex neighbor directions in axial coordinates.
 * Flat-top hexagon neighbors: E, W, SE, NW, NE, SW
 */
export const HEX_DIRECTIONS: readonly HexCoordinate[] = [
  { q: 1, r: 0 }, // East
  { q: -1, r: 0 }, // West
  { q: 0, r: 1 }, // Southeast
  { q: 0, r: -1 }, // Northwest
  { q: 1, r: -1 }, // Northeast
  { q: -1, r: 1 }, // Southwest
];

// ============================================================================
// Core Hex Math
// ============================================================================

/**
 * Calculate distance between two hexes using the cube coordinate method.
 *
 * Formula: (|dq| + |dr| + |dq+dr|) / 2
 * This is equivalent to: max(|dq|, |dr|, |dq+dr|)
 *
 * @param a - First hex coordinate
 * @param b - Second hex coordinate
 * @returns Distance in hexes (always integer)
 */
export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/**
 * Get all valid hex neighbors of a position.
 * Filters neighbors by hex radius to exclude those outside the map.
 *
 * @param hex - Center hex position
 * @param radius - Map radius (default: HEX_RADIUS)
 * @returns Array of valid neighboring hex coordinates (0-6 neighbors)
 */
export function getHexNeighbors(
  hex: HexCoordinate,
  radius: number = HEX_RADIUS,
): HexCoordinate[] {
  const neighbors: HexCoordinate[] = [];

  for (const dir of HEX_DIRECTIONS) {
    const neighbor: HexCoordinate = {
      q: hex.q + dir.q,
      r: hex.r + dir.r,
    };

    if (isValidHex(neighbor, radius)) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

/**
 * Check if a hex coordinate is valid within the map radius.
 * A hex is valid if it lies within the hexagonal boundary.
 *
 * Formula: max(|q|, |r|, |q+r|) <= radius
 *
 * @param hex - Hex coordinate to validate
 * @param radius - Map radius (default: HEX_RADIUS)
 * @returns True if hex is within the valid hexagonal map
 */
export function isValidHex(
  hex: HexCoordinate,
  radius: number = HEX_RADIUS,
): boolean {
  return (
    Math.max(Math.abs(hex.q), Math.abs(hex.r), Math.abs(hex.q + hex.r)) <=
    radius
  );
}

/**
 * Generate all valid hex coordinates within a radius.
 * Returns hexes sorted by r then q for deterministic ordering.
 *
 * @param radius - Map radius (default: HEX_RADIUS)
 * @returns Array of all valid hex coordinates (91 hexes for radius 5)
 */
export function generateAllHexes(radius: number = HEX_RADIUS): HexCoordinate[] {
  const hexes: HexCoordinate[] = [];

  // Iterate over all possible q values
  for (let q = -radius; q <= radius; q++) {
    // For each q, determine valid r range
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);

    for (let r = r1; r <= r2; r++) {
      // Normalize -0 to 0 to avoid test failures
      hexes.push({
        q: q === 0 ? 0 : q,
        r: r === 0 ? 0 : r,
      });
    }
  }

  // Sort by r then q for deterministic ordering
  hexes.sort((a, b) => {
    if (a.r !== b.r) return a.r - b.r;
    return a.q - b.q;
  });

  return hexes;
}

/**
 * Convert hex position to a string key for Map/Set lookups.
 * Format: "q,r" (comma-separated)
 *
 * @param hex - Hex coordinate
 * @returns String key
 */
export function positionKey(hex: HexCoordinate): string {
  return `${hex.q},${hex.r}`;
}

// ============================================================================
// Pixel Conversion (Flat-Top Orientation)
// ============================================================================

/**
 * Convert hex axial coordinates to pixel coordinates.
 * Uses flat-top hexagon orientation.
 *
 * Formulas:
 *   x = hexSize * (3/2) * q
 *   y = hexSize * (sqrt(3)/2 * q + sqrt(3) * r)
 *
 * @param hex - Hex coordinate
 * @param hexSize - Size of hexagon (distance from center to vertex)
 * @returns Pixel coordinates {x, y} of hex center
 */
export function hexToPixel(
  hex: HexCoordinate,
  hexSize: number,
): { x: number; y: number } {
  const x = hexSize * (3 / 2) * hex.q;
  const y = hexSize * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r);

  return { x, y };
}

/**
 * Convert pixel coordinates to hex axial coordinates using cube rounding.
 * Uses flat-top hexagon orientation.
 *
 * Algorithm:
 * 1. Convert pixel to fractional axial coordinates
 * 2. Convert axial to cube coordinates (q, r, s where s = -q-r)
 * 3. Round each cube coordinate to nearest integer
 * 4. Fix the component with largest rounding error to maintain q+r+s=0
 * 5. Convert cube back to axial
 *
 * @param px - Pixel x coordinate
 * @param py - Pixel y coordinate
 * @param hexSize - Size of hexagon (distance from center to vertex)
 * @returns Hex coordinate
 */
export function pixelToHex(
  px: number,
  py: number,
  hexSize: number,
): HexCoordinate {
  // Convert pixel to fractional axial coordinates
  const q = ((2 / 3) * px) / hexSize;
  const r = ((-1 / 3) * px + (Math.sqrt(3) / 3) * py) / hexSize;

  // Convert axial to cube coordinates
  const s = -q - r;

  // Round each cube coordinate
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  // Calculate rounding errors
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  // Fix the component with largest rounding error
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  // Convert cube back to axial (q, r)
  // Normalize -0 to 0 to avoid test failures
  return { q: rq === 0 ? 0 : rq, r: rr === 0 ? 0 : rr };
}

// ============================================================================
// Hex Polygon Generation
// ============================================================================

/**
 * Generate the 6 vertex coordinates for a flat-top hexagon.
 * Vertices are returned in order for polygon rendering.
 *
 * @param center - Pixel coordinates of hex center
 * @param hexSize - Size of hexagon (distance from center to vertex)
 * @returns Array of 6 vertex coordinates as {x, y} objects
 */
export function hexVertices(
  center: { x: number; y: number },
  hexSize: number,
): Array<{ x: number; y: number }> {
  const vertices: Array<{ x: number; y: number }> = [];

  // Flat-top hexagon vertices at angles: 0°, 60°, 120°, 180°, 240°, 300°
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;

    vertices.push({
      x: center.x + hexSize * Math.cos(angleRad),
      y: center.y + hexSize * Math.sin(angleRad),
    });
  }

  return vertices;
}
