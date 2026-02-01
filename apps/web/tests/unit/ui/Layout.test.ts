// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { LAYOUT, GAME_CONSTANTS } from '@larn-like/shared';

describe('Layout Constants', () => {
  it('should define correct row assignments', () => {
    expect(LAYOUT.ROW_TOP_BORDER).toBe(0);
    expect(LAYOUT.ROW_STATUS_BAR).toBe(1);
    expect(LAYOUT.ROW_MONSTER_INFO).toBe(2);
    expect(LAYOUT.ROW_MAP_START).toBe(3);
    expect(LAYOUT.ROW_MAP_END).toBe(23);
    expect(LAYOUT.ROW_ACTION_LOG_START).toBe(24);
    expect(LAYOUT.ROW_ACTION_LOG_END).toBe(29);
  });

  it('should have 20 interior map rows', () => {
    expect(LAYOUT.MAP_ROWS).toBe(20);
  });

  it('should have 78 interior map columns', () => {
    expect(LAYOUT.MAP_COLS).toBe(78);
  });

  it('should have 80x30 canvas dimensions', () => {
    expect(LAYOUT.CANVAS_COLS).toBe(80);
    expect(LAYOUT.CANVAS_ROWS).toBe(30);
    expect(GAME_CONSTANTS.VIEWPORT_WIDTH).toBe(80);
    expect(GAME_CONSTANTS.VIEWPORT_HEIGHT).toBe(30);
  });

  it('should have at least 5 action log lines', () => {
    expect(LAYOUT.ACTION_LOG_LINES).toBeGreaterThanOrEqual(5);
  });

  it('should have total rows adding up to 30', () => {
    // 1 (status) + 1 (monster) + 21 (map box: top border + 20 rows + bottom border) + 1 (top border row) + 6 (action log) = 30
    const totalRows = 1 + 1 + 1 + (LAYOUT.ROW_MAP_END - LAYOUT.ROW_MAP_START + 1) + LAYOUT.ACTION_LOG_LINES;
    expect(totalRows).toBe(LAYOUT.CANVAS_ROWS);
  });

  it('should have action log lines matching row range', () => {
    expect(LAYOUT.ACTION_LOG_LINES).toBe(
      LAYOUT.ROW_ACTION_LOG_END - LAYOUT.ROW_ACTION_LOG_START + 1
    );
  });
});
