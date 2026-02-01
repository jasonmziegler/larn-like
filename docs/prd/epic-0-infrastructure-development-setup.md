# Epic 0: Infrastructure & Development Setup

> **STATUS: DEFERRED** — This epic's Supabase infrastructure work has been deferred to Epic 5 (Cloud Persistence & Multiplayer). Epic 2 now uses browser-local persistence (localStorage/IndexedDB). Stories 0.1-0.4 will be revisited and adapted in Epic 5.

**Epic Goal:** Establish complete development environment, external service integration, and deployment infrastructure before any game development begins. This epic ensures all developers have consistent, working environments with proper database and authentication setup, eliminating infrastructure blockers during core development.

## Story 0.1: Supabase Account Setup & API Configuration
As a developer,
I want a properly configured Supabase account with all necessary services enabled,
so that I can develop and test the game with persistent world state without infrastructure delays.

### Acceptance Criteria
1. Supabase account created with appropriate plan selection for development and production
2. PostgreSQL database provisioned with proper configuration for game data
3. Authentication service enabled with email/password and optional OAuth providers
4. API keys generated and documented for both public (anon) and service role access
5. Real-time subscriptions enabled for world state synchronization
6. Storage buckets created for any game assets or save data if needed

## Story 0.2: Environment Configuration & Security Setup
As a developer,
I want secure environment variable management and local development configuration,
so that I can safely develop with proper credential handling and team collaboration.

### Acceptance Criteria
1. Environment variable templates created (.env.example) with all required keys documented
2. Local development environment variables configured (.env.local) with development Supabase instance
3. Production environment variables configured in Vercel with production Supabase instance
4. Row Level Security (RLS) policies defined for all database tables with appropriate access controls
5. API key rotation procedures documented for production security
6. Git repository configured with proper .gitignore to exclude sensitive environment files

## Story 0.3: Database Schema Deployment & Migration Strategy
As a developer,
I want a reliable database schema deployment and migration system,
so that I can evolve the database structure safely during development and production updates.

### Acceptance Criteria
1. Initial database schema deployed to Supabase with all tables, indexes, and constraints
2. Supabase migration system configured for tracking schema changes
3. Migration scripts created for initial schema deployment
4. Database seeding scripts created for development data (monster types, initial game constants)
5. Schema versioning strategy documented with rollback procedures
6. Automated migration deployment configured in CI/CD pipeline

## Story 0.4: Development Environment Verification
As a developer,
I want a validated development environment setup with all services integrated,
so that I can immediately begin game development with confidence in the infrastructure.

### Acceptance Criteria
1. Local development server runs without errors and connects to Supabase services
2. Authentication flow tested with user registration, login, and session management
3. Database CRUD operations verified with test data insertion and retrieval
4. Real-time subscriptions tested with live data updates
5. Canvas 2D rendering context initialized and displaying basic ASCII characters
6. Build and deployment pipeline tested with successful production deployment

---
