import { Hero, EquipmentSlots } from '@larn-like/shared';
import { getEffectiveAttack, getEffectiveDefense, applyDamage } from './Hero';
import { createEmptySlots, getTotalAttackBonus, getTotalDefenseBonus } from './Equipment';

// =============================================================================
// TYPES
// =============================================================================

export interface Monster {
  pos: { x: number; y: number };
  char: string;
  color: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  type?: string;
  isEvolved?: boolean;
  evolutionLevel?: number;
  killHistory?: { heroName: string; killedAt: string }[];
  equipment: EquipmentSlots;
}

export interface CombatResult {
  damageDealt: number;
  damageReceived: number;
  evaded: boolean;
  blocked: boolean;
  blockReduction: number;
  monsterKilled: boolean;
  heroKilled: boolean;
  messages: string[];
  reagentDrop?: ReagentItem;
  killerMonster?: Monster;
}

export interface FleeResult {
  success: boolean;
  damageReceived: number;
  evaded: boolean;
  blocked: boolean;
  blockReduction: number;
  messages: string[];
  killerMonster?: Monster;
}

export interface ReagentItem {
  id: string;
  name: string;
  type: 'reagent';
  monsterType: string;
  statBonus: { stat: string; amount: number };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ATTACK_VERBS: Record<string, string> = {
  goblin: 'scratches',
  orc: 'smashes',
  troll: 'crushes',
  dragon: 'burns',
};

const REAGENT_DEFINITIONS: Record<string, { name: string; stat: string; amount: number }> = {
  goblin: { name: 'Goblin Ear', stat: 'dexterity', amount: 0.1 },
  orc: { name: 'Orc Tooth', stat: 'strength', amount: 0.1 },
  troll: { name: 'Troll Hide', stat: 'constitution', amount: 0.1 },
  dragon: { name: 'Dragon Scale', stat: 'all', amount: 0.5 },
};

// =============================================================================
// COMBAT LOGIC
// =============================================================================

function getAttackVerb(monster: Monster): string {
  return ATTACK_VERBS[monster.type || ''] || 'hits';
}

function rollEvade(hero: Hero): boolean {
  const baseChance = 0.15;
  const dexBonus = hero.currentStats.dexterity * 0.005;
  return Math.random() < baseChance + dexBonus;
}

function rollBlock(hero: Hero): boolean {
  const baseChance = 0.20;
  const defBonus = getEffectiveDefense(hero) * 0.005;
  return Math.random() < baseChance + defBonus;
}

export function rollFlee(hero: Hero, monster: Monster): boolean {
  const baseChance = 0.60;
  const dexBonus = hero.currentStats.dexterity * 0.01;
  const monsterPenalty = monster.attack * 0.005;
  return Math.random() < baseChance + dexBonus - monsterPenalty;
}

function createReagentDrop(monster: Monster): ReagentItem | undefined {
  const monsterType = monster.type || '';
  const def = REAGENT_DEFINITIONS[monsterType];
  if (!def) return undefined;

  return {
    id: `reagent_${monsterType}_${Date.now()}`,
    name: def.name,
    type: 'reagent',
    monsterType,
    statBonus: { stat: def.stat, amount: def.amount },
  };
}

function resolveMonsterRetaliation(hero: Hero, monster: Monster): {
  damageReceived: number;
  evaded: boolean;
  blocked: boolean;
  blockReduction: number;
  messages: string[];
} {
  const messages: string[] = [];
  const verb = getAttackVerb(monster);

  // Evade check
  if (rollEvade(hero)) {
    messages.push(`${monster.name} attacks but misses!`);
    return { damageReceived: 0, evaded: true, blocked: false, blockReduction: 0, messages };
  }

  // Calculate raw damage
  const heroDef = getEffectiveDefense(hero);
  const monsterAtk = monster.attack + getTotalAttackBonus(monster.equipment);
  const rawDamage = Math.max(1, monsterAtk - heroDef + Math.floor(Math.random() * 3));

  // Block check
  if (rollBlock(hero)) {
    const blockReduction = Math.floor(rawDamage * 0.5);
    const reducedDamage = rawDamage - blockReduction;
    applyDamage(hero, reducedDamage);
    messages.push(`${monster.name} attack blocked. Damage reduced by ${blockReduction}`);
    return { damageReceived: reducedDamage, evaded: false, blocked: true, blockReduction, messages };
  }

  // Full hit
  applyDamage(hero, rawDamage);
  messages.push(`${monster.name} ${verb} you for ${rawDamage} damage.`);
  return { damageReceived: rawDamage, evaded: false, blocked: false, blockReduction: 0, messages };
}

export function processCombat(hero: Hero, monster: Monster, monsters: Monster[]): CombatResult {
  const messages: string[] = [];

  // Hero attacks monster
  const heroAtk = getEffectiveAttack(hero);
  const monsterDef = monster.defense + getTotalDefenseBonus(monster.equipment);
  const heroDamage = Math.max(1, heroAtk - monsterDef + Math.floor(Math.random() * 5));
  monster.health -= heroDamage;
  messages.push(`You hit ${monster.name} for ${heroDamage} damage!`);

  // Check monster death
  if (monster.health <= 0) {
    messages.push(`${monster.name} is slain!`);
    const index = monsters.indexOf(monster);
    if (index !== -1) {
      monsters.splice(index, 1);
    }

    // Reagent drop
    const reagent = createReagentDrop(monster);
    if (reagent) {
      (hero.inventory as unknown[]).push(reagent);
      messages.push(`${monster.name} dropped ${reagent.name}!`);
    }

    return {
      damageDealt: heroDamage,
      damageReceived: 0,
      evaded: false,
      blocked: false,
      blockReduction: 0,
      monsterKilled: true,
      heroKilled: false,
      messages,
      reagentDrop: reagent,
    };
  }

  // Monster retaliates with evade/block rolls
  const retaliation = resolveMonsterRetaliation(hero, monster);
  messages.push(...retaliation.messages);

  const heroKilled = !hero.isAlive;
  if (heroKilled) {
    messages.push('*** YOU DIED! Press R to restart. ***');
  }

  return {
    damageDealt: heroDamage,
    damageReceived: retaliation.damageReceived,
    evaded: retaliation.evaded,
    blocked: retaliation.blocked,
    blockReduction: retaliation.blockReduction,
    monsterKilled: false,
    heroKilled,
    messages,
    killerMonster: heroKilled ? monster : undefined,
  };
}

export function processFlee(hero: Hero, monster: Monster): FleeResult {
  if (rollFlee(hero, monster)) {
    return {
      success: true,
      damageReceived: 0,
      evaded: false,
      blocked: false,
      blockReduction: 0,
      messages: [`You disengage from ${monster.name} and flee!`],
    };
  }

  // Flee failed - monster gets free attack with evade/block rolls
  const retaliation = resolveMonsterRetaliation(hero, monster);
  const heroKilled = !hero.isAlive;
  return {
    success: false,
    damageReceived: retaliation.damageReceived,
    evaded: retaliation.evaded,
    blocked: retaliation.blocked,
    blockReduction: retaliation.blockReduction,
    messages: [`You fail to flee! ${monster.name} strikes...`, ...retaliation.messages],
    killerMonster: heroKilled ? monster : undefined,
  };
}

export function getAdjacentMonster(
  heroX: number,
  heroY: number,
  monsters: Monster[]
): Monster | null {
  let nearest: Monster | null = null;
  let nearestDist = Infinity;

  for (const m of monsters) {
    const dx = Math.abs(m.pos.x - heroX);
    const dy = Math.abs(m.pos.y - heroY);
    if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
      const dist = dx + dy;
      if (dist < nearestDist) {
        nearest = m;
        nearestDist = dist;
      }
    }
  }

  return nearest;
}

export function getMonsterHpColor(monster: Monster): string {
  const ratio = monster.health / monster.maxHealth;
  if (ratio > 0.5) return '#00FF00';   // green
  if (ratio > 0.25) return '#FFFF00';  // yellow
  return '#FF0000';                     // red
}

// Export for testing
export { ATTACK_VERBS, REAGENT_DEFINITIONS, rollEvade, rollBlock, resolveMonsterRetaliation, createReagentDrop, getAttackVerb };
