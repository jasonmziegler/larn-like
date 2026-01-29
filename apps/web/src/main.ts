import { CanvasRenderer } from './rendering/CanvasRenderer';
import { TitleScreen } from './ui/TitleScreen';
import { GAME_CONSTANTS, MONSTER_DEFINITIONS } from '@larn-like/shared';

// =============================================================================
// SIMPLE DUNGEON PROTOTYPE
// =============================================================================

// Types
interface Position {
  x: number;
  y: number;
}

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
  hero: Entity & { health: number; maxHealth: number; gold: number; attack: number; defense: number };
  monsters: Monster[];
  items: (Entity & { type: 'gold' | 'teeth'; value: number })[];
  dungeon: string[][];
  messages: string[];
  gameOver: boolean;
  victory: boolean;
}

// Constants
const DUNGEON_WIDTH = 78;  // Leave room for border
const DUNGEON_HEIGHT = 20; // Leave room for status bar
const COLORS = GAME_CONSTANTS.COLORS;

// =============================================================================
// DUNGEON GENERATION
// =============================================================================

function generateDungeon(): string[][] {
  const dungeon: string[][] = [];

  // Fill with walls
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    dungeon[y] = [];
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      dungeon[y][x] = '#';
    }
  }

  // Carve out rooms
  const rooms: { x: number; y: number; w: number; h: number }[] = [];

  // Create 4-6 rooms
  const numRooms = 4 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numRooms; i++) {
    const roomW = 6 + Math.floor(Math.random() * 8);
    const roomH = 4 + Math.floor(Math.random() * 5);
    const roomX = 1 + Math.floor(Math.random() * (DUNGEON_WIDTH - roomW - 2));
    const roomY = 1 + Math.floor(Math.random() * (DUNGEON_HEIGHT - roomH - 2));

    // Carve room
    for (let y = roomY; y < roomY + roomH; y++) {
      for (let x = roomX; x < roomX + roomW; x++) {
        dungeon[y][x] = '.';
      }
    }

    // Connect to previous room with corridor
    if (rooms.length > 0) {
      const prevRoom = rooms[rooms.length - 1];
      const prevCenterX = Math.floor(prevRoom.x + prevRoom.w / 2);
      const prevCenterY = Math.floor(prevRoom.y + prevRoom.h / 2);
      const currCenterX = Math.floor(roomX + roomW / 2);
      const currCenterY = Math.floor(roomY + roomH / 2);

      // Horizontal then vertical corridor
      const startX = Math.min(prevCenterX, currCenterX);
      const endX = Math.max(prevCenterX, currCenterX);
      for (let x = startX; x <= endX; x++) {
        dungeon[prevCenterY][x] = '.';
      }

      const startY = Math.min(prevCenterY, currCenterY);
      const endY = Math.max(prevCenterY, currCenterY);
      for (let y = startY; y <= endY; y++) {
        dungeon[y][currCenterX] = '.';
      }
    }

    rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH });
  }

  return dungeon;
}

function findEmptySpot(dungeon: string[][], occupied: Position[]): Position {
  let attempts = 0;
  while (attempts < 1000) {
    const x = Math.floor(Math.random() * DUNGEON_WIDTH);
    const y = Math.floor(Math.random() * DUNGEON_HEIGHT);

    if (dungeon[y][x] === '.' && !occupied.some(p => p.x === x && p.y === y)) {
      return { x, y };
    }
    attempts++;
  }
  return { x: 5, y: 5 }; // Fallback
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

function initGame(): GameState {
  const dungeon = generateDungeon();
  const occupied: Position[] = [];

  // Place hero in first room
  const heroPos = findEmptySpot(dungeon, occupied);
  occupied.push(heroPos);

  const hero = {
    pos: heroPos,
    char: '@',
    color: COLORS.TEXT_BRIGHT,
    name: 'Hero',
    health: 100,
    maxHealth: 100,
    gold: 0,
    attack: 10,
    defense: 5
  };

  // Place monsters
  const monsters: Monster[] = [];
  const monsterCount = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < monsterCount; i++) {
    const pos = findEmptySpot(dungeon, occupied);
    occupied.push(pos);

    // Mix of goblins and orcs
    const def = i < monsterCount - 1 ? MONSTER_DEFINITIONS.GOBLIN : MONSTER_DEFINITIONS.ORC;

    monsters.push({
      pos,
      char: def.asciiChar,
      color: i < monsterCount - 1 ? COLORS.TEXT_NORMAL : COLORS.TEXT_BRIGHT,
      name: def.name,
      health: def.baseHealth,
      maxHealth: def.baseHealth,
      attack: def.baseAttack,
      defense: def.baseDefense
    });
  }

  // Place gold/teeth items
  const items: (Entity & { type: 'gold' | 'teeth'; value: number })[] = [];
  const itemCount = 4 + Math.floor(Math.random() * 4);

  for (let i = 0; i < itemCount; i++) {
    const pos = findEmptySpot(dungeon, occupied);
    occupied.push(pos);

    const isTeeth = Math.random() < 0.3;
    items.push({
      pos,
      char: isTeeth ? '%' : '$',
      color: isTeeth ? COLORS.TEXT_BRIGHT : COLORS.GOLD_COLOR,
      name: isTeeth ? 'Teeth' : 'Gold',
      type: isTeeth ? 'teeth' : 'gold',
      value: isTeeth ? (1 + Math.floor(Math.random() * 10)) : (5 + Math.floor(Math.random() * 20))
    });
  }

  return {
    hero,
    monsters,
    items,
    dungeon,
    messages: ['Welcome to the dungeon! Use WASD or Arrow keys to move.', 'Bump into monsters to attack them!'],
    gameOver: false,
    victory: false
  };
}

