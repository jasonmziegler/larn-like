// Item definitions and constants
import { ItemType } from '../types/item.types';

export const ITEM_DEFINITIONS = {
  // Weapons
  DAGGER: {
    id: 'dagger',
    type: ItemType.WEAPON,
    name: 'Dagger',
    description: 'A simple iron dagger',
    damage: 5,
    attackBonus: 1,
    value: 10,
    weight: 1
  },
  SWORD: {
    id: 'sword',
    type: ItemType.WEAPON,
    name: 'Sword',
    description: 'A well-balanced longsword',
    damage: 10,
    attackBonus: 2,
    value: 50,
    weight: 3
  },
  // Armor
  SHIRT: {
    id: 'shirt',
    type: ItemType.ARMOR,
    name: 'Shirt',
    description: 'A simple cloth shirt',
    armorClass: 1,
    defenseBonus: 1,
    value: 5,
    weight: 1
  },
  LEATHER_ARMOR: {
    id: 'leather_armor',
    type: ItemType.ARMOR,
    name: 'Leather Armor',
    description: 'Basic leather protection',
    armorClass: 2,
    defenseBonus: 1,
    value: 20,
    weight: 5
  }
} as const;
