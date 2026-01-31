# Source Tree

This document describes the complete directory structure and file organization for the Larn-Like Dungeon Crawler project.

## Root Structure

```
larn-like/
├── .bmad-core/                 # BMAD agent configuration
├── .claude/                    # Claude Code configuration
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yaml            # Continuous Integration
│       └── deploy.yaml        # Deployment automation
├── .git/                      # Git version control
├── .gitignore                 # Git ignore patterns
├── apps/                      # Application packages (monorepo apps)
├── packages/                  # Shared packages (monorepo packages)
├── infrastructure/            # Infrastructure as Code
├── scripts/                   # Build and deployment scripts
├── docs/                      # Documentation
├── .env.example              # Environment variables template
├── package.json              # Root package.json (workspace config)
├── package-lock.json         # NPM lockfile
└── README.md                 # Project README
```

## Apps Directory (`apps/`)

### Web Frontend (`apps/web/`)

Browser-based game client using React and Canvas rendering.

```
apps/web/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── core/                # Game engine core
│   │   ├── Engine.ts        # Main game loop
│   │   ├── InputManager.ts  # Keyboard/mouse input
│   │   └── GameState.ts     # Global game state
│   ├── rendering/           # Canvas rendering system
│   │   ├── Renderer.ts      # Main renderer
│   │   ├── Camera.ts        # Viewport/camera
│   │   ├── TileRenderer.ts  # Tile-based rendering
│   │   └── UIRenderer.ts    # UI overlay rendering
│   ├── game/                # Game logic layer
│   │   ├── Hero.ts          # Hero entity and actions
│   │   ├── Monster.ts       # Monster entities
│   │   ├── Combat.ts        # Combat system
│   │   ├── Inventory.ts     # Inventory management
│   │   └── Items.ts         # Item definitions
│   ├── world/               # World state management
│   │   ├── World.ts         # World persistence
│   │   ├── Level.ts         # Level generation
│   │   ├── Evolution.ts     # Monster evolution logic
│   │   └── DeathEconomy.ts  # Death sites and teeth
│   ├── ui/                  # UI screens and menus
│   │   ├── MainMenu.tsx
│   │   ├── TownScreen.tsx
│   │   ├── DungeonUI.tsx
│   │   └── CharacterSheet.tsx
│   ├── services/            # API integration layer
│   │   ├── api.ts           # API client setup
│   │   ├── heroService.ts   # Hero API calls
│   │   ├── worldService.ts  # World API calls
│   │   └── authService.ts   # Authentication
│   ├── types/               # Frontend-specific TypeScript types
│   │   ├── game.types.ts
│   │   └── ui.types.ts
│   ├── utils/               # Utility functions
│   │   ├── random.ts        # RNG utilities
│   │   ├── pathfinding.ts   # A* pathfinding
│   │   └── formatting.ts    # Display formatting
│   ├── App.tsx              # Root React component
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # Vite type definitions
├── public/                  # Static assets
│   ├── assets/
│   │   ├── sprites/         # Game sprites
│   │   ├── tiles/           # Tileset images
│   │   └── sounds/          # Audio files
│   └── favicon.ico
├── tests/                   # Frontend tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
└── package.json             # Frontend dependencies
```

### Backend API (`apps/api/`)

Serverless API functions (Vercel Functions or similar).

```
apps/api/
├── src/
│   ├── heroes/              # Hero management endpoints
│   │   ├── create.ts        # POST /api/heroes
│   │   ├── get.ts           # GET /api/heroes/:id
│   │   ├── update.ts        # PATCH /api/heroes/:id
│   │   └── death.ts         # POST /api/heroes/:id/death
│   ├── world/               # World state endpoints
│   │   ├── get.ts           # GET /api/world
│   │   ├── level.ts         # GET /api/world/level/:depth
│   │   └── evolution.ts     # POST /api/world/evolve
│   ├── town/                # Town and merchant endpoints
│   │   ├── merchant.ts      # GET/POST /api/town/merchant
│   │   └── shrine.ts        # GET /api/town/shrine
│   ├── shrines/             # Shrine interaction endpoints
│   │   ├── visit.ts         # POST /api/shrines/visit
│   │   └── offerings.ts     # POST /api/shrines/offer
│   ├── events/              # Event processing
│   │   ├── deathHandler.ts  # Process hero death
│   │   └── evolutionHandler.ts # Process monster evolution
│   └── shared/              # Shared backend utilities
│       ├── db.ts            # Database client
│       ├── auth.ts          # Auth middleware
│       ├── validation.ts    # Input validation
│       └── errors.ts        # Error handling
├── tests/                   # Backend tests
│   ├── unit/
│   └── integration/
├── tsconfig.json            # TypeScript config
└── package.json             # Backend dependencies
```

## Packages Directory (`packages/`)

### Shared Package (`packages/shared/`)

Shared types, constants, and utilities used by both frontend and backend.

