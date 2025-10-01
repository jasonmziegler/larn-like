# Requirements

## Functional Requirements

**FR1:** Each new hero spawns with identical base stats, basic equipment (dagger, shirt), and starting teeth currency, ensuring consistent starting conditions across all attempts.

**FR2:** Monster reagent consumption system grants temporary stat bonuses (+0.1 per consumable) that persist only for the current hero's lifespan and reset upon death.

**FR3:** Hero leveling system provides temporary stat increases and abilities that reset to base values when the hero dies and a new character is created.

**FR4:** Monster kill promotion system moves any monster that kills a hero to the next deeper dungeon level with enhanced stats and the deceased hero's equipped items as trophies.

**FR5:** Death site teeth generation drops 1-32 teeth currency at the exact location where each hero dies, collectable by future heroes.

**FR6:** Town merchant system allows heroes to purchase upgraded starting equipment using collected teeth currency before entering the dungeon.

**FR7:** Procedural dungeon level generation creates infinite explorable depth with appropriate monster population and difficulty scaling.

**FR8:** Evolved monster tracking system displays kill history and trophy equipment for promoted monsters (e.g., "Skeleton - Slayer of 3 Heroes, wielding Sarah's Iron Sword").

**FR9:** Nostalgic "Insert Coin" system displays classic arcade prompt where players press a button to add credits and hit enter to start new hero.

**FR10:** World persistence system maintains all monster evolutions, teeth locations, and dungeon modifications across hero deaths and player sessions.

## Non-Functional Requirements

**NFR1:** Game performance must maintain 60fps during combat and exploration with sub-200ms input response times in browser environment.

**NFR2:** World state persistence must survive browser refresh, device changes, and extended offline periods without data loss.

**NFR3:** Procedural level generation must complete within 2 seconds for levels up to depth 100, scaling appropriately for deeper levels.

**NFR4:** "Insert Coin" interface must provide satisfying nostalgic experience with appropriate visual and audio feedback.

**NFR5:** System must handle monster evolution chains of unlimited depth without performance degradation or storage overflow.

**NFR6:** Canvas-based ASCII rendering must maintain visual clarity and readability across different screen sizes and browser zoom levels.

---
