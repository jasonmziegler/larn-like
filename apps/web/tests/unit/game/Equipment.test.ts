import { describe, it, expect } from 'vitest';
import {
  createEmptySlots,
  createStartingDagger,
  createStartingShirt,
  createStartingEquipment,
  isSlotOccupied,
  getEquippedItems,
  getTotalAttackBonus,
  getTotalDefenseBonus,
  validateEquipmentChange,
  isSlotBlocked,
  equipItem,
  unequipItem,
} from '../../../src/game/Equipment';
import { EquipmentItem } from '@larn-like/shared';

describe('Equipment', () => {
  describe('createEmptySlots', () => {
    it('should create all 10 slots as null', () => {
      const slots = createEmptySlots();
      expect(slots.weapon).toBeNull();
      expect(slots.offHand).toBeNull();
      expect(slots.helmet).toBeNull();
      expect(slots.bodyArmor).toBeNull();
      expect(slots.gloves).toBeNull();
      expect(slots.boots).toBeNull();
      expect(slots.ring1).toBeNull();
      expect(slots.ring2).toBeNull();
      expect(slots.amulet).toBeNull();
      expect(slots.belt).toBeNull();
    });
  });

  describe('createStartingDagger', () => {
    it('should create dagger with owner name', () => {
      const dagger = createStartingDagger('TestHero');
      expect(dagger.name).toBe("TestHero's Dagger");
      expect(dagger.slot).toBe('weapon');
      expect(dagger.attackBonus).toBe(2);
      expect(dagger.defenseBonus).toBe(0);
    });
  });

  describe('createStartingShirt', () => {
    it('should create shirt with owner name', () => {
      const shirt = createStartingShirt('TestHero');
      expect(shirt.name).toBe("TestHero's Shirt");
      expect(shirt.slot).toBe('bodyArmor');
      expect(shirt.attackBonus).toBe(0);
      expect(shirt.defenseBonus).toBe(1);
    });
  });

  describe('createStartingEquipment', () => {
    it('should equip dagger in weapon slot', () => {
      const slots = createStartingEquipment('TestHero');
      expect(slots.weapon).not.toBeNull();
      expect(slots.weapon!.slot).toBe('weapon');
    });

    it('should equip shirt in bodyArmor slot', () => {
      const slots = createStartingEquipment('TestHero');
      expect(slots.bodyArmor).not.toBeNull();
      expect(slots.bodyArmor!.slot).toBe('bodyArmor');
    });

    it('should leave other slots empty', () => {
      const slots = createStartingEquipment('TestHero');
      expect(slots.offHand).toBeNull();
      expect(slots.helmet).toBeNull();
      expect(slots.gloves).toBeNull();
      expect(slots.boots).toBeNull();
      expect(slots.ring1).toBeNull();
      expect(slots.ring2).toBeNull();
      expect(slots.amulet).toBeNull();
      expect(slots.belt).toBeNull();
    });
  });

  describe('isSlotOccupied', () => {
    it('should return true for occupied slot', () => {
      const slots = createStartingEquipment('TestHero');
      expect(isSlotOccupied(slots, 'weapon')).toBe(true);
    });

    it('should return false for empty slot', () => {
      const slots = createStartingEquipment('TestHero');
      expect(isSlotOccupied(slots, 'helmet')).toBe(false);
    });
  });

  describe('getEquippedItems', () => {
    it('should return only equipped items', () => {
      const slots = createStartingEquipment('TestHero');
      const items = getEquippedItems(slots);
      expect(items.length).toBe(2);
    });

    it('should return empty array for empty slots', () => {
      const slots = createEmptySlots();
      const items = getEquippedItems(slots);
      expect(items.length).toBe(0);
    });
  });

  describe('getTotalAttackBonus', () => {
    it('should sum attack bonuses from all equipment', () => {
      const slots = createStartingEquipment('TestHero');
      // Dagger attackBonus: 2, Shirt attackBonus: 0
      expect(getTotalAttackBonus(slots)).toBe(2);
    });
  });

  describe('getTotalDefenseBonus', () => {
    it('should sum defense bonuses from all equipment', () => {
      const slots = createStartingEquipment('TestHero');
      // Dagger defenseBonus: 0, Shirt defenseBonus: 1
      expect(getTotalDefenseBonus(slots)).toBe(1);
    });
  });

  describe('validateEquipmentChange', () => {
    it('should allow equipping one-handed weapon when off-hand is empty', () => {
      const slots = createEmptySlots();
      const weapon: EquipmentItem = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A one-handed sword',
        isTwoHanded: false,
      };

      const result = validateEquipmentChange(slots, weapon, 'weapon');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow equipping one-handed weapon when off-hand is occupied', () => {
      const slots = createEmptySlots();
      slots.offHand = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A wooden shield',
      };

      const weapon: EquipmentItem = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A one-handed sword',
        isTwoHanded: false,
      };

      const result = validateEquipmentChange(slots, weapon, 'weapon');
      expect(result.valid).toBe(true);
    });

    it('should block equipping two-handed weapon when off-hand is occupied', () => {
      const slots = createEmptySlots();
      slots.offHand = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A wooden shield',
      };

      const twoHandedWeapon: EquipmentItem = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };

      const result = validateEquipmentChange(slots, twoHandedWeapon, 'weapon');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot equip two-handed weapon while using off-hand item');
    });

    it('should allow equipping two-handed weapon when off-hand is empty', () => {
      const slots = createEmptySlots();
      const twoHandedWeapon: EquipmentItem = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };

      const result = validateEquipmentChange(slots, twoHandedWeapon, 'weapon');
      expect(result.valid).toBe(true);
    });

    it('should block equipping off-hand when two-handed weapon is equipped', () => {
      const slots = createEmptySlots();
      slots.weapon = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };

      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A wooden shield',
      };

      const result = validateEquipmentChange(slots, shield, 'offHand');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot equip off-hand item with two-handed weapon');
    });

    it('should allow equipping off-hand when weapon is one-handed', () => {
      const slots = createEmptySlots();
      slots.weapon = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A one-handed sword',
        isTwoHanded: false,
      };

      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A wooden shield',
      };

      const result = validateEquipmentChange(slots, shield, 'offHand');
      expect(result.valid).toBe(true);
    });

    it('should allow equipping armor slots regardless of weapon type', () => {
      const slots = createEmptySlots();
      slots.weapon = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };

      const helmet: EquipmentItem = {
        id: 'helmet_1',
        name: 'Iron Helmet',
        slot: 'helmet',
        attackBonus: 0,
        defenseBonus: 2,
        description: 'A sturdy iron helmet',
      };

      const result = validateEquipmentChange(slots, helmet, 'helmet');
      expect(result.valid).toBe(true);
    });
  });

  describe('isSlotBlocked', () => {
    it('should return true when off-hand is blocked by two-handed weapon', () => {
      const slots = createEmptySlots();
      slots.weapon = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };

      expect(isSlotBlocked(slots, 'offHand')).toBe(true);
    });

    it('should return false when off-hand is not blocked', () => {
      const slots = createEmptySlots();
      slots.weapon = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A one-handed sword',
        isTwoHanded: false,
      };

      expect(isSlotBlocked(slots, 'offHand')).toBe(false);
    });

    it('should return false for non-offHand slots', () => {
      const slots = createEmptySlots();
      slots.weapon = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };

      expect(isSlotBlocked(slots, 'helmet')).toBe(false);
      expect(isSlotBlocked(slots, 'bodyArmor')).toBe(false);
      expect(isSlotBlocked(slots, 'weapon')).toBe(false);
    });
  });

  describe('equipItem', () => {
    it('should equip item from inventory to empty slot', () => {
      const sword: EquipmentItem = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sharp sword',
      };
      const inventory: EquipmentItem[] = [sword];
      const equipment = createEmptySlots();

      const result = equipItem(inventory, equipment, sword, 'weapon');

      expect(result.success).toBe(true);
      expect(equipment.weapon).toBe(sword);
      expect(inventory.length).toBe(0);
    });

    it('should swap equipped item with inventory item', () => {
      const dagger: EquipmentItem = {
        id: 'dagger_1',
        name: 'Dagger',
        slot: 'weapon',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'A small dagger',
      };
      const sword: EquipmentItem = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sharp sword',
      };

      const inventory: EquipmentItem[] = [sword];
      const equipment = createEmptySlots();
      equipment.weapon = dagger;

      const result = equipItem(inventory, equipment, sword, 'weapon');

      expect(result.success).toBe(true);
      expect(equipment.weapon).toBe(sword);
      expect(inventory).toContain(dagger);
      expect(inventory).not.toContain(sword);
      expect(inventory.length).toBe(1);
    });

    it('should fail if item not in inventory', () => {
      const inventory: EquipmentItem[] = [];
      const equipment = createEmptySlots();
      const sword: EquipmentItem = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sharp sword',
      };

      const result = equipItem(inventory, equipment, sword, 'weapon');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in inventory');
    });

    it('should fail if validation fails (two-handed constraint)', () => {
      const twoHandedWeapon: EquipmentItem = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };
      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A wooden shield',
      };

      const inventory: EquipmentItem[] = [twoHandedWeapon];
      const equipment = createEmptySlots();
      equipment.offHand = shield;

      const result = equipItem(inventory, equipment, twoHandedWeapon, 'weapon');

      expect(result.success).toBe(false);
      expect(result.error).toContain('two-handed weapon');
    });
  });

  describe('unequipItem', () => {
    it('should unequip item and add to inventory', () => {
      const dagger: EquipmentItem = {
        id: 'dagger_1',
        name: 'Dagger',
        slot: 'weapon',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'A small dagger',
      };

      const inventory: EquipmentItem[] = [];
      const equipment = createEmptySlots();
      equipment.weapon = dagger;

      const result = unequipItem(inventory, equipment, 'weapon');

      expect(result.success).toBe(true);
      expect(result.removedItem).toBe(dagger);
      expect(equipment.weapon).toBeNull();
      expect(inventory).toContain(dagger);
      expect(inventory.length).toBe(1);
    });

    it('should fail if no item equipped in slot', () => {
      const inventory: EquipmentItem[] = [];
      const equipment = createEmptySlots();

      const result = unequipItem(inventory, equipment, 'weapon');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No item equipped');
    });

    it('should work for all equipment slots', () => {
      const helmet: EquipmentItem = {
        id: 'helmet_1',
        name: 'Iron Helmet',
        slot: 'helmet',
        attackBonus: 0,
        defenseBonus: 2,
        description: 'A sturdy helmet',
      };

      const inventory: EquipmentItem[] = [];
      const equipment = createEmptySlots();
      equipment.helmet = helmet;

      const result = unequipItem(inventory, equipment, 'helmet');

      expect(result.success).toBe(true);
      expect(equipment.helmet).toBeNull();
      expect(inventory).toContain(helmet);
    });
  });
});
