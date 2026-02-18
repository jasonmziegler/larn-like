import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { Hero, GAME_CONSTANTS, MERCHANT_INVENTORY, MerchantItem } from '@larn-like/shared';

const COLORS = GAME_CONSTANTS.COLORS;
const PANEL_WIDTH = 60;
const PANEL_HEIGHT = 24;
const ITEMS_PER_PAGE = 7; // Reduced from 9 to prevent overflow with comparison text

/**
 * MerchantPanel displays the merchant's shop inventory with equipment for sale.
 * Players can browse items, see stat comparisons, and purchase using teeth currency.
 * Supports pagination for inventories larger than 9 items.
 */
export class MerchantPanel {
  private renderer: CanvasRenderer;
  private _isOpen: boolean = false;
  private currentPage: number = 0;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public open(): void {
    this._isOpen = true;
    this.currentPage = 0;
  }

  public close(): void {
    this._isOpen = false;
  }

  public toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Scroll to previous page of merchant items
   */
  public scrollPageUp(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  /**
   * Scroll to next page of merchant items
   */
  public scrollPageDown(): void {
    const maxPage = Math.max(0, Math.ceil(MERCHANT_INVENTORY.length / ITEMS_PER_PAGE) - 1);
    if (this.currentPage < maxPage) {
      this.currentPage++;
    }
  }

  /**
   * Render the merchant panel overlay
   */
  public render(hero: Hero): void {
    if (!this._isOpen) return;

    const startX = Math.floor((GAME_CONSTANTS.VIEWPORT_WIDTH - PANEL_WIDTH) / 2);
    const startY = Math.floor((GAME_CONSTANTS.VIEWPORT_HEIGHT - PANEL_HEIGHT) / 2);

    // Draw solid background using fillRect
    this.renderer.fillRect(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, '#000000');

    // Draw border
    this.renderer.drawBox(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.UI_BORDER);

    // Title
    const title = '=== MERCHANT SHOP ===';
    const titleX = startX + Math.floor((PANEL_WIDTH - title.length) / 2);
    this.renderer.drawText(title, titleX, startY + 1, COLORS.TEXT_BRIGHT);

    // Hero's teeth currency
    const teethDisplay = `Your Teeth: ${hero.teethCurrency}`;
    this.renderer.drawText(teethDisplay, startX + 2, startY + 2, COLORS.TEXT_BRIGHT);

    // Horizontal separator
    const separator = '-'.repeat(PANEL_WIDTH - 4);
    this.renderer.drawText(separator, startX + 2, startY + 3, COLORS.TEXT_DIM);

    // Calculate pagination
    const startIndex = this.currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, MERCHANT_INVENTORY.length);
    const totalPages = Math.ceil(MERCHANT_INVENTORY.length / ITEMS_PER_PAGE);

    // Display merchant items for current page
    let lineY = startY + 4;
    for (let i = startIndex; i < endIndex; i++) {
      const item = MERCHANT_INVENTORY[i];
      const displayNumber = (i - startIndex) + 1; // 1-9 for current page

      // Format: "1. Iron Sword (+4 ATK) — 50 teeth"
      const statBonus = item.attackBonus > 0
        ? `+${item.attackBonus} ATK`
        : `+${item.defenseBonus} DEF`;
      const twoHandedTag = item.isTwoHanded ? ' [2H]' : '';
      const itemLine = `${displayNumber}. ${item.name} (${statBonus})${twoHandedTag} — ${item.price} teeth`;

      // Check if hero can afford
      const canAfford = hero.teethCurrency >= item.price;
      const color = canAfford ? COLORS.TEXT_NORMAL : COLORS.TEXT_DIM;

      this.renderer.drawText(itemLine.substring(0, PANEL_WIDTH - 4), startX + 2, lineY, color);

      // Show comparison with currently equipped item in same slot
      const equippedItem = hero.equipment[item.slot as keyof typeof hero.equipment];
      if (equippedItem) {
        const equippedBonus = equippedItem.attackBonus > 0
          ? `+${equippedItem.attackBonus} ATK`
          : `+${equippedItem.defenseBonus} DEF`;
        const upgrade = this.calculateUpgrade(item, equippedItem);
        const upgradeText = upgrade > 0
          ? `+${upgrade}`
          : upgrade < 0
          ? `${upgrade}`
          : '=';
        const comparison = `   Current: ${equippedItem.name} (${equippedBonus}) | ${upgradeText}`;
        this.renderer.drawText(comparison.substring(0, PANEL_WIDTH - 4), startX + 2, lineY + 1, COLORS.TEXT_DIM);
        lineY += 2;
      } else {
        lineY += 1;
      }

      lineY += 1; // Extra spacing between items
    }

    // Footer with instructions and page indicator
    const footerY = startY + PANEL_HEIGHT - 2;
    let instructions = 'Press 1-9 to purchase | [ESC] Close';
    if (totalPages > 1) {
      const pageIndicator = `Page ${this.currentPage + 1}/${totalPages}`;
      instructions = `↑↓ Page | 1-9 Purchase | [ESC] Close | ${pageIndicator}`;
    }
    const instructionsX = startX + Math.floor((PANEL_WIDTH - instructions.length) / 2);
    this.renderer.drawText(instructions.substring(0, PANEL_WIDTH - 4), instructionsX, footerY, COLORS.TEXT_DIM);
  }

  /**
   * Calculate the stat upgrade from current to new item
   */
  private calculateUpgrade(newItem: MerchantItem, currentItem: typeof newItem): number {
    // Compare primary stat (attack or defense)
    if (newItem.attackBonus > 0 || currentItem.attackBonus > 0) {
      return newItem.attackBonus - currentItem.attackBonus;
    } else {
      return newItem.defenseBonus - currentItem.defenseBonus;
    }
  }

  /**
   * Handle keyboard input for merchant panel
   * Returns the selected item for purchase, or null if closed/invalid input
   */
  public handleInput(key: string, hero: Hero): { type: 'purchase'; item: MerchantItem } | { type: 'close' } | { type: 'none' } {
    if (key === 'Escape') {
      return { type: 'close' };
    }

    // Number key selection (1-9) - selects item from current page
    const num = parseInt(key, 10);
    if (num >= 1 && num <= 9) {
      const startIndex = this.currentPage * ITEMS_PER_PAGE;
      const itemIndex = startIndex + (num - 1);

      // Check if this index exists on current page
      if (itemIndex < MERCHANT_INVENTORY.length) {
        const selectedItem = MERCHANT_INVENTORY[itemIndex];
        // Verify hero can afford the item
        if (hero.teethCurrency >= selectedItem.price) {
          return { type: 'purchase', item: selectedItem };
        } else {
          // Cannot afford - do nothing (could show error message in main.ts)
          return { type: 'none' };
        }
      }
    }

    return { type: 'none' };
  }
}
