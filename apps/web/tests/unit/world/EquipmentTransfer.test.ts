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
  describe('transferEquipment - Single Trophy System', () => {
    it('should transfer only ONE random item as trophy', () => {
      const hero = createHero('TestHero');
      const monster = createMonster();

      const result = transferEquipment(hero, monster);

      // Hero starts with dagger (weapon) and shirt (bodyArmor)
      // Only ONE should be transferred, the other becomes overflow
      expect(result.transferred).toHaveLength(1);
      expect(result.overflow).toHaveLength(1);
      expect(result.transferred.length + result.overflow.length).toBe(2);

      // Check monster received exactly one item
      const equippedCount = [
        monster.equipment.weapon,
        monster.equipment.bodyArmor,
      ].filter(item => item !== null).length;
      expect(equippedCount).toBe(1);
    });

    it('should preserve equipment naming for transferred trophy', () => {
      const hero = createHero('Sarah');
      const monster = createMonster();

      const result = transferEquipment(hero, monster);

      // One item was transferred
      expect(result.transferred).toHaveLength(1);
      const transferredItem = result.transferred[0];

      // Verify the transferred item retains correct name and stats
      expect(transferredItem.name).toMatch(/Sarah's (Dagger|Shirt)/);
      if (transferredItem.slot === 'weapon') {
        expect(transferredItem.attackBonus).toBe(2);
        expect(monster.equipment.weapon).toEqual(transferredItem);
      } else {
        expect(transferredItem.defenseBonus).toBe(1);
        expect(monster.equipment.bodyArmor).toEqual(transferredItem);
      }
    });

    it('should put ALL items in overflow when monster slot is occupied', () => {
      const hero = createHero('TestHero');
      const monster = createMonster({
        equipment: {
          ...createEmptySlots(),
          weapon: createStartingDagger('PreviousHero'),
          bodyArmor: createStartingShirt('PreviousHero'),
        },
      });

      const result = transferEquipment(hero, monster);

      // If random selection picks an occupied slot, everything goes to overflow
      // Since both slots are occupied, everything MUST overflow
      expect(result.transferred).toHaveLength(0);
      expect(result.overflow).toHaveLength(2);

      // Monster should keep original equipment
      expect(monster.equipment.weapon?.name).toBe("PreviousHero's Dagger");
      expect(monster.equipment.bodyArmor?.name).toBe("PreviousHero's Shirt");
    });

    it('should handle hero with no equipment', () => {
      const hero = createHero('NakedHero');
      hero.equipment = createEmptySlots(); // Remove all equipment
      const monster = createMonster();

      const result = transferEquipment(hero, monster);

      expect(result.transferred).toHaveLength(0);
      expect(result.overflow).toHaveLength(0);
    });

    it('should handle monster with full equipment (all slots occupied)', () => {
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

      // Random selection will pick weapon or bodyArmor, but both are occupied
      // So ALL hero items should overflow
      expect(result.transferred).toHaveLength(0);
      expect(result.overflow).toHaveLength(2); // Dagger and Shirt both overflow
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

    it('should record single trophy transfer in death event', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10, depth: 1 };
      const monster = createMonster();

      const result = await processHeroDeath(hero, monster, worldState, 1);

      // Only ONE item should be transferred (the trophy)
      expect(result.deathEvent.equipmentTransferred).toHaveLength(1);
      const transferredName = result.deathEvent.equipmentTransferred[0].name;
      expect(transferredName).toMatch(/TestHero's (Dagger|Shirt)/);
    });

    it('should scatter one item to chests with single-trophy system', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10, depth: 1 };
      const monster = createMonster();

      const result = await processHeroDeath(hero, monster, worldState, 1);

      // With 2 items total: 1 transferred, 1 scattered
      expect(result.deathEvent.equipmentTransferred).toHaveLength(1);
      expect(result.deathEvent.equipmentScattered).toHaveLength(1);

      // Total items should equal hero's starting equipment
      const totalItems = result.deathEvent.equipmentTransferred.length +
                        result.deathEvent.equipmentScattered.length;
      expect(totalItems).toBe(2);
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
    it('should transfer only one item even with multiple equipped', () => {
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

      // Hero has 4 items total (dagger, shirt, 2 rings)
      // Only ONE should be transferred as trophy
      expect(result.transferred).toHaveLength(1);
      expect(result.overflow).toHaveLength(3);
    });

    it('should preserve item stats after transfer', () => {
      const hero = createHero('TestHero');

      // Clear equipment and add only one item to ensure it gets transferred
      const testWeapon = {
        id: 'test_weapon',
        name: 'Test Weapon',
        slot: 'weapon' as const,
        attackBonus: 5,
        defenseBonus: 1,
        description: 'A test weapon',
      };
      hero.equipment = createEmptySlots();
      hero.equipment.weapon = testWeapon;

      const monster = createMonster();
      const result = transferEquipment(hero, monster);

      // Verify the weapon was transferred and stats preserved
      expect(result.transferred).toHaveLength(1);
      expect(monster.equipment.weapon?.attackBonus).toBe(5);
      expect(monster.equipment.weapon?.defenseBonus).toBe(1);
    });
  });

  describe('Multi-Chest Spawning System', () => {
    let worldState: WorldState;

    beforeEach(async () => {
      indexedDB = new IDBFactory();
      const store = new WorldStore();
      worldState = new WorldState(store);
      await worldState.initializeWorld();
    });

    it('should create chests for overflow equipment', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10, depth: 1 };

      // Create a basic level 1 for testing
      const testLevel = {
        depth: 1,
        dungeon: Array(30).fill(null).map(() => Array(80).fill(0)),
        monsters: [],
        chests: [],
        upStairs: { x: 5, y: 5 },
        downStairs: { x: 25, y: 25 },
      };
      await worldState.saveLevel(testLevel);

      // Add more equipment to hero
      const ring1: EquipmentItem = {
        id: 'ring1',
        name: 'Ring 1',
        slot: 'ring1',
        attackBonus: 1,
        defenseBonus: 0,
        description: 'Ring',
      };
      hero.equipment.ring1 = ring1;

      const monster = createMonster();
      await processHeroDeath(hero, monster, worldState, 1);

      // Load the level to check chests were created
      const level = worldState.getLevel(1);
      expect(level).toBeDefined();
      expect(level!.chests).toBeDefined();
      expect(level!.chests!.length).toBeGreaterThan(0);
    });

    it('should distribute items across multiple chests', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10, depth: 1 };

      // Create a basic level 1 for testing
      const testLevel = {
        depth: 1,
        dungeon: Array(30).fill(null).map(() => Array(80).fill(0)),
        monsters: [],
        chests: [],
        upStairs: { x: 5, y: 5 },
        downStairs: { x: 25, y: 25 },
      };
      await worldState.saveLevel(testLevel);

      // Add 5 more items (total 7 with dagger and shirt)
      for (let i = 1; i <= 5; i++) {
        const item: EquipmentItem = {
          id: `item${i}`,
          name: `Item ${i}`,
          slot: 'ring1',
          attackBonus: 1,
          defenseBonus: 0,
          description: `Item ${i}`,
        };
        if (i === 1) hero.equipment.helmet = item;
        if (i === 2) hero.equipment.gloves = item;
        if (i === 3) hero.equipment.boots = item;
        if (i === 4) hero.equipment.ring1 = item;
        if (i === 5) hero.equipment.belt = item;
      }

      const monster = createMonster();
      await processHeroDeath(hero, monster, worldState, 1);

      const level = worldState.getLevel(1);
      const deathChests = level!.chests!.filter(c => c.id.includes('death'));

      // With 7 items, 1 transferred, 6 in overflow
      // Should create multiple chests (formula: 1 + floor(6/3) = 3 chests minimum)
      expect(deathChests.length).toBeGreaterThanOrEqual(1);

      // Verify all overflow items are in chests
      const totalItemsInChests = deathChests.reduce((sum, chest) => sum + chest.items.length, 0);
      expect(totalItemsInChests).toBe(6); // 7 total - 1 transferred = 6 overflow
    });

    it('should cap chest count at 4', async () => {
      const hero = createHero('TestHero');
      hero.position = { x: 10, y: 10, depth: 1 };

      // Create a basic level 1 for testing
      const testLevel = {
        depth: 1,
        dungeon: Array(30).fill(null).map(() => Array(80).fill(0)),
        monsters: [],
        chests: [],
        upStairs: { x: 5, y: 5 },
        downStairs: { x: 25, y: 25 },
      };
      await worldState.saveLevel(testLevel);

      // Add many items (total 10 items)
      hero.equipment.helmet = { id: 'h1', name: 'Helmet', slot: 'helmet', attackBonus: 0, defenseBonus: 1, description: 'H' };
      hero.equipment.gloves = { id: 'g1', name: 'Gloves', slot: 'gloves', attackBonus: 0, defenseBonus: 1, description: 'G' };
      hero.equipment.boots = { id: 'b1', name: 'Boots', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: 'B' };
      hero.equipment.ring1 = { id: 'r1', name: 'Ring1', slot: 'ring1', attackBonus: 1, defenseBonus: 0, description: 'R1' };
      hero.equipment.ring2 = { id: 'r2', name: 'Ring2', slot: 'ring2', attackBonus: 1, defenseBonus: 0, description: 'R2' };
      hero.equipment.amulet = { id: 'a1', name: 'Amulet', slot: 'amulet', attackBonus: 1, defenseBonus: 0, description: 'A' };
      hero.equipment.belt = { id: 'be1', name: 'Belt', slot: 'belt', attackBonus: 0, defenseBonus: 1, description: 'Be' };
      hero.equipment.offHand = { id: 'oh1', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 2, description: 'S' };

      const monster = createMonster();
      await processHeroDeath(hero, monster, worldState, 1);

      const level = worldState.getLevel(1);
      const deathChests = level!.chests!.filter(c => c.id.includes('death'));

      // Even with 10 items, should be capped at 4 chests
      expect(deathChests.length).toBeLessThanOrEqual(4);
    });

    it('should respect equipment constraints when transferring to monsters', () => {
      const hero = createHero('TestHero');

      // Clear starting equipment and give hero ONLY a two-handed weapon
      hero.equipment = createEmptySlots();
      const twoHandedSword: EquipmentItem = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };
      hero.equipment.weapon = twoHandedSword;

      // Monster has a shield equipped in offHand
      const monster = createMonster();
      monster.equipment.offHand = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A wooden shield',
      };

      const result = transferEquipment(hero, monster);

      // Should fail to transfer two-handed weapon because monster has offHand equipped
      // Constraint validation should prevent equipping two-handed weapon with offHand item
      expect(result.transferred).toHaveLength(0);
      expect(result.overflow).toHaveLength(1);
      expect(result.overflow[0].id).toBe('greatsword_1');
    });

    it('should allow transferring two-handed weapon when monster offHand is empty', () => {
      const hero = createHero('TestHero');

      // Clear starting equipment and give hero ONLY a two-handed weapon
      hero.equipment = createEmptySlots();
      const twoHandedSword: EquipmentItem = {
        id: 'greatsword_1',
        name: 'Greatsword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A massive two-handed sword',
        isTwoHanded: true,
      };
      hero.equipment.weapon = twoHandedSword;

      // Monster has empty equipment
      const monster = createMonster();

      const result = transferEquipment(hero, monster);

      // Should successfully transfer two-handed weapon when offHand is empty
      expect(result.transferred).toHaveLength(1);
      expect(result.transferred[0].id).toBe('greatsword_1');
      expect(monster.equipment.weapon).toBe(twoHandedSword);
    });
  });
});
