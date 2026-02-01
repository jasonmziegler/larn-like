// WorldStore - IndexedDB persistence layer for world state
// Raw IndexedDB API with Promise-wrapped transactions

const DB_NAME = 'larn-like-db';
const DB_VERSION = 1;

export const STORE_NAMES = {
  WORLD_META: 'worldMeta',
  HEROES: 'heroes',
  DUNGEON_LEVELS: 'dungeonLevels',
  MONSTERS: 'monsters',
  DEATH_EVENTS: 'deathEvents',
  SOUL_SHRINES: 'soulShrines',
  TEETH_DROPS: 'teethDrops',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

function onUpgradeNeeded(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    db.createObjectStore(STORE_NAMES.WORLD_META, { keyPath: 'key' });

    const heroStore = db.createObjectStore(STORE_NAMES.HEROES, { keyPath: 'id' });
    heroStore.createIndex('isAlive', 'isAlive');

    db.createObjectStore(STORE_NAMES.DUNGEON_LEVELS, { keyPath: 'depth' });

    const monsterStore = db.createObjectStore(STORE_NAMES.MONSTERS, { keyPath: 'id' });
    monsterStore.createIndex('levelDepth', 'level');
    monsterStore.createIndex('isEvolved', 'isEvolved');

    const deathStore = db.createObjectStore(STORE_NAMES.DEATH_EVENTS, { keyPath: 'id' });
    deathStore.createIndex('timestamp', 'processedAt');
    deathStore.createIndex('levelDepth', 'location.depth');

    const shrineStore = db.createObjectStore(STORE_NAMES.SOUL_SHRINES, { keyPath: 'id' });
    shrineStore.createIndex('levelDepth', 'level');
    shrineStore.createIndex('isActive', 'isActive');

    const teethStore = db.createObjectStore(STORE_NAMES.TEETH_DROPS, { keyPath: 'id' });
    teethStore.createIndex('levelDepth', 'level');
  }
  // Future versions: if (oldVersion < 2) { ... }
}

export class WorldStore {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    if (this.db) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        onUpgradeNeeded(db, event.oldVersion);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // Close DB on versionchange so future opens aren't blocked
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
        };
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onblocked = () => {
        reject(new Error('IndexedDB open blocked by another connection. Close other tabs and retry.'));
      };
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDB(): IDBDatabase {
    if (!this.db) throw new Error('WorldStore not opened. Call open() first.');
    return this.db;
  }

  // --- Generic helpers ---

  private put<T>(storeName: StoreName, value: T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.getDB().transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
      const tx = this.getDB().transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.getDB().transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  getAll<T>(storeName: StoreName): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const tx = this.getDB().transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  getByIndex<T>(storeName: StoreName, indexName: string, value: IDBValidKey): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const tx = this.getDB().transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Hero operations ---

  async saveHero(hero: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.HEROES, hero);
  }

  async loadHero(id: string): Promise<Record<string, unknown> | undefined> {
    return this.get<Record<string, unknown>>(STORE_NAMES.HEROES, id);
  }

  // --- Level operations ---

  async saveLevel(level: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.DUNGEON_LEVELS, level);
  }

  async loadLevel(depth: number): Promise<Record<string, unknown> | undefined> {
    return this.get<Record<string, unknown>>(STORE_NAMES.DUNGEON_LEVELS, depth);
  }

  // --- Death event operations ---

  async saveDeathEvent(event: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.DEATH_EVENTS, event);
  }

  async loadDeathEvents(): Promise<Record<string, unknown>[]> {
    return this.getAll<Record<string, unknown>>(STORE_NAMES.DEATH_EVENTS);
  }

  // --- World meta operations ---

  async saveWorldMeta(key: string, value: unknown): Promise<void> {
    await this.put(STORE_NAMES.WORLD_META, { key, value });
  }

  async loadWorldMeta(key: string): Promise<unknown | undefined> {
    const result = await this.get<{ key: string; value: unknown }>(STORE_NAMES.WORLD_META, key);
    return result?.value;
  }

  // --- Monster operations ---

  async saveMonster(monster: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.MONSTERS, monster);
  }

  async loadMonster(id: string): Promise<Record<string, unknown> | undefined> {
    return this.get<Record<string, unknown>>(STORE_NAMES.MONSTERS, id);
  }

  // --- Soul shrine operations ---

  async saveSoulShrine(shrine: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.SOUL_SHRINES, shrine);
  }

  // --- Teeth drop operations ---

  async saveTeethDrop(drop: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.TEETH_DROPS, drop);
  }

  // --- Bulk operations ---

  async clearStore(storeName: StoreName): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.getDB().transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDatabase(): Promise<void> {
    this.close();
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
