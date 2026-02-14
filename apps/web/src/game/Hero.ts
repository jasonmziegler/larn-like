import {
  Hero,
  HeroStats,
  EquipmentSlots,
  EquipmentItem,
  EquipmentSlotType,
} from '@larn-like/shared';
import { createStartingEquipment, getTotalAttackBonus, getTotalDefenseBonus } from './Equipment';

const BASE_STATS: HeroStats = {
  hp: 30,
  maxHp: 30,
  strength: 10,
  dexterity: 10,
  constitution: 10,
};

let heroCounter = 0;

function generateHeroId(): string {
  heroCounter++;
  return `hero_${Date.now()}_${heroCounter}`;
}

export function createHero(name: string, playerId: string = 'local'): Hero {
  const trimmedName = name.trim().substring(0, 12);
  if (trimmedName.length === 0) {
    throw new Error('Hero name cannot be empty');
  }

  const equipment = createStartingEquipment(trimmedName);

  return {
    id: generateHeroId(),
    playerId,
    name: trimmedName,
    level: 1,
    baseStats: { ...BASE_STATS },
    currentStats: { ...BASE_STATS },
    equipment,
    inventory: [],
    position: { x: 0, y: 0, depth: 1 },
    teethCurrency: 0,
    createdAt: Date.now(),
    isAlive: true,
  };
}

/**
 * Calculates the hero's effective attack stat.
 * Combines base strength with total attack bonuses from all equipped items.
 */
export function getEffectiveAttack(hero: Hero): number {
  const attack = hero.currentStats.strength + getTotalAttackBonus(hero.equipment);
  return attack;
}

/**
 * Calculates the hero's effective defense stat.
 * Combines dexterity-based defense with total defense bonuses from all equipped items.
 */
export function getEffectiveDefense(hero: Hero): number {
  const defense = Math.floor(hero.currentStats.dexterity / 2) + getTotalDefenseBonus(hero.equipment);
  return defense;
}

export function equipItem(hero: Hero, item: EquipmentItem): EquipmentItem | null {
  const slot = item.slot as keyof EquipmentSlots;
  const previous = hero.equipment[slot];
  hero.equipment[slot] = item;
  return previous;
}

export function unequipSlot(hero: Hero, slot: EquipmentSlotType): EquipmentItem | null {
  const key = slot as keyof EquipmentSlots;
  const item = hero.equipment[key];
  hero.equipment[key] = null;
  return item;
}

export function applyDamage(hero: Hero, damage: number): void {
  hero.currentStats.hp = Math.max(0, hero.currentStats.hp - damage);
  if (hero.currentStats.hp <= 0) {
    hero.isAlive = false;
  }
}

export function heal(hero: Hero, amount: number): void {
  hero.currentStats.hp = Math.min(hero.currentStats.maxHp, hero.currentStats.hp + amount);
}

export { BASE_STATS };
