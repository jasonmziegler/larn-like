// DeathProcessor - handles hero death events and monster promotion logic

import type { Hero } from '@larn-like/shared';
import type { Monster } from '../game/Combat';
import type { WorldState, DeathEventRecord, MonsterRecord } from './WorldState';

export interface DeathProcessingResult {
  deathEvent: DeathEventRecord;
  promotedMonster: MonsterRecord | null;
  summary: {
    killerName: string;
    oldLevel: number;
    newLevel: number;
    statChanges: {
      hp: { old: number; new: number };
      attack: { old: number; new: number };
      defense: { old: number; new: number };
    };
    teethDropped: number;
  } | null;
}

/**
 * Process hero death event:
 * 1. Create death event record
 * 2. Promote killer monster to next dungeon level
 * 3. Enhance monster stats
 * 4. Persist to IndexedDB
 */
export async function processHeroDeath(
  hero: Hero,
  killerMonster: Monster,
  worldState: WorldState,
  currentDepth: number
): Promise<DeathProcessingResult> {
  // Generate random teeth drop (1-32)
  const teethDropped = Math.floor(Math.random() * 32) + 1;

  // Create death event record
  const deathEvent: DeathEventRecord = {
    id: `death_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    heroId: hero.id,
    heroName: hero.name,
    killerMonsterId: (killerMonster as Monster & { _persistId?: string })._persistId || `killer_${Date.now()}`,
    location: {
      x: hero.position.x,
      y: hero.position.y,
      depth: currentDepth,
    },
    teethDropped,
    equipmentTransferred: [],
    equipmentScattered: [],
    soulShrineCreated: false,
    processedAt: new Date().toISOString(),
  };

  // Persist death event
  await worldState.saveDeathEvent(deathEvent);

  // Promote monster logic
  // Clone monster with evolved properties
  const oldMaxHealth = killerMonster.maxHealth;
  const oldAttack = killerMonster.attack;
  const oldDefense = killerMonster.defense;

  // Stat enhancement formulas (from Epic 2 AC):
  // - HP: +50% of current maxHealth (minimum +1)
  // - Attack: +1
  // - Defense: +1
  const hpBonus = Math.max(1, Math.floor(oldMaxHealth * 0.5));
  const newMaxHealth = oldMaxHealth + hpBonus;
  const newAttack = oldAttack + 1;
  const newDefense = oldDefense + 1;
  const newLevel = currentDepth + 1;

  // Update kill history
  const killHistory = killerMonster.killHistory || [];
  killHistory.push({
    heroName: hero.name,
    killedAt: new Date().toISOString(),
  });

  // Create promoted monster record
  const promotedMonster: MonsterRecord = {
    id: (killerMonster as Monster & { _persistId?: string })._persistId || `promoted_${Date.now()}`,
    pos: killerMonster.pos,
    char: killerMonster.char,
    color: killerMonster.color,
    name: killerMonster.name,
    health: newMaxHealth, // Full health on promotion
    maxHealth: newMaxHealth,
    attack: newAttack,
    defense: newDefense,
    type: killerMonster.type || 'unknown',
    isEvolved: true,
    evolutionLevel: (killerMonster.evolutionLevel || 0) + 1,
    killHistory,
  };

  // Get the target level and add the promoted monster
  const targetLevel = worldState.getLevel(newLevel);

  if (targetLevel) {
    // Level already exists - add promoted monster to it
    const updatedMonsters = [...targetLevel.monsters, promotedMonster];
    const updatedLevel = {
      ...targetLevel,
      monsters: updatedMonsters,
    };
    await worldState.saveLevel(updatedLevel);
  }
  // If target level doesn't exist yet, the monster will be added when the level is generated

  // Return processing result with summary
  return {
    deathEvent,
    promotedMonster,
    summary: {
      killerName: killerMonster.name,
      oldLevel: currentDepth,
      newLevel,
      statChanges: {
        hp: { old: oldMaxHealth, new: newMaxHealth },
        attack: { old: oldAttack, new: newAttack },
        defense: { old: oldDefense, new: newDefense },
      },
      teethDropped,
    },
  };
}
