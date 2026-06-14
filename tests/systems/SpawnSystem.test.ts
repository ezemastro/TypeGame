import { describe, it, expect, beforeEach } from 'vitest';
import { spawnSystem } from '../../src/systems/SpawnSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { GameConfig } from '../../src/config';

function makeState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  return { ...base, ...overrides };
}

describe('SpawnSystem', () => {
  it('should decrement spawnTimer by delta each call', () => {
    const state = makeState({ spawnTimer: 1000 });
    spawnSystem(state, 300);
    expect(state.spawnTimer).toBe(700);
  });

  it('should spawn an enemy when spawnTimer reaches zero', () => {
    const state = makeState({ spawnTimer: 100 });
    spawnSystem(state, 200);
    expect(state.enemies).toHaveLength(1);
    expect(state.spawnTimer).toBeGreaterThan(0); // reset
  });

  it('should assign a word to the spawned enemy', () => {
    const state = makeState({ spawnTimer: 0, difficultyLevel: 0 });
    spawnSystem(state, 0);
    expect(state.enemies[0].word.length).toBeGreaterThan(0);
    expect(state.enemies[0].fullWord).toBe(state.enemies[0].word);
  });

  it('should not spawn when maxOnScreen is reached', () => {
    const state = makeState({ spawnTimer: 0 });
    // Fill enemies to max
    for (let i = 0; i < GameConfig.enemies.maxOnScreen; i++) {
      spawnSystem(state, 0);
    }
    const countAfterMax = state.enemies.length;
    spawnSystem(state, 0);
    expect(state.enemies.length).toBe(countAfterMax);
  });

  it('should not spawn when game is over', () => {
    const state = makeState({ spawnTimer: 0, gameOver: true });
    spawnSystem(state, 0);
    expect(state.enemies).toHaveLength(0);
  });

  it('should use easy word pool at difficulty level 0', () => {
    const state = makeState({ spawnTimer: 0, difficultyLevel: 0 });
    // Spawn several enemies and verify all words come from easy pool
    for (let i = 0; i < 20; i++) {
      state.spawnTimer = 0;
      spawnSystem(state, 0);
    }
    const easyWords = new Set(GameConfig.words.easy);
    for (const enemy of state.enemies) {
      expect(easyWords.has(enemy.fullWord)).toBe(true);
    }
  });

  it('should expand to medium pool at difficulty level 5', () => {
    const state = makeState({ spawnTimer: 0, difficultyLevel: 5 });
    // Spawn many enemies; at least some should be medium words
    let hasMedium = false;
    const mediumWords = new Set(GameConfig.words.medium);
    for (let i = 0; i < 50; i++) {
      state.spawnTimer = 0;
      spawnSystem(state, 0);
    }
    for (const enemy of state.enemies) {
      if (mediumWords.has(enemy.fullWord)) {
        hasMedium = true;
        break;
      }
    }
    expect(hasMedium).toBe(true);
  });

  it('should switch to medium+hard pools at difficulty level 10', () => {
    const state = makeState({ spawnTimer: 0, difficultyLevel: 10 });
    // At level 10, easy should no longer be in the pool
    const easyWords = new Set(GameConfig.words.easy);
    let foundEasy = false;
    for (let i = 0; i < 50; i++) {
      state.spawnTimer = 0;
      spawnSystem(state, 0);
    }
    for (const enemy of state.enemies) {
      if (easyWords.has(enemy.fullWord)) {
        foundEasy = true;
        break;
      }
    }
    expect(foundEasy).toBe(false);
  });

  it('should reset spawnTimer after spawning', () => {
    const state = makeState({ spawnTimer: 50 });
    spawnSystem(state, 100);
    expect(state.enemies).toHaveLength(1);
    // Timer should be reset to spawnInterval (scaled by difficulty)
    expect(state.spawnTimer).toBeGreaterThan(0);
  });
});
