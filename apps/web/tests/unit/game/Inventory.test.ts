// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createHero } from '../../../src/game/Hero';
import { consumeReagent } from '../../../src/game/Inventory';
import { ReagentItem } from '../../../src/game/Combat';
import { InventoryPanel, getReagents, groupReagents } from '../../../src/ui/InventoryPanel';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { Hero } from '@larn-like/shared';

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

function makeReagent(monsterType: string, name: string, stat: string, amount: number): ReagentItem {
  return {
    id: `reagent_${monsterType}_${Date.now()}_${Math.random()}`,
    name,
    type: 'reagent',
    monsterType,
    statBonus: { stat, amount },
  };
}

function addReagent(hero: Hero, reagent: ReagentItem): void {
  (hero.inventory as unknown[]).push(reagent);
}

describe('Reagent Consumption', () => {
  it('should apply +0.1 dexterity from Goblin Ear', () => {
    const hero = createHero('Test');
    const baseDex = hero.currentStats.dexterity;
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));

    const result = consumeReagent(hero, 'goblin');

    expect(result).not.toBeNull();
    expect(result!.stat).toBe('dexterity');
    expect(result!.amount).toBe(0.1);
    expect(hero.currentStats.dexterity).toBeCloseTo(baseDex + 0.1);
  });

  it('should apply +0.1 strength from Orc Tooth', () => {
    const hero = createHero('Test');
    const baseStr = hero.currentStats.strength;
    addReagent(hero, makeReagent('orc', 'Orc Tooth', 'strength', 0.1));

    consumeReagent(hero, 'orc');

    expect(hero.currentStats.strength).toBeCloseTo(baseStr + 0.1);
  });

  it('should apply +0.1 constitution from Troll Hide', () => {
    const hero = createHero('Test');
    const baseCon = hero.currentStats.constitution;
    addReagent(hero, makeReagent('troll', 'Troll Hide', 'constitution', 0.1));

    consumeReagent(hero, 'troll');

    expect(hero.currentStats.constitution).toBeCloseTo(baseCon + 0.1);
  });

  it('should apply +0.5 to all stats from Dragon Scale', () => {
    const hero = createHero('Test');
    const baseStr = hero.currentStats.strength;
    const baseDex = hero.currentStats.dexterity;
    const baseCon = hero.currentStats.constitution;
    addReagent(hero, makeReagent('dragon', 'Dragon Scale', 'all', 0.5));

    consumeReagent(hero, 'dragon');

    expect(hero.currentStats.strength).toBeCloseTo(baseStr + 0.5);
    expect(hero.currentStats.dexterity).toBeCloseTo(baseDex + 0.5);
    expect(hero.currentStats.constitution).toBeCloseTo(baseCon + 0.5);
  });

  it('should remove consumed reagent from inventory', () => {
    const hero = createHero('Test');
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    expect(hero.inventory.length).toBe(1);

    consumeReagent(hero, 'goblin');

    expect(hero.inventory.length).toBe(0);
  });

  it('should return null when no matching reagent exists', () => {
    const hero = createHero('Test');
    const result = consumeReagent(hero, 'goblin');
    expect(result).toBeNull();
  });

  it('should return a descriptive consumption message', () => {
    const hero = createHero('Test');
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));

    const result = consumeReagent(hero, 'goblin');

    expect(result!.message).toContain('Consumed');
    expect(result!.message).toContain('Goblin Ear');
    expect(result!.message).toContain('Dexterity');
  });
});

describe('Stat Bonus Stacking', () => {
  it('should stack 3 Goblin Ears for +0.3 dexterity', () => {
    const hero = createHero('Test');
    const baseDex = hero.currentStats.dexterity;

    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));

    consumeReagent(hero, 'goblin');
    consumeReagent(hero, 'goblin');
    consumeReagent(hero, 'goblin');

    expect(hero.currentStats.dexterity).toBeCloseTo(baseDex + 0.3);
  });

  it('should stack mixed reagent types to different stats', () => {
    const hero = createHero('Test');
    const baseStr = hero.currentStats.strength;
    const baseDex = hero.currentStats.dexterity;

    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    addReagent(hero, makeReagent('orc', 'Orc Tooth', 'strength', 0.1));

    consumeReagent(hero, 'goblin');
    consumeReagent(hero, 'orc');

    expect(hero.currentStats.dexterity).toBeCloseTo(baseDex + 0.1);
    expect(hero.currentStats.strength).toBeCloseTo(baseStr + 0.1);
  });

  it('should have no cap on stacking', () => {
    const hero = createHero('Test');
    const baseDex = hero.currentStats.dexterity;

    for (let i = 0; i < 10; i++) {
      addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    }

    for (let i = 0; i < 10; i++) {
      consumeReagent(hero, 'goblin');
    }

    expect(hero.currentStats.dexterity).toBeCloseTo(baseDex + 1.0);
  });
});

