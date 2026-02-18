import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { Hero, GAME_CONSTANTS, EquipmentSlotType, EquipmentItem } from '@larn-like/shared';
import { isSlotBlocked } from '../game/Equipment';
import { getCapacityString, sortInventory, SortMode, quickEquip } from '../game/Inventory';

const COLORS = GAME_CONSTANTS.COLORS;
const PANEL_WIDTH = 44;
const PANEL_HEIGHT = 18;

interface SlotDisplay {
  key: EquipmentSlotType;
  label: string;
  number: number;
}

const SLOT_LAYOUT: SlotDisplay[] = [
  { key: 'weapon', label: 'Weapon', number: 1 },
  { key: 'offHand', label: 'Off-Hand', number: 2 },
  { key: 'helmet', label: 'Helmet', number: 3 },
  { key: 'bodyArmor', label: 'Body', number: 4 },
  { key: 'gloves', label: 'Gloves', number: 5 },
  { key: 'boots', label: 'Boots', number: 6 },
  { key: 'ring1', label: 'Ring 1', number: 7 },
  { key: 'ring2', label: 'Ring 2', number: 8 },
  { key: 'amulet', label: 'Amulet', number: 9 },
  { key: 'belt', label: 'Belt', number: 10 },
];

export type EquipmentAction =
  | { type: 'none' }
  | { type: 'equip'; slotKey: EquipmentSlotType; item: EquipmentItem }
  | { type: 'unequip'; slotKey: EquipmentSlotType }
  | { type: 'quick-equip'; message: string }
  | { type: 'error'; message: string };

export class EquipmentPanel {
  private renderer: CanvasRenderer;
  private _isOpen: boolean = false;
  private selectedSlot: EquipmentSlotType | null = null;
  private sortMode: SortMode = 'type';
  private quickEquipMode: boolean = false;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public open(): void {
    this._isOpen = true;
    this.selectedSlot = null;
  }

  public close(): void {
    this._isOpen = false;
    this.selectedSlot = null;
  }

  public toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Handles keyboard input for equipment management.
   * Returns an action to be processed by the game state.
   */
  public handleInput(key: string, hero: Hero): EquipmentAction {
    // Handle escape - close panel or go back to slot selection
    if (key === 'Escape') {
      if (this.selectedSlot !== null) {
        this.selectedSlot = null;
        return { type: 'none' };
      }
      return { type: 'none' }; // Let main.ts handle closing
    }

    // If a slot is selected, handle inventory item selection
    if (this.selectedSlot !== null) {
      return this.handleInventorySelection(key, hero);
    }

    // Handle slot selection (1-10)
    const num = key === '0' ? 10 : parseInt(key, 10);
    if (num >= 1 && num <= 10) {
      const slot = SLOT_LAYOUT.find(s => s.number === num);
      if (slot) {
        // Check if slot is blocked
        if (isSlotBlocked(hero.equipment, slot.key)) {
          return { type: 'error', message: `${slot.label} slot is blocked` };
        }

        this.selectedSlot = slot.key;
        return { type: 'none' };
      }
    }

    // Unrecognized key
    return { type: 'none' };
  }

  private handleInventorySelection(key: string, hero: Hero): EquipmentAction {
    if (!this.selectedSlot) return { type: 'none' };

    // Handle sorting hotkeys
    if (key.toLowerCase() === 't') {
      this.sortMode = 'type';
      this.quickEquipMode = false; // Reset quick-equip mode
      return { type: 'none' };
    }
    if (key.toLowerCase() === 'v') {
      this.sortMode = 'value';
      this.quickEquipMode = false; // Reset quick-equip mode
      return { type: 'none' };
    }
    if (key.toLowerCase() === 's') {
      this.sortMode = 'slot';
      this.quickEquipMode = false; // Reset quick-equip mode
      return { type: 'none' };
    }

    // 'q' to enable quick-equip mode (next number press will quick-equip)
    if (key.toLowerCase() === 'q') {
      this.quickEquipMode = !this.quickEquipMode; // Toggle quick-equip mode
      return { type: 'none' };
    }

    // 'u' to unequip current item
    if (key.toLowerCase() === 'u') {
      const currentItem = hero.equipment[this.selectedSlot];
      if (currentItem) {
        this.quickEquipMode = false; // Reset quick-equip mode
        const action: EquipmentAction = { type: 'unequip', slotKey: this.selectedSlot };
        this.selectedSlot = null; // Return to slot selection
        return action;
      }
      return { type: 'error', message: 'No item equipped in this slot' };
    }

    // Number keys to equip item from inventory
    const num = parseInt(key, 10);
    if (num >= 1 && num <= 9) {
      const compatibleItems = this.getCompatibleItems(hero);
      if (num <= compatibleItems.length) {
        const item = compatibleItems[num - 1];

        // If quick-equip mode is enabled, do quick-equip
        if (this.quickEquipMode) {
          // Find inventory index of the item
          const inventoryIndex = hero.inventory.findIndex(invItem => invItem.id === item.id);
          if (inventoryIndex !== -1) {
            const result = quickEquip(hero, inventoryIndex);
            this.quickEquipMode = false; // Reset mode
            this.selectedSlot = null; // Return to slot selection

            if (result.success) {
              return { type: 'quick-equip', message: result.message };
            } else {
              return { type: 'error', message: result.message };
            }
          }
        }

        // Normal equip (original behavior)
        this.quickEquipMode = false; // Reset mode
        const action: EquipmentAction = { type: 'equip', slotKey: this.selectedSlot, item };
        this.selectedSlot = null; // Return to slot selection
        return action;
      }
    }

    return { type: 'none' };
  }

