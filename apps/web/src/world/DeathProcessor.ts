// DeathProcessor - handles hero death events and monster promotion logic

import type { Hero, EquipmentItem } from '@larn-like/shared';
import type { Monster } from '../game/Combat';
import type { WorldState, DeathEventRecord, MonsterRecord, DungeonChestRecord } from './WorldState';
import { createEmptySlots, getEquippedItems, validateEquipmentChange } from '../game/Equipment';
import { createTeethDrop } from './TeethDrop';
import { createSoulShrine } from './SoulShrine';
import { findEmptySpot } from '../game/DungeonGenerator';

export interface EquipmentTransferResult {
  transferred: EquipmentItem[];
  overflow: EquipmentItem[];
}

export interface DeathProcessingResult {
  deathEvent: DeathEventRecord;
  promotedMonster: MonsterRecord | null;
  soulShrineCreated: boolean;
  soulShrineId: string | null;
  soulEnergy: number;
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
 * Spawn multiple chests to hold death overflow items and teeth.
 * Creates 1-4 chests based on item count and teeth amount.
 *
 * @param items - Equipment items to distribute across chests
 * @param teeth - Total teeth to distribute across chests
 * @param dungeonGrid - The dungeon grid for valid placement
 * @param occupiedPositions - Positions already occupied
 * @param gridWidth - Dungeon width
 * @param gridHeight - Dungeon height
 * @returns Array of chest records
 */
function spawnDeathChests(
  items: EquipmentItem[],
  teeth: number,
  dungeonGrid: number[][],
  occupiedPositions: { x: number; y: number }[],
  gridWidth: number,
  gridHeight: number
): DungeonChestRecord[] {
  // Calculate number of chests: 1 + floor(items/3) + (teeth>0 ? 1 : 0), capped at 4
  const baseChests = 1;
  const itemChests = Math.floor(items.length / 3);
  const teethChest = teeth > 0 ? 1 : 0;
  const chestCount = Math.min(4, baseChests + itemChests + teethChest);

  const chests: DungeonChestRecord[] = [];
  const updatedOccupied = [...occupiedPositions];

  // Distribute items round-robin across chests
  const itemsPerChest: EquipmentItem[][] = Array.from({ length: chestCount }, () => []);
  items.forEach((item, index) => {
    itemsPerChest[index % chestCount].push(item);
  });

  // Distribute teeth evenly across chests
  const teethPerChest = Math.floor(teeth / chestCount);
  const remainderTeeth = teeth % chestCount;

  for (let i = 0; i < chestCount; i++) {
    const chestPos = findEmptySpot(dungeonGrid, updatedOccupied, gridWidth, gridHeight);
    updatedOccupied.push(chestPos);

    const chestTeeth = teethPerChest + (i < remainderTeeth ? 1 : 0);

    chests.push({
      id: `chest_death_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`,
      pos: chestPos,
      items: itemsPerChest[i],
      teeth: chestTeeth,
    });
  }

  return chests;
}

/**
 * Transfer equipment from dead hero to killer monster.
 * Monster claims ONE random item as a trophy; remaining items become overflow.
 *
 * @param hero - The deceased hero
 * @param killerMonster - The monster that killed the hero
 * @returns Object with transferred items and overflow items
 */
export function transferEquipment(hero: Hero, killerMonster: Monster): EquipmentTransferResult {
  // Ensure both hero and monster have equipment initialized
  if (!hero.equipment) {
    hero.equipment = createEmptySlots();
  }
  if (!killerMonster.equipment) {
    killerMonster.equipment = createEmptySlots();
  }

  const heroItems = getEquippedItems(hero.equipment);

  // No items to transfer
  if (heroItems.length === 0) {
    return { transferred: [], overflow: [] };
  }

  // Pick ONE random item as trophy
  const randomIndex = Math.floor(Math.random() * heroItems.length);
  const selectedItem = heroItems[randomIndex];
  const otherItems = heroItems.filter((_, i) => i !== randomIndex);

  // Try to equip the single selected item
  const slotKey = selectedItem.slot as keyof typeof killerMonster.equipment;

  // Validate equipment constraints (e.g., two-handed weapons)
  const validation = validateEquipmentChange(killerMonster.equipment, selectedItem, slotKey);
  if (!validation.valid) {
    // Constraint violation - all items go to overflow
    return { transferred: [], overflow: heroItems };
  }

  if (killerMonster.equipment[slotKey] === null) {
    // Monster equips the trophy
    killerMonster.equipment[slotKey] = selectedItem;
    return { transferred: [selectedItem], overflow: otherItems };
  } else {
    // Monster's slot is occupied - all items go to overflow
    return { transferred: [], overflow: heroItems };
  }
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
  // Generate random teeth drop (16-32)
  // Range represents teeth that survive the death event (some destroyed)
  const teethDropped = Math.floor(Math.random() * 17) + 16;

  // Transfer hero equipment to killer monster
  const equipmentTransfer = transferEquipment(hero, killerMonster);

  // Handle equipment overflow - create multiple chests if needed
  if (equipmentTransfer.overflow.length > 0) {
    const currentLevel = worldState.getLevel(currentDepth);
    if (currentLevel) {
      const occupiedPositions = [
        ...currentLevel.monsters.map(m => m.pos),
        ...(currentLevel.chests || []).map(c => c.pos),
        { x: hero.position.x, y: hero.position.y },
      ];

      // Spawn 1-4 chests to hold overflow equipment (no teeth - teeth handled separately below)
      const deathChests = spawnDeathChests(
        equipmentTransfer.overflow,
        0, // No teeth in equipment chests
        currentLevel.dungeon,
        occupiedPositions,
        currentLevel.dungeon[0].length,
        currentLevel.dungeon.length
      );

      const updatedChests = [...(currentLevel.chests || []), ...deathChests];
      const updatedLevel = {
        ...currentLevel,
        chests: updatedChests,
      };
      await worldState.saveLevel(updatedLevel);
    }
  }

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
    equipmentTransferred: equipmentTransfer.transferred.map(item => ({
      id: item.id,
      name: item.name,
      slot: item.slot,
      attackBonus: item.attackBonus,
      defenseBonus: item.defenseBonus,
    })),
    equipmentScattered: equipmentTransfer.overflow.map(item => ({
      id: item.id,
      name: item.name,
      slot: item.slot,
      attackBonus: item.attackBonus,
      defenseBonus: item.defenseBonus,
    })),
    soulShrineCreated: false,
    processedAt: new Date().toISOString(),
  };

