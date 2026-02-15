import { CanvasRenderer } from './rendering/CanvasRenderer';
import { TitleScreen } from './ui/TitleScreen';
import { CharacterNamingScreen } from './ui/CharacterNamingScreen';
import { GameHUD } from './ui/GameHUD';
import { InventoryPanel, groupReagents, getReagents } from './ui/InventoryPanel';
import { MonsterInspectPanel } from './ui/MonsterInspectPanel';
import { BlessingPanel } from './ui/BlessingPanel';
import { EquipmentPanel } from './ui/EquipmentPanel';
import { MerchantPanel } from './ui/MerchantPanel';
import { DeathScreen } from './ui/DeathScreen';
import { GAME_CONSTANTS, LAYOUT, MONSTER_DEFINITIONS, Hero, EquipmentItem } from '@larn-like/shared';
import { createHero } from './game/Hero';
import { findEmptySpot, Position, DungeonGrid } from './game/DungeonGenerator';
import { processCombat, processFlee, getAdjacentMonster, Monster } from './game/Combat';
import { consumeReagent, purchaseItem } from './game/Inventory';
import { createEmptySlots, equipItem, unequipItem, validateEquipmentChange } from './game/Equipment';
import { attemptBlessing, type ShrineData } from './game/Blessing';
import { WorldState, DungeonLevelRecord } from './world/WorldState';
import { getOrGenerateLevel } from './game/LevelManager';
import { getTownSpawnPosition } from './game/TownGenerator';
import { processHeroDeath, DeathProcessingResult } from './world/DeathProcessor';
import type { TeethDrop } from './world/TeethDrop';

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

interface Chest {
  pos: Position;
  char: string;
  color: string;
  name: string;
  items: EquipmentItem[];
  teeth: number;
  id: string;
}

interface Shrine {
  pos: Position;
  char: string;
  color: string;
  name: string;
  heroName: string;
  soulEnergy: number;
  id: string;
}

interface GameState {
  hero: Hero;
  heroPos: Position;
  monsters: Monster[];
  items: (Entity & { type: 'teeth'; value: number; teethDropId?: string })[];
  chests: Chest[];
  shrines: Shrine[];
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
  deathResult?: DeathProcessingResult;
}

// Constants - viewport dimensions (visible area)
const VIEWPORT_COLS = 78;
const VIEWPORT_ROWS = 20;
const COLORS = GAME_CONSTANTS.COLORS;

// =============================================================================
// EVOLVED MONSTER COLORS
// =============================================================================

/**
 * Returns the color for an evolved monster based on evolution level.
 * Evolution 0: base color (baseline monster)
 * Evolution 1: bright yellow (Veteran)
 * Evolution 2: bright orange (Elite)
 * Evolution 3+: bright red (Legendary)
 */
