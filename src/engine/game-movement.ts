/**
 * Movement destination calculation with tiebreaking rules.
 * Used by the decision phase to compute where a character should move.
 */

import { Character, Position } from "./types";
import { findPath, positionKey } from "./pathfinding";
import { GRID_SIZE } from "../stores/gameStore-constants";

/**
 * Compute move destination with tiebreaking rules for 8-direction movement.
 *
 * For "towards" mode: Uses A* pathfinding to navigate around obstacles (other characters).
 * For "away" mode: Uses tiebreaking hierarchy for single-step maximization.
 *
 * Tiebreaking hierarchy (when multiple cells equally optimal):
 * 1. For "towards": minimize resulting Chebyshev distance to target
 *    For "away": maximize resulting Chebyshev distance from target
 * 2. For "towards": minimize resulting |dx|, then |dy|
 *    For "away": maximize resulting |dx|, then maximize |dy|
 * 3. Then lower Y coordinate of candidate cell
 * 4. Then lower X coordinate of candidate cell
 *
 * @param mover - Character that is moving
 * @param target - Target character to move towards/away from
 * @param mode - Movement mode ('towards' or 'away')
 * @param allCharacters - All characters on the battlefield
 * @returns Destination position (1 cell away from mover)
 */
export function computeMoveDestination(
  mover: Character,
  target: Character,
  mode: "towards" | "away",
  allCharacters: Character[],
): Position {
  const dx = target.position.x - mover.position.x;
  const dy = target.position.y - mover.position.y;

  // Already at target position (dx === dy === 0)
  if (dx === 0 && dy === 0) {
    return mover.position;
  }

  // For "towards" mode, use A* pathfinding
  if (mode === "towards") {
    // Build obstacle set from all characters except mover and target
    // (target position should be reachable for melee combat)
    const obstacles = buildObstacleSet(allCharacters, mover.id, target.id);

    // Find path using A* with current grid size
    const path = findPath(
      mover.position,
      target.position,
      GRID_SIZE,
      GRID_SIZE,
      obstacles,
    );

    // If path found and has at least 2 positions (start + first step)
    if (path.length > 1) {
      return path[1]!; // First step from path (path[0] is current position)
    }

    // No path found or already at target - stay in place
    return mover.position;
  }

  // For "away" mode, use existing tiebreaking logic
  const candidates = generateValidCandidates(mover, allCharacters, mode);

  // If no valid candidates (should never happen unless mover is outside grid)
  if (candidates.length === 0) {
    return mover.position;
  }

  // Evaluate each candidate using tiebreaking hierarchy
  return selectBestCandidate(candidates, target, mode, allCharacters, mover.id);
}

/**
 * Build set of obstacle positions from characters, excluding specified IDs.
 * Typically excludes mover and target to allow pathfinding to reach the target.
 */
function buildObstacleSet(
  characters: Character[],
  ...excludeIds: string[]
): Set<string> {
  const excludeSet = new Set(excludeIds);
  const obstacles = new Set<string>();
  for (const c of characters) {
    if (!excludeSet.has(c.id)) {
      obstacles.add(positionKey(c.position));
    }
  }
  return obstacles;
}

/**
 * Count escape routes (unblocked adjacent cells) from a position.
 * Used for away-mode scoring to prefer positions with more mobility.
 */
