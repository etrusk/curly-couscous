# Exploration Findings

## Task Understanding

Remove all manual `useMemo` and `useCallback` calls that are now redundant with React Compiler (babel-plugin-react-compiler 1.0.0, adopted in ADR-020). The compiler automatically memoizes component renders and hook results during the build step. Manual memoization is harmless but adds unnecessary code complexity. Replace with direct computations / inline functions.

## Summary of Findings

**Total occurrences: 8** (5 useMemo, 2 useCallback, 1 useCallback -- confirmed by ADR-020 which states "8 manual useMemo/useCallback sites")

All 8 are **redundant and safe to remove**. None involve external API subscriptions, imperative handles, or patterns the React Compiler cannot optimize. Every call is either a simple computation, a data transformation from Zustand selectors, or an event handler closure.

## Detailed Occurrence Analysis

### 1. Token.tsx -- useMemo (line 109)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx`
- **Line:** 109-112
- **What it memoizes:** `slotPositionToLetter(slotPosition)` -- a trivial string computation (while loop with modular arithmetic, ~3 iterations max for slot positions < 702)
- **Deps:** `[slotPosition]`
- **Redundant:** YES. Pure function of a primitive prop. React Compiler will cache this automatically. Other callers of `slotPositionToLetter` in the codebase (CharacterPanel.tsx:30, RuleEvaluations.tsx:236, RuleEvaluations.tsx:286, CharacterTooltip.tsx:267) already call it directly without useMemo.
- **Change:** Replace `const letter = useMemo(() => slotPositionToLetter(slotPosition), [slotPosition])` with `const letter = slotPositionToLetter(slotPosition)`. Remove `useMemo` from import.

### 2. Cell.tsx -- useCallback (line 39)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx`
- **Line:** 39-41
- **What it memoizes:** `handleClick` -- a simple event handler calling `onClick?.(q, r)`
- **Deps:** `[onClick, q, r]`
- **Redundant:** YES. Simple closure over props. React Compiler memoizes this automatically. No external subscription or imperative API involved.
- **Change:** Replace `const handleClick = useCallback(() => { onClick?.(q, r); }, [onClick, q, r])` with `const handleClick = () => { onClick?.(q, r); }`. Remove `useCallback` from import.

### 3. RuleEvaluations.tsx -- useMemo (line 347)

- **File:** `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx`
- **Line:** 347-351
- **What it memoizes:** `characterMap` -- builds a `Map<string, Character>` from `allCharacters` array for O(1) lookup
- **Deps:** `[allCharacters]`
- **Redundant:** YES. Data transformation of Zustand selector output. React Compiler handles this. The map is only used within the same render.
- **Change:** Replace `const characterMap = useMemo(() => { ... }, [allCharacters])` with direct `const characterMap = new Map<string, Character>(); allCharacters.forEach((c: Character) => map.set(c.id, c));` or inline equivalent. Remove `useMemo` from import (keep `useState`).

### 4. Grid.tsx -- useMemo (line 38)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx`
- **Line:** 38
- **What it memoizes:** `computeHexViewBox(hexSize)` -- iterates 91 hexes, computes 6 vertices each (546 vertex computations + bounding box)
- **Deps:** `[hexSize]`
- **Redundant:** YES. Pure function of a prop. React Compiler caches this automatically. Other callers (IntentOverlay.tsx:103, WhiffOverlay.tsx:19, DamageOverlay.tsx:18, TargetingLineOverlay.tsx:90) already call `computeHexViewBox(hexSize)` directly without useMemo.
- **Change:** Replace with `const viewBox = computeHexViewBox(hexSize)`. Remove `useMemo` from import.

### 5. Grid.tsx -- useMemo (line 41)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx`
- **Line:** 41
- **What it memoizes:** `generateAllHexes()` -- generates 91 hex coordinates with sorting
- **Deps:** `[]` (empty, effectively a constant)
- **Redundant:** YES. No dependencies means the compiler will treat it as a constant. React Compiler memoizes values with stable deps.
- **Change:** Replace with `const allHexes = generateAllHexes()`. Remove `useMemo` from import (already removed in change above).

### 6. BattleViewer.tsx -- useCallback (line 99)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx`
- **Line:** 99-111
- **What it memoizes:** `handleBackgroundClick` -- event handler checking selectionMode and calling `actions.selectCharacter(null)`
- **Deps:** `[selectionMode, actions]`
- **Redundant:** YES. Standard event handler closure over local state/store values. React Compiler handles this. No external imperative API.
- **Change:** Replace with inline function definition. Remove `useCallback` from import (keep `useState, useRef`).

