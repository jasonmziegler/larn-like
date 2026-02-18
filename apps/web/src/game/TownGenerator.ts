// =============================================================================
// TOWN GENERATION MODULE
// Generates a static town layout (depth 0) with dungeon entrance
// =============================================================================

import type { DungeonGrid, Position } from './DungeonGenerator';

export interface TownConfig {
  width: number;
  height: number;
}

const DEFAULT_TOWN_CONFIG: TownConfig = {
  width: 40,
  height: 20,
};

/**
 * Generate a static town layout with a dungeon entrance.
 * Town is always the same layout (not randomized).
 *
 * @returns Object containing the town grid and dungeon entrance position
 */
export function generateTown(config: TownConfig = DEFAULT_TOWN_CONFIG): {
  grid: DungeonGrid;
  entrancePos: Position;
} {
  const { width, height } = config;
  const grid: DungeonGrid = [];

  // Create walled perimeter with open floor area
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Wall on perimeter, floor inside
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        grid[y][x] = '#';
      } else {
        grid[y][x] = '.';
      }
    }
  }

  // Place dungeon entrance in center-south area
  const entranceX = Math.floor(width / 2);
  const entranceY = height - 5; // 5 tiles up from bottom
  grid[entranceY][entranceX] = '>';

  // Place merchant in center-north area
  const merchantX = Math.floor(width / 2);
  const merchantY = 5; // Near north
  grid[merchantY][merchantX] = 'M';

  return {
    grid,
    entrancePos: { x: entranceX, y: entranceY },
  };
}

/**
 * Get the player spawn position in town (near north).
 * Always returns the same position.
 */
export function getTownSpawnPosition(config: TownConfig = DEFAULT_TOWN_CONFIG): Position {
  return {
    x: Math.floor(config.width / 2),
    y: 3, // Near north, inside the walls
  };
}
