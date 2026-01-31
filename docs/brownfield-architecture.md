# Larn-Like Brownfield Architecture Document

**Purpose:** Quick reference for understanding the ACTUAL current state of the project.
**Last Updated:** 2026-01-25
**Target Reader:** Developer returning after time away, AI agents implementing features

---

## Quick Start - Get Running in 5 Minutes

```bash
# From project root
npm install          # Install all workspace dependencies
npm run dev          # Starts Vite dev server on http://localhost:5173
```

**What you'll see:** A green terminal-styled test screen showing ASCII character rendering (hero @, monsters, walls, gold). This confirms the rendering foundation works.

**No Supabase needed yet** - the current implementation is frontend-only with no backend calls.

---

## What Actually Exists (Reality Check)

### Implemented and Working

| Component | Location | Status |
|-----------|----------|--------|
| Monorepo structure | Root workspace | Working |
| Canvas ASCII renderer | `apps/web/src/rendering/CanvasRenderer.ts` | Working |
| Color manager (green terminal) | `apps/web/src/rendering/ColorManager.ts` | Working |
| Shared types | `packages/shared/src/types/*.ts` | Defined |
| Game constants | `packages/shared/src/constants/gameConstants.ts` | Defined |
| Monster/item definitions | `packages/shared/src/constants/monsters.ts`, `items.ts` | Defined |
| Supabase service stubs | `apps/web/src/services/*.ts` | Code exists, not connected |
| CI/CD workflows | `.github/workflows/` | Configured |
| Build system | Vite + TypeScript | Working |

### NOT Implemented (Despite Being in Architecture Docs)

These directories/features are **planned but don't exist yet**:

- `apps/web/src/core/` - No game engine, input manager, or game state
- `apps/web/src/game/` - No Hero, Monster, Combat, or Inventory classes
- `apps/web/src/world/` - No world persistence, level generation, or evolution
- `apps/web/src/ui/` - No React components or screens
- `apps/api/src/heroes/`, `world/`, `town/` - No API endpoints
- Database schema - Not deployed to Supabase
- "Insert Coin" screen - Not implemented
- Any actual gameplay - Not implemented

---

## Project Structure (What's Real)

```
larn-like/
├── apps/
│   ├── web/                      # Frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── main.ts           # Entry point - renders test screen
│   │   │   ├── rendering/
│   │   │   │   ├── CanvasRenderer.ts   # ASCII canvas rendering
│   │   │   │   └── ColorManager.ts     # Green intensity colors
│   │   │   └── services/
│   │   │       ├── supabase.ts         # Supabase client (stub)
│   │   │       ├── authService.ts      # Auth helpers (stub)
│   │   │       ├── realtimeService.ts  # Realtime helpers (stub)
│   │   │       └── storageService.ts   # Storage helpers (stub)
│   │   ├── tests/integration/    # Integration tests for Supabase
│   │   ├── index.html            # Canvas container
│   │   └── package.json
│   └── api/                      # Backend (placeholder only)
│       └── src/index.ts          # Empty placeholder
├── packages/
│   ├── shared/                   # Shared types/constants
│   │   └── src/
│   │       ├── types/            # Hero, Monster, World, Item, API types
│   │       ├── constants/        # Game constants, items, monsters
│   │       └── utils/            # Validation, calculations
│   └── config/                   # ESLint, TypeScript configs
├── docs/
│   ├── prd.md                    # Full PRD (comprehensive)
│   ├── prd/                      # Sharded PRD sections
│   ├── architecture/             # ASPIRATIONAL architecture (not reality!)
│   └── stories/                  # User stories 0.1-1.6
└── package.json                  # Workspace root
```

---

## Story Completion Status

| Story | Description | Status |
|-------|-------------|--------|
| **1.1** | Project Foundation & Dev Environment | **COMPLETE** |
| **0.1** | Supabase Setup | **PARTIAL** - code done, manual Supabase setup needed |
| 0.2 | Environment Configuration & Security | Ready |
| 0.3 | Database Schema Deployment | Ready |
| 0.4 | Development Environment Verification | Ready |
| 1.2 | "Insert Coin" Title Screen | Ready |
| 1.3 | Basic Hero Creation & Stats | Ready |
| 1.4 | ASCII Dungeon Rendering & Movement | Ready |
| 1.5 | Turn-Based Combat System | Ready |
| 1.6 | Basic Monster Reagent System | Ready |

---

## Key Files to Understand

### Entry Point
**`apps/web/src/main.ts`** - Creates renderer and displays test screen. This is where game initialization will happen.

