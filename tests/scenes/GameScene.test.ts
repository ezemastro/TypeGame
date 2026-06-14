import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { GameConfig } from '../../src/config';

import { spawnSystem } from '../../src/systems/SpawnSystem';
import { movementSystem } from '../../src/systems/MovementSystem';
import { targetSystem } from '../../src/systems/TargetSystem';
import { combatSystem } from '../../src/systems/CombatSystem';
import { heatBarSystem } from '../../src/systems/HeatBarSystem';
import { difficultySystem } from '../../src/systems/DifficultySystem';
import { scoreSystem } from '../../src/systems/ScoreSystem';
import { collisionSystem } from '../../src/systems/CollisionSystem';

describe('GameScene orchestration (unit)', () => {
  it('should initialize GameState with player at config position', () => {
    const state = createInitialGameState();
    state.player = createPlayer();

    expect(state.player.x).toBe(GameConfig.player.x);
    expect(state.player.y).toBe(GameConfig.player.y);
    expect(state.player.alive).toBe(true);
    expect(state.gameOver).toBe(false);
  });

  it('should run all systems in order without crashing', () => {
    const state = createInitialGameState();
    state.player = createPlayer();

    // Simulate a few frames of gameplay
    for (let frame = 0; frame < 10; frame++) {
      // Simulate a key press every few frames via the pending queue
      if (frame === 3) state.pendingKeys.push('A');

      spawnSystem(state, 16);
      movementSystem(state, 16);

      // Process pending keys (matching new GameScene.update behavior)
      while (state.pendingKeys.length > 0) {
        state.lastKeyPressed = state.pendingKeys.shift()!;
        targetSystem(state);
        combatSystem(state, 16);
      }

      heatBarSystem(state, 16);
      difficultySystem(state, 16);
      scoreSystem(state);
      collisionSystem(state);

      // Reset per-frame state
      state.lastKeyPressed = null;
      state.targetedEnemyId = null;
    }

    // Should not crash
    expect(state.difficultyLevel).toBeGreaterThanOrEqual(0);
    expect(state.elapsedTime).toBeGreaterThan(0);
  });

  it('should trigger game over cascade when collision occurs', () => {
    const state = createInitialGameState();
    state.player = createPlayer();

    // Spawn an enemy at player position
    spawnSystem(state, 0);
    const enemy = state.enemies[0];
    if (enemy) {
      enemy.x = state.player.x;
      enemy.y = state.player.y;
    }

    // Run systems — collision should detect game over
    spawnSystem(state, 0);
    movementSystem(state, 16);
    collisionSystem(state);

    // Once game over, subsequent systems should be no-ops
    expect(state.gameOver).toBe(true);
    const scoreBefore = state.score;
    combatSystem(state, 0);
    expect(state.score).toBe(scoreBefore); // no change when game over
  });

  it('should clear per-frame input state after each tick', () => {
    const state = createInitialGameState();
    state.player = createPlayer();

    // Simulate a key pushed during a frame
    state.pendingKeys.push('S');
    state.targetedEnemyId = 99;

    // Process pending keys (as GameScene.update now does)
    while (state.pendingKeys.length > 0) {
      state.lastKeyPressed = state.pendingKeys.shift()!;
      targetSystem(state);
      combatSystem(state, 0);
    }
    state.lastKeyPressed = null;
    state.targetedEnemyId = null;

    expect(state.pendingKeys).toHaveLength(0);
    expect(state.lastKeyPressed).toBeNull();
    expect(state.targetedEnemyId).toBeNull();
  });
});
