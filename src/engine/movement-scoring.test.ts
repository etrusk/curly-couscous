import { describe, it, expect } from "vitest";
import {
  CandidateScore,
  compareTowardsMode,
  compareAwayMode,
  selectBestCandidate,
  computePluralCandidateScore,
  countEscapeRoutes,
  buildObstacleSet,
  calculateCandidateScore,
} from "./movement-scoring";
import { createCharacter } from "./game-test-helpers";

function score(overrides: Partial<CandidateScore> = {}): CandidateScore {
  return {
    distance: 3,
    absDq: 1,
    absDr: 1,
    q: 0,
    r: 0,
    escapeRoutes: 6,
    ...overrides,
  };
}

describe("compareTowardsMode", () => {
  it("towards-L1-wins", () => {
    expect(
      compareTowardsMode(score({ distance: 2 }), score({ distance: 4 })),
    ).toBe(true);
  });

  it("towards-L1-loses", () => {
    expect(
      compareTowardsMode(score({ distance: 5 }), score({ distance: 4 })),
    ).toBe(false);
  });

  it("towards-L1-tie", () => {
    expect(
      compareTowardsMode(
        score({ distance: 3, absDq: 0 }),
        score({ distance: 3, absDq: 2 }),
      ),
    ).toBe(true);
  });

  it("towards-L2-wins", () => {
    expect(compareTowardsMode(score({ absDq: 0 }), score({ absDq: 2 }))).toBe(
      true,
    );
  });

  it("towards-L2-loses", () => {
    expect(compareTowardsMode(score({ absDq: 3 }), score({ absDq: 2 }))).toBe(
      false,
    );
  });

  it("towards-L2-tie", () => {
    expect(
      compareTowardsMode(
        score({ absDq: 1, absDr: 0 }),
        score({ absDq: 1, absDr: 2 }),
      ),
    ).toBe(true);
  });

  it("towards-L3-wins", () => {
    expect(compareTowardsMode(score({ absDr: 0 }), score({ absDr: 2 }))).toBe(
      true,
    );
  });

  it("towards-L3-loses", () => {
    expect(compareTowardsMode(score({ absDr: 3 }), score({ absDr: 2 }))).toBe(
      false,
    );
  });

  it("towards-L3-tie", () => {
    expect(
      compareTowardsMode(score({ absDr: 1, r: -1 }), score({ absDr: 1, r: 1 })),
    ).toBe(true);
  });

  it("towards-L4-wins", () => {
    expect(compareTowardsMode(score({ r: -1 }), score({ r: 1 }))).toBe(true);
  });

  it("towards-L4-loses", () => {
    expect(compareTowardsMode(score({ r: 2 }), score({ r: 1 }))).toBe(false);
  });

  it("towards-L4-tie", () => {
    expect(
      compareTowardsMode(score({ r: 0, q: -1 }), score({ r: 0, q: 1 })),
    ).toBe(true);
  });

  it("towards-L5-wins", () => {
    expect(compareTowardsMode(score({ q: -1 }), score({ q: 1 }))).toBe(true);
  });

  it("towards-L5-loses", () => {
    expect(compareTowardsMode(score({ q: 2 }), score({ q: 1 }))).toBe(false);
  });

  it("towards-L5-tie-is-fallback", () => {
    expect(compareTowardsMode(score({ q: 5 }), score({ q: 5 }))).toBe(false);
  });

  it("towards-all-equal-fallback", () => {
    expect(compareTowardsMode(score(), score())).toBe(false);
  });
});

