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
});
