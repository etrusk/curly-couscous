# Exploration: Skill Slot Data Model Refactor

## 1. Current Skill Data Model

### `Skill` interface (`src/engine/types.ts:54-66`)

```typescript
export interface Skill {
  id: string; // Registry ID (shared by duplicates)
  instanceId: string; // Unique per-instance (ADR-009)
  name: string;
  tickCost: number;
  range: number;
  damage?: number; // Attack skills
  healing?: number; // Heal skills
  mode?: "towards" | "away"; // Move skill ONLY -- the "special-case" field
  enabled: boolean;
  triggers: Trigger[];
  selectorOverride?: Selector;
}
```

### `SkillDefinition` interface (`src/engine/skill-registry.ts:26-36`)

```typescript
export interface SkillDefinition {
  id: string;
  name: string;
  tickCost: number;
  range: number;
  damage?: number;
  healing?: number;
  mode?: "towards" | "away";
  innate: boolean;
  defaultSelector?: Selector;
}
```

### `Selector` interface (`src/engine/types.ts:86-93`)

```typescript
export interface Selector {
  type:
    | "nearest_enemy"
    | "nearest_ally"
    | "lowest_hp_enemy"
    | "lowest_hp_ally"
    | "self";
}
```

### Action type inference (`src/engine/game-actions.ts:16-39`)

Action type is inferred from skill properties:

- `damage !== undefined` => "attack"
- `healing !== undefined` => "heal"
- `mode !== undefined` => "move"

Must have exactly one. This is the critical coupling point -- `mode` presence determines "this is a Move skill."

## 2. Selector System

### Current selectors (5 total)

| Selector          | Candidates                    | Sort                          | File Location          |
| ----------------- | ----------------------------- | ----------------------------- | ---------------------- |
| `nearest_enemy`   | Opposite faction, alive       | Distance from evaluator (asc) | `selectors.ts:85-91`   |
| `nearest_ally`    | Same faction, not self, alive | Distance from evaluator (asc) | `selectors.ts:93-102`  |
| `lowest_hp_enemy` | Opposite faction, alive       | HP (asc)                      | `selectors.ts:104-110` |
| `lowest_hp_ally`  | Same faction, not self, alive | HP (asc)                      | `selectors.ts:112-121` |
| `self`            | Self                          | N/A                           | `selectors.ts:82-83`   |

### Tiebreaking

All selectors use: lower R coordinate, then lower Q coordinate (`selectors.ts:12-17`).

### Where selectors are evaluated

1. **Decision phase**: `game-decisions.ts:107` -- `evaluateSelector(selector, character, state.characters)`
2. **Skill evaluation UI**: `game-decisions.ts:244` -- same function for tooltip display
3. **Movement target selector**: `gameStore-selectors.ts:287` -- finds Move skill target for targeting lines

### Monolithic selector field

Currently `selectorOverride` combines target + criterion into one string:

- `nearest_enemy` = target:enemy + criterion:nearest
- `lowest_hp_ally` = target:ally + criterion:lowest_hp

The SkillsPanel UI already decomposes this into two dropdowns (`decomposeSelector`/`composeSelector` at `SkillsPanel.tsx:28-78`), but the data model is still monolithic.

### Missing mirror selectors

Per acceptance criteria, the refactor needs to add:

- `furthest_enemy` / `furthest_ally` (reverse of nearest)
- `highest_hp_enemy` / `highest_hp_ally` (reverse of lowest_hp)

## 3. Move Specialness

### What makes Move unique

1. **`mode` field** (`types.ts:62`): Only Move has it. Used by:
   - `getActionType()` (`game-actions.ts:19`) -- presence of `mode` => action type is "move"
   - `computeMoveDestination()` (`game-movement.ts:33`) -- uses mode to select towards/away pathfinding
   - `createSkillAction()` (`game-actions.ts:100`) -- passes `skill.mode!` to computeMoveDestination
   - UI: `SkillsPanel.tsx:208` -- `skill.mode !== undefined` determines isMove
   - UI: `InventoryPanel.tsx:59` -- displays mode in stats
   - Store: `gameStore.ts:369` -- `sourceSkill.mode === undefined` gates duplication
   - Store: `gameStore.ts:375` -- `s.mode !== undefined` counts Move instances
   - Store selector: `gameStore-selectors.ts:287` -- finds Move skill by `s.mode !== undefined`
   - Formatters: `rule-evaluations-formatters.ts:124-128` -- mode determines Move display text

