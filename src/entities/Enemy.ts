import { GameConfig } from '../config';

export interface EnemyState {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  word: string;
  fullWord: string;
  color: string;
  alive: boolean;
  pendingDestruction: boolean;
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createEnemy(word: string, id: number): EnemyState {
  const maxX = GameConfig.canvas.width - GameConfig.enemies.width;
  const variance = GameConfig.enemies.speedVariance;
  const speedMultiplier = randomInRange(1 - variance, 1 + variance);

  return {
    id,
    x: randomInRange(0, maxX),
    y: 0,
    width: GameConfig.enemies.width,
    height: GameConfig.enemies.height,
    speed: GameConfig.enemies.baseSpeed * speedMultiplier,
    word,
    fullWord: word,
    color: GameConfig.enemies.color,
    alive: true,
    pendingDestruction: false,
  };
}
