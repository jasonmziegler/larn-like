# Data Models

## Hero

**Purpose:** Represents a single hero instance with temporary stats and equipment that reset on death

**Key Attributes:**
- id: string - Unique identifier for this hero instance
- playerId: string - Player who owns this hero
- name: string - Player-chosen name (becomes part of equipment naming)
- level: number - Current hero level (resets on death)
- baseStats: HeroStats - Starting stats (consistent across all heroes)
- currentStats: HeroStats - Modified stats from reagents and leveling
- equipment: EquipmentSlots - Currently equipped items (10-slot system)
- inventory: InventoryItem[] - Carried items (limited to 9 items)
- currentLocation: LocationData - Current position in world
- teethCurrency: number - Collected teeth for merchant purchases
- createdAt: Date - When this hero was created
- isAlive: boolean - Current life status

### TypeScript Interface
```typescript
interface Hero {
  id: string;
  playerId: string;
  name: string;
  level: number;
  baseStats: HeroStats;
  currentStats: HeroStats;
  equipment: EquipmentSlots;
  inventory: InventoryItem[];
  currentLocation: LocationData;
  teethCurrency: number;
  createdAt: Date;
  isAlive: boolean;
}

interface HeroStats {
  hp: number;
  maxHp: number;
  strength: number;
  dexterity: number;
  constitution: number;
}
```

### Relationships
- Belongs to one Player
- Located in one DungeonLevel
- Can own multiple InventoryItems
- Creates DeathEvents when dying

## Monster

**Purpose:** Represents both baseline and evolved monsters with equipment, kill history, and level placement

**Key Attributes:**
- id: string - Unique monster identifier
- type: MonsterType - Base monster type (skeleton, vampire bat, etc.)
- level: number - Current dungeon level location
- evolutionLevel: number - Number of promotions (0 = baseline)
- stats: MonsterStats - Current stats including evolution bonuses
- equipment: EquipmentSlots - Trophy equipment from killed heroes
- killHistory: KillRecord[] - Heroes this monster has defeated
- isEvolved: boolean - Whether this monster has been promoted
- queuePosition: number | null - Position in evolution queue (null if active)
- lastActive: Date - When monster was last on a dungeon level

### TypeScript Interface
```typescript
interface Monster {
  id: string;
  type: MonsterType;
  level: number;
  evolutionLevel: number;
  stats: MonsterStats;
  equipment: EquipmentSlots;
  killHistory: KillRecord[];
  isEvolved: boolean;
  queuePosition: number | null;
  lastActive: Date;
}

interface KillRecord {
  heroId: string;
  heroName: string;
  killedAt: Date;
  equipmentTaken: EquipmentItem[];
}
```

### Relationships
- Located in one DungeonLevel
- Has multiple KillRecords
- Can own multiple EquipmentItems
- Tracked in MonsterEvolutionQueue

## EquipmentItem

**Purpose:** Represents individual pieces of equipment with naming, stats, and blessing status

**Key Attributes:**
- id: string - Unique item identifier
- name: string - Item name including original owner (e.g., "Sarah's Iron Sword")
- type: EquipmentType - Category and slot compatibility
- stats: ItemStats - Stat bonuses provided by this item
- isBlessed: boolean - Whether enhanced by soul shrine
- blessedBy: string | null - Name of soul that blessed this item
- originalOwner: string - First hero to possess this item
- rarity: ItemRarity - Common, rare, unique, etc.
- createdAt: Date - When item first appeared in world

### TypeScript Interface
```typescript
interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  stats: ItemStats;
  isBlessed: boolean;
  blessedBy: string | null;
  originalOwner: string;
  rarity: ItemRarity;
  createdAt: Date;
}

interface EquipmentSlots {
  weapon: EquipmentItem | null;
  offHand: EquipmentItem | null;
  helmet: EquipmentItem | null;
  bodyArmor: EquipmentItem | null;
  gloves: EquipmentItem | null;
  boots: EquipmentItem | null;
  ring1: EquipmentItem | null;
  ring2: EquipmentItem | null;
  amulet: EquipmentItem | null;
  belt: EquipmentItem | null;
}
```

