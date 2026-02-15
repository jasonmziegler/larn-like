// WorldStore - IndexedDB persistence layer for world state
// Raw IndexedDB API with Promise-wrapped transactions

const DB_NAME = 'larn-like-db';
const DB_VERSION = 5;

export const STORE_NAMES = {
  WORLD_META: 'worldMeta',
  HEROES: 'heroes',
  DUNGEON_LEVELS: 'dungeonLevels',
  MONSTERS: 'monsters',
  DEATH_EVENTS: 'deathEvents',
  SOUL_SHRINES: 'soulShrines',
  TEETH_DROPS: 'teethDrops',
  PENDING_PROMOTIONS: 'pendingPromotions',
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
    shrineStore.createIndex('levelDepth', 'levelDepth');
    shrineStore.createIndex('isActive', 'isActive');

    const teethStore = db.createObjectStore(STORE_NAMES.TEETH_DROPS, { keyPath: 'id' });
    teethStore.createIndex('levelDepth', 'levelDepth');
    teethStore.createIndex('isCollected', 'isCollected');
  } else if (oldVersion < 2) {
    // Story 2.4: Upgrade existing version 1 databases - fix teeth drops schema
    // Delete and recreate the teeth drops store with correct field mappings
    db.deleteObjectStore(STORE_NAMES.TEETH_DROPS);
    const teethStore = db.createObjectStore(STORE_NAMES.TEETH_DROPS, { keyPath: 'id' });
    teethStore.createIndex('levelDepth', 'levelDepth');
    teethStore.createIndex('isCollected', 'isCollected');
  }

  if (oldVersion < 3) {
    // Story 2.7: Fix soul shrines index to use correct field name
    // Delete and recreate the soul shrines store with correct field mappings
    if (db.objectStoreNames.contains(STORE_NAMES.SOUL_SHRINES)) {
      db.deleteObjectStore(STORE_NAMES.SOUL_SHRINES);
    }
    const shrineStore = db.createObjectStore(STORE_NAMES.SOUL_SHRINES, { keyPath: 'id' });
    shrineStore.createIndex('levelDepth', 'levelDepth');
    shrineStore.createIndex('isActive', 'isActive');
  }

  if (oldVersion < 4) {
    // Fix databases that have wrong keyPath on levelDepth index
    if (db.objectStoreNames.contains(STORE_NAMES.SOUL_SHRINES)) {
      db.deleteObjectStore(STORE_NAMES.SOUL_SHRINES);
    }
    const shrineStore = db.createObjectStore(STORE_NAMES.SOUL_SHRINES, { keyPath: 'id' });
    shrineStore.createIndex('levelDepth', 'levelDepth');
    shrineStore.createIndex('isActive', 'isActive');
  }

  if (oldVersion < 5) {
    // Story 3.4 Task 0: Pending promotions for ungenerated levels
    const pendingStore = db.createObjectStore(STORE_NAMES.PENDING_PROMOTIONS, { keyPath: 'id' });
    pendingStore.createIndex('targetDepth', 'targetDepth');
  }
}

export class WorldStore {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    if (this.db) return;

    return new Promise<void>((resolve, reject) => {
      console.log(`[WorldStore] Opening IndexedDB v${DB_VERSION}...`);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        console.log(`[WorldStore] Upgrading from v${event.oldVersion} to v${DB_VERSION}`);
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          onUpgradeNeeded(db, event.oldVersion);
          console.log('[WorldStore] Upgrade complete');
        } catch (err) {
          console.error('[WorldStore] Upgrade failed:', err);
          throw err;
        }
      };

      request.onsuccess = (event) => {
        console.log('[WorldStore] Database opened successfully');
        this.db = (event.target as IDBOpenDBRequest).result;

        // Verify all expected stores exist
        const expectedStores = Object.values(STORE_NAMES);
        const missingStores = expectedStores.filter(
          storeName => !this.db!.objectStoreNames.contains(storeName)
        );

        if (missingStores.length > 0) {
          console.error(`[WorldStore] Database corrupt - missing stores: ${missingStores.join(', ')}`);
          console.error('[WorldStore] Please delete IndexedDB and refresh');
          this.db.close();
          this.db = null;
          reject(new Error(
            `Database schema incomplete. Missing stores: ${missingStores.join(', ')}. ` +
            `Please open DevTools → Application → IndexedDB → Delete "larn-like-db" and refresh.`
          ));
          return;
        }

        // Close DB on versionchange so future opens aren't blocked
        this.db.onversionchange = () => {
          console.warn('[WorldStore] Database version changed, closing connection');
          this.db?.close();
          this.db = null;
        };
        resolve();
      };

      request.onerror = () => {
        console.error('[WorldStore] Failed to open:', request.error);
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onblocked = () => {
        console.error('[WorldStore] Database blocked - close other tabs');
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

  async loadShrinesByLevel(depth: number): Promise<Record<string, unknown>[]> {
    // Load all shrines at this level depth
    const allShrines = await this.getByIndex<Record<string, unknown>>(
      STORE_NAMES.SOUL_SHRINES,
      'levelDepth',
      depth
    );
    // Filter to only active shrines (not consumed)
    return allShrines.filter((shrine) => shrine.isActive === true);
  }

  async consumeShrine(id: string): Promise<void> {
    const shrine = await this.get<Record<string, unknown>>(STORE_NAMES.SOUL_SHRINES, id);
    if (shrine) {
      shrine.isActive = false;
      await this.put(STORE_NAMES.SOUL_SHRINES, shrine);
    } else {
      console.warn(`SoulShrine not found for ID: ${id}`);
    }
  }

  // --- Teeth drop operations ---

  async saveTeethDrop(drop: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.TEETH_DROPS, drop);
  }

  async loadTeethDropsByLevel(depth: number): Promise<Record<string, unknown>[]> {
    return this.getByIndex<Record<string, unknown>>(STORE_NAMES.TEETH_DROPS, 'levelDepth', depth);
  }

  async markTeethCollected(id: string, heroId: string): Promise<void> {
    const drop = await this.get<Record<string, unknown>>(STORE_NAMES.TEETH_DROPS, id);
    if (drop) {
      drop.isCollected = true;
      drop.collectedBy = heroId;
      await this.put(STORE_NAMES.TEETH_DROPS, drop);
    } else {
      console.warn(`TeethDrop not found for ID: ${id}`);
    }
  }

  // --- Pending promotion operations ---

  async savePendingPromotion(promotion: Record<string, unknown>): Promise<void> {
    await this.put(STORE_NAMES.PENDING_PROMOTIONS, promotion);
  }

  async loadPendingPromotionsByDepth(depth: number): Promise<Record<string, unknown>[]> {
    return this.getByIndex<Record<string, unknown>>(
      STORE_NAMES.PENDING_PROMOTIONS,
      'targetDepth',
      depth
    );
  }

  async deletePendingPromotion(id: string): Promise<void> {
    await this.delete(STORE_NAMES.PENDING_PROMOTIONS, id);
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