function countEscapeRoutes(
  position: Position,
  gridWidth: number,
  gridHeight: number,
  obstacles: Set<string>,
): number {
  let count = 0;
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ];
  for (const dir of directions) {
    const nx = position.x + dir.x;
    const ny = position.y + dir.y;
    if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
      if (!obstacles.has(positionKey({ x: nx, y: ny }))) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Generate valid candidate positions for movement.
 */
export function generateValidCandidates(
  mover: Character,
  allCharacters: Character[],
  mode: "towards" | "away",
): Position[] {
  const candidates: Position[] = [];

  // All 8 directions
  const directions = [
    { x: 0, y: -1 }, // north
    { x: 0, y: 1 }, // south
    { x: 1, y: 0 }, // east
    { x: -1, y: 0 }, // west
    { x: 1, y: -1 }, // northeast
    { x: -1, y: -1 }, // northwest
    { x: 1, y: 1 }, // southeast
    { x: -1, y: 1 }, // southwest
  ];

  // Helper to check if a cell is occupied by another character
  const isOccupied = (pos: Position): boolean => {
    return allCharacters.some(
      (c) =>
        c.id !== mover.id && c.position.x === pos.x && c.position.y === pos.y,
    );
  };

  // Helper to check if a move is diagonal
  const isDiagonal = (dir: { x: number; y: number }): boolean => {
    return dir.x !== 0 && dir.y !== 0;
  };

  for (const dir of directions) {
    const candidate = {
      x: mover.position.x + dir.x,
      y: mover.position.y + dir.y,
    };

    // Only consider cells within grid bounds
    if (
      candidate.x >= 0 &&
      candidate.x < GRID_SIZE &&
      candidate.y >= 0 &&
      candidate.y < GRID_SIZE
    ) {
      // Filter out occupied diagonal cells
      if (isDiagonal(dir) && isOccupied(candidate)) {
        continue; // Skip occupied diagonal cells
      }
      candidates.push(candidate);
    }
  }

  // For "away" mode, also consider staying in place as an option
  if (mode === "away") {
    candidates.push(mover.position);
  }

  return candidates;
}

interface CandidateScore {
  distance: number;
  absDx: number;
  absDy: number;
  y: number;
  x: number;
  escapeRoutes: number; // Count of unblocked adjacent cells
}

/**
 * Calculate candidate score for tiebreaking comparison.
 */
export function calculateCandidateScore(
  candidate: Position,
  target: Position,
  obstacles?: Set<string>,
): CandidateScore {
  const resultDx = target.x - candidate.x;
  const resultDy = target.y - candidate.y;
  const distance = Math.max(Math.abs(resultDx), Math.abs(resultDy)); // Chebyshev distance

  const escapeRoutes = obstacles
    ? countEscapeRoutes(candidate, GRID_SIZE, GRID_SIZE, obstacles)
    : 8; // Default: assume open space when no obstacles provided

  return {
    distance,
    absDx: Math.abs(resultDx),
    absDy: Math.abs(resultDy),
    y: candidate.y,
    x: candidate.x,
    escapeRoutes,
  };
}

/**
 * Compare two candidates for "towards" mode.
 */
export function compareTowardsMode(
  candidateScore: CandidateScore,
  bestScore: CandidateScore,
): boolean {
  // Primary comparison: distance (minimize)
  if (candidateScore.distance < bestScore.distance) {
    return true;
  }
  if (candidateScore.distance > bestScore.distance) {
    return false;
  }

  // Secondary: absDx (minimize)
  if (candidateScore.absDx < bestScore.absDx) {
    return true;
  }
  if (candidateScore.absDx > bestScore.absDx) {
    return false;
  }

  // Tertiary: absDy (minimize)
  if (candidateScore.absDy < bestScore.absDy) {
    return true;
  }
  if (candidateScore.absDy > bestScore.absDy) {
    return false;
  }

  // Quaternary: y coordinate (minimize)
  if (candidateScore.y < bestScore.y) {
    return true;
  }
  if (candidateScore.y > bestScore.y) {
    return false;
  }

  // Quinary: x coordinate (minimize)
  if (candidateScore.x < bestScore.x) {
    return true;
  }

  return false;
}

/**
 * Compare two candidates for "away" mode.
 */
export function compareAwayMode(
  candidateScore: CandidateScore,
  bestScore: CandidateScore,
): boolean {
  // Primary comparison: multiplicative score (distance * escapeRoutes)
  const candidateComposite =
    candidateScore.distance * candidateScore.escapeRoutes;
  const bestComposite = bestScore.distance * bestScore.escapeRoutes;

  if (candidateComposite > bestComposite) {
    return true;
  }
  if (candidateComposite < bestComposite) {
    return false;
  }

  // Tiebreakers (when composite scores are equal):
  // Secondary: maximize distance (prefer farther from threat)
  if (candidateScore.distance > bestScore.distance) {
    return true;
  }
  if (candidateScore.distance < bestScore.distance) {
    return false;
  }

  // Tertiary: maximize absDx
  if (candidateScore.absDx > bestScore.absDx) {
    return true;
  }
  if (candidateScore.absDx < bestScore.absDx) {
    return false;
  }

  // Quaternary: maximize absDy
  if (candidateScore.absDy > bestScore.absDy) {
    return true;
  }
  if (candidateScore.absDy < bestScore.absDy) {
    return false;
  }

  // Quinary: minimize y
  if (candidateScore.y < bestScore.y) {
    return true;
  }
  if (candidateScore.y > bestScore.y) {
    return false;
  }

  // Senary: minimize x
  if (candidateScore.x < bestScore.x) {
    return true;
  }

  return false;
}

/**
 * Select the best candidate based on tiebreaking hierarchy.
 */
export function selectBestCandidate(
  candidates: Position[],
  target: Character,
  mode: "towards" | "away",
  allCharacters?: Character[],
  moverId?: string,
): Position {
  // Build obstacle set for escape route counting (away mode only)
  const obstacles =
    mode === "away" && allCharacters && moverId
      ? buildObstacleSet(allCharacters, moverId)
      : undefined;

  let bestCandidate: Position = candidates[0]!;
  let bestScore = calculateCandidateScore(
    bestCandidate,
    target.position,
    obstacles,
  );

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const candidateScore = calculateCandidateScore(
      candidate,
      target.position,
      obstacles,
    );

    const isBetter =
      mode === "towards"
        ? compareTowardsMode(candidateScore, bestScore)
        : compareAwayMode(candidateScore, bestScore);

    if (isBetter) {
      bestCandidate = candidate;
      bestScore = candidateScore;
    }
  }

  return bestCandidate;
}
