import { Hero } from '@larn-like/shared';
import { createHero } from '../game/Hero';

const STORAGE_KEY = 'larn-like-hero';

export function createNewHero(name: string, playerId: string = 'local'): Hero {
  const hero = createHero(name, playerId);
  saveHero(hero);
  return hero;
}

export function saveHero(hero: Hero): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hero));
  } catch {
    // localStorage unavailable
  }
}

export function loadHero(): Hero | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const hero = JSON.parse(saved) as Hero;
      if (hero.isAlive) {
        return hero;
      }
    }
  } catch {
    // localStorage unavailable or corrupt data
  }
  return null;
}

export function clearSavedHero(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
