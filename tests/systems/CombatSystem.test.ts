import { describe, it, expect } from 'vitest';
import { combatSystem } from '../../src/systems/CombatSystem';
import { createInitialGameState, type GameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';
import { createEnemy, type EnemyState } from '../../src/entities/Enemy';
import { GameConfig } from '../../src/config';

function makeState(enemies: EnemyState[] = [], overrides: Partial<GameState> = {}): GameState {
  const base = createInitialGameState();
  base.player = createPlayer();
  base.enemies = enemies;
  return { ...base, ...overrides };
}

describe('CombatSystem', () => {
  it('should strip the first letter of the targeted enemy word', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { targetedEnemyId: 1, shootCooldown: 0, score: 0 });

    combatSystem(state, 0);

    expect(state.enemies[0].word).toBe('OL');
    expect(state.enemies[0].fullWord).toBe('SOL'); // fullWord preserved
    expect(state.score).toBe(GameConfig.scoring.pointsPerLetter); // +10
  });

  it('should set shootCooldown after firing', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { targetedEnemyId: 1, shootCooldown: 0 });

    combatSystem(state, 0);

    expect(state.shootCooldown).toBe(GameConfig.shooting.cooldown);
  });

  it('should not fire when shootCooldown is active', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { targetedEnemyId: 1, shootCooldown: 150 });

    combatSystem(state, 50);

    expect(state.enemies[0].word).toBe('SOL'); // unchanged
    expect(state.shootCooldown).toBe(100); // decremented by delta
  });

  it('should decrement shootCooldown by delta when active', () => {
    const state = makeState([], { targetedEnemyId: null, shootCooldown: 200 });

    combatSystem(state, 50);

    expect(state.shootCooldown).toBe(150);
  });

  it('should mark enemy for destruction when last letter is stripped, but keep it alive', () => {
    const enemy = createEnemy('A', 1); // single-letter word
    const state = makeState([enemy], { targetedEnemyId: 1, shootCooldown: 0 });

    combatSystem(state, 0);

    expect(state.enemies[0].word).toBe('');
    expect(state.enemies[0].alive).toBe(true);            // NOT destroyed immediately
    expect(state.enemies[0].pendingDestruction).toBe(true); // marked for projectile
    expect(state.gearDropped).toBe(false);                 // NOT applied yet
  });

  it('should NOT set gearDropped when destroying last letter (deferred to projectile)', () => {
    const enemy = createEnemy('AB', 1); // two-letter word, fire twice
    const state = makeState([enemy], { targetedEnemyId: 1, shootCooldown: 0, score: 0 });

    // First shot: A stripped, word becomes "B"
    combatSystem(state, 0);
    expect(state.enemies[0].word).toBe('B');
    expect(state.enemies[0].alive).toBe(true);
    expect(state.enemies[0].pendingDestruction).toBe(false);
    expect(state.gearDropped).toBe(false);

    // Reset cooldown for second shot
    state.shootCooldown = 0;

    // Second shot: B stripped, word becomes ""
    combatSystem(state, 0);
    expect(state.enemies[0].word).toBe('');
    expect(state.enemies[0].alive).toBe(true);
    expect(state.enemies[0].pendingDestruction).toBe(true);
    expect(state.gearDropped).toBe(false); // STILL not set
  });

  it('should not fire when no target is selected', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], { targetedEnemyId: null, shootCooldown: 0 });

    combatSystem(state, 0);

    expect(state.enemies[0].word).toBe('SOL'); // unchanged
  });

  it('should not fire when overheated', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], {
      targetedEnemyId: 1,
      shootCooldown: 0,
      overheated: true,
    });

    combatSystem(state, 0);

    expect(state.enemies[0].word).toBe('SOL'); // unchanged
  });

  it('should not fire when game is over', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], {
      targetedEnemyId: 1,
      shootCooldown: 0,
      gameOver: true,
    });

    combatSystem(state, 0);

    expect(state.enemies[0].word).toBe('SOL');
  });

  it('should not fire if targeted enemy is already dead', () => {
    const enemy = createEnemy('SOL', 1);
    enemy.alive = false;
    const state = makeState([enemy], { targetedEnemyId: 1, shootCooldown: 0 });

    combatSystem(state, 0);

    expect(state.enemies[0].word).toBe('SOL');
  });

  it('should apply 1.1x score multiplier per letter with SHARP_SIGHT', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], {
      targetedEnemyId: 1,
      shootCooldown: 0,
      score: 0,
      activePowerUps: ['SHARP_SIGHT'],
    });

    combatSystem(state, 0);

    // pointsPerLetter=10 * 1.1 = 11
    const expected = Math.floor(GameConfig.scoring.pointsPerLetter * GameConfig.powerUps.sharpSight.scoreMultiplier);
    expect(state.score).toBe(expected);
  });

  it('should use normal points per letter without SHARP_SIGHT', () => {
    const enemy = createEnemy('SOL', 1);
    const state = makeState([enemy], {
      targetedEnemyId: 1,
      shootCooldown: 0,
      score: 0,
      activePowerUps: [],
    });

    combatSystem(state, 0);

    expect(state.score).toBe(GameConfig.scoring.pointsPerLetter);
  });

  describe('Explosive Impact power-up', () => {
    it('should push nearby enemies away when destroying an enemy with EXPLOSIVE_IMPACT', () => {
      const target = createEnemy('A', 1);
      target.x = 400;
      target.y = 200;
      const nearby = createEnemy('SOL', 2);
      nearby.x = 450; // 50px away from target
      nearby.y = 200;
      const state = makeState(
        [target, nearby],
        {
          targetedEnemyId: 1,
          shootCooldown: 0,
          activePowerUps: ['EXPLOSIVE_IMPACT'],
        },
      );

      combatSystem(state, 0);

      // Target is marked for destruction
      expect(state.enemies[0].pendingDestruction).toBe(true);

      // Nearby enemy should be pushed away from target
      expect(state.enemies[1].x).toBeGreaterThan(450); // pushed right
    });

    it('should NOT push enemies outside pushRadius', () => {
      const target = createEnemy('A', 1);
      target.x = 400;
      target.y = 200;
      const far = createEnemy('SOL', 2);
      far.x = 600; // 200px away, outside 150 radius
      far.y = 200;

      const state = makeState(
        [target, far],
        {
          targetedEnemyId: 1,
          shootCooldown: 0,
          activePowerUps: ['EXPLOSIVE_IMPACT'],
        },
      );

      combatSystem(state, 0);

      // Far enemy should NOT be pushed
      expect(state.enemies[1].x).toBe(600);
    });

    it('should NOT trigger explosive push without the power-up', () => {
      const target = createEnemy('A', 1);
      target.x = 400;
      target.y = 200;
      const nearby = createEnemy('SOL', 2);
      nearby.x = 450;
      nearby.y = 200;

      const state = makeState(
        [target, nearby],
        {
          targetedEnemyId: 1,
          shootCooldown: 0,
          activePowerUps: [], // no power-ups
        },
      );

      combatSystem(state, 0);

      // Nearby enemy should NOT be pushed
      expect(state.enemies[1].x).toBe(450);
    });

    it('should push enemies in the correct direction (away from destroyed enemy)', () => {
      const target = createEnemy('A', 1);
      target.x = 400;
      target.y = 200;
      const leftEnemy = createEnemy('LUZ', 2);
      leftEnemy.x = 300; // 100px left of target
      leftEnemy.y = 200;

      const state = makeState(
        [target, leftEnemy],
        {
          targetedEnemyId: 1,
          shootCooldown: 0,
          activePowerUps: ['EXPLOSIVE_IMPACT'],
        },
      );

      combatSystem(state, 0);

      // Should be pushed left (further away)
      expect(state.enemies[1].x).toBeLessThan(300);
    });
  });
});