describe("compareAwayMode", () => {
  it("away-L1-wins", () => {
    expect(
      compareAwayMode(
        score({ distance: 5, escapeRoutes: 4 }),
        score({ distance: 4, escapeRoutes: 4 }),
      ),
    ).toBe(true);
  });

  it("away-L1-loses", () => {
    expect(
      compareAwayMode(
        score({ distance: 3, escapeRoutes: 4 }),
        score({ distance: 4, escapeRoutes: 4 }),
      ),
    ).toBe(false);
  });

  it("away-L1-tie", () => {
    expect(
      compareAwayMode(
        score({ distance: 4, escapeRoutes: 5 }),
        score({ distance: 5, escapeRoutes: 4 }),
      ),
    ).toBe(false);
  });

  it("away-L1-arithmetic", () => {
    expect(
      compareAwayMode(
        score({ distance: 2, escapeRoutes: 3 }),
        score({ distance: 5, escapeRoutes: 1 }),
      ),
    ).toBe(true);
  });

  it("away-L2-wins", () => {
    expect(
      compareAwayMode(
        score({ distance: 5, escapeRoutes: 4 }),
        score({ distance: 4, escapeRoutes: 5 }),
      ),
    ).toBe(true);
  });

  it("away-L2-loses", () => {
    expect(
      compareAwayMode(
        score({ distance: 4, escapeRoutes: 5 }),
        score({ distance: 5, escapeRoutes: 4 }),
      ),
    ).toBe(false);
  });

  it("away-L2-tie", () => {
    expect(
      compareAwayMode(
        score({ distance: 3, escapeRoutes: 6, absDq: 4 }),
        score({ distance: 3, escapeRoutes: 6, absDq: 2 }),
      ),
    ).toBe(true);
  });

  it("away-L3-wins", () => {
    expect(compareAwayMode(score({ absDq: 3 }), score({ absDq: 0 }))).toBe(
      true,
    );
  });

  it("away-L3-loses", () => {
    expect(compareAwayMode(score({ absDq: 0 }), score({ absDq: 2 }))).toBe(
      false,
    );
  });

  it("away-L3-tie", () => {
    expect(
      compareAwayMode(
        score({ absDq: 1, absDr: 3 }),
        score({ absDq: 1, absDr: 0 }),
      ),
    ).toBe(true);
  });

  it("away-L4-wins", () => {
    expect(compareAwayMode(score({ absDr: 3 }), score({ absDr: 0 }))).toBe(
      true,
    );
  });

  it("away-L4-loses", () => {
    expect(compareAwayMode(score({ absDr: 0 }), score({ absDr: 2 }))).toBe(
      false,
    );
  });

  it("away-L4-tie", () => {
    expect(
      compareAwayMode(score({ absDr: 1, r: -1 }), score({ absDr: 1, r: 1 })),
    ).toBe(true);
  });

  it("away-L5-wins", () => {
    expect(compareAwayMode(score({ r: -1 }), score({ r: 1 }))).toBe(true);
  });

  it("away-L5-loses", () => {
    expect(compareAwayMode(score({ r: 2 }), score({ r: 1 }))).toBe(false);
  });

  it("away-L5-tie", () => {
    expect(compareAwayMode(score({ r: 0, q: -1 }), score({ r: 0, q: 1 }))).toBe(
      true,
    );
  });

  it("away-L6-wins", () => {
    expect(compareAwayMode(score({ q: -1 }), score({ q: 1 }))).toBe(true);
  });

  it("away-L6-loses", () => {
    expect(compareAwayMode(score({ q: 2 }), score({ q: 1 }))).toBe(false);
  });

  it("away-all-equal-fallback", () => {
    expect(compareAwayMode(score(), score())).toBe(false);
  });
});

describe("buildObstacleSet", () => {
  it("builds obstacle set from characters", () => {
    const chars = [
      createCharacter({ id: "a", position: { q: 1, r: 2 } }),
      createCharacter({ id: "b", position: { q: 3, r: -1 } }),
    ];
    const result = buildObstacleSet(chars);
    expect(result.size).toBe(2);
    expect(result.has("1,2")).toBe(true);
    expect(result.has("3,-1")).toBe(true);
  });

  it("excludes single id", () => {
    const chars = [
      createCharacter({ id: "a", position: { q: 1, r: 0 } }),
      createCharacter({ id: "b", position: { q: 2, r: 0 } }),
      createCharacter({ id: "c", position: { q: 3, r: 0 } }),
    ];
    const result = buildObstacleSet(chars, "b");
    expect(result.size).toBe(2);
    expect(result.has("2,0")).toBe(false);
    expect(result.has("1,0")).toBe(true);
    expect(result.has("3,0")).toBe(true);
  });

  it("excludes multiple ids", () => {
    const chars = [
      createCharacter({ id: "a", position: { q: 1, r: 0 } }),
      createCharacter({ id: "b", position: { q: 2, r: 0 } }),
      createCharacter({ id: "c", position: { q: 3, r: 0 } }),
    ];
    const result = buildObstacleSet(chars, "a", "c");
    expect(result.size).toBe(1);
    expect(result.has("2,0")).toBe(true);
  });

  it("empty characters array", () => {
    const result = buildObstacleSet([]);
    expect(result.size).toBe(0);
  });
});

describe("countEscapeRoutes", () => {
  it("interior hex with no obstacles returns 6", () => {
    expect(countEscapeRoutes({ q: 0, r: 0 }, new Set<string>())).toBe(6);
  });

  it("some obstacles reduce escape route count", () => {
    const obstacles = new Set(["1,0", "-1,0"]);
    expect(countEscapeRoutes({ q: 0, r: 0 }, obstacles)).toBe(4);
  });

  it("fully surrounded returns 0", () => {
    const obstacles = new Set(["1,0", "-1,0", "0,1", "0,-1", "1,-1", "-1,1"]);
    expect(countEscapeRoutes({ q: 0, r: 0 }, obstacles)).toBe(0);
  });

  it("edge position returns fewer routes", () => {
    expect(countEscapeRoutes({ q: 5, r: 0 }, new Set<string>())).toBe(3);
  });
});

