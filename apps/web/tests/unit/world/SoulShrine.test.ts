// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldStore, STORE_NAMES } from '../../../src/world/WorldStore';
import { WorldState } from '../../../src/world/WorldState';
import { calculateSoulEnergy, createSoulShrine } from '../../../src/world/SoulShrine';
import { processHeroDeath } from '../../../src/world/DeathProcessor';
import type { Hero } from '@larn-like/shared';
import type { Monster } from '../../../src/game/Combat';

// Helper to create test heroes with correct structure
function createTestHero(name: string, level: number, str: number, dex: number, con: number): Hero {
  return {
    id: `hero_${name}_${Date.now()}`,
    playerId: 'test',
    name,
    level,
    baseStats: {
      hp: 100,
      maxHp: 100,
      strength: str,
      dexterity: dex,
      constitution: con,
    },
    currentStats: {
      hp: 100,
      maxHp: 100,
      strength: str,
      dexterity: dex,
      constitution: con,
    },
    position: { x: 10, y: 10, depth: 1 },
    isAlive: true,
    teethCurrency: 0,
    equipment: {
      weapon: null,
      offHand: null,
      helmet: null,
      bodyArmor: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      amulet: null,
      belt: null,
    },
    inventory: [],
    createdAt: Date.now(),
  };
}

