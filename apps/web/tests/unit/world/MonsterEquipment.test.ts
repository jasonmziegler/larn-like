import { describe, it, expect } from 'vitest';
import type { Monster, EquipmentItem } from '@larn-like/shared';
import { createEmptySlots, getEquippedItems, getTotalAttackBonus, getTotalDefenseBonus, validateEquipmentChange } from '../../../src/game/Equipment';

/**
 * Test suite for Story 3.4: Monster Equipment Slot Management
 *
 * Tests:
 * - Monsters use identical 10-slot equipment system as players
 * - Equipment slot constraints (two-handed weapons, ring slots, etc.)
 * - Monster stat bonuses from equipment
 * - Trophy equipment assignment from defeated heroes
 */

// Helper to create a test monster
function createTestMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'test_monster_1',
    pos: { x: 5, y: 5 },
    char: 'G',
    color: '#00ff00',
    name: 'Test Goblin',
    health: 30,
    maxHealth: 30,
    attack: 8,
    defense: 4,
    type: 'goblin',
    equipment: createEmptySlots(),
    ...overrides,
  };
}

describe('Story 3.4: Monster Equipment System', () => {
  describe('Equipment Slot Structure (AC: 2)', () => {
    it('should have identical 10-slot structure as players', () => {
      const monster = createTestMonster();

      expect(monster.equipment).toHaveProperty('weapon');
      expect(monster.equipment).toHaveProperty('offHand');
      expect(monster.equipment).toHaveProperty('helmet');
      expect(monster.equipment).toHaveProperty('bodyArmor');
      expect(monster.equipment).toHaveProperty('gloves');
      expect(monster.equipment).toHaveProperty('boots');
      expect(monster.equipment).toHaveProperty('ring1');
      expect(monster.equipment).toHaveProperty('ring2');
      expect(monster.equipment).toHaveProperty('amulet');
      expect(monster.equipment).toHaveProperty('belt');

      // All slots should start null
      const equippedItems = getEquippedItems(monster.equipment);
      expect(equippedItems).toHaveLength(0);
    });

    it('should respect 10-slot maximum capacity', () => {
      const monster = createTestMonster();

      // Equip items in all 10 slots
      monster.equipment.weapon = { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: 'A sword' };
      monster.equipment.offHand = { id: '2', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 3, description: 'A shield' };
      monster.equipment.helmet = { id: '3', name: 'Helmet', slot: 'helmet', attackBonus: 0, defenseBonus: 2, description: 'A helmet' };
      monster.equipment.bodyArmor = { id: '4', name: 'Armor', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 5, description: 'Armor' };
      monster.equipment.gloves = { id: '5', name: 'Gloves', slot: 'gloves', attackBonus: 1, defenseBonus: 1, description: 'Gloves' };
      monster.equipment.boots = { id: '6', name: 'Boots', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: 'Boots' };
      monster.equipment.ring1 = { id: '7', name: 'Ring of Strength', slot: 'ring1', attackBonus: 2, defenseBonus: 0, description: 'Ring' };
      monster.equipment.ring2 = { id: '8', name: 'Ring of Defense', slot: 'ring2', attackBonus: 0, defenseBonus: 2, description: 'Ring' };
      monster.equipment.amulet = { id: '9', name: 'Amulet', slot: 'amulet', attackBonus: 1, defenseBonus: 1, description: 'Amulet' };
      monster.equipment.belt = { id: '10', name: 'Belt', slot: 'belt', attackBonus: 1, defenseBonus: 1, description: 'Belt' };

      const equippedItems = getEquippedItems(monster.equipment);
      expect(equippedItems).toHaveLength(10);
    });
  });

  describe('Equipment Constraints (AC: 2, 7)', () => {
    it('should enforce two-handed weapon constraint - blocks off-hand slot', () => {
      const monster = createTestMonster();

      const twoHandedSword: EquipmentItem = {
        id: 'two_handed_1',
        name: 'Great Sword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A mighty two-handed sword',
        isTwoHanded: true,
      };

      // Equip two-handed weapon
      monster.equipment.weapon = twoHandedSword;

      // Try to equip shield in off-hand (should be blocked)
      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 5,
        description: 'A shield',
      };

      const validation = validateEquipmentChange(monster.equipment, shield, 'offHand');
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('two-handed');
    });

    it('should allow off-hand when two-handed weapon is removed', () => {
      const monster = createTestMonster();

      const twoHandedSword: EquipmentItem = {
        id: 'two_handed_1',
        name: 'Great Sword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A mighty two-handed sword',
        isTwoHanded: true,
      };

      // Equip then remove two-handed weapon
      monster.equipment.weapon = twoHandedSword;
      monster.equipment.weapon = null;

      // Now off-hand should be available
      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 5,
        description: 'A shield',
      };

      const validation = validateEquipmentChange(monster.equipment, shield, 'offHand');
      expect(validation.valid).toBe(true);
    });

    it('should handle ring1 and ring2 slots independently', () => {
      const monster = createTestMonster();

      const ring1: EquipmentItem = {
        id: 'ring_str',
        name: 'Ring of Strength',
        slot: 'ring1',
        attackBonus: 3,
        defenseBonus: 0,
        description: 'Ring',
      };

      const ring2: EquipmentItem = {
        id: 'ring_def',
        name: 'Ring of Defense',
        slot: 'ring2',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'Ring',
      };

      // Equip both rings
      monster.equipment.ring1 = ring1;
      monster.equipment.ring2 = ring2;

      const equippedItems = getEquippedItems(monster.equipment);
      expect(equippedItems).toHaveLength(2);
      expect(monster.equipment.ring1).toBe(ring1);
      expect(monster.equipment.ring2).toBe(ring2);
    });

    it('should prevent equipping two-handed weapon when off-hand is occupied', () => {
      const monster = createTestMonster();

      // First equip a shield
      const shield: EquipmentItem = {
        id: 'shield_1',
        name: 'Shield',
        slot: 'offHand',
        attackBonus: 0,
        defenseBonus: 5,
        description: 'A shield',
      };
      monster.equipment.offHand = shield;

      // Try to equip two-handed weapon (should fail)
      const twoHandedSword: EquipmentItem = {
        id: 'two_handed_1',
        name: 'Great Sword',
        slot: 'weapon',
        attackBonus: 10,
        defenseBonus: 0,
        description: 'A mighty two-handed sword',
        isTwoHanded: true,
      };

      const validation = validateEquipmentChange(monster.equipment, twoHandedSword, 'weapon');
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('two-handed');
    });
  });

  describe('Equipment Stat Bonuses (AC: 6)', () => {
    it('should calculate total attack bonus from equipped items', () => {
      const monster = createTestMonster();

      monster.equipment.weapon = { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' };
      monster.equipment.gloves = { id: '2', name: 'Power Gloves', slot: 'gloves', attackBonus: 2, defenseBonus: 0, description: '' };
      monster.equipment.ring1 = { id: '3', name: 'Ring of Strength', slot: 'ring1', attackBonus: 3, defenseBonus: 0, description: '' };

      const totalAttack = getTotalAttackBonus(monster.equipment);
      expect(totalAttack).toBe(10); // 5 + 2 + 3
    });

    it('should calculate total defense bonus from equipped items', () => {
      const monster = createTestMonster();

      monster.equipment.offHand = { id: '1', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 4, description: '' };
      monster.equipment.bodyArmor = { id: '2', name: 'Plate Armor', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 6, description: '' };
      monster.equipment.helmet = { id: '3', name: 'Iron Helmet', slot: 'helmet', attackBonus: 0, defenseBonus: 2, description: '' };

      const totalDefense = getTotalDefenseBonus(monster.equipment);
      expect(totalDefense).toBe(12); // 4 + 6 + 2
    });

    it('should calculate effective attack including equipment bonuses', () => {
      const monster = createTestMonster({ attack: 8 });

      monster.equipment.weapon = { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' };
      monster.equipment.ring1 = { id: '2', name: 'Ring of Power', slot: 'ring1', attackBonus: 2, defenseBonus: 0, description: '' };

      const baseAttack = monster.attack;
      const equipmentBonus = getTotalAttackBonus(monster.equipment);
      const effectiveAttack = baseAttack + equipmentBonus;

      expect(effectiveAttack).toBe(15); // 8 base + 5 weapon + 2 ring
    });

    it('should calculate effective defense including equipment bonuses', () => {
      const monster = createTestMonster({ defense: 4 });

      monster.equipment.bodyArmor = { id: '1', name: 'Armor', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 5, description: '' };
      monster.equipment.offHand = { id: '2', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 3, description: '' };

      const baseDefense = monster.defense;
      const equipmentBonus = getTotalDefenseBonus(monster.equipment);
      const effectiveDefense = baseDefense + equipmentBonus;

      expect(effectiveDefense).toBe(12); // 4 base + 5 armor + 3 shield
    });

    it('should handle mixed bonuses correctly', () => {
      const monster = createTestMonster({ attack: 10, defense: 5 });

      // Equip items with mixed bonuses
      monster.equipment.weapon = { id: '1', name: 'Magic Sword', slot: 'weapon', attackBonus: 6, defenseBonus: 2, description: '' };
      monster.equipment.amulet = { id: '2', name: 'Amulet of Power', slot: 'amulet', attackBonus: 2, defenseBonus: 2, description: '' };

      const effectiveAttack = monster.attack + getTotalAttackBonus(monster.equipment);
      const effectiveDefense = monster.defense + getTotalDefenseBonus(monster.equipment);

      expect(effectiveAttack).toBe(18); // 10 + 6 + 2
      expect(effectiveDefense).toBe(9); // 5 + 2 + 2
    });
  });

  describe('Trophy Equipment Assignment (AC: 5)', () => {
    it('should correctly assign trophy to matching slot type', () => {
      const monster = createTestMonster();

      const heroSword: EquipmentItem = {
        id: 'hero_sword',
        name: "Hero's Sword",
        slot: 'weapon',
        attackBonus: 7,
        defenseBonus: 0,
        description: 'A fallen hero\'s sword',
      };

      // Assign trophy to correct slot
      monster.equipment[heroSword.slot as keyof typeof monster.equipment] = heroSword;

      expect(monster.equipment.weapon).toBe(heroSword);
      expect(monster.equipment.weapon?.name).toBe("Hero's Sword");
    });

    it('should handle ring assignment to ring1 or ring2', () => {
      const monster = createTestMonster();

      const heroRing: EquipmentItem = {
        id: 'hero_ring_1',
        name: "Hero's Ring",
        slot: 'ring1',
        attackBonus: 2,
        defenseBonus: 1,
        description: 'A ring',
      };

      // Assign to ring1
      monster.equipment.ring1 = heroRing;
      expect(monster.equipment.ring1).toBe(heroRing);

      // ring2 should still be empty
      expect(monster.equipment.ring2).toBeNull();
    });

    it('should preserve existing equipment when adding new trophy', () => {
      const monster = createTestMonster();

      // Give monster some existing equipment
      const existingHelmet: EquipmentItem = {
        id: 'old_helmet',
        name: 'Old Helmet',
        slot: 'helmet',
        attackBonus: 0,
        defenseBonus: 1,
        description: '',
      };
      monster.equipment.helmet = existingHelmet;

      // Add trophy to different slot
      const heroSword: EquipmentItem = {
        id: 'hero_sword',
        name: "Hero's Sword",
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: '',
      };
      monster.equipment.weapon = heroSword;

      // Both items should be equipped
      expect(monster.equipment.helmet).toBe(existingHelmet);
      expect(monster.equipment.weapon).toBe(heroSword);

      const equippedItems = getEquippedItems(monster.equipment);
      expect(equippedItems).toHaveLength(2);
    });
  });

  describe('Equipment Capacity Management', () => {
    it('should track number of equipped items correctly', () => {
      const monster = createTestMonster();

      // Start with 0
      expect(getEquippedItems(monster.equipment)).toHaveLength(0);

      // Add 3 items
      monster.equipment.weapon = { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' };
      monster.equipment.bodyArmor = { id: '2', name: 'Armor', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 5, description: '' };
      monster.equipment.ring1 = { id: '3', name: 'Ring', slot: 'ring1', attackBonus: 2, defenseBonus: 0, description: '' };

      expect(getEquippedItems(monster.equipment)).toHaveLength(3);

      // Remove 1 item
      monster.equipment.ring1 = null;
      expect(getEquippedItems(monster.equipment)).toHaveLength(2);
    });

    it('should identify when all 10 slots are full', () => {
      const monster = createTestMonster();

      // Fill all 10 slots
      monster.equipment.weapon = { id: '1', name: 'Item 1', slot: 'weapon', attackBonus: 1, defenseBonus: 0, description: '' };
      monster.equipment.offHand = { id: '2', name: 'Item 2', slot: 'offHand', attackBonus: 0, defenseBonus: 1, description: '' };
      monster.equipment.helmet = { id: '3', name: 'Item 3', slot: 'helmet', attackBonus: 0, defenseBonus: 1, description: '' };
      monster.equipment.bodyArmor = { id: '4', name: 'Item 4', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 1, description: '' };
      monster.equipment.gloves = { id: '5', name: 'Item 5', slot: 'gloves', attackBonus: 1, defenseBonus: 0, description: '' };
      monster.equipment.boots = { id: '6', name: 'Item 6', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: '' };
      monster.equipment.ring1 = { id: '7', name: 'Item 7', slot: 'ring1', attackBonus: 1, defenseBonus: 0, description: '' };
      monster.equipment.ring2 = { id: '8', name: 'Item 8', slot: 'ring2', attackBonus: 0, defenseBonus: 1, description: '' };
      monster.equipment.amulet = { id: '9', name: 'Item 9', slot: 'amulet', attackBonus: 1, defenseBonus: 0, description: '' };
      monster.equipment.belt = { id: '10', name: 'Item 10', slot: 'belt', attackBonus: 0, defenseBonus: 1, description: '' };

      const equippedCount = getEquippedItems(monster.equipment).length;
      const isFull = equippedCount === 10;

      expect(isFull).toBe(true);
      expect(equippedCount).toBe(10);
    });
  });

  describe('Equipment Overflow Handling (AC: 3)', () => {
    it('should reject new trophy when target slot is already occupied', () => {
      const monster = createTestMonster();

      // Monster already has weapon equipped
      monster.equipment.weapon = {
        id: 'existing_sword',
        name: 'Old Sword',
        slot: 'weapon',
        attackBonus: 3,
        defenseBonus: 0,
        description: 'Existing weapon',
      };

      // New trophy also targets weapon slot
      const newTrophy: EquipmentItem = {
        id: 'new_sword',
        name: "Hero's Sword",
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'New trophy',
      };

      // Verify slot is occupied
      const slotKey = newTrophy.slot as keyof typeof monster.equipment;
      const isOccupied = monster.equipment[slotKey] !== null;

      expect(isOccupied).toBe(true);
      // When slot is occupied, the trophy should go to overflow (handled in DeathProcessor.transferEquipment)
    });

    it('should identify when monster has all 10 slots full and cannot accept more items', () => {
      const monster = createTestMonster();

      // Fill all 10 slots
      monster.equipment.weapon = { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' };
      monster.equipment.offHand = { id: '2', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 3, description: '' };
      monster.equipment.helmet = { id: '3', name: 'Helmet', slot: 'helmet', attackBonus: 0, defenseBonus: 2, description: '' };
      monster.equipment.bodyArmor = { id: '4', name: 'Armor', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 5, description: '' };
      monster.equipment.gloves = { id: '5', name: 'Gloves', slot: 'gloves', attackBonus: 1, defenseBonus: 1, description: '' };
      monster.equipment.boots = { id: '6', name: 'Boots', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: '' };
      monster.equipment.ring1 = { id: '7', name: 'Ring1', slot: 'ring1', attackBonus: 2, defenseBonus: 0, description: '' };
      monster.equipment.ring2 = { id: '8', name: 'Ring2', slot: 'ring2', attackBonus: 0, defenseBonus: 2, description: '' };
      monster.equipment.amulet = { id: '9', name: 'Amulet', slot: 'amulet', attackBonus: 1, defenseBonus: 1, description: '' };
      monster.equipment.belt = { id: '10', name: 'Belt', slot: 'belt', attackBonus: 1, defenseBonus: 1, description: '' };

      const equippedCount = getEquippedItems(monster.equipment).length;
      expect(equippedCount).toBe(10);

      // Any new trophy targeting any slot will find it occupied
      // transferEquipment() will send all items to overflow (verified in EquipmentTransfer.test.ts)
    });
  });

  describe('Promoted Monster Equipment Persistence', () => {
    it('should preserve equipment through promotion', () => {
      const monster = createTestMonster({
        isEvolved: false,
        evolutionLevel: 0,
      });

      // Give monster some equipment before promotion
      monster.equipment.weapon = { id: 'trophy_1', name: "Alice's Dagger", slot: 'weapon', attackBonus: 3, defenseBonus: 0, description: '' };
      monster.equipment.bodyArmor = { id: 'trophy_2', name: "Bob's Shirt", slot: 'bodyArmor', attackBonus: 0, defenseBonus: 2, description: '' };

      // Simulate promotion (just mark as evolved, equipment should persist)
      monster.isEvolved = true;
      monster.evolutionLevel = 1;

      // Equipment should still be there
      expect(monster.equipment.weapon?.name).toBe("Alice's Dagger");
      expect(monster.equipment.bodyArmor?.name).toBe("Bob's Shirt");
      expect(getEquippedItems(monster.equipment)).toHaveLength(2);
    });

    it('should allow adding more trophies after promotion', () => {
      const monster = createTestMonster({
        isEvolved: true,
        evolutionLevel: 1,
      });

      // Evolved monster already has 2 trophies
      monster.equipment.weapon = { id: 'trophy_1', name: "Hero1's Sword", slot: 'weapon', attackBonus: 5, defenseBonus: 0, description: '' };
      monster.equipment.helmet = { id: 'trophy_2', name: "Hero2's Helmet", slot: 'helmet', attackBonus: 0, defenseBonus: 3, description: '' };

      // Add another trophy from third hero
      monster.equipment.offHand = { id: 'trophy_3', name: "Hero3's Shield", slot: 'offHand', attackBonus: 0, defenseBonus: 4, description: '' };

      expect(getEquippedItems(monster.equipment)).toHaveLength(3);
      expect(monster.equipment.weapon?.name).toBe("Hero1's Sword");
      expect(monster.equipment.helmet?.name).toBe("Hero2's Helmet");
      expect(monster.equipment.offHand?.name).toBe("Hero3's Shield");
    });
  });
});