```
packages/shared/
├── src/
│   ├── types/               # Shared TypeScript types
│   │   ├── hero.types.ts    # Hero entity types
│   │   ├── monster.types.ts # Monster entity types
│   │   ├── world.types.ts   # World state types
│   │   ├── item.types.ts    # Item and equipment types
│   │   └── api.types.ts     # API request/response types
│   ├── constants/           # Shared constants
│   │   ├── gameConstants.ts # Game rules and values
│   │   ├── items.ts         # Item definitions
│   │   └── monsters.ts      # Monster definitions
│   └── utils/               # Shared utilities
│       ├── validation.ts    # Shared validation logic
│       └── calculations.ts  # Shared game calculations
├── tsconfig.json
└── package.json
```

### UI Package (`packages/ui/`)

Shared UI components (if needed for multiple apps).

```
packages/ui/
├── src/
│   ├── components/
│   └── styles/
├── tsconfig.json
└── package.json
```

### Config Package (`packages/config/`)

Shared configuration for tooling.

```
packages/config/
├── eslint/
│   └── .eslintrc.js
├── typescript/
│   ├── base.json
│   ├── react.json
│   └── node.json
└── jest/
    └── jest.config.js
```

## Infrastructure Directory (`infrastructure/`)

```
infrastructure/
├── vercel/
│   └── vercel.json          # Vercel deployment config
└── terraform/               # Future: Terraform IaC
    └── main.tf
```

## Scripts Directory (`scripts/`)

```
scripts/
├── build.sh                 # Build all packages
├── test.sh                  # Run all tests
├── deploy.sh                # Deployment script
└── seed-db.ts               # Database seeding
```

## Documentation Directory (`docs/`)

```
docs/
├── prd.md                   # Product Requirements Document
├── front-end-spec.md        # Frontend Specification
├── architecture.md          # Full Architecture Document
├── SETUP.md                 # Setup and installation guide
├── architecture/            # Sharded architecture docs
│   ├── index.md
│   ├── source-tree.md       # This file
│   ├── tech-stack.md
│   ├── coding-standards.md
│   ├── high-level-architecture.md
│   ├── components.md
│   ├── data-models.md
│   ├── api-specification.md
│   ├── database-schema.md
│   ├── frontend-architecture.md
│   ├── backend-architecture.md
│   ├── unified-project-structure.md
│   ├── development-workflow.md
│   ├── deployment-architecture.md
│   ├── security-and-performance.md
│   ├── testing-strategy.md
│   ├── error-handling-strategy.md
│   ├── monitoring-and-observability.md
│   └── checklist-results-report.md
├── prd/                     # Sharded PRD docs
└── stories/                 # User stories and epics
```

## File Naming Conventions

### Frontend Files
- **Components:** PascalCase, `.tsx` extension (e.g., `HeroCard.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useGameLoop.ts`)
- **Utilities:** camelCase (e.g., `pathfinding.ts`)
- **Types:** camelCase with `.types.ts` suffix (e.g., `hero.types.ts`)

### Backend Files
- **API Routes:** camelCase or kebab-case (e.g., `create.ts`, `death-handler.ts`)
- **Services:** camelCase with service context (e.g., `heroService.ts`)

### Shared Files
- **Types:** camelCase with `.types.ts` suffix
- **Constants:** camelCase (e.g., `gameConstants.ts`)

## Key Directories by Purpose

| Purpose | Directory |
|---------|-----------|
| Game Engine Core | `apps/web/src/core/` |
| Rendering System | `apps/web/src/rendering/` |
| Game Logic | `apps/web/src/game/` |
| UI Components | `apps/web/src/components/`, `apps/web/src/ui/` |
| API Client | `apps/web/src/services/` |
| API Endpoints | `apps/api/src/{domain}/` |
| Shared Types | `packages/shared/src/types/` |
| Game Constants | `packages/shared/src/constants/` |
| Tests | `apps/web/tests/`, `apps/api/tests/` |
| Documentation | `docs/` |
| Build Scripts | `scripts/` |
| Infrastructure | `infrastructure/` |

## Import Patterns

```typescript
// Frontend importing shared types
import { Hero, Monster } from '@larn-like/shared/types';
import { GAME_CONSTANTS } from '@larn-like/shared/constants';

// Frontend importing UI components
import { Button } from '@larn-like/ui';

// Backend importing shared types
import { WorldState, HeroDeathEvent } from '@larn-like/shared/types';

// Relative imports within same app
import { Engine } from '../core/Engine';
import { Renderer } from '../rendering/Renderer';
```

## Environment Files

```
.env.example              # Template with placeholder values
.env                      # Local development (git-ignored)
.env.local                # Local overrides (git-ignored)
.env.production           # Production values (deployed separately)
```

---

*This source tree reflects the monorepo structure using npm workspaces with separate frontend and backend applications sharing common packages.*
