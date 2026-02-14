// BlessingPanel - UI overlay for soul shrine blessing interactions

import type { CanvasRenderer } from '../rendering/CanvasRenderer';
import type { EquipmentItem, EquipmentSlots } from '@larn-like/shared';
import { GAME_CONSTANTS } from '@larn-like/shared';
import { calculateBlessingChance, type ShrineData } from '../game/Blessing';

export class BlessingPanel {
  private renderer: CanvasRenderer;
  private shrine: ShrineData;
  private equipment: EquipmentSlots;
  private equippedItems: Array<{ item: EquipmentItem; slotName: string; index: number }>;

  constructor(renderer: CanvasRenderer, shrine: ShrineData, equipment: EquipmentSlots) {
    this.renderer = renderer;
    this.shrine = shrine;
    this.equipment = equipment;

    // Build list of equipped items (non-null slots)
    this.equippedItems = [];
    let index = 1;
    for (const [slotName, item] of Object.entries(equipment)) {
      if (item !== null) {
        this.equippedItems.push({ item, slotName, index });
        index++;
      }
    }
  }

  /**
   * Render the blessing panel as an overlay on the canvas.
   * Shows shrine info, equipped items, blessing chances, and instructions.
   */
  render(): void {
    const width = 70;
    const height = Math.min(25, 10 + this.equippedItems.length);
    const startX = Math.floor((GAME_CONSTANTS.VIEWPORT_WIDTH - width) / 2);
    const startY = Math.floor((GAME_CONSTANTS.VIEWPORT_HEIGHT - height) / 2);

    // Fill entire panel area with solid black background
    this.renderer.fillRect(startX, startY, width, height, '#000000');

    // Draw box border on top of background
    this.renderer.drawBox(startX, startY, width, height, '#8B4789');

    let row = startY + 2;

    // Header: Shrine name and soul energy
    const header = `† ${this.shrine.heroName}'s Shrine — Soul Energy: ${this.shrine.soulEnergy}`;
    this.renderer.drawText(header, startX + 2, row, '#CC66FF');
    row += 2;

    if (this.equippedItems.length === 0) {
      // No equipped items
      const message = 'You have nothing to bless.';
      this.renderer.drawText(message, startX + 2, row, '#888888');
      row += 2;

      const instruction = 'Press any key to close.';
      this.renderer.drawText(instruction, startX + 2, row, '#666666');
    } else {
      // List equipped items with blessing chances
      const instruction = 'Select an item to bless:';
      this.renderer.drawText(instruction, startX + 2, row, '#CCCCCC');
      row += 2;

      for (const { item, index } of this.equippedItems) {
        const chance = calculateBlessingChance(this.shrine.soulEnergy, item);
        const chancePercent = Math.round(chance * 100);

        // Format item line
        const atkInfo = item.attackBonus > 0 ? `ATK +${item.attackBonus}` : '';
        const defInfo = item.defenseBonus > 0 ? `DEF +${item.defenseBonus}` : '';
        const statsInfo =
          atkInfo && defInfo ? `${atkInfo}, ${defInfo}` : atkInfo || defInfo || 'no bonus';

        const itemLine = `${index}. ${item.name} (${statsInfo}) — ${chancePercent}% success`;

        // Highlight based on chance
        let color = '#FFFFFF';
        if (chancePercent >= 70) {
          color = '#00FF00'; // High chance - green
        } else if (chancePercent >= 50) {
          color = '#FFFF00'; // Medium chance - yellow
        } else if (chancePercent >= 30) {
          color = '#FFA500'; // Low chance - orange
        } else {
          color = '#FF6666'; // Very low chance - red
        }

        this.renderer.drawText(itemLine, startX + 2, row, color);
        row++;
      }

      row += 1;

      // Instructions
      const escInstruction = '[ESC] Cancel';
      this.renderer.drawText(escInstruction, startX + 2, row, '#666666');
    }
  }

  /**
   * Handle key input for item selection.
   *
   * @param key - The key pressed by the user
   * @returns The selected item, or null if panel should close without selection
   */
  handleInput(key: string): EquipmentItem | null {
    // No items - close on any key
    if (this.equippedItems.length === 0) {
      return null;
    }

    // ESC - close without selection
    if (key === 'Escape') {
      return null;
    }

    // Number key - select item
    const num = parseInt(key, 10);
    if (num >= 1 && num <= this.equippedItems.length) {
      const selectedEntry = this.equippedItems.find((entry) => entry.index === num);
      return selectedEntry ? selectedEntry.item : null;
    }

    // Invalid input - keep panel open
    return undefined as unknown as EquipmentItem | null;
  }

  /**
   * Get the number of equipped items available for blessing.
   *
   * @returns Count of non-null equipment slots
   */
  getItemCount(): number {
    return this.equippedItems.length;
  }

  /**
   * Get the shrine data associated with this panel.
   *
   * @returns The shrine data
   */
  getShrine(): ShrineData {
    return this.shrine;
  }
}
