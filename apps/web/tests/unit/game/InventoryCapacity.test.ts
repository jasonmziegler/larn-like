import { describe, it, expect } from 'vitest';
import { createHero } from '../../../src/game/Hero';
import {
  getInventorySize,
  canAddToInventory,
  isInventoryFull,
  getCapacityString,
  dropItem,
  purchaseItem,
} from '../../../src/game/Inventory';
import { GAME_CONSTANTS, MerchantItem } from '@larn-like/shared';
import { ReagentItem } from '../../../src/game/Combat';

/**
 * Test suite for Story 3.5 Task 1: Inventory Capacity System
 *
 * Tests:
 * - MAX_INVENTORY_SIZE constant (20 items)
 * - Inventory capacity checks
 * - Capacity UI display
 * - Item pickup rejection when full
 * - Drop item functionality
 * - Merchant purchase respects capacity
 */

function addReagent(hero: ReturnType<typeof createHero>, reagent: ReagentItem): void {
  (hero.inventory as unknown[]).push(reagent);
}

function makeReagent(monsterType: string, name: string): ReagentItem {
  return {
    id: `reagent_${monsterType}_${Date.now()}_${Math.random()}`,
    name,
    type: 'reagent',
    monsterType,
    statBonus: { stat: 'dexterity', amount: 0.1 },
  };
}

