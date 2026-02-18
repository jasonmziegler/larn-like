# Quick Reference: Monster Promotion Persistence Bug Fix

**Status:** Pending Implementation (Story 3.4 Task 0)
**Priority:** CRITICAL
**Issue:** Promoted monsters lost when target level doesn't exist

---

## TL;DR

**Problem:** Monsters promoted to ungenerated levels are discarded.
**Fix:** Store pending promotions, inject when level is generated.
**Files:** WorldState.ts, WorldStore.ts, DeathProcessor.ts, DungeonGenerator.ts

---

## Visual Summary

### Current (Broken) Flow
```
Hero dies on Level 1
    ↓
Killer monster promoted to Level 2
    ↓
Check: Does Level 2 exist? → NO
    ↓
❌ MONSTER LOST FOREVER
```

### Fixed Flow
```
Hero dies on Level 1
    ↓
Killer monster promoted to Level 2
    ↓
Check: Does Level 2 exist? → NO
    ↓
✓ Store in pendingPromotions
    ↓
Player enters Level 2 (first time)
    ↓
Generate Level 2
    ↓
✓ Inject pending monster into level
    ↓
✓ Cleanup pending promotion record
```

---

## Code Locations

### Bug Location
**File:** `apps/web/src/world/DeathProcessor.ts`
**Lines:** 369-381

```typescript
// ❌ CURRENT BUGGY CODE
const targetLevel = worldState.getLevel(newLevel);

if (targetLevel) {
  // Only works if level already exists
  const updatedMonsters = [...targetLevel.monsters, promotedMonster];
  await worldState.saveLevel({ ...targetLevel, monsters: updatedMonsters });
}
// Missing else clause - monster is lost!
```

### Fix Implementation

#### 1. WorldState.ts - Add Storage
```typescript
export interface LocalWorldState {
  version: number;
  credits: number;
  currentHero: Hero | null;
  deathEvents: DeathEventRecord[];
  levels: DungeonLevelRecord[];
  pendingPromotions: MonsterRecord[]; // ← ADD THIS
  lastSaved: string;
}

// Add these methods to WorldState class:
async savePendingPromotion(monster: MonsterRecord): Promise<void>
async loadPendingPromotions(depth: number): Promise<MonsterRecord[]>
async deletePendingPromotion(id: string): Promise<void>
```

#### 2. WorldStore.ts - Schema Update
```typescript
const CURRENT_VERSION = 5; // Bump from 4

// In onupgradeneeded handler:
if (oldVersion < 5) {
  // Create pendingPromotions store
  if (!db.objectStoreNames.contains('pendingPromotions')) {
    const store = db.createObjectStore('pendingPromotions', { keyPath: 'id' });
    store.createIndex('targetDepth', 'targetDepth', { unique: false });
  }
}
```

#### 3. DeathProcessor.ts - Store or Inject
```typescript
// ✓ FIXED CODE
const targetLevel = worldState.getLevel(newLevel);

if (targetLevel) {
  // Level exists - add immediately
  const updatedMonsters = [...targetLevel.monsters, promotedMonster];
  await worldState.saveLevel({ ...targetLevel, monsters: updatedMonsters });
} else {
  // Level doesn't exist - store for later
  await worldState.savePendingPromotion({
    ...promotedMonster,
    targetDepth: newLevel, // Track which level this belongs to
  });
}
```

#### 4. DungeonGenerator.ts (or level loading) - Inject Pending
```typescript
async function loadOrGenerateLevel(depth: number, worldState: WorldState): Promise<DungeonLevelRecord> {
  // Get or create level
  let level = worldState.getLevel(depth);
  if (!level) {
    level = generateNewLevel(depth);
  }

  // Inject any pending promotions for this depth
  const pendingMonsters = await worldState.loadPendingPromotions(depth);

  if (pendingMonsters.length > 0) {
    console.log(`Injecting ${pendingMonsters.length} pending promotions into level ${depth}`);

    level.monsters = [...level.monsters, ...pendingMonsters];
    await worldState.saveLevel(level);

    // Clean up injected promotions
    for (const monster of pendingMonsters) {
      await worldState.deletePendingPromotion(monster.id);
    }
  }

  return level;
}
```

---

## Implementation Checklist

### Phase 1: Database Schema (WorldStore.ts)
- [ ] Bump `CURRENT_VERSION` from 4 to 5
- [ ] Add `pendingPromotions` object store in `onupgradeneeded`
- [ ] Create index: `targetDepth` (for querying by level)
- [ ] Add CRUD methods: `savePendingPromotion()`, `loadPendingPromotionsByDepth()`, `deletePendingPromotion()`

### Phase 2: State Management (WorldState.ts)
- [ ] Add `pendingPromotions: MonsterRecord[]` to `LocalWorldState` interface
- [ ] Add `savePendingPromotion(monster)` method
- [ ] Add `loadPendingPromotions(depth)` method
- [ ] Add `deletePendingPromotion(id)` method

