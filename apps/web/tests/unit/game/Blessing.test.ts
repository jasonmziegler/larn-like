// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateBlessingChance, attemptBlessing, type ShrineData } from '../../../src/game/Blessing';
import type { EquipmentItem } from '@larn-like/shared';

// Helper to create test equipment items
function createTestItem(
  name: string,
  slot: 'weapon' | 'bodyArmor',
  attackBonus: number,
  defenseBonus: number
): EquipmentItem {
  return {
    id: `item_${name}_${Date.now()}`,
    name,
    slot,
    attackBonus,
    defenseBonus,
    description: '',
  };
}

// Helper to create test shrine data
function createTestShrine(heroName: string, soulEnergy: number): ShrineData {
  return {
    id: `shrine_${heroName}_${Date.now()}`,
    heroName,
    soulEnergy,
  };
}

describe('Blessing System', () => {
  describe('calculateBlessingChance', () => {
    it('should return value between 0.10 and 0.90', () => {
      const shrine = createTestShrine('Bob', 40);
      const item = createTestItem('Dagger', 'weapon', 2, 0);

      const chance = calculateBlessingChance(shrine.soulEnergy, item);

      expect(chance).toBeGreaterThanOrEqual(0.10);
      expect(chance).toBeLessThanOrEqual(0.90);
    });

    it('should increase chance with higher soul energy', () => {
      const item = createTestItem('Dagger', 'weapon', 2, 0);

      const lowEnergyChance = calculateBlessingChance(10, item);
      const highEnergyChance = calculateBlessingChance(100, item);

      expect(highEnergyChance).toBeGreaterThan(lowEnergyChance);
    });

    it('should decrease chance for stronger items', () => {
      const shrine = createTestShrine('Bob', 40);
      const weakItem = createTestItem('Weak Dagger', 'weapon', 1, 0);
      const strongItem = createTestItem('Strong Dagger', 'weapon', 10, 0);

      const weakChance = calculateBlessingChance(shrine.soulEnergy, weakItem);
      const strongChance = calculateBlessingChance(shrine.soulEnergy, strongItem);

      expect(weakChance).toBeGreaterThan(strongChance);
    });

    it('should calculate correct chance for energy 40, Dagger (+2 ATK)', () => {
      const shrine = createTestShrine('Bob', 40);
      const item = createTestItem('Dagger', 'weapon', 2, 0);

      const chance = calculateBlessingChance(shrine.soulEnergy, item);

      // 0.40 + (40 * 0.005) - (2 * 0.03) = 0.40 + 0.20 - 0.06 = 0.54
      expect(chance).toBeCloseTo(0.54, 2);
    });

    it('should calculate correct chance for energy 66, Dagger (+2 ATK)', () => {
      const shrine = createTestShrine('Bob', 66);
      const item = createTestItem('Dagger', 'weapon', 2, 0);

      const chance = calculateBlessingChance(shrine.soulEnergy, item);

      // 0.40 + (66 * 0.005) - (2 * 0.03) = 0.40 + 0.33 - 0.06 = 0.67
      expect(chance).toBeCloseTo(0.67, 2);
    });

    it('should clamp minimum chance to 0.10', () => {
      const shrine = createTestShrine('Bob', 10);
      const strongItem = createTestItem('Epic Sword', 'weapon', 50, 50);

      const chance = calculateBlessingChance(shrine.soulEnergy, strongItem);

      expect(chance).toBe(0.10);
    });

    it('should clamp maximum chance to 0.90', () => {
      const shrine = createTestShrine('Bob', 200);
      const weakItem = createTestItem('Stick', 'weapon', 0, 0);

      const chance = calculateBlessingChance(shrine.soulEnergy, weakItem);

      expect(chance).toBe(0.90);
    });
  });

  describe('attemptBlessing - Success', () => {
    beforeEach(() => {
      // Mock Math.random to always succeed (roll < chance)
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Very low roll = success
    });

    it('should increase weapon attack bonus on success', () => {
      const shrine = createTestShrine('Bob', 60);
      const weapon = createTestItem('Dagger', 'weapon', 2, 0);

      const result = attemptBlessing(shrine, weapon);

      expect(result.success).toBe(true);
      expect(result.item).not.toBeNull();
      expect(result.item!.attackBonus).toBeGreaterThan(weapon.attackBonus);
      expect(result.statChange.attackBonus).toBeGreaterThan(0);
    });

    it('should increase armor defense bonus on success', () => {
      const shrine = createTestShrine('Bob', 80);
      const armor = createTestItem('Shirt', 'bodyArmor', 0, 1);

      const result = attemptBlessing(shrine, armor);

      expect(result.success).toBe(true);
      expect(result.item).not.toBeNull();
      expect(result.item!.defenseBonus).toBeGreaterThan(armor.defenseBonus);
      expect(result.statChange.defenseBonus).toBeGreaterThan(0);
    });

    it('should update item name with blessing attribution', () => {
      const shrine = createTestShrine('Carol', 40);
      const item = createTestItem('Sword', 'weapon', 1, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.success).toBe(true);
      expect(result.item!.name).toContain('(Blessed by Carol)');
    });

    it('should append multiple blessings to item name', () => {
      const shrine1 = createTestShrine('Alice', 40);
      const shrine2 = createTestShrine('Bob', 40);
      const item = createTestItem('Sword', 'weapon', 1, 0);

      const result1 = attemptBlessing(shrine1, item);
      const result2 = attemptBlessing(shrine2, result1.item!);

      expect(result2.success).toBe(true);
      expect(result2.item!.name).toContain('(Blessed by Alice, Bob)');
    });

    it('should switch to count format after 3 blessings', () => {
      const item = createTestItem('Sword', 'weapon', 1, 0);
      const shrines = [
        createTestShrine('Alice', 40),
        createTestShrine('Bob', 40),
        createTestShrine('Carol', 40),
        createTestShrine('Dave', 40),
      ];

      let currentItem = item;
      for (const shrine of shrines) {
        const result = attemptBlessing(shrine, currentItem);
        currentItem = result.item!;
      }

      expect(currentItem.name).toContain('(Blessed x4)');
    });

    it('should add +1 to +3 ATK for weapons based on energy', () => {
      const lowEnergy = createTestShrine('Bob', 30); // ceil(30/30) = 1
      const highEnergy = createTestShrine('Carol', 90); // ceil(90/30) = 3 (capped at 3)
      const weapon = createTestItem('Sword', 'weapon', 0, 0);

      const lowResult = attemptBlessing(lowEnergy, weapon);
      const highResult = attemptBlessing(highEnergy, weapon);

      expect(lowResult.item!.attackBonus).toBe(1);
      expect(highResult.item!.attackBonus).toBe(3); // Capped at 3
    });

    it('should add +1 to +2 DEF for armor based on energy', () => {
      const lowEnergy = createTestShrine('Bob', 40); // ceil(40/40) = 1
      const highEnergy = createTestShrine('Carol', 120); // ceil(120/40) = 3, capped at 2
      const armor = createTestItem('Shirt', 'bodyArmor', 0, 0);

      const lowResult = attemptBlessing(lowEnergy, armor);
      const highResult = attemptBlessing(highEnergy, armor);

      expect(lowResult.item!.defenseBonus).toBe(1);
      expect(highResult.item!.defenseBonus).toBe(2); // Capped at 2
    });

    it('should update item description with blessing note', () => {
      const shrine = createTestShrine('Bob', 40);
      const item = createTestItem('Dagger', 'weapon', 1, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.success).toBe(true);
      expect(result.item!.description).toContain("Blessed at Bob's shrine");
    });
  });

  describe('attemptBlessing - Failure (Degradation)', () => {
    beforeEach(() => {
      // Mock Math.random to always fail (roll > chance), but not destroy
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Failure roll
        .mockReturnValueOnce(0.5);  // No destruction (> 0.10)
    });

    it('should reduce weapon attack bonus on degradation failure', () => {
      const shrine = createTestShrine('Bob', 40);
      const weapon = createTestItem('Dagger', 'weapon', 3, 0);

      const result = attemptBlessing(shrine, weapon);

      expect(result.success).toBe(false);
      expect(result.item).not.toBeNull();
      expect(result.item!.attackBonus).toBe(2); // 3 - 1
      expect(result.statChange.attackBonus).toBe(-1);
    });

    it('should reduce armor defense bonus on degradation failure', () => {
      const shrine = createTestShrine('Bob', 40);
      const armor = createTestItem('Armor', 'bodyArmor', 0, 3);

      const result = attemptBlessing(shrine, armor);

      expect(result.success).toBe(false);
      expect(result.item).not.toBeNull();
      expect(result.item!.defenseBonus).toBe(2); // 3 - 1
      expect(result.statChange.defenseBonus).toBe(-1);
    });

    it('should not reduce stats below 0 on degradation', () => {
      const shrine = createTestShrine('Bob', 40);
      const weapon = createTestItem('Weak Dagger', 'weapon', 0, 0);

      const result = attemptBlessing(shrine, weapon);

      expect(result.success).toBe(false);
      expect(result.item).not.toBeNull();
      expect(result.item!.attackBonus).toBe(0); // Cannot go negative
    });
  });

  describe('attemptBlessing - Failure (Destruction)', () => {
    beforeEach(() => {
      // Mock Math.random to always fail and destroy
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99) // Failure roll
        .mockReturnValueOnce(0.05); // Destruction (< 0.10)
    });

    it('should return null item on destruction failure', () => {
      const shrine = createTestShrine('Bob', 40);
      const item = createTestItem('Cursed Dagger', 'weapon', 5, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.success).toBe(false);
      expect(result.item).toBeNull();
    });

    it('should return appropriate message on destruction', () => {
      const shrine = createTestShrine('Bob', 40);
      const item = createTestItem('Cursed Dagger', 'weapon', 5, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.message).toContain('is destroyed!');
      expect(result.message).toContain("Bob's soul");
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01); // Always succeed for edge case tests
    });

    it('should allow blessing already-blessed items (stats stack)', () => {
      const shrine1 = createTestShrine('Alice', 60);
      const shrine2 = createTestShrine('Bob', 60);
      const weapon = createTestItem('Sword', 'weapon', 2, 0);

      const result1 = attemptBlessing(shrine1, weapon);
      const result2 = attemptBlessing(shrine2, result1.item!);

      expect(result2.success).toBe(true);
      expect(result2.item!.attackBonus).toBeGreaterThan(result1.item!.attackBonus);
    });

    it('should handle item with zero bonuses gracefully', () => {
      const shrine = createTestShrine('Bob', 40);
      const item = createTestItem('Stick', 'weapon', 0, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.success).toBe(true);
      expect(result.item!.attackBonus).toBeGreaterThan(0);
    });

    it('should return shrine hero name in result', () => {
      const shrine = createTestShrine('TestHero', 40);
      const item = createTestItem('Dagger', 'weapon', 1, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.shrineHeroName).toBe('TestHero');
    });

    it('should include shrine name in success message', () => {
      const shrine = createTestShrine('TestHero', 40);
      const item = createTestItem('Dagger', 'weapon', 1, 0);

      const result = attemptBlessing(shrine, item);

      expect(result.message).toContain('TestHero');
    });
  });
});
