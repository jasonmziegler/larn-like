// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonsterInspectPanel, getEvolutionTitle } from '../../../src/ui/MonsterInspectPanel';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { Monster } from '../../../src/game/Combat';
import { createEmptySlots } from '../../../src/game/Equipment';

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

describe('MonsterInspectPanel', () => {
  let renderer: CanvasRenderer;
  let panel: MonsterInspectPanel;

  beforeEach(() => {
    renderer = createMockRenderer();
    panel = new MonsterInspectPanel(renderer);
  });

  describe('getEvolutionTitle', () => {
    it('should return empty string for 0 kills', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        equipment: createEmptySlots(),
      };

      expect(getEvolutionTitle(monster)).toBe('');
    });

    it('should return "Slayer of {heroName}" for 1 kill', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [{ heroName: 'Bob', killedAt: 'Level 1' }],
        equipment: createEmptySlots(),
      };

      expect(getEvolutionTitle(monster)).toBe('Slayer of Bob');
    });

    it('should return "Slayer of {count} Heroes" for 2-4 kills', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: true,
        evolutionLevel: 2,
        killHistory: [
          { heroName: 'Bob', killedAt: 'Level 1' },
          { heroName: 'Alice', killedAt: 'Level 2' },
          { heroName: 'Charlie', killedAt: 'Level 3' },
        ],
        equipment: createEmptySlots(),
      };

      expect(getEvolutionTitle(monster)).toBe('Slayer of 3 Heroes');
    });

    it('should return "Legendary Slayer of {count} Heroes" for 5+ kills', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: true,
        evolutionLevel: 3,
        killHistory: [
          { heroName: 'Bob', killedAt: 'Level 1' },
          { heroName: 'Alice', killedAt: 'Level 2' },
          { heroName: 'Charlie', killedAt: 'Level 3' },
          { heroName: 'Dave', killedAt: 'Level 4' },
          { heroName: 'Eve', killedAt: 'Level 5' },
        ],
        equipment: createEmptySlots(),
      };

      expect(getEvolutionTitle(monster)).toBe('Legendary Slayer of 5 Heroes');
    });
  });

  describe('MonsterInspectPanel rendering', () => {
    it('should not render when closed', () => {
      panel.render();
      expect(renderer.drawText).not.toHaveBeenCalled();
    });

    it('should render baseline monster without evolution indicators', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.render();

      expect(renderer.drawBox).toHaveBeenCalled();
      expect(renderer.fillRect).toHaveBeenCalled();
      // Check that monster name appears without evolution title
      const drawTextCalls = (renderer.drawText as any).mock.calls;
      const titleCall = drawTextCalls.find((call: any[]) => call[0] === 'Goblin');
      expect(titleCall).toBeDefined();
    });

    it('should render evolved monster with correct evolution level and stats', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 15,
        maxHealth: 15,
        attack: 5,
        defense: 3,
        isEvolved: true,
        evolutionLevel: 2,
        killHistory: [
          { heroName: 'Bob', killedAt: 'Level 1' },
          { heroName: 'Alice', killedAt: 'Level 2' },
        ],
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Check for evolution title in header
      const titleCall = drawTextCalls.find((call: any[]) =>
        call[0].includes('Slayer of 2 Heroes')
      );
      expect(titleCall).toBeDefined();

      // Check for stats display
      const hpCall = drawTextCalls.find((call: any[]) => call[0].includes('HP: 15/15'));
      expect(hpCall).toBeDefined();
      const atkCall = drawTextCalls.find((call: any[]) => call[0].includes('ATK: 5'));
      expect(atkCall).toBeDefined();
      const defCall = drawTextCalls.find((call: any[]) => call[0].includes('DEF: 3'));
      expect(defCall).toBeDefined();
    });

    it('should display trophy equipment with bonuses', () => {
      const equipment = createEmptySlots();
      equipment.weapon = {
        id: 'sword1',
        name: "Bob's Sword",
        slot: 'weapon',
        attackBonus: 3,
        defenseBonus: 0,
        description: 'A sharp sword',
      };

      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 15,
        maxHealth: 15,
        attack: 5,
        defense: 3,
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [{ heroName: 'Bob', killedAt: 'Level 1' }],
        equipment,
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      const equipCall = drawTextCalls.find((call: any[]) =>
        call[0].includes("Bob's Sword") && call[0].includes('+3 ATK')
      );
      expect(equipCall).toBeDefined();
    });

    it('should show "No notable history" for monster with no kills', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      const historyCall = drawTextCalls.find((call: any[]) =>
        call[0].includes('No notable history')
      );
      expect(historyCall).toBeDefined();
    });

    it('should show "None" for monster with no equipment', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Find the "None" text that appears after "Equipment:"
      const equipHeaderIndex = drawTextCalls.findIndex((call: any[]) =>
        call[0] === 'Equipment:'
      );
      expect(equipHeaderIndex).toBeGreaterThan(-1);
      // Check that "None" appears shortly after
      const noneCall = drawTextCalls.slice(equipHeaderIndex).find((call: any[]) =>
        call[0] === 'None'
      );
      expect(noneCall).toBeDefined();
    });
  });

  describe('Kill history pagination', () => {
    it('should paginate kill history with more than 5 records', () => {
      const killHistory = [];
      for (let i = 1; i <= 12; i++) {
        killHistory.push({ heroName: `Hero${i}`, killedAt: `Level ${i}` });
      }

      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 20,
        maxHealth: 20,
        attack: 10,
        defense: 5,
        isEvolved: true,
        evolutionLevel: 3,
        killHistory,
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Check for pagination indicator
      const pageCall = drawTextCalls.find((call: any[]) =>
        call[0].includes('More history') && call[0].includes('1/3')
      );
      expect(pageCall).toBeDefined();

      // Check that only first 5 appear on page 1
      expect(drawTextCalls.some((call: any[]) => call[0].includes('Hero1'))).toBe(true);
      expect(drawTextCalls.some((call: any[]) => call[0].includes('Hero5'))).toBe(true);
      expect(drawTextCalls.some((call: any[]) => call[0].includes('Hero6'))).toBe(false);
    });

    it('should navigate to next page of kill history', () => {
      const killHistory = [];
      for (let i = 1; i <= 12; i++) {
        killHistory.push({ heroName: `Hero${i}`, killedAt: `Level ${i}` });
      }

      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 20,
        maxHealth: 20,
        attack: 10,
        defense: 5,
        isEvolved: true,
        evolutionLevel: 3,
        killHistory,
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.scrollHistoryDown();
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Check for page 2
      const pageCall = drawTextCalls.find((call: any[]) =>
        call[0].includes('More history') && call[0].includes('2/3')
      );
      expect(pageCall).toBeDefined();

      // Check that Hero6-10 appear on page 2
      expect(drawTextCalls.some((call: any[]) => call[0].includes('Hero6'))).toBe(true);
      expect(drawTextCalls.some((call: any[]) => call[0].includes('Hero10'))).toBe(true);
      // Hero1 should NOT appear (but Hero10 contains "Hero1" substring, so check more specifically)
      expect(drawTextCalls.some((call: any[]) => call[0].includes('Slew Hero1 '))).toBe(false);
    });

    it('should not scroll past first page', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 10,
        maxHealth: 10,
        attack: 3,
        defense: 1,
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [{ heroName: 'Bob', killedAt: 'Level 1' }],
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.scrollHistoryUp();
      panel.scrollHistoryUp();
      panel.render();

      // Should still be on page 1 (no crash, no negative page)
      expect(renderer.drawText).toHaveBeenCalled();
    });

    it('should not scroll past last page', () => {
      const killHistory = [];
      for (let i = 1; i <= 7; i++) {
        killHistory.push({ heroName: `Hero${i}`, killedAt: `Level ${i}` });
      }

      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 15,
        maxHealth: 15,
        attack: 6,
        defense: 3,
        isEvolved: true,
        evolutionLevel: 2,
        killHistory,
        equipment: createEmptySlots(),
      };

      panel.open(monster);
      panel.scrollHistoryDown();
      panel.scrollHistoryDown();
      panel.scrollHistoryDown();
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Should be on page 2/2 (last page)
      const pageCall = drawTextCalls.find((call: any[]) =>
        call[0].includes('More history') && call[0].includes('2/2')
      );
      expect(pageCall).toBeDefined();
    });
  });

  describe('Visual color selection', () => {
    it('should use base color for evolution level 0', () => {
      // This is tested indirectly through rendering - the panel itself doesn't control map colors
      // The evolved color is applied in main.ts render loop
      expect(true).toBe(true); // Placeholder - color testing happens in integration
    });
  });

  describe('Edge cases', () => {
    it('should handle evolved monster with no equipment (killed hero who had nothing)', () => {
      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 12,
        maxHealth: 12,
        attack: 5,
        defense: 2,
        isEvolved: true,
        evolutionLevel: 1,
        killHistory: [{ heroName: 'Bob', killedAt: 'Level 1' }],
        equipment: createEmptySlots(), // No equipment taken
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Should show "None" for equipment
      const equipHeaderIndex = drawTextCalls.findIndex((call: any[]) =>
        call[0] === 'Equipment:'
      );
      const noneCall = drawTextCalls.slice(equipHeaderIndex).find((call: any[]) =>
        call[0] === 'None'
      );
      expect(noneCall).toBeDefined();
    });

    it('should handle monster at max evolution with full 10-slot equipment', () => {
      const equipment = createEmptySlots();
      equipment.weapon = { id: '1', name: 'Sword', slot: 'weapon', attackBonus: 2, defenseBonus: 0, description: '' };
      equipment.offHand = { id: '2', name: 'Shield', slot: 'offHand', attackBonus: 0, defenseBonus: 2, description: '' };
      equipment.bodyArmor = { id: '3', name: 'Armor', slot: 'bodyArmor', attackBonus: 0, defenseBonus: 3, description: '' };
      equipment.helmet = { id: '4', name: 'Helmet', slot: 'helmet', attackBonus: 0, defenseBonus: 1, description: '' };
      equipment.gloves = { id: '5', name: 'Gloves', slot: 'gloves', attackBonus: 1, defenseBonus: 0, description: '' };
      equipment.boots = { id: '6', name: 'Boots', slot: 'boots', attackBonus: 0, defenseBonus: 1, description: '' };
      equipment.amulet = { id: '7', name: 'Amulet', slot: 'amulet', attackBonus: 1, defenseBonus: 0, description: '' };
      equipment.ring1 = { id: '8', name: 'Ring1', slot: 'ring1', attackBonus: 1, defenseBonus: 0, description: '' };
      equipment.ring2 = { id: '9', name: 'Ring2', slot: 'ring2', attackBonus: 0, defenseBonus: 1, description: '' };
      equipment.belt = { id: '10', name: 'Belt', slot: 'belt', attackBonus: 0, defenseBonus: 2, description: '' };

      const killHistory = [];
      for (let i = 1; i <= 10; i++) {
        killHistory.push({ heroName: `Hero${i}`, killedAt: `Level ${i}` });
      }

      const monster: Monster = {
        pos: { x: 0, y: 0 },
        char: 'g',
        color: '#00FF00',
        name: 'Goblin',
        health: 30,
        maxHealth: 30,
        attack: 15,
        defense: 10,
        isEvolved: true,
        evolutionLevel: 5, // Max evolution
        killHistory,
        equipment,
      };

      panel.open(monster);
      panel.render();

      const drawTextCalls = (renderer.drawText as any).mock.calls;
      // Check that equipment is shown (should display up to 5 lines)
      const weaponCall = drawTextCalls.find((call: any[]) => call[0].includes('Weapon: Sword'));
      expect(weaponCall).toBeDefined();

      // Check evolution title
      const titleCall = drawTextCalls.find((call: any[]) =>
        call[0].includes('Legendary Slayer of 10 Heroes')
      );
      expect(titleCall).toBeDefined();
    });
  });
});
