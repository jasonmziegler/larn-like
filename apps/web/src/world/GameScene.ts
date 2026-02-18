/**
 * GameScene enum defines the different scenes/states the game can be in.
 * Used to manage transitions between town, dungeon, and other game areas.
 */
export enum GameScene {
  Town = 'TOWN',
  Dungeon = 'DUNGEON',
}

/**
 * Type guard to check if a value is a valid GameScene
 */
export function isGameScene(value: string): value is GameScene {
  return Object.values(GameScene).includes(value as GameScene);
}
