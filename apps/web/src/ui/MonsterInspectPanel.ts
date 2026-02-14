import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { GAME_CONSTANTS } from '@larn-like/shared';
import { Monster } from '../game/Combat';

const COLORS = GAME_CONSTANTS.COLORS;
const PANEL_WIDTH = 46;
const PANEL_HEIGHT = 20;
const HISTORY_PAGE_SIZE = 5;

/**
 * Generates the evolution title for a monster based on kill count.
 */
export function getEvolutionTitle(monster: Monster): string {
  const killCount = monster.killHistory?.length || 0;
  if (killCount === 0) return '';
  if (killCount === 1) {
    const victimName = monster.killHistory?.[0]?.heroName || 'Unknown';
    return `Slayer of ${victimName}`;
  }
  if (killCount >= 2 && killCount <= 4) {
    return `Slayer of ${killCount} Heroes`;
  }
  return `Legendary Slayer of ${killCount} Heroes`;
}

/**
 * Monster inspection panel that displays full evolution history, equipment, and stats.
 */
export class MonsterInspectPanel {
  private renderer: CanvasRenderer;
  private _isOpen: boolean = false;
  private _monster: Monster | null = null;
  private _historyPage: number = 0;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public open(monster: Monster): void {
    this._isOpen = true;
    this._monster = monster;
    this._historyPage = 0;
  }

  public close(): void {
    this._isOpen = false;
    this._monster = null;
    this._historyPage = 0;
  }

  public scrollHistoryUp(): void {
    if (this._historyPage > 0) {
      this._historyPage--;
    }
  }

  public scrollHistoryDown(): void {
    const killCount = this._monster?.killHistory?.length || 0;
    const maxPage = Math.max(0, Math.ceil(killCount / HISTORY_PAGE_SIZE) - 1);
    if (this._historyPage < maxPage) {
      this._historyPage++;
    }
  }

  public render(): void {
    if (!this._isOpen || !this._monster) return;

    const monster = this._monster;
    const startX = Math.floor((GAME_CONSTANTS.VIEWPORT_WIDTH - PANEL_WIDTH) / 2);
    const startY = Math.floor((GAME_CONSTANTS.VIEWPORT_HEIGHT - PANEL_HEIGHT) / 2);

    // Fill entire panel area with solid black background
    this.renderer.fillRect(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.BACKGROUND);

    // Draw panel border on top of background
    this.renderer.drawBox(startX, startY, PANEL_WIDTH, PANEL_HEIGHT, COLORS.UI_BORDER);

    // Header with evolution title
    const title = monster.isEvolved && monster.evolutionLevel && monster.evolutionLevel > 0
      ? `${monster.name} - ${getEvolutionTitle(monster)}`
      : monster.name;
    const titleDisplay = title.length > PANEL_WIDTH - 4 ? title.substring(0, PANEL_WIDTH - 4) : title;
    const titleX = startX + Math.floor((PANEL_WIDTH - titleDisplay.length) / 2);
    this.renderer.drawText(titleDisplay, titleX, startY + 1, COLORS.TEXT_BRIGHT);

    // Separator
    const sep = '-'.repeat(PANEL_WIDTH - 2);
    this.renderer.drawText(sep, startX + 1, startY + 2, COLORS.TEXT_DIM);

    let currentRow = startY + 3;

    // Stats section
    const baseAtk = monster.attack;
    const baseDef = monster.defense;
    const equipAtk = this.getTotalAttackBonus(monster);
    const equipDef = this.getTotalDefenseBonus(monster);
    const totalAtk = baseAtk + equipAtk;
    const totalDef = baseDef + equipDef;

    this.renderer.drawText('Stats:', startX + 2, currentRow, COLORS.TEXT_BRIGHT);
    currentRow++;
    this.renderer.drawText(`HP: ${monster.health}/${monster.maxHealth}`, startX + 4, currentRow, COLORS.TEXT_NORMAL);
    currentRow++;

    if (equipAtk > 0) {
      this.renderer.drawText(`ATK: ${totalAtk} (${baseAtk} + ${equipAtk})`, startX + 4, currentRow, COLORS.TEXT_NORMAL);
    } else {
      this.renderer.drawText(`ATK: ${baseAtk}`, startX + 4, currentRow, COLORS.TEXT_NORMAL);
    }
    currentRow++;

    if (equipDef > 0) {
      this.renderer.drawText(`DEF: ${totalDef} (${baseDef} + ${equipDef})`, startX + 4, currentRow, COLORS.TEXT_NORMAL);
    } else {
      this.renderer.drawText(`DEF: ${baseDef}`, startX + 4, currentRow, COLORS.TEXT_NORMAL);
    }
    currentRow += 2;

    // Equipment section
    this.renderer.drawText('Equipment:', startX + 2, currentRow, COLORS.TEXT_BRIGHT);
    currentRow++;

    const equipmentSlots = monster.equipment;
    const hasEquipment = equipmentSlots && (
      equipmentSlots.weapon || equipmentSlots.bodyArmor || equipmentSlots.offHand ||
      equipmentSlots.helmet || equipmentSlots.gloves || equipmentSlots.boots ||
      equipmentSlots.amulet || equipmentSlots.ring1 || equipmentSlots.ring2 || equipmentSlots.belt
    );

    if (!hasEquipment) {
      this.renderer.drawText('None', startX + 4, currentRow, COLORS.TEXT_DIM);
      currentRow += 2;
    } else {
      const equipmentList = this.getEquipmentList(monster);
      for (const line of equipmentList.slice(0, 5)) { // Max 5 lines for equipment
        this.renderer.drawText(line, startX + 4, currentRow, COLORS.TEXT_NORMAL);
        currentRow++;
      }
      currentRow++;
    }

    // Kill History section
    const killHistory = monster.killHistory || [];
    this.renderer.drawText('Kill History:', startX + 2, currentRow, COLORS.TEXT_BRIGHT);
    currentRow++;

    if (killHistory.length === 0) {
      this.renderer.drawText('No notable history', startX + 4, currentRow, COLORS.TEXT_DIM);
      currentRow++;
    } else {
      // Paginate history
      const startIndex = this._historyPage * HISTORY_PAGE_SIZE;
      const endIndex = Math.min(startIndex + HISTORY_PAGE_SIZE, killHistory.length);
      const pageRecords = killHistory.slice(startIndex, endIndex);

      for (const record of pageRecords) {
        const line = `Slew ${record.heroName} (${record.killedAt})`;
        const displayLine = line.length > PANEL_WIDTH - 6 ? line.substring(0, PANEL_WIDTH - 6) : line;
        this.renderer.drawText(displayLine, startX + 4, currentRow, COLORS.TEXT_NORMAL);
        currentRow++;
      }

      // Pagination indicator
      if (killHistory.length > HISTORY_PAGE_SIZE) {
        const totalPages = Math.ceil(killHistory.length / HISTORY_PAGE_SIZE);
        const pageIndicator = `[↑/↓] More history (${this._historyPage + 1}/${totalPages})`;
        this.renderer.drawText(pageIndicator, startX + 4, currentRow, COLORS.TEXT_DIM);
        currentRow++;
      }
    }

    // Instructions
    const instrRow = startY + PANEL_HEIGHT - 2;
    const instr = '[X/ESC] Close  [↑/↓] Scroll';
    const instrX = startX + Math.floor((PANEL_WIDTH - instr.length) / 2);
    this.renderer.drawText(instr, instrX, instrRow, COLORS.TEXT_DIM);
  }

