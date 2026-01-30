// Hero-related type definitions

export interface HeroStats {
  hp: number;
  maxHp: number;
  strength: number;
  dexterity: number;
  constitution: number;
}

export type EquipmentSlotType =
  | 'weapon'
  | 'offHand'
  | 'helmet'
  | 'bodyArmor'
  | 'gloves'
  | 'boots'
  | 'ring1'
  | 'ring2'
  | 'amulet'
  | 'belt';

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlotType;
  attackBonus: number;
  defenseBonus: number;
  description: string;
}

export interface EquipmentSlots {
  weapon: EquipmentItem | null;
  offHand: EquipmentItem | null;
  helmet: EquipmentItem | null;
  bodyArmor: EquipmentItem | null;
  gloves: EquipmentItem | null;
  boots: EquipmentItem | null;
  ring1: EquipmentItem | null;
  ring2: EquipmentItem | null;
  amulet: EquipmentItem | null;
  belt: EquipmentItem | null;
}

export interface Position {
  x: number;
  y: number;
  depth: number;
}

export interface Hero {
  id: string;
  playerId: string;
  name: string;
  level: number;
  baseStats: HeroStats;
  currentStats: HeroStats;
  equipment: EquipmentSlots;
  inventory: EquipmentItem[];
  position: Position;
  teethCurrency: number;
  createdAt: number;
  isAlive: boolean;
}
