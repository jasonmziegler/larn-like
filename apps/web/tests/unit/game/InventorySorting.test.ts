import { describe, it, expect } from 'vitest';
import { sortInventory } from '../../../src/game/Inventory';
import { EquipmentItem } from '@larn-like/shared';

/**
 * Test suite for Story 3.5 Task 2: Inventory Sorting
 *
 * Tests:
 * - Sort by type (weapons → armor → accessories)
 * - Sort by value (total stat bonuses, highest first)
 * - Sort by slot (alphabetical by slot name)
 * - Stability (secondary sort by name when primary sort is equal)
 * - Non-mutation (original array unchanged)
 */

const sampleItems: EquipmentItem[] = [
  {
    id: 'ring1',
    name: 'Ring of Strength',
    slot: 'ring1',
    attackBonus: 2,
    defenseBonus: 0,
    description: 'A ring',
  },
  {
    id: 'sword1',
    name: 'Iron Sword',
    slot: 'weapon',
    attackBonus: 5,
    defenseBonus: 0,
    description: 'A sword',
  },
  {
    id: 'helmet1',
    name: 'Iron Helmet',
    slot: 'helmet',
    attackBonus: 0,
    defenseBonus: 3,
    description: 'A helmet',
  },
  {
    id: 'dagger1',
    name: 'Bronze Dagger',
    slot: 'weapon',
    attackBonus: 2,
    defenseBonus: 0,
    description: 'A dagger',
  },
  {
    id: 'armor1',
    name: 'Leather Armor',
    slot: 'bodyArmor',
    attackBonus: 0,
    defenseBonus: 5,
    description: 'Armor',
  },
  {
    id: 'shield1',
    name: 'Wooden Shield',
    slot: 'offHand',
    attackBonus: 0,
    defenseBonus: 2,
    description: 'A shield',
  },
  {
    id: 'amulet1',
    name: 'Amulet of Power',
    slot: 'amulet',
    attackBonus: 3,
    defenseBonus: 1,
    description: 'An amulet',
  },
  {
    id: 'gloves1',
    name: 'Chain Gloves',
    slot: 'gloves',
    attackBonus: 1,
    defenseBonus: 2,
    description: 'Gloves',
  },
];

