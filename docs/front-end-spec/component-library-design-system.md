# Component Library / Design System

## Design System Approach

**Hybrid ASCII Component System** - Leverages established roguelike conventions for core gameplay elements while creating custom components specifically for innovative features (persistent world mechanics, teeth economy, soul shrines). This approach maintains veteran familiarity while ensuring newcomer accessibility and proper support for unique game systems.

## Core Components

### Traditional Roguelike Components (Established Conventions)

**Movement & Exploration**
- **Purpose:** Character movement and map navigation using proven roguelike patterns
- **Variants:** WASD/Arrow keys/Numpad (player choice)
- **States:** Normal movement, combat locked, interaction mode
- **Usage Guidelines:** Follow NetHack/DCSS conventions for immediate veteran recognition

**Basic Combat Display**
- **Purpose:** Turn-based combat feedback using traditional roguelike messaging
- **Variants:** Hit/miss/damage display, monster death messages
- **States:** Player turn, monster turn, combat resolution
- **Usage Guidelines:** Maintain classic "You hit the skeleton for 3 damage" format

### Innovation-Specific Custom Components

**Enhanced Status Bar**
- **Purpose:** Display location, teeth currency, and health with newcomer clarity
- **Variants:** Town mode, dungeon mode, shop mode context
- **States:** Normal, low health warning, teeth collection feedback
- **Usage Guidelines:** Prioritize readability over abbreviation; full words instead of cryptic codes

**Death Consequence Display**
- **Purpose:** Transform traditional death into world-building education
- **Variants:** Monster promotion, soul shrine creation, teeth generation
- **States:** Single comprehensive display with automatic timing
- **Usage Guidelines:** Celebratory framing, complete information, forced return to title

**Soul Shrine Component**
- **Purpose:** Interactive blessing stations created by trapped souls
- **Variants:** `+` symbol with player name attribution, blessing success/failure states
- **States:** Available, used (disappears), blessing in progress
- **Usage Guidelines:** Clear naming "Player_Name's Shrine", mystical but understandable

**Blessed Item Indicators**
- **Purpose:** Visual distinction for equipment enhanced by soul shrines
- **Variants:** `*` suffix for blessed status, enhanced stat display
- **States:** Normal item, blessed item, blessing enhancement visible
- **Usage Guidelines:** Subtle but clear marking, maintain equipment functionality

---
