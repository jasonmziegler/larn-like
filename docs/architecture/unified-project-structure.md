# Unified Project Structure

```
larn-like/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # Application packages
│   ├── web/                    # Frontend application
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── core/           # Game engine
│   │   │   ├── rendering/      # Canvas rendering
│   │   │   ├── game/           # Game logic
│   │   │   ├── world/          # World state
│   │   │   ├── ui/             # UI screens
│   │   │   ├── services/       # API integration
│   │   │   ├── types/          # Type definitions
│   │   │   └── utils/          # Utilities
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests
│   │   └── package.json
│   └── api/                    # Backend application
│       ├── src/
│       │   ├── heroes/         # Hero API endpoints
│       │   ├── world/          # World API endpoints
│       │   ├── town/           # Town API endpoints
│       │   ├── shrines/        # Shrine API endpoints
│       │   ├── events/         # Event processing
│       │   └── shared/         # Shared backend utilities
│       ├── tests/              # Backend tests
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   ├── constants/      # Shared constants
│   │   │   └── utils/          # Shared utilities
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── jest/
├── infrastructure/             # IaC definitions
│   └── vercel/
│       └── vercel.json
├── scripts/                    # Build/deploy scripts
├── docs/                       # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── .env.example                # Environment template
├── package.json                # Root package.json
├── package-lock.json           # NPM workspace lock
└── README.md
```

---