### 7. useWhiffIndicators.ts -- useMemo (line 30)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts`
- **Line:** 30-41
- **What it memoizes:** Data transformation -- deduplicates whiff events by cell key into `WhiffIndicatorData[]`
- **Deps:** `[whiffEvents]`
- **Redundant:** YES. Pure data transformation of Zustand selector output. React Compiler handles this. No external subscription.
- **Change:** Replace with direct computation. Remove `useMemo` from import.

### 8. useDamageNumbers.ts -- useMemo (line 37)

- **File:** `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.ts`
- **Line:** 37-68
- **What it memoizes:** Data transformation -- groups damage events by target, enriches with positions and factions
- **Deps:** `[damageEvents, tokenData]`
- **Redundant:** YES. Pure data transformation of Zustand selector outputs. React Compiler handles this. No external subscription.
- **Change:** Replace with direct computation. Remove `useMemo` from import.

## Relevant Files

### Files to modify (8 files with useMemo/useCallback to remove)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Token.tsx` - Remove useMemo on line 109 (slotPositionToLetter)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.tsx` - Remove useCallback on line 39 (handleClick)
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/RuleEvaluations.tsx` - Remove useMemo on line 347 (characterMap)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Grid.tsx` - Remove 2x useMemo on lines 38, 41 (viewBox, allHexes)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.tsx` - Remove useCallback on line 99 (handleBackgroundClick)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.ts` - Remove useMemo on line 30 (whiff data transform)
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.ts` - Remove useMemo on line 37 (damage data transform)

### Test files (should pass without modification)

- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-lettering.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-interaction.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-visual.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-hover.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/token-accessibility.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/Cell.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/BattleViewer.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/battle-viewer-tooltip.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-basic.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-next-action.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-skill-priority.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/RuleEvaluations/rule-evaluations-action-summary.test.tsx`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useWhiffIndicators.test.ts`
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/hooks/useDamageNumbers.test.ts`

### Reference files (confirm pattern consistency)

- `/home/bob/Projects/auto-battler/vite.config.ts` - Confirms React Compiler is configured (line 9)
- `/home/bob/Projects/auto-battler/.docs/decisions/adr-020-react-compiler-adoption.md` - ADR documenting the decision
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/IntentOverlay.tsx` - Calls computeHexViewBox directly (no useMemo) -- confirms pattern
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/WhiffOverlay.tsx` - Calls computeHexViewBox directly (no useMemo) -- confirms pattern
- `/home/bob/Projects/auto-battler/src/components/BattleViewer/DamageOverlay.tsx` - Calls computeHexViewBox directly (no useMemo) -- confirms pattern

## Existing Patterns

- **Direct function calls without memoization** - Already used in 4 overlay components (IntentOverlay, WhiffOverlay, DamageOverlay, TargetingLineOverlay) that call `computeHexViewBox()` directly. Grid.tsx is the outlier with useMemo.
- **Direct slotPositionToLetter calls** - Already used in CharacterPanel.tsx, CharacterTooltip.tsx, and RuleEvaluations.tsx (lines 236, 286) without useMemo. Token.tsx is the outlier.
- **Inline event handlers** - Already used throughout Token.tsx (handleClick, handleKeyDown, handleMouseEnter, handleMouseLeaveLocal all without useCallback). Cell.tsx and BattleViewer.tsx are the outliers.
- **No React.memo** - Zero instances of React.memo in the codebase. React Compiler handles component memoization.
- **No test memoization assertions** - No test files reference useMemo or useCallback. Tests are behavior-focused, not implementation-focused. Changes are safe.

## Dependencies

- React Compiler (babel-plugin-react-compiler 1.0.0) must remain enabled in vite.config.ts
- eslint-plugin-react-compiler validates that code is compiler-compatible

## Constraints Discovered

- **No React.memo usage** - The codebase has zero React.memo calls, so there are no memo wrappers that might depend on referential stability of callbacks from useCallback. This makes all useCallback removals safe.
- **Zustand selectors provide referential stability** - Store selectors already handle reference equality. The useMemo/useCallback calls are not providing stability that the store doesn't already guarantee.
- **All useMemo/useCallback are internal** - None pass memoized values to external libraries or imperative APIs that require referential stability (e.g., no useEffect dependencies on memoized values that would cause cascading re-runs).
- **This is a pure cleanup** - No behavioral changes. No new tests needed. Existing 1434 tests should pass as-is.

## Open Questions

- None. All 8 occurrences are straightforward redundant memoization. No edge cases requiring judgment calls.
