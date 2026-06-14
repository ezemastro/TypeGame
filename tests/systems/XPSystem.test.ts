import { describe, it, expect } from 'vitest';
import { xpSystem } from '../../src/systems/XPSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { GameConfig } from '../../src/config';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  return { ...base, ...overrides };
}

describe('XPSystem', () => {
  it('should not change xp when no gear is dropped', () => {
    const state = makeState({ xp: 50, gearDropped: false });

    xpSystem(state);

    expect(state.xp).toBe(50);
  });

  it('should add xpPerWord when gear is dropped', () => {
    const state = makeState({ xp: 0, gearDropped: true });

    xpSystem(state);

    expect(state.xp).toBe(GameConfig.scoring.xpPerWord); // +5
  });

  it('should NOT consume gearDropped (leaves it for ScoreSystem)', () => {
    const state = makeState({ xp: 0, gearDropped: true });

    xpSystem(state);

    expect(state.gearDropped).toBe(true); // still true for ScoreSystem
  });

  it('should level up when xp reaches threshold', () => {
    const state = makeState({
      xp: 98,
      xpToNextLevel: 100,
      level: 1,
      gearDropped: true,
    });

    xpSystem(state);

    expect(state.level).toBe(2);
    expect(state.isPaused).toBe(true);
    expect(state.xp).toBe(3); // 98 + 5 - 100 = 3 excess
    expect(state.xpToNextLevel).toBe(Math.floor(100 * GameConfig.scoring.xpScaleFactor)); // 150
  });

  it('should generate 3 random power-up choices on level up', () => {
    const state = makeState({
      xp: 95,
      xpToNextLevel: 100,
      level: 1,
      gearDropped: true,
    });

    xpSystem(state);

    expect(state.levelUpChoices).toHaveLength(GameConfig.powerUps.choicesPerLevel); // 3
    // Each choice should be valid
    for (const choice of state.levelUpChoices) {
      expect(choice.id).toBeTruthy();
      expect(choice.name).toBeTruthy();
      expect(choice.description).toBeTruthy();
    }
  });

  it('should handle exact XP threshold (no excess)', () => {
    const state = makeState({
      xp: 95,
      xpToNextLevel: 100,
      level: 1,
      gearDropped: true,
    });

    xpSystem(state);

    expect(state.level).toBe(2);
    expect(state.xp).toBe(0); // 95 + 5 = 100, minus 100 threshold = 0
  });

  it('should support multiple level-ups in a single kill (while loop)', () => {
    const state = makeState({
      xp: 95,
      xpToNextLevel: 10, // artificially low threshold for testing
      level: 1,
      gearDropped: true,
    });

    xpSystem(state);

    // 95 + 5 = 100. While 100 >= 10: 100-10=90, level 2, threshold 15.
    // While 90 >= 15: 90-15=75, level 3, threshold 22.
    // While 75 >= 22: 75-22=53, level 4, threshold 33.
    // While 53 >= 33: 53-33=20, level 5, threshold 49.
    // While 20 >= 49: false.
    expect(state.level).toBe(5);
    expect(state.xp).toBe(20);
    expect(state.isPaused).toBe(true); // at least one level-up happened
  });

  it('should not level up when xp is below threshold after adding', () => {
    const state = makeState({
      xp: 60,
      xpToNextLevel: 100,
      level: 1,
      gearDropped: true,
    });

    xpSystem(state);

    expect(state.level).toBe(1);
    expect(state.isPaused).toBe(false);
    expect(state.xp).toBe(65); // 60 + 5
  });
});
