// DeathProcessor - handles hero death events and monster promotion logic

import type { Hero, EquipmentItem } from '@larn-like/shared';
import type { Monster, ReagentItem } from '../game/Combat';
import type { WorldState, DeathEventRecord, MonsterRecord, DungeonChestRecord, ReagentStack } from './WorldState';
import { CHEST_CAPACITY } from './WorldState';
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
 * Distribute hero equipment, reagents, and teeth into chests using sequential filling.
 * Fills existing unopened chests before creating new ones.
 *
 * @param equipment - Equipment items from hero
 * @param reagents - Reagent items from hero inventory
 * @param teeth - Total teeth to distribute
 * @param existingChests - Existing chests on the level
 * @param dungeonGrid - The dungeon grid for valid placement
 * @param occupiedPositions - Positions already occupied
 * @param gridWidth - Dungeon width
 * @param gridHeight - Dungeon height
 * @returns Array of all chest records (existing + new)
 */
function distributeDeathLoot(
  equipment: EquipmentItem[],
  reagents: ReagentItem[],
  teeth: number,
  existingChests: DungeonChestRecord[],
  dungeonGrid: number[][],
  occupiedPositions: { x: number; y: number }[],
  gridWidth: number,
  gridHeight: number
): DungeonChestRecord[] {
  // Find existing chests that can be filled (unopened OR opened-but-empty)
  // Opened chests with capacity can be refilled and become unopened again
  const availableChests = existingChests
    .filter(chest => {
      // Include unopened chests
      if (!chest.isOpened) return true;
      // Include opened chests that are empty (can be refilled)
      const isEmpty = chest.items.length === 0 && chest.reagents.length === 0 && chest.teeth === 0;
      return isEmpty;
    })
    .sort((a, b) => a.id.localeCompare(b.id)); // Oldest first

  // Track opened chests that are NOT empty (preserve as-is)
  const openedNonEmptyChests = existingChests.filter(chest => {
    if (!chest.isOpened) return false;
    return chest.items.length > 0 || chest.reagents.length > 0 || chest.teeth > 0;
  });

  const chests: DungeonChestRecord[] = [...availableChests];
  let currentChestIndex = 0;
  const updatedOccupied = [...occupiedPositions];

  // Helper to get current chest capacity used
  const getChestUsedCapacity = (chest: DungeonChestRecord): number => {
    return chest.items.length + chest.reagents.length;
  };

  // Helper to create new chest
  const createNewChest = (): DungeonChestRecord => {
    const chestPos = findEmptySpot(dungeonGrid, updatedOccupied, gridWidth, gridHeight);
    updatedOccupied.push(chestPos);
    return {
      id: `chest_death_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      pos: chestPos,
      items: [],
      reagents: [],
      teeth: 0,
      isOpened: false,
      chestType: 'death',
    };
  };

  // Distribute equipment first
  for (const item of equipment) {
    // Create new chest if needed
    if (currentChestIndex >= chests.length) {
      chests.push(createNewChest());
    }

    let chest = chests[currentChestIndex];

    // Check capacity
    if (getChestUsedCapacity(chest) >= CHEST_CAPACITY) {
      currentChestIndex++;
      if (currentChestIndex >= chests.length) {
        chests.push(createNewChest());
      }
      chest = chests[currentChestIndex];
    }

    // Add equipment to chest
    chest.items.push(item);
  }

  // Distribute reagents (with stacking)
  for (const reagent of reagents) {
    // Create new chest if needed
    if (currentChestIndex >= chests.length) {
      chests.push(createNewChest());
    }

    let chest = chests[currentChestIndex];

    // Try to stack with existing reagent in chest
    const existingStack = chest.reagents.find(r => r.type === reagent.monsterType);
    if (existingStack && existingStack.count < 20) {
      existingStack.count++;
      continue; // Successfully stacked
    }

    // Check capacity for new stack
    if (getChestUsedCapacity(chest) >= CHEST_CAPACITY) {
      currentChestIndex++;
      if (currentChestIndex >= chests.length) {
        chests.push(createNewChest());
      }
      chest = chests[currentChestIndex];
    }

    // Create new reagent stack
    chest.reagents.push({ type: reagent.monsterType, count: 1 });
  }

  // Distribute teeth evenly across all chests (only unopened/new chests)
  if (chests.length > 0 && teeth > 0) {
    const teethPerChest = Math.floor(teeth / chests.length);
    chests.forEach(chest => {
      chest.teeth += teethPerChest;
    });
    // Remainder teeth go to first chest
    chests[0].teeth += teeth % chests.length;
  }

  // Mark any refilled chests as unopened (chests that were opened but got new items)
  chests.forEach(chest => {
    const hasNewContent = chest.items.length > 0 || chest.reagents.length > 0 || chest.teeth > 0;
    if (hasNewContent) {
      chest.isOpened = false; // Close the chest so it can be opened again
    }
  });

  // Return ALL chests: non-empty opened (unchanged) + refilled/new chests
  return [...openedNonEmptyChests, ...chests];
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

  // Extract reagents from hero inventory
  const inventory = hero.inventory as unknown[] as (EquipmentItem | ReagentItem)[];
  const reagentItems = inventory.filter(
    (item): item is ReagentItem => (item as ReagentItem).type === 'reagent'
  );

  // Handle death overflow - distribute equipment, reagents, and teeth into chests
  // Use sequential filling: fill existing chests before creating new ones
  if (equipmentTransfer.overflow.length > 0 || reagentItems.length > 0 || hero.teethCurrency > 0) {
    const currentLevel = worldState.getLevel(currentDepth);
    if (currentLevel) {
      const occupiedPositions = [
        ...currentLevel.monsters.map(m => m.pos),
        ...(currentLevel.chests || []).map(c => c.pos),
        { x: hero.position.x, y: hero.position.y },
      ];

      // Distribute all death loot (equipment, reagents, teeth) using sequential filling
      const updatedChests = distributeDeathLoot(
        equipmentTransfer.overflow,
        reagentItems,
        hero.teethCurrency,
        currentLevel.chests || [],
        currentLevel.dungeon,
        occupiedPositions,
        currentLevel.dungeon[0].length,
        currentLevel.dungeon.length
      );

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
    // Level already exists - add promoted monster immediately
    const updatedMonsters = [...targetLevel.monsters, promotedMonster];
    const updatedLevel = {
      ...targetLevel,
      monsters: updatedMonsters,
    };
    await worldState.saveLevel(updatedLevel);
  } else {
    // Level doesn't exist yet - save as pending promotion
    // Monster will be injected when the level is first generated
    await worldState.savePendingPromotion(promotedMonster, newLevel);
  }

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
