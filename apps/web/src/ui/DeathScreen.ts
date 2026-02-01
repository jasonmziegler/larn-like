// DeathScreen - displays hero death information and monster promotion details

import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { DeathProcessingResult } from '../world/DeathProcessor';
import { GAME_CONSTANTS } from '@larn-like/shared';

const COLORS = GAME_CONSTANTS.COLORS;

export class DeathScreen {
  constructor(private renderer: CanvasRenderer) {}

  /**
   * Render the death screen with promotion feedback
   */
  render(heroName: string, deathResult?: DeathProcessingResult): void {
    this.renderer.clear();

    const centerX = 40; // Center of 80-column screen
    let row = 10;

    // Title
    const title = '*** YOU DIED! ***';
    this.renderer.drawText(title, centerX - Math.floor(title.length / 2), row, '#FF0000');
    row += 2;

    if (deathResult?.summary) {
      const { summary } = deathResult;

      // Death message
      const deathMsg = `${heroName} was slain by ${summary.killerName} on Level ${summary.oldLevel}`;
      this.renderer.drawText(deathMsg, centerX - Math.floor(deathMsg.length / 2), row, COLORS.TEXT_NORMAL);
      row += 2;

      // Promotion header
      const promotionHeader = '--- MONSTER PROMOTION ---';
      this.renderer.drawText(promotionHeader, centerX - Math.floor(promotionHeader.length / 2), row, COLORS.TEXT_BRIGHT);
      row += 1;

      // Promotion message
      const promotionMsg = `${summary.killerName} has been promoted to Level ${summary.newLevel}!`;
      this.renderer.drawText(promotionMsg, centerX - Math.floor(promotionMsg.length / 2), row, '#FFAA00');
      row += 2;

      // Stat changes
      const hpChange = `HP: ${summary.statChanges.hp.old} → ${summary.statChanges.hp.new}`;
      const atkChange = `ATK: ${summary.statChanges.attack.old} → ${summary.statChanges.attack.new}`;
      const defChange = `DEF: ${summary.statChanges.defense.old} → ${summary.statChanges.defense.new}`;

      this.renderer.drawText(hpChange, centerX - Math.floor(hpChange.length / 2), row, COLORS.TEXT_NORMAL);
      row += 1;
      this.renderer.drawText(atkChange, centerX - Math.floor(atkChange.length / 2), row, COLORS.TEXT_NORMAL);
      row += 1;
      this.renderer.drawText(defChange, centerX - Math.floor(defChange.length / 2), row, COLORS.TEXT_NORMAL);
      row += 2;

      // Teeth dropped
      const teethMsg = `${summary.teethDropped} teeth scattered at death site`;
      this.renderer.drawText(teethMsg, centerX - Math.floor(teethMsg.length / 2), row, COLORS.TEXT_DIM);
      row += 1;

      // Equipment transfer info
      if (deathResult.deathEvent.equipmentTransferred.length > 0) {
        const equipNames = deathResult.deathEvent.equipmentTransferred.map((e: any) => e.name).join(', ');
        const equipMsg = `The ${summary.killerName} claimed ${equipNames}`;
        this.renderer.drawText(equipMsg, centerX - Math.floor(equipMsg.length / 2), row, '#FFAA00');
        row += 1;
      }

      // Equipment overflow info
      if (deathResult.deathEvent.equipmentScattered.length > 0) {
        const overflowMsg = 'Remaining items scattered into a nearby chest';
        this.renderer.drawText(overflowMsg, centerX - Math.floor(overflowMsg.length / 2), row, COLORS.TEXT_DIM);
        row += 1;
      }

      row += 2;
    } else {
      // Fallback if no death result (shouldn't happen)
      const msg = `${heroName} has fallen.`;
      this.renderer.drawText(msg, centerX - Math.floor(msg.length / 2), row, COLORS.TEXT_NORMAL);
      row += 3;
    }

    // Restart prompt
    const prompt = 'Press R to start a new hero';
    this.renderer.drawText(prompt, centerX - Math.floor(prompt.length / 2), row, COLORS.TEXT_BRIGHT);
  }
}
