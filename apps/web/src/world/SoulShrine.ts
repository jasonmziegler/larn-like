// SoulShrine - Entity created at hero death location with stored soul energy

import type { Hero } from '@larn-like/shared';

export interface SoulShrine {
  id: string;
  heroName: string;
  heroLevel: number;
  levelDepth: number;
  position: { x: number; y: number };
  soulEnergy: number;
  isActive: boolean;
  createdAt: string; // ISO 8601
}

/**
 * Calculate soul energy from hero's level, stats, and reagent consumption.
 * Formula: (level × 10) + floor(STR + DEX + CON) + (totalReagents × 2.5)
 *
 * Reagent multiplier makes consumption meaningful:
 * - 10 reagents = +25 energy
 * - 20 reagents = +50 energy
 *
 * Minimum 10 energy even for low-level heroes.
 */
export function calculateSoulEnergy(hero: Hero): number {
  const baseEnergy = hero.level * 10;
  const statBonus = Math.floor(
    hero.currentStats.strength +
    hero.currentStats.dexterity +
    hero.currentStats.constitution
  );

  // Calculate total reagents consumed (all types)
  const totalReagents = hero.reagentsConsumed
    ? Object.values(hero.reagentsConsumed).reduce((sum, count) => sum + count, 0)
    : 0;

  // Apply 2.5× multiplier to reagent count
  const reagentBonus = Math.floor(totalReagents * 2.5);

  return Math.max(10, baseEnergy + statBonus + reagentBonus);
}

/**
 * Create a SoulShrine from a dying hero at their death position.
 */
export function createSoulShrine(
  hero: Hero,
  deathPosition: { x: number; y: number },
  levelDepth: number
): SoulShrine {
  const soulEnergy = calculateSoulEnergy(hero);

  return {
    id: `shrine_${hero.name}_${Date.now()}`,
    heroName: hero.name,
    heroLevel: hero.level,
    levelDepth,
    position: { x: deathPosition.x, y: deathPosition.y },
    soulEnergy,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}
