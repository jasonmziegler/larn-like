import { Hero } from '@larn-like/shared';
import { ReagentItem } from './Combat';

export interface ConsumeResult {
  message: string;
  stat: string;
  amount: number;
}

export function consumeReagent(hero: Hero, monsterType: string): ConsumeResult | null {
  const inventory = hero.inventory as unknown[] as ReagentItem[];
  const index = inventory.findIndex(
    (item) => item.type === 'reagent' && item.monsterType === monsterType
  );

  if (index === -1) return null;

  const reagent = inventory[index];
  const { stat, amount } = reagent.statBonus;

  // Apply stat bonus
  if (stat === 'all') {
    hero.currentStats.strength += amount;
    hero.currentStats.dexterity += amount;
    hero.currentStats.constitution += amount;
  } else {
    const statKey = stat as keyof typeof hero.currentStats;
    if (statKey in hero.currentStats) {
      (hero.currentStats as Record<string, number>)[statKey] += amount;
    }
  }

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
