# Frontend Architecture

> **PHASE NOTE:** This document describes the full target architecture including cloud services. For Epics 1-4, all persistence is browser-local (localStorage/IndexedDB). Cloud components (Supabase, Vercel Functions, WebSockets, REST API) are deferred to Epic 5. Sections marked **(Epic 5)** do not apply to Epics 1-4.

## Component Architecture

### Component Organization

```
src/
├── core/                      # Core game engine
│   ├── GameEngine.ts         # Main game coordination
│   ├── GameState.ts          # Local state management
│   ├── InputHandler.ts       # Keyboard/mouse input
│   └── GameLoop.ts           # 60fps render loop
├── rendering/                # Canvas 2D rendering system
│   ├── CanvasRenderer.ts     # Main rendering coordinator
│   ├── ASCIIAtlas.ts         # Character sprite management
│   ├── ColorManager.ts       # Green intensity system
│   └── LayoutManager.ts      # Screen layout (map, UI panels)
├── game/                     # Game logic modules
│   ├── Hero.ts               # Hero state and actions
│   ├── Monster.ts            # Monster behavior and evolution
│   ├── Equipment.ts          # 10-slot equipment system
│   ├── Inventory.ts          # Inventory management
│   ├── Combat.ts             # Turn-based combat logic
│   └── Movement.ts           # Movement and collision
├── world/                    # World state and sync
│   ├── WorldState.ts         # Persistent world management
│   ├── LevelManager.ts       # Dungeon level handling
│   ├── SyncService.ts        # Backend synchronization **(Epic 5)**
│   └── CacheManager.ts       # Local storage cache
├── ui/                       # UI components and screens
│   ├── TitleScreen.ts        # Insert Coin interface
│   ├── GameHUD.ts            # Main game interface
│   ├── DeathScreen.ts        # Full-screen death display
│   ├── InventoryPanel.ts     # Equipment management
│   └── HelpOverlay.ts        # Hotkey reference
├── services/                 # External service integration
│   ├── ApiClient.ts          # REST API communication **(Epic 5)**
│   ├── WebSocketClient.ts    # Real-time updates **(Epic 5)**
│   ├── AuthService.ts        # Supabase authentication **(Epic 5)**
│   └── StorageService.ts     # Local persistence
├── types/                    # Shared type definitions
│   ├── GameTypes.ts          # Game-specific interfaces
│   ├── WorldTypes.ts         # World state interfaces
│   └── ApiTypes.ts           # API request/response types
└── utils/                    # Utility functions
    ├── ASCII.ts              # ASCII character utilities
    ├── Collision.ts          # Collision detection
    ├── Random.ts             # Deterministic RNG
    └── Performance.ts        # Performance monitoring
```

## State Management Architecture

### State Structure

```typescript
// Central game state following local-first principles
interface GameState {
  // Local game state (resets per hero)
  currentHero: Hero | null;
  localLevel: DungeonLevel | null;
  inputState: InputState;
  uiState: UIState;

  // Persistent world state (synced with backend)
  worldLevels: Map<number, DungeonLevel>;
  evolvedMonsters: Map<string, Monster>;
  soulShrines: Map<string, SoulShrine>;
  teethDrops: Map<string, TeethDrop>;

  // Sync coordination **(Epic 5)**
  pendingActions: Action[];
  lastSyncTimestamp: number;
  isOnline: boolean;
  syncQueue: SyncEvent[];
}
```

### State Management Patterns

- **Local-First Updates:** All game actions update local state immediately for responsive feel
- **Event Sourcing:** Actions are immutable events that can be replayed for state reconstruction
- **Selective Synchronization** **(Epic 5):** Only world-changing events (deaths, equipment changes) sync to backend
- **Optimistic Updates** **(Epic 5):** UI updates immediately while background sync ensures persistence
- **Conflict Resolution** **(Epic 5):** Last-write-wins for most cases, with manual resolution for complex conflicts

---
