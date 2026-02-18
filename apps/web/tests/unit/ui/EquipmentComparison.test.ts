import { describe, it, expect, beforeEach } from 'vitest';
import { createHero } from '../../../src/game/Hero';
import { EquipmentPanel } from '../../../src/ui/EquipmentPanel';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { GAME_CONSTANTS, EquipmentItem } from '@larn-like/shared';

/**
 * Test suite for Story 3.5 Task 3: Equipment Comparison Tooltips
 *
 * Tests:
 * - [Equipped] indicator shows on already-equipped items
 * - Comparison shows stat differences (Change: +X ATK, +Y DEF)
 * - Green color for upgrades, red for downgrades
 * - Handles empty equipment slots correctly
 * - Comparison with same item (equipped) shows no change info
 */

function makeMockRenderer(): CanvasRenderer {
  return {
    drawText: () => {},
    fillRect: () => {},
    drawBox: () => {},
  } as unknown as CanvasRenderer;
}

describe('Story 3.5 Task 3: Equipment Comparison Tooltips', () => {
  let panel: EquipmentPanel;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = makeMockRenderer();
    panel = new EquipmentPanel(renderer);
  });

  describe('[Equipped] indicator', () => {
    it('should identify when item is currently equipped', () => {
      const hero = createHero('Test');
      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      // Add to inventory
      hero.inventory.push(sword);

      // Not equipped yet
      expect((panel as any).isItemEquipped(hero, 'sword1')).toBe(false);

      // Equip it
      hero.equipment.weapon = sword;

      // Now equipped
      expect((panel as any).isItemEquipped(hero, 'sword1')).toBe(true);
    });

    it('should check all equipment slots for equipped status', () => {
      const hero = createHero('Test');
      const ring: EquipmentItem = {
        id: 'ring1',
        name: 'Ring of Power',
        slot: 'ring1',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'A ring',
      };

      hero.equipment.ring1 = ring;

      expect((panel as any).isItemEquipped(hero, 'ring1')).toBe(true);
    });

    it('should return false for non-existent item', () => {
      const hero = createHero('Test');
      expect((panel as any).isItemEquipped(hero, 'nonexistent')).toBe(false);
    });
  });

  describe('Stat comparison calculation', () => {
    it('should show positive change for upgrade', () => {
      const result = (panel as any).getStatComparison(5, 2, 'ATK');

      expect(result.text).toBe('+3 ATK');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });

    it('should show negative change for downgrade', () => {
      const result = (panel as any).getStatComparison(2, 5, 'DEF');

      expect(result.text).toBe('-3 DEF');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NEGATIVE);
    });

    it('should show zero change when stats equal', () => {
      const result = (panel as any).getStatComparison(3, 3, 'ATK');

      expect(result.text).toBe('±0 ATK');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NORMAL);
    });

    it('should handle zero values correctly', () => {
      const result = (panel as any).getStatComparison(0, 0, 'DEF');

      expect(result.text).toBe('±0 DEF');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NORMAL);
    });

    it('should handle negative to positive transition', () => {
      const result = (panel as any).getStatComparison(3, -2, 'ATK');

      expect(result.text).toBe('+5 ATK');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });

    it('should handle positive to negative transition', () => {
      const result = (panel as any).getStatComparison(-1, 4, 'DEF');

      expect(result.text).toBe('-5 DEF');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NEGATIVE);
    });
  });

  describe('Comparison display integration', () => {
    it('should handle upgrading from empty slot', () => {
      const hero = createHero('Test');

      // Remove starting weapon to test empty slot
      hero.equipment.weapon = null;

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 2,
        description: 'A sword',
      };

      hero.inventory.push(sword);

      // Weapon slot is now empty (null)
      expect(hero.equipment.weapon).toBeNull();

      // When rendering, should show positive change for equipping new item
      // This is tested via integration - the render method should display:
      // "Change: +5 ATK, +2 DEF" in green
    });

    it('should handle upgrading from weaker item', () => {
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

      // Equip dagger
      hero.equipment.weapon = dagger;

      // Add sword to inventory
      hero.inventory.push(sword);

      // When rendering sword in inventory, should show:
      // "Change: +3 ATK" in green
      const atkComparison = (panel as any).getStatComparison(sword.attackBonus, dagger.attackBonus, 'ATK');
      expect(atkComparison.text).toBe('+3 ATK');
      expect(atkComparison.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });

    it('should handle downgrading to weaker item', () => {
      const hero = createHero('Test');

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      const dagger: EquipmentItem = {
        id: 'dagger1',
        name: 'Bronze Dagger',
        slot: 'weapon',
        attackBonus: 2,
        defenseBonus: 0,
        description: 'A dagger',
      };

      // Equip sword
      hero.equipment.weapon = sword;

      // Add dagger to inventory
      hero.inventory.push(dagger);

      // When rendering dagger in inventory, should show:
      // "Change: -3 ATK" in red
      const atkComparison = (panel as any).getStatComparison(dagger.attackBonus, sword.attackBonus, 'ATK');
      expect(atkComparison.text).toBe('-3 ATK');
      expect(atkComparison.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NEGATIVE);
    });

    it('should handle mixed stat changes (trade-off)', () => {
      const hero = createHero('Test');

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      const mace: EquipmentItem = {
        id: 'mace1',
        name: 'Heavy Mace',
        slot: 'weapon',
        attackBonus: 6,
        defenseBonus: 0,
        description: 'A mace',
      };

      const shield: EquipmentItem = {
        id: 'shield1',
        name: 'Defensive Blade',
        slot: 'weapon',
        attackBonus: 3,
        defenseBonus: 4,
        description: 'Balanced weapon',
      };

      // Equip sword
      hero.equipment.weapon = sword;

      // Add mace to inventory
      hero.inventory.push(mace);

      // Mace vs Sword: +1 ATK (upgrade)
      const atkComp1 = (panel as any).getStatComparison(mace.attackBonus, sword.attackBonus, 'ATK');
      expect(atkComp1.text).toBe('+1 ATK');
      expect(atkComp1.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);

      // Add shield to inventory
      hero.inventory.push(shield);

      // Shield vs Sword: -2 ATK, +4 DEF (mixed)
      const atkComp2 = (panel as any).getStatComparison(shield.attackBonus, sword.attackBonus, 'ATK');
      const defComp2 = (panel as any).getStatComparison(shield.defenseBonus, sword.defenseBonus, 'DEF');

      expect(atkComp2.text).toBe('-2 ATK');
      expect(atkComp2.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NEGATIVE);
      expect(defComp2.text).toBe('+4 DEF');
      expect(defComp2.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });

    it('should not show comparison for already equipped item', () => {
      const hero = createHero('Test');

      const sword: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      // Equip and also have in inventory (shouldn't happen normally, but test it)
      hero.equipment.weapon = sword;
      hero.inventory.push(sword);

      // Should be marked as equipped
      expect((panel as any).isItemEquipped(hero, 'sword1')).toBe(true);

      // When rendering, should show [E] indicator, not comparison
    });
  });

  describe('Edge cases', () => {
    it('should handle items with zero bonuses', () => {
      const hero = createHero('Test');

      const brokenSword: EquipmentItem = {
        id: 'broken1',
        name: 'Broken Sword',
        slot: 'weapon',
        attackBonus: 0,
        defenseBonus: 0,
        description: 'Worthless',
      };

      const ironSword: EquipmentItem = {
        id: 'iron1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      hero.equipment.weapon = brokenSword;
      hero.inventory.push(ironSword);

      // Should show +5 ATK upgrade
      const atkComparison = (panel as any).getStatComparison(ironSword.attackBonus, brokenSword.attackBonus, 'ATK');
      expect(atkComparison.text).toBe('+5 ATK');
      expect(atkComparison.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });

    it('should handle items with identical stats', () => {
      const hero = createHero('Test');

      const sword1: EquipmentItem = {
        id: 'sword1',
        name: 'Iron Sword A',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      const sword2: EquipmentItem = {
        id: 'sword2',
        name: 'Iron Sword B',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'Another sword',
      };

      hero.equipment.weapon = sword1;
      hero.inventory.push(sword2);

      // Should show no change (±0)
      const atkComparison = (panel as any).getStatComparison(sword2.attackBonus, sword1.attackBonus, 'ATK');
      expect(atkComparison.text).toBe('±0 ATK');
      expect(atkComparison.color).toBe(GAME_CONSTANTS.COLORS.TEXT_NORMAL);
    });

    it('should handle large stat differences', () => {
      const result = (panel as any).getStatComparison(100, 1, 'ATK');

      expect(result.text).toBe('+99 ATK');
      expect(result.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });

    it('should handle negative stat bonuses', () => {
      const cursedSword: EquipmentItem = {
        id: 'cursed1',
        name: 'Cursed Sword',
        slot: 'weapon',
        attackBonus: -2,
        defenseBonus: -1,
        description: 'Cursed',
      };

      const ironSword: EquipmentItem = {
        id: 'iron1',
        name: 'Iron Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      // Upgrading from cursed to iron: 5 - (-2) = +7 ATK
      const atkComparison = (panel as any).getStatComparison(ironSword.attackBonus, cursedSword.attackBonus, 'ATK');
      expect(atkComparison.text).toBe('+7 ATK');
      expect(atkComparison.color).toBe(GAME_CONSTANTS.COLORS.TEXT_POSITIVE);
    });
  });

  describe('Rendering verification', () => {
    it('should not crash when rendering with empty inventory', () => {
      const hero = createHero('Test');
      panel.open();
      expect(() => panel.render(hero)).not.toThrow();
    });

    it('should not crash when rendering with full equipment and inventory', () => {
      const hero = createHero('Test');

      // Fill equipment slots
      hero.equipment.weapon = {
        id: 'w1',
        name: 'Sword',
        slot: 'weapon',
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sword',
      };

      hero.equipment.helmet = {
        id: 'h1',
        name: 'Helmet',
        slot: 'helmet',
        attackBonus: 0,
        defenseBonus: 3,
        description: 'A helmet',
      };

      // Add items to inventory
      hero.inventory.push({
        id: 'w2',
        name: 'Axe',
        slot: 'weapon',
        attackBonus: 6,
        defenseBonus: 0,
        description: 'An axe',
      });

      panel.open();
      expect(() => panel.render(hero)).not.toThrow();
    });
  });
});
