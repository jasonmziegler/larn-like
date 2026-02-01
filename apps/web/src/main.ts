import { CanvasRenderer } from './rendering/CanvasRenderer';
import { TitleScreen } from './ui/TitleScreen';
import { CharacterNamingScreen } from './ui/CharacterNamingScreen';
import { GameHUD } from './ui/GameHUD';
import { InventoryPanel, groupReagents, getReagents } from './ui/InventoryPanel';
import { GAME_CONSTANTS, LAYOUT, MONSTER_DEFINITIONS, Hero } from '@larn-like/shared';
import { createHero } from './game/Hero';
import { findEmptySpot, Position, DungeonGrid } from './game/DungeonGenerator';
import { processCombat, processFlee, getAdjacentMonster, Monster } from './game/Combat';
import { consumeReagent } from './game/Inventory';
import { WorldState, DungeonLevelRecord } from './world/WorldState';
import { getOrGenerateLevel } from './game/LevelManager';
import { getTownSpawnPosition } from './game/TownGenerator';

// =============================================================================
// DUNGEON PROTOTYPE WITH HERO SYSTEM
// =============================================================================

// Types
interface Entity {
  pos: Position;
  char: string;
  color: string;
  name: string;
}

interface GameState {
  hero: Hero;
  heroPos: Position;
  monsters: Monster[];
  items: (Entity & { type: 'teeth'; value: number })[];
  dungeon: DungeonGrid;
  dungeonWidth: number;
  dungeonHeight: number;
  cameraX: number;
  cameraY: number;
  messages: string[];
  gameOver: boolean;
  victory: boolean;
  currentDepth: number;
  stairUpPos?: Position;
  stairDownPos?: Position;
}

// Constants - viewport dimensions (visible area)
const VIEWPORT_COLS = 78;
const VIEWPORT_ROWS = 20;
const COLORS = GAME_CONSTANTS.COLORS;

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

// Monster color mapping for visual differentiation
const MONSTER_COLORS: Record<string, string> = {
  goblin: COLORS.TEXT_NORMAL,   // green
  orc: COLORS.TEXT_BRIGHT,      // bright green
  troll: '#FF6600',             // orange
  dragon: '#FF0000',            // red
};

// Weighted monster distribution: more weak monsters, fewer strong ones
interface MonsterWeight {
  key: keyof typeof MONSTER_DEFINITIONS;
  weight: number;
}

const MONSTER_WEIGHTS: MonsterWeight[] = [
  { key: 'GOBLIN', weight: 50 },
  { key: 'ORC', weight: 30 },
  { key: 'TROLL', weight: 15 },
  { key: 'DRAGON', weight: 5 },
];

function pickWeightedMonster(): keyof typeof MONSTER_DEFINITIONS {
  const totalWeight = MONSTER_WEIGHTS.reduce((sum, mw) => sum + mw.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const mw of MONSTER_WEIGHTS) {
    roll -= mw.weight;
    if (roll <= 0) return mw.key;
  }
  return 'GOBLIN';
}

let monsterIdCounter = 0;
let teethIdCounter = 0;

function generateMonsterId(): string {
  return `mon_${Date.now()}_${++monsterIdCounter}`;
}

function generateTeethId(): string {
  return `teeth_${Date.now()}_${++teethIdCounter}`;
}

function gameStateToLevelRecord(state: GameState): DungeonLevelRecord {
  return {
    depth: state.currentDepth,
    dungeon: state.dungeon,
    monsters: state.monsters.map(m => ({
      id: (m as Monster & { _persistId?: string })._persistId || generateMonsterId(),
      pos: { x: m.pos.x, y: m.pos.y },
      char: m.char,
      color: m.color,
      name: m.name,
      health: m.health,
      maxHealth: m.maxHealth,
      attack: m.attack,
      defense: m.defense,
      type: m.type,
    })),
    items: state.items.map(item => ({
      id: (item as Entity & { type: 'teeth'; value: number; _persistId?: string })._persistId || generateTeethId(),
      pos: { x: item.pos.x, y: item.pos.y },
      char: item.char,
      color: item.color,
      name: item.name,
      type: 'teeth' as const,
      value: item.value,
    })),
    generatedAt: new Date().toISOString(),
  };
}