2. **Duplication** (`gameStore.ts:351-404`):
   - Only skills with `mode !== undefined` can be duplicated
   - Hard-coded `MAX_MOVE_INSTANCES = 3` in `gameStore-constants.ts:25`
   - New duplicates always get `mode: "towards"` (hardcoded in `gameStore.ts:393`)
   - Inserted directly after source skill in priority list
   - Innate Move skills can only be removed if moveCount > 1

3. **Legacy "hold" mode** (`game-decisions.ts:86,213`):
   - Deprecated graceful degradation -- casts `skill.mode as string` to check for "hold"
   - Treats "hold" as disabled with a console warning

4. **Registry definition** (`skill-registry.ts:63-68`):
   - Only `move-towards` has `mode: "towards"` and `innate: true`
   - No `move-away` entry -- away is created via mode change or duplication

## 4. UI Surface

### Components that render skill configuration

| Component                  | File                                                            | Reads `mode`                      | Reads `selectorOverride`                |
| -------------------------- | --------------------------------------------------------------- | --------------------------------- | --------------------------------------- |
| SkillsPanel                | `src/components/SkillsPanel/SkillsPanel.tsx`                    | Yes (isMove check, mode dropdown) | Yes (decomposed into category+strategy) |
| InventoryPanel             | `src/components/InventoryPanel/InventoryPanel.tsx`              | Yes (displays mode in stats)      | No                                      |
| RuleEvaluations formatters | `src/components/RuleEvaluations/rule-evaluations-formatters.ts` | Yes (Move action display text)    | No                                      |
| CharacterTooltip           | `src/components/BattleViewer/CharacterTooltip.test.tsx`         | Indirectly (via formatters)       | Indirectly                              |

### SkillsPanel already has decomposed selector UI

The UI already presents separate "Target" (category: enemy/ally/self) and "Selection" (strategy: nearest/lowest_hp) dropdowns. This maps well to the proposed `target` + `criterion` split. The `decomposeSelector` and `composeSelector` functions would be replaced by direct data model access.

## 5. Test Coverage

### Key test files (grouped by concern)

**Skill type / action inference:**

- `src/engine/game-decisions-action-type-inference.test.ts` -- Tests getActionType() logic (damage=>attack, healing=>heal, mode=>move)

**Skill evaluation / priority:**

- `src/engine/game-decisions-evaluate-skills.test.ts` -- Tests evaluateSkillsForCharacter(), includes "hold" mode tests
- `src/engine/game-decisions-skill-priority.test.ts` -- Tests priority ordering with Move skills, references `skill.mode`

**Move destination:**

- `src/engine/game-decisions-move-destination-basic.test.ts` -- Basic towards/away movement
- `src/engine/game-decisions-move-destination-wall-boundary.test.ts` -- Wall/boundary away-mode edge cases

**Selectors:**

- `src/engine/selectors-nearest-enemy.test.ts`, `selectors-nearest-ally.test.ts`
- `src/engine/selectors-lowest-hp-enemy.test.ts`, `selectors-lowest-hp-ally.test.ts`
- `src/engine/selectors-self.test.ts`, `selectors-tie-breaking.test.ts`, `selectors-edge-cases.test.ts`
- `src/engine/selectors-metric-independence.test.ts`

**Duplication:**

- `src/stores/gameStore-skills-duplication.test.ts` -- 26 tests: duplicate, limit, mode independence

**Skill assignment/removal:**

- `src/stores/gameStore-skills.test.ts` -- updateSkill, moveSkillUp/Down
- `src/stores/gameStore-skills-faction-exclusivity.test.ts` -- Faction-scoped assignment

**Skill registry:**

- `src/engine/skill-registry.test.ts` -- Registry entries, default skills, instanceId generation

**SkillsPanel UI:**

- `src/components/SkillsPanel/SkillsPanel.test.tsx` -- Mode dropdown, duplicate button, remove button

**Integration:**

- `src/engine/game-integration.test.ts`, `game-healing-integration.test.ts`
- `src/engine/game-core-process-tick-resolution-order.test.ts`

**Store selectors (mode-dependent):**

- `src/stores/gameStore-selectors-movement-target.test.ts` -- selectMovementTargetData, finds skill by mode
- `src/stores/gameStore-selectors-movement-intent.test.ts` -- Movement intent lines
- `src/stores/gameStore-selectors-intent-preview.test.ts` -- Intent preview with Move skills

### Total test count: ~1086 passing (per current-task.md)

### Test helpers (2 files, both need updates)

- `src/engine/game-test-helpers.ts:47-61` -- `createSkill()` with `mode` field
- `src/stores/gameStore-test-helpers.ts:28-41` -- `createSkill()` with `mode` field

## 6. Critical Files (ranked by change impact)

