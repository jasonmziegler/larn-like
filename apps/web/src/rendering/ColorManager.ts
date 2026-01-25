import { GAME_CONSTANTS } from '@larn-like/shared';

export class ColorManager {
  // Green intensity levels for authentic terminal aesthetic
  private intensityLevels = {
    bright: GAME_CONSTANTS.COLORS.TEXT_BRIGHT,   // #00FF00
    normal: GAME_CONSTANTS.COLORS.TEXT_NORMAL,   // #00CC00
    dim: GAME_CONSTANTS.COLORS.TEXT_DIM          // #008800
  };

  public getBrightColor(): string {
    return this.intensityLevels.bright;
  }

  public getNormalColor(): string {
    return this.intensityLevels.normal;
  }

  public getDimColor(): string {
    return this.intensityLevels.dim;
  }

  public getColorByIntensity(intensity: 'bright' | 'normal' | 'dim'): string {
    return this.intensityLevels[intensity];
  }

  public getHealthColor(healthPercent: number): string {
    if (healthPercent <= 25) {
      return GAME_CONSTANTS.COLORS.HEALTH_CRITICAL;
    } else if (healthPercent <= 50) {
      return this.intensityLevels.dim;
    } else {
      return this.intensityLevels.normal;
    }
  }

  public getGoldColor(): string {
    return GAME_CONSTANTS.COLORS.GOLD_COLOR;
  }

  public getUIBorderColor(): string {
    return GAME_CONSTANTS.COLORS.UI_BORDER;
  }

  public getBackgroundColor(): string {
    return GAME_CONSTANTS.COLORS.BACKGROUND;
  }

  // Generate green shade based on distance or importance
  public getGreenShade(factor: number): string {
    // factor should be between 0 (dim) and 1 (bright)
    const clampedFactor = Math.max(0, Math.min(1, factor));
    const greenValue = Math.floor(136 + (255 - 136) * clampedFactor);
    return `#00${greenValue.toString(16).padStart(2, '0')}00`;
  }
}
