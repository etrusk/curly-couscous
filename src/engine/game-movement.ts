/**
 * Movement destination calculation with tiebreaking rules.
 * Used by the decision phase to compute where a character should move.
 */

import { Character, Position } from "./types";

/**
 * Compute move destination with tiebreaking rules for 8-direction movement.
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

  // Generate all 8 possible adjacent cells (including diagonals)
  const candidates = generateValidCandidates(mover, allCharacters, mode);

  // If no valid candidates (should never happen unless mover is outside grid)
  if (candidates.length === 0) {
    return mover.position;
  }

  // Evaluate each candidate using tiebreaking hierarchy
  return selectBestCandidate(candidates, target, mode);
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
      candidate.x < 12 &&
      candidate.y >= 0 &&
      candidate.y < 12
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
}

/**
 * Calculate candidate score for tiebreaking comparison.
 */
export function calculateCandidateScore(
  candidate: Position,
  target: Position,
): CandidateScore {
  const resultDx = target.x - candidate.x;
  const resultDy = target.y - candidate.y;
  const distance = Math.max(Math.abs(resultDx), Math.abs(resultDy)); // Chebyshev distance

  return {
    distance,
    absDx: Math.abs(resultDx),
    absDy: Math.abs(resultDy),
    y: candidate.y,
    x: candidate.x,
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
  // Primary comparison: distance (maximize)
  if (candidateScore.distance > bestScore.distance) {
    return true;
  }
  if (candidateScore.distance < bestScore.distance) {
    return false;
  }

  // Secondary: absDx (maximize)
  if (candidateScore.absDx > bestScore.absDx) {
    return true;
  }
  if (candidateScore.absDx < bestScore.absDx) {
    return false;
  }

  // Tertiary: absDy (maximize)
  if (candidateScore.absDy > bestScore.absDy) {
    return true;
  }
  if (candidateScore.absDy < bestScore.absDy) {
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
 * Select the best candidate based on tiebreaking hierarchy.
 */
export function selectBestCandidate(
  candidates: Position[],
  target: Character,
  mode: "towards" | "away",
): Position {
  let bestCandidate: Position = candidates[0]!;
  let bestScore = calculateCandidateScore(bestCandidate, target.position);

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const candidateScore = calculateCandidateScore(candidate, target.position);

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