### Relationships
- Can be equipped by Hero or Monster
- Can be stored in DungeonChest
- Can be blessed by SoulShrine
- Originates from one Player

## DungeonLevel

**Purpose:** Represents procedurally generated dungeon floors with persistent layout and contents

**Key Attributes:**
- id: string - Unique level identifier
- depth: number - Level depth (1, 2, 3, etc.)
- layout: LevelLayout - Procedurally generated room and corridor data
- monsters: Monster[] - Currently active monsters on this level
- chests: DungeonChest[] - Equipment storage chests
- teethLocations: TeethDrop[] - Currency drops from hero deaths
- shrines: SoulShrine[] - Active soul shrines for blessing
- generatedAt: Date - When level was first created
- lastRegenerated: Date - When monster population was last updated

### TypeScript Interface
```typescript
interface DungeonLevel {
  id: string;
  depth: number;
  layout: LevelLayout;
  monsters: Monster[];
  chests: DungeonChest[];
  teethLocations: TeethDrop[];
  shrines: SoulShrine[];
  generatedAt: Date;
  lastRegenerated: Date;
}

interface LevelLayout {
  width: number;
  height: number;
  rooms: Room[];
  corridors: Corridor[];
  stairsUp: Position;
  stairsDown: Position;
}
```

### Relationships
- Contains multiple Monsters
- Contains multiple DungeonChests
- Contains multiple TeethDrops
- Contains multiple SoulShrines

## SoulShrine

**Purpose:** Represents blessing stations created by trapped souls from hero deaths

**Key Attributes:**
- id: string - Unique shrine identifier
- heroName: string - Name of hero whose soul created this shrine
- level: number - Dungeon level where shrine appears
- position: Position - Exact coordinates within level
- isActive: boolean - Whether shrine can still grant blessings
- blessingsGranted: number - How many times this shrine has been used
- createdAt: Date - When shrine was created from death event
- queuePosition: number | null - Position in shrine queue if not yet placed

### TypeScript Interface
```typescript
interface SoulShrine {
  id: string;
  heroName: string;
  level: number;
  position: Position;
  isActive: boolean;
  blessingsGranted: number;
  createdAt: Date;
  queuePosition: number | null;
}

interface Position {
  x: number;
  y: number;
}
```

### Relationships
- Created by one Hero death
- Located in one DungeonLevel
- Can bless multiple EquipmentItems

## DeathEvent

**Purpose:** Immutable record of hero deaths and their world consequences for event sourcing

**Key Attributes:**
- id: string - Unique event identifier
- heroId: string - Hero who died
- heroName: string - Name for equipment attribution
- killerMonsterId: string - Monster that dealt killing blow
- location: Position - Exact death coordinates
- teethDropped: number - Currency generated (1-32)
- equipmentTransferred: EquipmentItem[] - Items given to killer monster
- equipmentScattered: EquipmentItem[] - Items distributed to chests
- soulShrineCreated: boolean - Whether death created shrine
- processedAt: Date - When world changes were applied

### TypeScript Interface
```typescript
interface DeathEvent {
  id: string;
  heroId: string;
  heroName: string;
  killerMonsterId: string;
  location: Position;
  teethDropped: number;
  equipmentTransferred: EquipmentItem[];
  equipmentScattered: EquipmentItem[];
  soulShrineCreated: boolean;
  processedAt: Date;
}
```

### Relationships
- References one Hero
- References one Monster (killer)
- Creates one SoulShrine
- Creates one TeethDrop
- Transfers multiple EquipmentItems

---

## Local Persistence Architecture (Epics 1-4)

For Epics 1-4, all game state is persisted to the browser using IndexedDB. Cloud persistence (Supabase) is deferred to Epic 5.

### IndexedDB Database Schema

**Database name:** `larn-like-db`
**Version:** 1

