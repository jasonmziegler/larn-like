// Game constants and configuration values
export const GAME_CONSTANTS = {
  // Canvas rendering
  TILE_SIZE: 16,
  VIEWPORT_WIDTH: 80,
  VIEWPORT_HEIGHT: 24,
  TARGET_FPS: 60,

  // Game mechanics
  MAX_DUNGEON_DEPTH: 15,
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
    UI_BORDER: '#00AA00',
    HEALTH_CRITICAL: '#FF0000',
    GOLD_COLOR: '#FFFF00'
  }
} as const;
