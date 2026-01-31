# Epic 3: Equipment & Town Systems

**Epic Goal:** Implement the complete 10-slot equipment system, town merchant interface for teeth-based purchases, and dungeon chest distribution for monster inventory overflow. This epic creates the full economic loop where collected teeth currency enables equipment upgrades, while the structured equipment system ensures manageable complexity for both players and monsters carrying trophy gear from defeated heroes.

## Story 3.1: Comprehensive Equipment Slot System
As a player,
I want a structured equipment system with 10 defined slots,
so that I can strategically equip gear while understanding exactly what items can be worn simultaneously.

### Acceptance Criteria
1. Equipment slots implemented: 1 weapon OR 1 off-hand + 1 weapon OR 1 two-handed weapon, helmet, body armor, gloves, boots, 2x rings, 1 amulet, belt
2. Equipment slot constraints prevent invalid combinations (two-handed weapon blocks off-hand slot)
3. Visual equipment panel clearly shows all 10 slots with equipped/empty status
4. Drag-and-drop or hotkey equipment management for efficient gear swapping
5. Equipped items provide appropriate stat bonuses that update character stats immediately
6. Equipment removal returns items to inventory with proper slot availability checking

## Story 3.2: Town Hub and Merchant Interface
As a player,
I want to visit a town with merchants who accept teeth currency,
so that I can spend collected teeth to purchase better starting equipment before entering the dungeon.

### Acceptance Criteria
1. Town hub accessible from game start with clear navigation to/from dungeon entrance
2. Merchant NPC interface displays available equipment for purchase with teeth prices
3. Purchase system deducts teeth currency and adds equipment to player inventory
4. Merchant inventory includes upgrades to basic starting gear (better weapons, armor, etc.)
5. Town interface shows current teeth currency balance prominently
6. Equipment tooltips display stats and compare with currently equipped items

## Story 3.3: Dungeon Chest System for Equipment Overflow
As a player exploring dungeons,
I want to find equipment in dungeon chests,
so that I can discover additional gear beyond basic merchant purchases and monster drops.

### Acceptance Criteria
1. Dungeon chests appear as interactive ASCII symbols (chest icon) in dungeon rooms
2. Chest interaction reveals contained equipment with proper inventory management
3. Equipment overflow from monster inventory limits automatically populates nearby chests
4. Chest contents persist in world state and can be discovered by any future hero
5. Visual feedback distinguishes unopened chests from opened/empty chests
6. Chest spawning algorithm ensures reasonable distribution without overcrowding levels

## Story 3.4: Monster Equipment Slot Management
As a system,
I want monsters to follow the same 10-slot equipment constraints as players,
so that promoted monsters carrying trophy gear remain manageable and don't become overly complex.

### Acceptance Criteria
1. Monsters use identical 10-slot equipment system as players with same constraints
2. When monster equipment slots are full, overflow items automatically distribute to nearby dungeon chests
3. Monster equipment display in detail panels shows organized slot-based layout
4. Trophy equipment from defeated heroes properly fills monster slots according to item types
5. Monster stat bonuses from equipment calculate using same system as player equipment
6. Equipment slot management handles edge cases (multiple rings, weapon/off-hand combinations)

## Story 3.5: Enhanced Inventory Management
As a player,
I want comprehensive inventory management with equipment comparison,
so that I can make informed decisions about gear upgrades and optimal loadouts.

### Acceptance Criteria
1. Inventory interface displays all carried items organized by type or slot compatibility
2. Equipment comparison tooltips show stat differences when hovering over potential upgrades
3. Inventory sorting options (by type, value, stats) for efficient gear organization
4. Quick-equip functionality for rapid gear swapping during dungeon exploration
5. Inventory weight or slot limits prevent unlimited item hoarding while allowing reasonable storage
6. Clear visual indicators distinguish between equipped, carried, and merchant/chest items

## Story 3.6: Economic Balance and Equipment Progression
As a player,
I want equipment costs and availability balanced appropriately,
so that teeth collection feels rewarding and equipment upgrades provide meaningful progression paths.

### Acceptance Criteria
1. Equipment pricing scaled appropriately to average teeth collection rates (death drops 1-32)
2. Multiple equipment tiers available (basic → improved → advanced) with clear progression paths
3. Rare or unique equipment occasionally appears in chests or as monster drops
4. Economic balance prevents trivial equipment acquisition while avoiding excessive grinding
5. Equipment stat bonuses provide noticeable gameplay impact without breaking game balance
6. Town merchant inventory refreshes or expands based on player progression or world events

---
