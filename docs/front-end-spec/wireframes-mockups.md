# Wireframes & Mockups

## Primary Design Files

**Design Tool Approach:** ASCII Layout Specifications rather than traditional graphical wireframes. Canvas-based rendering constraints and performance requirements drive specification format.

## Key Screen Layouts

### Main Game Interface Layout

**Purpose:** Unified interface serving town, dungeon, and shop contexts with optimal information density

**ASCII Layout Specification (80x40 character grid):**

```
┌─LOCATION: Town (Level 0)──────TEETH: 247──HEALTH: ████████████─┐
├─────────────────────────────────┬─────────────────────────────────┤
│                                 │ VIEW PANEL: "You are in the     │
│         MAP SECTION             │ Town Square. You see a         │
│     (40x20 characters)          │ merchant's shop to the north."  │
│                                 │                                 │
│  ##################             │ SHRINE/MONSTER INSPECTION:      │
│  #                #             │ [Flip content for monster       │
│  #    @     M     #             │  details, shrine descriptions,  │
│  #                #             │  combat information]            │
│  #  S         T   #             │                                 │
│  ##################             │ (30x10 characters)              │
├─────────────────────────────────┼─────────────────────────────────┤
│ PLAYER STATS:                   │                                 │
│ Level: 3    STR: 12.4           │        INVENTORY                │
│ HP: 24/30   DEX: 8.1            │                                 │
│ Equipped: Iron Sword, Leather   │ 1. Blessed Dagger*              │
│                                 │ 2. Health Potion                │
│ CHARACTER CARD FLIP:            │ 3. Rat Tail                     │
│ [Toggle equipped vs inventory]  │ 4. [empty]                      │
│                                 │ 5. [empty]                      │
├─────────────────────────────────┤ 6. [empty]                      │
│ ACTION LOG:                     │ 7. [empty]                      │
│ > You entered the town          │ 8. [empty]                      │
│ > Skeleton slain for 15 XP      │ 9. [empty]                      │
│ > Found 3 teeth                 │                                 │
│ > Blessed Dagger enhanced!      │ (30x18 characters)              │
│                                 │                                 │
│ (40x10 characters)              │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
```

**Key Elements:**
- **Status Bar:** Location, teeth currency, health bar (top 1 line)
- **Map Section:** Context-sensitive 40x20 area for town/dungeon/shop
- **View Panel:** 30x10 area for contextual descriptions and monster inspection
- **Player Stats:** 40x8 area with character card flip functionality
- **Action Log:** 40x10 scrolling combat/action history
- **Inventory:** 30x18 numbered item management with blessed item indicators

**Interaction Notes:**
- WASD/arrows for map movement
- `<`/`>` for stairs and pagination
- Number keys 1-9 for inventory interaction
- Character card flip key toggles equipped vs. carried items
- `?` for complete hotkey reference

### Death Screen Layout

**Purpose:** Full-screen takeover for comprehensive death consequence display

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                            HERO FALLEN                              │
│                                                                     │
│                                                                     │
│         Lvl 3 Sarah slain by Lvl 2 Vampire Bat                     │
│                                                                     │
│                                                                     │
│                        WORLD CONSEQUENCES:                          │
│                                                                     │
│         • Sarah's soul was trapped at Dungeon Level 2              │
│         • Sarah dropped 23 teeth at the site of death              │
│         • Lvl 2 Vampire Bat leveled up and descended deeper        │
│           into the dungeon with Sarah's Iron Sword                 │
│         • The rest of Sarah's belongings have been scattered       │
│           by rats and can be found in chests                       │
│                                                                     │
│                                                                     │
│                         LEGACY CREATED:                            │
│                                                                     │
│         • A shrine may appear on Level 2 that can bless            │
│           future heroes' equipment with mystical properties        │
│                                                                     │
│                                                                     │
│                                                                     │
│                  Press any key to return to title                  │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---