  private getCompatibleItems(hero: Hero): EquipmentItem[] {
    if (!this.selectedSlot) return [];

    // Hero inventory contains EquipmentItem objects - filter to compatible items
    const compatible = hero.inventory.filter(item => item.slot === this.selectedSlot);

    // Apply current sort mode
    return sortInventory(compatible, this.sortMode);
  }

  public render(hero: Hero): void {
    if (!this._isOpen) return;

    // Center the panel on the canvas
    const startX = Math.floor((GAME_CONSTANTS.VIEWPORT_WIDTH - PANEL_WIDTH) / 2);
    const startY = Math.floor((GAME_CONSTANTS.VIEWPORT_HEIGHT - PANEL_HEIGHT) / 2);

    // Fill entire panel area with solid black background
    this.renderer.fillRect(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.BACKGROUND);

    // Draw panel border on top of background
    this.renderer.drawBox(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.UI_BORDER);

    // Render based on mode
    if (this.selectedSlot !== null) {
      this.renderInventoryMode(hero, startX, startY);
    } else {
      this.renderEquipmentMode(hero, startX, startY);
    }
  }

  private renderEquipmentMode(hero: Hero, startX: number, startY: number): void {
    // Title
    const title = 'EQUIPMENT';
    const titleX = startX + Math.floor((PANEL_WIDTH - title.length) / 2);
    this.renderer.drawText(title, titleX, startY + 1, COLORS.TEXT_BRIGHT);

    // Separator
    const sep = '-'.repeat(PANEL_WIDTH - 2);
    this.renderer.drawText(sep, startX + 1, startY + 2, COLORS.TEXT_DIM);

    // Render equipment slots
    let row = startY + 3;
    for (const slot of SLOT_LAYOUT) {
      const item = hero.equipment[slot.key];
      const blocked = isSlotBlocked(hero.equipment, slot.key);

      // Slot number and label
      const slotLabel = `${slot.number}. ${slot.label}:`;
      const labelColor = blocked ? COLORS.TEXT_DIM : COLORS.TEXT_NORMAL;
      this.renderer.drawText(slotLabel, startX + 2, row, labelColor);

      // Item name and stats
      if (item) {
        const attackStr = item.attackBonus > 0 ? `+${item.attackBonus} ATK` : '';
        const defenseStr = item.defenseBonus > 0 ? `+${item.defenseBonus} DEF` : '';
        const stats = [attackStr, defenseStr].filter(s => s).join(' ');
        const itemText = stats ? `${item.name} (${stats})` : item.name;

        // Truncate if too long
        const maxItemWidth = PANEL_WIDTH - 16;
        const displayText = itemText.length > maxItemWidth
          ? itemText.substring(0, maxItemWidth - 3) + '...'
          : itemText;

        this.renderer.drawText(displayText, startX + 15, row, COLORS.TEXT_BRIGHT);
      } else if (blocked) {
        this.renderer.drawText('[Blocked]', startX + 15, row, COLORS.TEXT_DIM);
      } else {
        this.renderer.drawText('[Empty]', startX + 15, row, COLORS.TEXT_DIM);
      }

      row++;
    }

    // Total bonuses
    row++; // Skip a line
    const totalAttack = this.getTotalBonus(hero, 'attack');
    const totalDefense = this.getTotalBonus(hero, 'defense');
    this.renderer.drawText(
      `Total: +${totalAttack} ATK  +${totalDefense} DEF`,
      startX + 2,
      row,
      COLORS.TEXT_BRIGHT
    );

    // Instructions
    const instrRow = startY + PANEL_HEIGHT - 2;
    const instr = '[1-10] Manage Slot  [E/ESC] Close';
    const instrX = startX + Math.floor((PANEL_WIDTH - instr.length) / 2);
    this.renderer.drawText(instr, instrX, instrRow, COLORS.TEXT_DIM);
  }

