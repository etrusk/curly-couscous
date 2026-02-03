# Fix Plan: Change Heal tickCost from 0 to 2

## Root Cause Analysis

User requested design change during HUMAN_VERIFY phase: change heal from instant cast (tickCost: 0) to wind-up (tickCost: 2).

## Impact Analysis

### Code Changes Required

1. **Skill Registry** (`src/engine/skill-registry.ts`):
   - Line 55: Change `tickCost: 0` to `tickCost: 2`

### Test Changes Required

2. **Healing Unit Tests** (`src/engine/healing.test.ts`):
   - Test "heal resolves on correct tick (instant, tickCost 0)" needs updating:
     - Change test name to reflect tickCost: 2
     - Update assertions: `startedAtTick: 5, resolvesAtTick: 7` (not 5)
     - The heal should resolve 2 ticks after decision

3. **Healing Integration Tests** (`src/engine/game-healing-integration.test.ts`):
   - Test "heal resolves before combat, saving ally from fatal damage":
     - Currently expects heal to resolve on tick 1 (instant)
     - Need to update to tick 3 (decision at tick 1 + tickCost 2)
     - May need to adjust enemy attack timing to make this scenario work

   - Test "decision system selects heal skill for wounded ally":
     - May need timing adjustments if it expects instant resolution

4. **InventoryPanel Tests** (`src/components/InventoryPanel/InventoryPanel.test.tsx`):
   - Line 111: Currently asserts 2 skills with "tick cost: 0" (Light Punch and Heal)
     - Change to assert only 1 skill (just Light Punch)
     - Or update the test to separately verify Heal shows "tick cost: 2"

## Detailed Fix Steps

### Step 1: Update Skill Registry

**File**: `src/engine/skill-registry.ts`
**Line**: 55

**Old**:

```typescript
{
  id: "heal",
  name: "Heal",
  tickCost: 0,
  range: 5,
  healing: 25,
  innate: false,
  defaultSelector: { type: "lowest_hp_ally" },
},
```

**New**:

```typescript
{
  id: "heal",
  name: "Heal",
  tickCost: 2,
  range: 5,
  healing: 25,
  innate: false,
  defaultSelector: { type: "lowest_hp_ally" },
},
```

### Step 2: Update Healing Unit Test

**File**: `src/engine/healing.test.ts`
**Line**: ~85-100

**Find**: Test named "heal resolves on correct tick (instant, tickCost 0)"

**Changes**:

- Update test name to: "heal resolves on correct tick (wind-up, tickCost 2)"
- Change `tickCost: 0` to `tickCost: 2` in skill creation
- Update assertions:
  - `startedAtTick: 5, resolvesAtTick: 5` → `startedAtTick: 5, resolvesAtTick: 7`
  - Character decision made at tick 5, heal resolves at tick 5 + 2 = 7

### Step 3: Update Healing Integration Test - "heal resolves before combat"

**File**: `src/engine/game-healing-integration.test.ts`
**Line**: ~15-60

**Current scenario**:

- Tick 1: Healer decides to heal, resolves instantly (tickCost 0)
- Tick 1: Enemy decides to attack, will resolve on tick 3 (tickCost 2)
- Heal saves ally before attack lands

**New scenario** (tickCost: 2 for heal):

- Tick 1: Healer decides to heal (will resolve on tick 3)
- Tick 1: Enemy decides to attack (will resolve on tick 3)
- Both resolve on tick 3, heal must process first

**Changes needed**:

- Heal and attack both resolve on tick 3
- Verify heal processes before combat in resolution phase
- Assertions:
  - After tick 3: ally HP should be 35 (10 - 25 damage + 25 heal)
  - HealEvent at tick 3
  - DamageEvent at tick 3

### Step 4: Update InventoryPanel Test

**File**: `src/components/InventoryPanel/InventoryPanel.test.tsx`
**Line**: 111

**Old**:

```typescript
const tickCostElements = getAllByText(/tick cost: 0/i);
expect(tickCostElements).toHaveLength(2); // Light Punch and Heal
```

**New**:

```typescript
const tickCostElements = getAllByText(/tick cost: 0/i);
expect(tickCostElements).toHaveLength(1); // Only Light Punch now
```

**Or add a separate assertion**:

```typescript
const tickCostElements = getAllByText(/tick cost: 0/i);
expect(tickCostElements).toHaveLength(1); // Light Punch

const healTickCost = getByText(/tick cost: 2/i);
expect(healTickCost).toBeInTheDocument(); // Heal
```

### Step 5: Review Other Tests

Check if any other tests assume instant heal timing:

- `src/engine/game-healing-integration.test.ts` - all 6 tests
- Look for assertions about `resolvesAtTick` or timing expectations

## Risks

1. **Test failures**: Some tests may implicitly depend on instant timing
2. **Integration scenarios**: Multi-tick scenarios may need adjustment
3. **Visual tests**: Heal lines will now be dashed (wind-up) not solid (instant)

## Validation

After changes:

1. Run `npm run test` - all heal tests should pass
2. Verify heal skill shows "Tick cost: 2" in inventory
3. Visual: Heal intent lines should be dashed with "2" label (not solid)
