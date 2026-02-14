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
 * Calculate soul energy value from a hero's level and stats.
 * Formula: (level * 10) + floor(strength + dexterity + constitution)
 * Minimum 10 energy even for low-level heroes.
 */
export function calculateSoulEnergy(hero: Hero): number {
  const baseEnergy = hero.level * 10;
  const statBonus = Math.floor(
    hero.currentStats.strength + hero.currentStats.dexterity + hero.currentStats.constitution
  );
  return Math.max(10, baseEnergy + statBonus);
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
