// Shared game calculation utilities
export function calculateDamage(
  attackPower: number,
  defense: number,
  isCritical: boolean = false
): number {
  const baseDamage = Math.max(1, attackPower - defense);
  return isCritical ? baseDamage * 2 : baseDamage;
}

export function calculateExperienceForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function calculateHealthPercentage(
  currentHealth: number,
  maxHealth: number
): number {
  return Math.floor((currentHealth / maxHealth) * 100);
}
