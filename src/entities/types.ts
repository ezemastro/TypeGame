import type { PlayerState } from './Player';
import type { EnemyState } from './Enemy';
import { GameConfig } from '../config';

export interface PowerUpChoice {
  id: string;
  name: string;
  description: string;
}

export interface GameState {
  player: PlayerState;
  enemies: EnemyState[];
  score: number;
  heatSegments: number;
  overheated: boolean;
  overheatTimer: number;
  cooldownTimer: number;
  difficultyLevel: number;
  elapsedTime: number;
  gameOver: boolean;
  pendingKeys: string[];
  lastKeyPressed: string | null;
  targetedEnemyId: number | null;
  spawnTimer: number;
  shootCooldown: number;
  nextEnemyId: number;
  gearDropped: boolean;
  justFired: boolean;
  xp: number;
  xpToNextLevel: number;
  level: number;
  activePowerUps: string[];
  isPaused: boolean;
  levelUpChoices: PowerUpChoice[];
  secondaryTargetId: number | null;
}

export function createInitialGameState(): GameState {
  return {
    player: { x: 0, y: 0, width: 0, height: 0, dx: 0, dy: 0, alive: true, color: '' },
    enemies: [],
    score: 0,
    heatSegments: 0,
    overheated: false,
    overheatTimer: 0,
    cooldownTimer: 0,
    difficultyLevel: 0,
    elapsedTime: 0,
    gameOver: false,
    pendingKeys: [],
    lastKeyPressed: null,
    targetedEnemyId: null,
    spawnTimer: 0,
    shootCooldown: 0,
    nextEnemyId: 1,
    gearDropped: false,
    justFired: false,
    xp: 0,
    xpToNextLevel: GameConfig.scoring.xpToLevelUp,
    level: 1,
    activePowerUps: [],
    isPaused: false,
    levelUpChoices: [],
    secondaryTargetId: null,
  };
}
