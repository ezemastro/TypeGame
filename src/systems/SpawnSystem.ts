import type { GameState } from '../entities/types';
import { createEnemy } from '../entities/Enemy';
import { GameConfig } from '../config';

function getActiveWordPools(level: number): string[][] {
  const ramps = GameConfig.difficulty.wordComplexityRamp;
  let pools: string[][] = [];

  // Find the highest ramp level <= current difficulty level
  let highestRamp = ramps[0];
  for (const ramp of ramps) {
    if (level >= ramp.level) {
      highestRamp = ramp;
    }
  }

  for (const poolName of highestRamp.pools) {
    const pool = GameConfig.words[poolName as keyof typeof GameConfig.words];
    if (Array.isArray(pool)) {
      pools.push(pool);
    }
  }

  return pools;
}

function pickRandomWord(pools: string[][]): string {
  const allWords = pools.flat();
  return allWords[Math.floor(Math.random() * allWords.length)];
}

export function spawnSystem(state: GameState, delta: number): GameState {
  if (state.gameOver) return state;

  state.spawnTimer -= delta;

  if (state.spawnTimer <= 0) {
    const pools = getActiveWordPools(state.difficultyLevel);
    const word = pickRandomWord(pools);
    const enemy = createEnemy(word, state.nextEnemyId++);
    state.enemies.push(enemy);

    // Reset spawn timer
    const difficultyMultiplier = Math.max(
      0.1,
      1 - state.difficultyLevel * GameConfig.difficulty.spawnRateMultiplierPerTick,
    );
    state.spawnTimer = GameConfig.enemies.spawnInterval * difficultyMultiplier;
  }

  return state;
}