function getEvolvedColor(baseColor: string, evolutionLevel: number): string {
  if (evolutionLevel <= 0) return baseColor;
  if (evolutionLevel === 1) return '#FFFF00'; // yellow - Veteran
  if (evolutionLevel === 2) return '#FF8800'; // orange - Elite
  return '#FF0000'; // red - Legendary (3+)
}

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
      type: m.type || 'unknown',
      isEvolved: m.isEvolved,
      evolutionLevel: m.evolutionLevel,
      killHistory: m.killHistory,
      equipment: m.equipment,
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
    chests: state.chests.map(chest => ({
      id: chest.id,
      pos: { x: chest.pos.x, y: chest.pos.y },
      items: chest.items || [], // Equipment items persisted from death events
      teeth: chest.teeth,
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
    isEvolved: m.isEvolved || false,
    evolutionLevel: m.evolutionLevel || 0,
    killHistory: m.killHistory || [],
    _persistId: m.id,
  } as Monster & { _persistId: string }));

  // Only populate monsters if this is a newly generated dungeon level (not loaded from save)
  if (depth >= 1 && monsters.length === 0 && level.isNewlyGenerated) {
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
        isEvolved: false,
        evolutionLevel: 0,
        killHistory: [],
        equipment: createEmptySlots(),
        _persistId: generateMonsterId(),
      } as Monster & { _persistId: string };

      monsters.push(newMonster);
    }
  }

  // Load persisted teeth drops for this level
  const teethDropRecords = await worldState.getStore().loadTeethDropsByLevel(depth);
  const uncollectedTeeth = (teethDropRecords as unknown as TeethDrop[]).filter(td => !td.isCollected);

  // Group teeth by position and merge multiple drops at same tile
  const teethByPosition = new Map<string, { drops: TeethDrop[]; totalValue: number }>();
  for (const drop of uncollectedTeeth) {
    const key = `${drop.position.x},${drop.position.y}`;
    const existing = teethByPosition.get(key);
    if (existing) {
      existing.drops.push(drop);
      existing.totalValue += drop.value;
    } else {
      teethByPosition.set(key, { drops: [drop], totalValue: drop.value });
    }
  }

  // Convert merged teeth to item entities
  const teethItems = Array.from(teethByPosition.values()).map(({ drops, totalValue }) => {
    const firstDrop = drops[0];
    return {
      pos: { x: firstDrop.position.x, y: firstDrop.position.y },
      char: '%',
      color: COLORS.TEXT_BRIGHT,
      name: 'teeth',
      type: 'teeth' as const,
      value: totalValue,
      teethDropId: drops.map(d => d.id).join(','), // Store all drop IDs for collection
    };
  });

  // Merge persisted teeth with level items
  const items = [...level.items, ...teethItems];

  // Load chests from level
  const chests: Chest[] = (level.chests || []).map(chestRecord => ({
    pos: { x: chestRecord.pos.x, y: chestRecord.pos.y },
    char: '=',
    color: COLORS.TEXT_BRIGHT,
    name: 'chest',
    items: chestRecord.items || [], // Equipment items persisted from death events
    teeth: chestRecord.teeth || 0,
    id: chestRecord.id,
  }));

  // Load soul shrines for this level
  const shrineRecords = await worldState.getStore().loadShrinesByLevel(depth);
  const shrines: Shrine[] = shrineRecords.map((shrineRecord: Record<string, unknown>) => ({
    pos: { x: (shrineRecord.position as { x: number; y: number }).x, y: (shrineRecord.position as { x: number; y: number }).y },
    char: '†',
    color: '#CC66FF', // Purple/magenta
    name: 'shrine',
    heroName: shrineRecord.heroName as string,
    soulEnergy: shrineRecord.soulEnergy as number,
    id: shrineRecord.id as string,
  }));

  // Determine hero spawn position
  let heroPos: Position;

  if (arrivalStairType === 'down' && level.stairUpPos) {
    // Descended (took stairs down), came from above → spawn at up staircase
    heroPos = level.stairUpPos;
  } else if (arrivalStairType === 'up' && level.stairDownPos) {
    // Ascended (took stairs up), came from below → spawn at down staircase
    heroPos = level.stairDownPos;
  } else if (depth === 0) {
    // Spawning in town for the first time
    heroPos = getTownSpawnPosition({ width: level.width, height: level.height });
  } else {
    // Default: find an empty spot
    const occupiedForHero = [
      ...monsters.map(m => m.pos),
      ...items.map(i => i.pos),
      ...chests.map(c => c.pos),
      ...shrines.map(s => s.pos),
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

  // Build messages array with level entry indicators
  const messages: string[] = [welcomeMessage, 'Bump into monsters to attack them!'];

  // Add persistent world indicators (only in dungeon levels, not town)
  if (depth > 0) {
    const hasEvolvedMonsters = monsters.some(m => m.isEvolved);
    const hasTeeth = uncollectedTeeth.length > 0;
    const isFreshWorld = worldState.isFreshWorld();

    if (isFreshWorld) {
      messages.push('The dungeon is untouched. You are the first to enter.');
    } else {
      if (hasEvolvedMonsters) {
        messages.push('You sense powerful creatures on this level...');
      }
      if (hasTeeth) {
        messages.push('Scattered remains of past heroes litter the floor.');
      }
    }
  }

  return {
    hero,
    heroPos,
    monsters,
    items,
    chests,
    shrines,
    dungeon: level.grid,
    dungeonWidth: level.width,
    dungeonHeight: level.height,
    cameraX,
    cameraY,
    messages,
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

async function persistLevel(state: GameState, worldState: WorldState): Promise<void> {
  const levelRecord = gameStateToLevelRecord(state);
  await worldState.saveLevel(levelRecord);
}

async function transitionToLevel(
  state: GameState,
  newDepth: number,
  arrivalStairType: 'up' | 'down',
  worldState: WorldState
): Promise<GameState> {
  // Save current level state before transitioning
  await persistLevel(state, worldState);

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
        const newDepth = state.currentDepth - 1;
        state.messages.unshift(newDepth === 0 ? 'Returning to town...' : 'Ascending...');
        const newState = await transitionToLevel(state, newDepth, 'up', worldState);
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

  // Merchant tile is walkable (like floor)
  // Hero can walk on 'M' tile freely

  // Monster collision = combat!
  const monster = state.monsters.find(m => m.pos.x === newX && m.pos.y === newY);
  if (monster) {
    const result = processCombat(state.hero, monster, state.monsters);
    state.messages.unshift(...result.messages);

    if (result.monsterKilled) {
      // Persist level with updated monster list
      await persistLevel(state, worldState);
    }
    if (result.heroKilled && result.killerMonster) {
      state.gameOver = true;
      // Process death event and monster promotion
      const deathResult = await processHeroDeath(
        state.hero,
        result.killerMonster,
        worldState,
        state.currentDepth
      );
      state.deathResult = deathResult;
      // Remove killer monster from current level
      const killerIndex = state.monsters.indexOf(result.killerMonster);
      if (killerIndex !== -1) {
        state.monsters.splice(killerIndex, 1);
      }
      // Reload chests from WorldState — processHeroDeath added chests directly
      // to the persisted level; state.chests must reflect that before persistLevel
      const deathLevel = worldState.getLevel(state.currentDepth);
      if (deathLevel?.chests) {
        state.chests = deathLevel.chests.map(c => ({
          pos: { x: c.pos.x, y: c.pos.y },
          char: '=',
          color: COLORS.TEXT_BRIGHT,
          name: 'chest',
          items: [],
          teeth: c.teeth || 0,
          id: c.id,
        }));
      }
      // Save world state on hero death
      worldState.setCurrentHero(state.hero);
      await persistLevel(state, worldState);
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
        if (!state.hero.isAlive && fleeResult.killerMonster) {
          state.gameOver = true;
          // Process death event and monster promotion
          const deathResult = await processHeroDeath(
            state.hero,
            fleeResult.killerMonster,
            worldState,
            state.currentDepth
          );
          state.deathResult = deathResult;
          // Remove killer monster from current level
          const killerIndex = state.monsters.indexOf(fleeResult.killerMonster);
          if (killerIndex !== -1) {
            state.monsters.splice(killerIndex, 1);
          }
          // Reload chests from WorldState — processHeroDeath added chests directly
          // to the persisted level; state.chests must reflect that before persistLevel
          const fleeDeathLevel = worldState.getLevel(state.currentDepth);
          if (fleeDeathLevel?.chests) {
            state.chests = fleeDeathLevel.chests.map(c => ({
              pos: { x: c.pos.x, y: c.pos.y },
              char: '=',
              color: COLORS.TEXT_BRIGHT,
              name: 'chest',
              items: [],
              teeth: c.teeth || 0,
              id: c.id,
            }));
          }
          // Save world state on hero death
          worldState.setCurrentHero(state.hero);
          await persistLevel(state, worldState);
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

    // Mark persisted teeth as collected
    if (item.teethDropId) {
      const dropIds = item.teethDropId.split(',');
      try {
        // Mark all teeth drops as collected before removing from state
        for (const dropId of dropIds) {
          await worldState.getStore().markTeethCollected(dropId.trim(), state.hero.id);
        }
      } catch (err) {
        console.error('Failed to mark teeth as collected:', err);
      }

      // Enhanced message for death-event teeth
      if (dropIds.length === 1) {
        // Single drop - fetch the drop to get hero name
        const teethDropRecords = await worldState.getStore().loadTeethDropsByLevel(state.currentDepth);
        const drop = (teethDropRecords as unknown as TeethDrop[]).find(td => td.id === dropIds[0].trim());
        if (drop) {
          state.messages.unshift(`Found ${item.value} teeth at ${drop.heroName}'s death site!`);
        } else {
          state.messages.unshift(`Picked up ${item.value} ${item.name}!`);
        }
      } else {
        // Multiple drops stacked
        state.messages.unshift(`Found ${item.value} teeth from ${dropIds.length} death sites!`);
      }
    } else {
      // Non-persisted teeth (placeholder or other items)
      state.messages.unshift(`Picked up ${item.value} ${item.name}!`);
    }

    state.items.splice(itemIndex, 1);

    // Save hero and level state on teeth pickup - await both operations
    worldState.setCurrentHero(state.hero);
    await worldState.saveHero();
    await persistLevel(state, worldState);
  }

  // Check for chests
  const chestIndex = state.chests.findIndex(c => c.pos.x === newX && c.pos.y === newY);
  if (chestIndex !== -1) {
    const chest = state.chests[chestIndex];

    // Collect teeth from chest
    if (chest.teeth > 0) {
      state.hero.teethCurrency += chest.teeth;
      state.messages.unshift(`Found ${chest.teeth} teeth in a chest!`);
    }

    // Remove chest from game state
    state.chests.splice(chestIndex, 1);

    // Save hero and level state on chest pickup - await both operations
    worldState.setCurrentHero(state.hero);
    await worldState.saveHero();
    await persistLevel(state, worldState);
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

function getAdjacentShrine(
  heroX: number,
  heroY: number,
  shrines: Shrine[]
): Shrine | null {
  let nearest: Shrine | null = null;
  let nearestDist = Infinity;

  for (const shrine of shrines) {
    const dx = Math.abs(shrine.pos.x - heroX);
    const dy = Math.abs(shrine.pos.y - heroY);
    // Check if adjacent or on the shrine (shrines don't block movement)
    if (dx <= 1 && dy <= 1) {
      const dist = dx + dy;
      if (dist < nearestDist) {
        nearest = shrine;
        nearestDist = dist;
      }
    }
  }

  return nearest;
}

function render(renderer: CanvasRenderer, hud: GameHUD, state: GameState, deathScreen: DeathScreen, inventoryPanel?: InventoryPanel, monsterInspectPanel?: MonsterInspectPanel, equipmentPanel?: EquipmentPanel, merchantPanel?: MerchantPanel, blessingPanel?: BlessingPanel | null): void {
  // Show death screen if game over and death result exists
  if (state.gameOver && !state.victory && state.deathResult) {
    deathScreen.render(state.hero.name, state.deathResult);
    return;
  }

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

  // Draw chests (viewport-relative)
  for (const chest of state.chests) {
    if (isInViewport(chest.pos.x, chest.pos.y, state)) {
      renderer.drawChar(chest.char, chest.pos.x - state.cameraX + 1, chest.pos.y - state.cameraY + mapOffsetY, chest.color);
    }
  }

  // Draw soul shrines (viewport-relative)
  for (const shrine of state.shrines) {
    if (isInViewport(shrine.pos.x, shrine.pos.y, state)) {
      renderer.drawChar(shrine.char, shrine.pos.x - state.cameraX + 1, shrine.pos.y - state.cameraY + mapOffsetY, shrine.color);
    }
  }

  // Draw monsters (viewport-relative)
  for (const monster of state.monsters) {
    if (isInViewport(monster.pos.x, monster.pos.y, state)) {
      const monsterColor = monster.isEvolved && monster.evolutionLevel
        ? getEvolvedColor(monster.color, monster.evolutionLevel)
        : monster.color;
      renderer.drawChar(monster.char, monster.pos.x - state.cameraX + 1, monster.pos.y - state.cameraY + mapOffsetY, monsterColor);
    }
  }

  // Draw hero (@) (viewport-relative)
  renderer.drawChar('@', state.heroPos.x - state.cameraX + 1, state.heroPos.y - state.cameraY + mapOffsetY, COLORS.TEXT_BRIGHT);

  // Draw map border (rows 3-23: 21 rows high = top border + 20 map rows + bottom border, with side borders)
  renderer.drawBox(0, LAYOUT.ROW_MAP_START, 80, LAYOUT.ROW_MAP_END - LAYOUT.ROW_MAP_START + 1);

  // Draw status bar at row 1
  hud.renderStatusBar(state.hero, state.monsters.length, state.currentDepth, LAYOUT.ROW_STATUS_BAR);

  // Draw adjacent monster info at row 2 (monster takes priority over shrine)
  const adjacent = getAdjacentMonster(state.heroPos.x, state.heroPos.y, state.monsters);
  hud.renderAdjacentMonster(adjacent, LAYOUT.ROW_MONSTER_INFO);

  // If no adjacent monster, show adjacent shrine info or merchant info
  if (!adjacent) {
    // Check if hero is standing on merchant tile
    const currentTile = state.dungeon[state.heroPos.y]?.[state.heroPos.x];
    if (currentTile === 'M') {
      const merchantText = 'MERCHANT - Press [m] to browse equipment';
      renderer.drawText(merchantText, 1, LAYOUT.ROW_MONSTER_INFO, COLORS.TEXT_BRIGHT);
    } else {
      const adjacentShrine = getAdjacentShrine(state.heroPos.x, state.heroPos.y, state.shrines);
      if (adjacentShrine) {
        const shrineText = `† ${adjacentShrine.heroName}'s Shrine (Energy: ${adjacentShrine.soulEnergy}) - Press [b] to bless`;
        renderer.drawText(shrineText.substring(0, 32), 1, LAYOUT.ROW_MONSTER_INFO, '#CC66FF');
      } else {
        // Draw equipment info on right side of row 2 (only when no shrine/merchant)
        const weapon = state.hero.equipment.weapon;
        const armor = state.hero.equipment.bodyArmor;
        const equipText = `Wpn: ${weapon?.name || 'none'}  Arm: ${armor?.name || 'none'}`;
        renderer.drawText(equipText, 35, LAYOUT.ROW_MONSTER_INFO, COLORS.TEXT_DIM);
      }
    }
  } else {
    // Draw equipment info when monster is adjacent
    const weapon = state.hero.equipment.weapon;
    const armor = state.hero.equipment.bodyArmor;
    const equipText = `Wpn: ${weapon?.name || 'none'}  Arm: ${armor?.name || 'none'}`;
    renderer.drawText(equipText, 35, LAYOUT.ROW_MONSTER_INFO, COLORS.TEXT_DIM);
  }

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

  // Draw monster inspection overlay if open
  if (monsterInspectPanel) {
    monsterInspectPanel.render();
  }

  // Draw equipment panel overlay if open
  if (equipmentPanel) {
    equipmentPanel.render(state.hero);
  }

  // Draw merchant panel overlay if open
  if (merchantPanel) {
    merchantPanel.render(state.hero);
  }

  // Draw blessing panel overlay if open
  if (blessingPanel) {
    blessingPanel.render();
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
  titleScreen.setWorldState(worldState); // Enable world summary display
  const hud = new GameHUD(renderer);
  const inventoryPanel = new InventoryPanel(renderer);
  const monsterInspectPanel = new MonsterInspectPanel(renderer);
  const equipmentPanel = new EquipmentPanel(renderer);
  const merchantPanel = new MerchantPanel(renderer);
  let blessingPanel: BlessingPanel | null = null;
  const deathScreen = new DeathScreen(renderer);
  let gameInputHandler: ((e: KeyboardEvent) => void) | null = null;
  let autoSaveTimer: number | null = null;

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
    if (autoSaveTimer !== null) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
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

    // Start periodic auto-save timer (every 60 seconds)
    if (autoSaveTimer !== null) {
      clearInterval(autoSaveTimer);
    }
    autoSaveTimer = window.setInterval(() => {
      const currentLevelRecord = gameStateToLevelRecord(state);
      worldState.saveLevel(currentLevelRecord).catch(console.error);
      worldState.saveHero().catch(console.error);
    }, 60000); // 60 seconds

    render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);

    gameInputHandler = (e: KeyboardEvent) => {
      // If game is over, only allow 'r' to restart
      if (state.gameOver && e.key.toLowerCase() !== 'r') {
        return;
      }

      // Monster inspection toggle key (x)
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if (monsterInspectPanel.isOpen) {
          monsterInspectPanel.close();
        } else {
          const adjacent = getAdjacentMonster(state.heroPos.x, state.heroPos.y, state.monsters);
          if (adjacent) {
            monsterInspectPanel.open(adjacent);
          } else {
            state.messages.unshift('No monster nearby to examine.');
          }
        }
        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // While monster inspect panel is open, handle navigation and close
      if (monsterInspectPanel.isOpen) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          monsterInspectPanel.scrollHistoryUp();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          monsterInspectPanel.scrollHistoryDown();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          monsterInspectPanel.close();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }
        // Any other key closes the panel
        e.preventDefault();
        monsterInspectPanel.close();
        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // Blessing panel: press 'b' to bless equipment at adjacent shrine
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();

        // Check if already open
        if (blessingPanel !== null) {
          return; // Panel already open, ignore
        }

        // Find adjacent shrine
        const adjacentShrine = getAdjacentShrine(state.hero.position.x, state.hero.position.y, state.shrines);

        if (!adjacentShrine) {
          state.messages.unshift('No shrine nearby.');
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }

        // Open blessing panel
        const shrineData: ShrineData = {
          id: adjacentShrine.id,
          heroName: adjacentShrine.heroName,
          soulEnergy: adjacentShrine.soulEnergy,
        };
        blessingPanel = new BlessingPanel(renderer, shrineData, state.hero.equipment);
        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // While blessing panel is open, handle item selection
      if (blessingPanel !== null) {
        e.preventDefault();

        const selectedItem = blessingPanel.handleInput(e.key);

        // undefined means invalid input, keep panel open
        if (selectedItem === (undefined as unknown as null)) {
          return;
        }

        // null means close without blessing
        if (selectedItem === null) {
          blessingPanel = null;
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }

        // selectedItem is an EquipmentItem - attempt blessing
        const shrineData = blessingPanel.getShrine();
        const result = attemptBlessing(shrineData, selectedItem);

        // Apply blessing result to hero equipment
        for (const [slotName, item] of Object.entries(state.hero.equipment)) {
          if (item && item.id === selectedItem.id) {
            // Update the equipment slot with the blessed/degraded/destroyed item
            (state.hero.equipment as unknown as Record<string, typeof result.item>)[slotName] = result.item;
            break;
          }
        }

        // Save updated hero equipment
        worldState.setCurrentHero(state.hero);
        worldState.saveHero().catch(console.error);

        // Consume the shrine
        worldState.getStore().consumeShrine(shrineData.id).catch(console.error);

        // Remove shrine from game state
        state.shrines = state.shrines.filter((s) => s.id !== shrineData.id);

        // Show result message
        state.messages.unshift(result.message);
        state.messages.unshift(`† ${shrineData.heroName}'s shrine fades away...`);

        // Close blessing panel
        blessingPanel = null;

        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // Inventory toggle keys
      if (e.key === 'i' || e.key === 'I' || e.key === 'Tab') {
        e.preventDefault();
        inventoryPanel.toggle();
        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // Equipment panel toggle key
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        equipmentPanel.toggle();
        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // While inventory is open, handle consumption and close
      if (inventoryPanel.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          inventoryPanel.close();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
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
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }
        return;
      }

      // While equipment panel is open, handle close and slot management
      if (equipmentPanel.isOpen) {
        e.preventDefault();

        // Handle input through panel
        const action = equipmentPanel.handleInput(e.key, state.hero);

        // Handle Escape - panel handles backing out of slot selection, main.ts handles closing
        if (e.key === 'Escape' && action.type === 'none') {
          equipmentPanel.close();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }

        if (action.type === 'equip') {
          // Validate first
          const validation = validateEquipmentChange(state.hero.equipment, action.item, action.slotKey);
          if (!validation.valid) {
            state.messages.unshift(validation.error || 'Cannot equip item');
          } else {
            const result = equipItem(state.hero.inventory, state.hero.equipment, action.item, action.slotKey);
            if (result.success) {
              state.messages.unshift(`Equipped ${action.item.name}`);
              // Save hero state
              worldState.setCurrentHero(state.hero);
              worldState.saveHero().catch(console.error);
            } else {
              state.messages.unshift(result.error || 'Failed to equip item');
            }
          }
        } else if (action.type === 'unequip') {
          const result = unequipItem(state.hero.inventory, state.hero.equipment, action.slotKey);
          if (result.success && result.removedItem) {
            state.messages.unshift(`Unequipped ${result.removedItem.name}`);
            // Save hero state
            worldState.setCurrentHero(state.hero);
            worldState.saveHero().catch(console.error);
          } else {
            state.messages.unshift(result.error || 'Failed to unequip item');
          }
        } else if (action.type === 'error') {
          state.messages.unshift(action.message);
        }

        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // While merchant panel is open, handle purchase and close
      if (merchantPanel.isOpen) {
        e.preventDefault();

        // Handle arrow keys for pagination
        if (e.key === 'ArrowUp') {
          merchantPanel.scrollPageUp();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }
        if (e.key === 'ArrowDown') {
          merchantPanel.scrollPageDown();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }

        // Handle input through panel
        const action = merchantPanel.handleInput(e.key, state.hero);

        if (action.type === 'close') {
          merchantPanel.close();
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
          return;
        }

        if (action.type === 'purchase') {
          // Attempt purchase
          const result = purchaseItem(state.hero, action.item, action.item.price);
          state.messages.unshift(result.message);

          if (result.success) {
            // Save hero state after purchase
            worldState.setCurrentHero(state.hero);
            worldState.saveHero().catch(console.error);
          }
        }

        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // Merchant key - press 'm' while on merchant tile
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const currentTile = state.dungeon[state.heroPos.y]?.[state.heroPos.x];
        if (currentTile === 'M') {
          merchantPanel.open();
        } else {
          state.messages.unshift('You must be at the merchant to browse equipment.');
        }
        render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        return;
      }

      // Movement keys
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
            // After death, go directly to character creation (bypassing title screen)
            // First remove game input handler to prevent double input
            if (gameInputHandler) {
              document.removeEventListener('keydown', gameInputHandler);
              gameInputHandler = null;
            }
            if (autoSaveTimer !== null) {
              clearInterval(autoSaveTimer);
              autoSaveTimer = null;
            }
            showNamingScreen();
            return;
          }
          break;
        default:
          // Numpad movement (use e.code to distinguish from regular number keys)
          switch (e.code) {
            case 'Numpad8': dy = -1; break;              // up
            case 'Numpad2': dy = 1; break;               // down
            case 'Numpad4': dx = -1; break;              // left
            case 'Numpad6': dx = 1; break;               // right
            case 'Numpad7': dx = -1; dy = -1; break;     // up-left
            case 'Numpad9': dx = 1; dy = -1; break;      // up-right
            case 'Numpad1': dx = -1; dy = 1; break;      // down-left
            case 'Numpad3': dx = 1; dy = 1; break;       // down-right
            default: return;
          }
          break;
      }

      e.preventDefault();

      if (dx !== 0 || dy !== 0) {
        // Handle async tryMove with level transition callback
        tryMove(state, dx, dy, worldState, (newState) => {
          state = newState;
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        }).then(() => {
          render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
        });
        return;
      }

      render(renderer, hud, state, deathScreen, inventoryPanel, monsterInspectPanel, equipmentPanel, merchantPanel, blessingPanel);
    };

    document.addEventListener('keydown', gameInputHandler);
  }

  // Start with title screen
  showTitleScreen();
}

// Start the game
init().catch(console.error);
