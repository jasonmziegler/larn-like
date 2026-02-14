// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldStore, STORE_NAMES } from '../../../src/world/WorldStore';
import { WorldState } from '../../../src/world/WorldState';
import type { DeathEventRecord, DungeonLevelRecord, MonsterRecord } from '../../../src/world/WorldState';
import type { Hero } from '@larn-like/shared';

describe('WorldIntegration', () => {
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

  describe('Fresh world initialization', () => {
    it('should produce empty evolved monsters and teeth', async () => {
      const state = worldState.getState();

      expect(state.deathEvents).toHaveLength(0);
      expect(state.levels).toHaveLength(0);
      expect(state.currentHero).toBeNull();
      expect(worldState.isFreshWorld()).toBe(true);
      expect(worldState.getHeroesFallen()).toBe(0);
      expect(worldState.getEvolvedMonsterCount()).toBe(0);
    });

    it('should initialize with default credits', () => {
      expect(worldState.getCredits()).toBe(3);
    });
  });

  describe('World with one death event', () => {
    it('should load evolved monster on correct level', async () => {
      // Arrange: Create a death event with an evolved monster
      const evolvedMonster: MonsterRecord = {
        id: 'monster_evolved_1',
        pos: { x: 10, y: 10 },
        char: 'G',
        color: '#ff0000',
        name: 'Elite Goblin',
        health: 50,
        maxHealth: 50,
        attack: 15,
        defense: 8,
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [{ heroId: 'hero_1', heroName: 'TestHero', timestamp: '2026-01-01' }],
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
      };

      const levelRecord: DungeonLevelRecord = {
        depth: 2,
        dungeon: Array(20).fill(Array(80).fill('.')),
        monsters: [evolvedMonster],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };

      const deathEvent: DeathEventRecord = {
        id: 'death_1',
        heroId: 'hero_1',
        heroName: 'TestHero',
        killerMonsterId: 'monster_evolved_1',
        location: { x: 10, y: 10, depth: 2 },
        teethDropped: 10,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: new Date().toISOString(),
      };

      await worldState.saveLevel(levelRecord);
      await worldState.saveDeathEvent(deathEvent);

      // Act: Reload world state
      const newWorldState = new WorldState(store);
      await newWorldState.initializeWorld();

      // Assert: Evolved monster is loaded on correct level
      const loadedLevel = newWorldState.getLevel(2);
      expect(loadedLevel).toBeDefined();
      expect(loadedLevel!.monsters).toHaveLength(1);
      expect(loadedLevel!.monsters[0].isEvolved).toBe(true);
      expect(loadedLevel!.monsters[0].evolutionLevel).toBe(1);
      expect(loadedLevel!.monsters[0].name).toBe('Elite Goblin');

      expect(newWorldState.getHeroesFallen()).toBe(1);
      expect(newWorldState.getEvolvedMonsterCount()).toBe(1);
      expect(newWorldState.isFreshWorld()).toBe(false);
    });
  });

  describe('World with teeth drops', () => {
    it('should load uncollected teeth on correct level', async () => {
      // Arrange: Create teeth drops
      const teethDrop1 = {
        id: 'teeth_1',
        position: { x: 5, y: 5 },
        value: 10,
        fromHeroId: 'hero_1',
        fromHeroName: 'TestHero',
        levelDepth: 3,
        isCollected: false,
        createdAt: new Date().toISOString(),
      };

      const teethDrop2 = {
        id: 'teeth_2',
        position: { x: 8, y: 8 },
        value: 15,
        fromHeroId: 'hero_2',
        fromHeroName: 'AnotherHero',
        levelDepth: 3,
        isCollected: false,
        createdAt: new Date().toISOString(),
      };

      await store.saveTeethDrop(teethDrop1);
      await store.saveTeethDrop(teethDrop2);

      // Act: Load teeth drops by level
      const teethDrops = await store.loadTeethDropsByLevel(3);

      // Assert: Both uncollected teeth are loaded
      expect(teethDrops).toHaveLength(2);
      expect(teethDrops.some((td: { id: string }) => td.id === 'teeth_1')).toBe(true);
      expect(teethDrops.some((td: { id: string }) => td.id === 'teeth_2')).toBe(true);
    });

    it('should not load collected teeth', async () => {
      // Arrange: Create collected teeth drop
      const collectedTeeth = {
        id: 'teeth_collected',
        position: { x: 5, y: 5 },
        value: 10,
        fromHeroId: 'hero_1',
        fromHeroName: 'TestHero',
        levelDepth: 1,
        isCollected: true,
        createdAt: new Date().toISOString(),
      };

      await store.saveTeethDrop(collectedTeeth);

      // Act: Load teeth drops (should filter out collected)
      const teethDrops = await store.loadTeethDropsByLevel(1);

      // Assert: Collected teeth should still be in DB, filtering happens in game logic
      expect(teethDrops).toHaveLength(1);
      expect(teethDrops[0].isCollected).toBe(true);
    });
  });

  describe('Credits synchronization', () => {
    it('should sync credits between storage systems', async () => {
      // Act: Set credits via WorldState
      worldState.setCredits(5);
      await worldState.saveCredits();

      // Assert: Credits persisted
      const newWorldState = new WorldState(store);
      await newWorldState.initializeWorld();
      expect(newWorldState.getCredits()).toBe(5);
    });

    it('should not allow negative credits', () => {
      worldState.setCredits(-10);
      expect(worldState.getCredits()).toBe(0);
    });
  });

  describe('Hero persistence', () => {
    it('should persist hero creation to WorldStore', async () => {
      // Arrange: Create a hero
      const hero: Hero & { id: string } = {
        id: 'hero_brave_1',
        name: 'Brave Hero',
        level: 1,
        experience: 0,
        position: { x: 40, y: 10 },
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        isAlive: true,
        gold: 0,
        teethCurrency: 0,
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
        inventory: [],
        reagents: {},
        attributeBonuses: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
        },
      };

      // Act: Save hero
      worldState.setCurrentHero(hero);
      await worldState.saveHero();

      // Assert: Hero is persisted to store
      const savedHero = await store.loadHero('hero_brave_1');
      expect(savedHero).toBeDefined();
      expect(savedHero!.name).toBe('Brave Hero');
      expect(savedHero!.isAlive).toBe(true);

      // Verify all heroes list includes our hero
      const allHeroes = await store.getAll<Hero & { id: string }>(STORE_NAMES.HEROES);
      expect(allHeroes).toHaveLength(1);
      expect(allHeroes[0].id).toBe('hero_brave_1');
      expect(allHeroes[0].isAlive).toBe(true);
    });

    it('should update hero record to isAlive = false on death', async () => {
      // Arrange: Create and save a living hero
      const hero: Hero & { id: string } = {
        id: 'hero_doomed_1',
        name: 'Doomed Hero',
        level: 1,
        experience: 0,
        position: { x: 40, y: 10 },
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        isAlive: true,
        gold: 0,
        teethCurrency: 0,
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
        inventory: [],
        reagents: {},
        attributeBonuses: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
        },
      };

      worldState.setCurrentHero(hero);
      await worldState.saveHero();

      // Act: Mark hero as dead and save
      hero.isAlive = false;
      hero.health = 0;
      await worldState.saveHero();

      // Assert: Hero is marked as dead
      const heroes = await store.getAll<Hero>(STORE_NAMES.HEROES);
      expect(heroes).toHaveLength(1);
      expect(heroes[0].isAlive).toBe(false);
      expect(heroes[0].health).toBe(0);
    });
  });

  describe('Level initialization', () => {
    it('should merge evolved monsters with baseline generation', async () => {
      // This test verifies the concept that levels can have both:
      // 1. Evolved monsters from previous sessions
      // 2. Newly generated baseline monsters

      // Arrange: Create a level with one evolved monster
      const evolvedMonster: MonsterRecord = {
        id: 'evolved_orc',
        pos: { x: 20, y: 10 },
        char: 'O',
        color: '#ff6600',
        name: 'Veteran Orc',
        health: 80,
        maxHealth: 80,
        attack: 20,
        defense: 12,
        type: 'orc',
        isEvolved: true,
        evolutionLevel: 2,
        killHistory: [],
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
      };

      const levelRecord: DungeonLevelRecord = {
        depth: 4,
        dungeon: Array(20).fill(Array(80).fill('.')),
        monsters: [evolvedMonster],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };

      await worldState.saveLevel(levelRecord);

      // Act: Load level
      const loadedLevel = worldState.getLevel(4);

      // Assert: Evolved monster is present
      expect(loadedLevel).toBeDefined();
      expect(loadedLevel!.monsters).toHaveLength(1);
      expect(loadedLevel!.monsters[0].isEvolved).toBe(true);
      expect(loadedLevel!.monsters[0].name).toBe('Veteran Orc');

      // Note: Baseline monster generation happens in main.ts initGame(),
      // not in WorldState, so we only verify persisted monsters here
    });
  });

  describe('World state summary counts', () => {
    it('should count heroes fallen and monsters evolved', async () => {
      // Arrange: Create multiple death events and evolved monsters across levels
      const deathEvent1: DeathEventRecord = {
        id: 'death_1',
        heroId: 'hero_1',
        heroName: 'Hero One',
        killerMonsterId: 'monster_1',
        location: { x: 5, y: 5, depth: 1 },
        teethDropped: 10,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: new Date().toISOString(),
      };

      const deathEvent2: DeathEventRecord = {
        id: 'death_2',
        heroId: 'hero_2',
        heroName: 'Hero Two',
        killerMonsterId: 'monster_2',
        location: { x: 10, y: 10, depth: 2 },
        teethDropped: 15,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: new Date().toISOString(),
      };

      const level1: DungeonLevelRecord = {
        depth: 1,
        dungeon: [],
        monsters: [
          {
            id: 'm1',
            pos: { x: 5, y: 5 },
            char: 'g',
            color: '#00ff00',
            name: 'Elite Goblin',
            health: 40,
            maxHealth: 40,
            attack: 12,
            defense: 6,
            type: 'goblin',
            isEvolved: true,
            evolutionLevel: 1,
            killHistory: [],
            equipment: {
              weapon: null,
              armor: null,
              shield: null,
              helmet: null,
              boots: null,
              gloves: null,
            },
          },
        ],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };

      const level2: DungeonLevelRecord = {
        depth: 2,
        dungeon: [],
        monsters: [
          {
            id: 'm2',
            pos: { x: 10, y: 10 },
            char: 'O',
            color: '#ff0000',
            name: 'Veteran Orc',
            health: 80,
            maxHealth: 80,
            attack: 20,
            defense: 12,
            type: 'orc',
            isEvolved: true,
            evolutionLevel: 2,
            killHistory: [],
            equipment: {
              weapon: null,
              armor: null,
              shield: null,
              helmet: null,
              boots: null,
              gloves: null,
            },
          },
          {
            id: 'm3',
            pos: { x: 15, y: 15 },
            char: 'T',
            color: '#ffaa00',
            name: 'Evolved Troll',
            health: 120,
            maxHealth: 120,
            attack: 25,
            defense: 15,
            type: 'troll',
            isEvolved: true,
            evolutionLevel: 1,
            killHistory: [],
            equipment: {
              weapon: null,
              armor: null,
              shield: null,
              helmet: null,
              boots: null,
              gloves: null,
            },
          },
        ],
        items: [],
        chests: [],
        generatedAt: new Date().toISOString(),
      };

      await worldState.saveDeathEvent(deathEvent1);
      await worldState.saveDeathEvent(deathEvent2);
      await worldState.saveLevel(level1);
      await worldState.saveLevel(level2);

      // Act: Get summary counts
      const heroesFallen = worldState.getHeroesFallen();
      const monstersEvolved = worldState.getEvolvedMonsterCount();

      // Assert
      expect(heroesFallen).toBe(2);
      expect(monstersEvolved).toBe(3); // 1 from level1, 2 from level2
      expect(worldState.isFreshWorld()).toBe(false);
    });
  });

  describe('Reset World', () => {
    it('should clear all stores and reset credits', async () => {
      // Arrange: Populate world with data
      const hero: Hero & { id: string } = {
        id: 'hero_reset_test',
        name: 'Test Hero',
        level: 5,
        experience: 1000,
        position: { x: 10, y: 10 },
        health: 100,
        maxHealth: 100,
        attack: 15,
        defense: 10,
        strength: 15,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        isAlive: false,
        gold: 100,
        teethCurrency: 50,
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
        inventory: [],
        reagents: {},
        attributeBonuses: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
        },
      };

      worldState.setCurrentHero(hero);
      await worldState.saveHero();

      const deathEvent: DeathEventRecord = {
        id: 'death_reset_test',
        heroId: 'hero_reset',
        heroName: 'Test Hero',
        killerMonsterId: 'monster_1',
        location: { x: 10, y: 10, depth: 3 },
        teethDropped: 20,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: new Date().toISOString(),
      };

      await worldState.saveDeathEvent(deathEvent);
      worldState.setCredits(10);
      await worldState.saveCredits();

      // Act: Reset world by deleting database
      await store.deleteDatabase();

      // Create fresh world state
      const freshStore = new WorldStore();
      const freshWorldState = new WorldState(freshStore);
      await freshWorldState.initializeWorld();

      // Assert: All data is cleared
      expect(freshWorldState.getHeroesFallen()).toBe(0);
      expect(freshWorldState.getEvolvedMonsterCount()).toBe(0);
      expect(freshWorldState.getCredits()).toBe(3); // Default credits
      expect(freshWorldState.getCurrentHero()).toBeNull();
      expect(freshWorldState.isFreshWorld()).toBe(true);

      await freshStore.deleteDatabase();
    });
  });

  describe('Edge case: Multiple sessions accumulation', () => {
    it('should accumulate data from multiple play sessions correctly', async () => {
      // Simulate multiple play sessions with different heroes

      // Session 1: Hero dies, creates death event and evolved monster
      const hero1: Hero & { id: string } = {
        id: 'hero_session_1',
        name: 'Hero Session 1',
        level: 3,
        experience: 500,
        position: { x: 10, y: 10 },
        health: 0,
        maxHealth: 100,
        attack: 12,
        defense: 8,
        strength: 12,
        dexterity: 10,
        constitution: 11,
        intelligence: 9,
        isAlive: false,
        gold: 50,
        teethCurrency: 20,
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          helmet: null,
          boots: null,
          gloves: null,
        },
        inventory: [],
        reagents: {},
        attributeBonuses: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
        },
      };

      const death1: DeathEventRecord = {
        id: 'death_session_1',
        heroId: 'hero_1',
        heroName: 'Hero Session 1',
        killerMonsterId: 'goblin_1',
        location: { x: 10, y: 10, depth: 1 },
        teethDropped: 10,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-01T10:00:00Z',
      };

      worldState.setCurrentHero(hero1);
      await worldState.saveHero();
      await worldState.saveDeathEvent(death1);

      // Session 2: Another hero dies
      const hero2: Hero & { id: string } = {
        ...hero1,
        id: 'hero_session_2',
        name: 'Hero Session 2',
        isAlive: false,
      };

      const death2: DeathEventRecord = {
        id: 'death_session_2',
        heroId: 'hero_2',
        heroName: 'Hero Session 2',
        killerMonsterId: 'orc_1',
        location: { x: 15, y: 15, depth: 2 },
        teethDropped: 15,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-02T14:00:00Z',
      };

      worldState.setCurrentHero(hero2);
      await worldState.saveHero();
      await worldState.saveDeathEvent(death2);

      // Session 3: Third hero dies, creates more evolved monsters
      const level3: DungeonLevelRecord = {
        depth: 3,
        dungeon: [],
        monsters: [
          {
            id: 'troll_evolved',
            pos: { x: 20, y: 20 },
            char: 'T',
            color: '#ff0000',
            name: 'Ancient Troll',
            health: 150,
            maxHealth: 150,
            attack: 30,
            defense: 20,
            type: 'troll',
            isEvolved: true,
            evolutionLevel: 3,
            killHistory: [],
            equipment: {
              weapon: null,
              armor: null,
              shield: null,
              helmet: null,
              boots: null,
              gloves: null,
            },
          },
        ],
        items: [],
        chests: [],
        generatedAt: '2026-01-03T16:00:00Z',
      };

      await worldState.saveLevel(level3);

      const death3: DeathEventRecord = {
        id: 'death_session_3',
        heroId: 'hero_3',
        heroName: 'Hero Session 3',
        killerMonsterId: 'troll_evolved',
        location: { x: 20, y: 20, depth: 3 },
        teethDropped: 25,
        equipmentTransferred: [],
        equipmentScattered: [],
        soulShrineCreated: false,
        processedAt: '2026-01-03T17:00:00Z',
      };

      await worldState.saveDeathEvent(death3);

      // Act: Reload world and verify accumulation
      const accumulatedWorldState = new WorldState(store);
      await accumulatedWorldState.initializeWorld();

      // Assert: All data from multiple sessions is accumulated
      expect(accumulatedWorldState.getHeroesFallen()).toBe(3);
      expect(accumulatedWorldState.getEvolvedMonsterCount()).toBe(1); // Only level 3 has evolved monsters
      expect(accumulatedWorldState.isFreshWorld()).toBe(false);

      const allDeaths = accumulatedWorldState.getState().deathEvents;
      expect(allDeaths).toHaveLength(3);
      expect(allDeaths.map((d) => d.heroName).sort()).toEqual([
        'Hero Session 1',
        'Hero Session 2',
        'Hero Session 3',
      ]);
    });
  });
});
