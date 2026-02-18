// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MerchantPanel } from '../../../src/ui/MerchantPanel';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { createHero } from '../../../src/game/Hero';
import { purchaseItem } from '../../../src/game/Inventory';
import { MERCHANT_INVENTORY } from '@larn-like/shared';

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

describe('MerchantPanel', () => {
  let renderer: CanvasRenderer;
  let merchantPanel: MerchantPanel;

  beforeEach(() => {
    renderer = createMockRenderer();
    merchantPanel = new MerchantPanel(renderer);
  });

  describe('Panel State', () => {
    it('should start closed', () => {
      expect(merchantPanel.isOpen).toBe(false);
    });

    it('should open when open() is called', () => {
      merchantPanel.open();
      expect(merchantPanel.isOpen).toBe(true);
    });

    it('should close when close() is called', () => {
      merchantPanel.open();
      merchantPanel.close();
      expect(merchantPanel.isOpen).toBe(false);
    });

    it('should toggle between open and closed', () => {
      merchantPanel.toggle();
      expect(merchantPanel.isOpen).toBe(true);
      merchantPanel.toggle();
      expect(merchantPanel.isOpen).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      const hero = createHero('TestHero');
      const fillRectSpy = vi.spyOn(renderer, 'fillRect');

      merchantPanel.render(hero);
      expect(fillRectSpy).not.toHaveBeenCalled();
    });

    it('should render when open', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 100;

      merchantPanel.open();
      const fillRectSpy = vi.spyOn(renderer, 'fillRect');
      const drawTextSpy = vi.spyOn(renderer, 'drawText');

      merchantPanel.render(hero);

      expect(fillRectSpy).toHaveBeenCalled();
      expect(drawTextSpy).toHaveBeenCalled();
    });

    it('should display hero teeth currency', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 250;

      merchantPanel.open();
      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      const teethCalls = drawTextSpy.mock.calls.filter(call =>
        call[0].includes('Your Teeth:')
      );
      expect(teethCalls.length).toBeGreaterThan(0);
      expect(teethCalls[0][0]).toContain('250');
    });

    it('should display merchant inventory items', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      merchantPanel.open();
      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Check that at least one item from merchant inventory is displayed
      const itemCalls = drawTextSpy.mock.calls.filter(call =>
        MERCHANT_INVENTORY.some(item => call[0].includes(item.name))
      );
      expect(itemCalls.length).toBeGreaterThan(0);
    });

    it('should display item prices', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      merchantPanel.open();
      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Check that prices are displayed (should contain 'teeth' somewhere)
      const priceCalls = drawTextSpy.mock.calls.filter(call =>
        call[0].includes('teeth') && call[0].match(/\d+ teeth/)
      );
      expect(priceCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Input Handling', () => {
    it('should close panel on Escape', () => {
      const hero = createHero('TestHero');
      merchantPanel.open();

      const action = merchantPanel.handleInput('Escape', hero);
      expect(action.type).toBe('close');
    });

    it('should return purchase action for valid item with sufficient teeth', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000; // Enough for any item

      const action = merchantPanel.handleInput('1', hero); // First item
      expect(action.type).toBe('purchase');
      if (action.type === 'purchase') {
        expect(action.item).toBeDefined();
        expect(action.item.id).toBe(MERCHANT_INVENTORY[0].id);
      }
    });

    it('should return none for item purchase with insufficient teeth', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 0; // No teeth

      const action = merchantPanel.handleInput('1', hero); // First item
      expect(action.type).toBe('none'); // Cannot afford
    });

    it('should return none for invalid number key', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      const action = merchantPanel.handleInput('0', hero); // Invalid
      expect(action.type).toBe('none');
    });

    it('should return none for non-numeric key', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      const action = merchantPanel.handleInput('a', hero);
      expect(action.type).toBe('none');
    });
  });

  describe('Purchase Transaction Integration', () => {
    it('should successfully purchase item with sufficient teeth', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;
      const initialTeeth = hero.teethCurrency;
      const initialInventorySize = hero.inventory.length;

      const item = MERCHANT_INVENTORY[0]; // First item
      const result = purchaseItem(hero, item, item.price);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Purchased');
      expect(hero.teethCurrency).toBe(initialTeeth - item.price);
      expect(hero.inventory.length).toBe(initialInventorySize + 1);
    });

    it('should reject purchase with insufficient teeth', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 10; // Not enough for most items
      const initialTeeth = hero.teethCurrency;
      const initialInventorySize = hero.inventory.length;

      const item = MERCHANT_INVENTORY[0]; // First item (likely costs more than 10)
      const result = purchaseItem(hero, item, item.price);

      if (item.price > 10) {
        expect(result.success).toBe(false);
        expect(result.message).toContain('Not enough teeth');
        expect(hero.teethCurrency).toBe(initialTeeth); // Teeth unchanged
        expect(hero.inventory.length).toBe(initialInventorySize); // Inventory unchanged
      }
    });

    it('should deduct exact teeth amount on purchase', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 500;

      const item = MERCHANT_INVENTORY.find(i => i.price <= 500)!;
      const expectedTeeth = hero.teethCurrency - item.price;

      const result = purchaseItem(hero, item, item.price);

      expect(result.success).toBe(true);
      expect(hero.teethCurrency).toBe(expectedTeeth);
    });

    it('should add purchased item to hero inventory', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      const item = MERCHANT_INVENTORY[0];
      purchaseItem(hero, item, item.price);

      const addedItem = hero.inventory.find(i => i.id === item.id);
      expect(addedItem).toBeDefined();
      expect(addedItem?.name).toBe(item.name);
      expect(addedItem?.attackBonus).toBe(item.attackBonus);
      expect(addedItem?.defenseBonus).toBe(item.defenseBonus);
    });

    it('should handle multiple purchases correctly', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 2000;

      const item1 = MERCHANT_INVENTORY[0];
      const item2 = MERCHANT_INVENTORY[1];

      purchaseItem(hero, item1, item1.price);
      purchaseItem(hero, item2, item2.price);

      expect(hero.teethCurrency).toBe(2000 - item1.price - item2.price);
      expect(hero.inventory.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Merchant Inventory', () => {
    it('should have items defined', () => {
      expect(MERCHANT_INVENTORY.length).toBeGreaterThan(0);
    });

    it('should have items with valid prices', () => {
      for (const item of MERCHANT_INVENTORY) {
        expect(item.price).toBeGreaterThan(0);
        expect(item.price).toBeLessThan(1000); // Reasonable upper bound
      }
    });

    it('should have items with valid stat bonuses', () => {
      for (const item of MERCHANT_INVENTORY) {
        expect(item.attackBonus).toBeGreaterThanOrEqual(0);
        expect(item.defenseBonus).toBeGreaterThanOrEqual(0);
        // At least one bonus should be positive
        expect(item.attackBonus + item.defenseBonus).toBeGreaterThan(0);
      }
    });

    it('should have items for multiple equipment slots', () => {
      const slots = new Set(MERCHANT_INVENTORY.map(item => item.slot));
      expect(slots.size).toBeGreaterThan(1); // Should have variety
    });
  });

  describe('Pagination (Task 9 Bug Fix)', () => {
    it('should start on page 0', () => {
      merchantPanel.open();
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Should show "1. Iron Sword" (first item on page 1)
      const itemCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].startsWith('1.')
      );
      expect(itemCalls.length).toBeGreaterThan(0);
      expect(itemCalls[0][0]).toContain('Iron Sword');
    });

    it('should navigate to next page with scrollPageDown', () => {
      merchantPanel.open();
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      merchantPanel.scrollPageDown();
      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Should show page 2 items (item 8 is "Scale Mail" at index 7)
      const itemCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('Scale Mail')
      );
      expect(itemCalls.length).toBeGreaterThan(0);
    });

    it('should navigate to previous page with scrollPageUp', () => {
      merchantPanel.open();
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      merchantPanel.scrollPageDown(); // Go to page 2
      merchantPanel.scrollPageUp(); // Back to page 1

      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Should show first item again
      const itemCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].startsWith('1.')
      );
      expect(itemCalls[0][0]).toContain('Iron Sword');
    });

    it('should not scroll past first page', () => {
      merchantPanel.open();
      merchantPanel.scrollPageUp(); // Try to scroll up from page 0

      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Should still show first item
      const itemCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].startsWith('1.')
      );
      expect(itemCalls[0][0]).toContain('Iron Sword');
    });

    it('should not scroll past last page', () => {
      merchantPanel.open();
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      // Scroll down many times (more than total pages)
      for (let i = 0; i < 10; i++) {
        merchantPanel.scrollPageDown();
      }

      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Should show page indicator for last page
      const pageIndicatorCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('Page')
      );
      expect(pageIndicatorCalls.length).toBeGreaterThan(0);
      // With 18 items and 7 per page, should be page 3/3
      expect(pageIndicatorCalls[0][0]).toContain('Page 3/3');
    });

    it('should purchase correct item from current page', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      merchantPanel.open();

      // Purchase item 1 from page 1 (Iron Sword - index 0)
      const action1 = merchantPanel.handleInput('1', hero);
      expect(action1.type).toBe('purchase');
      expect(action1.type === 'purchase' && action1.item.id).toBe('shop_sword_iron');

      // Go to page 2
      merchantPanel.scrollPageDown();

      // Purchase item 1 from page 2 (should be item at index 7 - Scale Mail)
      const action2 = merchantPanel.handleInput('1', hero);
      expect(action2.type).toBe('purchase');
      expect(action2.type === 'purchase' && action2.item.id).toBe('shop_armor_scale');
    });

    it('should show page indicator when multi-page', () => {
      const hero = createHero('TestHero');
      hero.teethCurrency = 1000;

      merchantPanel.open();
      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // With 18 items and 7 per page, should show "Page 1/3"
      const pageIndicatorCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('Page 1/3')
      );
      expect(pageIndicatorCalls.length).toBeGreaterThan(0);
    });

    it('should reset to page 0 when reopened', () => {
      merchantPanel.open();
      merchantPanel.scrollPageDown();
      merchantPanel.scrollPageDown();
      merchantPanel.close();
      merchantPanel.open(); // Reopen

      const hero = createHero('TestHero');
      const drawTextSpy = vi.spyOn(renderer, 'drawText');
      merchantPanel.render(hero);

      // Should be back on page 1
      const pageIndicatorCalls = drawTextSpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('Page 1/3')
      );
      expect(pageIndicatorCalls.length).toBeGreaterThan(0);
    });
  });
});
