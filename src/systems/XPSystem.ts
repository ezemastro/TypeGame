import type { GameState } from '../entities/types';
import { GameConfig } from '../config';
import { getRandomChoices } from '../data/powerups';

export function xpSystem(state: GameState): GameState {
  if (state.gearDropped) {
    state.xp += GameConfig.scoring.xpPerWord;

    while (state.xp >= state.xpToNextLevel) {
      state.xp -= state.xpToNextLevel;
      state.level += 1;
      state.xpToNextLevel = Math.floor(
        state.xpToNextLevel * GameConfig.scoring.xpScaleFactor,
      );
      state.isPaused = true;
      state.levelUpChoices = getRandomChoices(
        GameConfig.powerUps.choicesPerLevel,
      );
    }
  }

  return state;
}
