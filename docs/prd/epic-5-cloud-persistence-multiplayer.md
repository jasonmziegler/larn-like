# Epic 5: Cloud Persistence & Multiplayer

**Epic Goal:** Migrate world state persistence from browser-local storage to Supabase cloud backend, enabling cross-device play, multiplayer shared worlds, cloud backup, and concurrent conflict resolution. This epic builds on the local persistence foundation established in Epic 2, adding the infrastructure layer that transforms the single-player local experience into a connected, shared world.

## Story 5.1: Supabase Infrastructure Setup
As a developer,
I want a properly configured Supabase backend with database, auth, and real-time services,
so that the game can store and synchronize world state across devices and players.

### Acceptance Criteria
1. Supabase account created with PostgreSQL database provisioned for game data
2. Authentication service enabled with email/password and optional OAuth providers
3. API keys generated and environment variables configured for dev and production
4. Row Level Security (RLS) policies defined for all database tables
5. Real-time subscriptions enabled for world state synchronization
6. CI/CD pipeline updated with database migration deployment

## Story 5.2: Database Schema Deployment & Migration
As a developer,
I want the local world state schema migrated to Supabase PostgreSQL,
so that all existing data structures work identically in the cloud backend.

### Acceptance Criteria
1. Database schema deployed to Supabase matching the local storage data model
2. Migration scripts created for initial schema deployment and versioning
3. Database seeding scripts created for development data (monster types, game constants)
4. Schema versioning strategy documented with rollback procedures
5. Local-to-cloud data migration utility converts existing browser world state to cloud
6. Schema supports all monster evolution, teeth, and equipment tracking from Epic 2

## Story 5.3: Cloud Sync & Local-First Architecture
As a player,
I want my world state to sync to the cloud while still working offline,
so that I can play without internet and have my progress saved when reconnected.

### Acceptance Criteria
1. Local-first architecture caches world state for offline play
2. Sync engine pushes local changes to Supabase on reconnection
3. Conflict resolution handles concurrent world state changes gracefully
4. World state persists across browser refresh, device changes, and extended offline periods
5. Sync status indicator shows connection state and pending changes
6. Data integrity maintained during sync failures with automatic retry

## Story 5.4: Cross-Device Play
As a player,
I want to access my persistent world from any device,
so that I can continue playing on different computers or browsers.

### Acceptance Criteria
1. User authentication enables world state association with player account
2. World state loads from cloud on login from any device
3. Device switching preserves all monster evolutions, teeth locations, and equipment
4. Session handoff handles active play on multiple devices gracefully
5. World state loads within 2 seconds with appropriate loading indicators
6. Player can link existing local world state to new cloud account

## Story 5.5: Multiplayer Shared World
As a player,
I want to enter a world shaped by other players' deaths and histories,
so that the persistent world reflects a community of heroes, not just my own attempts.

### Acceptance Criteria
1. Death events from all players contribute to the shared world state
2. Evolved monsters carry trophy equipment from any player's defeated heroes
3. Teeth currency from all players' deaths are discoverable by any hero
4. Monster evolution history displays victim names from all contributing players
5. Real-time updates show world changes from other players during active sessions
6. Player count and community statistics displayed in town hub or title screen

## Story 5.6: Cloud Backup & Data Resilience
As a player,
I want my world state backed up in the cloud,
so that I never lose my persistent world due to browser storage clearing or device loss.

### Acceptance Criteria
1. World state automatically backed up to Supabase on every significant change
2. Player can restore world state from cloud backup after browser data loss
3. Backup versioning allows rollback to previous world states if needed
4. Storage service handles game assets and save data with proper access controls
5. Data export functionality allows players to download their world state
6. Backup system handles large world states efficiently without performance impact

---
