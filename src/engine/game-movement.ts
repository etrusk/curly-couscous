/**
 * Movement destination calculation with tiebreaking rules.
 * Used by the decision phase to compute where a character should move.
 */

import { Character, Position, positionsEqual } from "./types";
import { findPath, positionKey } from "./pathfinding";
import { hexDistance, getHexNeighbors } from "./hex";

/**
 * Compute move destination with tiebreaking rules for 6-direction hex movement.
 *
 * For "towards" mode: Uses A* pathfinding to navigate around obstacles (other characters).
 * For "away" mode: Uses tiebreaking hierarchy for single-step maximization.
 *
 * Tiebreaking hierarchy (when multiple cells equally optimal):
 * 1. For "towards": minimize resulting hex distance to target
 *    For "away": maximize resulting hex distance from target
 * 2. For "towards": minimize resulting |dq|, then |dr|
 *    For "away": maximize resulting |dq|, then maximize |dr|
 * 3. Then lower r coordinate of candidate cell
 * 4. Then lower q coordinate of candidate cell
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
  // Already at target position
  if (positionsEqual(mover.position, target.position)) {
    return mover.position;
  }

  // For "towards" mode, use A* pathfinding
  if (mode === "towards") {
    // Build obstacle set from all characters except mover and target
    // (target position should be reachable for melee combat)
    const obstacles = buildObstacleSet(allCharacters, mover.id, target.id);

    // Find path using A* on hex grid
    const path = findPath(mover.position, target.position, obstacles);

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
 * Count escape routes (unblocked adjacent hex cells) from a position.
 * Used for away-mode scoring to prefer positions with more mobility.
 * Returns 0-6 for hex grids (was 0-8 for square grids).
 */
export function countEscapeRoutes(
  position: Position,
  obstacles: Set<string>,
): number {
  const neighbors = getHexNeighbors(position);
  let count = 0;
  for (const neighbor of neighbors) {
    if (!obstacles.has(positionKey(neighbor))) {
      count++;
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
  // Get all hex neighbors (already filtered by hex boundary)
  const neighbors = getHexNeighbors(mover.position);

  // Helper to check if a cell is occupied by another character
  const isOccupied = (pos: Position): boolean => {
    return allCharacters.some(
      (c) => c.id !== mover.id && positionsEqual(c.position, pos),
    );
  };

  // Filter out occupied cells (hex grids don't have diagonal/cardinal distinction)
  const candidates = neighbors.filter((neighbor) => !isOccupied(neighbor));

  // For "away" mode, also consider staying in place as an option
  if (mode === "away") {
    candidates.push(mover.position);
  }

  return candidates;
}

interface CandidateScore {
  distance: number;
  absDq: number;
  absDr: number;
  r: number;
  q: number;
  escapeRoutes: number; // Count of unblocked adjacent hex cells (0-6)
}

/**
 * Calculate candidate score for tiebreaking comparison.
 */
export function calculateCandidateScore(
  candidate: Position,
  target: Position,
  obstacles?: Set<string>,
): CandidateScore {
  const resultDq = target.q - candidate.q;
  const resultDr = target.r - candidate.r;
  const distance = hexDistance(candidate, target);

  const escapeRoutes = obstacles ? countEscapeRoutes(candidate, obstacles) : 6; // Default: assume open space when no obstacles provided

  return {
    distance,
    absDq: Math.abs(resultDq),
    absDr: Math.abs(resultDr),
    r: candidate.r,
    q: candidate.q,
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

  // Secondary: absDq (minimize)
  if (candidateScore.absDq < bestScore.absDq) {
    return true;
  }
  if (candidateScore.absDq > bestScore.absDq) {
    return false;
  }

  // Tertiary: absDr (minimize)
  if (candidateScore.absDr < bestScore.absDr) {
    return true;
  }
  if (candidateScore.absDr > bestScore.absDr) {
    return false;
  }

  // Quaternary: r coordinate (minimize)
  if (candidateScore.r < bestScore.r) {
    return true;
  }
  if (candidateScore.r > bestScore.r) {
    return false;
  }

  // Quinary: q coordinate (minimize)
  if (candidateScore.q < bestScore.q) {
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

  // Tertiary: maximize absDq
  if (candidateScore.absDq > bestScore.absDq) {
    return true;
  }
  if (candidateScore.absDq < bestScore.absDq) {
    return false;
  }

  // Quaternary: maximize absDr
  if (candidateScore.absDr > bestScore.absDr) {
    return true;
  }
  if (candidateScore.absDr < bestScore.absDr) {
    return false;
  }

  // Quinary: minimize r
  if (candidateScore.r < bestScore.r) {
    return true;
  }
  if (candidateScore.r > bestScore.r) {
    return false;
  }

  // Senary: minimize q
  if (candidateScore.q < bestScore.q) {
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
