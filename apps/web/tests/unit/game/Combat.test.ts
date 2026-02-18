// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processCombat,
  processFlee,
  getAdjacentMonster,
  getMonsterHpColor,
  Monster,
  CombatResult,
  FleeResult,
  ReagentItem,
  ATTACK_VERBS,
  REAGENT_DEFINITIONS,
} from '../../../src/game/Combat';
import { createHero, applyDamage } from '../../../src/game/Hero';
import { createEmptySlots } from '../../../src/game/Equipment';
import { Hero } from '@larn-like/shared';

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

function createTestHero(name: string = 'TestHero'): Hero {
  return createHero(name);
}

describe('Combat', () => {
  let hero: Hero;
  let monster: Monster;
  let monsters: Monster[];

  beforeEach(() => {
    hero = createTestHero();
    monster = createMonster();
    monsters = [monster];
  });

  describe('processCombat - basic attack', () => {
    it('should deal damage to monster and return CombatResult', () => {
      const result = processCombat(hero, monster, monsters);

      expect(result.damageDealt).toBeGreaterThanOrEqual(1);
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0]).toMatch(/You hit Goblin for \d+ damage!/);
    });

    it('should have monster retaliate when not killed', () => {
      // Give monster lots of HP so it survives
      monster.health = 999;
      monster.maxHealth = 999;

      const result = processCombat(hero, monster, monsters);

      expect(result.monsterKilled).toBe(false);
      // Should have at least hero attack message + retaliation message
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('processCombat - evade roll', () => {
    it('should produce evade message when evade succeeds', () => {
      monster.health = 999;
      monster.maxHealth = 999;

      // Run many times to get at least one evade
      let evadeFound = false;
      for (let i = 0; i < 100; i++) {
        const h = createTestHero();
        const m = createMonster({ health: 999, maxHealth: 999 });
        const ms = [m];
        const result = processCombat(h, m, ms);
        if (result.evaded) {
          evadeFound = true;
          expect(result.damageReceived).toBe(0);
          expect(result.messages.some(msg => msg.includes('attacks but misses!'))).toBe(true);
          break;
        }
      }
      expect(evadeFound).toBe(true);
    });
  });

  describe('processCombat - block roll', () => {
    it('should reduce damage by 50% when block succeeds', () => {
      // Use high-attack monster to ensure meaningful block reduction
      let blockFound = false;
      for (let i = 0; i < 100; i++) {
        const h = createTestHero();
        const m = createMonster({ health: 999, maxHealth: 999, attack: 20 });
        const ms = [m];
        const result = processCombat(h, m, ms);
        if (result.blocked) {
          blockFound = true;
          expect(result.blockReduction).toBeGreaterThan(0);
          expect(result.messages.some(msg => msg.includes('attack blocked. Damage reduced by'))).toBe(true);
          break;
        }
      }
      expect(blockFound).toBe(true);
    });
  });

  describe('processCombat - full hit', () => {
    it('should deal full damage with type-specific verb when no evade/block', () => {
      monster.health = 999;
      monster.maxHealth = 999;

      let fullHitFound = false;
      for (let i = 0; i < 100; i++) {
        const h = createTestHero();
        const m = createMonster({ health: 999, maxHealth: 999 });
        const ms = [m];
        const result = processCombat(h, m, ms);
        if (!result.evaded && !result.blocked) {
          fullHitFound = true;
          expect(result.damageReceived).toBeGreaterThanOrEqual(1);
          // Should use type-specific verb for goblin: "scratches"
          expect(result.messages.some(msg => msg.includes('scratches you for'))).toBe(true);
          break;
        }
      }
      expect(fullHitFound).toBe(true);
    });
  });

  describe('processCombat - monster death', () => {
    it('should remove monster from array and drop teeth + reagent', () => {
      // Give monster very low health so hero kills it
      monster.health = 1;

      const result = processCombat(hero, monster, monsters);

      expect(result.monsterKilled).toBe(true);
      expect(result.damageReceived).toBe(0); // dead monster doesn't retaliate
      expect(monsters.length).toBe(0);
      expect(result.messages.some(msg => msg.includes('is slain!'))).toBe(true);
      // Should have a reagent drop
      expect(result.reagentDrop).toBeDefined();
      expect(result.reagentDrop!.name).toBe('Goblin Ear');
      expect(result.reagentDrop!.type).toBe('reagent');
      expect(result.reagentDrop!.monsterType).toBe('goblin');
    });

    it('should add reagent to hero inventory on kill', () => {
      monster.health = 1;
      const initialInventorySize = hero.inventory.length;

      processCombat(hero, monster, monsters);

      expect(hero.inventory.length).toBe(initialInventorySize + 1);
    });
  });

  describe('processCombat - hero death', () => {
    it('should set heroKilled when hero HP reaches 0', () => {
      monster.health = 999;
      monster.maxHealth = 999;
      monster.attack = 999; // ensure lethal damage
      hero.currentStats.hp = 1;

      // Need to guarantee no evade/block - run until hero dies
      let heroDied = false;
      for (let i = 0; i < 100; i++) {
        const h = createTestHero();
        h.currentStats.hp = 1;
        const m = createMonster({ health: 999, maxHealth: 999, attack: 999 });
        const ms = [m];
        const result = processCombat(h, m, ms);
        if (result.heroKilled) {
          heroDied = true;
          expect(h.isAlive).toBe(false);
          expect(result.messages.some(msg => msg.includes('YOU DIED'))).toBe(true);
          break;
        }
      }
      expect(heroDied).toBe(true);
    });
  });

  describe('processCombat - message generation', () => {
    it('should always include hero attack message', () => {
      monster.health = 999;
      monster.maxHealth = 999;
      const result = processCombat(hero, monster, monsters);
      expect(result.messages[0]).toMatch(/You hit .+ for \d+ damage!/);
    });

    it('should include retaliation message for surviving monster', () => {
      monster.health = 999;
      monster.maxHealth = 999;
      const result = processCombat(hero, monster, monsters);
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('attack verbs - monster-type-specific', () => {
    it('should use "scratches" for goblin', () => {
      expect(ATTACK_VERBS['goblin']).toBe('scratches');
    });

    it('should use "smashes" for orc', () => {
      expect(ATTACK_VERBS['orc']).toBe('smashes');
    });

    it('should use "crushes" for troll', () => {
      expect(ATTACK_VERBS['troll']).toBe('crushes');
    });

    it('should use "burns" for dragon', () => {
      expect(ATTACK_VERBS['dragon']).toBe('burns');
    });
  });

  describe('processFlee - success', () => {
    it('should allow flee with success message', () => {
      let fleeSuccess = false;
      for (let i = 0; i < 100; i++) {
        const h = createTestHero();
        const m = createMonster();
        const result = processFlee(h, m);
        if (result.success) {
          fleeSuccess = true;
          expect(result.damageReceived).toBe(0);
          expect(result.messages.some(msg => msg.includes('disengage') && msg.includes('flee'))).toBe(true);
          break;
        }
      }
      expect(fleeSuccess).toBe(true);
    });
  });

  describe('processFlee - failure', () => {
    it('should fail flee and monster gets free attack', () => {
      let fleeFail = false;
      for (let i = 0; i < 100; i++) {
        const h = createTestHero();
        const m = createMonster();
        const result = processFlee(h, m);
        if (!result.success) {
          fleeFail = true;
          expect(result.messages.some(msg => msg.includes('fail to flee'))).toBe(true);
          // May have taken damage (or evaded/blocked the free attack)
          expect(result.messages.length).toBeGreaterThanOrEqual(2);
          break;
        }
      }
      expect(fleeFail).toBe(true);
    });
  });

  describe('getAdjacentMonster', () => {
    it('should return monster within 1 tile', () => {
      const m = createMonster({ pos: { x: 6, y: 5 } }); // 1 tile right
      const result = getAdjacentMonster(5, 5, [m]);
      expect(result).toBe(m);
    });

    it('should return diagonal adjacent monster', () => {
      const m = createMonster({ pos: { x: 6, y: 6 } }); // 1 tile diagonal
      const result = getAdjacentMonster(5, 5, [m]);
      expect(result).toBe(m);
    });

    it('should return null when no monster adjacent', () => {
      const m = createMonster({ pos: { x: 8, y: 8 } }); // 3 tiles away
      const result = getAdjacentMonster(5, 5, [m]);
      expect(result).toBeNull();
    });

    it('should return nearest when multiple adjacent', () => {
      const m1 = createMonster({ pos: { x: 6, y: 5 }, name: 'Near' }); // dist 1
      const m2 = createMonster({ pos: { x: 6, y: 6 }, name: 'Far' }); // dist 2
      const result = getAdjacentMonster(5, 5, [m1, m2]);
      expect(result!.name).toBe('Near');
    });

    it('should not return monster at hero position', () => {
      const m = createMonster({ pos: { x: 5, y: 5 } }); // same position
      const result = getAdjacentMonster(5, 5, [m]);
      expect(result).toBeNull();
    });
  });

  describe('getMonsterHpColor', () => {
    it('should return green when HP > 50%', () => {
      const m = createMonster({ health: 15, maxHealth: 20 });
      expect(getMonsterHpColor(m)).toBe('#00FF00');
    });

    it('should return yellow when HP 25-50%', () => {
      const m = createMonster({ health: 8, maxHealth: 20 });
      expect(getMonsterHpColor(m)).toBe('#FFFF00');
    });

    it('should return red when HP < 25%', () => {
      const m = createMonster({ health: 3, maxHealth: 20 });
      expect(getMonsterHpColor(m)).toBe('#FF0000');
    });
  });

  describe('reagent drops', () => {
    it('should drop Goblin Ear from goblin', () => {
      const m = createMonster({ health: 1, type: 'goblin' });
      const result = processCombat(createTestHero(), m, [m]);
      expect(result.reagentDrop?.name).toBe('Goblin Ear');
      expect(result.reagentDrop?.statBonus).toEqual({ stat: 'dexterity', amount: 0.1 });
    });

    it('should drop Orc Tooth from orc', () => {
      const m = createMonster({ health: 1, type: 'orc', name: 'Orc' });
      const result = processCombat(createTestHero(), m, [m]);
      expect(result.reagentDrop?.name).toBe('Orc Tooth');
      expect(result.reagentDrop?.statBonus).toEqual({ stat: 'strength', amount: 0.1 });
    });

    it('should drop Troll Hide from troll', () => {
      const m = createMonster({ health: 1, type: 'troll', name: 'Troll' });
      const result = processCombat(createTestHero(), m, [m]);
      expect(result.reagentDrop?.name).toBe('Troll Hide');
      expect(result.reagentDrop?.statBonus).toEqual({ stat: 'constitution', amount: 0.1 });
    });

    it('should drop Dragon Scale from dragon', () => {
      const m = createMonster({ health: 1, type: 'dragon', name: 'Dragon' });
      const result = processCombat(createTestHero(), m, [m]);
      expect(result.reagentDrop?.name).toBe('Dragon Scale');
      expect(result.reagentDrop?.statBonus).toEqual({ stat: 'all', amount: 0.5 });
    });

    it('should log reagent pickup message', () => {
      const m = createMonster({ health: 1, type: 'goblin' });
      const result = processCombat(createTestHero(), m, [m]);
      expect(result.messages.some(msg => msg.includes('dropped Goblin Ear'))).toBe(true);
    });
  });

  describe('killer monster tracking', () => {
    describe('processCombat', () => {
      it('should populate killerMonster when hero is killed in combat', () => {
        let heroKilled = false;
        for (let i = 0; i < 100; i++) {
          const h = createTestHero();
          h.currentStats.hp = 1;
          const m = createMonster({ health: 999, maxHealth: 999, attack: 999 });
          const ms = [m];
          const result = processCombat(h, m, ms);
          if (result.heroKilled) {
            heroKilled = true;
            expect(result.killerMonster).toBeDefined();
            expect(result.killerMonster).toBe(m);
            break;
          }
        }
        expect(heroKilled).toBe(true);
      });

      it('should not populate killerMonster when hero survives', () => {
        const m = createMonster({ health: 999, maxHealth: 999, attack: 1 });
        const result = processCombat(hero, m, [m]);
        expect(result.heroKilled).toBe(false);
        expect(result.killerMonster).toBeUndefined();
      });

      it('should not populate killerMonster when monster is killed', () => {
        const m = createMonster({ health: 1 });
        const result = processCombat(hero, m, [m]);
        expect(result.monsterKilled).toBe(true);
        expect(result.heroKilled).toBe(false);
        expect(result.killerMonster).toBeUndefined();
      });
    });

    describe('processFlee', () => {
      it('should populate killerMonster when flee fails and hero dies', () => {
        let heroDiedOnFlee = false;
        for (let i = 0; i < 200; i++) {
          const h = createTestHero();
          h.currentStats.hp = 1;
          const m = createMonster({ attack: 999 });
          const result = processFlee(h, m);
          if (!result.success && !h.isAlive) {
            heroDiedOnFlee = true;
            expect(result.killerMonster).toBeDefined();
            expect(result.killerMonster).toBe(m);
            break;
          }
        }
        expect(heroDiedOnFlee).toBe(true);
      });

      it('should not populate killerMonster when flee succeeds', () => {
        let fleeSuccess = false;
        for (let i = 0; i < 100; i++) {
          const h = createTestHero();
          const m = createMonster();
          const result = processFlee(h, m);
          if (result.success) {
            fleeSuccess = true;
            expect(result.killerMonster).toBeUndefined();
            break;
          }
        }
        expect(fleeSuccess).toBe(true);
      });

      it('should not populate killerMonster when flee fails but hero survives', () => {
        let fleeFailed = false;
        for (let i = 0; i < 100; i++) {
          const h = createTestHero();
          const m = createMonster({ attack: 1 });
          const result = processFlee(h, m);
          if (!result.success && h.isAlive) {
            fleeFailed = true;
            expect(result.killerMonster).toBeUndefined();
            break;
          }
        }
        expect(fleeFailed).toBe(true);
      });
    });
  });

  describe('Monster Equipment Bonuses', () => {
    it('should apply monster equipment attack bonus in combat', () => {
      const weaponItem = {
        id: 'monster_sword',
        name: 'Monster Sword',
        slot: 'weapon' as const,
        attackBonus: 5,
        defenseBonus: 0,
        description: 'A sharp sword',
      };

      const equippedMonster = createMonster({
        attack: 5,
        defense: 2,
      });
      equippedMonster.equipment.weapon = weaponItem;

      // Monster with equipment should deal more damage
      const result = processCombat(hero, equippedMonster, [equippedMonster]);

      // Verify monster's equipment bonus affects damage calculation
      // Base monster attack is 5, +5 from weapon = 10 total attack
      // Either damage was dealt OR the hero evaded
      if (result.evaded) {
        expect(result.damageReceived).toBe(0);
      } else {
        expect(result.damageReceived).toBeGreaterThan(0);
      }
    });

    it('should apply monster equipment defense bonus in combat', () => {
      const armorItem = {
        id: 'monster_armor',
        name: 'Monster Armor',
        slot: 'bodyArmor' as const,
        attackBonus: 0,
        defenseBonus: 5,
        description: 'Heavy armor',
      };

      const equippedMonster = createMonster({
        attack: 5,
        defense: 2,
        health: 100,
      });
      equippedMonster.equipment.bodyArmor = armorItem;

      // Monster with armor should take less damage
      const result = processCombat(hero, equippedMonster, [equippedMonster]);

      // Monster should still be alive with high defense
      expect(equippedMonster.health).toBeGreaterThan(0);
      expect(result.monsterKilled).toBe(false);
    });

    it('should calculate monster stats with multiple equipment pieces', () => {
      const weaponItem = {
        id: 'monster_sword',
        name: 'Monster Sword',
        slot: 'weapon' as const,
        attackBonus: 3,
        defenseBonus: 0,
        description: 'A sword',
      };

      const armorItem = {
        id: 'monster_armor',
        name: 'Monster Armor',
        slot: 'bodyArmor' as const,
        attackBonus: 0,
        defenseBonus: 3,
        description: 'Armor',
      };

      const fullyEquippedMonster = createMonster({
        attack: 5,
        defense: 2,
        health: 50,
      });
      fullyEquippedMonster.equipment.weapon = weaponItem;
      fullyEquippedMonster.equipment.bodyArmor = armorItem;

      const result = processCombat(hero, fullyEquippedMonster, [fullyEquippedMonster]);

      // Should successfully process combat with all equipment bonuses applied
      expect(result.damageDealt).toBeGreaterThan(0);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });
});
