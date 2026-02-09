# Implementation Plan: Remove Redundant Manual Memoization

## Overview

Remove 8 redundant `useMemo`/`useCallback` calls across 7 files. React Compiler (ADR-020) handles all memoization automatically. This is a pure refactor with no behavioral changes.

## Spec Alignment

- [x] Aligns with `.docs/spec.md` -- no spec-level changes (pure internal refactor)
- [x] Consistent with `.docs/architecture.md` -- architecture lists React Compiler as memoization strategy
- [x] Follows `.docs/patterns/index.md` -- no pattern conflicts
- [x] No conflicts with `.docs/decisions/index.md` -- ADR-020 explicitly defers this cleanup as a follow-up task

## New Tests Needed

**NO.** This is a behavior-preserving refactor. The exploration confirmed:

- No test files reference `useMemo` or `useCallback`
- All tests are behavior-focused (user-centric queries, DOM assertions)
- Existing 16 related test files will validate correctness

## Implementation Steps

Execute in order. Each step is one file edit (except Grid.tsx which has two sites in one file).

### Step 1: Token.tsx -- useMemo to direct call

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx`

**Remove import:**

```diff
-import { useMemo } from "react";
```

**Transform (lines 108-112):**

```diff
-  // Get letter for slot position (memoized to avoid recomputation on re-renders)
-  const letter = useMemo(
-    () => slotPositionToLetter(slotPosition),
-    [slotPosition],
-  );
+  const letter = slotPositionToLetter(slotPosition);
```

**Rationale:** Trivial pure function of a primitive prop. 4 other callsites already use it without memoization.

### Step 2: Cell.tsx -- useCallback to inline function

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx`

**Remove import:**

```diff
-import { useCallback } from "react";
```

**Transform (lines 39-41):**

```diff
-  const handleClick = useCallback(() => {
-    onClick?.(q, r);
-  }, [onClick, q, r]);
+  const handleClick = () => {
+    onClick?.(q, r);
+  };
```

