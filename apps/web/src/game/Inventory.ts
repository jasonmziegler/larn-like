import { Hero, MerchantItem, GAME_CONSTANTS, EquipmentItem, EquipmentSlotType } from '@larn-like/shared';
import { ReagentItem } from './Combat';
import { equipItem } from './Equipment';

export interface ConsumeResult {
  message: string;
  stat: string;
  amount: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
}

export interface DroppedItem {
  id: string;
  pos: { x: number; y: number };
  item: EquipmentItem | ReagentItem;
  char: string;
  color: string;
}

export interface DropResult {
  success: boolean;
  message: string;
  droppedItem?: DroppedItem;
}

export type SortMode = 'type' | 'value' | 'slot';

export interface QuickEquipResult {
  success: boolean;
  message: string;
}

export function consumeReagent(hero: Hero, monsterType: string): ConsumeResult | null {
  const inventory = hero.inventory as unknown[] as ReagentItem[];
  const index = inventory.findIndex(
    (item) => item.type === 'reagent' && item.monsterType === monsterType
  );

  if (index === -1) return null;

  const reagent = inventory[index];
  const { stat, amount } = reagent.statBonus;

  // Apply stat bonus (round to avoid floating-point precision issues)
  if (stat === 'all') {
    hero.currentStats.strength = Math.round((hero.currentStats.strength + amount) * 10) / 10;
    hero.currentStats.dexterity = Math.round((hero.currentStats.dexterity + amount) * 10) / 10;
    hero.currentStats.constitution = Math.round((hero.currentStats.constitution + amount) * 10) / 10;
  } else {
    const statKey = stat as keyof typeof hero.currentStats;
    if (statKey in hero.currentStats) {
      const currentValue = (hero.currentStats as unknown as Record<string, number>)[statKey];
      (hero.currentStats as unknown as Record<string, number>)[statKey] = Math.round((currentValue + amount) * 10) / 10;
    }
  }

  // Track consumption for soul energy calculation
  if (!hero.reagentsConsumed) {
    hero.reagentsConsumed = {};
  }
  hero.reagentsConsumed[monsterType] = (hero.reagentsConsumed[monsterType] || 0) + 1;

  // Remove from inventory
  inventory.splice(index, 1);

  // Build message
  const statLabel = stat === 'all' ? 'All Stats' : stat.charAt(0).toUpperCase() + stat.slice(1);
  return {
    message: `Consumed ${reagent.name}: +${amount} ${statLabel}`,
    stat,
    amount,
  };
}

/**
 * Purchase an item from the merchant
 * Verifies hero has sufficient teeth, deducts cost, adds item to inventory
 */
export function purchaseItem(hero: Hero, item: MerchantItem, cost: number): PurchaseResult {
  // Verify hero has sufficient teeth currency
  if (hero.teethCurrency < cost) {
    return {
      success: false,
      message: `Not enough teeth. Need ${cost}, have ${hero.teethCurrency}`,
    };
  }

  // Check inventory capacity before purchase
  if (!canAddToInventory(hero)) {
    return {
      success: false,
      message: `Inventory is full (${GAME_CONSTANTS.MAX_INVENTORY_SIZE}/${GAME_CONSTANTS.MAX_INVENTORY_SIZE}). Drop an item first.`,
    };
  }

  // Deduct teeth from hero
  hero.teethCurrency -= cost;

  // Add purchased item to hero inventory (convert to EquipmentItem)
  const equipmentItem = {
    id: item.id,
    name: item.name,
    slot: item.slot,
    attackBonus: item.attackBonus,
    defenseBonus: item.defenseBonus,
    description: item.description,
    isTwoHanded: item.isTwoHanded,
  };
  hero.inventory.push(equipmentItem);

  return {
    success: true,
    message: `Purchased ${item.name} for ${cost} teeth`,
  };
}

/**
 * Get current inventory size (equipment + reagents)
 */
export function getInventorySize(hero: Hero): number {
  return hero.inventory.length;
}

/**
 * Check if hero can add another item to inventory
 */
export function canAddToInventory(hero: Hero, count: number = 1): boolean {
  return getInventorySize(hero) + count <= GAME_CONSTANTS.MAX_INVENTORY_SIZE;
}

