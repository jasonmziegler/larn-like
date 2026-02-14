import {
  EquipmentItem,
  EquipmentSlots,
  EquipmentSlotType,
  EquipmentValidationResult,
} from '@larn-like/shared';

export function createEmptySlots(): EquipmentSlots {
  return {
    weapon: null,
    offHand: null,
    helmet: null,
    bodyArmor: null,
    gloves: null,
    boots: null,
    ring1: null,
    ring2: null,
    amulet: null,
    belt: null,
  };
}

export function createStartingDagger(ownerName: string): EquipmentItem {
  return {
    id: `dagger_${ownerName.toLowerCase().replace(/\s/g, '_')}`,
    name: `${ownerName}'s Dagger`,
    slot: 'weapon',
    attackBonus: 2,
    defenseBonus: 0,
    description: 'A basic iron dagger',
  };
}

export function createStartingShirt(ownerName: string): EquipmentItem {
  return {
    id: `shirt_${ownerName.toLowerCase().replace(/\s/g, '_')}`,
    name: `${ownerName}'s Shirt`,
    slot: 'bodyArmor',
    attackBonus: 0,
    defenseBonus: 1,
    description: 'A simple cloth shirt',
  };
}

export function createStartingEquipment(ownerName: string): EquipmentSlots {
  const slots = createEmptySlots();
  slots.weapon = createStartingDagger(ownerName);
  slots.bodyArmor = createStartingShirt(ownerName);
  return slots;
}

export function isSlotOccupied(slots: EquipmentSlots, slot: EquipmentSlotType): boolean {
  return slots[slot as keyof EquipmentSlots] !== null;
}

export function getEquippedItems(slots: EquipmentSlots): EquipmentItem[] {
  const items: EquipmentItem[] = [];
  const keys: EquipmentSlotType[] = [
    'weapon', 'offHand', 'helmet', 'bodyArmor', 'gloves',
    'boots', 'ring1', 'ring2', 'amulet', 'belt',
  ];
  for (const key of keys) {
    const item = slots[key as keyof EquipmentSlots];
    if (item) {
      items.push(item);
    }
  }
  return items;
}

export function getTotalAttackBonus(slots: EquipmentSlots | undefined): number {
  if (!slots) return 0;
  return getEquippedItems(slots).reduce((sum, item) => sum + item.attackBonus, 0);
}

export function getTotalDefenseBonus(slots: EquipmentSlots | undefined): number {
  if (!slots) return 0;
  return getEquippedItems(slots).reduce((sum, item) => sum + item.defenseBonus, 0);
}

/**
 * Validates whether an equipment change is allowed based on slot constraints.
 *
 * Enforces the following rules:
 * - Two-handed weapons cannot be equipped if off-hand slot is occupied
 * - Off-hand items cannot be equipped if a two-handed weapon is in weapon slot
 */
export function validateEquipmentChange(
  equipment: EquipmentSlots,
  newItem: EquipmentItem,
  targetSlot: EquipmentSlotType
): EquipmentValidationResult {
  // If equipping two-handed weapon, check off-hand is empty
  if (targetSlot === 'weapon' && newItem.isTwoHanded && equipment.offHand !== null) {
    return {
      valid: false,
      error: 'Cannot equip two-handed weapon while using off-hand item. Unequip off-hand first.',
    };
  }

  // If equipping off-hand, check weapon is not two-handed
  if (targetSlot === 'offHand' && equipment.weapon?.isTwoHanded) {
    return {
      valid: false,
      error: 'Cannot equip off-hand item with two-handed weapon. Unequip weapon first.',
    };
  }

  return { valid: true };
}

/**
 * Checks if an equipment slot is blocked due to constraints.
 * For example, off-hand slot is blocked when a two-handed weapon is equipped.
 */
export function isSlotBlocked(equipment: EquipmentSlots, slot: EquipmentSlotType): boolean {
  // Off-hand slot is blocked if weapon is two-handed
  if (slot === 'offHand' && equipment.weapon?.isTwoHanded) {
    return true;
  }

  return false;
}

/**
 * Result of an equipment operation
 */
export interface EquipmentOperationResult {
  success: boolean;
  error?: string;
  removedItem?: EquipmentItem;
}

/**
 * Equips an item from inventory to a specified slot.
 * Validates constraints and handles replacing existing equipment.
 *
 * @param inventory - Hero's inventory array (will be modified)
 * @param equipment - Hero's equipment slots (will be modified)
 * @param item - Item to equip from inventory
 * @param targetSlot - Slot to equip to
 * @returns Result indicating success/failure and any removed item
 */
export function equipItem(
  inventory: EquipmentItem[],
  equipment: EquipmentSlots,
  item: EquipmentItem,
  targetSlot: EquipmentSlotType
): EquipmentOperationResult {
  // Validate the equipment change
  const validation = validateEquipmentChange(equipment, item, targetSlot);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Check if item is in inventory
  const itemIndex = inventory.findIndex(invItem => invItem.id === item.id);
  if (itemIndex === -1) {
    return { success: false, error: 'Item not found in inventory' };
  }

  // Remove current item from slot if equipped
  const currentItem = equipment[targetSlot];
  if (currentItem) {
    // Add current item back to inventory
    inventory.push(currentItem);
  }

  // Remove item from inventory and equip it
  inventory.splice(itemIndex, 1);
  equipment[targetSlot] = item;

  return { success: true, removedItem: currentItem || undefined };
}

/**
 * Unequips an item from a slot and returns it to inventory.
 *
 * @param inventory - Hero's inventory array (will be modified)
 * @param equipment - Hero's equipment slots (will be modified)
 * @param slot - Slot to unequip from
 * @returns Result indicating success/failure and the removed item
 */
export function unequipItem(
  inventory: EquipmentItem[],
  equipment: EquipmentSlots,
  slot: EquipmentSlotType
): EquipmentOperationResult {
  const item = equipment[slot];

  if (!item) {
    return { success: false, error: 'No item equipped in this slot' };
  }

  // Remove from slot
  equipment[slot] = null;

  // Add to inventory
  inventory.push(item);

  return { success: true, removedItem: item };
}