describe('Death Reset', () => {
  it('should create new hero with base stats and empty inventory', () => {
    const hero = createHero('NewHero');

    expect(hero.currentStats.strength).toBe(hero.baseStats.strength);
    expect(hero.currentStats.dexterity).toBe(hero.baseStats.dexterity);
    expect(hero.currentStats.constitution).toBe(hero.baseStats.constitution);
    expect(hero.inventory.length).toBe(0);
  });

  it('should not carry over bonuses from previous hero', () => {
    const hero1 = createHero('Hero1');
    addReagent(hero1, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    consumeReagent(hero1, 'goblin');
    expect(hero1.currentStats.dexterity).toBeCloseTo(10.1);

    const hero2 = createHero('Hero2');
    expect(hero2.currentStats.dexterity).toBe(10);
    expect(hero2.inventory.length).toBe(0);
  });
});

describe('Inventory Helpers', () => {
  it('getReagents should filter only reagent items', () => {
    const hero = createHero('Test');
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));

    const reagents = getReagents(hero);
    expect(reagents.length).toBe(1);
    expect(reagents[0].name).toBe('Goblin Ear');
  });

  it('groupReagents should group by monster type with counts', () => {
    const reagents = [
      makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1),
      makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1),
      makeReagent('orc', 'Orc Tooth', 'strength', 0.1),
    ];

    const grouped = groupReagents(reagents);
    expect(grouped.length).toBe(2);

    const goblinGroup = grouped.find(g => g.reagent.monsterType === 'goblin');
    const orcGroup = grouped.find(g => g.reagent.monsterType === 'orc');

    expect(goblinGroup!.count).toBe(2);
    expect(orcGroup!.count).toBe(1);
  });
});

describe('InventoryPanel', () => {
  it('should start closed', () => {
    const panel = new InventoryPanel(createMockRenderer());
    expect(panel.isOpen).toBe(false);
  });

  it('should toggle open and closed', () => {
    const panel = new InventoryPanel(createMockRenderer());
    panel.toggle();
    expect(panel.isOpen).toBe(true);
    panel.toggle();
    expect(panel.isOpen).toBe(false);
  });

  it('should render panel when open', () => {
    const renderer = createMockRenderer();
    const panel = new InventoryPanel(renderer);
    const hero = createHero('Test');

    panel.open();
    panel.render(hero);

    expect(renderer.drawBox).toHaveBeenCalled();
    const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = calls.map((c: unknown[]) => c[0]).join(' ');
    expect(allText).toContain('INVENTORY');
    expect(allText).toContain('No items');
  });

  it('should not render when closed', () => {
    const renderer = createMockRenderer();
    const panel = new InventoryPanel(renderer);
    const hero = createHero('Test');

    panel.render(hero);

    expect(renderer.drawBox).not.toHaveBeenCalled();
  });

  it('should display reagent names and quantities', () => {
    const renderer = createMockRenderer();
    const panel = new InventoryPanel(renderer);
    const hero = createHero('Test');
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    addReagent(hero, makeReagent('orc', 'Orc Tooth', 'strength', 0.1));

    panel.open();
    panel.render(hero);

    const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = calls.map((c: unknown[]) => c[0]).join(' ');
    expect(allText).toContain('Goblin Ear');
    expect(allText).toContain('(x2)');
    expect(allText).toContain('Orc Tooth');
    expect(allText).toContain('+DEX');
    expect(allText).toContain('+STR');
  });

  it('should show use and close instructions', () => {
    const renderer = createMockRenderer();
    const panel = new InventoryPanel(renderer);
    const hero = createHero('Test');

    panel.open();
    panel.render(hero);

    const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = calls.map((c: unknown[]) => c[0]).join(' ');
    expect(allText).toContain('[1-9] Use');
    expect(allText).toContain('Close');
  });
});

describe('Stats Display with Decimals', () => {
  it('should show decimal values after consumption', () => {
    const hero = createHero('Test');
    addReagent(hero, makeReagent('goblin', 'Goblin Ear', 'dexterity', 0.1));
    consumeReagent(hero, 'goblin');

    // Verify the value is stored with decimal
    expect(hero.currentStats.dexterity).toBeCloseTo(10.1);
    expect(hero.currentStats.dexterity.toFixed(1)).toBe('10.1');
  });
});
