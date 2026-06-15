import { describe, it, expect } from 'vitest';
import {
  getEnemiesInRadius,
  calculateBurstAngles,
  findNthClosestEnemy,
  getShieldCircleRadii,
  calculateCooldownProgress,
  calculateCardPositions,
  mapDevKeyToPowerUp,
} from '../../src/systems/PowerUpHelpers';
import { createEnemy } from '../../src/entities/Enemy';
import { createInitialGameState } from '../../src/entities/types';
import { createPlayer } from '../../src/entities/Player';

// 3.2 — Enemies in radius for explosive push
describe('getEnemiesInRadius', () => {
  it('returns enemies within the radius from center point', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 80;
    e1.y = 80;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 200;
    e2.y = 200;
    const e3 = createEnemy('FUEGO', 3);
    e3.x = 400;
    e3.y = 400;
    state.enemies = [e1, e2, e3];

    // Center at (100, 100), radius 120
    // e1 at (80,80): dist ≈ 28 → inside
    // e2 at (200,200): dist ≈ 141 → outside  
    // e3 at (400,400): dist ≈ 424 → outside
    const result = getEnemiesInRadius(state, 100, 100, 120);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('excludes dead enemies from radius check', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 80;
    e1.y = 80;
    e1.alive = false;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 90;
    e2.y = 90;
    state.enemies = [e1, e2];

    const result = getEnemiesInRadius(state, 100, 100, 120);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('returns empty array when no enemies in radius', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 400;
    e1.y = 400;
    state.enemies = [e1];

    const result = getEnemiesInRadius(state, 100, 100, 50);
    expect(result).toHaveLength(0);
  });

  it('uses enemy center (x+width/2, y+height/2) for distance calculation', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    // Enemy is 60×60 (config default), center at (x+30, y+30)
    e1.x = 70;
    e1.y = 70;
    state.enemies = [e1];

    // Center at (100,100), enemy center at (100,100)
    // dist = 0 → inside any positive radius
    const result = getEnemiesInRadius(state, 100, 100, 10);
    expect(result).toHaveLength(1);
  });
});

// 3.3 — Burst fire spread angles
describe('calculateBurstAngles', () => {
  it('returns two angles ±spread from base angle', () => {
    const spreadDeg = 2.5;
    // baseAngle = 0 (straight up in screen coords)
    const [a1, a2] = calculateBurstAngles(0, spreadDeg);
    const halfRad = (2.5 * Math.PI) / 180;
    expect(a1).toBeCloseTo(-halfRad, 5);
    expect(a2).toBeCloseTo(halfRad, 5);
  });

  it('returns symmetric angles around any base angle', () => {
    const baseAngle = Math.PI / 4; // 45°
    const [a1, a2] = calculateBurstAngles(baseAngle, 5);
    const halfRad = (5 * Math.PI) / 180;
    expect(a1).toBeCloseTo(baseAngle - halfRad, 5);
    expect(a2).toBeCloseTo(baseAngle + halfRad, 5);
  });

  it('returns same angle when spread is 0', () => {
    const [a1, a2] = calculateBurstAngles(Math.PI / 2, 0);
    expect(a1).toBe(a2);
    expect(a1).toBe(Math.PI / 2);
  });
});

// 3.6 — Ally drone: find Nth closest enemy
describe('findNthClosestEnemy', () => {
  it('returns the 2nd closest enemy (skip closest)', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 390;
    e1.y = 400; // closest (~100px from player at 400,500)
    const e2 = createEnemy('LUNA', 2);
    e2.x = 300;
    e2.y = 500; // second closest (~100px)
    const e3 = createEnemy('FUEGO', 3);
    e3.x = 100;
    e3.y = 500; // furthest (~300px)
    state.enemies = [e1, e2, e3];

    const result = findNthClosestEnemy(state, 400, 500, 2);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2);
  });

  it('returns null when there are fewer than N enemies', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 100;
    e1.y = 100;
    state.enemies = [e1];

    const result = findNthClosestEnemy(state, 400, 500, 2);
    expect(result).toBeNull();
  });

  it('skips dead enemies in counting', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 390;
    e1.y = 400;
    e1.alive = false;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 300;
    e2.y = 500;
    const e3 = createEnemy('FUEGO', 3);
    e3.x = 100;
    e3.y = 500;
    state.enemies = [e1, e2, e3];

    // dead e1 doesn't count, so e2 is closest alive, e3 is 2nd closest
    const result = findNthClosestEnemy(state, 400, 500, 2);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(3);
  });

  it('returns closest enemy when N=1', () => {
    const state = createInitialGameState();
    state.player = createPlayer();
    const e1 = createEnemy('SOL', 1);
    e1.x = 300;
    e1.y = 500;
    const e2 = createEnemy('LUNA', 2);
    e2.x = 390;
    e2.y = 400;
    state.enemies = [e1, e2];

    const result = findNthClosestEnemy(state, 400, 500, 1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(2); // at 390,400: ~100px vs 300,500: ~100px ... let me check distances
  });
});

