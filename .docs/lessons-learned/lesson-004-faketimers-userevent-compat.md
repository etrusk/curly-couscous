# Lesson 004: fakeTimers requires shouldAdvanceTime for userEvent compatibility

**Date:** 2026-02-10
**Category:** testing

## Context

During the Skill Name Tooltips implementation, the IMPLEMENT agent spent ~100K tokens (18 exchanges) — roughly 2.5x a typical implementation phase. A significant portion of debugging time was spent discovering that `vi.useFakeTimers()` blocks `userEvent.hover()` from resolving, because userEvent internally uses real timers (e.g., `setTimeout` for pointer event sequencing) that get frozen by fake timers.

## Lesson

When tests combine fake timers (`vi.useFakeTimers()`) with Testing Library's `userEvent` (hover, click, etc.), the vitest config must include `fakeTimers: { shouldAdvanceTime: true }`. This setting allows fake timers to auto-advance when real time passes, unblocking userEvent's internal timer usage while still giving tests control over explicit `vi.advanceTimersByTime()` calls.

## Impact

- The fix was a one-line config change in `vite.config.ts` (unit test project `fakeTimers` option)
- Without this knowledge, any future test involving both fake timers and userEvent will hit the same debugging cycle
- Test designers should flag "uses fake timers + userEvent" combinations with a setup note referencing this config requirement

## Action

Test designers: When designing tests that combine `vi.useFakeTimers()` with `userEvent`, include a Setup note: "Requires `fakeTimers: { shouldAdvanceTime: true }` in vitest config (see Lesson 004)."
