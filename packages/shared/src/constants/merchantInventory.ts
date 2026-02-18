/**
 * Merchant inventory data with equipment items and teeth prices.
 * Organized into tiers based on power and cost.
 */

import { EquipmentItem } from '../types/hero.types';

/**
 * Merchant item extends EquipmentItem with a teeth price
 */
export interface MerchantItem extends EquipmentItem {
  price: number; // Cost in teeth currency
}

/**
 * Merchant inventory organized by tier
 * Tier 1: 30-70 teeth (slightly better than starting gear)
 * Tier 2: 80-150 teeth (moderate upgrades)
 * Tier 3: 200-300 teeth (strong upgrades)
 */
export const MERCHANT_INVENTORY: MerchantItem[] = [
  // ===== TIER 1: BASIC UPGRADES (30-70 teeth) =====

  // Weapons
  {
    id: 'shop_sword_iron',
    name: 'Iron Sword',
    slot: 'weapon',
    attackBonus: 4,
    defenseBonus: 0,
    description: 'A sturdy iron blade',
    price: 50,
  },
  {
    id: 'shop_axe_bronze',
    name: 'Bronze Axe',
    slot: 'weapon',
    attackBonus: 5,
    defenseBonus: 0,
    description: 'A heavy bronze axe',
    isTwoHanded: true,
    price: 70,
  },

  // Armor
  {
    id: 'shop_armor_leather',
    name: 'Leather Armor',
    slot: 'bodyArmor',
    attackBonus: 0,
    defenseBonus: 3,
    description: 'Flexible leather protection',
    price: 40,
  },
  {
    id: 'shop_helmet_iron',
    name: 'Iron Helmet',
    slot: 'helmet',
    attackBonus: 0,
    defenseBonus: 2,
    description: 'Protects your head',
    price: 35,
  },
  {
    id: 'shop_gloves_leather',
    name: 'Leather Gloves',
    slot: 'gloves',
    attackBonus: 0,
    defenseBonus: 1,
    description: 'Soft leather gloves',
    price: 30,
  },
  {
    id: 'shop_boots_leather',
    name: 'Leather Boots',
    slot: 'boots',
    attackBonus: 0,
    defenseBonus: 1,
    description: 'Comfortable leather boots',
    price: 30,
  },

  // ===== TIER 2: MODERATE UPGRADES (80-150 teeth) =====

  // Weapons
  {
    id: 'shop_mace_steel',
    name: 'Steel Mace',
    slot: 'weapon',
    attackBonus: 6,
    defenseBonus: 0,
    description: 'A crushing steel mace',
    price: 120,
  },

  // Armor
  {
    id: 'shop_armor_scale',
    name: 'Scale Mail',
    slot: 'bodyArmor',
    attackBonus: 0,
    defenseBonus: 5,
    description: 'Overlapping metal scales',
    price: 150,
  },
  {
    id: 'shop_helmet_steel',
    name: 'Steel Helmet',
    slot: 'helmet',
    attackBonus: 0,
    defenseBonus: 3,
    description: 'Strong steel protection',
    price: 80,
  },

  // Accessories
  {
    id: 'shop_ring_strength',
    name: 'Ring of Strength',
    slot: 'ring1',
    attackBonus: 2,
    defenseBonus: 0,
    description: 'Increases attack power',
    price: 100,
  },
  {
    id: 'shop_ring_protection',
    name: 'Ring of Protection',
    slot: 'ring2',
    attackBonus: 0,
    defenseBonus: 2,
    description: 'Enhances defense',
    price: 100,
  },
  {
    id: 'shop_amulet_protection',
    name: 'Amulet of Protection',
    slot: 'amulet',
    attackBonus: 0,
    defenseBonus: 3,
    description: 'Magical protection',
    price: 120,
  },
  {
    id: 'shop_belt_leather',
    name: 'Studded Belt',
    slot: 'belt',
    attackBonus: 1,
    defenseBonus: 1,
    description: 'A reinforced leather belt',
    price: 80,
  },

  // ===== TIER 3: ADVANCED UPGRADES (200-300 teeth) =====

  // Weapons
  {
    id: 'shop_sword_steel',
    name: 'Steel Longsword',
    slot: 'weapon',
    attackBonus: 7,
    defenseBonus: 0,
    description: 'A masterwork blade',
    price: 250,
  },
  {
    id: 'shop_greatsword',
    name: 'Greatsword',
    slot: 'weapon',
    attackBonus: 9,
    defenseBonus: 0,
    description: 'A massive two-handed sword',
    isTwoHanded: true,
    price: 300,
  },

  // Armor
  {
    id: 'shop_armor_chain',
    name: 'Chainmail Armor',
    slot: 'bodyArmor',
    attackBonus: 0,
    defenseBonus: 6,
    description: 'Heavy metal links',
    price: 280,
  },
  {
    id: 'shop_gloves_steel',
    name: 'Steel Gauntlets',
    slot: 'gloves',
    attackBonus: 1,
    defenseBonus: 2,
    description: 'Heavy steel gloves',
    price: 200,
  },
  {
    id: 'shop_boots_steel',
    name: 'Steel Greaves',
    slot: 'boots',
    attackBonus: 0,
    defenseBonus: 3,
    description: 'Reinforced leg armor',
    price: 220,
  },
];

/**
 * Get merchant items by tier
 */
export function getMerchantItemsByTier(tier: 1 | 2 | 3): MerchantItem[] {
  const tierRanges = {
    1: { min: 0, max: 79 },
    2: { min: 80, max: 199 },
    3: { min: 200, max: Infinity },
  };

  const range = tierRanges[tier];
  return MERCHANT_INVENTORY.filter(item => item.price >= range.min && item.price <= range.max);
}

/**
 * Get merchant items by slot type
 */
export function getMerchantItemsBySlot(slot: string): MerchantItem[] {
  return MERCHANT_INVENTORY.filter(item => item.slot === slot);
}
