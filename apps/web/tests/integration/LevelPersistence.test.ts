import { describe, it, expect, beforeEach } from 'vitest';
import { WorldState } from '../../src/world/WorldState';
import { WorldStore } from '../../src/world/WorldStore';
import { getOrGenerateLevel } from '../../src/game/LevelManager';
import type { Monster } from '../../src/game/Combat';
import 'fake-indexeddb/auto';

describe('Level Persistence Integration Tests', () => {
  let worldState: WorldState;

  beforeEach(async () => {
    // Reset IndexedDB
    indexedDB = new IDBFactory();

    // Create fresh WorldState
    const store = new WorldStore();
    worldState = new WorldState(store);
    await worldState.initializeWorld();
  });

  describe('Level Generation and Loading', () => {
    it('should generate a new level and save it to IndexedDB', async () => {
      // Generate level 1 for the first time
      const level1 = await getOrGenerateLevel(1, worldState);

      expect(level1).toBeDefined();
      expect(level1.depth).toBe(1);
      expect(level1.isNewlyGenerated).toBe(true);
      expect(level1.grid).toBeDefined();
      expect(level1.stairUpPos).toBeDefined();
      expect(level1.stairDownPos).toBeDefined();

      // Verify it's saved in WorldState
      const savedLevel = worldState.getLevel(1);
      expect(savedLevel).toBeDefined();
      expect(savedLevel!.depth).toBe(1);
    });

    it('should load an existing level instead of regenerating it', async () => {
      // Generate level 1
      const level1First = await getOrGenerateLevel(1, worldState);
      const originalStairUpX = level1First.stairUpPos!.x;
      const originalStairUpY = level1First.stairUpPos!.y;

      // Load level 1 again
      const level1Second = await getOrGenerateLevel(1, worldState);

      expect(level1Second.isNewlyGenerated).toBe(false);
      expect(level1Second.stairUpPos!.x).toBe(originalStairUpX);
      expect(level1Second.stairUpPos!.y).toBe(originalStairUpY);
    });
  });

  describe('Monster Persistence', () => {
    it('should preserve monster positions when returning to a level', async () => {
      // Generate level 1
      const level1 = await getOrGenerateLevel(1, worldState);

      // Manually add a monster to level 1 (simulating gameplay)
      const testMonster: Monster & { _persistId: string } = {
        pos: { x: 10, y: 10 },
        char: 'g',
        color: '#00FF00',
        name: 'Test Goblin',
        health: 5,
        maxHealth: 5,
        attack: 3,
        defense: 1,
        type: 'goblin',
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        _persistId: 'test_goblin_1',
      };

      // Save level with monster
      const levelRecord = {
        depth: 1,
        dungeon: level1.grid,
        monsters: [{
          id: testMonster._persistId,
          pos: testMonster.pos,
          char: testMonster.char,
          color: testMonster.color,
          name: testMonster.name,
          health: testMonster.health,
          maxHealth: testMonster.maxHealth,
          attack: testMonster.attack,
          defense: testMonster.defense,
          type: testMonster.type!,
          isEvolved: testMonster.isEvolved,
          evolutionLevel: testMonster.evolutionLevel,
          killHistory: testMonster.killHistory,
        }],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(levelRecord);

      // Load level 1 again
      const level1Reloaded = await getOrGenerateLevel(1, worldState);

      expect(level1Reloaded.monsters.length).toBe(1);
      expect(level1Reloaded.monsters[0].id).toBe('test_goblin_1');
      expect(level1Reloaded.monsters[0].pos.x).toBe(10);
      expect(level1Reloaded.monsters[0].pos.y).toBe(10);
      expect(level1Reloaded.monsters[0].name).toBe('Test Goblin');
    });

    it('should not respawn monsters on cleared levels', async () => {
      // Generate level 1
      const level1 = await getOrGenerateLevel(1, worldState);

      // Save level with NO monsters (simulating all monsters killed)
      const clearedLevelRecord = {
        depth: 1,
        dungeon: level1.grid,
        monsters: [],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(clearedLevelRecord);

      // Load level 1 again
      const level1Reloaded = await getOrGenerateLevel(1, worldState);

      // Should have 0 monsters, NOT respawn them
      expect(level1Reloaded.monsters.length).toBe(0);
      expect(level1Reloaded.isNewlyGenerated).toBe(false);
    });
  });

  describe('Multi-Level Traversal', () => {
    it('should persist multiple levels correctly during complex navigation', async () => {
      // Level 1 → 2 → 1 → 2 → 3 → 2 → 1

      // Generate Level 1
      const level1First = await getOrGenerateLevel(1, worldState);
      const level1StairUpX = level1First.stairUpPos!.x;
      const level1StairUpY = level1First.stairUpPos!.y;

      // Add a monster to level 1
      const level1Record = {
        depth: 1,
        dungeon: level1First.grid,
        monsters: [{
          id: 'monster_level1',
          pos: { x: 5, y: 5 },
          char: 'g',
          color: '#00FF00',
          name: 'Level 1 Goblin',
          health: 5,
          maxHealth: 5,
          attack: 3,
          defense: 1,
          type: 'goblin',
        }],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(level1Record);

      // Generate Level 2
      const level2First = await getOrGenerateLevel(2, worldState);
      const level2StairDownX = level2First.stairDownPos!.x;

      // Add a monster to level 2
      const level2Record = {
        depth: 2,
        dungeon: level2First.grid,
        monsters: [{
          id: 'monster_level2',
          pos: { x: 15, y: 15 },
          char: 'o',
          color: '#FFFF00',
          name: 'Level 2 Orc',
          health: 10,
          maxHealth: 10,
          attack: 5,
          defense: 2,
          type: 'orc',
        }],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(level2Record);

      // Go back to Level 1
      const level1Second = await getOrGenerateLevel(1, worldState);
      expect(level1Second.isNewlyGenerated).toBe(false);
      expect(level1Second.stairUpPos!.x).toBe(level1StairUpX);
      expect(level1Second.stairUpPos!.y).toBe(level1StairUpY);
      expect(level1Second.monsters.length).toBe(1);
      expect(level1Second.monsters[0].id).toBe('monster_level1');

      // Go back to Level 2
      const level2Second = await getOrGenerateLevel(2, worldState);
      expect(level2Second.isNewlyGenerated).toBe(false);
      expect(level2Second.stairDownPos!.x).toBe(level2StairDownX);
      expect(level2Second.monsters.length).toBe(1);
      expect(level2Second.monsters[0].id).toBe('monster_level2');

      // Generate Level 3
      const level3First = await getOrGenerateLevel(3, worldState);
      expect(level3First.isNewlyGenerated).toBe(true);
      const level3StairUpX = level3First.stairUpPos!.x;

      // Go back to Level 2
      const level2Third = await getOrGenerateLevel(2, worldState);
      expect(level2Third.isNewlyGenerated).toBe(false);
      expect(level2Third.monsters.length).toBe(1);

      // Go back to Level 1
      const level1Third = await getOrGenerateLevel(1, worldState);
      expect(level1Third.isNewlyGenerated).toBe(false);
      expect(level1Third.monsters.length).toBe(1);

      // Verify Level 3 is still saved
      const level3Second = await getOrGenerateLevel(3, worldState);
      expect(level3Second.isNewlyGenerated).toBe(false);
      expect(level3Second.stairUpPos!.x).toBe(level3StairUpX);
    });
  });

  describe('Items Persistence', () => {
    it('should preserve item positions when returning to a level', async () => {
      // Generate level 1
      const level1 = await getOrGenerateLevel(1, worldState);

      // Save level with teeth item
      const levelWithTeeth = {
        depth: 1,
        dungeon: level1.grid,
        monsters: [],
        items: [{
          id: 'teeth_test_1',
          pos: { x: 20, y: 20 },
          char: '$',
          color: '#FFFF00',
          name: 'teeth',
          type: 'teeth' as const,
          value: 10,
        }],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(levelWithTeeth);

      // Load level 1 again
      const level1Reloaded = await getOrGenerateLevel(1, worldState);

      expect(level1Reloaded.items.length).toBe(1);
      expect(level1Reloaded.items[0].pos.x).toBe(20);
      expect(level1Reloaded.items[0].pos.y).toBe(20);
      expect(level1Reloaded.items[0].value).toBe(10);
    });
  });

  describe('Promoted Monster Persistence (Story 2.2 Integration)', () => {
    it('should persist promoted monsters to target level after death event', async () => {
      // Generate level 1
      await getOrGenerateLevel(1, worldState);

      // Simulate a promoted monster being added to level 2 (from death on level 1)
      // This simulates what DeathProcessor.processHeroDeath() does
      const level2 = await getOrGenerateLevel(2, worldState);

      const promotedMonster = {
        id: 'promoted_goblin_killer',
        pos: { x: 30, y: 30 },
        char: 'g',
        color: '#FF6600', // Evolved color
        name: 'Evolved Goblin',
        health: 8, // Enhanced from 5
        maxHealth: 8,
        attack: 4, // Enhanced from 3
        defense: 2, // Enhanced from 1
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [{ heroName: 'TestHero', killedAt: new Date().toISOString() }],
      };

      // Save level 2 with promoted monster
      const level2Record = {
        depth: 2,
        dungeon: level2.grid,
        monsters: [promotedMonster],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(level2Record);

      // Traverse away and back
      await getOrGenerateLevel(3, worldState);
      const level2Reloaded = await getOrGenerateLevel(2, worldState);

      // Promoted monster should still be there
      expect(level2Reloaded.monsters.length).toBe(1);
      expect(level2Reloaded.monsters[0].id).toBe('promoted_goblin_killer');
      expect(level2Reloaded.monsters[0].isEvolved).toBe(true);
      expect(level2Reloaded.monsters[0].evolutionLevel).toBe(1);
      expect(level2Reloaded.monsters[0].maxHealth).toBe(8);
      expect(level2Reloaded.monsters[0].attack).toBe(4);
      expect(level2Reloaded.monsters[0].defense).toBe(2);
    });

    it('should not create duplicate promoted monsters during level transitions', async () => {
      // Generate level 2 with a promoted monster
      const level2 = await getOrGenerateLevel(2, worldState);

      const promotedMonster = {
        id: 'unique_promoted',
        pos: { x: 10, y: 10 },
        char: 'o',
        color: '#FF6600',
        name: 'Evolved Orc',
        health: 15,
        maxHealth: 15,
        attack: 6,
        defense: 3,
        type: 'orc',
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [],
      };

      const level2Record = {
        depth: 2,
        dungeon: level2.grid,
        monsters: [promotedMonster],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(level2Record);

      // Navigate multiple times: 1 → 2 → 3 → 2 → 1 → 2
      await getOrGenerateLevel(1, worldState);
      const level2First = await getOrGenerateLevel(2, worldState);
      await getOrGenerateLevel(3, worldState);
      const level2Second = await getOrGenerateLevel(2, worldState);
      await getOrGenerateLevel(1, worldState);
      const level2Third = await getOrGenerateLevel(2, worldState);

      // Should always have exactly 1 monster (no duplicates)
      expect(level2First.monsters.length).toBe(1);
      expect(level2Second.monsters.length).toBe(1);
      expect(level2Third.monsters.length).toBe(1);
      expect(level2Third.monsters[0].id).toBe('unique_promoted');
    });

    it('should handle multiple promoted monsters on the same level', async () => {
      // Simulate multiple death events promoting monsters to level 3
      const level3 = await getOrGenerateLevel(3, worldState);

      const promotedMonster1 = {
        id: 'promoted_1',
        pos: { x: 10, y: 10 },
        char: 'g',
        color: '#FF6600',
        name: 'Evolved Goblin 1',
        health: 8,
        maxHealth: 8,
        attack: 4,
        defense: 2,
        type: 'goblin',
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [],
      };

      const promotedMonster2 = {
        id: 'promoted_2',
        pos: { x: 20, y: 20 },
        char: 'o',
        color: '#FF6600',
        name: 'Evolved Orc',
        health: 15,
        maxHealth: 15,
        attack: 6,
        defense: 3,
        type: 'orc',
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [],
      };

      const level3Record = {
        depth: 3,
        dungeon: level3.grid,
        monsters: [promotedMonster1, promotedMonster2],
        items: [],
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(level3Record);

      // Load level 3 again
      const level3Reloaded = await getOrGenerateLevel(3, worldState);

      expect(level3Reloaded.monsters.length).toBe(2);
      expect(level3Reloaded.monsters.find(m => m.id === 'promoted_1')).toBeDefined();
      expect(level3Reloaded.monsters.find(m => m.id === 'promoted_2')).toBeDefined();
    });
  });
});
