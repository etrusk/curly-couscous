/**
 * A* pathfinding algorithm for 6-directional hex movement.
 * Finds optimal paths with uniform cost (all hex moves cost 1.0).
 */

import { Position } from "./types";
import { hexDistance, getHexNeighbors, isValidHex } from "./hex";

/**
 * Convert a position to a string key for Set/Map lookups.
 * Uses "q,r" format for pathfinding algorithm internals.
 * NOTE: This differs from gameStore-constants.positionKey which uses "q-r" format.
 * Keep these separate - they serve different modules and should not be mixed.
 */
export function positionKey(pos: Position): string {
  return `${pos.q},${pos.r}`;
}

/**
 * Node in the pathfinding algorithm.
 */
interface PathNode {
  position: Position;
  gCost: number; // Cost from start to this node
  hCost: number; // Heuristic estimate from this node to goal
  fCost: number; // gCost + hCost
  parent: PathNode | null;
}

/**
 * Binary heap priority queue for efficient pathfinding.
 */
class MinHeap {
  private heap: PathNode[] = [];

  public size(): number {
    return this.heap.length;
  }

  public push(node: PathNode): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): PathNode | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0]!;
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex]!;
      const current = this.heap[index]!;

      if (current.fCost >= parent.fCost) break;

      this.heap[parentIndex] = current;
      this.heap[index] = parent;
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild]!.fCost < this.heap[smallest]!.fCost
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild]!.fCost < this.heap[smallest]!.fCost
      ) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      const temp = this.heap[index]!;
      this.heap[index] = this.heap[smallest]!;
      this.heap[smallest] = temp;
      index = smallest;
    }
  }
}

/**
 * Calculate hex distance heuristic (admissible for 6-directional hex movement).
 */
function heuristic(from: Position, to: Position): number {
  return hexDistance(from, to);
}

/**
 * Get all valid neighbors of a position (6-directional hex movement).
 */
function getNeighbors(pos: Position, obstacles: Set<string>): Position[] {
  // Get all hex neighbors (already filtered by hex boundary)
  const neighbors = getHexNeighbors(pos);

  // Filter out obstacles
  return neighbors.filter((neighbor) => !obstacles.has(positionKey(neighbor)));
}

/**
 * Reconstruct path from goal node back to start.
 */
function reconstructPath(goalNode: PathNode): Position[] {
  const path: Position[] = [];
  let current: PathNode | null = goalNode;

  while (current !== null) {
    path.unshift(current.position);
    current = current.parent;
  }

  return path;
}

/**
 * Find shortest path between two positions on a hex grid using A*.
 *
 * @param start - Starting position
 * @param goal - Target position
 * @param obstacles - Set of impassable positions (format: "q,r")
 * @returns Path as array of positions from start to goal (empty if unreachable)
 */
export function findPath(
  start: Position,
  goal: Position,
  obstacles: Set<string>,
): Position[] {
  // Validate bounds
  if (!isValidHex(start)) {
    return [];
  }

  if (!isValidHex(goal)) {
    return [];
  }

  // Check if goal is an obstacle
  if (obstacles.has(positionKey(goal))) {
    return [];
  }

  // Special case: start equals goal
  if (start.q === goal.q && start.r === goal.r) {
    return [start];
  }

  // Initialize data structures
  const openSet = new MinHeap();
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();

  // Create start node
  const startNode: PathNode = {
    position: start,
    gCost: 0,
    hCost: heuristic(start, goal),
    fCost: heuristic(start, goal),
    parent: null,
  };

  openSet.push(startNode);
  gScores.set(positionKey(start), 0);

  // A* main loop
  while (openSet.size() > 0) {
    const current = openSet.pop()!;
    const currentKey = positionKey(current.position);

    // Check if we reached the goal
    if (current.position.q === goal.q && current.position.r === goal.r) {
      return reconstructPath(current);
    }

    // Skip if already processed
    if (closedSet.has(currentKey)) {
      continue;
    }

    closedSet.add(currentKey);

    // Explore neighbors
    const neighbors = getNeighbors(current.position, obstacles);

    for (const neighbor of neighbors) {
      const neighborKey = positionKey(neighbor);

      // Skip if already processed
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Calculate tentative gCost (uniform cost of 1.0 for all hex moves)
      const tentativeGCost = current.gCost + 1.0;

      // Check if this path to neighbor is better than any previous one
      const existingGCost = gScores.get(neighborKey);
      if (existingGCost !== undefined && tentativeGCost >= existingGCost) {
        continue;
      }

      // This path is the best so far
      gScores.set(neighborKey, tentativeGCost);

      const neighborNode: PathNode = {
        position: neighbor,
        gCost: tentativeGCost,
        hCost: heuristic(neighbor, goal),
        fCost: tentativeGCost + heuristic(neighbor, goal),
        parent: current,
      };

      openSet.push(neighborNode);
    }
  }

  // No path found
  return [];
}