async function initGame(heroName: string, worldState: WorldState, depth: number = 0, arrivalStairType?: 'up' | 'down'): Promise<GameState> {
  // Get or generate the level at the specified depth
  const level = await getOrGenerateLevel(depth, worldState);

  // Convert monster records to Monster format
  const monsters: Monster[] = level.monsters.map(m => ({
    pos: { x: m.pos.x, y: m.pos.y },
    char: m.char,
    color: m.color,
    name: m.name,
    health: m.health,
    maxHealth: m.maxHealth,
    attack: m.attack,
    defense: m.defense,
    type: m.type,
    _persistId: m.id,
  } as Monster & { _persistId: string }));

  // If this is a freshly generated dungeon level (not town), populate with monsters
  if (depth >= 1 && monsters.length === 0) {
    const occupied: Position[] = [];

    // Add staircase positions to occupied list
    if (level.stairUpPos) occupied.push(level.stairUpPos);
    if (level.stairDownPos) occupied.push(level.stairDownPos);

    // Place monsters - scale count to dungeon size
    const areaRatio = (level.width * level.height) / (78 * 20);
    const baseCount = 3 + Math.floor(Math.random() * 3);
    const monsterCount = Math.floor(baseCount * areaRatio);

    for (let i = 0; i < monsterCount; i++) {
      const pos = findEmptySpot(level.grid, occupied, level.width, level.height);
      occupied.push(pos);

      const monsterKey = pickWeightedMonster();
      const def = MONSTER_DEFINITIONS[monsterKey];

      const newMonster = {
        pos,
        char: def.asciiChar,
        color: MONSTER_COLORS[def.type] || COLORS.TEXT_NORMAL,
        name: def.name,
        health: def.baseHealth,
        maxHealth: def.baseHealth,
        attack: def.baseAttack,
        defense: def.baseDefense,
        type: def.type,
        _persistId: generateMonsterId(),
      } as Monster & { _persistId: string };

      monsters.push(newMonster);
    }

    // TODO: Epic 2 - Replace with death event teeth generation (Story 2.4)
    // For now, no placeholder teeth in fresh levels (simplified)
  }

  const items = level.items;

  // Determine hero spawn position
  let heroPos: Position;

  if (arrivalStairType === 'up' && level.stairUpPos) {
    // Arriving via staircase down (coming from above), spawn at staircase up
    heroPos = level.stairUpPos;
  } else if (arrivalStairType === 'down' && level.stairDownPos) {
    // Arriving via staircase up (coming from below), spawn at staircase down
    heroPos = level.stairDownPos;
  } else if (depth === 0) {
    // Spawning in town for the first time
    heroPos = getTownSpawnPosition({ width: level.width, height: level.height });
  } else {
    // Default: find an empty spot
    const occupiedForHero = [
      ...monsters.map(m => m.pos),
      ...items.map(i => i.pos),
    ];
    if (level.stairUpPos) occupiedForHero.push(level.stairUpPos);
    if (level.stairDownPos) occupiedForHero.push(level.stairDownPos);
    heroPos = findEmptySpot(level.grid, occupiedForHero, level.width, level.height);
  }

  const hero = createHero(heroName);
  hero.position.x = heroPos.x;
  hero.position.y = heroPos.y;

  // Calculate initial camera position
  const cameraX = clamp(heroPos.x - Math.floor(VIEWPORT_COLS / 2), 0, level.width - VIEWPORT_COLS);
  const cameraY = clamp(heroPos.y - Math.floor(VIEWPORT_ROWS / 2), 0, level.height - VIEWPORT_ROWS);

  const welcomeMessage = depth === 0
    ? 'Welcome to Town! Step on the dungeon entrance (>) to descend.'
    : 'Welcome to the dungeon! Use WASD/Arrows/Numpad to move.';

  return {
    hero,
    heroPos,
    monsters,
    items,
    dungeon: level.grid,
    dungeonWidth: level.width,
    dungeonHeight: level.height,
    cameraX,
    cameraY,
    messages: [welcomeMessage, 'Bump into monsters to attack them!'],
    gameOver: false,
    victory: false,
    currentDepth: depth,
    stairUpPos: level.stairUpPos,
    stairDownPos: level.stairDownPos,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// =============================================================================
// GAME LOGIC
// =============================================================================

function persistLevel(state: GameState, worldState: WorldState): void {
  const levelRecord = gameStateToLevelRecord(state);
  worldState.saveLevel(levelRecord).catch(console.error);
}

async function transitionToLevel(
  state: GameState,
  newDepth: number,
  arrivalStairType: 'up' | 'down',
  worldState: WorldState
): Promise<GameState> {
  // Save current level state before transitioning
  persistLevel(state, worldState);

  // Load or generate the new level
  const newState = await initGame(state.hero.name, worldState, newDepth, arrivalStairType);

  // Carry over the hero's stats and inventory from the old state
  newState.hero = state.hero;
  newState.hero.position.x = newState.heroPos.x;
  newState.hero.position.y = newState.heroPos.y;

  return newState;
}

async function tryMove(state: GameState, dx: number, dy: number, worldState: WorldState, onLevelTransition: (newState: GameState) => void): Promise<void> {
  if (state.gameOver) return;

  const newX = state.heroPos.x + dx;
  const newY = state.heroPos.y + dy;

  // Bounds check
  if (newX < 0 || newX >= state.dungeonWidth || newY < 0 || newY >= state.dungeonHeight) {
    return;
  }

  const targetTile = state.dungeon[newY][newX];

  // Wall collision
  if (targetTile === '#') {
    return;
  }

  // Diagonal wall collision - prevent corner-cutting
  if (dx !== 0 && dy !== 0) {
    if (state.dungeon[state.heroPos.y][newX] === '#' && state.dungeon[newY][state.heroPos.x] === '#') {
      return;
    }
  }

  // Staircase interaction (after moving onto the tile)
  // First, check if we're already on a staircase and trying to use it
  const currentTile = state.dungeon[state.heroPos.y][state.heroPos.x];
  if (currentTile === '<' && dx === 0 && dy === 0) {
    // Already on staircase up, no movement command - do nothing for now
    // This handles the case where hero spawns on a staircase
    return;
  }
  if (currentTile === '>' && dx === 0 && dy === 0) {
    // Already on staircase down, no movement command - do nothing for now
    return;
  }

  // Check if moving onto a staircase
  if (targetTile === '<' || targetTile === '>') {
    // Allow movement onto the staircase tile first
    state.heroPos.x = newX;
    state.heroPos.y = newY;
    state.hero.position.x = newX;
    state.hero.position.y = newY;

    // Update camera
    state.cameraX = clamp(newX - Math.floor(VIEWPORT_COLS / 2), 0, state.dungeonWidth - VIEWPORT_COLS);
    state.cameraY = clamp(newY - Math.floor(VIEWPORT_ROWS / 2), 0, state.dungeonHeight - VIEWPORT_ROWS);

    // Trigger level transition
    if (targetTile === '<') {
      // Staircase up
      if (state.currentDepth > 0) {
        state.messages.unshift('Ascending...');
        const newState = await transitionToLevel(state, state.currentDepth - 1, 'up', worldState);
        onLevelTransition(newState);
      }
    } else if (targetTile === '>') {
      // Staircase down
      state.messages.unshift('Descending...');
      const newState = await transitionToLevel(state, state.currentDepth + 1, 'down', worldState);
      onLevelTransition(newState);
    }
    return;
  }

  // Monster collision = combat!
  const monster = state.monsters.find(m => m.pos.x === newX && m.pos.y === newY);
  if (monster) {
    const result = processCombat(state.hero, monster, state.monsters);
    state.messages.unshift(...result.messages);

    if (result.monsterKilled) {
      // Persist level with updated monster list
      persistLevel(state, worldState);

      if (state.monsters.length === 0) {
        state.victory = true;
        state.gameOver = true;
        state.messages.unshift('*** VICTORY! All monsters slain! Press R to restart. ***');
      }
    }
    if (result.heroKilled) {
      state.gameOver = true;
      // Save world state on hero death
      worldState.setCurrentHero(state.hero);
      persistLevel(state, worldState);
      worldState.saveWorld().catch(console.error);
    }
    return;
  }

  // Flee-on-disengage: check if moving away from an adjacent monster
  const adjacentMonster = getAdjacentMonster(state.heroPos.x, state.heroPos.y, state.monsters);
  if (adjacentMonster) {
    const newDx = Math.abs(adjacentMonster.pos.x - newX);
    const newDy = Math.abs(adjacentMonster.pos.y - newY);
    const movingAway = newDx > 1 || newDy > 1;

    if (movingAway) {
      const fleeResult = processFlee(state.hero, adjacentMonster);
      state.messages.unshift(...fleeResult.messages);

      if (!fleeResult.success) {
        // Hero stays in place, already took free attack damage
        if (!state.hero.isAlive) {
          state.gameOver = true;
          // Save world state on hero death
          worldState.setCurrentHero(state.hero);
          worldState.saveWorld().catch(console.error);
        }
        return;
      }
      // Flee success: fall through to normal movement
    }
  }

  // Move hero
  state.heroPos.x = newX;
  state.heroPos.y = newY;
  state.hero.position.x = newX;
  state.hero.position.y = newY;

  // Update camera to follow hero
  state.cameraX = clamp(newX - Math.floor(VIEWPORT_COLS / 2), 0, state.dungeonWidth - VIEWPORT_COLS);
  state.cameraY = clamp(newY - Math.floor(VIEWPORT_ROWS / 2), 0, state.dungeonHeight - VIEWPORT_ROWS);

  // Check for items
  const itemIndex = state.items.findIndex(i => i.pos.x === newX && i.pos.y === newY);
  if (itemIndex !== -1) {
    const item = state.items[itemIndex];
    state.hero.teethCurrency += item.value;
    state.messages.unshift(`Picked up ${item.value} ${item.name}!`);
    state.items.splice(itemIndex, 1);

    // Save hero and level state on teeth pickup
    worldState.setCurrentHero(state.hero);
    worldState.saveHero().catch(console.error);
    persistLevel(state, worldState);
  }

  // Monsters move toward hero
  moveMonsters(state);
}

function moveMonsters(state: GameState): void {
  for (const monster of state.monsters) {
    const dx = state.heroPos.x - monster.pos.x;
    const dy = state.heroPos.y - monster.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist > 10) continue;
    if (Math.random() < 0.5) continue;

    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      moveY = dy > 0 ? 1 : -1;
    }

    const newX = monster.pos.x + moveX;
    const newY = monster.pos.y + moveY;

    if (state.dungeon[newY]?.[newX] === '.' &&
        !state.monsters.some(m => m !== monster && m.pos.x === newX && m.pos.y === newY) &&
        !(state.heroPos.x === newX && state.heroPos.y === newY)) {
      monster.pos.x = newX;
      monster.pos.y = newY;
    }
  }
}

