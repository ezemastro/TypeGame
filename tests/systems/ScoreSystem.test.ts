import { describe, it, expect } from 'vitest';
import { scoreSystem } from '../../src/systems/ScoreSystem';
import { xpSystem } from '../../src/systems/XPSystem';
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

  it('should compose with XPSystem: XPSystem reads gearDropped first, ScoreSystem consumes it', () => {
    const state = makeState({ score: 0, xp: 0, gearDropped: true });

    xpSystem(state); // adds XP, does NOT consume gearDropped
    expect(state.xp).toBe(GameConfig.scoring.xpPerWord);
    expect(state.gearDropped).toBe(true);

    scoreSystem(state); // adds score, consumes gearDropped
    expect(state.score).toBe(GameConfig.scoring.pointsPerWord);
    expect(state.gearDropped).toBe(false);
  });

  it('should apply 1.1x score multiplier per word with SHARP_SIGHT', () => {
    const state = makeState({
      score: 0,
      gearDropped: true,
      activePowerUps: ['SHARP_SIGHT'],
    });

    scoreSystem(state);

    const expected = Math.floor(GameConfig.scoring.pointsPerWord * GameConfig.powerUps.sharpSight.scoreMultiplier);
    expect(state.score).toBe(expected);
  });
});