// =============================================================================
// GAME LOGIC
// =============================================================================

function tryMove(state: GameState, dx: number, dy: number): void {
  if (state.gameOver) return;

  const newX = state.hero.pos.x + dx;
  const newY = state.hero.pos.y + dy;

  // Bounds check
  if (newX < 0 || newX >= DUNGEON_WIDTH || newY < 0 || newY >= DUNGEON_HEIGHT) {
    return;
  }

  // Wall collision
  if (state.dungeon[newY][newX] === '#') {
    return;
  }

  // Monster collision = combat!
  const monster = state.monsters.find(m => m.pos.x === newX && m.pos.y === newY);
  if (monster) {
    combat(state, monster);
    return;
  }

  // Move hero
  state.hero.pos.x = newX;
  state.hero.pos.y = newY;

  // Check for items
  const itemIndex = state.items.findIndex(i => i.pos.x === newX && i.pos.y === newY);
  if (itemIndex !== -1) {
    const item = state.items[itemIndex];
    state.hero.gold += item.value;
    state.messages.unshift(`Picked up ${item.value} ${item.name}!`);
    state.items.splice(itemIndex, 1);
  }

  // Monsters move toward hero
  moveMonsters(state);
}

function combat(state: GameState, monster: Monster): void {
  // Hero attacks monster
  const heroDamage = Math.max(1, state.hero.attack - monster.defense + Math.floor(Math.random() * 5));
  monster.health -= heroDamage;
  state.messages.unshift(`You hit ${monster.name} for ${heroDamage} damage!`);

  if (monster.health <= 0) {
    // Monster dies
    state.messages.unshift(`${monster.name} is slain!`);
    const index = state.monsters.indexOf(monster);
    state.monsters.splice(index, 1);

    // Drop teeth on death
    const teethDrop = 1 + Math.floor(Math.random() * 5);
    state.hero.gold += teethDrop;
    state.messages.unshift(`${monster.name} dropped ${teethDrop} teeth!`);

    // Check victory
    if (state.monsters.length === 0) {
      state.victory = true;
      state.gameOver = true;
      state.messages.unshift('*** VICTORY! All monsters slain! Press R to restart. ***');
    }
    return;
  }

  // Monster retaliates
  const monsterDamage = Math.max(1, monster.attack - state.hero.defense + Math.floor(Math.random() * 3));
  state.hero.health -= monsterDamage;
  state.messages.unshift(`${monster.name} hits you for ${monsterDamage} damage!`);

  if (state.hero.health <= 0) {
    state.hero.health = 0;
    state.gameOver = true;
    state.messages.unshift('*** YOU DIED! Press R to restart. ***');
  }
}

function moveMonsters(state: GameState): void {
  for (const monster of state.monsters) {
    // Simple AI: move toward hero if within range
    const dx = state.hero.pos.x - monster.pos.x;
    const dy = state.hero.pos.y - monster.pos.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist > 10) continue; // Too far, monster doesn't notice

    // 50% chance to move
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

    // Check if can move
    if (state.dungeon[newY]?.[newX] === '.' &&
        !state.monsters.some(m => m !== monster && m.pos.x === newX && m.pos.y === newY) &&
        !(state.hero.pos.x === newX && state.hero.pos.y === newY)) {
      monster.pos.x = newX;
      monster.pos.y = newY;
    }
  }
}

// =============================================================================
// RENDERING
// =============================================================================

function render(renderer: CanvasRenderer, state: GameState): void {
  renderer.clear();

  // Draw dungeon
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      const tile = state.dungeon[y][x];
      const color = tile === '#' ? COLORS.TEXT_DIM : COLORS.TEXT_DIM;
      renderer.drawChar(tile, x + 1, y + 1, color);
    }
  }

  // Draw items
  for (const item of state.items) {
    renderer.drawChar(item.char, item.pos.x + 1, item.pos.y + 1, item.color);
  }

  // Draw monsters
  for (const monster of state.monsters) {
    renderer.drawChar(monster.char, monster.pos.x + 1, monster.pos.y + 1, monster.color);
  }

  // Draw hero
  renderer.drawChar(state.hero.char, state.hero.pos.x + 1, state.hero.pos.y + 1, state.hero.color);

  // Draw border
  renderer.drawBox(0, 0, 80, 22);

  // Draw status bar
  const healthColor = state.hero.health < 30 ? COLORS.HEALTH_CRITICAL : COLORS.TEXT_NORMAL;
  const healthBar = `HP: ${state.hero.health}/${state.hero.maxHealth}`;
  const goldBar = `Gold: ${state.hero.gold}`;
  const monstersLeft = `Monsters: ${state.monsters.length}`;

  renderer.drawText(healthBar, 2, 22, healthColor);
  renderer.drawText(goldBar, 20, 22, COLORS.GOLD_COLOR);
  renderer.drawText(monstersLeft, 35, 22, COLORS.TEXT_NORMAL);
  renderer.drawText('[WASD/Arrows: Move] [R: Restart]', 50, 22, COLORS.TEXT_DIM);

  // Draw message log (last 2 messages)
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
  let gameInputHandler: ((e: KeyboardEvent) => void) | null = null;

  function showTitleScreen(): void {
    // Remove dungeon input handler if active
    if (gameInputHandler) {
      document.removeEventListener('keydown', gameInputHandler);
      gameInputHandler = null;
    }
    titleScreen.show(startGame);
  }

  function startGame(): void {
    const state = initGame();
    render(renderer, state);

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
          return;
      }

      e.preventDefault();

      if (dx !== 0 || dy !== 0) {
        tryMove(state, dx, dy);
      }

      render(renderer, state);
    };

    document.addEventListener('keydown', gameInputHandler);
  }

  // Start with title screen
  showTitleScreen();
}

// Start the game
init();
