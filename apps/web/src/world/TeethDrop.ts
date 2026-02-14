// TeethDrop - currency entities generated at hero death sites

import type { DeathEventRecord } from './WorldState';

export interface TeethDrop {
  id: string;
  deathEventId: string;
  heroName: string;
  levelDepth: number;
  position: { x: number; y: number };
  value: number; // 1-32
  isCollected: boolean;
  collectedBy?: string; // heroId that picked it up
}

/**
 * Create a TeethDrop entity from a hero death event.
 *
 * @param deathEvent - The death event that triggered the teeth drop
 * @returns A new TeethDrop entity
 */
export function createTeethDrop(deathEvent: DeathEventRecord): TeethDrop {
  return {
    id: `teeth_${deathEvent.id}_${Date.now()}`,
    deathEventId: deathEvent.id,
    heroName: deathEvent.heroName,
    levelDepth: deathEvent.location.depth,
    position: {
      x: deathEvent.location.x,
      y: deathEvent.location.y,
    },
    value: deathEvent.teethDropped,
    isCollected: false,
  };
}