// =============================================================================
// RENDERING
// =============================================================================

function isInViewport(x: number, y: number, state: GameState): boolean {
  return x >= state.cameraX && x < state.cameraX + VIEWPORT_COLS &&
         y >= state.cameraY && y < state.cameraY + VIEWPORT_ROWS;
}

function render(renderer: CanvasRenderer, hud: GameHUD, state: GameState, inventoryPanel?: InventoryPanel): void {
  renderer.clear();

  const mapOffsetY = LAYOUT.ROW_MAP_START + 1; // +1 for top border row of map box

  // Draw dungeon - only visible tiles within viewport
  for (let y = state.cameraY; y < state.cameraY + VIEWPORT_ROWS; y++) {
    for (let x = state.cameraX; x < state.cameraX + VIEWPORT_COLS; x++) {
      if (y >= 0 && y < state.dungeonHeight && x >= 0 && x < state.dungeonWidth) {
        const tile = state.dungeon[y][x];
        const color = tile === '#' ? COLORS.TEXT_DIM : COLORS.TEXT_DIM;
        renderer.drawChar(tile, x - state.cameraX + 1, y - state.cameraY + mapOffsetY, color);
      }
    }
  }

  // Draw items (viewport-relative)
  for (const item of state.items) {
    if (isInViewport(item.pos.x, item.pos.y, state)) {
      renderer.drawChar(item.char, item.pos.x - state.cameraX + 1, item.pos.y - state.cameraY + mapOffsetY, item.color);
    }
  }

  // Draw monsters (viewport-relative)
  for (const monster of state.monsters) {
    if (isInViewport(monster.pos.x, monster.pos.y, state)) {
      renderer.drawChar(monster.char, monster.pos.x - state.cameraX + 1, monster.pos.y - state.cameraY + mapOffsetY, monster.color);
    }
  }

  // Draw hero (@) (viewport-relative)
  renderer.drawChar('@', state.heroPos.x - state.cameraX + 1, state.heroPos.y - state.cameraY + mapOffsetY, COLORS.TEXT_BRIGHT);

  // Draw map border (rows 3-23: 21 rows high = top border + 20 map rows + bottom border, with side borders)
  renderer.drawBox(0, LAYOUT.ROW_MAP_START, 80, LAYOUT.ROW_MAP_END - LAYOUT.ROW_MAP_START + 1);

  // Draw status bar at row 1
  hud.renderStatusBar(state.hero, state.monsters.length, LAYOUT.ROW_STATUS_BAR);

  // Draw adjacent monster info at row 2
  const adjacent = getAdjacentMonster(state.heroPos.x, state.heroPos.y, state.monsters);
  hud.renderAdjacentMonster(adjacent, LAYOUT.ROW_MONSTER_INFO);

  // Draw action log (rows 24-29, newest at top)
  for (let i = 0; i < Math.min(LAYOUT.ACTION_LOG_LINES, state.messages.length); i++) {
    const msg = state.messages[i];
    const color = i === 0 ? COLORS.TEXT_BRIGHT : COLORS.TEXT_DIM;
    renderer.drawText(msg.substring(0, 78), 1, LAYOUT.ROW_ACTION_LOG_START + i, color);
  }

  // Draw inventory overlay if open
  if (inventoryPanel) {
    inventoryPanel.render(state.hero);
  }
}

