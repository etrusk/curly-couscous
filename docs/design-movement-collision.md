# Movement Collision System Design

**Version:** 1.0  
**Status:** Approved  
**Date:** 2026-01-01

---

## Table of Contents

1. [Overview](#overview)
2. [Design Decisions](#design-decisions)
3. [Seeded PRNG Implementation](#seeded-prng-implementation)
4. [Collision Resolution Algorithm](#collision-resolution-algorithm)
5. [Type Extensions](#type-extensions)
6. [Function Signatures](#function-signatures)
7. [Test Design](#test-design)
8. [Implementation Files](#implementation-files)

---

## Overview

### Goal

Implement deterministic movement collision resolution using seeded random number generation for the auto-battler game engine.

### Requirements

1. **Blocker always wins**: Stationary character holds ground; movers cannot displace
2. **Mover vs mover collision**: Single random winner chosen, all other movers remain in original cells
3. **Seed source**: Timestamp at battle start, stored for replay consistency
4. **Fairness**: Over sufficient battles, each character wins ~50% of collisions
5. **Determinism**: Same seed produces identical battle outcomes

### Context

- **Current state**: Combat system complete, movement system is greenfield
- **Existing types**: [`MovementEvent`](../src/engine/types.ts:173) exists with `collided: boolean` field
- **Pattern to follow**: [`resolveCombat()`](../src/engine/combat.ts:36) style with immutable updates
- **No existing RNG**: Need pure seeded PRNG implementation

---

## Design Decisions

### 1. Snapshot-Based Resolution

**Decision**: Characters see the board state at tick start. A character occupying position X blocks movers targeting X, even if that character is moving away during the same tick.

**Rationale**: 
- Matches spec statement: "All decisions are made against game state at tick start"
- Simpler implementation—no vacancy detection logic needed
- Clearer mental model for players
- Prevents chain-movement exploits

**Example**:
```
Tick start: A at (0,0), B at (1,0)
Actions: A→(1,0), B→(2,0)

Result: 
- A sees B at (1,0), gets blocked → stays at (0,0)
- B sees (2,0) empty, moves → ends at (2,0)
```

### 2. Hold = Blocker

**Decision**: A character executing a move action to their current cell (hold) is treated as a **blocker**, not a mover competing for that cell.

**Rationale**:
- They are not vacating the cell
- They occupy the cell at tick start
- Treating them as a "mover in collision" would be counterintuitive
- Simplifies collision group detection

**Example**:
```
A at (5,5) with move action targeting (5,5) (hold)
B at (4,5) with move action targeting (5,5)

Result: A is blocker, B is blocked
```

### 3. Blocker Definition

**Decision**: A character is a **blocker** at position X if:
- They occupy position X at tick start, AND
- They do NOT have a move action with `ticksRemaining === 1` targeting a different cell

**Note**: This implements Decision #1's snapshot-based resolution—blockers are determined by position at tick start, regardless of their pending actions.

**Examples**:
- Character with `currentAction === null` → blocker
- Character with attack action (`type === 'attack'`) → blocker  
- Character with move action but `ticksRemaining > 1` → blocker
- Character with move action targeting own cell → blocker
- Character with move action targeting different cell → mover (not a blocker)

### 4. mulberry32 PRNG

**Decision**: Use mulberry32 algorithm for seeded pseudo-random number generation.

**Rationale**:
- Pure function (no global state)—critical for replay determinism
- Fast (single multiply, few XOR operations)
- Good statistical distribution for fairness
- Produces full 32-bit output
- Well-tested and widely used

**Alternative considered**: xorshift128+
- **Rejected**: Requires 128-bit state, more complex for this use case

### 5. Explicit State Threading

**Decision**: Thread RNG state explicitly through function calls via parameter and return value.

**Rationale**:
- Enables replay—store can pass same seed through entire battle
- Testable—tests can use fixed seeds for deterministic outcomes
- No global state—functions remain pure
- Composable—multiple resolutions can chain state

**Pattern**:
```typescript
function resolveMovement(
  characters: Character[],
  tick: number,
  rngState: number  // Input state
): MovementResult {
  // ...
  return {
    updatedCharacters,
    events,
    rngState: newRngState  // Output state
  };
}
```

### 6. Collision Group Ordering

**Decision**: Process collision groups in a consistent deterministic order (by target cell coordinates: Y ascending, then X ascending).

**Rationale**:
- Ensures same inputs produce same outputs
- Doesn't prescribe specific ordering to external code
- Natural ordering that's easy to reason about
- Simplifies testing

---

## Seeded PRNG Implementation

### mulberry32 Algorithm

```typescript
/**
 * Pure PRNG using mulberry32 algorithm.
 * Returns next random value in [0, 1) and the updated state.
 * 
 * @param state - Current RNG state (unsigned 32-bit integer)
 * @returns Object with value in [0, 1) and nextState
 */
export function nextRandom(state: number): { value: number; nextState: number } {
  let t = state >>> 0;  // Ensure unsigned 32-bit
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const nextState = (t ^ (t >>> 14)) >>> 0;
  return { 
    value: nextState / 4294967296,  // Normalize to [0, 1)
    nextState 
  };
}
```

### Properties

- **Input**: 32-bit unsigned integer state
- **Output**: Floating point value in [0, 1) and next state
- **Deterministic**: Same state always produces same value and next state
- **Thread-safe**: Pure function, no shared state
- **Distribution**: Uniform distribution over sufficient samples

---

## Collision Resolution Algorithm

### High-Level Flow

```
1. Find all resolving movers (currentAction.type === 'move' && ticksRemaining === 1)
2. Group movers by target cell
3. For each collision group:
   a. Check if target cell has blocker
   b. If blocker exists:
      - All movers stay in original cells
      - Mark all as collided=true
      - Don't consume RNG
   c. If no blocker and single mover:
      - Mover moves to target cell
      - Mark as collided=false
      - Don't consume RNG
   d. If no blocker and multiple movers:
      - Use RNG to select random winner
      - Winner moves to target cell (collided=false)
      - Losers stay in original cells (collided=true)
      - Consume one RNG call
4. Generate MovementEvent for each mover
5. Return updated characters, events, and new rngState
```

### Blocker Detection

```typescript
function isBlocker(character: Character, position: Position): boolean {
  // Not at this position → not a blocker here
  if (!positionsEqual(character.position, position)) {
    return false;
  }
  
  // No action → blocker
  if (!character.currentAction) {
    return true;
  }
  
  // Non-move action → blocker
  if (character.currentAction.type !== 'move') {
    return true;
  }
  
  // Move action not ready → blocker
  if (character.currentAction.ticksRemaining !== 1) {
    return true;
  }
  
  // Moving to different cell → not a blocker
  if (!positionsEqual(character.currentAction.targetCell, position)) {
    return false;
  }
  
  // Moving to own cell (hold) → blocker
  return true;
}
```

### Winner Selection

```typescript
function selectWinner(movers: Character[], rngState: number): {
  winner: Character;
  nextState: number;
} {
  const { value, nextState } = nextRandom(rngState);
  const index = Math.floor(value * movers.length);
  return {
    winner: movers[index],
    nextState
  };
}
```

### Collision Group Resolution

```typescript
// Pseudo-code
for each targetCell with movers:
  const blockersAtCell = characters.filter(c => isBlocker(c, targetCell))
  
  if (blockersAtCell.length > 0):
    // Blocker wins - all movers blocked
    for each mover:
      mover stays at original position
      generate MovementEvent(collided: true)
    // Don't consume RNG
    
  else if (movers.length === 1):
    // Single unobstructed mover
    mover moves to targetCell
    generate MovementEvent(collided: false)
    // Don't consume RNG
    
  else:
    // Multiple movers competing
    const { winner, nextState } = selectWinner(movers, currentRngState)
    currentRngState = nextState  // Advance state
    
    winner moves to targetCell
    generate MovementEvent for winner (collided: false)
    
    for each loser:
      loser stays at original position
      generate MovementEvent for loser (collided: true)
```

---

## Type Extensions

### GameState Additions

```typescript
export interface GameState {
  characters: Character[];
  tick: number;
  phase: BattlePhase;
  battleStatus: BattleStatus;
  history: GameEvent[];
  
  // NEW: RNG for deterministic randomness
  seed: number;      // Battle seed (immutable after init)
  rngState: number;  // Current RNG state (mutates each use)
}
```

### MovementResult Interface

```typescript
export interface MovementResult {
  /** Characters with updated positions after movement */
  updatedCharacters: Character[];
  
  /** Movement events generated during resolution */
  events: MovementEvent[];
  
  /** Updated RNG state after collision resolutions */
  rngState: number;
}
```

---

## Function Signatures

### Core Resolution Function

```typescript
/**
 * Resolves all movement actions for the current tick.
 * 
 * Handles the movement portion of Resolution Phase:
 * 1. Find all move actions ready to resolve (ticksRemaining === 1)
 * 2. Group movers by target cell
 * 3. Resolve each collision group:
 *    - Blocker present: all movers blocked
 *    - Single mover: move succeeds
 *    - Multiple movers: random winner selected
 * 4. Generate MovementEvent for each mover
 * 
 * @param characters - All characters in the battle
 * @param tick - Current game tick (for event timestamps)
 * @param rngState - Current RNG state for deterministic collision resolution
 * @returns MovementResult with updated characters, events, and new RNG state
 * 
 * @preconditions
 * - All characters have valid positions
 * - Move actions have valid targetCell
 * - rngState is valid 32-bit unsigned integer
 */
export function resolveMovement(
  characters: Character[],
  tick: number,
  rngState: number
): MovementResult;
```

### RNG Utility Functions

```typescript
/**
 * Pure PRNG using mulberry32 algorithm.
 * 
 * @param state - Current RNG state (unsigned 32-bit integer)
 * @returns Object with value in [0, 1) and nextState
 */
export function nextRandom(state: number): { 
  value: number; 
  nextState: number; 
};

/**
 * Creates initial RNG state from seed.
 * 
 * @param seed - Seed value (e.g., Date.now())
 * @returns Initial RNG state
 */
export function initRNG(seed: number): number;
```

---

## Test Design

### Test Summary

**Total tests**: 47 tests across 10 sections

**Coverage areas**:
- RNG Determinism (3 tests)
- Basic Movement (6 tests)
- Blocker Always Wins (8 tests)
- Two-Way Collision (6 tests)
- Multi-Way Collision (4 tests)
- Fairness Testing (3 tests)
- Edge Cases (7 tests)
- Multiple Collision Groups (3 tests)
- RNG State Management (6 tests)

### Key Test Categories

#### 1. RNG Determinism (3 tests)

| Test | Purpose |
|------|---------|
| Same seed → same sequence | Verify PRNG is deterministic |
| Different seeds → different sequences | Verify seeds create variety |
| Values in [0, 1) | Verify output range |

#### 2. Basic Movement (6 tests)

| Test | Purpose |
|------|---------|
| Unobstructed move succeeds | Happy path |
| MovementEvent generated correctly | Event logging |
| collided=false on success | Status accuracy |
| ticksRemaining > 1 doesn't resolve | Action timing |
| null action doesn't move | Idle handling |
| Non-move action doesn't move | Action filtering |

#### 3. Blocker Always Wins (8 tests)

| Test | Purpose |
|------|---------|
| Stationary character blocks mover | Core blocker rule |
| collided=true when blocked | Status accuracy |
| Mover stays in original position | Position integrity |
| Blocker doesn't move | Blocker stability |
| Multiple movers all blocked | Multi-mover blocking |
| Attack action = blocker | Attack as stationary |
| Hold action = blocker | Hold blocks incoming |
| Mixed outcomes (some blocked, some not) | Independent resolution |

#### 4. Two-Way Collision (6 tests)

| Test | Purpose |
|------|---------|
| Exactly one winner | Core collision mechanic |
| Loser stays in place | Loser handling |
| collided flags correct | Event accuracy |
| Both events generated | Complete logging |
| Same rngState → same winner | Replay consistency |
| Different rngState → different outcome | RNG usage |

#### 5. Multi-Way Collision (4 tests)

| Test | Purpose |
|------|---------|
| 3-way collision: one winner | Scales beyond 2-way |
| All losers stay in place | Multiple losers |
| 4-way collision | Larger groups |
| Uniform distribution over trials | N-way fairness |

#### 6. Fairness Testing (3 tests)

| Test | Purpose |
|------|---------|
| 50% win rate over 10000 trials | Core fairness (3σ bounds: 4850-5150) |
| Fair regardless of slotPosition | No slot bias |
| Fair regardless of faction | No faction bias |

#### 7. Edge Cases (7 tests)

| Test | Purpose |
|------|---------|
| Empty array | Graceful empty handling |
| RNG state unchanged when unused | State conservation |
| RNG state advances when used | State management |
| Snapshot-based blocking | Mover blocked by outgoing mover |
| No chain movement | Can't pass through |
| Character properties preserved | Immutability |
| Hold action works | Move to current cell |

#### 8. Multiple Collision Groups (3 tests)

| Test | Purpose |
|------|---------|
| Independent group resolution | Multiple simultaneous collisions |
| RNG per group | Each collision consumes RNG |
| Deterministic ordering | Same inputs → same outputs |

#### 9. RNG State Management (6 tests)

| Test | Purpose |
|------|---------|
| Updated state returned | State threading |
| Chaining across ticks | Multi-tick continuity |
| One RNG call per collision | Exact consumption |
| One call for N-way (not N-1) | Single selection algorithm |
| Zero calls when blocker wins | Deterministic blocker |
| Edge values (0.0, 0.999...) | Boundary testing |

#### 10. Stress Tests (1 test)

| Test | Purpose |
|------|---------|
| 8-way collision | Algorithm scales to many contestants |

### Statistical Bounds

**50/50 fairness** (n=10000, p=0.5):
- σ = √(10000 × 0.5 × 0.5) = 50
- 3σ bounds: 4850-5150 wins
- Catches bias ≥2% (48/52 split)

**33/33/33 fairness** (n=10000, p=0.333):
- σ = √(10000 × 0.333 × 0.667) ≈ 47
- 3σ bounds: 3050-3650 wins per contestant
- Catches bias ≥3% from equal distribution

### Not Testing

| Exclusion | Rationale |
|-----------|-----------|
| Grid boundary validation | Delegated to [`isValidPosition()`](../src/engine/types.ts:213) |
| Pathfinding/route calculation | Decision phase responsibility |
| Multi-tick action countdown | Game loop responsibility |
| Visual/UI rendering | Separate component tests |
| Store integration | Separate integration tests |

---

## Implementation Files

### Files to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| `src/engine/movement.ts` | Movement resolution + RNG implementation | ~200 |
| `src/engine/movement.test.ts` | 47 tests for movement system | ~1800 |

### Files to Modify

| File | Changes | Impact |
|------|---------|--------|
| `src/engine/types.ts` | Add `seed`, `rngState` to GameState | 2 lines |
| `src/stores/gameStore.ts` | Initialize `seed: Date.now()` in initBattle | ~3 lines |

### Implementation Order

1. **Spec update**: Update `.roo/rules/00-project.md` collision resolution section
2. **Types**: Add `seed` and `rngState` to [`GameState`](../src/engine/types.ts:106)
3. **Tests**: Implement all 46 tests in `movement.test.ts` (should fail)
4. **RNG**: Implement `nextRandom()` and `initRNG()` utilities
5. **Movement**: Implement `resolveMovement()` function
6. **Store**: Update `initBattle()` to initialize seed
7. **Verify**: All tests pass

---

## References

### Spec Sections

- **Project Rules** (`.roo/rules/00-project.md`):
  - §Collision Resolution (needs update)
  - §Core Game Mechanics
  - §Tick System

### Code Patterns

- **Combat Resolution**: [`resolveCombat()`](../src/engine/combat.ts:36)
  - Shallow copy pattern
  - Event generation
  - Slot-based ordering for determinism

### Type Definitions

- [`Character`](../src/engine/types.ts:33)
- [`Action`](../src/engine/types.ts:90)
- [`MovementEvent`](../src/engine/types.ts:173)
- [`GameState`](../src/engine/types.ts:106)

---

## Appendix: Design Alternatives Considered

### Alternative 1: Vacancy-Aware Resolution

**Considered**: Allow characters to "pass through" cells being vacated.

**Example**: A→B's cell, B→C's cell → both succeed

**Rejected because**:
- Contradicts spec: "decisions made against game state at tick start"
- More complex implementation
- Harder for players to predict
- Creates chain-movement exploits

### Alternative 2: Hold as Mover

**Considered**: Treat hold action as a mover competing for their current cell.

**Example**: A holds at (5,5), B moves to (5,5) → random resolution

**Rejected because**:
- Counterintuitive (A isn't vacating)
- Hold would randomly fail
- Doesn't match player mental model

### Alternative 3: Tournament-Style Random Selection

**Considered**: For N-way collision, use log₂(N) RNG calls in tournament bracket.

**Example**: 4-way → call RNG twice (semi-finals + final)

**Rejected because**:
- Single RNG call simpler: `Math.floor(rng() * N)`
- Equal distribution either way
- Fewer RNG calls = faster, simpler testing

### Alternative 4: xorshift128+ PRNG

**Considered**: Use xorshift128+ for RNG.

**Rejected because**:
- Requires 128-bit state (more complex)
- mulberry32 sufficient for this use case
- mulberry32 is simpler and well-tested

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-01 | Initial design approved |

