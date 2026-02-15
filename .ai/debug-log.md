# Debug Log - Larn-Like Project

This file tracks critical bugs, issues, and their resolutions throughout development.

---

## [CRITICAL] Monster Promotion Persistence Bug

**Date Discovered:** 2026-02-14
**Reported By:** User (via screenshot showing "4 heroes fallen, 0 monsters evolved")
**Severity:** Critical - Core game mechanic failure
**Status:** Documented in Story 3.4 Task 0 (pending implementation)

### Symptoms
- Heroes die and monsters are promoted, but evolved monsters never appear
- World state shows "N heroes fallen, 0 monsters evolved"
- Game appears to lose all monster promotions

### Root Cause
**File:** `apps/web/src/world/DeathProcessor.ts`
**Lines:** 369-381
**Issue:** Promoted monsters are discarded when target level doesn't exist yet

```typescript
// BUGGY CODE
const targetLevel = worldState.getLevel(newLevel);

if (targetLevel) {
  // Level exists - add promoted monster ✓
  const updatedMonsters = [...targetLevel.monsters, promotedMonster];
  await worldState.saveLevel({ ...targetLevel, monsters: updatedMonsters });
}
// ❌ BUG: If target level doesn't exist, promoted monster is LOST
// Comment claims "will be added when level is generated" but NO CODE implements this
```

### Why It Happens
1. Hero dies on level 1
2. Killer monster promoted to level 2
3. Level 2 doesn't exist yet (player hasn't visited it)
4. Code checks `if (targetLevel)` - returns `false`
5. Promoted monster is **never stored anywhere**
6. Monster is lost forever

### Impact
- 100% of monster promotions to ungenerated levels are lost
- Persistent world mechanic completely broken
- Player progression feels unrewarding (no monster evolution visible)

### Fix Plan (Story 3.4 Task 0)

**Solution:** Add pending promotions storage

1. **Add to WorldState interface:**
```typescript
export interface LocalWorldState {
  version: number;
  credits: number;
  currentHero: Hero | null;
  deathEvents: DeathEventRecord[];
  levels: DungeonLevelRecord[];
  pendingPromotions: MonsterRecord[]; // ← NEW
  lastSaved: string;
}
```

2. **Update DeathProcessor.ts:**
```typescript
const targetLevel = worldState.getLevel(newLevel);

if (targetLevel) {
  // Level exists - add immediately
  const updatedMonsters = [...targetLevel.monsters, promotedMonster];
  await worldState.saveLevel({ ...targetLevel, monsters: updatedMonsters });
} else {
  // Level doesn't exist - store for later injection
  await worldState.savePendingPromotion({
    ...promotedMonster,
    targetDepth: newLevel,
  });
}
```

3. **Update level generation/loading:**
```typescript
async function loadOrGenerateLevel(depth: number): Promise<DungeonLevelRecord> {
  let level = worldState.getLevel(depth) || generateNewLevel(depth);

  // Inject pending promotions
  const pending = await worldState.loadPendingPromotions(depth);
  if (pending.length > 0) {
    level.monsters = [...level.monsters, ...pending];
    await worldState.saveLevel(level);

    // Cleanup
    for (const monster of pending) {
      await worldState.deletePendingPromotion(monster.id);
    }
  }

  return level;
}
```

4. **Database schema update:**
- Bump version: v4 → v5
- Add `pendingPromotions` object store
- Add migration handler

### Testing Requirements
- [ ] Promote monster to ungenerated level → verify stored in pendingPromotions
- [ ] Generate target level → verify pending monster appears
- [ ] Multiple pending promotions to same level → all injected
- [ ] Schema migration from v4 to v5 → no data loss
- [ ] Manual: Kill hero, enter next level, confirm evolved monster present

### Related Files
- `apps/web/src/world/WorldState.ts` - Add pendingPromotions field
- `apps/web/src/world/WorldStore.ts` - Schema v5, object store, CRUD methods
- `apps/web/src/world/DeathProcessor.ts` - Fix promotion logic
- `apps/web/src/game/DungeonGenerator.ts` - Inject pending on generation
- `apps/web/src/main.ts` - Update level loading
- `apps/web/tests/unit/world/MonsterPromotion.test.ts` - NEW test file

### References
- **Story:** 3.4 - Monster Equipment Slot Management (Task 0)
- **Original Implementation:** Story 2.2 - Monster Promotion on Player Death
- **Issue Report:** User screenshot `screenshots/ZeroMonstersEvolvedBug.png`

---

## Log Format

Future entries should follow this template:

```markdown
## [SEVERITY] Issue Title

**Date Discovered:** YYYY-MM-DD
**Reported By:** Name/Source
**Severity:** Critical | High | Medium | Low
**Status:** Open | In Progress | Fixed | Deferred

### Symptoms
- User-visible behavior

### Root Cause
- Technical explanation
- File locations and line numbers

### Fix Plan
- Implementation steps

### Testing Requirements
- Test cases to verify fix

### Related Files
- Files to modify

### References
- Story links, issue numbers, etc.
```

---

## [CRITICAL] Incomplete Database Upgrade - Missing pendingPromotions Store

**Date Discovered:** 2026-02-15
**Reported By:** User (game lockup after naming hero)
**Severity:** Critical - Prevents game from starting
**Status:** Fixed

### Symptoms
- Game freezes/hangs after entering hero name
- Console shows: `NotFoundError: One of the specified object stores was not found`
- No "[WorldStore] Upgrading from v4 to v5" log message
- Database opens successfully but `pendingPromotions` store missing

### Root Cause
**File:** `apps/web/src/world/WorldStore.ts`
**Issue:** Database upgrade from v4 to v5 failed or was interrupted, leaving database at v5 but missing the new `pendingPromotions` store.

**Why it happened:**
1. Changes implemented by vanilla Claude (not BMAD dev agent)
2. Database version bumped to v5 without proper testing
3. Browser may have had multiple tabs open, blocking upgrade
4. Upgrade transaction may have failed silently

### Impact
- 100% of users with existing databases cannot play
- Fresh databases might also be affected if upgrade path is flawed
- Error cascades to every level load attempt

### Fix Implemented

**1. Added Database Validation (WorldStore.ts):**
```typescript
// After successful open, verify all stores exist
const expectedStores = Object.values(STORE_NAMES);
const missingStores = expectedStores.filter(
  storeName => !this.db!.objectStoreNames.contains(storeName)
);

if (missingStores.length > 0) {
  reject(new Error(
    `Database schema incomplete. Missing stores: ${missingStores.join(', ')}. ` +
    `Please delete IndexedDB and refresh.`
  ));
}
```

**2. Enhanced Logging:**
- Added `[WorldStore]` prefix to all DB operations
- Added `[LevelManager]` prefix to pending promotion loads
- Logs upgrade start/complete to verify execution

### User Recovery Steps
1. Open DevTools (F12) → Application tab
2. IndexedDB → larn-like-db → Delete database
3. Hard refresh (Ctrl+Shift+R)
4. Start new game

### Prevention
- Never implement database schema changes without BMAD dev agent
- Always test migrations with existing databases
- Add validation to detect incomplete schemas
- Provide clear error messages for recovery

### Related Files
- `apps/web/src/world/WorldStore.ts` - Validation added
- `apps/web/src/game/LevelManager.ts` - Enhanced logging

---

*Last Updated: 2026-02-15 by James (Dev Agent)*
