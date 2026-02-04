# Test Design Review: Move Skill Duplication

## Status: APPROVED

The test designs are comprehensive, well-structured, and ready for the coder to implement. No revisions required.

---

## Review Summary

### 1. Coverage Verification -- PASS

**Critical paths covered:**

- Duplication: Tests 8-9 (create new instance, insert after source)
- Limits: Tests 11-12 (MAX_MOVE_INSTANCES, MAX_SKILL_SLOTS)
- Removal: Tests 16-18 (remove duplicate, protect last, remove original)
- Priority: Tests 20-21 (higher priority selected, cascade to lower)

**Edge cases covered:**

- Last instance protection (test 17)
- Max limits from both dimensions (tests 11, 12)
- Non-Move duplication rejection (test 13)
- Nonexistent character/instanceId (tests 14, 15)
- Three-move cascade with middle-trigger pass (test 34)
- Original vs duplicate removal symmetry (test 18)

**Integration coverage:**

- HP-conditional movement both branches (tests 31, 32)
- Multi-character independence (test 33)
- Three-instance cascade with all priority paths (tests 33, 34)

**No missing critical paths identified.**

### 2. Feasibility Check -- PASS

**Test descriptions are clear and actionable.** Each test specifies:

- Exact setup steps with concrete values (positions, HP, instanceIds)
- Precise assertions with expected values
- Which helper functions to use

**Setup requirements are achievable:**

- All tests use existing patterns (`createCharacter`, `createSkill`, `useGameStore`, `computeDecisions`)
- New test files follow existing file naming conventions
- Test helpers need `instanceId` added (documented in Notes for Coder, item 1)

**Assertions are specific and verifiable:**

- Store state assertions use exact property checks
- UI assertions use Testing Library queries (`getByRole`, `queryByRole`)
- Decision engine assertions check `action.skill.mode` and `action.type`

**Minor observations (not blocking):**

- Test "duplicate-button-visible-for-move-skills" (line 354): The aria-label pattern `/duplicate move/i` assumes the button text includes "Move". The plan's implementation (step 9e) uses `Duplicate ${skill.name}` which produces "Duplicate Move". This is consistent.
- Test "remove-button-appears-for-duplicate-move-instances" (line 426): The assertion checks for buttons matching `/remove/i` with length 2. The coder should ensure the "Remove" buttons have accessible names like "Remove Move" to avoid collisions with the existing "Unassign" buttons (which use different text). This is workable since the plan differentiates "Remove" (for innate duplicates) from "Unassign" (for inventory skills).
- Test "each-move-instance-has-independent-mode-configuration" (line 465): References "Get both mode dropdowns" -- with 2 Move skills, `screen.getAllByRole("combobox", { name: /mode/i })` should return exactly 2. This is clear and feasible.

### 3. Spec Alignment -- PASS

**Acceptance criteria from session.md mapped to tests:**

| Acceptance Criterion                                        | Tests Covering It                                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Players can duplicate Move skill from Skills Panel          | Tests 23, 27 (button visible, click creates instance)                                                    |
| Each duplicate has independent priority ordering            | Tests 9, 20, 21 (insert after source, priority evaluation)                                               |
| Each duplicate has independent trigger/selector/mode config | Tests 10, 19, 29, 30 (default config, updateSkill by instanceId, independent mode, independent triggers) |
| Duplicates removable unless last instance                   | Tests 16, 17, 18 (remove duplicate, protect last, remove original)                                       |
| Max 3 Move instances enforced                               | Test 11 (MAX_MOVE_INSTANCES)                                                                             |
| Priority evaluation handles multiple Move instances         | Tests 20, 21, 22, 31-34 (cascade, evaluate-skills, integration scenarios)                                |
| All instances named "Move"                                  | Test 6 (getDefaultSkills-uses-registry-name-without-suffix)                                              |
| Tests verify duplicate behavior and limits                  | All 34 tests                                                                                             |

