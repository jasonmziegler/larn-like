// API request and response type definitions
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CreateHeroRequest {
  name: string;
  class: HeroClass;
}

export enum HeroClass {
  WARRIOR = 'WARRIOR',
  MAGE = 'MAGE',
  ROGUE = 'ROGUE'
}

export interface HeroDeathEvent {
  heroId: string;
  heroName: string;
  position: DeathEventPosition;
  timestamp: number;
  inventory: string[];
  equipment: string[];
}

export interface DeathEventPosition {
  x: number;
  y: number;
  depth: number;
}
