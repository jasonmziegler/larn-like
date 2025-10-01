# Testing Strategy

## Testing Pyramid

```
     E2E Tests
    /        \
   Integration Tests
  /            \
Frontend Unit  Backend Unit
```

## Test Organization

### Frontend Tests
```
apps/web/tests/
├── unit/                    # Component and utility tests
│   ├── components/
│   ├── core/
│   ├── game/
│   └── utils/
├── integration/             # Service integration tests
│   ├── api-client/
│   ├── world-sync/
│   └── auth/
└── e2e/                     # End-to-end gameplay tests
    ├── hero-lifecycle/
    ├── death-mechanics/
    ├── equipment-system/
    └── accessibility/
```

### Backend Tests
```
apps/api/tests/
├── unit/                    # Function and utility tests
│   ├── heroes/
│   ├── world/
│   ├── events/
│   └── shared/
├── integration/             # Database and service tests
│   ├── database/
│   ├── auth/
│   └── external-apis/
└── load/                    # Performance and load tests
    ├── api-endpoints/
    ├── database-queries/
    └── concurrent-users/
```

### E2E Tests
```
tests/e2e/
├── complete-gameplay/       # Full game session tests
├── death-mechanics/         # Death and evolution tests
├── equipment-system/        # Equipment and inventory tests
├── accessibility/           # Screen reader and keyboard tests
└── performance/             # Canvas rendering and response time tests
```

## Test Examples

### Frontend Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GameEngine } from '../src/core/GameEngine';
import { mockCanvas } from '../test-utils/canvas-mock';

describe('GameEngine', () => {
  it('should handle hero movement correctly', async () => {
    const canvas = mockCanvas();
    const gameEngine = new GameEngine(canvas);

    await gameEngine.initialize();

    // Simulate hero creation
    const hero = await gameEngine.createHero('TestHero');
    expect(hero.name).toBe('TestHero');

    // Test movement
    const initialPosition = hero.currentLocation;
    await gameEngine.moveHero('north');

    expect(hero.currentLocation.y).toBe(initialPosition.y - 1);
  });
});
```

### Backend API Test
```typescript
import { describe, it, expect } from 'vitest';
import { createMockRequest, createMockSupabase } from '../test-utils';
import { POST as createHero } from '../src/heroes/create';

describe('POST /heroes', () => {
  it('should create a new hero with valid data', async () => {
    const mockSupabase = createMockSupabase();
    const request = createMockRequest({
      body: {
        playerCredits: 3,
        heroName: 'TestHero'
      }
    });

    const response = await createHero(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.name).toBe('TestHero');
    expect(result.isAlive).toBe(true);
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('complete death and evolution cycle', async ({ page }) => {
  await page.goto('/');

  // Insert coin and create hero
  await page.click('[data-testid="insert-coin"]');
  await page.fill('[data-testid="hero-name"]', 'E2EHero');
  await page.click('[data-testid="start-game"]');

  // Navigate to dungeon and engage monster
  await page.keyboard.press('ArrowDown'); // Enter dungeon
  await page.keyboard.press('ArrowRight'); // Move to monster

  // Fight until death
  while (await page.isVisible('[data-testid="hero-hp"]')) {
    await page.keyboard.press('Space'); // Attack
    await page.waitForTimeout(100);
  }

  // Verify death screen shows consequences
  await expect(page.locator('[data-testid="death-screen"]')).toBeVisible();
  await expect(page.locator('text=E2EHero slain by')).toBeVisible();
  await expect(page.locator('text=leveled up and descended')).toBeVisible();

  // Return to title and create new hero
  await page.keyboard.press('Enter');
  await page.click('[data-testid="insert-coin"]');
  await page.fill('[data-testid="hero-name"]', 'E2EHero2');
  await page.click('[data-testid="start-game"]');

  // Verify world changes are visible
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('text=Slayer of 1 Hero')).toBeVisible();
});
```

---
