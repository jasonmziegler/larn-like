// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TitleScreen } from '../../../src/ui/TitleScreen';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';

// Mock CanvasRenderer
function createMockRenderer(): CanvasRenderer {
  return {
    clear: vi.fn(),
    drawChar: vi.fn(),
    drawText: vi.fn(),
    drawBox: vi.fn(),
    fillRect: vi.fn(),
    getCanvas: vi.fn(),
    getContext: vi.fn(),
    getColorManager: vi.fn(),
  } as unknown as CanvasRenderer;
}

// Mock localStorage
function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

describe('TitleScreen', () => {
  let renderer: CanvasRenderer;
  let mockStorage: Storage;
  let originalLocalStorage: Storage;
  let originalRAF: typeof globalThis.requestAnimationFrame;
  let originalCAF: typeof globalThis.cancelAnimationFrame;

  beforeEach(() => {
    renderer = createMockRenderer();
    mockStorage = createMockStorage();

    // Replace localStorage
    originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });

    // Mock requestAnimationFrame / cancelAnimationFrame
    originalRAF = globalThis.requestAnimationFrame;
    originalCAF = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = vi.fn(() => 1);
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
  });

  describe('Credit System', () => {
    it('should initialize with 3 default credits', () => {
      const screen = new TitleScreen(renderer);
      expect(screen.getCredits()).toBe(3);
    });

    it('should load saved credits from localStorage', () => {
      mockStorage.setItem('larn-like-credits', '7');
      const screen = new TitleScreen(renderer);
      expect(screen.getCredits()).toBe(7);
    });

    it('should fall back to default if localStorage value is invalid', () => {
      mockStorage.setItem('larn-like-credits', 'invalid');
      const screen = new TitleScreen(renderer);
      expect(screen.getCredits()).toBe(3);
    });

    it('should add a credit via addCredit()', () => {
      const screen = new TitleScreen(renderer);
      screen.addCredit();
      expect(screen.getCredits()).toBe(4);
    });

    it('should persist credits to localStorage on addCredit()', () => {
      const screen = new TitleScreen(renderer);
      screen.addCredit();
      expect(mockStorage.setItem).toHaveBeenCalledWith('larn-like-credits', '4');
    });

    it('should set credits directly via setCredits()', () => {
      const screen = new TitleScreen(renderer);
      screen.setCredits(10);
      expect(screen.getCredits()).toBe(10);
    });

    it('should not allow negative credits via setCredits()', () => {
      const screen = new TitleScreen(renderer);
      screen.setCredits(-5);
      expect(screen.getCredits()).toBe(0);
    });
  });

  describe('Game Start Logic', () => {
    it('should deduct a credit and return true when credits available', () => {
      const screen = new TitleScreen(renderer);
      expect(screen.getCredits()).toBe(3);
      const result = screen.attemptGameStart();
      expect(result).toBe(true);
      expect(screen.getCredits()).toBe(2);
    });

    it('should return false when no credits available', () => {
      const screen = new TitleScreen(renderer);
      screen.setCredits(0);
      const result = screen.attemptGameStart();
      expect(result).toBe(false);
      expect(screen.getCredits()).toBe(0);
    });

    it('should call onGameStart callback on successful start', () => {
      const screen = new TitleScreen(renderer);
      const callback = vi.fn();
      screen.show(callback);
      screen.attemptGameStart();
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should not call onGameStart callback when no credits', () => {
      const screen = new TitleScreen(renderer);
      const callback = vi.fn();
      screen.show(callback);
      screen.setCredits(0);
      screen.attemptGameStart();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should persist credits after successful game start', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());
      screen.attemptGameStart();
      expect(mockStorage.setItem).toHaveBeenCalledWith('larn-like-credits', '2');
    });
  });

  describe('Input Handling', () => {
    it('should add credit on spacebar keydown', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());

      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);

      expect(screen.getCredits()).toBe(4);
    });

    it('should attempt game start on Enter keydown', () => {
      const screen = new TitleScreen(renderer);
      const callback = vi.fn();
      screen.show(callback);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledOnce();
      expect(screen.getCredits()).toBe(2);
    });

    it('should not respond to input when hidden', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());
      screen.hide();

      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);

      // Credits should still be 3 (no change after hide)
      expect(screen.getCredits()).toBe(3);
    });

    it('should ignore unrelated keys', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());

      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);

      expect(screen.getCredits()).toBe(3);
    });
  });

  describe('Rendering', () => {
    it('should call renderer methods when render() is called', () => {
      const screen = new TitleScreen(renderer);
      screen.render();

      expect(renderer.clear).toHaveBeenCalled();
      expect(renderer.drawBox).toHaveBeenCalled();
      expect(renderer.drawText).toHaveBeenCalled();
    });

    it('should render the title, INSERT COIN prompt, credits, and instructions', () => {
      const screen = new TitleScreen(renderer);
      screen.render();

      const drawTextCalls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = drawTextCalls.map((call: unknown[]) => call[0]).join(' ');

      // ASCII art title (contains figlet-style characters)
      expect(allText).toContain('Dungeon Crawler');
      expect(allText).toContain('CREDITS: 3');
      expect(allText).toContain('Insert Coin');
      expect(allText).toContain('Start Game');
    });

    it('should render INSERT COIN text when blinkVisible is true (default)', () => {
      const screen = new TitleScreen(renderer);
      screen.render();

      const drawTextCalls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = drawTextCalls.map((call: unknown[]) => call[0]).join(' ');

      expect(allText).toContain('I N S E R T   C O I N');
    });

    it('should display the correct credit count after adding credits', () => {
      const screen = new TitleScreen(renderer);
      screen.addCredit();
      screen.addCredit();
      screen.render();

      const drawTextCalls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = drawTextCalls.map((call: unknown[]) => call[0]).join(' ');

      expect(allText).toContain('CREDITS: 5');
    });
  });

  describe('Visual Feedback', () => {
    it('should render credit counter in bright color during credit flash', () => {
      const screen = new TitleScreen(renderer);
      screen.addCredit(); // triggers credit flash
      screen.render();

      const drawTextCalls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      // Find the CREDITS: call - it should use TEXT_BRIGHT (#00FF00) during credit flash
      const creditCall = drawTextCalls.find((call: unknown[]) =>
        (call[0] as string).startsWith('CREDITS:')
      );
      expect(creditCall).toBeDefined();
      expect(creditCall![3]).toBe('#00FF00'); // TEXT_BRIGHT
    });

    it('should render credit counter in red during error flash', () => {
      const screen = new TitleScreen(renderer);
      screen.setCredits(0);
      screen.attemptGameStart(); // triggers error flash
      screen.render();

      const drawTextCalls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const creditCall = drawTextCalls.find((call: unknown[]) =>
        (call[0] as string).startsWith('CREDITS:')
      );
      expect(creditCall).toBeDefined();
      expect(creditCall![3]).toBe('#FF0000'); // HEALTH_CRITICAL
    });

    it('should render credit counter in dim color when credits are zero and no flash', () => {
      const screen = new TitleScreen(renderer);
      screen.setCredits(0);
      screen.render();

      const drawTextCalls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const creditCall = drawTextCalls.find((call: unknown[]) =>
        (call[0] as string).startsWith('CREDITS:')
      );
      expect(creditCall).toBeDefined();
      expect(creditCall![3]).toBe('#008800'); // TEXT_DIM
    });
  });

  describe('Show / Hide lifecycle', () => {
    it('should bind input and start animation loop on show()', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());
      expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should cancel animation and unbind input on hide()', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());
      screen.hide();
      expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should hide the title screen when game starts successfully', () => {
      const screen = new TitleScreen(renderer);
      screen.show(vi.fn());
      screen.attemptGameStart();
      expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Credit Persistence', () => {
    it('should persist credits across instances', () => {
      const screen1 = new TitleScreen(renderer);
      screen1.addCredit(); // 4
      screen1.addCredit(); // 5

      const screen2 = new TitleScreen(renderer);
      expect(screen2.getCredits()).toBe(5);
    });

    it('should persist credit deduction from game start', () => {
      const screen1 = new TitleScreen(renderer);
      screen1.show(vi.fn());
      screen1.attemptGameStart(); // 3 -> 2

      const screen2 = new TitleScreen(renderer);
      expect(screen2.getCredits()).toBe(2);
    });
  });
});