describe('Story 3.5 Task 1: Inventory Capacity System', () => {
  describe('MAX_INVENTORY_SIZE constant', () => {
    it('should be defined as 20 items', () => {
      expect(GAME_CONSTANTS.MAX_INVENTORY_SIZE).toBe(20);
    });
  });

  describe('Inventory size tracking', () => {
    it('should return 0 for empty inventory', () => {
      const hero = createHero('Test');
      expect(getInventorySize(hero)).toBe(0);
    });

    it('should count reagents in inventory', () => {
      const hero = createHero('Test');
      addReagent(hero, makeReagent('goblin', 'Goblin Ear'));
      addReagent(hero, makeReagent('goblin', 'Goblin Ear'));
      addReagent(hero, makeReagent('orc', 'Orc Tooth'));

      expect(getInventorySize(hero)).toBe(3);
    });

    it('should count equipment items in inventory', () => {
      const hero = createHero('Test');
      hero.inventory.push({
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      });
      hero.inventory.push({
        id: 'shield1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A shield',
      });

      expect(getInventorySize(hero)).toBe(2);
    });

    it('should count both reagents and equipment', () => {
      const hero = createHero('Test');
      addReagent(hero, makeReagent('goblin', 'Goblin Ear'));
      hero.inventory.push({
        id: 'sword1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      });

      expect(getInventorySize(hero)).toBe(2);
    });
  });

  describe('Capacity checks', () => {
    it('should allow adding items when under capacity', () => {
      const hero = createHero('Test');
      for (let i = 0; i < 10; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(canAddToInventory(hero)).toBe(true);
      expect(canAddToInventory(hero, 5)).toBe(true);
      expect(canAddToInventory(hero, 10)).toBe(true);
    });

    it('should reject adding items when at capacity', () => {
      const hero = createHero('Test');
      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(canAddToInventory(hero)).toBe(false);
      expect(canAddToInventory(hero, 1)).toBe(false);
    });

    it('should reject adding items when it would exceed capacity', () => {
      const hero = createHero('Test');
      for (let i = 0; i < 18; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(canAddToInventory(hero, 1)).toBe(true);
      expect(canAddToInventory(hero, 2)).toBe(true);
      expect(canAddToInventory(hero, 3)).toBe(false);
    });

    it('should correctly identify full inventory', () => {
      const hero = createHero('Test');

      expect(isInventoryFull(hero)).toBe(false);

      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(isInventoryFull(hero)).toBe(true);
    });
  });

  describe('Capacity UI display', () => {
    it('should show "0/20" for empty inventory', () => {
      const hero = createHero('Test');
      expect(getCapacityString(hero)).toBe('0/20');
    });

    it('should show "5/20" for 5 items', () => {
      const hero = createHero('Test');
      for (let i = 0; i < 5; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(getCapacityString(hero)).toBe('5/20');
    });

    it('should show "20/20" for full inventory', () => {
      const hero = createHero('Test');
      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(getCapacityString(hero)).toBe('20/20');
    });
  });

  describe('Drop item functionality', () => {
    it('should drop item from inventory', () => {
      const hero = createHero('Test');
      hero.inventory.push({
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      });

      const result = dropItem(hero, 0, { x: 10, y: 10 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Dropped Iron Sword');
      expect(result.droppedItem).toBeDefined();
      expect(result.droppedItem!.item.name).toBe('Iron Sword');
      expect(result.droppedItem!.pos).toEqual({ x: 10, y: 10 });
      expect(hero.inventory.length).toBe(0);
    });

    it('should remove dropped item from inventory', () => {
      const hero = createHero('Test');
      addReagent(hero, makeReagent('goblin', 'Goblin Ear 1'));
      addReagent(hero, makeReagent('goblin', 'Goblin Ear 2'));
      addReagent(hero, makeReagent('goblin', 'Goblin Ear 3'));

      expect(hero.inventory.length).toBe(3);

      dropItem(hero, 1, { x: 5, y: 5 });

      expect(hero.inventory.length).toBe(2);
      expect((hero.inventory[0] as ReagentItem).name).toBe('Goblin Ear 1');
      expect((hero.inventory[1] as ReagentItem).name).toBe('Goblin Ear 3');
    });

    it('should reject invalid inventory index', () => {
      const hero = createHero('Test');
      addReagent(hero, makeReagent('goblin', 'Goblin Ear'));

      const result1 = dropItem(hero, -1, { x: 5, y: 5 });
      expect(result1.success).toBe(false);
      expect(result1.message).toBe('Invalid inventory index');

      const result2 = dropItem(hero, 5, { x: 5, y: 5 });
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('Invalid inventory index');
    });

    it('should create dropped item entity with correct properties', () => {
      const hero = createHero('Test');
      hero.inventory.push({
        id: 'shield1',
        name: 'Wooden Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A shield',
      });

      const result = dropItem(hero, 0, { x: 12, y: 15 });

      expect(result.droppedItem).toBeDefined();
      expect(result.droppedItem!.id).toContain('dropped_');
      expect(result.droppedItem!.char).toBe('/');
      expect(result.droppedItem!.color).toBe('#FFAA00');
      expect(result.droppedItem!.pos).toEqual({ x: 12, y: 15 });
    });
  });

  describe('Merchant purchase capacity check', () => {
    it('should allow purchase when inventory not full', () => {
      const hero = createHero('Test');
      hero.teethCurrency = 100;

      const item: MerchantItem = {
        id: 'merchant_sword',
        name: 'Merchant Sword',
        slot: 'weapon',
        attackBonus: 6,
        defenseBonus: 0,
        description: 'A sword from merchant',
        isTwoHanded: false,
        basePrice: 50,
      };

      const result = purchaseItem(hero, item, 50);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Purchased');
      expect(hero.inventory.length).toBe(1);
      expect(hero.teethCurrency).toBe(50);
    });

    it('should reject purchase when inventory full', () => {
      const hero = createHero('Test');
      hero.teethCurrency = 1000;

      // Fill inventory to capacity
      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      const item: MerchantItem = {
        id: 'merchant_sword',
        name: 'Merchant Sword',
        slot: 'weapon',
        attackBonus: 6,
        defenseBonus: 0,
        description: 'A sword from merchant',
        isTwoHanded: false,
        basePrice: 50,
      };

      const result = purchaseItem(hero, item, 50);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Inventory is full');
      expect(result.message).toContain('20/20');
      expect(hero.inventory.length).toBe(20);
      expect(hero.teethCurrency).toBe(1000); // Teeth not deducted
    });

    it('should check capacity before deducting teeth', () => {
      const hero = createHero('Test');
      hero.teethCurrency = 100;

      // Fill inventory
      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      const item: MerchantItem = {
        id: 'merchant_item',
        name: 'Expensive Item',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'Expensive',
        isTwoHanded: false,
        basePrice: 90,
      };

      const result = purchaseItem(hero, item, 90);

      expect(result.success).toBe(false);
      expect(hero.teethCurrency).toBe(100); // Teeth should NOT be deducted
    });
  });

  describe('Edge cases', () => {
    it('should handle exactly 20 items', () => {
      const hero = createHero('Test');

      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(getInventorySize(hero)).toBe(20);
      expect(isInventoryFull(hero)).toBe(true);
      expect(canAddToInventory(hero)).toBe(false);
    });

    it('should handle 19 items (one slot remaining)', () => {
      const hero = createHero('Test');

      for (let i = 0; i < 19; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(getInventorySize(hero)).toBe(19);
      expect(isInventoryFull(hero)).toBe(false);
      expect(canAddToInventory(hero, 1)).toBe(true);
      expect(canAddToInventory(hero, 2)).toBe(false);
    });

    it('should allow adding after dropping items', () => {
      const hero = createHero('Test');

      // Fill to capacity
      for (let i = 0; i < 20; i++) {
        addReagent(hero, makeReagent('goblin', `Reagent ${i}`));
      }

      expect(isInventoryFull(hero)).toBe(true);

      // Drop 3 items
      dropItem(hero, 0, { x: 1, y: 1 });
      dropItem(hero, 0, { x: 2, y: 2 });
      dropItem(hero, 0, { x: 3, y: 3 });

      expect(getInventorySize(hero)).toBe(17);
      expect(canAddToInventory(hero, 3)).toBe(true);
      expect(canAddToInventory(hero, 4)).toBe(false);
    });
  });
});
