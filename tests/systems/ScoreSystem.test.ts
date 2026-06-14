import { describe, it, expect } from 'vitest';
import { scoreSystem } from '../../src/systems/ScoreSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { GameConfig } from '../../src/config';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  return { ...base, ...overrides };
}

describe('ScoreSystem', () => {
  it('should add pointsPerWord when gear is dropped', () => {
    const state = makeState({ score: 100, gearDropped: true });

    scoreSystem(state);

    expect(state.score).toBe(100 + GameConfig.scoring.pointsPerWord); // +50
    expect(state.gearDropped).toBe(false);
  });

  it('should not change score when no gear dropped', () => {
    const state = makeState({ score: 100, gearDropped: false });

    scoreSystem(state);

    expect(state.score).toBe(100);
    expect(state.gearDropped).toBe(false);
  });

  it('should handle multiple gear drops in sequence', () => {
    const state = makeState({ score: 0, gearDropped: true });

    scoreSystem(state);
    expect(state.score).toBe(50);
    expect(state.gearDropped).toBe(false);

    // Next gear
    state.gearDropped = true;
    scoreSystem(state);
    expect(state.score).toBe(100);
    expect(state.gearDropped).toBe(false);
  });
});
