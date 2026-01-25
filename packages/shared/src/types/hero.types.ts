// Hero-related type definitions
export interface Hero {
  id: string;
  name: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  gold: number;
  position: Position;
  inventory: string[]; // Item IDs
  equipment: Equipment;
}

export interface Position {
  x: number;
  y: number;
  depth: number; // Dungeon level
}

export interface Equipment {
  weapon?: string;
  armor?: string;
  shield?: string;
  ring?: string;
  amulet?: string;
}

export interface HeroStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number;
}
