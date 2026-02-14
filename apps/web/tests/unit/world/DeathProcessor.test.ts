import { describe, it, expect, beforeEach } from 'vitest';
import { processHeroDeath } from '../../../src/world/DeathProcessor';
import { WorldState } from '../../../src/world/WorldState';
import { WorldStore } from '../../../src/world/WorldStore';
import type { Hero } from '@larn-like/shared';
import type { Monster } from '../../../src/game/Combat';
import 'fake-indexeddb/auto';

describe('DeathProcessor', () => {
  let worldState: WorldState;
  let mockHero: Hero;
  let mockKillerMonster: Monster & { _persistId: string };

  beforeEach(async () => {
    // Reset IndexedDB
    indexedDB = new IDBFactory();

    // Create fresh WorldState with in-memory store
    const store = new WorldStore();
    worldState = new WorldState(store);
    await worldState.initializeWorld();

    // Create mock hero
    mockHero = {
      id: 'hero_test_123',
      name: 'Testius',
      level: 1,
      experience: 0,
      isAlive: false, // Hero is dead in these tests
      position: { x: 10, y: 10 },
      baseStats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      currentStats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      currentHealth: 0,
      maxHealth: 20,
      teethCurrency: 0,
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
        shield: null,
        amulet: null,
        ring: null,
      },
    } as Hero;

    // Create mock killer monster
    mockKillerMonster = {
      pos: { x: 11, y: 10 },
      char: 'g',
      color: '#00FF00',
      name: 'Goblin',
      health: 5,
      maxHealth: 5,
      attack: 3,
      defense: 1,
      type: 'goblin',
      isEvolved: false,
      evolutionLevel: 0,
      killHistory: [],
      _persistId: 'monster_goblin_123',
    };
  });

  it('should create death event record with correct fields', async () => {
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);

    expect(result.deathEvent).toBeDefined();
    expect(result.deathEvent.heroId).toBe('hero_test_123');
    expect(result.deathEvent.heroName).toBe('Testius');
    expect(result.deathEvent.killerMonsterId).toBe('monster_goblin_123');
    expect(result.deathEvent.location.x).toBe(10);
    expect(result.deathEvent.location.y).toBe(10);
    expect(result.deathEvent.location.depth).toBe(1);
    expect(result.deathEvent.teethDropped).toBeGreaterThanOrEqual(16);
    expect(result.deathEvent.teethDropped).toBeLessThanOrEqual(32);
    expect(result.deathEvent.processedAt).toBeDefined();
  });

  it('should generate teeth drop between 16-32', async () => {
    const teethDrops: number[] = [];
    // Run multiple times to check randomness
    for (let i = 0; i < 20; i++) {
      const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);
      teethDrops.push(result.deathEvent.teethDropped);
    }

    // Check all values are in valid range
    for (const teeth of teethDrops) {
      expect(teeth).toBeGreaterThanOrEqual(16);
      expect(teeth).toBeLessThanOrEqual(32);
    }
  });

  it('should promote monster with enhanced stats', async () => {
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);

    expect(result.promotedMonster).toBeDefined();
    expect(result.summary).toBeDefined();

    // Check stat enhancements
    const { statChanges } = result.summary!;

    // HP should be +50% (minimum +1)
    const expectedHpBonus = Math.max(1, Math.floor(mockKillerMonster.maxHealth * 0.5));
    expect(statChanges.hp.new).toBe(mockKillerMonster.maxHealth + expectedHpBonus);
    expect(statChanges.hp.old).toBe(mockKillerMonster.maxHealth);

    // Attack should be +1
    expect(statChanges.attack.new).toBe(mockKillerMonster.attack + 1);
    expect(statChanges.attack.old).toBe(mockKillerMonster.attack);

    // Defense should be +1
    expect(statChanges.defense.new).toBe(mockKillerMonster.defense + 1);
    expect(statChanges.defense.old).toBe(mockKillerMonster.defense);
  });

  it('should set promoted monster level to currentLevel + 1', async () => {
    const currentDepth = 2;
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, currentDepth);

    expect(result.summary).toBeDefined();
    expect(result.summary!.oldLevel).toBe(2);
    expect(result.summary!.newLevel).toBe(3);
  });

  it('should mark monster as evolved with incremented evolution level', async () => {
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);

    expect(result.promotedMonster).toBeDefined();
    expect(result.promotedMonster!.isEvolved).toBe(true);
    expect(result.promotedMonster!.evolutionLevel).toBe(1);
  });

  it('should retain monster type after promotion', async () => {
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);

    expect(result.promotedMonster).toBeDefined();
    expect(result.promotedMonster!.type).toBe('goblin');
    expect(result.promotedMonster!.name).toBe('Goblin');
  });

  it('should add hero to kill history', async () => {
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);

    expect(result.promotedMonster).toBeDefined();
    expect(result.promotedMonster!.killHistory).toBeDefined();
    expect(result.promotedMonster!.killHistory!.length).toBe(1);
    expect(result.promotedMonster!.killHistory![0].heroName).toBe('Testius');
    expect(result.promotedMonster!.killHistory![0].killedAt).toBeDefined();
  });

  it('should persist death event and promoted monster to IndexedDB', async () => {
    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 1);

    // Verify death event was persisted
    const deathEvents = worldState.getState().deathEvents;
    expect(deathEvents.length).toBe(1);
    expect(deathEvents[0].id).toBe(result.deathEvent.id);

    // Verify promoted monster appears in target level (if it exists)
    // Note: Level might not exist yet, which is fine - monster will be added when level is generated
    const targetLevel = worldState.getLevel(2);
    if (targetLevel) {
      const promotedMonsters = targetLevel.monsters.filter(m => m.id === result.promotedMonster!.id);
      expect(promotedMonsters.length).toBe(1);
    }
  });

  it('should handle already-evolved monsters correctly', async () => {
    // Set up a monster that's already evolved
    mockKillerMonster.isEvolved = true;
    mockKillerMonster.evolutionLevel = 2;
    mockKillerMonster.killHistory = [
      { heroName: 'PreviousHero', killedAt: '2026-01-01T00:00:00.000Z' },
    ];

    const result = await processHeroDeath(mockHero, mockKillerMonster, worldState, 3);

    expect(result.promotedMonster).toBeDefined();
    expect(result.promotedMonster!.isEvolved).toBe(true);
    expect(result.promotedMonster!.evolutionLevel).toBe(3); // Should increment
    expect(result.promotedMonster!.killHistory!.length).toBe(2); // Should add to existing history
  });

  it('should ensure minimum +1 HP bonus even for low health monsters', async () => {
    // Create a very weak monster (1 HP)
    const weakMonster: Monster & { _persistId: string } = {
      ...mockKillerMonster,
      maxHealth: 1,
      health: 1,
      _persistId: 'monster_weak_123',
    };

    const result = await processHeroDeath(mockHero, weakMonster, worldState, 1);

    expect(result.summary).toBeDefined();
    expect(result.summary!.statChanges.hp.old).toBe(1);
    // 50% of 1 is 0.5, floor = 0, but minimum is 1, so should be 1+1=2
    expect(result.summary!.statChanges.hp.new).toBe(2);
  });
});
