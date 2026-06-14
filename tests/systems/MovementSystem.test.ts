import { describe, it, expect } from 'vitest';
import { movementSystem } from '../../src/systems/MovementSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { createEnemy, type EnemyState } from '../../src/entities/Enemy';

function makeState(enemies: EnemyState[] = [], overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  base.enemies = enemies;
  return { ...base, ...overrides };
}

describe('MovementSystem', () => {
  it('should move enemy diagonally toward player', () => {
    const enemy = createEnemy('TEST', 1);
    enemy.x = 0;
    enemy.y = 0;
    enemy.speed = 80; // pixels per second
    const state = makeState([enemy]);
    // Player is at (400, 500) from config. Center centers: player=(425,525), enemy=(30,30)
    // dx=395, dy=495, dist≈633.28
    // dx/dist≈0.623, dy/dist≈0.782
    // x += 0.623*80 = 49.88, y += 0.782*80 = 62.54

    movementSystem(state, 1000); // 1 second

    expect(state.enemies[0].x).toBeGreaterThan(0);
    expect(state.enemies[0].y).toBeGreaterThan(0);
    expect(state.enemies[0].x).toBeCloseTo(49.88, 0);
    expect(state.enemies[0].y).toBeCloseTo(62.54, 0);
  });

  it('should handle fractional delta (e.g., half second) diagonally', () => {
    const enemy = createEnemy('TEST', 1);
    enemy.x = 0;
    enemy.y = 0;
    enemy.speed = 200;
    const state = makeState([enemy]);
    // Same direction vector, double speed, half time → same distance as above
    // x += 0.623*200*0.5 = 62.35, y += 0.782*200*0.5 = 78.16

    movementSystem(state, 500); // 0.5 seconds

    expect(state.enemies[0].x).toBeGreaterThan(0);
    expect(state.enemies[0].y).toBeGreaterThan(0);
    expect(state.enemies[0].x).toBeCloseTo(62.35, 0);
    expect(state.enemies[0].y).toBeCloseTo(78.16, 0);
  });

  it('should move multiple enemies independently at their own speeds toward player', () => {
    const e1 = createEnemy('FAST', 1);
    e1.x = 0;
    e1.y = 0;
    e1.speed = 200;

    const e2 = createEnemy('SLOW', 2);
    e2.x = 0;
    e2.y = 0;
    e2.speed = 80;

    const state = makeState([e1, e2]);

    movementSystem(state, 1000);

    // Both move along same direction, but fast one moves 2.5x farther
    expect(state.enemies[0].x).toBeGreaterThan(state.enemies[1].x);
    expect(state.enemies[0].y).toBeGreaterThan(state.enemies[1].y);
    // Fast: x≈124.7, y≈156.3. Slow: x≈49.9, y≈62.5
    expect(state.enemies[0].x).toBeCloseTo(124.7, 0);
    expect(state.enemies[1].x).toBeCloseTo(49.88, 0);
  });

  it('should move enemy toward player from a different angle', () => {
    // Enemy at bottom-left, player at top-right of enemy
    const enemy = createEnemy('TEST', 1);
    enemy.x = 100;
    enemy.y = 300;
    enemy.speed = 100;
    const state = makeState([enemy]);
    // Player center: (425, 525). Enemy center: (130, 330)
    // dx = 425-130 = 295, dy = 525-330 = 195
    // dist = sqrt(295² + 195²) = sqrt(87025 + 38025) = sqrt(125050) ≈ 353.62
    // dx/dist = 295/353.62 ≈ 0.834, dy/dist = 195/353.62 ≈ 0.551
    // x += 0.834*100 = 83.42, y += 0.551*100 = 55.14

    movementSystem(state, 1000);

    expect(state.enemies[0].x).toBeCloseTo(183.42, 0);
    expect(state.enemies[0].y).toBeCloseTo(355.14, 0);
  });

  it('should not move enemy when it is exactly at player position (zero vector)', () => {
    const enemy = createEnemy('TEST', 1);
    // Player center: (425, 525). Enemy center: (x+30, y+30). Match centers.
    enemy.x = 395; // 425 - 30
    enemy.y = 495; // 525 - 30
    enemy.speed = 100;
    const state = makeState([enemy]);

    movementSystem(state, 1000);

    // Should not divide by zero; position unchanged
    expect(state.enemies[0].x).toBeCloseTo(395, 0);
    expect(state.enemies[0].y).toBeCloseTo(495, 0);
  });

  it('should not move dead enemies', () => {
    const enemy = createEnemy('DEAD', 1);
    enemy.x = 100;
    enemy.y = 100;
    enemy.speed = 100;
    enemy.alive = false;
    const state = makeState([enemy]);

    movementSystem(state, 1000);

    expect(state.enemies[0].x).toBe(100); // unchanged
    expect(state.enemies[0].y).toBe(100); // unchanged
  });

  it('should not move enemies when game is over', () => {
    const enemy = createEnemy('STUCK', 1);
    enemy.x = 100;
    enemy.y = 100;
    enemy.speed = 100;
    const state = makeState([enemy], { gameOver: true });

    movementSystem(state, 1000);

    expect(state.enemies[0].x).toBe(100);
    expect(state.enemies[0].y).toBe(100);
  });

  it('should handle empty enemy list', () => {
    const state = makeState([]);
    expect(() => movementSystem(state, 1000)).not.toThrow();
  });
});


