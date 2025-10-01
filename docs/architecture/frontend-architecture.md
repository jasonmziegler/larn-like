# Frontend Architecture

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
│   ├── Equipment.ts          # 9-slot equipment system
│   ├── Inventory.ts          # Inventory management
│   ├── Combat.ts             # Turn-based combat logic
│   └── Movement.ts           # Movement and collision
├── world/                    # World state and sync
│   ├── WorldState.ts         # Persistent world management
│   ├── LevelManager.ts       # Dungeon level handling
│   ├── SyncService.ts        # Backend synchronization
│   └── CacheManager.ts       # Local storage cache
├── ui/                       # UI components and screens
│   ├── TitleScreen.ts        # Insert Coin interface
│   ├── GameHUD.ts            # Main game interface
│   ├── DeathScreen.ts        # Full-screen death display
│   ├── InventoryPanel.ts     # Equipment management
│   └── HelpOverlay.ts        # Hotkey reference
├── services/                 # External service integration
│   ├── ApiClient.ts          # REST API communication
│   ├── WebSocketClient.ts    # Real-time updates
│   ├── AuthService.ts        # Supabase authentication
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

  // Sync coordination
  pendingActions: Action[];
  lastSyncTimestamp: number;
  isOnline: boolean;
  syncQueue: SyncEvent[];
}
```

### State Management Patterns

- **Local-First Updates:** All game actions update local state immediately for responsive feel
- **Event Sourcing:** Actions are immutable events that can be replayed for state reconstruction
- **Selective Synchronization:** Only world-changing events (deaths, equipment changes) sync to backend
- **Optimistic Updates:** UI updates immediately while background sync ensures persistence
- **Conflict Resolution:** Last-write-wins for most cases, with manual resolution for complex conflicts

---
