// World and level-related type definitions
export interface WorldState {
  id: string;
  currentTime: number;
  deathSites: DeathSite[];
  persistentMonsters: string[]; // Monster IDs
}

export interface DeathSite {
  id: string;
  heroName: string;
  position: DeathPosition;
  timestamp: number;
  teethDropped: number;
  equipment: string[]; // Item IDs
}

export interface DeathPosition {
  x: number;
  y: number;
  depth: number;
}

export interface Level {
  depth: number;
  tiles: Tile[][];
  monsters: string[]; // Monster IDs
  items: string[]; // Item IDs
  deathSites: string[]; // DeathSite IDs
}

export interface Tile {
  type: TileType;
  explored: boolean;
  visible: boolean;
}

export enum TileType {
  WALL = 'WALL',
  FLOOR = 'FLOOR',
  DOOR = 'DOOR',
  STAIRS_UP = 'STAIRS_UP',
  STAIRS_DOWN = 'STAIRS_DOWN',
  WATER = 'WATER',
  LAVA = 'LAVA'
}
