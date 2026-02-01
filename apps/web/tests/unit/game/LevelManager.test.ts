import { describe, it, expect, beforeEach } from 'vitest';
import { getOrGenerateLevel } from '../../../src/game/LevelManager';
import { WorldState } from '../../../src/world/WorldState';
import { WorldStore } from '../../../src/world/WorldStore';
import 'fake-indexeddb/auto';

describe('LevelManager', () => {
  let worldState: WorldState;

  beforeEach(async () => {
    // Reset IndexedDB before each test
    indexedDB = new IDBFactory();
    worldState = new WorldState();
    await worldState.initializeWorld();
  });

  describe('getOrGenerateLevel', () => {
    it('should generate town at depth 0', async () => {
      const level = await getOrGenerateLevel(0, worldState);

      expect(level.depth).toBe(0);
      expect(level.width).toBe(40);
      expect(level.height).toBe(20);
      expect(level.monsters.length).toBe(0); // Town has no monsters
      expect(level.stairDownPos).toBeDefined(); // Dungeon entrance
      expect(level.stairUpPos).toBeUndefined(); // Town has no staircase up
    });

    it('should generate dungeon level at depth 1', async () => {
      const level = await getOrGenerateLevel(1, worldState);

      expect(level.depth).toBe(1);
      expect(level.width).toBe(120);
      expect(level.height).toBe(40);
      expect(level.stairUpPos).toBeDefined(); // Staircase to town
      expect(level.stairDownPos).toBeDefined(); // Staircase to level 2
    });

    it('should place staircases correctly in dungeon level', async () => {
      const level = await getOrGenerateLevel(1, worldState);

      // Verify staircase tiles exist in grid
      if (level.stairUpPos) {
        expect(level.grid[level.stairUpPos.y][level.stairUpPos.x]).toBe('<');
      }
      if (level.stairDownPos) {
        expect(level.grid[level.stairDownPos.y][level.stairDownPos.x]).toBe('>');
      }
    });

    it('should persist newly generated level', async () => {
      await getOrGenerateLevel(1, worldState);

      const persistedLevel = worldState.getLevel(1);
      expect(persistedLevel).toBeDefined();
      expect(persistedLevel?.depth).toBe(1);
    });

    it('should load persisted level on revisit', async () => {
      const level1 = await getOrGenerateLevel(2, worldState);

      // Visit again - should get the same grid
      const level2 = await getOrGenerateLevel(2, worldState);

      expect(level1.grid).toEqual(level2.grid);
      expect(level1.depth).toBe(level2.depth);
    });

    it('should generate different layouts for different depths', async () => {
      const level1 = await getOrGenerateLevel(1, worldState);
      const level2 = await getOrGenerateLevel(2, worldState);

      // Different levels should have different grids (probabilistically true)
      expect(level1.grid).not.toEqual(level2.grid);
    });

    it('should restore items when loading persisted level', async () => {
      const level1 = await getOrGenerateLevel(1, worldState);

      // Manually add an item and save
      const testItem = {
        pos: { x: 10, y: 10 },
        char: '%',
        color: '#00FF00',
        name: 'Test Teeth',
        type: 'teeth' as const,
        value: 5,
        _persistId: 'test-item-1',
      };
      level1.items.push(testItem);

      const record = {
        depth: 1,
        dungeon: level1.grid,
        monsters: level1.monsters,
        items: level1.items.map(i => ({
          id: i._persistId || 'test',
          pos: i.pos,
          char: i.char,
          color: i.color,
          name: i.name,
          type: 'teeth' as const,
          value: i.value,
        })),
        generatedAt: new Date().toISOString(),
      };
      await worldState.saveLevel(record);

      // Reload level
      const reloaded = await getOrGenerateLevel(1, worldState);

      expect(reloaded.items.length).toBeGreaterThan(0);
      expect(reloaded.items[0].name).toBe('Test Teeth');
    });
  });

  describe('level generation consistency', () => {
    it('should generate town with same layout each time', async () => {
      const town1 = await getOrGenerateLevel(0, worldState);

      // Create new world state
      const worldState2 = new WorldState();
      await worldState2.initializeWorld();
      const town2 = await getOrGenerateLevel(0, worldState2);

      expect(town1.grid).toEqual(town2.grid);
      expect(town1.stairDownPos).toEqual(town2.stairDownPos);
    });
  });
});
