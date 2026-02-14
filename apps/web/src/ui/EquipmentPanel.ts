import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { Hero, GAME_CONSTANTS, EquipmentSlotType, EquipmentItem } from '@larn-like/shared';
import { isSlotBlocked } from '../game/Equipment';

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
  | { type: 'error'; message: string };

export class EquipmentPanel {
  private renderer: CanvasRenderer;
  private _isOpen: boolean = false;
  private selectedSlot: EquipmentSlotType | null = null;

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

    // 'u' to unequip current item
    if (key.toLowerCase() === 'u') {
      const currentItem = hero.equipment[this.selectedSlot];
      if (currentItem) {
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
        const action: EquipmentAction = { type: 'equip', slotKey: this.selectedSlot, item };
        this.selectedSlot = null; // Return to slot selection
        return action;
      }
    }

    return { type: 'none' };
  }

  private getCompatibleItems(hero: Hero): EquipmentItem[] {
    if (!this.selectedSlot) return [];

    // Hero inventory contains EquipmentItem objects
    return hero.inventory.filter(item => item.slot === this.selectedSlot);
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

    // Title
    const title = `SELECT ITEM FOR ${slotInfo.label.toUpperCase()}`;
    const titleX = startX + Math.floor((PANEL_WIDTH - title.length) / 2);
    this.renderer.drawText(title, titleX, startY + 1, COLORS.TEXT_BRIGHT);

    // Separator
    const sep = '-'.repeat(PANEL_WIDTH - 2);
    this.renderer.drawText(sep, startX + 1, startY + 2, COLORS.TEXT_DIM);

    // Show current item in slot
    let row = startY + 3;
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
        const attackStr = item.attackBonus > 0 ? `+${item.attackBonus} ATK` : '';
        const defenseStr = item.defenseBonus > 0 ? `+${item.defenseBonus} DEF` : '';
        const stats = [attackStr, defenseStr].filter(s => s).join(' ');
        const itemText = stats ? `${i + 1}. ${item.name} (${stats})` : `${i + 1}. ${item.name}`;

        // Truncate if too long
        const maxWidth = PANEL_WIDTH - 4;
        const displayText = itemText.length > maxWidth
          ? itemText.substring(0, maxWidth - 3) + '...'
          : itemText;

        this.renderer.drawText(displayText, startX + 2, row, COLORS.TEXT_NORMAL);
        row++;
      }
    }

    // Instructions
    const instrRow = startY + PANEL_HEIGHT - 2;
    const instr = compatibleItems.length > 0
      ? '[1-9] Equip  [U] Unequip  [ESC] Back'
      : '[U] Unequip  [ESC] Back';
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
}