  private getTotalAttackBonus(monster: Monster): number {
    let total = 0;
    const equipment = monster.equipment;
    if (!equipment) return 0;

    if (equipment.weapon?.attackBonus) total += equipment.weapon.attackBonus;
    if (equipment.offHand?.attackBonus) total += equipment.offHand.attackBonus;
    if (equipment.bodyArmor?.attackBonus) total += equipment.bodyArmor.attackBonus;
    if (equipment.helmet?.attackBonus) total += equipment.helmet.attackBonus;
    if (equipment.gloves?.attackBonus) total += equipment.gloves.attackBonus;
    if (equipment.boots?.attackBonus) total += equipment.boots.attackBonus;
    if (equipment.amulet?.attackBonus) total += equipment.amulet.attackBonus;
    if (equipment.ring1?.attackBonus) total += equipment.ring1.attackBonus;
    if (equipment.ring2?.attackBonus) total += equipment.ring2.attackBonus;
    if (equipment.belt?.attackBonus) total += equipment.belt.attackBonus;

    return total;
  }

  private getTotalDefenseBonus(monster: Monster): number {
    let total = 0;
    const equipment = monster.equipment;
    if (!equipment) return 0;

    if (equipment.weapon?.defenseBonus) total += equipment.weapon.defenseBonus;
    if (equipment.offHand?.defenseBonus) total += equipment.offHand.defenseBonus;
    if (equipment.bodyArmor?.defenseBonus) total += equipment.bodyArmor.defenseBonus;
    if (equipment.helmet?.defenseBonus) total += equipment.helmet.defenseBonus;
    if (equipment.gloves?.defenseBonus) total += equipment.gloves.defenseBonus;
    if (equipment.boots?.defenseBonus) total += equipment.boots.defenseBonus;
    if (equipment.amulet?.defenseBonus) total += equipment.amulet.defenseBonus;
    if (equipment.ring1?.defenseBonus) total += equipment.ring1.defenseBonus;
    if (equipment.ring2?.defenseBonus) total += equipment.ring2.defenseBonus;
    if (equipment.belt?.defenseBonus) total += equipment.belt.defenseBonus;

    return total;
  }

  private getEquipmentList(monster: Monster): string[] {
    const lines: string[] = [];
    const equipment = monster.equipment;
    if (!equipment) return lines;

    const slots = [
      { key: 'weapon', label: 'Weapon' },
      { key: 'offHand', label: 'Off-Hand' },
      { key: 'bodyArmor', label: 'Armor' },
      { key: 'helmet', label: 'Helmet' },
      { key: 'gloves', label: 'Gloves' },
      { key: 'boots', label: 'Boots' },
      { key: 'amulet', label: 'Amulet' },
      { key: 'ring1', label: 'Ring1' },
      { key: 'ring2', label: 'Ring2' },
      { key: 'belt', label: 'Belt' },
    ];

    for (const slot of slots) {
      const item = equipment[slot.key as keyof typeof equipment];
      if (item && typeof item === 'object' && 'name' in item) {
        const bonusStr = this.formatBonuses(item);
        lines.push(`${slot.label}: ${item.name}${bonusStr}`);
      }
    }

    return lines;
  }

  private formatBonuses(item: { attackBonus?: number; defenseBonus?: number }): string {
    const parts: string[] = [];
    if (item.attackBonus) parts.push(`+${item.attackBonus} ATK`);
    if (item.defenseBonus) parts.push(`+${item.defenseBonus} DEF`);
    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
  }
}
