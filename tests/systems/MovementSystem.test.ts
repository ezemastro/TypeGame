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

  describe('Magnetic Field', () => {
    it('should pull enemy toward player when within 200px radius and MAGNETIC_FIELD active', () => {
      const enemy = createEnemy('TEST', 1);
      // Player center: (425, 525). Enemy center X = 425 (same column), Y = 425 (100px above player)
      enemy.x = 425 - 30; // center X = 425
      enemy.y = 425 - 30; // center Y = 425
      enemy.speed = 80;
      const state = makeState([enemy], { activePowerUps: ['MAGNETIC_FIELD'] });
      // Without pull: enemy.y = 395 + 80 = 475 (normal speed toward player)
      // With pull (30% extra): effective speed = 80 * 1.3 = 104
      // After 1s: enemy.y = 395 + 104 = 499

      movementSystem(state, 1000);

      // Enemy pulled MORE than normal speed toward player
      expect(state.enemies[0].x).toBeCloseTo(395, 0); // same X
      expect(state.enemies[0].y).toBeCloseTo(499, 0); // faster than normal (475)
    });

    it('should NOT pull enemy outside 200px radius', () => {
      const enemy = createEnemy('TEST', 1);
      // Place enemy 250px above player
      enemy.x = 425 - 30;
      enemy.y = 275 - 30; // center Y = 275 (250px from player center at 525)
      enemy.speed = 80;
      const state = makeState([enemy], { activePowerUps: ['MAGNETIC_FIELD'] });
      // Normal speed: enemy.y = 245 + 80 = 325

      movementSystem(state, 1000);

      expect(state.enemies[0].x).toBeCloseTo(395, 0);
      expect(state.enemies[0].y).toBeCloseTo(325, 0); // normal speed, no extra pull
    });

    it('should NOT pull without MAGNETIC_FIELD active (even within radius)', () => {
      const enemy = createEnemy('TEST', 1);
      enemy.x = 425 - 30;
      enemy.y = 425 - 30;
      enemy.speed = 80;
      const state = makeState([enemy], { activePowerUps: [] });

      movementSystem(state, 1000);

      expect(state.enemies[0].y).toBeCloseTo(475, 0); // normal speed
    });

    it('should NOT pull dead enemies within radius', () => {
      const deadEnemy = createEnemy('DEAD', 1);
      deadEnemy.x = 425 - 30;
      deadEnemy.y = 425 - 30;
      deadEnemy.speed = 80;
      deadEnemy.alive = false;
      const state = makeState([deadEnemy], { activePowerUps: ['MAGNETIC_FIELD'] });

      movementSystem(state, 1000);

      expect(state.enemies[0].y).toBe(395); // unmoved
      expect(state.enemies[0].x).toBe(395);
    });
  });

  describe('Slowing Aura', () => {
    it('should slow enemy within radius when SLOW_AURA is active', () => {
      const enemy = createEnemy('TEST', 1);
      // Place enemy directly above player, 100px away (within 150 radius)
      enemy.x = 425 - 30; // enemy center X = 425
      enemy.y = 425 - 30; // enemy center Y = 425
      enemy.speed = 80;
      const state = makeState([enemy], { activePowerUps: ['SLOW_AURA'] });
      // Player center: (425, 525). Enemy center: (425, 425).
      // dx=0, dy=100, dist=100 → within radius → half speed (40 px/s)
      // enemy.y = top-left. centerY = enemy.y + height/2 = 395 + 30 = 425.
      // After 1s: centerY = 425 + 40 = 465. enemy.y = 465 - 30 = 435.

      movementSystem(state, 1000);

      // Enemy moves toward player but at half speed
      expect(state.enemies[0].x).toBeCloseTo(395, 0); // unchanged
      expect(state.enemies[0].y).toBeCloseTo(435, 0); // 395 + 40 = 435
    });

    it('should NOT slow enemy outside radius even with SLOW_AURA active', () => {
      const enemy = createEnemy('TEST', 1);
      // Place enemy 200px above player (outside 150 radius)
      enemy.x = 425 - 30; // enemy center X = 425
      enemy.y = 325 - 30; // enemy center Y = 325 (top-left=295)
      enemy.speed = 80;
      const state = makeState([enemy], { activePowerUps: ['SLOW_AURA'] });
      // dist = 200 > 150 radius → normal speed
      // After 1s: enemy.y = 295 + 80 = 375

      movementSystem(state, 1000);

      expect(state.enemies[0].x).toBeCloseTo(395, 0);
      expect(state.enemies[0].y).toBeCloseTo(375, 0); // normal speed
    });

    it('should NOT slow enemy without SLOW_AURA active (even within radius)', () => {
      const enemy = createEnemy('TEST', 1);
      enemy.x = 425 - 30;
      enemy.y = 425 - 30; // top-left=395, centerY=425
      enemy.speed = 80;
      const state = makeState([enemy], { activePowerUps: [] });

      movementSystem(state, 1000);

      // Full speed even though within radius
      expect(state.enemies[0].y).toBeCloseTo(475, 0); // 395 + 80 = 475
    });

    it('should slow nearby enemy but not far enemy with SLOW_AURA', () => {
      const closeEnemy = createEnemy('CLOSE', 1);
      closeEnemy.x = 425 - 30;
      closeEnemy.y = 425 - 30; // top-left=395, centerY=425
      closeEnemy.speed = 100;

      const farEnemy = createEnemy('FAR', 2);
      farEnemy.x = 425 - 30;
      farEnemy.y = 200 - 30; // top-left=170, centerY=200
      farEnemy.speed = 100;

      const state = makeState([closeEnemy, farEnemy], { activePowerUps: ['SLOW_AURA'] });
      // closeEnemy: within radius → 100 * 0.5 = 50px → new y = 395 + 50 = 445
      // farEnemy: outside radius → 100px → new y = 170 + 100 = 270

      movementSystem(state, 1000);

      expect(state.enemies[0].y).toBeCloseTo(445, 0); // slowed: +50px
      expect(state.enemies[1].y).toBeCloseTo(270, 0); // normal: +100px

      // farEnemy should move more than closeEnemy
      expect(state.enemies[1].y - 170).toBeGreaterThan(state.enemies[0].y - 395);
    });

    it('should NOT slow dead enemies within radius', () => {
      const aliveEnemy = createEnemy('ALIVE', 1);
      aliveEnemy.x = 425 - 30;
      aliveEnemy.y = 425 - 30; // top-left=395
      aliveEnemy.speed = 80;

      const deadEnemy = createEnemy('DEAD', 2);
      deadEnemy.x = 425 - 30;
      deadEnemy.y = 425 - 30; // top-left=395
      deadEnemy.speed = 80;
      deadEnemy.alive = false;

      const state = makeState([aliveEnemy, deadEnemy], { activePowerUps: ['SLOW_AURA'] });

      movementSystem(state, 1000);

      // Alive enemy: slowed, 80 * 0.5 = 40px → new y = 395 + 40 = 435
      expect(state.enemies[0].y).toBeCloseTo(435, 0);
      // Dead enemy: not moved at all (alive check before aura logic)
      expect(state.enemies[1].y).toBe(395);
      expect(state.enemies[1].x).toBe(395);
    });
  });
});