**No conflicts with existing patterns:**

- Tests use the same helper patterns as existing tests (e.g., `gameStore-skills.test.ts`)
- Component tests follow Testing Library best practices (user-centric queries, `userEvent`)
- Engine tests use pure function testing (no React dependencies)

**TDD compatibility (tests can fail first):**

- All tests reference functions/actions that don't exist yet (`duplicateSkill`, `generateInstanceId`)
- New assertions on `instanceId` will fail since the `Skill` type doesn't have it yet
- Existing test modifications (name change "Move Towards" -> "Move") will fail until implementation

### 4. Test File Organization -- PASS

| Test File                                           | Count                      | Rationale                                                                    |
| --------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `src/engine/skill-registry.test.ts`                 | 7                          | Co-located with `skill-registry.ts`. Extends existing test file.             |
| `src/stores/gameStore-skills.test.ts`               | 10                         | Co-located with store. Extends existing test file for skill operations.      |
| `src/engine/game-decisions-skill-priority.test.ts`  | 7 (3 unit + 4 integration) | Co-located with decision engine. Extends existing priority test file.        |
| `src/engine/game-decisions-evaluate-skills.test.ts` | 1                          | Co-located with decision engine. Extends existing evaluate-skills test file. |
| `src/components/SkillsPanel/SkillsPanel.test.tsx`   | 10                         | Co-located with SkillsPanel component. Extends existing test file.           |

All test files are existing files being extended (not new files), which is appropriate since the feature extends existing capabilities.

---

## Detailed Findings

### Strengths

1. **Excellent justification on every test.** Each test explains what bug or regression it prevents, making the test suite self-documenting.

2. **Strong integration test coverage.** The 4 integration tests validate the canonical use case (HP-conditional movement) with both branches, multi-character independence, and three-level cascade. These catch issues that unit tests alone would miss.

3. **Backward compatibility awareness.** The Notes for Coder section (items 1-6) proactively addresses test helper updates, existing test modifications, and the `instanceId` default pattern.

4. **Good separation of concerns.** Engine tests verify pure logic, store tests verify state mutations, component tests verify UI behavior. No test crosses boundaries unnecessarily.

5. **Edge case thoroughness.** Tests 13-15 (non-move rejection, nonexistent character, nonexistent instanceId) provide defensive coverage that matches the plan's "silent rejection" approach.

### Observations (Non-Blocking)

1. **IDLE_SKILL instanceId not directly tested.** The plan (Step 5) adds `instanceId: "__idle__"` to IDLE_SKILL in two files. While this is a low-risk mechanical change, there is no explicit test for it. This is acceptable because: (a) the IDLE_SKILL is a synthetic constant, (b) existing tests exercise idle behavior implicitly, and (c) TypeScript will catch a missing required field.

2. **React key test relies on console spy.** Test "react-keys-use-instanceId-no-duplicate-key-warnings" spies on `console.error` to detect duplicate key warnings. This is a well-established pattern in the React testing ecosystem and is feasible. The Notes for Coder (item 4) correctly documents the approach.

3. **The `evaluateSkillsForCharacter` test (test 22) references `rejectionReason === "trigger_failed"`.** Verified against the types file: `SkillRejectionReason` includes `"trigger_failed"` (line 278 of types.ts). This is correct.

4. **Existing tests will need minor updates.** Several existing SkillsPanel tests use `find((s) => s.id === "skill1")` for store lookups. After `updateSkill` switches to `instanceId`, these lookups remain correct because the test helper defaults `instanceId` to `id`. This backward compatibility strategy is sound.

---

## Conclusion

The 34 test designs across 5 files provide thorough coverage of the Move skill duplication feature. They align with the spec, are feasible to implement, follow established codebase patterns, and support TDD workflow (all tests will fail before implementation).

**Recommendation: Proceed to WRITE_TESTS phase.**
