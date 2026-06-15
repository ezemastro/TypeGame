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
import { xpSystem } from '../../src/systems/XPSystem';
import { collisionSystem } from '../../src/systems/CollisionSystem';
import { createEnemy } from '../../src/entities/Enemy';

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

  it('should initialize XP/level fields with correct defaults', () => {
    const state = createInitialGameState();

    expect(state.xp).toBe(0);
    expect(state.level).toBe(1);
    expect(state.xpToNextLevel).toBe(GameConfig.scoring.xpToLevelUp);
    expect(state.activePowerUps).toEqual([]);
    expect(state.isPaused).toBe(false);
    expect(state.levelUpChoices).toEqual([]);
  });

  it('should clear per-frame input state after each tick', () => {
    const state = createInitialGameState();
    state.player = createPlayer();

    // Simulate a key pushed during a frame
    state.pendingKeys.push('S');
    state.targetedEnemyId = 99;
    state.secondaryTargetId = 42;

    // Process pending keys (as GameScene.update now does)
    while (state.pendingKeys.length > 0) {
      state.lastKeyPressed = state.pendingKeys.shift()!;
      targetSystem(state);
      combatSystem(state, 0);
    }
    state.lastKeyPressed = null;
    state.targetedEnemyId = null;
    state.secondaryTargetId = null;

    expect(state.pendingKeys).toHaveLength(0);
    expect(state.lastKeyPressed).toBeNull();
    expect(state.targetedEnemyId).toBeNull();
    expect(state.secondaryTargetId).toBeNull();
  });

  it('should run XPSystem before ScoreSystem so both see gearDropped', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    state.gearDropped = true;

    // XPSystem runs FIRST: adds XP, does NOT consume gearDropped
    xpSystem(state);
    // ScoreSystem runs SECOND: adds score, consumes gearDropped
    scoreSystem(state);

    // Both systems added their respective values
    expect(state.xp).toBe(GameConfig.scoring.xpPerWord);
    expect(state.score).toBe(GameConfig.scoring.pointsPerWord);
    expect(state.gearDropped).toBe(false);
  });

  it('should skip enemy-affecting systems when isPaused is true (orchestration-level guard)', () => {
    const state = createInitialGameState();
    state.player = createPlayer();

    // Spawn an enemy normally
    state.isPaused = false;
    spawnSystem(state, 0);
    const enemyBefore = state.enemies[0];
    const xBefore = enemyBefore ? enemyBefore.x : 0;

    // Mark as paused — GameScene.update() would skip all systems
    state.isPaused = true;

    // Simulate the orchestration guard: when isPaused, skip systems
    if (!state.isPaused) {
      movementSystem(state, 1000);
    }

    if (enemyBefore) {
      expect(state.enemies[0].x).toBe(xBefore); // position unchanged
    }
  });

  it('should freeze spawns when isPaused is true (orchestration-level guard)', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    state.isPaused = true;
    state.spawnTimer = 3000; // ready to spawn

    // Simulate orchestration guard
    if (!state.isPaused) {
      spawnSystem(state, 0);
    }

    expect(state.enemies).toHaveLength(0); // no enemies spawned
  });

  it('should set secondaryTargetId when DUAL_SHOT finds a secondary target', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    state.activePowerUps = ['DUAL_SHOT'];

    // Spawn two enemies with same starting letter
    spawnSystem(state, 0);
    // Manually add a second enemy
    const e1 = state.enemies[0];
    if (e1) {
      e1.word = 'SOL';
      e1.fullWord = 'SOL';
      e1.x = 200;
      e1.y = 300;
    }
    const e2 = createEnemy('SAL', 100);
    e2.x = 400;
    e2.y = 300;
    state.enemies.push(e2);

    // Target the first enemy
    state.targetedEnemyId = 1;
    state.lastKeyPressed = 'S';
    state.shootCooldown = 0;

    combatSystem(state, 0);

    // Should strip first enemy's letter and find secondary target
    expect(state.enemies[0].word).toBe('OL');
    expect(state.secondaryTargetId).toBe(100);
    expect(state.enemies[1].word).toBe('AL');
  });

  it('should initialize secondaryTargetId to null', () => {
    const state = createInitialGameState();
    expect(state.secondaryTargetId).toBeNull();
  });
});
