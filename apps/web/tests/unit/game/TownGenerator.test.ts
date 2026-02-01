import { describe, it, expect } from 'vitest';
import { generateTown, getTownSpawnPosition } from '../../../src/game/TownGenerator';

describe('TownGenerator', () => {
  describe('generateTown', () => {
    it('should generate a town with correct dimensions', () => {
      const { grid } = generateTown({ width: 40, height: 20 });

      expect(grid.length).toBe(20); // height
      expect(grid[0].length).toBe(40); // width
    });

    it('should have walls on the perimeter', () => {
      const { grid } = generateTown({ width: 40, height: 20 });

      // Top and bottom walls
      for (let x = 0; x < 40; x++) {
        expect(grid[0][x]).toBe('#');
        expect(grid[19][x]).toBe('#');
      }

      // Left and right walls
      for (let y = 0; y < 20; y++) {
        expect(grid[y][0]).toBe('#');
        expect(grid[y][39]).toBe('#');
      }
    });

    it('should have floor tiles inside the perimeter', () => {
      const { grid } = generateTown({ width: 40, height: 20 });

      // Check some interior tiles (not including the entrance)
      expect(grid[1][1]).toBe('.');
      expect(grid[10][10]).toBe('.');
    });

    it('should include a dungeon entrance (>)', () => {
      const { grid, entrancePos } = generateTown({ width: 40, height: 20 });

      expect(grid[entrancePos.y][entrancePos.x]).toBe('>');
    });

    it('should place dungeon entrance in center-south area', () => {
      const { entrancePos } = generateTown({ width: 40, height: 20 });

      // Center-ish horizontally
      expect(entrancePos.x).toBeGreaterThan(15);
      expect(entrancePos.x).toBeLessThan(25);

      // South area (near bottom)
      expect(entrancePos.y).toBeGreaterThan(10);
    });

    it('should generate the same layout every time (static)', () => {
      const result1 = generateTown({ width: 40, height: 20 });
      const result2 = generateTown({ width: 40, height: 20 });

      expect(result1.entrancePos).toEqual(result2.entrancePos);
      expect(result1.grid).toEqual(result2.grid);
    });
  });

  describe('getTownSpawnPosition', () => {
    it('should return a position near the north', () => {
      const spawnPos = getTownSpawnPosition({ width: 40, height: 20 });

      expect(spawnPos.y).toBeLessThan(10); // Near north
    });

    it('should return a position near the horizontal center', () => {
      const spawnPos = getTownSpawnPosition({ width: 40, height: 20 });

      expect(spawnPos.x).toBeGreaterThan(15);
      expect(spawnPos.x).toBeLessThan(25);
    });

    it('should return the same position every time', () => {
      const pos1 = getTownSpawnPosition({ width: 40, height: 20 });
      const pos2 = getTownSpawnPosition({ width: 40, height: 20 });

      expect(pos1).toEqual(pos2);
    });
  });
});
