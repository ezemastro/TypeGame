import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function difficultySystem(state: GameState, delta: number): GameState {
  if (state.gameOver) return state;

  state.elapsedTime += delta;
  const interval = GameConfig.difficulty.scaleInterval;

  while (state.elapsedTime >= interval) {
    state.elapsedTime -= interval;
    state.difficultyLevel += 1;
  }

  return state;
}