describe('Story 3.5 Task 2: Inventory Sorting', () => {
  describe('Sort by Type', () => {
    it('should group weapons first, then armor, then accessories', () => {
      const sorted = sortInventory(sampleItems, 'type');

      // Weapons: weapon (0), offHand (1)
      expect(sorted[0].slot).toBe('weapon'); // Bronze Dagger (alphabetically first)
      expect(sorted[1].slot).toBe('weapon'); // Iron Sword

      // Should have offHand before armor
      expect(sorted[2].slot).toBe('offHand'); // Wooden Shield

      // Armor: helmet (10), bodyArmor (11), gloves (12)
      const armorSection = sorted.slice(3, 6);
      const armorSlots = armorSection.map(item => item.slot);
      expect(armorSlots).toContain('helmet');
      expect(armorSlots).toContain('bodyArmor');
      expect(armorSlots).toContain('gloves');

      // Accessories: ring1 (20), amulet (22)
      const accessoriesSection = sorted.slice(6);
      const accessorySlots = accessoriesSection.map(item => item.slot);
      expect(accessorySlots).toContain('ring1');
      expect(accessorySlots).toContain('amulet');
    });

    it('should sort alphabetically within same type', () => {
      const items: EquipmentItem[] = [
        {
          id: 'w1',
          name: 'Zweihander',
          slot: 'weapon',
          attackBonus: 10,
          defenseBonus: 0,
          description: 'A weapon',
        },
        {
          id: 'w2',
          name: 'Axe',
          slot: 'weapon',
          attackBonus: 8,
          defenseBonus: 0,
          description: 'A weapon',
        },
        {
          id: 'w3',
          name: 'Mace',
          slot: 'weapon',
          attackBonus: 6,
          defenseBonus: 0,
          description: 'A weapon',
        },
      ];

      const sorted = sortInventory(items, 'type');

      expect(sorted[0].name).toBe('Axe');
      expect(sorted[1].name).toBe('Mace');
      expect(sorted[2].name).toBe('Zweihander');
    });

    it('should handle empty array', () => {
      const sorted = sortInventory([], 'type');
      expect(sorted).toEqual([]);
    });

    it('should handle single item', () => {
      const items = [sampleItems[0]];
      const sorted = sortInventory(items, 'type');
      expect(sorted).toEqual(items);
    });
  });

  describe('Sort by Value', () => {
    it('should sort by total stat bonuses (highest first)', () => {
      const sorted = sortInventory(sampleItems, 'value');

      // Iron Sword: 5 ATK + 0 DEF = 5
      // Leather Armor: 0 ATK + 5 DEF = 5
      // Amulet of Power: 3 ATK + 1 DEF = 4
      // Iron Helmet: 0 ATK + 3 DEF = 3
      // Chain Gloves: 1 ATK + 2 DEF = 3
      // Wooden Shield: 0 ATK + 2 DEF = 2
      // Ring of Strength: 2 ATK + 0 DEF = 2
      // Bronze Dagger: 2 ATK + 0 DEF = 2

      const values = sorted.map(item => item.attackBonus + item.defenseBonus);

      // Should be in descending order
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i + 1]);
      }

      // Highest value items should be first
      expect(values[0]).toBe(5);
      expect(values[1]).toBe(5);
    });

    it('should sort alphabetically by name when values are equal', () => {
      const items: EquipmentItem[] = [
        {
          id: 'a1',
          name: 'Zephyr Ring',
          slot: 'ring1',
          attackBonus: 2,
          defenseBonus: 0,
          description: 'A ring',
        },
        {
          id: 'a2',
          name: 'Amber Ring',
          slot: 'ring1',
          attackBonus: 2,
          defenseBonus: 0,
          description: 'A ring',
        },
        {
          id: 'a3',
          name: 'Mystic Ring',
          slot: 'ring1',
          attackBonus: 2,
          defenseBonus: 0,
          description: 'A ring',
        },
      ];

      const sorted = sortInventory(items, 'value');

      expect(sorted[0].name).toBe('Amber Ring');
      expect(sorted[1].name).toBe('Mystic Ring');
      expect(sorted[2].name).toBe('Zephyr Ring');
    });

    it('should handle items with zero bonuses', () => {
      const items: EquipmentItem[] = [
        {
          id: 'a1',
          name: 'Broken Sword',
          slot: 'weapon',
          attackBonus: 0,
          defenseBonus: 0,
          description: 'Worthless',
        },
        {
          id: 'a2',
          name: 'Iron Sword',
          slot: 'weapon',
          attackBonus: 5,
          defenseBonus: 0,
          description: 'A sword',
        },
      ];

      const sorted = sortInventory(items, 'value');

      expect(sorted[0].name).toBe('Iron Sword');
      expect(sorted[1].name).toBe('Broken Sword');
    });
  });

  describe('Sort by Slot', () => {
    it('should sort alphabetically by slot name', () => {
      const sorted = sortInventory(sampleItems, 'slot');

      const slots = sorted.map(item => item.slot);

      // Should be alphabetically sorted
      for (let i = 0; i < slots.length - 1; i++) {
        expect(slots[i].localeCompare(slots[i + 1])).toBeLessThanOrEqual(0);
      }

      // First few should be: amulet, bodyArmor, gloves, helmet...
      expect(slots[0]).toBe('amulet');
      expect(slots[1]).toBe('bodyArmor');
      expect(slots[2]).toBe('gloves');
      expect(slots[3]).toBe('helmet');
    });

    it('should sort alphabetically by name within same slot', () => {
      const items: EquipmentItem[] = [
        {
          id: 'a1',
          name: 'Zephyr Helmet',
          slot: 'helmet',
          attackBonus: 0,
          defenseBonus: 3,
          description: 'A helmet',
        },
        {
          id: 'a2',
          name: 'Bronze Helmet',
          slot: 'helmet',
          attackBonus: 0,
          defenseBonus: 2,
          description: 'A helmet',
        },
        {
          id: 'a3',
          name: 'Iron Helmet',
          slot: 'helmet',
          attackBonus: 0,
          defenseBonus: 4,
          description: 'A helmet',
        },
      ];

      const sorted = sortInventory(items, 'slot');

      expect(sorted[0].name).toBe('Bronze Helmet');
      expect(sorted[1].name).toBe('Iron Helmet');
      expect(sorted[2].name).toBe('Zephyr Helmet');
    });

    it('should group all items of same slot together', () => {
      const sorted = sortInventory(sampleItems, 'slot');

      // Find weapons
      const weaponIndices = sorted
        .map((item, index) => (item.slot === 'weapon' ? index : -1))
        .filter(i => i !== -1);

      // All weapons should be consecutive
      if (weaponIndices.length > 1) {
        for (let i = 0; i < weaponIndices.length - 1; i++) {
          expect(weaponIndices[i + 1] - weaponIndices[i]).toBe(1);
        }
      }
    });
  });

  describe('Non-mutation and stability', () => {
    it('should not mutate original array', () => {
      const original = [...sampleItems];
      const sorted = sortInventory(sampleItems, 'type');

      // Original array should be unchanged
      expect(sampleItems).toEqual(original);

      // Sorted should be a different array
      expect(sorted).not.toBe(sampleItems);
    });

    it('should handle all three sort modes consistently', () => {
      const sortedByType = sortInventory(sampleItems, 'type');
      const sortedByValue = sortInventory(sampleItems, 'value');
      const sortedBySlot = sortInventory(sampleItems, 'slot');

      // All should have same length as original
      expect(sortedByType.length).toBe(sampleItems.length);
      expect(sortedByValue.length).toBe(sampleItems.length);
      expect(sortedBySlot.length).toBe(sampleItems.length);

      // All should contain same items (order may differ)
      const originalIds = sampleItems.map(i => i.id).sort();
      expect(sortedByType.map(i => i.id).sort()).toEqual(originalIds);
      expect(sortedByValue.map(i => i.id).sort()).toEqual(originalIds);
      expect(sortedBySlot.map(i => i.id).sort()).toEqual(originalIds);
    });

    it('should be stable when sorting already-sorted array', () => {
      const sorted1 = sortInventory(sampleItems, 'type');
      const sorted2 = sortInventory(sorted1, 'type');

      expect(sorted1).toEqual(sorted2);
    });
  });

  describe('Edge cases', () => {
    it('should handle items with unusual slot names', () => {
      const items: EquipmentItem[] = [
        {
          id: 'a1',
          name: 'Item A',
          slot: 'ring1' as any,
          attackBonus: 1,
          defenseBonus: 0,
          description: 'An item',
        },
        {
          id: 'a2',
          name: 'Item B',
          slot: 'unknownSlot' as any,
          attackBonus: 2,
          defenseBonus: 0,
          description: 'An item',
        },
      ];

      // Should not crash
      const sortedType = sortInventory(items, 'type');
      const sortedValue = sortInventory(items, 'value');
      const sortedSlot = sortInventory(items, 'slot');

      expect(sortedType.length).toBe(2);
      expect(sortedValue.length).toBe(2);
      expect(sortedSlot.length).toBe(2);
    });

    it('should handle negative stat bonuses', () => {
      const items: EquipmentItem[] = [
        {
          id: 'a1',
          name: 'Cursed Sword',
          slot: 'weapon',
          attackBonus: -2,
          defenseBonus: 0,
          description: 'Cursed',
        },
        {
          id: 'a2',
          name: 'Iron Sword',
          slot: 'weapon',
          attackBonus: 5,
          defenseBonus: 0,
          description: 'A sword',
        },
      ];

      const sorted = sortInventory(items, 'value');

      // Iron Sword (5) should come before Cursed Sword (-2)
      expect(sorted[0].name).toBe('Iron Sword');
      expect(sorted[1].name).toBe('Cursed Sword');
    });
  });
});
