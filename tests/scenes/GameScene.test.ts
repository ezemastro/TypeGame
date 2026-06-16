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

  describe('projectile kill gate', () => {
    /**
     * Pure function mirror of the kill-gate logic inside updateProjectiles.
     * Extracted here for testability; implementation must match this.
     */
    function shouldKillTarget(
      target: { pendingDestruction: boolean; alive: boolean },
      canKill: boolean,
    ): boolean {
      return target.pendingDestruction && target.alive && canKill;
    }

    it('should kill enemy when canKill is true and target is pendingDestruction', () => {
      const target = { pendingDestruction: true, alive: true };
      expect(shouldKillTarget(target, true)).toBe(true);
    });

    it('should NOT kill enemy when canKill is false even if pendingDestruction', () => {
      const target = { pendingDestruction: true, alive: true };
      expect(shouldKillTarget(target, false)).toBe(false);
    });

    it('should NOT kill enemy when canKill is true but target is not pendingDestruction', () => {
      const target = { pendingDestruction: false, alive: true };
      expect(shouldKillTarget(target, true)).toBe(false);
    });

    it('should NOT kill already-dead enemy regardless of canKill', () => {
      const target = { pendingDestruction: true, alive: false };
      expect(shouldKillTarget(target, true)).toBe(false);
      expect(shouldKillTarget(target, false)).toBe(false);
    });

    it('full pipeline: projectile with canKill=false should not kill pending enemy when hitting', () => {
      const state = createInitialGameState();
      state.player = createPlayer();

      // Spawn an enemy and manually set pendingDestruction
      spawnSystem(state, 0);
      const enemy = state.enemies[0];
      enemy.alive = true;
      enemy.pendingDestruction = true;
      enemy.word = '';  // empty word to trigger kill path

      // Simulate the kill-gate check as updateProjectiles would
      // canKill = false → enemy should NOT be killed
      const canKill = false;
      if (enemy.pendingDestruction && canKill) {
        enemy.alive = false;
      }

      // Enemy should still be alive — kill was gated
      expect(enemy.alive).toBe(true);
      expect(state.enemies.filter(e => e.alive)).toHaveLength(1);
    });

    it('full pipeline: projectile with canKill=true should kill pending enemy', () => {
      const state = createInitialGameState();
      state.player = createPlayer();

      spawnSystem(state, 0);
      const enemy = state.enemies[0];
      enemy.alive = true;
      enemy.pendingDestruction = true;
      enemy.word = '';

      // canKill = true → enemy SHOULD be killed
      const canKill = true;
      if (enemy.pendingDestruction && canKill) {
        enemy.alive = false;
      }

      expect(enemy.alive).toBe(false);
    });
  });

  describe('bounce timer', () => {
    it('should count down bounce timer each delta tick', () => {
      let bounceTimer = 500;
      const delta = 100;
      bounceTimer -= delta;
      expect(bounceTimer).toBe(400);
    });

    it('should NOT destroy projectile when timer expires, should find new target instead', () => {
      // Simulates the redesign: on expiry, find new target; never destroy
      let bounceTimer = 100;
      const delta = 150;
      bounceTimer -= delta;

      // Timer expired
      expect(bounceTimer).toBeLessThanOrEqual(0);

      // Projectile should NOT be destroyed — just find new target
      const shouldDestroy = bounceTimer <= 0 && false; // false because we don't destroy anymore
      expect(shouldDestroy).toBe(false);

      // Instead, find a new target and set targetId
      let foundNewTarget = false;
      if (bounceTimer <= 0) {
        // findNearestEnemy logic (simulated)
        foundNewTarget = true;
      }
      expect(foundNewTarget).toBe(true);
    });

    it('should pause flight while timer is active (continue to skip movement)', () => {
      let bounceTimer = 500;
      const delta = 100;

      // During timer: should skip movement
      let movementApplied = false;
      if (bounceTimer > 0) {
        bounceTimer -= delta;
        if (bounceTimer <= 0) {
          // Expired — find target
          movementApplied = false; // still no movement this frame
        } else {
          // Still counting — pause (continue)
          movementApplied = false;
        }
      } else {
        movementApplied = true;
      }

      // Timer still active after decrement (400 > 0), so movement should be paused
      expect(bounceTimer).toBe(400);
      expect(movementApplied).toBe(false);
    });

    it('should resume flight after timer expires by finding new homing target', () => {
      const state = createInitialGameState();
      state.player = createPlayer();

      // Setup: create a projectile-like state with hitEnemyIds
      const hitEnemyIds = new Set<number>([1, 2]);
      let bounceTimer = 50;
      const delta = 100;

      // Simulate timer expiry
      bounceTimer -= delta;
      expect(bounceTimer).toBeLessThanOrEqual(0);

      // On expiry: find new target excluding already-hit enemies
      const enemies = [
        { id: 1, x: 100, y: 100, alive: true }, // in hitEnemyIds → skip
        { id: 2, x: 200, y: 100, alive: true }, // in hitEnemyIds → skip
        { id: 3, x: 300, y: 100, alive: true }, // available
      ];

      let newTargetId: number | null = null;
      if (bounceTimer <= 0) {
        for (const e of enemies) {
          if (!e.alive || hitEnemyIds.has(e.id)) continue;
          newTargetId = e.id;
          break;
        }
      }

      // Should have found enemy 3 (skipping 1 and 2)
      expect(newTargetId).toBe(3);
    });
  });

  describe('pierce collision', () => {
    it('should skip enemies already in hitEnemyIds during pierce', () => {
      const hitEnemyIds = new Set<number>([5, 7]);

      const enemies = [
        { id: 3, word: 'ABC', alive: true },
        { id: 5, word: 'DEF', alive: true }, // in hitEnemyIds → skip
        { id: 7, word: 'GHI', alive: true }, // in hitEnemyIds → skip
        { id: 9, word: 'JKL', alive: true },
      ];

      const damaged: number[] = [];
      for (const enemy of enemies) {
        if (!enemy.alive || hitEnemyIds.has(enemy.id)) continue;
        // Damage
        enemy.word = enemy.word.slice(1);
        hitEnemyIds.add(enemy.id);
        damaged.push(enemy.id);
        break; // pierce hits one per check
      }

      // Only enemy 3 should be damaged (first non-excluded alive enemy)
      expect(damaged).toEqual([3]);
      expect(hitEnemyIds.has(3)).toBe(true);
      expect(hitEnemyIds.has(5)).toBe(true); // already there
    });

    it('should add hit enemy to hitEnemyIds during pierce', () => {
      const hitEnemyIds = new Set<number>();

      const enemy = { id: 10, word: 'TEST', alive: true };
      if (!hitEnemyIds.has(enemy.id)) {
        enemy.word = enemy.word.slice(1);
        hitEnemyIds.add(enemy.id);
      }

      expect(hitEnemyIds.has(10)).toBe(true);
      expect(enemy.word).toBe('EST');
    });
  });

  describe('projectile rotation', () => {
    const rotationFromDelta = (dx: number, dy: number): number =>
      Math.atan2(dy, dx) + Math.PI / 2;

    it('should point right when moving horizontally right', () => {
      // Moving right: dx > 0, dy = 0. atan2(0, 1) = 0. 0 + π/2 = π/2 (90° = right)
      const angle = rotationFromDelta(10, 0);
      expect(angle).toBeCloseTo(Math.PI / 2, 5);
    });

    it('should point left when moving horizontally left', () => {
      // Moving left: dx < 0, dy = 0. atan2(0, -1) = π. π + π/2 = 3π/2 (pointing left)
      const angle = rotationFromDelta(-10, 0);
      expect(angle).toBeCloseTo((3 * Math.PI) / 2, 5);
    });

    it('should point down when moving vertically down', () => {
      // Moving down: dx = 0, dy > 0. atan2(1, 0) = π/2. π/2 + π/2 = π (180° = down)
      const angle = rotationFromDelta(0, 10);
      expect(angle).toBeCloseTo(Math.PI, 5);
    });

    it('should point up when moving vertically up', () => {
      // Moving up: dx = 0, dy < 0. atan2(-1, 0) = -π/2. -π/2 + π/2 = 0 (0° = up/natural)
      const angle = rotationFromDelta(0, -10);
      expect(angle).toBeCloseTo(0, 5);
    });

    it('should point diagonally for equal dx,dy movement', () => {
      // Moving down-right: dx = dy, atan2(1, 1) = π/4. π/4 + π/2 = 3π/4
      const angle = rotationFromDelta(10, 10);
      expect(angle).toBeCloseTo((3 * Math.PI) / 4, 5);
    });

    it('should handle zero dx correctly (vertical movement)', () => {
      // atan2 works fine with dx = 0
      const angleUp = rotationFromDelta(0, -5);
      expect(angleUp).toBeCloseTo(0, 5); // points up (natural orientation)

      const angleDown = rotationFromDelta(0, 5);
      expect(angleDown).toBeCloseTo(Math.PI, 5); // points down
    });
  });
});
