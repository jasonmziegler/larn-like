// Blessing - Soul shrine blessing system for equipment enhancement

import type { EquipmentItem } from '@larn-like/shared';

export interface BlessingResult {
  success: boolean;
  item: EquipmentItem | null;
  statChange: { attackBonus: number; defenseBonus: number };
  message: string;
  shrineHeroName: string;
}

export interface ShrineData {
  id: string;
  heroName: string;
  soulEnergy: number;
}

/**
 * Calculate the chance of a successful blessing.
 *
 * Formula:
 * - Base chance: 40%
 * - Energy bonus: +0.5% per soul energy point
 * - Item penalty: -3% per point of combined item bonuses
 * - Final range: clamped to 10-90%
 *
 * @param soulEnergy - The shrine's soul energy value
 * @param item - The equipment item to bless
 * @returns A number between 0.10 and 0.90 representing the success chance
 */
export function calculateBlessingChance(soulEnergy: number, item: EquipmentItem): number {
  const baseChance = 0.40;
  const energyBonus = soulEnergy * 0.005;
  const itemPenalty = (item.attackBonus + item.defenseBonus) * 0.03;
  return Math.min(0.90, Math.max(0.10, baseChance + energyBonus - itemPenalty));
}

/**
 * Calculate the stat bonus to apply on successful blessing.
 *
 * Weapons (weapon/offHand): +ATK based on energy (max +3)
 * Armor (all other slots): +DEF based on energy (max +2)
 *
 * @param soulEnergy - The shrine's soul energy value
 * @param item - The equipment item being blessed
 * @returns Object with stat type and amount to add
 */
function calculateBlessingBonus(
  soulEnergy: number,
  item: EquipmentItem
): { stat: 'attack' | 'defense'; amount: number } {
  const isWeapon = item.slot === 'weapon' || item.slot === 'offHand';
  if (isWeapon) {
    return { stat: 'attack', amount: Math.min(3, Math.ceil(soulEnergy / 30)) };
  } else {
    return { stat: 'defense', amount: Math.min(2, Math.ceil(soulEnergy / 40)) };
  }
}

/**
 * Update an item's name to reflect being blessed.
 * Appends blessing attribution or increments blessing count.
 *
 * @param itemName - Current item name
 * @param shrineHeroName - Name of hero whose shrine blessed the item
 * @returns Updated item name with blessing attribution
 */
function updateItemNameWithBlessing(itemName: string, shrineHeroName: string): string {
  // Check if item already has blessings
  const blessedMatch = itemName.match(/\(Blessed by (.+?)\)$/);
  const blessedCountMatch = itemName.match(/\(Blessed x(\d+)\)$/);

  if (blessedCountMatch) {
    // Item has multiple blessings (count format)
    const count = parseInt(blessedCountMatch[1], 10);
    const baseName = itemName.replace(/\(Blessed x\d+\)$/, '').trim();
    return `${baseName} (Blessed x${count + 1})`;
  } else if (blessedMatch) {
    // Item has 1-2 blessings (name format)
    const existingNames = blessedMatch[1];
    const nameList = existingNames.split(', ');
    if (nameList.length >= 3) {
      // Switch to count format after 3 blessings
      const baseName = itemName.replace(/\(Blessed by .+?\)$/, '').trim();
      return `${baseName} (Blessed x4)`;
    } else {
      // Add to name list
      const baseName = itemName.replace(/\(Blessed by .+?\)$/, '').trim();
      return `${baseName} (Blessed by ${existingNames}, ${shrineHeroName})`;
    }
  } else {
    // First blessing
    return `${itemName} (Blessed by ${shrineHeroName})`;
  }
}

/**
 * Attempt to bless an equipment item using a soul shrine.
 *
 * Success: Item stats increased, name updated with blessing
 * Failure (90%): Primary stat reduced by 1 (minimum 0)
 * Failure (10%): Item destroyed (returns null)
 *
 * @param shrine - The soul shrine data
 * @param item - The equipment item to bless
 * @returns BlessingResult with outcome details
 */
export function attemptBlessing(shrine: ShrineData, item: EquipmentItem): BlessingResult {
  const chance = calculateBlessingChance(shrine.soulEnergy, item);
  const roll = Math.random();
  const success = roll < chance;

  if (success) {
    // Success: enhance item stats
    const bonus = calculateBlessingBonus(shrine.soulEnergy, item);
    const newItem: EquipmentItem = {
      ...item,
      attackBonus: item.attackBonus + (bonus.stat === 'attack' ? bonus.amount : 0),
      defenseBonus: item.defenseBonus + (bonus.stat === 'defense' ? bonus.amount : 0),
      name: updateItemNameWithBlessing(item.name, shrine.heroName),
      description: item.description
        ? `${item.description}. Blessed at ${shrine.heroName}'s shrine`
        : `Blessed at ${shrine.heroName}'s shrine`,
    };

    const statChange = {
      attackBonus: bonus.stat === 'attack' ? bonus.amount : 0,
      defenseBonus: bonus.stat === 'defense' ? bonus.amount : 0,
    };

    const statName = bonus.stat === 'attack' ? 'ATK' : 'DEF';
    const message = `† ${shrine.heroName}'s soul blesses your ${item.name}! (+${bonus.amount} ${statName})`;

    return {
      success: true,
      item: newItem,
      statChange,
      message,
      shrineHeroName: shrine.heroName,
    };
  } else {
    // Failure: degrade or destroy
    const isDestruction = Math.random() < 0.10; // 10% of failures destroy item

    if (isDestruction) {
      // Item destroyed
      return {
        success: false,
        item: null,
        statChange: { attackBonus: 0, defenseBonus: 0 },
        message: `† ${shrine.heroName}'s soul is unstable! ${item.name} is destroyed!`,
        shrineHeroName: shrine.heroName,
      };
    } else {
      // Item degraded
      const isWeapon = item.slot === 'weapon' || item.slot === 'offHand';
      const degradedItem: EquipmentItem = {
        ...item,
        attackBonus: isWeapon ? Math.max(0, item.attackBonus - 1) : item.attackBonus,
        defenseBonus: !isWeapon ? Math.max(0, item.defenseBonus - 1) : item.defenseBonus,
      };

      const statChange = {
        attackBonus: isWeapon ? -Math.min(1, item.attackBonus) : 0,
        defenseBonus: !isWeapon ? -Math.min(1, item.defenseBonus) : 0,
      };

      const statName = isWeapon ? 'ATK' : 'DEF';
      const message = `† The blessing falters... ${item.name} weakened. (${statChange.attackBonus || statChange.defenseBonus} ${statName})`;

      return {
        success: false,
        item: degradedItem,
        statChange,
        message,
        shrineHeroName: shrine.heroName,
      };
    }
  }
}
