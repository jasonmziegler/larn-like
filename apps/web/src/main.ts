import { CanvasRenderer } from './rendering/CanvasRenderer';
import { TitleScreen } from './ui/TitleScreen';
import { CharacterNamingScreen } from './ui/CharacterNamingScreen';
import { GameHUD } from './ui/GameHUD';
import { GAME_CONSTANTS, MONSTER_DEFINITIONS, Hero } from '@larn-like/shared';
import { createHero, getEffectiveAttack, getEffectiveDefense, applyDamage } from './game/Hero';
import { generateDungeon, findEmptySpot, Position, DungeonGrid } from './game/DungeonGenerator';

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

interface Monster extends Entity {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
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
}

// Constants - viewport dimensions (visible area)
const VIEWPORT_COLS = 78;
const VIEWPORT_ROWS = 20;
// Actual dungeon dimensions (larger than viewport)
const DUNGEON_WIDTH = 120;
const DUNGEON_HEIGHT = 40;
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

function initGame(heroName: string = 'Hero'): GameState {
  const { grid: dungeon } = generateDungeon({ width: DUNGEON_WIDTH, height: DUNGEON_HEIGHT });
  const occupied: Position[] = [];

  // Place hero in first room
  const heroPos = findEmptySpot(dungeon, occupied, DUNGEON_WIDTH, DUNGEON_HEIGHT);
  occupied.push(heroPos);

  const hero = createHero(heroName);
  hero.position.x = heroPos.x;
  hero.position.y = heroPos.y;

  // Place monsters - scale count to dungeon size
  const monsters: Monster[] = [];
  const areaRatio = (DUNGEON_WIDTH * DUNGEON_HEIGHT) / (78 * 20);
  const baseCount = 3 + Math.floor(Math.random() * 3);
  const monsterCount = Math.floor(baseCount * areaRatio);

  for (let i = 0; i < monsterCount; i++) {
    const pos = findEmptySpot(dungeon, occupied, DUNGEON_WIDTH, DUNGEON_HEIGHT);
    occupied.push(pos);

    const monsterKey = pickWeightedMonster();
    const def = MONSTER_DEFINITIONS[monsterKey];

    monsters.push({
      pos,
      char: def.asciiChar,
      color: MONSTER_COLORS[def.type] || COLORS.TEXT_NORMAL,
      name: def.name,
      health: def.baseHealth,
      maxHealth: def.baseHealth,
      attack: def.baseAttack,
      defense: def.baseDefense
    });
  }

  // Place teeth items - scale to dungeon size
  const items: (Entity & { type: 'teeth'; value: number })[] = [];
  const baseItemCount = 4 + Math.floor(Math.random() * 4);
  const itemCount = Math.floor(baseItemCount * areaRatio);

  for (let i = 0; i < itemCount; i++) {
    const pos = findEmptySpot(dungeon, occupied, DUNGEON_WIDTH, DUNGEON_HEIGHT);
    occupied.push(pos);

    items.push({
      pos,
      char: '%',
      color: COLORS.TEXT_BRIGHT,
      name: 'Teeth',
      type: 'teeth',
      value: 1 + Math.floor(Math.random() * 10)
    });
  }

  // Calculate initial camera position
  const cameraX = clamp(heroPos.x - Math.floor(VIEWPORT_COLS / 2), 0, DUNGEON_WIDTH - VIEWPORT_COLS);
  const cameraY = clamp(heroPos.y - Math.floor(VIEWPORT_ROWS / 2), 0, DUNGEON_HEIGHT - VIEWPORT_ROWS);

  return {
    hero,
    heroPos,
    monsters,
    items,
    dungeon,
    dungeonWidth: DUNGEON_WIDTH,
    dungeonHeight: DUNGEON_HEIGHT,
    cameraX,
    cameraY,
    messages: ['Welcome to the dungeon! Use WASD/Arrows/Numpad to move.', 'Bump into monsters to attack them!'],
    gameOver: false,
    victory: false
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// =============================================================================
// GAME LOGIC
// =============================================================================

function tryMove(state: GameState, dx: number, dy: number): void {
  if (state.gameOver) return;

  const newX = state.heroPos.x + dx;
  const newY = state.heroPos.y + dy;

  // Bounds check
  if (newX < 0 || newX >= state.dungeonWidth || newY < 0 || newY >= state.dungeonHeight) {
    return;
  }

  // Wall collision
  if (state.dungeon[newY][newX] === '#') {
    return;
  }

  // Diagonal wall collision - prevent corner-cutting
  if (dx !== 0 && dy !== 0) {
    if (state.dungeon[state.heroPos.y][newX] === '#' && state.dungeon[newY][state.heroPos.x] === '#') {
      return;
    }
  }

  // Monster collision = combat!
  const monster = state.monsters.find(m => m.pos.x === newX && m.pos.y === newY);
  if (monster) {
    combat(state, monster);
    return;
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
  }

  // Monsters move toward hero
  moveMonsters(state);
}

function combat(state: GameState, monster: Monster): void {
  // Hero attacks monster
  const heroAtk = getEffectiveAttack(state.hero);
  const heroDamage = Math.max(1, heroAtk - monster.defense + Math.floor(Math.random() * 5));
  monster.health -= heroDamage;
  state.messages.unshift(`You hit ${monster.name} for ${heroDamage} damage!`);

  if (monster.health <= 0) {
    state.messages.unshift(`${monster.name} is slain!`);
    const index = state.monsters.indexOf(monster);
    state.monsters.splice(index, 1);

    const teethDrop = 1 + Math.floor(Math.random() * 5);
    state.hero.teethCurrency += teethDrop;
    state.messages.unshift(`${monster.name} dropped ${teethDrop} teeth!`);

    if (state.monsters.length === 0) {
      state.victory = true;
      state.gameOver = true;
      state.messages.unshift('*** VICTORY! All monsters slain! Press R to restart. ***');
    }
    return;
  }

  // Monster retaliates
  const heroDef = getEffectiveDefense(state.hero);
  const monsterDamage = Math.max(1, monster.attack - heroDef + Math.floor(Math.random() * 3));
  applyDamage(state.hero, monsterDamage);
  state.messages.unshift(`${monster.name} hits you for ${monsterDamage} damage!`);

  if (!state.hero.isAlive) {
    state.gameOver = true;
    state.messages.unshift('*** YOU DIED! Press R to restart. ***');
  }
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

function render(renderer: CanvasRenderer, hud: GameHUD, state: GameState): void {
  renderer.clear();

  // Draw dungeon - only visible tiles within viewport
  for (let y = state.cameraY; y < state.cameraY + VIEWPORT_ROWS; y++) {
    for (let x = state.cameraX; x < state.cameraX + VIEWPORT_COLS; x++) {
      if (y >= 0 && y < state.dungeonHeight && x >= 0 && x < state.dungeonWidth) {
        const tile = state.dungeon[y][x];
        const color = tile === '#' ? COLORS.TEXT_DIM : COLORS.TEXT_DIM;
        renderer.drawChar(tile, x - state.cameraX + 1, y - state.cameraY + 1, color);
      }
    }
  }

  // Draw items (viewport-relative)
  for (const item of state.items) {
    if (isInViewport(item.pos.x, item.pos.y, state)) {
      renderer.drawChar(item.char, item.pos.x - state.cameraX + 1, item.pos.y - state.cameraY + 1, item.color);
    }
  }

  // Draw monsters (viewport-relative)
  for (const monster of state.monsters) {
    if (isInViewport(monster.pos.x, monster.pos.y, state)) {
      renderer.drawChar(monster.char, monster.pos.x - state.cameraX + 1, monster.pos.y - state.cameraY + 1, monster.color);
    }
  }

  // Draw hero (@) (viewport-relative)
  renderer.drawChar('@', state.heroPos.x - state.cameraX + 1, state.heroPos.y - state.cameraY + 1, COLORS.TEXT_BRIGHT);

  // Draw border (fixed)
  renderer.drawBox(0, 0, 80, 22);

  // Draw status bar via GameHUD (fixed)
  hud.renderStatusBar(state.hero, state.monsters.length, 22);

  // Draw message log (last 2 messages, fixed)
  for (let i = 0; i < Math.min(2, state.messages.length); i++) {
    const msg = state.messages[i];
    const color = i === 0 ? COLORS.TEXT_BRIGHT : COLORS.TEXT_DIM;
    renderer.drawText(msg.substring(0, 78), 1, 23 - i, color);
  }
}

// =============================================================================
// MAIN GAME LOOP
// =============================================================================

function init(): void {
  console.log('Initializing Larn-Like Dungeon Crawler...');

  const renderer = new CanvasRenderer('game-canvas');
  const titleScreen = new TitleScreen(renderer);
  const namingScreen = new CharacterNamingScreen(renderer);
  const hud = new GameHUD(renderer);
  let gameInputHandler: ((e: KeyboardEvent) => void) | null = null;

  function showTitleScreen(): void {
    if (gameInputHandler) {
      document.removeEventListener('keydown', gameInputHandler);
      gameInputHandler = null;
    }
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

  function startGame(heroName: string): void {
    const state = initGame(heroName);
    render(renderer, hud, state);

    gameInputHandler = (e: KeyboardEvent) => {
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
        tryMove(state, dx, dy);
      }

      render(renderer, hud, state);
    };

    document.addEventListener('keydown', gameInputHandler);
  }

  // Start with title screen
  showTitleScreen();
}

// Start the game
init();
