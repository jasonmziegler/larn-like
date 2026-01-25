// Shared validation utilities
export function isValidHeroName(name: string): boolean {
  return name.length >= 3 && name.length <= 20 && /^[a-zA-Z0-9_]+$/.test(name);
}

export function isValidPosition(x: number, y: number, depth: number): boolean {
  return (
    Number.isInteger(x) && x >= 0 &&
    Number.isInteger(y) && y >= 0 &&
    Number.isInteger(depth) && depth >= 0
  );
}

export function isValidLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1;
}

export function isValidHealth(health: number, maxHealth: number): boolean {
  return health >= 0 && health <= maxHealth && maxHealth > 0;
}