  private renderInventoryMode(hero: Hero, startX: number, startY: number): void {
    if (!this.selectedSlot) return;

    const slotInfo = SLOT_LAYOUT.find(s => s.key === this.selectedSlot);
    if (!slotInfo) return;

    // Title with capacity
    const capacity = getCapacityString(hero);
    const title = `SELECT ITEM FOR ${slotInfo.label.toUpperCase()}`;
    const titleX = startX + Math.floor((PANEL_WIDTH - title.length) / 2);
    this.renderer.drawText(title, titleX, startY + 1, COLORS.TEXT_BRIGHT);

    // Show capacity and quick-equip mode indicator
    const qIndicator = this.quickEquipMode ? ' [Q-MODE]' : '';
    const capacityText = `Inventory: ${capacity}${qIndicator}`;
    const capacityX = startX + PANEL_WIDTH - capacityText.length - 2;
    const capacityColor = this.quickEquipMode ? COLORS.TEXT_BRIGHT : COLORS.TEXT_DIM;
    this.renderer.drawText(capacityText, capacityX, startY + 1, capacityColor);

    // Separator
    const sep = '-'.repeat(PANEL_WIDTH - 2);
    this.renderer.drawText(sep, startX + 1, startY + 2, COLORS.TEXT_DIM);

    // Sort controls
    let row = startY + 3;
    const sortLabel = 'Sort:';
    this.renderer.drawText(sortLabel, startX + 2, row, COLORS.TEXT_NORMAL);

    const sortX = startX + 2 + sortLabel.length + 1;
    const typeText = this.sortMode === 'type' ? '[Type]' : ' Type ';
    const valueText = this.sortMode === 'value' ? '[Value]' : ' Value ';
    const slotText = this.sortMode === 'slot' ? '[Slot]' : ' Slot ';

    const typeColor = this.sortMode === 'type' ? COLORS.TEXT_BRIGHT : COLORS.TEXT_DIM;
    const valueColor = this.sortMode === 'value' ? COLORS.TEXT_BRIGHT : COLORS.TEXT_DIM;
    const slotColor = this.sortMode === 'slot' ? COLORS.TEXT_BRIGHT : COLORS.TEXT_DIM;

    this.renderer.drawText(typeText, sortX, row, typeColor);
    this.renderer.drawText(valueText, sortX + typeText.length, row, valueColor);
    this.renderer.drawText(slotText, sortX + typeText.length + valueText.length, row, slotColor);
    row++;
    row++; // Skip a line after sort controls

    // Show current item in slot
    const currentItem = hero.equipment[this.selectedSlot];
    if (currentItem) {
      this.renderer.drawText('Currently equipped:', startX + 2, row, COLORS.TEXT_NORMAL);
      row++;
      const attackStr = currentItem.attackBonus > 0 ? `+${currentItem.attackBonus} ATK` : '';
      const defenseStr = currentItem.defenseBonus > 0 ? `+${currentItem.defenseBonus} DEF` : '';
      const stats = [attackStr, defenseStr].filter(s => s).join(' ');
      const itemText = stats ? `${currentItem.name} (${stats})` : currentItem.name;
      this.renderer.drawText(itemText, startX + 4, row, COLORS.TEXT_BRIGHT);
      row++;
      this.renderer.drawText('[U] Unequip', startX + 4, row, COLORS.TEXT_DIM);
      row += 2;
    } else {
      this.renderer.drawText('Currently equipped: [Empty]', startX + 2, row, COLORS.TEXT_DIM);
      row += 2;
    }

    // Show compatible inventory items
    const compatibleItems = this.getCompatibleItems(hero);
    if (compatibleItems.length === 0) {
      this.renderer.drawText('No compatible items in inventory', startX + 2, row, COLORS.TEXT_DIM);
    } else {
      this.renderer.drawText('Available items:', startX + 2, row, COLORS.TEXT_NORMAL);
      row++;

      for (let i = 0; i < Math.min(7, compatibleItems.length); i++) {
        const item = compatibleItems[i];
        const isEquipped = this.isItemEquipped(hero, item.id);

        // Item name line with [Equipped] indicator
        const equippedTag = isEquipped ? '[E] ' : '';
        const attackStr = item.attackBonus > 0 ? `+${item.attackBonus} ATK` : '';
        const defenseStr = item.defenseBonus > 0 ? `+${item.defenseBonus} DEF` : '';
        const stats = [attackStr, defenseStr].filter(s => s).join(' ');
        const itemText = stats ? `${i + 1}. ${equippedTag}${item.name} (${stats})` : `${i + 1}. ${equippedTag}${item.name}`;

        // Truncate if too long
        const maxWidth = PANEL_WIDTH - 4;
        const displayText = itemText.length > maxWidth
          ? itemText.substring(0, maxWidth - 3) + '...'
          : itemText;

        const itemColor = isEquipped ? COLORS.TEXT_BRIGHT : COLORS.TEXT_NORMAL;
        this.renderer.drawText(displayText, startX + 2, row, itemColor);
        row++;

        // Show comparison with currently equipped item (if not the same item)
        if (!isEquipped && currentItem) {
          const atkComparison = this.getStatComparison(item.attackBonus, currentItem.attackBonus, 'ATK');
          const defComparison = this.getStatComparison(item.defenseBonus, currentItem.defenseBonus, 'DEF');

          const comparisonParts: string[] = [];
          if (item.attackBonus !== currentItem.attackBonus) {
            comparisonParts.push(atkComparison.text);
          }
          if (item.defenseBonus !== currentItem.defenseBonus) {
            comparisonParts.push(defComparison.text);
          }

          if (comparisonParts.length > 0) {
            const comparisonText = `   Change: ${comparisonParts.join(', ')}`;

            // Use color based on overall change (positive if any stat improves)
            const totalChange = (item.attackBonus - currentItem.attackBonus) + (item.defenseBonus - currentItem.defenseBonus);
            const compColor = totalChange > 0 ? COLORS.TEXT_POSITIVE : totalChange < 0 ? COLORS.TEXT_NEGATIVE : COLORS.TEXT_NORMAL;

            this.renderer.drawText(comparisonText, startX + 2, row, compColor);
            row++;
          }
        } else if (!isEquipped && !currentItem) {
          // Show that this would be a new equip
          const changeText = `   Change: +${item.attackBonus} ATK, +${item.defenseBonus} DEF`;
          this.renderer.drawText(changeText, startX + 2, row, COLORS.TEXT_POSITIVE);
          row++;
        }
      }
    }

    // Instructions
    const instrRow = startY + PANEL_HEIGHT - 2;
    const instr = compatibleItems.length > 0
      ? '[1-9] Equip  [Q] Quick-equip  [U] Unequip'
      : '[U] Unequip  [T/V/S] Sort  [ESC] Back';
    const instrX = startX + Math.floor((PANEL_WIDTH - instr.length) / 2);
    this.renderer.drawText(instr, instrX, instrRow, COLORS.TEXT_DIM);
  }

  private getTotalBonus(hero: Hero, type: 'attack' | 'defense'): number {
    let total = 0;
    for (const slot of SLOT_LAYOUT) {
      const item = hero.equipment[slot.key];
      if (item) {
        total += type === 'attack' ? item.attackBonus : item.defenseBonus;
      }
    }
    return total;
  }

  /**
   * Check if an item is currently equipped
   */
  private isItemEquipped(hero: Hero, itemId: string): boolean {
    return Object.values(hero.equipment).some(equipped => equipped?.id === itemId);
  }

  /**
   * Get comparison text and color for stat difference
   * Returns color and formatted text (e.g., "+2 ATK" in green, "-1 DEF" in red)
   */
  private getStatComparison(newValue: number, currentValue: number, statName: string): { text: string; color: string } {
    const diff = newValue - currentValue;

    if (diff > 0) {
      return { text: `+${diff} ${statName}`, color: COLORS.TEXT_POSITIVE };
    } else if (diff < 0) {
      return { text: `${diff} ${statName}`, color: COLORS.TEXT_NEGATIVE };
    } else {
      return { text: `±0 ${statName}`, color: COLORS.TEXT_NORMAL };
    }
  }
}