  // Persist death event
  await worldState.saveDeathEvent(deathEvent);

  // Create and persist TeethDrop at death location
  const teethDrop = createTeethDrop(deathEvent);
  await worldState.getStore().saveTeethDrop(teethDrop as unknown as Record<string, unknown>);

  // Create and persist SoulShrine at death location
  const soulShrine = createSoulShrine(
    hero,
    { x: hero.position.x, y: hero.position.y },
    currentDepth
  );
  await worldState.getStore().saveSoulShrine(soulShrine as unknown as Record<string, unknown>);

  // Update death event to mark shrine creation
  deathEvent.soulShrineCreated = true;

  // Scatter hero's teeth inventory to chests (25% current floor, 75% next floor)
  const teethToScatter = hero.teethCurrency;
  if (teethToScatter > 0) {
    const currentFloorTeeth = Math.floor(teethToScatter * 0.25);
    const nextFloorTeeth = teethToScatter - currentFloorTeeth;

    // Get or create levels for chest placement
    const currentLevel = worldState.getLevel(currentDepth);
    const nextLevel = worldState.getLevel(currentDepth + 1);

    // Scatter teeth on current floor
    if (currentFloorTeeth > 0 && currentLevel) {
      const occupiedPositions = [
        ...currentLevel.monsters.map(m => m.pos),
        ...(currentLevel.chests || []).map(c => c.pos),
        { x: hero.position.x, y: hero.position.y },
      ];

      const chestPos = findEmptySpot(
        currentLevel.dungeon,
        occupiedPositions,
        currentLevel.dungeon[0].length,
        currentLevel.dungeon.length
      );

      const teethChest: DungeonChestRecord = {
        id: `chest_teeth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        pos: chestPos,
        items: [],
        teeth: currentFloorTeeth,
      };

      const updatedChests = [...(currentLevel.chests || []), teethChest];
      await worldState.saveLevel({ ...currentLevel, chests: updatedChests });
    }

    // Scatter teeth on next floor (if it exists)
    if (nextFloorTeeth > 0 && nextLevel) {
      const occupiedPositions = [
        ...nextLevel.monsters.map(m => m.pos),
        ...(nextLevel.chests || []).map(c => c.pos),
      ];

      const chestPos = findEmptySpot(
        nextLevel.dungeon,
        occupiedPositions,
        nextLevel.dungeon[0].length,
        nextLevel.dungeon.length
      );

      const teethChest: DungeonChestRecord = {
        id: `chest_teeth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        pos: chestPos,
        items: [],
        teeth: nextFloorTeeth,
      };

      const updatedChests = [...(nextLevel.chests || []), teethChest];
      await worldState.saveLevel({ ...nextLevel, chests: updatedChests });
    } else if (nextFloorTeeth > 0 && !nextLevel) {
      // Next floor doesn't exist yet - add remaining teeth to current floor
      if (currentLevel) {
        const occupiedPositions = [
          ...currentLevel.monsters.map(m => m.pos),
          ...(currentLevel.chests || []).map(c => c.pos),
          { x: hero.position.x, y: hero.position.y },
        ];

        const chestPos = findEmptySpot(
          currentLevel.dungeon,
          occupiedPositions,
          currentLevel.dungeon[0].length,
          currentLevel.dungeon.length
        );

        const teethChest: DungeonChestRecord = {
          id: `chest_teeth_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          pos: chestPos,
          items: [],
          teeth: nextFloorTeeth,
        };

        const updatedLevel = worldState.getLevel(currentDepth);
        if (updatedLevel) {
          const updatedChests = [...(updatedLevel.chests || []), teethChest];
          await worldState.saveLevel({ ...updatedLevel, chests: updatedChests });
        }
      }
    }
  }

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
    equipment: killerMonster.equipment || createEmptySlots(),
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
    soulShrineCreated: true,
    soulShrineId: soulShrine.id,
    soulEnergy: soulShrine.soulEnergy,
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
