import { describe, it, expect } from 'vitest';
import { targetSystem } from '../../src/systems/TargetSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { createEnemy, type EnemyState } from '../../src/entities/Enemy';

function makeState(enemies: EnemyState[] = [], overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  base.enemies = enemies;
  return { ...base, ...overrides };
}

describe('TargetSystem', () => {
  it('should target the nearest enemy whose word starts with the pressed key', () => {
    const close = createEnemy('SOL', 1);
    close.x = 400;
    close.y = 200; // distance ~300 from player at (400,500)

    const far = createEnemy('SAL', 2);
    far.x = 400;
    far.y = 100; // distance ~400 from player

    const state = makeState([close, far], { lastKeyPressed: 'S' });

    targetSystem(state);

    expect(state.targetedEnemyId).toBe(1); // close enemy
  });

  it('should target the nearest by Euclidean distance (not just vertical)', () => {
    const diagonalClose = createEnemy('ABC', 1);
    diagonalClose.x = 410;
    diagonalClose.y = 490; // distance ~sqrt(100+100) ≈ 14 from (400,500)

    const directFar = createEnemy('AXY', 2);
    directFar.x = 400;
    directFar.y = 400; // distance = 100 from (400,500)

    const state = makeState([directFar, diagonalClose], { lastKeyPressed: 'A' });

    targetSystem(state);

    expect(state.targetedEnemyId).toBe(1); // diagonalClose is closer
  });

  it('should set targetedEnemyId to null when no enemy matches the key', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { lastKeyPressed: 'Z', targetedEnemyId: 99 });

    targetSystem(state);

    expect(state.targetedEnemyId).toBeNull();
  });

  it('should set targetedEnemyId to null when no key is pressed', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { lastKeyPressed: null, targetedEnemyId: 99 });

    targetSystem(state);

    expect(state.targetedEnemyId).toBeNull();
  });

  it('should handle case-insensitive key matching', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { lastKeyPressed: 's' });

    targetSystem(state);

    expect(state.targetedEnemyId).toBe(1);
  });

  it('should only target alive enemies', () => {
    const alive = createEnemy('SOL', 1);
    alive.alive = true;

    const dead = createEnemy('SAL', 2);
    dead.alive = false;
    dead.x = 400;
    dead.y = 100; // closer but dead

    const state = makeState([dead, alive], { lastKeyPressed: 'S' });

    targetSystem(state);

    expect(state.targetedEnemyId).toBe(1); // only alive enemy
  });

  it('should handle empty enemy list', () => {
    const state = makeState([], { lastKeyPressed: 'A', targetedEnemyId: 99 });
    targetSystem(state);
    expect(state.targetedEnemyId).toBeNull();
  });
});
