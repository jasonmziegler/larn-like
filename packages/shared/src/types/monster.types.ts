// Monster-related type definitions
export interface Monster {
  id: string;
  type: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  position: MonsterPosition;
  evolutionPoints: number;
}

export interface MonsterPosition {
  x: number;
  y: number;
  depth: number;
}

export interface MonsterDefinition {
  type: string;
  name: string;
  baseHealth: number;
  baseAttack: number;
  baseDefense: number;
  experienceValue: number;
  asciiChar: string;
}