describe('SoulShrine', () => {
  let store: WorldStore;
  let worldState: WorldState;

  beforeEach(async () => {
    store = new WorldStore();
    worldState = new WorldState(store);
    await worldState.initializeWorld();
  });

  afterEach(async () => {
    await store.deleteDatabase();
  });

  describe('calculateSoulEnergy', () => {
    it('should calculate minimum energy of 10 for level 1 hero with minimum stats', () => {
      const hero = createTestHero('Weak Hero', 1, 1, 1, 1);

      const energy = calculateSoulEnergy(hero);
      // (1 * 10) + floor(1 + 1 + 1) = 10 + 3 = 13
      expect(energy).toBe(13); // Above minimum
      expect(energy).toBeGreaterThanOrEqual(10); // Minimum is enforced
    });

    it('should calculate energy for level 1 hero with base stats (10/10/10)', () => {
      const hero = createTestHero('Base Hero', 1, 10, 10, 10);

      const energy = calculateSoulEnergy(hero);
      // (1 * 10) + floor(10 + 10 + 10) = 10 + 30 = 40
      expect(energy).toBe(40);
    });

    it('should scale energy with hero level and stats', () => {
      const hero = createTestHero('Strong Hero', 3, 12, 11, 13);

      const energy = calculateSoulEnergy(hero);
      // (3 * 10) + floor(12 + 11 + 13) = 30 + 36 = 66
      expect(energy).toBe(66);
    });

    it('should calculate high energy for high-level hero', () => {
      const hero = createTestHero('Epic Hero', 10, 20, 18, 22);

      const energy = calculateSoulEnergy(hero);
      // (10 * 10) + floor(20 + 18 + 22) = 100 + 60 = 160
      expect(energy).toBe(160);
    });
  });

  describe('createSoulShrine', () => {
    it('should create valid shrine from hero data', () => {
      const hero = createTestHero('Test Hero', 2, 11, 10, 12);

      const deathPosition = { x: 15, y: 20 };
      const levelDepth = 3;

      const shrine = createSoulShrine(hero, deathPosition, levelDepth);

      expect(shrine.id).toContain('shrine_Test Hero_');
      expect(shrine.heroName).toBe('Test Hero');
      expect(shrine.heroLevel).toBe(2);
      expect(shrine.levelDepth).toBe(3);
      expect(shrine.position).toEqual({ x: 15, y: 20 });
      expect(shrine.soulEnergy).toBe(53); // (2*10) + (11+10+12) = 20 + 33 = 53
      expect(shrine.isActive).toBe(true);
      expect(shrine.createdAt).toBeDefined();
    });
  });

  describe('Shrine persistence', () => {
    it('should persist shrine to IndexedDB and load by level depth', async () => {
      const hero = createTestHero('Persist Hero', 1, 10, 10, 10);

      const shrine = createSoulShrine(hero, { x: 5, y: 5 }, 2);

      // Save shrine
      await store.saveSoulShrine(shrine as unknown as Record<string, unknown>);

      // Load shrines by level
      const shrines = await store.loadShrinesByLevel(2);

      expect(shrines).toHaveLength(1);
      expect(shrines[0].heroName).toBe('Persist Hero');
      expect(shrines[0].levelDepth).toBe(2);
      expect(shrines[0].isActive).toBe(true);
    });

    it('should only return active shrines from loadShrinesByLevel', async () => {
      const hero1 = createTestHero('Active Hero 1', 1, 10, 10, 10);
      const hero2 = createTestHero('Active Hero 2', 1, 10, 10, 10);

      const activeShrine = createSoulShrine(hero1, { x: 5, y: 5 }, 1);
      const consumedShrine = createSoulShrine(hero2, { x: 10, y: 10 }, 1);

      // Save both shrines
      await store.saveSoulShrine(activeShrine as unknown as Record<string, unknown>);
      await store.saveSoulShrine(consumedShrine as unknown as Record<string, unknown>);

      // Consume one shrine
      await store.consumeShrine(consumedShrine.id);

      // Load shrines - should only get active one
      const shrines = await store.loadShrinesByLevel(1);

      expect(shrines).toHaveLength(1);
      expect(shrines[0].id).toBe(activeShrine.id);
      expect(shrines[0].isActive).toBe(true);
    });

    it('should mark shrine as consumed when consumeShrine is called', async () => {
      const hero = createTestHero('Consume Hero', 1, 10, 10, 10);

      const shrine = createSoulShrine(hero, { x: 5, y: 5 }, 1);
      await store.saveSoulShrine(shrine as unknown as Record<string, unknown>);

      // Consume shrine
      await store.consumeShrine(shrine.id);

      // Load directly from store to verify isActive = false
      const consumedShrine = await store.get<Record<string, unknown>>(STORE_NAMES.SOUL_SHRINES, shrine.id);
      expect(consumedShrine).toBeDefined();
      expect(consumedShrine!.isActive).toBe(false);
    });

    it('should support multiple shrines on same level', async () => {
      const hero1 = createTestHero('Hero One', 1, 10, 10, 10);
      const hero2 = createTestHero('Hero Two', 2, 11, 11, 11);

      const shrine1 = createSoulShrine(hero1, { x: 5, y: 5 }, 3);
      const shrine2 = createSoulShrine(hero2, { x: 15, y: 15 }, 3);

      await store.saveSoulShrine(shrine1 as unknown as Record<string, unknown>);
      await store.saveSoulShrine(shrine2 as unknown as Record<string, unknown>);

      const shrines = await store.loadShrinesByLevel(3);

      expect(shrines).toHaveLength(2);
      expect(shrines.some((s: Record<string, unknown>) => s.heroName === 'Hero One')).toBe(true);
      expect(shrines.some((s: Record<string, unknown>) => s.heroName === 'Hero Two')).toBe(true);
    });
  });

  describe('Death processing integration', () => {
    it('should create soul shrine during death processing', async () => {
      const hero = createTestHero('Death Integration Hero', 2, 11, 10, 12);
      hero.position = { x: 25, y: 25, depth: 1 };

      const killerMonster: Monster = {
        pos: { x: 26, y: 25 },
        char: 'O',
        color: '#00ff00',
        name: 'Orc',
        health: 50,
        maxHealth: 50,
        attack: 10,
        defense: 5,
        type: 'orc',
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
        _persistId: 'orc_killer_1',
      } as Monster & { _persistId: string };

      const currentDepth = 4;

      // Process hero death
      const result = await processHeroDeath(hero, killerMonster, worldState, currentDepth);

      // Verify shrine creation in result
      expect(result.soulShrineCreated).toBe(true);
      expect(result.soulShrineId).toBeDefined();

      // Verify shrine was persisted
      const shrines = await store.loadShrinesByLevel(currentDepth);
      expect(shrines).toHaveLength(1);
      expect(shrines[0].heroName).toBe('Death Integration Hero');
      expect(shrines[0].levelDepth).toBe(4);
      expect(shrines[0].position).toEqual({ x: 25, y: 25 }); // Death position
    });
  });

  describe('Edge cases', () => {
    it('should produce minimum 10 energy for level 1 hero with base stats', () => {
      const hero = createTestHero('Edge Hero', 1, 5, 5, 5);

      const energy = calculateSoulEnergy(hero);
      // (1 * 10) + floor(5 + 5 + 5) = 10 + 15 = 25
      expect(energy).toBeGreaterThanOrEqual(10);
      expect(energy).toBe(25);
    });
  });
});
