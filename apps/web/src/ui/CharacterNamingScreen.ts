import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { GAME_CONSTANTS } from '@larn-like/shared';
import type { WorldState } from '../world/WorldState';

const COLORS = GAME_CONSTANTS.COLORS;
const VIEWPORT_WIDTH = GAME_CONSTANTS.VIEWPORT_WIDTH;
const VIEWPORT_HEIGHT = GAME_CONSTANTS.VIEWPORT_HEIGHT;
const MAX_NAME_LENGTH = 12;
const BLINK_INTERVAL_MS = 600;
const FLASH_DURATION_MS = 300;
const RESET_MESSAGE_DURATION_MS = 2000;

export type NamingConfirmedCallback = (name: string) => void;
export type NamingCancelCallback = () => void;

export class CharacterNamingScreen {
  private renderer: CanvasRenderer;
  private name: string = '';
  private onNameConfirmed: NamingConfirmedCallback | null = null;
  private onCancel: NamingCancelCallback | null = null;
  private blinkTimer: number = 0;
  private cursorVisible: boolean = true;
  private flashTimer: number = 0;
  private flashType: 'error' | null = null;
  private lastTimestamp: number = 0;
  private animationFrameId: number = 0;
  private inputHandler: ((e: KeyboardEvent) => void) | null = null;
  private active: boolean = false;
  private worldState: WorldState | null = null;
  private resetMessageTimer: number = 0;
  private isResetting: boolean = false;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
  }

  public setWorldState(worldState: WorldState): void {
    this.worldState = worldState;
  }

  public show(onNameConfirmed: NamingConfirmedCallback, onCancel: NamingCancelCallback): void {
    this.onNameConfirmed = onNameConfirmed;
    this.onCancel = onCancel;
    this.name = '';
    this.active = true;
    this.blinkTimer = 0;
    this.cursorVisible = true;
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

  public getName(): string {
    return this.name;
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

    // Ignore input while reset is in progress
    if (this.isResetting) return;

    if (e.key === 'Enter') {
      e.preventDefault();

      // Shift+Enter: World reset
      if (e.shiftKey) {
        this.resetWorld();
        return;
      }

      // Normal Enter: Confirm name
      this.confirmName();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.cancel();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.name = this.name.slice(0, -1);
      return;
    }

    // Only accept single printable characters
    if (e.key.length === 1) {
      e.preventDefault();
      if (this.isAllowedChar(e.key) && this.name.length < MAX_NAME_LENGTH) {
        this.name += e.key;
      }
    }
  }

  private async resetWorld(): Promise<void> {
    if (!this.worldState) {
      console.warn('Cannot reset world: WorldState not set');
      return;
    }

    this.isResetting = true;
    this.resetMessageTimer = RESET_MESSAGE_DURATION_MS;

    try {
      // Delete all IndexedDB data
      const store = this.worldState.getStore();
      await store.deleteDatabase();

      // Reset credits to default
      this.worldState.setCredits(3);

      // Reinitialize world state
      await this.worldState.initializeWorld();
    } catch (err) {
      console.error('Failed to reset world:', err);
    }

    // Reset will complete after message timer expires
  }

  private isAllowedChar(char: string): boolean {
    return /^[a-zA-Z0-9 ]$/.test(char);
  }

  private confirmName(): void {
    const trimmed = this.name.trim();
    if (trimmed.length === 0) {
      this.triggerFlash('error');
      return;
    }
    this.hide();
    if (this.onNameConfirmed) {
      this.onNameConfirmed(trimmed);
    }
  }

  private cancel(): void {
    this.hide();
    if (this.onCancel) {
      this.onCancel();
    }
  }

  // --- Visual feedback ---

  private triggerFlash(type: 'error'): void {
    this.flashType = type;
    this.flashTimer = FLASH_DURATION_MS;
  }

  private isFlashing(): boolean {
    return this.flashTimer > 0 && this.flashType === 'error';
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
    this.blinkTimer += deltaMs;
    if (this.blinkTimer >= BLINK_INTERVAL_MS) {
      this.blinkTimer -= BLINK_INTERVAL_MS;
      this.cursorVisible = !this.cursorVisible;
    }

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
      if (this.flashTimer === 0) {
        this.flashType = null;
      }
    }

    if (this.resetMessageTimer > 0) {
      this.resetMessageTimer = Math.max(0, this.resetMessageTimer - deltaMs);
      if (this.resetMessageTimer === 0) {
        this.isResetting = false;
        this.name = ''; // Clear name after reset
      }
    }
  }

  // --- Rendering ---

  public render(): void {
    this.renderer.clear();
    this.renderer.drawBox(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // If resetting, show reset message overlay
    if (this.isResetting) {
      const resetMsg = 'World reset! Starting fresh...';
      const resetX = Math.floor((VIEWPORT_WIDTH - resetMsg.length) / 2);
      this.renderer.drawText(resetMsg, resetX, 14, COLORS.TEXT_BRIGHT);
      return;
    }

    // Title
    const title = 'NAME YOUR HERO';
    const titleX = Math.floor((VIEWPORT_WIDTH - title.length) / 2);
    this.renderer.drawText(title, titleX, 9, COLORS.TEXT_BRIGHT);

    // Input area underline markers
    const inputRow = 14;
    const inputFieldWidth = MAX_NAME_LENGTH;
    const inputStartX = Math.floor((VIEWPORT_WIDTH - inputFieldWidth) / 2);
    const underline = '_'.repeat(inputFieldWidth);
    this.renderer.drawText(underline, inputStartX, inputRow, COLORS.TEXT_DIM);

    // Name text
    const nameColor = this.isFlashing() ? COLORS.HEALTH_CRITICAL : COLORS.TEXT_NORMAL;
    if (this.name.length > 0) {
      this.renderer.drawText(this.name, inputStartX, inputRow, nameColor);
    }

    // Blinking cursor
    if (this.cursorVisible && this.name.length < MAX_NAME_LENGTH) {
      const cursorX = inputStartX + this.name.length;
      this.renderer.drawChar('_', cursorX, inputRow, COLORS.TEXT_BRIGHT);
    }

    // Character count
    const countText = `${this.name.length}/${MAX_NAME_LENGTH}`;
    const countX = Math.floor((VIEWPORT_WIDTH - countText.length) / 2);
    this.renderer.drawText(countText, countX, 16, COLORS.TEXT_DIM);

    // Error message
    if (this.isFlashing()) {
      const errorText = 'Name cannot be empty!';
      const errorX = Math.floor((VIEWPORT_WIDTH - errorText.length) / 2);
      this.renderer.drawText(errorText, errorX, 18, COLORS.HEALTH_CRITICAL);
    }

    // Instructions
    const instructions = '[ENTER] Confirm     [ESC] Go Back';
    const instrX = Math.floor((VIEWPORT_WIDTH - instructions.length) / 2);
    this.renderer.drawText(instructions, instrX, 21, COLORS.TEXT_DIM);

    // World reset instruction
    const resetInstr = '[SHIFT+ENTER] Reset World';
    const resetInstrX = Math.floor((VIEWPORT_WIDTH - resetInstr.length) / 2);
    this.renderer.drawText(resetInstr, resetInstrX, 23, COLORS.TEXT_DIM);
  }
}
