import { describe, it, expect } from 'vitest';
import { createHero } from '../../../src/game/Hero';
import { quickEquip } from '../../../src/game/Inventory';
import { EquipmentItem } from '@larn-like/shared';

/**
 * Test suite for Story 3.5 Task 4: Quick-Equip System
 *
 * Tests:
 * - Quick-equip from inventory index
 * - Swaps items in one action
 * - Returns success message with item stats
 * - Handles inventory at capacity (swaps without issue)
 * - Validates equipment change (two-handed, blocked slots)
 * - Invalid inventory index handling
 */

describe('Story 3.5 Task 4: Quick-Equip System', () => {
  describe('Basic quick-equip', () => {
    it('should equip item from inventory', () => {
      const hero = createHero('Test');

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      hero.inventory.push(sword);

      const result = quickEquip(hero, hero.inventory.length - 1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Equipped Iron Sword');
      expect(result.message).toContain('+5 ATK');
      expect(hero.equipment.weapon?.id).toBe('sword1');
      expect(hero.inventory).not.toContain(sword);
    });

    it('should return old item to inventory when swapping', () => {
      const hero = createHero('Test');

      const dagger: EquipmentItem = {
        id: 'dagger1',
        name: 'Bronze Dagger',
        slot: 'weapon',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'A dagger',
      };

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      // Equip dagger first
      hero.equipment.weapon = dagger;
      hero.inventory.push(sword);

      const inventoryLengthBefore = hero.inventory.length;

      const result = quickEquip(hero, hero.inventory.length - 1);

      expect(result.success).toBe(true);
      expect(hero.equipment.weapon?.id).toBe('sword1');
      expect(hero.inventory.length).toBe(inventoryLengthBefore); // Same length (swapped)
      expect(hero.inventory).toContain(dagger); // Dagger returned to inventory
      expect(hero.inventory).not.toContain(sword); // Sword equipped
    });

    it('should handle equipping to empty slot', () => {
      const hero = createHero('Test');
      hero.equipment.helmet = null; // Ensure empty

      const helmet: EquipmentItem = {
        id: 'helmet1',
        name: 'Iron Helmet',
        slot: 'helmet',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A helmet',
      };

      hero.inventory.push(helmet);

      const result = quickEquip(hero, hero.inventory.length - 1);

      expect(result.success).toBe(true);
      expect(hero.equipment.helmet?.id).toBe('helmet1');
      expect(hero.inventory).not.toContain(helmet);
    });
  });

  describe('Success messages', () => {
    it('should show attack bonus in message', () => {
      const hero = createHero('Test');

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      hero.inventory.push(sword);

      const result = quickEquip(hero, 0);

      expect(result.message).toBe('Equipped Iron Sword (+5 ATK)');
    });

    it('should show defense bonus in message', () => {
      const hero = createHero('Test');

      const shield: EquipmentItem = {
        id: 'shield1',
        name: 'Wooden Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A shield',
      };

      hero.inventory.push(shield);

      const result = quickEquip(hero, 0);

      expect(result.message).toBe('Equipped Wooden Shield (+3 DEF)');
    });

    it('should show both bonuses in message', () => {
      const hero = createHero('Test');

      const armor: EquipmentItem = {
        id: 'armor1',
        name: 'Leather Armor',
        slot: 'bodyArmor',
        attackBonus: 1,
        defenseBonus: 4,
        description: 'Armor',
      };

      hero.inventory.push(armor);

      const result = quickEquip(hero, 0);

      expect(result.message).toBe('Equipped Leather Armor (+1 ATK, +4 DEF)');
    });

    it('should handle items with no bonuses', () => {
      const hero = createHero('Test');

      const trinket: EquipmentItem = {
        id: 'trinket1',
        name: 'Plain Ring',
        slot: 'ring1',
        attackBonus: 0,
        defenseBonus: 0,
        description: 'A plain ring',
      };

      hero.inventory.push(trinket);

      const result = quickEquip(hero, 0);

      expect(result.message).toBe('Equipped Plain Ring');
    });
  });

  describe('Inventory at capacity', () => {
    it('should swap items even when inventory is full', () => {
      const hero = createHero('Test');

      // Fill inventory to capacity (20 items)
      for (let i = 0; i < 19; i++) {
        hero.inventory.push({
          id: `item${i}`,
          name: `Item ${i}`,
          slot: 'ring1',
          attackBonus: 0,
          defenseBonus: 0,
          description: 'Filler',
        });
      }

      const dagger: EquipmentItem = {
        id: 'dagger1',
        name: 'Dagger',
        slot: 'weapon',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'A dagger',
      };

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      // Equip dagger
      hero.equipment.weapon = dagger;

      // Add sword to fill inventory exactly to 20
      hero.inventory.push(sword);

      expect(hero.inventory.length).toBe(20);

      // Quick-equip sword (should swap with dagger)
      const result = quickEquip(hero, hero.inventory.length - 1);

      expect(result.success).toBe(true);
      expect(hero.equipment.weapon?.id).toBe('sword1');
      expect(hero.inventory.length).toBe(20); // Still 20 (swapped)
      expect(hero.inventory).toContain(dagger);
      expect(hero.inventory).not.toContain(sword);
    });
  });

  describe('Validation and errors', () => {
    it('should reject invalid inventory index (negative)', () => {
      const hero = createHero('Test');

      const result = quickEquip(hero, -1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid inventory index');
    });

    it('should reject invalid inventory index (out of bounds)', () => {
      const hero = createHero('Test');

      const result = quickEquip(hero, 100);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid inventory index');
    });

    it('should reject equipping two-handed weapon when off-hand occupied', () => {
      const hero = createHero('Test');

      // Equip shield in off-hand
      const shield: EquipmentItem = {
        id: 'shield1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A shield',
      };
      hero.equipment.offHand = shield;

      // Try to equip two-handed weapon
      const greatsword: EquipmentItem = {
        id: 'greatsword1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A greatsword',
        isTwoHanded: true,
      };
      hero.inventory.push(greatsword);

      const result = quickEquip(hero, 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain('two-handed weapon');
      expect(result.message).toContain('off-hand');
    });

    it('should reject equipping off-hand when two-handed weapon equipped', () => {
      const hero = createHero('Test');

      // Equip two-handed weapon
      const greatsword: EquipmentItem = {
        id: 'greatsword1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A greatsword',
        isTwoHanded: true,
      };
      hero.equipment.weapon = greatsword;

      // Try to equip shield
      const shield: EquipmentItem = {
        id: 'shield1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A shield',
      };
      hero.inventory.push(shield);

      const result = quickEquip(hero, 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain('two-handed');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty inventory', () => {
      const hero = createHero('Test');
      hero.inventory = [];

      const result = quickEquip(hero, 0);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid inventory index');
    });

    it('should handle single item in inventory', () => {
      const hero = createHero('Test');
      hero.inventory = [];

      const ring: EquipmentItem = {
        id: 'ring1',
        name: 'Ring',
        slot: 'ring1',
        attackBonus: 1,
        defenseBonus: 0,
        description: 'A ring',
      };
      hero.inventory.push(ring);

      const result = quickEquip(hero, 0);

      expect(result.success).toBe(true);
      expect(hero.equipment.ring1?.id).toBe('ring1');
      expect(hero.inventory.length).toBe(0);
    });

    it('should handle items with large stat bonuses', () => {
      const hero = createHero('Test');

      const legendaryWeapon: EquipmentItem = {
        id: 'legendary1',
        name: 'Excalibur',
        slot: 'weapon',
        attackBonus: 100,
        defenseBonus: 50,
        description: 'Legendary',
      };

      hero.inventory.push(legendaryWeapon);

      const result = quickEquip(hero, 0);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Equipped Excalibur (+100 ATK, +50 DEF)');
    });

    it('should handle swapping items multiple times', () => {
      const hero = createHero('Test');

      const item1: EquipmentItem = {
        id: 'item1',
        name: 'Item 1',
        slot: 'weapon',
        attackBonus: 1,
        defenseBonus: 0,
        description: 'Item 1',
      };

      const item2: EquipmentItem = {
        id: 'item2',
        name: 'Item 2',
        slot: 'weapon',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'Item 2',
      };

      const item3: EquipmentItem = {
        id: 'item3',
        name: 'Item 3',
        slot: 'weapon',
        attackBonus: 3,
        defenseBonus: 0,
        description: 'Item 3',
      };

      hero.inventory.push(item1);
      quickEquip(hero, 0);
      expect(hero.equipment.weapon?.id).toBe('item1');

      hero.inventory.push(item2);
      quickEquip(hero, hero.inventory.findIndex(i => i.id === 'item2'));
      expect(hero.equipment.weapon?.id).toBe('item2');
      expect(hero.inventory).toContain(item1);

      hero.inventory.push(item3);
      quickEquip(hero, hero.inventory.findIndex(i => i.id === 'item3'));
      expect(hero.equipment.weapon?.id).toBe('item3');
      expect(hero.inventory).toContain(item2);
    });
  });
});