// 3.5 — Shield circle radii
describe('getShieldCircleRadii', () => {
  it('returns empty array when charges is 0', () => {
    const radii = getShieldCircleRadii(0, 28, 6);
    expect(radii).toEqual([]);
  });

  it('returns one radius for 1 charge', () => {
    const radii = getShieldCircleRadii(1, 28, 6);
    expect(radii).toEqual([28]);
  });

  it('increments radius by step for each additional charge', () => {
    const radii = getShieldCircleRadii(3, 28, 6);
    expect(radii).toEqual([28, 34, 40]);
  });

  it('handles large charge counts', () => {
    const radii = getShieldCircleRadii(5, 28, 6);
    expect(radii).toEqual([28, 34, 40, 46, 52]);
  });
});

// 3.9/3.10 — Cooldown progress calculation
describe('calculateCooldownProgress', () => {
  it('returns ratio of remaining to total', () => {
    const progress = calculateCooldownProgress(15000, 30000);
    expect(progress).toBe(0.5);
  });

  it('returns 0 when remaining is 0', () => {
    const progress = calculateCooldownProgress(0, 30000);
    expect(progress).toBe(0);
  });

  it('returns 0 when remaining is undefined', () => {
    const progress = calculateCooldownProgress(undefined, 30000);
    expect(progress).toBe(0);
  });

  it('returns 1 when cooldown just started', () => {
    const progress = calculateCooldownProgress(30000, 30000);
    expect(progress).toBe(1);
  });

  it('handles short cooldown', () => {
    const progress = calculateCooldownProgress(9000, 18000);
    expect(progress).toBe(0.5);
  });
});

// 3.8 — Card position calculation for LevelUpScreen
describe('calculateCardPositions', () => {
  it('positions 3 cards centered in 800px canvas', () => {
    const positions = calculateCardPositions(800, 200, 20);
    // total = 3*200 + 2*20 = 640, left margin = (800-640)/2 = 80
    // cards at: 80+100, 80+200+20+100, 80+440+100
    expect(positions).toEqual([180, 400, 620]);
  });

  it('centers cards regardless of canvas width', () => {
    const positions = calculateCardPositions(640, 200, 20);
    expect(positions).toEqual([100, 320, 540]);
  });

  it('returns empty array for 0 count', () => {
    const positions = calculateCardPositions(800, 200, 20, 0);
    expect(positions).toEqual([]);
  });

  it('positions single card centered', () => {
    const positions = calculateCardPositions(800, 200, 20, 1);
    expect(positions).toEqual([400]);
  });
});

// Dev Mode — key mapping
describe('mapDevKeyToPowerUp', () => {
  it('maps 1 to EXPLOSIVE_IMPACT', () => {
    expect(mapDevKeyToPowerUp('1')).toBe('EXPLOSIVE_IMPACT');
  });

  it('maps 2 to QUICK_COOLING', () => {
    expect(mapDevKeyToPowerUp('2')).toBe('QUICK_COOLING');
  });

  it('maps 3 to SHARP_SIGHT', () => {
    expect(mapDevKeyToPowerUp('3')).toBe('SHARP_SIGHT');
  });

  it('maps 4 to SLOW_AURA', () => {
    expect(mapDevKeyToPowerUp('4')).toBe('SLOW_AURA');
  });

  it('maps 5 to PIERCING_SHOT', () => {
    expect(mapDevKeyToPowerUp('5')).toBe('PIERCING_SHOT');
  });

  it('maps 6 to DUAL_SHOT', () => {
    expect(mapDevKeyToPowerUp('6')).toBe('DUAL_SHOT');
  });

  it('maps 7 to SHIELD', () => {
    expect(mapDevKeyToPowerUp('7')).toBe('SHIELD');
  });

  it('maps 8 to ALLY', () => {
    expect(mapDevKeyToPowerUp('8')).toBe('ALLY');
  });

  it('maps 9 to MAGNETIC_FIELD', () => {
    expect(mapDevKeyToPowerUp('9')).toBe('MAGNETIC_FIELD');
  });

  it('maps 0 to BURST_FIRE', () => {
    expect(mapDevKeyToPowerUp('0')).toBe('BURST_FIRE');
  });

  it('maps - to LIFE_STEAL', () => {
    expect(mapDevKeyToPowerUp('-')).toBe('LIFE_STEAL');
  });

  it('maps = to FREEZE', () => {
    expect(mapDevKeyToPowerUp('=')).toBe('FREEZE');
  });

  it('returns null for unknown keys', () => {
    expect(mapDevKeyToPowerUp('x')).toBeNull();
    expect(mapDevKeyToPowerUp('A')).toBeNull();
    expect(mapDevKeyToPowerUp('')).toBeNull();
  });
});

// 3.1 — Scene orchestration already verified in PowerUpSystem.test.ts
// The GameScene wiring task (3.1) is integration-only (adding a call to the
// already-tested powerUpSystem). No additional unit test needed.
