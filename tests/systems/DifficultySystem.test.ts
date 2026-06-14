import { describe, it, expect } from 'vitest';
import { difficultySystem } from '../../src/systems/DifficultySystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { GameConfig } from '../../src/config';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  return { ...base, ...overrides };
}

describe('DifficultySystem', () => {
  it('should accumulate elapsed time', () => {
    const state = makeState({ elapsedTime: 0, difficultyLevel: 0 });

    difficultySystem(state, 3000);

    expect(state.elapsedTime).toBe(3000);
  });

  it('should increment difficulty level every scaleInterval', () => {
    const state = makeState({ elapsedTime: 0, difficultyLevel: 0 });
    const interval = GameConfig.difficulty.scaleInterval;

    // 10 seconds
    difficultySystem(state, interval);
    expect(state.difficultyLevel).toBe(1);
    expect(state.elapsedTime).toBe(0); // reset accumulator

    // Another 10 seconds
    difficultySystem(state, interval);
    expect(state.difficultyLevel).toBe(2);
  });

  it('should handle large delta that spans multiple intervals', () => {
    const state = makeState({ elapsedTime: 0, difficultyLevel: 0 });
    const interval = GameConfig.difficulty.scaleInterval;

    // 35 seconds = 3 full intervals + 5s remainder
    difficultySystem(state, interval * 3.5);

    expect(state.difficultyLevel).toBe(3);
    expect(state.elapsedTime).toBe(interval * 0.5); // 5s remainder
  });

  it('should not increment if interval not reached', () => {
    const state = makeState({ elapsedTime: 0, difficultyLevel: 5 });
    const interval = GameConfig.difficulty.scaleInterval;

    difficultySystem(state, interval - 1); // 9.999s

    expect(state.difficultyLevel).toBe(5);
    expect(state.elapsedTime).toBe(interval - 1);
  });

  it('should stop incrementing when game is over', () => {
    const state = makeState({
      elapsedTime: 5000,
      difficultyLevel: 0,
      gameOver: true,
    });

    difficultySystem(state, GameConfig.difficulty.scaleInterval);

    expect(state.difficultyLevel).toBe(0);
    expect(state.elapsedTime).toBe(5000); // unchanged
  });
});
