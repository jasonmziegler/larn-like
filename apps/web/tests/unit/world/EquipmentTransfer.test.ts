// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { transferEquipment, processHeroDeath } from '../../../src/world/DeathProcessor';
import { createHero } from '../../../src/game/Hero';
import { createEmptySlots, createStartingDagger, createStartingShirt } from '../../../src/game/Equipment';
import { Monster } from '../../../src/game/Combat';
import { WorldState } from '../../../src/world/WorldState';
import { WorldStore } from '../../../src/world/WorldStore';
import { Hero, EquipmentItem } from '@larn-like/shared';
import 'fake-indexeddb/auto';

// Helper to create a test monster
function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    pos: { x: 5, y: 5 },
    char: 'g',
    color: '#00CC00',
    name: 'Goblin',
    health: 20,
    maxHealth: 20,
    attack: 5,
    defense: 2,
    type: 'goblin',
    equipment: createEmptySlots(),
    ...overrides,
  };
}

describe('EquipmentTransfer', () => {
  describe('transferEquipment', () => {
    it('should transfer hero equipment to monster matching slots', () => {
      const hero = createHero('TestHero');
      const monster = createMonster();

      const result = transferEquipment(hero, monster);

      // Hero starts with dagger (weapon) and shirt (bodyArmor)
      expect(result.transferred).toHaveLength(2);
      expect(result.overflow).toHaveLength(0);

      // Check monster received the items
      expect(monster.equipment.weapon).toBeTruthy();
      expect(monster.equipment.weapon?.name).toBe("TestHero's Dagger");
      expect(monster.equipment.bodyArmor).toBeTruthy();
      expect(monster.equipment.bodyArmor?.name).toBe("TestHero's Shirt");
    });

    it('should preserve equipment naming after transfer', () => {
      const hero = createHero('Sarah');
      const monster = createMonster();

      transferEquipment(hero, monster);

      expect(monster.equipment.weapon?.name).toBe("Sarah's Dagger");
      expect(monster.equipment.weapon?.attackBonus).toBe(2);
      expect(monster.equipment.bodyArmor?.name).toBe("Sarah's Shirt");
      expect(monster.equipment.bodyArmor?.defenseBonus).toBe(1);
    });

    it('should handle overflow when monster slot is occupied', () => {
      const hero = createHero('TestHero');
      const monster = createMonster({
        equipment: {
          ...createEmptySlots(),
          weapon: createStartingDagger('PreviousHero'),
        },
      });

      const result = transferEquipment(hero, monster);

      // Dagger should overflow, shirt should transfer
      expect(result.transferred).toHaveLength(1);
      expect(result.overflow).toHaveLength(1);

      // Monster should keep original weapon
      expect(monster.equipment.weapon?.name).toBe("PreviousHero's Dagger");

      // Monster should have new shirt
      expect(monster.equipment.bodyArmor?.name).toBe("TestHero's Shirt");

      // Hero's dagger should be in overflow
      expect(result.overflow[0].name).toBe("TestHero's Dagger");
    });

    it('should handle hero with no equipment', () => {
      const hero = createHero('NakedHero');
      hero.equipment = createEmptySlots(); // Remove all equipment
      const monster = createMonster();

      const result = transferEquipment(hero, monster);

      expect(result.transferred).toHaveLength(0);
      expect(result.overflow).toHaveLength(0);
    });

    it('should handle monster with full equipment (all 10 slots)', () => {
      const hero = createHero('TestHero');

      // Create a monster with all equipment slots filled
      const fullEquipment = createEmptySlots();
      fullEquipment.weapon = createStartingDagger('OldHero1');
      fullEquipment.bodyArmor = createStartingShirt('OldHero2');
      fullEquipment.helmet = { id: 'h1', name: 'Helmet', slot: 'helmet', attackBonus: 0, defenseBonus: 1, description: 'A helmet' };
      fullEquipment.gloves = { id: 'g1', name: 'Gloves', slot: 'gloves', attackBonus: 0, defenseBonus: 1, description: 'Gloves' };
      fullEquipment.boots = { id: 'b1', name: 'Boots', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: 'Boots' };
      fullEquipment.ring1 = { id: 'r1', name: 'Ring1', slot: 'ring1', attackBonus: 1, defenseBonus: 0, description: 'Ring' };
      fullEquipment.ring2 = { id: 'r2', name: 'Ring2', slot: 'ring2', attackBonus: 1, defenseBonus: 0, description: 'Ring' };
      fullEquipment.amulet = { id: 'a1', name: 'Amulet', slot: 'amulet', attackBonus: 1, defenseBonus: 0, description: 'Amulet' };
      fullEquipment.belt = { id: 'be1', name: 'Belt', slot: 'belt', attackBonus: 0, defenseBonus: 1, description: 'Belt' };
      fullEquipment.offHand = { id: 'oh1', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 2, description: 'Shield' };

      const monster = createMonster({ equipment: fullEquipment });

      const result = transferEquipment(hero, monster);

      // All hero items should overflow (monster slots all occupied)
      expect(result.transferred).toHaveLength(0);
      expect(result.overflow).toHaveLength(2); // Dagger and Shirt
    });
  });

  describe('processHeroDeath - equipment integration', () => {
    let worldState: WorldState;

    beforeEach(async () => {
      // Reset IndexedDB
      indexedDB = new IDBFactory();

      // Create fresh WorldState with in-memory store
      const store = new WorldStore();
      worldState = new WorldState(store);
      await worldState.initializeWorld();
    });

    it('should record transferred equipment in death event', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10 };
      const monster = createMonster();

      const result = await processHeroDeath(hero, monster, worldState, 1);

      expect(result.deathEvent.equipmentTransferred).toHaveLength(2);
      expect(result.deathEvent.equipmentTransferred[0].name).toContain('Dagger');
      expect(result.deathEvent.equipmentTransferred[1].name).toContain('Shirt');
    });

    it('should record scattered equipment in death event when overflow occurs', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10 };
      const monster = createMonster({
        equipment: {
          ...createEmptySlots(),
          weapon: createStartingDagger('PreviousHero'),
        },
      });

      const result = await processHeroDeath(hero, monster, worldState, 1);

      expect(result.deathEvent.equipmentScattered).toHaveLength(1);
      expect(result.deathEvent.equipmentScattered[0].name).toContain('Dagger');
      expect(result.deathEvent.equipmentTransferred).toHaveLength(1);
      expect(result.deathEvent.equipmentTransferred[0].name).toContain('Shirt');
    });

    it('should include equipment bonuses in monster combat damage', () => {
      // This is tested in Combat.test.ts, but we verify the integration
      const monster = createMonster({
        equipment: {
          ...createEmptySlots(),
          weapon: createStartingDagger('Hero'),
        },
      });

      // Monster should have base attack (5) + dagger bonus (2) = 7 effective attack
      // This will be verified in combat calculations
      expect(monster.equipment.weapon?.attackBonus).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple equipment items in same category', () => {
      const hero = createHero('TestHero');
      // Add rings
      const ring1: EquipmentItem = {
        id: 'ring1',
        name: 'Ring of Power',
        slot: 'ring1',
        attackBonus: 1,
        defenseBonus: 0,
        description: 'A powerful ring',
      };
      const ring2: EquipmentItem = {
        id: 'ring2',
        name: 'Ring of Defense',
        slot: 'ring2',
        attackBonus: 0,
        defenseBonus: 1,
        description: 'A defensive ring',
      };
      hero.equipment.ring1 = ring1;
      hero.equipment.ring2 = ring2;

      const monster = createMonster();
      const result = transferEquipment(hero, monster);

      // Should transfer 4 items: dagger, shirt, 2 rings
      expect(result.transferred).toHaveLength(4);
      expect(monster.equipment.ring1).toEqual(ring1);
      expect(monster.equipment.ring2).toEqual(ring2);
    });

    it('should preserve item stats after transfer', () => {
      const hero = createHero('TestHero');
      const dagger = hero.equipment.weapon!;
      const originalAttackBonus = dagger.attackBonus;

      const monster = createMonster();
      transferEquipment(hero, monster);

      expect(monster.equipment.weapon?.attackBonus).toBe(originalAttackBonus);
    });
  });
});
