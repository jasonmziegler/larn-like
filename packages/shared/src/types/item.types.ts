// Item and equipment-related type definitions
export interface Item {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  value: number;
  weight: number;
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  SHIELD = 'SHIELD',
  RING = 'RING',
  AMULET = 'AMULET',
  POTION = 'POTION',
  SCROLL = 'SCROLL',
  FOOD = 'FOOD',
  GOLD = 'GOLD',
  TEETH = 'TEETH'
}

export interface Weapon extends Item {
  type: ItemType.WEAPON;
  damage: number;
  attackBonus: number;
}

export interface Armor extends Item {
  type: ItemType.ARMOR;
  armorClass: number;
  defenseBonus: number;
}

export interface Potion extends Item {
  type: ItemType.POTION;
  effect: PotionEffect;
}

export enum PotionEffect {
  HEALING = 'HEALING',
  STRENGTH = 'STRENGTH',
  DEXTERITY = 'DEXTERITY',
  INTELLIGENCE = 'INTELLIGENCE'
}
