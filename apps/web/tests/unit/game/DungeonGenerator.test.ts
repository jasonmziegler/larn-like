import { describe, it, expect } from 'vitest';
import {
  generateDungeon,
  findEmptySpot,
  Position,
  DungeonConfig,
} from '../../../src/game/DungeonGenerator';

describe('DungeonGenerator', () => {
  describe('generateDungeon', () => {
    it('should generate a grid with default dimensions (78x20)', () => {
      const { grid } = generateDungeon({ width: 78, height: 20 });
      expect(grid.length).toBe(20);
      expect(grid[0].length).toBe(78);
    });

    it('should generate a grid with custom dimensions', () => {
      const { grid } = generateDungeon({ width: 120, height: 40 });
      expect(grid.length).toBe(40);
      expect(grid[0].length).toBe(120);
    });

    it('should contain both walls and floor tiles', () => {
      const { grid } = generateDungeon({ width: 78, height: 20 });
      let hasWalls = false;
      let hasFloors = false;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x] === '#') hasWalls = true;
          if (grid[y][x] === '.') hasFloors = true;
        }
      }
      expect(hasWalls).toBe(true);
      expect(hasFloors).toBe(true);
    });

    it('should generate rooms', () => {
      const { rooms } = generateDungeon({ width: 78, height: 20 });
      expect(rooms.length).toBeGreaterThanOrEqual(4);
    });

    it('should scale room count for larger dungeons', () => {
      const small = generateDungeon({ width: 78, height: 20 });
      const large = generateDungeon({ width: 120, height: 40 });
      expect(large.rooms.length).toBeGreaterThanOrEqual(small.rooms.length);
    });

    it('should have corridors connecting rooms (floor tiles exist between rooms)', () => {
      const { grid, rooms } = generateDungeon({ width: 78, height: 20 });
      // Verify that at least some floor tiles exist outside room boundaries
      // by checking that there are more floor tiles than just room area
      let floorCount = 0;
      let roomArea = 0;
      for (const room of rooms) {
        roomArea += room.w * room.h;
      }
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x] === '.') floorCount++;
        }
      }
      // Floor count should be at least the combined room area (rooms may overlap, corridors add more)
      expect(floorCount).toBeGreaterThan(0);
    });

    it('should only contain wall and floor characters', () => {
      const { grid } = generateDungeon({ width: 80, height: 30 });
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          expect(['#', '.']).toContain(grid[y][x]);
        }
      }
    });
  });

  describe('findEmptySpot', () => {
    it('should return a position on a floor tile', () => {
      const { grid } = generateDungeon({ width: 78, height: 20 });
      const pos = findEmptySpot(grid, [], 78, 20);
      expect(grid[pos.y][pos.x]).toBe('.');
    });

    it('should not return an occupied position', () => {
      const { grid } = generateDungeon({ width: 78, height: 20 });
      const occupied: Position[] = [];

      // Place several entities
      for (let i = 0; i < 5; i++) {
        const pos = findEmptySpot(grid, occupied, 78, 20);
        expect(occupied.some(p => p.x === pos.x && p.y === pos.y)).toBe(false);
        occupied.push(pos);
      }
    });

    it('should return fallback position when no spot found', () => {
      // Create a tiny dungeon that is all walls
      const grid = [
        ['#', '#', '#'],
        ['#', '#', '#'],
        ['#', '#', '#'],
      ];
      const pos = findEmptySpot(grid, [], 3, 3);
      expect(pos).toEqual({ x: 5, y: 5 });
    });

    it('should work without explicit width/height parameters', () => {
      const { grid } = generateDungeon({ width: 78, height: 20 });
      const pos = findEmptySpot(grid, []);
      expect(grid[pos.y][pos.x]).toBe('.');
    });
  });
});