### Phase 3: Death Processing (DeathProcessor.ts)
- [ ] Update `processHeroDeath()` to check if target level exists
- [ ] If exists: add monster immediately (current behavior)
- [ ] If not exists: call `savePendingPromotion()` with targetDepth

### Phase 4: Level Loading (main.ts or DungeonGenerator.ts)
- [ ] Find level loading/generation logic
- [ ] Add pending promotion injection AFTER level generation/load
- [ ] Call `loadPendingPromotions(depth)` for current depth
- [ ] Add pending monsters to `level.monsters` array
- [ ] Save updated level
- [ ] Delete injected promotions from pending store

### Phase 5: Testing
- [ ] Unit test: Promote to ungenerated level → stored in pending
- [ ] Unit test: Load level → pending injected and cleaned up
- [ ] Unit test: Multiple pending for same level → all injected
- [ ] Unit test: Schema migration v4 → v5 → no data loss
- [ ] Integration test: Kill hero on L1 → enter L2 → see evolved monster
- [ ] Manual verification: Check IndexedDB shows pendingPromotions store

---

## Testing Scenarios

### Scenario 1: Basic Pending Promotion
```typescript
test('promotes monster to ungenerated level', async () => {
  const worldState = new WorldState();
  const hero = createTestHero();
  const monster = createTestMonster();

  // Hero dies on level 1, monster promoted to level 2 (doesn't exist)
  await processHeroDeath(hero, monster, worldState, 1);

  // Verify monster stored in pending
  const pending = await worldState.loadPendingPromotions(2);
  expect(pending).toHaveLength(1);
  expect(pending[0].name).toBe(monster.name);
  expect(pending[0].evolutionLevel).toBe(1);
});
```

### Scenario 2: Pending Injection
```typescript
test('injects pending promotions when level generated', async () => {
  const worldState = new WorldState();

  // Setup: Add pending promotion for level 3
  const pendingMonster = createEvolvedMonster();
  await worldState.savePendingPromotion({ ...pendingMonster, targetDepth: 3 });

  // Generate level 3
  const level = await loadOrGenerateLevel(3, worldState);

  // Verify monster was injected
  expect(level.monsters).toContainEqual(expect.objectContaining({
    name: pendingMonster.name
  }));

  // Verify pending was cleaned up
  const stillPending = await worldState.loadPendingPromotions(3);
  expect(stillPending).toHaveLength(0);
});
```

### Scenario 3: Migration Test
```typescript
test('migrates database from v4 to v5', async () => {
  // Create v4 database
  const oldStore = new WorldStore('larn-like-db-test', 4);
  await oldStore.initialize();

  // Close and reopen with v5
  oldStore.close();
  const newStore = new WorldStore('larn-like-db-test', 5);
  await newStore.initialize();

  // Verify pendingPromotions store exists
  const storeNames = await newStore.getObjectStoreNames();
  expect(storeNames).toContain('pendingPromotions');
});
```

---

## Verification After Implementation

### Check Database
Open browser DevTools → Application → IndexedDB → `larn-like-db`:

1. **Version should be 5**
2. **Object stores should include:**
   - heroes
   - dungeonLevels
   - monsters
   - deathEvents
   - soulShrines
   - teethDrops
   - **pendingPromotions** ← NEW

3. **pendingPromotions store should have:**
   - keyPath: `id`
   - Index: `targetDepth`

### Test In-Game
1. Start new hero
2. Die on level 1 to a monster
3. Open DevTools → IndexedDB → pendingPromotions
4. Verify 1 record with `targetDepth: 2`
5. Start new hero
6. Enter level 2
7. Check pendingPromotions → should be empty (injected + cleaned up)
8. Check level 2 monsters → evolved monster should be present

### Success Criteria
- ✓ No more "4 heroes fallen, 0 monsters evolved"
- ✓ World state shows correct evolved monster count
- ✓ Evolved monsters appear on their target levels
- ✓ No orphaned pending promotions after level visits

---

## Rollback Plan

If the fix causes issues:

1. **Database rollback:**
   - Export world state: Use existing export function
   - Clear IndexedDB
   - Restore from backup

2. **Code rollback:**
   - Revert DeathProcessor.ts changes
   - Revert WorldState/WorldStore changes
   - Keep schema at v4

3. **Alternative fix:**
   - Pre-generate all levels up to max depth on world creation
   - Guarantees all target levels exist
   - Trade-off: Larger initial world state, slower startup

---

## Related Documentation

- **Full bug analysis:** `.ai/debug-log.md`
- **Implementation story:** `docs/stories/3.4.story.md` (Task 0)
- **Original feature:** `docs/stories/2.2.story.md` (Monster Promotion)
- **World state design:** `docs/architecture/data-models.md`

---

*Created: 2026-02-14 by James (Dev Agent)*
*Last Updated: 2026-02-14*