/**
 * Get formatted capacity string (e.g., "12/20")
 */
export function getCapacityString(hero: Hero): string {
  return `${getInventorySize(hero)}/${GAME_CONSTANTS.MAX_INVENTORY_SIZE}`;
}

/**
 * Check if inventory is full
 */
export function isInventoryFull(hero: Hero): boolean {
  return getInventorySize(hero) >= GAME_CONSTANTS.MAX_INVENTORY_SIZE;
}

/**
 * Drop an item from inventory onto the floor
 * @param hero - The hero dropping the item
 * @param inventoryIndex - Index of item in hero.inventory array
 * @param position - Position where item should be dropped
 * @returns Result with dropped item entity or error message
 */
export function dropItem(
  hero: Hero,
  inventoryIndex: number,
  position: { x: number; y: number }
): DropResult {
  if (inventoryIndex < 0 || inventoryIndex >= hero.inventory.length) {
    return {
      success: false,
      message: 'Invalid inventory index',
    };
  }

  const item = hero.inventory[inventoryIndex];

  // Remove from inventory
  hero.inventory.splice(inventoryIndex, 1);

  // Create dropped item entity
  const droppedItem: DroppedItem = {
    id: `dropped_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    pos: { x: position.x, y: position.y },
    item,
    char: '/',
    color: '#FFAA00',
  };

  return {
    success: true,
    message: `Dropped ${item.name}`,
    droppedItem,
  };
}

/**
 * Sort equipment items by specified mode
 * @param items - Array of equipment items to sort
 * @param mode - Sort mode: 'type', 'value', or 'slot'
 * @returns Sorted array (does not modify original)
 */
export function sortInventory(items: EquipmentItem[], mode: SortMode): EquipmentItem[] {
  const sorted = [...items]; // Create copy to avoid mutation

  switch (mode) {
    case 'type': {
      // Group: weapons (weapon, offHand) → armor (helmet, bodyArmor, gloves, boots) → accessories (ring1, ring2, amulet, belt)
      const typeOrder: Record<string, number> = {
        weapon: 0,
        offHand: 1,
        helmet: 10,
        bodyArmor: 11,
        gloves: 12,
        boots: 13,
        ring1: 20,
        ring2: 21,
        amulet: 22,
        belt: 23,
      };
      return sorted.sort((a, b) => {
        const aOrder = typeOrder[a.slot] ?? 999;
        const bOrder = typeOrder[b.slot] ?? 999;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // Within same type, sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
    }

    case 'value': {
      // Sort by total stat bonuses (highest first)
      return sorted.sort((a, b) => {
        const aValue = a.attackBonus + a.defenseBonus;
        const bValue = b.attackBonus + b.defenseBonus;
        if (bValue !== aValue) return bValue - aValue;
        // If same value, sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
    }

    case 'slot': {
      // Alphabetical by slot name
      return sorted.sort((a, b) => {
        if (a.slot !== b.slot) return a.slot.localeCompare(b.slot);
        // Within same slot, sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
    }

    default:
      return sorted;
  }
}

/**
 * Quick-equip an item from inventory
 * Swaps current equipped item with new item in one action
 * @param hero - The hero equipping the item
 * @param inventoryIndex - Index of item in hero.inventory array
 * @returns Result with success status and message
 */
export function quickEquip(hero: Hero, inventoryIndex: number): QuickEquipResult {
  if (inventoryIndex < 0 || inventoryIndex >= hero.inventory.length) {
    return { success: false, message: 'Invalid inventory index' };
  }

  const item = hero.inventory[inventoryIndex];
  const targetSlot = item.slot as EquipmentSlotType;

  // Use existing equipItem function which handles validation and swapping
  const result = equipItem(hero.inventory, hero.equipment, item, targetSlot);

  if (!result.success) {
    return { success: false, message: result.error || 'Could not equip item' };
  }

  // Build success message
  const attackStr = item.attackBonus > 0 ? `+${item.attackBonus} ATK` : '';
  const defenseStr = item.defenseBonus > 0 ? `+${item.defenseBonus} DEF` : '';
  const stats = [attackStr, defenseStr].filter(s => s).join(', ');
  const message = stats ? `Equipped ${item.name} (${stats})` : `Equipped ${item.name}`;

  return { success: true, message };
}
