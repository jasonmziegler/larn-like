// =============================================================================
// LEVEL MANAGER MODULE
// Manages multi-level dungeon navigation, generation, and persistence
// =============================================================================

import type { DungeonGrid, Position } from './DungeonGenerator';
import { generateDungeon } from './DungeonGenerator';
import { generateTown } from './TownGenerator';
import type { WorldState, DungeonLevelRecord, MonsterRecord } from '../world/WorldState';

export interface GameLevel {
  depth: number;
  grid: DungeonGrid;
  width: number;
  height: number;
  monsters: MonsterRecord[];
  items: { pos: Position; char: string; color: string; name: string; type: 'teeth'; value: number; _persistId?: string }[];
  stairUpPos?: Position;
  stairDownPos?: Position;
}

const DUNGEON_WIDTH = 120;
const DUNGEON_HEIGHT = 40;
const TOWN_WIDTH = 40;
const TOWN_HEIGHT = 20;

/**
 * Get or generate a level at the specified depth.
 * - Depth 0: Town (static layout, no monsters)
 * - Depth >= 1: Dungeon levels (procedurally generated with monsters)
 *
 * If level exists in WorldState, loads it. Otherwise, generates and persists it.
 */
export async function getOrGenerateLevel(depth: number, worldState: WorldState): Promise<GameLevel> {
  // Try to load existing level
  const existing = worldState.getLevel(depth);
  if (existing) {
    return levelRecordToGameLevel(existing, depth);
  }

  // Generate new level
  let gameLevel: GameLevel;

  if (depth === 0) {
    // Generate town
    gameLevel = generateTownLevel();
  } else {
    // Generate dungeon level
    gameLevel = generateDungeonLevel(depth);
  }

  // Persist the newly generated level
  const record = gameLevelToRecord(gameLevel);
  await worldState.saveLevel(record);

  return gameLevel;
}

/**
 * Generate town level (depth 0).
 * Town is a safe zone with a dungeon entrance but no monsters.
 */
function generateTownLevel(): GameLevel {
  const { grid, entrancePos } = generateTown({ width: TOWN_WIDTH, height: TOWN_HEIGHT });

  return {
    depth: 0,
    grid,
    width: TOWN_WIDTH,
    height: TOWN_HEIGHT,
    monsters: [], // No monsters in town
    items: [],
    stairDownPos: entrancePos, // Dungeon entrance is the "stair down"
  };
}

/**
 * Generate dungeon level (depth >= 1).
 * Includes staircase up (to previous level) and staircase down (to next level).
 */
function generateDungeonLevel(depth: number): GameLevel {
  const { grid, rooms } = generateDungeon({ width: DUNGEON_WIDTH, height: DUNGEON_HEIGHT });

  // Place staircase up in first room
  const firstRoom = rooms[0];
  const stairUpPos: Position = {
    x: Math.floor(firstRoom.x + firstRoom.w / 2),
    y: Math.floor(firstRoom.y + firstRoom.h / 2),
  };
  grid[stairUpPos.y][stairUpPos.x] = '<';

  // Place staircase down in last room
  const lastRoom = rooms[rooms.length - 1];
  const stairDownPos: Position = {
    x: Math.floor(lastRoom.x + lastRoom.w / 2),
    y: Math.floor(lastRoom.y + lastRoom.h / 2),
  };
  grid[stairDownPos.y][stairDownPos.x] = '>';

  return {
    depth,
    grid,
    width: DUNGEON_WIDTH,
    height: DUNGEON_HEIGHT,
    monsters: [],
    items: [],
    stairUpPos,
    stairDownPos,
  };
}

/**
 * Convert a persisted DungeonLevelRecord back to GameLevel format.
 */
function levelRecordToGameLevel(record: DungeonLevelRecord, depth: number): GameLevel {
  const grid = record.dungeon;
  const width = grid[0]?.length || 0;
  const height = grid.length;

  // Find staircases in the grid
  let stairUpPos: Position | undefined;
  let stairDownPos: Position | undefined;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === '<') {
        stairUpPos = { x, y };
      } else if (grid[y][x] === '>') {
        stairDownPos = { x, y };
      }
    }
  }

  const items = record.items.map(item => ({
    pos: item.pos,
    char: item.char,
    color: item.color,
    name: item.name,
    type: 'teeth' as const,
    value: item.value,
    _persistId: item.id,
  }));

  return {
    depth,
    grid,
    width,
    height,
    monsters: record.monsters,
    items,
    stairUpPos,
    stairDownPos,
  };
}

/**
 * Convert GameLevel to DungeonLevelRecord for persistence.
 */
function gameLevelToRecord(level: GameLevel): DungeonLevelRecord {
  return {
    depth: level.depth,
    dungeon: level.grid,
    monsters: level.monsters,
    items: level.items.map(item => ({
      id: item._persistId || `teeth_${Date.now()}_${Math.random()}`,
      pos: item.pos,
      char: item.char,
      color: item.color,
      name: item.name,
      type: 'teeth',
      value: item.value,
    })),
    generatedAt: new Date().toISOString(),
  };
}