| Object Store | keyPath | Indexes | Purpose |
|--------------|---------|---------|---------|
| `worldMeta` | `key` | — | Schema version, credits, lastSaved timestamp |
| `heroes` | `id` | `isAlive` | Current and past hero records |
| `dungeonLevels` | `depth` | — | Generated level layouts with rooms, corridors, stairs |
| `monsters` | `id` | `levelDepth`, `isEvolved` | All monster instances (baseline and evolved) |
| `deathEvents` | `id` | `timestamp`, `levelDepth` | Immutable death records for event sourcing |
| `soulShrines` | `id` | `levelDepth`, `isActive` | Shrine placement and blessing state |
| `teethDrops` | `id` | `levelDepth` | Teeth currency at death sites |

### Storage Format

IndexedDB stores structured JavaScript objects natively — no JSON serialization is required for reads and writes. Conventions:

- **Dates:** Stored as ISO 8601 strings for indexing compatibility, parsed back with `new Date()`
- **Enums:** Stored as string values for readability and forward compatibility
- **References:** Store IDs as strings; resolve relationships by querying the relevant object store
- **No Maps/Sets:** Use plain objects and arrays for IndexedDB compatibility

### LocalWorldState Interface

```typescript
interface LocalWorldState {
  /** Schema version for migration support */
  version: number;
  /** Credit counter for Insert Coin system */
  credits: number;
  /** Current living hero, or null if dead/not yet created */
  currentHero: Hero | null;
  /** All death events for this browser's history */
  deathEvents: DeathEvent[];
  /** Generated dungeon levels keyed by depth */
  levels: DungeonLevel[];
  /** Timestamp of last save */
  lastSaved: string;
}
```

### Database Initialization

```typescript
// Schema creation in onupgradeneeded handler
function onUpgradeNeeded(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    db.createObjectStore('worldMeta', { keyPath: 'key' });

    const heroStore = db.createObjectStore('heroes', { keyPath: 'id' });
    heroStore.createIndex('isAlive', 'isAlive');

    db.createObjectStore('dungeonLevels', { keyPath: 'depth' });

    const monsterStore = db.createObjectStore('monsters', { keyPath: 'id' });
    monsterStore.createIndex('levelDepth', 'level');
    monsterStore.createIndex('isEvolved', 'isEvolved');

    const deathStore = db.createObjectStore('deathEvents', { keyPath: 'id' });
    deathStore.createIndex('timestamp', 'processedAt');
    deathStore.createIndex('levelDepth', 'location.depth');

    const shrineStore = db.createObjectStore('soulShrines', { keyPath: 'id' });
    shrineStore.createIndex('levelDepth', 'level');
    shrineStore.createIndex('isActive', 'isActive');

    const teethStore = db.createObjectStore('teethDrops', { keyPath: 'id' });
    teethStore.createIndex('levelDepth', 'level');
  }
  // Future versions add migrations here: if (oldVersion < 2) { ... }
}
```

### Quota Management

IndexedDB storage is typically limited to ~50% of available disk space per origin, which is significantly more generous than localStorage's 5-10 MB limit. Quota issues are unlikely for this game but are handled defensively:

- **Usage monitoring:** Check `navigator.storage.estimate()` on save operations
- **Warning threshold:** Display a user notification when storage exceeds 80% of estimated quota
- **Mitigation strategies:**
  - Prune oldest death events beyond a configurable cap (e.g., keep last 200)
  - Offer the player an "export save" option (download world state as JSON file) before storage is full
- **Graceful failure:** If a write transaction fails due to quota, notify the player and skip the save rather than crashing

### Migration Path to Epic 5 (Cloud Persistence)

The `version` field in `worldMeta` enables schema migrations. When Epic 5 introduces Supabase:

1. Read all IndexedDB object stores and upload to corresponding Supabase tables as a one-time migration
2. Object store → table mapping is nearly 1:1 (`heroes` → `heroes`, `dungeonLevels` → `dungeon_levels`, `monsters` → `monsters`, etc.)
3. After successful cloud migration, IndexedDB becomes a write-through cache for offline support
4. The database version increments with each schema change; the `onupgradeneeded` handler applies transforms sequentially

---
