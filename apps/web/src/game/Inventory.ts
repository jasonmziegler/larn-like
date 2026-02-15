import { Hero, MerchantItem } from '@larn-like/shared';
import { ReagentItem } from './Combat';

export interface ConsumeResult {
  message: string;
  stat: string;
  amount: number;
}

export interface PurchaseResult {
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
