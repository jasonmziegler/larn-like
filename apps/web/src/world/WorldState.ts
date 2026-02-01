// WorldState - manages game world state and coordinates persistence via WorldStore

import { WorldStore, STORE_NAMES } from './WorldStore';
import type { Hero, EquipmentSlots, EquipmentItem } from '@larn-like/shared';

export interface LocalWorldState {
  /** Schema version for migration support */
  version: number;
  /** Credit counter for Insert Coin system */
  credits: number;
  /** Current living hero, or null if dead/not yet created */
  currentHero: Hero | null;
  /** All death events for this browser's history */
  deathEvents: DeathEventRecord[];
  /** Generated dungeon levels keyed by depth */
  levels: DungeonLevelRecord[];
  /** Timestamp of last save (ISO string) */
  lastSaved: string;
}

export interface DeathEventRecord {
  id: string;
  heroId: string;
  heroName: string;
  killerMonsterId: string;
  location: { x: number; y: number; depth: number };
  teethDropped: number;
  equipmentTransferred: unknown[];
  equipmentScattered: unknown[];
  soulShrineCreated: boolean;
  processedAt: string; // ISO string
}

export interface DungeonLevelRecord {
  depth: number;
  dungeon: string[][]; // tile grid
  monsters: MonsterRecord[];
  items: TeethItemRecord[];
  chests: DungeonChestRecord[];
  generatedAt: string; // ISO string
}

export interface MonsterRecord {
  id: string;
  pos: { x: number; y: number };
  char: string;
  color: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  type: string;
  evolutionPoints?: number;
  isEvolved?: boolean;
  evolutionLevel?: number;
  killHistory?: unknown[];
  equipment: EquipmentSlots;
}

export interface TeethItemRecord {
  id: string;
  pos: { x: number; y: number };
  char: string;
  color: string;
  name: string;
  type: 'teeth';
  value: number;
}

export interface DungeonChestRecord {
  id: string;
  pos: { x: number; y: number };
  items: EquipmentItem[];
}

const CURRENT_VERSION = 1;
const DEFAULT_CREDITS = 3;
const QUOTA_WARNING_THRESHOLD = 0.8; // 80%

export class WorldState {
  private store: WorldStore;
  private state: LocalWorldState;

  constructor(store?: WorldStore) {
    this.store = store || new WorldStore();
    this.state = this.createFreshState();
  }

  private createFreshState(): LocalWorldState {
    return {
      version: CURRENT_VERSION,
      credits: DEFAULT_CREDITS,
      currentHero: null,
      deathEvents: [],
      levels: [],
      lastSaved: new Date().toISOString(),
    };
  }

  /** Load existing state from IndexedDB or create fresh world */
  async initializeWorld(): Promise<LocalWorldState> {
    await this.store.open();

    // Load world meta
    const version = await this.store.loadWorldMeta('version') as number | undefined;

    if (version === undefined) {
      // First time — initialize fresh state and persist it
      this.state = this.createFreshState();
      await this.persistMeta();
      return this.state;
    }

    // Load existing state
    this.state.version = version;

    const credits = await this.store.loadWorldMeta('credits') as number | undefined;
    this.state.credits = credits ?? DEFAULT_CREDITS;

    const lastSaved = await this.store.loadWorldMeta('lastSaved') as string | undefined;
    this.state.lastSaved = lastSaved ?? new Date().toISOString();

    // Load current hero (the one that is alive)
    const heroes = await this.store.getByIndex<Hero>(STORE_NAMES.HEROES, 'isAlive', 1);
    // IndexedDB stores booleans oddly — also try true
    const heroesTrue = await this.store.getByIndex<Hero>(STORE_NAMES.HEROES, 'isAlive', true as unknown as IDBValidKey);
    const allAlive = [...heroes, ...heroesTrue];
    this.state.currentHero = allAlive.length > 0 ? allAlive[0] : null;

    // Load death events
    this.state.deathEvents = await this.store.getAll<DeathEventRecord>(STORE_NAMES.DEATH_EVENTS);

    // Load dungeon levels
    this.state.levels = await this.store.getAll<DungeonLevelRecord>(STORE_NAMES.DUNGEON_LEVELS);

    return this.state;
  }

