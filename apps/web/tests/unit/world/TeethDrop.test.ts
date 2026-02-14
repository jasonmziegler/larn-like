// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTeethDrop, type TeethDrop } from '../../../src/world/TeethDrop';
import { WorldStore, STORE_NAMES } from '../../../src/world/WorldStore';
import type { DeathEventRecord } from '../../../src/world/WorldState';

describe('TeethDrop', () => {
  let store: WorldStore;

  beforeEach(async () => {
    // Reset IndexedDB for each test
    indexedDB = new IDBFactory();
    store = new WorldStore();
    await store.open();
  });

  afterEach(async () => {
    await store.deleteDatabase();
  });

  describe('createTeethDrop', () => {
    it('should generate valid TeethDrop from DeathEvent', () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_123',
        heroId: 'hero_456',
        heroName: 'Testius',
        killerMonsterId: 'monster_789',
        location: { x: 15, y: 20, depth: 3 },
        teethDropped: 25,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);

      expect(teethDrop.deathEventId).toBe('death_123');
      expect(teethDrop.heroName).toBe('Testius');
      expect(teethDrop.levelDepth).toBe(3);
      expect(teethDrop.position.x).toBe(15);
      expect(teethDrop.position.y).toBe(20);
      expect(teethDrop.value).toBe(25);
      expect(teethDrop.isCollected).toBe(false);
      expect(teethDrop.collectedBy).toBeUndefined();
      expect(teethDrop.id).toContain('teeth_');
    });

    it('should use teeth value from death event (16-32 range)', () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_456',
        heroId: 'hero_789',
        heroName: 'Hero2',
        killerMonsterId: 'monster_012',
        location: { x: 5, y: 5, depth: 1 },
        teethDropped: 16, // Minimum value
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);

      expect(teethDrop.value).toBe(16);
      expect(teethDrop.value).toBeGreaterThanOrEqual(16);
      expect(teethDrop.value).toBeLessThanOrEqual(32);
    });

    it('should position teeth at exact death event location', () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_789',
        heroId: 'hero_012',
        heroName: 'Hero3',
        killerMonsterId: 'monster_345',
        location: { x: 42, y: 99, depth: 5 },
        teethDropped: 15,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);

      expect(teethDrop.position.x).toBe(42);
      expect(teethDrop.position.y).toBe(99);
      expect(teethDrop.levelDepth).toBe(5);
    });
  });

  describe('Persistence to IndexedDB', () => {
    it('should persist TeethDrop to IndexedDB', async () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_persist_1',
        heroId: 'hero_persist_1',
        heroName: 'PersistHero',
        killerMonsterId: 'monster_persist_1',
        location: { x: 10, y: 10, depth: 2 },
        teethDropped: 20,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);
      await store.saveTeethDrop(teethDrop as unknown as Record<string, unknown>);

      const loaded = await store.getByIndex<TeethDrop>(STORE_NAMES.TEETH_DROPS, 'levelDepth', 2);
      expect(loaded.length).toBe(1);
      expect(loaded[0].deathEventId).toBe('death_persist_1');
      expect(loaded[0].value).toBe(20);
    });

    it('should load teeth by level depth', async () => {
      const deathEvent1: DeathEventRecord = {
        id: 'death_level_1',
        heroId: 'hero_1',
        heroName: 'Hero1',
        killerMonsterId: 'monster_1',
        location: { x: 5, y: 5, depth: 1 },
        teethDropped: 10,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const deathEvent2: DeathEventRecord = {
        id: 'death_level_2',
        heroId: 'hero_2',
        heroName: 'Hero2',
        killerMonsterId: 'monster_2',
        location: { x: 8, y: 8, depth: 1 },
        teethDropped: 15,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const deathEvent3: DeathEventRecord = {
        id: 'death_level_3',
        heroId: 'hero_3',
        heroName: 'Hero3',
        killerMonsterId: 'monster_3',
        location: { x: 10, y: 10, depth: 2 },
        teethDropped: 20,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teeth1 = createTeethDrop(deathEvent1);
      const teeth2 = createTeethDrop(deathEvent2);
      const teeth3 = createTeethDrop(deathEvent3);

      await store.saveTeethDrop(teeth1 as unknown as Record<string, unknown>);
      await store.saveTeethDrop(teeth2 as unknown as Record<string, unknown>);
      await store.saveTeethDrop(teeth3 as unknown as Record<string, unknown>);

      const level1Teeth = await store.loadTeethDropsByLevel(1);
      expect(level1Teeth.length).toBe(2);

      const level2Teeth = await store.loadTeethDropsByLevel(2);
      expect(level2Teeth.length).toBe(1);
    });

    it('should mark teeth as collected', async () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_collect_1',
        heroId: 'hero_collect_1',
        heroName: 'CollectHero',
        killerMonsterId: 'monster_collect_1',
        location: { x: 12, y: 12, depth: 3 },
        teethDropped: 18,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);
      await store.saveTeethDrop(teethDrop as unknown as Record<string, unknown>);

      // Mark as collected
      await store.markTeethCollected(teethDrop.id, 'hero_new_123');

      // Reload to verify
      const loaded = await store.getByIndex<TeethDrop>(STORE_NAMES.TEETH_DROPS, 'levelDepth', 3);
      expect(loaded[0].isCollected).toBe(true);
      expect(loaded[0].collectedBy).toBe('hero_new_123');
    });

    it('should exclude collected teeth from level queries by filtering', async () => {
      const deathEvent1: DeathEventRecord = {
        id: 'death_filter_1',
        heroId: 'hero_filter_1',
        heroName: 'FilterHero1',
        killerMonsterId: 'monster_filter_1',
        location: { x: 5, y: 5, depth: 1 },
        teethDropped: 10,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const deathEvent2: DeathEventRecord = {
        id: 'death_filter_2',
        heroId: 'hero_filter_2',
        heroName: 'FilterHero2',
        killerMonsterId: 'monster_filter_2',
        location: { x: 10, y: 10, depth: 1 },
        teethDropped: 15,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teeth1 = createTeethDrop(deathEvent1);
      const teeth2 = createTeethDrop(deathEvent2);

      await store.saveTeethDrop(teeth1 as unknown as Record<string, unknown>);
      await store.saveTeethDrop(teeth2 as unknown as Record<string, unknown>);

      // Mark first teeth as collected
      await store.markTeethCollected(teeth1.id, 'hero_collector');

      // Load all teeth from level 1
      const allTeeth = await store.loadTeethDropsByLevel(1);
      expect(allTeeth.length).toBe(2);

      // Filter uncollected manually (as done in main.ts)
      const uncollected = (allTeeth as unknown as TeethDrop[]).filter(td => !td.isCollected);
      expect(uncollected.length).toBe(1);
      expect(uncollected[0].id).toBe(teeth2.id);
    });
  });

  describe('Edge cases', () => {
    it('should handle no death events (empty teeth list)', async () => {
      const teeth = await store.loadTeethDropsByLevel(1);
      expect(teeth.length).toBe(0);
    });

    it('should handle multiple teeth at same coordinates', async () => {
      const deathEvent1: DeathEventRecord = {
        id: 'death_same_1',
        heroId: 'hero_same_1',
        heroName: 'SameHero1',
        killerMonsterId: 'monster_same_1',
        location: { x: 7, y: 7, depth: 1 },
        teethDropped: 10,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const deathEvent2: DeathEventRecord = {
        id: 'death_same_2',
        heroId: 'hero_same_2',
        heroName: 'SameHero2',
        killerMonsterId: 'monster_same_2',
        location: { x: 7, y: 7, depth: 1 }, // Same position
        teethDropped: 15,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:01:00Z',
      };

      const teeth1 = createTeethDrop(deathEvent1);
      const teeth2 = createTeethDrop(deathEvent2);

      await store.saveTeethDrop(teeth1 as unknown as Record<string, unknown>);
      await store.saveTeethDrop(teeth2 as unknown as Record<string, unknown>);

      const loaded = await store.loadTeethDropsByLevel(1);
      expect(loaded.length).toBe(2);

      // Verify both are at same position
      const teethDrops = loaded as unknown as TeethDrop[];
      expect(teethDrops[0].position.x).toBe(7);
      expect(teethDrops[0].position.y).toBe(7);
      expect(teethDrops[1].position.x).toBe(7);
      expect(teethDrops[1].position.y).toBe(7);

      // Verify separate IDs
      expect(teethDrops[0].id).not.toBe(teethDrops[1].id);
    });

    it('should handle teeth with maximum value (32)', async () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_max',
        heroId: 'hero_max',
        heroName: 'MaxHero',
        killerMonsterId: 'monster_max',
        location: { x: 1, y: 1, depth: 1 },
        teethDropped: 32, // Maximum value
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);
      await store.saveTeethDrop(teethDrop as unknown as Record<string, unknown>);

      const loaded = await store.loadTeethDropsByLevel(1);
      expect((loaded[0] as TeethDrop).value).toBe(32);
    });

    it('should handle teeth with minimum value (16)', async () => {
      const deathEvent: DeathEventRecord = {
        id: 'death_min',
        heroId: 'hero_min',
        heroName: 'MinHero',
        killerMonsterId: 'monster_min',
        location: { x: 2, y: 2, depth: 1 },
        teethDropped: 16, // Minimum value
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-30T12:00:00Z',
      };

      const teethDrop = createTeethDrop(deathEvent);
      await store.saveTeethDrop(teethDrop as unknown as Record<string, unknown>);

      const loaded = await store.loadTeethDropsByLevel(1);
      expect((loaded[0] as TeethDrop).value).toBe(16);
    });
  });
});
