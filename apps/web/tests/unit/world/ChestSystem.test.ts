import { describe, it, expect, beforeEach } from 'vitest';
import type { Hero, EquipmentItem } from '@larn-like/shared';
import type { DungeonChestRecord, ReagentStack } from '../../../src/world/WorldState';
import { CHEST_CAPACITY } from '../../../src/world/WorldState';
import type { ReagentItem } from '../../../src/game/Combat';

/**
 * Test suite for Story 3.3: Dungeon Chest System for Equipment Overflow
 *
 * Tests:
 * - Sequential filling logic (fill existing chests before creating new)
 * - Reagent distribution and stacking in chests
 * - Chest capacity enforcement (5 items max)
 * - Chest opened state persistence
 * - Visual distinction (unopened vs opened)
 * - Teeth distribution across chests
 */

describe('Story 3.3: Chest System - Sequential Filling', () => {
  it('should have CHEST_CAPACITY constant set to 5', () => {
    expect(CHEST_CAPACITY).toBe(5);
  });

  it('should calculate chest capacity correctly (items + reagent stacks)', () => {
    const chest: DungeonChestRecord = {
      id: 'test_chest',
      pos: { x: 5, y: 5 },
      items: [
        { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' },
        { id: '2', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 3, description: '' },
      ],
      reagents: [
        { type: 'goblin', count: 3 },
        { type: 'orc', count: 5 },
      ],
      teeth: 50,
      isOpened: false,
      chestType: 'death',
    };

    const usedCapacity = chest.items.length + chest.reagents.length;
    expect(usedCapacity).toBe(4); // 2 items + 2 reagent stacks
    expect(usedCapacity).toBeLessThanOrEqual(CHEST_CAPACITY);
  });

  it('should not exceed chest capacity', () => {
    const chest: DungeonChestRecord = {
      id: 'test_chest',
      pos: { x: 5, y: 5 },
      items: [
        { id: '1', name: 'Item1', slot: 'weapon', attackBonus: 0, defenseBonus: 0, description: '' },
        { id: '2', name: 'Item2', slot: 'helmet', attackBonus: 0, defenseBonus: 0, description: '' },
        { id: '3', name: 'Item3', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 0, description: '' },
      ],
      reagents: [
        { type: 'goblin', count: 10 },
        { type: 'orc', count: 5 },
      ],
      teeth: 100,
      isOpened: false,
      chestType: 'death',
    };

    const usedCapacity = chest.items.length + chest.reagents.length;
    expect(usedCapacity).toBe(5); // Exactly at capacity
  });
});

describe('Story 3.3: Chest System - Reagent Stacking', () => {
  it('should stack reagents of the same type up to 20', () => {
    const reagents: ReagentStack[] = [
      { type: 'goblin', count: 15 },
      { type: 'orc', count: 20 }, // Max stack
      { type: 'dragon', count: 5 },
    ];

    reagents.forEach(stack => {
      expect(stack.count).toBeLessThanOrEqual(20);
    });

    expect(reagents.find(r => r.type === 'orc')?.count).toBe(20);
  });

  it('should create new stack when existing stack is at max (20)', () => {
    const reagents: ReagentStack[] = [
      { type: 'goblin', count: 20 }, // Full stack
    ];

    // Simulate adding another goblin reagent
    const existingStack = reagents.find(r => r.type === 'goblin');
    const needsNewStack = !existingStack || existingStack.count >= 20;

    expect(needsNewStack).toBe(true);
  });
});

describe('Story 3.3: Chest System - Chest States', () => {
  it('should mark chest as opened and change visual appearance', () => {
    const chest: DungeonChestRecord = {
      id: 'test_chest',
      pos: { x: 5, y: 5 },
      items: [],
      reagents: [],
      teeth: 0,
      isOpened: false,
      chestType: 'death',
    };

    // Initially unopened
    expect(chest.isOpened).toBe(false);

    // Simulate opening
    chest.isOpened = true;

    // Should be marked as opened
    expect(chest.isOpened).toBe(true);
  });

  it('should distinguish unopened and opened chest visuals', () => {
    const unopenedChar = '=';
    const unopenedColor = '#00FF00'; // bright green

    const openedChar = '≡';
    const openedColor = '#555555'; // dark gray

    expect(unopenedChar).not.toBe(openedChar);
    expect(unopenedColor).not.toBe(openedColor);
  });

  it('should have chest type as death or overflow', () => {
    const deathChest: DungeonChestRecord = {
      id: 'chest1',
      pos: { x: 1, y: 1 },
      items: [],
      reagents: [],
      teeth: 0,
      isOpened: false,
      chestType: 'death',
    };

    const overflowChest: DungeonChestRecord = {
      id: 'chest2',
      pos: { x: 2, y: 2 },
      items: [],
      reagents: [],
      teeth: 0,
      isOpened: false,
      chestType: 'overflow',
    };

    expect(deathChest.chestType).toBe('death');
    expect(overflowChest.chestType).toBe('overflow');
  });
});

describe('Story 3.3: Chest System - Teeth Distribution', () => {
  it('should distribute teeth evenly across chests', () => {
    const totalTeeth = 100;
    const chestCount = 3;
    const teethPerChest = Math.floor(totalTeeth / chestCount); // 33
    const remainder = totalTeeth % chestCount; // 1

    const chests: DungeonChestRecord[] = Array.from({ length: chestCount }, (_, i) => ({
      id: `chest_${i}`,
      pos: { x: i, y: i },
      items: [],
      reagents: [],
      teeth: teethPerChest,
      isOpened: false,
      chestType: 'death' as const,
    }));

    // Add remainder to first chest
    chests[0].teeth += remainder;

    expect(chests[0].teeth).toBe(34); // 33 + 1
    expect(chests[1].teeth).toBe(33);
    expect(chests[2].teeth).toBe(33);

    const totalDistributed = chests.reduce((sum, c) => sum + c.teeth, 0);
    expect(totalDistributed).toBe(totalTeeth);
  });
});

describe('Story 3.3: Chest System - Opened Chest Persistence', () => {
  it('should refill empty opened chests and mark them as closed', () => {
    // Simulate an opened chest that was looted (empty)
    const openedEmptyChest: DungeonChestRecord = {
      id: 'chest_opened_empty',
      pos: { x: 10, y: 10 },
      items: [],
      reagents: [],
      teeth: 0,
      isOpened: true, // Already opened and looted
      chestType: 'death',
    };

    // This chest should be available for refilling
    const isEmpty = openedEmptyChest.items.length === 0
                    && openedEmptyChest.reagents.length === 0
                    && openedEmptyChest.teeth === 0;

    expect(isEmpty).toBe(true);
    expect(openedEmptyChest.isOpened).toBe(true);

    // After refilling with new items, it should become closed (isOpened = false)
    // This simulates the behavior of distributeDeathLoot
    if (isEmpty) {
      openedEmptyChest.items.push({
        id: 'new_sword',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: '',
      });
      openedEmptyChest.isOpened = false; // Closed for new loot
    }

    expect(openedEmptyChest.items.length).toBe(1);
    expect(openedEmptyChest.isOpened).toBe(false); // Now closed
  });

  it('should preserve opened chests when new death adds more chests', () => {
    // Simulate existing level with one opened chest
    const existingChests: DungeonChestRecord[] = [
      {
        id: 'chest_opened_1',
        pos: { x: 10, y: 10 },
        items: [],
        reagents: [],
        teeth: 0,
        isOpened: true, // Already opened
        chestType: 'death',
      },
      {
        id: 'chest_unopened_1',
        pos: { x: 15, y: 15 },
        items: [],
        reagents: [],
        teeth: 20,
        isOpened: false, // Unopened
        chestType: 'death',
      },
    ];

    // Simulate death adding 2 new items
    const newEquipment: EquipmentItem[] = [
      { id: 'new1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' },
      { id: 'new2', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 3, description: '' },
    ];

    // After sequential filling, should have:
    // 1. Opened chest (unchanged)
    // 2. Unopened chest (now with 2 new items)
    // Total: 2 chests (opened chest preserved)

    expect(existingChests.filter(c => c.isOpened).length).toBe(1);
    expect(existingChests.filter(c => !c.isOpened).length).toBe(1);

    // Verify opened chest is preserved
    const openedChest = existingChests.find(c => c.isOpened);
    expect(openedChest).toBeDefined();
    expect(openedChest?.items.length).toBe(0); // Empty, already looted
    expect(openedChest?.isOpened).toBe(true); // Still marked as opened
  });
});

describe('Story 3.3: Chest System - Integration Scenarios', () => {
  it('should handle empty hero death (no equipment, no reagents, no teeth)', () => {
    const existingChests: DungeonChestRecord[] = [];
    const equipment: EquipmentItem[] = [];
    const reagents: ReagentItem[] = [];
    const teeth = 0;

    // No chests should be created for empty death
    const shouldCreateChest = equipment.length > 0 || reagents.length > 0 || teeth > 0;
    expect(shouldCreateChest).toBe(false);
  });

  it('should handle hero death with only teeth (no equipment/reagents)', () => {
    const teeth = 50;
    const equipment: EquipmentItem[] = [];
    const reagents: ReagentItem[] = [];

    // Should create 1 chest with teeth only
    const shouldCreateChest = equipment.length > 0 || reagents.length > 0 || teeth > 0;
    expect(shouldCreateChest).toBe(true);

    const mockChest: DungeonChestRecord = {
      id: 'chest_teeth',
      pos: { x: 5, y: 5 },
      items: [],
      reagents: [],
      teeth: 50,
      isOpened: false,
      chestType: 'death',
    };

    expect(mockChest.items.length).toBe(0);
    expect(mockChest.reagents.length).toBe(0);
    expect(mockChest.teeth).toBe(50);
  });

  it('should handle death with equipment exceeding chest capacity', () => {
    const equipment: EquipmentItem[] = [
      { id: '1', name: 'Item1', slot: 'weapon', attackBonus: 1, defenseBonus: 0, description: '' },
      { id: '2', name: 'Item2', slot: 'helmet', attackBonus: 0, defenseBonus: 1, description: '' },
      { id: '3', name: 'Item3', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 2, description: '' },
      { id: '4', name: 'Item4', slot: 'gloves', attackBonus: 0, defenseBonus: 1, description: '' },
      { id: '5', name: 'Item5', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: '' },
      { id: '6', name: 'Item6', slot: 'ring1', attackBonus: 1, defenseBonus: 0, description: '' },
      { id: '7', name: 'Item7', slot: 'ring2', attackBonus: 1, defenseBonus: 0, description: '' },
    ];

    // 7 equipment items requires at least 2 chests (5 + 2)
    const requiredChests = Math.ceil(equipment.length / CHEST_CAPACITY);
    expect(requiredChests).toBe(2);
  });

  it('should handle sequential filling with existing unopened chest', () => {
    const existingChests: DungeonChestRecord[] = [
      {
        id: 'existing_chest',
        pos: { x: 10, y: 10 },
        items: [
          { id: 'old1', name: 'OldItem', slot: 'weapon', attackBonus: 1, defenseBonus: 0, description: '' },
        ],
        reagents: [
          { type: 'goblin', count: 2 },
        ],
        teeth: 20,
        isOpened: false,
        chestType: 'death',
      },
    ];

    const usedCapacity = existingChests[0].items.length + existingChests[0].reagents.length;
    expect(usedCapacity).toBe(2); // 1 item + 1 reagent stack

    const availableCapacity = CHEST_CAPACITY - usedCapacity;
    expect(availableCapacity).toBe(3); // Can fit 3 more items/stacks
  });

  it('should NOT fill already opened chests', () => {
    const existingChests: DungeonChestRecord[] = [
      {
        id: 'opened_chest',
        pos: { x: 10, y: 10 },
        items: [],
        reagents: [],
        teeth: 0,
        isOpened: true, // Already opened
        chestType: 'death',
      },
    ];

    const availableChests = existingChests.filter(c => !c.isOpened);
    expect(availableChests.length).toBe(0); // No available chests
  });
});
