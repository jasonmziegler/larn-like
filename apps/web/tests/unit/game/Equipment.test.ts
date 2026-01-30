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
} from '../../../src/game/Equipment';

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
});