**Rationale:** Simple event handler closure over props. Other handlers in the codebase (e.g., Token.tsx's handleClick, handleKeyDown) already use inline functions.

### Step 3: Grid.tsx -- two useMemo calls to direct calls

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx`

**Remove import:**

```diff
-import { useMemo } from "react";
```

**Transform site 1 (line 38):**

```diff
-  // Compute viewBox for SVG (memoized)
-  const viewBox = useMemo(() => computeHexViewBox(hexSize), [hexSize]);
+  const viewBox = computeHexViewBox(hexSize);
```

**Transform site 2 (line 41):**

```diff
-  // Generate all hex coordinates (memoized)
-  const allHexes = useMemo(() => generateAllHexes(), []);
+  const allHexes = generateAllHexes();
```

**Rationale:** 4 overlay components (IntentOverlay, WhiffOverlay, DamageOverlay, TargetingLineOverlay) already call `computeHexViewBox` directly without memoization. `generateAllHexes()` has empty deps (constant), which the compiler handles as a constant.

### Step 4: BattleViewer.tsx -- useCallback to inline function

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx`

**Update import (remove useCallback, keep useState and useRef):**

```diff
-import { useState, useRef, useCallback } from "react";
+import { useState, useRef } from "react";
```

**Transform (lines 99-111):**

```diff
-  // Handle background click to deselect in idle mode
-  const handleBackgroundClick = useCallback(
-    (e: React.MouseEvent) => {
-      if (selectionMode !== "idle") return;
-      // Only deselect when clicking the container itself, not children
-      if (
-        e.target === e.currentTarget ||
-        e.target === gridContainerRef.current
-      ) {
-        actions.selectCharacter(null);
-      }
-    },
-    [selectionMode, actions],
-  );
+  // Handle background click to deselect in idle mode
+  const handleBackgroundClick = (e: React.MouseEvent) => {
+    if (selectionMode !== "idle") return;
+    // Only deselect when clicking the container itself, not children
+    if (
+      e.target === e.currentTarget ||
+      e.target === gridContainerRef.current
+    ) {
+      actions.selectCharacter(null);
+    }
+  };
```

**Rationale:** Standard event handler closure. React Compiler auto-memoizes this.

### Step 5: RuleEvaluations.tsx -- useMemo to direct computation

**File:** `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`

**Update import (remove useMemo, keep useState):**

```diff
-import { useState, useMemo } from "react";
+import { useState } from "react";
```

**Transform (lines 346-351):**

```diff
-  // Create a map from character ID to character for O(1) lookup
-  const characterMap = useMemo(() => {
-    const map = new Map<string, Character>();
-    allCharacters.forEach((c: Character) => map.set(c.id, c));
-    return map;
-  }, [allCharacters]);
+  const characterMap = new Map<string, Character>();
+  allCharacters.forEach((c: Character) => characterMap.set(c.id, c));
```

**Rationale:** Data transformation of Zustand selector output. React Compiler handles this. The map is consumed within the same render only.

### Step 6: useWhiffIndicators.ts -- useMemo to direct computation

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts`

**Remove import:**

```diff
-import { useMemo } from "react";
```

**Transform (lines 30-41):**

```diff
-  return useMemo(() => {
-    const cellMap = new Map<string, WhiffIndicatorData>();
-    for (const event of whiffEvents) {
-      const key = positionKey(event.targetCell);
-      cellMap.set(key, {
-        cellKey: key,
-        position: event.targetCell,
-        actionType: event.actionType,
-      });
-    }
-    return Array.from(cellMap.values());
-  }, [whiffEvents]);
+  const cellMap = new Map<string, WhiffIndicatorData>();
+  for (const event of whiffEvents) {
+    const key = positionKey(event.targetCell);
+    cellMap.set(key, {
+      cellKey: key,
+      position: event.targetCell,
+      actionType: event.actionType,
+    });
+  }
+  return Array.from(cellMap.values());
```

**Rationale:** Pure data transformation of Zustand selector output. React Compiler handles memoization.

### Step 7: useDamageNumbers.ts -- useMemo to direct computation

**File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.ts`

**Remove import:**

```diff
-import { useMemo } from "react";
```

**Transform (lines 37-68):**

```diff
-  return useMemo(() => {
-    // Build lookup maps
-    const tokenMap = new Map(tokenData.map((t) => [t.id, t]));
-
-    // Group by target
-    const grouped = new Map<string, DamageNumberData>();
-
-    for (const event of damageEvents) {
-      const target = tokenMap.get(event.targetId);
-      const source = tokenMap.get(event.sourceId);
-      if (!target || !source) continue;
-
-      if (!grouped.has(event.targetId)) {
-        grouped.set(event.targetId, {
-          targetId: event.targetId,
-          targetPosition: target.position,
-          damages: [],
-          totalDamage: 0,
-        });
-      }
-
-      const data = grouped.get(event.targetId)!;
-      data.damages.push({
-        attackerId: event.sourceId,
-        attackerFaction: source.faction,
-        amount: event.damage,
-      });
-      data.totalDamage += event.damage;
-    }
-
-    return Array.from(grouped.values());
-  }, [damageEvents, tokenData]);
+  // Build lookup maps
+  const tokenMap = new Map(tokenData.map((t) => [t.id, t]));
+
+  // Group by target
+  const grouped = new Map<string, DamageNumberData>();
+
+  for (const event of damageEvents) {
+    const target = tokenMap.get(event.targetId);
+    const source = tokenMap.get(event.sourceId);
+    if (!target || !source) continue;
+
+    if (!grouped.has(event.targetId)) {
+      grouped.set(event.targetId, {
+        targetId: event.targetId,
+        targetPosition: target.position,
+        damages: [],
+        totalDamage: 0,
+      });
+    }
+
+    const data = grouped.get(event.targetId)!;
+    data.damages.push({
+      attackerId: event.sourceId,
+      attackerFaction: source.faction,
+      amount: event.damage,
+    });
+    data.totalDamage += event.damage;
+  }
+
+  return Array.from(grouped.values());
```

**Rationale:** Pure data transformation of two Zustand selector outputs. React Compiler handles memoization.

## Verification

After all 7 steps:

1. `npm run type-check` -- Confirms no TypeScript errors (unused imports would cause errors with strict mode)
2. `npm run lint` -- Confirms no ESLint violations (react-compiler plugin validates compatibility)
3. `npm run test` -- Confirms all ~1434 tests pass (behavioral equivalence)
4. `npm run build` -- Confirms production build succeeds

## Risk Assessment

**Risk: LOW**

- All 8 removals are straightforward substitutions
- No `React.memo` wrappers in the codebase that depend on referential stability
- No `useEffect` dependencies on any of these memoized values
- No external library subscriptions requiring stable references
- 16 test files cover the affected components with behavior-focused assertions
- The existing codebase already has the direct-call pattern in 4+ overlay components and 4+ utility callsites, so this change aligns with the dominant pattern
- React Compiler's `eslint-plugin-react-compiler` will validate that all transformed code remains compiler-compatible

**Rollback:** If any test fails, each step is independently revertible since files are independent.

## Import Cleanup Summary

| File                  | Hook Removed  | Import Before                                           | Import After                               |
| --------------------- | ------------- | ------------------------------------------------------- | ------------------------------------------ |
| Token.tsx             | `useMemo`     | `import { useMemo } from "react"`                       | (line deleted)                             |
| Cell.tsx              | `useCallback` | `import { useCallback } from "react"`                   | (line deleted)                             |
| Grid.tsx              | `useMemo`     | `import { useMemo } from "react"`                       | (line deleted)                             |
| BattleViewer.tsx      | `useCallback` | `import { useState, useRef, useCallback } from "react"` | `import { useState, useRef } from "react"` |
| RuleEvaluations.tsx   | `useMemo`     | `import { useState, useMemo } from "react"`             | `import { useState } from "react"`         |
| useWhiffIndicators.ts | `useMemo`     | `import { useMemo } from "react"`                       | (line deleted)                             |
| useDamageNumbers.ts   | `useMemo`     | `import { useMemo } from "react"`                       | (line deleted)                             |

## Commit Convention

Single commit: `refactor(ui): remove manual memoization redundant with React Compiler`

This completes the cleanup deferred by ADR-020.