### Rendering System
**`apps/web/src/rendering/CanvasRenderer.ts`** - Core rendering class with methods:
- `clear()` - Clear canvas with black background
- `drawChar(char, x, y, color)` - Draw single ASCII character
- `drawText(text, x, y, color)` - Draw text string
- `drawBox(x, y, width, height, color)` - Draw ASCII box border

### Constants
**`packages/shared/src/constants/gameConstants.ts`** - Key values:
- Viewport: 80x24 characters (classic terminal size)
- Colors: Green terminal aesthetic (`#00FF00`, `#00CC00`, `#008800`)
- Game settings: 15 dungeon levels, 100 starting health/gold

### Type Definitions
- `packages/shared/src/types/hero.types.ts` - Hero, Position, Equipment, HeroStats
- `packages/shared/src/types/monster.types.ts` - Monster types
- `packages/shared/src/types/world.types.ts` - World state types
- `packages/shared/src/types/item.types.ts` - Item/equipment types

---

## Next Action Step (Recommended Path)

### Option A: Complete Infrastructure First (Methodical)
Follow Epic 0 sequence:
1. **Story 0.1** - Create Supabase account, deploy database schema
2. **Story 0.2** - Configure environment variables properly
3. **Story 0.3** - Run database migrations
4. **Story 0.4** - Verify full stack works

### Option B: Build Playable Prototype First (Visual Progress)
Skip to Epic 1 gameplay:
1. **Story 1.2** - "Insert Coin" title screen (gives immediate visual feedback)
2. **Story 1.4** - Dungeon rendering & movement (most satisfying - walking around!)
3. **Story 1.3** - Hero creation (connects to movement)

**Recommendation for "working prototype today":** Go with **Option B, starting with Story 1.2 or 1.4**. You can run purely client-side without Supabase for now.

---

## Getting a Simple Working Prototype Today

### Fastest Path: Static Dungeon with Movement

The current `main.ts` shows a test screen. To get a playable prototype:

**Phase 1: Render a dungeon (modify main.ts)**
- Generate a simple room with walls (`#`) and floor (`.`)
- Place a hero (`@`) at center
- Display it on the existing canvas

**Phase 2: Add keyboard input**
- Listen for WASD/arrow keys
- Move hero position
- Re-render on each move

**Phase 3: Add a monster**
- Place a monster (`g` for goblin)
- Collision detection (can't walk through walls/monsters)

This can all be done in `main.ts` without any backend, database, or complex architecture. The CanvasRenderer already has everything needed.

### Minimum Files to Touch:
1. `apps/web/src/main.ts` - Replace test screen with game logic
2. Optionally create `apps/web/src/core/Game.ts` for cleaner structure

### What You Already Have:
- Working canvas renderer with ASCII support
- Color system (green terminal aesthetic)
- Type definitions for Hero, Monster, Position
- Game constants (viewport size, colors, starting stats)

---

## Technical Debt & Gotchas

1. **Architecture docs are aspirational** - `docs/architecture/source-tree.md` shows planned structure, not actual. Many directories don't exist.

2. **Supabase not connected** - Service files exist but require:
   - Create Supabase project manually
   - Copy `.env.example` to `.env.local` and fill in credentials
   - Deploy database schema (not done yet)

3. **No game loop yet** - Current code is static render. Need to implement:
   - Input handling
   - Game state management
   - Turn-based or real-time update loop

4. **Hero types mismatch PRD** - Current `hero.types.ts` has 5 equipment slots, PRD specifies 10-slot system. Will need update.

5. **No tests for game logic** - Only integration tests for Supabase services exist.

---

## Commands Reference

```bash
# Development
npm install              # Install all dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run test             # Run all tests

# From apps/web specifically
cd apps/web
npm run dev              # Dev server
npm run test:watch       # Watch mode tests
npm run lint             # ESLint check
```

---

## Story Files Location

All stories are in `docs/stories/`:
- `0.1.story.md` through `0.4.story.md` - Infrastructure (Epic 0)
- `1.1.story.md` through `1.6.story.md` - Foundation & Core Game Loop (Epic 1)

Each story has:
- Acceptance criteria
- Task breakdown with checkboxes
- Dev notes with architecture references
- Testing requirements

---

## Quick Decision: What to Do Right Now

| If you want... | Do this |
|----------------|---------|
| See current state | Run `npm run dev`, view test screen |
| Build playable demo fast | Implement dungeon + movement in `main.ts` |
| Follow proper sequence | Complete Story 0.1 (Supabase setup) |
| Understand the vision | Read `docs/prd.md` |
| See what's planned | Read stories in `docs/stories/` |

**My recommendation:** Run `npm run dev` to confirm it works, then implement a simple dungeon room with hero movement directly in `main.ts`. You can refactor to proper architecture later. Get something playable first.