describe("calculateCandidateScore", () => {
  it("basic score computation", () => {
    const result = calculateCandidateScore({ q: 1, r: 1 }, { q: 3, r: 3 });
    expect(result.distance).toBe(4);
    expect(result.absDq).toBe(2);
    expect(result.absDr).toBe(2);
    expect(result.q).toBe(1);
    expect(result.r).toBe(1);
    expect(result.escapeRoutes).toBe(6);
  });

  it("with obstacles", () => {
    const obstacles = new Set(["1,0", "0,1"]);
    const result = calculateCandidateScore(
      { q: 0, r: 0 },
      { q: 2, r: 2 },
      obstacles,
    );
    expect(result.escapeRoutes).toBe(4);
  });

  it("absolute values for dq dr", () => {
    const result = calculateCandidateScore({ q: 3, r: 2 }, { q: 1, r: 0 });
    expect(result.absDq).toBe(2);
    expect(result.absDr).toBe(2);
  });

  it("coordinates are candidates not targets", () => {
    const result = calculateCandidateScore({ q: 2, r: 3 }, { q: 0, r: 0 });
    expect(result.q).toBe(2);
    expect(result.r).toBe(3);
  });
});

describe("selectBestCandidate", () => {
  it("towards picks closest", () => {
    const candidates = [
      { q: 1, r: 0 },
      { q: 3, r: 0 },
    ];
    const target = createCharacter({ id: "t", position: { q: 4, r: 0 } });
    expect(selectBestCandidate(candidates, target, "towards")).toEqual({
      q: 3,
      r: 0,
    });
  });

  it("towards tiebreaker beyond distance", () => {
    const candidates = [
      { q: 1, r: 0 },
      { q: 2, r: -1 },
    ];
    const target = createCharacter({ id: "t", position: { q: 3, r: 0 } });
    expect(selectBestCandidate(candidates, target, "towards")).toEqual({
      q: 2,
      r: -1,
    });
  });

  it("away picks farthest", () => {
    const candidates = [
      { q: 1, r: 0 },
      { q: -1, r: 0 },
    ];
    const target = createCharacter({ id: "t", position: { q: 3, r: 0 } });
    expect(selectBestCandidate(candidates, target, "away")).toEqual({
      q: -1,
      r: 0,
    });
  });

  it("away with obstacles", () => {
    const mover = createCharacter({ id: "mover", position: { q: 0, r: 1 } });
    const target = createCharacter({ id: "t", position: { q: 0, r: 0 } });
    const blocker1 = createCharacter({ id: "b1", position: { q: 2, r: 0 } });
    const blocker2 = createCharacter({ id: "b2", position: { q: 1, r: 1 } });
    const candidates = [
      { q: -1, r: 0 },
      { q: 1, r: 0 },
    ];
    const allCharacters = [mover, target, blocker1, blocker2];
    expect(
      selectBestCandidate(candidates, target, "away", allCharacters, "mover"),
    ).toEqual({ q: -1, r: 0 });
  });

  it("single candidate", () => {
    const candidates = [{ q: 2, r: 1 }];
    const target = createCharacter({ id: "t", position: { q: 0, r: 0 } });
    expect(selectBestCandidate(candidates, target, "towards")).toEqual({
      q: 2,
      r: 1,
    });
    expect(selectBestCandidate(candidates, target, "away")).toEqual({
      q: 2,
      r: 1,
    });
  });
});

describe("computePluralCandidateScore", () => {
  it("towards average distance", () => {
    const targets = [
      createCharacter({ id: "t1", position: { q: 2, r: 0 } }),
      createCharacter({ id: "t2", position: { q: 4, r: 0 } }),
    ];
    const result = computePluralCandidateScore(
      { q: 0, r: 0 },
      targets,
      "towards",
    );
    expect(result.distance).toBe(3);
  });

  it("away min distance", () => {
    const targets = [
      createCharacter({ id: "t1", position: { q: 2, r: 0 } }),
      createCharacter({ id: "t2", position: { q: 4, r: 0 } }),
    ];
    const result = computePluralCandidateScore({ q: 0, r: 0 }, targets, "away");
    expect(result.distance).toBe(2);
  });

  it("nearest target for dq dr", () => {
    const targets = [
      createCharacter({ id: "t1", position: { q: 1, r: 0 } }),
      createCharacter({ id: "t2", position: { q: 3, r: 0 } }),
    ];
    const result = computePluralCandidateScore(
      { q: 0, r: 0 },
      targets,
      "towards",
    );
    expect(result.absDq).toBe(1);
    expect(result.absDr).toBe(0);
  });

  it("nearest target not first index", () => {
    const targets = [
      createCharacter({ id: "t1", position: { q: 3, r: 0 } }),
      createCharacter({ id: "t2", position: { q: 1, r: 0 } }),
    ];
    const result = computePluralCandidateScore(
      { q: 0, r: 0 },
      targets,
      "towards",
    );
    expect(result.absDq).toBe(1);
    expect(result.absDr).toBe(0);
  });

  it("with obstacles", () => {
    const targets = [createCharacter({ id: "t1", position: { q: 2, r: 0 } })];
    const obstacles = new Set(["1,0", "0,1"]);
    const result = computePluralCandidateScore(
      { q: 0, r: 0 },
      targets,
      "towards",
      obstacles,
    );
    expect(result.escapeRoutes).toBe(4);
  });

  it("without obstacles default", () => {
    const targets = [createCharacter({ id: "t1", position: { q: 2, r: 0 } })];
    const result = computePluralCandidateScore(
      { q: 0, r: 0 },
      targets,
      "towards",
    );
    expect(result.escapeRoutes).toBe(6);
  });
});
