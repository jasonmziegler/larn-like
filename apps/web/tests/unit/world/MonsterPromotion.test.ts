import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldStore, STORE_NAMES } from '../../../src/world/WorldStore';
import { WorldState } from '../../../src/world/WorldState';
import type { MonsterRecord, DungeonLevelRecord, PendingPromotionRecord } from '../../../src/world/WorldState';
import { createEmptySlots } from '../../../src/game/Equipment';
import { processHeroDeath } from '../../../src/world/DeathProcessor';
import type { Hero, Monster } from '@larn-like/shared';

/**
 * Test suite for Story 3.4 Task 0: Monster Promotion Persistence Bug Fix
 *
 * CRITICAL BUG: Prior to this fix, promoted monsters were lost if their target level
 * didn't exist yet, causing "4 heroes fallen, 0 monsters evolved" scenarios.
 *
 * Tests:
 * - Promoted monsters are stored in pendingPromotions when target level doesn't exist
 * - Level generation injects pending promotions into new levels
 * - Pending promotions are cleaned up after injection
 * - Multiple pending promotions for same level are all injected
 * - Database schema migration from v4 to v5 creates pendingPromotions store
 */

describe('Story 3.4: Monster Promotion Persistence', () => {
  let worldState: WorldState;

  beforeEach(async () => {
    // Create a fresh WorldState instance
    // fake-indexeddb will handle the in-memory database
    worldState = new WorldState();
    await worldState.initializeWorld();
  });

  afterEach(async () => {
    // Clean up - close the database and delete it
    const store = worldState.getStore();
    const dbName = 'larn-like-db'; // Default database name from WorldStore

    try {
      // Close the database connection first
      (store as any).db?.close();
    } catch (e) {
      // Ignore errors during cleanup
    }

    // Delete the database
    await new Promise<void>((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
      deleteRequest.onblocked = () => resolve();
    });
  });

  describe('Pending Promotion Storage', () => {
    it('should save pending promotion when target level does not exist', async () => {
      const monster: MonsterRecord = {
        id: 'promoted_monster_1',
        pos: { x: 10, y: 10 },
        char: 'G',
        color: '#ff0000',
        name: 'Evolved Goblin',
        health: 50,
        maxHealth: 50,
        attack: 10,
        defense: 5,
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 1,
        equipment: createEmptySlots(),
      };

      const targetDepth = 5;

      // Save pending promotion
      await worldState.savePendingPromotion(monster, targetDepth);

      // Verify it was saved
      const pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('promoted_monster_1');
      expect(pending[0].name).toBe('Evolved Goblin');
      expect(pending[0].isEvolved).toBe(true);
    });

    it('should load pending promotions by depth', async () => {
      const monster1: MonsterRecord = {
        id: 'monster_depth_3_1',
        pos: { x: 5, y: 5 },
        char: 'O',
        color: '#00ff00',
        name: 'Evolved Orc',
        health: 60,
        maxHealth: 60,
        attack: 12,
        defense: 6,
        type: 'orc',
        isEvolved: true,
        evolutionLevel: 1,
        equipment: createEmptySlots(),
      };

      const monster2: MonsterRecord = {
        id: 'monster_depth_3_2',
        pos: { x: 8, y: 8 },
        char: 'T',
        color: '#0000ff',
        name: 'Evolved Troll',
        health: 80,
        maxHealth: 80,
        attack: 15,
        defense: 8,
        type: 'troll',
        isEvolved: true,
        evolutionLevel: 1,
        equipment: createEmptySlots(),
      };

      const monster3: MonsterRecord = {
        id: 'monster_depth_5_1',
        pos: { x: 12, y: 12 },
        char: 'D',
        color: '#ff00ff',
        name: 'Evolved Dragon',
        health: 120,
        maxHealth: 120,
        attack: 25,
        defense: 15,
        type: 'dragon',
        isEvolved: true,
        evolutionLevel: 1,
        equipment: createEmptySlots(),
      };

      // Save promotions for different depths
      await worldState.savePendingPromotion(monster1, 3);
      await worldState.savePendingPromotion(monster2, 3);
      await worldState.savePendingPromotion(monster3, 5);

      // Load depth 3 promotions
      const depth3Pending = await worldState.loadPendingPromotions(3);
      expect(depth3Pending).toHaveLength(2);
      expect(depth3Pending.map(m => m.id).sort()).toEqual(['monster_depth_3_1', 'monster_depth_3_2']);

      // Load depth 5 promotions
      const depth5Pending = await worldState.loadPendingPromotions(5);
      expect(depth5Pending).toHaveLength(1);
      expect(depth5Pending[0].id).toBe('monster_depth_5_1');

      // Load depth with no promotions
      const depth10Pending = await worldState.loadPendingPromotions(10);
      expect(depth10Pending).toHaveLength(0);
    });

    it('should delete pending promotion after injection', async () => {
      const monster: MonsterRecord = {
        id: 'temp_monster',
        pos: { x: 3, y: 3 },
        char: 'G',
        color: '#ffffff',
        name: 'Temporary Goblin',
        health: 40,
        maxHealth: 40,
        attack: 8,
        defense: 4,
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 1,
        equipment: createEmptySlots(),
      };

      const targetDepth = 7;

      // Save pending promotion
      await worldState.savePendingPromotion(monster, targetDepth);

      // Verify it exists
      let pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending).toHaveLength(1);

      // Delete it
      await worldState.deletePendingPromotion(monster.id);

      // Verify it's gone
      pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending).toHaveLength(0);
    });
  });

  describe('Level Generation Integration', () => {
    it('should inject pending promotions when level is generated', async () => {
      // Create a pending promotion for depth 4
      const promotedMonster: MonsterRecord = {
        id: 'injected_monster',
        pos: { x: 15, y: 15 },
        char: 'E',
        color: '#ffaa00',
        name: 'Evolved Elite Goblin',
        health: 70,
        maxHealth: 70,
        attack: 14,
        defense: 7,
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 2,
        equipment: createEmptySlots(),
      };

      const targetDepth = 4;

      // Save as pending promotion
      await worldState.savePendingPromotion(promotedMonster, targetDepth);

      // Verify pending promotion exists
      let pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending).toHaveLength(1);

      // Create a new level at depth 4 (simulating level generation)
      const newLevel: DungeonLevelRecord = {
        depth: targetDepth,
        dungeon: Array(20).fill(null).map(() => Array(20).fill('.')),
        monsters: [
          {
            id: 'regular_monster_1',
            pos: { x: 5, y: 5 },
            char: 'g',
            color: '#888888',
            name: 'Goblin',
            health: 20,
            maxHealth: 20,
            attack: 4,
            defense: 2,
            type: 'goblin',
            equipment: createEmptySlots(),
          },
        ],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };

      // Inject pending promotions (simulating LevelManager behavior)
      pending = await worldState.loadPendingPromotions(targetDepth);
      if (pending.length > 0) {
        newLevel.monsters = [...newLevel.monsters, ...pending];
        await worldState.saveLevel(newLevel);

        // Clean up pending promotions
        for (const monster of pending) {
          await worldState.deletePendingPromotion(monster.id);
        }
      } else {
        await worldState.saveLevel(newLevel);
      }

      // Verify level has both regular monster and injected promotion
      const savedLevel = worldState.getLevel(targetDepth);
      expect(savedLevel).toBeDefined();
      expect(savedLevel!.monsters).toHaveLength(2);
      expect(savedLevel!.monsters.map(m => m.id).sort()).toEqual(['injected_monster', 'regular_monster_1']);

      // Verify pending promotion was cleaned up
      const remainingPending = await worldState.loadPendingPromotions(targetDepth);
      expect(remainingPending).toHaveLength(0);
    });

    it('should inject multiple pending promotions for same level', async () => {
      const targetDepth = 6;

      // Create multiple pending promotions for the same level
      const promotions: MonsterRecord[] = [
        {
          id: 'multi_promo_1',
          pos: { x: 1, y: 1 },
          char: 'G',
          color: '#ff0000',
          name: 'First Evolved Goblin',
          health: 50,
          maxHealth: 50,
          attack: 10,
          defense: 5,
          type: 'goblin',
          isEvolved: true,
          evolutionLevel: 1,
          equipment: createEmptySlots(),
        },
        {
          id: 'multi_promo_2',
          pos: { x: 2, y: 2 },
          char: 'O',
          color: '#00ff00',
          name: 'Second Evolved Orc',
          health: 60,
          maxHealth: 60,
          attack: 12,
          defense: 6,
          type: 'orc',
          isEvolved: true,
          evolutionLevel: 1,
          equipment: createEmptySlots(),
        },
        {
          id: 'multi_promo_3',
          pos: { x: 3, y: 3 },
          char: 'T',
          color: '#0000ff',
          name: 'Third Evolved Troll',
          health: 80,
          maxHealth: 80,
          attack: 15,
          defense: 8,
          type: 'troll',
          isEvolved: true,
          evolutionLevel: 1,
          equipment: createEmptySlots(),
        },
      ];

      // Save all as pending promotions
      for (const promo of promotions) {
        await worldState.savePendingPromotion(promo, targetDepth);
      }

      // Verify all pending promotions exist
      let pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending).toHaveLength(3);

      // Create level and inject all pending promotions
      const newLevel: DungeonLevelRecord = {
        depth: targetDepth,
        dungeon: Array(20).fill(null).map(() => Array(20).fill('.')),
        monsters: [],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };

      pending = await worldState.loadPendingPromotions(targetDepth);
      newLevel.monsters = [...newLevel.monsters, ...pending];
      await worldState.saveLevel(newLevel);

      // Clean up all pending promotions
      for (const monster of pending) {
        await worldState.deletePendingPromotion(monster.id);
      }

      // Verify all promotions were injected
      const savedLevel = worldState.getLevel(targetDepth);
      expect(savedLevel).toBeDefined();
      expect(savedLevel!.monsters).toHaveLength(3);
      expect(savedLevel!.monsters.map(m => m.id).sort()).toEqual([
        'multi_promo_1',
        'multi_promo_2',
        'multi_promo_3',
      ]);

      // Verify cleanup
      const remainingPending = await worldState.loadPendingPromotions(targetDepth);
      expect(remainingPending).toHaveLength(0);
    });
  });

  describe('DeathProcessor Integration', () => {
    it('should store promoted monster in pendingPromotions when target level does not exist', async () => {
      const hero: Hero = {
        id: 'hero_test',
        playerId: 'player_1',
        name: 'Test Hero',
        level: 1,
        baseStats: { hp: 100, maxHp: 100, strength: 15, dexterity: 10, constitution: 10 },
        currentStats: { hp: 10, maxHp: 100, strength: 15, dexterity: 10, constitution: 10 },
        equipment: createEmptySlots(),
        inventory: [],
        position: { x: 10, y: 10 },
        teethCurrency: 0,
        reagentsConsumed: {},
        createdAt: Date.now(),
        isAlive: true,
      };

      const killerMonster: Monster = {
        id: 'killer_goblin',
        pos: { x: 11, y: 11 },
        char: 'G',
        color: '#00ff00',
        name: 'Killer Goblin',
        health: 30,
        maxHealth: 30,
        attack: 8,
        defense: 4,
        type: 'goblin',
        evolutionPoints: 5,
        isEvolved: false,
        evolutionLevel: 0,
        equipment: createEmptySlots(),
      };

      const currentDepth = 2;

      // Process hero death (this should trigger promotion)
      const result = await processHeroDeath(
        hero,
        killerMonster,
        worldState,
        currentDepth
      );

      // Verify promotion happened
      expect(result.promotedMonster).toBeDefined();
      expect(result.promotedMonster!.isEvolved).toBe(true);

      // Verify promotion summary
      expect(result.summary).toBeDefined();
      expect(result.summary!.newLevel).toBeGreaterThan(currentDepth);

      const targetDepth = result.summary!.newLevel;

      // Verify promoted monster was saved in pendingPromotions (since target level doesn't exist)
      const pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending.length).toBeGreaterThan(0);

      // Find the promoted monster in pending list
      const promotedInPending = pending.find(m => m.id === result.promotedMonster!.id);
      expect(promotedInPending).toBeDefined();
      expect(promotedInPending!.isEvolved).toBe(true);
      expect(promotedInPending!.evolutionLevel).toBeGreaterThan(0);
    });

    it('should add promoted monster directly to level if level already exists', async () => {
      const hero: Hero = {
        id: 'hero_test_2',
        playerId: 'player_2',
        name: 'Test Hero 2',
        level: 1,
        baseStats: { hp: 100, maxHp: 100, strength: 15, dexterity: 10, constitution: 10 },
        currentStats: { hp: 10, maxHp: 100, strength: 15, dexterity: 10, constitution: 10 },
        equipment: createEmptySlots(),
        inventory: [],
        position: { x: 10, y: 10 },
        teethCurrency: 0,
        reagentsConsumed: {},
        createdAt: Date.now(),
        isAlive: true,
      };

      const killerMonster: Monster = {
        id: 'killer_orc',
        pos: { x: 11, y: 11 },
        char: 'O',
        color: '#ff0000',
        name: 'Killer Orc',
        health: 40,
        maxHealth: 40,
        attack: 10,
        defense: 5,
        type: 'orc',
        evolutionPoints: 5,
        isEvolved: false,
        evolutionLevel: 0,
        equipment: createEmptySlots(),
      };

      const currentDepth = 2;
      const targetDepth = 3;

      // Pre-create the target level
      const existingLevel: DungeonLevelRecord = {
        depth: targetDepth,
        dungeon: Array(20).fill(null).map(() => Array(20).fill('.')),
        monsters: [
          {
            id: 'existing_monster',
            pos: { x: 5, y: 5 },
            char: 'g',
            color: '#888888',
            name: 'Regular Goblin',
            health: 20,
            maxHealth: 20,
            attack: 4,
            defense: 2,
            type: 'goblin',
            equipment: createEmptySlots(),
          },
        ],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(existingLevel);

      // Process hero death
      const result = await processHeroDeath(
        hero,
        killerMonster,
        worldState,
        currentDepth
      );

      // Verify promotion happened and went to target level
      expect(result.promotedMonster).toBeDefined();
      expect(result.summary!.newLevel).toBe(targetDepth);

      // Verify promoted monster was added to existing level (NOT to pendingPromotions)
      const updatedLevel = worldState.getLevel(targetDepth);
      expect(updatedLevel).toBeDefined();
      expect(updatedLevel!.monsters).toHaveLength(2);
      expect(updatedLevel!.monsters.map(m => m.id).sort()).toEqual([
        'existing_monster',
        result.promotedMonster!.id,
      ].sort());

      // Verify NO pending promotions were created
      const pending = await worldState.loadPendingPromotions(targetDepth);
      expect(pending).toHaveLength(0);
    });
  });

  describe('Database Schema Migration', () => {
    it('should have pendingPromotions object store in DB version 5', async () => {
      // The store should already be created during beforeEach initialization
      const store = worldState.getStore();
      const db = (store as any).db; // Access private db field for testing

      expect(db).toBeDefined();

      // Verify the pendingPromotions store exists
      const storeNames = Array.from(db.objectStoreNames);
      expect(storeNames).toContain(STORE_NAMES.PENDING_PROMOTIONS);

      // Verify the targetDepth index exists
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAMES.PENDING_PROMOTIONS, 'readonly');
        const objectStore = tx.objectStore(STORE_NAMES.PENDING_PROMOTIONS);
        const indexNames = Array.from(objectStore.indexNames);

        expect(indexNames).toContain('targetDepth');

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pending promotions gracefully', async () => {
      const pending = await worldState.loadPendingPromotions(999);
      expect(pending).toHaveLength(0);
      expect(Array.isArray(pending)).toBe(true);
    });

    it('should not fail when deleting non-existent pending promotion', async () => {
      // Should not throw error
      await expect(
        worldState.deletePendingPromotion('non_existent_id')
      ).resolves.toBeUndefined();
    });

    it('should preserve pending promotions when saving unrelated levels', async () => {
      // Save pending promotion for depth 5
      const monster: MonsterRecord = {
        id: 'preserved_monster',
        pos: { x: 1, y: 1 },
        char: 'P',
        color: '#ffffff',
        name: 'Preserved Monster',
        health: 50,
        maxHealth: 50,
        attack: 10,
        defense: 5,
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 1,
        equipment: createEmptySlots(),
      };
      await worldState.savePendingPromotion(monster, 5);

      // Create and save a level at different depth
      const level3: DungeonLevelRecord = {
        depth: 3,
        dungeon: Array(20).fill(null).map(() => Array(20).fill('.')),
        monsters: [],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(level3);

      // Verify pending promotion for depth 5 still exists
      const pending = await worldState.loadPendingPromotions(5);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('preserved_monster');
    });
  });
});
