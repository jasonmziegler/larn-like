# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing frontend game client and backend world persistence services with shared TypeScript interfaces for game state, monster evolution, and world data structures. This approach simplifies development coordination between client-side game logic and server-side world persistence.

## Service Architecture

**Browser-local architecture** with all game mechanics and world state persistence running client-side using localStorage/IndexedDB. Cloud sync and server-side persistence are deferred to Epic 5 (Cloud Persistence & Multiplayer).

## Testing Requirements

**Unit + Integration testing** focused on core game mechanics, world persistence, and procedural generation systems. Critical test coverage for monster evolution logic, teeth economy balance, and infinite dungeon scaling. Manual testing convenience methods for rapid iteration on game balance and progression curves.

## Additional Technical Assumptions and Requests

- **Frontend Stack:** Vanilla TypeScript with Canvas 2D API for ASCII rendering, optimized for 60fps performance and minimal bundle size
- **Local Persistence:** Browser localStorage/IndexedDB for world state persistence. Cloud backend (Vercel/Supabase) deferred to Epic 5
- **Equipment System:** Fixed 9 equipment slots per entity (weapon/off-hand OR two-handed, helmet, body armor, gloves, boots, 2x rings, amulet, belt) with overflow items distributed to dungeon chests when monster inventory is full
- **Monster Display Architecture:** Single ASCII character monsters with paginated detail panels showing evolution history, equipment, and kill statistics
- **Dungeon Population System:** Density-based monster limits per level with evolved monster queue system that repopulates levels during room regeneration cycles
- **Data Storage Schema:** Efficient monster evolution tracking with equipment slot constraints, dungeon chest inventory management, and monster queue persistence across sessions
- **PWA Implementation:** Service worker for offline play capability and desktop app-like experience for roguelike veterans who prefer desktop gaming
- **Performance Optimization:** Canvas rendering optimizations for ASCII characters, paginated monster info panels, and efficient evolved monster queue management

---
