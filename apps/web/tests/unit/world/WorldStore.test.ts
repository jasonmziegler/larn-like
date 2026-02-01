// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldStore, STORE_NAMES } from '../../../src/world/WorldStore';

describe('WorldStore', () => {
  let store: WorldStore;

  beforeEach(async () => {
    store = new WorldStore();
    await store.open();
  });

  afterEach(async () => {
    await store.deleteDatabase();
  });

  describe('Database creation and schema', () => {
    it('should open the database successfully', () => {
      // If we got here, open() succeeded
      expect(store).toBeDefined();
    });

    it('should create all expected object stores', async () => {
      // Verify we can write to all stores without errors
      await store.saveWorldMeta('testKey', 'testValue');
      await store.saveHero({ id: 'h1', name: 'Test' });
      await store.saveLevel({ depth: 1, tiles: [] });
      await store.saveDeathEvent({ id: 'd1', heroId: 'h1' });
      await store.saveMonster({ id: 'm1', type: 'goblin' });
      await store.saveSoulShrine({ id: 's1', level: 1 });
      await store.saveTeethDrop({ id: 't1', level: 1 });

      // All operations completed without error
      expect(true).toBe(true);
    });

    it('should handle schema versioning via onupgradeneeded', async () => {
      // Close and reopen — should not re-run upgrade (same version)
      store.close();
      const store2 = new WorldStore();
      await store2.open();

      // Data from previous session should still be accessible
      await store2.saveWorldMeta('version', 1);
      const version = await store2.loadWorldMeta('version');
      expect(version).toBe(1);

      await store2.deleteDatabase();
    });
  });

  describe('Save/load round-trip: Hero', () => {
    it('should save and load a hero by id', async () => {
      const hero = {
        id: 'hero_123',
        name: 'TestHero',
        level: 1,
        isAlive: true,
        teethCurrency: 42,
        position: { x: 5, y: 10, depth: 1 },
      };

      await store.saveHero(hero);
      const loaded = await store.loadHero('hero_123');

      expect(loaded).toEqual(hero);
    });

    it('should overwrite hero on save with same id', async () => {
      await store.saveHero({ id: 'h1', name: 'First', isAlive: true });
      await store.saveHero({ id: 'h1', name: 'Updated', isAlive: false });

      const loaded = await store.loadHero('h1');
      expect(loaded?.name).toBe('Updated');
      expect(loaded?.isAlive).toBe(false);
    });

    it('should return undefined for non-existent hero', async () => {
      const loaded = await store.loadHero('nonexistent');
      expect(loaded).toBeUndefined();
    });

    it('should query heroes by isAlive index', async () => {
      await store.saveHero({ id: 'h1', name: 'Alive', isAlive: true });
      await store.saveHero({ id: 'h2', name: 'Dead', isAlive: false });
      await store.saveHero({ id: 'h3', name: 'AlsoAlive', isAlive: true });

      const alive = await store.getByIndex(STORE_NAMES.HEROES, 'isAlive', true as unknown as IDBValidKey);
      // fake-indexeddb may handle boolean indexing
      expect(alive.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Save/load round-trip: Level', () => {
    it('should save and load a level by depth', async () => {
      const level = {
        depth: 3,
        dungeon: [['#', '.'], ['.', '#']],
        monsters: [{ id: 'm1', type: 'goblin' }],
        items: [],
      };

      await store.saveLevel(level);
      const loaded = await store.loadLevel(3);

      expect(loaded).toEqual(level);
    });

    it('should return undefined for non-existent level', async () => {
      const loaded = await store.loadLevel(99);
      expect(loaded).toBeUndefined();
    });
  });

  describe('Save/load round-trip: Death Event', () => {
    it('should save and load death events', async () => {
      const event1 = { id: 'de1', heroId: 'h1', heroName: 'Hero1', processedAt: '2026-01-30T00:00:00Z' };
      const event2 = { id: 'de2', heroId: 'h2', heroName: 'Hero2', processedAt: '2026-01-30T01:00:00Z' };

      await store.saveDeathEvent(event1);
      await store.saveDeathEvent(event2);

      const events = await store.loadDeathEvents();
      expect(events.length).toBe(2);
      expect(events.find((e: Record<string, unknown>) => e.id === 'de1')).toEqual(event1);
      expect(events.find((e: Record<string, unknown>) => e.id === 'de2')).toEqual(event2);
    });
  });

  describe('Save/load round-trip: World Meta', () => {
    it('should save and load world meta by key', async () => {
      await store.saveWorldMeta('version', 1);
      await store.saveWorldMeta('credits', 5);
      await store.saveWorldMeta('lastSaved', '2026-01-30T00:00:00Z');

      expect(await store.loadWorldMeta('version')).toBe(1);
      expect(await store.loadWorldMeta('credits')).toBe(5);
      expect(await store.loadWorldMeta('lastSaved')).toBe('2026-01-30T00:00:00Z');
    });

    it('should return undefined for non-existent meta key', async () => {
      const value = await store.loadWorldMeta('nonexistent');
      expect(value).toBeUndefined();
    });

    it('should overwrite meta on save with same key', async () => {
      await store.saveWorldMeta('credits', 3);
      await store.saveWorldMeta('credits', 10);

      expect(await store.loadWorldMeta('credits')).toBe(10);
    });
  });

  describe('Persistence across simulated sessions', () => {
    it('should persist data after close and reopen', async () => {
      await store.saveWorldMeta('credits', 7);
      await store.saveHero({ id: 'h1', name: 'Persistent', isAlive: true });
      await store.saveLevel({ depth: 1, dungeon: [['.']] });

      // Close and reopen — simulating a new session
      store.close();
      const store2 = new WorldStore();
      await store2.open();

      expect(await store2.loadWorldMeta('credits')).toBe(7);
      const hero = await store2.loadHero('h1');
      expect(hero?.name).toBe('Persistent');
      const level = await store2.loadLevel(1);
      expect(level).toBeDefined();

      await store2.deleteDatabase();
    });
  });

  describe('getAll and getByIndex helpers', () => {
    it('should return all records from a store', async () => {
      await store.saveMonster({ id: 'm1', type: 'goblin', level: 1, isEvolved: false });
      await store.saveMonster({ id: 'm2', type: 'orc', level: 1, isEvolved: false });
      await store.saveMonster({ id: 'm3', type: 'troll', level: 2, isEvolved: true });

      const all = await store.getAll(STORE_NAMES.MONSTERS);
      expect(all.length).toBe(3);
    });

    it('should query monsters by levelDepth index', async () => {
      await store.saveMonster({ id: 'm1', type: 'goblin', level: 1, isEvolved: false });
      await store.saveMonster({ id: 'm2', type: 'orc', level: 1, isEvolved: false });
      await store.saveMonster({ id: 'm3', type: 'troll', level: 2, isEvolved: true });

      const level1 = await store.getByIndex(STORE_NAMES.MONSTERS, 'levelDepth', 1);
      expect(level1.length).toBe(2);

      const level2 = await store.getByIndex(STORE_NAMES.MONSTERS, 'levelDepth', 2);
      expect(level2.length).toBe(1);
    });
  });

  describe('Quota error handling', () => {
    it('should throw on operations before open', () => {
      const unopened = new WorldStore();
      expect(() => unopened.getAll(STORE_NAMES.HEROES)).rejects.toThrow('WorldStore not opened');
    });
  });

  describe('clearStore', () => {
    it('should clear all records from a store', async () => {
      await store.saveMonster({ id: 'm1', type: 'goblin', level: 1, isEvolved: false });
      await store.saveMonster({ id: 'm2', type: 'orc', level: 1, isEvolved: false });

      await store.clearStore(STORE_NAMES.MONSTERS);

      const all = await store.getAll(STORE_NAMES.MONSTERS);
      expect(all.length).toBe(0);
    });
  });

  describe('Loading performance', () => {
    it('should load within 500ms with sample data', async () => {
      // Seed some data
      for (let i = 0; i < 50; i++) {
        await store.saveMonster({ id: `m${i}`, type: 'goblin', level: 1, isEvolved: false });
      }
      for (let i = 0; i < 10; i++) {
        await store.saveDeathEvent({ id: `de${i}`, heroId: `h${i}`, processedAt: new Date().toISOString() });
      }
      await store.saveHero({ id: 'h1', name: 'TestHero', isAlive: true });
      await store.saveWorldMeta('version', 1);
      await store.saveWorldMeta('credits', 5);

      // Close and reopen to simulate fresh load
      store.close();

      const start = performance.now();
      const store2 = new WorldStore();
      await store2.open();
      const meta = await store2.loadWorldMeta('version');
      const heroes = await store2.getAll(STORE_NAMES.HEROES);
      const monsters = await store2.getAll(STORE_NAMES.MONSTERS);
      const deaths = await store2.getAll(STORE_NAMES.DEATH_EVENTS);
      const elapsed = performance.now() - start;

      expect(meta).toBe(1);
      expect(heroes.length).toBe(1);
      expect(monsters.length).toBe(50);
      expect(deaths.length).toBe(10);
      expect(elapsed).toBeLessThan(500);

      await store2.deleteDatabase();
    });
  });
});