// =============================================================================
// MAIN GAME LOOP
// =============================================================================

async function init(): Promise<void> {
  console.log('Initializing Larn-Like Dungeon Crawler...');

  const renderer = new CanvasRenderer('game-canvas');

  // Show loading indicator while IndexedDB initializes
  renderer.clear();
  const loadingText = 'Loading world state...';
  const loadingX = Math.floor((80 - loadingText.length) / 2);
  renderer.drawText(loadingText, loadingX, 14, COLORS.TEXT_DIM);

  // Initialize world state persistence and measure load time
  const loadStart = performance.now();
  const worldState = new WorldState();
  try {
    await worldState.initializeWorld();
  } catch (err) {
    console.error('Failed to initialize world state:', err);
    // Continue without persistence — game still playable
  }
  const loadMs = performance.now() - loadStart;
  if (loadMs > 500) {
    console.warn(`World state load took ${loadMs.toFixed(0)}ms (target: <500ms)`);
  } else {
    console.log(`World state loaded in ${loadMs.toFixed(0)}ms`);
  }

  const titleScreen = new TitleScreen(renderer);
  const namingScreen = new CharacterNamingScreen(renderer);
  namingScreen.setWorldState(worldState); // Enable world reset
  const hud = new GameHUD(renderer);
  const inventoryPanel = new InventoryPanel(renderer);
  let gameInputHandler: ((e: KeyboardEvent) => void) | null = null;

  // Sync credits: WorldState is source of truth, TitleScreen is the UI
  titleScreen.setCredits(worldState.getCredits());
  titleScreen.setOnCreditsChanged((credits: number) => {
    worldState.setCredits(credits);
    worldState.saveCredits().catch(console.error);
  });

  function showTitleScreen(): void {
    if (gameInputHandler) {
      document.removeEventListener('keydown', gameInputHandler);
      gameInputHandler = null;
    }
    titleScreen.setCredits(worldState.getCredits());
    titleScreen.show(showNamingScreen);
  }

  function showNamingScreen(): void {
    namingScreen.show(
      (name: string) => {
        startGame(name);
      },
      () => {
        titleScreen.addCredit();
        showTitleScreen();
      }
    );
  }

  async function startGame(heroName: string): Promise<void> {
    // Start in town (depth 0)
    let state = await initGame(heroName, worldState, 0);
    inventoryPanel.close();

    // Save level and hero to world state
    const levelRecord = gameStateToLevelRecord(state);
    worldState.setCurrentHero(state.hero);
    worldState.saveLevel(levelRecord).catch(console.error);
    worldState.saveHero().catch(console.error);

    render(renderer, hud, state, inventoryPanel);

    gameInputHandler = (e: KeyboardEvent) => {
      // Inventory toggle keys
      if (e.key === 'i' || e.key === 'I' || e.key === 'Tab') {
        e.preventDefault();
        inventoryPanel.toggle();
        render(renderer, hud, state, inventoryPanel);
        return;
      }

      // While inventory is open, handle consumption and close
      if (inventoryPanel.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          inventoryPanel.close();
          render(renderer, hud, state, inventoryPanel);
          return;
        }

        // Number keys 1-9 consume reagent
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const grouped = groupReagents(getReagents(state.hero));
          if (num <= grouped.length) {
            const result = consumeReagent(state.hero, grouped[num - 1].reagent.monsterType);
            if (result) {
              state.messages.unshift(result.message);
            }
          }
          render(renderer, hud, state, inventoryPanel);
          return;
        }
        return;
      }

      let dx = 0;
      let dy = 0;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          dy = -1;
          break;
        case 's':
        case 'arrowdown':
          dy = 1;
          break;
        case 'a':
        case 'arrowleft':
          dx = -1;
          break;
        case 'd':
        case 'arrowright':
          dx = 1;
          break;
        case 'r':
          if (state.gameOver) {
            showTitleScreen();
            return;
          }
          break;
        default:
          // Numpad movement (use e.key for numpad digits)
          switch (e.key) {
            case '8': dy = -1; break;              // up
            case '2': dy = 1; break;               // down
            case '4': dx = -1; break;              // left
            case '6': dx = 1; break;               // right
            case '7': dx = -1; dy = -1; break;     // up-left
            case '9': dx = 1; dy = -1; break;      // up-right
            case '1': dx = -1; dy = 1; break;      // down-left
            case '3': dx = 1; dy = 1; break;       // down-right
            default: return;
          }
          break;
      }

      e.preventDefault();

      if (dx !== 0 || dy !== 0) {
        // Handle async tryMove with level transition callback
        tryMove(state, dx, dy, worldState, (newState) => {
          state = newState;
          render(renderer, hud, state, inventoryPanel);
        }).then(() => {
          render(renderer, hud, state, inventoryPanel);
        });
        return;
      }

      render(renderer, hud, state, inventoryPanel);
    };

    document.addEventListener('keydown', gameInputHandler);
  }

  // Start with title screen
  showTitleScreen();
}

// Start the game
init().catch(console.error);
