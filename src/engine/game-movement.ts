/**
 * Movement destination calculation with tiebreaking rules.
 * Used by the decision phase to compute where a character should move.
 *
 * Scoring and comparison logic is in movement-scoring.ts.
 */

import { Character, Position, positionsEqual } from "./types";
import { findPath } from "./pathfinding";
import { getHexNeighbors } from "./hex";
import {
  buildObstacleSet,
  compareAwayMode,
  compareTowardsMode,
  computePluralCandidateScore,
  selectBestCandidate,
} from "./movement-scoring";

// Re-export scoring utilities for external consumers
export {
  countEscapeRoutes,
  calculateCandidateScore,
  compareTowardsMode,
  compareAwayMode,
  selectBestCandidate,
} from "./movement-scoring";

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
 * Compute multi-step move destination by iterating single-step logic.
 * Each step uses the current simulated position. Obstacles remain at their
 * original positions (snapshot-based, consistent with decision phase).
 *
 * @param mover - Character that is moving
 * @param target - Target character to move towards/away from
 * @param mode - Movement mode ('towards' or 'away')
 * @param allCharacters - All characters on the battlefield
 * @param distance - Number of steps to take (defaults to 1)
 * @returns Final destination position after all steps
 */
export function computeMultiStepDestination(
  mover: Character,
  target: Character,
  mode: "towards" | "away",
  allCharacters: Character[],
  distance: number = 1,
): Position {
  let currentPosition = mover.position;

  for (let step = 0; step < distance; step++) {
    // Create a virtual mover at the current simulated position
    const virtualMover = { ...mover, position: currentPosition };
    const nextPosition = computeMoveDestination(
      virtualMover,
      target,
      mode,
      allCharacters,
    );

    // If stuck (returned same position), stop
    if (positionsEqual(nextPosition, currentPosition)) {
      break;
    }

    currentPosition = nextPosition;
  }

  return currentPosition;
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

/**
 * Compute move destination for plural targets (enemies/allies groups).
 *
 * Away mode: maximizes min(distance to each target) * escapeRoutes
 * Towards mode: minimizes average distance to all targets
 *
 * Uses candidate scoring (not A* pathfinding) for both modes,
 * since there is no single goal position for A*.
 *
 * @param mover - Character that is moving
 * @param targets - Target group (all enemies or all allies)
 * @param mode - Movement mode ('towards' or 'away')
 * @param allCharacters - All characters on the battlefield
 * @returns Destination position (1 cell away from mover)
 */
export function computePluralMoveDestination(
  mover: Character,
  targets: Character[],
  mode: "towards" | "away",
  allCharacters: Character[],
): Position {
  // Empty group: stay in place
  if (targets.length === 0) {
    return mover.position;
  }

  const candidates = generateValidCandidates(mover, allCharacters, mode);

  if (candidates.length === 0) {
    return mover.position;
  }

  // Build obstacle set excluding mover and ALL targets (Lesson 002)
  const excludeIds = [mover.id, ...targets.map((t) => t.id)];
  const obstacles =
    mode === "away"
      ? buildObstacleSet(allCharacters, ...excludeIds)
      : undefined;

  let bestCandidate: Position = candidates[0]!;
  let bestScore = computePluralCandidateScore(
    bestCandidate,
    targets,
    mode,
    obstacles,
  );

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const candidateScore = computePluralCandidateScore(
      candidate,
      targets,
      mode,
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

/**
 * Compute multi-step move destination for plural targets.
 * Iterates single steps using computePluralMoveDestination,
 * creating a virtual mover at each intermediate position.
 * Stops early if stuck.
 *
 * @param mover - Character that is moving
 * @param targets - Target group (all enemies or all allies)
 * @param mode - Movement mode ('towards' or 'away')
 * @param allCharacters - All characters on the battlefield
 * @param distance - Number of steps to take (defaults to 1)
 * @returns Final destination position after all steps
 */
export function computeMultiStepPluralDestination(
  mover: Character,
  targets: Character[],
  mode: "towards" | "away",
  allCharacters: Character[],
  distance: number = 1,
): Position {
  let currentPosition = mover.position;

  for (let step = 0; step < distance; step++) {
    const virtualMover = { ...mover, position: currentPosition };
    const nextPosition = computePluralMoveDestination(
      virtualMover,
      targets,
      mode,
      allCharacters,
    );

    // If stuck (returned same position), stop
    if (positionsEqual(nextPosition, currentPosition)) {
      break;
    }

    currentPosition = nextPosition;
  }

  return currentPosition;
}
