// =============================================================================
// DUNGEON GENERATION MODULE
// Extracted from main.ts - provides dungeon grid generation and utilities
// =============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type DungeonGrid = string[][];

export interface DungeonConfig {
  width: number;
  height: number;
}

const DEFAULT_CONFIG: DungeonConfig = {
  width: 78,
  height: 20,
};

export function generateDungeon(config: DungeonConfig = DEFAULT_CONFIG): { grid: DungeonGrid; rooms: Room[] } {
  const { width, height } = config;
  const dungeon: DungeonGrid = [];

  // Fill with walls
  for (let y = 0; y < height; y++) {
    dungeon[y] = [];
    for (let x = 0; x < width; x++) {
      dungeon[y][x] = '#';
    }
  }

  // Carve out rooms
  const rooms: Room[] = [];

  // Scale room count to dungeon size
  const area = width * height;
  const baseArea = 78 * 20;
  const scaleFactor = area / baseArea;
  const minRooms = Math.max(4, Math.floor(4 * scaleFactor));
  const maxRooms = Math.max(6, Math.floor(6 * scaleFactor));
  const numRooms = minRooms + Math.floor(Math.random() * (maxRooms - minRooms + 1));

  for (let i = 0; i < numRooms; i++) {
    const roomW = 6 + Math.floor(Math.random() * 8);
    const roomH = 4 + Math.floor(Math.random() * 5);
    const roomX = 1 + Math.floor(Math.random() * (width - roomW - 2));
    const roomY = 1 + Math.floor(Math.random() * (height - roomH - 2));

    // Carve room
    for (let y = roomY; y < roomY + roomH; y++) {
      for (let x = roomX; x < roomX + roomW; x++) {
        dungeon[y][x] = '.';
      }
    }

    // Connect to previous room with corridor
    if (rooms.length > 0) {
      const prevRoom = rooms[rooms.length - 1];
      const prevCenterX = Math.floor(prevRoom.x + prevRoom.w / 2);
      const prevCenterY = Math.floor(prevRoom.y + prevRoom.h / 2);
      const currCenterX = Math.floor(roomX + roomW / 2);
      const currCenterY = Math.floor(roomY + roomH / 2);

      // Horizontal then vertical corridor
      const startX = Math.min(prevCenterX, currCenterX);
      const endX = Math.max(prevCenterX, currCenterX);
      for (let x = startX; x <= endX; x++) {
        dungeon[prevCenterY][x] = '.';
      }

      const startY = Math.min(prevCenterY, currCenterY);
      const endY = Math.max(prevCenterY, currCenterY);
      for (let y = startY; y <= endY; y++) {
        dungeon[y][currCenterX] = '.';
      }
    }

    rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH });
  }

  return { grid: dungeon, rooms };
}

export function findEmptySpot(dungeon: DungeonGrid, occupied: Position[], width?: number, height?: number): Position {
  const dungeonHeight = height ?? dungeon.length;
  const dungeonWidth = width ?? (dungeon[0]?.length ?? 0);

  let attempts = 0;
  while (attempts < 1000) {
    const x = Math.floor(Math.random() * dungeonWidth);
    const y = Math.floor(Math.random() * dungeonHeight);

    if (dungeon[y][x] === '.' && !occupied.some(p => p.x === x && p.y === y)) {
      return { x, y };
    }
    attempts++;
  }
  return { x: 5, y: 5 }; // Fallback
}
