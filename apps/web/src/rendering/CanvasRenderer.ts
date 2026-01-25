import { GAME_CONSTANTS } from '@larn-like/shared';
import { ColorManager } from './ColorManager';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private colorManager: ColorManager;
  private fontSize: number = 16;
  private charWidth: number = 10;
  private charHeight: number = 16;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }

    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    this.ctx = ctx;
    this.colorManager = new ColorManager();
    this.initialize();
  }

  private initialize(): void {
    // Set canvas dimensions based on viewport size
    this.canvas.width = GAME_CONSTANTS.VIEWPORT_WIDTH * this.charWidth;
    this.canvas.height = GAME_CONSTANTS.VIEWPORT_HEIGHT * this.charHeight;

    // Configure context for ASCII rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.ctx.textBaseline = 'top';
  }

  public clear(): void {
    this.ctx.fillStyle = GAME_CONSTANTS.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawChar(
    char: string,
    x: number,
    y: number,
    color: string = GAME_CONSTANTS.COLORS.TEXT_NORMAL
  ): void {
    const pixelX = x * this.charWidth;
    const pixelY = y * this.charHeight;

    this.ctx.fillStyle = color;
    this.ctx.fillText(char, pixelX, pixelY);
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    color: string = GAME_CONSTANTS.COLORS.TEXT_NORMAL
  ): void {
    for (let i = 0; i < text.length; i++) {
      this.drawChar(text[i], x + i, y, color);
    }
  }

  public drawBox(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = GAME_CONSTANTS.COLORS.UI_BORDER
  ): void {
    // Draw corners
    this.drawChar('+', x, y, color);
    this.drawChar('+', x + width - 1, y, color);
    this.drawChar('+', x, y + height - 1, color);
    this.drawChar('+', x + width - 1, y + height - 1, color);

    // Draw horizontal lines
    for (let i = 1; i < width - 1; i++) {
      this.drawChar('-', x + i, y, color);
      this.drawChar('-', x + i, y + height - 1, color);
    }

    // Draw vertical lines
    for (let i = 1; i < height - 1; i++) {
      this.drawChar('|', x, y + i, color);
      this.drawChar('|', x + width - 1, y + i, color);
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getColorManager(): ColorManager {
    return this.colorManager;
  }
}