| Rank | File                                                            | Changes Needed                                                                                  |
| ---- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1    | `src/engine/types.ts`                                           | Replace `mode?` with `behavior?`, add new Selector types. Core type change cascades everywhere. |
| 2    | `src/engine/skill-registry.ts`                                  | Replace `mode` with `behavior` in SkillDefinition, add `maxInstances` to each definition        |
| 3    | `src/engine/game-actions.ts`                                    | Replace `mode` checks with `behavior` checks in getActionType() and createSkillAction()         |
| 4    | `src/engine/selectors.ts`                                       | Add mirror selectors: furthest_enemy, furthest_ally, highest_hp_enemy, highest_hp_ally          |
| 5    | `src/engine/game-decisions.ts`                                  | Update "hold" legacy check from `mode` to `behavior`                                            |
| 6    | `src/stores/gameStore.ts`                                       | Replace mode-based duplication with behavior-based + maxInstances from registry                 |
| 7    | `src/stores/gameStore-constants.ts`                             | Remove MAX_MOVE_INSTANCES (replaced by per-skill maxInstances in registry)                      |
| 8    | `src/components/SkillsPanel/SkillsPanel.tsx`                    | Replace mode checks with behavior checks, update duplication UI for all skills                  |
| 9    | `src/components/InventoryPanel/InventoryPanel.tsx`              | Replace mode display with behavior display                                                      |
| 10   | `src/components/RuleEvaluations/rule-evaluations-formatters.ts` | Replace mode-based text with behavior-based                                                     |
| 11   | `src/stores/gameStore-selectors.ts`                             | Replace `s.mode !== undefined` with `s.behavior !== undefined`                                  |
| 12   | `src/engine/game-test-helpers.ts`                               | Replace `mode` with `behavior` in createSkill/createMoveAction                                  |
| 13   | `src/stores/gameStore-test-helpers.ts`                          | Replace `mode` with `behavior` in createSkill                                                   |
| 14   | `src/stores/gameStore-types.ts`                                 | No changes needed (uses Skill type from engine)                                                 |
| 15   | `src/engine/game-movement.ts`                                   | Parameter rename only (mode -> behavior)                                                        |
| 16+  | ~30+ test files                                                 | Update `mode:` references to `behavior:`                                                        |

## 7. Migration Risks

### High Risk

1. **Action type inference coupling**: `getActionType()` uses `mode !== undefined` to identify Move skills. Renaming to `behavior` changes the semantics -- now all skills have behavior, but only Move skills should produce "move" actions. Need a different inference strategy (e.g., explicit `actionType` in registry, or behavior-value-based inference).

2. **Test volume**: ~120 references to `selectorOverride` across 24 files, ~130+ references to `mode` in tests. The mechanical find-replace is large but must be done carefully to avoid subtle breaks.

3. **Duplication gating logic**: Currently uses `mode !== undefined` to determine "is this a Move skill that can be duplicated." With universal `behavior`, the check changes to "does the registry define `maxInstances > 1` for this skill."

### Medium Risk

4. **SkillsPanel decompose/compose**: Already decomposes selectors in UI, but if data model splits to `target` + `criterion`, these functions become unnecessary -- the data model directly represents what the UI dropdowns show. Risk is in ensuring the UI correctly maps to the new model during transition.

5. **Store selector for movement targets**: `gameStore-selectors.ts:287` finds Move skill by `s.mode !== undefined`. With universal `behavior`, this needs a different test (e.g., `getActionType(s) === 'move'` or checking behavior value `towards`/`away`).

6. **Legacy "hold" mode**: The graceful degradation code casts `skill.mode as string` to check for "hold". With the rename to `behavior`, this needs updating but is already marked as deprecated.

### Low Risk

7. **Selector tiebreaking**: Adding mirror selectors (furthest, highest_hp) uses existing comparison infrastructure -- just reverse the sort order. Low risk because the compare functions already exist.

8. **Registry shape change**: Adding `maxInstances` to SkillDefinition is additive -- skills without it default to 1.

### Key Decision Point

**How to distinguish action types after the rename**: When `mode` becomes `behavior`, and ALL skills get a behavior property, `getActionType()` can no longer use `behavior !== undefined` to detect Move skills. Options:

- A: Add explicit `actionType: "attack" | "move" | "heal"` to SkillDefinition and Skill
- B: Keep inferring from `damage`/`healing`/behavior value (if behavior value is `towards`|`away` => move)
- C: Use a `category` field on the registry that maps to action type

Option A is most explicit and aligns with the spec's skill categories. Option B preserves backward compatibility but is fragile. This is a **decision the PLAN phase must resolve**.
