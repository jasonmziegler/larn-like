# Epic 1: Foundation & Core Game Loop

**Epic Goal:** Establish project infrastructure, basic ASCII roguelike gameplay, and hero creation system with nostalgic "Insert Coin" interface. This epic delivers a playable single-session dungeon crawler that validates core combat mechanics, ASCII rendering, and traditional roguelike movement/interaction systems while providing the foundational codebase for all subsequent persistence features.

## Story 1.1: Project Foundation & Development Environment
As a developer,
I want a properly configured TypeScript monorepo with build tools and development environment,
so that I can efficiently develop and deploy the game with shared types between frontend and backend.

### Acceptance Criteria
1. TypeScript monorepo structure established with separate frontend/backend directories and shared types
2. Build system configured with development server, hot reload, and production bundling
3. Canvas 2D rendering context initialized with basic ASCII character display capability
4. Git repository initialized with appropriate .gitignore and basic CI/CD pipeline setup
5. Local development environment runs without errors and displays test ASCII characters

## Story 1.2: "Insert Coin" Title Screen
As a nostalgic roguelike player,
I want an authentic "Insert Coin" title screen experience,
so that I immediately recognize the retro gaming aesthetic and feel engaged with the classic arcade atmosphere.

### Acceptance Criteria
1. Title screen displays classic "INSERT COIN" prompt in authentic ASCII font styling
2. Credit counter shows available credits (starting with 3 free credits)
3. Pressing spacebar or designated key adds one credit with satisfying visual feedback
4. Enter key starts new game when credits available, reducing credit count by 1
5. Screen provides visual feedback when no credits available and player attempts to start
6. Title includes game name and basic instructions for credit system

## Story 1.3: Basic Hero Creation & Stats
As a player starting a new game,
I want to create a hero with base stats and starting equipment,
so that I can begin exploring the dungeon with consistent starting conditions.

### Acceptance Criteria
1. Hero spawns with predetermined base stats (HP, Strength, Dexterity, Constitution, etc.)
2. Starting equipment includes basic dagger and shirt automatically equipped
3. Hero displays as ASCII character (@) on game screen with proper positioning
4. Stats are clearly visible in UI sidebar or panel during gameplay
5. Equipment slots properly display currently equipped items (weapon, armor)
6. Hero creation process completes in under 1 second

## Story 1.4: ASCII Dungeon Rendering & Movement
As a player,
I want to navigate through ASCII dungeon levels using traditional roguelike controls,
so that I can explore the game world with familiar and responsive movement mechanics.

### Acceptance Criteria
1. Dungeon level renders as ASCII characters with walls (#), floors (.), and monsters (various letters)
2. WASD/arrow keys/numpad movement works smoothly with immediate visual response
3. Player character (@) moves one tile per keypress without sliding or animation delays
4. Movement collision detection prevents walking through walls or monsters
5. Screen viewport follows player movement, scrolling appropriately when player approaches edges
6. Dungeon layout includes rooms, corridors, and at least 3 different monster types visually distinct

## Story 1.5: Turn-Based Combat System
As a player,
I want to engage in turn-based combat with dungeon monsters,
so that I can experience classic roguelike tactical combat with clear feedback.

### Acceptance Criteria
1. Approaching monsters triggers turn-based combat mode with clear visual indication
2. Combat alternates between player and monster turns with appropriate timing
3. Damage calculations use hero and monster stats with results clearly displayed
4. HP reduction shows immediate visual feedback for both player and monsters
5. Monster death removes monster from dungeon and provides basic loot (monster reagent)
6. Player death displays appropriate death message and ends current game session
7. Combat log or message area shows attack results, damage dealt, and other combat events

## Story 1.6: Basic Monster Reagent System
As a player,
I want to consume monster reagents to gain temporary stat bonuses,
so that I can experience character progression during my current dungeon run.

### Acceptance Criteria
1. Killed monsters drop reagents (rat tail, skeleton bone, etc.) as lootable items
2. Player can consume reagents through inventory interaction (hotkey or mouse)
3. Reagent consumption grants +0.1 stat bonus (Agility, Stamina, etc.) for current hero
4. Stat bonuses display clearly in character stats panel with updated values
5. Multiple reagent consumption properly stacks bonuses (+0.1, +0.2, +0.3, etc.)
6. Reagent effects last for entire hero lifespan and reset only on hero death

---
