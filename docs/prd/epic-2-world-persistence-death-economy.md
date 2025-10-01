# Epic 2: World Persistence & Death Economy

**Epic Goal:** Implement the core innovation that transforms traditional roguelike death mechanics into permanent world consequences. When heroes die, killer monsters are promoted to deeper levels with enhanced stats and trophy equipment, while death sites drop teeth currency for future heroes to collect. This epic transforms deaths from meaningless resets into generative world-building events that create lasting challenges and resources.

## Story 2.1: World State Persistence Infrastructure
As a developer,
I want a persistent world state system that survives hero deaths and browser sessions,
so that monster evolutions, teeth locations, and world changes remain permanent across all gameplay sessions.

### Acceptance Criteria
1. Backend service (Vercel/Supabase) stores world state including monster locations, stats, and equipment
2. World state persists across browser refresh, device changes, and extended offline periods
3. Local-first architecture caches world state for offline play with sync on reconnection
4. Database schema supports monster evolution tracking, teeth location storage, and equipment histories
5. World state loads within 2 seconds on game startup with appropriate loading indicators
6. Conflict resolution handles concurrent world state changes gracefully

## Story 2.2: Monster Promotion on Player Death
As a player whose hero has died,
I want the monster that killed me to be promoted to a deeper dungeon level,
so that my death creates a permanent, more challenging encounter for future heroes.

### Acceptance Criteria
1. When hero dies, the killing monster is identified and removed from current level
2. Promoted monster gains enhanced stats (+1 HP minimum, possibly other stat bonuses)
3. Monster moves to the next deeper dungeon level (level 1 → level 2, level 2 → level 3, etc.)
4. Promoted monster retains original type but gains "evolved" status in world state
5. Death event triggers world state update that persists the monster promotion
6. Clear visual feedback shows player which monster killed them and will be promoted

## Story 2.3: Trophy Equipment Transfer System
As a player,
I want monsters that kill heroes to acquire the deceased hero's equipped items as trophies,
so that promoted monsters become more dangerous and carry visible reminders of past victories.

### Acceptance Criteria
1. When hero dies, all equipped items (dagger, armor, etc.) transfer to the killing monster
2. Monster equipment slots accommodate transferred items within the 9-slot constraint system
3. Promoted monsters display equipped trophy items in their detail panel descriptions
4. Trophy equipment provides appropriate stat bonuses to the promoted monster
5. Equipment overflow (when monster slots are full) gets distributed to nearby dungeon chests
6. Trophy equipment retains any naming or legacy information from previous heroes

## Story 2.4: Death Site Teeth Currency Generation
As a player starting a new hero,
I want to find teeth currency at locations where previous heroes died,
so that I can collect resources to purchase better equipment from town merchants.

### Acceptance Criteria
1. Hero death generates 1-32 teeth currency at the exact death location coordinates
2. Teeth remain at death sites permanently until collected by future heroes
3. Teeth display as collectible ASCII symbols ($ or similar) on dungeon floors
4. Player can interact with teeth to add them to current hero's currency inventory
5. Teeth collection provides clear visual and text feedback showing currency gained
6. Multiple teeth can accumulate at the same location from multiple hero deaths

## Story 2.5: Monster Evolution History Display
As a player encountering evolved monsters,
I want to see their kill history and trophy equipment,
so that I understand the story behind each monster and can strategically prepare for enhanced encounters.

### Acceptance Criteria
1. Monster inspection panel shows kill count and victim names (e.g., "Skeleton - Slayer of 3 Heroes")
2. Trophy equipment list displays items taken from defeated heroes with original names
3. Enhanced stats clearly indicate bonuses gained from previous victories
4. Monster descriptions differentiate evolved monsters from baseline dungeon creatures
5. History information is paginated appropriately for monsters with extensive kill records
6. Visual indicators (color, symbols) distinguish evolved monsters on the main game screen

## Story 2.6: New Hero Integration with Persistent World
As a player creating a new hero after death,
I want to enter a world shaped by my previous hero's death and other players' histories,
so that each new attempt feels meaningfully different due to accumulated world changes.

### Acceptance Criteria
1. New heroes spawn with fresh base stats but enter the persistent world state
2. Dungeon levels reflect all previous monster promotions, teeth drops, and equipment distributions
3. Heroes can immediately encounter evolved monsters and collect teeth from previous deaths
4. World state loading displays appropriate feedback about discovered changes since last play
5. New hero creation process accounts for available credits and maintains "Insert Coin" flow
6. Clear visual/text indicators help players understand which elements are persistent vs. reset

---