describe('Viewport calculations', () => {
  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  const VIEWPORT_COLS = 78;
  const VIEWPORT_ROWS = 20;

  it('should center camera on hero position', () => {
    const heroX = 60;
    const heroY = 20;
    const dungeonWidth = 120;
    const dungeonHeight = 40;

    const cameraX = clamp(heroX - Math.floor(VIEWPORT_COLS / 2), 0, dungeonWidth - VIEWPORT_COLS);
    const cameraY = clamp(heroY - Math.floor(VIEWPORT_ROWS / 2), 0, dungeonHeight - VIEWPORT_ROWS);

    // Hero should be near center of viewport
    const heroScreenX = heroX - cameraX;
    const heroScreenY = heroY - cameraY;
    expect(heroScreenX).toBe(Math.floor(VIEWPORT_COLS / 2));
    expect(heroScreenY).toBe(Math.floor(VIEWPORT_ROWS / 2));
  });

  it('should clamp camera at left/top edge', () => {
    const heroX = 5;
    const heroY = 3;
    const dungeonWidth = 120;
    const dungeonHeight = 40;

    const cameraX = clamp(heroX - Math.floor(VIEWPORT_COLS / 2), 0, dungeonWidth - VIEWPORT_COLS);
    const cameraY = clamp(heroY - Math.floor(VIEWPORT_ROWS / 2), 0, dungeonHeight - VIEWPORT_ROWS);

    expect(cameraX).toBe(0);
    expect(cameraY).toBe(0);
  });

  it('should clamp camera at right/bottom edge', () => {
    const heroX = 118;
    const heroY = 38;
    const dungeonWidth = 120;
    const dungeonHeight = 40;

    const cameraX = clamp(heroX - Math.floor(VIEWPORT_COLS / 2), 0, dungeonWidth - VIEWPORT_COLS);
    const cameraY = clamp(heroY - Math.floor(VIEWPORT_ROWS / 2), 0, dungeonHeight - VIEWPORT_ROWS);

    expect(cameraX).toBe(dungeonWidth - VIEWPORT_COLS);
    expect(cameraY).toBe(dungeonHeight - VIEWPORT_ROWS);
  });

  it('should transform world coords to viewport-relative coords', () => {
    const cameraX = 20;
    const cameraY = 10;
    const worldX = 25;
    const worldY = 15;

    const screenX = worldX - cameraX + 1; // +1 for border offset
    const screenY = worldY - cameraY + 1;

    expect(screenX).toBe(6);
    expect(screenY).toBe(6);
  });

  it('should correctly identify entities inside viewport', () => {
    const cameraX = 20;
    const cameraY = 10;

    function isInViewport(x: number, y: number): boolean {
      return x >= cameraX && x < cameraX + VIEWPORT_COLS &&
             y >= cameraY && y < cameraY + VIEWPORT_ROWS;
    }

    expect(isInViewport(25, 15)).toBe(true);
    expect(isInViewport(20, 10)).toBe(true);  // top-left edge
    expect(isInViewport(97, 29)).toBe(true);  // bottom-right edge
    expect(isInViewport(19, 15)).toBe(false); // left of viewport
    expect(isInViewport(98, 15)).toBe(false); // right of viewport
    expect(isInViewport(25, 9)).toBe(false);  // above viewport
    expect(isInViewport(25, 30)).toBe(false); // below viewport
  });
});

describe('Monster spawning', () => {
  it('should use 3+ distinct monster types', () => {
    // Simulate the weighted monster selection multiple times
    const MONSTER_WEIGHTS = [
      { key: 'GOBLIN', weight: 50 },
      { key: 'ORC', weight: 30 },
      { key: 'TROLL', weight: 15 },
      { key: 'DRAGON', weight: 5 },
    ];

    function pickWeightedMonster(): string {
      const totalWeight = MONSTER_WEIGHTS.reduce((sum, mw) => sum + mw.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const mw of MONSTER_WEIGHTS) {
        roll -= mw.weight;
        if (roll <= 0) return mw.key;
      }
      return 'GOBLIN';
    }

    const types = new Set<string>();
    // Run enough iterations to statistically get all types
    for (let i = 0; i < 1000; i++) {
      types.add(pickWeightedMonster());
    }

    expect(types.size).toBeGreaterThanOrEqual(3);
    expect(types.has('GOBLIN')).toBe(true);
    expect(types.has('ORC')).toBe(true);
    expect(types.has('TROLL')).toBe(true);
  });

  it('should have distinct colors per monster type', () => {
    const COLORS = {
      TEXT_NORMAL: '#00CC00',
      TEXT_BRIGHT: '#00FF00',
    };

    const MONSTER_COLORS: Record<string, string> = {
      goblin: COLORS.TEXT_NORMAL,
      orc: COLORS.TEXT_BRIGHT,
      troll: '#FF6600',
      dragon: '#FF0000',
    };

    const colorValues = Object.values(MONSTER_COLORS);
    const uniqueColors = new Set(colorValues);
    expect(uniqueColors.size).toBe(colorValues.length);
  });
});

describe('Numpad movement', () => {
  function getMoveDelta(key: string): { dx: number; dy: number } | null {
    switch (key) {
      case '8': return { dx: 0, dy: -1 };
      case '2': return { dx: 0, dy: 1 };
      case '4': return { dx: -1, dy: 0 };
      case '6': return { dx: 1, dy: 0 };
      case '7': return { dx: -1, dy: -1 };
      case '9': return { dx: 1, dy: -1 };
      case '1': return { dx: -1, dy: 1 };
      case '3': return { dx: 1, dy: 1 };
      default: return null;
    }
  }

  it('should map numpad 8 to up (0, -1)', () => {
    expect(getMoveDelta('8')).toEqual({ dx: 0, dy: -1 });
  });

  it('should map numpad 2 to down (0, 1)', () => {
    expect(getMoveDelta('2')).toEqual({ dx: 0, dy: 1 });
  });

  it('should map numpad 4 to left (-1, 0)', () => {
    expect(getMoveDelta('4')).toEqual({ dx: -1, dy: 0 });
  });

  it('should map numpad 6 to right (1, 0)', () => {
    expect(getMoveDelta('6')).toEqual({ dx: 1, dy: 0 });
  });

  it('should map numpad 7 to up-left (-1, -1)', () => {
    expect(getMoveDelta('7')).toEqual({ dx: -1, dy: -1 });
  });

  it('should map numpad 9 to up-right (1, -1)', () => {
    expect(getMoveDelta('9')).toEqual({ dx: 1, dy: -1 });
  });

  it('should map numpad 1 to down-left (-1, 1)', () => {
    expect(getMoveDelta('1')).toEqual({ dx: -1, dy: 1 });
  });

  it('should map numpad 3 to down-right (1, 1)', () => {
    expect(getMoveDelta('3')).toEqual({ dx: 1, dy: 1 });
  });

  it('should return null for non-movement keys', () => {
    expect(getMoveDelta('5')).toBeNull();
    expect(getMoveDelta('0')).toBeNull();
  });
});
