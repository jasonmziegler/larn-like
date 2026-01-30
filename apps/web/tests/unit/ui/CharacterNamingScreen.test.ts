// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterNamingScreen } from '../../../src/ui/CharacterNamingScreen';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';

function createMockRenderer(): CanvasRenderer {
  return {
    clear: vi.fn(),
    drawChar: vi.fn(),
    drawText: vi.fn(),
    drawBox: vi.fn(),
    getCanvas: vi.fn(),
    getContext: vi.fn(),
    getColorManager: vi.fn(),
  } as unknown as CanvasRenderer;
}

describe('CharacterNamingScreen', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = createMockRenderer();
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  describe('Name Input', () => {
    it('should build name from typed characters', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      screen.show(onConfirm, onCancel);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'H' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));

      expect(screen.getName()).toBe('Hero');
    });

    it('should accept alphanumeric characters and spaces', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));

      expect(screen.getName()).toBe('A1 b');
    });

    it('should reject special characters', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: '!' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '@' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '#' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '.' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));

      expect(screen.getName()).toBe('A');
    });

    it('should remove last character on backspace', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'B' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'C' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(screen.getName()).toBe('AB');
    });

    it('should handle backspace on empty name gracefully', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(screen.getName()).toBe('');
    });

    it('should enforce 12-character maximum limit', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      for (const char of 'ABCDEFGHIJKLMNOP') {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      }

      expect(screen.getName()).toBe('ABCDEFGHIJKL');
      expect(screen.getName().length).toBe(12);
    });
  });

  describe('Confirmation', () => {
    it('should call onNameConfirmed with trimmed name on Enter', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      screen.show(onConfirm, vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'H' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onConfirm).toHaveBeenCalledWith('Hero');
    });

    it('should not confirm with empty name', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      screen.show(onConfirm, vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should not confirm with whitespace-only name', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      screen.show(onConfirm, vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should trim leading/trailing spaces from confirmed name', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      screen.show(onConfirm, vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(onConfirm).toHaveBeenCalledWith('Ab');
    });
  });

  describe('Cancel', () => {
    it('should call onCancel when Escape is pressed', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onCancel = vi.fn();
      screen.show(vi.fn(), onCancel);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(onCancel).toHaveBeenCalled();
    });

    it('should not call onNameConfirmed when cancelled', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      screen.show(onConfirm, vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'H' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render title, input area, character count, and instructions', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
      screen.render();

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('NAME YOUR HERO');
      expect(allText).toContain('1/12');
      expect(allText).toContain('[ENTER] Confirm');
      expect(allText).toContain('[ESC] Go Back');
    });

    it('should render the typed name', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
      screen.render();

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('Test');
      expect(allText).toContain('4/12');
    });

    it('should render error message when confirming empty name', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      // Enter with empty name triggers error flash
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      screen.render();

      const calls = (renderer.drawText as ReturnType<typeof vi.fn>).mock.calls;
      const allText = calls.map((c: unknown[]) => c[0]).join(' ');

      expect(allText).toContain('Name cannot be empty');
    });

    it('should draw screen border', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      screen.render();

      expect(renderer.drawBox).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should reset name on each show call', () => {
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      expect(screen.getName()).toBe('A');

      // Cancel and re-show
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      screen.show(vi.fn(), vi.fn());

      expect(screen.getName()).toBe('');
    });

    it('should unbind input on hide', () => {
      const screen = new CharacterNamingScreen(renderer);
      const onConfirm = vi.fn();
      screen.show(onConfirm, vi.fn());

      // Confirm to hide
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'X' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Further keypresses should not trigger anything
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      // onConfirm not called again
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should cancel animation frame on hide', () => {
      vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(42));
      const screen = new CharacterNamingScreen(renderer);
      screen.show(vi.fn(), vi.fn());
      screen.hide();

      expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    });
  });
});
