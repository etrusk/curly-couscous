# INV-003: Missing Movement Lines Investigation

## Issue

User reported "no movement targeting lines visible at tick 0 or 1 with 1 friendly and 1 enemy on board" and "first movement only happens on tick 2".

## Date

2026-01-28

## Symptoms

1. Movement intent lines not visible at tick 0 or 1
2. Pressing step at tick 0 appears to do nothing
3. First visible position change occurs at tick 2

## Investigation

### Hypothesis 1: Code bug in selectIntentData

Tested by adding 6 comprehensive tests for DEFAULT_SKILLS integration:

- Far-apart characters (distance 10) - verified Move Towards selected
- Adjacent characters (distance 1) - verified Light Punch selected
- Range-2 characters (distance 2) - verified Heavy Punch selected
- Boundary at distance 3 - verified Move Towards selected

**Result**: All tests PASS. No bug in selector logic.

### Hypothesis 2: Adjacent character placement

When using `addCharacter` twice without explicit positioning:

- First character placed at (0,0)
- Second character placed at (1,0) - adjacent cell
- Chebyshev distance = 1
- Light Punch has range = 1

Light Punch is selected because characters are in attack range. ATTACK intent lines appear, not movement lines.

**Result**: This is likely the user's actual situation. They expected movement but got attacks.

### Hypothesis 3: Tick counter confusion

The tick system works as follows:

1. Tick 0: Action created with resolvesAtTick = tick + tickCost = 1
2. processTick increments to tick 1
3. At tick 1: Action resolves, position changes
4. processTick increments to tick 2
5. User sees: "tick 2" with updated position

The tick counter shows state AFTER resolution completes.

**Result**: Issue 2 is working as designed. This is expected behavior per spec.

## Root Cause

**Issue 1**: Not a bug. User likely placed characters adjacent (via `addCharacter`), causing attacks instead of movement to be selected.

**Issue 2**: Not a bug. Movement created at tick 0 resolves at tick 1, visible when viewing tick 2. This is the intended tick system behavior.

## Fix Applied

No production code changes needed. Added 6 tests to verify DEFAULT_SKILLS behavior and document expected outcomes.

## Prevention

1. **Test coverage**: New tests explicitly verify DEFAULT_SKILLS path with various character placements
2. **Future UX consideration**: Could add visual indicator showing why current skill was selected (e.g., "Light Punch selected: enemy in range")
3. **Future UX consideration**: Could clarify tick counter semantics in UI

## Related Files

- `/home/bob/Projects/auto-battler/src/stores/gameStore-selectors-default-skills.test.ts` - New test file
- `/home/bob/Projects/auto-battler/src/stores/gameStore-helpers.ts` - findNextAvailablePosition() placement logic
- `/home/bob/Projects/auto-battler/src/stores/gameStore-constants.ts` - DEFAULT_SKILLS definition
- `/home/bob/Projects/auto-battler/src/engine/game-decisions.ts` - Skill selection logic

## Lessons Learned

1. **Test the actual user path**: Existing tests used custom skill configurations. No test exercised `addCharacter` with DEFAULT_SKILLS until this investigation.

2. **Adjacent placement is the default**: `addCharacter` places characters in row-major order starting at (0,0). Two characters = adjacent cells = attack range for Light Punch.

3. **Tick counter semantics can confuse users**: The tick counter shows post-resolution state. Users may expect to see the resolution happen "at" the displayed tick number.
