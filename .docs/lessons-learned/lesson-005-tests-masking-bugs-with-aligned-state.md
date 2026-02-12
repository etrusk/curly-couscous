# Lesson 005: Tests masking bugs by manually aligning state

**Date:** 2026-02-12
**Category:** testing

## Context

`selectRecentDamageEvents` and `selectRecentWhiffEvents` filtered `e.tick === tick`, but after `processTick` the store tick is N+1 while events are stamped at N. All 20+ tests across 5 files passed because they manually set store tick equal to event tick, accidentally aligning with the buggy filter instead of simulating realistic post-`processTick` state.

## Lesson

When testing selectors or functions that operate on state produced by another function (e.g., `processTick`), tests should simulate the realistic output state of that producer, not construct a convenient state that happens to make assertions pass. Manually constructing state that bypasses the producer's actual behavior can hide off-by-one errors, ordering bugs, and invariant violations.

**Specific pattern to watch for:** If a state mutation increments a counter (tick, version, index) and stamps records with the pre-increment value, tests must set the counter to `pre + 1` to simulate the post-mutation state, not align both to the same value.

## Impact

- 20+ tests masked an off-by-one bug across 5 files for an unknown duration
- Both selectors always returned empty arrays in real usage (damage numbers and whiff indicators never displayed)
- Fix required updating all 5 test files to use realistic tick alignment (`store.tick = event.tick + 1`)
