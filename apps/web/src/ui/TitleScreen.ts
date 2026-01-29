import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { GAME_CONSTANTS } from '@larn-like/shared';

const COLORS = GAME_CONSTANTS.COLORS;
const STORAGE_KEY = 'larn-like-credits';
const DEFAULT_CREDITS = 3;

// ASCII art title - each string is one row
const TITLE_ART: string[] = [
  ' _       _    ____  _   _       _     ___ _  _______ ',
  '| |     / \\  |  _ \\| \\ | |     | |   |_ _| |/ / ____|',
  '| |    / _ \\ | |_) |  \\| |_____| |    | || \' /|  _|  ',
  '| |__ / ___ \\|  _ <| |\\  |_____| |___ | || . \\| |___ ',
  '|____/_/   \\_\\_| \\_\\_| \\_|     |_____|___|_|\\_\\_____|',
];

const VIEWPORT_WIDTH = GAME_CONSTANTS.VIEWPORT_WIDTH; // 80
const VIEWPORT_HEIGHT = GAME_CONSTANTS.VIEWPORT_HEIGHT; // 24
const BLINK_INTERVAL_MS = 600;
const FLASH_DURATION_MS = 300;

export type TitleScreenCallback = () => void;

export class TitleScreen {
  private renderer: CanvasRenderer;
  private credits: number;
  private onGameStart: TitleScreenCallback | null = null;
  private flashTimer: number = 0;
  private flashType: 'credit' | 'error' | null = null;
  private blinkTimer: number = 0;
  private blinkVisible: boolean = true;
  private lastTimestamp: number = 0;
  private animationFrameId: number = 0;
  private inputHandler: ((e: KeyboardEvent) => void) | null = null;
  private active: boolean = false;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
    this.credits = this.loadCredits();
  }

  public show(onGameStart: TitleScreenCallback): void {
    this.onGameStart = onGameStart;
    this.active = true;
    this.blinkTimer = 0;
    this.blinkVisible = true;
    this.flashTimer = 0;
    this.flashType = null;
    this.lastTimestamp = 0;

    this.bindInput();
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  public hide(): void {
    this.active = false;
    this.unbindInput();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  public getCredits(): number {
    return this.credits;
  }

  public setCredits(value: number): void {
    this.credits = Math.max(0, value);
    this.saveCredits();
  }

  public addCredit(): void {
    this.credits++;
    this.saveCredits();
    this.triggerFlash('credit');
  }

  public attemptGameStart(): boolean {
    if (this.credits <= 0) {
      this.triggerFlash('error');
      return false;
    }
    this.credits--;
    this.saveCredits();
    this.hide();
    if (this.onGameStart) {
      this.onGameStart();
    }
    return true;
  }

  // --- State persistence ---

  private loadCredits(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? DEFAULT_CREDITS : parsed;
      }
    } catch {
      // localStorage unavailable (e.g., tests)
    }
    return DEFAULT_CREDITS;
  }

  private saveCredits(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.credits.toString());
    } catch {
      // localStorage unavailable
    }
  }

  // --- Input handling ---

  private bindInput(): void {
    this.inputHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.inputHandler);
  }

  private unbindInput(): void {
    if (this.inputHandler) {
      document.removeEventListener('keydown', this.inputHandler);
      this.inputHandler = null;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.addCredit();
        break;
      case 'Enter':
        e.preventDefault();
        this.attemptGameStart();
        break;
    }
  }

  // --- Visual feedback ---

  private triggerFlash(type: 'credit' | 'error'): void {
    this.flashType = type;
    this.flashTimer = FLASH_DURATION_MS;
  }

  // --- Animation loop ---

  private loop(timestamp: number): void {
    if (!this.active) return;

    const delta = this.lastTimestamp === 0 ? 16 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.update(delta);
    this.render();

    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
  }

  private update(deltaMs: number): void {
    // Blink timer for INSERT COIN text
    this.blinkTimer += deltaMs;
    if (this.blinkTimer >= BLINK_INTERVAL_MS) {
      this.blinkTimer -= BLINK_INTERVAL_MS;
      this.blinkVisible = !this.blinkVisible;
    }

    // Flash timer for credit/error feedback
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
      if (this.flashTimer === 0) {
        this.flashType = null;
      }
    }
  }

  // --- Rendering ---

  public render(): void {
    this.renderer.clear();

    // Draw border
    this.renderer.drawBox(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Draw ASCII art title (centered)
    this.renderTitle();

    // Draw subtitle
    const subtitle = 'A Web3 Dungeon Crawler';
    const subtitleX = Math.floor((VIEWPORT_WIDTH - subtitle.length) / 2);
    this.renderer.drawText(subtitle, subtitleX, 9, COLORS.TEXT_DIM);

    // Draw INSERT COIN prompt (blinking)
    this.renderInsertCoin();

    // Draw credit counter
    this.renderCredits();

    // Draw instructions
    this.renderInstructions();
  }

  private renderTitle(): void {
    const startRow = 2;
    for (let i = 0; i < TITLE_ART.length; i++) {
      const line = TITLE_ART[i];
      const x = Math.floor((VIEWPORT_WIDTH - line.length) / 2);
      this.renderer.drawText(line, x, startRow + i, COLORS.TEXT_BRIGHT);
    }
  }

  private renderInsertCoin(): void {
    const text = '- - -  I N S E R T   C O I N  - - -';
    const x = Math.floor((VIEWPORT_WIDTH - text.length) / 2);
    const row = 12;

    if (this.blinkVisible) {
      const color = this.isFlashing('error') ? COLORS.HEALTH_CRITICAL : COLORS.TEXT_BRIGHT;
      this.renderer.drawText(text, x, row, color);
    }
  }

  private renderCredits(): void {
    const text = `CREDITS: ${this.credits}`;
    const x = Math.floor((VIEWPORT_WIDTH - text.length) / 2);
    const row = 15;

    let color: string = COLORS.TEXT_NORMAL;
    if (this.isFlashing('credit')) {
      color = COLORS.TEXT_BRIGHT;
    } else if (this.isFlashing('error')) {
      color = COLORS.HEALTH_CRITICAL;
    } else if (this.credits === 0) {
      color = COLORS.TEXT_DIM;
    }

    this.renderer.drawText(text, x, row, color);
  }

  private renderInstructions(): void {
    const line1 = '[SPACE] Insert Coin     [ENTER] Start Game';
    const line2 = 'Survive the dungeon. Collect teeth. Ascend.';

    const x1 = Math.floor((VIEWPORT_WIDTH - line1.length) / 2);
    const x2 = Math.floor((VIEWPORT_WIDTH - line2.length) / 2);

    this.renderer.drawText(line1, x1, 18, COLORS.TEXT_DIM);
    this.renderer.drawText(line2, x2, 20, COLORS.TEXT_DIM);
  }

  private isFlashing(type: 'credit' | 'error'): boolean {
    return this.flashTimer > 0 && this.flashType === type;
  }
}
