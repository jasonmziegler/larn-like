// Monster definitions and constants
export const MONSTER_DEFINITIONS = {
  GOBLIN: {
    type: 'goblin',
    name: 'Goblin',
    baseHealth: 20,
    baseAttack: 5,
    baseDefense: 2,
    experienceValue: 10,
    asciiChar: 'g'
  },
  ORC: {
    type: 'orc',
    name: 'Orc',
    baseHealth: 40,
    baseAttack: 8,
    baseDefense: 4,
    experienceValue: 25,
    asciiChar: 'o'
  },
  TROLL: {
    type: 'troll',
    name: 'Troll',
    baseHealth: 80,
    baseAttack: 12,
    baseDefense: 6,
    experienceValue: 50,
    asciiChar: 'T'
  },
  DRAGON: {
    type: 'dragon',
    name: 'Dragon',
    baseHealth: 200,
    baseAttack: 25,
    baseDefense: 15,
    experienceValue: 500,
    asciiChar: 'D'
  }
} as const;
