import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function scoreSystem(state: GameState): GameState {
  if (state.gearDropped) {
    state.score += GameConfig.scoring.pointsPerWord;
    state.gearDropped = false;
  }

  return state;
}
