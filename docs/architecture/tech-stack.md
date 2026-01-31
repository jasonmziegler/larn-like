# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe client-side game logic | Essential for shared interfaces and Canvas API type safety |
| Frontend Framework | Vanilla TypeScript | ES2022+ | Pure Canvas 2D game rendering | Maximum performance control for 60fps ASCII rendering |
| UI Component Library | Custom ASCII Components | - | Roguelike-specific interface elements | No existing library supports ASCII roguelike patterns |
| State Management | Custom Game State | - | Local game state with sync layer | Optimized for roguelike mechanics and world persistence |
| Backend Language | TypeScript | 5.3+ | Serverless function development | Shared types between frontend and backend |
| Backend Framework | Vercel Functions | Latest | Serverless API endpoints | Event-driven architecture for death processing *(Deferred to Epic 5)* |
| API Style | REST + WebSockets | HTTP/1.1, WS | RESTful actions + real-time updates | REST for commands, WebSockets for world state sync *(Deferred to Epic 5)* |
| Local Persistence | localStorage/IndexedDB | Browser native | Persistent world state storage (Epics 2-4) | Zero-infrastructure local persistence for single-device play |
| Database | Supabase PostgreSQL | 15+ | Cloud world state storage | Complex relational data for monster evolution *(Deferred to Epic 5)* |
| Cache | Supabase Realtime | Latest | Live world state synchronization | Real-time updates without polling overhead *(Deferred to Epic 5)* |
| File Storage | Supabase Storage | Latest | Static assets and save files | Integrated with authentication and database *(Deferred to Epic 5)* |
| Authentication | Supabase Auth | Latest | User sessions and save data | Built-in OAuth and session management *(Deferred to Epic 5)* |
| Frontend Testing | Vitest + Testing Library | Latest | Unit and integration tests | Fast testing for game logic and UI components |
| Backend Testing | Vitest | Latest | API endpoint and database tests | Consistent testing stack across frontend/backend |
| E2E Testing | Playwright | Latest | Full gameplay session testing | Cross-browser testing for Canvas rendering |
| Build Tool | Vite | 5+ | Frontend build and dev server | Fast HMR for game development iteration |
| Bundler | Rollup (via Vite) | Latest | Production bundle optimization | Tree shaking for minimal bundle size |
| IaC Tool | Vercel CLI | Latest | Deployment and environment config | Infrastructure as code for reproducible deploys *(Deferred to Epic 5)* |
| CI/CD | GitHub Actions | Latest | Automated testing and deployment | Integrated with Vercel for seamless deployment |
| Monitoring | Vercel Analytics | Latest | Performance and error tracking | Built-in monitoring for serverless functions |
| Logging | Vercel Logs + Supabase Logs | Latest | Centralized application logging | Distributed logging across serverless architecture *(Deferred to Epic 5)* |
| CSS Framework | Custom CSS + CSS Modules | CSS3 | ASCII terminal styling | Authentic 1980s terminal aesthetic with modern tooling |

---
