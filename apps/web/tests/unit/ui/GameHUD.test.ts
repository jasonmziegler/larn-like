// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { GameHUD } from '../../../src/ui/GameHUD';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { createHero } from '../../../src/game/Hero';
import { LAYOUT, GAME_CONSTANTS } from '@larn-like/shared';
import { Monster } from '../../../src/game/Combat';

function createMockRenderer(): CanvasRenderer {
  return {
    clear: vi.fn(),
    drawChar: vi.fn(),
    drawText: vi.fn(),
    drawBox: vi.fn(),
    fillRect: vi.fn(),
    getCanvas: vi.fn(),
    getContext: vi.fn(),
    getColorManager: vi.fn(),
  } as unknown as CanvasRenderer;
}

describe('GameHUD', () => {
  describe('renderStatusBar', () => {
    it('should render HP, ATK, DEF, Teeth, Level, and Monsters', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');

      hud.renderStatusBar(hero, 3, 2, LAYOUT.ROW_STATUS_BAR);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('HP:30/30');
      expect(allText).toContain('ATK:12');
      expect(allText).toContain('DEF:6');
      expect(allText).toContain('Teeth:0');
      expect(allText).toContain('Lvl:2');
      expect(allText).toContain('Mon:3');
    });

    it('should display Town when depth is 0', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');

      hud.renderStatusBar(hero, 0, 0, LAYOUT.ROW_STATUS_BAR);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('Town');
    });

    it('should use critical color when HP is low', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');
      hero.currentStats.hp = 5;

      hud.renderStatusBar(hero, 0, 1, LAYOUT.ROW_STATUS_BAR);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      // First call is HP text, should use HEALTH_CRITICAL color
      const hpCall = calls.find((c: unknown[]) => (c[0] as string).startsWith('HP:'));
      expect(hpCall![3]).toBe('#FF0000');
    });
  });

  describe('renderStatsPanel', () => {
    it('should render hero name, level, and all stats', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');

      hud.renderStatsPanel(hero, 0, 0);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('TestHero Lv1');
      expect(allText).toContain('HP: 30/30');
      expect(allText).toContain('STR: 10');
      expect(allText).toContain('DEX: 10');
      expect(allText).toContain('CON: 10');
      expect(allText).toContain('ATK: 12');
      expect(allText).toContain('DEF: 6');
    });
  });

  describe('renderAdjacentMonster', () => {
    it('should render monster info when monster is provided', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const monster: Monster = {
        pos: { x: 5, y: 5 },
        char: 'g',
        color: '#00CC00',
        name: 'Goblin',
        health: 8,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        type: 'goblin',
      };

      hud.renderAdjacentMonster(monster, LAYOUT.ROW_MONSTER_INFO);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');
      expect(allText).toContain('g Goblin HP:8/10');
    });

    it('should not render anything when monster is null', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);

      hud.renderAdjacentMonster(null, LAYOUT.ROW_MONSTER_INFO);

      expect(renderer.drawText).not.toHaveBeenCalled();
    });

    it('should use green color for healthy monster (>50% HP)', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const monster: Monster = {
        pos: { x: 5, y: 5 },
        char: 'g',
        color: '#00CC00',
        name: 'Goblin',
        health: 8,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        type: 'goblin',
      };

      hud.renderAdjacentMonster(monster, LAYOUT.ROW_MONSTER_INFO);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      // Green for >50% HP
      expect(calls[0][3]).toBe(GAME_CONSTANTS.COLORS.TEXT_BRIGHT);
    });

    it('should use yellow color for wounded monster (25-50% HP)', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const monster: Monster = {
        pos: { x: 5, y: 5 },
        char: 'g',
        color: '#00CC00',
        name: 'Goblin',
        health: 4,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        type: 'goblin',
      };

      hud.renderAdjacentMonster(monster, LAYOUT.ROW_MONSTER_INFO);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      // Yellow for 25-50% HP
      expect(calls[0][3]).toBe(GAME_CONSTANTS.COLORS.GOLD_COLOR);
    });

    it('should use red color for critical monster (<25% HP)', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const monster: Monster = {
        pos: { x: 5, y: 5 },
        char: 'g',
        color: '#00CC00',
        name: 'Goblin',
        health: 2,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        type: 'goblin',
      };

      hud.renderAdjacentMonster(monster, LAYOUT.ROW_MONSTER_INFO);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      // Red for <25% HP
      expect(calls[0][3]).toBe(GAME_CONSTANTS.COLORS.HEALTH_CRITICAL);
    });
  });

  describe('renderEquipmentPanel', () => {
    it('should display weapon and armor names', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');

      hud.renderEquipmentPanel(hero, 0, 0);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain("TestHero's Dagger");
      expect(allText).toContain("TestHero's Shirt");
    });

    it('should show (none) for empty slots', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');
      hero.equipment.weapon = null;

      hud.renderEquipmentPanel(hero, 0, 0);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('(none)');
    });
  });
});
