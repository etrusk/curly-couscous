# Debug Investigations

This file documents debugging sessions, root cause analyses, and lessons learned from investigating issues.

## Format

Each investigation should include:

- **Issue**: Brief description of the problem
- **Date**: When the investigation occurred
- **Symptoms**: Observable behavior or errors
- **Root Cause**: What was actually causing the issue
- **Fix Applied**: How the issue was resolved
- **Prevention**: How to avoid this issue in the future
- **Related Files**: Files involved in the investigation

## Investigations

### INV-001: Intent Lines Not Rendering After Timing Fix

**Issue**: Intent lines stopped rendering after commit 44d5cf4 (action timing fix)

**Date**: 2026-01-27

**Symptoms**:

- No intent lines visible on the battle grid despite characters having pending actions
- IntentOverlay component rendering but showing 0 intents
- Browser console logs showed decisions being made but `selectIntentData` returning empty array

**Investigation Process**:

1. **Initial Hypothesis**: Suspected IntentOverlay component or SVG rendering issue
   - Added debug logging to IntentOverlay and IntentLine components
   - Confirmed components were receiving 0 intents from selector

2. **Selector Investigation**: Checked `selectIntentData` selector
   - Added debug logging showing `withActions: 0` despite decisions being made
   - Suspected actions weren't being applied to characters

3. **Engine Investigation**: Traced through processTick flow
   - Added logging to `computeDecisions`, `applyDecisions`, `resolveCombat`, `resolveMovement`, `clearResolvedActions`
   - Discovered actions WERE being applied (`withActions: 2`) but then cleared
   - Found `clearResolvedActions` was clearing actions with `resolvesAtTick: 0` on tick 0

4. **Root Cause Discovery**:
   - Commit 44d5cf4 changed timing formula from `tick + tickCost - 1` to `tick + tickCost`
   - Commit also "simplified" the `selectIntentData` filter from complex logic to `ticksRemaining >= 0`
   - The simplification removed the distinction between attack and movement actions
   - Original filter: attacks need `ticksRemaining > 0`, movement needs `ticksRemaining >= 0`
   - Broken filter: all actions need `ticksRemaining >= 0`

**Root Cause**:

The `selectIntentData` selector filter was incorrectly simplified in commit 44d5cf4. The comment at line 127-133 clearly stated the business logic:

- Attack actions should be filtered out when `ticksRemaining <= 0` (they're resolving/resolved)
- Movement actions should be shown even with `ticksRemaining = 0` (movement has no visible damage effect)

The actual filter at line 155 was:

```typescript
intent.action.type !== "idle" && intent.ticksRemaining >= 0;
```

This showed ALL actions (including attacks) with `ticksRemaining >= 0`, meaning attacks resolving on the current tick were included when they should be filtered out.

**Fix Applied**:

Restored the proper filter logic in `src/stores/gameStore-selectors.ts`:

```typescript
const filtered = mapped.filter(
  (intent) =>
    intent.action.type !== "idle" &&
    (intent.ticksRemaining > 0 ||
      (intent.action.type === "move" && intent.ticksRemaining >= 0)),
);
```

Also added two regression tests:

1. Test that attack actions with `ticksRemaining = 0` are filtered out
2. Test that movement actions with `ticksRemaining = 0` are included (movement exception)

**Prevention**:

1. **Never simplify complex business logic without tests**: The original filter had complex logic for a reason (documented in comments). The "simplification" broke the intended behavior.

2. **Test coverage for edge cases**: Add tests for boundary conditions (ticksRemaining = 0, 1, 2) for both attack and movement types.

3. **Document business logic in tests**: The comment explained the logic, but tests would have caught the regression immediately.

4. **Be suspicious of "cleanup" changes**: When a commit includes both feature work AND cleanup/refactoring, the cleanup often introduces bugs.

**Related Files**:

- `src/stores/gameStore-selectors.ts` (fix location)
- `src/stores/gameStore-selectors.test.ts` (regression tests added)
- `src/components/BattleViewer/IntentOverlay.tsx`
- `src/components/BattleViewer/IntentLine.tsx`
- `src/engine/game-core.ts`
- `src/engine/game-decisions.ts`
- `src/engine/game-actions.ts`

**Commit**: (To be added after commit)

**Lessons Learned**:

- Comments describing complex business logic should be matched by tests
- "Simplifications" of multi-branch conditionals deserve extra scrutiny
- Debug logging at selector boundaries is invaluable for diagnosing data flow issues

**Update (2026-01-27)**: This investigation was partially incorrect. The "fix" restored a movement exception that was itself a bug. See commit 049fb6e which correctly unified filtering to `ticksRemaining >= 0` for ALL actions, matching spec.md line 122. The spec always required uniform filtering; the "movement exception" was a misinterpretation. The movement/attack distinction is purely visual (dashed vs solid lines), not filtering logic.

---

### INV-002: TDD Command Context Bloat

**Issue**: `.claude/commands/tdd.md` consuming excessive tokens on every invocation

**Date**: 2026-01-27

**Symptoms**:

- tdd.md file was 634 lines (~7,000 tokens)
- Research shows memory files should total 1.3k-2.2k tokens combined
- Command file loads on EVERY prompt, consuming scarce context budget
- Redundant agent summary examples repeated 12+ times across phases
- Verbose Task tool prompts shown in full for every phase transition

**Root Cause**:

The file grew organically with detailed examples and explanations for each phase. While helpful for initial understanding, the repetition violated research-backed context management principles:

1. **Context is finite with diminishing returns**: Adding 10% irrelevant content reduces accuracy by 23%
2. **Optimal utilization is 60-75%**: More context increases interference
3. **Separation of concerns**: Static patterns vs dynamic task state
4. **Memory files should be minimal**: Combined total 1.3k-2.2k tokens

**Fix Applied**:

Reduced tdd.md from 634 lines to 329 lines (~48% reduction, estimated ~65% token reduction):

1. **Consolidated agent summary format**: Defined once at top, removed 12 repetitive examples
2. **Phase routing table**: Condensed all phases into single table instead of verbose procedural text
3. **Simplified Task tool prompts**: Template references instead of full examples for each phase
4. **Removed redundant reminders**: "AUTOMATICALLY spawn" stated once, not repeated 12 times
5. **Compressed session state template**: Showed minimal template instead of verbose example
6. **Eliminated explanatory redundancy**: Trusted agents have access to documentation

**Prevention**:

1. **Apply token budgets to command files**: Command files load on every invocation—keep them minimal
2. **Define patterns once, reference many**: Use tables and templates instead of repetition
3. **Separate instructions from examples**: Show one example, not twelve variations
4. **Regular context audits**: Review command files against research-backed token budgets

**Related Files**:

- `.claude/commands/tdd.md` (reduced from 634 to 329 lines)
- `.claude/commands/tdd.md.backup` (original preserved)
- `.docs/research/Context_Memory_and_RAG_for_AI_Coding_Assistants.md` (research source)

**Commit**: (To be added after commit)

**Lessons Learned**:

- Command files are "hot path" context—they load on EVERY invocation
- Repetition for clarity has a cost—define once, reference many
- Research-backed token budgets (1.3k-2.2k combined) should guide all memory files
- Context is scarce; treat it like a precious budget

<!-- Add investigation records here in reverse chronological order (newest first) -->
