import { describe, it, expect } from 'vitest';
import { collisionSystem } from '../../src/systems/CollisionSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { createEnemy, type EnemyState } from '../../src/entities/Enemy';

function makeState(enemies: EnemyState[] = [], overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  base.enemies = enemies;
  return { ...base, ...overrides };
}

describe('CollisionSystem', () => {
  it('should trigger game over when any alive enemy overlaps player', () => {
    // Player at y=500, height=50. Enemy at y=490, height=60.
    // Enemy bottom = 550, player top = 500 → overlap on Y axis
    const enemy = createEnemy('SOL', 1);
    enemy.x = 400; // overlap player horizontally
    enemy.y = 490;
    enemy.alive = true;
    const state = makeState([enemy]);

    collisionSystem(state);

    expect(state.gameOver).toBe(true);
  });

  it('should trigger game over when enemy center reaches player Y', () => {
    const enemy = createEnemy('SOL', 1);
    enemy.x = 400; // overlap player horizontally
    enemy.y = 500; // exactly at player Y
    enemy.alive = true;
    const state = makeState([enemy]);

    collisionSystem(state);

    expect(state.gameOver).toBe(true);
  });

  it('should NOT trigger game over when enemy is above player', () => {
    const enemy = createEnemy('SOL', 1);
    enemy.y = 200; // well above player
    enemy.alive = true;
    const state = makeState([enemy]);

    collisionSystem(state);

    expect(state.gameOver).toBe(false);
  });

  it('should ignore dead enemies for collision', () => {
    const enemy = createEnemy('SOL', 1);
    enemy.y = 500;
    enemy.alive = false; // dead
    const state = makeState([enemy]);

    collisionSystem(state);

    expect(state.gameOver).toBe(false);
  });

  it('should detect collision among multiple enemies', () => {
    const safe = createEnemy('SAFE', 1);
    safe.x = 400;
    safe.y = 200;
    safe.alive = true;

    const dangerous = createEnemy('DANGER', 2);
    dangerous.x = 400; // overlap player horizontally
    dangerous.y = 490;
    dangerous.alive = true;

    const state = makeState([safe, dangerous]);

    collisionSystem(state);

    expect(state.gameOver).toBe(true);
  });

  it('should not trigger if game is already over', () => {
    const enemy = createEnemy('SOL', 1);
    enemy.x = 400;
    enemy.y = 500;
    const state = makeState([enemy], { gameOver: true });

    collisionSystem(state);

    expect(state.gameOver).toBe(true); // still true
  });

  it('should handle empty enemy list', () => {
    const state = makeState([]);
    expect(() => collisionSystem(state)).not.toThrow();
    expect(state.gameOver).toBe(false);
  });

  describe('Shield power-up', () => {
    it('should absorb collision when shieldCharges > 0 (no game over)', () => {
      const enemy = createEnemy('SOL', 1);
      enemy.x = 400;
      enemy.y = 490;
      enemy.alive = true;
      const state = makeState([enemy], {
        powerUpState: {
          cooldowns: {},
          shieldCharges: 1,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      collisionSystem(state);

      // Shield absorbed: charges decremented, cooldown set, enemy destroyed
      expect(state.powerUpState.shieldCharges).toBe(0);
      expect(state.powerUpState.cooldowns.SHIELD).toBe(30000);
      expect(state.enemies[0].alive).toBe(false);
      // Game should NOT be over
      expect(state.gameOver).toBe(false);
    });

    it('should trigger game over when shieldCharges is 0 (depleted)', () => {
      const enemy = createEnemy('SOL', 1);
      enemy.x = 400;
      enemy.y = 490;
      enemy.alive = true;
      const state = makeState([enemy], {
        powerUpState: {
          cooldowns: {},
          shieldCharges: 0,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      collisionSystem(state);

      expect(state.gameOver).toBe(true);
      expect(state.enemies[0].alive).toBe(true); // enemy NOT destroyed
    });

    it('should trigger game over when no shield powerUpState (backward compat)', () => {
      const enemy = createEnemy('SOL', 1);
      enemy.x = 400;
      enemy.y = 490;
      enemy.alive = true;
      // Default createInitialGameState has shieldCharges=0
      const state = makeState([enemy]);

      collisionSystem(state);

      expect(state.gameOver).toBe(true);
    });

    it('should only absorb first collision in a frame with multiple enemies', () => {
      const enemy1 = createEnemy('EN1', 1);
      enemy1.x = 400;
      enemy1.y = 490;
      enemy1.alive = true;
      const enemy2 = createEnemy('EN2', 2);
      enemy2.x = 400;
      enemy2.y = 490;
      enemy2.alive = true;
      const state = makeState([enemy1, enemy2], {
        powerUpState: {
          cooldowns: {},
          shieldCharges: 1,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      collisionSystem(state);

      // First enemy absorbed → shield depleted
      expect(state.powerUpState.shieldCharges).toBe(0);
      expect(state.enemies[0].alive).toBe(false);
      // Second enemy collision → game over (shield already used up)
      expect(state.gameOver).toBe(true);
      expect(state.enemies[1].alive).toBe(true); // second enemy survives
    });

    it('should absorb with 3 charges and still have 2 left', () => {
      const enemy = createEnemy('SOL', 1);
      enemy.x = 400;
      enemy.y = 490;
      enemy.alive = true;
      const state = makeState([enemy], {
        powerUpState: {
          cooldowns: {},
          shieldCharges: 3,
          allyCount: 0,
          freezeActiveUntil: 0,
        },
      });

      collisionSystem(state);

      expect(state.powerUpState.shieldCharges).toBe(2);
      expect(state.powerUpState.cooldowns.SHIELD).toBe(30000);
      expect(state.enemies[0].alive).toBe(false);
      expect(state.gameOver).toBe(false);
    });
  });
});
