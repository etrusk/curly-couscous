/**
 * Movement candidate scoring and comparison logic.
 * Extracted from game-movement.ts for file size management.
 * Used by both singular and plural movement computations.
 */

import { Character, Position } from "./types";
import { positionKey } from "./pathfinding";
import { hexDistance, getHexNeighbors } from "./hex";

export interface CandidateScore {
  distance: number;
  absDq: number;
  absDr: number;
  r: number;
  q: number;
  escapeRoutes: number; // Count of unblocked adjacent hex cells (0-6)
}

/**
 * Build set of obstacle positions from characters, excluding specified IDs.
 * Typically excludes mover and target to allow pathfinding to reach the target.
 */
export function buildObstacleSet(
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
 * Returns 0-6 for hex grids.
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

  const escapeRoutes = obstacles ? countEscapeRoutes(candidate, obstacles) : 6;

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

/**
 * Compute plural candidate score using aggregated distances across all targets.
 * For away mode: uses min-distance to nearest target.
 * For towards mode: uses average distance to all targets.
 * Uses nearest target for positional tiebreaking (dq, dr).
 */
export function computePluralCandidateScore(
  candidate: Position,
  targets: Character[],
  mode: "towards" | "away",
  obstacles?: Set<string>,
): CandidateScore {
  const distances = targets.map((t) => hexDistance(candidate, t.position));
  const aggregateDistance =
    mode === "away"
      ? Math.min(...distances)
      : distances.reduce((a, b) => a + b, 0) / distances.length;

  // Use nearest target for positional tiebreaking (dq, dr)
  let nearestIdx = 0;
  let nearestDist = distances[0]!;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i]! < nearestDist) {
      nearestDist = distances[i]!;
      nearestIdx = i;
    }
  }
  const nearestTarget = targets[nearestIdx]!;

  const resultDq = nearestTarget.position.q - candidate.q;
  const resultDr = nearestTarget.position.r - candidate.r;
  const escapeRoutes = obstacles ? countEscapeRoutes(candidate, obstacles) : 6;

  return {
    distance: aggregateDistance,
    absDq: Math.abs(resultDq),
    absDr: Math.abs(resultDr),
    r: candidate.r,
    q: candidate.q,
    escapeRoutes,
  };
}
