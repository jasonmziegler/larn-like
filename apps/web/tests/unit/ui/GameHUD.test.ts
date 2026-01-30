// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { GameHUD } from '../../../src/ui/GameHUD';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { createHero } from '../../../src/game/Hero';

function createMockRenderer(): CanvasRenderer {
  return {
    clear: vi.fn(),
    drawChar: vi.fn(),
    drawText: vi.fn(),
    drawBox: vi.fn(),
    getCanvas: vi.fn(),
    getContext: vi.fn(),
    getColorManager: vi.fn(),
  } as unknown as CanvasRenderer;
}

describe('GameHUD', () => {
  describe('renderStatusBar', () => {
    it('should render HP, ATK, DEF, Teeth, and Monsters', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');

      hud.renderStatusBar(hero, 3, 22);

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('HP:30/30');
      expect(allText).toContain('ATK:12');
      expect(allText).toContain('DEF:6');
      expect(allText).toContain('Teeth:0');
      expect(allText).toContain('Mon:3');
    });

    it('should use critical color when HP is low', () => {
      const renderer = createMockRenderer();
      const hud = new GameHUD(renderer);
      const hero = createHero('TestHero');
      hero.currentStats.hp = 5;

      hud.renderStatusBar(hero, 0, 22);

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
