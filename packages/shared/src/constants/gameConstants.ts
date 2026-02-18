// Game constants and configuration values
export const GAME_CONSTANTS = {
  // Canvas rendering
  TILE_SIZE: 16,
  VIEWPORT_WIDTH: 80,
  VIEWPORT_HEIGHT: 30,
  TARGET_FPS: 60,

  // Game mechanics
  MAX_DUNGEON_DEPTH: 15,
  MAX_INVENTORY_SIZE: 20,
  STARTING_GOLD: 100,
  STARTING_HEALTH: 100,
  STARTING_LEVEL: 1,

  // Combat
  BASE_ATTACK_DAMAGE: 5,
  BASE_DEFENSE: 2,
  CRITICAL_HIT_MULTIPLIER: 2,

  // World state
  WORLD_TICK_INTERVAL: 1000, // milliseconds
  EVOLUTION_THRESHOLD: 10, // deaths needed for evolution

  // Colors (green terminal aesthetic)
  COLORS: {
    BACKGROUND: '#000000',
    TEXT_BRIGHT: '#00FF00',
    TEXT_NORMAL: '#00CC00',
    TEXT_DIM: '#008800',
    TEXT_POSITIVE: '#00FF00',  // Green for upgrades/positive changes
    TEXT_NEGATIVE: '#FF0000',  // Red for downgrades/negative changes
    UI_BORDER: '#00AA00',
    HEALTH_CRITICAL: '#FF0000',
    GOLD_COLOR: '#FFFF00'
  }
} as const;

// Layout row assignments for the 80x30 canvas
export const LAYOUT = {
  ROW_TOP_BORDER: 0,
  ROW_STATUS_BAR: 1,
  ROW_MONSTER_INFO: 2,
  ROW_MAP_START: 3,      // First row of dungeon map (top border of map box)
  ROW_MAP_END: 23,       // Last row of dungeon map (bottom border of map box)
  MAP_ROWS: 20,          // Interior map rows (rows 4-22 inside borders)
  MAP_COLS: 78,          // Interior map columns (inside borders)
  ROW_ACTION_LOG_START: 24,
  ROW_ACTION_LOG_END: 29,
  ACTION_LOG_LINES: 6,
  CANVAS_COLS: 80,
  CANVAS_ROWS: 30,
} as const;
