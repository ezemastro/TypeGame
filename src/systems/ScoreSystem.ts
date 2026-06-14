import type { GameState } from '../entities/types';
import { GameConfig } from '../config';

export function scoreSystem(state: GameState): GameState {
  if (state.gearDropped) {
    const pointsPerWord = state.activePowerUps.includes('SHARP_SIGHT')
      ? Math.floor(GameConfig.scoring.pointsPerWord * GameConfig.powerUps.sharpSight.scoreMultiplier)
      : GameConfig.scoring.pointsPerWord;
    state.score += pointsPerWord;
    state.gearDropped = false;
  }

  return state;
}
