import { describe, it, expect } from 'vitest';
import {
  createHero,
  getEffectiveAttack,
  getEffectiveDefense,
  equipItem,
  unequipSlot,
  applyDamage,
  heal,
  BASE_STATS,
} from '../../../src/game/Hero';

describe('Hero', () => {
  describe('createHero', () => {
    it('should create a hero with correct base stats', () => {
      const hero = createHero('TestHero');
      expect(hero.baseStats.hp).toBe(30);
      expect(hero.baseStats.maxHp).toBe(30);
      expect(hero.baseStats.strength).toBe(10);
      expect(hero.baseStats.dexterity).toBe(10);
      expect(hero.baseStats.constitution).toBe(10);
    });

    it('should initialize currentStats equal to baseStats', () => {
      const hero = createHero('TestHero');
      expect(hero.currentStats).toEqual(hero.baseStats);
    });

    it('should have unique IDs', () => {
      const hero1 = createHero('Hero1');
      const hero2 = createHero('Hero2');
      expect(hero1.id).not.toBe(hero2.id);
    });

    it('should trim name to 12 characters', () => {
      const hero = createHero('VeryLongHeroName123');
      expect(hero.name).toBe('VeryLongHero');
      expect(hero.name.length).toBeLessThanOrEqual(12);
    });

    it('should throw on empty name', () => {
      expect(() => createHero('')).toThrow('Hero name cannot be empty');
      expect(() => createHero('   ')).toThrow('Hero name cannot be empty');
    });

    it('should start at level 1 with 0 teeth', () => {
      const hero = createHero('TestHero');
      expect(hero.level).toBe(1);
      expect(hero.teethCurrency).toBe(0);
    });

    it('should be alive on creation', () => {
      const hero = createHero('TestHero');
      expect(hero.isAlive).toBe(true);
    });

    it('should have starting equipment (dagger and shirt)', () => {
      const hero = createHero('TestHero');
      expect(hero.equipment.weapon).not.toBeNull();
      expect(hero.equipment.weapon!.name).toBe("TestHero's Dagger");
      expect(hero.equipment.bodyArmor).not.toBeNull();
      expect(hero.equipment.bodyArmor!.name).toBe("TestHero's Shirt");
    });

    it('should have empty inventory', () => {
      const hero = createHero('TestHero');
      expect(hero.inventory).toEqual([]);
    });

    it('should set playerId', () => {
      const hero = createHero('TestHero', 'player_123');
      expect(hero.playerId).toBe('player_123');
    });

    it('should default playerId to local', () => {
      const hero = createHero('TestHero');
      expect(hero.playerId).toBe('local');
    });

    it('should complete creation in under 1 second', () => {
      const start = performance.now();
      createHero('TestHero');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe('getEffectiveAttack', () => {
    it('should return strength + weapon attackBonus', () => {
      const hero = createHero('TestHero');
      // Strength 10 + dagger attackBonus 2 = 12
      expect(getEffectiveAttack(hero)).toBe(12);
    });

    it('should return just strength if no weapon', () => {
      const hero = createHero('TestHero');
      hero.equipment.weapon = null;
      expect(getEffectiveAttack(hero)).toBe(10);
    });
  });

  describe('getEffectiveDefense', () => {
    it('should return dex/2 + equipment defenseBonus', () => {
      const hero = createHero('TestHero');
      // Dex 10 / 2 = 5, shirt defenseBonus 1 = 6
      expect(getEffectiveDefense(hero)).toBe(6);
    });

    it('should return just dex/2 if no armor', () => {
      const hero = createHero('TestHero');
      hero.equipment.bodyArmor = null;
      expect(getEffectiveDefense(hero)).toBe(5);
    });
  });

  describe('equipItem', () => {
    it('should equip item and return previous', () => {
      const hero = createHero('TestHero');
      const newWeapon = {
        id: 'sword_1',
        name: 'Sword',
        slot: 'weapon' as const,
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sharp sword',
      };
      const previous = equipItem(hero, newWeapon);
      expect(previous).not.toBeNull();
      expect(previous!.name).toBe("TestHero's Dagger");
      expect(hero.equipment.weapon!.name).toBe('Sword');
    });

    it('should return null when equipping to empty slot', () => {
      const hero = createHero('TestHero');
      const ring = {
        id: 'ring_1',
        name: 'Gold Ring',
        slot: 'ring1' as const,
        attackBonus: 0,
        defenseBonus: 1,
        description: 'A gold ring',
      };
      const previous = equipItem(hero, ring);
      expect(previous).toBeNull();
      expect(hero.equipment.ring1!.name).toBe('Gold Ring');
    });
  });

  describe('unequipSlot', () => {
    it('should remove and return equipped item', () => {
      const hero = createHero('TestHero');
      const item = unequipSlot(hero, 'weapon');
      expect(item).not.toBeNull();
      expect(item!.name).toBe("TestHero's Dagger");
      expect(hero.equipment.weapon).toBeNull();
    });

    it('should return null for empty slot', () => {
      const hero = createHero('TestHero');
      const item = unequipSlot(hero, 'helmet');
      expect(item).toBeNull();
    });
  });

  describe('applyDamage', () => {
    it('should reduce hero HP', () => {
      const hero = createHero('TestHero');
      applyDamage(hero, 10);
      expect(hero.currentStats.hp).toBe(20);
    });

    it('should not go below 0 HP', () => {
      const hero = createHero('TestHero');
      applyDamage(hero, 999);
      expect(hero.currentStats.hp).toBe(0);
    });

    it('should mark hero as dead when HP reaches 0', () => {
      const hero = createHero('TestHero');
      applyDamage(hero, 30);
      expect(hero.isAlive).toBe(false);
    });
  });

  describe('heal', () => {
    it('should restore HP', () => {
      const hero = createHero('TestHero');
      applyDamage(hero, 20);
      heal(hero, 10);
      expect(hero.currentStats.hp).toBe(20);
    });

    it('should not exceed maxHp', () => {
      const hero = createHero('TestHero');
      applyDamage(hero, 5);
      heal(hero, 100);
      expect(hero.currentStats.hp).toBe(30);
    });
  });
});