  /** Persist current state to IndexedDB */
  async saveWorld(): Promise<void> {
    this.state.lastSaved = new Date().toISOString();

    await this.persistMeta();

    // Save current hero
    if (this.state.currentHero) {
      await this.store.saveHero(this.state.currentHero as unknown as Record<string, unknown>);
    }

    // Save levels
    for (const level of this.state.levels) {
      await this.store.saveLevel(level as unknown as Record<string, unknown>);
    }

    // Save death events
    for (const event of this.state.deathEvents) {
      await this.store.saveDeathEvent(event as unknown as Record<string, unknown>);
    }
  }

  /** Save just the hero (for frequent updates like movement, combat) */
  async saveHero(): Promise<void> {
    if (this.state.currentHero) {
      await this.store.saveHero(this.state.currentHero as unknown as Record<string, unknown>);
    }
  }

  /** Save a specific dungeon level */
  async saveLevel(level: DungeonLevelRecord): Promise<void> {
    // Update in-memory state
    const existingIdx = this.state.levels.findIndex(l => l.depth === level.depth);
    if (existingIdx >= 0) {
      this.state.levels[existingIdx] = level;
    } else {
      this.state.levels.push(level);
    }
    await this.store.saveLevel(level as unknown as Record<string, unknown>);
  }

  /** Record a death event */
  async saveDeathEvent(event: DeathEventRecord): Promise<void> {
    this.state.deathEvents.push(event);
    await this.store.saveDeathEvent(event as unknown as Record<string, unknown>);
  }

  private async persistMeta(): Promise<void> {
    await this.store.saveWorldMeta('version', this.state.version);
    await this.store.saveWorldMeta('credits', this.state.credits);
    await this.store.saveWorldMeta('lastSaved', this.state.lastSaved);
  }

  // --- Accessors ---

  getState(): LocalWorldState {
    return this.state;
  }

  getCredits(): number {
    return this.state.credits;
  }

  setCredits(value: number): void {
    this.state.credits = Math.max(0, value);
  }

  async saveCredits(): Promise<void> {
    await this.store.saveWorldMeta('credits', this.state.credits);
  }

  getCurrentHero(): Hero | null {
    return this.state.currentHero;
  }

  setCurrentHero(hero: Hero | null): void {
    this.state.currentHero = hero;
  }

  getLevel(depth: number): DungeonLevelRecord | undefined {
    return this.state.levels.find(l => l.depth === depth);
  }

  getStore(): WorldStore {
    return this.store;
  }

  // --- Quota management ---

  /** Check storage quota and return warning message if nearing limit */
  async checkQuota(): Promise<string | null> {
    if (!navigator.storage?.estimate) return null;
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        const ratio = estimate.usage / estimate.quota;
        if (ratio >= QUOTA_WARNING_THRESHOLD) {
          const usedMB = (estimate.usage / (1024 * 1024)).toFixed(1);
          const totalMB = (estimate.quota / (1024 * 1024)).toFixed(1);
          return `Storage warning: ${usedMB}MB / ${totalMB}MB used (${(ratio * 100).toFixed(0)}%)`;
        }
      }
    } catch {
      // Storage API unavailable
    }
    return null;
  }

  /** Save with quota check — returns warning message if approaching limit */
  async saveWorldSafe(): Promise<string | null> {
    try {
      await this.saveWorld();
    } catch (err) {
      console.error('Failed to save world state:', err);
      return 'Save failed — storage may be full. Consider exporting your save.';
    }
    return this.checkQuota();
  }

  /** Export complete world state as a downloadable JSON file */
  exportSave(): void {
    const data = JSON.stringify(this.state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `larn-like-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
