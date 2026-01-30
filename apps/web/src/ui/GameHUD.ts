import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { Hero, GAME_CONSTANTS } from '@larn-like/shared';
import { getEffectiveAttack, getEffectiveDefense } from '../game/Hero';

const COLORS = GAME_CONSTANTS.COLORS;

export class GameHUD {
  private renderer: CanvasRenderer;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  public renderStatusBar(hero: Hero, monstersLeft: number, row: number): void {
    const healthColor = hero.currentStats.hp < 10 ? COLORS.HEALTH_CRITICAL : COLORS.TEXT_NORMAL;
    const hpText = `HP:${hero.currentStats.hp}/${hero.currentStats.maxHp}`;
    const atkText = `ATK:${getEffectiveAttack(hero)}`;
    const defText = `DEF:${getEffectiveDefense(hero)}`;
    const teethText = `Teeth:${hero.teethCurrency}`;
    const monsterText = `Mon:${monstersLeft}`;

    this.renderer.drawText(hpText, 2, row, healthColor);
    this.renderer.drawText(atkText, 16, row, COLORS.TEXT_NORMAL);
    this.renderer.drawText(defText, 24, row, COLORS.TEXT_NORMAL);
    this.renderer.drawText(teethText, 32, row, COLORS.GOLD_COLOR);
    this.renderer.drawText(monsterText, 44, row, COLORS.TEXT_NORMAL);
    this.renderer.drawText('[WASD/Numpad] [R]Title', 54, row, COLORS.TEXT_DIM);
  }

  public renderStatsPanel(hero: Hero, col: number, startRow: number): void {
    this.renderer.drawText(`${hero.name} Lv${hero.level}`, col, startRow, COLORS.TEXT_BRIGHT);

    const healthColor = hero.currentStats.hp < 10 ? COLORS.HEALTH_CRITICAL : COLORS.TEXT_NORMAL;
    this.renderer.drawText(
      `HP: ${hero.currentStats.hp}/${hero.currentStats.maxHp}`,
      col, startRow + 1, healthColor
    );
    this.renderer.drawText(`STR: ${hero.currentStats.strength}`, col, startRow + 2, COLORS.TEXT_NORMAL);
    this.renderer.drawText(`DEX: ${hero.currentStats.dexterity}`, col, startRow + 3, COLORS.TEXT_NORMAL);
    this.renderer.drawText(`CON: ${hero.currentStats.constitution}`, col, startRow + 4, COLORS.TEXT_NORMAL);
    this.renderer.drawText(`ATK: ${getEffectiveAttack(hero)}`, col, startRow + 5, COLORS.TEXT_DIM);
    this.renderer.drawText(`DEF: ${getEffectiveDefense(hero)}`, col, startRow + 6, COLORS.TEXT_DIM);
  }

  public renderEquipmentPanel(hero: Hero, col: number, startRow: number): void {
    this.renderer.drawText('Equipment:', col, startRow, COLORS.TEXT_BRIGHT);

    const weapon = hero.equipment.weapon;
    const armor = hero.equipment.bodyArmor;

    this.renderer.drawText(
      `Wpn: ${weapon ? weapon.name : '(none)'}`,
      col, startRow + 1, weapon ? COLORS.TEXT_NORMAL : COLORS.TEXT_DIM
    );
    this.renderer.drawText(
      `Arm: ${armor ? armor.name : '(none)'}`,
      col, startRow + 2, armor ? COLORS.TEXT_NORMAL : COLORS.TEXT_DIM
    );
  }
}
