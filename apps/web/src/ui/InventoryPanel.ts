import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { Hero, GAME_CONSTANTS } from '@larn-like/shared';
import { ReagentItem } from '../game/Combat';

const COLORS = GAME_CONSTANTS.COLORS;
const PANEL_WIDTH = 36;
const PANEL_HEIGHT = 16;

const STAT_LABELS: Record<string, string> = {
  dexterity: '+DEX',
  strength: '+STR',
  constitution: '+CON',
  all: '+ALL',
};

export interface GroupedReagent {
  reagent: ReagentItem;
  count: number;
}

export function getReagents(hero: Hero): ReagentItem[] {
  return (hero.inventory as unknown[]).filter(
    (item): item is ReagentItem =>
      item !== null && typeof item === 'object' && (item as ReagentItem).type === 'reagent'
  );
}

export function groupReagents(reagents: ReagentItem[]): GroupedReagent[] {
  const groups = new Map<string, GroupedReagent>();
  for (const reagent of reagents) {
    const key = reagent.monsterType;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
    } else {
      groups.set(key, { reagent, count: 1 });
    }
  }
  return Array.from(groups.values());
}

export class InventoryPanel {
  private renderer: CanvasRenderer;
  private _isOpen: boolean = false;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public open(): void {
    this._isOpen = true;
  }

  public close(): void {
    this._isOpen = false;
  }

  public toggle(): void {
    this._isOpen = !this._isOpen;
  }

  public render(hero: Hero): void {
    if (!this._isOpen) return;

    const reagents = getReagents(hero);
    const grouped = groupReagents(reagents);

    // Center the panel on the canvas
    const startX = Math.floor((GAME_CONSTANTS.VIEWPORT_WIDTH - PANEL_WIDTH) / 2);
    const startY = Math.floor((GAME_CONSTANTS.VIEWPORT_HEIGHT - PANEL_HEIGHT) / 2);

    // Fill entire panel area with solid black background
    this.renderer.fillRect(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.BACKGROUND);

    // Draw panel border on top of background
    this.renderer.drawBox(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.UI_BORDER);

    // Title
    const title = 'INVENTORY';
    const titleX = startX + Math.floor((PANEL_WIDTH - title.length) / 2);
    this.renderer.drawText(title, titleX, startY + 1, COLORS.TEXT_BRIGHT);

    // Separator
    const sep = '-'.repeat(PANEL_WIDTH - 2);
    this.renderer.drawText(sep, startX + 1, startY + 2, COLORS.TEXT_DIM);

    if (grouped.length === 0) {
      const emptyMsg = 'No items';
      const emptyX = startX + Math.floor((PANEL_WIDTH - emptyMsg.length) / 2);
      this.renderer.drawText(emptyMsg, emptyX, startY + 5, COLORS.TEXT_DIM);
    } else {
      // List reagents
      for (let i = 0; i < Math.min(9, grouped.length); i++) {
        const { reagent, count } = grouped[i];
        const statLabel = STAT_LABELS[reagent.statBonus.stat] || `+${reagent.statBonus.stat}`;
        const countStr = count > 1 ? ` (x${count})` : '';
        const line = `${i + 1}. ${reagent.name}${countStr}`;
        const row = startY + 3 + i;
        this.renderer.drawText(line, startX + 2, row, COLORS.TEXT_NORMAL);
        this.renderer.drawText(statLabel, startX + PANEL_WIDTH - 6, row, COLORS.TEXT_BRIGHT);
      }
    }

    // Instructions
    const instrRow = startY + PANEL_HEIGHT - 2;
    const instr = '[1-9] Use  [ESC/I/Tab] Close';
    const instrX = startX + Math.floor((PANEL_WIDTH - instr.length) / 2);
    this.renderer.drawText(instr, instrX, instrRow, COLORS.TEXT_DIM);
  }
}
